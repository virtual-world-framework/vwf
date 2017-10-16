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

    var modelDriver;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
            modelDriver = this;

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
                    name: childName
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
                    node.unitStatus = undefined;
                    node.mobility = undefined;
                    node.taskForce = undefined;
                    node.installation = undefined;

                } else if ( isMissionGfxNode( protos ) ) {

                    this.state.nodes[ childID ] = node = this.state.createNode( "missionGfx", nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback );
                    
                    // additional members for the missionGfx components
                    node.symbolID = undefined;
                    node.symbolType = undefined;
                    node.modifiers = {};
                    node.description = undefined;
                    node.tagName = undefined;
                    node.fullName = undefined;
                    node.affiliation = undefined;
                    node.controlPts = [];
                    node.x = undefined;
                    node.y = undefined;
                    node.width = undefined;
                    node.height = undefined;

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
                if ( ( node.nodeType === "unit" ) || ( node.nodeType === "missionGfx" ) ) {
                    
                    switch ( propertyName ) {

                        case "symbolID":
                            value = node.symbolID = propertyValue;
                            if ( node.echelon !== undefined ) {
                                node.symbolID = cws.addEchelonToSymbolId( node.symbolID, node.echelon );
                            }
                            if ( node.affiliation !== undefined ) {
                                node.symbolID = cws.addAffiliationToSymbolId( node.symbolID, node.affiliation );
                            }
                            if ( node.unitStatus !== undefined ) {
                                node.symbolID = cws.addUnitStatusToSymbolId( node.symbolID, node.unitStatus );                                
                            }
                            if ( node.mobility !== undefined ) {
                                node.symbolID = cws.addMobilityToSymbolId( node.symbolID, node.mobility );                                
                            }
                            if ( node.taskForce !== undefined ) {
                                node.symbolID = cws.addTaskForceToSymbolId( node.symbolID, node.taskForce );                                
                            }
                            if ( node.installation !== undefined ) {
                                node.symbolID = cws.addInstallationToSymbolId( node.symbolID, node.installation );                                
                            }
                            renderImage = true;
                            break;

                        case "image":
                            if ( node.nodeType === "unit" ) {
                                value = node.image = propertyValue;
                            }
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
                                        if ( !!node.installation ) {
                                            node.installation = "none";
                                        }
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

                        case "unitStatus":
                            if ( node.unitStatus !== propertyValue ) {
                                switch( propertyValue ) {
                                    case "anticipated":
                                    case "present":
                                    case "capable":
                                    case "damaged":
                                    case "destroyed":
                                    case "full":
                                        if ( node.symbolID !== undefined ) {
                                            node.symbolID = cws.addUnitStatusToSymbolId( node.symbolID, propertyValue );
                                        }
                                        node.unitStatus = propertyValue;
                                        renderImage = true;
                                        break;

                                    default:
                                        this.logger.warnx( "incorrect unitStatus property value: " + propertyValue );
                                        break;
                                }
                            }
                            break;

                        case "mobility":
                            if ( node.mobility !== propertyValue ) {
                                switch( propertyValue ) {
                                    case "none":
                                    case "wheeled limited cross-country":
                                    case "cross-country":
                                    case "tracked":
                                    case "wheeled and tracked":
                                    case "towed":
                                    case "rail":
                                    case "over snow":
                                    case "sled":
                                    case "pack animals":
                                    case "barge":
                                    case "amphibious":
                                        if ( node.symbolID !== undefined ) {
                                            node.symbolID = cws.addMobilityToSymbolId( node.symbolID, propertyValue );
                                        }
                                        node.mobility = propertyValue;
                                        node.installation = "none";
                                        renderImage = true;
                                        break;

                                    default:
                                        this.logger.warnx( "incorrect mobility property value: " + propertyValue );
                                        break;
                                }
                            }
                            break;

                        case "taskForce":
                            if ( node.taskForce !== propertyValue ) {
                                switch( propertyValue ) {
                                    case "none":
                                    case "HQ":
                                    case "TF HQ":
                                    case "FD HQ":
                                    case "FD-TF HQ":
                                    case "TF":
                                    case "FD":
                                    case "FD-TF":
                                        if ( node.symbolID !== undefined ) {
                                            node.symbolID = cws.addTaskForceToSymbolId( node.symbolID, propertyValue );
                                        }
                                        node.taskForce = propertyValue;
                                        node.installation = "none";

                                        renderImage = true;
                                        break;

                                    default:
                                        this.logger.warnx( "incorrect taskForce property value: " + propertyValue );
                                        break;
                                }
                            }
                            break;

                        case "installation":
                            if ( node.installation !== propertyValue ) {
                                switch( propertyValue ) {
                                    case "none":
                                    case "installation":
                                    case "feint-dummy":
                                        if ( node.symbolID !== undefined ) {
                                            node.symbolID = cws.addInstallationToSymbolId( node.symbolID, propertyValue );
                                        }
                                        node.installation = propertyValue;
                                        node.taskForce = "none";
                                        node.echelon = "none";
                                        node.mobility = "none";
                                        renderImage = true;
                                        break;

                                    default:
                                        this.logger.warnx( "incorrect installation property value: " + propertyValue );
                                        break;
                                }
                            }
                            break;

                        case "x":
                        case "y":
                        case "width":
                        case "height":
                        case "rotation":
                        case "controlPts":
                        case "symbolType":
                        case "":
                            if ( node.nodeType === "missionGfx" && !!propertyValue ) {
                                node[ propertyName ] = propertyValue;
                                renderImage = basicPropertiesMet( node );
                            }
                            break;

                        case "attributes":
                            if ( node.nodeType === "missionGfx" && !!propertyValue ) {
                                var attrs = propertyValue;
                                var attrsChanged = ( attrs.width !== node.width) || ( attrs.height !== node.height);
                                if ( attrsChanged ) {
                                    node.width = attrs.width;
                                    node.height= attrs.height;
                                    attrs.image = renderMsnGfx( node );
                                    modelDriver.kernel.setProperty( node.ID, propertyName, attrs );
                                    //renderImage = basicPropertiesMet( node );
                                    //value = propertyValue;
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

            if ( ( node.nodeType === "unit" ) || ( node.nodeType === "missionGfx" ) ) {
                
                switch ( propertyName ) {

                    case "image":
                        if ( node.nodeType === "unit" ) {
                            value = node[ propertyName ];
                        }
                        break;

                    case "symbolID":
                    case "description":
                    case "fullName":
                    case "tagName":
                    case "echelon":
                    case "affiliation":
                    case "unitStatus":
                    case "mobility":
                    case "taskForce":
                    case "installation":
                    case "x":
                    case "y":
                    case "width":
                    case "height":
                    case "controlPts":
                    case "visible":
                    case "listening":
                    case "symbolType":
                        value = node[ propertyName ];
                        break;
                }

            } else if ( node.nodeType === "modifier" ) {
                
                var unit = this.state.nodes[ node.parentID ];

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
            id = modelDriver.kernel.prototype( id );
        }
                
        return prototypes;
    }

    function isUnitNode( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/mil-sym/unit.vwf" );
            }
        }
       return found;
    } 

    function isMissionGfxNode( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/mil-sym/missionGfx.vwf" );
            }
        }
       return found;
    } 

    function isModifierNode( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/mil-sym/modifier.vwf" );
            }
        }
       return found;
    } 

    function render( node ) {

        if ( node === undefined ) {
            return;
        }

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
            //modelDriver.kernel.fireEvent( node.ID, "imageRendered", [ node.image, imgSize, centerPt, symbolBounds ] );
            
            modelDriver.kernel.callMethod( node.ID, "handleRender", [ node.image, imgSize, centerPt, symbolBounds ] );

        } else if ( node !== undefined && node.nodeType === "missionGfx" && node.symbolID !== undefined ) {
            if ( value = renderMsnGfx( node ) ) {
                modelDriver.kernel.setProperty( node.ID, "image", value );
            }
        }

        return value;       
    }

    function renderMsnGfx( node ) {
        var value = undefined;

        if ( basicPropertiesMet( node ) ) {
            // Convert control points from Konva style array to mil-sym string
            var controlPts = getMilSymControlPts( node.controlPts ); 
            var rendererMP = sec.web.renderer.SECWebRenderer;
            var scale = 100.0;
            var renderer = armyc2.c2sd.renderer;
            var msa = renderer.utilities.MilStdAttributes;
            var rs = renderer.utilities.RendererSettings;
            var symUtil = renderer.utilities.SymbolUtilities;
            var symbolCode = node.symbolID;
            var format = 3; // GeoCanvas
            
            // Set affiliation in symbol id
            if ( !!node.affiliation ) {
                symbolCode = cws.addAffiliationToSymbolId( node.symbolID, node.affiliation );
            }
            
            var img = rendererMP.RenderSymbol2D("ID","Name","Description", symbolCode, controlPts, node.width, node.height, null, node.modifiers, format);

            if ( !!img && !!img.image ) {
                value = img.image.toDataURL();
            }
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
                    modelDriver.logger.errorx( "setModifier", "Unknown type (", modObj.type, ") specified." );
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
                    modelDriver.logger.errorx( "getModifier", "Unknown type (", modObj.type, ") specified." );
                    return value;
            }

            value = unit.modifiers[ modifierActualName ];            
        }
         
        return value;
    }

    function computeRelativeControlPts( controlPts, width, height ) {
        var newControlPts = [];

        if ( ( !!width && !!height ) && ( width > 0 ) && ( height > 0 ) ) {
            // Some control points are computed relative to the width and height of the containing object
            // Compute and return the adjusted control points in this instance
            for ( var i = 0; i < controlPts.length; i+2 ) {
                var x = konvaControlPts[i] * width;
                var y = konvaControlPts[i+1] * height;
                newControlPts.push( x );
                newControlPts.push( y );
            }
        }

        return newControlPts;
    }

    function getMilSymControlPts( konvaControlPts ) {
        var milSymControlPts = "";
        // konva-style is composed of an array where even numbered elements are x and odd are y
        // mil-sym style is a string where pairs of x and y are separated by spaces
        for ( var i = 0; i < konvaControlPts.length; i=i+2 ) {
            milSymControlPts = milSymControlPts + konvaControlPts[i] + "," + konvaControlPts[i+1];
            if ( i < konvaControlPts.length-2 ) {
                milSymControlPts = milSymControlPts + " ";
            }
        }

        return milSymControlPts;
    }

    function basicPropertiesMet( node ) {
        var basicsMet = false;

        if ( node !== undefined ) {
            switch (node.nodeType) {
                case "unit":
                    break;
                case "missionGfx":
                    basicsMet = ( 
                        ( node.symbolID !== undefined ) && 
                        ( node.x !== undefined ) && 
                        ( node.y !== undefined ) && 
                        ( node.width !== undefined ) && 
                        ( node.height !== undefined ) && 
                        ( node.width > 0 ) && 
                        ( node.height > 0 ) &&
                        (!!node.controlPts && ( node.controlPts.length > 0 ) ) 
                        );
                        break;
            }
        }

        return basicsMet;
    }
    
} );
