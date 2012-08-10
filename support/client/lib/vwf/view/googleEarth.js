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
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {

            if ( childExtendsID === undefined )
                return;

            this.logger.infox( "createdNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childURI, childName );
            var node = {
                parentID: nodeID,
                ID: childID,
                extendsID: childExtendsID,
                implementsIDs: childImplementsIDs,
                source: childSource,
                type: childType,
                name: childName,
                loadComplete: callback,
            };
            var win;
    
            switch ( childExtendsID.toLowerCase() ) {
                case "http-vwf-example-com-googleearth-vwf":
                    this.state.scenes[ childID ] = node;
                    var outerDiv = jQuery('body').append(
                        "<div id='map3d' style='border: 1px solid silver; width: " + this.width + "px; height: " + this.height + "px;'></div>"
                    );

                   window.onresize = function( event ) { console.info( "WINDOW: onresize" ); }
                   break;

                case "http-vwf-example-com-node3-vwf":
                    
                    this.state.nodes[ childID ] = node;
                    var view = this;
                    if ( childID == "http-vwf-example-com-node3-vwf-earth" ) {
                       
                        var interval;
                        var view = this;
                        win = this.window;
                        var gg = google;
                        interval = win.setInterval( function() {
                            if ( gg.earth ) {
                                node.earth = gg.earth;
                                gg.earth.createInstance( "map3d", function(instance) {
                                    
                                    gg.earth.geInstance = instance;
                                    node.earthInst = instance;
                                    node.earthInst.getWindow().setVisibility(true);
    
                                    // add a navigation control
                                    node.earthInst.getNavigationControl().setVisibility(node.earthInst.VISIBILITY_AUTO);
    
                                    // add some layers
                                    node.earthInst.getLayerRoot().enableLayerById(node.earthInst.LAYER_BORDERS, true);
                                    node.earthInst.getLayerRoot().enableLayerById(node.earthInst.LAYER_ROADS, true);
                                    node.earthInst.getOptions().setFlyToSpeed( node.earthInst.SPEED_TELEPORT );


                                    var la = node.earthInst.getView().copyAsLookAt(node.earthInst.ALTITUDE_RELATIVE_TO_GROUND);
                                    la.setRange( 100000 );
                                    la.setLatitude( 38.9 );
                                    la.setLongitude( -77 );
                                    node.earthInst.getView().setAbstractView(la);

                                    view.kernel.execute("http-vwf-example-com-node3-vwf-lookAt", "this.cameraData = this.cameraData");
    
                                    view.control = false;

                                    gg.earth.addEventListener( node.earthInst.getWindow(), 'mousedown', function() {
                                        view.controlClient = view.kernel.moniker();
                                        view.kernel.setProperty( "http-vwf-example-com-googleEarth-vwf", "controlClient", view.kernel.moniker() );
                                    });
//                                    gg.earth.addEventListener( node.earthInst.getWindow(), 'mousemove', function() {
//                                        //view.pointerDown = false;    
//                                    });

//                                    gg.earth.addEventListener( node.earthInst.getWindow(), 'mouseup', function() {
//                                        //view.pointerDown = false;    
//                                    });

                                    // view changed event listener
                                    gg.earth.addEventListener( node.earthInst.getView(), 'viewchange', function() {
                                        if ( view.controlClient == view.kernel.moniker() ) {
                                            broadcastCameraData.call( view );
                                        }  
                                    });

                                    // view changed END event listener
                                    gg.earth.addEventListener( node.earthInst.getView(), 'viewchangeend', function() {
                                        if ( view.controlClient == view.kernel.moniker() ) {
                                            broadcastCameraData.call( view );
                                        }  

                                    });

                                    view.kernel.callMethod( nodeID, "loaded", [] );

                                }, function(errorCode) {
                                    this.logger.info( "google earth load error: " + errorCode );
                                } );
                                win.clearInterval( interval );
                            }
                        }, 1000 );
                    }
                    break;

            }


        }, 

        //deletedNode: function (nodeID) {
        //},
  
        //createdProperty: function (nodeID, propertyName, propertyValue) {
        //},        

        //initializedProperty: function (nodeID, propertyName, propertyValue) {
        //},        

        satProperty: function( nodeID, propertyName, propertyValue ) {
            
            var value = undefined;
            var obj, earth, ge;
            var earth = this.state.nodes[ "http-vwf-example-com-node3-vwf-earth" ];
            if ( propertyValue ) {
                //this.logger.infox( "satProperty", nodeID, propertyName, propertyValue );
                if ( propertyName == "controlClient" ) {
                    this.controlClient = propertyValue;
                    value = propertyValue;
                } else if ( this.kernel.client() != this.kernel.moniker() ) { 

                    switch ( nodeID ) {
                        case "http-vwf-example-com-node3-vwf-camera":
                        case "http-vwf-example-com-node3-vwf-lookAt":
                            if ( earth && earth.earthInst ) {
                                ge = earth.earthInst;
                                if ( nodeID == "http-vwf-example-com-node3-vwf-lookAt" ) {
                                    obj = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
                                } else {
                                    obj = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
                                }
                                switch ( propertyName ) {
                                    case "longitude":
                                        obj.setLongitude( propertyValue );
                                        ge.getView().setAbstractView(obj);
                                        value = propertyValue; 
                                        break;
                                    case "latitude":
                                        obj.setLatitude( propertyValue );
                                        ge.getView().setAbstractView(obj);
                                        value = propertyValue;  
                                        break;
                                    case "altitude":
                                        obj.setAltitude( propertyValue );
                                        ge.getView().setAbstractView(obj);
                                        value = propertyValue;
                                        break; 
                                    case "altitudeMode":
                                        obj.setAltitudeMode( propertyValue );
                                        ge.getView().setAbstractView(obj);
                                        value = propertyValue;
                                        break;
                                    case "heading":
                                        obj.setHeading( propertyValue );
                                        ge.getView().setAbstractView(obj);
                                        value = propertyValue;
                                        break;
                                    case "tilt":
                                        obj.setTilt( propertyValue );
                                        ge.getView().setAbstractView(obj);
                                        value = propertyValue;
                                        break; 
                                    case "range":
                                        obj.setRange( propertyValue );
                                        ge.getView().setAbstractView(obj);
                                        value = propertyValue;
                                        break;                                                                                                                                                                                      
                                    case "cameraData":
                                        obj.setLongitude( propertyValue[0] );
                                        obj.setLatitude( propertyValue[1] );
                                        obj.setAltitude( propertyValue[2] );
                                        obj.setAltitudeMode( propertyValue[3] );
                                        obj.setHeading( propertyValue[4] );
                                        obj.setTilt( propertyValue[5] );
                                        obj.setRange( propertyValue[6] );
                                        ge.getView().setAbstractView( obj );
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

            var value = undefined;
            var obj, earth, ge;
            var earth = this.state.nodes[ "http-vwf-example-com-node3-vwf-earth" ];
            switch ( nodeID ) {
                case "http-vwf-example-com-node3-vwf-camera":
                case "http-vwf-example-com-node3-vwf-lookAt":
                    if ( earth && earth.earthInst ) {
                        ge = earth.earthInst;
                        if ( nodeID == "http-vwf-example-com-node3-vwf-lookAt" ) {
                            obj = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
                        } else {
                            obj = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
                        }                        
                        switch ( propertyName ) {
                            case "longitude":
                                value = obj.getLongitude();
                                break;
                            case "latitude":
                                value = obj.getLatitude();
                                break;
                            case "altitude":
                                value = obj.getAltitude();
                                break;
                            case "altitudeMode":
                                value = obj.getAltitudeMode();
                                break;
                            case "heading":
                                value = obj.getHeading();
                                break;
                            case "tilt":
                                value = obj.getTilt();
                                break;
                            case "range":
                                if ( obj.getRange )
                                    value = obj.getRange();
                                break;
                            case "cameraData":
                                value = [ obj.getLongitude(), obj.getLatitude(), obj.getAltitude(),
                                          obj.getAltitudeMode(), obj.getHeading(), obj.getTilt(),
                                          obj.getRange ? obj.getRange() : undefined ];
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
        var node, ge;   
        if ( this.state.nodes[ "http-vwf-example-com-node3-vwf-earth" ] ) {
            node = this.state.nodes[ "http-vwf-example-com-node3-vwf-earth" ];
            ge = node.earthInst;
            if ( ge ) {
                var la = ge.getView().copyAsLookAt( ge.ALTITUDE_RELATIVE_TO_GROUND );
                var cameraData = [ la.getLongitude(), la.getLatitude(), la.getAltitude(),
                                    la.getAltitudeMode(), la.getHeading(), la.getTilt(), la.getRange()  ];                          

                this.kernel.setProperty( "http-vwf-example-com-node3-vwf-lookAt", "cameraData", cameraData );
            }
        }
    }

} );