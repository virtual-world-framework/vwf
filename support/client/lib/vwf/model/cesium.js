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

            this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );

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
            var protos = getPrototypes.call( this, kernel, childExtendsID );

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
            var findParent = function( ID ) {
                var retNode = self.state.nodes[ ID ];
                if ( retNode === undefined ) {
                    retNode = self.state.scenes[ ID ];
                }
                return retNode;
            };          

            
            if ( isCesiumDefinition.call( this, protos ) ) {
                if ( this.state.scenes[ childID ] === undefined ) {
                    this.state.scenes[ childID ] = createNode();
                }
            
            } else if ( isAtmosphereDefinition.call( this, protos ) ) {
                this.state.nodes[ childID ] = createNode();
                parentNode = findParent( nodeID );
                if ( parentNode && parentNode.scene ) {
                    parentNode.scene.skyAtmosphere = new Cesium.SkyAtmosphere();
                }

            } else if ( isSkyBoxDefinition.call( this, protos ) ) {
                this.state.nodes[ childID ] = createNode();
                parentNode = findParent( nodeID );
                if ( parentNode && parentNode.scene ) {
                    var skyBoxBaseUrl = '../../../Source/Assets/Textures/SkyBox/tycho2t3_80';
                    parentNode.scene.skyBox = new Cesium.SkyBox({
                        positiveX : skyBoxBaseUrl + '_px.jpg',
                        negativeX : skyBoxBaseUrl + '_mx.jpg',
                        positiveY : skyBoxBaseUrl + '_py.jpg',
                        negativeY : skyBoxBaseUrl + '_my.jpg',
                        positiveZ : skyBoxBaseUrl + '_pz.jpg',
                        negativeZ : skyBoxBaseUrl + '_mz.jpg'
                    });
                }                

            } else if ( isSunDefinition.call( this, protos ) ) {
                this.state.nodes[ childID ] = createNode();
                parentNode = findParent( nodeID );
                if ( parentNode && parentNode.scene ) {
                    parentNode.scene.skyBox = new Cesium.Sun();
                } 
            } else if ( isBillboardDefinition.call( this, protos ) ) {
                this.state.nodes[ childID ] = createNode();
                parentNode = findParent( nodeID );

            } else if ( isNode3Definition.call( this, protos ) ) {
                this.state.nodes[ childID ] = createNode();
                parentNode = findParent( nodeID );
                
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
            // NOTE: Identical code exists in GLGE driver, so if an change is necessary, it should be made
            //       there, too
            function notifyDriverOfPrototypeAndBehaviorProps() {
                var ptPropValue;
                var protos = getPrototypes.call( this, kernel, childExtendsID );
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

            var node = this.state.nodes[ nodeID ]; 
            if ( node ) {

            } else {
                node = this.state.scenes[ nodeID ]; 
                if ( node ) {
                    var scene = node.scene;

                    if ( node.widget === undefined && node.centralBody === undefined )
                        return;

                    if ( propertyName == "imageryProvider" ) {
                        
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
                                    proxy : new Cesium.DefaultProxy('/proxy/')
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
                                    proxy : new Cesium.DefaultProxy('/proxy/')
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


                    } else if ( propertyName == "renderStyle" ) {
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

                    } else if ( propertyName == "backgroundColor" ) {

                        if( node.scene ) {
                            if ( propertyValue instanceof String ) {
                                propertyValue = propertyValue.replace( /\s/g, '' );
                            }
                            var vwfColor = new utility.color( propertyValue );
                            if ( vwfColor ) {                            
                                node.scene.backgroundColor = new Cesium.Color( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255, vwfColor.alpha() );
                            } 
                        }
                    } else if ( propertyName == "controlClient" ) {
                        node.controlClient = propertyValue;
                        value = propertyValue;
                    }
                }
            }


            if( !node ) node = this.state.scenes[ nodeID ]; 
            var value = undefined;

            if( !node ) return;



            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName ) {

            var node = this.state.nodes[ nodeID ]; 
            if( !node ) node = this.state.scenes[ nodeID ]; 
            var value = undefined;

            if( !node ) return;

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
    

    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
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
