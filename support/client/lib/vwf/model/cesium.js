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
            
            if ( options === undefined ) { options = {}; }

            this.state.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
            this.state.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }
            this.state.prototypes = {}; 
          
        
        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            var childURI = nodeID === 0 ? childIndex : undefined;

            //this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );

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
            
            var node = undefined, parentNode;
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
            
            if ( isCesiumDefinition.call( this, protos ) ) {

                if ( this.state.scenes[ childID ] === undefined ) {
                    this.state.scenes[ childID ] = node = createNode();
                }

            } else if ( isAtmosphereDefinition.call( this, protos ) ) {

                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                if ( parentNode && parentNode.scene ) {
                    parentNode.scene.skyAtmosphere = new Cesium.SkyAtmosphere();
                    node.renderObject = parentNode.scene.skyAtmosphere;
                }

            } else if ( isSkyBoxDefinition.call( this, protos ) ) {

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
                    node.renderObject = parentNode.scene.skyBox;
                } 


            } else if ( isSunDefinition.call( this, protos ) ) {

                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                if ( parentNode && parentNode.scene ) {
                    parentNode.scene.sun = new Cesium.Sun();
                    node.renderObject = parentNode.scene.sun;
                } 

            } else if ( isBillboardDefinition.call( this, protos ) ) {
                
                this.state.nodes[ childID ] = node = createNode();
                var sceneNode = findSceneNode.call( this, node );
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
                node.renderObject = bb;
                node.scene = sceneNode.scene;

            } else if ( isLabelDefinition.call( this, protos ) ) {
                this.state.nodes[ childID ] = node = createNode();
                var sceneNode = findSceneNode.call( this, node );

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
                node.renderObject = lbl;
                node.scene = sceneNode.scene;                

            } else if ( isCameraDefinition.call( this, protos ) ) {
                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );

                var camera = new Camera(canvas);
                camera.position = new Cartesian3();
                camera.direction = Cartesian3.UNIT_Z.negate();
                camera.up = Cartesian3.UNIT_Y;
                camera.frustum.fovy = CesiumMath.PI_OVER_THREE;
                camera.frustum.near = 1.0;
                camera.frustum.far = 2.0;                
                
            } else if ( isNode3Definition.call( this, protos ) ) {
                this.state.nodes[ childID ] = node = createNode();
                parentNode = findParent.call( this, nodeID );
                
            }

            // If we do not have a load a model for this node, then we are almost done, so we can update all
            // the driver properties w/ the stop-gap function below.
            // Else, it will be called at the end of the assetLoaded callback
            if ( ! ( childType == "model/vnd.collada+xml" || 
                     childType == "model/vnd.osgjs+json+compressed") )
                notifyDriverOfPrototypeAndBehaviorProps();

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
                            //console.info( " 1    setting "+propertyName+" of: " + nodeID + " to " + ptPropValue );
                            self.settingProperty( childID, propertyName, ptPropValue );
                        }
                    }
                } );
                childImplementsIDs.forEach( function( behaviorID ) {
                    for ( var propertyName in kernel.getProperties( behaviorID ) ) {
                        //console.info( "     2    getting "+propertyName+" of: " + behaviorID  );
                        ptPropValue = kernel.getProperty( behaviorID, propertyName );
                        if ( ptPropValue !== undefined && ptPropValue !== null && childID !== undefined && childID !== null) {
                            //console.info( "     2    setting "+propertyName+" of: " + nodeID + " to " + ptPropValue );
                            self.settingProperty( childID, propertyName, ptPropValue );
                        }
                    }
                } );
            };

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

            //this.logger.infox( "creatingProperty", nodeID, propertyName, propertyValue );

            if ( propertyValue !== undefined ) {
                var node = this.state.nodes[ nodeID ];
                if ( node === undefined ) node = this.state.scenes[ nodeID ];
                if ( node !== undefined ) {
                    value = this.settingProperty( nodeID, propertyName, propertyValue );                  
                }
            }

            return value;
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;

            //this.logger.infox( "initializingProperty", nodeID, propertyName, propertyValue );

            if ( propertyValue !== undefined ) {
                var node = this.state.nodes[ nodeID ];
                if ( node === undefined ) node = this.state.scenes[ nodeID ];
                if ( node !== undefined ) {
                    value = this.settingProperty( nodeID, propertyName, propertyValue );                  
                }
            }

            return value;
            
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = propertyValue;
            var node = this.state.nodes[ nodeID ]; 

            //this.logger.infox( "settingProperty", nodeID, propertyName, propertyValue );

            if ( node ) {

                if ( node.renderObject === undefined )
                    return undefined;

                switch ( propertyName ) {

                    case "visible":
                        node.renderObject.show = Boolean( propertyValue );
                        break;

                    case "position":
                        if ( node.renderObject instanceof Cesium.Camera ) {
                            node.renderObject.position = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                        } else if ( node.renderObject instanceof Cesium.Billboard || node.renderObject instanceof Cesium.Label ) {
                            var pos = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                            node.renderObject.setPosition( pos );
                        }
                        break;

                    case "pixelOffset":
                        var pos = new Cesium.Cartesian2( propertyValue[0], propertyValue[1] );
                        node.renderObject.setPixelOffset( pos );
                        break;

                    case "eyeOffset":
                        var pos = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                        node.renderObject.setEyeOffset( pos );
                        break;

                    case "horizontalOrigin":
                        switch ( propertyValue ) {
                            case "left":
                                node.renderObject.setHorizontalOrigin( Cesium.HorizontalOrigin.LEFT );
                                break;
                            case "right":
                                node.renderObject.setHorizontalOrigin( Cesium.HorizontalOrigin.RIGHT );
                                break;
                            case "center":
                                node.renderObject.setHorizontalOrigin( Cesium.HorizontalOrigin.CENTER );
                                break;
                        }
                        break;

                    case "verticalOrigin": 
                        switch ( propertyValue ) {
                            case "top":
                                node.renderObject.setHorizontalOrigin( Cesium.VerticalOrigin.TOP );
                                break;
                            case "bottom":
                                node.renderObject.setHorizontalOrigin( Cesium.VerticalOrigin.BOTTOM );
                                break;
                            case "center":
                                node.renderObject.setHorizontalOrigin( Cesium.VerticalOrigin.CENTER );
                                break;
                        }
                        break;

                    case "scale":
                        var val = parseFloat( propertyValue );
                        node.renderObject.setScale( val );
                        break;

                    case "imageIndex": 
                        var val = Number( propertyValue );
                        node.renderObject.setImageIndex( val );
                        break;

                    case "color": 
                        if ( propertyValue instanceof String ) {
                            propertyValue = propertyValue.replace( /\s/g, '' );
                        }
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {                            
                            node.renderObject.setColor( { 
                                red: vwfColor.red() / 255, 
                                green: vwfColor.green() / 255, 
                                blue: vwfColor.blue() / 255, 
                                alpha: vwfColor.alpha() 
                            } );
                        } 
                        break;

                    case "font":
                        if ( node.renderObject instanceof Cesium.Label ) {
                            node.renderObject.setFont( propertyValue );    
                        }
                        break;

                    case "fillColor":
                        if ( node.renderObject instanceof Cesium.Label ) {
                            if ( propertyValue instanceof String ) {
                                propertyValue = propertyValue.replace( /\s/g, '' );
                            }
                            var vwfColor = new utility.color( propertyValue );
                            if ( vwfColor ) {                            
                                node.renderObject.setFillColor( { 
                                    red: vwfColor.red() / 255, 
                                    green: vwfColor.green() / 255, 
                                    blue: vwfColor.blue() / 255, 
                                    alpha: vwfColor.alpha() 
                                } );
                            }                                
                        }                        
                        break;

                    case "style":
                        if ( node.renderObject instanceof Cesium.Label ) {
                            switch ( propertyValue ) {
                                case "fill":
                                    node.renderObject.setStyle( Cesium.LabelStyle.FILL );
                                    break;
                                case "filloutline":
                                    node.renderObject.setStyle( Cesium.LabelStyle.FILL_AND_OUTLINE );
                                    break;
                                case "outline":
                                    node.renderObject.setStyle( Cesium.LabelStyle.OUTLINE );
                                    break;
                            }   
                        }    
                        break;

                    case "outlineColor":
                        if ( node.renderObject instanceof Cesium.Label ) {
                            if ( propertyValue instanceof String ) {
                                propertyValue = propertyValue.replace( /\s/g, '' );
                            }
                            var vwfColor = new utility.color( propertyValue );
                            if ( vwfColor ) {                            
                                node.renderObject.setOutlineColor( { 
                                    red: vwfColor.red() / 255, 
                                    green: vwfColor.green() / 255, 
                                    blue: vwfColor.blue() / 255, 
                                    alpha: vwfColor.alpha() 
                                } );
                            }                                
                        }  
                        break;

                    case "outlineWidth":
                        if ( node.renderObject instanceof Cesium.Label ) {
                            node.renderObject.setOutlineWidth( Number( propertyValue ) );    
                        }    
                        break;

                    case "text":
                        if ( node.renderObject instanceof Cesium.Label ) {
                            node.renderObject.setText( propertyValue );    
                        }    
                        break;


                    case "image":
                        if ( node.renderObject instanceof Cesium.Billboard )
                        break;

                    case "direction":
                        if ( node.renderObject instanceof Cesium.Camera ) {
                            node.renderObject.direction = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                        }
                        break;

                    case "fovy":
                        if ( node.renderObject instanceof Cesium.Camera ) {
                            node.renderObject.frustrum.fovy = parseFloat( propertyValue );
                        }                    
                        break;

                    case "near":
                        if ( node.renderObject instanceof Cesium.Camera ) {
                            node.renderObject.frustrum.near = parseFloat( propertyValue );
                        }
                        break;

                    case "far":
                        if ( node.renderObject instanceof Cesium.Camera ) {
                            node.renderObject.frustrum.far = parseFloat( propertyValue );
                        }
                        break;

                    case "right":
                        if ( node.renderObject instanceof Cesium.Camera ) {
                            node.renderObject.right = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                        }                    
                        break;

                    case "transform":
                        if ( node.renderObject instanceof Cesium.Camera ) {
                            
                        }
                        break;

                    case "up":
                        if ( node.renderObject instanceof Cesium.Camera ) {
                            node.renderObject.up = new Cesium.Cartesian3( propertyValue[0], propertyValue[1], propertyValue[2] );
                        }
                        break;


                    default:
                        value = undefined;
                        break;

                }


            } else {
                node = this.state.scenes[ nodeID ]; 
                if ( node ) {
                    var scene = node.scene;

                    if ( node.widget === undefined && node.centralBody === undefined )
                        return undefined;

                    if ( !propertyValue )
                        return;

                    switch ( propertyName ) {

                        case "cameraViewData":
                            if ( this.kernel.client() != this.kernel.moniker() ) {
                                var camera = scene.getCamera();
                                camera.direction = new Cesium.Cartesian3( propertyValue.direction.x, propertyValue.direction.y, propertyValue.direction.z );
                                camera.position = new Cesium.Cartesian3( propertyValue.position.x, propertyValue.position.y, propertyValue.position.z );
                                camera.up = new Cesium.Cartesian3( propertyValue.up.x, propertyValue.up.y, propertyValue.up.z );
                                camera.right = new Cesium.Cartesian3( propertyValue.right.x, propertyValue.right.y, propertyValue.right.z );
                                this.state.cameraInfo.getCurrent( camera );
                            }
                            break;

                        case "imageryProvider":
                            
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
                            }
                            value = undefined;
                            break;


                        case "renderStyle":
                            // using the Cesium.Widget
                            if ( node.widget ) {
                                
                                switch ( propertyValue ) {
                                    case "3D":
                                        node.widget.transitioner.morphTo3D();
                                        break;
                                    case "2D":
                                        node.widget.transitioner.morphTo2D();
                                        break;
                                    case "2.5D":
                                        node.widget.transitioner.morphToColumbusView();
                                        break;
                                }
                            } else if ( node.scene ) {

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
                }
            }

            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.state.nodes[ nodeID ]; 
            if( !node ) node = this.state.scenes[ nodeID ]; 
            var value = undefined;

            if( !node ) return undefined;

            switch ( propertyName ) {

                case "visible":
                    if ( node.renderObject ) {
                        value = node.renderObject.show;
                    }
                    break;
                case "position":
                    if ( node.renderObject ) {
                        var pos;
                        if ( node.renderObject instanceof Cesium.Camera ) {
                            pos = node.renderObject.position;
                        } else if ( node.renderObject instanceof Cesium.Billboard || node.renderObject instanceof Cesium.Label ) {
                            pos = node.renderObject.getPosition();
                        }
                        if ( pos ) {
                            value = [ pos.x, pos.y, pos.z ];
                        }
                    }
                    break;

                case "pixelOffset":
                    if ( node.renderObject ) {
                        var pos = node.renderObject.getPixelOffset();
                        value = [ pos.x, pos.y ];
                    }
                    break;

                case "eyeOffset":
                    if ( node.renderObject ) {
                        var pos = node.renderObject.getEyeOffset();
                        value = [ pos.x, pos.y, pos.z ];
                    }
                case "horizontalOrigin":
                    if ( node.renderObject ) {
                        var horzOrigin = node.renderObject.getHorizontalOrigin();
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
                    if ( node.renderObject ) {
                        var vertOrigin = node.renderObject.getHorizontalOrigin();
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
                    if ( node.renderObject ) {
                        value = node.renderObject.getScale();
                    }
                    break;

                case "imageIndex": 
                    if ( node.renderObject ) {
                        value = node.renderObject.getImageIndex();
                    }
                    break;

                case "color": 
                    if( node.renderObject ) {
                        var clr = node.renderObject.getColor();
                        if ( clr.alpha == 1 ) {
                            value = "rgb("+clr.red+","+clr.green+","+clr.blue+")";
                        } else {
                            value = "rgba("+clr.red+","+clr.green+","+clr.blue+","+clr.alpha+")";
                        }
                    }
                    break;

                    case "font":
                        if ( node.renderObject instanceof Cesium.Label ) {
                            node.renderObject.setFont( propertyValue );    
                        }
                        break;

                    case "fillColor":
                        if( node.renderObject ) {
                            var clr = node.renderObject.getFillColor();
                            if ( clr.alpha == 1 ) {
                                value = "rgb("+clr.red+","+clr.green+","+clr.blue+")";
                            } else {
                                value = "rgba("+clr.red+","+clr.green+","+clr.blue+","+clr.alpha+")";
                            }
                        }                      
                        break;

                    case "style":
                        if ( node.renderObject instanceof Cesium.Label ) {
                            switch ( node.renderObject.getStyle() ) {
                                case LabelStyle.FILL:
                                    value = "fill";
                                    break;
                                case LabelStyle.FILL_AND_OUTLINE:
                                    value = "filloutline";
                                    break;
                                case LabelStyle.OUTLINE:
                                    value = "outline";
                                    break;
                            }   
                        }    
                        break;

                    case "outlineColor":
                        if( node.renderObject ) {
                            var clr = node.renderObject.getOutLineColor();
                            if ( clr.alpha == 1 ) {
                                value = "rgb("+clr.red+","+clr.green+","+clr.blue+")";
                            } else {
                                value = "rgba("+clr.red+","+clr.green+","+clr.blue+","+clr.alpha+")";
                            }
                        } 
                        break;

                    case "outlineWidth":
                        if ( node.renderObject instanceof Cesium.Label ) {
                            value = node.renderObject.getOutlineWidth();    
                        }    
                        break;

                    case "text":
                        if ( node.renderObject instanceof Cesium.Label ) {
                            value = node.renderObject.getText();    
                        }    
                        break;


                case "imageryProvider":
                    break;

                case "renderStyle":
                    break;

                case "backgroundColor":
                    if( node.scene ) {
                        var clr = node.scene.backgroundColor
                        if ( clr.alpha == 1 ) {
                            value = "rgb("+clr.red+","+clr.green+","+clr.blue+")";
                        } else {
                            value = "rgba("+clr.red+","+clr.green+","+clr.blue+","+clr.alpha+")";
                        }
                    }
                    break;

                case "controlClient":
                    value = node.controlClient;
                    break;

                case "direction":
                    if ( node.renderObject instanceof Cesium.Camera ) {
                        var vec3 = node.renderObject.direction;
                        value = [ vec3.x, vec3.y, vec3.z ];
                    }
                    break;

                case "fovy":
                    if ( node.renderObject instanceof Cesium.Camera ) {
                        value = node.renderObject.frustrum.fovy;
                    }                    
                    break;

                case "near":
                    if ( node.renderObject instanceof Cesium.Camera ) {
                        value = node.renderObject.frustrum.near;
                    }
                    break;

                case "far":
                    if ( node.renderObject instanceof Cesium.Camera ) {
                        value = node.renderObject.frustrum.far;
                    }
                    break;

                case "right":
                    if ( node.renderObject instanceof Cesium.Camera ) {
                        var vec3 = node.renderObject.right;
                        value = [ vec3.x, vec3.y, vec3.z ];                    }                    
                    break;

                case "transform":
                    if ( node.renderObject instanceof Cesium.Camera ) {
                        
                    }
                    break;

                case "up":
                    if ( node.renderObject instanceof Cesium.Camera ) {
                        var vec3 = node.renderObject.up;
                        value = [ vec3.x, vec3.y, vec3.z ]; 
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
            if ( protos && isCesiumDefinition.call( this, protos ) ) {
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


    function isCesiumDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-vwf" );    
            }
        }

        return foundCesium;
    }

    function isSunDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-sun-vwf" );    
            }
        }

        return foundCesium;
    }    

    function isAtmosphereDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-atmosphere-vwf" );    
            }
        }

        return foundCesium;
    } 

    function isSkyBoxDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-skybox-vwf" );    
            }
        }

        return foundCesium;
    }     
    
    function isBillboardDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-billboard-vwf" );   
            }
        }

        return foundCesium;
    }  

    function isLabelDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-label-vwf" );   
            }
        }

        return foundCesium;
    } 
    
    function isCameraDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http-vwf-example-com-cesium-camera-vwf" );    
            }
        }

        return foundCesium;
    } 

    function isNode3Definition( prototypes ) {
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

});
