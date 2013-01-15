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
            this.keyStates = { keysDown: {}, mods: {}, keysUp: {} };
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
                    if(propertyName == 'enableShadows')
                    {
                        //debugger;
                        var sceneNode = this.state.scenes[nodeID];
                        sceneNode.renderer.shadowMapEnabled = propertyValue;
                    }
                    if ( propertyName == 'ambientColor' )
                    {
                        var lightsFound = 0;
                        for( var i = 0; i < threeObject.__lights.length; i++ )
                        {
                            if(threeObject.__lights[i] instanceof THREE.AmbientLight)
                            {
                                threeObject.__lights[i].color.setRGB(propertyValue[0]/255,propertyValue[1]/255,propertyValue[2]/255);
                                SetMaterialAmbients.call(this);
                                lightsFound++;
                            }
                            
                        }
                        if ( lightsFound == 0 ) {
                            var ambientlight = new THREE.AmbientLight( '#000000' );
                            ambientlight.color.setRGB( propertyValue[0]/255, propertyValue[1]/255, propertyValue[2]/255 );
                            node.threeScene.add( ambientlight );
                            SetMaterialAmbients.call(this);                            
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
			
			
			var camera = sceneNode.camera.threeJScameras[sceneNode.camera.ID];
			var pos = camera.localToWorld(new THREE.Vector3(-.4,.275,-1.0))
			sceneNode.axes.position = pos;
			sceneNode.axes.scale = new THREE.Vector3(.005,.005,.005);
			sceneNode.axes.updateMatrix();
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
        
        function detectWebGL()
        {
            var asa; var canvas; var dcanvas; var gl; var expmt;

            $(document.body).append('<canvas width="100" height="100" id="testWebGLSupport" />');
            canvas = $('#testWebGLSupport');
            console.log(canvas);

            // check to see if we can do webgl
            // ALERT FOR JQUERY PEEPS: canvas is a jquery obj - access the dom obj at canvas[0]
                dcanvas = canvas[0];
                expmt = false;
                if ("WebGLRenderingContext" in window) {
                    console.log("browser at least knows what webgl is.");
                }
                // some browsers don't have a .getContext for canvas...
                try { gl = dcanvas.getContext("webgl"); }
                catch (x) { gl = null; }
                if (gl == null) {
                    try { gl = dcanvas.getContext("experimental-webgl"); }
                    catch (x) { gl = null; }
                    if (gl == null) { console.log('but can\'t speak it'); }
                    else { expmt = true; console.log('and speaks it experimentally.'); }
                } else {
                    console.log('and speaks it natively.');
                }

                if (gl || expmt) {
                    console.log("loading webgl content."); canvas.remove(); return true;
                } else {
                    console.log("image-only fallback. no webgl.");
                    canvas.remove();
                    return false;
                }

            
        
        
        }
        function getURLParameter(name) {
            return decodeURI(
                (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
            );
        }
        
        if ( mycanvas ) {
            var oldMouseX = 0;
            var oldMouseY = 0;
            var hovering = false;
            
            window.onresize = function () {
                var origWidth = self.width;
                var origHeight = self.height;
                if ( window && window.innerHeight ) self.height = window.innerHeight - 20;
                if ( window && window.innerWidth ) self.width = window.innerWidth - 20;

                if ((origWidth != self.width) || (origHeight != self.height)) {
                    mycanvas.height = self.height;
                    mycanvas.width = self.width;
                    
                    //var cam = self.state.cameraInUse;
                    //if ( cam ) {
                    //    cam.aspect = mycanvas.width / mycanvas.height;
                    //}
                }
            }

            if(detectWebGL() && getURLParameter('disableWebGL') == 'null')
            {
                sceneNode.renderer = new THREE.WebGLRenderer({canvas:mycanvas,antialias:true});
            }else
            {
                sceneNode.renderer = new THREE.CanvasRenderer({canvas:mycanvas,antialias:true});
                sceneNode.renderer.setSize(window.innerWidth,window.innerHeight);
            }
            //sceneNode.renderer.setClearColor({r:.5,g:1,b:1},1.0);
//            var ambientlight = new THREE.AmbientLight('#000000');
//            ambientlight.color.setRGB(.7,.7,.7);
//            sceneNode.threeScene.add(ambientlight);
            
            rebuildAllMaterials.call(this);
            if(sceneNode.renderer.setFaceCulling)
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
            
            initInputEvents.call(this,mycanvas);
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
        // -- initInputEvents ------------------------------------------------------------------------

    function initInputEvents( canvas ) {
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
            pointerPickID = pickInfo ? getPickObjectID.call( sceneView, pickInfo.object, debug ) : undefined;
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
                origin: pickInfo ? pickInfo.worldCamPos : undefined,
                globalPosition: pickInfo ? [pickInfo.point.x,pickInfo.point.y,pickInfo.point.z] : undefined,
                globalNormal: pickInfo ? [0,0,1] : undefined,    //** not implemented by threejs
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

                    trans = goog.vec.Mat4.createFromArray( child.threeObject.matrix.elements );
                    goog.vec.Mat4.transpose( trans, trans );                   
                    
                    if ( parent ) {                   
                        parentTrans = goog.vec.Mat4.createFromArray( parent.threeObject.matrix.elements );
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

                    // TODO: hierarchy output, helpful for setting up applications
                    //var obj3js = sceneView.state.nodes[mouseUpObjectID].threeObject;
                    //if ( obj3js ) {
                    //    if ( atlDown && !ctrlDown ) {
                    //        recurseGroup.call( sceneView, obj3js, 0 ); 
                    //    }
                    //}
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
        
        window.onkeydown = function (event) {
                    
                    var key = undefined;
                    var validKey = false;
                    var keyAlreadyDown = false;
                    switch (event.keyCode) {
                        case 17:
                        case 16:
                        case 18:
                        case 19:
                        case 20:
                            break;
                        default:
                            key = getKeyValue.call( sceneView, event.keyCode);
                            keyAlreadyDown = !!sceneView.keyStates.keysDown[key.key];
                            sceneView.keyStates.keysDown[key.key] = key;
                            validKey = true;
                            break;
                    }

                    if (!sceneView.keyStates.mods) sceneView.keyStates.mods = {};
                    sceneView.keyStates.mods.alt = event.altKey;
                    sceneView.keyStates.mods.shift = event.shiftKey;
                    sceneView.keyStates.mods.ctrl = event.ctrlKey;
                    sceneView.keyStates.mods.meta = event.metaKey;

                    var sceneNode = sceneView.state.scenes[sceneView.state.sceneRootID];
                    if (validKey && sceneNode && !keyAlreadyDown /*&& Object.keys( sceneView.keyStates.keysDown ).length > 0*/) {
                        //var params = JSON.stringify( sceneView.keyStates );
                        sceneView.kernel.dispatchEvent(sceneNode.ID, "keyDown", [sceneView.keyStates]);
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
                            key = getKeyValue.call( sceneView, event.keyCode);
                            delete sceneView.keyStates.keysDown[key.key];
                            sceneView.keyStates.keysUp[key.key] = key;
                            validKey = true;
                            break;
                    }

                    sceneView.keyStates.mods.alt = event.altKey;
                    sceneView.keyStates.mods.shift = event.shiftKey;
                    sceneView.keyStates.mods.ctrl = event.ctrlKey;
                    sceneView.keyStates.mods.meta = event.metaKey;

                    var sceneNode = sceneView.state.scenes[sceneView.state.sceneRootID];
                    if (validKey && sceneNode) {
                        //var params = JSON.stringify( sceneView.keyStates );
                        sceneView.kernel.dispatchEvent(sceneNode.ID, "keyUp", [sceneView.keyStates]);
                        delete sceneView.keyStates.keysUp[key.key];
                    }

                };
        
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

});