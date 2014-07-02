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

/// @module vwf/view/test
/// @requires vwf/view

define( [ "module", "vwf/view" ], function( module, view ) {

    var self;

    return view.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
            self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            if ( options === undefined ) { options = {}; }

            if ( this.state === undefined ) {   
                this.state = {};
            }
            if ( this.state.nodes === undefined ) {   
                this.state.nodes = {};
            }
        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */) {
            
        },

        initializedNode: function( nodeID, childID ) {

        },
 
 
        // -- deletedNode ------------------------------------------------------------------------------

        // deletedNode: function( childID ) { },

        // -- addedChild -------------------------------------------------------------------------------

        //addedChild: function( nodeID, childID, childName ) { },

        // -- removedChild -----------------------------------------------------------------------------

        //removedChild: function( nodeID, childID ) { },

        // -- createdProperty --------------------------------------------------------------------------

        createdProperty: function (nodeID, propertyName, propertyValue) {
			this.satProperty(nodeID, propertyName, propertyValue);
        },

        // -- initializedProperty ----------------------------------------------------------------------

        initializedProperty: function ( nodeID, propertyName, propertyValue ) { 
            this.satProperty(nodeID, propertyName, propertyValue);
        },

        // TODO: deletedProperty

        // -- satProperty ------------------------------------------------------------------------------

        satProperty: function ( nodeID, propertyName, propertyValue ) {         
        },

        // -- gotProperty ------------------------------------------------------------------------------

        gotProperty: function ( nodeID, propertyName, propertyValue ) { 
        },

        // -- calledMethod -----------------------------------------------------------------------------

        calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {
        },

        // -- firedEvent -----------------------------------------------------------------------------

        firedEvent: function( nodeID, eventName ) {
        },

        // -- ticked -----------------------------------------------------------------------------------

        ticked: function() {
        },

        // -- render -----------------------------------------------------------------------------------

        render: function(renderer, scene, camera) {
        },

    } );

} );
