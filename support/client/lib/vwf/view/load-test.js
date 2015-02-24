"use strict";

// Copyright 2015 United States Government, as represented by the Secretary of Defense, Under
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

/// @module vwf/view/document
/// @requires vwf/view

define( [ "module", "vwf/view" ], function( module, view ) {

    return view.load( module, {

        initialize: function() {
            this.state.enabled = false;
            this.state.size = 1;
            this.state.interval = 1;
            this.state.clients = 0;
            this.state.intervalID = undefined;
            this.state.results = [];
        },

        addedChild: function( nodeID, childID, childName ) {

            if ( this.kernel.uri( nodeID ) === "http://vwf.example.com/client.vwf" ) {
                clients.call( this, clients.call( this ) + 1 );
            }

        },

        removedChild: function( nodeID, childID ) {

            if ( this.kernel.uri( nodeID ) === "http://vwf.example.com/client.vwf" ) {
                clients.call( this, clients.call( this ) - 1 );
            }

        },

        createdProperty: function( nodeID, propertyName, propertyValue ) {

            return this.initializedProperty( nodeID, propertyName, propertyValue );

        },

        initializedProperty: function( nodeID, propertyName, propertyValue ) {

            if ( propertyName !== "ping" || propertyValue !== null ) {
                return this.satProperty( nodeID, propertyName, propertyValue );
            }

        },

        satProperty: function( nodeID, propertyName, propertyValue ) {

            if ( nodeID === this.kernel.application() ) {

                switch( propertyName ) {
                    case "enabled":   enabled.call( this,   propertyValue );  break;
                    case "size":      size.call( this,      propertyValue );  break;
                    case "interval":  interval.call( this,  propertyValue );  break;
                    case "ping":      pong.call( this,      propertyValue );  break;
                }

            }

        },

    } );

    function ping() {
        this.kernel.setProperty( this.kernel.application(), "ping", +new Date );
    }

    function pong( pingTime ) {
        this.state.results.push( { ping: pingTime, pong: +new Date } );
    }

    function enabled( value ) {

        var self = this;

        if ( value !== undefined ) {

            value = !! value;

            if ( value !== this.state.enabled ) {

                if ( value ) {
                    this.state.intervalID = setInterval( function() { ping.call( self ) }, interval.call( self ) * 1000 );
                } else if ( this.state.intervalID ) {
                    clearInterval( this.state.intervalID );
                    this.state.intervalID = undefined;
                }

                this.state.enabled = value;

            }

        }

        return this.state.enabled;
    }

    function size( value ) {

        if ( value !== undefined ) {
            value = +value || 1;
            this.state.size = value;
        }

        return this.state.size;
    }

    function interval( value ) {

        if ( value !== undefined ) {
            value = +value || 1;
            this.state.interval = value;
        }

        return this.state.interval;
    }

    function clients( value ) {

        if ( value !== undefined ) {
            value = +value || 1;
            this.state.clients = value;
        }

        return this.state.clients;

    }

} );
