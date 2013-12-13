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

/// vwf/model/morph.js is an interface to the GLGE WebGL scene manager.
/// 
/// @module vwf/model/morph
/// @requires vwf/model
/// @requires vwf/utility

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

    var self = this;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {

            this.state.nodes = {}; 
            this.state.delayProperties = {};

        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            var protos = getPrototypes.call( this, childExtendsID  )
            var node = undefined;

            var createNode = function() {
                return {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsIDs: childImplementsIDs,
                    source: childSource,
                    type: childType,
                    name: childName,
                    loadComplete: callback
                };
            };

            if ( isMorphComponent.call( this, protos ) ) {
                node = this.state.nodes[ childID ] = createNode();

                // may want to do this in initializling property for classname
                //node.livelyObj = createLivelyMorph();
            }

        },

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {


        },
         
        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            if ( this.state.nodes[ nodeID ] ) {
                delete this.state.nodes[ nodeID ];
            }
        },

        // -- addingChild ------------------------------------------------------------------------
        
//        addingChild: function( nodeID, childID, childName ) {
//        },

        // -- movingChild ------------------------------------------------------------------------
        
//        movingChild: function( nodeID, childID, childName ) {
//        },

        // -- removingChild ------------------------------------------------------------------------
        
//        removingChild: function( nodeID, childID, childName ) {
//        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {

            return this.settingProperty( nodeID, propertyName, propertyValue );

        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {           

            var node = this.state.nodes[ nodeID ]; 

            if ( node !== undefined ) {
                switch ( propertyName ) {
                    case "classname":
                        node.livelyObj = createLivelyMorph.call( this, propertyValue );
                        if ( this.state.delayProperties[ nodeID ] !== undefined ) {
                            for ( var prop in this.state.delayProperties[ nodeID ] ) {
                                this.settingProperty( nodeID, prop, this.state.delayProperties[ nodeID ][ prop ] );
                            }
                            delete this.state.delayProperties[ nodeID ];
                        }
                        return propertyValue;
                        break;
                    default:
                        if ( node.livelyObj === undefined ) {
                            if ( this.state.delayProperties[ nodeID ] === undefined ) {
                                this.state.delayProperties[ nodeID ] = {};
                            }
                            this.state.delayProperties[ nodeID ][ propertyName ] = propertyValue;

                        } else {
                            return this.settingProperty( nodeID, propertyName, propertyValue );
                        }
                }
            }

            return undefined;
        
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = propertyValue;
            var node = this.state.nodes[ nodeID ]; 

            if ( node !== undefined && node.livelyObj ) {
                switch ( propertyName ) {
                    case "classname":
                        if ( node.livelyObj.classname != propertyValue ) {
                            // change class
                        }
                        break;

                    case "label":
                        node.livelyObj.setLabel( propertyValue );
                        break;

                    case "extent":
                        node.livelyObj.setExtent( propertyValue );
                        break;

                    case "fill":
                        node.livelyObj.setFill( propertyValue );
                        break;

                    case "borderWidth":
                        node.livelyObj.setBorderWidth( propertyValue );
                        break;

                    case "position":
                        node.livelyObj.setPosition( propertyValue );
                        break;

                    case "rotation":
                        node.livelyObj.setRotation( propertyValue );
                        break;

                    case "opacity":
                        node.livelyObj.setOpacity( propertyValue );
                        break;

                    default:
                        value = undefined;
                        break;
                }
            }
            return value;
       
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.state.nodes[ nodeID ]; 
            var value = undefined;

            if ( node !== undefined && node.livelyObj ) {
                switch ( propertyName ) {
                    
                    case "classname":
                        value = propertyValue = node.livelyObj.classname;
                        break;

                    case "label":
                        value = propertyValue = nnode.livelyObj.getLabel();
                        break;

                    case "extent":
                        value = propertyValue = node.livelyObj.getExtent();
                        break;

                    case "fill":
                        value = propertyValue = node.livelyObj.getFill();
                        break;

                    case "borderWidth":
                        value = propertyValue = node.livelyObj.getBorderWidth();
                        break;

                    case "position":
                        value = propertyValue = node.livelyObj.getPosition();
                        break;

                    case "rotation":
                        value = propertyValue = node.livelyObj.getRotation();
                        break;

                    case "opacity":
                        value = propertyValue = node.livelyObj.getOpacity();
                        break;

                    default:
                        break;
                }
            }
            return value;
        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

//        callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ], methodValue */ ) { // TODO: parameters
//            return undefined;
//        },


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

//        executing: function( nodeID, scriptText, scriptType ) {
//            return undefined;
//        },

        // == ticking =============================================================================

//        ticking: function( vwfTime ) {
//        },

    } );

    // == Private functions ==================================================================

    function createLivelyMorph( classname ) {
        var morphic = undefined;
        switch ( classname ) {
            case "lively.morphic.box":
                //morphic = new lively.morphic.Box( new lively.Rectangle( 0, 0, 10, 10 ) );
                break;
            case "lively.morphic.Button":
                break;


        }
        return morphic;
    }

    function isMorphComponent( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http-vwf-example-com-morph-vwf" );    
            }
        }

        return found;
    }

    function getPrototypes( extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = this.kernel.prototype( id );
        }
                
        return prototypes;
    }

} );
