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

  
    
define( [ "module", 
          "vwf/model", 
          "vwf/utility", 
          "vwf/utility/color", 
          "vwf/model/cesium/Cesium" 
        ], 

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
            
            this.state.createImageryProvider = function( options ) {
                var imageProvider = undefined;
                if ( options && options.imageryProvider ) {
                    var url, ext, credit, type, mapStyle, params, layers;

                    if ( !utility.isString( options ) ) {
                        url = options.imageryProvider.url;
                        ext = options.imageryProvider.fileExtension;
                        mapStyle = options.imageryProvider.mapStyle;
                        credit = options.imageryProvider.credit;
                        type = options.imageryProvider.type;
                        params = options.imageryProvider.params;
                        layers = options.imageryProvider.layers;
                    } else {
                        type = options.imageryProvider;     
                    }

                    switch ( type ) {
                        
                        case "bingAerial":
                            imageProvider = new Cesium.BingMapsImageryProvider({
                                "url" : url || '//dev.virtualearth.net',
                                "mapStyle" : mapStyle || Cesium.BingMapsStyle.AERIAL
                            });
                            break;

                        case "bingAerialLabel":
                            imageProvider = new Cesium.BingMapsImageryProvider({
                                "url" : url || '//dev.virtualearth.net',
                                "mapStyle" : mapStyle || Cesium.BingMapsStyle.AERIAL_WITH_LABELS
                            });
                            break;

                        case "bingRoad":
                            imageProvider = new Cesium.BingMapsImageryProvider( {
                                "url": url || '//dev.virtualearth.net',
                                "mapStyle": mapStyle || Cesium.BingMapsStyle.ROAD
                            } );                        
                            break;

                        case "esriWorld":
                            imageProvider = new Cesium.ArcGisMapServerImageryProvider({
                                "url" : url || '//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
                            });                      
                            break;

                        case "esriStreet":
                            imageProvider = new Cesium.ArcGisMapServerImageryProvider({
                                "url" : url || '//server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
                            } );                       
                            break;

                        case "esriGeo":
                            imageProvider = new Cesium.ArcGisMapServerImageryProvider({
                                "url" : url || '//services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/',
                                "proxy" : new Cesium.DefaultProxy('/proxy/')
                            });                      
                            break;

                        case "openStreet":
                            imageProvider = new Cesium.OpenStreetMapImageryProvider({});
                            break;

                        case "mapQuestStreet":
                            imageProvider = new Cesium.OpenStreetMapImageryProvider({
                                "url": url || '//otile1.mqcdn.com/tiles/1.0.0/osm/'
                            });
                            break;

                        case "stamen":
                            imageProvider = new Cesium.OpenStreetMapImageryProvider({
                                "url": url || '//stamen-tiles.a.ssl.fastly.net/watercolor/',
                                "fileExtension": fileExtension || 'jpg',
                                "credit": credit || 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.'
                            });
                            break;

                        case "naturalEarth":
                            imageProvider = new Cesium.TileMapServiceImageryProvider({
                                "url" : url ||  require.toUrl('Assets/Textures/NaturalEarthII')
                            });
                            break;

                        case "single":
                            imageProvider = new Cesium.SingleTileImageryProvider({
                                "url" : url || require.toUrl('Assets/Textures/NE2_LR_LC_SR_W_DR_2048.jpg')
                            } );
                            break;

                        case "usInfrared":
                            imageProvider = new Cesium.WebMapServiceImageryProvider({
                                "url" : url || '//mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?',
                                "layers" : layers || 'goes_conus_ir',
                                "credit" : credit || 'Infrared data courtesy Iowa Environmental Mesonet',
                                "parameters" : params || {
                                    "transparent" : 'true',
                                    "format" : 'image/png'
                                },
                                "proxy": new Cesium.DefaultProxy('/proxy/')
                            });
                            break;

                        case "usWeather":
                            imageProvider = new Cesium.WebMapServiceImageryProvider({
                                "url" : url || '//mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?',
                                "layers" : layers || 'nexrad-n0r',
                                "credit" : credit || 'Radar data courtesy Iowa Environmental Mesonet',
                                "parameters" : params || {
                                    "transparent" : 'true',
                                    "format" : 'image/png'
                                },
                                "proxy" : new Cesium.DefaultProxy('/proxy/')
                            });
               
                            break;

                        case "tms":
                            imageProvider = new Cesium.TileMapServiceImageryProvider({
                                "url" : url || '../images/cesium_maptiler/Cesium_Logo_Color'
                            });
                            break;

                        case "image":
                            imageProvider = new Cesium.SingleTileImageryProvider({
                                "url" : url || '../images/Cesium_Logo_overlay.png',
                                "rectangle" : Cesium.Rectangle.fromDegrees(-115.0, 38.0, -107, 39.75)
                            });
                            break;

                        case "grid":
                            imageProvider = new Cesium.GridImageryProvider();
                            break;

                        case "tile":
                            imageProvider = new Cesium.TileCoordinatesImageryProvider();
                            break;

                    }
                    options.imageryProvider = imageProvider;
                }
                return imageProvider;

            };
            
            this.state.createTerrainProvider = function( options ) {
                var terrainProvider = undefined;
                if ( options ) {
                    var type, url, credit, ext;

                    type = utility.isString( options ) ? options : options.type;
                    url = options.url || undefined;
                    credit = options.credit || undefined;
                    ext = options.ext || undefined; 

                    switch ( type ) {
                        
                        case "cesium":   // remove if all refences can be found
                        case "CesiumTerrainProvider":
                            terrainProvider = new Cesium.CesiumTerrainProvider({
                                url : url || '//cesiumjs.org/smallterrain',
                                credit : credit || 'Terrain data courtesy Analytical Graphics, Inc.'
                            });  
                            break;

                        case "NaturalEarthII":
                        case "TileMapServiceImageryProvider":
                            terrainProvider = new Cesium.TileMapServiceImageryProvider({
                                url: url || '../vwf/model/Assets/Textures/NaturalEarthII',
                                fileExtension: ext || 'jpg'
                            });
                            break;

                        case "cesiumMesh":
                            terrainProvider = new Cesium.CesiumTerrainProvider({
                                url : url || '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
                            });  
                            break;

                        case "ArcGisImageServerTerrainProvider":
                            terrainProvider = new Cesium.ArcGisImageServerTerrainProvider({
                                url : url || '//elevation.arcgisonline.com/ArcGIS/rest/services/WorldElevation/DTMEllipsoidal/ImageServer',
                                // sample token : 'KED1aF_I4UzXOHy3BnhwyBHU4l5oY6rO6walkmHoYqGp4XyIWUd5YZUC1ZrLAzvV40pR6gBXQayh0eFA8m6vPg..',
                                proxy : new Cesium.DefaultProxy('/terrain/')
                            }); 
                            break;

                        default:
                            // tilingScheme - parm 1
                            // ellipsoid - parm 2
                            terrainProvider = new Cesium.EllipsoidTerrainProvider();
                            break;

                    }
                }
                return terrainProvider;
            };
            this.state.createClock = function( options ) {

            };
            this.state.createSkyBox = function( options ) {

            };
            this.state.setSceneMode = function( options ) {

            };
            this.state.createMapProjection = function( options ) {

            };


            // turns on logger debugger console messages 
            this.debug = {
                "creation": false,
                "initializing": false,
                "parenting": false,
                "deleting": false,
                "properties": false,
                "initProperties": false,
                "createProperties": false,
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
            var appID = this.kernel.application();

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            var self = this;
            var kernel = this.kernel;

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

            var createSceneNode = function( id ) {
                var sNode = createNode();
                sNode.sceneNode = findSceneNode.call( self, sNode )
                return sNode;
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
                    node.terrainProviderValue = "";
                    node.imageryProviderValue = "";
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

                this.state.nodes[ childID ] = node = createSceneNode( childID );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode && parentNode.cesiumObj instanceof Cesium.Entity ) {
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
                    var bbCollection = node.sceneNode.scene.primitives.add( new Cesium.BillboardCollection() );

                    var bb = bbCollection.add( {
                        "image": canvas,
                        "imageId": childID,
                        "color" : Cesium.Color.RED,
                        "scale" : 1,
                        "imageIndex": 0
                    } );
                    
                    node.bbCollection = bbCollection; 
                    node.cesiumObj = bb;
                    node.cesiumObj.vwfID = childID;
                    
                }

            } else if ( isLabel.call( this, protos ) ) {

                this.state.nodes[ childID ] = node = createSceneNode( childID );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode && parentNode.cesiumObj instanceof Cesium.Entity ) {
                    node.cesiumObj = parentNode.cesiumObj.label;
                } else {
                    var labels = node.sceneNode.scene.primitives.add( new Cesium.LabelCollection() );
                    var lbl = labels.add( {
                        "font"      : '10px Helvetica',
                        "fillColor" : { red : 0.0, blue : 1.0, green : 1.0, alpha : 1.0 },
                        "outlineColor" : { red : 0.0, blue : 0.0, green : 0.0, alpha : 1.0 },
                        "outlineWidth" : 2,
                        "style" : Cesium.LabelStyle.FILL_AND_OUTLINE
                    } );

                    node.labelCollection = labels; 
                    node.cesiumObj = lbl;
                    node.cesiumObj.vwfID = childID;
                }

            } else if ( isPolylineCollection.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createSceneNode( childID );

                node.cesiumObj = new Cesium.PolylineCollection();
                node.cesiumObj.vwfID = childID;  

            } else if ( isPolyline.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createSceneNode( childID );
                parentNode = findParent.call( this, nodeID );

                if ( parentNode && parentNode.cesiumObj instanceof Cesium.Entity ) {
                    node.cesiumObj = parentNode.cesiumObj.polyline;
                } else { 
                    var primitives = node.sceneNode.scene.primitives;               
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
            

            } else if ( isGeometry.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createSceneNode( childID );

                node.geometry = undefined;
                node.cesiumObj = undefined;
                node.primitive = undefined;

            } else if ( isModel.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createSceneNode( childID );

                node.cesiumObj = undefined;

                loadAsset( node );

            } else if ( isMaterial.call( this, protos ) ) { 

                this.state.nodes[ childID ] = node = createSceneNode( childID );
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
                        node.context = node.scene._context;
                    }
                    node.cesiumObj = Cesium.Material.fromType( node.context, childType.type );
                    if ( parentNode.cesiumObj.setMaterial ) {
                        parentNode.cesiumObj.setMaterial( node.cesiumObj );
                    } else {
                        parentNode.cesiumObj.material = node.cesiumObj;
                    }
                }                

            } else if ( isCamera.call( this, protos ) ) {
                this.state.nodes[ childID ] = node = createSceneNode( childID );

                if ( nodeID === this.kernel.application() && childName === 'camera' ) {
                    node.cesiumObj = node.sceneNode.scene.camera;
                } else {
                    var camera = new Cesium.Camera( canvas );
                    camera.position = toCartesian3();
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

            // if ( this.state.nodes[ childID ] ) {
            //     var node = this.state.nodes[ childID ];

            //     if ( node.geometryType !== undefined ) {
            //         createGeometryPrimitive( childID, undefined );
            //     }

            // }
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

            if ( this.debug.properties || this.debug.createProperties) {
                this.logger.infox( "C === creatingProperty ", nodeID, propertyName, propertyValue );
            }

            if ( utility.validObject( propertyValue ) ) {
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

            if ( this.debug.properties || this.debug.initProperties ) {
                this.logger.infox( "  I === initializingProperty ", nodeID, propertyName, propertyValue );
            }

            if ( utility.validObject( propertyValue ) ) {
                var node = this.state.nodes[ nodeID ];
                if ( node === undefined ) node = this.state.scenes[ nodeID ];
                
                if ( node !== undefined ) {
                    switch ( propertyName ) {
                        
                        case "geometryDefinition":
                            var geoDef = JSON.parse( JSON.stringify( propertyValue ) );
                            var geoObjects = createGeometryPrimitive( nodeID, geoDef );

                            if ( geoObjects !== undefined ) {
                                node.geometry = geoObjects.geometry;
                                node.cesiumObj = geoObjects.geometryInstance;
                                node.primitive = geoObjects.primitive;

                                if ( node.cesiumObj !== undefined ) {
                                    node.sceneNode.scene.primitives.add( node.primitive );    
                                }                    
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

                if ( utility.validObject( propertyValue ) ) {

                    switch ( propertyName ) {

                        case "visible":
                            if ( node.cesiumObj.show !== undefined ) {
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

                                if ( node.cesiumObj.position !== undefined ) {
                                    node.cesiumObj.position = toCartesian3( propertyValue );                                
                                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                                        this.state.cameraInfo.position = node.cesiumObj.position;
                                    }
                                } else if ( node.cesiumObj.setPosition ) {
                                    var pos = toCartesian3( propertyValue );
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
                            node.cesiumObj.pixelOffset = toCartesian2( propertyValue );
                            break;

                        case "eyeOffset":
                            node.cesiumObj.eyeOffset = toCartesian3( propertyValue );
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
                                node.cesiumObj.direction = toCartesian3( propertyValue );
                                this.state.cameraInfo.direction = node.cesiumObj.direction;
                                this.state.cameraInfo.isInitialized();
                            }
                            break;

                        case "fovy":
                            if ( node.cesiumObj instanceof Cesium.Camera && node.cesiumObj.frustum ) {
                                node.cesiumObj.frustum.fovy = parseFloat( propertyValue );
                            }                    
                            break;

                        case "near":
                            if ( node.cesiumObj instanceof Cesium.Camera && node.cesiumObj.frustum ) {
                                node.cesiumObj.frustum.near = parseFloat( propertyValue );
                            }
                            break;

                        case "far":
                            if ( node.cesiumObj instanceof Cesium.Camera && node.cesiumObj.frustum ) {
                                node.cesiumObj.frustum.far = parseFloat( propertyValue );
                            }
                            break;

                        case "right":
                            if ( node.cesiumObj instanceof Cesium.Camera ) {
                                node.cesiumObj.right = toCartesian3( propertyValue );
                                this.state.cameraInfo.right = node.cesiumObj.right;
                                this.state.cameraInfo.isInitialized();
                            }                    
                            break;

                        case "transform":
                            if ( node.cesiumObj instanceof Cesium.Camera ) {
                                node.cesiumObj.transform = arrayToMatrix4( propertyValue );
                            } 
                            break;

                        case "modelMatrix":
                            if ( node.cesiumObj !== undefined ) {
                                if ( node.cesiumObj.hasOwnProperty( propertyName ) ) {
                                    node.cesiumObj.modelMatrix = arrayToMatrix4( propertyValue );
                                }
                            }
                            break;

                        case "up":
                            if ( node.cesiumObj instanceof Cesium.Camera ) {
                                node.cesiumObj.up = toCartesian3( propertyValue );
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
                                                    uni.color = cesiumColor( propertyValue[ prop ] )
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
                            if ( node.cesiumObj instanceof Cesium.Polyline || node.cesiumObj instanceof Cesium.Geometry ) {
                                var points = [];
                                if ( propertyValue instanceof Array ) {
                                    var len = propertyValue.length;
                                    for ( var i = 0; i < len; i++ ) {
                                        points.push( toCartesian3( propertyValue ) );
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
                            if ( node.cesiumObj instanceof Cesium.Entity ) {
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
                        //    if ( node.cesiumObj instanceof Cesium.Entity ) {
                        //    
                        //    }
                        //    break;
                        //case "point":
                        //    if ( node.cesiumObj instanceof Cesium.Entity ) {
                        //    
                        //    }
                        //    break;
                        //case "vector":
                        //    if ( node.cesiumObj instanceof Cesium.Entity ) {
                        //    
                        //    }
                        //    break;
                        //case "vertexPositions":
                        //    if ( node.cesiumObj instanceof Cesium.Entity ) {
                        //    
                        //    }
                        //    break;



                        case "viewFrom":
                            if ( node.cesiumObj instanceof Cesium.Entity ) {
                               node.cesiumObj.viewFrom = toCartesian3( propertyValue );
                            }
                            break;

                        case "northPoleColor":
                            if ( node.cesiumObj instanceof Cesium.Globe ) {
                                var vwfColor = new utility.color( propertyValue );
                                if ( vwfColor ) {                            
                                    node.cesiumObj.northPoleColor = vwfColorToCartesian3( vwfColor );
                                }
                            } 
                            break;

                        case "southPoleColor":
                            if ( node.cesiumObj instanceof Cesium.Globe ) {
                                var vwfColor = new utility.color( propertyValue );
                                if ( vwfColor ) {                            
                                    node.cesiumObj.southPoleColor = vwfColorToCartesian3( vwfColor );
                                }
                            } 
                            break;
                            
                        case "logoOffset":
                            if ( node.cesiumObj instanceof Cesium.Globe ) {
                                node.cesiumObj.logoOffset = toCartesian2( propertyValue );
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
                                
                                var requestedType = propertyValue.type || propertyValue.terrainProvider || propertyValue;
                                if ( requestedType === node.terrainProviderValue ) {
                                    break;
                                }

                                node.terrainProvider = this.state.createTerrainProvider( propertyValue );
                               
                                node.cesiumObj.depthTestAgainstTerrain = ( node.terrainProvider !== undefined );

                                if ( node.terrainProvider !== undefined ) {
                                    node.terrainProviderValue = requestedType;
                                    node.cesiumObj.terrainProvider = node.terrainProvider;
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

                if ( ( node.cesiumWidget !== undefined || scene.globe !== undefined ) && utility.validObject( propertyValue ) ) {

                    switch ( propertyName ) {

                        case "clientControl":
                            this.state.clientControl = propertyValue;
                            break;

                        case "cameraViewData":
                            if ( this.kernel.client() != this.kernel.moniker() ) {
                                var camera = scene._camera;
                                if ( propertyValue.direction ) {
                                    camera.direction = toCartesian3( propertyValue.direction );
                                }
                                if ( propertyValue.position ) { 
                                    camera.position = toCartesian3( propertyValue.position );
                                }
                                if ( propertyValue.up ) { 
                                    camera.up = toCartesian3( propertyValue.up );
                                }
                                if ( propertyValue.right ) {
                                    camera.right = toCartesian3( propertyValue.right );
                                }
                                this.state.cameraInfo.getCurrent( camera );
                            }
                            break;

                        case "imageryProvider":
                            var requestedType = propertyValue.type || propertyValue.terrainProvider;
                            if ( node.imageryProviderValue === requestedType ) {
                                return;
                            }
                
                            node.imageProvider = this.state.createImageryProvider ( { 
                                "imageryProvider": propertyValue
                            } );                            

                            if ( node.imageProvider !== undefined ) {
                                scene.globe.imageryLayers().addImageryProvider( node.imageProvider );
                                node.imageryProviderValue = requestedType;
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
                                node.scene.backgroundColor = cesiumColor( propertyValue );
                            }
                            break;

                        case "enableLook": 
                            if( node.scene ) {
                                var controller = node.scene.screenSpaceCameraController;
                                if ( controller ) {
                                    controller.enableLook = Boolean( propertyValue );
                                }
                            }
                            break;

                        case "enableRotate": 
                            if( node.scene ) {
                                var controller = node.scene.screenSpaceCameraController;
                                if ( controller ) {
                                    controller.enableRotate = Boolean( propertyValue );
                                }
                            }
                            break;

                        case "enableTilt":
                            if( node.scene ) {
                                var controller = node.scene.screenSpaceCameraController;
                                if ( controller ) {
                                    controller.enableTilt = Boolean( propertyValue );
                                }
                            }
                            break; 

                        case "enableTranslate":
                            if( node.scene ) {
                                var controller = node.scene.screenSpaceCameraController;
                                if ( controller ) {
                                    controller.enableTranslate = Boolean( propertyValue );
                                }
                            } 
                            break;

                        case "enableZoom": 
                            if( node.scene ) {
                                var controller = node.scene.screenSpaceCameraController;
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
                    if( node.cesiumObj && node.cesiumObj._color ) {
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
                        var clr = node.cesiumObj.outlineColor;
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
                        value = node.cesiumObj.frustum.fovy;
                    }                    
                    break;

                case "near":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        value = node.cesiumObj.frustum.near;
                    }
                    break;

                case "far":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        value = node.cesiumObj.frustum.far;
                    }
                    break;

                case "right":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        var vec3 = node.cesiumObj.right;
                        value = [ vec3.x, vec3.y, vec3.z ];                    }                    
                    break;

                case "transform":
                    if ( node.cesiumObj instanceof Cesium.Camera ) {
                        value = matrix4ToArray( node.cesiumObj.transform );
                    } 
                    break;
                    
                case "modelMatrix":
                    if ( node.cesiumObj !== undefined ) {
                        if ( node.cesiumObj.hasOwnProperty( propertyName ) ) {
                            value = matrix4ToArray( node.cesiumObj.modelMatrix );
                        }
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
                    if ( node.cesiumObj instanceof Cesium.Entity ) {
                        value = node.cesiumObj.orientation.getValue();
                    }
                    break;

                case "point":
                    if ( node.cesiumObj instanceof Cesium.Entity ) {
                        value = node.cesiumObj.point.getValue();
                    }
                    break;

                case "vector":
                    if ( node.cesiumObj instanceof Cesium.Entity ) {
                        value = node.cesiumObj.vector.getValue();
                    }
                    break;

                case "vertexPositions":
                    if ( node.cesiumObj instanceof Cesium.Entity ) {
                        value = node.cesiumObj.vertexPositions.getValue();
                    }
                    break;

                case "viewFrom":
                    if ( node.cesiumObj instanceof Cesium.Entity ) {
                       value = node.cesiumObj.viewFrom;
                    }
                    break;   

                case "enableLook": 
                    if( node.scene ) {
                        var controller = node.scene.screenSpaceCameraController;
                        if ( controller ) {
                            value = controller.enableLook;
                        }
                    }
                    break;
                case "enableRotate": 
                    if( node.scene ) {
                        var controller = node.scene.screenSpaceCameraController;
                        if ( controller ) {
                            value = controller.enableRotate;
                        }
                    }
                    break;
                case "enableTilt":
                    if( node.scene ) {
                        var controller = node.scene.screenSpaceCameraController;
                        if ( controller ) {
                            value = controller.enableTilt;
                        }
                    }
                    break; 
                case "enableTranslate":
                    if( node.scene ) {
                        var controller = node.scene.screenSpaceCameraController;
                        if ( controller ) {
                            value = controller.enableTranslate;
                        }
                    } 
                    break;
                case "enableZoom": 
                    if( node.scene ) {
                        var controller = node.scene.screenSpaceCameraController;
                        if ( controller ) {
                            value = controller.enableZoom;
                        }
                    }
                    break;


            }

            return value;
        }


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
        var parentID = node.parentID;
        var sceneNode = undefined;
        var protos = undefined;
        var parent = findParent.call( this, parentID );
        while ( parent && sceneNode === undefined ) {
            protos = getPrototypes.call( this, parent.extendsID );
            if ( protos && isCesium.call( this, protos ) ) {
                sceneNode = parent;
            } else {
                parent = findParent.call( this, parent.parentID );
            }
        }
        if ( sceneNode === undefined ) {
            sceneNode = this.state.scenes[ this.kernel.application() ]
        }
        return sceneNode;
    }

    function isCesium( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium.vwf" );
            }
        }

        return foundCesium;
    }

    function isGlobe( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/globe.vwf" );
            }
        }

        return foundCesium;
    }

    function isSun( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/sun.vwf" );
            }
        }

        return foundCesium;
    }    

    function isAtmosphere( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/atmosphere.vwf" );
            }
        }

        return foundCesium;
    } 

    function isSkyBox( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/skybox.vwf" );
            }
        }

        return foundCesium;
    }     
    
    function isBillboard( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/billboard.vwf" );
            }
        }

        return foundCesium;
    }  

    function isDynamicObject( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/dynamicObject.vwf" );
            }
        }

        return foundCesium;
    }  

    function isLabel( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/label.vwf" );
            }
        }

        return foundCesium;
    } 

    function isPolylineCollection( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/polylineCollection.vwf" );
            }
        }

        return foundCesium;
    }    

    function isPolyline( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/polyline.vwf" );
            }
        }

        return foundCesium;
    }     

    function isModel( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/model.vwf" );
            }
        }

        return foundCesium;
    } 

    function isGeometry( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/geometry.vwf" );
            }
        }

        return foundCesium;
    } 

    function isMaterial( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/material.vwf" );
            }
        }

        return foundCesium;
    }     

    function isCamera( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/camera.vwf" );
            }
        }

        return foundCesium;
    } 

    function isNode3( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/node3.vwf" );
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

    function cesiumColor( color ) {
        var vwfColor = new utility.color( color );
        if ( vwfColor ) { 
            return new Cesium.Color( 
                vwfColor.red()/255, 
                vwfColor.green()/255, 
                vwfColor.blue()/255, 
                vwfColor.alpha() 
            );
        }  
        return new Cesium.Color( 1.0, 1.0, 1.0, 1.0 );       
    }

    function matrix4ToArray( mat ) {

        return [ 
            mat['0'], mat['1'], mat['2'], mat['3'],
            mat['4'], mat['5'], mat['6'], mat['7'],
            mat['8'], mat['9'], mat['10'], mat['11'],
            mat['12'], mat['13'], mat['14'], mat['15'] 
        ];
    }


    function arrayToMatrix4( arry ) {
        return Cesium.Matrix4.fromArray( arry );
    }

    function toCartesian2( value ) {
        if ( value instanceof Array ) {
            if ( value.length > 1 ) {
                return new Cesium.Cartesian2( value[ 0 ], value[ 1 ] );
            }
        } else if ( value.x !== undefined && value.y !== undefined ) {
            return new Cesium.Cartesian2( value.x, value.y );
        }
        return new Cesium.Cartesian2( 0, 0 );
    }

    function toCartesian3( value ) {
        if ( value instanceof Array ) {
            if ( value.length > 2 ) {
                return new Cesium.Cartesian3( value[ 0 ], value[ 1 ], value[ 2 ] );
            }
        } else if ( value.x !== undefined && value.y !== undefined && value.z !== undefined ) {
            return new Cesium.Cartesian3( value.x, value.y, value.z );
        }
        return new Cesium.Cartesian3( 0, 0, 0 );
    }

    function toCartesian4( value ) {
        if ( value instanceof Array ) {
            if ( value.length > 3 ) {
                return new Cesium.Cartesian4( value[ 0 ], value[ 1 ], value[ 2 ], value[ 3 ] );
            }
        } else if ( value.x !== undefined && value.y !== undefined && value.z !== undefined && value.w !== undefined) {
            return new Cesium.Cartesian4( value.x, value.y, value.z, value.w );
        }
        return new Cesium.Cartesian4( 0, 0, 0, 0 );
    }

    function toRectangle( value ) {
        if ( value instanceof Array ) {
            if ( value.length > 3 ) {
                return new Cesium.Rectangle( value[ 0 ], value[ 1 ], value[ 2 ], value[ 3 ] );
            }
        } else if ( value.west !== undefined && value.south !== undefined && value.east !== undefined && value.north !== undefined) {
            return new Cesium.Rectangle( value.west, value.south, value.east, value.north );
        }
        return new Cesium.Rectangle( 0, 0, 0, 0 );
    }

    function vwfColorToCartesian3( vwfColor ) {
        return new Cesium.Cartesian3( 
            vwfColor.red() / 255, 
            vwfColor.green() / 255, 
            vwfColor.blue() / 255 
        );        
    }

    function createGeometry( options ) {

        var geo = undefined;
        var geometryType = options.type ? options.type : options;
 
        //console.log( "createGeometry", JSON.stringify( options ) );

        cesiumifyOptions( options );

        switch ( geometryType.toLowerCase() ) {
            
            case "box":
            case "boxgeometry":
                if ( options.dimensions !== undefined ) {
                    geo = new Cesium.BoxGeometry.fromDimensions( options );
                } else {
                    geo = new Cesium.BoxGeometry( options );                    
                }
                break;

            case "boxoutline":
            case "boxoutlinegeometry":
                if ( options.dimensions !== undefined ) {
                    geo = new Cesium.BoxOutlineGeometry.fromDimensions( options );
                } else {
                    geo = new Cesium.BoxOutlineGeometry( options );    
                }
                break;

            case "circle":
            case "circlegeometry":
                geo = new Cesium.CircleGeometry( options );  
                break;  

            case "circleoutline":
            case "circleoutlinegeometry":
                geo = new Cesium.CircleOutlineGeometry( options );  
                break;

            case "corridor":
            case "corridorgeometry":
                geo = new Cesium.CorridorGeometry( options );  
                break;  

            case "corridoroutline":
            case "corridoroutlinegeometry":
                geo = new Cesium.CorridorOutlineGeometry( options );  
                break;

            case "cylinder":
            case "cylindergeometry":
                geo = new Cesium.CylinderGeometry( options );  
                break;  

            case "cylinderoutline":
            case "cylinderoutlinegeometry":
                geo = new Cesium.CylinderOutlineGeometry( options );  
                break;

            case "ellipse":
            case "ellipsegeometry":
                geo = new Cesium.EllipseGeometry( options );
                break;
            
            case "ellipseoutline":
            case "ellipseoutlinegeometry":
                geo = new Cesium.EllipseOutlineGeometry( options );
                break;

            case "ellipsoid":
            case "ellipsoidgeometry":
                geo = new Cesium.EllipsoidGeometry( options );
                break;
            
            case "ellipsoidoutline":
            case "ellipsoidoutlinegeometry":
                geo = new Cesium.EllipsoidOutlineGeometry( options );
                break;

            case "polygon":
            case "polygongeometry":
                if ( options.positions !== undefined ) {
                    geo = new Cesium.PolygonGeometry.fromPositions( options );  
                } else {
                    geo = new Cesium.PolygonGeometry( options );                    
                }

                break;

            case "polygonoutline":
            case "polygonoutlinegeometry":
                if ( options.positions !== undefined ) {
                    geo = new Cesium.PolygonOutlineGeometry.fromPositions( options );
                } else {
                    geo = new Cesium.PolygonOutlineGeometry( options );    
                }
                break;

            // polyline is special and is included in the polylineCollection
            // case "polyline":
            //     geo = new Cesium.PolylineGeometry( options );
            //     break;

            case "polylinevolume":
            case "polylinevolumegeometry":
                geo = new Cesium.PolylineVolumeGeometry( options );
                break; 

            case "rectangle":
            case "rectanglegeometry":
                geo = new Cesium.RectangleGeometry( options )
                break;

            case "rectangleoutline":
            case "rectangleoutlinegeometry":
                geo = new Cesium.RectangleOutlineGeometry( options );
                break;

            case "simplepolyline":
            case "simplepolylinegeometry":
                geo = new Cesium.SimplePolylineGeometry( options );
                break;  

            case "sphere":
            case "spheregeometry":
                geo = new Cesium.SphereGeometry( options );
                break;

            case "sphereoutline":
            case "sphereoutlinegeometry":
                geo = new Cesium.SphereOutlineGeometry( options );
                break;

            case "wall":
            case "wallgeometry":
                geo = new Cesium.WallGeometry( options );
                break;

            case "walloutline":
            case "walloutlinegeometry":
                geo = new Cesium.WallOutlineGeometry( options );
                break;

        }
        return geo;
    }

    function createGeometryPrimitive( id, options ) {

        var primitive = undefined;
        var geometry = undefined;
        var geometryInstance = undefined;

        //console.log( "createGeometryPrimitive", id, JSON.stringify( options ) );

        geometry = createGeometry( options.geometry );

        if ( geometry !== undefined ) {
            
            if ( options.instance === undefined ) {
                options.instance = {};    
            } else {
                cesiumifyOptions( options.instance );                
            }

            options.instance.id = id;
            options.instance.geometry = geometry;

            geometryInstance = new Cesium.GeometryInstance( options.instance );

            if ( options.primitive === undefined ) {
                options.primitive = {}
            } else {
                cesiumifyOptions( options.primitive );     
            }
            options.primitive.geometryInstances = geometryInstance;
            options.primitive.appearance = createAppearance( options.primitive.appearance );

            primitive = new Cesium.Primitive( options.primitive );
        }

        return { 
            "primitive": primitive,
            "geometry": geometry,
            "geometryInstance": geometryInstance
        };
    }

    function createAppearance( options ) {
        var appearance = undefined;

        //console.log( "createAppearance", JSON.stringify( options ) );

        if ( options ) {
            var appearanceType = options.type ? options.type : "material";
            var materialOptions = options.material ? options.material : undefined;
            options.material = createMaterial( materialOptions );

            switch ( appearanceType.toLowerCase() ) {

                case "ellipsoidsurface":
                case "ellipsoidsurfaceappearance":
                    appearance = new Cesium.EllipsoidSurfaceAppearance( options );
                    break;

                case "perinstancecolor":
                case "perinstancecolorappearance":
                    appearance = new Cesium.PerInstanceColorAppearance( options );
                    break;

                case "debug":
                case "debugappearance":
                    appearance = new Cesium.DebugAppearance( options );
                    break;

                case "polylinecolor":
                case "polylinecolorappearance":
                    appearance = new Cesium.PolylineColorAppearance( options );
                    break;

                case "polylinematerial":
                case "polylinematerialappearance":
                    appearance = new Cesium.PolylineMaterialAppearance( options );
                    break;

                case "material":
                case "materialappearance":
                default:
                    appearance = new Cesium.MaterialAppearance( options );
                    break;

            }            
        } else {
            appearance = new Cesium.MaterialAppearance();    
        }


        return appearance;
    }

    function loadAsset( node ) {
        var scene = node.sceneNode.scene;
        var primitives = scene.primitives;
        var src = node.source;

        if ( !utility.isString( node.source ) ) {
            src = node.source.url;
        }

        switch ( node.type ) {

            case "model/vnd.gltf+json":
                node.loadComplete( false );
                node.cesiumObj = Cesium.Model.fromGltf( {
                    "url": src,
                    "id": node.ID,
                    "minimumPixelSize": 128
                } );

                if ( node.cesiumObj !== undefined ) {
                    primitives.add( node.cesiumObj );    
                }
                node.cesiumObj.readyToRender.addEventListener( function( model ) {
                    node.loadComplete( true );
                } );
                break;

        }        
    }
    
    function cesiumifyOptions( options, geometry ) {

        if ( options !== undefined ) {
            if ( options.color !== undefined ) {
                options.color = cesiumColor( options.color );
                if ( options.convertColorToInstance ) {
                    options.color = Cesium.ColorGeometryInstanceAttribute.fromColor( options.color );
                    delete options.convertColorToInstance;    
                }
            }
            if ( options.colorInstance !== undefined ) {
                options.color = Cesium.ColorGeometryInstanceAttribute.fromColor( cesiumColor( options.colorInstance ) );
                delete options.colorInstance;    
            }
            if ( options.translucent !== undefined ) {
                if ( utility.isString( options.translucent ) && ( 
                    options.translucent !== "true" || 
                    options.translucent !== "false" ||
                    options.translucent !== "0" ||
                    options.translucent !== "1" ) ) {
                    options.translucent = new Function( options.translucent );    
                }            
            }
            if ( options.materialSupport !== undefined ) {
                switch ( options.materialSupport.toLowerCase() ) {
                    
                    case "basic":
                        options.materialSupport = Cesium.MaterialAppearance.MaterialSupport.BASIC;
                        break;

                    case "all":
                        options.materialSupport = Cesium.MaterialAppearance.MaterialSupport.ALL;
                        break;

                    default:
                        options.materialSupport = Cesium.MaterialAppearance.MaterialSupport.TEXTURED;
                        break;        
                }
            }
            if ( options.positions !== undefined ) {
                if ( options.positions.degrees !== undefined ) {
                    options.positions = Cesium.Cartesian3.fromDegreesArray( options.positions.degrees );
                    delete options.positions.degrees;
                } else {
                    if ( options.positions instanceof Array && options.positions.length > 1 ) {
                        var i, positions = [];
                        if ( options.positions[ 0 ] instanceof Array ) {
                            switch ( options.positions[ 0 ].length ) {
                                case 2:
                                    for ( i = 0; i < options.positions.length; i++ ) {
                                        positions.push( toCartesian2( options.positions[ i ] ) );
                                    }
                                    break;
                                
                                case 3:
                                    for ( i = 0; i < options.positions.length; i++ ) {
                                        positions.push( toCartesian3( options.positions[ i ] ) );
                                    }
                                    break;

                                case 4:
                                    for ( i = 0; i < options.positions.length; i++ ) {
                                        positions.push( toCartesian4( options.positions[ i ] ) );
                                    }
                                    break;
                            }
                        } 
                        options.positions = positions;    
                    }                    
                }
            }
            if ( options.radii !== undefined ) {
                options.radii = toCartesian3( options.radii );
            }            
            if ( options.center !== undefined ) {
                if ( options.center.degrees !== undefined ) {
                    options.center = Cesium.Cartesian3.fromDegrees(
                        options.center.degrees[ 0 ], 
                        options.center.degrees[ 1 ]
                    );
                    delete options.center.degrees;
                } else {
                    options.center = toCartesian3( options.center );
                }
            }
            if ( options.rectangle !== undefined ) {
                if ( options.rectangle.degrees !== undefined ) {
                    options.rectangle = Cesium.Rectangle.fromDegrees( 
                        options.rectangle.degrees[ 0 ], 
                        options.rectangle.degrees[ 1 ], 
                        options.rectangle.degrees[ 2 ], 
                        options.rectangle.degrees[ 3 ]
                    );
                    delete options.rectangle.degrees;
                } else {
                    options.rectangle = toRectangle( options.rectangle );                       
                }
            }
            if ( options.vertexFormat !== undefined ) {
                if ( utility.isString( options.vertexFormat ) ) {
                    switch ( options.vertexFormat.toLowerCase() ) {
                        case "ellipsoidsurface":
                            options.vertexFormat = Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT;
                            break;
                        case "perinstancecolor":
                            options.vertexFormat = Cesium.PerInstanceColorAppearance.VERTEX_FORMAT;
                            break;
                    }
                } else if ( options.vertexFormat.vertexFormatType !== undefined ) {
                    if ( options.vertexFormat.material !== undefined ) {
                        options.vertexFormat.material = createMaterial( options.vertexFormat.material );
                    }

                    switch ( options.vertexFormat.vertexFormatType.toLowerCase() ) {
                        case "ellipsoidsurface":
                            options.vertexFormat = Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT;
                            break;
                        case "perinstancecolor":
                            options.vertexFormat = Cesium.PerInstanceColorAppearance.VERTEX_FORMAT;
                            break;
                    }
                }
            }
            if ( options.modelMatrix !== undefined ) { 
                if ( options.modelMatrix.degrees !== undefined ) {
                    options.modelMatrix = Cesium.Matrix4.multiplyByTranslation(
                        Cesium.Transforms.eastNorthUpToFixedFrame(
                        Cesium.Cartesian3.fromDegrees(
                            options.modelMatrix.degrees[ 0 ], 
                            options.modelMatrix.degrees[ 1 ]
                        ) ), new Cesium.Cartesian3( 0.0, 0.0, options.modelMatrix.z || 0 ),
                    new Cesium.Matrix4() );
                } else {
                    if ( options.modelMatrix instanceof Array && options.modelMatrix.length > 15 ) {
                        options.modelMatrix = arrayToMatrix4( options.modelMatrix );   
                    }
                }
            }
            if ( options.dimensions !== undefined ) {
                options.dimensions = toCartesian3( options.dimensions );    
            }
            if ( options.attributes ) {
                cesiumifyOptions( options.attributes );
            }
            if ( options.polygonHierarchy ) {
                cesiumifyOptions( options.polygonHierarchy );    
            }
        }
    }

    function createMaterial( options ) {
        var material = undefined;

        //console.log( "createMaterial", JSON.stringify( options ) );

        if ( options !== undefined ) {
            
            if ( utility.isString( options ) ) {
                material = new Cesium.Material.fromType( options );
            } else if ( options.type !== undefined ) {
                material = new Cesium.Material.fromType( options.type, cesiumifyOptions( options.uniforms ) );    
            } else {
                if ( options.fabric !== undefined && options.fabric.uniforms !== undefined ) {
                    cesiumifyOptions( options.fabric.uniforms );
                }
                if ( options.translucent !== undefined ) {
                    cesiumifyOptions( options );
                }
                material = new Cesium.Material( options );                
            }
        } else {
            material = new Cesium.Material();    
        }
        return material;
    }

});


