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

define( [ "module", "vwf/view", "vwf/utility" ], function( module, view, utility ) {

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {

            if ( !this.state ) {   
                this.state = {};
            }
            if ( !this.state.scenes ) {   
                this.state.scenes = {};
            }
            if ( !this.state.nodes ) {   
                this.state.nodes = {};
            }
 
            this.cesium = undefined;

            this.height = 600;
            this.width = 800;

            if ( window ) {
                if ( window.innerHeight ) this.height = window.innerHeight - 20;
                if ( window.innerWidth ) this.width = window.innerWidth - 20;
                this.window = window;
            } 
            this.controlClient = "NONE";

        },
  
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            if ( childExtendsID === undefined )
                return;
            
            this.logger.infox( "createdNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            var node = {
                parentID: nodeID,
                ID: childID,
                extendsID: childExtendsID,
                implementsIDs: childImplementsIDs,
                source: childSource,
                type: childType,
                name: childName,
                loadComplete: callback
            };
            
            switch ( childExtendsID.toLowerCase() ) {
                case "http-vwf-example-com-cesium-vwf":
                    var outerDiv = jQuery('body').append(
                    "<div class='cesuim-container' id='cesiumContainer'></div>"
                    //    "<canvas id='glCanvas' width='" + this.width + "px' height='" + this.height + "px'></canvas>"
                    );
                    var head = jQuery('head').append(
                        "<script type='text/javascript' src='Cesium.js'></script>"
                    );
                    break;
                case "http-vwf-example-com-node3-vwf":
                    if(childName == "cesiumInstance") {
                        var useWidget = true;
                        this.state.nodes[ childID ] = node;
                        var view = this;
                        var scene;

                        if ( useWidget ) {
                            this.cesium = new Cesium.CesiumWidget('cesiumContainer');
                            scene = this.cesium.scene;

                            scene.skyBox.destroy();
                            scene.skyBox = undefined;
                            scene.skyAtmosphere.destroy();
                            scene.skyAtmosphere = undefined;

                        } else {
                            var canvas = document.createElement('canvas');
                            canvas.className = 'fullSize';
                            document.getElementById('cesiumContainer').appendChild(canvas);

                            canvas.setAttribute( 'height', this.height );
                            canvas.setAttribute( 'width', this.width );

                            canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
                            canvas.onclick = function() {
                                canvas.focus();
                            };

                            scene = new Cesium.Scene( canvas );

                            // scene.skyAtmosphere = new Cesium.SkyAtmosphere();

                            // var skyBoxBaseUrl = '../../../Source/Assets/Textures/SkyBox/tycho2t3_80';
                            // scene.skyBox = new Cesium.SkyBox({
                            //     positiveX : skyBoxBaseUrl + '_px.jpg',
                            //     negativeX : skyBoxBaseUrl + '_mx.jpg',
                            //     positiveY : skyBoxBaseUrl + '_py.jpg',
                            //     negativeY : skyBoxBaseUrl + '_my.jpg',
                            //     positiveZ : skyBoxBaseUrl + '_pz.jpg',
                            //     negativeZ : skyBoxBaseUrl + '_mz.jpg'
                            // });

                            var primitives = scene.getPrimitives();

                            // Bing Maps
                            var bing = new Cesium.BingMapsImageryProvider({
                                url : 'http://dev.virtualearth.net',
                                mapStyle : Cesium.BingMapsStyle.AERIAL,
                                // Some versions of Safari support WebGL, but don't correctly implement
                                // cross-origin image loading, so we need to load Bing imagery using a proxy.
                                proxy : Cesium.FeatureDetection.supportsCrossOriginImagery() ? undefined : new Cesium.DefaultProxy('/proxy/')
                            });

                            var ellipsoid = Cesium.Ellipsoid.WGS84;
                            var centralBody = new Cesium.CentralBody(ellipsoid);
                            centralBody.getImageryLayers().addImageryProvider(bing);

                            primitives.setCentralBody(centralBody);
                        }

                        node.scene = scene;
                        
                        var ctrl = scene.getScreenSpaceCameraController();

                        var spin = ctrl._spinHandler;
                        var trans = ctrl._tranlateHandler
                        var look = ctrl._lookHandler;
                        var rotate = ctrl._rotateHandler;
                        var zoom = ctrl._zoomHandler;
                        var zoomWheel = ctrl._zoomWheelHandler;
                        var pinch = ctrl._pinchHandler;

                        ctrl.enableTranslate = true;
                        ctrl.enableZoom = true;
                        ctrl.enableRotate = true;
                        ctrl.enableTilt = true;
                        ctrl.enableLook = true;

                        // var look = scene.getCamera().getControllers().get(0).lookController;
                        // var centralBody = scene.getCamera().getControllers().get(0);
                        // var rotateHandler = scene.getCamera().getControllers().get(0)._rotateHandler;
                        
                        ( function tick() {
                            var spinning = spin && spin.isMoving() && spin.getMovement();
                            var rotating = rotate && rotate.isMoving();
                            var zooming = zoom && zoom.isMoving();
                            var zoomWheeling = zoomWheel && zoomWheel.isMoving();
                            var spinMovement = spin.getMovement();
                            
                            var rotateMovement = rotate.getMovement();
                            var zoomMovement = zoom.getMovement();
                            var zoomWheelMovement = zoomWheel.getMovement();
                            
                            var lookIsMoving = look.isMoving();
                            var lookMovement = look.getMovement();
                            
                            broadcastCameraControllerData.call(view, {
                            	"spinning": spinning,
                            	"rotating": rotating,
                            	"zooming": zooming,
                            	"zoomWheeling": zoomWheeling,
                            	"spinMovement": spinMovement,
                            	"spinTouchStart": spin.getButtonPressTime() ? spin.getButtonPressTime().getTime() : undefined,
                            	"spinTouchRelease": spin.getButtonReleaseTime() ? spin.getButtonReleaseTime().getTime() : undefined,
                            	"spinLastMovement": spin.getLastMovement(),
                            	"rotateMovement": rotateMovement,
                            	"zoomMovement": zoomMovement,
                            	"zoomTouchStart": zoom.getButtonPressTime() ? zoom.getButtonPressTime().getTime() : undefined,
                            	"zoomTouchRelease": zoom.getButtonReleaseTime() ? zoom.getButtonReleaseTime().getTime() : undefined,
                            	"zoomLastMovement": zoom.getLastMovement(),
                            	"zoomWheelMovement": zoomWheelMovement,
                            	"zoomWheelTouchStart": zoomWheel.getButtonPressTime() ? zoomWheel.getButtonPressTime().getTime() : undefined,
                            	"zoomWheelTouchRelease": zoomWheel.getButtonReleaseTime() ? zoomWheel.getButtonReleaseTime().getTime() : undefined,
                            	"zoomWheelLastMovement": zoomWheel.getLastMovement(),
                            	"lookIsMoving": lookIsMoving,
                            	"lookMovement": lookMovement
                            });
                            
                            // if ( spinning ) {
                            //  	spin._spin(spinMovement);
                            // } 
                            
                            // if ( rotating ) {
                            //  	centralBody._rotate(rotateMovement);
                            // }

                            // if ( zooming ) {
                            //  	spin._zoom(zoomMovement);
                            // } else if (zoomWheeling) {
                            //  	spin._zoom(zoomWheelMovement);
                            // }
                            
                            // if ( lookIsMoving ) {
                            //  	look._look(lookMovement);
                            // }
                            scene.initializeFrame();
                            scene.render();
                            Cesium.requestAnimationFrame(tick);
                        }());
    					
    					var keydownHandler = function(e) {
    						var keyCode = e.keyCode;
    						if (keyCode === 82) {	// "R"
    							console.log("Synchronize views");
    							var direction = scene.getCamera().direction;
    							var position = scene.getCamera().position;
    							var up = scene.getCamera().up;
    							var right = scene.getCamera().right;
    							broadcastCameraViewData.call(view, {
    								"direction": direction,
    								"position": position,
    								"up": up,
    								"right": scene.getCamera().right
    							});
    						}
    					}
    					document.addEventListener('keydown', keydownHandler, false);
                        
                        document.oncontextmenu = function() { return false; };  
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
            
            var value, cesiumInstance;

            for(var node in this.state.nodes) {
                if(this.state.nodes[node].name == "cesiumInstance") {
                    cesiumInstance = this.state.nodes[node];
                }
            }

            if ( propertyValue ) {
                var scene;

                if ( propertyName == "backgroundColor" ) {
                    if( cesiumInstance && nodeID == cesiumInstance.ID ) {
                        scene = cesiumInstance.scene;
                        if ( propertyValue instanceof String ) {
                            propertyValue = propertyValue.replace( /\s/g, '' );
                        }
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {                            
                            scene.backgroundColor = new Cesium.Color( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255, vwfColor.alpha() );
                        } 
                    }
                } else if ( propertyName == "controlClient" ) {
                    this.controlClient = propertyValue;
                    value = propertyValue;
                } else if ( this.kernel.client() != this.kernel.moniker() ) { 
                    if(cesiumInstance && nodeID == cesiumInstance.ID) {
                        scene = cesiumInstance.scene;
                        switch ( propertyName ) {
                            case "cameraViewData":
                            	var position = Cesium.Cartesian3.clone(propertyValue.position);
                            	var direction = Cesium.Cartesian3.clone(propertyValue.direction);
                            	var up = Cesium.Cartesian3.clone(propertyValue.up);
                            	var right = Cesium.Cartesian3.clone(propertyValue.right);
                            	var camera = scene.getCamera();
                            	camera.position = position;
                            	camera.direction = direction;
                            	camera.up = up;
                            	camera.right = right;
                            	break;
                            case "cameraControllerData":
                                var ctrl = scene.getScreenSpaceCameraController();

                                var spin = ctrl._spinHandler;
                                var trans = ctrl._tranlateHandler
                                var look = ctrl._lookHandler;
                                var rotate = ctrl._rotateHandler;
                                var zoom = ctrl._zoomHandler;
                                var zoomWheel = ctrl._zoomWheelHandler;
                                var pinch = ctrl._pinchHandler;

                            	//var spindle = scene.getCamera().getControllers().get(0).spindleController;
                            	//var look = scene.getCamera().getControllers().get(0).lookController;
                            	//var centralBody = scene.getCamera().getControllers().get(0);
                                
                                var spinning = propertyValue.spinning;
                                var rotating = propertyValue.rotating;
                            	var zooming = propertyValue.zooming;
                            	var zoomWheeling = propertyValue.zoomWheeling;
                            	var spinMovement = propertyValue.spinMovement;
                            	var rotateMovement = propertyValue.rotateMovement;
                            	var zoomMovement = propertyValue.zoomMovement;
                            	var zoomWheelMovement = propertyValue.zoomWheelMovement;
                            	
                            	var spinTouchStart = propertyValue.spinTouchStart;
                            	var spinTouchRelease = propertyValue.spinTouchRelease;
                            	var spinLastMovement = propertyValue.spinLastMovement;
                            	
                            	var zoomTouchStart = propertyValue.zoomTouchStart;
                            	var zoomTouchRelease = propertyValue.zoomTouchRelease;
                            	var zoomLastMovement = propertyValue.zoomLastMovement;
                            	
                            	var zoomWheelTouchStart = propertyValue.zoomWheelTouchStart;
                            	var zoomWheelTouchRelease = propertyValue.zoomWheelTouchRelease;
                            	var zoomWheelLastMovement = propertyValue.zoomWheelLastMovement;
                            	
                            	var lookIsMoving = propertyValue.lookIsMoving;
                            	var lookMovement = propertyValue.lookMovement;
                            	
                                if (spinning) {
                                	spin._spin(spinMovement);                                        	
                                }
                                
                                if (rotating) {
                                	rotate._rotate(rotateMovement);
                                }

                                if (zooming) {
                                	spin._zoom(zoomMovement);
                                }
                                else if (zoomWheeling) {
                                	spin._zoom(zoomWheelMovement);
                                }
                                
                                if (!rotating && spin.inertiaSpin < 1.0) {
                                    Cesium.CameraHelpers.createInertia(spinTouchStart, spinTouchRelease, spinLastMovement, spindle.inertiaSpin, spindle._spin, spindle, '_lastInertiaSpinMovement');
                                }
                                if (!zooming && spin.inertiaZoom < 1.0) {
                                	Cesium.CameraHelpers.createInertia(zoomTouchStart, zoomTouchRelease, zoomLastMovement, spindle.inertiaZoom, spindle._zoom, spindle, '_lastInertiaZoomMovement');
                                }
                                if (!zoomWheeling && spin.inertiaZoom < 1.0) {
                                	Cesium.CameraHelpers.createInertia(zoomWheelTouchStart, zoomWheelTouchRelease, zoomWheelLastMovement, spindle.inertiaZoom, spindle._zoom, spindle, '_lastInertiaWheelZoomMovement');
                                }
                                
                                if(lookIsMoving) {
                                	look._look(lookMovement);
                                }
                                
                                value = propertyValue;
                            	break;
                        }
                    }
            	}
            }
            return value;
        },

        gotProperty: function (nodeID, propertyName, propertyValue) {
            var value, cesiumInstance;

            for(var node in this.state.nodes) {
                if(this.state.nodes[node].name == "cesiumInstance") {
                    cesiumInstance = this.state.nodes[node];
                }
            }

            if(cesiumInstance && nodeID == cesiumInstance.ID) {                  
            	var scene = cesiumInstance.scene;
                switch ( propertyName ) {
                    case "cameraViewData":
                        var camera = scene.getCamera();
                        value = {"position": camera.position, "direction": camera.direction, "up": camera.up, "right": camera.right};
                        break;
                }
            }
            else {
                switch ( propertyName ) { 
                    case "controlClient":
                        value = this.controlClient;
                        break;
                }
            }
            propertyValue = value;
            return value;
        },
    } );
	
    function broadcastCameraViewData(cameraData) {
        var node, scene;   
        if ( this.kernel.find("", "//cesiumInstance").length > 0 ) {
            node = this.state.nodes[ this.kernel.find("", "//cesiumInstance")[0] ];
            scene = node.scene;
            if ( scene ) {
            	this.kernel.setProperty(this.kernel.find("", "//cesiumInstance")[0], "cameraViewData", cameraData);
            }
        }
    }
    
    function broadcastCameraControllerData(cameraControllerData) {
        var node, scene;   
        if ( this.kernel.find("", "//cesiumInstance").length > 0 ) {
            node = this.state.nodes[ this.kernel.find("", "//cesiumInstance")[0] ];
            scene = node.scene;
            if ( scene ) {
            	this.kernel.setProperty(this.kernel.find("", "//cesiumInstance")[0], "cameraControllerData", cameraControllerData);
            }
        }
    }
} );