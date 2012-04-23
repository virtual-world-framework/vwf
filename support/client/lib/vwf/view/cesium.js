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
            
            this.logger.infoc( "createdNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
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
                    var ellipsoid = Cesium.Ellipsoid.getWgs84();
                    var scene = new Cesium.Scene(canvas);
                    var primitives = scene.getPrimitives();
                
                    // Bing Maps
                    var bing = new Cesium.BingMapsTileProvider({
                        server : "dev.virtualearth.net",
                        mapStyle : Cesium.BingMapsStyle.AERIAL
                    });
                
                    var cb = new Cesium.CentralBody(scene.getCamera(), ellipsoid);
                    cb.dayTileProvider = bing;
                    cb.nightImageSource = "Images/land_ocean_ice_lights_2048.jpg";
                    cb.specularMapSource = "Images/earthspec1k.jpg";
                    if (scene.getContext().getMaximumTextureSize() > 2048) {
                        cb.cloudsMapSource = "Images/earthcloudmaptrans.jpg";
                        cb.bumpMapSource = "Images/earthbump1k.jpg";
                    }
                    cb.showSkyAtmosphere = true;
                    cb.showGroundAtmosphere = true;
                    primitives.setCentralBody(cb);
                
                    scene.getCamera().frustum.near = 1.0;
                
                    scene.getCamera().getControllers().addSpindle();
                    scene.getCamera().getControllers().addFreeLook();
                    
                    scene.setAnimation(function() {
                        scene.setSunPosition(Cesium.SunPosition.compute().position);
                    });
                
                    (function tick() {
                        scene.render();
                        Cesium.requestAnimationFrame(tick);
                    }());
    
                    document.oncontextmenu = function() { return false; };
                    
                    view = this;
                    node.scene = scene;
    
                    var handler;
                    handler = new Cesium.EventHandler(canvas);
                    handler.setMouseAction(function () {
                    	view.kernel.setProperty( "http-vwf-example-com-cesium-vwf", "controlClient", view.kernel.moniker() );
                    	if ( view.controlClient == view.kernel.moniker() ) {
                            broadcastCameraData.call( view );
                        }  
                    }, Cesium.MouseEventType.LEFT_DOWN);
                    
                    handler.setMouseAction(function () {
                    	if ( view.controlClient == view.kernel.moniker() ) {
                            broadcastCameraData.call( view );
                        }  
                    }, Cesium.MouseEventType.MOVE); 
                    
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
                                    case "cameraData":
                                    	var position = Cesium.Cartesian3.clone(propertyValue.position);
                                    	var direction = Cesium.Cartesian3.clone(propertyValue.direction);
                                    	var up = Cesium.Cartesian3.clone(propertyValue.up);
                                        scene.getCamera().lookAt(position, direction, up);
                                        value = propertyValue;
                                        break; 
                                }
                            }
                            break;
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
                            case "cameraData":
                                var camera = scene.getCamera();
                                value = {"position": camera.position, "direction": camera.direction, "up": camera.up};
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

    function broadcastCameraData() {
        var node, s;   
        if ( this.state.nodes[ "http-vwf-example-com-node3-vwf-cesiumInstance" ] ) {
            node = this.state.nodes[ "http-vwf-example-com-node3-vwf-cesiumInstance" ];
            s = node.scene;
            if ( s ) {
                var camera = s.getCamera();
                this.kernel.setProperty( "http-vwf-example-com-node3-vwf-cesiumInstance", "cameraData", {"position": camera.position, "direction": camera.direction, "up": camera.up});
            }
        }
    }
} );