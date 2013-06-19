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
            this.parentClass = options.parentClass !== undefined ? options.parentClass : 'cesium-main-div';
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
            var protos = getPrototypes.call( this, childExtendsID  )
            var node = undefined;

            if ( isCesiumDefinition.call( this, protos ) ) {

                var cesiumCont = "<div class='cesuim-container' id='"+this.containerDiv+"'></div>";
                //debugger;
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

                if ( this.state.scenes[ childID ] === undefined ) {
                    this.state.scenes[ childID ] = node = createNode();
                } else {
                    node = this.state.scenes[ childID ];    
                }

                var view = this;
                var forceResizeDelay;
                var scene, canvas;
                var cesiumOptions = { "contextOptions": { "alpha": true }, }; 

                if ( this.useCesiumWidget ) {
                    node.widget = new Cesium.CesiumWidget( this.containerDiv, cesiumOptions );
                    scene = node.widget.scene;

                    if ( scene.sun !== undefined ) {
                        scene.sun.destroy();
                        scene.sun = undefined;
                    }
                    if ( scene.skyBox !== undefined ) {
                        scene.skyBox.destroy();
                        scene.skyBox = undefined;
                    }
                    if ( scene.skyAtmosphere !== undefined ) {
                        scene.skyAtmosphere.destroy();
                        scene.skyAtmosphere = undefined;
                    }
                    forceResizeDelay = 80;

                } else {

                    // the manual creation, has an error with the 
                    // camera syncronization
                    canvas = document.createElement( 'canvas' );
                    canvas.className = 'fullSize';
                    document.getElementById( this.containerDiv ).appendChild( canvas );

                    canvas.setAttribute( 'height', this.height );
                    canvas.setAttribute( 'width', this.width );

                    scene = new Cesium.Scene( canvas, cesiumOptions.contextOptions );

                    var bing = new Cesium.BingMapsImageryProvider({
                        url : 'http://dev.virtualearth.net',
                        mapStyle : Cesium.BingMapsStyle.AERIAL,
                        // Some versions of Safari support WebGL, but don't correctly implement
                        // cross-origin image loading, so we need to load Bing imagery using a proxy.
                        proxy : Cesium.FeatureDetection.supportsCrossOriginImagery() ? undefined : new Cesium.DefaultProxy('/proxy/')
                    });                    

                    var primitives = scene.getPrimitives();

                    var ellipsoid = Cesium.Ellipsoid.WGS84;
                    node.centralBody = new Cesium.CentralBody( ellipsoid );

                    node.centralBody.getImageryLayers().addImageryProvider( bing );

                    primitives.setCentralBody( node.centralBody );

                    node.transitioner = new Cesium.SceneTransitioner( scene, ellipsoid );
                }

                node.scene = scene;
                node.imageryProvider = 'bingAerial';
                node.canvas = scene.getCanvas();
                
                var camera = scene.getCamera();
                this.state.cameraInfo = { 
                    "direction": camera.direction.clone(),
                    "position": camera.position.clone(),
                    "up": camera.up.clone(),
                    "right": camera.right.clone(),
                    "diff": function( cam ) {
                        return ( 
                            ( !Cesium.Cartesian3.equals( this.direction, cam.direction ) ) ||  
                            ( !Cesium.Cartesian3.equals( this.position, cam.position ) ) ||
                            ( !Cesium.Cartesian3.equals( this.up, cam.up ) ) ||
                            ( !Cesium.Cartesian3.equals( this.right, cam.right ) ) 
                        );
                    },
                    "getCurrent": function( cam ) {
                        this.direction = camera.direction.clone();
                        this.position = camera.position.clone();
                        this.up = camera.up.clone();
                        this.right = camera.right.clone();                        
                    }
                };

                ( function tick() {

                    if ( view.state.cameraInfo.diff( camera ) ){
                       broadcastCameraViewData.call( view, {
                           "direction": camera.direction,
                           "position": camera.position,
                           "up": camera.up,
                           "right": camera.right
                        });                        
                    }

                    if ( forceResizeDelay ) {
                        forceResizeDelay--;
                        if ( forceResizeDelay == 0 ) {
                            console.info( " ||||| == resize ==  ||||| " );
                            node.widget.resize();
                            forceResizeDelay = undefined;
                        }
                    }

                    scene.initializeFrame();
                    scene.render();
                    Cesium.requestAnimationFrame( tick );

                    view.state.cameraInfo.getCurrent( camera );
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

        //satProperty: function( nodeID, propertyName, propertyValue ) {
        //},

        //gotProperty: function( nodeID, propertyName, propertyValue ) {
        //}
            
    } );
 
    function getPrototypes( extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = this.kernel.prototype( id );
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
        var nodeID, scene;   
        if ( this.kernel.find( "", "//" ).length > 0 ) {
            nodeID = this.kernel.find( "", "//" )[ 0 ];
            this.kernel.setProperty( nodeID, "cameraViewData", cameraData );
        }
    }
    
} );