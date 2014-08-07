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

  
    
define( [ "module", "vwf/model", "vwf/utility", 
          "vwf/utility/color", "vwf/model/cesium/Cesium" ], 

    function( module, model, utility, Color, Cesium ) {


    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
            checkCompatibility.call( this );

            if ( options === undefined ) { options = {}; }

            this.state.scenes = {}; // id => { scene: Cesium.Scene }
            this.state.nodes = {}; // id => { name: string, cesiumObj:  }
            this.state.prototypes = {}; 


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

            } else if ( isGlobe.call( this, protos ) ) {

                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                if ( parentNode && parentNode.globe ) {
                    node.cesiumObj = parentNode.globe;
                    node.cesiumObj.vwfID = childID;
                }                

            } else if ( isAtmosphere.call( this, protos ) ) {

                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                if ( parentNode && parentNode.scene ) {
                    if ( !parentNode.scene.skyAtmosphere ) {
                        parentNode.scene.skyAtmosphere = new Cesium.SkyAtmosphere();
                    }
                    node.cesiumObj = parentNode.scene.skyAtmosphere;
                    node.cesiumObj.vwfID = childID;
                }

            } else if ( isSkyBox.call( this, protos ) ) {

                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                if ( parentNode && parentNode.scene ) {
                    if ( !parentNode.scene.skyBox ) {
                        var skyBoxBaseUrl = '../vwf/model/Assets/Textures/SkyBox/tycho2t3_80';
                        parentNode.scene.skyBox = new Cesium.SkyBox({
                            positiveX : skyBoxBaseUrl + '_px.jpg',
                            negativeX : skyBoxBaseUrl + '_mx.jpg',
                            positiveY : skyBoxBaseUrl + '_py.jpg',
                            negativeY : skyBoxBaseUrl + '_my.jpg',
                            positiveZ : skyBoxBaseUrl + '_pz.jpg',
                            negativeZ : skyBoxBaseUrl + '_mz.jpg'
                        });
                    }
                    node.cesiumObj = parentNode.scene.skyBox;
                    node.cesiumObj.vwfID = childID;
                } 


            } else if ( isSun.call( this, protos ) ) {

                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                if ( parentNode && parentNode.scene ) {
                    if ( !parentNode.scene.sun ) { 
                        parentNode.scene.sun = new Cesium.Sun(); 
                    }
                    node.cesiumObj = parentNode.scene.sun;
                    node.cesiumObj.vwfID = childID;
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
                    context2D.fillStyle = 'rgb(255,255,255)';
                    context2D.fill();

                    // this is making a collection per billboard, which 
                    // probably isn't exactly what we want, but without an
                    // idea of exactly how we'll be using billboards,
                    // I'm just going to leave this implementation as is
                    var bbCollection = new Cesium.BillboardCollection();

                    var bb = bbCollection.add( {
                        "color" : Cesium.Color.RED,
                        "scale" : 1,
                        "imageIndex": 0
                    } );

                    sceneNode.scene.primitives.add( bbCollection );
                    
                    node.bbCollection = bbCollection; 
                    node.cesiumObj = bb;
                    node.cesiumObj.vwfID = childID;
                    
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
                    sceneNode.scene.primitives.add( labels ); 

                    node.labelCollection = labels; 
                    node.cesiumObj = lbl;
                    node.cesiumObj.vwfID = childID;
                }
                node.scene = sceneNode.scene;                

            } else if ( isPolylineCollection.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createNode();
                sceneNode = findSceneNode.call( this, node );

                node.cesiumObj = new Cesium.PolylineCollection();
                node.scene = sceneNode.scene; 
                node.cesiumObj.vwfID = childID;  
                //node.scene.primitives.add( node.cesiumObj );  

            } else if ( isPolyline.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createNode();
                sceneNode = findSceneNode.call( this, node );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode && parentNode.cesiumObj instanceof Cesium.DynamicObject ) {
                    node.cesiumObj = parentNode.cesiumObj.polyline;
                } else { 
                    var primitives = sceneNode.scene.primitives;               
                    if ( parentNode.cesiumObj && parentNode.cesiumObj instanceof Cesium.PolylineCollection ) {
                        node.polylineCollection = parentNode.cesiumObj;
                    }

                    if ( node.polylineCollection === undefined ) {
                        node.polylineCollection = new Cesium.PolylineCollection();
                    }

                    node.cesiumObj = node.polylineCollection.add( childSource );
                    if ( !primitives.contains( node.polylineCollection ) ) {
                        primitives.add( node.polylineCollection );
                    }
                    node.cesiumObj.vwfID = childID;
                }
                node.scene = sceneNode.scene;  
            

            } else if ( isBoxGeometry.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createNode();
                sceneNode = findSceneNode.call( this, node );

                node.geometryType = 'box';
                node.properties = {};

                node.geometry = undefined;
                node.geometryInstance = undefined;
                node.primitive = undefined;                
                
                // 
                node.cesiumObj = undefined;

                node.scene = sceneNode.scene; 

            } else if ( isPolygon.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createNode();
                sceneNode = findSceneNode.call( this, node );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode && parentNode.cesiumObj instanceof Cesium.DynamicObject ) {
                    node.cesiumObj = parentNode.cesiumObj.polygon;
                } else {  
                    var primitives = sceneNode.scene.primitives;
                    node.cesiumObj = new Cesium.Polygon();
                    primitives.add( node.cesiumObj );
                    node.cesiumObj.vwfID = childID;
                }
                node.scene = sceneNode.scene; 

            } else if ( isMaterial.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createNode();
                sceneNode = findSceneNode.call( this, node );
                var parentNode = this.state.nodes[ nodeID ];
                if ( parentNode && parentNode.cesiumObj ) {
                    if ( parentNode.cesiumObj.getMaterial ) {
                        node.cesiumObj = parentNode.cesiumObj.getMaterial();
                    } else {
                        node.cesiumObj = parentNode.cesiumObj.material;
                    }
                    node.cesiumObj.vwfID = childID;
                }
               
                node.context = undefined;

                // if undefined or the wrong type, create a new material and
                // set on the parent node 
                if ( node.cesiumObj === undefined || ( childType && node.cesiumObj.type != childType.type ) ) {
                    if ( childType && childType.context ) {
                        node.context = sceneNode.scene._context;
                    }
                    node.cesiumObj = Cesium.Material.fromType( node.context, childType.type );
                    if ( parentNode.cesiumObj.setMaterial ) {
                        parentNode.cesiumObj.setMaterial( node.cesiumObj );
                    } else {
                        parentNode.cesiumObj.material = node.cesiumObj;
                    }
                }                

            } else if ( isCamera.call( this, protos ) ) {
                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                var sceneNode = findSceneNode.call( this, node );

                if ( childName == "camera" ) {
                    node.cesiumObj = sceneNode.scene._camera;
                } else {
                    var camera = new Cesium.Camera(canvas);
                    camera.position = new Cesium.Cartesian3();
                    camera.direction = Cartesian3.UNIT_Z.negate();
                    camera.up = Cartesian3.UNIT_Y;
                    camera.frustum.fovy = CesiumMath.PI_OVER_THREE;
                    camera.frustum.near = 1.0;
                    camera.frustum.far = 2.0;  
                    node.cesiumObj = camera;              
                }
                node.cesiumObj.vwfID = childID;
                
            } else if ( isDynamicObject.call( this, protos ) ) {
                this.state.nodes[ childID ] = node = createNode();
                var sceneNode = findSceneNode.call( this, node );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode ) {

                    if ( parentNode.dynObjs ) {
                        node.cesiumObj = parentNode.dynObjs.getObject( childName );
                        node.cesiumObj.vwfID = childID;
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
                        if ( sceneNode && sceneNode.cesiumViewer ) {
                            
                            var viewer = sceneNode.cesiumViewer;
                            var cds = new Cesium.CzmlDataSource();
                            cds.loadUrl( childSource ).then( function() {
                                viewer.homeButton.viewModel.command();
                                var dataClock = cds.getClock();
                                if( typeof dataClock !== 'undefined' ) {
                                    dataClock.clone( viewer.clock );
                                    viewer.timeline.zoomTo( dataClock.startTime, dataClock.stopTime );
                                }                                
                            } );
                            viewer.dataSources.add( cds );


                        } else {
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
                        }
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

            if ( this.state.nodes[ childID ] ) {
                var node = this.state.nodes[ childID ];

                if ( node.geometryType !== undefined ) {
                    createGeometry.call( this, node );
                }

            }
        },
         
        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {
            
            if ( this.debug.deleting ) {
                this.logger.infox( "deletingNode", nodeID );
            }

            if ( this.state.nodes[ nodeID ] ) {
                var node = this.state.nodes[ nodeID ];
                var scene = this.state.scenes[ node.sceneID ];
                
                var sceneNode = findSceneNode.call( this, node );
                
                if ( node.cesiumObj ) {
                    if ( node.cesiumObj instanceof Cesium.Billboard ) {
                        if ( node.bbCollection ) {
                            node.bbCollection.remove( node.cesiumObj );
                            if ( node.bbCollection.getLength() == 0 ) {
                                sceneNode.scene.primitives.remove( node.bbCollection );
                            }
                            node.bbCollection = undefined;
                            node.cesiumObj = undefined;
                        }
                        node.cesiumObj = undefined;
                    } else if ( node.cesiumObj instanceof Cesium.Label ) {
                        if ( node.labelCollection ) {
                            node.labelCollection.remove( node.cesiumObj );
                            if ( node.labelCollection.getLength() == 0 ) {
                                sceneNode.scene.primitives.remove( node.labelCollection );
                            }
                            node.labelCollection = undefined;
                            node.cesiumObj = undefined;
                        }
                        node.cesiumObj = undefined;
                    } else if ( node.cesiumObj instanceof Cesium.Polyline ) {
                        var parentNode = this.state.nodes[ node.parentID ]; 
                        if ( parentNode ) {
                            if ( parentNode.cesiumObj instanceof Cesium.PolylineCollection ) {
                                // this should work, but there's an error in Cesium
                                // when an object is removed the member isn't deleted
                                // then later when the collection is removed, the _polylines
                                // var has a series of null references
                                //parentNode.cesiumObj.remove( node.cesiumObj );
                                node.cesiumObj = undefined;
                            }
                        }
                    } else if ( node.cesiumObj instanceof Cesium.PolylineCollection ) {
                        sceneNode.scene.primitives.remove( node.cesiumObj );
                        node.cesiumObj = undefined;
                    }
                }



                delete this.state.nodes[ nodeID ];
            }
        },

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

            if ( utility.validPropertyValue.call( this, propertyValue ) ) {
                var node = this.state.nodes[ nodeID ];
                if ( node === undefined ) node = this.state.scenes[ nodeID ];
                if ( node !== undefined ) {
                    switch ( propertyName ) {
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

            if ( utility.validPropertyValue.call( this, propertyValue ) ) {
                var node = this.state.nodes[ nodeID ];
                if ( node === undefined ) node = this.state.scenes[ nodeID ];
                if ( node !== undefined ) {
                    switch ( propertyName ) {
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

                if ( /*node.cesiumObj !== undefined &&*/ validPropertyValue.call( this, propertyValue ) ) {

                    switch ( propertyName ) {

                        case "visible":
                            if ( node.cesiumObj.hasOwnProperty( 'show' ) ) {
                                node.cesiumObj.show = Boolean( propertyValue );
                            } else if ( node.cesiumObj.setShow ) {
                                node.cesiumObj.setShow( Boolean( propertyValue ) );
                            }
                            break;

                        case "position":
                            if ( node.cesiumObj === undefined ) {
                                
                                if ( node.geometryType !== undefined ) {
                                    if ( node.properties !== undefined ) {
                                        node.properties[ propertyName ] = propertyValue;
                                    } else {
                                        // already created need to modify the existing object
                                    }
                                }
                            } else {

                                //console.info( "dist = " + ( Math.sqrt( (propertyValue[0] * propertyValue[0]) + (propertyValue[1] * propertyValue[1]) + (propertyValue[2] * propertyValue[2]) )  ) )
                                if ( node.cesiumObj.hasOwnProperty( propertyName ) ) {
                                    node.cesiumObj.position = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );                                
                                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                                        this.state.cameraInfo.position = node.cesiumObj.position;
                                    }
                                } else if ( node.cesiumObj.setPosition ) {
                                    var pos = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                                    node.cesiumObj.setPosition( pos );
                                    this.state.cameraInfo.isInitialized();
                                }
                            }
                            break;
                       
                        case "positions":
                        case "radius":
                        case "length": 
                        case "topRadius": 
                        case "bottomRadius":                        
                        case "dimensions":
                            if ( node.cesiumObj === undefined ) {
                                
                                if ( node.properties !== undefined ) {
                                    node.properties[ propertyName ] = propertyValue;
                                } else {
                                    // already created need to modify the existing object
                                }

                            }
                            break;

                        case "pixelOffset":
                            node.cesiumObj.pixelOffset = new Cesium.Cartesian2( propertyValue[0], propertyValue[1] );
                            break;

                        case "eyeOffset":
                            node.cesiumObj.eyeOffset = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                            break;

                        case "horizontalOrigin":
                            switch ( propertyValue ) {
                                case "left":
                                    node.cesiumObj.horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
                                    break;
                                case "right":
                                    node.cesiumObj.horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;
                                    break;
                                case "center":
                                    node.cesiumObj.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
                                    break;
                            }
                            break;

                        case "verticalOrigin": 
                            switch ( propertyValue ) {
                                case "top":
                                    node.cesiumObj.verticalOrigin = Cesium.VerticalOrigin.TOP;
                                    break;
                                case "bottom":
                                    node.cesiumObj.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                                    break;
                                case "center":
                                    node.cesiumObj.verticalOrigin = Cesium.VerticalOrigin.CENTER;
                                    break;
                            }
                            break;

                        case "scale":
                            node.cesiumObj.scale = parseFloat( propertyValue );;
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
                                if ( node.cesiumObj !== undefined ) {                            
                                    node.cesiumObj._color.red = vwfColor.red() / 255;
                                    node.cesiumObj._color.green = vwfColor.green() / 255;
                                    node.cesiumObj._color.blue = vwfColor.blue() / 255;
                                    node.cesiumObj._color.alpha = vwfColor.alpha();
                                } else if ( node.geometryType !== undefined ) {

                                    if ( node.properties !== undefined ) {
                                        node.properties[ propertyName ] = propertyValue;
                                    } else {
                                        // already created need to modify the existing object
                                    }

                                    
                                    //if ( node.geometryInstance === undefined ) {
                                    //    node.properties[ propertyName ] = propertyValue;
                                    //} else {
                                    //    var cColor = cesuimColor.call( this, propertyValue );
                                    //    // set the property in the geometrylistance.attributes
                                    //}
                                }
                            } 
                            break;

                        case "font":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                node.cesiumObj.font = propertyValue;    
                            }
                            break;

                        case "fillColor":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                if ( propertyValue instanceof String ) {
                                    propertyValue = propertyValue.replace( /\s/g, '' );
                                }
                                var vwfColor = new utility.color( propertyValue );
                                if ( vwfColor ) {                            
                                    node.cesiumObj.fillColor.red = vwfColor.red() / 255;
                                    node.cesiumObj.fillColor.green = vwfColor.green() / 255;
                                    node.cesiumObj.fillColor.blue = vwfColor.blue() / 255;
                                    node.cesiumObj.fillColor.alpha = vwfColor.alpha();
                                }                                
                            }                        
                            break;

                        case "style":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                switch ( propertyValue ) {
                                    case "fill":
                                        node.cesiumObj.style = Cesium.LabelStyle.FILL;
                                        break;
                                    case "filloutline":
                                        node.cesiumObj.style = Cesium.LabelStyle.FILL_AND_OUTLINE;
                                        break;
                                    case "outline":
                                        node.cesiumObj.style = Cesium.LabelStyle.OUTLINE;
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
                                    node.cesiumObj.outlineColor.red = vwfColor.red() / 255;
                                    node.cesiumObj.outlineColor.green = vwfColor.green() / 255;
                                    node.cesiumObj.outlineColor.blue = vwfColor.blue() / 255;
                                    node.cesiumObj.outlineColor.alpha = vwfColor.alpha();
                                }                                
                            }  
                            break;

                        case "outlineWidth":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                node.cesiumObj.outlineWidth = Number( propertyValue );    
                            }    
                            break;

                        case "text":
                            if ( node.cesiumObj instanceof Cesium.Label ) {
                                node.cesiumObj.text = propertyValue;    
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
                            } else if ( node.geometryInstance !== undefined ) {
                                node.geometryInstance.modelMatrix = arrayToMatrix.call( this, propertyValue );
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
                                // check the Material spec at //cesium.agi.com/refdoc.html
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
                                node.cesiumObj.positions = points;
                            }
                            break;

                        case "width":
                            if ( node.cesiumObj instanceof Cesium.Polyline ) {
                                node.cesiumObj.width = Number( propertyValue );
                            }
                            break;
                        
                        // case "extent":
                        //     if ( node.cesiumObj instanceof Cesium.Polygon ) {
                        //         var pv = propertyValue;
                        //         if ( pv instanceof Array ) {
                        //             switch ( pv.length ) {
                        //                 case 4:
                        //                     node.cesiumObj.configureExtent( new Cesium.Extent( pv[0], pv[1], pv[2], pv[3] ) );
                        //                     break;
                        //                 case 6:
                        //                     node.cesiumObj.configureExtent( new Cesium.Extent( pv[0], pv[1], pv[2], pv[3], pv[4], pv[5] ) );
                        //                     break;

                        //             }
                        //         }
                        //     }
                        //     value = undefined;
                        //     break;

                        case "height":
                            if ( node.cesiumObj === undefined ) {
                                if ( node.properties !== undefined ) {
                                    node.properties[ propertyName ] = propertyValue;
                                }
                            } else if ( node.cesiumObj instanceof Cesium.Polygon ) {
                                node.cesiumObj.height = Number( propertyValue );
                            }
                            break; 

                        case "hierarchy":
                            if ( node.cesiumObj instanceof Cesium.Polygon ) {
                                node.cesiumObj.configureFromPolygonHierarchy( propertyValue );
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

                        case "northPoleColor":
                            if ( node.cesiumObj instanceof Cesium.Globe ) {
                                if ( propertyValue instanceof String ) {
                                    propertyValue = propertyValue.replace( /\s/g, '' );
                                }
                                var vwfColor = new utility.color( propertyValue );
                                if ( vwfColor ) {                            
                                    node.cesiumObj.northPoleColor = new Cesium.Cartesian3( 
                                        vwfColor.red() / 255, 
                                        vwfColor.green() / 255, 
                                        vwfColor.blue() / 255 
                                    );
                                }
                            } 
                            break;

                        case "southPoleColor":
                            if ( node.cesiumObj instanceof Cesium.Globe ) {
                                if ( propertyValue instanceof String ) {
                                    propertyValue = propertyValue.replace( /\s/g, '' );
                                }
                                var vwfColor = new utility.color( propertyValue );
                                if ( vwfColor ) {                            
                                    node.cesiumObj.southPoleColor = new Cesium.Cartesian3( 
                                        vwfColor.red() / 255, 
                                        vwfColor.green() / 255, 
                                        vwfColor.blue() / 255 
                                    );
                                }
                            } 
                            break;
                            
                        case "logoOffset":
                            if ( node.cesiumObj instanceof Cesium.Globe ) {
                                node.cesiumObj.logoOffset = new Cesium.Cartesian2( Number( propertyValue[0], propertyValue[1] ) );
                            }
                            break;

                        case "tileCacheSize":
                            if ( node.cesiumObj instanceof Cesium.Globe ) {
                                node.cesiumObj.tileCacheSize = Number( propertyValue );
                            }
                            break;  

                        case "oceanNormalMapUrl":
                            if ( node.cesiumObj instanceof Cesium.Globe ) {
                                node.cesiumObj.oceanNormalMapUrl =  propertyValue;
                            }
                            break;

                        case "depthTestAgainstTerrain":
                            if ( node.cesiumObj instanceof Cesium.Globe ) {
                                node.cesiumObj.depthTestAgainstTerrain = Boolean( propertyValue );
                            }
                            break;

                        case "terrainProvider":
                            if ( node.cesiumObj instanceof Cesium.Globe ) {
                                if ( node.terrainProvider && node.terrainProvider == propertyValue ) {
                                    break;
                                }

                                var terrainProvider = undefined;
                                switch ( propertyValue ) {
                                    
                                    case "cesium":
                                        node.terrainProvider = propertyValue;
                                        terrainProvider = new Cesium.CesiumTerrainProvider({
                                            url : '//cesiumjs.org/smallterrain',
                                            credit : 'Terrain data courtesy Analytical Graphics, Inc.'
                                        });  
                                        break;

                                    case "cesiumMesh":
                                        node.terrainProvider = propertyValue;
                                        terrainProvider = new Cesium.CesiumTerrainProvider({
                                            url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
                                        });  
                                        break;

                                    case "vr":
                                        node.terrainProvider = propertyValue;
                                        terrainProvider = new Cesium.VRTheWorldTerrainProvider({
                                            url : '//www.vr-theworld.com/vr-theworld/tiles1.0.0/73/',
                                            credit : 'Terrain data courtesy VT MÄK'
                                        }); 
                                        break;

                                    default:
                                        terrainProvider = new Cesium.EllipsoidTerrainProvider();
                                        node.terrainProvider = "ellipsoid";
                                        break;

                                }

                                node.cesiumObj.depthTestAgainstTerrain = true;

                                if ( terrainProvider !== undefined ) {
                                    node.cesiumObj.terrainProvider = terrainProvider;
                                }
                            }
                            
                            value = undefined;
                            break;



                        default:
                            value = undefined;
                            break;

                    }
                } else {
                    value = undefined;    
                }


            } else if ( this.state.scenes[ nodeID ] ) {
                
                node = this.state.scenes[ nodeID ]; 
                var scene = node.scene;

                if ( ( node.cesiumWidget !== undefined || node.globe !== undefined ) && utility.validPropertyValue.call( this, propertyValue ) ) {

                    switch ( propertyName ) {

                        case "clientControl":
                            this.state.clientControl = propertyValue;
                            break;

                        case "cameraViewData":
                            if ( this.kernel.client() != this.kernel.moniker() ) {
                                var camera = scene._camera;
                                if ( propertyValue.direction ) {
                                    camera.direction = new Cesium.Cartesian3( propertyValue.direction[0], propertyValue.direction[1], propertyValue.direction[2] );
                                }
                                if ( propertyValue.position ) { 
                                    camera.position = new Cesium.Cartesian3( propertyValue.position[0], propertyValue.position[1], propertyValue.position[2] );
                                }
                                if ( propertyValue.up ) { 
                                    camera.up = new Cesium.Cartesian3( propertyValue.up[0], propertyValue.up[1], propertyValue.up[2] );
                                }
                                if ( propertyValue.right ) {
                                    camera.right = new Cesium.Cartesian3( propertyValue.right[0], propertyValue.right[1], propertyValue.right[2] );
                                }
                                this.state.cameraInfo.getCurrent( camera );
                            }
                            break;



                        case "imageryProvider":
                            
                            if ( node.imageryProvider && node.imageryProvider == propertyValue ) {
                                //we need to probably remember which image providers have been loaded and 
                                //then just switch the current if the requested has already been loaded
                                return;
                            }

                            var imageProvider = undefined;
                            var proxy = new Cesium.DefaultProxy('/proxy/');
                
                            
                            switch ( propertyValue ) {
                                case "bingAerial":
                                    imageProvider = new Cesium.BingMapsImageryProvider({
                                        url : '//dev.virtualearth.net',
                                        mapStyle : Cesium.BingMapsStyle.AERIAL
                                    });
                                    break;

                                case "bingAerialLabel":
                                    imageProvider = new Cesium.BingMapsImageryProvider({
                                        url : '//dev.virtualearth.net',
                                        mapStyle : Cesium.BingMapsStyle.AERIAL_WITH_LABELS
                                    });
                                    break;

                                case "bingRoad":
                                    imageProvider = new Cesium.BingMapsImageryProvider( {
                                        url: '//dev.virtualearth.net',
                                        mapStyle: Cesium.BingMapsStyle.ROAD
                                    } );                        
                                    break;

                                case "esriWorld":
                                    imageProvider = new Cesium.ArcGisMapServerImageryProvider({
                                        url : '//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
                                    });                      
                                    break;

                                case "esriStreet":
                                    imageProvider = new Cesium.ArcGisMapServerImageryProvider({
                                        url : '//server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
                                    } );                       
                                    break;

                                case "esriGeo":
                                    imageProvider = new Cesium.ArcGisMapServerImageryProvider({
                                        url : '//services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/',
                                        proxy : proxy
                                    });                      
                                    break;

                                case "openStreet":
                                    imageProvider = new Cesium.OpenStreetMapImageryProvider({});
                                    break;

                                case "mapQuestStreet":
                                    imageProvider = new Cesium.OpenStreetMapImageryProvider({
                                        url: '//otile1.mqcdn.com/tiles/1.0.0/osm/'
                                    });
                                    break;

                                case "stamen":
                                    imageProvider = new Cesium.OpenStreetMapImageryProvider({
                                        url: '//stamen-tiles.a.ssl.fastly.net/watercolor/',
                                        fileExtension: 'jpg',
                                        credit: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.'
                                    });
                                    break;

                                case "naturalEarth":
                                    imageProvider = new Cesium.TileMapServiceImageryProvider({
                                        url : require.toUrl('Assets/Textures/NaturalEarthII')
                                    });
                                    break;

                                case "single":
                                    imageProvider = new Cesium.SingleTileImageryProvider({
                                        url : require.toUrl('Assets/Textures/NE2_LR_LC_SR_W_DR_2048.jpg')
                                    } );
                                    break;

                                case "usInfrared":
                                    imageProvider = new Cesium.WebMapServiceImageryProvider({
                                        url : '//mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?',
                                        layers : 'goes_conus_ir',
                                        credit : 'Infrared data courtesy Iowa Environmental Mesonet',
                                        parameters : {
                                            transparent : 'true',
                                            format : 'image/png'
                                        },
                                        proxy : new Cesium.DefaultProxy('/proxy/')
                                    });
                                    break;

                                case "usWeather":
                                    imageProvider = new Cesium.WebMapServiceImageryProvider({
                                        url : '//mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?',
                                        layers : 'nexrad-n0r',
                                        credit : 'Radar data courtesy Iowa Environmental Mesonet',
                                        parameters : {
                                            transparent : 'true',
                                            format : 'image/png'
                                        },
                                        proxy : new Cesium.DefaultProxy('/proxy/')
                                    });
                       
                                    break;

                                case "tms":
                                    imageProvider = new Cesium.TileMapServiceImageryProvider({
                                        url : '../images/cesium_maptiler/Cesium_Logo_Color'
                                    });
                                    break;

                                case "image":
                                    imageProvider = new Cesium.SingleTileImageryProvider({
                                        url : '../images/Cesium_Logo_overlay.png',
                                        rectangle : Cesium.Rectangle.fromDegrees(-115.0, 38.0, -107, 39.75)
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
                                // if ( node && node.cesiumWidget !== undefined ) {
                                //     // how does the widget add an image layer
                                //     node.cesiumWidget._globe.getImageryLayers().addImageryProvider( imageProvider );
                                // } else if ( node.globe !== undefined ) {
                                //     node.globe.getImageryLayers().addImageryProvider( imageProvider );
                                // }
                                node.imageryProvider = propertyValue;
                            }
                            value = undefined;
                            break;


                        case "renderStyle":
                            // using the Cesium.Widget
                            if ( node.cesiumWidget ) {
                                
                                var currentRS = this.gettingProperty( nodeID, propertyName );
                                if ( currentRS != propertyValue ) {
                                    switch ( propertyValue ) {
                                        case "3D":
                                            node.cesiumWidget._transitioner.to3D();
                                            break;
                                        case "2D":
                                            node.cesiumWidget._transitioner.to2D();
                                            break;
                                        case "2.5D":
                                            node.cesiumWidget._transitioner.toColumbusView();
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

                        case "enableLook": 
                            if( node.scene ) {
                                var controller = node.scene.getScreenSpaceCameraController();
                                if ( controller ) {
                                    controller.enableLook = Boolean( propertyValue );
                                }
                            }
                            break;

                        case "enableRotate": 
                            if( node.scene ) {
                                var controller = node.scene.getScreenSpaceCameraController();
                                if ( controller ) {
                                    controller.enableRotate = Boolean( propertyValue );
                                }
                            }
                            break;

                        case "enableTilt":
                            if( node.scene ) {
                                var controller = node.scene.getScreenSpaceCameraController();
                                if ( controller ) {
                                    controller.enableTilt = Boolean( propertyValue );
                                }
                            }
                            break; 

                        case "enableTranslate":
                            if( node.scene ) {
                                var controller = node.scene.getScreenSpaceCameraController();
                                if ( controller ) {
                                    controller.enableTranslate = Boolean( propertyValue );
                                }
                            } 
                            break;

                        case "enableZoom": 
                            if( node.scene ) {
                                var controller = node.scene.getScreenSpaceCameraController();
                                if ( controller ) {
                                    controller.enableZoom = Boolean( propertyValue );
                                }
                            }
                            break;


                        case "clientControl": //
                            // propertyValue.event is being ignored 
                            if ( this.state.clientControl.locked == false ) {

                                if ( this.state.clientControl.controller != propertyValue.controller ) {
                                    // switching controllers, disable all non-controllers
                                    if ( propertyValue.controller != this.kernel.moniker() ) {
                                        this.state.mouse.enable( false );
                                    }
                                }

                                // new client in control
                                this.state.clientControl = propertyValue;

                            } else if ( !propertyValue.locked ) {
                                // leave the controller set, but update locked 
                                // this will allow the camera to keep moving by the 
                                // current controller
                                if ( this.state.clientControl.controller == propertyValue.controller ) {
                                    this.state.clientControl.locked = false;
                                    this.state.mouse.enable( true );
                                }
                            } else {
                                console.info( "state.clientControl ignoring:{ event: " + propertyValue.event + ", controller: " + propertyValue.controller + ", locked: " + propertyValue.locked + " }" );
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
                value = undefined;
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
                        var pos = node.cesiumObj.position;
                        if ( pos ) {
                            value = [ pos.x, pos.y, pos.z ];
                        }
                    }
                    break;

                case "pixelOffset":
                    if ( node.cesiumObj ) {
                        var pos = node.cesiumObj.pixelOffset;
                        value = [ pos.x, pos.y ];
                    }
                    break;

                case "eyeOffset":
                    if ( node.cesiumObj ) {
                        var pos = node.cesiumObj.eyeOffset;
                        value = [ pos.x, pos.y, pos.z ];
                    }
                case "horizontalOrigin":
                    if ( node.cesiumObj ) {
                        switch ( node.cesiumObj.horizontalOrigin ) {
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
                        switch ( node.cesiumObj.verticalOrigin ) {
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
                        value = node.cesiumObj.scale;
                    }
                    break;

                case "imageIndex": 
                    if ( node.cesiumObj ) {
                        value = node.cesiumObj.imageIndex;
                    }
                    break;

                case "color": 
                    if( node.cesiumObj ) {
                        var clr = node.cesiumObj._color;
                        if ( clr.alpha == 1 ) {
                            value = "rgb("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+")";
                        } else {
                            value = "rgba("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+","+clr.alpha+")";
                        }
                    }
                    break;

                case "font":
                    if ( node.cesiumObj instanceof Cesium.Label ) {
                        value = node.cesiumObj.font;    
                    }
                    break;

                case "fillColor":
                    if( node.cesiumObj ) {
                        var clr = node.cesiumObj.fillColor;
                        if ( clr.alpha == 1 ) {
                            value = "rgb("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+")";
                        } else {
                            value = "rgba("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+","+clr.alpha+")";
                        }
                    }                      
                    break;

                case "style":
                    if ( node.cesiumObj instanceof Cesium.Label ) {
                        switch ( node.cesiumObj.style ) {
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
                        var clr = node.cesiumObj.outLineColor;
                        if ( clr.alpha == 1 ) {
                            value = "rgb("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+")";
                        } else {
                            value = "rgba("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+","+clr.alpha+")";
                        }
                    } 
                    break;

                case "outlineWidth":
                    if ( node.cesiumObj instanceof Cesium.Label ) {
                        value = node.cesiumObj.outlineWidth;    
                    }    
                    break;

                case "text":
                    if ( node.cesiumObj instanceof Cesium.Label ) {
                        value = node.cesiumObj.text;    
                    }    
                    break;


                case "imageryProvider":
                    break;
                    
                case "terrainProvider":
                    break;

                case "northPoleColor":
                    if ( node.cesiumObj instanceof Cesium.Globe ) {
                        var clr = node.cesiumObj.northPoleColor;
                        value = "rgb(" + ( clr.x*255 ) + "," + (clr.y*255) + "," + (clr.z*255) + ")";
                    } 
                    break;

                case "southPoleColor":
                    if ( node.cesiumObj instanceof Cesium.Globe ) {
                        var clr = node.cesiumObj.southPoleColor;
                        value = "rgb(" + ( clr.x*255 ) + "," + (clr.y*255) + "," + (clr.z*255) + ")";
                    } 
                    break;
                    break;
                    
                case "logoOffset":
                    if ( node.cesiumObj instanceof Cesium.Globe ) {
                        var pos = node.cesiumObj.logoOffset;
                        
                        value = pos !== undefined ? [ pos.x, pos.y ] : undefined;
                    }
                    break;

                case "tileCacheSize":
                    if ( node.cesiumObj instanceof Cesium.Globe ) {
                        value = node.cesiumObj.tileCacheSize;
                    }
                    break;  

                case "oceanNormalMapUrl":
                    if ( node.cesiumObj instanceof Cesium.Globe ) {
                        value = node.cesiumObj.oceanNormalMapUrl;
                    }
                    break;

                case "depthTestAgainstTerrain":
                    if ( node.cesiumObj instanceof Cesium.Globe ) {
                        value = node.cesiumObj.depthTestAgainstTerrain;
                    }
                    break;


                case "cameraViewData":
                    if ( node.scene ) {
                        var camera = node.scene._camera;
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

                case "clientControl":
                    value = this.state.clientControl;
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
                    } else if ( node.geometryInstance !== undefined ) {
                        node.geometryInstance.modelMatrix = arrayToMatrix.call( this, propertyValue );
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
                                                value[ prop ] = "rgb("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+")";
                                            } else {
                                                value[ prop ] = "rgba("+(clr.red*255)+","+(clr.green*255)+","+(clr.blue*255)+","+clr.alpha+")";
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
                        var cesiumPoints = node.cesiumObj.positions;
                        var len = cesiumPoints.length;

                        value = [];
                        for ( var i = 0; i < len; i++ ) {
                            value.push( [ cesiumPoints[i].x, cesiumPoints[i].y, cesiumPoints[i].z ] );
                        }
                    }
                    break;

                case "width":
                    if ( node.cesiumObj instanceof Cesium.Polyline ) {
                        value = node.cesiumObj.width;
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

                case "enableLook": 
                    if( node.scene ) {
                        var controller = node.scene.getScreenSpaceCameraController();
                        if ( controller ) {
                            value = controller.enableLook;
                        }
                    }
                    break;
                case "enableRotate": 
                    if( node.scene ) {
                        var controller = node.scene.getScreenSpaceCameraController();
                        if ( controller ) {
                            value = controller.enableRotate;
                        }
                    }
                    break;
                case "enableTilt":
                    if( node.scene ) {
                        var controller = node.scene.getScreenSpaceCameraController();
                        if ( controller ) {
                            value = controller.enableTilt;
                        }
                    }
                    break; 
                case "enableTranslate":
                    if( node.scene ) {
                        var controller = node.scene.getScreenSpaceCameraController();
                        if ( controller ) {
                            value = controller.enableTranslate;
                        }
                    } 
                    break;
                case "enableZoom": 
                    if( node.scene ) {
                        var controller = node.scene.getScreenSpaceCameraController();
                        if ( controller ) {
                            value = controller.enableZoom;
                        }
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

    function isGlobe( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-globe-vwf" );    
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
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-dynamicObject-vwf" );   
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


    function isBoxGeometry( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-boxGeometry-vwf" );   
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


    function cesuimColor( color ) {
        if ( color instanceof String ) {
            color = color.replace( /\s/g, '' );
        }
        var vwfColor = new utility.color( color );
        if ( vwfColor ) { 
            return new Cesium.Color( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255, vwfColor.alpha() );
        }  
        return new Cesium.Color( 1.0, 1.0, 1.0, 1.0 );       
    }

    function matrixToArray( mat ) {
        return [ mat['0'], mat['1'], mat['2'], mat['3'], mat['4'], mat['5'], mat['6'], mat['7'], mat['8'], mat['9'], mat['10'], mat['11'], mat['12'], mat['13'], mat['14'], mat['15'] ];
    }


    function arrayToMatrix( arry ) {
        return Cesium.Matrix4.fromRowMajorArray( arry );
    }

    function validPropertyValue( obj ) {
      var objType = ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
      return ( objType != 'null' && objType != 'undefined' );
    }

    function getCentralBody( sceneNode, node ) {
        if ( sceneNode.centralBody ) {
            return sceneNode.centralBody;
        }
    }


    function createGeometry( node ) {

        var sceneNode = findSceneNode.call( this, node );

        if ( sceneNode === undefined ) {
            return;
        }

        var centralBody = getCentralBody.call( this, sceneNode, node );

        if ( centralBody === undefined ) {
            return;
        }

        var primitives = sceneNode.scene.primitives;
        var ellipsoid = centralBody.getEllipsoid();

        var dimensions;
        var modelMatrix;
        var posOnEllipsoid;
        var dim = node.properties[ 'dimensions' ];
        var pos = node.properties[ 'position' ];
        var color = node.properties[ 'color' ] !== undefined ? cesuimColor.call( this, node.properties[ 'color' ] ) : new Cesium.Color( 1.0, 1.0, 1.0, 1.0 );

        dimensions = new Cesium.Cartesian3( dim[0], dim[1], dim[2] );
        posOnEllipsoid = ellipsoid.cartographicToCartesian( Cesium.Cartographic.fromDegrees( pos[0], pos[1] ) );
        modelMatrix = Cesium.Matrix4.multiplyByTranslation(
            Cesium.Transforms.eastNorthUpToFixedFrame( posOnEllipsoid ),
            new Cesium.Cartesian3( 0.0, 0.0, dimensions.z * 0.5 ) );


        switch ( node.geometryType ) {
            case "box":
                node.geometry = Cesium.BoxGeometry.fromDimensions( {
                    "vertexFormat" : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                    "dimensions" : dimensions
                } );

                node.geometryInstance = new Cesium.GeometryInstance( {
                    "geometry" : node.geometry,
                    "modelMatrix" : modelMatrix,
                    "attributes" : {
                        "color" : Cesium.ColorGeometryInstanceAttribute.fromColor( color )
                    }
                } );

                node.primitive = new Cesium.Primitive( {
                    "geometryInstances" : node.geometryInstance,
                    "appearance" : new Cesium.PerInstanceColorAppearance( { "closed": true } )
                } );
                primitives.add( node.primitive );            
                break;
        }

        node.properties = undefined;
    }

});


/*
        var consoleCartesianArray = function( a ) {
            var s = "[ "
            var len = a.length;
            for ( var i = 0; i < len; i++ ) {
                s += "[ ";
                s += a[i].x + ", ";
                s += a[i].y + ", ";
                s += a[i].z;
                s += " ], ";
            }    
            s += " ]"    
                
            console.info( s );
        }
*/