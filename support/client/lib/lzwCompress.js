var lzwCompress = function (Array, JSON, undefined) {
    var _self = {},
        _lzwLoggingEnabled = false,
        _lzwLog = function (message) {
            try {
                console.log('lzwCompress: '
                    + (new Date()).toISOString() + ' : ' +
                    (typeof(message) === 'object'
                        ? JSON.stringify(message)
                        : message));
            } catch (e) {
            }
        };

    // KeyOptimize
    // http://stackoverflow.com/questions/4433402/replace-keys-json-in-javascript
    (function (self, Array, JSON) {
        "use strict";

        // http://stackoverflow.com/questions/1988349/array-push-if-does-not-exist
        Array.prototype.inArray = function (comparer) {
            for (var i = 0; i < this.length; i++) {
                if (comparer(this[i])) return true;
            }
            return false;
        };
        Array.prototype.pushNew = function (element, comparer) {
            if (!this.inArray(comparer)) {
                this.push(element);
            }
        };

        var _keys = [],
            _extractKeys = function (obj) {
                if (typeof obj === 'object') {
                    for (var key in obj) {
                        if (!Array.isArray(obj)) {
                            _keys.pushNew(key, function (e) {
                                return e === key;
                            });
                        }
                        _extractKeys(obj[key]);
                    }
                }
            },
            _encode = function (obj) {
                if (typeof obj !== 'object') return obj;
                for (var prop in obj) {
                    if (!Array.isArray(obj)) {
                        if (obj.hasOwnProperty(prop)) {
                            obj[_keys.indexOf(prop)] = _encode(obj[prop]);
                            delete obj[prop];
                        }
                    } else {
                        obj[prop] = _encode(obj[prop]);
                    }
                }
                return obj;
            },
            _decode = function (obj) {
                if (typeof obj !== 'object') return obj;
                for (var prop in obj) {
                    if (!Array.isArray(obj)) {
                        if (obj.hasOwnProperty(prop)) {
                            obj[_keys[prop]] = _decode(obj[prop]);
                            delete obj[prop];
                        }
                    } else {
                        obj[prop] = _decode(obj[prop]);
                    }
                }
                return obj;
            },
            compress = function (json) {
                _keys = [];
                var jsonObj = JSON.parse(json);
                _extractKeys(jsonObj);
                _lzwLoggingEnabled && _lzwLog('keys length : ' + _keys.length);
                _lzwLoggingEnabled && _lzwLog('keys        : ' + _keys);
                return JSON.stringify({ __k:_keys, __v:_encode(jsonObj) });
            },
            decompress = function (minifiedJson) {
                var obj = minifiedJson;
                if (typeof(obj) !== 'object') obj = JSON.parse(minifiedJson);
                if (typeof(obj) !== 'object') return minifiedJson;
                if (!obj.hasOwnProperty('__k')) return JSON.stringify(obj);
                _keys = obj.__k;
                return _decode(obj.__v);
            };

        self.KeyOptimize = {
            pack:compress,
            unpack:decompress
        };
    }(_self, Array, JSON));

    // LZWCompress
    // http://stackoverflow.com/a/2252533/218882
    // http://rosettacode.org/wiki/LZW_compression#JavaScript
    (function (self, Array) {
        "use strict";
        var compress = function (uncompressed) {
                if (typeof(uncompressed) !== 'string') return uncompressed;
                var i,
                    dictionary = {},
                    c,
                    wc,
                    w = "",
                    result = [],
                    dictSize = 256;
                for (i = 0; i < 256; i += 1) {
                    dictionary[String.fromCharCode(i)] = i;
                }
                for (i = 0; i < uncompressed.length; i += 1) {
                    c = uncompressed.charAt(i);
                    wc = w + c;
                    if (dictionary[wc]) {
                        w = wc;
                    } else {
                        if (dictionary[w] === undefined) return uncompressed;
                        result.push(dictionary[w]);
                        dictionary[wc] = dictSize++;
                        w = String(c);
                    }
                }
                if (w !== "") {
                    result.push(dictionary[w]);
                }
                return result;
            },
            decompress = function (compressed) {
                if (!Array.isArray(compressed)) return compressed;
                var i,
                    dictionary = [],
                    w,
                    result,
                    k,
                    entry = "",
                    dictSize = 256;
                for (i = 0; i < 256; i += 1) {
                    dictionary[i] = String.fromCharCode(i);
                }
                w = String.fromCharCode(compressed[0]);
                result = w;
                for (i = 1; i < compressed.length; i += 1) {
                    k = compressed[i];
                    if (dictionary[k]) {
                        entry = dictionary[k];
                    } else {
                        if (k === dictSize) {
                            entry = w + w.charAt(0);
                        } else {
                            return null;
                        }
                    }
                    result += entry;
                    dictionary[dictSize++] = w + entry.charAt(0);
                    w = entry;
                }
                return result;
            };

        self.LZWCompress = {
            pack:compress,
            unpack:decompress
        };
    }(_self, Array));

    var _compress = function (obj) {
            _lzwLoggingEnabled && _lzwLog('original (uncompressed) : ' + obj);
            if (!obj || obj === true || obj instanceof Date) return obj;
            var result = obj;
            if (typeof obj === 'object') {
                result = _self.KeyOptimize.pack(JSON.stringify(obj));
                _lzwLoggingEnabled && _lzwLog('key optimized: ' + result);
            }
            var packedObj = _self.LZWCompress.pack(result);
            _lzwLoggingEnabled && _lzwLog('packed   (compressed)   : ' + packedObj);
            return packedObj;
        },
        _decompress = function (compressedObj) {
            _lzwLoggingEnabled && _lzwLog('original (compressed)   : ' + compressedObj);
            if (!compressedObj || compressedObj === true || compressedObj instanceof Date) return compressedObj;
            var result = _self.LZWCompress.unpack(compressedObj);
            try {
                result = JSON.parse(result);
            } catch (e) {
                _lzwLoggingEnabled && _lzwLog('unpacked (uncompressed) : ' + result);
                return result;
            }
            result = _self.KeyOptimize.unpack(result);
            _lzwLoggingEnabled && _lzwLog('unpacked (uncompressed) : ' + result);
            return result;
        },
        _enableLogging = function (enable) {
            _lzwLoggingEnabled = enable;
        };

    return {
        pack:_compress,
        unpack:_decompress,
        enableLogging:_enableLogging
    };

}(Array, JSON);

if(define)
	define(lzwCompress);
if(exports)
    exports.lzwCompress = lzwCompress;