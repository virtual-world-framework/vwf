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

  
    
define( [ "module", "vwf/model", "vwf/utility", "vwf/utility/color" ], function( module, model, utility, Color ) {


    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
            checkCompatibility.call( this );

            if ( options === undefined ) { options = {}; }

            this.state.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
            this.state.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }
            this.state.prototypes = {}; 


            // turns on logger debugger console messages 
            
            this.debug = {
                "creation": false,
                "initializing": false,
                "parenting": false,
                "properties": false,
                "setting": false,
                "getting": false
            };
       
        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            var childURI = nodeID === 0 ? childIndex : undefined;

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            var self = this;
            var kernel = this.kernel;

            var prototypeID = ifPrototypeGetId.call( this, nodeID, childID );
            if ( prototypeID !== undefined ) {
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
            
            var node = undefined, parentNode, sceneNode;
            var protos = getPrototypes.call( this, childExtendsID );

            var createNode = function() {
                return {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsIDs: childImplementsIDs,
                    source: childSource,
                    type: childType,
                    name: childName,
                    loadComplete: callback,
                    prototypes: protos
                };
            }; 
            
            if ( isCesium.call( this, protos ) ) {

                if ( this.state.scenes[ childID ] === undefined ) {
                    this.state.scenes[ childID ] = node = createNode();
                }

            } else if ( isAtmosphere.call( this, protos ) ) {

                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                if ( parentNode && parentNode.scene ) {
                    parentNode.scene.skyAtmosphere = new Cesium.SkyAtmosphere();
                    node.cesiumObj = parentNode.scene.skyAtmosphere;
                }

            } else if ( isSkyBox.call( this, protos ) ) {

                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                if ( parentNode && parentNode.scene ) {
                    var skyBoxBaseUrl = '../vwf/model/Assets/Textures/SkyBox/tycho2t3_80';
                    parentNode.scene.skyBox = new Cesium.SkyBox({
                        positiveX : skyBoxBaseUrl + '_px.jpg',
                        negativeX : skyBoxBaseUrl + '_mx.jpg',
                        positiveY : skyBoxBaseUrl + '_py.jpg',
                        negativeY : skyBoxBaseUrl + '_my.jpg',
                        positiveZ : skyBoxBaseUrl + '_pz.jpg',
                        negativeZ : skyBoxBaseUrl + '_mz.jpg'
                    });
                    node.cesiumObj = parentNode.scene.skyBox;
                } 


            } else if ( isSun.call( this, protos ) ) {

                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                if ( parentNode && parentNode.scene ) {
                    parentNode.scene.sun = new Cesium.Sun();
                    node.cesiumObj = parentNode.scene.sun;
                } 

            } else if ( isBillboard.call( this, protos ) ) {


                this.state.nodes[ childID ] = node = createNode();
                sceneNode = findSceneNode.call( this, node );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode && parentNode.cesiumObj instanceof Cesium.DynamicObject ) {
                    node.cesiumObj = parentNode.cesiumObj.billboard;
                } else {
                    var canvas = document.createElement( 'canvas' );
                    canvas.width = 16;
                    canvas.height = 16;
                    var context2D = canvas.getContext( '2d' );
                    context2D.beginPath();
                    context2D.arc( 8, 8, 8, 0, Cesium.Math.TWO_PI, true );
                    context2D.closePath();
                    context2D.fillStyle = 'rgb(255, 255, 255)';
                    context2D.fill();

                    // this is making a collection per billboard, which 
                    // probably isn't exactly what we want, but without an
                    // idea of exactly how we'll be using billboards,
                    // I'm just going to leave this implementation as is
                    var bbCollection = new Cesium.BillboardCollection();
                    var textureAtlas = sceneNode.scene.getContext().createTextureAtlas( {
                        image : canvas
                    } );
                    bbCollection.setTextureAtlas( textureAtlas );

                    var bb = bbCollection.add( {
                        "color" : Cesium.Color.RED,
                        "scale" : 1,
                        "imageIndex": 0
                    } );

                    sceneNode.scene.getPrimitives().add( bbCollection );
                    
                    node.bbCollection = bbCollection; 
                    node.cesiumObj = bb;
                    
                }
                node.scene = sceneNode.scene;

            } else if ( isLabel.call( this, protos ) ) {
                this.state.nodes[ childID ] = node = createNode();
                sceneNode = findSceneNode.call( this, node );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode && parentNode.cesiumObj instanceof Cesium.DynamicObject ) {
                    node.cesiumObj = parentNode.cesiumObj.label;
                } else {
                    var labels = new Cesium.LabelCollection();
                    var lbl = labels.add( {
                        "font"      : '10px Helvetica',
                        "fillColor" : { red : 0.0, blue : 1.0, green : 1.0, alpha : 1.0 },
                        "outlineColor" : { red : 0.0, blue : 0.0, green : 0.0, alpha : 1.0 },
                        "outlineWidth" : 2,
                        "style" : Cesium.LabelStyle.FILL_AND_OUTLINE
                    } );
                    sceneNode.scene.getPrimitives().add( labels ); 

                    node.labelCollection = labels; 
                    node.cesiumObj = lbl;
                }
                node.scene = sceneNode.scene;                

            } else if ( isPolylineCollection.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createNode();
                sceneNode = findSceneNode.call( this, node );

                node.cesiumObj = new Cesium.PolylineCollection();
                node.scene = sceneNode.scene;     

            } else if ( isPolyline.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createNode();
                sceneNode = findSceneNode.call( this, node );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode && parentNode.cesiumObj instanceof Cesium.DynamicObject ) {
                    node.cesiumObj = parentNode.cesiumObj.polyline;
                } else { 
                    var primitives = sceneNode.scene.getPrimitives();               
                    if ( parentNode.cesiumObj && parentNode.cesiumObj instanceof Cesium.PolylineCollection ) {
                        node.polylineCollection = parentNode.cesiumObj;
                    }

                    if ( node.polylineCollection === undefined ) {
                        node.polylineCollection = new Cesium.PolylineCollection();
                    }

                    node.cesiumObj = node.polylineCollection.add( childSource );
                    primitives.add( node.polylineCollection );
                }
                node.scene = sceneNode.scene;  
            
            } else if ( isPolygon.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createNode();
                sceneNode = findSceneNode.call( this, node );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode && parentNode.cesiumObj instanceof Cesium.DynamicObject ) {
                    node.cesiumObj = parentNode.cesiumObj.polylgon;
                } else {  
                    var primitives = sceneNode.scene.getPrimitives();
                    node.cesiumObj = new Cesium.Polygon();
                    primitives.add( node.cesiumObj );
                }
                node.scene = sceneNode.scene; 

            } else if ( isMaterial.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createNode();
                var parentNode = this.state.nodes[ nodeID ];
                if ( parentNode && parentNode.cesiumObj ) {
                    node.cesiumObj = parentNode.cesiumObj.getMaterial();
                }
               
                // some material types will require a context, need to 
                // create a way of grabbing existing vs creating new
                var context = undefined;

                // if undefined or the wrong type, create a new material and
                // set on the parent node 
                if ( node.cesiumObj === undefined || ( childType && node.cesiumObj.type != childType ) ) {
                    node.cesiumObj = Cesium.Material.fromType( context, childType );
                    parentNode.cesiumObj.setMaterial( node.cesiumObj );
                }                

            } else if ( isCamera.call( this, protos ) ) {
                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                var sceneNode = findSceneNode.call( this, node );

                if ( childName == "camera" ) {
                    node.cesiumObj = sceneNode.scene.getCamera();
                } else {
                    var camera = new Camera(canvas);
                    camera.position = new Cartesian3();
                    camera.direction = Cartesian3.UNIT_Z.negate();
                    camera.up = Cartesian3.UNIT_Y;
                    camera.frustum.fovy = CesiumMath.PI_OVER_THREE;
                    camera.frustum.near = 1.0;
                    camera.frustum.far = 2.0;  
                    node.cesiumObj = camera;              
                }
                
            } else if ( isDynamicObject.call( this, protos ) ) {
                this.state.nodes[ childID ] = node = createNode();
                var sceneNode = findSceneNode.call( this, node );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode ) {

                    if ( parentNode.dynObjs ) {
                        node.cesiumObj = parentNode.dynObjs.getObject( childName );
                    }
                }
              
            } else if ( isNode3.call( this, protos ) ) {
                this.state.nodes[ childID ] = node = createNode();
                var sceneNode = findSceneNode.call( this, node );
                parentNode = findParent.call( this, nodeID );

                switch ( childType ) {
                    
                    case "model/vnd.google-earth.kmz":
                        break;

                    case "model/vnd.google-earth.kml+xml":
                        break;

                    case "model/vnd.cesium.czml+xml":
                        node.dynObjs = new Cesium.DynamicObjectCollection();

                        // Create the standard CZML visualizer collection
                        node.visualizers = Cesium.VisualizerCollection.createCzmlStandardCollection( sceneNode.scene, node.dynObjs );

                        // Process the CZML, which populates the collection with DynamicObjects
                        Cesium.processCzml( childSource, node.dynObjs );

                        //// Figure out the time span of the data
                        //var availability = dynObjs.computeAvailability();

                        //// Set the clock range
                        //clock.startTime = availability.start.clone();
                        //clock.currentTime = availability.start.clone();
                        //clock.stopTime = availability.stop.clone();
                        //clock.clockRange = Cesium.ClockRange.LOOP_STOP;
                        break;

                    default:
                        break;
                }
                
            }

            // If we do not have a load a model for this node, then we are almost done, so we can update all
            // the driver properties w/ the stop-gap function below.
            // Else, it will be called at the end of the assetLoaded callback
            //if ( ! ( childType == "model/vnd.collada+xml" || 
            //         childType == "model/vnd.osgjs+json+compressed") )
            //    notifyDriverOfPrototypeAndBehaviorProps();

            // Since prototypes are created before the object, it does not get "setProperty" updates for
            // its prototype (and behavior) properties.  Therefore, we cycle through those properties to
            // notify the drivers of the property values so they can react accordingly
            // TODO: Have the kernel send the "setProperty" updates itself so the driver need not
            // NOTE: Identical code exists in GLGE, and Threejs drivers, so if an change is necessary, it should be made
            //       there, too
            function notifyDriverOfPrototypeAndBehaviorProps() {
                var ptPropValue;
                var protos = getPrototypes.call( self, childExtendsID );
                protos.forEach( function( prototypeID ) {
                    for ( var propertyName in kernel.getProperties( prototypeID ) ) {
                        //console.info( " 1    getting "+propertyName+" of: " + childExtendsID  );
                        ptPropValue = kernel.getProperty( childExtendsID, propertyName );
                        if ( ptPropValue !== undefined && ptPropValue !== null && childID !== undefined && childID !== null) {
                            //console.info( " 1    setting "+propertyName+" of: " + childID + " to " + ptPropValue );
                            self.settingProperty( childID, propertyName, ptPropValue );
                        }
                    }
                } );
                childImplementsIDs.forEach( function( behaviorID ) {
                    for ( var propertyName in kernel.getProperties( behaviorID ) ) {
                        //console.info( "     2    getting "+propertyName+" of: " + behaviorID  );
                        ptPropValue = kernel.getProperty( behaviorID, propertyName );
                        if ( ptPropValue !== undefined && ptPropValue !== null && childID !== undefined && childID !== null) {
                            //console.info( "     2    setting "+propertyName+" of: " + childID + " to " + ptPropValue );
                            self.settingProperty( childID, propertyName, ptPropValue );
                        }
                    }
                } );
            };

        },

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {

            if ( this.debug.initializing ) {
                this.logger.infox( "initializingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            } 
        },
         
        // -- deletingNode -------------------------------------------------------------------------

        //deletingNode: function( nodeID ) {
        //},

        // -- addingChild ------------------------------------------------------------------------
        
        //addingChild: function( nodeID, childID, childName ) {
        //},

        // -- movingChild ------------------------------------------------------------------------
        
        //movingChild: function( nodeID, childID, childName ) {
        //},

        // -- removingChild ------------------------------------------------------------------------
        
        //removingChild: function( nodeID, childID, childName ) {
        //},

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            var value = undefined;

            if ( this.debug.properties ) {
                this.logger.infox( "C === creatingProperty ", nodeID, propertyName, propertyValue );
            }

            if ( propertyValue !== undefined ) {
                var node = this.state.nodes[ nodeID ];
                if ( node === undefined ) node = this.state.scenes[ nodeID ];
                if ( node !== undefined ) {
                    switch ( propertyName ) {
                        case "fabric":
                            if ( node.cesiumObj instanceof Cesium.Material ) {

                            }
                            break;
                        case "type":
                            if ( node.cesiumObj instanceof Cesium.Material ) {
                                
                            }
                            break;
                        default:
                            value = this.settingProperty( nodeID, propertyName, propertyValue );
                            break;
                    }                  
                }
            }

            return value;
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;

            if ( this.debug.properties ) {
                this.logger.infox( "  I === initializingProperty ", nodeID, propertyName, propertyValue );
            }

            if ( propertyValue !== undefined ) {
                var node = this.state.nodes[ nodeID ];
                if ( node === undefined ) node = this.state.scenes[ nodeID ];
                if ( node !== undefined ) {
                    switch ( propertyName ) {
                        case "fabric":
                            if ( node.cesiumObj instanceof Cesium.Material ) {
                                
                            }
                            break;
                        case "type":
                            if ( node.cesiumObj instanceof Cesium.Material ) {
                                
                            }
                            break;
                        default:
                            value = this.settingProperty( nodeID, propertyName, propertyValue );
                            break;
                    }  
                }
            }

            return value;
            
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = propertyValue;
            var node = this.state.nodes[ nodeID ]; 

            if ( this.debug.properties || this.debug.setting ) {
                this.logger.infox( "    S === settingProperty ", nodeID, propertyName, propertyValue );
            }

            if ( node ) {

                // if ( node.extendsID == "http-vwf-example-com-cesium-material-vwf" ) {
                //     debugger;
                // }

                if ( node.cesiumObj !== undefined && propertyValue !== undefined ) {


                    switch ( propertyName ) {

                        case "visible":
                            if ( node.cesiumObj.setShow ) {
                                node.cesiumObj.setShow( Boolean( propertyValue ) );
                            } else {
                                node.cesiumObj.show = Boolean( propertyValue );
                            }
                            break;

                        case "position":
                            if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                                node.cesiumObj.position = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                            } else if ( node.cesiumObj instanceof Cesium.Camera ) {
                                node.cesiumObj.position = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                                this.state.cameraInfo.position = node.cesiumObj.position;
                            } else if ( node.cesiumObj.setPosition ) {
                                var pos = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                                node.cesiumObj.setPosition( pos );
                                this.state.cameraInfo.isInitialized();
                            }
                            break;

                        case "pixelOffset":
                            var pos = new Cesium.Cartesian2( propertyValue[0], propertyValue[1] );
                            node.cesiumObj.setPixelOffset( pos );
                            break;

                        case "eyeOffset":
                            var pos = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                            node.cesiumObj.setEyeOffset( pos );
                            break;

                        case "horizontalOrigin":
                            switch ( propertyValue ) {
                                case "left":
                                    node.cesiumObj.setHorizontalOrigin( Cesium.HorizontalOrigin.LEFT );
                                    break;
                                case "right":
                                    node.cesiumObj.setHorizontalOrigin( Cesium.HorizontalOrigin.RIGHT );
                                    break;
                                case "center":
                                    node.cesiumObj.setHorizontalOrigin( Cesium.HorizontalOrigin.CENTER );
                                    break;
                            }
                            break;

                        case "verticalOrigin": 
                            switch ( propertyValue ) {
                                case "top":
                                    node.cesiumObj.setHorizontalOrigin( Cesium.VerticalOrigin.TOP );
                                    break;
                                case "bottom":
                                    node.cesiumObj.setHorizontalOrigin( Cesium.VerticalOrigin.BOTTOM );
                                    break;
                                case "center":
                                    node.cesiumObj.setHorizontalOrigin( Cesium.VerticalOrigin.CENTER );
                                    break;
                            }
                            break;

                        case "scale":
                            var val = parseFloat( propertyValue );
                            node.cesiumObj.setScale( val );
                            break;

                        case "imageIndex": 
                            var val = Number( propertyValue );
                            node.cesiumObj.setImageIndex( val );
                            break;

                        case "color": 
                            if ( propertyValue instanceof String ) {
                                propertyValue = propertyValue.replace( /\s/g, '' );
                            }
                            var vwfColor = new utility.color( propertyValue );
                            if ( vwfColor ) {                            
                                node.cesiumObj.setColor( { 
                                    red: vwfColor.red() / 255, 
                                    green: vwfColor.green() / 255, 
                                    blue: vwfColor.blue() / 255, 
                                    alpha: vwfColor.alpha() 
                                } );
                            } 
                            break;

                        case "font":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                node.cesiumObj.setFont( propertyValue );    
                            }
                            break;

                        case "fillColor":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                if ( propertyValue instanceof String ) {
                                    propertyValue = propertyValue.replace( /\s/g, '' );
                                }
                                var vwfColor = new utility.color( propertyValue );
                                if ( vwfColor ) {                            
                                    node.cesiumObj.setFillColor( { 
                                        red: vwfColor.red() / 255, 
                                        green: vwfColor.green() / 255, 
                                        blue: vwfColor.blue() / 255, 
                                        alpha: vwfColor.alpha() 
                                    } );
                                }                                
                            }                        
                            break;

                        case "style":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                switch ( propertyValue ) {
                                    case "fill":
                                        node.cesiumObj.setStyle( Cesium.LabelStyle.FILL );
                                        break;
                                    case "filloutline":
                                        node.cesiumObj.setStyle( Cesium.LabelStyle.FILL_AND_OUTLINE );
                                        break;
                                    case "outline":
                                        node.cesiumObj.setStyle( Cesium.LabelStyle.OUTLINE );
                                        break;
                                }   
                            }    
                            break;

                        case "outlineColor":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                if ( propertyValue instanceof String ) {
                                    propertyValue = propertyValue.replace( /\s/g, '' );
                                }
                                var vwfColor = new utility.color( propertyValue );
                                if ( vwfColor ) {                            
                                    node.cesiumObj.setOutlineColor( { 
                                        red: vwfColor.red() / 255, 
                                        green: vwfColor.green() / 255, 
                                        blue: vwfColor.blue() / 255, 
                                        alpha: vwfColor.alpha() 
                                    } );
                                }                                
                            }  
                            break;

                        case "outlineWidth":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                node.cesiumObj.setOutlineWidth( Number( propertyValue ) );    
                            }    
                            break;

                        case "text":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                node.cesiumObj.setText( propertyValue );    
                            }    
                            break;


                        case "image":
                            if ( node.cesiumObj instanceof Cesium.Billboard ) {
                                // set and image on the billboard
                                // TODO
                            }
                            break;

                        case "direction":
                            if ( node.cesiumObj instanceof Cesium.Camera ) {
                                node.cesiumObj.direction = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                                this.state.cameraInfo.direction = node.cesiumObj.direction;
                                this.state.cameraInfo.isInitialized();
                            }
                            break;

                        case "fovy":
                            if ( node.cesiumObj instanceof Cesium.Camera && node.cesiumObj.frustrum ) {
                                node.cesiumObj.frustrum.fovy = parseFloat( propertyValue );
                            }                    
                            break;

                        case "near":
                            if ( node.cesiumObj instanceof Cesium.Camera && node.cesiumObj.frustrum ) {
                                node.cesiumObj.frustrum.near = parseFloat( propertyValue );
                            }
                            break;

                        case "far":
                            if ( node.cesiumObj instanceof Cesium.Camera && node.cesiumObj.frustrum ) {
                                node.cesiumObj.frustrum.far = parseFloat( propertyValue );
                            }
                            break;

                        case "right":
                            if ( node.cesiumObj instanceof Cesium.Camera ) {
                                node.cesiumObj.right = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                                this.state.cameraInfo.right = node.cesiumObj.right;
                                this.state.cameraInfo.isInitialized();
                            }                    
                            break;

                        case "transform":
                            if ( node.cesiumObj instanceof Cesium.Camera ) {
                                node.cesiumObj.transform = arrayToMatrix.call( this, propertyValue );
                            } 
                            break;

                        case "modelMatrix":
                            if ( node.cesiumObj instanceof Cesium.PolylineCollection ) {
                                node.cesiumObj.modelMatrix = arrayToMatrix.call( this, propertyValue );
                            }
                            break;

                        case "up":
                            if ( node.cesiumObj instanceof Cesium.Camera ) {
                                node.cesiumObj.up = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                                this.state.cameraInfo.up = node.cesiumObj.up;
                                this.state.cameraInfo.isInitialized();
                            }
                            break;

                        case "fabric":
                            if ( node.cesiumObj instanceof Cesium.Material ) {
                                // this parameter is the context, which I'm not exactly
                                // sure what to do about that right now
                                node.cesiumObj.material = new Cesium.Material( undefined, propertyValue );
                                
                            }
                            value = undefined;
                            break;
                        case "type":
                            if ( node.cesiumObj instanceof Cesium.Material ) {
                                // best to set the type in the fabric

                                // switch ( propertyValue ) {
                                //     case "Color":
                                //     case "Image":
                                //     case "DiffuseMap":
                                //     case "AlphaMap":
                                //     case "SpecularMap":
                                //     case "EmissionMap":
                                //     case "BumpMap":
                                //     case "NormalMap":
                                //     case "Reflection":
                                //     case "Refraction":
                                //     case "Fresnel":
                                //     case "Brick":
                                //     case "Wood":
                                //     case "Asphalt":
                                //     case "Cement":
                                //     case "Grass":
                                //     case "Grid":
                                //     case "Stripe":
                                //     case "Checkerboard":
                                //     case "Dot":
                                //     case "Tiedye":
                                //     case "Facet":
                                //     case "Blob":
                                //     case "Water":
                                //     case "RimLighting":
                                //     case "erosion":
                                //     case "Fade":
                                //     case "PolylineArrow":
                                //     case "PolylineGlow":
                                //     case "PolylineOutline":
                                //     default:
                                //         node.cesiumObj = Cesium.Material.fromType( undefined, propertyValue );
                                //         break;
                                // }

                                if ( node.cesiumObj.type != propertyValue ) {
                                    node.cesiumObj.type = propertyValue;    
                                }
                            }
                            break;

                        case "uniforms":
                            if ( node.cesiumObj instanceof Cesium.Material ) {
                                
                                // the uniforms properties are based upon the material type
                                // check the Material spec at http://cesium.agi.com/refdoc.html
                                // for more information
                                var uni = node.cesiumObj.uniforms;
                                if ( uni ) {
                                    if ( propertyValue instanceof Object ) {
                                        for( var prop in propertyValue ) {
                                            switch( prop ) {
                                                case "color":
                                                    var vwfColor = new utility.color( propertyValue[ prop ] );
                                                    if ( vwfColor ) { 
                                                        uni.color = new Cesium.Color( 
                                                            vwfColor.red() / 255, 
                                                            vwfColor.green() / 255,
                                                            vwfColor.blue() / 255, 
                                                            vwfColor.alpha() 
                                                        );
                                                    }                                                      
                                                    break;
                                                default:
                                                    uni[ prop ] = propertyValue[ prop ];
                                                    break;
                                            }
                                        }
                                    }
                                }
                            }
                            break;

                        case "shaderSource":
                            if ( node.cesiumObj instanceof Cesium.Material ) {
                                node.cesiumObj.shaderSource = propertyValue;
                            }
                            break;
 
                        case "positions":
                            if ( node.cesiumObj instanceof Cesium.Polyline || node.cesiumObj instanceof Cesium.Polygon ) {
                                var points = [];
                                if ( propertyValue instanceof Array ) {
                                    var len = propertyValue.length;
                                    for ( var i = 0; i < len; i++ ) {
                                        points.push( new Cesium.Cartesian3( propertyValue[i][0], propertyValue[i][1], propertyValue[i][2] ) );
                                    }
                                }
                                node.cesiumObj.setPositions( points );
                            }
                            break;

                        case "width":
                            if ( node.cesiumObj instanceof Cesium.Polyline ) {
                                node.cesiumObj.setWidth( Number( propertyValue ) );
                            }
                            break;
                        
                        case "extent":
                            if ( node.cesiumObj instanceof Cesium.Polygon ) {
                                var ext, height, rotation;
                                if ( propertyValue instanceof Array ) {

                                    if ( propertyValue.length == 3 ) {
                                        ext = propertyValue[ 0 ];
                                        height = propertyValue[ 1 ];
                                        rotation = propertyValue[ 2 ];
                                    } else if ( propertyValue.length == 6 ) {
                                        ext = [];
                                        ext[ 0 ] = propertyValue[ 0 ];
                                        ext[ 1 ] = propertyValue[ 1 ];
                                        ext[ 2 ] = propertyValue[ 2 ];
                                        ext[ 3 ] = propertyValue[ 3 ];
                                        height = propertyValue[ 4 ];
                                        rotation = propertyValue[ 5 ];
                                    }

                                    if ( ext !== undefined ) {

                                        node.cesiumObj.configureExtent( new Cesium.Extent( 
                                            Cesium.CesiumMath.toRadians( ext[0] ),
                                            Cesium.CesiumMath.toRadians( ext[1] ),
                                            Cesium.CesiumMath.toRadians( ext[2] ),
                                            Cesium.CesiumMath.toRadians( ext[3] ),
                                            height,
                                            Cesium.CesiumMath.toRadians( rotation )                                        
                                        ) );    
                                    }
                                }
                            }
                            value = undefined;
                            break;

                        case "height":
                            if ( node.cesiumObj instanceof Cesium.Polygon ) {
                                node.cesiumObj.height = Number( propertyValue );
                            }
                            break; 

                        case "granularity":
                            if ( node.cesiumObj instanceof Cesium.Polygon ) {
                                node.cesiumObj.granularity = Number( propertyValue );
                            }
                            break; 

                        case "availability":
                            if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                                var start = propertyValue.start;
                                var stop = propertyValue.stop;
                                var startIncluded = propertyValue.isStartIncluded ? propertyValue.isStartIncluded : true;
                                var stopIncluded = propertyValue.isStopIncluded ? propertyValue.isStopIncluded : true;

                                if ( start && stop ) {
                                    node.cesiumObj.availability = new TimeInterval( start, stop, startIncluded, stopIncluded );
                                }
                            }
                            break;
                        //case "orientation":
                        //    if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                        //    
                        //    }
                        //    break;
                        //case "point":
                        //    if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                        //    
                        //    }
                        //    break;
                        //case "vector":
                        //    if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                        //    
                        //    }
                        //    break;
                        //case "vertexPositions":
                        //    if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                        //    
                        //    }
                        //    break;
                        case "viewFrom":
                            if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                               node.cesiumObj.viewFrom = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                            }
                            break;                            

                        default:
                            value = undefined;
                            break;

                    }
                } else {
                    value = undefined;    
                }


            } else {
                node = this.state.scenes[ nodeID ]; 
                if ( node ) {
                    var scene = node.scene;

                    if ( ( node.widget !== undefined || node.centralBody !== undefined ) && propertyValue ) {

                        switch ( propertyName ) {

                            case "cameraViewData":
                                if ( this.kernel.client() != this.kernel.moniker() ) {
                                    var camera = scene.getCamera();
                                    if ( propertyValue.direction ) {
                                        //this.logger.infox( "S   settingProperty", propertyValue.direction[0], propertyValue.direction[1], propertyValue.direction[2] );
                                        camera.direction = new Cesium.Cartesian3( propertyValue.direction[0], propertyValue.direction[1], propertyValue.direction[2] );
                                    }
                                    if ( propertyValue.position ) { 
                                        //this.logger.infox( "S   settingProperty", propertyValue.position[0], propertyValue.position[1], propertyValue.position[2] );
                                        camera.position = new Cesium.Cartesian3( propertyValue.position[0], propertyValue.position[1], propertyValue.position[2] );
                                    }
                                    if ( propertyValue.up ) { 
                                        //this.logger.infox( "S   settingProperty", propertyValue.up[0], propertyValue.up[1], propertyValue.up[2] );
                                        camera.up = new Cesium.Cartesian3( propertyValue.up[0], propertyValue.up[1], propertyValue.up[2] );
                                    }
                                    if ( propertyValue.right ) {
                                        //this.logger.infox( "S   settingProperty", propertyValue.right[0], propertyValue.right[1], propertyValue.right[2] );
                                        camera.right = new Cesium.Cartesian3( propertyValue.right[0], propertyValue.right[1], propertyValue.right[2] );
                                    }
                                    this.state.cameraInfo.getCurrent( camera );
                                }
                                break;

                            case "terrainProvider":
                                if ( node.terrainProvider && node.terrainProvider == propertyValue ) {
                                    break;
                                }

                                var terrainProvider = undefined;
                                switch ( propertyValue ) {
                                    case "cesium":
                                        node.terrainProvider = propertyValue;
                                        terrainProvider = new Cesium.CesiumTerrainProvider({
                                            url : 'http://cesium.agi.com/smallterrain',
                                            credit : 'Terrain data courtesy Analytical Graphics, Inc.'
                                        });  
                                        node.centralBody.depthTestAgainstTerrain = true;                                  
                                        break;
                                    case "vr":
                                        node.terrainProvider = propertyValue;
                                        terrainProvider = new Cesium.VRTheWorldTerrainProvider({
                                            url : 'http://www.vr-theworld.com/vr-theworld/tiles1.0.0/73/',
                                            credit : 'Terrain data courtesy VT MÄK'
                                        }); 
                                        node.centralBody.depthTestAgainstTerrain = true;                                   
                                        break;
                                    default:
                                        terrainProvider = new Cesium.EllipsoidTerrainProvider();
                                        node.terrainProvider = "ellipsoid";
                                        node.centralBody.depthTestAgainstTerrain = false;
                                        break;

                                }

                                if ( terrainProvider !== undefined ) {
                                    node.centralBody.terrainProvider = terrainProvider;
                                }
                                
                                value = undefined;
                                break;


                            case "imageryProvider":
                                
                                if ( node.imageryProvider && node.imageryProvider == propertyValue ) {
                                    //we need to probably remember which image providers have been loaded and 
                                    //then just switch the current if the requested has already been loaded
                                    return;
                                }

                                var imageProvider = undefined;
                                var proxy = new Cesium.DefaultProxy('/proxy/');
                                //While some sites have CORS on, not all browsers implement it properly, so a proxy is needed anyway;
                                var proxyIfNeeded = Cesium.FeatureDetection.supportsCrossOriginImagery() ? undefined : proxy;                    
                                
                                switch ( propertyValue ) {
                                    case "bingAerial":
                                        imageProvider = new Cesium.BingMapsImageryProvider({
                                            url : 'http://dev.virtualearth.net',
                                            mapStyle : Cesium.BingMapsStyle.AERIAL,
                                            // Some versions of Safari support WebGL, but don't correctly implement
                                            // cross-origin image loading, so we need to load Bing imagery using a proxy.
                                            proxy : proxyIfNeeded
                                        });
                                        break;

                                    case "bingAerialLabel":
                                        imageProvider = new Cesium.BingMapsImageryProvider({
                                            url : 'http://dev.virtualearth.net',
                                            mapStyle : Cesium.BingMapsStyle.AERIAL_WITH_LABELS,
                                            proxy : proxyIfNeeded
                                        });
                                        break;

                                    case "bingRoad":
                                        imageProvider = new Cesium.BingMapsImageryProvider( {
                                            url: 'http://dev.virtualearth.net',
                                            mapStyle: Cesium.BingMapsStyle.ROAD,
                                            // Some versions of Safari support WebGL, but don't correctly implement
                                            // cross-origin image loading, so we need to load Bing imagery using a proxy.
                                            proxy: proxyIfNeeded
                                        } );                        
                                        break;

                                    case "esriWorld":
                                        imageProvider = new Cesium.ArcGisMapServerImageryProvider({
                                            url : 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
                                            proxy : proxy
                                        });                      
                                        break;

                                    case "esriStreet":
                                        imageProvider = new Cesium.ArcGisMapServerImageryProvider({
                                            url : 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
                                            proxy: new Cesium.DefaultProxy('/proxy/')
                                        } );                       
                                        break;

                                    case "esriGeo":
                                        imageProvider = new Cesium.ArcGisMapServerImageryProvider({
                                            url : 'http://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/',
                                            proxy : proxy
                                        });                      
                                        break;

                                    case "openStreet":
                                        imageProvider = new Cesium.OpenStreetMapImageryProvider({
                                            url : 'http://tile.openstreetmap.org/',
                                            proxy : proxyIfNeeded
                                        });
                                        break;

                                    case "mapQuestStreet":
                                        imageProvider = new Cesium.OpenStreetMapImageryProvider({
                                            url: 'http://otile1.mqcdn.com/tiles/1.0.0/osm/',
                                            proxy: proxy
                                        });
                                        break;

                                    case "stamen":
                                        imageProvider = new Cesium.OpenStreetMapImageryProvider({
                                            url: 'http://tile.stamen.com/watercolor/',
                                            fileExtension: 'jpg',
                                            proxy: proxy,
                                            credit: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.'
                                        });
                                        break;

                                    case "stamenToner":
                                        imageProvider = new Cesium.OpenStreetMapImageryProvider({
                                            url : 'http://tile.stamen.com/toner/',
                                            credit : 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.',
                                            proxy : proxyIfNeeded
                                        });
                                        break;

                                    case "blackMarble":
                                        imageProvider = new Cesium.TileMapServiceImageryProvider({
                                            url : 'http://cesium.agi.com/blackmarble',
                                            maximumLevel : 8,
                                            credit : 'Black Marble imagery courtesy NASA Earth Observatory',
                                            proxy : proxyIfNeeded
                                        });
                                        break;


                                    case "single":
                                        imageProvider = new Cesium.SingleTileImageryProvider({
                                            url : require.toUrl('Assets/Textures/NE2_LR_LC_SR_W_DR_2048.jpg')
                                        } );
                                        break;

                                    case "usInfrared":
                                        imageProvider =  new Cesium.WebMapServiceImageryProvider({
                                            url : 'http://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?',
                                            layers : 'goes_conus_ir',
                                            credit : 'Infrared data courtesy Iowa Environmental Mesonet',
                                            parameters : {
                                                transparent : 'true',
                                                format : 'image/png'
                                            },
                                            proxy : proxy
                                        })
                                        break;

                                    case "usWeather":
                                        imageProvider = new Cesium.WebMapServiceImageryProvider({
                                            url : 'http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?',
                                            layers : 'nexrad-n0r',
                                            credit : 'Radar data courtesy Iowa Environmental Mesonet',
                                            parameters : {
                                                transparent : 'true',
                                                format : 'image/png'
                                            },
                                            proxy : proxy
                                        })                        
                                        break;

                                    case "tms":
                                        imageProvider = new Cesium.TileMapServiceImageryProvider({
                                                url : '../images/cesium_maptiler/Cesium_Logo_Color'
                                        });
                                        break;

                                    case "image":
                                        imageProvider = new Cesium.SingleTileImageryProvider({
                                            url : '../images/Cesium_Logo_overlay.png',
                                            extent : new Cesium.Extent(
                                                    Cesium.Math.toRadians(-115.0),
                                                    Cesium.Math.toRadians(38.0),
                                                    Cesium.Math.toRadians(-107),
                                                    Cesium.Math.toRadians(39.75))
                                        });
                                        break;

                                    case "grid":
                                        imageProvider = new Cesium.GridImageryProvider();
                                        break;

                                    case "tile":
                                        imageProvider = new Cesium.TileCoordinatesImageryProvider();
                                        break;

                                }

                                if ( imageProvider !== undefined ) {
                                    if ( node && node.widget !== undefined ) {
                                        // how does the widget add an image layer
                                        node.widget.centralBody.getImageryLayers().addImageryProvider( imageProvider );
                                    } else if ( node.centralBody !== undefined ) {
                                        node.centralBody.getImageryLayers().addImageryProvider( imageProvider );
                                    }
                                    node.imageryProvider = propertyValue;
                                }
                                value = undefined;
                                break;


                            case "renderStyle":
                                // using the Cesium.Widget
                                if ( node.widget ) {
                                    
                                    var currentRS = this.gettingProperty( nodeID, propertyName );
                                    if ( currentRS != propertyValue ) {
                                        switch ( propertyValue ) {
                                            case "3D":
                                                node.widget._transitioner.to3D();
                                                break;
                                            case "2D":
                                                node.widget._transitioner.to2D();
                                                break;
                                            case "2.5D":
                                                node.widget._transitioner.toColumbusView();
                                                break;
                                        }
                                    }
                                } else if ( node.transitioner ) {
                                    switch ( propertyValue ) {
                                        case "3D":
                                            node.transitioner.morphTo3D();
                                            break;
                                        case "2D":
                                            node.transitioner.morphTo2D();
                                            break;
                                        case "2.5D":
                                            node.transitioner.morphToColumbusView();
                                            break;
                                    }
                                }
                                value = undefined;
                                break;

                            case "backgroundColor":

                                if( node.scene ) {
                                    if ( propertyValue instanceof String ) {
                                        propertyValue = propertyValue.replace( /\s/g, '' );
                                    }
                                    var vwfColor = new utility.color( propertyValue );
                                    if ( vwfColor ) {                            
                                        node.scene.backgroundColor = new Cesium.Color( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255, vwfColor.alpha() );
                                    } 
                                }
                                break;

                            case "controlClient":
                                node.controlClient = propertyValue;
                                value = propertyValue;
                                break;

                            default:
                                value = undefined;
                                break;

                        }
                    } else {
                        value = undefined;
                    }
                }
            }

            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.state.nodes[ nodeID ]; 
            if( !node ) node = this.state.scenes[ nodeID ]; 
            var value = undefined;

            if ( this.debug.properties || this.debug.getting ) {
                this.logger.infox( "   G === gettingProperty ", nodeID, propertyName, propertyValue );
            }

            if( !node ) return undefined;

            switch ( propertyName ) {

                case "visible":
                    if ( node.cesiumObj ) {
                        if ( node.cesiumObj.getShow ) {
                            value = node.cesiumObj.getShow();
                        } else {
                            value = node.cesiumObj.show;
                        }
                    }
                    break;
                case "position":
                    if ( node.cesiumObj ) {
                        var pos;
                        if ( node.cesiumObj instanceof Cesium.Camera ) {
                            pos = node.cesiumObj.position;
                        } else if ( node.cesiumObj instanceof Cesium.Billboard || node.cesiumObj instanceof Cesium.Label ) {
                            pos = node.cesiumObj.getPosition();
                        }
                        if ( pos ) {
                            value = [ pos.x, pos.y, pos.z ];
                        }
                    }
                    break;

                case "pixelOffset":
                    if ( node.cesiumObj ) {
                        var pos = node.cesiumObj.getPixelOffset();
                        value = [ pos.x, pos.y ];
                    }
                    break;

                case "eyeOffset":
                    if ( node.cesiumObj ) {
                        var pos = node.cesiumObj.getEyeOffset();
                        value = [ pos.x, pos.y, pos.z ];
                    }
                case "horizontalOrigin":
                    if ( node.cesiumObj ) {
                        var horzOrigin = node.cesiumObj.getHorizontalOrigin();
                        switch ( horzOrigin ) {
                            case Cesium.HorizontalOrigin.LEFT:
                                value = "left";
                                break;
                            case Cesium.HorizontalOrigin.RIGHT:
                                value = "right";
                                break;
                            case Cesium.HorizontalOrigin.CENTER:
                                value = "center";
                                break;
                        }
                    }
                    break;

                case "verticalOrigin": 
                    if ( node.cesiumObj ) {
                        var vertOrigin = node.cesiumObj.getHorizontalOrigin();
                        switch ( vertOrigin ) {
                            case Cesium.VerticalOrigin.TOP:
                                value = "top";
                                break;
                            case Cesium.VerticalOrigin.BOTTOM:
                                value = "bottom";
                                break;
                            case Cesium.VerticalOrigin.CENTER:
                                value = "center";
                                break;
                        }
                    }
                    break;

                case "scale":
                    if ( node.cesiumObj ) {
                        value = node.cesiumObj.getScale();
                    }
                    break;

                case "imageIndex": 
                    if ( node.cesiumObj ) {
                        value = node.cesiumObj.getImageIndex();
                    }
                    break;

                case "color": 
                    if( node.cesiumObj ) {
                        var clr = node.cesiumObj.getColor();
                        if ( clr.alpha == 1 ) {
                            value = "rgb("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+")";
                        } else {
                            value = "rgba("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+","+clr.alpha+")";
                        }
                    }
                    break;

                case "font":
                    if ( node.cesiumObj instanceof Cesium.Label ) {
                        node.cesiumObj.setFont( propertyValue );    
                    }
                    break;

                case "fillColor":
                    if( node.cesiumObj ) {
                        var clr = node.cesiumObj.getFillColor();
                        if ( clr.alpha == 1 ) {
                            value = "rgb("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+")";
                        } else {
                            value = "rgba("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+","+clr.alpha+")";
                        }
                    }                      
                    break;

                case "style":
                    if ( node.cesiumObj instanceof Cesium.Label ) {
                        switch ( node.cesiumObj.getStyle() ) {
                            case Cesium.LabelStyle.FILL:
                                value = "fill";
                                break;
                            case Cesium.LabelStyle.FILL_AND_OUTLINE:
                                value = "filloutline";
                                break;
                            case Cesium.LabelStyle.OUTLINE:
                                value = "outline";
                                break;
                        }   
                    }    
                    break;

                case "outlineColor":
                    if( node.cesiumObj ) {
                        var clr = node.cesiumObj.getOutLineColor();
                        if ( clr.alpha == 1 ) {
                            value = "rgb("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+")";
                        } else {
                            value = "rgba("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+","+clr.alpha+")";
                        }
                    } 
                    break;

                case "outlineWidth":
                    if ( node.cesiumObj instanceof Cesium.Label ) {
                        value = node.cesiumObj.getOutlineWidth();    
                    }    
                    break;

                case "text":
                    if ( node.cesiumObj instanceof Cesium.Label ) {
                        value = node.cesiumObj.getText();    
                    }    
                    break;


                case "imageryProvider":
                    break;
                    
                case "terrainProvider":
                    break;

                case "cameraViewData":
                    if ( node.scene ) {
                        var camera = node.scene.getCamera();
                        var value = {}
                        var vec;
                        if ( camera.direction ) {
                            vec = camera.direction;
                            value.direction = [ vec.x, vec.y, vec.z ];
                        }
                        if ( camera.position ) { 
                            vec = camera.position;
                            value.position = [ vec.x, vec.y, vec.z ];
                        }
                        if ( camera.up ) { 
                            vec = camera.up;
                            value.up = [ vec.x, vec.y, vec.z ];
                        }
                        if ( camera.right ) { 
                            vec = camera.right;
                            value.right = [ vec.x, vec.y, vec.z ];
                        }
                    }
                    break;

                case "renderStyle":
                    if ( node.scene && node.scene.mode ) {
                        switch ( node.scene.mode ) {
                            case Cesium.SceneMode.COLUMBUS_VIEW:
                                value = "2.5D";
                                break;
                            case Cesium.SceneMode.SCENE2D:
                                value = "2D";
                                break;
                            case Cesium.SceneMode.SCENE3D:
                                value = "3D";
                                break;
                        }                          
                    }
                    break;

                case "backgroundColor":
                    if( node.scene ) {
                        var clr = node.scene.backgroundColor
                        if ( clr.alpha == 1 ) {
                            value = "rgb("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+")";
                        } else {
                            value = "rgba("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+","+clr.alpha+")";
                        }
                    }
                    break;

                case "controlClient":
                    value = node.controlClient;
                    break;

                case "direction":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        var vec3 = node.cesiumObj.direction;
                        value = [ vec3.x, vec3.y, vec3.z ];
                    }
                    break;

                case "fovy":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        value = node.cesiumObj.frustrum.fovy;
                    }                    
                    break;

                case "near":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        value = node.cesiumObj.frustrum.near;
                    }
                    break;

                case "far":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        value = node.cesiumObj.frustrum.far;
                    }
                    break;

                case "right":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        var vec3 = node.cesiumObj.right;
                        value = [ vec3.x, vec3.y, vec3.z ];                    }                    
                    break;

                case "transform":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        value = matrixToArray.call( this, node.cesiumObj.transform );
                    }

                    break;
                    
                case "modelMatrix":
                    if ( node.cesiumObj instanceof Cesium.PolylineCollection ) {
                        value = matrixToArray.call( this, node.cesiumObj.modelMatrix );
                    }
                    break;

                case "up":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        var vec3 = node.cesiumObj.up;
                        value = [ vec3.x, vec3.y, vec3.z ]; 
                    }
                    break;

                case "fabric":
                    // current state stored by the object model
                    break;

                case "type":
                    if ( node.cesiumObj instanceof Cesium.Material ) {
                        value = node.cesiumObj.type;    
                    }
                    break;

                case "shaderSource":
                    if ( node.cesiumObj instanceof Cesium.Material ) {
                        value = node.cesiumObj.shaderSource;
                    }
                    break;

                case "uniforms":
                    if ( node.cesiumObj instanceof Cesium.Material ) {
                        // this can be used 
                        var uni = node.cesiumObj.uniforms;
                        if ( uni ) {
                            value = {};
                            for ( var prop in uni ) {
                                if ( uni.hasOwnProperty( prop ) ) {
                                    switch( prop ) {
                                        case "color":
                                            var clr = uni[ prop ];
                                            if ( clr.alpha == 1 ) {
                                                value = "rgb("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+")";
                                            } else {
                                                value = "rgba("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+","+clr.alpha+")";
                                            }                                       
                                            break;
                                        default:
                                            value[ prop ] = uni[ prop ];
                                            break;
                                    }
                                }
                            }
                        }
                    }
                    break;

                case "positions":
                    //if ( node.cesiumObj instanceof Cesium.Polyline || node.cesiumObj instanceof Cesium.Polygon ) {
                    if ( node.cesiumObj.getPositions ) {
                        var cesiumPoints = node.cesiumObj.getPositions();
                        var len = cesiumPoints.length;

                        value = [];
                        for ( var i = 0; i < len; i++ ) {
                            value.push( [ cesiumPoints[i].x, cesiumPoints[i].y, cesiumPoints[i].z ] );
                        }
                    }
                    break;

                case "width":
                    if ( node.cesiumObj instanceof Cesium.Polyline ) {
                        value = node.cesiumObj.getWidth();
                    }
                    break;

                case "height":
                    if ( node.cesiumObj instanceof Cesium.Polygon ) {
                        value = node.cesiumObj.height;
                    }
                    break; 

                case "granularity":
                    if ( node.cesiumObj instanceof Cesium.Polygon ) {
                        value = node.cesiumObj.granularity;
                    }
                    break; 

                case "orientation":
                    if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                        value = node.cesiumObj.orientation.getValue();
                    }
                    break;

                case "point":
                    if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                        value = node.cesiumObj.point.getValue();
                    }
                    break;

                case "vector":
                    if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                        value = node.cesiumObj.vector.getValue();
                    }
                    break;

                case "vertexPositions":
                    if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                        value = node.cesiumObj.vertexPositions.getValue();
                    }
                    break;

                case "viewFrom":
                    if ( node.cesiumObj instanceof Cesium.DynamicObject ) {
                       value = node.cesiumObj.viewFrom;
                    }
                    break;   


            }

            return value;
        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

        //callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters
        //    return undefined;
        //},


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

        //executing: function( nodeID, scriptText, scriptType ) {
        //    return undefined;
        //},

        // == ticking =============================================================================


    } );
    // == PRIVATE  ========================================================================================

    function checkCompatibility() {
        this.compatibilityStatus = { compatible:true, errors:{} }
        var contextNames = ["webgl","experimental-webgl","moz-webgl","webkit-3d"];
        for(var i = 0; i < contextNames.length; i++){
            try{
                var canvas = document.createElement('canvas');
                var gl = canvas.getContext(contextNames[i]);
                if(gl){
                    return true;
                }
            }
            catch(e){}
        }
        this.compatibilityStatus.compatible = false;
        this.compatibilityStatus.errors["WGL"] = "This browser is not compatible. The vwf/view/threejs driver requires WebGL.";
        return false;
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

    function findParent( ID ) {
        var retNode = this.state.nodes[ ID ];
        if ( retNode === undefined ) {
            retNode = this.state.scenes[ ID ];
        }
        return retNode;
    } 

    function findSceneNode( node ) {
        var sceneNode = undefined;
        var protos = undefined;
        var parent = findParent.call( this, node.parentID );
        while ( parent && sceneNode === undefined ) {
            protos = getPrototypes.call( this, parent.extendsID );
            if ( protos && isCesium.call( this, protos ) ) {
                sceneNode = parent;
            } else {
                parent = findParent.call( this, parent.parentID );
            }
        }
        return sceneNode;
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


    function isCesium( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-vwf" );    
            }
        }

        return foundCesium;
    }

    function isSun( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-sun-vwf" );    
            }
        }

        return foundCesium;
    }    

    function isAtmosphere( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-atmosphere-vwf" );    
            }
        }

        return foundCesium;
    } 

    function isSkyBox( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-skybox-vwf" );    
            }
        }

        return foundCesium;
    }     
    
    function isBillboard( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-billboard-vwf" );   
            }
        }

        return foundCesium;
    }  

    function isDynamicObject( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-dynamicobject-vwf" );   
            }
        }

        return foundCesium;
    }  

    function isLabel( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-label-vwf" );   
            }
        }

        return foundCesium;
    } 

    function isPolylineCollection( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-polylineCollection-vwf" );   
            }
        }

        return foundCesium;
    }    

    function isPolyline( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-polyline-vwf" );   
            }
        }

        return foundCesium;
    }     
  
    function isPolygon( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-polygon-vwf" );   
            }
        }

        return foundCesium;
    } 

    function isMaterial( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-material-vwf" );   
            }
        }

        return foundCesium;
    }     

    function isCamera( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-camera-vwf" );    
            }
        }

        return foundCesium;
    } 

    function isNode3( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-node3-vwf" );    
            }
        }

        return foundCesium;
    } 

    function vwfColor( color ) {
        var vwfColor = {};
        vwfColor['r'] = color['r']*255;
        vwfColor['g'] = color['g']*255;
        vwfColor['b'] = color['b']*255;                                
        if ( color['a'] !== undefined && color['a'] != 1 ) {
            vwfColor['a'] = color['a'];
            vwfColor = new utility.color( "rgba("+vwfColor['r']+","+vwfColor['g']+","+vwfColor['b']+","+vwfColor['a']+")" );
        } else {
            vwfColor = new utility.color( "rgb("+vwfColor['r']+","+vwfColor['g']+","+vwfColor['b']+")" );
        }
        return vwfColor;        
    }

    function matrixToArray( mat ) {
        return [ mat['0'], mat['1'], mat['2'], mat['3'], mat['4'], mat['5'], mat['6'], mat['7'], mat['8'], mat['9'], mat['10'], mat['11'], mat['12'], mat['13'], mat['14'], mat['15'] ];
    }


    function arrayToMatrix( arry ) {
        return Cesium.Matrix4.fromRowMajorArray( arry );
    }
});
