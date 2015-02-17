"use strict";

// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

/// Kernel utility functions.
/// 
/// @module vwf/utility

define( [ "module",
    "vwf/utility/xpath",
    "vwf/utility/color",
    "vwf/utility/coordinates"
], function( module,
    xpath,
    color,
    coordinates
) {

    var exports = {

        // -- transform ----------------------------------------------------------------------------

        /// Recursively transform an arbitrary object using the provided transformation function.
        /// Containers are duplicated where necessary so that the original object and any contained
        /// objects are not modified. Unchanged objects will be referenced directly in the result.
        /// 
        /// @param {Object} object
        ///   The object to transform. `Object` and `Array` contents are recursively transformed
        ///   using the same transformation function.
        /// @param {Function} transformation
        ///   The transformation function: `function( object, names, depth, finished ) { return object }`
        ///   Call `finished()` from the transformation function to stop recursion for the current
        ///   object.
        /// @param {(Number|String)[]} [names]
        ///   Array of the names or indexes that refer to `object` in its container and in its
        ///   containers' containers, parent first (recursive calls only).
        /// @param {Number} [depth]
        ///   Recursion depth (recursive calls only).
        /// 
        /// @returns {Object}
        ///   The transformed object.

        transform: function( object, transformation /* ( object, names, depth, finished ) */, names, depth ) {

            names = names || [];
            depth = depth || 0;

            var finished = false, item;

            var result = object = transformation( object, names, depth, function() { finished = true } );

            if ( typeof object === "object" && object !== null && ! finished ) {

                if ( object instanceof Array ) {

                    // Recursively transform the elements if the object is an Array.

                    for ( var index = 0; index < object.length; index++ ) {

                        if ( ( item = this.transform( object[index], transformation,
                                [ index ].concat( names ), depth + 1 ) ) !== object[index] ) {

                            // If the item changed, and it's the first change in the array, then
                            // duplicate the array.

                            if ( result === object ) {
                                result = [].concat( object );  // shallow copy into a new Array
                            }

                            // Assign the transformed item.

                            result[index] = item;
                        }
                    }

                } else {

                    // Recursively transform the properties if the object is an Object.

                    Object.keys( object ).forEach( function( key ) {

                        if ( ( item = this.transform( object[key], transformation,
                                [ key ].concat( names ), depth + 1 ) ) !== object[key] ) {

                            // If the item changed, and it's the first change in the object, then
                            // duplicate the object.

                            if ( result === object ) {

                                result = {};

                                Object.keys( object ).forEach( function( k ) {
                                    result[ k ] = object[ k ];  // shallow copy into a new Object
                                } );

                                // Also copy the non-enumerable `length` property for an `arguments`
                                // object.

                                var lengthDescriptor = Object.getOwnPropertyDescriptor( object, "length" );

                                if (  lengthDescriptor && ! lengthDescriptor.enumerable ) {
                                    Object.defineProperty( result, "length", lengthDescriptor );
                                }

                            }

                            // Assign the transformed item.

                            result[key] = item;
                        }

                    }, this );

                }

            }

            return result;
        },

        // -- transforms ---------------------------------------------------------------------------

        /// Transformation functions for vwf.utility.transform. Invoke these as:
        /// 
        ///   utility.transform( object, utility.transforms.*transform* )
        ///
        /// to apply the transform utility.transforms.*transform* to object.

        transforms: {

            // -- transit --------------------------------------------------------------------------

            /// A vwf.utility.transform transformation function to convert an object for proper JSON
            /// serialization. Array-like objects are converted to actual Arrays. All other objects
            /// are unchanged. Invoke as: utility.transform( object, utility.transforms.transit ).
            /// 
            /// @param {Object} object
            ///   The object being transformed or one of its descendants.
            /// 
            /// @returns {Object}
            ///   An Array-like converted to an Array, or *object*.

            transit: function( object ) {

                // Determine if an object is Array-like (but not an Array) to identify objects that
                // need to be converted to Arrays for normalization.

                function isArraylike( candidate ) {

                    var arraylike = false;

                    // Filter with typeof and instanceof since they're much faster than toString().
                    // Then check for typed arrays (Int8Array, Uint8Array, ...) or the Arguments
                    // object using the type string.

                    if ( typeof candidate == "object" && candidate != null && ! ( candidate instanceof Array ) ) {
                        var typeString = Object.prototype.toString.call( candidate ) // eg, "[object *Type*]"
                        arraylike = ( typeString.slice( -6 ) == "Array]" || typeString == "[object Arguments]" );
                    }

                    return arraylike;
                };

                // Convert typed arrays to regular arrays.

                return isArraylike( object ) ?
                    Array.prototype.slice.call( object ) : object;

            },

            // -- hash -----------------------------------------------------------------------------

            /// A vwf.utility.transform transformation function to normalize an object so that it
            /// can be serialized and hashed with consistent results. Numeric precision is reduced
            /// to match the precision retained by the reflector. Non-Array objects are reordered so
            /// that their keys are in alphabetic order. Other objects are unchanged. Invoke as:
            /// utility.transform( object, utility.transforms.hash ).
            /// 
            /// @param {Object} object
            ///   The object being transformed or one of its descendants.
            /// 
            /// @returns {Object}
            ///   A reduced-precision number, an Object with alphabetic keys, or *object*.

            hash: function( object ) {

                // Apply the `transit` transform first to convert Array-likes into Arrays.

                object = exports.transforms.transit( object );

                // Reduce numeric precision slightly to match what passes through the reflector.

                if ( typeof object == "number" ) {

                    return Number( object.toPrecision(15) );
                }

                // Order objects alphabetically.

                else if ( typeof object == "object" && object != null && ! ( object instanceof Array ) ) {

                    var ordered = {};

                    Object.keys( object ).sort().forEach( function( key ) {
                        ordered[key] = object[key];
                    } );

                    return ordered;
                }

                return object;
            },

        },

        // -- exceptionMessage ---------------------------------------------------------------------

        /// Format the stack trace for readability.
        /// 
        /// @param {Error} error
        ///   An Error object, generally provided by a catch statement.
        /// 
        /// @returns {String}
        ///   An error message that may be written to the console or a log.

        exceptionMessage: function( error ) {

            // https://github.com/eriwen/javascript-stacktrace sniffs the browser type from the
            // exception this way.

            if ( error.arguments && error.stack ) { // Chrome

                return "\n  " + error.stack;

            } else if ( window && window.opera ) { // Opera

                return error.toString();

            } else if ( error.stack ) { // Firefox

                return "\n  " + error.toString() + "\n" + // somewhat like Chrome's
                    error.stack.replace( /^/mg, "    " );

            } else { // default

                return error.toString();

            }

        },

        // -- resolveURI ---------------------------------------------------------------------------

        /// Convert a relative URI to an absolute URI.
        /// 
        /// @param {String} uri
        ///   The URI to resolve. If uri is relative, it will be interpreted with respect to
        ///   baseURI, or with respect to the document if baseURI is not provided.
        /// @param {String} [baseURI]
        ///   An optional URI that provides the reference for uri. If baseURI is not provided, uri
        ///   will be interpreted with respect to the document. If baseURI is relative, it will be
        ///   interpreted with respect to the document before resolving uri.
        /// 
        /// @returns {String}
        ///   uri as an absolute URI.

        resolveURI: function( uri, baseURI ) {

            var doc = document;

            if ( baseURI ) {

                // Create a temporary document anchored at baseURI.

                var doc = document.implementation.createHTMLDocument( "resolveURI" );

                // Insert a <base/> with the reference URI: <head><base href=*baseURI*/></head>.

                var base = doc.createElement( "base" );
                base.href = this.resolveURI( baseURI ); // resolve wrt the document

                var head = doc.getElementsByTagName( "head" )[0];
                head.appendChild( base );

            }

            // Create an <a/> and resolve the URI.

            var a = doc.createElement( "a" );
            a.href = uri;

            return a.href;
        },

        // -- merge --------------------------------------------------------------------------------

        /// Merge fields from the `source` objects into `target`.

        merge: function( target /* [, source1 [, source2 ... ] ] */ ) {

            for ( var index = 1; index < arguments.length; index++ ) {
                var source = arguments[index];

                Object.keys( source ).forEach( function( key ) {
                    if ( source[key] !== undefined ) {
                        target[key] = source[key];
                    }
                } );
            }

            return target;
        },

        validObject: function( obj ) {
            var objType = ( {} ).toString.call( obj ).match( /\s([a-zA-Z]+)/ )[ 1 ].toLowerCase();
            return ( objType != 'null' && objType != 'undefined' );
        },

        hasFileType: function( value ) {
            return ( this.fileType( value ) !== undefined )
        },

        fileType: function( filename ) {
            var fileFormat = undefined;

            var temp = filename.split( '.' );
            if ( temp.length > 1 ) {
                fileFormat = temp.pop();
                if ( fileFormat.length > 5 ) {
                    fileFormat = undefined;
                }
            }
            return fileFormat;
        },  

        ifPrototypeGetId: function( appID, prototypes, nodeID, childID ) {
            var prototypeID = undefined;
            if ( ( nodeID == 0 && childID != appID ) || prototypes[ nodeID ] !== undefined ) {
                if ( nodeID != 0 || childID != appID ) {
                    prototypeID = nodeID ? nodeID : childID;
                    if ( prototypes[ prototypeID ] !== undefined ) {
                        prototypeID = childID;
                    }
                    return prototypeID;
                } 
            }
            return undefined;
        },

        isString: function( s ) {
            return ( typeof( s ) === 'string' || s instanceof String );
        },

        isFunction: function( obj ) {
            return ( typeof obj === 'function' || obj instanceof Function );
        },


        // -- xpath --------------------------------------------------------------------------------

        /// XPath resolution functions.

        xpath: xpath,

        // -- color --------------------------------------------------------------------------------

        /// HTML/CSS color conversion functions.

        color: color,

        // -- coordinates --------------------------------------------------------------------------

        /// DOM element coordinate conversion functions.

        coordinates: coordinates,

    };

    return exports;

} );
