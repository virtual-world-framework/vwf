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

define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/document extends a view interface up to the browser document. When vwf/view/document
    // is active, scripts on the main page may make (reflected) kernel calls:

    //     window.vwf_view.createNode( nodeID, childID, childExtendsID, childImplementsIDs,
    //         childSource, childType, childName, function( childID ) {
    //         ...
    //     } );

    // And receive view calls:

    //     window.vwf_view.createdNode = function( nodeID, childID, childExtendsID, childImplementsIDs,
    //         childSource, childType, childName, callback /* ( ready ) */ ) {
    //         ...
    //     }
    
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
            childSource, childType, childName, callback /* ( ready ) */ ) {

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
                        "<canvas id='glCanvas' width='" + this.width + "px' height='" + this.height + "px'></canvas>"
                    );
                    var head = jQuery('head').append(
                        "<script type='text/javascript' src='Cesium.js'></script>"
                    );
                    break;
                case "http-vwf-example-com-node3-vwf":
                    this.state.nodes[ childID ] = node;
                    var view = this;
                   
                    var canvas = document.getElementById("glCanvas");
                    var ellipsoid = Cesium.Ellipsoid.WGS84;
                    var scene = new Cesium.Scene(canvas);
                    var primitives = scene.getPrimitives();
                
                    // Bing Maps
                    var bing = new Cesium.BingMapsTileProvider({
                        server : "dev.virtualearth.net",
                        mapStyle : Cesium.BingMapsStyle.AERIAL
                    });
                
                    var cb = new Cesium.CentralBody(ellipsoid);
                    cb.dayTileProvider = bing;
                    cb.nightImageSource = "images/land_ocean_ice_lights_2048.jpg";
                    cb.specularMapSource = "images/earthspec1k.jpg";
                    if (scene.getContext().getMaximumTextureSize() > 2048) {
                        cb.cloudsMapSource = "images/earthcloudmaptrans.jpg";
                        cb.bumpMapSource = "images/earthbump1k.jpg";
                    }
                    cb.showSkyAtmosphere = true;
                    cb.showGroundAtmosphere = false;
                    primitives.setCentralBody(cb);
                
                    scene.getCamera().frustum.near = 1.0;
                
                    scene.getCamera().getControllers().addCentralBody();
                    
                    scene.setAnimation(function() {
                        scene.setSunPosition(Cesium.SunPosition.compute().position);
                    });
                    
                    view = this;
                    node.scene = scene;
                    
                    var spindle = scene.getCamera().getControllers().get(0).spindleController;
                    var spinHandler = spindle._spinHandler;
                    var rightZoom = spindle._zoomHandler;
                    var wheelZoom = spindle._zoomWheel;
                    var freeLook = scene.getCamera().getControllers().get(0).freeLookController;
                    var centralBody = scene.getCamera().getControllers().get(0);
                    var rotateHandler = scene.getCamera().getControllers().get(0)._rotateHandler;
                    
                    (function tick() {
                        var spinning = spinHandler && spinHandler.isMoving() && spinHandler.getMovement();
                        var rotating = rotateHandler && rotateHandler.isMoving();
                        var rightZooming = rightZoom && rightZoom.isMoving();
                        var wheelZooming = wheelZoom && wheelZoom.isMoving();
                        var spinMovement = spinHandler.getMovement();
                        var rotateMovement = rotateHandler.getMovement();
                        var rightZoomMovement = rightZoom.getMovement();
                        var wheelZoomMovement = wheelZoom.getMovement();
                        
                        var freeLookIsMoving = freeLook._handler.isMoving();
                        var freeLookMovement = freeLook._handler.getMovement();
                        
                        broadcastCameraControllerData.call(view, {
                        	"spinning": spinning,
                        	"rotating": rotating,
                        	"rightZooming": rightZooming,
                        	"wheelZooming": wheelZooming,
                        	"spinMovement": spinMovement,
                        	"spinTouchStart": spinHandler.getButtonPressTime() ? spinHandler.getButtonPressTime().getTime() : undefined,
                        	"spinTouchRelease": spinHandler.getButtonReleaseTime() ? spinHandler.getButtonReleaseTime().getTime() : undefined,
                        	"spinLastMovement": spinHandler.getLastMovement(),
                        	"rotateMovement": rotateMovement,
                        	"rightZoomMovement": rightZoomMovement,
                        	"rightZoomTouchStart": rightZoom.getButtonPressTime() ? rightZoom.getButtonPressTime().getTime() : undefined,
                        	"rightZoomTouchRelease": rightZoom.getButtonReleaseTime() ? rightZoom.getButtonReleaseTime().getTime() : undefined,
                        	"rightZoomLastMovement": rightZoom.getLastMovement(),
                        	"wheelZoomMovement": wheelZoomMovement,
                        	"wheelZoomTouchStart": wheelZoom.getButtonPressTime() ? wheelZoom.getButtonPressTime().getTime() : undefined,
                        	"wheelZoomTouchRelease": wheelZoom.getButtonReleaseTime() ? wheelZoom.getButtonReleaseTime().getTime() : undefined,
                        	"wheelZoomLastMovement": wheelZoom.getLastMovement(),
                        	"freeLookIsMoving": freeLookIsMoving,
                        	"freeLookMovement": freeLookMovement
                        });
                        
                        if (spinning) {
                        	spindle._spin(spinMovement);
                        } 
                        
                        if (rotating) {
                        	centralBody._rotate(rotateMovement);
                        }

                        if (rightZooming) {
                        	spindle._zoom(rightZoomMovement);
                        }
                        else if (wheelZooming) {
                        	spindle._zoom(wheelZoomMovement);
                        }
                        
                        if(freeLookIsMoving) {
                        	freeLook._look(freeLookMovement);
                        }
                        
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
        }, 

        //deletedNode: function (nodeID) {
        //},
  
        //createdProperty: function (nodeID, propertyName, propertyValue) {
        //},        

        //initializedProperty: function (nodeID, propertyName, propertyValue) {
        //},        

        satProperty: function( nodeID, propertyName, propertyValue ) {
            
            var value;
            var node = this.state.nodes[ "http-vwf-example-com-node3-vwf-cesiumInstance" ];
            if ( propertyValue ) {
                if ( propertyName == "controlClient" ) {
                    this.controlClient = propertyValue;
                    value = propertyValue;
                } else if ( this.kernel.client() != this.kernel.moniker() ) { 
                    switch ( nodeID ) {
                        case "http-vwf-example-com-node3-vwf-cesiumInstance":
                            if (node) {
                                var scene = node.scene;
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
                                    	var spindle = scene.getCamera().getControllers().get(0).spindleController;
                                    	var freeLook = scene.getCamera().getControllers().get(0).freeLookController;
                                    	var centralBody = scene.getCamera().getControllers().get(0);
                                    	
                                    	var rightZoom = spindle._zoomHandler;
                                        var wheelZoom = spindle._zoomWheel;
                                        
                                        var spinning = propertyValue.spinning;
                                        var rotating = propertyValue.rotating;
                                    	var rightZooming = propertyValue.rightZooming;
                                    	var wheelZooming = propertyValue.wheelZooming;
                                    	var spinMovement = propertyValue.spinMovement;
                                    	var rotateMovement = propertyValue.rotateMovement;
                                    	var rightZoomMovement = propertyValue.rightZoomMovement;
                                    	var wheelZoomMovement = propertyValue.wheelZoomMovement;
                                    	
                                    	var spinTouchStart = propertyValue.spinTouchStart;
                                    	var spinTouchRelease = propertyValue.spinTouchRelease;
                                    	var spinLastMovement = propertyValue.spinLastMovement;
                                    	
                                    	var rightZoomTouchStart = propertyValue.righZoomTouchStart;
                                    	var rightZoomTouchRelease = propertyValue.rightZoomTouchRelease;
                                    	var rightZoomLastMovement = propertyValue.rightZoomLastMovement;
                                    	
                                    	var wheelZoomTouchStart = propertyValue.wheelZoomTouchStart;
                                    	var wheelZoomTouchRelease = propertyValue.wheelZoomTouchRelease;
                                    	var wheelZoomLastMovement = propertyValue.wheelZoomLastMovement;
                                    	
                                    	var freeLookIsMoving = propertyValue.freeLookIsMoving;
                                    	var freeLookMovement = propertyValue.freeLookMovement;
                                    	
                                        if (spinning) {
                                        	spindle._spin(spinMovement);                                        	
                                        }
                                        
                                        if (rotating) {
                                        	centralBody._rotate(rotateMovement);
                                        }

                                        if (rightZooming) {
                                        	spindle._zoom(rightZoomMovement);
                                        }
                                        else if (wheelZooming) {
                                        	spindle._zoom(wheelZoomMovement);
                                        }
                                        
                                        if (!rotating && spindle.inertiaSpin < 1.0) {
                                            Cesium.CameraHelpers.createInertia(spinTouchStart, spinTouchRelease, spinLastMovement, spindle.inertiaSpin, spindle._spin, spindle, '_lastInertiaSpinMovement');
                                        }
                                        if (!rightZooming && spindle.inertiaZoom < 1.0) {
                                        	Cesium.CameraHelpers.createInertia(rightZoomTouchStart, rightZoomTouchRelease, rightZoomLastMovement, spindle.inertiaZoom, spindle._zoom, spindle, '_lastInertiaZoomMovement');
                                        }
                                        if (!wheelZooming && spindle.inertiaZoom < 1.0) {
                                        	Cesium.CameraHelpers.createInertia(wheelZoomTouchStart, wheelZoomTouchRelease, wheelZoomLastMovement, spindle.inertiaZoom, spindle._zoom, spindle, '_lastInertiaWheelZoomMovement');
                                        }
                                        
                                        if(freeLookIsMoving) {
                                        	freeLook._look(freeLookMovement);
                                        }
                                        
                                        value = propertyValue;
                                    	break;
                                }
                            }
                    }
            	}
            }
            return value;
        },

        gotProperty: function (nodeID, propertyName, propertyValue) {
            var value;
            var node = this.state.nodes[ "http-vwf-example-com-node3-vwf-cesiumInstance" ];
            switch ( nodeID ) {
                case "http-vwf-example-com-node3-vwf-cesiumInstance":
                    if ( node ) {                   
                    	var scene = node.scene;
                        switch ( propertyName ) {
                            case "cameraViewData":
                                var camera = scene.getCamera();
                                value = {"position": camera.position, "direction": camera.direction, "up": camera.up, "right": camera.right};
                                break;
                        }
                    }
                    break;
                default:
                    switch ( propertyName ) { 
                        case "controlClient":
                            value = this.controlClient;
                            break;
                    }
                    break; 

            }
            propertyValue = value;
            return value;
        },
    } );
	
    function broadcastCameraViewData(cameraData) {
        var node, scene;   
        if ( this.state.nodes[ "http-vwf-example-com-node3-vwf-cesiumInstance" ] ) {
            node = this.state.nodes[ "http-vwf-example-com-node3-vwf-cesiumInstance" ];
            scene = node.scene;
            if ( scene ) {
            	this.kernel.setProperty("http-vwf-example-com-node3-vwf-cesiumInstance", "cameraViewData", cameraData);
            }
        }
    }
    
    function broadcastCameraControllerData(cameraControllerData) {
        var node, scene;   
        if ( this.state.nodes[ "http-vwf-example-com-node3-vwf-cesiumInstance" ] ) {
            node = this.state.nodes[ "http-vwf-example-com-node3-vwf-cesiumInstance" ];
            scene = node.scene;
            if ( scene ) {
            	this.kernel.setProperty("http-vwf-example-com-node3-vwf-cesiumInstance", "cameraControllerData", cameraControllerData);
            }
        }
    }
} );