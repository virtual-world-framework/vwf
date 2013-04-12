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

/// XPath resolution functions.
/// 
/// @module vwf/utility/xpath

define( [ "module" ], function( module ) {

    var exports = {

        // -- resolve --------------------------------------------------------------------------

        /// Resolve an XPath expression, using a callback function to interpret each step.
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
                    contextIDs = rootID ? [ rootID ] : [];
                }

                // Resolve each step.

                steps.forEach( function( step ) {

                    contextIDs = Array.prototype.concat.apply( [], contextIDs.map( function( id ) {

                        var stepIDs = callback.call( thisArg, step, id );

                        step.predicates && step.predicates.forEach( function( predicate ) {

                            stepIDs = stepIDs.filter( function( stepID ) {
                                return this.resolve( predicate, rootID, stepID, function( step, id ) {
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

        // -- quoteName --------------------------------------------------------------------------

        /// Apply quotation marks around a name and escape internal quotation marks and escape
        /// characters.
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

        // -- regex ----------------------------------------------------------------------------

        /// Regexes to crack the XPath string.

        regex: ( function() {

            var name = "[A-Za-z_][A-Za-z_0-9.-]*",              // XPath QName: http://www.w3.org/TR/xpath20/#prod-xpath-QName
                singleQuotedName = "'(?:[^'\\\\]|\\'|\\\\)+'",  // Single-quoted QName (VWF extension)
                doubleQuotedName = '"(?:[^"\\\\]|\\"|\\\\)+"',  // Double-quoted QName (VWF extension)
                wildcard = "\\*";                               // XPath Wildcard: http://www.w3.org/TR/xpath20/#prod-xpath-Wildcard

            /// @field

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

            /// @field

            var predicate =                                     // XPath Predicate: http://www.w3.org/TR/xpath20/#prod-xpath-Predicate

                "\\[" +
                    "(" +
                        step + // "[^\\]]*" +
                    ")" +
                "\\]";

            /// @field

            var separator = "/";

            var regexes = {

                /// @field

                step: new RegExp( "^" + step ),

                /// @field

                predicate: new RegExp( "^" + predicate ),

                /// @field

                separator: new RegExp( "^" + separator ),

            };

            return regexes;

        } )(),

    };

    return exports;

} );
