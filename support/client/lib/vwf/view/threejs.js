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

        initialize: function( rootSelector ) {
           
			this.rootSelector = rootSelector;
			this.height = 600;
            this.width = 800;
            this.canvasQuery = null;
            if ( window && window.innerHeight ) this.height = window.innerHeight - 20;
            if ( window && window.innerWidth ) this.width = window.innerWidth - 20;
        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */) {
			
			
			//the created node is a scene, and has already been added to the state by the model.
			//how/when does the model set the state object? 
			if(this.state.scenes[childID])
			{
				var threeview = this;
				var domWin = window;
				
				
				this.canvasQuery = jQuery(this.rootSelector).append("<canvas id='" + this.state.sceneRootID + "' width='"+this.width+"' height='"+this.height+"' class='vwf-scene'/>"
                ).children(":last");
				
				initScene.call(this,this.state.scenes[childID]);
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

        satProperty: function (nodeID, propertyName, propertyValue) {
		
		    //console.log([nodeID,propertyName,propertyValue]);
		    var node = this.state.nodes[ nodeID ]; // { name: childName, threeObject: undefined }
			if(!node) node = this.state.scenes[nodeID];
		    var value = undefined;
		  
		    //this driver has no representation of this node, so there is nothing to do.
		    if(!node) return;
		  
		    var threeObject = node.threeObject;
		    if(!threeObject)
			  threeObject = node.threeScene;
		  
		    //There is not three object for this node, so there is nothing this driver can do. return
		    if(!threeObject) return value;	
			  
			if ( node && threeObject && propertyValue !== undefined ) 
			{
				if(threeObject instanceof THREE.Scene)
				{
					if(propertyName == 'ambientColor')
					{
						
						for(var i = 0; i < threeObject.__lights.length; i++)
						{
							if(threeObject.__lights[i] instanceof THREE.AmbientLight)
							{
								
								threeObject.__lights[i].color.setRGB(propertyValue[0]/255,propertyValue[1]/255,propertyValue[2]/255);
								SetMaterialAmbients.call(this);
							}
							
						}
						
					}
				}
			}
		
		
		
		}

        // -- gotProperty ------------------------------------------------------------------------------

        //gotProperty: function ( nodeID, propertyName, propertyValue ) { },
    
    
    } );
	// private ===============================================================================
	    function initScene( sceneNode ) {
    
        var self = this;
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
                requestAnimFrame = window.requestAnimationFrame = function(callback, element) {
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
                cancelAnimFrame = window.cancelAnimationFrame = function(id) {
                    clearTimeout(id);
                };
            }
            else {
                cancelAnimFrame = window.cancelAnimationFrame;
            }
        }());
        
		
        function renderScene(time) {
            requestAnimFrame( renderScene );
            sceneNode.frameCount++;
			if(sceneNode.frameCount > 10)
			{
				
				sceneNode.frameCount == 0
			
				
				var newPick = ThreeJSPick.call(self,sceneNode);
				
				var newPickId = newPick ? getPickObjectID.call( view, newPick.object ) : view.state.sceneRootID;
                if(self.lastPickId != newPickId && self.lastEventData)
				{
					
                    view.kernel.dispatchEvent( self.lastPickId, "pointerOut", self.lastEventData.eventData, self.lastEventData.eventNodeData );
                    view.kernel.dispatchEvent( newPickId, "pointerOver", self.lastEventData.eventData, self.lastEventData.eventNodeData );
				}
				
				self.lastPickId = newPickId
                self.lastPick = newPick;
                if(view.lastEventData && (view.lastEventData.eventData[0].screenPosition[0] != oldMouseX || view.lastEventData.eventData[0].screenPosition[1] != oldMouseY)) {
                    oldMouseX = view.lastEventData.eventData[0].screenPosition[0];
                    oldMouseY = view.lastEventData.eventData[0].screenPosition[1];
                    hovering = false;
                }
                else if(self.lastEventData && self.mouseOverCanvas && !hovering && self.lastPick) {
                    var pickId = getPickObjectID.call( view, self.lastPick.object, false );
                    if(!pickId) {
                        pickId = view.state.sceneRootID;
                    }
                    view.kernel.dispatchEvent( pickId, "pointerHover", self.lastEventData.eventData, self.lastEventData.eventNodeData );
                    hovering = true;
                }
                
			}
            renderer.render(scene,sceneNode.camera.threeJScameras[sceneNode.camera.ID]);
        };

        var mycanvas = this.canvasQuery.get( 0 );

        if ( mycanvas ) {
            var oldMouseX = 0;
            var oldMouseY = 0;
            var hovering = false;
		  
			sceneNode.renderer = new THREE.WebGLRenderer({canvas:mycanvas,antialias:true});
            sceneNode.renderer.setClearColor({r:.5,g:1,b:1},1.0);
			var ambientlight = new THREE.AmbientLight('#000000');
			ambientlight.color.setRGB(.7,.7,.7);
			sceneNode.threeScene.add(ambientlight);
			
			rebuildAllMaterials.call(this);
			sceneNode.renderer.setFaceCulling(false);
            this.state.cameraInUse = sceneNode.threeScene.children[0];
           // this.state.cameraInUse.setAspect( ( mycanvas.width / mycanvas.height) /*/ 1.333 */ );

            
            // Schedule the renderer.

            var view = this;
            var scene = sceneNode.threeScene;
            var renderer = sceneNode.renderer;
			var scenenode = sceneNode;
			window._dScene = scene;
			window._dRenderer = renderer;
            sceneNode.frameCount = 0; // needed for estimating when we're pick-safe
			
			initMouseEvents.call(this,mycanvas);
            renderScene((+new Date));
        }
    }
	function rebuildAllMaterials(start)
	{
		
		if(!start)
		{
			for(var i in this.state.scenes)
			{
				rebuildAllMaterials(this.state.scenes[i].threeScene);
			}
		}else
		{
			if(start && start.material)
			{
				start.material.needsUpdate = true;
			}
			if(start && start.children)
			{
			   for(var i in start.children)
				rebuildAllMaterials(start.children[i]);
			}
		}
	}	
	//necessary when settign the amibent color to match GLGE behavior
	//Three js mults scene ambient by material ambient
	function SetMaterialAmbients(start)
	{
		
		if(!start)
		{
			for(var i in this.state.scenes)
			{
				SetMaterialAmbients(this.state.scenes[i].threeScene);
			}
		}else
		{
			if(start && start.material)
			{
				//.005 chosen to make the 255 range for the ambient light mult to values that look like GLGE values.
				//this will override any ambient colors set in materials.
				if(start.material.ambient)
					start.material.ambient.setRGB(1,1,1);
			}
			if(start && start.children)
			{
			   for(var i in start.children)
				SetMaterialAmbients(start.children[i]);
			}
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
        var threeActualObj = undefined;

        var lastXPos = -1;
        var lastYPos = -1;
        var mouseRightDown = false;
        var mouseLeftDown = false;
        var mouseMiddleDown = false;
        var win = window;

        var container = document.getElementById("container");
        var sceneCanvas = canvas;
        //var mouse = new GLGE.MouseInput( sceneCanvas );

        var self = this;

        var getEventData = function( e, debug ) {
            var returnData = { eventData: undefined, eventNodeData: undefined };
            var pickInfo = self.lastPick;
            pointerPickID = undefined;

            threeActualObj = pickInfo ? pickInfo.object : undefined;
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
                screenPosition: [mouseXPos.call(this,e), mouseYPos.call(this,e)]
            } ];



            var camera = sceneView.state.cameraInUse;
            var worldCamPos, worldCamTrans, camInverse;
            if ( camera ) { 
                worldCamTrans = camera.matrix.getPosition();
                worldCamPos = [ worldCamTrans.x, worldCamTrans.y, worldCamTrans.y];
                //worldCamPos = [ camera.getLocX(), camera.getLocY(), camera.getLocZ() ]; 
//                worldCamTrans = goog.vec.Mat4.createFromArray( camera.getLocalMatrix() );
//                goog.vec.Mat4.transpose( worldCamTrans, worldCamTrans );
//                camInverse = goog.vec.Mat4.create();
//                goog.vec.Mat4.invert( worldCamTrans, camInverse );
            }

            returnData.eventNodeData = { "": [ {
                distance: pickInfo ? pickInfo.distance : undefined,
                origin: pickInfo ? pickInfo.pickOrigin : undefined,
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

                    trans = goog.vec.Mat4.createFromArray( child.threeObject.getLocalMatrix() );
                    goog.vec.Mat4.transpose( trans, trans );                   
                    
                    if ( parent ) {                   
                        parentTrans = goog.vec.Mat4.createFromArray( parent.threeObject.getLocalMatrix() );
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
            self.lastEventData = returnData;
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

                    var glgeObj = sceneView.state.nodes[mouseUpObjectID].threeObject;
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
            self.mouseOverCanvas = true;
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
            self.mouseOverCanvas = false;
        }

        canvas.setAttribute("onmousewheel", '');
        if(typeof canvas.onmousewheel == "function") {
            canvas.removeAttribute("onmousewheel");
            canvas.onmousewheel = function( e ) {
                var eData = getEventData( e, false );
                if ( eData ) {
                    eData.eventNodeData[""][0].wheel = {
                        delta: e.wheelDelta / -40,
                        deltaX: e.wheelDeltaX / -40,
                        deltaY: e.wheelDeltaY / -40,
                    };
                    var id = sceneID;
                    if ( pointerDownID && mouseRightDown || mouseLeftDown || mouseMiddleDown )
                        id = pointerDownID;
                    else if ( pointerOverID )
                        id = pointerOverID; 
                        
                    sceneView.kernel.dispatchEvent( id, "pointerWheel", eData.eventData, eData.eventNodeData );
                }
            };
        }
        else {
            canvas.removeAttribute("onmousewheel");
            canvas.addEventListener('DOMMouseScroll', function( e ) {
                var eData = getEventData( e, false );
                if ( eData ) {
                    eData.eventNodeData[""][0].wheel = {
                        delta: e.detail,
                        deltaX: e.detail,
                        deltaY: e.detail,
                    };
                    var id = sceneID;
                    if ( pointerDownID && mouseRightDown || mouseLeftDown || mouseMiddleDown )
                        id = pointerDownID;
                    else if ( pointerOverID )
                        id = pointerOverID; 
                        
                    sceneView.kernel.dispatchEvent( id, "pointerWheel", eData.eventData, eData.eventNodeData );
                }
            });
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
            sceneCanvas.mouseX=e.clientX;
            sceneCanvas.mouseY=e.clientY;
            var eData = getEventData( e, false );
            if ( eData ) {
                e.dataTransfer.dropEffect = "copy";
            }
            e.preventDefault();    
        };

        // -- drop ---------------------------------------------------------------------------------

        canvas.ondrop = function( e ) {

            e.preventDefault();
            var eData = getEventData( e, false );

            if ( eData ) {

                var fileData, fileName, fileUrl, rotation, scale, translation, match, object;

                try {

                    fileData = JSON.parse( e.dataTransfer.getData('text/plain') );
                    fileName = decodeURIComponent(fileData.fileName);
                    fileUrl = decodeURIComponent(fileData.fileUrl);
                    rotation = decodeURIComponent(fileData.rotation);
                    rotation = rotation ? JSON.parse(rotation) : undefined;
                    scale = decodeURIComponent(fileData.scale);
                    scale = scale ? JSON.parse(scale) : [1, 1, 1];
                    translation = decodeURIComponent(fileData.translation);
                    translation = translation ? JSON.parse(translation) : [0, 0, 0];
                    if($.isArray(translation) && translation.length == 3) {
                        translation[0] += eData.eventNodeData[""][0].globalPosition[0];
                        translation[1] += eData.eventNodeData[""][0].globalPosition[1];
                        translation[2] += eData.eventNodeData[""][0].globalPosition[2];
                    }
                    else {
                        translation = eData.eventNodeData[""][0].globalPosition;
                    }

                    if ( match = /* assignment! */ fileUrl.match( /(.*\.vwf)\.(json|yaml)$/i ) ) {

                        object = {
                          extends: match[1],
                          properties: { 
                            translation: translation,
                            rotation : rotation,
                            scale: scale,
                          },
                        };

                        fileName = fileName.replace( /\.(json|yaml)$/i, "" );

                    } else if ( match = /* assignment! */ fileUrl.match( /\.dae$/i ) ) {

                        object = {
                          extends: "http://vwf.example.com/node3.vwf",
                          source: fileUrl,
                          type: "model/vnd.collada+xml",
                          properties: { 
                            translation: translation,
                            rotation : rotation,
                            scale: scale,
                          },   
                        };

                    }

                    if ( object ) {
                        sceneView.kernel.createChild( "index-vwf", fileName, object );                
                    }

                } catch ( e ) {
                    // TODO: invalid JSON
                }

            }
        };
         
    };
	function mouseXPos(e) {
        return e.clientX - e.currentTarget.offsetLeft + window.scrollX + window.slideOffset;
    }

    function mouseYPos(e) {
        return e.clientY - e.currentTarget.offsetTop + window.scrollY;
    }
	function ThreeJSPick(sceneNode)
	{
		if(!this.lastEventData) return;
		
		
		var threeCam = sceneNode.camera.threeJScameras[sceneNode.camera.ID];
	    if(!this.ray) this.ray = new THREE.Ray();
		if(!this.projector) this.projector = new THREE.Projector();
		
		var SCREEN_HEIGHT = window.innerHeight;
		var SCREEN_WIDTH = window.innerWidth;
		var x = ( this.lastEventData.eventData[0].screenPosition[0] / SCREEN_WIDTH ) * 2 - 1;
		var y = -( this.lastEventData.eventData[0].screenPosition[1] / SCREEN_HEIGHT ) * 2 + 1;
		var directionVector = new THREE.Vector3();
		
		directionVector.set(x, y, .5);
		
		this.projector.unprojectVector(directionVector, threeCam);
		var pos = new THREE.Vector3();
		pos.copy(threeCam.matrix.getPosition());
		directionVector.subSelf(pos);
		directionVector.normalize();
		
		
		this.ray.set(pos, directionVector);
		var intersects = this.ray.intersectObjects(sceneNode.threeScene.children, true);
		if (intersects.length) {
			// intersections are, by default, ordered by distance,
			// so we only care for the first one. The intersection
			// object holds the intersection point, the face that's
			// been "hit" by the ray, and the object to which that
			// face belongs. We only care for the object itself.
			var target = intersects[0].object;
			
			var ID = getPickObjectID.call(this,target);
			return intersects[0];
		}
		return null;
	}
	function getPickObjectID(threeObject)
	{	
		
		if(threeObject.vwfID)
			return threeObject.vwfID;
		else if(threeObject.parent)
		 return getPickObjectID(threeObject.parent);
		return null;	
	}
});