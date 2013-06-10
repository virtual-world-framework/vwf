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

            this.useCesiumWidget = options.useCesiumWidget !== undefined ? options.useCesiumWidget : true;
            this.parentDiv = options.parentDiv !== undefined ? options.parentDiv : 'body';
            this.containerDiv = options.containerDiv !== undefined ? options.containerDiv : 'cesiumContainer';

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
            var protos = getPrototypes.call( this, kernel, childExtendsID  )
            var node = undefined;

            if ( isCesiumDefinition.call( this, protos ) ) {

                debugger;
                jQuery( this.parentDiv ).append(
                    "<div class='cesuim-container' id='"+this.containerDiv+"'></div>"
                );

                if ( this.state.scenes[ childID ] === undefined ) {
                    this.state.scenes[ childID ] = node = createNode();
                } else {
                    node = this.state.scenes[ childID ];    
                }

                var view = this;
                var scene;

                if ( this.useCesiumWidget ) {
                    node.widget = new Cesium.CesiumWidget( this.containerDiv );
                    scene = node.widget.scene;

                    scene.sun.destroy();
                    scene.sun = undefined;
                    scene.skyBox.destroy();
                    scene.skyBox = undefined;
                    scene.skyAtmosphere.destroy();
                    scene.skyAtmosphere = undefined;

                } else {
                    var canvas = document.createElement('canvas');
                    canvas.className = 'fullSize';
                    document.getElementById( this.containerDiv ).appendChild(canvas);

                    canvas.setAttribute( 'height', this.height );
                    canvas.setAttribute( 'width', this.width );

                    //canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
                    //canvas.onclick = function() {
                    //    canvas.focus();
                    //};

                    scene = new Cesium.Scene( canvas, { "alpha": true } );

                    var primitives = scene.getPrimitives();

                    var ellipsoid = Cesium.Ellipsoid.WGS84;
                    node.centralBody = new Cesium.CentralBody( ellipsoid );
                    primitives.setCentralBody( node.centralBody );
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
                    //      spin._spin(spinMovement);
                    // } 
                    
                    // if ( rotating ) {
                    //      centralBody._rotate(rotateMovement);
                    // }

                    // if ( zooming ) {
                    //      spin._zoom(zoomMovement);
                    // } else if (zoomWheeling) {
                    //      spin._zoom(zoomWheelMovement);
                    // }
                    
                    // if ( lookIsMoving ) {
                    //      look._look(lookMovement);
                    // }
                    scene.initializeFrame();
                    scene.render();
                    Cesium.requestAnimationFrame(tick);
                }());
                
                var keydownHandler = function(e) {
                    var keyCode = e.keyCode;
                    if (keyCode === 82) {   // "R"
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
            var node = this.state.nodes[ nodeID ];
            if ( node === undefined ) {
                this.state.scenes[ nodeID ];
            }
            if ( node === undefined ) { return; }

            if ( propertyValue ) {
                var scene = node.scene;

                if ( this.kernel.client() != this.kernel.moniker() ) { 
                    if ( scene ) {
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
                                } else if (zoomWheeling) {
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

        gotProperty: function( nodeID, propertyName, propertyValue ) {
            
            var value;
            var node = this.state.nodes[ nodeID ];
            if ( node === undefined ) {
                this.state.scenes[ nodeID ];
            }
            if ( node === undefined ) { return value; }

            if ( node.scene ) {

                var scene = node.scene;
                switch ( propertyName ) {

                    case "cameraViewData":
                        var camera = scene.getCamera();
                        value = { 
                                    "position": camera.position, 
                                    "direction": camera.direction, 
                                    "up": camera.up, 
                                    "right": camera.right
                                };
                        break;

                    case "controlClient":
                        value = node.controlClient;
                        break; 

               }

            }
            propertyValue = value;
            return value;
        },
    } );
 
    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
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