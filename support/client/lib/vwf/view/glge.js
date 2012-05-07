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

        initialize: function( rootSelector ) {
            if (!vwf) return;

            this.rootSelector = rootSelector;
            this.canvasQuery = undefined;
 
            this.keyStates = { keysDown: {}, mods: {} };

            this.height = 600;
            this.width = 800;

            if ( window && window.innerHeight ) this.height = window.innerHeight - 20;
            if ( window && window.innerWidth ) this.width = window.innerWidth - 20;

            this.canvasQuery = jQuery( this.rootSelector );
          
            // Connect GLGE to the VWF timeline.
            GLGE.now = function() {
                return vwf.time() * 1000;
            }
        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childName, callback /* ( ready ) */) {

            if (childExtendsID === undefined /* || childName === undefined */)
                return;

            if (this.state.scenes[childID]) {

                // this is the scene definition so go ahead and create the canvas and setup the view
                var glgeView = this;
                var domWin = window;

                this.canvasQuery = jQuery(this.rootSelector).append(
                    "<canvas id='" + this.state.sceneRootID + "' class='vwf-scene' width='" + this.width + "' height='" + this.height + "'/>"
                ).children(":last");

                var canvas = this.canvasQuery.get(0);
                window.onkeydown = function (event) {
                    var key = undefined;
                    var validKey = false;
                    switch (event.keyCode) {
                        case 17:
                        case 16:
                        case 18:
                        case 19:
                        case 20:
                            break;
                        default:
                            key = getKeyValue.call( glgeView, event.keyCode);
                            glgeView.keyStates.keysDown[key.key] = key;
                            validKey = true;
                            break;
                    }

                    if (!glgeView.keyStates.mods) glgeView.keyStates.mods = {};
                    glgeView.keyStates.mods.alt = event.altKey;
                    glgeView.keyStates.mods.shift = event.shiftKey;
                    glgeView.keyStates.mods.ctrl = event.ctrlKey;
                    glgeView.keyStates.mods.meta = event.metaKey;

                    var sceneNode = glgeView.state.scenes[glgeView.state.sceneRootID];
                    if (validKey && sceneNode /*&& Object.keys( glgeView.keyStates.keysDown ).length > 0*/) {
                        //var params = JSON.stringify( glgeView.keyStates );
                        glgeView.kernel.dispatchEvent(sceneNode.ID, "keyDown", [glgeView.keyStates]);
                    }
                };

                window.onkeyup = function (event) {
                    var key = undefined;
                    var validKey = false;
                    switch (event.keyCode) {
                        case 16:
                        case 17:
                        case 18:
                        case 19:
                        case 20:
                            break;
                        default:
                            key = getKeyValue.call( glgeView, event.keyCode);
                            delete glgeView.keyStates.keysDown[key.key];
                            validKey = true;
                            break;
                    }

                    glgeView.keyStates.mods.alt = event.altKey;
                    glgeView.keyStates.mods.shift = event.shiftKey;
                    glgeView.keyStates.mods.ctrl = event.ctrlKey;
                    glgeView.keyStates.mods.meta = event.metaKey;

                    var sceneNode = glgeView.state.scenes[glgeView.state.sceneRootID];
                    if (validKey && sceneNode) {
                        //var params = JSON.stringify( glgeView.keyStates );
                        glgeView.kernel.dispatchEvent(sceneNode.ID, "keyUp", [glgeView.keyStates]);
                    }

                };

                window.onresize = function () {
                    var origWidth = glgeView.width;
                    var origHeight = glgeView.height;
                    if (domWin && domWin.innerHeight) glgeView.height = domWin.innerHeight - 20;
                    if (domWin && domWin.innerWidth) glgeView.width = domWin.innerWidth - 20;

                    if ((origWidth != glgeView.width) || (origHeight != glgeView.height)) {
                        canvas.height = glgeView.height;
                        canvas.width = glgeView.width;
                        var camID = glgeView.state.cameraInUseID
                        if (!camID && camID != "") {
                            var cam = glgeView.state.cameraInUse;
                            camID = getObjectID.call( glgeView, cam, false, false);
                        }
                        if (camID && camID != "") {
                            vwf.setProperty(camID, "aspect", (glgeView.width / glgeView.height) /*/ 1.333*/);  // TODO: a view shouldn't go directly to the kernel (using "vwf"), and the aspect ratio and size are window-dependent and shouldn't be shared properties in the application
                        }
                        vwf.setProperty(glgeView.state.sceneRootID, "size", [glgeView.width, glgeView.height]);  // TODO: a view shouldn't go directly to the kernel (using "vwf"), and the aspect ratio and size are window-dependent and shouldn't be shared properties in the application
                        $('#topdown_a').height(canvas.height);
                        $('#topdown_b').height(canvas.height);
                        $('#client_list').height(canvas.height);
                        $('#time_control').height(canvas.height);
                        $('#about_tab').height(canvas.height);
                    }
                }

                var sceneNode = this.state.scenes[childID];
                if (sceneNode) {
                    initScene.call(this, sceneNode);
                }
            }
        },
 
 
        // -- deletedNode ------------------------------------------------------------------------------

        //deletedNode: function( nodeID ) { },

        // -- addedChild -------------------------------------------------------------------------------

        //addedChild: function( nodeID, childID, childName ) { },

        // -- removedChild -----------------------------------------------------------------------------

        //removedChild: function( nodeID, childID ) { },

        // -- createdProperty --------------------------------------------------------------------------

        //createdProperty: function (nodeID, propertyName, propertyValue) { },

        // -- initializedProperty ----------------------------------------------------------------------

        //initializedProperty: function (nodeID, propertyName, propertyValue) { },

        // TODO: deletedProperty

        // -- satProperty ------------------------------------------------------------------------------

        //satProperty: function (nodeID, propertyName, propertyValue) { },

        // -- gotProperty ------------------------------------------------------------------------------

        //gotProperty: function ( nodeID, propertyName, propertyValue ) { },
    
    
    } );

    // GLGE private functions
    // -- initScene ------------------------------------------------------------------------
	var lastPick;
    function initScene( sceneNode ) {
	
		var requestAnimFrame, cancelAnimFrame;
		(function() {
			var lastTime = 0;
			var vendors = ['ms', 'moz', 'webkit', 'o'];
			for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
				window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
				window.cancelRequestAnimationFrame = window[vendors[x]+
				  'CancelRequestAnimationFrame'];
			}

			if (!window.requestAnimationFrame) {
				requestAnimFrame = function(callback, element) {
					var currTime = +new Date;
					var timeToCall = Math.max(0, 16 - (currTime - lastTime));
					var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
					  timeToCall);
					lastTime = currTime + timeToCall;
					return id;
				};
			}
			else {
				requestAnimFrame = window.requestAnimationFrame;
			}

			if (!window.cancelAnimationFrame) {
				cancelAnimFrame = function(id) {
					clearTimeout(id);
				};
			}
			else {
				cancelAnimFrame = window.cancelAnimationFrame;
			}
		}());

		var lastPickTime = 0;
        function renderScene(time) {
			requestAnimFrame( renderScene );
            sceneNode.frameCount++;
			if((mouse.getMousePosition().x != oldMouseX || mouse.getMousePosition().y != oldMouseY) && ((time - lastPickTime) > 100)) {
				lastPick = mousePick.call( this, mouse, sceneNode );
				oldMouseX = mouse.getMousePosition().x;
				oldMouseY = mouse.getMousePosition().y;
				lastPickTime = time;
			}
            renderer.render();
        };

        var canvas = this.canvasQuery.get( 0 );

        if ( canvas ) {
			var mouse = new GLGE.MouseInput( canvas );
			var oldMouseX = mouse.getMousePosition().x;
			var oldMouseY = mouse.getMousePosition().y;
            sceneNode.glgeRenderer = new GLGE.Renderer( canvas );
            sceneNode.glgeRenderer.setScene( sceneNode.glgeScene );

            sceneNode.glgeScene.setAmbientColor( [ 183, 183, 183 ] );

            this.state.cameraInUse = sceneNode.glgeScene.camera;
            this.state.cameraInUse.setAspect( ( canvas.width / canvas.height) /*/ 1.333 */ );

            // set up all of the mouse event handlers
            initMouseEvents.call( this, canvas );

            // Schedule the renderer.

            var view = this;
            var scene = sceneNode.glgeScene;
            var renderer = sceneNode.glgeRenderer;

            sceneNode.frameCount = 0; // needed for estimating when we're pick-safe

            renderScene((+new Date));
        }
    } 

    // -- initCamera ------------------------------------------------------------------------

    function initCamera( glgeCamera ) {
        if ( glgeCamera ) {
            glgeCamera.setLoc( 0, 0, 0 );
            glgeCamera.setRot( 0, 0, 0 );
            glgeCamera.setType( GLGE.C_PERSPECTIVE );
            glgeCamera.setRotOrder( GLGE.ROT_XZY );
        }        
    }

    // -- initMouseEvents ------------------------------------------------------------------------

    function initMouseEvents( canvas ) {
        var sceneNode = this.state.scenes[this.state.sceneRootID], child;
        var sceneID = this.state.sceneRootID;
        var sceneView = this;

        var pointerDownID = undefined;
        var pointerOverID = undefined;
        var pointerPickID = undefined;
        var glgeActualObj = undefined;

        var lastXPos = -1;
        var lastYPos = -1;
        var mouseRightDown = false;
        var mouseLeftDown = false;
        var mouseMiddleDown = false;
        var win = window;

        var container = document.getElementById("container");
        var sceneCanvas = canvas;
        var mouse = new GLGE.MouseInput( sceneCanvas );
        var mouseOverCanvas = false;

        var getEventData = function( e, debug ) {
            var returnData = { eventData: undefined, eventNodeData: undefined };
            var pickInfo = lastPick;
            pointerPickID = undefined;

            glgeActualObj = pickInfo ? pickInfo.object : undefined;
            pointerPickID = pickInfo ? getPickObjectID.call( sceneView, pickInfo, debug ) : undefined;
            var mouseButton = "left";
            switch( e.button ) {
                case 2: 
                    mouseButton = "right";
                    break;
                case 1: 
                    mouseButton = "middle";
                    break;
                default:
                    mouseButton = "left";
                    break;
            };

            returnData.eventData = [ {
                /*client: "123456789ABCDEFG", */
                button: mouseButton,
                clicks: 1,
                buttons: {
                        left: mouseLeftDown,
                        middle: mouseMiddleDown,
                        right: mouseRightDown,
                    },
                modifiers: {
                        alt: e.altKey,
                        ctrl: e.ctrlKey,
                        shift: e.shiftKey,
                        meta: e.metaKey,
                    },
                position: [ mouseXPos.call( this,e)/sceneView.width, mouseYPos.call( this,e)/sceneView.height ],
            } ];



            var camera = sceneView.state.cameraInUse;
            var worldCamPos, worldCamTrans, camInverse;
            if ( camera ) { 
                worldCamPos = [ camera.getLocX(), camera.getLocY(), camera.getLocZ() ]; 
//                worldCamTrans = goog.vec.Mat4.createFromArray( camera.getLocalMatrix() );
//                goog.vec.Mat4.transpose( worldCamTrans, worldCamTrans );
//                camInverse = goog.vec.Mat4.create();
//                goog.vec.Mat4.invert( worldCamTrans, camInverse );
            }

            returnData.eventNodeData = { "": [ {
                distance: pickInfo ? pickInfo.distance : undefined,
                globalPosition: pickInfo ? pickInfo.coord : undefined,
                globalNormal: pickInfo ? pickInfo.normal : undefined,
                globalSource: worldCamPos,            
            } ] };

            if ( pickInfo && pickInfo.normal ) {
                var pin = pickInfo.normal;  
                var nml = goog.vec.Vec3.createFloat32FromValues( pin[0], pin[1], pin[2] );
                nml = goog.vec.Vec3.normalize( nml, goog.vec.Vec3.create() );
                returnData.eventNodeData[""][0].globalNormal = [ nml[0], nml[1], nml[2] ];
            }

            if ( sceneView && sceneView.state.nodes[ pointerPickID ] ) {
                var camera = sceneView.state.cameraInUse;
                var childID = pointerPickID;
                var child = sceneView.state.nodes[ childID ];
                var parentID = child.parentID;
                var parent = sceneView.state.nodes[ child.parentID ];
                var trans, parentTrans, localTrans, localNormal, parentInverse, relativeCamPos;
                while ( child ) {

                    trans = goog.vec.Mat4.createFromArray( child.glgeObject.getLocalMatrix() );
                    goog.vec.Mat4.transpose( trans, trans );                   
                    
                    if ( parent ) {                   
                        parentTrans = goog.vec.Mat4.createFromArray( parent.glgeObject.getLocalMatrix() );
                        goog.vec.Mat4.transpose( parentTrans, parentTrans ); 
                    } else {
                        parentTrans = undefined;
                    }

                    if ( trans && parentTrans ) {
                        // get the parent inverse, and multiply by the world
                        // transform to get the local transform 
                        parentInverse = goog.vec.Mat4.create();
                        if ( goog.vec.Mat4.invert( parentTrans, parentInverse ) ) {
                            localTrans = goog.vec.Mat4.multMat( parentInverse, trans,
                                goog.vec.Mat4.create()                       
                            );
                        }
                    }

                    // transform the global normal into local
                    if ( pickInfo && pickInfo.normal ) {
                        localNormal = goog.vec.Mat4.multVec3Projective( trans, pickInfo.normal, 
                            goog.vec.Vec3.create() );
                    } else {
                        localNormal = undefined;  
                    }

                    if ( worldCamPos ) { 
                        relativeCamPos = goog.vec.Mat4.multVec3Projective( trans, worldCamPos, 
                            goog.vec.Vec3.create() );                         
                    } else { 
                        relativeCamPos = undefined;
                    }
                                        
                    returnData.eventNodeData[ childID ] = [ {
                        position: localTrans,
                        normal: localNormal,
                        source: relativeCamPos,
                        distance: pickInfo ? pickInfo.distance : undefined,
                        globalPosition: pickInfo ? pickInfo.coord : undefined,
                        globalNormal: pickInfo ? pickInfo.normal : undefined,
                        globalSource: worldCamPos,            
                    } ];

                    childID = parentID;
                    child = sceneView.state.nodes[ childID ];
                    parentID = child ? child.parentID : undefined;
                    parent = parentID ? sceneView.state.nodes[ child.parentID ] : undefined;

                }
            }
            return returnData;
        }          

        canvas.onmousedown = function( e ) {
           switch( e.button ) {
                case 2: 
                    mouseRightDown = true;
                    break;
                case 1: 
                    mouseMiddleDown = true;
                    break;
                case 0:
                    mouseLeftDown = true;
                    break;
            };
            var event = getEventData( e, false );
            if ( event ) {
                pointerDownID = pointerPickID ? pointerPickID : sceneID;
                sceneView.kernel.dispatchEvent( pointerDownID, "pointerDown", event.eventData, event.eventNodeData );
            }
        }

        canvas.onmouseup = function( e ) {
            var ctrlDown = e.ctrlKey;
            var atlDown = e.altKey;
            var ctrlAndAltDown = ctrlDown && atlDown;

            switch( e.button ) {
                case 2: 
                    mouseRightDown = false;
                    break;
                case 1: 
                    mouseMiddleDown = false;
                    break;
                case 0:
                    mouseLeftDown = false;
                    break;
            };

            var eData = getEventData( e, ctrlAndAltDown );
            if ( eData ) {
                var mouseUpObjectID = pointerPickID;
                if ( mouseUpObjectID && pointerDownID && mouseUpObjectID == pointerDownID ) {
                    sceneView.kernel.dispatchEvent( mouseUpObjectID, "pointerClick", eData.eventData, eData.eventNodeData );

                    var glgeObj = sceneView.state.nodes[mouseUpObjectID].glgeObject;
                    if ( glgeObj ) {
                        if( ctrlDown && !atlDown ) {
                            if ( sceneView.state.nodes[mouseUpObjectID] ) {
                                var colladaObj;
                                var currentObj = glgeObj;
                                while ( !colladaObj && currentObj ) {
                                    if ( currentObj.constructor == GLGE.Collada )
                                        colladaObj = currentObj;
                                    else
                                        currentObj = currentObj.parent;
                                } 
                                if ( colladaObj ) {
                                    recurseGroup.call( sceneView, colladaObj, 0 );
                                }
                            }                
                        } else if ( atlDown && !ctrlDown ) {
                            recurseGroup.call( sceneView, glgeObj, 0 ); 
                        }
                    }
                }

                sceneView.kernel.dispatchEvent( pointerDownID, "pointerUp", eData.eventData, eData.eventNodeData );
            }
            pointerDownID = undefined;
        }

        canvas.onmouseover = function( e ) {
            mouseOverCanvas = true;
            var eData = getEventData( e, false );
            if ( eData ) {
                pointerOverID = pointerPickID ? pointerPickID : sceneID;
                sceneView.kernel.dispatchEvent( pointerOverID, "pointerEnter", eData.eventData, eData.eventNodeData );
            }
        }

        canvas.onmousemove = function( e ) {
            var eData = getEventData( e, false );
            if ( eData ) {
                if ( mouseLeftDown || mouseRightDown || mouseMiddleDown ) {
                    sceneView.kernel.dispatchEvent( pointerDownID, "pointerMove", eData.eventData, eData.eventNodeData );
                } else {
                    if ( pointerPickID ) {
                        if ( pointerOverID ) {
                            if ( pointerPickID != pointerOverID ) {
                                sceneView.kernel.dispatchEvent( pointerOverID, "pointerLeave", eData.eventData, eData.eventNodeData );
                                pointerOverID = pointerPickID;
                                sceneView.kernel.dispatchEvent( pointerOverID, "pointerEnter", eData.eventData, eData.eventNodeData );
                            } else {
                                sceneView.kernel.dispatchEvent( pointerOverID, "pointerHover", eData.eventData, eData.eventNodeData );
                            }
                        } else {
                            pointerOverID = pointerPickID;
                            sceneView.kernel.dispatchEvent( pointerOverID, "pointerEnter", eData.eventData, eData.eventNodeData );
                        }
                    } else {
                        if ( pointerOverID ) {
                            sceneView.kernel.dispatchEvent( pointerOverID, "pointerLeave", eData.eventData, eData.eventNodeData );
                            pointerOverID = undefined;
                        }
                    }
                }
            }
        }

        canvas.onmouseout = function( e ) {
            if ( pointerOverID ) {
                sceneView.kernel.dispatchEvent( pointerOverID, "pointerLeave" );
                pointerOverID = undefined;
            }
            mouseOverCanvas = false;
        }

        canvas.onmousewheel = function( e ) {
            var eData = getEventData( e, false );
            if ( eData ) {
                eData.eventNodeData[""][0].wheel = {
                    delta: e.wheelDelta,
                    deltaX: e.wheelDeltaX,
                    deltaY: e.wheelDeltaY,
                };
                var id = sceneID;
                if ( pointerDownID && mouseRightDown || mouseLeftDown || mouseMiddleDown )
                    id = pointerDownID;
                else if ( pointerOverID )
                    id = pointerOverID; 
                    
                sceneView.kernel.dispatchEvent( id, "pointerWheel", eData.eventData, eData.eventNodeData );
            }
        }

        // == Draggable Content ========================================================================

//        canvas.addEventListener( "dragenter", function( e ) {
//            e.stopPropagation();
//            e.preventDefault();             
//        }, false );
//        canvas.addEventListener( "dragexit", function( e ) {
//            e.stopPropagation();
//            e.preventDefault();             
//        }, false );

        // -- dragOver ---------------------------------------------------------------------------------

        canvas.ondragover = function( e ) {
            var eData = getEventData( e, false );
            if ( eData ) {
                e.dataTransfer.dropEffect = "copy";
            }
            e.preventDefault();    
        };

        // -- drop ---------------------------------------------------------------------------------

        canvas.ondrop = function( e ) {
            var eData = getEventData( e, false );
            if ( eData ) {
            
                var object, match, fn;
                var files = e.dataTransfer.files;
                var file = files[0];
                var ext = (/[.]/.exec(file.name)) ? /[^.]+$/.exec(file.name) : undefined;

                switch ( ext[0].toLowerCase() ) {
                    case "dae":
                        object = {
                          extends: "http://vwf.example.com/node3.vwf",
                          source: file.name,
                          type: "model/vnd.collada+xml",
                          properties: { 
                            translation: eData.eventNodeData[""][0].globalPosition,
                          },   
                        };

                        switch ( file.name ) { // hack it since setting this data through components isn't working

                            case "blackhawk.dae": // from cityblock
                                object.properties.rotation = [ 1, 0, 0, 0 ];
                                object.properties.scale = [ 0.2, 0.2, 0.2 ];
                                break;

                            case "blackhawkGW.dae": // from sandtable
                                object.properties.translation[2] += 20;
                                object.properties.rotation = [ 1, 0, 0, 0 ];
                                object.properties.scale = [ 2, 2, 2 ];
                                break;

                            case "Predator.dae": // from sandtable
                                object["implements"] = [ "http://vwf.example.com/fly.vwf" ];
                                object.properties.translation[2] += 20;
                                object.properties.rotation = [ 0, 0, 1, 180 ];
                                object.properties.scale = [ 15, 15, 15 ];
                                break;

                            case "apache.DAE": // from sandtable
                                object.properties.translation[2] += 40;
                                object.properties.rotation = [ 1, 0, 0, 90 ];
                                object.properties.scale = [ 0.2, 0.2, 0.2 ];
                                break;

                            case "awac.DAE": // from sandtable
                                object.properties.translation[2] += 100;
                                object.properties.rotation = [ 1, 0, 0, 90  ];
                                object.properties.scale = [ 0.5, 0.5, 0.5 ];
                                break;

                            case "blackhawk.DAE": // from sandtable
                                object.properties.rotation = [ 1, 0, 0, 90 ];
                                object.properties.scale = [ 0.2, 0.2, 0.2 ];
                                break;

                            case "cobra.DAE": // from sandtable
                                object.properties.translation[2] += 50;
                                object.properties.rotation = [ 1, 0, 0, 90 ];
                                object.properties.scale = [ 0.2, 0.2, 0.2 ];
                                break;

                            case "f117.DAE": // from sandtable
                                object.properties.translation[2] += 40;
                                object.properties.rotation = [ 1, 0, 0, 90 ];
                                object.properties.scale = [ 0.2, 0.2, 0.2 ];
                                break;

                            case "humvee.dae": // from sandtable
                                object.properties.translation[2] += 50;
                                object.properties.rotation = [ 1, 0, 0, 90 ];
                                object.properties.scale = [ 0.2, 0.2, 0.2 ];
                                break;

                            case "lmtv.dae": // from sandtable
                                object.properties.translation[2] += 50;
                                object.properties.rotation = [ 1, 0, 0, 90 ];
                                object.properties.scale = [ 0.2, 0.2, 0.2 ];
                                break;

                            case "mlrs.DAE": // from sandtable
                                object.properties.translation[2] += 50;
                                object.properties.rotation = [ 1, 0, 0, 90 ];
                                object.properties.scale = [ 0.2, 0.2, 0.2 ];
                                break;

                            default:

                                if ( match = file.name.match( /(.*\.vwf)\.(json|yaml)$/i ) ) {  // assignment is intentional

                                    object = {
                                      extends: match[1],
                                      properties: { 
                                        translation: eData.eventNodeData[""][0].globalPosition,
                                      },
                                      scripts: [
                                          "this.initialize = function() { this.rotation = this.rotation ; this.scale = this.scale }"
                                      ]
                                    };

                                } else if ( match = file.name.match( /\.dae$/i ) ) { // assignment is intentional

                                    object.properties.scale = [ 1, 1, 1 ];

                                } else {

                                     object = undefined;
                                }

                                break;

                        }
                        if ( object ) {
                            sceneView.kernel.createNode( "index-vwf", object, file.name, undefined );
                        }
                        break;
                    case "yaml":
                        fn = file.name.substr( 0, file.name.length - 5 );
                        sceneView.kernel.createNode( "index-vwf", fn, fn, undefined );                
                        break;
                }
                

            }

            e.preventDefault();            
        };
         
    };

    function nameGlge(obj) {
        return obj.colladaName || obj.colladaId || obj.name || obj.id || obj.uid || "";
    }

    function name(obj) {
        return obj.colladaName || obj.colladaId || obj.name || obj.id || "";
    }

    function path(obj) {
        var sOut = "";
        var sName = "";

        while (obj && obj.parent) {
            if (sOut == "")
                sOut = name.call(this,obj);
            else
                sOut = name.call(this,obj) + "." + sOut;
            obj = obj.parent;
        }
        return sOut;
    }

    function mouseXPos(e) {
        return e.clientX - e.currentTarget.offsetLeft + window.scrollX + window.slideOffset;
    }

    function mouseYPos(e) {
        return e.clientY - e.currentTarget.offsetTop + window.scrollY;
    }

    function getPickObjectID( pickInfo, debug ) {

        if ( pickInfo && pickInfo.object ) {
            return getObjectID.call( this, pickInfo.object, true, debug );
        }
        return undefined;

    }

    function getObjectID( objectToLookFor, bubbleUp, debug ) {

        var objectIDFound = -1;
            
        while (objectIDFound == -1 && objectToLookFor) {
            if ( debug ) {
                this.logger.info("====>>>  vwf.view-glge.mousePick: searching for: " + path.call(this,objectToLookFor) );
            }
            jQuery.each( this.state.nodes, function (nodeID, node) {
                if ( node.glgeObject == objectToLookFor && !node.glgeMaterial ) {
                    if ( debug ) { this.logger.info("pick object name: " + name(objectToLookFor) + " with id = " + nodeID ); }
                    objectIDFound = nodeID;
                }
            });
            if ( bubbleUp ) {
                objectToLookFor = objectToLookFor.parent;
            } else {
                objectToLookFor = undefined;
            }
        }
        if (objectIDFound != -1)
            return objectIDFound;

        return undefined;
    }

    function mousePick( mouse, sceneNode ) {

        if (sceneNode && sceneNode.glgeScene) {

            // GLGE won't calculate picks if we pick too soon after launch. The exact cause is
            // unclear, but it appears to work if there isn't a pick before the first few frames
            // or while deferred loads are occurring.

            if ( sceneNode.frameCount > 10 && sceneNode.pendingLoads == 0 ) {

                var objectIDFound = -1;
                var mousepos=mouse.getMousePosition();
                mousepos.x = mousepos.x + window.scrollX + window.slideOffset;
                mousepos.y = mousepos.y + window.scrollY;

                return sceneNode.glgeScene.pick(mousepos.x, mousepos.y);
            }
        }
        return undefined;
    }

    function recurseGroup( grp, iDepth ) {
        if ( grp && grp.getChildren ) {
            var grpChildren = grp.getChildren();
            var sOut = indent.call( this,iDepth);
            var name = "";

            for (var i = 0; i < grpChildren.length; i++) {
                if (grpChildren[i].constructor == GLGE.Collada) {
                    iDepth++;
                    outputCollada.call( this, grpChildren[i], iDepth, true);
                    recurseGroup.call( this, grpChildren[i], iDepth + 1);
                    outputCollada.call( this, grpChildren[i], iDepth, false);
                    iDepth--;
                } else if (grpChildren[i].constructor == GLGE.Group) {
                    iDepth++;
                    outputGroup.call( this, grpChildren[i], iDepth, true);
                    recurseGroup.call( this, grpChildren[i], iDepth + 1);
                    outputGroup.call( this, grpChildren[i], iDepth, false);
                    iDepth--;
                } else if ( grpChildren[i].constructor == GLGE.Object ) {
                    outputObject.call( this, grpChildren[i], iDepth);
                }
            }
        } else if ( grp.constructor == GLGE.Object ) {
            outputObject.call( this, grp, iDepth );
        }
    }

    function getChildCount(grp) {
        var iCount = 0;
        if (grp) {
            var grpChildren = grp.getChildren();
            if (grpChildren) {
                for (var i = 0; i < grpChildren.length; i++) {
                    if (grpChildren[i].constructor != GLGE.Object) {
                        iCount++;
                    }
                }
            }
        }
        return iCount;
    };

    function indentStr() {
        return "  ";
    }

    function indent(iIndent) {
        var sOut = "";
        for (var j = 0; j < iIndent; j++) { sOut = sOut + indentStr.call( this ); }
        return sOut;
    }

    function outputCollada(collada, iIndent, open) {
        var sOut = indent.call(this,iIndent);
        if (open) {
            this.logger.info(sOut + "children:")
        }
    }

    function outputGroup( group, iIndent, open ) {
        var sOut = indent.call( this, iIndent + 1);
        if (open) {
            var lastGroupName = name(group);
            this.logger.info(indent.call( this,iIndent) + lastGroupName + ":");
            this.logger.info(indent.call( this,iIndent + 1) + "extends: http://vwf.example.com/node3.vwf");

            if (getChildCount.call( this, group) > 0)
                this.logger.info(sOut + "children:");
        }
    }

    function outputObject(obj, iIndent) {
        var indentAdd = 0;
        var objName = name( obj );
        if ( objName != "" ) {
            this.logger.info( indent.call( this,iIndent) + "children:" );
            this.logger.info( indent.call( this,iIndent+1) + objName + ":");
            this.logger.info( indent.call( this,iIndent+2) + "extends: http://vwf.example.com/object3.vwf");
            indentAdd = 2;
        }
    }

    function outputMaterial( obj, iIndent, objName, index  ) {

        var sOut = indent.call( this,iIndent + 1);
        this.logger.info( indent.call( this,iIndent) + objName + "Material" + index + ":" );
        this.logger.info( sOut + "extends: http://vwf.example.com/material.vwf");

    }

    function getKeyValue( keyCode ) {
        var key = { key: undefined, code: keyCode, char: undefined };
        switch ( keyCode ) {
            case 8:
                key.key = "backspace";
                break;
            case 9:
                key.key = "tab";
                break;
            case 13:
                key.key = "enter";
                break;
            case 16:
                key.key = "shift";
                break;
            case 17:
                key.key = "ctrl";
                break;
            case 18:
                key = "alt";
                break;
            case 19:
                key.key = "pausebreak";
                break;
            case 20:
                key.key = "capslock";
                break;
            case 27:
                key.key = "escape";
                break;
            case 33:
                key.key = "pageup";
                break;
            case 34:
                key.key = "pagedown";
                break;
            case 35:
                key.key = "end";
                break;
            case 36:
                key.key = "home";
                break;
            case 37:
                key.key = "leftarrow";
                break;
            case 38:
                key.key = "uparrow";
                break;
            case 39:
                key.key = "rightarrow";
                break;
            case 40:
                key.key = "downarrow";
                break;
            case 45:
                key.key = "insert";
                break;
            case 46:
                key.key = "delete";
                break;
            case 48:
                key.key = "0";
                key.char = "0";
                break;
            case 49:
                key.key = "1";
                key.char = "1";
                break;
            case 50:
                key.key = "2";
                key.char = "2";
                break;
            case 51:
                key.key = "3";
                key.char = "3";
                break;
            case 52:
                key.key = "4";
                key.char = "4";
                break;
            case 53:
                key.key = "5";
                key.char = "5";
                break;
            case 54:
                key.key = "6";
                key.char = "6";
                break;
            case 55:
                key.key = "7";
                key.char = "7";
                break;                
            case 56:
                key.key = "8";
                key.char = "8";
                break;
            case 57:
                key.key = "9";
                key.char = "9";
                break;  
            case 65:
                key.key = "A";
                key.char = "A";
                break;
            case 66:
                key.key = "B";
                key.char = "B";
                break;
            case 67:
                key.key = "C";
                key.char = "C";
                break;
            case 68:
                key.key = "D";
                key.char = "D";
                break;
            case 69:
                key.key = "E";
                key.char = "E";
                break;
            case 70:
                key.key = "F";
                key.char = "F";
                break;
            case 71:
                key.key = "G";
                key.char = "G";
                break;
            case 72:
                key.key = "H";
                key.char = "H";
                break;
            case 73:
                key.key = "I";
                key.char = "I";
                break;                
            case 74:
                key.key = "J";
                key.char = "J";
                break;
            case 75:
                key.key = "K";
                key.char = "K";
                break;                 
            case 76:
                key.key = "L";
                key.char = "L";
                break;
            case 77:
                key.key = "M";
                key.char = "M";
                break;
            case 78:
                key.key = "N";
                key.char = "N";
                break;
            case 79:
                key.key = "O";
                key.char = "O";
                break;
            case 80:
                key.key = "P";
                key.char = "P";
                break;
            case 81:
                key.key = "Q";
                key.char = "Q";
                break;
            case 82:
                key.key = "R";
                key.char = "R";
                break;
            case 83:
                key.key = "S";
                key.char = "S";
                break;                
            case 84:
                key.key = "T";
                key.char = "T";
                break;
            case 85:
                key.key = "U";
                key.char = "U";
                break;                  
            case 86:
                key.key = "V";
                key.char = "V";
                break;
            case 87:
                key.key = "W";
                key.char = "W";
                break;
            case 88:
                key.key = "X";
                key.char = "X";
                break;                
            case 89:
                key.key = "Y";
                key.char = "Y";
                break;
            case 90:
                key.key = "Z";
                key.char = "Z";
                break; 
            case 91:
                key.key = "leftwindow";
                break;
            case 92:
                key.key = "rightwindow";
                break;
            case 93:
                key.key = "select";
                break;
            case 96:
                key.key = "numpad0";
                key.char = "0";
                break;
            case 97:
                key.key = "numpad1";
                key.char = "1";
                break;
            case 98:
                key.key = "numpad2";
                key.char = "2";
                break;
            case 99:
                key.key = "numpad3";
                key.char = "3";
                break;
            case 100:
                key.key = "numpad4";
                key.char = "4";
                break;
            case 101:
                key.key = "numpad5";
                key.char = "5";
                break;
            case 102:
                key.key = "numpad6";
                key.char = "6";
                break;
            case 103:
                key.key = "numpad7";
                key.char = "7";
                break;
            case 104:
                key.key = "numpad8";
                key.char = "8";
                break;
            case 105:
                key.key = "numpad9";
                key.char = "9";
                break;
            case 106:
                key.key = "multiply";
                key.char = "*";
                break;
            case 107:
                key.key = "add";
                key.char = "+";
                break;
            case 109:
                key.key = "subtract";
                key.char = "-";
                break;
            case 110:
                key.key = "decimalpoint";
                key.char = ".";
                break;
            case 111:
                key.key = "divide";
                key.char = "/";
                break;
            case 112:
                key.key = "f1";
                break;
            case 113:
                key.key = "f2";
                break;
            case 114:
                key.key = "f3";
                break;
            case 115:
                key.key = "f4";
                break;
            case 116:
                key.key = "f5";
                break;
            case 117:
                key.key = "f6";
                break;
            case 118:
                key.key = "f7";
                break;
            case 119:
                key.key = "f8";
                break;
            case 120:
                key.key = "f9";
                break;
            case 121:
                key.key = "f10";
                break;
            case 122:
                key.key = "f11";
                break;
            case 123:
                key.key = "f12";
                break;
            case 144:
                key.key = "numlock";
                break;
            case 145:
                key.key = "scrolllock";
                break;
            case 186:
                key.key = "semicolon";
                key.char = ";";
                break;
            case 187:
                key.key = "equal";
                key.char = "=";
                break;
            case 188:
                key.key = "comma";
                key.char = ",";
                break;
            case 189:
                key.key = "dash";
                key.char = "-";
                break;
            case 190:
                key.key = "period";
                key.char = ".";
                break;
            case 191:
                key.key = "forwardslash";
                key.char = "/";
                break;
            case 192:
                key.key = "graveaccent";
                break;
            case 219:
                key.key = "openbraket";
                key.char = "{";
                break;
            case 220:
                key.key = "backslash";
                key.char = "\\";
                break;
            case 221:
                key.key = "closebraket";
                key.char = "}";
                break;
            case 222:
                key.key = "singlequote";
                key.char = "'";
                break;
            case 32:
                key.key = "space";
                key.char = " ";
                break;
        }
        return key;
    }

} );