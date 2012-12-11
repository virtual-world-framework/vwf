/*
 * Copyright (c) 2010 - The OWASP Foundation
 *
 * The jquery-encoder is published by OWASP under the MIT license. You should read and accept the
 * LICENSE before you use, modify, and/or redistribute this software.
 */
(function($) {
    var default_immune = {
        'js'        : [',','.','_',' ']
    };

    var attr_whitelist_classes = {
        'default': [',','.','-','_',' ']
    };

    var attr_whitelist = {
        'width': ['%'],
        'height': ['%']
    };

    var css_whitelist_classes = {
        'default': ['-',' ','%'],
        'color': ['#',' ','(',')'],
        'image': ['(',')',':','/','?','&','-','.','"','=',' ']
    };

    var css_whitelist = {
        'background': ['(',')',':','%','/','?','&','-',' ','.','"','=','#'],
        'background-image': css_whitelist_classes['image'],
        'background-color': css_whitelist_classes['color'],
        'border-color': css_whitelist_classes['color'],
        'border-image': css_whitelist_classes['image'],
        'color': css_whitelist_classes['color'],
        'icon': css_whitelist_classes['image'],
        'list-style-image': css_whitelist_classes['image'],
        'outline-color': css_whitelist_classes['color']
    };

    // In addition to whitelist filtering for proper encoding - there are some things that should just simply be
    // considered to be unsafe. Setting javascript events or style properties with the encodeHTMLAttribute method and
    // using javascript: urls should be looked at as bad form all the way around and should be avoided. The blacklisting
    // feature of the plugin can be disabled by calling $.encoder.disableBlacklist() prior to the first call encoding
    // takes place (ES5 Compatibility Only)
    var unsafeKeys = {
        // Style and JS Event attributes should be set through the appropriate methods encodeForCSS, encodeForURL, or
        // encodeForJavascript
        'attr_name' : ['on[a-z]{1,}', 'style', 'href', 'src'],
        // Allowing Javascript url's in untrusted data is a bad idea.
        'attr_val'  : ['javascript:'],
        // These css keys and values are considered to be unsafe to pass in untrusted data into.
        'css_key'   : ['behavior', '-moz-behavior', '-ms-behavior'],
        'css_val'   : ['expression']
    };

    var options = {
        blacklist: true
    };

    var hasBeenInitialized = false;

    /**
     * Encoder is the static container for the encodeFor* series and canonicalize methods. They are contained within
     * the encoder object so the plugin can take advantage of object freezing provided in ES5 to protect these methods
     * from being tampered with at runtime.
     */
    $.encoder = {
        author: 'Chris Schmidt (chris.schmidt@owasp.org)',
        version: '${project.version}',

        /**
         * Allows configuration of runtime options prior to using the plugin. Once the plugin has been initialized,
         * options cannot be changed.
         *
         * Possible Options:
         * <pre>
         * Options              Description                         Default
         * ----------------------------------------------------------------------------
         * blacklist            Enable blacklist validation         true
         * </pre>
         *
         * @param opts
         */
        init: function(opts) {
            if ( hasBeenInitialized )
                throw "jQuery Encoder has already been initialized - cannot set options after initialization";

            hasBeenInitialized = true;
            $.extend( options, opts );
        },

        /**
         * Encodes the provided input in a manner safe to place between to HTML tags
         * @param input The untrusted input to be encoded
         */
        encodeForHTML: function(input) {
            hasBeenInitialized = true;
            var div = document.createElement('div');
            $(div).text(input);
            return $(div).html();
        },

        /**
         * Encodes the provided input in a manner safe to place in the value (between to "'s) in an HTML attribute.
         *
         * Unless directed not to, this method will return the full <code>attr="value"</code> as a string. If
         * <code>omitAttributeName</code> is true, the method will only return the <code>value</code>. Both the attribute
         * name and value are canonicalized and verified with whitelist and blacklist prior to returning.
         *
         * Example:
         * <pre>
         * $('#container').html('&lt;div ' + $.encoder.encodeForHTMLAttribute('class', untrustedData) + '/>');
         * </pre>
         *
         * @param attr The attribute to encode for
         * @param input The untrusted input to be encoded
         * @param omitAttributeName Whether to omit the attribute name and the enclosing quotes or not from the encoded
         *                          output.
         * @throws String Reports error when an unsafe attribute name or value is used (unencoded)
         * @throws String Reports error when attribute name contains invalid characters (unencoded)
         */
        encodeForHTMLAttribute: function(attr,input,omitAttributeName) {
            hasBeenInitialized = true;
            // Check for unsafe attributes
            attr = $.encoder.canonicalize(attr).toLowerCase();
            input = $.encoder.canonicalize(input);

            if ( $.inArray(attr, unsafeKeys['attr_name']) >= 0 ) {
                throw "Unsafe attribute name used: " + attr;
            }

            for ( var a=0; a < unsafeKeys['attr_val']; a++ ) {
                if ( input.toLowerCase().match(unsafeKeys['attr_val'][a]) ) {
                    throw "Unsafe attribute value used: " + input;
                }
            }

            immune = attr_whitelist[attr];
            // If no whitelist exists for the attribute, use the minimal default whitelist
            if ( !immune ) immune = attr_whitelist_classes['default'];

            var encoded = '';

            if (!omitAttributeName) {
                for (var p = 0; p < attr.length; p++ ) {
                    var pc = attr.charAt(p);
                    if (!pc.match(/[a-zA-Z\-0-9]/)) {
                        throw "Invalid attribute name specified";
                    }
                    encoded += pc;
                }
                encoded += '="';
            }

            for (var i = 0; i < input.length; i++) {
                var ch = input.charAt(i), cc = input.charCodeAt(i);
                if (!ch.match(/[a-zA-Z0-9]/) && $.inArray(ch, immune) < 0) {
                    var hex = cc.toString(16);
                    encoded += '&#x' + hex + ';';
                } else {
                    encoded += ch;
                }
            }

            if (!omitAttributeName) {
                encoded += '"';
            }

            return encoded;
        },

        /**
         * Encodes the provided input in a manner safe to place in the value of an elements <code>style</code> attribute
         *
         * Unless directed not to, this method will return the full <code>property: value</code> as a string. If
         * <code>omitPropertyName</code> is <code>true</code>, the method will only return the <code>value</code>. Both
         * the property name and value are canonicalized and verified with whitelist and blacklist prior to returning.
         *
         * Example:
         * <pre>
         * $('#container').html('&lt;div style="' + $.encoder.encodeForCSS('background-image', untrustedData) + '"/>');
         * </pre>
         *
         * @param propName The property name that is being set
         * @param input The untrusted input to be encoded
         * @param omitPropertyName Whether to omit the property name from the encoded output
         *
         * @throws String Reports error when an unsafe property name or value is used
         * @throws String Reports error when illegal characters passed in property name
         */
        encodeForCSS: function(propName,input,omitPropertyName) {
            hasBeenInitialized = true;
            // Check for unsafe properties
            propName = $.encoder.canonicalize(propName).toLowerCase();
            input = $.encoder.canonicalize(input);

            if ( $.inArray(propName, unsafeKeys['css_key'] ) >= 0 ) {
                throw "Unsafe property name used: " + propName;
            }

            for ( var a=0; a < unsafeKeys['css_val'].length; a++ ) {
                if ( input.toLowerCase().indexOf(unsafeKeys['css_val'][a]) >= 0 ) {
                    throw "Unsafe property value used: " + input;
                }
            }

            immune = css_whitelist[propName];
            // If no whitelist exists for that property, use the minimal default whitelist
            if ( !immune ) immune = css_whitelist_classes['default'];

            var encoded = '';

            if (!omitPropertyName) {
                for (var p = 0; p < propName.length; p++) {
                    var pc = propName.charAt(p);
                    if (!pc.match(/[a-zA-Z\-]/)) {
                        throw "Invalid Property Name specified";
                    }
                    encoded += pc;
                }

                encoded += ': ';
            }

            for (var i = 0; i < input.length; i++) {
                var ch = input.charAt(i), cc = input.charCodeAt(i);
                if (!ch.match(/[a-zA-Z0-9]/) && $.inArray(ch, immune) < 0) {
                    var hex = cc.toString(16);
                    var pad = '000000'.substr((hex.length));
                    encoded += '\\' + pad + hex;
                } else {
                    encoded += ch;
                }
            }

            return encoded;
        },

        /**
         * Encodes the provided input in a manner safe to place in the value of a POST or GET parameter on a request. This
         * is primarily used to mitigate parameter-splitting attacks and ensure that parameter values are within specification
         *
         * @param input The untrusted data to be encoded
         * @param attr (optional) If passed in, the method will return the full string <code>attr="value"</code> where
         *             the value will be encoded for a URL and both the attribute and value will be canonicalized prior
         *             to encoding the value.
         */
        encodeForURL: function(input,attr) {
            hasBeenInitialized = true;
            var encoded = '';
            if (attr) {
                if (attr.match(/^[A-Za-z\-0-9]{1,}$/)) {
                    encoded += $.encoder.canonicalize(attr).toLowerCase();
                } else {
                    throw "Illegal Attribute Name Specified";
                }
                encoded += '="';
            }
            encoded += encodeURIComponent(input);
            encoded += attr ? '"' : '';
            return encoded;
        },

        /**
         * Encodes the provided input in a manner safe to place in a javascript context, such as the value of an entity
         * event like onmouseover. This encoding is slightly different than just encoding for an html attribute value as
         * it follows the escaping rules of javascript. Use this method when dynamically writing out html to an element
         * as opposed to building an element up using the DOM - as with the .html() method.
         *
         * Example $('#element').html('&lt;a onclick=somefunction(\'"' + $.encodeForJavascript($('#input').val()) + '\');">Blargh&lt;/a>');
         *
         * @param input The untrusted input to be encoded
         */
        encodeForJavascript: function(input) {
            hasBeenInitialized = true;
            if ( !immune ) immune = default_immune['js'];
            var encoded = '';
            for (var i=0; i < input.length; i++ ) {
                var ch = input.charAt(i), cc = input.charCodeAt(i);
                if ($.inArray(ch, immune) >= 0 || hex[cc] == null ) {
                    encoded += ch;
                    continue;
                }

                var temp = cc.toString(16), pad;
                if ( cc < 256 ) {
                    pad = '00'.substr(temp.length);
                    encoded += '\\x' + pad + temp.toUpperCase();
                } else {
                    pad = '0000'.substr(temp.length);
                    encoded += '\\u' + pad + temp.toUpperCase();
                }
            }
            return encoded;
        },

        /**
		 * Encodes the provided input to allow only alphanumeric characters, '-' and '_'. Other charactesr are replaced with '_'. 
		 * This encoding allows for using the resulting value as a CSS or jQuery selector, but it cannot be reversed.
		 *
		 * @param input The untrusted input to be encoded
         */
        encodeForAlphaNumeric: function(input) {
			hasBeenInitialized = true;
            input = $.encoder.canonicalize(input);

            var encoded = '';

            for (var i = 0; i < input.length; i++) {
                var ch = input.charAt(i), cc = input.charCodeAt(i);
                if (!ch.match(/[a-zA-Z0-9-_]/)) {
                    encoded += '_';
                } else {
                    encoded += ch;
                }
            }

            return encoded;
        },

        canonicalize: function(input,strict) {
            hasBeenInitialized = true;
            if (input===null) return null;
            var out = input, cycle_out = input;
            var decodeCount = 0, cycles = 0;

            var codecs =  [ new HTMLEntityCodec(), new PercentCodec(), new CSSCodec() ];

            while (true) {
                cycle_out = out;

                for (var i=0; i < codecs.length; i++ ) {
                    var new_out = codecs[i].decode(out);
                    if (new_out != out) {
                        decodeCount++;
                        out = new_out;
                    }
                }

                if (cycle_out == out) {
                    break;
                }

                cycles++;
            }

            if (strict && decodeCount > 1) {
                throw "Attack Detected - Multiple/Double Encodings used in input";
            }

            return out;
        }
    };

    var hex = [];
    for ( var c = 0; c < 0xFF; c++ ) {
        if ( c >= 0x30 && c <= 0x39 || c >= 0x41 && c <= 0x5a || c >= 0x61 && c <= 0x7a ) {
            hex[c] = null;
        } else {
            hex[c] = c.toString(16);
        }
    }

    var methods = {
        html: function(opts) {
            return $.encoder.encodeForHTML(opts.unsafe);
        },

        css: function(opts) {
            var work = [];
            var out = [];

            if (opts.map) {
                work = opts.map;
            } else {
                work[opts.name] = opts.unsafe;
            }

            for (var k in work) {
                if ( !(typeof work[k] == 'function') && work.hasOwnProperty(k) ) {
                    out[k] = $.encoder.encodeForCSS(k, work[k], true);
                }
            }
            return out;
        },

        attr: function(opts) {
            var work = [];
            var out = [];

            if (opts.map) {
                work = opts.map;
            } else {
                work[opts.name] = opts.unsafe;
            }

            for (var k in work) {
                if ( ! (typeof work[k] == 'function') && work.hasOwnProperty(k) ) {
                    out[k] = $.encoder.encodeForHTMLAttribute(k,work[k],true);
                }
            }

            return out;
        }
    };

    /**
     * Use this instead of setting the content of an element manually with untrusted user supplied data. The context can
     * be one of 'html', 'css', or 'attr'
     */
    $.fn.encode = function() {
        hasBeenInitialized = true;
        var argCount = arguments.length;
        var opts = {
            'context'   : 'html',
            'unsafe'    : null,
            'name'      : null,
            'map'       : null,
            'setter'    : null,
            'strict'    : true
        };

        if (argCount == 1 && typeof arguments[0] == 'object') {
            $.extend(opts, arguments[0]);
        } else {
            opts.context = arguments[0];

            if (arguments.length == 2) {
                if (opts.context == 'html') {
                    opts.unsafe = arguments[1];
                }
                else if (opts.content == 'attr' || opts.content == 'css') {
                    opts.map = arguments[1];
                }
            } else {
                opts.name = arguments[1];
                opts.unsafe = arguments[2];
            }
        }

        if (opts.context == 'html') {
            opts.setter = this.html;
        }
        else if (opts.context == 'css') {
            opts.setter = this.css;
        }
        else if (opts.context == 'attr') {
            opts.setter = this.attr;
        }

        return opts.setter.call(this, methods[opts.context].call(this, opts));
    };

    /**
     * The pushback string is used by Codecs to allow them to push decoded characters back onto a string for further
     * decoding. This is necessary to detect double-encoding.
     */
    var PushbackString = Class.extend({
        _input: null,
        _pushback: null,
        _temp: null,
        _index: 0,
        _mark: 0,

        _hasNext: function() {
            if ( this._input == null ) return false;
            if ( this._input.length == 0 ) return false;
            return this._index < this._input.length;

        },

        init: function(input) {
            this._input = input;
        },

        pushback: function(c) {
            this._pushback = c;
        },

        index: function() {
            return this._index;
        },

        hasNext: function() {
            if ( this._pushback != null ) return true;
            return this._hasNext();
        },

        next: function() {
            if ( this._pushback != null ) {
                var save = this._pushback;
                this._pushback = null;
                return save;
            }

            return ( this._hasNext() ) ? this._input.charAt( this._index++ ) : null;
        },

        nextHex: function() {
            var c = this.next();
            if ( c == null ) return null;
            if ( c.match(/[0-9A-Fa-f]/) ) return c;
            return null;
        },

        peek: function(c) {
            if (c) {
                if ( this._pushback && this._pushback == c ) return true;
                return this._hasNext() ? this._input.charAt(this._index) == c : false;
            }

            if ( this._pushback ) return this._pushback;
            return this._hasNext() ? this._input.charAt(this._index) : null;
        },

        mark: function() {
            this._temp = this._pushback;
            this._mark = this._index;
        },

        reset: function() {
            this._pushback = this._temp;
            this._index = this._mark;
        },

        remainder: function() {
            var out = this._input.substr( this._index );
            if ( this._pushback != null ) {
                out = this._pushback + out;
            }
            return out;
        }
    });

    /**
     * Base class for all codecs to extend. This class defines the default behavior or codecs
     */
    var Codec = Class.extend({
        decode: function(input) {
            var out = '', pbs = new PushbackString(input);
            while(pbs.hasNext()) {
                var c = this.decodeCharacter(pbs);
                if (c != null) {
                    out += c;
                } else {
                    out += pbs.next();
                }
            }
            return out;
        },
        /** @Abstract */
        decodeCharacter: function(pbs) {
            return pbs.next();
        }
    });

    /**
     * Codec for decoding HTML Entities in strings. This codec will decode named entities as well as numeric and hex
     * entities even with padding. For named entities, it interally uses a Trie to locate the 'best-match' and speed
     * up the search.
     */
    var HTMLEntityCodec = Codec.extend({
        decodeCharacter: function(input) {
            input.mark();
            var first = input.next();

            // If there is no input, or this is not an entity - return null
            if ( first == null || first != '&' ) {
                input.reset();
                return null;
            }

            var second = input.next();
            if ( second == null ) {
                input.reset();
                return null;
            }

            var c;
            if ( second == '#' ) {
                c = this._getNumericEntity(input);
                if ( c != null ) return c;
            } else if ( second.match(/[A-Za-z]/) ) {
                input.pushback(second);
                c = this._getNamedEntity(input);
                if ( c != null ) return c;
            }
            input.reset();
            return null;
        },

        _getNamedEntity: function(input) {
            var possible = '', entry, len;
            len = Math.min(input.remainder().length, ENTITY_TO_CHAR_TRIE.getMaxKeyLength());
            for(var i=0;i<len;i++) {
                possible += input.next().toLowerCase();
            }

            entry = ENTITY_TO_CHAR_TRIE.getLongestMatch(possible);
            if (entry == null)
                return null;

            input.reset();
            input.next();

            len = entry.getKey().length;
            for(var j=0;j<len;j++) {
                input.next();
            }

            if(input.peek(';'))
                input.next();

            return entry.getValue();
        },

        _getNumericEntity: function(input) {
            var first = input.peek();
            if ( first == null ) return null;
            if (first == 'x' || first == 'X' ) {
                input.next();
                return this._parseHex(input);
            }
            return this._parseNumber(input);
        },

        _parseHex: function(input) {
            var out = '';
            while (input.hasNext()) {
                var c = input.peek();
                if ( !isNaN( parseInt(c, 16) ) ) {
                    out += c;
                    input.next();
                } else if ( c == ';' ) {
                    input.next();
                    break;
                } else {
                    break;
                }
            }

            var i = parseInt(out,16);
            if ( !isNaN(i) && isValidCodePoint(i) ) return String.fromCharCode(i);
            return null;
        },

        _parseNumber: function(input) {
            var out = '';
            while (input.hasNext()) {
                var ch = input.peek();
                if ( !isNaN( parseInt(ch,10) ) ) {
                    out += ch;
                    input.next();
                } else if ( ch == ';' ) {
                    input.next();
                    break;
                } else {
                    break;
                }
            }

            var i = parseInt(out,10);
            if ( !isNaN(i) && isValidCodePoint(i) ) return String.fromCharCode(i);
            return null;
        }
    });

    /**
     * Codec for decoding url-encoded strings.
     */
    var PercentCodec = Codec.extend({
        decodeCharacter: function(input) {
            input.mark();
            var first = input.next();
            if ( first == null ) {
                input.reset();
                return null;
            }

            if ( first != '%' ) {
                input.reset();
                return null;
            }

            var out = '';
            for (var i=0;i<2;i++) {
                var c = input.nextHex();
                if( c != null ) out += c;
            }

            if (out.length == 2) {
                var p = parseInt(out, 16);
                if ( isValidCodePoint(p) )
                    return String.fromCharCode(p);
            }

            input.reset();
            return null;
        }
    });

    /**
     * Codec for decoding CSS escaped text. This codec will decode both decimal and hex values.
     */
    var CSSCodec = Codec.extend({
        decodeCharacter: function(input) {
            input.mark();
            var first = input.next();
            if (first==null || first != '\\') {
                input.reset();
                return null;
            }

            var second = input.next();
            if (second==null) {
                input.reset();
                return null;
            }

            // fallthrough logic is intentional here
            // noinspection FallthroughInSwitchStatementJS
            switch(second) {
                case '\r':
                    if (input.peek('\n')) {
                        input.next();
                    }
                case '\n':
                case '\f':
                case '\u0000':
                    return this.decodeCharacter(input);
            }

            if ( parseInt(second,16) == 'NaN' ) {
                return second;
            }

            var out = second;
            for(var j=0;j<5;j++) {
                var c = input.next();
                if (c==null || isWhiteSpace(c)) {
                    break;
                }
                if (parseInt(c,16) != 'NaN') {
                    out += c;
                } else {
                    input.pushback(c);
                    break;
                }
            }

            var p = parseInt(out,16);
            if (isValidCodePoint(p))
                return String.fromCharCode(p);

            return '\ufffd';
        }
    });

    /**
     * Trie implementation for Javascript for fast querying and longest matching string lookups.
     */
    var Trie = Class.extend({
        root: null,
        maxKeyLen: 0,
        size: 0,

        init: function() { this.clear(); },

        getLongestMatch: function(key) {
            return ( this.root == null && key == null ) ? null : this.root.getLongestMatch(key,0);
        },

        getMaxKeyLength: function() { return this.maxKeyLen; },

        clear: function() { this.root = null, this.maxKeyLen = 0, this.size = 0; },

        put: function(key,val) {
            var len, old;
            if (this.root==null)
                this.root = new Trie.Node();
            if ((old=this.root.put(key,0,val))!=null)
                return old;

            if ((len=key.length) > this.maxKeyLen )
                this.maxKeyLen=key.length;

            this.size++;
            return null;
        }
    });
    Trie.Entry = Class.extend({
        _key: null,
        _value: null,

        init: function(key,value) { this._key = key, this._value = value; },
        getKey: function() { return this._key; },
        getValue: function() { return this._value; },
        equals: function(other) {
            if ( !(other instanceof Trie.Entry) ) {
                return false;
            }
            return this._key == other._key && this._value == other._value;
        }
    });
    Trie.Node = Class.extend({
        _value: null,
        _nextMap: null,

        setValue: function(value) { this._value = value; },

        getNextNode: function(ch) {
            if ( !this._nextMap ) return null;
            return this._nextMap[ch];
        },

        /**
         * Recursively add a key
         * @param key The key being added
         * @param pos The position in key that is being handled in this recursion
         * @param value The value of what that key points to
         */
        put: function(key,pos,value) {
            var nextNode, ch, old;

            // Terminating Node Clause (break out of recursion)
            if (key.length == pos) {
                old = this._value;
                this.setValue(value);
                return old;
            }

            ch = key.charAt(pos);
            if (this._nextMap==null) {
                this._nextMap = Trie.Node.newNodeMap();
                nextNode = new Trie.Node();
                this._nextMap[ch] = nextNode;
            } else if ((nextNode=this._nextMap[ch]) == null) {
                nextNode = new Trie.Node();
                this._nextMap[ch] = nextNode;
            }
            return nextNode.put(key,pos+1,value);
        },

        /**
         * Recursively lookup a key's value
         * @param key The key being looked up
         * @param pos The position in key that is being handled in this recursion
         */
        get: function(key,pos) {
            var nextNode;
            if (key.length <= pos)
                return this._value;
            if ((nextNode=this.getNextNode(key.charAt(pos))) == null)
                return null;
            return nextNode.get(key,pos+1);
        },

        /**
         * Recusrsively lookup the longest key match
         * @param key The key being looked up
         * @param pos The position in the key for the current recursion
         */
        getLongestMatch: function(key,pos) {
            var nextNode, ret;
            if (key.length <= pos) {
                return Trie.Entry.newInstanceIfNeeded(key,this._value);
            }
            if ((nextNode=this.getNextNode(key.charAt(pos)))==null) {
                // Last in Trie - return this value
                return Trie.Entry.newInstanceIfNeeded(key,pos,this._value);
            }
            if ((ret=nextNode.getLongestMatch(key,pos+1))!=null) {
                return ret;
            }
            return Trie.Entry.newInstanceIfNeeded(key,pos,this._value);
        }
    });
    Trie.Entry.newInstanceIfNeeded = function() {
        var key = arguments[0], value, keyLength;
        if ( typeof arguments[1] == 'string' ) {
            value = arguments[1];
            keyLength = key.length;
        } else {
            keyLength = arguments[1];
            value = arguments[2];
        }

        if (value==null || key==null) {
            return null;
        }
        if (key.length > keyLength) {
            key = key.substr(0,keyLength);
        }
        return new Trie.Entry(key,value);
    };
    Trie.Node.newNodeMap = function() {
        return {};
    };

    /**
     * Match the Java implementation of the isValidCodePoint check
     * @param codepoint codepoint to check
     */
    var isValidCodePoint = function(codepoint) {
        return codepoint >= 0x0000 && codepoint <= 0x10FFFF;
    };

    /**
     * Perform a quick whitespace check on the supplied string.
     * @param input string to check
     */
    var isWhiteSpace = function(input) {
        return input.match(/[\s]/);
    };

    // TODO: There has to be a better way to do this. These are only here for canonicalization
    var MAP_ENTITY_TO_CHAR = [];
    var MAP_CHAR_TO_ENTITY = [];
    var ENTITY_TO_CHAR_TRIE = new Trie();

    (function(){
        MAP_ENTITY_TO_CHAR["&quot"] = "34";
        /* 34 : quotation mark */
        MAP_ENTITY_TO_CHAR["&amp"] = "38";
        /* 38 : ampersand */
        MAP_ENTITY_TO_CHAR["&lt"] = "60";
        /* 60 : less-than sign */
        MAP_ENTITY_TO_CHAR["&gt"] = "62";
        /* 62 : greater-than sign */
        MAP_ENTITY_TO_CHAR["&nbsp"] = "160";
        /* 160 : no-break space */
        MAP_ENTITY_TO_CHAR["&iexcl"] = "161";
        /* 161 : inverted exclamation mark */
        MAP_ENTITY_TO_CHAR["&cent"] = "162";
        /* 162  : cent sign */
        MAP_ENTITY_TO_CHAR["&pound"] = "163";
        /* 163  : pound sign */
        MAP_ENTITY_TO_CHAR["&curren"] = "164";
        /* 164  : currency sign */
        MAP_ENTITY_TO_CHAR["&yen"] = "165";
        /* 165  : yen sign */
        MAP_ENTITY_TO_CHAR["&brvbar"] = "166";
        /* 166  : broken bar */
        MAP_ENTITY_TO_CHAR["&sect"] = "167";
        /* 167  : section sign */
        MAP_ENTITY_TO_CHAR["&uml"] = "168";
        /* 168  : diaeresis */
        MAP_ENTITY_TO_CHAR["&copy"] = "169";
        /* 169  : copyright sign */
        MAP_ENTITY_TO_CHAR["&ordf"] = "170";
        /* 170  : feminine ordinal indicator */
        MAP_ENTITY_TO_CHAR["&laquo"] = "171";
        /* 171 : left-pointing double angle quotation mark */
        MAP_ENTITY_TO_CHAR["&not"] = "172";
        /* 172  : not sign */
        MAP_ENTITY_TO_CHAR["&shy"] = "173";
        /* 173  : soft hyphen */
        MAP_ENTITY_TO_CHAR["&reg"] = "174";
        /* 174  : registered sign */
        MAP_ENTITY_TO_CHAR["&macr"] = "175";
        /* 175  : macron */
        MAP_ENTITY_TO_CHAR["&deg"] = "176";
        /* 176  : degree sign */
        MAP_ENTITY_TO_CHAR["&plusmn"] = "177";
        /* 177 : plus-minus sign */
        MAP_ENTITY_TO_CHAR["&sup2"] = "178";
        /* 178  : superscript two */
        MAP_ENTITY_TO_CHAR["&sup3"] = "179";
        /* 179  : superscript three */
        MAP_ENTITY_TO_CHAR["&acute"] = "180";
        /* 180  : acute accent */
        MAP_ENTITY_TO_CHAR["&micro"] = "181";
        /* 181  : micro sign */
        MAP_ENTITY_TO_CHAR["&para"] = "182";
        /* 182  : pilcrow sign */
        MAP_ENTITY_TO_CHAR["&middot"] = "183";
        /* 183  : middle dot */
        MAP_ENTITY_TO_CHAR["&cedil"] = "184";
        /* 184  : cedilla */
        MAP_ENTITY_TO_CHAR["&sup1"] = "185";
        /* 185  : superscript one */
        MAP_ENTITY_TO_CHAR["&ordm"] = "186";
        /* 186  : masculine ordinal indicator */
        MAP_ENTITY_TO_CHAR["&raquo"] = "187";
        /* 187 : right-pointing double angle quotation mark */
        MAP_ENTITY_TO_CHAR["&frac14"] = "188";
        /* 188  : vulgar fraction one quarter */
        MAP_ENTITY_TO_CHAR["&frac12"] = "189";
        /* 189  : vulgar fraction one half */
        MAP_ENTITY_TO_CHAR["&frac34"] = "190";
        /* 190  : vulgar fraction three quarters */
        MAP_ENTITY_TO_CHAR["&iquest"] = "191";
        /* 191  : inverted question mark */
        MAP_ENTITY_TO_CHAR["&Agrave"] = "192";
        /* 192  : Latin capital letter a with grave */
        MAP_ENTITY_TO_CHAR["&Aacute"] = "193";
        /* 193  : Latin capital letter a with acute */
        MAP_ENTITY_TO_CHAR["&Acirc"] = "194";
        /* 194  : Latin capital letter a with circumflex */
        MAP_ENTITY_TO_CHAR["&Atilde"] = "195";
        /* 195  : Latin capital letter a with tilde */
        MAP_ENTITY_TO_CHAR["&Auml"] = "196";
        /* 196  : Latin capital letter a with diaeresis */
        MAP_ENTITY_TO_CHAR["&Aring"] = "197";
        /* 197  : Latin capital letter a with ring above */
        MAP_ENTITY_TO_CHAR["&AElig"] = "198";
        /* 198  : Latin capital letter ae */
        MAP_ENTITY_TO_CHAR["&Ccedil"] = "199";
        /* 199  : Latin capital letter c with cedilla */
        MAP_ENTITY_TO_CHAR["&Egrave"] = "200";
        /* 200  : Latin capital letter e with grave */
        MAP_ENTITY_TO_CHAR["&Eacute"] = "201";
        /* 201  : Latin capital letter e with acute */
        MAP_ENTITY_TO_CHAR["&Ecirc"] = "202";
        /* 202  : Latin capital letter e with circumflex */
        MAP_ENTITY_TO_CHAR["&Euml"] = "203";
        /* 203  : Latin capital letter e with diaeresis */
        MAP_ENTITY_TO_CHAR["&Igrave"] = "204";
        /* 204  : Latin capital letter i with grave */
        MAP_ENTITY_TO_CHAR["&Iacute"] = "205";
        /* 205  : Latin capital letter i with acute */
        MAP_ENTITY_TO_CHAR["&Icirc"] = "206";
        /* 206  : Latin capital letter i with circumflex */
        MAP_ENTITY_TO_CHAR["&Iuml"] = "207";
        /* 207  : Latin capital letter i with diaeresis */
        MAP_ENTITY_TO_CHAR["&ETH"] = "208";
        /* 208  : Latin capital letter eth */
        MAP_ENTITY_TO_CHAR["&Ntilde"] = "209";
        /* 209  : Latin capital letter n with tilde */
        MAP_ENTITY_TO_CHAR["&Ograve"] = "210";
        /* 210  : Latin capital letter o with grave */
        MAP_ENTITY_TO_CHAR["&Oacute"] = "211";
        /* 211  : Latin capital letter o with acute */
        MAP_ENTITY_TO_CHAR["&Ocirc"] = "212";
        /* 212 : Latin capital letter o with circumflex */
        MAP_ENTITY_TO_CHAR["&Otilde"] = "213";
        /* 213 : Latin capital letter o with tilde */
        MAP_ENTITY_TO_CHAR["&Ouml"] = "214";
        /* 214 : Latin capital letter o with diaeresis */
        MAP_ENTITY_TO_CHAR["&times"] = "215";
        /* 215 : multiplication sign */
        MAP_ENTITY_TO_CHAR["&Oslash"] = "216";
        /* 216 : Latin capital letter o with stroke */
        MAP_ENTITY_TO_CHAR["&Ugrave"] = "217";
        /* 217 : Latin capital letter u with grave */
        MAP_ENTITY_TO_CHAR["&Uacute"] = "218";
        /* 218 : Latin capital letter u with acute */
        MAP_ENTITY_TO_CHAR["&Ucirc"] = "219";
        /* 219 : Latin capital letter u with circumflex */
        MAP_ENTITY_TO_CHAR["&Uuml"] = "220";
        /* 220 : Latin capital letter u with diaeresis */
        MAP_ENTITY_TO_CHAR["&Yacute"] = "221";
        /* 221 : Latin capital letter y with acute */
        MAP_ENTITY_TO_CHAR["&THORN"] = "222";
        /* 222 : Latin capital letter thorn */
        MAP_ENTITY_TO_CHAR["&szlig"] = "223";
        /* 223 : Latin small letter sharp s, German Eszett */
        MAP_ENTITY_TO_CHAR["&agrave"] = "224";
        /* 224 : Latin small letter a with grave */
        MAP_ENTITY_TO_CHAR["&aacute"] = "225";
        /* 225 : Latin small letter a with acute */
        MAP_ENTITY_TO_CHAR["&acirc"] = "226";
        /* 226 : Latin small letter a with circumflex */
        MAP_ENTITY_TO_CHAR["&atilde"] = "227";
        /* 227 : Latin small letter a with tilde */
        MAP_ENTITY_TO_CHAR["&auml"] = "228";
        /* 228 : Latin small letter a with diaeresis */
        MAP_ENTITY_TO_CHAR["&aring"] = "229";
        /* 229 : Latin small letter a with ring above */
        MAP_ENTITY_TO_CHAR["&aelig"] = "230";
        /* 230 : Latin lowercase ligature ae */
        MAP_ENTITY_TO_CHAR["&ccedil"] = "231";
        /* 231 : Latin small letter c with cedilla */
        MAP_ENTITY_TO_CHAR["&egrave"] = "232";
        /* 232 : Latin small letter e with grave */
        MAP_ENTITY_TO_CHAR["&eacute"] = "233";
        /* 233 : Latin small letter e with acute */
        MAP_ENTITY_TO_CHAR["&ecirc"] = "234";
        /* 234 : Latin small letter e with circumflex */
        MAP_ENTITY_TO_CHAR["&euml"] = "235";
        /* 235 : Latin small letter e with diaeresis */
        MAP_ENTITY_TO_CHAR["&igrave"] = "236";
        /* 236 : Latin small letter i with grave */
        MAP_ENTITY_TO_CHAR["&iacute"] = "237";
        /* 237 : Latin small letter i with acute */
        MAP_ENTITY_TO_CHAR["&icirc"] = "238";
        /* 238 : Latin small letter i with circumflex */
        MAP_ENTITY_TO_CHAR["&iuml"] = "239";
        /* 239 : Latin small letter i with diaeresis */
        MAP_ENTITY_TO_CHAR["&eth"] = "240";
        /* 240 : Latin small letter eth */
        MAP_ENTITY_TO_CHAR["&ntilde"] = "241";
        /* 241 : Latin small letter n with tilde */
        MAP_ENTITY_TO_CHAR["&ograve"] = "242";
        /* 242 : Latin small letter o with grave */
        MAP_ENTITY_TO_CHAR["&oacute"] = "243";
        /* 243 : Latin small letter o with acute */
        MAP_ENTITY_TO_CHAR["&ocirc"] = "244";
        /* 244 : Latin small letter o with circumflex */
        MAP_ENTITY_TO_CHAR["&otilde"] = "245";
        /* 245 : Latin small letter o with tilde */
        MAP_ENTITY_TO_CHAR["&ouml"] = "246";
        /* 246 : Latin small letter o with diaeresis */
        MAP_ENTITY_TO_CHAR["&divide"] = "247";
        /* 247 : division sign */
        MAP_ENTITY_TO_CHAR["&oslash"] = "248";
        /* 248 : Latin small letter o with stroke */
        MAP_ENTITY_TO_CHAR["&ugrave"] = "249";
        /* 249 : Latin small letter u with grave */
        MAP_ENTITY_TO_CHAR["&uacute"] = "250";
        /* 250 : Latin small letter u with acute */
        MAP_ENTITY_TO_CHAR["&ucirc"] = "251";
        /* 251 : Latin small letter u with circumflex */
        MAP_ENTITY_TO_CHAR["&uuml"] = "252";
        /* 252 : Latin small letter u with diaeresis */
        MAP_ENTITY_TO_CHAR["&yacute"] = "253";
        /* 253 : Latin small letter y with acute */
        MAP_ENTITY_TO_CHAR["&thorn"] = "254";
        /* 254 : Latin small letter thorn */
        MAP_ENTITY_TO_CHAR["&yuml"] = "255";
        /* 255 : Latin small letter y with diaeresis */
        MAP_ENTITY_TO_CHAR["&OElig"] = "338";
        /* 338 : Latin capital ligature oe */
        MAP_ENTITY_TO_CHAR["&oelig"] = "339";
        /* 339 : Latin small ligature oe */
        MAP_ENTITY_TO_CHAR["&Scaron"] = "352";
        /* 352 : Latin capital letter s with caron */
        MAP_ENTITY_TO_CHAR["&scaron"] = "353";
        /* 353 : Latin small letter s with caron */
        MAP_ENTITY_TO_CHAR["&Yuml"] = "376";
        /* 376 : Latin capital letter y with diaeresis */
        MAP_ENTITY_TO_CHAR["&fnof"] = "402";
        /* 402 : Latin small letter f with hook */
        MAP_ENTITY_TO_CHAR["&circ"] = "710";
        /* 710 : modifier letter circumflex accent */
        MAP_ENTITY_TO_CHAR["&tilde"] = "732";
        /* 732 : small tilde */
        MAP_ENTITY_TO_CHAR["&Alpha"] = "913";
        /* 913 : Greek capital letter alpha */
        MAP_ENTITY_TO_CHAR["&Beta"] = "914";
        /* 914 : Greek capital letter beta */
        MAP_ENTITY_TO_CHAR["&Gamma"] = "915";
        /* 915 : Greek capital letter gamma */
        MAP_ENTITY_TO_CHAR["&Delta"] = "916";
        /* 916 : Greek capital letter delta */
        MAP_ENTITY_TO_CHAR["&Epsilon"] = "917";
        /* 917 : Greek capital letter epsilon */
        MAP_ENTITY_TO_CHAR["&Zeta"] = "918";
        /* 918 : Greek capital letter zeta */
        MAP_ENTITY_TO_CHAR["&Eta"] = "919";
        /* 919 : Greek capital letter eta */
        MAP_ENTITY_TO_CHAR["&Theta"] = "920";
        /* 920 : Greek capital letter theta */
        MAP_ENTITY_TO_CHAR["&Iota"] = "921";
        /* 921 : Greek capital letter iota */
        MAP_ENTITY_TO_CHAR["&Kappa"] = "922";
        /* 922 : Greek capital letter kappa */
        MAP_ENTITY_TO_CHAR["&Lambda"] = "923";
        /* 923 : Greek capital letter lambda */
        MAP_ENTITY_TO_CHAR["&Mu"] = "924";
        /* 924 : Greek capital letter mu */
        MAP_ENTITY_TO_CHAR["&Nu"] = "925";
        /* 925 : Greek capital letter nu */
        MAP_ENTITY_TO_CHAR["&Xi"] = "926";
        /* 926 : Greek capital letter xi */
        MAP_ENTITY_TO_CHAR["&Omicron"] = "927";
        /* 927 : Greek capital letter omicron */
        MAP_ENTITY_TO_CHAR["&Pi"] = "928";
        /* 928 : Greek capital letter pi */
        MAP_ENTITY_TO_CHAR["&Rho"] = "929";
        /* 929 : Greek capital letter rho */
        MAP_ENTITY_TO_CHAR["&Sigma"] = "931";
        /* 931 : Greek capital letter sigma */
        MAP_ENTITY_TO_CHAR["&Tau"] = "932";
        /* 932 : Greek capital letter tau */
        MAP_ENTITY_TO_CHAR["&Upsilon"] = "933";
        /* 933 : Greek capital letter upsilon */
        MAP_ENTITY_TO_CHAR["&Phi"] = "934";
        /* 934 : Greek capital letter phi */
        MAP_ENTITY_TO_CHAR["&Chi"] = "935";
        /* 935 : Greek capital letter chi */
        MAP_ENTITY_TO_CHAR["&Psi"] = "936";
        /* 936 : Greek capital letter psi */
        MAP_ENTITY_TO_CHAR["&Omega"] = "937";
        /* 937 : Greek capital letter omega */
        MAP_ENTITY_TO_CHAR["&alpha"] = "945";
        /* 945 : Greek small letter alpha */
        MAP_ENTITY_TO_CHAR["&beta"] = "946";
        /* 946 : Greek small letter beta */
        MAP_ENTITY_TO_CHAR["&gamma"] = "947";
        /* 947 : Greek small letter gamma */
        MAP_ENTITY_TO_CHAR["&delta"] = "948";
        /* 948 : Greek small letter delta */
        MAP_ENTITY_TO_CHAR["&epsilon"] = "949";
        /* 949 : Greek small letter epsilon */
        MAP_ENTITY_TO_CHAR["&zeta"] = "950";
        /* 950 : Greek small letter zeta */
        MAP_ENTITY_TO_CHAR["&eta"] = "951";
        /* 951 : Greek small letter eta */
        MAP_ENTITY_TO_CHAR["&theta"] = "952";
        /* 952 : Greek small letter theta */
        MAP_ENTITY_TO_CHAR["&iota"] = "953";
        /* 953 : Greek small letter iota */
        MAP_ENTITY_TO_CHAR["&kappa"] = "954";
        /* 954 : Greek small letter kappa */
        MAP_ENTITY_TO_CHAR["&lambda"] = "955";
        /* 955 : Greek small letter lambda */
        MAP_ENTITY_TO_CHAR["&mu"] = "956";
        /* 956 : Greek small letter mu */
        MAP_ENTITY_TO_CHAR["&nu"] = "957";
        /* 957 : Greek small letter nu */
        MAP_ENTITY_TO_CHAR["&xi"] = "958";
        /* 958 : Greek small letter xi */
        MAP_ENTITY_TO_CHAR["&omicron"] = "959";
        /* 959 : Greek small letter omicron */
        MAP_ENTITY_TO_CHAR["&pi"] = "960";
        /* 960 : Greek small letter pi */
        MAP_ENTITY_TO_CHAR["&rho"] = "961";
        /* 961 : Greek small letter rho */
        MAP_ENTITY_TO_CHAR["&sigmaf"] = "962";
        /* 962 : Greek small letter final sigma */
        MAP_ENTITY_TO_CHAR["&sigma"] = "963";
        /* 963 : Greek small letter sigma */
        MAP_ENTITY_TO_CHAR["&tau"] = "964";
        /* 964 : Greek small letter tau */
        MAP_ENTITY_TO_CHAR["&upsilon"] = "965";
        /* 965 : Greek small letter upsilon */
        MAP_ENTITY_TO_CHAR["&phi"] = "966";
        /* 966 : Greek small letter phi */
        MAP_ENTITY_TO_CHAR["&chi"] = "967";
        /* 967 : Greek small letter chi */
        MAP_ENTITY_TO_CHAR["&psi"] = "968";
        /* 968 : Greek small letter psi */
        MAP_ENTITY_TO_CHAR["&omega"] = "969";
        /* 969 : Greek small letter omega */
        MAP_ENTITY_TO_CHAR["&thetasym"] = "977";
        /* 977 : Greek theta symbol */
        MAP_ENTITY_TO_CHAR["&upsih"] = "978";
        /* 978 : Greek upsilon with hook symbol */
        MAP_ENTITY_TO_CHAR["&piv"] = "982";
        /* 982 : Greek pi symbol */
        MAP_ENTITY_TO_CHAR["&ensp"] = "8194";
        /* 8194 : en space */
        MAP_ENTITY_TO_CHAR["&emsp"] = "8195";
        /* 8195 : em space */
        MAP_ENTITY_TO_CHAR["&thinsp"] = "8201";
        /* 8201 : thin space */
        MAP_ENTITY_TO_CHAR["&zwnj"] = "8204";
        /* 8204 : zero width non-joiner */
        MAP_ENTITY_TO_CHAR["&zwj"] = "8205";
        /* 8205 : zero width joiner */
        MAP_ENTITY_TO_CHAR["&lrm"] = "8206";
        /* 8206 : left-to-right mark */
        MAP_ENTITY_TO_CHAR["&rlm"] = "8207";
        /* 8207 : right-to-left mark */
        MAP_ENTITY_TO_CHAR["&ndash"] = "8211";
        /* 8211 : en dash */
        MAP_ENTITY_TO_CHAR["&mdash"] = "8212";
        /* 8212 : em dash */
        MAP_ENTITY_TO_CHAR["&lsquo"] = "8216";
        /* 8216 : left single quotation mark */
        MAP_ENTITY_TO_CHAR["&rsquo"] = "8217";
        /* 8217 : right single quotation mark */
        MAP_ENTITY_TO_CHAR["&sbquo"] = "8218";
        /* 8218 : single low-9 quotation mark */
        MAP_ENTITY_TO_CHAR["&ldquo"] = "8220";
        /* 8220 : left double quotation mark */
        MAP_ENTITY_TO_CHAR["&rdquo"] = "8221";
        /* 8221 : right double quotation mark */
        MAP_ENTITY_TO_CHAR["&bdquo"] = "8222";
        /* 8222 : double low-9 quotation mark */
        MAP_ENTITY_TO_CHAR["&dagger"] = "8224";
        /* 8224 : dagger */
        MAP_ENTITY_TO_CHAR["&Dagger"] = "8225";
        /* 8225 : double dagger */
        MAP_ENTITY_TO_CHAR["&bull"] = "8226";
        /* 8226 : bullet */
        MAP_ENTITY_TO_CHAR["&hellip"] = "8230";
        /* 8230 : horizontal ellipsis */
        MAP_ENTITY_TO_CHAR["&permil"] = "8240";
        /* 8240 : per mille sign */
        MAP_ENTITY_TO_CHAR["&prime"] = "8242";
        /* 8242 : prime */
        MAP_ENTITY_TO_CHAR["&Prime"] = "8243";
        /* 8243 : double prime */
        MAP_ENTITY_TO_CHAR["&lsaquo"] = "8249";
        /* 8249 : single left-pointing angle quotation mark */
        MAP_ENTITY_TO_CHAR["&rsaquo"] = "8250";
        /* 8250 : single right-pointing angle quotation mark */
        MAP_ENTITY_TO_CHAR["&oline"] = "8254";
        /* 8254 : overline */
        MAP_ENTITY_TO_CHAR["&frasl"] = "8260";
        /* 8260 : fraction slash */
        MAP_ENTITY_TO_CHAR["&euro"] = "8364";
        /* 8364 : euro sign */
        MAP_ENTITY_TO_CHAR["&image"] = "8365";
        /* 8465 : black-letter capital i */
        MAP_ENTITY_TO_CHAR["&weierp"] = "8472";
        /* 8472 : script capital p, Weierstrass p */
        MAP_ENTITY_TO_CHAR["&real"] = "8476";
        /* 8476 : black-letter capital r */
        MAP_ENTITY_TO_CHAR["&trade"] = "8482";
        /* 8482 : trademark sign */
        MAP_ENTITY_TO_CHAR["&alefsym"] = "8501";
        /* 8501 : alef symbol */
        MAP_ENTITY_TO_CHAR["&larr"] = "8592";
        /* 8592 : leftwards arrow */
        MAP_ENTITY_TO_CHAR["&uarr"] = "8593";
        /* 8593 : upwards arrow */
        MAP_ENTITY_TO_CHAR["&rarr"] = "8594";
        /* 8594 : rightwards arrow */
        MAP_ENTITY_TO_CHAR["&darr"] = "8595";
        /* 8595 : downwards arrow */
        MAP_ENTITY_TO_CHAR["&harr"] = "8596";
        /* 8596 : left right arrow */
        MAP_ENTITY_TO_CHAR["&crarr"] = "8629";
        /* 8629 : downwards arrow with corner leftwards */
        MAP_ENTITY_TO_CHAR["&lArr"] = "8656";
        /* 8656 : leftwards double arrow */
        MAP_ENTITY_TO_CHAR["&uArr"] = "8657";
        /* 8657 : upwards double arrow */
        MAP_ENTITY_TO_CHAR["&rArr"] = "8658";
        /* 8658 : rightwards double arrow */
        MAP_ENTITY_TO_CHAR["&dArr"] = "8659";
        /* 8659 : downwards double arrow */
        MAP_ENTITY_TO_CHAR["&hArr"] = "8660";
        /* 8660 : left right double arrow */
        MAP_ENTITY_TO_CHAR["&forall"] = "8704";
        /* 8704 : for all */
        MAP_ENTITY_TO_CHAR["&part"] = "8706";
        /* 8706 : partial differential */
        MAP_ENTITY_TO_CHAR["&exist"] = "8707";
        /* 8707 : there exists */
        MAP_ENTITY_TO_CHAR["&empty"] = "8709";
        /* 8709 : empty set */
        MAP_ENTITY_TO_CHAR["&nabla"] = "8711";
        /* 8711 : nabla */
        MAP_ENTITY_TO_CHAR["&isin"] = "8712";
        /* 8712 : element of */
        MAP_ENTITY_TO_CHAR["&notin"] = "8713";
        /* 8713 : not an element of */
        MAP_ENTITY_TO_CHAR["&ni"] = "8715";
        /* 8715 : contains as member */
        MAP_ENTITY_TO_CHAR["&prod"] = "8719";
        /* 8719 : n-ary product */
        MAP_ENTITY_TO_CHAR["&sum"] = "8721";
        /* 8721 : n-ary summation */
        MAP_ENTITY_TO_CHAR["&minus"] = "8722";
        /* 8722 : minus sign */
        MAP_ENTITY_TO_CHAR["&lowast"] = "8727";
        /* 8727 : asterisk operator */
        MAP_ENTITY_TO_CHAR["&radic"] = "8730";
        /* 8730 : square root */
        MAP_ENTITY_TO_CHAR["&prop"] = "8733";
        /* 8733 : proportional to */
        MAP_ENTITY_TO_CHAR["&infin"] = "8734";
        /* 8734 : infinity */
        MAP_ENTITY_TO_CHAR["&ang"] = "8736";
        /* 8736 : angle */
        MAP_ENTITY_TO_CHAR["&and"] = "8743";
        /* 8743 : logical and */
        MAP_ENTITY_TO_CHAR["&or"] = "8744";
        /* 8744 : logical or */
        MAP_ENTITY_TO_CHAR["&cap"] = "8745";
        /* 8745 : intersection */
        MAP_ENTITY_TO_CHAR["&cup"] = "8746";
        /* 8746 : union */
        MAP_ENTITY_TO_CHAR["&int"] = "8747";
        /* 8747 : integral */
        MAP_ENTITY_TO_CHAR["&there4"] = "8756";
        /* 8756 : therefore */
        MAP_ENTITY_TO_CHAR["&sim"] = "8764";
        /* 8764 : tilde operator */
        MAP_ENTITY_TO_CHAR["&cong"] = "8773";
        /* 8773 : congruent to */
        MAP_ENTITY_TO_CHAR["&asymp"] = "8776";
        /* 8776 : almost equal to */
        MAP_ENTITY_TO_CHAR["&ne"] = "8800";
        /* 8800 : not equal to */
        MAP_ENTITY_TO_CHAR["&equiv"] = "8801";
        /* 8801 : identical to, equivalent to */
        MAP_ENTITY_TO_CHAR["&le"] = "8804";
        /* 8804 : less-than or equal to */
        MAP_ENTITY_TO_CHAR["&ge"] = "8805";
        /* 8805 : greater-than or equal to */
        MAP_ENTITY_TO_CHAR["&sub"] = "8834";
        /* 8834 : subset of */
        MAP_ENTITY_TO_CHAR["&sup"] = "8835";
        /* 8835 : superset of */
        MAP_ENTITY_TO_CHAR["&nsub"] = "8836";
        /* 8836 : not a subset of */
        MAP_ENTITY_TO_CHAR["&sube"] = "8838";
        /* 8838 : subset of or equal to */
        MAP_ENTITY_TO_CHAR["&supe"] = "8839";
        /* 8839 : superset of or equal to */
        MAP_ENTITY_TO_CHAR["&oplus"] = "8853";
        /* 8853 : circled plus */
        MAP_ENTITY_TO_CHAR["&otimes"] = "8855";
        /* 8855 : circled times */
        MAP_ENTITY_TO_CHAR["&perp"] = "8869";
        /* 8869 : up tack */
        MAP_ENTITY_TO_CHAR["&sdot"] = "8901";
        /* 8901 : dot operator */
        MAP_ENTITY_TO_CHAR["&lceil"] = "8968";
        /* 8968 : left ceiling */
        MAP_ENTITY_TO_CHAR["&rceil"] = "8969";
        /* 8969 : right ceiling */
        MAP_ENTITY_TO_CHAR["&lfloor"] = "8970";
        /* 8970 : left floor */
        MAP_ENTITY_TO_CHAR["&rfloor"] = "8971";
        /* 8971 : right floor */
        MAP_ENTITY_TO_CHAR["&lang"] = "9001";
        /* 9001 : left-pointing angle bracket */
        MAP_ENTITY_TO_CHAR["&rang"] = "9002";
        /* 9002 : right-pointing angle bracket */
        MAP_ENTITY_TO_CHAR["&loz"] = "9674";
        /* 9674 : lozenge */
        MAP_ENTITY_TO_CHAR["&spades"] = "9824";
        /* 9824 : black spade suit */
        MAP_ENTITY_TO_CHAR["&clubs"] = "9827";
        /* 9827 : black club suit */
        MAP_ENTITY_TO_CHAR["&hearts"] = "9829";
        /* 9829 : black heart suit */
        MAP_ENTITY_TO_CHAR["&diams"] = "9830";
        /* 9830 : black diamond suit */

        for (var entity in MAP_ENTITY_TO_CHAR) {
            if ( !(typeof MAP_ENTITY_TO_CHAR[entity] == 'function') && MAP_ENTITY_TO_CHAR.hasOwnProperty(entity) ) {
                MAP_CHAR_TO_ENTITY[MAP_ENTITY_TO_CHAR[entity]] = entity;
            }
        }

        for (var c in MAP_CHAR_TO_ENTITY) {
            if ( !(typeof MAP_CHAR_TO_ENTITY[c] == 'function') && MAP_CHAR_TO_ENTITY.hasOwnProperty(c) ) {
                var ent = MAP_CHAR_TO_ENTITY[c].toLowerCase().substr(1);
                ENTITY_TO_CHAR_TRIE.put(ent,String.fromCharCode(c));
            }
        }

    })();

    // If ES5 Enabled Browser - Lock the encoder down as much as possible
    if ( Object.freeze ) {
        $.encoder = Object.freeze($.encoder);
        $.fn.encode = Object.freeze($.fn.encode);
    } else if ( Object.seal ) {
        $.encoder = Object.seal($.encoder);
        $.fn.encode = Object.seal($.fn.encode);
    } else if ( Object.preventExtensions ) {
        $.encoder = Object.preventExtensions($.encoder);
        $.fn.encode = Object.preventExtensions($.fn.encode);
    }
})(jQuery);