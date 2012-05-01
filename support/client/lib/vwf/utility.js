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
        /// @param {Object} object The object to transform. Object and Array contents are
        ///   recursively transformed using the same transformation function.
        /// @param {Function} Transformation function:
        ///   function( object, index, depth ) { return object }
        /// @param {Number} [name] Object index in container (recursive calls only).
        /// @param {Number} [depth] Recursion depth (recursive calls only).
        /// 
        /// @returns {Object} The transformed object.

        transform: function( object, transformation /* ( object, name, depth ) */, name, depth ) {

            depth = depth || 0;

            var result = object = transformation( object, name, depth );  // TODO: transform scalars always? sometimes? ... transform whole objects and arrays before generic recursion ... separate functions?

            var item;

            if ( typeof object == "object" && object != null ) {

                if ( object instanceof Array ) {

                    for ( var index = 0; index < object.length; index++ ) {

                        if ( ( item = this.transform( object[index], transformation, index, depth + 1 ) ) !== object[index] ) {

                            if ( result === object ) {
                                result = [].concat( object ); // shallow copy into new Array
                            }

                            result[index] = item;
                        }
                    }

                } else {

                    Object.keys( object ).forEach( function( key ) {

                        if ( ( item = this.transform( object[key], transformation, key, depth + 1 ) ) !== object[key] ) {

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

        // Old, from vwf.js.

        // transformObject: function( object, transformation ) {

        //     var result = object;
        //     var object_, object_i;

        //     if ( typeof object != "object" ) {

        //         result = transformation( object );  // TODO: transform scalars always? sometimes? ... transform whole objects and arrays before generic recursion ... separate functions?

        //     } else if ( ( object_ = transformation( object ) ) !== object ) {

        //         result = object_;

        //     } else if ( ! ( object instanceof Array ) ) {

        //         for ( var i in object ) {

        //             if ( ( object_i = this.transformObject( object[i], transformation ) ) !== object[i] ) {

        //                 if ( result === object ) {
        //                     result = {};
        //                     for ( var ii in object ) { result[ii] = object[ii] }
        //                 }

        //                 result[i] = object_i;
        //             }
        //         }

        //     } else {

        //         for ( var i = 0; i < object.length; i++ ) {

        //             if ( ( object_i = this.transformObject( object[i], transformation ) ) !== object[i] ) {

        //                 if ( result === object ) {
        //                     result = [];
        //                     for ( var ii = 0; ii < object.length; ii++ ) { result[ii] = object[ii] }
        //                 }

        //                 result[i] = object_i;
        //             }

        //         }

        //     }

        //     return result;
        // },

    };

} );
