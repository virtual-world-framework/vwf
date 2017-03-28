// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

/// @module vwf/view/mocha
/// @requires vwf/view

define( [
    "module", "vwf/view", "jquery", "vwf/view/mocha/mocha", "vwf/view/chai/chai", "test/index"
], function( module, view, $, mocha, chai, test ) {

    // vwf/view/mocha.js is a driver used for unit tests based on mocha + chai.

    return view.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {

            // Initialize mocha and chai
            mocha.setup( "bdd" );
            window.assert = chai.assert;

            // Load the stylesheet and create the mocha div in which it will place its results
            $( "body" )
                .append( "<link rel='stylesheet' href='vwf/view/mocha/mocha.css'>" )
                .append( "<div id='mocha'></div>" );
        },

        initializedNode: function( nodeID, childID ) {
            if ( childID === vwf_view.kernel.application() ) {
                test();
                window.runTests = mocha.run;
            }
        }

    } );

} );
