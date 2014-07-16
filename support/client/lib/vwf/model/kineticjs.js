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


	
define( [ "module", "vwf/model", "vwf/utility", "vwf/utility/color" ], function( module, model, utility, color ) {

    var self;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            
            self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            if ( options === undefined ) { 
                options = {}; 
            }

            this.state = {
                "nodes": {},
                "stages": {},
                "prototypes": {},
                "createNode": function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {
                    return {
                        "parentID": nodeID,
                        "ID": childID,
                        "extendsID": childExtendsID,
                        "implementsIDs": childImplementsIDs,
                        "source": childSource,
                        "type": childType,
                        "name": childName,
                        "prototypes": undefined,
                        "kineticObj": undefined
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
                "methods": false,
                "prototypes": false
            };
           
        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childURI, childName, callback ) {

            // If the parent nodeID is 0, this node is attached directly to the root and is therefore either 
            // the scene or a prototype.  In either of those cases, save the uri of the new node
            var childURI = ( nodeID === 0 ? childIndex : undefined );

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            // If the node being created is a prototype, construct it and add it to the array of prototypes,
            // and then return
            var prototypeID = ifPrototypeGetId( nodeID, childID );
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

            var protos = getPrototypes.call( this, childExtendsID );

            var node;
            if ( isKineticComponent( protos ) ) {
                
                node = this.state.createNode( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback );
                
                node.prototypes = protos;
               
                node.kineticObj = createKineticObject( node );

                //node.kineticObj = new Kinetic.Stage( { container: "vwf-stage", width:800, height: 600 } );

                if ( this.state.nodes[ nodeID ] !== undefined ) {
                    var parent = this.state.nodes[ nodeID ];
                    if ( parent.kineticObj && parent.kineticObj instanceof Kinetic.Container ) {
                        parent.kineticObj.add( node.kineticObj );    
                    }
                }

            }
           
        },

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {

            if ( this.debug.initializing ) {
                this.logger.infox( "initializingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            } 


        },
         
        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            if ( this.debug.deleting ) {
                this.logger.infox( "deletingNode", nodeID );
            }

            if ( this.state.nodes[ nodeID ] !== undefined ) {
                delete this.state.nodes[ nodeID ];
            }
            
        },

        // -- addingChild ------------------------------------------------------------------------
        
        // addingChild: function( nodeID, childID, childName ) {
        //     if ( this.debug.parenting ) {
        //         this.logger.infox( "addingChild", nodeID, childID, childName );
        //     }
        // },


        // -- movingChild ------------------------------------------------------------------------
        
        movingChild: function( nodeID, childID, childName ) {
            if ( this.debug.parenting ) {
                this.logger.infox( "movingChild", nodeID, childID, childName );
            }
        },


        // -- removingChild ------------------------------------------------------------------------
        
        // removingChild: function( nodeID, childID, childName ) {
        //     if ( this.debug.parenting ) {
        //         this.logger.infox( "removingChild", nodeID, childID, childName );
        //     }
        // },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;

            if ( this.debug.properties ) {
                this.logger.infox( "C === creatingProperty ", nodeID, propertyName, propertyValue );
            }

            var node = this.state.nodes[ nodeID ];
            if ( node !== undefined ) {
                value = this.settingProperty( nodeID, propertyName, propertyValue );                  
            }

            return value;
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;

            if ( this.debug.properties ) {
                this.logger.infox( "  I === initializingProperty ", nodeID, propertyName, propertyValue );
            }

            var node = this.state.nodes[ nodeID ];
            if ( node !== undefined ) {
                value = this.settingProperty( nodeID, propertyName, propertyValue );                  
            }

            return value;
            
        },
        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
          
            if ( this.debug.properties || this.debug.setting ) {
                this.logger.infox( "    S === settingProperty ", nodeID, propertyName, propertyValue );
            }          
            var node = this.state.nodes[nodeID];
            var imageObj;
            var value = undefined;
            if ( node && node.kineticObj && utility.validPropertyValue( propertyValue ) ) {
                
                if ( kineticObj instanceof Kinetic.Node ) {

                    // 'id' will be set to the nodeID
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                        // need to think this over
                        // case "image":
                        //     imageObj = new Image();
                        //     imageObj.onload = function() {
                        //         kineticObj.image = imageObj;
                        //     }
                        //     imageObj.src = propertyValue;
                        //     break;
                        case "x":
                            kineticObj.x( Number( propertyValue ) );
                            break;

                        case "y":
                            kineticObj.y( Number( propertyValue ) );
                            break;

                        case "width":
                            kineticObj.width( Number( propertyValue ) );
                            break;

                        case "height":
                            kineticObj.height( Number( propertyValue ) );
                            break;

                        case "visible":
                            if ( propertyValue === 'inherit' ) {
                                kineticObj.visible( propertyValue );
                            } else {
                                kineticObj.visible( Boolean( propertyValue ) );    
                            }
                            break;

                        case "listening":
                            if ( propertyValue === 'inherit' ) {
                                kineticObj.listening( propertyValue );
                            } else {
                                kineticObj.listening( Boolean( propertyValue ) );    
                            }
                            break;
                        
                        case "opacity":
                            kineticObj.opacity( parseFloat( propertyValue ) );
                            break;

                        case "scale":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.scale( { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.scale( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;

                        case "scaleX":
                            kineticObj.scaleX( Number( propertyValue ) );
                            break;

                        case "scaleY":
                            kineticObj.scaleY( Number( propertyValue ) );
                            break;

                        case "rotation":
                            kineticObj.rotation( Number( propertyValue ) );
                            break;

                        // check code, not in docs
                        case "offset":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.offset( { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.offset( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;

                        // check code, not in docs
                        case "offsetX":
                            kineticObj.offsetX( Number( propertyValue ) );
                            break;

                        case "offsetY":
                            kineticObj.offsetY( Number( propertyValue ) );
                            break;

                        case "draggable":
                            kineticObj.draggable( Boolean( propertyValue ) );    
                            break;

                        // check code, not in docs
                        case "dragDistance":
                            kineticObj.dragDistance( Number( propertyValue ) );    
                            break;

                        case "dragBoundFunc":
                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && kineticObj instanceof Kinetic.Shape ) {

                    value = propertyValue;
                    
                    switch ( propertyName ) {

                        case "fill":
                            var vwfColor = new utility.color( propertyValue );
                            if ( vwfColor ) {
                                kineticObj.fill( vwfColor.toString() );
                            }
                            break;

                        case "fillRed":
                            kineticObj.fillRed( Number( propertyValue ) );
                            break;

                        case "fillGreen":
                            kineticObj.fillGreen( Number( propertyValue ) );
                            break;
 
                        case "fillGreen":
                            kineticObj.fillGreen( Number( propertyValue ) );
                            break;
 
                        case "fillAlpha":
                            kineticObj.fillAlpha( parseFloat( propertyValue ) );
                            break;

                        case "fillPatternImage":
                            // TO-DO create image and set the src?
                            kineticObj.fillPatternImage( propertyValue );
                            break;

                        case "fillPatternX":
                            kineticObj.fillPatternX( Number( propertyValue ) );
                            break;

                        case "fillPatternY":
                            kineticObj.fillPatternY( Number( propertyValue ) );
                            break;
  
                        case "fillPatternOffset":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.fillPatternOffset( { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.fillPatternOffset( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;

                        case "fillPatternOffsetX":
                            kineticObj.fillPatternOffsetX( Number( propertyValue ) );
                            break;

                        case "fillPatternOffsetY":
                            kineticObj.fillPatternOffsetX( Number( propertyValue ) );
                            break;

                        case "fillPatternScale":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.fillPatternScale( { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.fillPatternScale( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;

                        case "fillPatternScaleX":
                            kineticObj.fillPatternScaleX( Number( propertyValue ) );
                            break;

                        case "fillPatternScaleY":
                            kineticObj.fillPatternScaleY( Number( propertyValue ) );
                            break;

                        case "fillPatternRotation":
                            kineticObj.fillPatternRotation( Number( propertyValue ) );
                            break;

                        case "fillPatternRepeat":
                            switch( propertyValue ) {
                                
                                case "repeat":
                                case "repeat-x":
                                case "repeat-y":
                                case "no-repeat":
                                    kineticObj.fillPatternRepeat( propertyValue );
                                    break; 

                                default:
                                    this.logger.warnx( "incorrect value for fillPatternRepeat: " + propertyValue );
                                    break;
                            }   
                            break;


                        case "fillLinearGradientStartPoint":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.fillLinearGradientStartPoint( { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.fillLinearGradientStartPoint( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;

                        case "fillLinearGradientStartPointX":
                            kineticObj.fillLinearGradientStartPointX( Number( propertyValue ) );
                            break;

                        case "fillLinearGradientStartPointY":
                            kineticObj.fillLinearGradientStartPointY( Number( propertyValue ) );
                            break;

                        case "fillLinearGradientEndPoint":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.fillLinearGradientEndPoint( { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.fillLinearGradientEndPoint( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;

                        case "fillLinearGradientEndPointX":
                            kineticObj.fillLinearGradientEndPointX( Number( propertyValue ) );
                            break;

                        case "fillLinearGradientEndPointY":
                            kineticObj.fillLinearGradientEndPointY( Number( propertyValue ) );
                            break;

                        case "fillLinearGradientColorStops":
                            kineticObj.fillLinearGradientColorStops( propertyValue );
                            break;

                        case "fillRadialGradientStartPoint":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.fillRadialGradientStartPoint( { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.fillRadialGradientStartPoint( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;

                        case "fillRadialGradientStartPointX":
                            kineticObj.fillRadialGradientStartPointX( Number( propertyValue ) );
                            break;

                        case "fillRadialGradientStartPointY":
                            kineticObj.fillRadialGradientStartPointX( Number( propertyValue ) );
                            break;

                        case "fillRadialGradientEndPoint":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.fillRadialGradientEndPoint( { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.fillRadialGradientEndPoint( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;

                        case "fillRadialGradientEndPointX":
                            kineticObj.fillRadialGradientEndPointX( Number( propertyValue ) );
                            break;

                        case "fillRadialGradientEndPointY":
                            kineticObj.fillRadialGradientEndPointY( Number( propertyValue ) );
                            break;

                        case "fillRadialGradientStartRadius":
                            kineticObj.fillRadialGradientStartRadius( Number( propertyValue ) );
                            break;

                        case "fillRadialGradientEndRadius":
                            kineticObj.fillRadialGradientEndRadius( Number( propertyValue ) );
                            break;

                        case "fillRadialGradientColorStops":
                            kineticObj.fillRadialGradientColorStops( propertyValue );
                            break;

                        case "fillEnabled":
                            kineticObj.fillEnabled( Boolean( propertyValue ) );
                            break;

                        case "fillPriority":
                            switch( propertyValue ) {
                                
                                case "color":
                                case "pattern":
                                case "linear-gradient":
                                case "radial-gradient":
                                    kineticObj.fillPriority( propertyValue );
                                    break; 

                                default:
                                    this.logger.warnx( "incorrect value for fillPriority: " + propertyValue );
                                    break;
                            }   
                            break;

                        case "stroke":
                            var vwfColor = new utility.color( propertyValue );
                            if ( vwfColor ) {
                                kineticObj.stroke( vwfColor.toString() );
                            }
                            break;

                        case "strokeRed":
                            kineticObj.strokeRed( Number( propertyValue ) );
                            break;

                        case "strokeGreen":
                            kineticObj.strokeGreen( Number( propertyValue ) );
                            break;

                        case "strokeBlue":
                            kineticObj.strokeBlue( Number( propertyValue ) );
                            break;

                        case "strokeAlpha":
                            kineticObj.strokeAlpha( parseFloat( propertyValue ) );
                            break; 

                        case "strokeWidth":
                            kineticObj.strokeWidth( Number( propertyValue ) );
                            break;

                        case "strokeScaleEnabled":
                            kineticObj.strokeScaleEnabled( Boolean( propertyValue ) );
                            break;

                        case "strokeEnabled":
                            kineticObj.strokeEnabled( Boolean( propertyValue ) );
                            break;

                        case "lineJoin":
                            switch( propertyValue ) {
                                
                                case "miter":
                                case "round":
                                case "bevel":
                                    kineticObj.lineJoin( propertyValue );
                                    break; 

                                default:
                                    this.logger.warnx( "incorrect value for lineJoin: " + propertyValue );
                                    break;
                            }   
                            break;

                        case "lineCap":
                            switch( propertyValue ) {
                                
                                case "butt":
                                case "round":
                                case "square":
                                    kineticObj.lineCap( propertyValue );
                                    break; 

                                default:
                                    this.logger.warnx( "incorrect value for lineCap: " + propertyValue );
                                    break;
                            }   
                            break;

                        case "shadowColor":
                            var vwfColor = new utility.color( propertyValue );
                            if ( vwfColor ) {
                                kineticObj.shadowColor( vwfColor.toString() );
                            }
                            break;

                        case "shadowRed":
                            kineticObj.shadowRed( Number( propertyValue ) );
                            break;

                        case "shadowGreen":
                            kineticObj.shadowGreen( Number( propertyValue ) );
                            break;

                        case "shadowBlue":
                            kineticObj.shadowBlue( Number( propertyValue ) );
                            break;

                        case "shadowBlue":
                            kineticObj.shadowBlue( parseFloat( propertyValue ) );
                            break;

                        case "shadowBlur":
                            kineticObj.shadowBlur( Number( propertyValue ) );
                            break;

                        case "shadowOffset":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.shadowOffset( { { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.shadowOffset( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;                        
                        
                        case "shadowOffsetX":
                            kineticObj.shadowOffsetX( Number( propertyValue ) );
                            break;                        
                        case "shadowOffsetY":
                            kineticObj.shadowOffsetY( Number( propertyValue ) );
                            break;
                        
                        case "shadowOpacity":
                            kineticObj.shadowOpacity( parseFloat( propertyValue ) );
                            break;

                        case "shadowEnabled":
                            kineticObj.shadowEnabled( Boolean( propertyValue ) );
                            break;                        
                        
                        case "dash":
                            kineticObj.shadowEnabled( propertyValue );
                            break;  

                        case "dashEnabled": 
                            kineticObj.shadowEnabled( Boolean( propertyValue ) );
                            break; 

                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && kineticObj instanceof Kinetic.Container ) {
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "clipFunc":
                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && kineticObj instanceof Kinetic.Arc ) {
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "angle":
                            kineticObj.angle( Number( propertyValue ) );
                            break;

                        case "innerRadius":
                            kineticObj.innerRadius( Number( propertyValue ) );
                            break;

                        case "outerRadius":
                            kineticObj.outerRadius( Number( propertyValue ) );
                            break;

                        case "clockwise":
                            kineticObj.shadowEnabled( Boolean( propertyValue ) );
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && 
                    ( kineticObj instanceof Kinetic.BaseLayer || 
                      kineticObj instanceof Kinetic.FastLayer ||
                      kineticObj instanceof Kinetic.Layer
                    ) ) {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                        case "clearBeforeDraw":
                            kineticObj.clearBeforeDraw( Boolean( propertyValue ) );
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }                    
                }

                if ( value === undefined && kineticObj instanceof Kinetic.Canvas ) {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                        case width:
                            kineticObj.setWidth( Number( propertyValue ) );
                            break;

                        case height:
                            kineticObj.setHeight( Number( propertyValue ) );
                            break;

                        case pixelRatio:
                            kineticObj.setPixelRatio( parseFloat( propertyValue ) );
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }  
                }                

                if ( value === undefined && kineticObj instanceof Kinetic.Circle ) {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                        case "radius":
                            kineticObj.radius( Number( propertyValue ) );
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }                    
                }


                if ( value === undefined && kineticObj instanceof Kinetic.Ellipse ) {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                        case "radius":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.radius( { { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.radius( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }                    
                }

                if ( value === undefined && kineticObj instanceof Kinetic.Image ) {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                        // need to think this over
                        // case "image":
                        //     imageObj = new Image();
                        //     imageObj.onload = function() {
                        //         kineticObj.image = imageObj;
                        //     }
                        //     imageObj.src = propertyValue;
                        //     break;

                        case "crop":
                            if ( propertyValue instanceof Array ) { 
                                var cropObj = {
                                    "x": Number( propertyValue[ 0 ] ),
                                    "y": Number( propertyValue[ 1 ] ),
                                    "width": Number( propertyValue[ 2 ] ),
                                    "height": Number( propertyValue[ 3 ] )    
                                }

                                kineticObj.crop( cropObj );
                            } else {
                                kineticObj.crop( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ),
                                    "width": Number( propertyValue.width ), "height":  Number( propertyValue.height )
                                } );
                            } 
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }                    
                }

                if ( value === undefined && kineticObj instanceof Kinetic.Line )
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "points":
                            kineticObj.points( propertyValue );
                            break;

                        case "tension":
                            kineticObj.tension( Number( propertyValue ) );
                            break;

                        case "closed":
                            kineticObj.closed( Boolean( propertyValue ) );
                            break;

                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && kineticObj instanceof Kinetic.Path )
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "data":
                            kineticObj.data( propertyValue );
                            break;

                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && kineticObj instanceof Kinetic.Rect )
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "cornerRadius":
                            kineticObj.cornerRadius( Number( propertyValue ) );
                            break;

                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && kineticObj instanceof Kinetic.RegularPolygon )
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "sides":
                            kineticObj.sides( Number( propertyValue ) );
                            break;

                        case "radius":
                            kineticObj.radius( Number( propertyValue ) );
                            break;

                        default:
                            value = undefined;
                            break;
                    }
                }
            
                if ( value === undefined && kineticObj instanceof Kinetic.Ring )
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "innerRadius":
                            kineticObj.innerRadius( Number( propertyValue ) );
                            break;

                        case "outerRadius":
                            kineticObj.outerRadius( Number( propertyValue ) );
                            break;

                        case "clockwise":
                            kineticObj.clockwise( Boolean( propertyValue ) );
                            break;

                        default:
                            value = undefined;
                            break;
                    }
                }
                
                if ( value === undefined && kineticObj instanceof Kinetic.Sprite )
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "animation":
                            kineticObj.animation( propertyValue );
                            break;

                        case "animations":
                            kineticObj.animations( JSON.eval( propertyValue ) ) );
                            break;

                        case "frameIndex":
                            kineticObj.frameIndex( Number( propertyValue ) );
                            break;

                        // need to think this over
                        // case "image":
                        //     imageObj = new Image();
                        //     imageObj.onload = function() {
                        //         kineticObj.image = imageObj;
                        //     }
                        //     imageObj.src = propertyValue;
                        //     break;

                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && kineticObj instanceof Kinetic.Star )
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "numPoints":
                            kineticObj.animation( Number( propertyValue ) );
                            break;

                        case "innerRadius":
                            kineticObj.innerRadius( Number( propertyValue ) ) );
                            break;

                        case "outerRadius":
                            kineticObj.outerRadius( Number( propertyValue ) );
                            break;

                        default:
                            value = undefined;
                            break;
                    }
                }


                if ( value === undefined && kineticObj instanceof Kinetic.Text )
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "fontFamily":
                            kineticObj.fontFamily( propertyValue );
                            break;

                        case "fontSize":
                            kineticObj.fontSize( Number( propertyValue ) );
                            break;

                        case "fontStyle":
                            switch( propertyValue ) {
                                
                                case "normal":
                                case "bold":
                                case "italic":
                                    kineticObj.fontStyle( propertyValue );
                                    break; 

                                default:
                                    this.logger.warnx( "incorrect value for fontStyle: " + propertyValue );
                                    break;
                            }   
                            break;

                        case "fontVariant":
                            switch( propertyValue ) {
                                
                                case "normal":
                                case "small-caps":
                                    kineticObj.fontVariant( propertyValue );
                                    break; 

                                default:
                                    this.logger.warnx( "incorrect value for fontVariant: " + propertyValue );
                                    break;
                            }   
                            break;

                        case "text":
                            kineticObj.text( propertyValue );
                            break;

                        case "align":
                            switch( propertyValue ) {
                                
                                case "left":
                                case "center":
                                case "right":
                                    kineticObj.align( propertyValue );
                                    break; 

                                default:
                                    this.logger.warnx( "incorrect value for align: " + propertyValue );
                                    break;
                            }   
                            break;

                        case "padding":
                            kineticObj.padding( Number( propertyValue ) );
                            break;

                        case "width":
                            kineticObj.width( Number( propertyValue ) );
                            break;

                        case "height":
                            kineticObj.height( Number( propertyValue ) );
                            break; 

                        case "lineHeight":
                            kineticObj.lineHeight( Number( propertyValue ) );
                            break;

                        case "wrap":
                            switch( propertyValue ) {
                                
                                case "word":
                                case "char":
                                case "none":
                                    kineticObj.wrap( propertyValue );
                                    break; 

                                default:
                                    this.logger.warnx( "incorrect value for wrap: " + propertyValue );
                                    break;
                            }   
                            break;

                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && kineticObj instanceof Kinetic.TextPath )
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "fontFamily":
                            kineticObj.fontFamily( propertyValue );
                            break;

                        case "fontSize":
                            kineticObj.fontSize( Number( propertyValue ) );
                            break;

                        case "fontStyle":
                            switch( propertyValue ) {
                                
                                case "normal":
                                case "bold":
                                case "italic":
                                    kineticObj.fontStyle( propertyValue );
                                    break; 

                                default:
                                    this.logger.warnx( "incorrect value for fontStyle: " + propertyValue );
                                    break;
                            }   
                            break;

                        case "fontVariant":
                            switch( propertyValue ) {
                                
                                case "normal":
                                case "small-caps":
                                    kineticObj.fontVariant( propertyValue );
                                    break; 

                                default:
                                    this.logger.warnx( "incorrect value for fontVariant: " + propertyValue );
                                    break;
                            }   
                            break;

                        case "text":
                            kineticObj.text( propertyValue );
                            break;

                        case "data":
                            kineticObj.data( propertyValue );
                            break;

                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && kineticObj instanceof Kinetic.Wedge )
                    value = propertyValue;
                    
                    switch ( propertyName ) {
                        
                        case "angle":
                            kineticObj.angle( Number( propertyValue ) );
                            break;

                        case "radius":
                            kineticObj.radius( Number( propertyValue ) );
                            break;

                        case "clockwise":
                            kineticObj.clockwise( Boolean( propertyValue ) );
                            break;

                        default:
                            value = undefined;
                            break;
                    }
                }

            }
            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debug.properties || this.debug.getting ) {
                this.logger.infox( "   G === gettingProperty ", nodeID, propertyName );
            }

            var node = this.state.nodes[nodeID];
            var value = undefined;
            if ( node ) {
                var kineticObj = node.kineticObj;
                if ( kineticObj !== undefined ) {
                                    
                    switch ( propertyName ) {
                        case "image":
                            if ( kineticObj.image ) {
                                value = kineticObj.image.src;
                            }
                            break;
                        case "size":
                            value = [ kineticObj.width, kineticObj.height ];
                            break;
                        case "position":
                            value = [ kineticObj.x, kineticObj.y ];
                            break;
                        case "width":
                            value = kineticObj.width;
                            break;
                        case "height":
                            value = kineticObj.height;
                            break;
                        case "x":
                            value = kineticObj.x;
                            break;
                        case "y":
                            value = kineticObj.y;
                            break;
                        case "canvasDefinition":
                            value = "cd";
                            break;
                        default:
                            value = undefined;
                            break;
                    }
                }
            }
            if ( value !== undefined ) {
            propertyValue = value;
            }
            //console.log(["kinetic get returns: ",value]);
            return value;
        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters
            if ( this.debug.methods ) {
                this.logger.infox( "   M === callingMethod ", nodeID, methodName );
            }
        },


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

        // executing: function( nodeID, scriptText, scriptType ) {
        //     return undefined;
        // },

        // ticking: function( vwfTime ) {
        // }

    } );
    // == PRIVATE  ========================================================================================

    function ifPrototypeGetId( nodeID, childID ) {
        var ptID = undefined;
        if ( ( nodeID === 0 && childID != self.kernel.application() ) || self.state.prototypes[ nodeID ] !== undefined ) {
            if ( nodeID !== 0 || childID != self.kernel.application() ) {
                ptID = nodeID ? nodeID : childID;
                if ( self.state.prototypes[ ptID ] !== undefined ) {
                    ptID = childID;
                }
                return ptID;
            } 
        }
        return undefined;
    }


    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }

    function isKineticComponent( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[ i ].indexOf( "http-vwf-example-com-kinetic-" ) != -1 );    
            }
        }
        return found;
    }

    function createKineticObject( node, config ) {
        var protos = node.prototypes;
        var kineticObj = undefined;

        if ( isKineticClass( protos, "kinetic-arc-vwf" ) || isKineticClass( protos, "kinetic.arc.vwf" ) ) {
            kineticObj = new Kinetic.Arc( config || {} );
        } else if ( isKineticClass( protos, "baselayer-arc-vwf" ) || isKineticClass( protos, "baselayer.arc.vwf" ) ) {
            kineticObj = new Kinetic.Arc( config || {} );
        } else if ( isKineticClass( protos, "canvas-arc-vwf" ) || isKineticClass( protos, "canvas.arc.vwf" ) ) {
            kineticObj = new Kinetic.Canvas( config || {} );
        } else if ( isKineticClass( protos, "circle-arc-vwf" ) || isKineticClass( protos, "circle.arc.vwf" ) ) {
            kineticObj = new Kinetic.Circle( config || {} );
        } else if ( isKineticClass( protos, "ellipse-arc-vwf" ) || isKineticClass( protos, "ellipse.arc.vwf" ) ) {
            kineticObj = new Kinetic.Ellipse( config || {} );
        } else if ( isKineticClass( protos, "fastlayer-arc-vwf" ) || isKineticClass( protos, "fastlayer.arc.vwf" ) ) {
            kineticObj = new Kinetic.FastLayer( config || {} );
        } else if ( isKineticClass( protos, "group-arc-vwf" ) || isKineticClass( protos, "group.arc.vwf" ) ) {
            kineticObj = new Kinetic.Group( config || {} );
        } else if ( isKineticClass( protos, "image-arc-vwf" ) || isKineticClass( protos, "image.arc.vwf" ) ) {
            kineticObj = new Kinetic.Image( config || {} );
        } else if ( isKineticClass( protos, "layer-arc-vwf" ) || isKineticClass( protos, "layer.arc.vwf" ) ) {
            kineticObj = new Kinetic.Layer( config || {} );
        } else if ( isKineticClass( protos, "line-arc-vwf" ) || isKineticClass( protos, "line.arc.vwf" ) ) {
            kineticObj = new Kinetic.Line( config || {} );
        } else if ( isKineticClass( protos, "path-arc-vwf" ) || isKineticClass( protos, "path.arc.vwf" ) ) {
            kineticObj = new Kinetic.Path( config || {} );
        } else if ( isKineticClass( protos, "rect-arc-vwf" ) || isKineticClass( protos, "rect.arc.vwf" ) ) {
            kineticObj = new Kinetic.Rect( config || {} );
        } else if ( isKineticClass( protos, "regularpolygon-arc-vwf" ) || isKineticClass( protos, "regularpolygon.arc.vwf" ) ) {
            kineticObj = new Kinetic.RegularPolygon( config || {} );
        } else if ( isKineticClass( protos, "ring-arc-vwf" ) || isKineticClass( protos, "ring.arc.vwf" ) ) {
            kineticObj = new Kinetic.Ring( config || {} );
        } else if ( isKineticClass( protos, "sprite-arc-vwf" ) || isKineticClass( protos, "sprite.arc.vwf" ) ) {
            kineticObj = new Kinetic.Sprite( config || {} );
        } else if ( isKineticClass( protos, "stage-arc-vwf" ) || isKineticClass( protos, "stage.arc.vwf" ) ) {
            kineticObj = new Kinetic.Stage( config || {} );
        } else if ( isKineticClass( protos, "star-arc-vwf" ) || isKineticClass( protos, "star.arc.vwf" ) ) {
            kineticObj = new Kinetic.Star( config || {} );
        } else if ( isKineticClass( protos, "text-arc-vwf" ) || isKineticClass( protos, "text.arc.vwf" ) ) {
            kineticObj = new Kinetic.Text( config || {} );
        } else if ( isKineticClass( protos, "textpath-arc-vwf" ) || isKineticClass( protos, "textpath.arc.vwf" ) ) {
            kineticObj = new Kinetic.TextPath( config || {} );
        } else if ( isKineticClass( protos, "wedge-arc-vwf" ) || isKineticClass( protos, "wedge.arc.vwf" ) ) {
            kineticObj = new Kinetic.Wedge( config || {} );
        } else if ( isKineticClass( protos, "shape-arc-vwf" ) || isKineticClass( protos, "shape.arc.vwf" ) ) {
            kineticObj = new Kinetic.Shape( config || {} );
        } else if ( isKineticClass( protos, "container-arc-vwf" ) || isKineticClass( protos, "container.arc.vwf" ) ) {
            kineticObj = new Kinetic.Container( config || {} );
        } else if ( isKineticClass( protos, "node-arc-vwf" ) || isKineticClass( protos, "node.arc.vwf" ) ) {
            kineticObj = new Kinetic.Node( config || {} );
        }

        if ( kineticObj !== undefined ) {
            kineticObj.setId( node.ID ); 
            kineticObj.name( node.name );   
        }
        return kineticObj;
    }

    function isKineticClass( prototypes, classID ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[ i ].indexOf( classID ) );    
            }
        }
        return found;        
    }


    function isStageDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http-vwf-example-com-kinetic-stage-vwf"  );    
            }
        }
        return found;
    }
    function isLayerDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http-vwf-example-com-kinetic-layer-vwf" );    
            }
        }
        return found;
    }
    function isCanvasDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http-vwf-example-com-kinetic-canvas-vwf" );    
            }
        }
        return found;
    }
    function isShapeDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http-vwf-example-com-kinetic-shape-vwf" );    
            }
        }
        return found;
    }
    function isContainerDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http-vwf-example-com-kinetic-container-vwf" );    
            }
        }
        return found;
    }
    function isNodeDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http-vwf-example-com-kinetic-node-vwf" );    
            }
        }
        return found;
    }
    function findChild( parentObj, childName ) {
        return undefined;
    }
});
