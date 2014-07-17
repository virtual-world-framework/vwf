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

define( [ "module", "vwf/view", "jquery", "vwf/utility", "vwf/utility/color" ], 
    function( module, view, $, utility, color ) {

    var self;
    var stage;
    var stageContainer;
    var stageWidth = 800;
    var stageHeight = 600;

    return view.load( module, {

        initialize: function( options ) {
           
            self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            if ( options === undefined ) { 
                this.options = {}; 
            } else {
                this.options = options;
            }

            if ( window && window.innerWidth ) {
                stageWidth = window.innerWidth - 20;
            }            
            if ( window && window.innerHeight ) {
                stageHeight = window.innerHeight - 20;
            }

            stageContainer = this.options.container ? this.options.container : 'vwf-root';
            stageWidth = this.options.width ? this.options.width : stageWidth;
            stageHeight = this.options.height ? this.options.height : stageHeight;

        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
               childSource, childType, childIndex, childName, callback ) {
           
            if ( childID === this.kernel.application() ) {
                
                if ( this.state.nodes[ childID ] === undefined ) {

                    var node = this.state.nodes[ childID ] = this.state.createNode( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback );

                    var stageDef = { 
                        "container": stageContainer, 
                        "width": stageWidth, 
                        "height": stageHeight 
                    };

                    stage = node.kineticObj = new Kinetic.Stage( stageDef );  

                    // bind stage handlers
                    stage.on('mousedown', function(evt) {
                        var shape = evt.targetNode;
                        //shape.moveTo(dragLayer);
                        //stage.draw()
                        // restart drag and drop in the new layer
                        //shape.startDrag();
                    });

                    stage.on('mouseup', function(evt) {
                        var shape = evt.targetNode;
                        //shape.moveTo(layer);
                        //stage.draw();
                    });

                    stage.on('dragstart', function(evt) {
                        var shape = evt.targetNode;
                    });

                    stage.on('dragend', function(evt) {
                        var shape = evt.targetNode;

                    });


                }
            }    
               
        },
 
 
        // -- deletedNode ------------------------------------------------------------------------------

        //deletedNode: function( nodeID ) { },

        // -- addedChild -------------------------------------------------------------------------------

        //addedChild: function( nodeID, childID, childName ) { },

        // -- removedChild -----------------------------------------------------------------------------

        //removedChild: function( nodeID, childID ) { },

        // -- createdProperty --------------------------------------------------------------------------

        //createdProperty: function (nodeID, propertyName, propertyValue) { },

        // -- initializedProperty ----------------------------------------------------------------------

        //initializedProperty: function (nodeID, propertyName, propertyValue) { },

        // TODO: deletedProperty

        // -- satProperty ------------------------------------------------------------------------------

        satProperty: function (nodeID, propertyName, propertyValue) {
        
        },

        // -- gotProperty ------------------------------------------------------------------------------

        gotProperty: function ( nodeID, propertyName, propertyValue ) { 
        },

        // ticked: function( vwfTime ) {
        //     stage.draw();
        // }
    
    
    } );

    // private functions



});