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
        ///   The object to transform. Object and Array contents are recursively transformed using
        ///   the same transformation function.
        /// @param {Function} transformation
        ///   The transformation function: function( object, names, depth ) { return object }
        /// @param {(Number|String)[]} [names]
        ///   Array of names or indexes to Object in its ancestors, parent first (recursive calls
        ///   only).
        /// @param {Number} [depth]
        ///   Recursion depth (recursive calls only).
        /// 
        /// @returns {Object}
        ///   The transformed object.

        transform: function( object, transformation /* ( object, names, depth ) */, names, depth ) {

            names = names || [];
            depth = depth || 0;

            var result = object = transformation( object, names, depth );  // TODO: transform scalars always? sometimes? ... transform whole objects and arrays before generic recursion ... separate functions?

            var item;

            if ( typeof object == "object" && object != null ) {

                if ( object instanceof Array ) {

                    for ( var index = 0; index < object.length; index++ ) {

                        if ( ( item = this.transform( object[index], transformation, [ index ].concat( names ), depth + 1 ) ) !==
                                object[index] ) {

                            if ( result === object ) {
                                result = [].concat( object ); // shallow copy into a new Array
                            }

                            result[index] = item;
                        }
                    }

                } else {

                    Object.keys( object ).forEach( function( key ) {

                        if ( ( item = this.transform( object[key], transformation, [ key ].concat( names ), depth + 1 ) ) !==
                                object[key] ) {

                            if ( result === object ) {
                                result = {};
                                Object.keys( object ).forEach( function( k ) { result[k] = object[k] } ); // shallow copy into a new Object
                            }

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
