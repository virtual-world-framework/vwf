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

define( [ "module", "vwf/view", "vwf/utility" ], function( module, view, utility ) {

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

            if ( childID == this.kernel.application() && childURI &&
                    utility.resolveURI( childURI ).match( /^https?:/ ) ) {

                // Suspend the queue.

                callback( false );

                // Load the file and insert it into the main page.

                var container = jQuery( "body" ).append( "<div />" ).children( ":last" );

                container.load( childURI + ".html", function( responseText, textStatus ) {

                    // Did the overlay attach a `createdNode` handler? If so, forward this first
                    // call since it missed it.

                    if ( self.createdNode !== Object.getPrototypeOf( self ).createdNode ) {
                        self.createdNode( nodeID, childID, childExtendsID, childImplementsIDs,
                            childSource, childType, childURI, childName );
                    }

                    // Remove the container div on error.

                    if ( textStatus != "success" && textStatus != "notmodified" ) {
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
