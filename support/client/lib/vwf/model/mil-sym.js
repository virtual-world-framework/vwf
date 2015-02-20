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

define( [ "module", 
          "vwf/model", 
          "vwf/utility", 
          "vwf/utility/color",
          "mil-sym/cws", 
          "jquery" ], 
    function( module, model, utility, Color, cws, $ ) {

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
            var appID = this.kernel.application();

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            // If the node being created is a prototype, construct it and add it to the array of prototypes,
            // and then return
            var prototypeID = utility.ifPrototypeGetId( appID, this.state.prototypes, nodeID, childID );
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
                    node.image = undefined;
                    node.description = undefined;
                    node.tagName = undefined;
                    node.fullName = undefined;
                    node.echelon = undefined;
                    node.affiliation = undefined;

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

            var renderImage = false;

            if ( node !== undefined && ( utility.validObject( propertyValue ) ) ) {
                if ( node.nodeType === "unit" ) {
                    
                    switch ( propertyName ) {

                        case "symbolID":
                            value = node.symbolID = propertyValue;
                            if ( node.echelon !== undefined ) {
                                node.symbolID = cws.addEchelonToSymbolId( node.symbolID, node.echelon );
                            }
                            if ( node.affiliation !== undefined ) {
                                node.symbolID = cws.addAffiliationToSymbolId( node.symbolID, node.affiliation );
                            }
                            renderImage = true;
                            break;

                        case "image":
                            value = node.image = propertyValue;
                            break;

                        case "description":
                            value = node.description = propertyValue;
                            break;

                        case "tagName":
                            value = node.tagName = propertyValue;
                            break;

                        case "fullName":
                            value = node.fullName = propertyValue;
                            break;

                        case "echelon":
                            if ( node.echelon !== propertyValue ) {
                                switch( propertyValue ) {
                                    
                                    case "team":
                                    case "crew":
                                    case "squad":
                                    case "section":
                                    case "platoon":
                                    case "detachment":
                                    case "company":
                                    case "battery":
                                    case "troop":
                                    case "battalion":
                                    case "squadron":
                                    case "regiment":
                                    case "group":
                                    case "brigade":
                                    case "division":
                                    case "corps":
                                    case "mef":
                                    case "army":
                                    case "army group":
                                    case "front":
                                    case "region":
                                    case "null":
                                    case "none":
                                        if ( node.symbolID !== undefined ) {
                                            node.symbolID = cws.addEchelonToSymbolId( node.symbolID, propertyValue );
                                        }
                                        node.echelon = propertyValue;
                                        renderImage = true;
                                        break;

                                    default:
                                        this.logger.warnx( "incorrect echelon property value: " + propertyValue );
                                        break;
                                }
                            }
                            break;

                        case "affiliation":
                            if ( node.affiliation !== propertyValue ) {
                                switch( propertyValue ) {
                                    case "unknown":
                                    case "neutral":
                                    case "hostile":
                                    case "friendly":
                                        if ( node.symbolID !== undefined ) {
                                            node.symbolID = cws.addAffiliationToSymbolId( node.symbolID, propertyValue  );
                                        }
                                        node.affiliation = propertyValue;
                                        renderImage = true;
                                        break;

                                    default:
                                        this.logger.warnx( "incorrect affiliation property value: " + propertyValue );
                                        break;
                                }
                            }
                            break;

                    }

                } else if ( node.nodeType === "modifier" ) {
                    
                    var unit = this.state.nodes[ node.parentID ];
                    var msa = armyc2.c2sd.renderer.utilities.MilStdAttributes;
                    var mu = armyc2.c2sd.renderer.utilities.ModifiersUnits;

                    if ( unit === undefined ) {
                        return undefined;
                    }
                   
                    // Render image if modifier is valid
                    renderImage = setModifier( unit, propertyName, propertyValue );
                    
                }
            }

            if ( node !== undefined ) {
                // if node is defined then it is either a unit or a modifier
                // if nodeType is a modifier, then the parent is the unit
                var unitNode = node.nodeType === "modifier" ? this.state.nodes[ node.parentID ] : node; 
                if ( unitNode && renderImage ) {
                    render( unitNode );
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

                    case "image":
                        value = node.image;
                        break;

                    case "description":
                        value = node.description;
                        break;

                    case "fullName":
                        value = node.fullName;
                        break;

                    case "tagName":
                        value = node.tagName;
                        break;

                }

            } else if ( node.nodeType === "modifier" ) {
                
                var unit = this.state.nodes[ node.parentID ];
                var msa = armyc2.c2sd.renderer.utilities.MilStdAttributes;
                var mu = armyc2.c2sd.renderer.utilities.ModifiersUnits;

                if ( unit === undefined ) {
                    return undefined;
                }

                value = getModifier( unit, propertyName );
                
            }


            return value;
        },


        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters
            
            var node = this.state.nodes[ nodeID ]; 
            var value = undefined;

            switch( methodName ) {
                case "render":
                    value = render( node );
                    break;
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

    function isUnitNode( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "unit.vwf" );
            }
        }
       return found;
    } 

    function isModifierNode( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "modifier.vwf" );
            }
        }
       return found;
    } 



    function render( node ) {
        var value = undefined;
        
        if ( node !== undefined && node.nodeType === "unit" && node.symbolID !== undefined ) {
            var iconRender = armyc2.c2sd.renderer.MilStdIconRenderer;
            var img = iconRender.Render( node.symbolID, node.modifiers );
            
            var centerPt = img.getCenterPoint();
            var imgSize = img.getImageBounds();
            var symbolBounds = img.getSymbolBounds();

            value = node.image = img.toDataUrl();

            // we should really use the event, but we're having troubles
            // getting the events to replicate, this should be switched
            // back to the event when the replication is fixed.  handleRender
            // can then be completely removed
            //self.kernel.fireEvent( node.ID, "imageRendered", [ node.image, imgSize, centerPt, symbolBounds ] );
            
            self.kernel.callMethod( node.ID, "handleRender", [ node.image, imgSize, centerPt, symbolBounds ] );

        } 

        return value;       
    }

    function setModifier( unit, modifierAlias, modifierValue ) {
        
        var modObj = cws.modifierByAlias( modifierAlias );
        var msa = armyc2.c2sd.renderer.utilities.MilStdAttributes;
        var mu = armyc2.c2sd.renderer.utilities.ModifiersUnits;
        var modifierSet = false;
        
        if ( modObj !== undefined ) {
            
            var modifierActualName;
            
            switch ( modObj.type ) {
                case "ModifiersUnits":
                    modifierActualName = mu[ modObj.modifier ];
                    break;
                    
                case "MilStdAttributes":
                    modifierActualName = msa[ modObj.modifier ];
                    break;
                    
                default:
                    self.logger.errorx( "setModifier", "Unknown type (", modObj.type, ") specified." );
                    return modifierSet;
            }
            
            if ( modifierValue === "" ) {
                if ( unit.modifiers[ modifierActualName ] !== undefined ) {
                    delete unit.modifiers[ modifierActualName ];
                    modifierSet = true;
                }
            } else {
                switch ( modObj.valueType ) {
                    case "Boolean":
                        unit.modifiers[ modifierActualName ] = Boolean(modifierValue);
                        break;
                        
                    case "Number":
                        unit.modifiers[ modifierActualName ] = Number(modifierValue);
                        break;
                        
                    case "Array":
                    case "Text":
                    default:
                        unit.modifiers[ modifierActualName ] = modifierValue;
                        break;
                }
                modifierSet = true;
            }
        }
        
        return modifierSet;
    }
    
    function getModifier( unit, modifierAlias ) {
 
        var modObj = cws.modifierByAlias( modifierAlias );
        var msa = armyc2.c2sd.renderer.utilities.MilStdAttributes;
        var mu = armyc2.c2sd.renderer.utilities.ModifiersUnits;
        var value = undefined;
        
        if ( modObj !== undefined ) {
            
            var modifierActualName;
            
            switch ( modObj.type ) {
                case "ModifiersUnits":
                    modifierActualName = mu[ modObj.modifier ];
                    break;
                    
                case "MilStdAttributes":
                    modifierActualName = msa[ modObj.modifier ];
                    break;
                    
                default:
                    self.logger.errorx( "getModifier", "Unknown type (", modObj.type, ") specified." );
                    return value;
            }

            value = unit.modifiers[ modifierActualName ];            
        }
         
        return value;
    }
    
} );
