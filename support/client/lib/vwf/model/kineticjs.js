"use strict";
	
define( [ "module", 
          "vwf/model", 
          "vwf/utility", 
          "vwf/utility/color" 
        ], function( module, model, utility, color ) {

    var modelDriver;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
            modelDriver = this;

            this.arguments = Array.prototype.slice.call( arguments );

            this.options = ( options !== undefined ) ? options : {}; 

            this.state = {
                "nodes": {},
                "draggingNodes": {},
                "stages": {},
                "prototypes": {},
                "createLocalNode": function( nodeID, childID, childExtendsID, childImplementsIDs,
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
                        "kineticObj": undefined,
                        "stage": undefined,
                        "hasMouseAndTouchEvents": false,
                        "model": {}                    };
                },
                "isKineticClass": function( prototypes, classID ) {
                    if ( prototypes ) {
                        for ( var i = 0; i < prototypes.length; i++ ) {
                            if ( prototypes[ i ] === classID ) {
                                //console.info( "prototypes[ i ]: " + prototypes[ i ] );
                                return true;
                            }
                        }
                    }
                    return false;        
                },
                "isKineticComponent": function( prototypes ) {
                    var found = false;
                    if ( prototypes ) {
                        for ( var i = 0; i < prototypes.length && !found; i++ ) {
                            found = ( prototypes[ i ] === "http://vwf.example.com/kinetic/node.vwf" );
                        }
                    }
                    return found;
                },
                "setProperty": function( kineticObj, propertyName, propertyValue ) {

                    //console.info( "setProperty("+propertyName+", "+ propertyValue+")" );

                    var value = undefined;

                    if ( !kineticObj ) {
                        return value;
                    }

                    value = this.setNodeProperty( kineticObj, propertyName, propertyValue );

                    if ( value === undefined && ( kineticObj.nodeType === "Shape" ) ) {
                        value = this.setShapeProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Container ) {
                        value = this.setContainerProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Arc ) {
                        value = this.setArcProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && 
                        ( kineticObj instanceof Kinetic.BaseLayer || 
                          kineticObj instanceof Kinetic.FastLayer ||
                          kineticObj instanceof Kinetic.Layer
                        ) ) {
                        value = this.setLayerProperty( kineticObj, propertyName, propertyValue );                  
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Canvas ) {
                        value = this.setCanvasProperty( kineticObj, propertyName, propertyValue );  
                    }                

                    if ( value === undefined && kineticObj instanceof Kinetic.Circle ) {
                        value = this.setCircleProperty( kineticObj, propertyName, propertyValue );                   
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Ellipse ) {
                        value = this.setEllipseProperty( kineticObj, propertyName, propertyValue )                   
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Image ) {
                        value = this.setImageProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Line ) {
                        value = this.setLineProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Path ) {
                        value = this.setPathProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Rect ) {
                        value = this.setRectProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.RegularPolygon ) {
                        value = this.setRegularPolygonProperty( kineticObj, propertyName, propertyValue );
                    }
            
                    if ( value === undefined && kineticObj instanceof Kinetic.Ring ) {
                        value = this.setRingProperty( kineticObj, propertyName, propertyValue );
                    }
                
                    if ( value === undefined && kineticObj instanceof Kinetic.Sprite ) {
                        value = this.setSpriteProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Star ) {
                        value = this.setStarProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Text ) {
                        value = this.setTextProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.TextPath ) {
                        value = this.setTextPathProperty( kineticObj, propertyName, propertyValue );
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Wedge ) {
                        value = this.setWedgeProperty( kineticObj, propertyName, propertyValue );
                    }
                    return value;                    
                },
                "setNodeProperty": function( kineticObj, propertyName, propertyValue ) {

                    var value = propertyValue;

                    switch ( propertyName ) {

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
                                kineticObj.modelScaleX = Number( propertyValue[ 0 ] );
                                kineticObj.modelScaleY = Number( propertyValue[ 1 ] ); 
                            } else {
                                kineticObj.modelScaleX = Number( propertyValue.x );
                                kineticObj.modelScaleY = Number( propertyValue.y );
                            }
                            break;

                        case "scaleX":
                            kineticObj.modelScaleX = Number( propertyValue );
                            break;

                        case "scaleY":
                            kineticObj.modelScaleY = Number( propertyValue );
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
                            // Store the model value separately in case the view wants
                            // to change the value for one user
                            kineticObj.isDraggable = Boolean( propertyValue );

                            // Set the view value from the model value
                            kineticObj.draggable( kineticObj.isDraggable );    
                            break;

                        // check code, not in docs
                        case "dragDistance":
                            kineticObj.dragDistance( Number( propertyValue ) );    
                            break;

                        case "zIndex":
                            kineticObj.setZIndex( Number( propertyValue ) );
                            break;

                        case "position":
                            if ( propertyValue instanceof Array ) {
                                kineticObj.setPosition( { 
                                    x: Number( propertyValue[ 0 ] ), 
                                    y: Number( propertyValue[ 1 ] )
                                } );
                            } else {
                                kineticObj.setPosition( { 
                                    x: propertyValue.x, 
                                    y: propertyValue.y
                                } );
                            }
                            break;
                            
                        case "absolutePosition":

                            // // Store the current absolute position because we are about to tamper 
                            // // with the view value to get kinetic to compute the new model values 
                            // // for us.  If uniqueInView is true, we should not change the view 
                            // // value, so we will need to put this one back.
                            // var oldAbsolutePosition = kineticObj.getAbsolutePosition();

                            // Compute new modelX and modelY values
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.setAbsolutePosition( { 
                                    "x": Number( propertyValue[ 0 ] ), 
                                    "y": Number( propertyValue[ 1 ] ) 
                                });
                            } else {
                                kineticObj.setAbsolutePosition( { 
                                    "x": Number( propertyValue.x ), 
                                    "y":  Number( propertyValue.y ) 
                                });
                            }
                            // kineticObj.modelX = kineticObj.x();
                            // kineticObj.modelY = kineticObj.y();

                            // // If each user has a unique view value, setting the model value should
                            // // not change the view value, so we set the original view value back now
                            // // that we are done using it to calculate the new model value.
                            // if ( node.uniqueInView ) {
                            //     kineticObj.setAbsolutePosition( oldAbsolutePosition );
                            // }
                            break;

                        case "dragBoundFunc":
                            var functionString = propertyValue;
                            if ( !utility.isString( functionString ) ) {
                                modelDriver.logger.errorx( "setNodeProperty", 
                                    "The value of dragBoundFunc should be a string of the " +
                                    "function to be used." );
                                break;
                            }
                            kineticObj.dragBoundFunc( eval( "(" + functionString + ")" ) );
                            break;

                        case "transform":
                        case "absoluteTransform":
                        case "absoluteOpacity":
                        case "absoluteZIndex":
                            modelDriver.logger.errorx( "setNodeProperty", "Cannot set property ", propertyName );
                            value = undefined;
                            break;

                        case "attributes":
                            // Special case for images, don't overwrite a valid image with a bogus object
                            var attrs = propertyValue;
                            if ( ( kineticObj instanceof Konva.Image ) && ( kineticObj.image() instanceof Image ) && propertyValue.image && !( propertyValue.image instanceof Image ) ) {
                                attrs.image = kineticObj.image();
                            }
                            kineticObj.setAttrs( attrs || {} );
                            break;

                        default:
                            value = undefined;
                            break;
                    }
                    return value;
                },
                "setShapeProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;
                    
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

                        case "fillBlue":
                            kineticObj.fillGreen( Number( propertyValue ) );
                            break;

                        case "fillAlpha":
                            kineticObj.fillAlpha( parseFloat( propertyValue ) );
                            break;

                        case "fillPatternImage":
                            if ( utility.validObject( propertyValue ) ) {
                                var imageObj = kineticObj.fillPatternImage();
                                if ( imageObj !== undefined ) {
                                    imageObj.src = propertyValue;
                                } else {
                                    imageObj = new Image();
                                    imageObj.onload = function() {
                                        kineticObj.fillPatternImage( imageObj );
                                    };
                                    imageObj.src = propertyValue;                                
                                }
                            }
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
                            kineticObj.fillPatternOffsetY( Number( propertyValue ) );
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
                                    modelDriver.logger.warnx( "incorrect value for fillPatternRepeat: " + propertyValue );
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
                                    modelDriver.logger.warnx( "incorrect value for fillPriority: " + propertyValue );
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
                                    modelDriver.logger.warnx( "incorrect value for lineJoin: " + propertyValue );
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
                                    modelDriver.logger.warnx( "incorrect value for lineCap: " + propertyValue );
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
                                kineticObj.shadowOffset( { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
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
                            kineticObj.dash( propertyValue );
                            break;  

                        case "dashEnabled": 
                            kineticObj.dashEnabled( Boolean( propertyValue ) );
                            break; 

                        default:
                            value = undefined;
                            break;
                    } 
                    return value;  
                },
                "setArcProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;
                    
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
                            kineticObj.clockwise( Boolean( propertyValue ) );
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }

                    return value;
                },
                "setCanvasProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;
                    
                    switch ( propertyName ) {

                        case "clearBeforeDraw":
                            kineticObj.clearBeforeDraw( Boolean( propertyValue ) );
                            break;
                        
                        case "hitGraphEnabled":
                            kineticObj.hitGraphEnabled( Boolean(propertyValue) );
                            break;

                        case "width":
                            kineticObj.setWidth( Number( propertyValue ) );
                            break;

                        case "height":
                            kineticObj.setHeight( Number( propertyValue ) );
                            break;

                        case "pixelRatio":
                            kineticObj.setPixelRatio( parseFloat( propertyValue ) );
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }  
                    return value;     
                },
                "setContainerProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

                    switch ( propertyName ) {
                    
                        case "clipFunc":
                        default:
                            value = undefined;
                            break;
                    }

                    return value; 
                },
                "setLayerProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

                    switch ( propertyName ) {

                        case "clearBeforeDraw":
                            kineticObj.clearBeforeDraw( Boolean( propertyValue ) );
                            break;
                        
                        case "hitGraphEnabled":
                            kineticObj.hitGraphEnabled( Boolean(propertyValue) );
                            break;

                        default:
                            value = undefined;
                            break;
                    } 

                    return value;
                },
                "setCircleProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

                    switch ( propertyName ) {

                        case "radius":
                            kineticObj.radius( Number( propertyValue ) );
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }                    
                    return value; 
                },
                "setEllipseProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

                    switch ( propertyName ) {

                        case "radius":
                            if ( propertyValue instanceof Array ) { 
                                kineticObj.radius( { "x": Number( propertyValue[ 0 ] ), "y": Number( propertyValue[ 1 ] ) });
                            } else {
                                kineticObj.radius( { "x": Number( propertyValue.x ), "y":  Number( propertyValue.y ) });
                            } 
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }                    

                    return value; 
                },
                "setImageProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

                    switch ( propertyName ) {

                        case "image":
                            if ( utility.validObject( propertyValue ) ) {
                                loadImage( kineticObj, propertyValue );
                            }
                            break;

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

                        case "scaleOnLoad":
                            //node.scaleOnLoad = Boolean( propertyValue );
                            break;
                        
                        default:
                            value = undefined;
                            break;
                    }                    

                    return value; 
                },
                "setLineProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

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

                    return value;
                },
                "setPathProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

                    switch ( propertyName ) {
                        
                        case "data":
                            kineticObj.data( propertyValue );
                            break;

                        default:
                            value = undefined;
                            break;
                    }

                    return value; 
                },
                "setRectProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

                    switch ( propertyName ) {
                        
                        case "cornerRadius":
                            kineticObj.cornerRadius( Number( propertyValue ) );
                            break;

                        default:
                            value = undefined;
                            break;
                    }

                    return value;         
                },
                "setRegularPolygonProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

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

                    return value;
                },
                "setRingProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

                    switch ( propertyName ) {
                        
                        case "innerRadius":
                            kineticObj.innerRadius( Number( propertyValue ) );
                            break;

                        case "outerRadius":
                            kineticObj.outerRadius( Number( propertyValue ) );
                            break;

                        default:
                            value = undefined;
                            break;
                    }

                    return value; 
                },
                "setSpriteProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

                    switch ( propertyName ) {
                        
                        case "animation":
                            kineticObj.animation( propertyValue );
                            break;

                        case "animations":
                            kineticObj.animations( JSON.eval( propertyValue ) );
                            break;

                        case "frameIndex":
                            kineticObj.frameIndex( Number( propertyValue ) );
                            break;

                        case "image":
                            if ( utility.validObject( propertyValue ) ) {
                                loadImage( kineticObj, propertyValue );
                            }
                            break;

                        case "scaleOnLoad":
                            //node.scaleOnLoad = Boolean( propertyValue );
                            break;

                        default:
                            value = undefined;
                            break;
                    }

                    return value;         
                },
                "setStarProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

                    switch ( propertyName ) {
                        
                        case "numPoints":
                            kineticObj.animation( Number( propertyValue ) );
                            break;

                        case "innerRadius":
                            kineticObj.innerRadius( Number( propertyValue ) );
                            break;

                        case "outerRadius":
                            kineticObj.outerRadius( Number( propertyValue ) );
                            break;

                        default:
                            value = undefined;
                            break;
                    }        
                    return value;
                },
                "setTextProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

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
                                    modelDriver.logger.warnx( "incorrect value for fontStyle: " + propertyValue );
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
                                    modelDriver.logger.warnx( "incorrect value for fontVariant: " + propertyValue );
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
                                    modelDriver.logger.warnx( "incorrect value for align: " + propertyValue );
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
                                    modelDriver.logger.warnx( "incorrect value for wrap: " + propertyValue );
                                    break;
                            }   
                            break;

                        default:
                            value = undefined;
                            break;
                    }

                    return value; 
                },
                "setTextPathProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

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
                                    modelDriver.logger.warnx( "incorrect value for fontStyle: " + propertyValue );
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
                                    modelDriver.logger.warnx( "incorrect value for fontVariant: " + propertyValue );
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

                    return value;         
                }, 
                "setWedgeProperty": function( kineticObj, propertyName, propertyValue ) {
                    var value = propertyValue;

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
                    return value;
                },
                "getProperty": function( kineticObj, propertyName ) {
                    var value = undefined;
                    if ( !kineticObj ) {
                        return value;
                    }

                    //if ( value === undefined ) {

                        switch ( propertyName ) {

                            case "x":
                                value = kineticObj.x() || 0;
                                break;

                            case "y":
                                value = kineticObj.y() || 0;
                                break;

                            case "width":
                                value = kineticObj.width();
                                break;

                            case "height":
                                value = kineticObj.height();
                                break;

                            case "visible":
                                value = kineticObj.visible();
                                break;

                            case "isVisible":
                                value = kineticObj.isVisible();
                                break;

                            case "listening":
                                value = kineticObj.listening();
                                break;
                            
                            case "isListening":
                                value = kineticObj.isListening();
                                break;
                            
                            case "opacity":
                                value = kineticObj.opacity();
                                break;

                            case "scale":
                                value = kineticObj.scale();
                                break;

                            case "scaleX":
                                value = kineticObj.scaleX();
                                break;

                            case "scaleY":
                                value = kineticObj.scaleY();
                                break;

                            case "rotation":
                                value = kineticObj.rotation();
                                break;

                            // check code, not in docs
                            case "offset":
                                value = kineticObj.offset();
                                break;

                            // check code, not in docs
                            case "offsetX":
                                value = kineticObj.offsetX();
                                break;

                            case "offsetY":
                                value = kineticObj.offsetY();
                                break;

                            case "draggable":
                                // Return the model value that we have stored separately, 
                                // not the value that is directly in the kinetic object 
                                // because a user's view might have changed that for only 
                                // that user
                                value = kineticObj.isDraggable;    
                                break;

                            // check code, not in docs
                            case "dragDistance":
                                value = kineticObj.dragDistance();    
                                break;

                            case "zIndex":
                                value = kineticObj.getZIndex();
                                break;

                            case "dragBoundFunc":
                                var dragBoundFunc = kineticObj.dragBoundFunc();
                                value = dragBoundFunc ? dragBoundFunc.toString() : undefined;
                                break;

                            case "id":
                                value = kineticObj.getId();
                                break

                            case "name":
                                value = kineticObj.getName();
                                break;
                            
                            case "position":
                                value = {
                                    x: kineticObj.x() || 0,
                                    y: kineticObj.y() || 0
                                };
                                break;

                            case "transform":
                                value = kineticObj.getTransform().m;
                                break;

                            case "absolutePosition":
                                    value = kineticObj.getAbsolutePosition();
                                break;

                            case "absoluteTransform":
                                    value = kineticObj.getAbsoluteTransform();
                                break;

                            case "absoluteOpacity":
                                value = kineticObj.getAbsoluteOpacity();
                                break;

                            case "absoluteZIndex":
                                value = kineticObj.getAbsoluteZIndex();
                                break;

                            case "attributes":
                                value = kineticObj.getAttrs();
                                break;

                        }
                    //}

                    // this is causing the editor to cause a infinite loop
                    // need to understand why, but no time now

                    // if ( value === undefined && kineticObj instanceof Kinetic.Stage ) {
                        
                    //     switch ( propertyName ) {
                            
                    //         case "container":
                    //             value = kineticObj.getAttr( 'container' );
                    //             break;
                    //     }
                    // }

                    if ( value === undefined && kineticObj instanceof Kinetic.Arc ) {
                        
                        switch ( propertyName ) {
                            
                            case "angle":
                                value = kineticObj.angle();
                                break;

                            case "innerRadius":
                                value = kineticObj.innerRadius();
                                break;

                            case "outerRadius":
                                value = kineticObj.outerRadius();
                                break;

                            case "clockwise":
                                value = kineticObj.clockwise();
                                break;
                        }
                    }

                    if ( value === undefined && 
                        ( kineticObj instanceof Kinetic.BaseLayer || 
                          kineticObj instanceof Kinetic.FastLayer ||
                          kineticObj instanceof Kinetic.Layer
                        ) ) {
                       
                        switch ( propertyName ) {

                            case "clearBeforeDraw":
                                value = kineticObj.clearBeforeDraw();
                                break;
                        }                    
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Canvas ) {
                        
                        switch ( propertyName ) {

                            case width:
                                value = kineticObj.getWidth();
                                break;

                            case height:
                                value = kineticObj.getHeight();
                                break;

                            case pixelRatio:
                                value = kineticObj.getPixelRatio();
                                break;
                        }  
                    }                

                    if ( value === undefined && kineticObj instanceof Kinetic.Circle ) {
                        
                        switch ( propertyName ) {

                            case "radius":
                                value = kineticObj.radius();
                                break;

                        }                    
                    }


                    if ( value === undefined && kineticObj instanceof Kinetic.Ellipse ) {
                        
                        switch ( propertyName ) {

                            case "radius":
                                value = kineticObj.radius();
                                break;
                        }                    
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Image ) {
                        
                        switch ( propertyName ) {

                            case "image":
                                var imageObj = kineticObj.image();
                                if ( imageObj !== undefined ) {
                                    value = imageObj.src;    
                                }
                                break;

                            case "crop":
                                value = kineticObj.crop();
                                break;

                            case "scaleOnLoad":
                                    //value = node.scaleOnLoad;
                                break;
                            
                        }                    
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Line ) {
                        
                        switch ( propertyName ) {
                            
                            case "points":
                                value = kineticObj.points();
                                break;

                            case "tension":
                                value = kineticObj.tension();
                                break;

                            case "closed":
                                value = kineticObj.closed();
                                break;
                        }
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Path ) {
                        
                        switch ( propertyName ) {
                            
                            case "data":
                                value = kineticObj.data();
                                break;

                        }
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Rect ) {
                        
                        switch ( propertyName ) {
                            
                            case "cornerRadius":
                                value = kineticObj.cornerRadius();
                                break;
                        }
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.RegularPolygon ) {
                        
                        switch ( propertyName ) {
                            
                            case "sides":
                                value = kineticObj.sides();
                                break;

                            case "radius":
                                value = kineticObj.radius();
                                break;
                        }
                    }
                
                    if ( value === undefined && kineticObj instanceof Kinetic.Ring ) {
                        
                        switch ( propertyName ) {
                            
                            case "innerRadius":
                                value = kineticObj.innerRadius();
                                break;

                            case "outerRadius":
                                value = kineticObj.outerRadius();
                                break;
                        }
                    }
                    
                    if ( value === undefined && kineticObj instanceof Kinetic.Sprite ) {
                        
                        switch ( propertyName ) {
                            
                            case "animation":
                                value = kineticObj.animation();
                                break;

                            case "animations":
                                value = JSON.stringify( kineticObj.animations() );
                                break;

                            case "frameIndex":
                                value = kineticObj.frameIndex();
                                break;

                            case "image":
                                var imageObj = kineticObj.image();
                                if ( imageObj !== undefined ) {
                                    value = imageObj.src;    
                                }
                                break;

                            case "scaleOnLoad":
                                    //value = node.scaleOnLoad;
                                break;
                        }
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Star ) {
                        
                        switch ( propertyName ) {
                            
                            case "numPoints":
                                value = kineticObj.animation();
                                break;

                            case "innerRadius":
                                value = kineticObj.innerRadius();
                                break;

                            case "outerRadius":
                                value = kineticObj.outerRadius();
                                break;
                        }
                    }


                    if ( value === undefined && kineticObj instanceof Kinetic.Text ) {
                        
                        switch ( propertyName ) {
                            
                            case "fontFamily":
                                value = kineticObj.fontFamily();
                                break;

                            case "fontSize":
                                value = kineticObj.fontSize();
                                break;

                            case "fontStyle":
                                value = kineticObj.fontStyle();
                                break;

                            case "fontVariant":
                                value = kineticObj.fontVariant();
                                break;

                            case "text":
                                value = kineticObj.text();
                                break;

                            case "align":
                                value = kineticObj.align();
                                break;

                            case "padding":
                                value = kineticObj.padding();
                                break;

                            case "width":
                                value = kineticObj.width();
                                break;

                            case "height":
                                value = kineticObj.height();
                                break; 

                            case "lineHeight":
                                value = kineticObj.lineHeight();
                                break;

                            case "wrap":
                                value = kineticObj.wrap();
                                break;
                        }
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.TextPath ) {
                        
                        switch ( propertyName ) {
                            
                            case "fontFamily":
                                value = kineticObj.fontFamily();
                                break;

                            case "fontSize":
                                value = kineticObj.fontSize();
                                break;

                            case "fontStyle":
                                value = kineticObj.fontStyle();
                                break;

                            case "fontVariant":
                                value = kineticObj.fontVariant();
                                break;

                            case "text":
                                value = kineticObj.text();
                                break;

                            case "data":
                                value = kineticObj.data();
                                break;
                        }
                    }

                    if ( value === undefined && kineticObj instanceof Kinetic.Wedge ) {
                        
                        switch ( propertyName ) {
                            
                            case "angle":
                                value = kineticObj.angle();
                                break;

                            case "radius":
                                value = kineticObj.radius();
                                break;

                            case "clockwise":
                                kineticObj.clockwise();
                                break;
                        }
                    }

                    return value;
                }
            };

            // turns on logger debugger console messages 
            this.debug = {
                "creation": false,
                "native": false,
                "initializing": false,
                "parenting": false,
                "deleting": false,
                "properties": false,
                "setting": false,
                "getting": false,
                "methods": false,
                "events": false,
                "prototypes": false
            };
           
        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            var appID = this.kernel.application();

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName );
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
                    name: childName
                };
                return;                
            }

            var protos = getPrototypes( this.kernel, childExtendsID );

            var node;

            if ( this.state.isKineticComponent( protos ) ) {

                if ( this.debug.native ) {
                    this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName );
                }
                
                // Create the local copy of the node properties
                if ( this.state.nodes[ childID ] === undefined ){
                    this.state.nodes[ childID ] = this.state.createLocalNode( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback );
                }

                node = this.state.nodes[ childID ];
                
                node.prototypes = protos;

                //if ( !this.kernel.client() || ( this.kernel.client() === this.kernel.moniker() ) ) {                   
                if ( !isNodeInHierarchy( node ) ) {
                    node.kineticObj = createKineticObject( node );

                    // If the kineticObj was created, attach it to the parent kineticObj
                    // (if the parent is a kinetic container)
                    // (if a kineticObj is created asynchronously ... like an Image, it will be
                    // undefined here, but will be added to its parent in the appropriate callback)
                    addNodeToHierarchy( node );
                }

            }
           
        },

        // initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
        //     childSource, childType, childIndex, childName ) {

        //     if ( this.debug.initializing ) {
        //         this.logger.infox( "initializingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
        //     } 


        // },
         
        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            if ( this.debug.deleting ) {
                this.logger.infox( "deletingNode", nodeID );
            }

            if ( this.state.nodes[ nodeID ] !== undefined ) {
                
                var node = this.state.nodes[ nodeID ];
                if ( node.kineticObj !== undefined ) {
                    // removes and destroys object
                    node.kineticObj.remove();
                    node.kineticObj.destroy();
                    node.kineticObj = undefined;    
                }                

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

            if ( this.state.nodes[ childID ] !== undefined ) {
                
                if ( this.state.nodes[ nodeID ] !== undefined ) {
                    var parentNode = this.state.nodes[ nodeID ];
                    
                    if ( isContainerDefinition( parentNode.prototypes ) && parentNode.kineticObj ) {
                        
                        var node = this.state.nodes[ childID ];
                        if ( node.kineticObj !== undefined ) {
                            // removes object only
                            node.kineticObj.remove();
                            parentNode.kineticObj.add( node.kineticObj );
                        } 
                    }
                }               
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

            if ( this.debug.properties ) {
                this.logger.infox( "C === creatingProperty ", nodeID, propertyName, propertyValue );
            }
            return this.settingProperty( nodeID, propertyName, propertyValue );;
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debug.properties ) {
                this.logger.infox( "  I === initializingProperty ", nodeID, propertyName, propertyValue );
            }
            return this.settingProperty( nodeID, propertyName, propertyValue );;
            
        },
        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
          
            if ( this.debug.properties || this.debug.setting ) {
                this.logger.infox( "    S === settingProperty ", nodeID, propertyName, propertyValue );
            }          
            var node = this.state.nodes[ nodeID ];
            var imageObj;
            var value = undefined;
            if ( node && utility.validObject( propertyValue ) ) {
                if ( node.kineticObj ) {
                    if ( node.model[ propertyName ] === undefined ) {
                        //this.logger.infox( "    - model value does not exist " );
                        // Not unique-in-view
                        value = this.state.setProperty( node.kineticObj, propertyName, propertyValue );

                        switch ( propertyName ) {
                            case "position":
                            case "stroke":
                            case "strokeWidth":
                            case "fill":
                            case "radius":
                                if ( node.kineticObj.nodeType !== "Stage" ) {
                                    node.model[ propertyName ] = 
                                    {
                                        "value":    propertyValue,
                                        "isStatic": false
                                    };
                                }
                                break;

                            default:
                                break;
                        }
                    //} else if ( !node.model[ propertyName ].isStatic ) {
                        // Not unique-in-view
                    //    value = this.state.setProperty( node.kineticObj, propertyName, node.model[ propertyName ].value );

                    } else {
                        if ( propertyName === "position" ) {

                            node.model[ propertyName ].value = propertyValue;

                            if ( node.model[ propertyName ].ignoreNextPositionUpdate ) {
                                //this.logger.infox( "    - ignore position update this time " );
                                node.model[ propertyName ].ignoreNextPositionUpdate = false;
                            } else if ( !node.model[ propertyName ].isStatic ) {
                                //this.logger.infox( "    - set position to model value " );
                                value = this.state.setProperty( node.kineticObj, propertyName, node.model[ propertyName ].value ); 
                            }

                        } else if ( !node.model[ propertyName ].isStatic ) {
                            //this.logger.infox( "    - not unique in view, update property " );
                            node.model[ propertyName ].value = propertyValue;
                            value = this.state.setProperty( node.kineticObj, propertyName, node.model[ propertyName ].value );
                        } else {
                            //this.logger.infox( "    - unique in view, update model only " );
                            node.model[ propertyName ].value = propertyValue;
                        }
                        /*
                        if ( this.kernel.client() === this.kernel.moniker() ) {
                            node.model[ propertyName ].value = propertyValue;
                            value = this.state.setProperty( node.kineticObj, propertyName, propertyValue );
                        } else {
                            node.model[ propertyName ].value = propertyValue;
                        }
                        */
                    }
                } else {
                    node.model[ propertyName ] = propertyValue;
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
            if ( node && node.kineticObj ) {
                var kineticObj = node.kineticObj;

                if ( node.model[ propertyName ] ) {
                    value = node.model[ propertyName ].value;
                } else {
                    value = this.state.getProperty( kineticObj, propertyName );    
                }
            }
            if ( value !== undefined ) {
                propertyValue = value;
            }

            return value;
        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters, methodValue ) { 
            if ( this.debug.methods ) {
                this.logger.infox( "   M === callingMethod ", nodeID, methodName );
            }

            switch( methodName ) {
                case "moveToTop":
                case "moveToBottom":
                    var node = this.state.nodes[ nodeID ];
                    var toTop = ( methodName === "moveToTop" );
                    var params = null;
                    if ( methodParameters.length > 0 ) {
                        params = methodParameters[0];
                    }
                    if ( node && ( this.kernel.client() === this.kernel.moniker() ) ) {
                        if ( node.kineticObj ) {
                            if ( params && params[ "includeParent" ] && node.kineticObj.parent ) {
                               ( toTop ? node.kineticObj.parent.moveToTop() : node.kineticObj.parent.moveToBottom() );
                            }
                            ( toTop ? node.kineticObj.moveToTop() : node.kineticObj.moveToBottom() );
                            if ( params && ( params[ "orderChildren" ].length > 0 ) && ( node.kineticObj.children.length > 0 ) ) {
                                // Search for children with these names and elevate them to top
                                for ( var i = 0; i < params.orderChildren.length; i++ ) {
                                    for ( var j = 0; j < node.kineticObj.children.length; j++ ) {
                                        if ( node.kineticObj.children[ j ] && ( node.kineticObj.children[ j ].name() === params.orderChildren[ i ] ) ) {
                                            ( toTop ? node.kineticObj.children[ j ].moveToTop() : node.kineticObj.children[ j ].moveToBottom() );
                                        }
                                    }
                                }
                            }
                        }
                    }
                    break;
                case "childListening":
                    var node = this.state.nodes[ nodeID ];
                    var params = null;
                    if ( methodParameters.length > 0 ) {
                        params = methodParameters[0];
                    }
                    if ( node && ( this.kernel.client() === this.kernel.moniker() ) ) {
                        if ( node.kineticObj ) {
                            if ( params ) {
                                if ( ( params[ "children" ].length > 0 ) && ( node.kineticObj.children.length > 0 ) ) {
                                    // Search for children with these names and set their listening values
                                    for ( var i = 0; i < params.children.length; i++ ) {
                                        for ( var j = 0; j < node.kineticObj.children.length; j++ ) {
                                            if ( node.kineticObj.children[ j ] && ( node.kineticObj.children[ j ].name() === params.children[ i ] ) ) {
                                                node.kineticObj.children[ j ].listening( params.listening );
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    break;
            }
        },

        // -- executing ------------------------------------------------------------------------------

        // executing: function( nodeID, scriptText, scriptType ) {
        //     return undefined;
        // },

        // ticking: function( vwfTime ) {
        // }

    } );
    // == PRIVATE  ========================================================================================

    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }

    function createKineticObject( node, config ) {
        var protos = node.prototypes;
        var kineticObj = undefined;

        if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/arc.vwf" ) ) {
            kineticObj = new Kinetic.Arc( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/baseLayer.vwf" ) ) {
            kineticObj = new Kinetic.BaseLayer( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/canvas.vwf" ) ) {
            kineticObj = new Kinetic.Canvas( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/circle.vwf" ) ) {
            kineticObj = new Kinetic.Circle( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/ellipse.vwf" ) ) {
            kineticObj = new Kinetic.Ellipse( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/fastLayer.vwf" ) ) {
            kineticObj = new Kinetic.FastLayer( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/group.vwf" ) ) {
            kineticObj = new Kinetic.Group( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/image.vwf" ) ) {
            var imageObj = new Image();
            node.scaleOnLoad = false;
            kineticObj = new Kinetic.Image( {
                image: imageObj
            } );
            if ( node.source !== undefined ) {
                imageObj.src = node.source;    
            }
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/layer.vwf" ) ) {
            kineticObj = new Kinetic.Layer( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/line.vwf" ) ) {
            kineticObj = new Kinetic.Line( config || { "points": [] } );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/path.vwf" ) ) {
            kineticObj = new Kinetic.Path( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/rect.vwf" ) ) {
            kineticObj = new Kinetic.Rect( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/regularPolygon.vwf" ) ) {
            kineticObj = new Kinetic.RegularPolygon( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/ring.vwf" ) ) {
            kineticObj = new Kinetic.Ring( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/sprite.vwf" ) ) {
            var imageObj = new Image();
            node.scaleOnLoad = false;
            kineticObj = new Kinetic.Sprite( {
                image: imageObj
            } );
            if ( node.source !== undefined ) {
                imageObj.src = node.source;    
            }
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/stage.vwf" ) ) {
            var stageWidth = ( window && window.innerWidth ) ? window.innerWidth : 800;
            var stageHeight = ( window && window.innerHeight ) ? window.innerHeight : 600;
            var stageContainer = ( config && config.container ) || 'vwf-root';
            var stageWidth = ( config && config.width ) || stageWidth;
            var stageHeight = ( config && config.height ) || stageHeight;
            var stageDef = {
                "container": stageContainer, 
                "width": stageWidth, 
                "height": stageHeight 
            };
            kineticObj = new Kinetic.Stage( stageDef );
            modelDriver.state.stages[ node.ID ] = kineticObj;
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/star.vwf" ) ) {
            kineticObj = new Kinetic.Star( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/text.vwf" ) ) {
            kineticObj = new Kinetic.Text( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/textPath.vwf" ) ) {
            kineticObj = new Kinetic.TextPath( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/wedge.vwf" ) ) {
            kineticObj = new Kinetic.Wedge( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/shape.vwf" ) ) {
            kineticObj = new Kinetic.Shape( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/container.vwf" ) ) {
            kineticObj = new Kinetic.Container( config || {} );
        } else if ( modelDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/node.vwf" ) ) {
            kineticObj = new Kinetic.Node( config || {} );
        }

        return kineticObj;
    }

    function findStage( kineticObj ) {

        var stage = undefined
        var parent = kineticObj;
        while ( parent !== undefined && stage === undefined ) {
            if ( parent.nodeType === "Stage" ) {
                stage = parent;
            }
            parent = parent.parent;
        }
        return stage;
        
    }

    function addNodeToHierarchy( node ) {
        
        if ( node.kineticObj ) {
            if ( modelDriver.state.nodes[ node.parentID ] !== undefined ) {
                var parent = modelDriver.state.nodes[ node.parentID ];
                if ( parent.kineticObj && isContainerDefinition( parent.prototypes ) ) {
                    
                    if ( parent.children === undefined ) {
                        parent.children = [];    
                    }
                    parent.children.push( node.ID );
                    //console.info( "Adding child: " + childID + " to " + nodeID );
                    parent.kineticObj.add( node.kineticObj );    
                }
            }
            node.kineticObj.setId( node.ID ); 
            node.kineticObj.name( node.name ); 

            node.stage = findStage( node.kineticObj );
        }

    } 

    function isNodeInHierarchy( node ) {
        var foundNode = false;

        if ( modelDriver.state.nodes[ node.parentID ] ) {
            var parent = modelDriver.state.nodes[ node.parentID ];
            if ( parent.children ) {
                for ( var i = 0; i < parent.children.length && !foundNode; i++ ) {
                    foundNode = ( parent.children[ i ] === node.ID );
                }
            }
        }

        return foundNode;
    }

    function isStageDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/kinetic/stage.vwf"  );
            }
        }
        return found;
    }
    function isLayerDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/kinetic/layer.vwf" );
            }
        }
        return found;
    }
    function isCanvasDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/kinetic/canvas.vwf" );
            }
        }
        return found;
    }
    function isShapeDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/kinetic/shape.vwf" );
            }
        }
        return found;
    }
    function isContainerDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/kinetic/container.vwf" );
            }
        }
        return found;
    }
    function isNodeDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/kinetic/node.vwf" );
            }
        }
        return found;
    }

    function isSymbolDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/mil-sym/unitIcon.vwf" );
            }
        }
        return found;
    }

    function loadImage( kineticObj, url ) {
        
        var imageObj = kineticObj.image();
        var validImage = ( imageObj && ( imageObj !== undefined ) && ( imageObj instanceof Image ) ); 
        var width = kineticObj.width();
        var height = kineticObj.height();
        var nodeID = kineticObj.id();
        var node = modelDriver.state.nodes[ nodeID ];

        if ( isSymbolDefinition( node.prototypes ) ) {
            kineticObj.setZIndex( 100 );
        }
        
        if ( !validImage ) {
            imageObj = new Image();    
        }

        imageObj.onload = function() {
            if ( !validImage ) {
                kineticObj.image( imageObj );
            }
            if ( node.scaleOnLoad ) {

                if ( width > height ) {
                    kineticObj.scale( { "x": width / imageObj.width ,"y": width / imageObj.width } );
                } else {
                    kineticObj.scale( { "x": height / imageObj.height ,"y": height / imageObj.height } );
                }
            }
            //modelDriver.kernel.fireEvent( node.ID, "imageLoaded", [ url ] );
            modelDriver.kernel.fireEvent( nodeID, "imageLoaded", [ url ] );
        }
        imageObj.onerror = function() {
            modelDriver.logger.errorx( "loadImage", "Invalid image url:", url );
                imageObj.src = oldSrc;
            //modelDriver.kernel.fireEvent( node.ID, "imageLoadError", [ url ] );
            modelDriver.kernel.fireEvent( nodeID, "imageLoadError", [ url ] );
        }

        var oldSrc = imageObj.src;
        if ( url !== oldSrc ) {
            imageObj.src = url;
        }
    }

});
