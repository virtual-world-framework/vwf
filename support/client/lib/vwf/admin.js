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


/// vwf/admin   
///   module to provide outside of an application context functionality
/// 
/// 
/// @module vwf/admin
/// @requires rsvp

define( [ "rsvp" ] , function( rsvp ) {

    // Helper function that takes the URL from the browser and attempts to generate
    // the application path and instance ID that are in use.
    function getPathInformation( ) {
        var result = {}
        result[ "applicationPath" ] = undefined;
        result[ "instanceID" ] = undefined;
        var app = window.location.pathname;
        var pathSplit = app.split( '/' );
        if ( pathSplit[ 0 ] == "" ) {          
            pathSplit.shift( );
        }
        if ( pathSplit[ pathSplit.length - 1 ] == "" ) {
            pathSplit.pop( );
        }
        if ( ( pathSplit.length > 0 ) && ( pathSplit[ pathSplit.length - 1 ].length == 16 ) ) {
           result[ "instanceID" ] = pathSplit.pop( );
        }
        if ( pathSplit.length > 0 ) {
            result[ "applicationPath" ] = "/" + pathSplit.join("/") + "/";
        }
        else {
            result[ "applicationPath" ] = "/";
        }
        return result;
    };    
    
    var exports = {
        // getSaveStates: Returns all save states that have been saved for this particular instance.
        // Implemented via a jQuery getJSON call with an interface derived from the rsvp Promise implementation.
        getSaveStates: function( ) {
            var pathInformation = getPathInformation( );
            var promise = new require( 'rsvp' ).Promise( function( resolve, reject ) {
                if ( pathInformation[ "instanceID" ] ) {
                    var requestURL = pathInformation[ "applicationPath" ] + pathInformation[ "instanceID" ] + "/saves";
                    $.getJSON( requestURL ).done( function( data ) {
                        resolve( data );
                    } ).fail( function( jqxhr, textStatus, error) {
                        reject( { "error": error } );
                    } );
                }
                else {
                    reject( { "error": "getSaveStates could not identify current instance to get save states from" } );
                }
            } );
            return promise;
        },
        application: {
            // application.getSaveStates: Returns all save states that have been saved for this application, across all instances
            // Implemented via a jQuery getJSON call with an interface derived from the rsvp Promise implementation.
            getSaveStates: function( ) {
                var pathInformation = getPathInformation( );
                var promise = new require( 'rsvp' ).Promise( function( resolve, reject ) {
                    var requestURL = pathInformation[ "applicationPath" ] + "saves";
                    $.getJSON( requestURL ).done( function( data ) {
                        resolve( data );
                    } ).fail( function( jqxhr, textStatus, error) {
                        reject( { "error": error } );
                    } );
                } );
                return promise;
            }
        }
    };

    return exports;

} );