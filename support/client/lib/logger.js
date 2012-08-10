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

define( [ "vwf/configuration" ], function( configuration ) {

    var TRACE = 1,
        DEBUG = 2,
        INFO = 3,
        WARN = 4,
        ERROR = 5,
        FATAL = 6;

    var logger = {

        label: undefined,
        context: undefined,

        level: WARN,

        for: function( label, context, level ) {
            return Object.create( this ).configure( label, context, level );
        },

        configure: function( label, context, level ) {

            var proto = Object.getPrototypeOf( this ) !== Object.prototype ?
                Object.getPrototypeOf( this ) : undefined;

            this.label = combined_label( proto && proto.label, label );

            this.context = context || proto && proto.context;

            this.level = WARN; // default

            switch( level ) {
                case "trace": case "TRACE": this.level = TRACE; break;
                case "debug": case "DEBUG": this.level = DEBUG; break;
                case "info":  case "INFO":  this.level = INFO;  break;
                case "warn":  case "WARN":  this.level = WARN;  break;
                case "error": case "ERROR": this.level = ERROR; break;
                case "fatal": case "FATAL": this.level = FATAL; break;
                default: proto && delete this.level; break; // inherit from the prototype
            }

            return this;
        },

        // Log as with console.log, etc., but prepend the logger's label.

        /// Log a message and start a group if the log threshold is "trace" or below. If the
        /// threshold is above "trace" but at "info" or below, log a message without starting a
        /// group.
        /// 
        /// @name vwf.configuration#group
        /// @function

        group: function( /* ... */ ) {
            TRACE >= this.level && log.call( this, arguments, console && console.group, console ) ||
                INFO >= this.level && log.call( this, arguments, console && console.info, console );
        },

        /// Log a message and start a group if the log threshold is "trace" or below. The group will
        /// be initially closed on interactive displays that support it. If the threshold is above
        /// "trace" but at "info" or below, log a message without starting a group.
        /// 
        /// @name vwf.configuration#groupCollapsed
        /// @function

        groupCollapsed: function( /* ... */ ) {
            TRACE >= this.level && log.call( this, arguments, console && console.groupCollapsed, console ) ||
                INFO >= this.level && log.call( this, arguments, console && console.info, console );
        },

        /// End a group if the log threshold is "trace" or below.
        /// 
        /// @name vwf.configuration#groupEnd
        /// @function

        groupEnd: function( /* ... */ ) {
            TRACE >= this.level && log.call( this, arguments, console && console.groupEnd, console );
        },

        /// Log a message if the log threshold is "trace" or below.
        /// 
        /// @name vwf.configuration#trace
        /// @function

        trace: function( /* ... */ ) {
            TRACE >= this.level && log.call( this, arguments, console && console.debug, console ); // not console.trace(), which would log the stack
        },

        /// Log a message if the log threshold is "debug" or below.
        /// 
        /// @name vwf.configuration#debug
        /// @function

        debug: function( /* ... */ ) {
            DEBUG >= this.level && log.call( this, arguments, console && console.debug, console );
        },

        /// Log a message if the log threshold is "info" or below.
        /// 
        /// @name vwf.configuration#info
        /// @function

        info: function( /* ... */ ) {
            INFO >= this.level && log.call( this, arguments, console && console.info, console );
        },

        /// Log a message if the log threshold is "warn" or below.
        /// 
        /// @name vwf.configuration#warn
        /// @function

        warn: function( /* ... */ ) {
            WARN >= this.level && log.call( this, arguments, console && console.warn, console );
        },

        /// Log a message if the log threshold is "error" or below.
        /// 
        /// @name vwf.configuration#error
        /// @function

        error: function( /* ... */ ) {
            ERROR >= this.level && log.call( this, arguments, console && console.error, console );
        },

        /// Log a message.
        /// 
        /// @name vwf.configuration#log
        /// @function

        log: function( /* ... */ ) {
            log.call( this, arguments, console && console.log, console );
        },

        // Log with an extra one-time label. Equivalent to this.logger.for( label ).log( ... ),
        // etc., but without the overhead of creating a new logger.

        /// Log a message with an extra one-time label and start a group if the log threshold is
        /// "trace" or below. If the threshold is above "trace" but at "info" or below, log a
        /// message without starting a group.
        /// 
        /// @name vwf.configuration#groupx
        /// @function

        groupx: function( /* label, ... */ ) {
            TRACE >= this.level && log.call( this, arguments, console && console.group, console, true ) ||
                INFO >= this.level && log.call( this, arguments, console && console.info, console, true );
        },

        /// Log a message with an extra one-time label and start a group if the log threshold is
        /// "trace" or below. The group will be initially closed on interactive displays that
        /// support it. If the threshold is above "trace" but at "info" or below, log a message
        /// without starting a group.
        /// 
        /// @name vwf.configuration#groupxCollapsed
        /// @function

        groupxCollapsed: function( /* label, ... */ ) {
            TRACE >= this.level && log.call( this, arguments, console && console.groupCollapsed, console, true ) ||
                INFO >= this.level && log.call( this, arguments, console && console.info, console, true );
        },

        /// End a group if the log threshold is "trace" or below.
        /// 
        /// @name vwf.configuration#groupxEnd
        /// @function

        groupxEnd: function( /* label, ... */ ) {
            TRACE >= this.level && log.call( this, arguments, console && console.groupEnd, console, true );
        },

        /// Log a message with an extra one-time label if the log threshold is "trace" or below.
        /// 
        /// @name vwf.configuration#tracex
        /// @function

        tracex: function( /* ... */ ) {
            TRACE >= this.level && log.call( this, arguments, console && console.debug, console, true ); // not console.trace(), which would log the stack
        },

        /// Log a message with an extra one-time label if the log threshold is "debug" or below.
        /// 
        /// @name vwf.configuration#debugx
        /// @function

        debugx: function( /* label, ... */ ) {
            DEBUG >= this.level && log.call( this, arguments, console && console.debug, console, true );
        },

        /// Log a message with an extra one-time label if the log threshold is "info" or below.
        /// 
        /// @name vwf.configuration#infox
        /// @function

        infox: function( /* label, ... */ ) {
            INFO >= this.level && log.call( this, arguments, console && console.info, console, true );
        },

        /// Log a message with an extra one-time label if the log threshold is "warn" or below.
        /// 
        /// @name vwf.configuration#warnx
        /// @function

        warnx: function( /* label, ... */ ) {
            WARN >= this.level && log.call( this, arguments, console && console.warn, console, true );
        },

        /// Log a message with an extra one-time label if the log threshold is "error" or below.
        /// 
        /// @name vwf.configuration#errorx
        /// @function

        errorx: function( /* label, ... */ ) {
            ERROR >= this.level && log.call( this, arguments, console && console.warn, console, true );
        },

        /// Log a message with an extra one-time label.
        /// 
        /// @name vwf.configuration#logx
        /// @function

        logx: function( /* label, ... */ ) {
            log.call( this, arguments, console && console.log, console, true );
        },

    };

    /// Log a message to the console. Normalize the arguments list and invoke the appender function.
    /// 
    /// @name vwf.configuration-log
    /// @function
    /// @private
    /// 
    /// @param {Array} args
    ///   An Array-like list of arguments passed to a log function. normalize describes the formats
    ///   supported.
    /// @param {Function} appender
    ///   A Firebug-like log function that logs its parameters, such as window.console.log.
    /// @param {Object} context
    ///   The *this* object for the appender, such as window.console.
    /// @param {Boolean} [extra]
    ///   If true, interpret args[0] as a one-time label that extends the logger's output prefix.

    function log( args, appender, context, extra ) {  // invoke with *this* as the logger module

        // Normalize the arguments and log the message. Don't log a message if normalize() returned
        // undefined (because a generator function didn't return a result).

        if ( args = /* assignment! */ normalize.call( this, args, extra ) ) {
            appender && appender.apply( context, args );
        }

    }

    /// Normalize the arguments provided to a log function. The arguments may take one of the
    /// following forms:
    /// 
    /// A series of values, or a function that generates the values:
    /// 
    ///   [ value, value, ... ]
    ///   [ function() { return [ value, value, ... ] }, context ]
    /// 
    /// For a generator function, an optional context argument provides the generator function's
    /// *this* context. The logger's default context object will be used if the context argument is
    /// not provided.
    /// 
    /// When *extra* is truthy, the first argument is interpreted as a one-time label that extends
    /// the logger's output prefix:
    /// 
    ///   [ "label", value, value, ... ]
    ///   [ "label", function() { return [ value, value, ... ] }, context ]
    /// 
    /// The arguments are normalized into a list of values ready to pass to the appender:
    /// 
    ///   [ value, value, ... ]
    /// 
    /// @name vwf.configuration-normalize
    /// @function
    /// @private
    /// 
    /// @param {Array} args
    ///   An Array-like list of arguments passed to one of the log functions.
    /// @param {Boolean} [extra]
    ///   If true, interpret args[0] as a one-time label that extends the logger's output prefix.

    function normalize( args, extra ) {  // invoke with *this* as the logger module

        // Record the extra one-time label if one is provided. We leave it in the arguments list so
        // that we don't convert Arguments to an Array if it isn't necessary.

        if ( extra && ( typeof args[0] == "string" || args[0] instanceof String ) ) {
            var label = args[0];
            var start = 1;
        } else {
            var label = undefined;
            var start = 0;
        }

        // If a generator function is provided (instead of a series of values), call it to get the
        // arguments list.

        if ( typeof args[ start ] == "function" || args[ start ] instanceof Function ) {

            // Call the function using the provided context or this logger's context. We expect the
            // function to return an array of values, a single value, or undefined.

            args = args[ start ].call( args[ start+1 ] || this.context );

            // Convert a single value to an Array. An Array remains an Array. Leave undefined
            // unchanged.

            if ( args !== undefined && ( typeof args != "object" || ! ( args instanceof Array ) ) ) {
                args = [ args ];
            }

        } else {

            // Remove the extra one-time label.

            if ( start > 0 ) {
                args = Array.prototype.slice.call( args, start );
            }

        }

        // Add the prefix label to the arguments list and return. But return undefined if a
        // generator didn't return a result.

        return args ? prefixed_arguments( this.label, label, args ) : undefined;
    }

    // Update an arguments list to prepend "<label>: " to the output.

    function prefixed_arguments( label, extra, args ) {

        if ( label || extra ) {

            if ( args.length == 0 ) {
                return [ combined_label( label, extra ) ]; // just show the module and function name when there are no additional arguments
            } else if ( typeof args[0] == "string" || args[0] instanceof String ) {
                return [ combined_label( label, extra ) + ": " + args[0] ].concat( Array.prototype.slice.call( args, 1 ) ); // concatenate when the first field is a string so that it may remain a format string
            } else {
                return [ combined_label( label, extra ) + ": " ].concat( args ); // otherwise insert a new first field
            }

        } else {

            return args;

        }

    }

    // Generate a new label from a parent label and an extra part.

    function combined_label( label, extra ) {

        // Combine with "." unless the extension provides its own separator.

        var separator = extra && extra.match( /^[0-9A-Za-z]/ ) ? "." : "";

        // Concatenate and return.

        if ( label && extra ) {
            return label + separator + extra;
        } else if ( extra ) {
            return extra;
        } else if ( label ) {
            return label;
        } else {
            return undefined;
        }

    }

    // Get the initial level setting from the configuration module, and update the level when the
    // configuration changes.

    // TODO: should be done somewhere else; the logger isn't bound to VWF and shouldn't have a dependency on the configuration module.

    logger.configure( undefined, undefined, configuration.active["log-level"] || "warn" );

    configuration.changed( function( active ) {
        logger.configure( undefined, undefined, active["log-level"] || "warn" );
    }, this );

    // Return the module.

    return logger;

} );
