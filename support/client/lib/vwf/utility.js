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

        /// Transformation functions for vwf.utility#transform. Invoke these as:
        /// 
        ///   utility.transform( object, utility.transforms.*transform* )
        ///
        /// to apply the transform utility.transforms.*transform* to object.
        /// 
        /// @name vwf.utility#transforms
        /// @namespace

        transforms: {

            // -- transit --------------------------------------------------------------------------

            /// vwf.utility#transform transformation function to convert an object for proper JSON
            /// serialization. Array-like objects are converted to actual Arrays. All other objects
            /// are unchanged. Invoke as: utility.transform( object, utility.transforms.transit ).
            /// 
            /// @name vwf.utility.transforms#transit
            /// @function
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

            /// vwf.utility#transform transformation function to normalize an object so that it can
            /// be serialized and hashed with consistent results. Numeric precision is reduced to
            /// match the precision retained by the reflector. Non-Array objects are reordered so
            /// that their keys are in alphabetic order. Other objects are unchanged. Invoke as:
            /// utility.transform( object, utility.transforms.hash ).
            /// 
            /// @name vwf.utility.transforms#hash
            /// @function
            /// 
            /// @param {Object} object
            ///   The object being transformed or one of its descendants.
            /// 
            /// @returns {Object}
            ///   A reduced-precision number, an Object with alphabetic keys, or *object*.

            hash: function( object ) {

                if ( typeof object == "number" ) {

                    // Reduce precision slightly to match what passes through the reflector.

                    return Number( object.toPrecision(15) );

                } else if ( typeof object == "object" && object != null && ! ( object instanceof Array ) ) {
                    
                    // Order objects alphabetically.

                    var ordered = {};

                    Object.keys( object ).sort().forEach( function( key ) {
                        ordered[key] = object[key];
                    } );

                    return ordered;

                } else {

                    return object;

                }

            },

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

        // -- xpath --------------------------------------------------------------------------------

        xpath: {

            // -- resolve --------------------------------------------------------------------------

            /// Resolve an XPath expression, using a callback function to interpret each step.
            /// 
            /// @name vwf.utility.xpath#resolve
            /// @function
            /// 
            /// @param {String|String[]|Object[]} xpath
            /// @param {ID} rootID
            /// @param {ID|ID[]} contextIDs
            /// @param {Function} callback
            /// @param {Object} [thisArg]
            /// 
            /// @returns {ID[]|undefined}

            resolve: function( xpath, rootID, contextIDs, callback /* ( step, id, resolveAttributes ) */, thisArg ) {

                // Accept contextIDs as either a single id or an array of ids.

                if ( ! ( contextIDs instanceof Array ) ) {
                    contextIDs = [ contextIDs ];
                }

                // Parse the expression.

                var steps = this.parse( xpath );

                if ( steps ) {

                    // Reset the context if it's an absolute path.

                    if ( steps.absolute ) {
                        contextIDs = [ rootID ];
                    }

                    // Resolve each step.

                    steps.forEach( function( step ) {

                        contextIDs = Array.prototype.concat.apply( [], contextIDs.map( function( id ) {

                            var stepIDs = callback.call( thisArg, step, id );

                            step.predicates && step.predicates.forEach( function( predicate ) {

                                stepIDs = stepIDs.filter( function( step_id ) {
                                    return this.resolve( predicate, rootID, step_id, function( step, id ) {
                                        return callback.call( this, step, id, true );
                                    }, thisArg ).length;
                                }, this );

                            }, this  );

                            return stepIDs;

                        }, this ) );

                    }, this );

                    return contextIDs;
                }

            },

            // -- parse ----------------------------------------------------------------------------

            /// Parse an XPath expression into a series of steps.
            /// 
            /// @name vwf.utility.xpath#parse
            /// @function
            /// 
            /// @param {String|String[]|Object[]} xpath
            /// 
            /// @returns {Object[]|undefined}

            parse: function( xpath ) {

                var steps = [], step;

                if ( typeof xpath == "string" || xpath instanceof String ) {

                    if ( xpath[0] == "/" ) {
                        steps.absolute = true;
                        xpath = { string: xpath, index: 1 };
                    } else {
                        xpath = { string: xpath, index: 0 };
                    }

                    while ( xpath.index < xpath.string.length &&
                            ( step = /* assignment! */ this.parseStep( xpath ) ) ) {
                        steps.push( step );
                    }

                    if ( xpath.index < xpath.string.length ) {
                        return undefined;
                    }

                } else if ( typeof xpath[0] == "string" || xpath[0] instanceof String ) {

                    var valid = true;

                    steps = xpath.map( function( step ) {

                        step = this.parseStep( step );
                        valid = valid && step;

                        return step;

                    }, this );

                    if ( ! valid ) {
                        return undefined;
                    }

                } else {

                    steps = xpath;
                }

                return steps;
            },

            // -- parseStep ------------------------------------------------------------------------

            /// Parse an XPath step expression.
            /// 
            /// @name vwf.utility.xpath#parseStep
            /// @function
            /// 
            /// @param {String|Object} xpath
            /// 
            /// @returns {Object|undefined}

            parseStep: function( xpath ) {

                if ( typeof xpath == "string" || xpath instanceof String ) {
                    xpath = { string: xpath, index: 0 };
                }

                if ( xpath.index < xpath.string.length && ! this.regex.separator.test( xpath.string.slice( xpath.index ) ) ) {
                    var step_match = this.regex.step.exec( xpath.string.slice( xpath.index ) );
                } else {
                    var step_match = [].concat( "", new Array( 11 ), "" /* abbreviated_step */ ); // special case for "//"
                }

                if ( step_match ) {

                    xpath.index += step_match[0].length;

                    var axis_name = step_match[1],
                        abbreviated_axis_specifier = step_match[2],
                        node_kind = step_match[3],
                        node_name = step_match[4],
                        node_name_quoted = step_match[5],
                        node_name_wildcard = step_match[6],
                        type_name = step_match[7],
                        type_name_quoted = step_match[8],
                        name_test = step_match[9],
                        name_test_quoted = step_match[10],
                        name_test_wildcard = step_match[11],
                        abbreviated_step = step_match[12];

                    if ( name_test || name_test_quoted || name_test_wildcard ) {
                      node_name = name_test;
                      node_name_quoted = name_test_quoted;
                      node_name_wildcard = name_test_wildcard;
                    }

                    if ( node_name_quoted ) {
                      node_name = this.unquoteName( node_name_quoted );
                    }

                    if ( type_name_quoted ) {
                      type_name = this.unquoteName( type_name_quoted );
                    }

                    switch ( abbreviated_step ) {

                        case "": // "" == "descendant-or-self:node()"
                            axis_name = "descendant-or-self";
                            node_kind = "node";
                            break;

                        case ".": // "." == "self::node()"
                            axis_name = "self";
                            node_kind = "node";
                            break;

                        case "..": // ".." == "parent::node()"
                            axis_name = "parent";
                            node_kind = "node";
                            break;

                    }

                    switch ( abbreviated_axis_specifier ) {

                        case "": // "name" == "child::name"
                            axis_name = "child";
                            break;

                        case "@": // "@name" == "attribute::name"
                            axis_name = "attribute";
                            break;

                    }

                    // // * == element()

                    // "preceding::"
                    // "preceding-sibling::"

                    // "ancestor-or-self::"
                    // "ancestor::"
                    // "parent::"
                    // "self::"
                    // "child::"
                    // "descendant::"
                    // "descendant-or-self::"

                    // "following-sibling::"
                    // "following::"

                    // // * == attribute()

                    // "attribute::"

                    // // * == namespace()

                    // "namespace::"

                    if ( node_name_wildcard && ! node_kind ) {

                        switch ( axis_name ) {

                            default:
                                node_kind = "element";
                                break;

                            case "attribute":
                                node_kind = "attribute";
                                break;

                            case "namespace":
                                node_kind = "namespace";
                                break;

                        }

                    }

                    // Parse the predicates.

                    var predicates = [], predicate;

                    while ( predicate = /* assignment! */ this.parsePredicate( xpath ) ) {
                        predicates.push( predicate );
                    }

                    // Absorb the separator.

                    this.parseSeparator( xpath );

                    // Now have: axis_name and name_test | node_kind(node_name,type_name)

                    var step = {
                        axis: axis_name,
                        kind: node_kind,
                        name: node_name,
                        type: type_name,
                    };

                    if ( predicates.length ) {
                        step.predicates = predicates;
                    }

                    return step;
                }

            },

            // -- parsePredicate -------------------------------------------------------------------

            /// Parse an XPath step predicate.
            /// 
            /// @name vwf.utility.xpath#parsePredicate
            /// @function
            /// 
            /// @param {String|Object} xpath
            /// 
            /// @returns {Object[]|undefined}

            parsePredicate: function( xpath ) {

                if ( typeof xpath == "string" || xpath instanceof String ) {
                    xpath = { string: xpath, index: 0 };
                }

                var predicate_match = this.regex.predicate.exec( xpath.string.slice( xpath.index ) );

                if ( predicate_match ) {
                    xpath.index += predicate_match[0].length;
                    return this.parse( predicate_match[1] );
                }

            },

            // -- parseSeparator -------------------------------------------------------------------

            /// Parse an XPath step separator.
            /// 
            /// @name vwf.utility.xpath#parseSeparator
            /// @function
            /// 
            /// @param {String|Object} xpath
            /// 
            /// @returns {Boolean|undefined}

            parseSeparator: function( xpath ) {

                if ( typeof xpath == "string" || xpath instanceof String ) {
                    xpath = { string: xpath, index: 0 };
                }

                var separator_match = this.regex.separator.exec( xpath.string.slice( xpath.index ) );

                if ( separator_match ) {
                    xpath.index += separator_match[0].length;
                    return true;
                }

            },

            // -- regex ----------------------------------------------------------------------------

            /// Regexes to crack the XPath string.
            /// 
            /// @name vwf.utility.xpath#regex
            /// @field

            regex: ( function() {

                var name = "[A-Za-z_][A-Za-z_0-9.-]*",              // XPath QName: http://www.w3.org/TR/xpath20/#prod-xpath-QName
                    singleQuotedName = "'(?:[^'\\\\]|\\'|\\\\)+'",  // Single-quoted QName (VWF extension)
                    doubleQuotedName = '"(?:[^"\\\\]|\\"|\\\\)+"',  // Double-quoted QName (VWF extension)
                    wildcard = "\\*";                               // XPath Wildcard: http://www.w3.org/TR/xpath20/#prod-xpath-Wildcard

                var step =                                          // XPath StepExpr: http://www.w3.org/TR/xpath20/#prod-xpath-StepExpr

                    "(?:" +

                      "(?:" +

                        "(?:" +
                          "(?:(" + name + ")::)" +                  // "axis", as in "axis::"" (axis_name)
                        "|" +
                          "(@|)" +                                  // "@", "" (abbreviated_axis_specifier)
                        ")" +

                        "(?:" +

                          "(?:" +
                            "(" + name + ")" +                      // "kind" (node_kind)
                            "\\(" +                                 // "("
                              "(?:" +
                                "(?:" +
                                  "(" + name + ")" +                // "node" (node_name)
                                "|" +
                                  "(" +
                                    "(?:" + singleQuotedName + ")" + // "'node'" (node_name_quoted, quoted and with internal escapes)
                                  "|" +
                                    "(?:" + doubleQuotedName + ")" + // "\"node\"" (node_name_quoted, quoted and with internal escapes)
                                  ")" +
                                "|" +
                                  "(" + wildcard + ")" +            // "*" (node_name_wildcard)
                                ")" +
                                "(?:" +
                                  "," +                             // ","
                                  "(?:" +
                                    "(" + name + ")" +              // "type" (type_name)
                                  "|" +
                                    "(" +
                                      "(?:" + singleQuotedName + ")" + // "'type'" (type_name_quoted, quoted and with internal escapes)
                                    "|" +
                                      "(?:" + doubleQuotedName + ")" + // '"type"' (type_name_quoted, quoted and with internal escapes)
                                    ")" +
                                  ")" +
                                ")?" +
                              ")?" +
                            "\\)" +                                 // ")"
                          ")" +

                        "|" +

                          "(?:" +
                            "(" + name + ")" +                      // "name" (name_test)
                          "|" +
                            "(" +
                              "(?:" + singleQuotedName + ")" +      // "'name'" (name_test_quoted, quoted and with internal escapes)
                            "|" +
                              "(?:" + doubleQuotedName + ")" +      // '"name"' (name_test_quoted, quoted and with internal escapes)
                            ")" +
                          "|" +
                            "(" + wildcard + ")" +                  // "*" (name_test_wildcard)
                          ")" +

                        ")" +

                      ")" +

                    "|" +

                      "(\\.\\.|\\.)" +                             // "..", "." (abbreviated_step)

                    ")";

                var predicate =                                     // XPath Predicate: http://www.w3.org/TR/xpath20/#prod-xpath-Predicate

                    "\\[" +
                        "(" +
                            step + // "[^\\]]*" +
                        ")" +
                    "\\]";

                var separator = "/";

                var regexes = {
                    step: new RegExp( "^" + step ),
                    predicate: new RegExp( "^" + predicate ),
                    separator: new RegExp( "^" + separator ),
                };

                return regexes;

            } )(),

            // -- quoteName --------------------------------------------------------------------------

            /// Apply quotation marks around a name and escape internal quotation marks and escape
            /// characters.
            /// 
            /// @name vwf.utility.xpath#quoteName
            /// @function
            /// 
            /// @param {String} unquoted_name
            /// 
            /// @returns {String}

            quoteName: function( unquoted_name ) {
                return '"' + unquoted_name.replace( /(["\\])/g, "\\$1" ) + '"';
            },

            // -- unquoteName ------------------------------------------------------------------------

            /// Remove the enclosing quotation marks and unescape internal quotation marks and escape
            /// characters of a quoted name.
            /// 
            /// @name vwf.utility.xpath#unquoteName
            /// @function
            /// 
            /// @param {String} quoted_name
            /// 
            /// @returns {String}

            unquoteName: function( quoted_name ) {
                if ( quoted_name[0] == "'" ) {
                  return quoted_name.slice( 1, -1 ).replace( /\\(['\\])/g, "$1" );
                } else if ( quoted_name[0] == '"' ) {
                  return quoted_name.slice( 1, -1 ).replace( /\\(["\\])/g, "$1" );
                }
            },

        },

    };

} );
