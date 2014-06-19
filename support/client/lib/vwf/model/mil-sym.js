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

/// vwf/model/test.js is a dummy driver used for tests.
/// 
/// @module vwf/model/test
/// @requires vwf/model

define( [ "module", "vwf/model", "vwf/utility", "vwf/utility/color", "jquery" ], function( module, model, utility, Color, $ ) {

    var self;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
            self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            if ( options === undefined ) { options = {}; }

            this.state = {
                "nodes": {},
                "prototypes": {},
                "createNode": function( nodeType, nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {
                    return {
                        "nodeType": nodeType,
                        "parentID": nodeID,
                        "ID": childID,
                        "extendsID": childExtendsID,
                        "implementsIDs": childImplementsIDs,
                        "source": childSource,
                        "type": childType,
                        "name": childName 
                    };
                }
            };


            // turns on logger debugger console messages 
            this.debug = {
                "creation": false,
                "initializing": false,
                "parenting": false,
                "deleting": false,
                "properties": false,
                "setting": false,
                "getting": false,
                "prototypes": false
            };

        },

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            // If the parent nodeID is 0, this node is attached directly to the root and is therefore either 
            // the scene or a prototype.  In either of those cases, save the uri of the new node
            var childURI = ( nodeID === 0 ? childIndex : undefined );

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            // If the node being created is a prototype, construct it and add it to the array of prototypes,
            // and then return
            var prototypeID = ifPrototypeGetId.call( this, nodeID, childID );
            if ( prototypeID !== undefined ) {
                
                if ( this.debug.prototypes ) {
                    this.logger.infox( "prototype: ", prototypeID );
                }

                this.state.prototypes[ prototypeID ] = {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsID: childImplementsIDs,
                    source: childSource, 
                    type: childType,
                    uri: childURI,
                    name: childName,
                };
                return;                
            }

            var protos = getPrototypes( childExtendsID );
            var node = this.state.nodes[ childID ];
            if ( node === undefined ) {

                if ( isUnitNode( protos ) ) {

                    this.state.nodes[ childID ] = node = this.state.createNode( "unit", nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback );
                    
                    // additional members for the unit components
                    node.symbolID = undefined;
                    node.modifiers = {};
                    node.dataUrl = undefined;

                } else if ( isModifierNode( protos ) ) {

                    this.state.nodes[ childID ] = node = this.state.createNode( "modifier", nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback );                    
                }
            } 


        },

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {

            if ( this.debug.initializing ) {
                this.logger.infox( "initializingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            } 

        },

        deletingNode: function( nodeID ) {
            if ( this.debug.deleting ) {
                this.logger.infox( "deletingNode", nodeID );
            }

            if ( this.state.nodes[ nodeID ] !== undefined ) {
                delete this.state.nodes[ nodeID ];    
            }
        },

        // addingChild: function( nodeID, childID, childName ) {
        //     if ( this.debug.parenting ) {
        //         this.logger.infox( "addingChild", nodeID, childID, childName );
        //     }
        // },

        // movingChild: function( nodeID, childID, childName ) {
        //     if ( this.debug.parenting ) {
        //         this.logger.infox( "movingChild", nodeID, childID, childName );
        //     }
        // },

        // removingChild: function( nodeID, childID, childName ) {
        //     if ( this.debug.parenting ) {
        //         this.logger.infox( "removingChild", nodeID, childID, childName );
        //     }
        // },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            if ( this.debug.properties ) {
                this.logger.infox( "C === creatingProperty ", nodeID, propertyName, propertyValue );
            }
            return this.settingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debug.properties ) {
                this.logger.infox( "  I === initializingProperty ", nodeID, propertyName, propertyValue );
            }

            return this.settingProperty( nodeID, propertyName, propertyValue );
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debug.properties || this.debug.setting ) {
                this.logger.infox( "    S === settingProperty ", nodeID, propertyName, propertyValue );
            }

            var node = this.state.nodes[ nodeID ]; 
            var value = undefined;


            if ( node !== undefined && ( validPropertyValue( propertyValue ) ) ) {
                if ( node.nodeType === "unit" ) {
                    
                    switch ( propertyName ) {

                        case "symbolID":
                            node.symbolID = propertyValue;
                            break;

                        case "dataUrl":
                            node.dataUrl = propertyValue;
                            break;

                    }

                } else if ( node.nodeType === "modifier" ) {
                    
                    var unit = this.state.nodes[ node.parentID ];
                    var msa = armyc2.c2sd.renderer.utilities.MilStdAttributes;
                    var mu = armyc2.c2sd.renderer.utilities.ModifiersUnits;

                    if ( unit === undefined ) {
                        return undefined;
                    }

                    switch ( propertyName ) {

                        case "pixelSize":
                            unit.modifiers[ msa.PixelSize ] = Number( propertyValue );
                            break;

                        case "keepUnitRatio":
                            unit.modifiers[ msa.KeepUnitRatio ] = Boolean( propertyValue );
                            break;  

                        case "symbologyStandard":
                            unit.modifiers[ msa.SymbologyStandard ] = Number( propertyValue );
                            break;

                        case "quantity":
                            unit.modifiers[ mu.C_QUANTITY ] = Number( propertyValue );
                            break;

                        case "additionalInfo1":
                            unit.modifiers[ mu.H_ADDITIONAL_INFO_1 ] = propertyValue;
                            break;

                        case "additionalInfo2":
                            unit.modifiers[ mu.H1_ADDITIONAL_INFO_2 ] = propertyValue;
                            break;

                        case "additionalInfo3":
                            unit.modifiers[ mu.H2_ADDITIONAL_INFO_3 ] = propertyValue;
                            break;

                        case "altitudeDepth":
                            unit.modifiers[ mu.X_ALTITUDE_DEPTH ] = propertyValue;
                            break;

                        case "combatEffectiveness":
                            unit.modifiers[ mu.K_COMBAT_EFFECTIVENESS ] = propertyValue;
                            break;

                        case "directionOfMovement":
                            unit.modifiers[ mu.Q_DIRECTION_OF_MOVEMENT ] = propertyValue;
                            break;

                        case "DTG1":
                            // date
                            break;

                        case "DTG2":
                            // date
                            break;

                        case "evaluationRating":
                            unit.modifiers[ mu.J_EVALUATION_RATING ] = propertyValue;
                            break;

                        case "higherFormation":
                            unit.modifiers[ mu.M_HIGHER_FORMATION ] = propertyValue;
                            break;

                        case "hostile":
                            unit.modifiers[ mu.N_HOSTILE ] = propertyValue;
                            break;

                        case "iffSif":
                            unit.modifiers[ mu.P_IFF_SIF ] = propertyValue;
                            break;

                        case "location":
                            unit.modifiers[ mu.Y_LOCATION ] = propertyValue;
                            break;

                        case "reinforcedReduced":
                            unit.modifiers[ mu.F_REINFORCED_REDUCED ] = propertyValue;
                            break;

                        case "signatureEquip":
                            unit.modifiers[ mu.L_SIGNATURE_EQUIP ] = propertyValue;
                            break; 

                        case "staffComments":
                            unit.modifiers[ mu.G_STAFF_COMMENTS ] = propertyValue;
                            break;

                        case "equipType":
                            unit.modifiers[ mu.V_EQUIP_TYPE ] = propertyValue;
                            break; 

                        case "uniqueDesignation1":
                            unit.modifiers[ mu.T_UNIQUE_DESIGNATION_1 ] = propertyValue;
                            break;

                        case "uniqueDesignation2":
                            unit.modifiers[ mu.T1_UNIQUE_DESIGNATION_2 ] = propertyValue;
                            break;

                        case "speed":
                            unit.modifiers[ mu.Z_SPEED ] = propertyValue;
                            break;
                    }                    
                }

            }



            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName ) {

            if ( this.debug.properties || this.debug.getting ) {
                this.logger.infox( "   G === gettingProperty ", nodeID, propertyName );
            }

            var node = this.state.nodes[ nodeID ]; 
            var value = undefined;

            //this driver has no representation of this node, so there is nothing to do.
            if( node === undefined ) return value;

            if ( node.nodeType === "unit" ) {
                
                switch ( propertyName ) {

                    case "symbolID":
                        value = node.symbolID;
                        break;

                    case "dataUrl":
                        value = node.dataUrl;
                        break;

                }

            } else if ( node.nodeType === "modifier" ) {
                
                var unit = this.state.nodes[ node.parentID ];
                var msa = armyc2.c2sd.renderer.utilities.MilStdAttributes;
                var mu = armyc2.c2sd.renderer.utilities.ModifiersUnits;

                if ( unit === undefined ) {
                    return undefined;
                }

                switch ( propertyName ) {

                    case "pixelSize":
                        value = unit.modifiers[ msa.PixelSize ];
                        break;

                    case "keepUnitRatio":
                        value = unit.modifiers[ msa.KeepUnitRatio ];
                        break;  

                    case "symbologyStandard":
                        value = unit.modifiers[ msa.SymbologyStandard ];
                        break;

                    case "quantity":
                        value = unit.modifiers[ mu.C_QUANTITY ];
                        break;

                    case "additionalInfo1":
                        value = unit.modifiers[ mu.H_ADDITIONAL_INFO_1 ];
                        break;

                    case "additionalInfo2":
                        value = unit.modifiers[ mu.H1_ADDITIONAL_INFO_2 ];
                        break;

                    case "additionalInfo3":
                        value = unit.modifiers[ mu.H2_ADDITIONAL_INFO_3 ];
                        break;

                    case "altitudeDepth":
                        value = unit.modifiers[ mu.X_ALTITUDE_DEPTH ];
                        break;

                    case "combatEffectiveness":
                        value = unit.modifiers[ mu.K_COMBAT_EFFECTIVENESS ];
                        break;

                    case "directionOfMovement":
                        value = unit.modifiers[ mu.Q_DIRECTION_OF_MOVEMENT ];
                        break;

                    case "DTG1":
                        // date
                        break;

                    case "DTG2":
                        // date
                        break;

                    case "evaluationRating":
                        value = unit.modifiers[ mu.J_EVALUATION_RATING ];
                        break;

                    case "higherFormation":
                        value = unit.modifiers[ mu.M_HIGHER_FORMATION ];
                        break;

                    case "hostile":
                        value = unit.modifiers[ mu.N_HOSTILE ];
                        break;

                    case "iffSif":
                        value = unit.modifiers[ mu.P_IFF_SIF ];
                        break;

                    case "location":
                        value = unit.modifiers[ mu.Y_LOCATION ];
                        break;

                    case "reinforcedReduced":
                        value = unit.modifiers[ mu.F_REINFORCED_REDUCED ];
                        break;

                    case "signatureEquip":
                        value = unit.modifiers[ mu.L_SIGNATURE_EQUIP ];
                        break; 

                    case "staffComments":
                        value = unit.modifiers[ mu.G_STAFF_COMMENTS ];
                        break;

                    case "equipType":
                        value = unit.modifiers[ mu.V_EQUIP_TYPE ];
                        break; 

                    case "uniqueDesignation1":
                        value = unit.modifiers[ mu.T_UNIQUE_DESIGNATION_1 ];
                        break;

                    case "uniqueDesignation2":
                        value = unit.modifiers[ mu.T1_UNIQUE_DESIGNATION_2 ];
                        break;

                    case "speed":
                        value = unit.modifiers[ mu.Z_SPEED ];
                        break;
                }                    
            }


            return value;
        },


        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters
            
            var node = this.state.nodes[ nodeID ]; 
            var value = undefined;

            if ( node !== undefined && node.nodeType === "unit" && node.symbolID !== undefined ) {
                var iconRender = armyc2.c2sd.renderer.MilStdIconRenderer;
                if ( methodName === "render" ) {
                    var img = iconRender.Render( node.symbolID, node.modifiers );
                    value = node.dataUrl = img.toDataUrl();
                }
            }

            return value;
        },


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

        // executing: function( nodeID, scriptText, scriptType ) {
        //     return undefined;
        // },

        // == ticking =============================================================================

        // ticking: function( vwfTime ) {
            
        // }



    } );

    function getPrototypes( extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = self.kernel.prototype( id );
        }
                
        return prototypes;
    }

    function ifPrototypeGetId( nodeID, childID ) {
        var ptID;
        if ( ( nodeID == 0 && childID != this.kernel.application() ) || this.state.prototypes[ nodeID ] !== undefined ) {
            if ( nodeID != 0 || childID != this.kernel.application() ) {
                ptID = nodeID ? nodeID : childID;
                if ( this.state.prototypes[ ptID ] !== undefined ) {
                    ptID = childID;
                }
                return ptID;
            } 
        }
        return undefined;
    }


    function isUnitNode( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "unit-vwf" ); 
            }
        }
       return found;
    } 

    function isModifierNode( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "modifier-vwf" ); 
            }
        }
       return found;
    } 

    function validPropertyValue( obj ) {
        var objType = ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        return ( objType != 'null' && objType != 'undefined' );
    }

} );
