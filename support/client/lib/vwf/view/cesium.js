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

/// vwf/view/document extends a view interface up to the browser document. When vwf/view/document
/// is active, scripts on the main page may make (reflected) kernel calls:
/// 
///     window.vwf_view.createNode( nodeID, childID, childExtendsID, childImplementsIDs,
///         childSource, childType, childName, function( childID ) {
///         ...
///     } );
/// 
/// And receive view calls:
/// 
///     window.vwf_view.createdNode = function( nodeID, childID, childExtendsID, childImplementsIDs,
///         childSource, childType, childName, callback /- ( ready ) -/ ) {
///         ...
///     }
/// 
/// @module vwf/view/cesium
/// @requires vwf/view

define( [ "module", "vwf/view", "vwf/utility", "vwf/model/cesium/Cesium", "jquery" ], function( module, view, utility, Cesium, jQuery ) {

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function( options ) {

            if ( !this.state ) {   
                this.state = {};
            }
            if ( !this.state.scenes ) {   
                this.state.scenes = {};
            }
            if ( !this.state.nodes ) {   
                this.state.nodes = {};
            }

            if ( options === undefined ) { options = {}; }

            // html creation options
            this.parentDiv = options.parentDiv || 'body';
            this.parentClass = options.parentClass || 'cesium-main-div';
            this.containerClass = options.containerClass || 'fullSize';
            this.container = options.container || { "create": true, "divName": "cesiumContainer" } ;

            // Context and WebGL creation properties corresponding to options passed to Scene.
            this.canvasOptions = options.canvasOptions;  
            
            this.invertMouse =  options.invertMouse || {};
            
            this.cesiumType = options.cesium || 'widget'; // 'widget', 'viewer', manual - anything else 

            // CesiumWidget options, will accept all defaults
            this.cesiumTypeOptions = options.widget || {
                //"clock": false,
                //"imageryProvider": 'OpenStreetMapImageryProvider',
                //"terrainProvider": 'CesiumTerrainProvider',
                //"skyBox": {},
                "sceneMode": Cesium.SceneMode.SCENE3D,
                "scene3DOnly": false,
                "orderIndependentTranslucency": true,
                //"mapProjection": GeographicProjection || WebMercatorProjection
                "useDefaultRenderLoop": true,
                //"targetFrameRate": '?',
                "showRenderLoopErrors": true,
                //"contextOptions": {}, // Canvas options
                //"creditContainer": undefined, // DOM element or ID of where the credits go
            };


            this.height = 600;
            this.width = 800;

            if ( window ) {
                if ( window.innerHeight ) this.height = window.innerHeight - 20;
                if ( window.innerWidth ) this.width = window.innerWidth - 20;
                this.window = window;
            }

            this.state.clientControl = { 
                event: undefined, // probably not needed but this will contain the 
                controller: "",   // this is the moniker of the  
                locked: false 
            };

        },
  
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            if ( childExtendsID === undefined )
                return;
            
            //this.logger.infox( "createdNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            
            var createNode = function() {
                return {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsIDs: childImplementsIDs,
                    source: childSource,
                    type: childType,
                    name: childName,
                    loadComplete: callback
                };
            };

            var kernel = this.kernel;
            var protos = this.kernel.prototypes( childID );
            var node = undefined;

            if ( isCesiumDefinition.call( this, protos ) ) {

                if ( this.container.create ) {                
                    //var cesiumCont = "<div class='cesuim-container' id='" + this.container.divName + "'></div>";
                    var cesiumCont = "<div class='"+ this.containerClass +"' id='" + this.container.divName + "'></div>";

                    if ( this.parentDiv == 'body' ) {
                        jQuery( this.parentDiv ).append( cesiumCont );
                    } else {
                        var outDiv;
                        if ( this.parentClass !== undefined ) {
                            outDiv = "<div id='"+this.parentDiv+"' class='"+this.parentClass+"'>"+cesiumCont+"</div>";
                        } else {
                            outDiv = "<div id='"+this.parentDiv+"'>"+cesiumCont+"</div>"
                        }
                        jQuery( 'body' ).append( outDiv );
                    }
                }

                if ( this.state.scenes[ childID ] === undefined ) {
                    this.state.scenes[ childID ] = node = createNode();
                } else {
                    node = this.state.scenes[ childID ];    
                }

                var view = this;
                var forceResizeDelay = 60;
                var scene, canvas;
                
                // options for oneToOne below
                //var cesiumOptions = { "contextOptions": { "alpha": true }, }; 
                var options = this.cesiumTypeOptions;


                switch ( this.cesiumType ) {

                    case 'widget':
                        options.clock && this.state.createClock( options );
                        options.imageryProvider && this.state.createImageryProvider( options );
                        options.terrainProvider && this.state.createTerrainProvider( options );
                        options.skyBox && this.state.createSkyBox( options );
                        options.sceneMode && this.state.setSceneMode( options );
                        options.mapProjection && this.state.createMapProjection( options );

                        node.cesiumWidget = new Cesium.CesiumWidget( this.container.divName, options );
                        node.scene = scene = node.cesiumWidget.scene;
                        node.globe = scene.globe;
                        break;

                    case 'viewer':
                        node.cesiumViewer = new Cesium.Viewer( this.container.divName, this.cesiumTypeOptions );
                        node.cesiumWidget = node.cesiumViewer.cesiumWidget;
                        node.scene = scene = node.cesiumViewer.scene;
                        node.globe = scene.globe;

                        break;
                    
                    default:
                        // the manual creation, has an error with the 
                        // camera syncronization
                        canvas = document.createElement( 'canvas' );
                        canvas.className = 'fullSize';
                        document.getElementById( this.container.divName ).appendChild( canvas );

                        canvas.setAttribute( 'height', this.height );
                        canvas.setAttribute( 'width', this.width );

                        node.scene = scene = new Cesium.Scene( canvas, cesiumOptions.contextOptions );

                        var bing = new Cesium.BingMapsImageryProvider({
                            url : 'http://dev.virtualearth.net',
                            mapStyle : Cesium.BingMapsStyle.AERIAL,
                            // Some versions of Safari support WebGL, but don't correctly implement
                            // cross-origin image loading, so we need to load Bing imagery using a proxy.
                            proxy : Cesium.FeatureDetection.supportsCrossOriginImagery() ? undefined : new Cesium.DefaultProxy('/proxy/')
                        });                    

                        var primitives = scene.getPrimitives();

                        var ellipsoid = Cesium.Ellipsoid.WGS84;
                        node.globe = new Cesium.Globe( ellipsoid );

                        node.globe.getImageryLayers().addImageryProvider( bing );

                        primitives.setGlobe( node.globe );

                        node.transitioner = new Cesium.SceneTransitioner( scene, ellipsoid );
                        break;
                }

                node.imageryProvider = 'bingAerial';
                node.canvas = scene._canvas;
                scene.vwfID = childID;
                
                initializeMouseEvents.call( this, scene, node );

                var camera = scene._camera;

                ( function tick() {

                    if ( view.state.cameraInfo ) {
                        if ( view.state.clientControl.controller == view.kernel.moniker() ) {
                            var diffs = view.state.cameraInfo.diff( camera );
                            if ( diffs !== undefined ){
                               broadcastCameraViewData.call( view, diffs );                        
                            } 
                        }
                    } else {
                        view.state.cameraInfo = { 
                            "initialized": false,
                            "direction": undefined,
                            "position": undefined,
                            "up": undefined,
                            "right": undefined,
                            //"earthDistance": 0,
                            "equals": function( v1, v2 ) {
                                return ( ( Math.round( v1.x ) == Math.round( v2.x ) ) && ( Math.round( v1.y ) == Math.round( v2.y ) ) && ( Math.round( v1.z ) == Math.round( v2.z ) ) );
                            },
                            "diff": function( cam ) {
                                var retObj = undefined;

                                if ( this.initialized ) {
                                    if ( !Cesium.Cartesian3.equals( this.direction, cam.direction ) ){
                                        retObj = { "direction": [ cam.direction.x, cam.direction.y, cam.direction.z ] };    
                                    } 
                                    if ( !this.equals( this.position, cam.position ) ) {
                                        if ( retObj === undefined ) {
                                            retObj = { "position": [ cam.position.x, cam.position.y, cam.position.z ] };
                                        } else {
                                            retObj.position = [ cam.position.x, cam.position.y, cam.position.z ];
                                        }
                                        //var dist = Math.round( this.calcDistanceToOrigin( cam ) );
                                        //var tolerance = 2;
                                        //if ( dist <= this.earthDistance - tolerance || dist >= this.earthDistance + tolerance ) {
                                            // is there a way to fire an event from here?
                                            // console.info( "change in the distance to earth:" + this.earthDistance );  
                                        //}
                                        //this.earthDistance = dist; 
                                    }
                                    if ( !Cesium.Cartesian3.equals( this.up, cam.up ) ) {
                                        if ( retObj === undefined ) {
                                            retObj = { "up": [ cam.up.x, cam.up.y, cam.up.z ] };
                                        } else {
                                            retObj.up = [ cam.up.x, cam.up.y, cam.up.z ];
                                        }
                                    }
                                    if ( !Cesium.Cartesian3.equals( this.right, cam.right ) ) {
                                        if ( retObj === undefined ) {
                                            retObj = { "right": [ cam.right.x, cam.right.y, cam.right.z ] };
                                        } else {
                                            retObj.right = [ cam.right.x, cam.right.y, cam.right.z ];
                                        }
                                    }                                                                        
                                }
                                return retObj;
                            },
                            // "calcDistanceToOrigin": function( obj ) {
                            //     if ( obj.position ){
                            //         var p = obj.position;
                            //         return Math.sqrt( ( p.x * p.x ) + ( p.y * p.y ) + ( p.z * p.z ) );
                            //     }
                            //     return undefined;
                            // },
                            "getCurrent": function( cam ) {
                                this.direction = camera.direction.clone();
                                this.position = camera.position.clone();
                                this.up = camera.up.clone();
                                this.right = camera.right.clone();                        
                            },
                            "isInitialized": function() {
                                this.initialized = ( ( this.direction != undefined ) &&
                                                     ( this.position != undefined ) &&
                                                     ( this.up != undefined ) &&
                                                     ( this.right != undefined ) );

                            }
                        };
                    }

                    if ( forceResizeDelay ) {
                        forceResizeDelay--;
                        if ( forceResizeDelay == 0 ) {
                            node.cesiumWidget.resize();
                            forceResizeDelay = undefined;
                            view.state.cameraInfo.initialized = true;
                        }
                    }

                    scene.initializeFrame();
                    scene.render();
                    Cesium.requestAnimationFrame( tick );

                    if ( forceResizeDelay === undefined ) {
                       view.state.cameraInfo.getCurrent( camera );
                    }
                }());
                
                if ( !this.useCesiumWidget ) {
                    var onResize = function () {
                        var width = node.canvas.clientWidth;
                        var height = node.canvas.clientHeight;

                        if ( node.canvas.width === width && node.canvas.height === height ) {
                            return;
                        }

                        node.canvas.width = width;
                        node.canvas.height = height;
                        camera.frustum.aspectRatio = width / height;
                    };
                    window.addEventListener( 'resize', onResize, false );
                    onResize();

                    //document.oncontextmenu = function() { return false; };  
                } 
            } 
        }, 

        //deletedNode: function (nodeID) {
        //},
  
        //createdProperty: function (nodeID, propertyName, propertyValue) {
        //},        

        //initializedProperty: function (nodeID, propertyName, propertyValue) {
        //},        

        satProperty: function( nodeID, propertyName, propertyValue ) {
            switch ( propertyName ) {

            }
        },

        //gotProperty: function( nodeID, propertyName, propertyValue ) {
        //}
            
    } );
 
    function isCesiumDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium.vwf" );
            }
        }

        return foundCesium;
    }

    function isSunDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/sun.vwf" );
            }
        }

        return foundCesium;
    }    

    function isAtmosphereDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/atmosphere.vwf" );
            }
        }

        return foundCesium;
    } 

    function isSkyBoxDefinition( prototypes ) {
        var foundCesium = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundCesium; i++ ) {
                foundCesium = ( prototypes[i] == "http://vwf.example.com/cesium/skybox.vwf" );
            }
        }

        return foundCesium;
    } 

    function broadcastCameraViewData(cameraData) {
        var nodeID, scene;   
        if ( this.kernel.find( "", "//" ).length > 0 ) {
            nodeID = this.kernel.find( "", "//" )[ 0 ];
            this.kernel.setProperty( nodeID, "cameraViewData", cameraData );
        }
    }

    function initializeMouseEvents( scene, node ) {
        
        this.state.mouse = { 
            "enabled": true,
            "handler": undefined,
            "leftDown": false, 
            "leftDownID": undefined, 
            "middleDown": false ,
            "middleDownID": undefined, 
            "rightDown": false,
            "rightDownID": undefined,
            "pinching": false,
            "zooming": false,
            "scene": scene,
            "lastPosition": [ -1, -1 ],
            "initialDown": undefined,
            "controlState": undefined,
            "enable": function( value ) {
                if ( value != this.enabled ) {
                    if ( value ) {
                        this.restoreControlState();
                    } else {
                        this.captureControlState();
                        this.setControlState( false );
                    }
                    this.enabled = value;
                }
            },
            "active": function() {
                return this.leftDown || this.middleDown || this.rightDown || this.zooming || this.pinching;
            },
            "buttonDown": function() {
                if ( this.leftDown ) {
                    return "left";
                } else if ( this.rightDown ) {
                    return "right";
                } else if ( this.middleDown ) {
                    return "middle";
                }
                return undefined;
            },
            "setControlState": function( value ) {
                if ( this.handler ) {
                    this.handler.enableLook = value;
                    this.handler.enableRotate = value;
                    this.handler.enableTilt = value;
                    this.handler.enableTranslate = value;
                    this.handler.enableZoom = value;
                }
                this.controlState = undefined;
            },   
            "captureControlState": function() {
                this.controlState = {
                    "look": this.handler.enableLook,
                    "rotate": this.handler.enableRotate,
                    "tilt": this.handler.enableTilt,
                    "translate": this.handler.enableTranslate,
                    "zoom": this.handler.enableZoom
                };
            },
            "restoreControlState": function() {
                if ( this.controlState ) {
                    this.handler.enableLook = this.controlState.look;
                    this.handler.enableRotate = this.controlState.rotate;
                    this.handler.enableTilt = this.controlState.tilt;
                    this.handler.enableTranslate = this.controlState.translate;
                    this.handler.enableZoom = this.controlState.zoom;
                }
                this.controlState = undefined;
            }            

        };


        var overID = undefined;
        var downID = undefined;
        var lastOverID = undefined;
        var sceneCanvas = scene._canvas;
        var rootID = this.kernel.find( "", "/" )[0];

        this.state.mouse.handler = new Cesium.ScreenSpaceEventHandler( sceneCanvas );
        
        if ( this.state.mouse.handler ) {
            var mouse = this.state.mouse.handler;  
            var self = this; 

            var getMousePosition = function( pos ) {
                
                var posRet = { "x": pos.x, "y": pos.y };
                if ( self.invertMouse.x !== undefined ) {
                    posRet.x = sceneCanvas.width - posRet.x;
                }
                if ( self.invertMouse.y !== undefined ) {
                    posRet.y = sceneCanvas.height - posRet.y;
                }
                return posRet;

            }

            var pick = function( button, clickCount, event, position ) {
                
                var pos = getMousePosition( position ); 
                var height = scene._canvas.height;
                var width = scene._canvas.width;
                var eventObj = self.state.mouse.scene.pick( pos );
                var ellipsoid = scene._globe._ellipsoid;
                var globePoint = scene._camera.pickEllipsoid( pos, ellipsoid );
                var camPos = scene._camera.position;
                var eventID;
                
                if ( eventObj ) {
                    eventID = eventObj.vwfID;
                } else if ( globePoint !== undefined ) {
                    eventID = self.kernel.find( rootID, "earth" )[0];
                } else {
                    eventID = rootID;
                }

                var eData = { 
                    "eventData": [ {  
                        "button": button,
                        "clicks": clickCount,
                        "buttons": {
                                "left": self.state.mouse.leftDown,
                                "middle": self.state.mouse.middleDown,
                                "right": self.state.mouse.rightDown
                            },
                        "modifiers": {
                                "alt": false,
                                "ctrl": false,
                                "shift": false,
                                "meta": false
                            },
                        "position": [ pos.x / width, pos.y / height ],
                        "screenPosition": [ pos.x, pos.y ]
                    } ],
                    "eventNodeData": { "": [ {
                        "distance": undefined,
                        "origin": [ camPos.x, camPos.y, camPos.z ],
                        "id": eventID,
                        "globalPosition": globePoint ? [ globePoint.x, globePoint.y, globePoint.z ] : undefined,
                        "globalNormal": undefined,
                        "globalSource": [ camPos.x, camPos.y, camPos.z ],            
                    } ] },
                };



                if ( event == "down" ) {
                    switch( button ) {
                        case "left":
                            self.state.mouse.leftDownID = eventID;
                            break;
                        case "middle":
                            self.state.mouse.middleDownID = eventID;
                            break;
                        case "right":
                            self.state.mouse.rightDownID = eventID;
                            break;
                    }
                    downID = eventID;

                } else if ( ( event == "up" ) || ( event == "drag" ) ) {
                    switch( button ) {
                        case "left":
                            if ( self.state.mouse.leftDownID !== undefined ) {
                                eventID = self.state.mouse.leftDownID;
                            }
                            break;
                        case "middle":
                            if ( self.state.mouse.middleDownID !== undefined ) {
                                eventID = self.state.mouse.middleDownID;
                            }
                            break;
                        case "right":
                            if ( self.state.mouse.rightDownID !== undefined ) {
                                eventID = self.state.mouse.rightDownID;
                            }
                            break;
                    }
                } else if ( event == "move" ) {
                    overID = eventID;
                }

                if ( eventID && eventID != rootID ) {

                    var id = eventID;
                    while ( id && id != rootID ) {
                        eData.eventNodeData[ id ] = [ {
                            "distance": undefined,
                            "origin": scene._camera.position,
                            "globalPosition": globePoint ? [ globePoint.x, globePoint.y, globePoint.z ] : undefined,
                            "globalNormal": undefined,
                            "globalSource": scene._camera.position,            
                        } ];

                        //id = undefined;
                        if ( self.state.nodes[ id ] ) {
                            id = self.state.nodes[ id ].parentID;
                        } else {
                            id = undefined;
                        }
                    }
                }
                return eData;
            }


            // left click
            mouse.setInputAction( function( movement ) {
                
                var eData = pick( "left", 1, "click", movement.position );
                self.kernel.dispatchEvent( downID, "pointerClick", eData.eventData, eData.eventNodeData );

            }, Cesium.ScreenSpaceEventType.LEFT_CLICK );
            
            // left double click
            mouse.setInputAction( function( movement ) {

                var eData = pick( "left", 2, "click", movement.position );
                self.kernel.dispatchEvent( downID, "pointerDoubleClick", eData.eventData, eData.eventNodeData );

            }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK );
            
            // left up
            mouse.setInputAction( function( movement ) {
                
                self.state.mouse.leftDown = false;
                var eData = pick( "left", 0, "up", movement.position );
                if ( downID !== undefined ) {
                    self.kernel.dispatchEvent( downID, "pointerUp", eData.eventData, eData.eventNodeData );
                }
                self.kernel.setProperty( rootID, "clientControl", { event: 'left', controller: self.kernel.moniker(), locked: false } );
                self.state.mouse.leftDownID = undefined;

            }, Cesium.ScreenSpaceEventType.LEFT_UP );

            // left down
            mouse.setInputAction( function( movement ) {
                
                self.kernel.setProperty( rootID, "clientControl", { event: 'left', controller: self.kernel.moniker(), locked: true } );
                self.state.mouse.leftDown = true;
                var eData = pick( "left", 0, "down", movement.position );
                self.kernel.dispatchEvent( downID, "pointerDown", eData.eventData, eData.eventNodeData );
                
            
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN );

            // mouse move
            mouse.setInputAction( function( movement ) {
                var bd = self.state.mouse.buttonDown();
                if ( bd ) {
                    var eData = pick( bd, 0, "drag", movement.endPosition );
                    self.kernel.dispatchEvent( downID, "pointerMove", eData.eventData, eData.eventNodeData );
                } else {
                    var eData = pick( "", 0, "move", movement.endPosition );
                    if ( lastOverID === undefined && overID !== undefined ) {
                        self.kernel.dispatchEvent( overID, "pointerEnter", eData.eventData, eData.eventNodeData );
                        lastOverID = overID;
                    } else if ( overID ) {
                        if ( overID !== lastOverID ) {
                            self.kernel.dispatchEvent( lastOverID, "pointerLeave", eData.eventData, eData.eventNodeData );
                            self.kernel.dispatchEvent( overID, "pointerEnter", eData.eventData, eData.eventNodeData );
                            lastOverID = overID;
                        } else {
                            self.kernel.dispatchEvent( overID, "pointerOver", eData.eventData, eData.eventNodeData );
                        }
                    }
                }   
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE );


            // middle click
            mouse.setInputAction( function( movement ) {

                var eData = pick( "middle", 1, "click", movement.position );
                self.kernel.dispatchEvent( downID, "pointerClick", eData.eventData, eData.eventNodeData );
                
            }, Cesium.ScreenSpaceEventType.MIDDLE_CLICK );
            
            // middle double click
            mouse.setInputAction( function( movement ) {

                var eData = pick( "middle", 2, "click", movement.position );
                self.kernel.dispatchEvent( downID, "pointerDoubleClick", eData.eventData, eData.eventNodeData );
                
            }, Cesium.ScreenSpaceEventType.MIDDLE_DOUBLE_CLICK );
            
            // middle up
            mouse.setInputAction( function( movement ) {

                self.state.mouse.middleDown = false;
                var eData = pick( "middle", 1, "up", movement.position );
                self.kernel.dispatchEvent( downID, "pointerUp", eData.eventData, eData.eventNodeData );
                self.state.mouse.middleDownID = undefined;
                self.kernel.setProperty( rootID, "clientControl", { event: 'middle', controller: self.kernel.moniker(), locked: false } );

            }, Cesium.ScreenSpaceEventType.MIDDLE_UP );

            // middle down
            mouse.setInputAction( function( movement ) {

                self.kernel.setProperty( rootID, "clientControl", { event: 'middle', controller: self.kernel.moniker(), locked: true } );
                self.state.mouse.middleDown = true;
                var eData = pick( "middle", 0, "down", movement.position );
                self.kernel.dispatchEvent( downID, "pointerDown", eData.eventData, eData.eventNodeData );

            }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN );


            // right click
            mouse.setInputAction( function( movement ) {

                var eData = pick( "right", 1, "click", movement.position );
                self.kernel.dispatchEvent( downID, "pointerClick", eData.eventData, eData.eventNodeData );
                
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK );
            
            // right double click
            mouse.setInputAction( function( movement ) {

                var eData = pick( "right", 2, "click", movement.position );
                self.kernel.dispatchEvent( downID, "pointerDoubleClick", eData.eventData, eData.eventNodeData );

            }, Cesium.ScreenSpaceEventType.RIGHT_DOUBLE_CLICK );
            
            // right up
            mouse.setInputAction( function( movement ) {

                self.state.mouse.rightDown = false;
                var eData = pick( "right", 0, "up", movement.position );
                self.kernel.dispatchEvent( downID, "pointerUp", eData.eventData, eData.eventNodeData );
                self.state.mouse.rightDownID = undefined;
                self.kernel.setProperty( rootID, "clientControl", { event: 'right', controller: self.kernel.moniker(), locked: false } );

            }, Cesium.ScreenSpaceEventType.RIGHT_UP );

            // right down
            mouse.setInputAction( function( movement ) {

                self.kernel.setProperty( rootID, "clientControl", { event: 'right', controller: self.kernel.moniker(), locked: true } );
                self.state.mouse.rightDown = true;
                var eData = pick( "right", 0, "down", movement.position );
                self.kernel.dispatchEvent( downID, "pointerDown", eData.eventData, eData.eventNodeData );

            }, Cesium.ScreenSpaceEventType.RIGHT_DOWN );


            // pinch start
            mouse.setInputAction( function( movement ) {

                self.kernel.setProperty( rootID, "clientControl", { event: 'pinch', controller: self.kernel.moniker(), locked: true } );
                self.state.mouse.pinching = true;

            }, Cesium.ScreenSpaceEventType.PINCH_START );
            
            // pinch move
            mouse.setInputAction( function( movement ) {

            }, Cesium.ScreenSpaceEventType.PINCH_MOVE );

            // pinch end
            mouse.setInputAction( function( movement ) {

                self.state.mouse.pinching = false;
                self.kernel.setProperty( rootID, "clientControl", { event: 'pinch', controller: self.kernel.moniker(), locked: false } );

            }, Cesium.ScreenSpaceEventType.PINCH_END );

            // wheel
            mouse.setInputAction( function( movement ) {
                self.kernel.setProperty( rootID, "clientControl", { event: 'wheel', controller: self.kernel.moniker(), locked: false } );
            }, Cesium.ScreenSpaceEventType.WHEEL );

        }

    }
    
} );