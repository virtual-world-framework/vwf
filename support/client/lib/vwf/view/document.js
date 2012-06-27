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

define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/document extends a view interface up to the browser document. When vwf/view/document
    // is active, scripts on the main page may make (reflected) kernel calls:

    //     window.vwf_view.kernel.createChild( nodeID, childName, childComponent, function( childID ) {
    //         ...
    //     } );

    // And receive view calls:

    //     window.vwf_view.createdNode = function( nodeID, childID, childExtendsID, childImplementsIDs,
    //         childSource, childType, childURI, childName, callback /* ( ready ) */ ) {
    //         ...
    //     }

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            window.vwf_view = this;
        },
        
    }, function( viewFunctionName ) {

        // == View API =============================================================================

    } );

} );
