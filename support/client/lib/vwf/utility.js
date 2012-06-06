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
/// @name vwf.utility
/// @namespace

define( [ "module" ], function( module ) {

    return {

        // -- transform ----------------------------------------------------------------------------

        /// Recursively transform an arbitrary object using the provided transformation function.
        /// Containers are duplicated where necessary so that the original object and any contained
        /// objects are not modified. Unchanged objects will be referenced directly in the result.
        /// 
        /// @name vwf.utility#transform
        /// @function
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

                        if ( ( item = this.transform( object[index], transformation, [ index ].concat( names ), depth + 1 ) ) !== object[index] ) {

                            if ( result === object ) {
                                result = [].concat( object ); // shallow copy into new Array
                            }

                            result[index] = item;
                        }
                    }

                } else {

                    Object.keys( object ).forEach( function( key ) {

                        if ( ( item = this.transform( object[key], transformation, [ key ].concat( names ), depth + 1 ) ) !== object[key] ) {

                            if ( result === object ) {
                                result = {}; Object.keys( object ).forEach( function( k ) { result[k] = object[k] } ); // shallow copy into new Object
                            }

                            result[key] = item;
                        }

                    }, this );

                }

            }

            return result;
        },

        // -- exceptionMessage ---------------------------------------------------------------------

        /// Format the stack trace for readability.
        /// 
        /// @name vwf.utility#exceptionMessage
        /// @function
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
        /// @name vwf.utility#resolveURI
        /// @function
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

    };

} );
