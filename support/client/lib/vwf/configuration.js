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

/// vwf/configuration maintains the runtime configuration settings. A set of fixed factory defaults
/// cascade into instance settings and appear as the active configuration.
/// 
/// @module vwf/configuration

define( function() {

    var exports = Object.create( Object.prototype, {

        /// The factory default settings.
        /// 
        /// The factory settings are constant, and this property returns a copy to prevent
        /// modifications. Factory settings are paritioned by environment with default settings that
        /// apply to all environments and additional settings for specific environments, typically
        /// "production", "development", and "testing". For example:
        ///
        ///   {
        ///     default: { environment: "development", alpha: 1, beta: 2, gamma: 3 },
        ///     production: { alpha: 101 },
        ///     development: { beta: 222, gamma: 3000 },
        ///     testing: { },
        ///   }

        factory: {

            get: function() {
                return jQuery.extend( true, {}, factory );
            }

        },

        // -- instance -----------------------------------------------------------------------------

        /// Set or get the instance settings. The instance settings apply to the active environment
        /// and override the factory settings. For example:
        ///
        ///   {
        ///     beta: 222,
        ///     gamma: 3000,
        ///     delta: false,
        ///   }

        instance: {

            set: function( value ) {
                instance = typeof value == "object" && value != null ? value : {};
                update();
            },

            get: function() {
                return instance;
            }

        },

        // -- active -------------------------------------------------------------------------------

        /// The computed configuration for the environment.
        /// 
        /// The active configuration is the result of a cascade of the factory default settings,
        /// factory settings for the active environment, and the instance settings. Changes to the
        /// configuration update this object in place without invalidating references to it.

        active: {

            get: function() {
                return active;
            }

        },

        // -- environment --------------------------------------------------------------------------

        /// The name of the active envionment.
        /// 
        /// environment returns the same value as active.environment.

        environment: {

            get: function() {
                return environment;
            }

        },

        // -- changed ------------------------------------------------------------------------------

        /// Register a notification function to be called when the configuration in active changes.
        /// 
        /// @param {Function} callback
        ///   The function to call, invoked as callback( active ).
        /// @param {Object} [context]
        ///   The value of *this* in the call to callback. If context is not provided, *this* will
        ///   be the configuration module.

        changed: {

            value: function( callback, context ) {
                callbacks.push( { callback: callback, context: context || this } );
            },

        },

    } );

    // == Private ==================================================================================

    /// Update the cascade.

    function update() {

        // Determine the environment.

        environment = instance.environment || factory.default.environment;

        // Clear active so that we may update it in place. This preserves any existing references.

        Object.keys( active ).forEach( function( key ) {
            delete active[key];
        } );

        // Merge the factory defaults and the instance settings into the active configuration.

        jQuery.extend( true, active, factory.default, factory[environment] || {}, instance );

        // Call the notification callbacks.

        callbacks.forEach( function( callback ) {
            callback.callback.call( callback.context, active );
        }, this );

    }

    // -- factory ----------------------------------------------------------------------------------

    /// Factory default configurations.

    var factory = {

        /// Default configuration for all environments.

        default: {
            "environment": require.toUrl( "dummy" ).indexOf( "../lib/" ) == 0 ? "testing" : "development",
            "log-level": "warn",        // logger threshold
            "random-seed": +new Date,   // pseudorandom number generator seed
            "randomize-ids": false,     // randomize IDs to discourage assumptions about ID allocation
            "humanize-ids": false,      // append recognizable strings to node IDs
        },

        /// Changes for production environments.

        production: {
        },

        /// Changes for development environments.

        development: {
            "log-level": "info",
            "randomize-ids": true,
            "humanize-ids": true,
        },

        /// Changes for testing environments.

        testing: {
            "random-seed": window.location.href, // make the random sequence repeatable
        },

    };

    // -- instance ---------------------------------------------------------------------------------

    /// Configuration overrides for the current instance.

    var instance = {};

    // -- active -----------------------------------------------------------------------------------

    /// The computed configuration.

    var active = {};

    // -- environment ------------------------------------------------------------------------------

    /// Name of the active environment. Equivalent to active.environment.

    var environment;

    // -- callbacks --------------------------------------------------------------------------------

    /// Update callbacks.

    var callbacks = [];

    // Force the first update.

    exports.instance = exports.instance;

    // Return the module.

    return exports;

} );
