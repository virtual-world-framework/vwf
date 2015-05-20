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

/// vwf/view/document extends a view interface up to the browser document. When vwf/view/document
/// is active, scripts on the main page may make (reflected) kernel calls:
/// 
///     window.vwf_view.kernel.createChild( nodeID, childName, childComponent, childURI, function( childID ) {
///         ...
///     } );
/// 
/// And receive view calls:
/// 
///     window.vwf_view.createdNode = function( nodeID, childID, childExtendsID, childImplementsIDs,
///         childSource, childType, childIndex, childName, callback /- ( ready ) -/ ) {
///         ...
///     }
/// 
/// @module vwf/view/document
/// @requires vwf/view

define( [ "module", "vwf/view", "vwf/utility", "jquery" ], function( module, view, utility, jQuery ) {

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            window.vwf_view = this;
        },

        // == Model API ============================================================================

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                childSource, childType, childURI, childName, callback /* ( ready ) */ ) {

            var self = this;

            // At the root node of the application, load the UI chrome if available.

            if ( childID == this.kernel.application() &&
                    ( window.location.protocol == "http:" || window.location.protocol == "https:" ) ) {

                // Suspend the queue.

                callback( false );

                // Load the file and insert it into the main page.

                var container = jQuery( "body" ).append( "<div id='vwf-content' />" ).children( ":last" );

                container.load( "admin/chrome", function( responseText, textStatus ) {

                    // If the overlay attached a `createdNode` handler, forward this first call
                    // since the overlay will have missed it.

                    if ( self.createdNode !== Object.getPrototypeOf( self ).createdNode ) {
                        self.createdNode( nodeID, childID, childExtendsID, childImplementsIDs,
                            childSource, childType, childURI, childName );
                    }

                    // Remove the container div if an error occurred or if we received an empty
                    // result. The server sends an empty document when the application doesn't
                    // provide a chrome file.

                    if ( ! ( textStatus == "success" || textStatus == "notmodified" ) || responseText == "" ) {
                        container.remove();
                    }

                    // Resume the queue.

                    callback( true );

                } );

            }

        },

    }, function( viewFunctionName ) {

        // == View API =============================================================================

    } );

} );
