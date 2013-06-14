
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

define( [ "module", "vwf/view", "vwf/utility" ], function( module, view, utility ) {

    // Private global variables for navigation
    var appInitialized;
    var navObjectRequested;
    var navObjectName;
    var navmode;
    var ownerlessNavObjects = [];
    var numNavCandidates;

    return view.load( module, {

        initialize: function( options ) {
            
            checkCompatibility.call(this);

            this.pickInterval = 10;
            this.disableInputs = false;

            // Store parameter options for persistence functionality
            this.parameters = options;

            if(typeof options == "object") {
                this.rootSelector = options["application-root"];
                if("experimental-pick-interval" in options) {
                    this.pickInterval = options["experimental-pick-interval"];
                }
                if("experimental-disable-inputs" in options) {
                    this.disableInputs = options["experimental-disable-inputs"];
                }
            }
            else {
                this.rootSelector = options;
            }
           
            this.height = 600;
            this.width = 800;
            this.canvasQuery = null;
            if ( window && window.innerHeight ) this.height = window.innerHeight - 20;
            if ( window && window.innerWidth ) this.width = window.innerWidth - 20;
            this.keyStates = { keysDown: {}, mods: {}, keysUp: {} };
        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */) {
            
            
            //the created node is a scene, and has already been added to the state by the model.
            //how/when does the model set the state object? 
            if ( this.state.scenes[ childID ] )
            {                
                this.canvasQuery = jQuery(this.rootSelector).append("<canvas id='" + this.state.sceneRootID + "' width='"+this.width+"' height='"+this.height+"' class='vwf-scene'/>"
                ).children(":last");
                
                initScene.call(this,this.state.scenes[childID]);
            }
        },

        initializedNode: function( nodeID, childID ) {

            // If the node that was initialized is the application node, find the user's navigation object
            var sceneView = this;
            var appID = sceneView.kernel.application();
            if ( childID == appID ) {
                appInitialized = true;
            } else {

                //TODO: This is a temporary workaround until the callback functionality is implemented for 
                //      kernel.createChild()
                //      Listening specifically for this.findNavObject>>createChild() creating a new navObject if 
                //      one does not exist.
                //      Can be removed once kernel.createChild callback works properly
                var initNode = this.state.nodes[ childID ];
                if ( initNode && ( initNode.name == navObjectName ) ) {
                    var sceneView = this;
                    initNode.owner = sceneView.kernel.moniker();
                    controlNavObject.call( sceneView, initNode );
                }
            }
            //End TODO
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

        initializedProperty: function ( nodeID, propertyName, propertyValue ) { 
            if ( propertyName == "transform" ) {
                receiveModelTransformChanges.call( this, nodeID, propertyValue );
            } else if ( propertyName == "lookAt") {
                receiveModelTransformChanges.call( this, nodeID, this.state.nodes[ nodeID ].transform );
            }
        },

        // TODO: deletedProperty

        // -- satProperty ------------------------------------------------------------------------------

        satProperty: function ( nodeID, propertyName, propertyValue ) { 
            if ( propertyName == "navmode" ) { 
                if ( navObject && ( nodeID == navObject.ID ) ) {
                    navmode = propertyValue;
                }
            } else if ( propertyName == "transform" ) {
                receiveModelTransformChanges.call( this, nodeID, propertyValue );
            } else if ( propertyName == "lookAt") {
                receiveModelTransformChanges.call( this, nodeID, this.state.nodes[ nodeID ].transform );
            }
        },

        // -- gotProperty ------------------------------------------------------------------------------

        gotProperty: function ( nodeID, propertyName, propertyValue ) { 
            var clientThatGotProperty = this.kernel.client();
            var me = this.kernel.moniker();
            var sceneRootID = this.state.sceneRootID;
            if ( clientThatGotProperty == me ) {
                if ( propertyName == "owner") {

                    // Get the navigable object
                    var navCandidate = this.state.nodes[ nodeID ];

                    // If a node w/ nodeID exists, then this is a real owner value to be processed
                    // (otherwise it is the behavior itself and should be ignored)
                    if ( navCandidate ) {

                        // If we haven't already found the navigation object....
                        if ( !navObject ) {
                            var owner = propertyValue;

                            // If I'm the owner, take control
                            // Else, if it doesn't have an owner, push it on the list of ownerless navigation 
                            // objects that we can pull from if none is found that has an owner of this client
                            if ( owner == me ) {
                                controlNavObject.call( this, navCandidate );
                            } else if ( !owner ) {
                                ownerlessNavObjects.push( navCandidate );
                            } 
                        }

                        // If we did not take control of this navigation object (its owner wasn't this client)
                        if ( !navObject ) {

                            // Decrement the counter of navigation objects that we are waiting for
                            numNavCandidates--;

                            // If we're out of navigation candidates for which we might be the owner, see if 
                            // there are any ownerless nav objects that we could control
                            // If so, take control
                            // Else, create one
                            if ( !numNavCandidates ) {
                                if ( ownerlessNavObjects.length ) {
                                    controlNavObject.call( this, ownerlessNavObjects[ 0 ] );
                                } else {

                                    // Retrieve the userObject property so we may create a navigation object from 
                                    // it for this user (the rest of the logic is in the gotProperty call for 
                                    // userObject)
                                    this.kernel.getProperty( sceneRootID, "userObject" );
                                }
                            }
                        }
                    }
                } else if ( propertyName == "userObject" ) {

                    // The userObject property is only requested when the system wishes to create one for this 
                    // user.  We do that here.
                    
                    // Set the userObject from the value received or a default if it is null/undefined
                    var userObject = propertyValue || {
                        "extends": "http://vwf.example.com/camera.vwf",
                        "implements": [ "http://vwf.example.com/navigable.vwf" ]
                    };

                    // Makes sure that the userObject has a properties field
                    userObject[ "properties" ] = userObject[ "properties" ] || {};

                    // Set the object's owner to be this object
                    userObject[ "properties" ][ "owner" ] = me;

                    // Save the name of the object globally so we can recognize it in 
                    // initializedNode so we can take control of it there
                    navObjectName = "navobj_" + me;

                    // TODO: The callback function is commented out because callbacks have not yet been 
                    //       implemented for createChild - see workaround in initializedNode
                    this.kernel.createChild( sceneRootID, navObjectName, userObject, undefined, undefined /*,
                                             function( nodeID ) {
                        controlNavObject.call( this, this.state.nodes[ nodeID ] );
                    } */ );
                } else if ( navObject && ( nodeID == navObject.ID ) && propertyName == "navmode" ) {

                    // This was requested from the model from controlNavObject
                    navmode = propertyValue;
                }
            }
        },

        // -- ticked -----------------------------------------------------------------------------------

        ticked: function() {
            
            // This is the first place that we know that the entire app is loaded because the queue has been 
            // resumed (and therefore, it is ticking) - we will search for the user's navigation object here

            // We want to only search for the navigation object if we haven't before (!navObjectRequested),
            // and we want to make sure that the app has been initialized, and where not at the brief period of
            // ticking before the app starts loading (appInitialized)
            if ( !navObjectRequested && appInitialized ) {
                navObjectRequested = true;
                findNavObject.call( this );
            }
        }
    } );

    // private ===============================================================================

    function checkCompatibility() {
        this.compatibilityStatus = { compatible:true, errors:{} }
        var contextNames = ["webgl","experimental-webgl","moz-webgl","webkit-3d"];
        for(var i = 0; i < contextNames.length; i++){
            try{
                var canvas = document.createElement('canvas');
                var gl = canvas.getContext(contextNames[i]);
                if(gl){
                    return true;
                }
            }
            catch(e){}
        }
        this.compatibilityStatus.compatible = false;
        this.compatibilityStatus.errors["WGL"] = "This browser is not compatible. The vwf/view/threejs driver requires WebGL.";
        return false;
    }

    function initScene( sceneNode ) {
    
        var self = this;
        var lastPickTime = 0;
        
        function GetParticleSystems(node,list)
        {
            if(!list)
                list = [];
            for(var i =0; i<node.children.length; i++)
            {
                if(node.children[i] instanceof THREE.ParticleSystem)
                    list.push(node.children[i]);
                list =  GetParticleSystems(node.children[i],list);
            }           
                return list;
        }
        
        function renderScene(time) {

            // Schedule the next render
            window.requestAnimationFrame( renderScene );

            // Verify that there is a camera to render from before going any farther
            var camera = self.state.cameraInUse;
            if ( !camera ) {
                self.logger.debugx( "Cannot render because there is no valid camera" );
                return;
            }

            
            var now = ( performance !== undefined && performance.now !== undefined ) ? performance.now() : time;
            var timepassed = now - sceneNode.lastTime;

            if ( timepassed ) {

                var pss = GetParticleSystems(sceneNode.threeScene);
                for ( var i in pss )
                {
                    if(pss[i].update)
                        pss[i].update(timepassed);
                }

                // Move the user's camera according to their input
                self.moveNavObject( timepassed );
                self.rotateNavObjectByKey( timepassed );
            }
            
            // Only do a pick every "pickInterval" ms. Defaults to 10 ms.
            // Note: this is a costly operation and should be optimized if possible
            if ( ( now - lastPickTime ) > self.pickInterval && !self.disableInputs )
            {
                var newPick = ThreeJSPick.call( self, mycanvas, sceneNode, false );
                
                var newPickId = newPick ? getPickObjectID.call( view, newPick.object ) : view.state.sceneRootID;

                if ( self.lastPickId != newPickId && self.lastEventData )
                {
                    if ( self.lastPickId ) {
                        view.kernel.dispatchEvent( self.lastPickId, "pointerOut", 
                                                   self.lastEventData.eventData, 
                                                   self.lastEventData.eventNodeData );
                    }
                    view.kernel.dispatchEvent( newPickId, "pointerOver",
                                               self.lastEventData.eventData, 
                                               self.lastEventData.eventNodeData );
                }

                if ( view.lastEventData && 
                     ( view.lastEventData.eventData[0].screenPosition[0] != oldMouseX || 
                       view.lastEventData.eventData[0].screenPosition[1] != oldMouseY ) ) {
                    oldMouseX = view.lastEventData.eventData[0].screenPosition[0];
                    oldMouseY = view.lastEventData.eventData[0].screenPosition[1];
                    hovering = false;
                }
                else if(self.lastEventData && self.mouseOverCanvas && !hovering && newPick) {
                    view.kernel.dispatchEvent( newPickId, "pointerHover", self.lastEventData.eventData, self.lastEventData.eventNodeData );
                    hovering = true;
                }
                
                self.lastPickId = newPickId
                self.lastPick = newPick;
                lastPickTime = now;
            }

            renderer.render( scene, camera );
			sceneNode.lastTime = now;
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
            var view = this;
            window.onresize = function () {
                var origWidth = self.width;
                var origHeight = self.height;
                if ( window && window.innerHeight ) self.height = window.innerHeight - 20;
                if ( window && window.innerWidth ) self.width = window.innerWidth - 20;

                if ((origWidth != self.width) || (origHeight != self.height)) {
                    mycanvas.height = self.height;
                    mycanvas.width = self.width;
                    sceneNode.renderer.setViewport(0,0,window.innerWidth,window.innerHeight)
                    
                    var viewCam = view.state.cameraInUse;
                    viewCam.aspect =  mycanvas.width / mycanvas.height;
                    viewCam.updateProjectionMatrix();
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

            // backgroundColor and enableShadows are dependent on the renderer object, but if they are set in a prototype,
            // the renderer is not available yet, so set them now.
            for(var key in sceneNode.rendererProperties) {
                if(key == "backgroundColor") {
                    var vwfColor = new utility.color( sceneNode.rendererProperties["backgroundColor"] );
                    if ( vwfColor ) {
                        sceneNode.renderer.setClearColor( vwfColor.getHex(), vwfColor.alpha() );
                    }
                }
                else if(key == "enableShadows") {
                    value = Boolean( sceneNode.rendererProperties["enableShadows"] );
                    sceneNode.renderer.shadowMapEnabled = value;
                }
            }
            
            rebuildAllMaterials.call(this);
            if(sceneNode.renderer.setFaceCulling)
                sceneNode.renderer.setFaceCulling( THREE.CullFaceBack );

            // Set the camera that the view will render from
            // It starts here as that dictated by the model until the view tells it otherwise
            var modelCameraInfo = sceneNode.camera;
            this.state.cameraInUse = modelCameraInfo.threeJScameras[ modelCameraInfo.ID ];

            // Schedule the renderer.
            var scene = sceneNode.threeScene;
            var renderer = sceneNode.renderer;
            var scenenode = sceneNode;
            window._dScene = scene;
            window._dRenderer = renderer;
            window._dSceneNode = sceneNode;
            
            if(!this.disableInputs) {
                initInputEvents.call(this,mycanvas);
            }
            renderScene((+new Date));
        }

        // If scene is already loaded, find the user's navigation object
        var sceneView = this;
        var appID = sceneView.kernel.application( true );
        if ( appID ) {
            appInitialized = true;
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

            var mousePos = utility.coordinates.contentFromWindow( e.target, { x: e.clientX, y: e.clientY } ); // canvas coordinates from window coordinates

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
                position: [ mousePos.x / sceneView.width, mousePos.y / sceneView.height ],
                screenPosition: [ mousePos.x, mousePos.y ]
            } ];

            var camera = sceneView.state.cameraInUse;
            var worldCamPos, worldCamTrans, camInverse;
            if ( camera ) { 
                var worldCamTrans = new THREE.Vector3();
                worldCamTrans.getPositionFromMatrix( camera.matrix );

                // Convert THREE.Vector3 to array
                worldCamPos = [ worldCamTrans.x, worldCamTrans.y, worldCamTrans.z];
            }

            returnData.eventNodeData = { "": [ {
                distance: pickInfo ? pickInfo.distance : undefined,
                origin: pickInfo ? pickInfo.worldCamPos : undefined,
                globalPosition: pickInfo ? [pickInfo.point.x,pickInfo.point.y,pickInfo.point.z] : undefined,
                globalNormal: pickInfo ? [0,0,1] : undefined,    //** not implemented by threejs
                globalSource: worldCamPos
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
                var transform, parentTrans, localTrans, localNormal, parentInverse, relativeCamPos;
                while ( child ) {

                    transform = goog.vec.Mat4.createFromArray( child.threeObject.matrix.elements );
                    goog.vec.Mat4.transpose( transform, transform );                   
                    
                    if ( parent ) {                   
                        parentTrans = goog.vec.Mat4.createFromArray( parent.threeObject.matrix.elements );
                        goog.vec.Mat4.transpose( parentTrans, parentTrans ); 
                    } else {
                        parentTrans = undefined;
                    }

                    if ( transform && parentTrans ) {
                        // get the parent inverse, and multiply by the world
                        // transform to get the local transform 
                        parentInverse = goog.vec.Mat4.create();
                        if ( goog.vec.Mat4.invert( parentTrans, parentInverse ) ) {
                            localTrans = goog.vec.Mat4.multMat( parentInverse, transform,
                                goog.vec.Mat4.create()                       
                            );
                        }
                    }

                    // transform the global normal into local
                    if ( pickInfo && pickInfo.normal ) {
                        localNormal = goog.vec.Mat4.multVec3Projective( transform, pickInfo.normal, 
                            goog.vec.Vec3.create() );
                    } else {
                        localNormal = undefined;  
                    }

                    if ( worldCamPos ) { 
                        relativeCamPos = goog.vec.Mat4.multVec3Projective( transform, worldCamPos, 
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
                
                // TODO: Navigation - see main "TODO: Navigation" comment for explanation
                startMousePosition = event.eventData[ 0 ].position;
                // END TODO
            }
            e.preventDefault();
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
            if ( eData !== undefined ) {
                var mouseUpObjectID = pointerPickID;
                if ( mouseUpObjectID && pointerDownID && mouseUpObjectID == pointerDownID ) {
                    sceneView.kernel.dispatchEvent( mouseUpObjectID, "pointerClick", eData.eventData, eData.eventNodeData );

                    // TODO: hierarchy output, helpful for setting up applications
                    var objNode = sceneView.state.nodes[mouseUpObjectID];
                    var obj3js = objNode.threeObject;
                    if ( obj3js ) {
                        if ( atlDown && !ctrlDown ) {
                            var colladaParent = obj3js;
                            while ( colladaParent.parent ) {
                                if ( colladaParent.loadedColladaNode ) {
                                    break;
                                } else {
                                    colladaParent = colladaParent.parent;
                                }
                            }
                            if ( colladaParent === undefined ) {
                                colladaParent = obj3js;
                            }
                            console.info( "===== YAML ===== START" );
                            recurseObject3D.call( sceneView, colladaParent, "", 0 );
                            console.info( "===== YAML ===== END" );
                            console.info( "===== JSON ===== START" );
                            recurseJsonObject3D.call( sceneView, colladaParent, "", 0 );
                            console.info( "===== JSON ===== END" );
                            console.info( "===== THREEJS ===== START" );
                            consoleScene.call( this, sceneNode.threeScene, 0 ); 
                            console.info( "===== THREEJS ===== END" );
                        }
                    }
                } else {
                    if ( atlDown && !ctrlDown ) {
                        recurseObject3D.call( sceneView, sceneNode.threeScene, "", 0 );

                        consoleScene.call( this, sceneNode.threeScene, 0 ); 
                    }                    
                }
                sceneView.kernel.dispatchEvent( pointerDownID, "pointerUp", eData.eventData, eData.eventNodeData );
            }

            if ( !( mouseLeftDown || mouseRightDown || mouseMiddleDown ) ) {
                pointerDownID = undefined;

                // TODO: Navigation - see main "TODO: Navigation" comment for explanation
                startMousePosition = undefined;
                // END TODO
            }

            e.preventDefault();
        }

        canvas.onmouseover = function( e ) {
            self.mouseOverCanvas = true;
            var eData = getEventData( e, false );
            if ( eData ) {
                pointerOverID = pointerPickID ? pointerPickID : sceneID;
                var buttonStates = eData.eventData[ 0 ].buttons;
                mouseLeftDown = buttonStates.left;
                mouseRightDown = buttonStates.right;
                mouseMiddleDown = buttonStates.middle;
                sceneView.kernel.dispatchEvent( pointerOverID, "pointerOver", eData.eventData, eData.eventNodeData );
            }
            e.preventDefault();
        }

        canvas.onmousemove = function( e ) {
            var eData = getEventData( e, false );
            
            if ( eData ) {
                if ( mouseLeftDown || mouseRightDown || mouseMiddleDown ) {
                
                    // TODO: Navigation - see main "TODO: Navigation" comment for explanation
                    handleMouseNavigation( eData.eventData );
                    // END TODO

                    sceneView.kernel.dispatchEvent( pointerDownID, "pointerMove", eData.eventData, eData.eventNodeData );
                } else {
                    if ( pointerPickID ) {
                        if ( pointerOverID ) {
                            if ( pointerPickID != pointerOverID ) {
                                sceneView.kernel.dispatchEvent( pointerOverID, "pointerOut", eData.eventData, eData.eventNodeData );
                                pointerOverID = pointerPickID;
                                sceneView.kernel.dispatchEvent( pointerOverID, "pointerOver", eData.eventData, eData.eventNodeData );
                            }
                        } else {
                            pointerOverID = pointerPickID;
                            sceneView.kernel.dispatchEvent( pointerOverID, "pointerOver", eData.eventData, eData.eventNodeData );
                        }
                    } else {
                        if ( pointerOverID ) {
                            sceneView.kernel.dispatchEvent( pointerOverID, "pointerOut", eData.eventData, eData.eventNodeData );
                            pointerOverID = undefined;
                        }
                    }
                }
            }
            e.preventDefault();
        }

        canvas.onmouseout = function( e ) {
            if ( pointerOverID ) {
                sceneView.kernel.dispatchEvent( pointerOverID, "pointerOut" );
                pointerOverID = undefined;
            }
            self.mouseOverCanvas = false;
            e.preventDefault();
        }

        canvas.setAttribute( "onmousewheel", '' );
        
        
        window.onkeydown = function (event) {
                    
                    var key = undefined;
                    var validKey = false;
                    var keyAlreadyDown = false;
                    switch ( event.keyCode ) {
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

                            // TODO: Navigation - see main "TODO: Navigation" comment for explanation
                            handleKeyNavigation( event.keyCode, true );
                            // END TODO

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

                            // TODO: Navigation - see main "TODO: Navigation" comment for explanation
                            handleKeyNavigation( event.keyCode, false );
                            // END TODO

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

        window.oncontextmenu = function() {
            if ( navmode == "none" )
                return true;
            else
                return false;
        }
        
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

        // TODO: Navigation - This section should become a view component as soon as that system is available
        //       When altering this, search for other sections that say "TODO: Navigation"

        this.translationSpeed = 100; // Units per second
        this.rotationSpeed = 90; // Degrees per second
        var degreesToRadians = Math.PI / 180;
        var movingForward = false;
        var movingBack = false;
        var movingLeft = false;
        var movingRight = false;
        var rotatingLeft = false;
        var rotatingRight = false;
        var startMousePosition;

        this.moveNavObject = function( msSinceLastFrame ) {

            var x = 0;
            var y = 0;

            // Calculate the movement increments
            if ( movingForward )
                y += 1;
            if ( movingBack )
                y -= 1;
            if ( movingLeft )
                x -= 1;
            if ( movingRight )
                x += 1;

            // If there is no movement since last frame, return
            if ( ! ( x || y ) )
                return;

            // Compute the distance traveled in the elapsed time
            // Constrain the time to be less than 0.5 seconds, so that if a user has a very low frame rate, 
            // one key press doesn't send them off in space
            var dist = this.translationSpeed * Math.min( msSinceLastFrame * 0.001, 0.5 );

            // Get the camera's rotation matrix in the world's frame of reference
            // (remove its translation component so it is just a rotation matrix)
            var camera = this.state.cameraInUse;
            var cameraWorldTransformArray = camera.matrixWorld.elements;
            var camWorldRotMat = goog.vec.Mat4.createFromArray( cameraWorldTransformArray );
            camWorldRotMat[ 12 ] = 0;
            camWorldRotMat[ 13 ] = 0;
            camWorldRotMat[ 14 ] = 0;

            // Calculate a unit direction vector in the camera's parent's frame of reference
            var moveVectorInCameraFrame = goog.vec.Vec4.createFromValues( x, 0, -y, 1 ); // Accounts for z-up (VWF) to y-up (three.js) change
            moveVectorInCameraFrame = goog.vec.Vec4.createFromValues( x, 0, -y, 1 ); // Accounts for z-up (VWF) to y-up (three.js) change
            var dir = goog.vec.Mat4.multVec4( camWorldRotMat, moveVectorInCameraFrame,
                                              goog.vec.Vec3.create() );
            
            // If user is walking, constrain movement to the horizontal plane
            if ( navmode == "walk") {
                dir[ 2 ] = 0;
            }

            goog.vec.Vec3.normalize( dir, dir );
            
            // Extract the navObject world position so we can add to it
            var navThreeObject = navObject.threeObject;
            var navObjectWorldTransformMatrixArray = navThreeObject.matrixWorld.elements;
            var navObjectWorldPos = [ navObjectWorldTransformMatrixArray[ 12 ], 
                                      navObjectWorldTransformMatrixArray[ 13 ], 
                                      navObjectWorldTransformMatrixArray[ 14 ] ];
            
            // Take the direction and apply a calculated magnitude 
            // to that direction to compute the displacement vector
            var translation = goog.vec.Vec3.scale( dir, dist, goog.vec.Vec3.create() );

            // Add the displacement to the current camera position
            goog.vec.Vec3.add( navObjectWorldPos, translation, navObjectWorldPos );

            // Insert the new camera position in the camera transform
            navObjectWorldTransformMatrixArray[ 12 ] = navObjectWorldPos [ 0 ];
            navObjectWorldTransformMatrixArray[ 13 ] = navObjectWorldPos [ 1 ];
            navObjectWorldTransformMatrixArray[ 14 ] = navObjectWorldPos [ 2 ];

            // Update the navigation object's local transform from its new world transform
            setTransformFromWorldTransform( navThreeObject );

            setModelTransformProperty( navObject, navThreeObject.matrix.elements );
        }

        this.rotateNavObjectByKey = function( msSinceLastFrame ) {

            var direction = 0;

            // Calculate movement increment
            if ( rotatingLeft )
                direction += 1;
            if ( rotatingRight )
                direction -= 1;

            // If there is no rotation this frame, return
            if ( !direction )
                return;

            // Compute the distance rotated in the elapsed time
            // Constrain the time to be less than 0.5 seconds, so that if a user has a very low frame rate, 
            // one key press doesn't send them off in space
            var theta = direction * ( this.rotationSpeed * degreesToRadians ) * 
                        Math.min( msSinceLastFrame * 0.001, 0.5 );

            var cos = Math.cos( theta );
            var sin = Math.sin( theta );
            var rotation = [  cos, sin, 0, 0,
                             -sin, cos, 0, 0,
                                0,   0, 1, 0,
                                0,   0, 0, 1 ];
            
            // Left multiply the current transform matrix by the rotation transform
            // and assign the result back to the navObject's transform
            var navThreeObject = navObject.threeObject;
            var navObjectTransform = navThreeObject.matrix.elements;

            // Save the camera position so we can reinstitute it after the rotation
            // (effectively rotating the camera in place rather than around its origin)
            var navObjectPos = [ navObjectTransform[ 12 ], 
                                 navObjectTransform[ 13 ], 
                                 navObjectTransform[ 14 ] ];

            // Perform the rotation
            goog.vec.Mat4.multMat( rotation, navObjectTransform, navObjectTransform );

            // Put the original camera position back
            navObjectTransform[ 12 ] = navObjectPos[ 0 ];
            navObjectTransform[ 13 ] = navObjectPos[ 1 ];
            navObjectTransform[ 14 ] = navObjectPos[ 2 ];

            // Force the camera's world transform to update from its local transform
            updateRenderObjectTransform( navThreeObject );
            setModelTransformProperty( navObject, navObjectTransform );
        }

        var handleKeyNavigation = function( keyCode, keyIsDown ) {
            switch ( keyCode ) {
                case 87:  //w
                case 38:  //up
                    movingForward = keyIsDown;
                    break;
                case 83:  //s
                case 40:  //down
                    movingBack = keyIsDown;
                    break;
                case 37: // left              
                case 65:  //a
                    movingLeft = keyIsDown;
                    break;
                case 39: // right              
                case 68:  //d
                    movingRight = keyIsDown;
                    break;
                case 81: // q
                    rotatingLeft = keyIsDown;
                    break;
                case 69: // e
                    rotatingRight = keyIsDown;
                    break;
                case 82: // r
                    break;
                case 67: // c
                    break;
            }
        }

        var handleMouseNavigation = function( mouseEventData ) {

            if ( mouseEventData[ 0 ].buttons.right ) {
                var currentMousePosition = mouseEventData[ 0 ].position;
                var deltaX = currentMousePosition[ 0 ] - startMousePosition [ 0 ];
                var deltaY = currentMousePosition[ 1 ] - startMousePosition [ 1 ];
                var yawQuat = new THREE.Quaternion();
                var pitchQuat = new THREE.Quaternion();
                var rotationSpeedRadians = degreesToRadians * sceneView.rotationSpeed;

                // deltaX is negated because a positive change (to the right) generates a negative rotation 
                // around the vertical z axis (clockwise as viewed from above)
                yawQuat.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), -deltaX * rotationSpeedRadians );

                // deltaY is negated because a positive change (downward) generates a negative rotation 
                // around the horizontal x axis (clockwise as viewed from the right)
                pitchQuat.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), -deltaY * rotationSpeedRadians );
                var yawMatrix = new THREE.Matrix4();
                yawMatrix.makeRotationFromQuaternion( yawQuat );
                var pitchMatrix = new THREE.Matrix4();
                pitchMatrix.makeRotationFromQuaternion( pitchQuat );

                // Perform pitch on camera - right-multiply to keep pitch separate from yaw
                var camera = sceneView.state.cameraInUse;
                if ( camera ) {
                    var cameraMatrix = camera.matrix;
                    var cameraPos = new THREE.Vector3();
                    cameraPos.getPositionFromMatrix( cameraMatrix );
                    cameraMatrix.multiply( pitchMatrix );

                    // Constrain the camera's pitch to +/- 90 degrees
                    var camWorldMatrix = camera.matrixWorld;
                    var camWorldMatrixElements = camWorldMatrix.elements;

                    // We need to do something if zAxis.z is < 0
                    // This can get a little weird because this matrix is in three.js coordinates, but we care
                    // about VWF coordinates:
                    // -the VWF y-axis is the three.js -z axis 
                    // -the VWF z-axis is the three.js y axis
                    if ( camWorldMatrixElements[ 6 ] < 0 ) {

                        var xAxis = goog.vec.Vec3.create();
                        xAxis = goog.vec.Vec3.setFromArray( xAxis, [ camWorldMatrixElements[ 0 ], 
                                                                     camWorldMatrixElements[ 1 ], 
                                                                     camWorldMatrixElements[ 2 ] ] );

                        var yAxis = goog.vec.Vec3.create();

                        // If forward vector is tipped up
                        if ( camWorldMatrixElements[ 10 ] > 0 ) {
                            yAxis = goog.vec.Vec3.setFromArray( yAxis, [ 0, 0, -1 ] );
                        } else {
                            yAxis = goog.vec.Vec3.setFromArray( yAxis, [ 0, 0, 1 ] );
                        }

                        // Calculate the zAxis as a crossProduct of x and y
                        var zAxis = goog.vec.Vec3.cross( xAxis, yAxis, goog.vec.Vec3.create() );

                        // Put these values back in the camera matrix
                        camWorldMatrixElements[ 4 ] = zAxis[ 0 ];
                        camWorldMatrixElements[ 5 ] = zAxis[ 1 ];
                        camWorldMatrixElements[ 6 ] = zAxis[ 2 ];
                        camWorldMatrixElements[ 8 ] = -yAxis[ 0 ];
                        camWorldMatrixElements[ 9 ] = -yAxis[ 1 ];
                        camWorldMatrixElements[ 10 ] = -yAxis[ 2 ];

                        setTransformFromWorldTransform( camera );
                    }

                    // Restore camera position so rotation is done around camera center
                    cameraMatrix.setPosition( cameraPos );
                    updateRenderObjectTransform( camera );

                    // If the navObject is the camera, its new transform will be sent to the reflector 
                    // all at once at the end
                    // If not (here below), we need to send a separate message to the reflector to set 
                    // the pitch on the camera
                    if ( navObject !== cameraNode ) {
                        setModelTransformProperty( cameraNode, cameraMatrix.elements );
                    }
                } else {
                    self.logger.warnx( "There is no camera to move" );
                }

                // Perform yaw on nav object - left-multiply to keep yaw separate from pitch
                if ( navObject ) {
                    var navObjectMatrix = navObject.threeObject.matrix;
                    var navObjectPos = new THREE.Vector3();
                    navObjectPos.getPositionFromMatrix( navObjectMatrix );
                    navObjectMatrix.multiplyMatrices( yawMatrix, navObjectMatrix );
                    navObjectMatrix.setPosition( navObjectPos );
                    updateRenderObjectTransform( navObject.threeObject );
                    setModelTransformProperty( navObject, navObjectMatrix.elements );
                } else {
                    self.logger.warnx( "There is no navigation object to move" );
                }

                startMousePosition = currentMousePosition;
            }
        }

        // END TODO

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
                        sceneView.kernel.createChild( sceneView.kernel.application(), fileName, object );
                    }

                } catch ( e ) {
                    // TODO: invalid JSON
                }

            }
        };
         
    };

    function ThreeJSPick( canvas, sceneNode, debug )
    {
        if(!this.lastEventData) return;

        var threeCam = this.state.cameraInUse;
        if ( !threeCam ) {
            this.logger.errorx( "Cannot perform pick because there is no camera to pick from" );
            return;
        }

        if(!this.raycaster) this.raycaster = new THREE.Raycaster();
        if(!this.projector) this.projector = new THREE.Projector();
        
        var SCREEN_HEIGHT = window.innerHeight;
        var SCREEN_WIDTH = window.innerWidth;

        var mousepos = { x: this.lastEventData.eventData[0].position[0], y: this.lastEventData.eventData[0].position[1] }; // window coordinates
        //mousepos = utility.coordinates.contentFromWindow( canvas, mousepos ); // canvas coordinates

        var x = ( mousepos.x ) * 2 - 1;
        var y = -( mousepos.y ) * 2 + 1;

        var directionVector = new THREE.Vector3();
        
        //console.info( "mousepos = " + x + ", " + y );
        directionVector.set( x, y, 0.5 );
        
        this.projector.unprojectVector(directionVector, threeCam);
        var pos = new THREE.Vector3();
        pos.getPositionFromMatrix( threeCam.matrix );
        directionVector.sub(pos);
        directionVector.normalize();
        
        
        this.raycaster.set(pos, directionVector);
        var intersects = this.raycaster.intersectObjects(sceneNode.threeScene.children, true);
        if (intersects.length) {
            var target = intersects[0].object;
            if ( debug ) {
                for ( var i = 0; i < intersects.length; i++ ) { 
                    console.info( i + ". " + intersects[i].object.name ) 
                }
            }            
            // intersections are, by default, ordered by distance,
            // so we only care for the first one. The intersection
            // object holds the intersection point, the face that's
            // been "hit" by the ray, and the object to which that
            // face belongs. We only care for the object itself.

            
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

    function indentStr() {
        return "  ";
    }

    function indent(iIndent) {
        var sOut = "";
        for ( var j = 0; j < iIndent; j++ ) { 
            sOut = sOut + indentStr.call( this ); 
        }
        return sOut;
    }

    function indent2(iIndent) {
        var sOut = "";
        var idt = indentStr.call( this )
        for ( var j = 0; j < iIndent; j++ ) { 
            sOut = sOut + idt + idt; 
        }
        return sOut;
    }    

    function getObjectType( object3 ) {
        var type = "object3D";
        if ( object3 instanceof THREE.Camera ) {
            type = "camera"
        } else if ( object3 instanceof THREE.Light ) {
            type = "light"
        } else if ( object3 instanceof THREE.Mesh ) {
            type = "mesh"
        } else if ( object3 instanceof THREE.Scene ) {
            type = "scene";
        }
        return type;
    }

    function getExtendType( object3 ) {
        var exts = "extends: http://vwf.example.com/node3.vwf";
        if ( object3 instanceof THREE.Camera ) {
            exts = "extends: http://vwf.example.com/camera.vwf"
        } else if ( object3 instanceof THREE.Light ) {
            exts = "extends: http://vwf.example.com/light.vwf"
        }
        return exts;
    }

    function consoleOut( msg ) {
        console.info( msg );
        //this.logger.info( msg );
    }

    function getBindableCount( object3 ) {
        var count = 0, tp ;
        if ( object3 instanceof THREE.Mesh ){
            count++;
        }
        for ( var i = 0; i < object3.children.length; i++ ) {
            tp = getObjectType.call( this, object3.children[i] );
            if ( object3.children[i].name != "" ) { 
                count++; 
            }
         }
         //consoleOut.call( this, count + " = getBindableCount( "+object3.name+" )");
         return count;
    }

    function recurseJsonObject3D( object3, parentName, depth ) {
 
        var tp = getObjectType.call( this, object3 );
        if ( object3 && object3.name != "" ) {
            var sOut = indent.call( this, depth );
            var sIndent = indent.call( this, depth+1 );

            var bindCount = ( object3.children !== undefined ) ? getBindableCount.call( this, object3 ) : 0;

            consoleOut.call( this, sOut + object3.name + ": {");
            consoleOut.call( this, sIndent + getExtendType.call( this, object3 ) );

            if ( bindCount > 0 ) {
                var recursedCount = 0;
                consoleOut.call( this, sIndent + "children: {" );
                for ( var i = 0; i < object3.children.length; i++ ) {
                    depth++;
                    recurseJsonObject3D.call( this, object3.children[i], object3.name, depth + 1 );
                    depth--;
                    recursedCount++;
                }
                if ( tp == "mesh" ) {
                    outputJsonMaterial.call( this, depth+2, 0 );
                }
                consoleOut.call( this, sIndent + "}," );
            }
            consoleOut.call( this, sOut + "}," );
        }

    }

    function outputJsonMaterial( iIndent, index ) {
        var sOut = indent.call( this, iIndent + 1 );
        consoleOut.call( this, indent.call( this, iIndent) + "material" + ( index > 0 ? index : "" ) + ": {" );
        consoleOut.call( this, sOut + "extends: http://vwf.example.com/material.vwf" );
        consoleOut.call( this, indent.call( this, iIndent) + "}," );
    }

    function outputObject3D( object3, parentName, iIndent ) {
        var sOut = indent.call( this, iIndent + 1);
        var tp = getObjectType.call( this, object3 );
        var bindCount = ( object3.children !== undefined ) ? getBindableCount.call( this, object3 ) : 0;

        if ( object3.name != "" ) {
            consoleOut.call( this, indent.call( this, iIndent ) + object3.name + ":");
            consoleOut.call( this, sOut + getExtendType.call( this, object3 ) );

            if ( bindCount > 0 ) {
                consoleOut.call( this, sOut + "children: " );
                if ( tp == "mesh" ) {
                    // need to check the multimaterial list here
                    outputMaterial.call( this, iIndent + 2, 0 );
                }
            }
        }
    }

    function recurseObject3D( object3, parentName, depth ) {
 
        var tp = getObjectType.call( this, object3 );
        if ( object3 ) {
            var sOut = indent.call( this, depth );
            outputObject3D.call( this, object3, parentName, depth );
            if ( getBindableCount.call( this, object3 ) > 0 ) {
                for ( var i = 0; i < object3.children.length; i++ ) {
                    depth++;
                    recurseObject3D.call( this, object3.children[i], object3.name, depth + 1 );
                    depth--;
                }
            }                
        }

    }

    function outputMaterial( iIndent, index ) {
        var sOut = indent.call( this, iIndent + 1 );
        consoleOut.call( this, indent.call( this, iIndent) + "material" + ( index > 0 ? index : "" ) + ":" );
        consoleOut.call( this, sOut + "extends: http://vwf.example.com/material.vwf" );
    }    

    function consoleObject( object3, depth ) {
        consoleOut.call( this, indent2.call( this, depth ) + object3.name + " -> " + "        type = " + getObjectType.call( this, object3 ) );
    }

    function consoleScene( parent, depth ) {
        consoleObject.call( this, parent, depth );
        for ( var i = 0; i < parent.children.length; i++ ) {
            consoleScene.call( this, parent.children[i], depth+1 );
        }
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
                key.key = "openbracket";
                key.char = "{";
                break;
            case 220:
                key.key = "backslash";
                key.char = "\\";
                break;
            case 221:
                key.key = "closebracket";
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

    var navObject = undefined;
    var cameraNode = undefined;

    function controlNavObject( node ) {
      
        if ( !node ) {
            this.logger.error( "Attempted to control non-existent navigation object" );
            return;
        }

        var sceneView = this;

        // Set the new navigation object
        navObject = node;
        
        // Search for a camera in the navigation object and if it exists, make it active
        var cameraIds = sceneView.kernel.find( navObject.ID, 
                                               "descendant-or-self::element(*,'http://vwf.example.com/camera.vwf')" );
        if ( cameraIds.length ) {

            // Set the view's active camera
            var rendererState = sceneView.state;
            var cameraId = cameraIds[ 0 ];
            cameraNode = rendererState.nodes[ cameraId ];
            rendererState.cameraInUse = cameraNode.threeObject;
        }

        // Request the navigation mode from the navigation object
        vwf_view.kernel.getProperty( navObject.ID, "navmode" );
    }

    function findNavObject() {

        // Find the navigable objects in the scene
        var sceneView = this;
        var sceneRootID = sceneView.state.sceneRootID;
        var navObjectIds = sceneView.kernel.find( sceneRootID,
                                              ".//element(*,'http://vwf.example.com/navigable.vwf')" );
        numNavCandidates = navObjectIds.length;

        // If there are navigation objects in the scene, get their owner property values (The rest of the logic
        // of choosing the correct navigation object is in the gotProperty call for owner)
        // Else, retrieve the userObject property so we may create a navigation object from it for this user
        if ( numNavCandidates ) {
            for ( var i = 0; i < numNavCandidates; i++ ) {
                sceneView.kernel.getProperty( navObjectIds[ i ], "owner" );
            }
        } else {
            sceneView.kernel.getProperty( sceneRootID, "userObject" );
        }
    }

     
    // Receive Model Transform Changes algorithm 
    // 1.0 If (own view changes) then IGNORE (only if no external changes have occurred since the user’s view 
    //       requested this change – otherwise, will need to treat like 1.1 or 1.2)
    // 1.1 Elseif (other external changes and no outstanding own view changes) then ADOPT
    // 1.2 Else Interpolate to the model’s transform (conflict b/w own view and external sourced model changes)
    
    function receiveModelTransformChanges( nodeID, transformMatrix ) {

        var node = this.state.nodes[ nodeID ];

        // If the node does not exist in the state's list of nodes, then this update is from a prototype and we
        // should ignore it
        if ( !node ) {
            return;
        }

        var clientThatSatProperty = this.kernel.client();
        var me = this.kernel.moniker();
        

        // If the transform property was initially updated by this view....
        if ( clientThatSatProperty == me ) {
            
            // If updates have come in from other clients between the time that the view updated and now, it is
            // considered stale and has been overwritten.  Thus, it needs to be applied again.
            // Else, it has already been applied by the view and can be ignored (just decrement the number of 
            // outstanding requests)
            if ( node.staleTransformRequestsToBeApplied ) {
                node.staleTransformRequestsToBeApplied--;
                adoptTransform( node, transformMatrix );   
            } else {  // no stale transform requests
                if ( node.outstandingTransformRequestToBeIgnored ) {
                    node.outstandingTransformRequestToBeIgnored--;
                } else {

                    // We have not created a view-side update that this model-side one corresponds to
                    // Therefore, we must adopt this update
                    // (It appears to come from us because it is part of the initialization process)
                    adoptTransform( node, transformMatrix );

                    // Initialize variable
                    node.outstandingTransformRequestToBeIgnored = 0;
                }
            }
        } else { // this transform change request is not from me
            
            // If the view has already made updates that should have been applied after this incoming one, move
            // them to count of "stale" ones (meaning that they have been undone and will need to be reapplied)
            // Then overwrite them w/ this incoming transform
            // Else, just adopt this incoming transform
            if ( node.outstandingTransformRequestToBeIgnored ) {
                node.staleTransformRequestsToBeApplied = node.staleTransformRequestsToBeApplied || 0;
                node.staleTransformRequestsToBeApplied += node.outstandingTransformRequestToBeIgnored;
                node.outstandingTransformRequestToBeIgnored = 0;
                adoptTransform( node, transformMatrix );  
            } else { 

                // TODO: Smooth the transform toward the matrix specified by the other client
                //       Be careful: right now this is where a setState will enter when the user
                //       first joins - perhaps treat that case differently afte detecting that 
                //       client() is undefined?

                adoptTransform( node, transformMatrix );
            }
        }
    }

    function adoptTransform ( node, transform ) {

        var transformMatrix = matCpy( transform );
        var threeObject = node.threeObject;

        // Rotate 90 degrees around X to convert from VWF Z-up to three.js Y-up.
        if ( threeObject instanceof THREE.Camera ) {
            
            // Get column y and z out of the matrix
            var columny = goog.vec.Vec4.create();
            goog.vec.Mat4.getColumn( transformMatrix, 1, columny );
            var columnz = goog.vec.Vec4.create();
            goog.vec.Mat4.getColumn( transformMatrix, 2, columnz );

            // Swap the two columns, negating columny
            goog.vec.Mat4.setColumn( transformMatrix, 1, columnz );
            goog.vec.Mat4.setColumn( transformMatrix, 2, goog.vec.Vec4.negate( columny, columny ) );

        } else if( threeObject instanceof THREE.ParticleSystem ) {

            // I don't see where this function is defined. Maybe a copy-paste bug from
            // GLGE driver? - Eric (5/13/13)
            threeObject.updateTransform( transformMatrix );
        }

        threeObject.matrix.elements = transformMatrix;
        updateRenderObjectTransform( threeObject );
    }

    function matCpy( mat ) {
        var ret = [];
        if ( mat ) {
            for ( var i =0; i < mat.length; i++ )
                ret.push( mat[ i ] );
        }
        return ret;
    }

    function setModelTransformProperty( node, transformArray ) {
        var nodeID = node.ID;

        if ( nodeID ) {

            var transform = matCpy( transformArray );

            // If this threeObject is a camera, it has a 90-degree rotation on it to account for the different 
            // coordinate systems of VWF and three.js.  We need to undo that rotation before setting the VWF 
            // property.
            if ( node.threeObject instanceof THREE.Camera ) {
                                    
                // Get column y and z out of the matrix
                var columny = goog.vec.Vec4.create();
                goog.vec.Mat4.getColumn( transform, 1, columny );
                var columnz = goog.vec.Vec4.create();
                goog.vec.Mat4.getColumn( transform, 2, columnz );

                // Swap the two columns, negating columny
                goog.vec.Mat4.setColumn( transform, 1, goog.vec.Vec4.negate( columnz, columnz ) );
                goog.vec.Mat4.setColumn( transform, 2, columny );
            }

            vwf_view.kernel.setProperty( nodeID, "transform", transform );
            node.outstandingTransformRequestToBeIgnored = node.outstandingTransformRequestToBeIgnored || 0;
            node.outstandingTransformRequestToBeIgnored++;
        } else {
            view.logger.error( "Cannot set property on node that does not have a valid ID" );
        }
    }

    function setTransformFromWorldTransform( threeObject ) {
        var inverseParentWorldMatrix = new THREE.Matrix4();
        inverseParentWorldMatrix.getInverse( threeObject.parent.matrixWorld );
        threeObject.matrix.multiplyMatrices( inverseParentWorldMatrix, threeObject.matrixWorld );
        updateRenderObjectTransform( threeObject );
    }

    function updateRenderObjectTransform( threeObject ) {
        threeObject.updateMatrixWorld( true );
        threeObject.matrixAutoUpdate = false;
    }
});