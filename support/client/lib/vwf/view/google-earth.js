﻿"use strict";

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

/// @module vwf/view/googleEarth
/// @requires vwf/view

define( [ "module", "vwf/view", "jquery" ], function( module, view, jQuery ) {
    var myOptions = undefined;
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
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            if ( childExtendsID === undefined )
                return;

            this.logger.infox( "createdNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName );
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
                case "http://vwf.example.com/googleearth.vwf":
                    this.state.scenes[ childID ] = node;
                    var outerDiv = jQuery('body').append(
                        "<div id='map3d' style='border: 1px solid silver; width: " + this.width + "px; height: " + this.height + "px;'></div>"
                    );

                   window.onresize = function( event ) { console.info( "WINDOW: onresize" ); }
                   break;

                case "http://vwf.example.com/node3.vwf":
                    
                    this.state.nodes[ childID ] = node;
                    var view = this;
                    if ( childName == "earth" ) {
                       
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
                                    node.earthInst.getLayerRoot().enableLayerById(node.earthInst.LAYER_BUILDINGS, true);
                                    node.earthInst.getLayerRoot().enableLayerById(node.earthInst.LAYER_ROADS, true);
                                    node.earthInst.getLayerRoot().enableLayerById(node.earthInst.LAYER_TERRAIN, true);
                                    node.earthInst.getLayerRoot().enableLayerById(node.earthInst.LAYER_TREES, true);
                                    node.earthInst.getOptions().setFlyToSpeed( node.earthInst.SPEED_TELEPORT );
                                    myOptions = node.earthInst.getOptions();
                                    myOptions.setMouseNavigationEnabled(false);


                                    var la = node.earthInst.getView().copyAsLookAt(node.earthInst.ALTITUDE_RELATIVE_TO_GROUND);
                                    la.setRange( 100000 );
                                    la.setLatitude( 38.9 );
                                    la.setLongitude( -77 );
                                    node.earthInst.getView().setAbstractView(la);

                                    if(view.kernel.find("", "//lookAt").length > 0) {
                                        view.kernel.execute(view.kernel.find("", "//lookAt")[0], "this.cameraData = this.cameraData");
                                    }
    
                                    view.control = false;

                                    gg.earth.addEventListener( node.earthInst.getWindow(), 'mousedown', function() {
                                        view.controlClient = view.kernel.moniker();
                                        view.kernel.setProperty( vwf_view.kernel.prototype(vwf_view.kernel.find("","/")), "controlClient", view.kernel.moniker() );
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
                                }, {

                                    // https://developers.google.com/earth/documentation/#sidedatabase
                                    // https://developers.google.com/earth/documentation/reference/google_earth_namespace#a70288485024d8129dd1c290fb2e5553b

                                    // Alternate database server:
                                    // database: "http://khmdb.google.com/?db=moon",

                                    // If required by the server:
                                    // username: "",
                                    // password: "",

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
  
        createdProperty: function (nodeID, propertyName, propertyValue) {
            return this.initializedProperty(nodeID, propertyName, propertyValue);   
        },       

        initializedProperty: function (nodeID, propertyName, propertyValue) {
            switch (propertyName) {
                case "controlClient": 
                    if ( propertyValue == vwf_view.kernel.moniker() ) {
                        enableMouseControl.call( vwf_view );
                    }
                    else {
                        disableMouseControl.call( vwf_view );
                    }
                    break;
            }
        },        

        satProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;
            var obj, earth, ge;
            for(var node in this.state.nodes) {
                if(this.state.nodes[node].name == "earth") {
                    earth = this.state.nodes[node];
                }
            }
            if ( propertyValue && earth ) {
                //this.logger.infox( "satProperty", nodeID, propertyName, propertyValue );
                if ( propertyName == "controlClient" ) {
                    if ( propertyValue != vwf_view.kernel.moniker() ) {
                      disableMouseControl.call( vwf_view );
                    }
                    else {
                      enableMouseControl.call( vwf_view );
                    }
                    this.controlClient = propertyValue;
                    value = propertyValue;
                } else if ( this.kernel.client() != this.kernel.moniker() ) { 
                    if(vwf_view.kernel.test("", "/camera", nodeID) || vwf_view.kernel.test("", "/lookAt", nodeID)) {
                        if ( earth && earth.earthInst ) {
                            ge = earth.earthInst;
                            if ( vwf_view.kernel.test("", "/lookAt", nodeID) ) {
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
                    }
                } 
            }
            return value;

        },

        gotProperty: function (nodeID, propertyName, propertyValue) {

            var value = undefined;
            var obj, earth, ge;
            var cameraNode, lookAtNode;
            for(var node in this.state.nodes) {
                if(this.state.nodes[node].name == "camera") {
                    cameraNode = this.state.nodes[node];
                }
                else if(this.state.nodes[node].name == "lookAt") {
                    lookAtNode = this.state.nodes[node];
                }
            }
            if((cameraNode && cameraNode.ID == nodeID) || (lookAtNode && lookAtNode.ID == nodeID)) {
                earth = this.state.nodes[ this.kernel.find("", "//earth")[0] ];
                if ( earth && earth.earthInst ) {
                    ge = earth.earthInst;
                    if ( lookAtNode && lookAtNode.ID == nodeID ) {
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

    function disableMouseControl() {
        if ( myOptions != undefined ) {
          myOptions.setMouseNavigationEnabled(false);
        }
    }
    function enableMouseControl() {
        if ( myOptions != undefined ) {
          myOptions.setMouseNavigationEnabled(true);
        }  
    }
    function broadcastCameraData() {
        var node, ge;   
        if ( this.kernel.find("", "//earth").length > 0 ) {
            node = this.state.nodes[ this.kernel.find("", "//earth")[0] ];
            ge = node.earthInst;
            if ( ge ) {
                var la = ge.getView().copyAsLookAt( ge.ALTITUDE_RELATIVE_TO_GROUND );
                var cameraData = [ la.getLongitude(), la.getLatitude(), la.getAltitude(),
                                    la.getAltitudeMode(), la.getHeading(), la.getTilt(), la.getRange()  ];                          

                this.kernel.setProperty( this.kernel.find("", "//lookAt")[0], "cameraData", cameraData );
            }
        }
    }

} );