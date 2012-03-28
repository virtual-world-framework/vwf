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

define( [ "module" ], function( module ) {

    return {

        module: module,

        context: undefined,
        enabled: false,

        for: function( context ) {

            var logger = Object.create( this );

            logger.context = this.context ?
                this.context + "." + context : context;

            // logger.enabled = this.enabled;

            return logger;
        },

        // Log as with console.log, etc., but prepend a context identifier.

        log: function( /* ... */ ) {
            this.enabled && window.console && console.log &&
                console.log.apply( console, prefixed_arguments( this.context, arguments ) );
        },

        debug: function( /* ... */ ) {
            this.enabled && window.console && console.debug &&
                console.debug.apply( console, prefixed_arguments( this.context, arguments ) );
        },

        info: function( /* ... */ ) {
            this.enabled && window.console && console.info &&
                console.info.apply( console, prefixed_arguments( this.context, arguments ) );
        },

        warn: function( /* ... */ ) {
            window.console && console.warn &&
                console.warn.apply( console, prefixed_arguments( this.context, arguments ) );
        },

        error: function( /* ... */ ) {
            window.console && console.error &&
                console.error.apply( console, prefixed_arguments( this.context, arguments ) );
        },

        group: function( /* ... */ ) {
            this.enabled && window.console && console.group &&
                console.group.apply( console, prefixed_arguments( this.context, arguments ) );
        },

        groupCollapsed: function( /* ... */ ) {
            this.enabled && window.console && console.groupCollapsed &&
                console.groupCollapsed.apply( console, prefixed_arguments( this.context, arguments ) );
        },

        groupEnd: function( /* ... */ ) {
            this.enabled && window.console && console.groupEnd &&
                console.groupEnd.apply( console, prefixed_arguments( this.context, arguments ) );
        },

        // Log with an additional one-time context. Equivalent to this.logger.for( context ).log( ... ),
        // etc., but without the overhead of a new logger.

        logc: function( /* context, ... */ ) {
            this.enabled && window.console && console.log &&
                console.log.apply( console, prefixed_arguments_extra( this.context, arguments ) );
        },

        debugc: function( /* context, ... */ ) {
            this.enabled && window.console && console.debug &&
                console.debug.apply( console, prefixed_arguments_extra( this.context, arguments ) );
        },

        infoc: function( /* context, ... */ ) {
            this.enabled && window.console && console.info &&
                console.info.apply( console, prefixed_arguments_extra( this.context, arguments ) );
        },

        warnc: function( /* context, ... */ ) {
            window.console && console.warn &&
                console.warn.apply( console, prefixed_arguments_extra( this.context, arguments ) );
        },

        errorc: function( /* context, ... */ ) {
            window.console && console.error &&
                console.error.apply( console, prefixed_arguments_extra( this.context, arguments ) );
        },

        groupc: function( /* context, ... */ ) {
            this.enabled && window.console && console.group &&
                console.group.apply( console, prefixed_arguments_extra( this.context, arguments ) );
        },

        groupcCollapsed: function( /* context, ... */ ) {
            this.enabled && window.console && console.groupCollapsed &&
                console.groupCollapsed.apply( console, prefixed_arguments_extra( this.context, arguments ) );
        },

        groupcEnd: function( /* context, ... */ ) {
            this.enabled && window.console && console.groupEnd &&
                console.groupEnd.apply( console, prefixed_arguments_extra( this.context, arguments ) );
        },

    };

    // Calculate an arguments array to pass to a logger function to prepend "<context>: " to the
    // output.

    function prefixed_arguments( context, args ) {

        if ( context ) {

            if ( args.length == 0 ) {
                return [ context ]; // just show the module and function name when there are no additional arguments
            } else if ( typeof args[0] == "string" || args[0] instanceof String ) {
                return [ context + ": " + args[0] ].concat( Array.prototype.slice.call( args, 1 ) ); // concatenate when the first field is a string so that it may remain a format string
            } else {
                return [ context + ": " ].concat( args ); // otherwise insert a new first field
            }

        } else {

            return args;

        }

    }

    // Calculate an arguments array to pass to a logger function. Interpret the first argument as a
    // one-time piece of additional context if it is a string. Pass the arguments following the
    // extra context string through such that "<context>.<extra-context>: " will be prepended to the
    // output.

    function prefixed_arguments_extra( context, args ) {

        if ( args.length > 0 && ( typeof args[0] == "string" || args[0] instanceof String ) ) {
            context = context ? context + "." + args[0] : args[0];
            args = Array.prototype.slice.call( args, 1 );
        }

        return prefixed_arguments( context, args );
    }

} );
