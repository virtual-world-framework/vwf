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

( function() {

    // `kernel.initialize` parameters.

    var application, modelInitializers, viewInitializers;

    // If the global `vwf` is defined, take the initialization parameters from there and clear the
    // global.

    if ( window.vwf && typeof vwf == "object" && vwf !== null ) {

        if ( vwf.application ) {
            application = vwf.application;
        }

        if ( vwf.models ) {
            modelInitializers = vwf.models;
        }

        if ( vwf.views ) {
            viewInitializers = vwf.views;
        }

        window.vwf = undefined;
    }

    // Get the application specification if one is provided in the query string. Parse it into a
    // component descriptor if it's valid JSON, otherwise keep the query string and assume it's a
    // URI.

    if ( getQueryString( "application" ) ) {

        application = getQueryString( "application" );

        try { application = JSON.parse( application ) }
            catch ( exception ) { }  // TODO: conflict between (some relative) uris and json?
    }

    // TODO: parse model and view configuration from the URL
 
    // Load the kernel, wait for the DOM ready state, then initialize the kernel.

    require( [ "domReady", "vwf" ], function( ready, vwf ) {
        ready( function() {
            vwf.initialize( application, modelInitializers, viewInitializers );
        } );
    } );


    /// Retrieve parameters from the page's query string.

    // From http://stackoverflow.com/questions/901115/get-querystring-values-with-jquery/2880929#2880929
    // and http://stackoverflow.com/questions/901115/get-querystring-values-with-jquery/3867610#3867610.

    function getQueryString( name ) {

        function parseParams() {
            var params = {},
                e,
                a = /\+/g, // regex for replacing addition symbol with a space
                r = /([^&;=]+)=?([^&;]*)/g,
                d = function( s ) { return decodeURIComponent( s.replace(a, " ") ); },
                q = window.location.search.substring(1);

            while ( e = r.exec(q) )
                params[ d(e[1]) ] = d(e[2]);

            return params;
        }

        if ( ! queryStringParams )
            queryStringParams = parseParams();

        return queryStringParams[name];
    };

    var queryStringParams;

} )();
