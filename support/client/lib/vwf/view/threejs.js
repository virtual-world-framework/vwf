
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

define( [ "module", 
          "vwf/view", 
          "vwf/utility", 
          "hammer", 
          "jquery" 
    ], function( module, view, utility, Hammer, $ ) {

    var self;

    // Navigation: Private global variables for navigation
    var navObjectRequested;
    var navObjectName;
    var navmode;
    var touchmode;
    var ownerlessNavObjects = [];
    var numNavCandidates;
    var translationSpeed = 100; // Units per second
    var rotationSpeed = 90; // Degrees per second
    var makeOwnAvatarVisible = false;
    var pointerLockImplemented = "pointerLockElement" in document ||
                                 "mozPointerLockElement" in document ||
                                 "webkitPointerLockElement" in document;
    var pointerLocked = false;
    var pickDirection = undefined;
    var raycaster = undefined;
    var pitchMatrix;
    var rollMatrix;
    var yawMatrix;
    var translationMatrix;
    var positionUnderMouseClick;
    var boundingBox = undefined;
    var userObjectRequested = false;
    var usersShareView = true;
    var degreesToRadians = Math.PI / 180;
    var movingForward = false;
    var movingBack = false;
    var movingLeft = false;
    var movingRight = false;
    var rotatingLeft = false;
    var rotatingRight = false;
    var startMousePosition;
    var startTouchPosition;

    // HACK: This is to deal with an issue with webkitMovementX in Chrome:
    // https://code.google.com/p/chromium/issues/detail?id=386791&thanks=386791&ts=1403213097
    // where the two values after pointerLock are inaccurate.
    // This is used to ignore those values.
    // Please check frequently to see if this can be removed.
    // Last checked status of issue on 6/19/14.
    var nextMouseMoveIsErroneous = false;
    var nextTwoMouseMovesAreErroneous = false;
    // END HACK

    // End Navigation

    var lastXPos = -1;
    var lastYPos = -1;
    var mouseDown = {
        left: false,
        right: false,
        middle: false
    };
    var touchGesture = false;
    var prevGesture = undefined;

    var Vec3 = goog.vec.Vec3;
    var Quaternion = goog.vec.Quaternion;
    return view.load( module, {

        initialize: function( options ) {
            
            self = this;

            checkCompatibility.call(this);

            this.state.appInitialized = false;

            this.pickInterval = 10;
            this.disableInputs = false;
            this.applicationWantsPointerEvents = false;

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
            if ( window && window.innerHeight ) this.height = window.innerHeight;
            if ( window && window.innerWidth ) this.width = window.innerWidth;
            this.keyStates = { keysDown: {}, mods: {}, keysUp: {} };

            pitchMatrix = new THREE.Matrix4();
            rollMatrix = new THREE.Matrix4();
            yawMatrix = new THREE.Matrix4();
            translationMatrix = new THREE.Matrix4();
            pickDirection = new THREE.Vector3();
            raycaster = new THREE.Raycaster();
        
            window._dView = this;
            this.nodes = {};
            this.interpolateTransforms = true;
            this.tickTime = 0;
            this.realTickDif = 50;
            this.lastrealTickDif = 50;
            this.lastRealTick = performance.now();
            this.leftover = 0;
            
        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */) {
            
            //the created node is a scene, and has already been added to the state by the model.
            //how/when does the model set the state object? 
            if ( this.state.scenes[ childID ] )
            {                
                this.canvasQuery = $(this.rootSelector).append("<canvas id='" + this.state.sceneRootID + "' width='"+this.width+"' height='"+this.height+"' class='vwf-scene'/>"
                ).children(":last");
                
                initScene.call(this,this.state.scenes[childID]);
            }
            else if (this.state.scenes[ this.kernel.application() ] && this.state.scenes[ this.kernel.application() ].camera.ID == childID) {
                setActiveCamera.call(this, this.state.scenes[ this.kernel.application() ].camera.ID);
            }
        
            if(this.state.nodes[childID] && this.state.nodes[childID].threeObject instanceof THREE.Object3D) {
                this.nodes[childID] = {id:childID,extends:childExtendsID};
            }
        },

        initializedNode: function( nodeID, childID ) {

            // If the node that was initialized is the application node, find the user's navigation object
            var appID = this.kernel.application();
            if ( childID == appID ) {
                this.state.appInitialized = true;
            } else {

                //TODO: This is a temporary workaround until the callback functionality is implemented for 
                //      kernel.createChild()
                //      Listening specifically for this.findNavObject>>createChild() creating a new navObject if 
                //      one does not exist.
                //      Can be removed once kernel.createChild callback works properly
                var initNode = this.state.nodes[ childID ];
                if ( initNode && ( initNode.name == navObjectName ) ) {
                    initNode.owner = this.kernel.moniker();
                    controlNavObject( initNode );
                }
            }
            //End TODO
        },
 
 
        // -- deletedNode ------------------------------------------------------------------------------

        deletedNode: function(childID)
        {
            delete this.nodes[childID];
        },

        // -- addedChild -------------------------------------------------------------------------------

        //addedChild: function( nodeID, childID, childName ) { },

        // -- removedChild -----------------------------------------------------------------------------

        //removedChild: function( nodeID, childID ) { },

        // -- createdProperty --------------------------------------------------------------------------

        //createdProperty: function (nodeID, propertyName, propertyValue) { },

        // -- initializedProperty ----------------------------------------------------------------------

        initializedProperty: function ( nodeID, propertyName, propertyValue ) { 
            this.satProperty(nodeID, propertyName, propertyValue);
        },

        // TODO: deletedProperty

        // -- satProperty ------------------------------------------------------------------------------

        satProperty: function ( nodeID, propertyName, propertyValue ) {         
            // If this is this user's navObject, pay attention to changes in navmode, translationSpeed, and 
            // rotationSpeed
            if ( navObject && ( nodeID == navObject.ID ) ) {
                if ( propertyName == "navmode" ) {
                    navmode = propertyValue;
                    if ( pointerLockImplemented && !self.appRequestsPointerLock( navmode, mouseDown ) ) {
                        document.exitPointerLock();
                    }
                } else if ( propertyName == "translationSpeed" ) {
                    translationSpeed = propertyValue;
                } else if ( propertyName == "rotationSpeed" ) {
                    rotationSpeed = propertyValue;
                }
            } else if ( nodeID == this.kernel.application() ) {
                if ( propertyName == "makeOwnAvatarVisible" ) {
                    makeOwnAvatarVisible = propertyValue;
                    if ( navObject ) {
                        setVisibleRecursively( navObject.threeObject, makeOwnAvatarVisible );
                    }
                } else if ( propertyName == "boundingBox" ) {
                    boundingBox = propertyValue;
                } else if ( propertyName == "activeCamera" ) {
                    setActiveCamera.call(this, this.state.scenes[ this.kernel.application() ].camera.ID);
                } else if ( propertyName == "usersShareView" ) {
                    usersShareView = propertyValue;
                }
            } 

            // Pay attention to these properties for all nodes
            if ( propertyName == "transform" ) {
                receiveModelTransformChanges( nodeID, propertyValue );
            } else if ( propertyName == "lookAt") {

                var node = this.state.nodes[ nodeID ];

                // If the state knows about the node, it is in the scene and should be updated
                // Otherwise, it is a prototype and can be ignored
                if ( node ) {
                    nodeLookAt( node );
                }
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
                                controlNavObject( navCandidate );
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
                                    controlNavObject( ownerlessNavObjects[ 0 ] );
                                } else {

                                    // Retrieve the userObject property so we may create a navigation object from 
                                    // it for this user (the rest of the logic is in the gotProperty call for 
                                    // userObject)
                                    this.kernel.getProperty( sceneRootID, "userObject" );
                                    userObjectRequested = true;
                                }
                            }
                        }
                    }
                } else if ( propertyName == "userObject" ) {

                    if ( userObjectRequested ) {
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
                            controlNavObject( this.state.nodes[ nodeID ] );
                        } */ );

                        userObjectRequested = false;
                    }                    
                } else if ( propertyName == "makeOwnAvatarVisible" ) {
                    makeOwnAvatarVisible = propertyValue;
                    if ( navObject ) {
                        setVisibleRecursively( navObject.threeObject, makeOwnAvatarVisible );
                    }
                } else if ( propertyName == "boundingBox" ) {
                    boundingBox = propertyValue;
                } else if ( navObject && ( nodeID == navObject.ID ) ) {
                    
                    // These were requested in controlNavObject

                    if ( propertyName == "navmode" ) {
                        navmode = propertyValue;
                    } else if ( propertyName == "touchmode" ) {
                        touchmode = propertyValue;
                    } else if ( propertyName == "translationSpeed" ) {
                        translationSpeed = propertyValue;
                    } else if ( propertyName == "rotationSpeed" ) {
                        rotationSpeed = propertyValue;
                    }
                }
            }
        },

        // -- calledMethod -----------------------------------------------------------------------------

        calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {
            switch(methodName) {
                case "translateBy":
                case "translateTo":
                // No need for rotateBy or rotateTo because they call the quaternion methods
                case "quaterniateBy":
                case "quaterniateTo":
                case "scaleBy":
                case "scaleTo":
                // No need for transformBy or worldTransformBy because they call transformTo and worldTransformTo
                case "transformTo":
                case "worldTransformTo":
                    // If the duration of the transform is 0, set the transforms to their final value so it doesn't interpolate
                    if(methodParameters.length < 2 || methodParameters[1] == 0) {
                        this.nodes[nodeID].lastTickTransform = getTransform(nodeID);
                        this.nodes[nodeID].selfTickTransform = goog.vec.Mat4.clone(this.nodes[nodeID].lastTickTransform);
                    }
                    break;
            }
        },

        // -- addedEventListener -------------------------------------------------------------------

        addedEventListener: function( nodeID, eventName, eventHandler, eventContextID, eventPhases ) {
            switch( eventName ) {
                case "pointerClick":
                case "pointerDown":
                case "pointerMove":
                case "pointerUp":
                case "pointerOver":
                case "pointerOut":
                case "pointerWheel":
                case "touchHold":
                case "touchTap":
                case "touchDoubleTap":
                case "touchDrag":
                case "touchDragStart":
                case "touchDragEnd":
                case "touchDragUp":
                case "touchDragDown":
                case "touchDragLeft":
                case "touchDragRight":
                case "touchSwipe":
                case "touchSwipeUp":
                case "touchSwipeDown":
                case "touchSwipeLeft":
                case "touchSwipeRight":
                case "touchTransform":
                case "touchTransformStart":
                case "touchTransformEnd":
                case "touchRotate":
                case "touchPinch":
                case "touchPinchIn":
                case "touchPinchOut":
                case "touchStart":
                case "touchRelease":
                    if ( this.kernel.find( nodeID, 
                            "self::element(*,'http://vwf.example.com/node3.vwf')" ).length || 
                        this.kernel.find( nodeID,
                            "self::element(*,'http://vwf.example.com/scene.vwf')" ).length ) {
                        this.applicationWantsPointerEvents = true;
                    }
                    break;
            }
       },

        // -- firedEvent -----------------------------------------------------------------------------

        firedEvent: function( nodeID, eventName ) {
            if ( eventName == "changingTransformFromView" ) {
                var clientThatSatProperty = self.kernel.client();
                var me = self.kernel.moniker();

                // If the transform property was initially updated by this view....
                if ( clientThatSatProperty == me ) {
                    var node = this.state.nodes[ nodeID ];
                    node.ignoreNextTransformUpdate = true;
                }
            }
            else if (eventName == "resetViewport") {
                if(this.state.scenes[nodeID]) {
                    this.state.scenes[nodeID].renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
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
            if ( !navObjectRequested && this.state.appInitialized ) {
                navObjectRequested = true;
                findNavObject();
            }
            
            lerpTick();      
        },

        // -- render -----------------------------------------------------------------------------------

        render: function( renderer, scene, camera ) {
            renderer.render( scene, camera );
        },
    
        // -- Navigation -------------------------------------------------------------------------------

        navigationKeyMapping: {
            "w": "forward",
            "a": "left",
            "s": "back",
            "d": "right",
            "uparrow": "forward",
            "leftarrow": "left",
            "downarrow": "back",
            "rightarrow": "right",
            "q": "rotateLeft",
            "e": "rotateRight"
        },      

        handleMouseNavigation: function( deltaX, deltaY, navObj, navMode, rotationSpeed, translationSpeed, mouseDown, mouseEventData ) {
            var yawQuat = new THREE.Quaternion();
            var pitchQuat = new THREE.Quaternion();
            var rotationSpeedRadians = degreesToRadians * rotationSpeed;

            var orbiting = mouseDown.middle && ( navmode == "fly" );

            // We will soon want to use the yawMatrix and pitchMatrix,
            // so let's update them
            extractRotationAndTranslation( navObject.threeObject );

            if ( orbiting ) {
                var pitchRadians = deltaY * rotationSpeedRadians;
                var yawRadians = deltaX * rotationSpeedRadians;
                orbit( pitchRadians, yawRadians );
            } else if ( mouseDown.right ) {
                var navThreeObject = navObj.threeObject;

                // --------------------
                // Calculate new pitch
                // --------------------

                // deltaY is negated because a positive change (downward) generates a negative rotation 
                // around the horizontal x axis (clockwise as viewed from the right)
                pitchQuat.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), -deltaY * rotationSpeedRadians );
                var pitchDeltaMatrix = new THREE.Matrix4();
                pitchDeltaMatrix.makeRotationFromQuaternion( pitchQuat );

                if ( ( navMode == "fly" )  ||
                     ( ( navMode == "walk" ) && ( cameraNode == navObj ) ) ) {
                    pitchMatrix.multiplyMatrices( pitchDeltaMatrix, pitchMatrix );

                    // Constrain the camera's pitch to +/- 90 degrees
                    // We need to do something if zAxis.z is < 0
                    var pitchMatrixElements = pitchMatrix.elements;
                    if ( pitchMatrixElements[ 10 ] < 0 ) {

                        var xAxis = goog.vec.Vec3.create();
                        xAxis = goog.vec.Vec3.setFromArray( xAxis, [ pitchMatrixElements[ 0 ], 
                                                                     pitchMatrixElements[ 1 ], 
                                                                     pitchMatrixElements[ 2 ] ] );

                        var yAxis = goog.vec.Vec3.create();

                        // If forward vector is tipped up
                        if ( pitchMatrixElements[ 6 ] > 0 ) {
                            yAxis = goog.vec.Vec3.setFromArray( yAxis, [ 0, 0, 1 ] );
                        } else {
                            yAxis = goog.vec.Vec3.setFromArray( yAxis, [ 0, 0, -1 ] );
                        }

                        // Calculate the zAxis as a crossProduct of x and y
                        var zAxis = goog.vec.Vec3.cross( xAxis, yAxis, goog.vec.Vec3.create() );

                        // Put these values back in the camera matrix
                        pitchMatrixElements[ 4 ] = yAxis[ 0 ];
                        pitchMatrixElements[ 5 ] = yAxis[ 1 ];
                        pitchMatrixElements[ 6 ] = yAxis[ 2 ];
                        pitchMatrixElements[ 8 ] = zAxis[ 0 ];
                        pitchMatrixElements[ 9 ] = zAxis[ 1 ];
                        pitchMatrixElements[ 10 ] = zAxis[ 2 ];
                    }
                } else if ( navMode == "walk" ) {

                    // Perform pitch on camera - right-multiply to keep pitch separate from yaw
                    var camera = self.state.cameraInUse;
                    if ( camera ) {
                        var cameraMatrix = camera.matrix;
                        var originalCameraTransform = goog.vec.Mat4.clone( cameraMatrix.elements );
                        var cameraPos = new THREE.Vector3();
                        cameraPos.setFromMatrixPosition( cameraMatrix );
                        cameraMatrix.multiply( pitchDeltaMatrix );

                        // Constrain the camera's pitch to +/- 90 degrees
                        var camWorldMatrix = camera.matrixWorld;
                        var camWorldMatrixElements = camWorldMatrix.elements;

                        // We need to do something if zAxis.z is < 0
                        // This can get a little weird because this matrix is in three.js coordinates, 
                        // but we care about VWF coordinates:
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
                        callModelTransformBy( cameraNode, originalCameraTransform, 
                                              cameraMatrix.elements );
                    } else {
                        self.logger.warnx( "There is no camera to move" );
                    }
                }

                // ------------------
                // Calculate new yaw
                // ------------------

                // deltaX is negated because a positive change (to the right) generates a negative rotation 
                // around the vertical z axis (clockwise as viewed from above)
                yawQuat.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), -deltaX * rotationSpeedRadians );
                var yawDeltaMatrix = new THREE.Matrix4();
                yawDeltaMatrix.makeRotationFromQuaternion( yawQuat );
                yawMatrix.multiplyMatrices( yawDeltaMatrix, yawMatrix );

                // -------------------------------------------------
                // Put all components together and set the new pose
                // -------------------------------------------------
                                    
                var navObjectWorldMatrix = navObject.threeObject.matrixWorld;
                navObjectWorldMatrix.multiplyMatrices( yawMatrix, pitchMatrix );
                navObjectWorldMatrix.multiplyMatrices( translationMatrix, navObjectWorldMatrix );
                if ( navObject.threeObject instanceof THREE.Camera ) {
                    var navObjWrldTrnsfmArr = navObjectWorldMatrix.elements;
                    navObjectWorldMatrix.elements = convertCameraTransformFromVWFtoThreejs( navObjWrldTrnsfmArr );
                }
            }
        },

        handleScroll: function ( wheelDelta, navObj, navMode, rotationSpeed, translationSpeed, distanceToTarget ) {
            
            if ( navMode !== "fly" ) {
                return;
            }

            var orbiting = ( navMode == "fly" ) && ( mouseDown.middle )

            if ( orbiting || !pickDirection ) {
                return;
            }

            var navThreeObject = navObj.threeObject;
            
            // wheelDelta has a value of 3 for every click
            var numClicks = Math.abs( wheelDelta / 3 );

            // Prepare variables for calculation
            var dist = Math.min( Math.max( distanceToTarget || translationSpeed, 
                                           2 * self.state.cameraInUse.near ),
                                 9 * translationSpeed );
            var percentDistRemainingEachStep = 0.8;
            var amountToMove = 0;

            // If wheelDelta is negative, user pushed wheel forward - move toward the object
            // Else, user pulled wheel back - move away from object
            if ( wheelDelta < 0 ) { 
                amountToMove = dist * ( 1 - Math.pow( percentDistRemainingEachStep, numClicks ) );
            } else {
                amountToMove = dist * ( 1 - Math.pow( 1 / percentDistRemainingEachStep, numClicks ) );
            }

            // We are about to use the translationMatrix, so let's update it
            extractRotationAndTranslation( navObject.threeObject );

            var translationArray = translationMatrix.elements;
            translationArray[ 12 ] += amountToMove * pickDirection.x;
            translationArray[ 13 ] += amountToMove * pickDirection.y;
            translationArray[ 14 ] += amountToMove * pickDirection.z;
            if ( boundingBox != undefined ) {
                if ( translationArray[ 12 ] < boundingBox[ 0 ][ 0 ] ) {
                    translationArray[ 12 ] = boundingBox[ 0 ][ 0 ];
                }
                else if ( translationArray[ 12 ] > boundingBox[ 0 ][ 1 ] ) {
                    translationArray[ 12 ] = boundingBox[ 0 ][ 1 ];
                }
                if ( translationArray[ 13 ] < boundingBox[ 1 ][ 0 ] ) {
                    translationArray[ 13 ] = boundingBox[ 1 ][ 0 ];
                }
                else if ( translationArray[ 13 ] > boundingBox[ 1 ][ 1 ] ) {
                    translationArray[ 13 ] = boundingBox[ 1 ][ 1 ];
                }
                if ( translationArray[ 14 ] < boundingBox[ 2 ][ 0 ] ) {
                    translationArray[ 14 ] = boundingBox[ 2 ][ 0 ];
                }
                else if ( translationArray[ 14 ] > boundingBox[ 2 ][ 1 ] ) {
                    translationArray[ 14 ] = boundingBox[ 2 ][ 1 ];
                }
            }
            var worldTransformArray = navThreeObject.matrixWorld.elements;
            worldTransformArray[ 12 ] = translationArray[ 12 ];
            worldTransformArray[ 13 ] = translationArray[ 13 ];
            worldTransformArray[ 14 ] = translationArray[ 14 ];
        },

        handleTouchNavigation: function ( touchEventData ) {

            var currentMousePosition = touchEventData[ 0 ].position;

            var deltaX = 0;
            var deltaY = 0;

            if ( startTouchPosition ) {
                deltaX = currentMousePosition[ 0 ] - startTouchPosition [ 0 ];
                deltaY = currentMousePosition[ 1 ] - startTouchPosition [ 1 ];
            }

            // We will soon want to use the yawMatrix and pitchMatrix,
            // so let's update them
            extractRotationAndTranslation( navObject.threeObject );

            if ( deltaX || deltaY ) {
                var yawQuat = new THREE.Quaternion();
                var pitchQuat = new THREE.Quaternion();
                var rotationSpeedRadians = degreesToRadians * rotationSpeed;

                if ( touchmode == "orbit" ) {
                    var pitchRadians = deltaY * rotationSpeedRadians;
                    var yawRadians = deltaX * rotationSpeedRadians;
                    orbit( pitchRadians, yawRadians );
                } else if ( touchmode == "look" ) {
                    if ( navObject ) {

                        var navThreeObject = navObject.threeObject;
                        var originalTransform = goog.vec.Mat4.clone( navThreeObject.matrix.elements );

                        // --------------------
                        // Calculate new pitch
                        // --------------------

                        // deltaY is negated because a positive change (downward) generates a negative rotation 
                        // around the horizontal x axis (clockwise as viewed from the right)
                        pitchQuat.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), -deltaY * rotationSpeedRadians );
                        var pitchDeltaMatrix = new THREE.Matrix4();
                        pitchDeltaMatrix.makeRotationFromQuaternion( pitchQuat );

                        if ( ( touchmode == "look" )  ||
                             ( ( touchmode == "orbit" ) && ( cameraNode == navObject ) ) ) {
                            pitchMatrix.multiplyMatrices( pitchDeltaMatrix, pitchMatrix );

                            // Constrain the camera's pitch to +/- 90 degrees
                            // We need to do something if zAxis.z is < 0
                            var pitchMatrixElements = pitchMatrix.elements;
                            if ( pitchMatrixElements[ 10 ] < 0 ) {

                                var xAxis = goog.vec.Vec3.create();
                                xAxis = goog.vec.Vec3.setFromArray( xAxis, [ pitchMatrixElements[ 0 ], 
                                                                             pitchMatrixElements[ 1 ], 
                                                                             pitchMatrixElements[ 2 ] ] );

                                var yAxis = goog.vec.Vec3.create();

                                // If forward vector is tipped up
                                if ( pitchMatrixElements[ 6 ] > 0 ) {
                                    yAxis = goog.vec.Vec3.setFromArray( yAxis, [ 0, 0, 1 ] );
                                } else {
                                    yAxis = goog.vec.Vec3.setFromArray( yAxis, [ 0, 0, -1 ] );
                                }

                                // Calculate the zAxis as a crossProduct of x and y
                                var zAxis = goog.vec.Vec3.cross( xAxis, yAxis, goog.vec.Vec3.create() );

                                // Put these values back in the camera matrix
                                pitchMatrixElements[ 4 ] = yAxis[ 0 ];
                                pitchMatrixElements[ 5 ] = yAxis[ 1 ];
                                pitchMatrixElements[ 6 ] = yAxis[ 2 ];
                                pitchMatrixElements[ 8 ] = zAxis[ 0 ];
                                pitchMatrixElements[ 9 ] = zAxis[ 1 ];
                                pitchMatrixElements[ 10 ] = zAxis[ 2 ];
                            }
                        } 

                        // ------------------
                        // Calculate new yaw
                        // ------------------

                        // deltaX is negated because a positive change (to the right) generates a negative rotation 
                        // around the vertical z axis (clockwise as viewed from above)
                        yawQuat.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), -deltaX * rotationSpeedRadians );
                        var yawDeltaMatrix = new THREE.Matrix4();
                        yawDeltaMatrix.makeRotationFromQuaternion( yawQuat );
                        yawMatrix.multiplyMatrices( yawDeltaMatrix, yawMatrix );

                        // -------------------------------------------------
                        // Put all components together and set the new pose
                        // -------------------------------------------------
                                            
                        var navObjectWorldMatrix = navThreeObject.matrixWorld;
                        navObjectWorldMatrix.multiplyMatrices( yawMatrix, pitchMatrix );
                        navObjectWorldMatrix.multiplyMatrices( translationMatrix, navObjectWorldMatrix );
                        if ( navThreeObject instanceof THREE.Camera ) {
                            var navObjWrldTrnsfmArr = navObjectWorldMatrix.elements;
                            navObjectWorldMatrix.elements = convertCameraTransformFromVWFtoThreejs( navObjWrldTrnsfmArr );
                        }
                        setTransformFromWorldTransform( navObject.threeObject );
                        callModelTransformBy( navObject, originalTransform, navThreeObject.matrix.elements );
                    } else {
                        self.logger.warnx( "handleTouchNavigation: There is no navigation object to move" );
                    }

                }
            } 
            startTouchPosition = currentMousePosition;
        },

        appRequestsPointerLock: function( navmode, mouseDown ) {

            // By default, an app will request pointer lock when:
            //   - the middle mouse button is hit in fly mode (for orbit)
            //   - the right mouse button is hit in any mode other than "none" (for look)

            if ( mouseDown.middle && ( navmode === "fly" ) ) {
                return true;
            }
            if ( mouseDown.right && ( navmode !== "none" ) ) {
                return true;
            }
            return false;
        }
    } );

    // private ===============================================================================

    var navObject = undefined;
    var cameraNode = undefined;
    function lerpTick () {
        var now = performance.now();
        self.realTickDif = now - self.lastRealTick;

        self.lastRealTick = now;
 
        //reset - loading can cause us to get behind and always but up against the max prediction value
        self.tickTime = 0;

        for ( var nodeID in self.nodes ) {
            if ( self.state.nodes[nodeID] ) {       
                self.nodes[nodeID].lastTickTransform = self.nodes[nodeID].selfTickTransform;
                self.nodes[nodeID].selfTickTransform = getTransform(nodeID);
            }
        }
    }
    function lerp(a,b,l,c) {
        if(c) l = Math.min(1,Math.max(l,0));
        return (b*l) + a*(1.0-l);
    }
    function matCmp (a,b,delta) {
        for(var i =0; i < 16; i++) {
            if(Math.abs(a[i] - b[i]) > delta)
                return false;
        }
        
        return true;
    }
    
    function rotMatFromVec(x,y,z) {
        var n = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1];
        n[0] = x[0];n[1] = x[1];n[2] = x[2];
        n[4] = y[0];n[5] = y[1];n[6] = y[2];
        n[8] = z[0];n[9] = z[1];n[10] = z[2];
        return n;
    }

    function isLeftHandedOrthogonalMatrix( elements ) {
        if ( !elements ) {
            throw new Error('matrix was null');
        }

        var xAxis = new THREE.Vector3(elements[0],elements[1],elements[2]);
        var yAxis = new THREE.Vector3(elements[4],elements[5],elements[6]);
        var zAxis = new THREE.Vector3(elements[8],elements[9],elements[10]);

        xAxis.normalize();
        yAxis.normalize();
        zAxis.normalize();

        var XYdotZ = xAxis.cross( yAxis ).dot( zAxis );

        if( XYdotZ > 0.999999 ) {
            return true;
        } else {
            return false;
        }
    }

    function matrixLerp( a, b, l ) {
        
        // If either of the matrices is not left-handed or not orthogonal, interpolation won't work
        // Just return the second matrix
        if ( !( isLeftHandedOrthogonalMatrix( a ) && isLeftHandedOrthogonalMatrix( b ) ) ) {
            return b;
        }
    
        var n = goog.vec.Mat4.clone(a);
        n[12] = lerp(a[12],b[12],l);
        n[13] = lerp(a[13],b[13],l);
        n[14] = lerp(a[14],b[14],l);
        
        var x = [a[0],a[1],a[2]];
        var xl = Vec3.magnitude(x);
        
        var y = [a[4],a[5],a[6]];
        var yl = Vec3.magnitude(y);
        
        var z = [a[8],a[9],a[10]];
        var zl = Vec3.magnitude(z);
        
        
        var x2 = [b[0],b[1],b[2]];
        var xl2 = Vec3.magnitude(x2);
        
        var y2 = [b[4],b[5],b[6]];
        var yl2 = Vec3.magnitude(y2);
        
        var z2 = [b[8],b[9],b[10]];
        var zl2 = Vec3.magnitude(z2);
        
        var nxl = lerp(xl,xl2,l);
        var nyl = lerp(yl,yl2,l);
        var nzl = lerp(zl,zl2,l);
        
        x = Vec3.normalize(x,[]);
        y = Vec3.normalize(y,[]);
        z = Vec3.normalize(z,[]);
        
        x2 = Vec3.normalize(x2,[]);
        y2 = Vec3.normalize(y2,[]);
        z2 = Vec3.normalize(z2,[]);
        
        var q = Quaternion.fromRotationMatrix4(rotMatFromVec(x,y,z),[]);
        var q2 = Quaternion.fromRotationMatrix4(rotMatFromVec(x2,y2,z2),[]);
        
        var nq = Quaternion.slerp(q,q2,l,[]);
        var nqm = Quaternion.toRotationMatrix4(nq,[]);
        
        
        var nx = [nqm[0],nqm[1],nqm[2]];
        var ny = [nqm[4],nqm[5],nqm[6]];
        var nz = [nqm[8],nqm[9],nqm[10]];
        
        nx = Vec3.scale(nx,nxl,[]);
        ny = Vec3.scale(ny,nyl,[]);
        nz = Vec3.scale(nz,nzl,[]);
        
        
        nqm = rotMatFromVec(nx,ny,nz);
        
        nqm[12] = n[12];
        nqm[13] = n[13];
        nqm[14] = n[14];
        
        return nqm;
    }
    function getTransform(id) {
        var interp = goog.vec.Mat4.clone(self.state.nodes[id].threeObject.matrix.elements);
        return interp;
    }
    function setTransform(id,interp) {
        interp = goog.vec.Mat4.clone(interp)
        self.state.nodes[id].threeObject.matrix.elements = interp;
        self.state.nodes[id].threeObject.updateMatrixWorld(true);
    }
    function setInterpolatedTransforms(deltaTime) {
        var step = (self.tickTime) / (self.realTickDif);
        step = Math.min(step,1);
        deltaTime = Math.min(deltaTime, self.realTickDif)
        self.tickTime += deltaTime || 0;
        
        for(var nodeID in self.nodes) {
            var last = self.nodes[nodeID].lastTickTransform;
            var now = self.nodes[nodeID].selfTickTransform;
            if(last && now && !matCmp(last,now,.0001) ) {             
                var interp = matrixLerp(last, now, step || 0);
                
                var objectIsControlledByUser = ( ( navmode !== "none" ) &&
                                                 ( ( navObject && ( nodeID === navObject.ID ) ) || 
                                                   ( cameraNode && ( nodeID === cameraNode.ID ) ) ) );
                if ( !objectIsControlledByUser ) {             
                    setTransform(nodeID, interp);    
                    self.nodes[nodeID].needTransformRestore = true;
                }
            }
        }
    }
    function restoreTransforms() {
        for(var nodeID in self.nodes) {
            var now = self.nodes[nodeID].selfTickTransform;
            
            if(self.node != navObject &&  now && self.nodes[nodeID].needTransformRestore) {
                self.state.nodes[nodeID].threeObject.matrix.elements = goog.vec.Mat4.clone(now);
                self.state.nodes[nodeID].threeObject.updateMatrixWorld(true);
                self.nodes[nodeID].needTransformRestore = false;
            }
        }
    }

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

        function GetShaderMaterials(node,list)
        {
            if(!list)
                list = [];
            for(var i =0; i<node.children.length; i++)
            {
                if(node.children[i] instanceof THREE.Mesh && node.children[i].material instanceof THREE.ShaderMaterial)
                    list.push(node.children[i].material);
                list =  GetShaderMaterials(node.children[i],list);
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
            
            var now = performance.now();
            var timepassed = now - sceneNode.lastTime;
        
            if(self.interpolateTransforms) {
                setInterpolatedTransforms(timepassed);
            }

            if ( timepassed ) {

                var pss = GetParticleSystems(sceneNode.threeScene);
                for ( var i in pss )
                {
                    if(pss[i].update)
                        pss[i].update(timepassed);
                }
                
                var shaderMaterials = GetShaderMaterials( sceneNode.threeScene );
                for ( var i = 0; i < shaderMaterials.length; i++ ) {
                    if( shaderMaterials[ i ].updateFunction ) {
                        shaderMaterials[ i ].update();
                    }
                }

                if ( navmode != "none" && !self.disableInputs ) {

                    // Move the user's camera according to their input
                    inputMoveNavObject( timepassed );
                    inputRotateNavObjectByKey( timepassed );
                    
                    // If the camera has been created, turn it to look back at its lookat position after 
                    // moving/rotating
                    if ( cameraNode ) {
                        nodeLookAt( cameraNode );
                    }
                }
            }
            
            // Only do a pick every "pickInterval" ms. Defaults to 10 ms.
            // Note: this is a costly operation and should be optimized if possible
            if ( ( now - lastPickTime ) > self.pickInterval && !self.disableInputs )
            {
                sceneNode.frameCount = 0;
            
                var newPick, newPickId;

                if ( self.applicationWantsPointerEvents ) {
                    newPick = ThreeJSPick.call( self, mycanvas, sceneNode, false );
                    newPickId = newPick ? getPickObjectID.call( view, newPick.object ) : view.state.sceneRootID;
                } else {
                    newPick = undefined;
                    newPickId = undefined;
                }

                if ( self.lastPickId != newPickId && self.lastEventData )
                {
                    if ( self.lastPickId ) {
                        view.kernel.dispatchEvent( self.lastPickId, "pointerOut", 
                                                   self.lastEventData.eventData, 
                                                   self.lastEventData.eventNodeData );
                    }
                    if ( newPickId ) {
                        view.kernel.dispatchEvent( newPickId, "pointerOver",
                                                   self.lastEventData.eventData, 
                                                   self.lastEventData.eventNodeData );
                    }
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
                
                self.lastPickId = newPickId;
                self.lastPick = newPick;
                lastPickTime = now;
            }

            self.render(renderer, scene, camera);
            sceneNode.lastTime = now;
            
            if(self.interpolateTransforms) {
                restoreTransforms();        
            }
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
                var viewWidth = mycanvas.width / sceneNode.renderer.devicePixelRatio;
                var viewHeight = mycanvas.height / sceneNode.renderer.devicePixelRatio;

                if ( window && window.innerHeight ) self.height = window.innerHeight;
                if ( window && window.innerWidth ) self.width = window.innerWidth;

                if ( ( origWidth != self.width || origHeight != self.height ) ) {
                    // If canvas changed size, use canvas dimentions instead
                    if ( viewWidth != mycanvas.clientWidth || viewHeight != mycanvas.clientHeight ) {
                        self.width = mycanvas.clientWidth;
                        self.height = mycanvas.clientHeight;
                    }

                    sceneNode.renderer.setSize( self.width, self.height, true );
                }

                var viewCam = view.state.cameraInUse;
                if ( viewCam ) {
                    viewCam.aspect = mycanvas.clientWidth / mycanvas.clientHeight;
                    viewCam.updateProjectionMatrix();
                }
            }

            if(detectWebGL() && getURLParameter('disableWebGL') == 'null')
            {
                sceneNode.renderer = new THREE.WebGLRenderer({canvas:mycanvas,antialias:true});
            }else
            {
                sceneNode.renderer = new THREE.CanvasRenderer({canvas:mycanvas,antialias:true});
            }
            sceneNode.renderer.setSize(self.width,self.height,true);

            // backgroundColor, enableShadows, shadowMapCullFace and shadowMapType are dependent on the renderer object, but if they are set in a prototype,
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
                else if(key == 'shadowMapCullFace') {
                    sceneNode.renderer.shadowMapCullFace = Number( sceneNode.rendererProperties["shadowMapCullFace"] );
                }
                else if(key == 'shadowMapType') {
                    sceneNode.renderer.shadowMapType = Number( sceneNode.rendererProperties["shadowMapType"] );
                }
            }
            
            rebuildAllMaterials.call(this);
            if(sceneNode.renderer.setFaceCulling)
                sceneNode.renderer.setFaceCulling( THREE.CullFaceBack );

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
            this.state.appInitialized = true;
        }
    } // initScene

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

        var touchID = undefined;
        var touchPick = undefined;

        var pointerDownID = undefined;
        var pointerOverID = undefined;
        var pointerPickID = undefined;
        var threeActualObj = undefined;

        var win = window;

        var container = document.getElementById("container");
        var sceneCanvas = canvas;
        //var mouse = new GLGE.MouseInput( sceneCanvas );

        canvas.requestPointerLock = canvas.requestPointerLock ||
                                    canvas.mozRequestPointerLock ||
                                    canvas.webkitRequestPointerLock ||
                                    function() {};
        document.exitPointerLock = document.exitPointerLock ||
                                   document.mozExitPointerLock ||
                                   document.webkitExitPointerLock ||
                                   function() {};

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
                        left: mouseDown.left,
                        middle: mouseDown.middle,
                        right: mouseDown.right,
                    },
                gestures: touchGesture,
                modifiers: {
                        alt: e.altKey,
                        ctrl: e.ctrlKey,
                        shift: e.shiftKey,
                        meta: e.metaKey,
                    },
                position: [ mousePos.x / canvas.clientWidth, mousePos.y / canvas.clientHeight ],
                screenPosition: [ mousePos.x, mousePos.y ]
            } ];

            if ( pointerLocked ) {
                returnData.eventData.movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
                returnData.eventData.movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
            }

            var camera = sceneView.state.cameraInUse;
            var worldCamPos, worldCamTrans, camInverse;
            var localPickNormal, worldPickNormal, worldTransform;
            if ( camera ) { 
                var worldCamTrans = new THREE.Vector3();
                worldCamTrans.setFromMatrixPosition( camera.matrixWorld );

                // Convert THREE.Vector3 to array
                // QUESTION: Is the double use of y a bug?  I would assume so, but then why not
                //           just use worldCamTrans as-is?
                worldCamPos = [ worldCamTrans.x, worldCamTrans.y, worldCamTrans.z];
            }

            if ( pickInfo ) {
                if ( sceneView.state.nodes[ pointerPickID ] ) {

                    var pickObj = sceneView.state.nodes[ pointerPickID ];
                    var nml;

                    if ( pickObj.threeObject.matrixWorld ) {
                        worldTransform = goog.vec.Mat4.createFromArray( pickObj.threeObject.matrixWorld.elements );
                    } else {
                        worldTransform = goog.vec.Mat4.createFromArray( getWorldTransform( pickObj ).elements );
                    }

                    if ( pickInfo.face ) {
                        nml = pickInfo.face.normal
                        localPickNormal = goog.vec.Vec3.createFloat32FromValues( nml.x, nml.y, nml.z );
                    } else if ( pickInfo.normal ) {
                        nml = pickInfo.normal;
                        localPickNormal = goog.vec.Vec3.createFloat32FromValues( nml[0], nml[1], nml[2] );
                    }
                    
                    if ( localPickNormal !== undefined ) {
                        localPickNormal = goog.vec.Vec3.normalize( localPickNormal, goog.vec.Vec3.create() );
                        worldPickNormal = goog.vec.Mat4.multVec3NoTranslate( worldTransform, localPickNormal, goog.vec.Vec3.create() );    
                    }
                }
            }

            returnData.eventNodeData = { "": [ {
                pickID: pointerPickID,
                pointerVector: pickDirection ? vec3ToArray( pickDirection ) : undefined,
                distance: pickInfo ? pickInfo.distance : undefined,
                origin: pickInfo ? pickInfo.worldCamPos : undefined,
                globalPosition: pickInfo ? [pickInfo.point.x,pickInfo.point.y,pickInfo.point.z] : undefined,
                globalNormal: worldPickNormal ? worldPickNormal : localPickNormal,    //** not implemented by threejs
                globalSource: worldCamPos
            } ] };

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
                    if ( transform && pickInfo && pickInfo.face ) {
                        localNormal = goog.vec.Mat4.multVec3Projective( transform, pickInfo.face.normal, 
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
                        pickID: pointerPickID,
                        pointerVector: pickDirection ? vec3ToArray( pickDirection ) : undefined,
                        position: localTrans,
                        normal: localNormal,
                        source: relativeCamPos,
                        distance: pickInfo ? pickInfo.distance : undefined,
                        globalPosition: pickInfo ? [pickInfo.point.x,pickInfo.point.y,pickInfo.point.z] : undefined,
                        globalNormal: worldPickNormal ? worldPickNormal : localPickNormal,
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

        var getTouchEventData = function( e, debug ) {
            var returnData = { eventData: undefined, eventNodeData: undefined };

            var mousePos = utility.coordinates.contentFromWindow( e.target, { x: e.gesture.center.pageX, y: e.gesture.center.pageY } ); // canvas coordinates from window coordinates
            touchPick = ThreeJSTouchPick.call( self, canvas, sceneNode, mousePos );

            var pickInfo = touchPick;

            var gestureTouches = {};
            for (var i = 0; i < e.gesture.touches.length; i++) {
                gestureTouches[i] = {x: e.gesture.touches[i].clientX, y: e.gesture.touches[i].clientY};
                gestureTouches.length = i + 1;
            }

            returnData.eventData = [ {
                gestures: touchGesture,
                position: [ mousePos.x / sceneView.width, mousePos.y / sceneView.height ],
                screenPosition: [ mousePos.x, mousePos.y ],
                angle: e.gesture.angle,
                touches: gestureTouches
            } ];

            returnData.eventNodeData = { "": [ {
                distance: pickInfo ? pickInfo.distance : undefined,
                globalPosition: pickInfo ? [pickInfo.point.x,pickInfo.point.y,pickInfo.point.z] : undefined
            } ] };

            if ( returnData.eventNodeData[ "" ][ 0 ].globalPosition ) {
                positionUnderMouseClick = returnData.eventNodeData[ "" ][ 0 ].globalPosition;
            }

            self.lastEventData = returnData;
            return returnData;
        }       

        // Do not emulate mouse events on touch
        Hammer.NO_MOUSEEVENTS = true;

        $(canvas).hammer({ drag_lock_to_axis: false }).on("touch release", handleHammer);
        $(canvas).hammer({ drag_lock_to_axis: false }).on("hold tap doubletap", handleHammer);
        $(canvas).hammer({ drag_lock_to_axis: false }).on("drag dragstart dragend dragup dragdown dragleft dragright", handleHammer);
        $(canvas).hammer({ drag_lock_to_axis: false }).on("swipe swipeup swipedown swipeleft,swiperight", handleHammer);
        $(canvas).hammer({ drag_lock_to_axis: false }).on("transform transformstart transformend", handleHammer);
        $(canvas).hammer({ drag_lock_to_axis: false }).on("rotate", handleHammer);
        $(canvas).hammer({ drag_lock_to_axis: false }).on("pinch pinchin pinchout", handleHammer);

        function handleHammer( ev ) {
            // disable browser scrolling
            ev.gesture.preventDefault();

            var eData = getTouchEventData( ev, false );
            touchID = touchPick ? getPickObjectID.call( sceneView, touchPick.object, false ) : sceneID;

            switch(ev.type) {
                case 'hold':
                    sceneView.kernel.dispatchEvent( touchID, "touchHold", eData.eventData, eData.eventNodeData );
                    break;
                case 'tap':
                    sceneView.kernel.dispatchEvent( touchID, "touchTap", eData.eventData, eData.eventNodeData );
                    // Emulate pointer events
                    eData.eventData[0].button = "left"; 
                    sceneView.kernel.dispatchEvent( touchID, "pointerClick", eData.eventData, eData.eventNodeData );
                    sceneView.kernel.dispatchEvent( touchID, "pointerDown", eData.eventData, eData.eventNodeData );
                    sceneView.kernel.dispatchEvent( touchID, "pointerUp", eData.eventData, eData.eventNodeData );
                    break;
                case 'doubletap':
                    sceneView.kernel.dispatchEvent( touchID, "touchDoubleTap", eData.eventData, eData.eventNodeData );
                    break;
                case 'drag': 
                    // Fly or Orbit Navigation Behavior
                    if ( touchmode != "none") {
                        if ( prevGesture == "drag" || prevGesture == "dragleft" || prevGesture == "dragright") {
                            self.handleTouchNavigation( eData.eventData );
                        }
                    }
                    sceneView.kernel.dispatchEvent( touchID, "touchDrag", eData.eventData, eData.eventNodeData );
                    break;
                case 'dragstart':
                    sceneView.kernel.dispatchEvent( touchID, "touchDragStart", eData.eventData, eData.eventNodeData );
                    break;
                case 'dragend':
                    sceneView.kernel.dispatchEvent( touchID, "touchDragEnd", eData.eventData, eData.eventNodeData );
                    break;
                case 'dragup':
                    sceneView.kernel.dispatchEvent( touchID, "touchDragUp", eData.eventData, eData.eventNodeData );
                    break;
                case 'dragdown':
                    sceneView.kernel.dispatchEvent( touchID, "touchDragDown", eData.eventData, eData.eventNodeData );
                    break;
                case 'dragleft':
                    sceneView.kernel.dispatchEvent( touchID, "touchDragLeft", eData.eventData, eData.eventNodeData );
                    break;
                case 'dragright':
                    sceneView.kernel.dispatchEvent( touchID, "touchDragRight", eData.eventData, eData.eventNodeData );
                    break;
                case 'swipe':
                    sceneView.kernel.dispatchEvent( touchID, "touchSwipe", eData.eventData, eData.eventNodeData );
                    break;
                case 'swipeup':
                    sceneView.kernel.dispatchEvent( touchID, "touchSwipeUp", eData.eventData, eData.eventNodeData );
                    break;
                case 'swipedown':
                    sceneView.kernel.dispatchEvent( touchID, "touchSwipeDown", eData.eventData, eData.eventNodeData );
                    break;
                case 'swipeleft':
                    sceneView.kernel.dispatchEvent( touchID, "touchSwipeLeft", eData.eventData, eData.eventNodeData );
                    break;
                case 'swiperight':
                    sceneView.kernel.dispatchEvent( touchID, "touchSwipeRight", eData.eventData, eData.eventNodeData );
                    break;
                case 'transform':
                    sceneView.kernel.dispatchEvent( touchID, "touchTransform", eData.eventData, eData.eventNodeData );
                    break;
                case 'transformstart':
                    sceneView.kernel.dispatchEvent( touchID, "touchTransformStart", eData.eventData, eData.eventNodeData );
                    break;
                case 'transformend':
                    sceneView.kernel.dispatchEvent( touchID, "touchTransformEnd", eData.eventData, eData.eventNodeData );
                    break;
                case 'rotate':
                    sceneView.kernel.dispatchEvent( touchID, "touchRotate", eData.eventData, eData.eventNodeData );
                    break;
                case 'pinch':
                    sceneView.kernel.dispatchEvent( touchID, "touchPinch", eData.eventData, eData.eventNodeData );
                    break;
                case 'pinchin':
                    // Zoom Out
                    if ( touchmode != "none" ) {
                        inputHandleScroll( ev.gesture.scale, eData.eventNodeData[ "" ][ 0 ].distance );
                    }
                    sceneView.kernel.dispatchEvent( touchID, "touchPinchIn", eData.eventData, eData.eventNodeData );
                    break;
                case 'pinchout':
                    // Zoom In
                    if ( touchmode != "none" ) {
                        inputHandleScroll( -1 * ev.gesture.scale, eData.eventNodeData[ "" ][ 0 ].distance );
                    }
                    sceneView.kernel.dispatchEvent( touchID, "touchPinchOut", eData.eventData, eData.eventNodeData );
                    break;
                case 'touch':
                    touchGesture = true;
                    sceneView.kernel.dispatchEvent( touchID, "touchStart", eData.eventData, eData.eventNodeData );
                    break;
                case 'release':
                    touchGesture = false;
                    sceneView.kernel.dispatchEvent( touchID, "touchRelease", eData.eventData, eData.eventNodeData );
                    break;
            }

            // Set previous gesture (only perform drag if the previous is not a pinch gesture - causes jumpiness)
            prevGesture = ev.type;
        }

        canvas.onmousedown = function( e ) {

            // Set appropriate button / key states
            // Shift+click of any button is treated as the middle button to accomodate mice that
            // don't have a middle button
            var shiftDown = e.shiftKey;
            switch( e.button ) {
                case 0: // Left button
                    if ( shiftDown ) {
                        mouseDown.middle = true;
                    } else {
                        mouseDown.left = true;
                    }
                    break;
                case 1: // Middle button
                    mouseDown.middle = true;
                    break;
                case 2: // Right button
                    if ( shiftDown ) {
                        mouseDown.middle = true;
                    } else {
                        mouseDown.right = true;
                    }
                    break;
            };

            // Set pointerLock if appropriate
            var event = getEventData( e, false );           
            if ( pointerLockImplemented && self.appRequestsPointerLock( navmode, mouseDown ) ) {

                // HACK: This is to deal with an issue with webkitMovementX in Chrome:
                nextMouseMoveIsErroneous = true;
                nextTwoMouseMovesAreErroneous = true;
                // END HACK

                canvas.requestPointerLock();
                positionUnderMouseClick = event && event.eventNodeData[ "" ][ 0 ].globalPosition;
            }

            // Process mouse down event
            if ( event ) {
                pointerDownID = pointerPickID ? pointerPickID : sceneID;
                sceneView.kernel.dispatchEvent( pointerDownID, "pointerDown", event.eventData, event.eventNodeData );
                
                // TODO: Navigation - see main "TODO: Navigation" comment for explanation
                startMousePosition = event.eventData[ 0 ].position;
                // END TODO
            }
            e.preventDefault();
        }

        // Listen for onmouseup from the document (instead of the canvas like all the other mouse events)
        // because it will catch mouseup events that occur outside the window, whereas canvas.onmouseup does
        // not.
        document.onmouseup = function( e ) {

            // Set appropriate button / key states
            var ctrlDown = e.ctrlKey;
            var atlDown = e.altKey;
            var ctrlAndAltDown = ctrlDown && atlDown;
            
            // Shift+click w/ any button is considered a middle click to accomodate mice w/o a 
            // middle mouse button.  Therefore, if the left or right mouse button is released, 
            // but the system did not record that it was down, it must be a Shift+click for the 
            // middle mouse button that was released
            switch( e.button ) {
                case 0: // Left button
                    if ( mouseDown.left ) {
                        mouseDown.left = false;
                    } else {
                        mouseDown.middle = false;
                    }
                    break;
                case 1: // Middle button
                    mouseDown.middle = false;
                    break;
                case 2: // Right button
                    if ( mouseDown.right ) {
                        mouseDown.right = false;
                    } else {
                        mouseDown.middle = false;
                    }
                    break;
            };       

            // Release pointerLock if appropriate
            if ( pointerLockImplemented && !self.appRequestsPointerLock( navmode, mouseDown ) ) {
                document.exitPointerLock();
            }

            // Process mouse up event
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
                if ( pointerDownID ) {
                    sceneView.kernel.dispatchEvent( pointerDownID, "pointerUp", eData.eventData, 
                                                    eData.eventNodeData );
                }
            }

            if ( !( mouseDown.left || mouseDown.right || mouseDown.middle ) ) {
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
                sceneView.kernel.dispatchEvent( pointerOverID, "pointerOver", eData.eventData, eData.eventNodeData );
            }
            e.preventDefault();
        }

        canvas.onmousemove = function( e ) {

            // HACK: This is to deal with an issue with webkitMovementX in Chrome:
            if ( nextMouseMoveIsErroneous ) {
                if ( nextTwoMouseMovesAreErroneous ) {
                    nextTwoMouseMovesAreErroneous = false;
                } else {
                    nextMouseMoveIsErroneous = false;
                }
                return;
            }
            // END HACK

            var eData = getEventData( e, false );
            
            if ( eData ) {
                if ( mouseDown.left || mouseDown.right || mouseDown.middle ) {
                
                    // TODO: Navigation - see main "TODO: Navigation" comment for explanation
                    if ( navmode != "none" ) {
                        if ( cameraNode ) {
                            if ( !cameraNode.lookatval ) {
                                inputHandleMouseNavigation( eData.eventData );
                            }
                        } else {
                            self.logger.warnx( "canvas.onmousemove: camera does not exist" );
                        }
                    }
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
        
        window.onblur = function() {

            // Stop all key movement when window goes out of focus since key events are now going to a
            // different window
            movingForward = false;
            movingBack = false;
            movingLeft = false;
            movingRight = false;
            rotatingLeft = false;
            rotatingRight = false;
        }

        // As of this writing, Chrome and Opera Next use canvas.onmousewheel
        // Firefox uses canvas.onwheel
        if ( canvas.onmousewheel !== undefined ) {
            canvas.removeAttribute("onmousewheel");
            canvas.onmousewheel = function( e ) {
                var eData = getEventData( e, false );
                if ( eData ) {
                    var eventNodeData = eData.eventNodeData[ "" ][ 0 ];
                    eventNodeData.wheel = {
                        delta: e.wheelDelta / -40,
                        deltaX: e.wheelDeltaX / -40,
                        deltaY: e.wheelDeltaY / -40,
                    };
                    var id = sceneID;
                    if ( pointerDownID && mouseDown.right || mouseDown.left || mouseDown.middle )
                        id = pointerDownID;
                    else if ( pointerOverID )
                        id = pointerOverID; 
                        
                    sceneView.kernel.dispatchEvent( id, "pointerWheel", eData.eventData, eData.eventNodeData );

                    inputHandleScroll( eventNodeData.wheel.delta, eventNodeData.distance );
                }
            };
        } else if ( canvas.onwheel !== undefined ) {
            canvas.removeAttribute("onmousewheel");
            canvas.onwheel = function( e ) {
                var eData = getEventData( e, false );
                if ( eData ) {
                    
                    if ( e.deltaMode != 1 ) {
                        self.logger.warnx( "canvas.onwheel: This browser uses an unsupported deltaMode: " + 
                                           e.deltaMode );
                    }

                    var eventNodeData = eData.eventNodeData[ "" ][ 0 ];
                    eventNodeData.wheel = {
                        delta: e.deltaY,
                        deltaX: e.deltaX,
                        deltaY: e.deltaY,
                    };
                    var id = sceneID;
                    if ( pointerDownID && mouseDown.right || mouseDown.left || mouseDown.middle )
                        id = pointerDownID;
                    else if ( pointerOverID )
                        id = pointerOverID; 
                        
                    sceneView.kernel.dispatchEvent( id, "pointerWheel", eData.eventData, eData.eventNodeData );

                    inputHandleScroll( eventNodeData.wheel.delta, eventNodeData.distance );
                }
            };
        } else {
            this.logger.warnx( "initInputEvents: Neither onmousewheel nor onwheel are supported in this " +
                               "browser so mouse scrolling is not supported - request that the VWF team " +
                               "support the DOMMouseScroll event to support your browser" );
        }

        // TODO: Navigation - This section should become a view component as soon as that system is available
        //       When altering this, search for other sections that say "TODO: Navigation"

        var onPointerLockChange = function() {
            if ( document.pointerLockElement === canvas ||
                 document.mozPointerLockElement === canvas ||
                 document.webkitPointerLockElement === canvas ) {
                pointerLocked = true;
            } else {
                pointerLocked = false;
            }
        }

        document.addEventListener( "pointerlockchange", onPointerLockChange, false);
        document.addEventListener( "mozpointerlockchange", onPointerLockChange, false);
        document.addEventListener( "webkitpointerlockchange", onPointerLockChange, false);

        this.moveNavObject = function( x, y, navObj, navMode, rotationSpeed, translationSpeed, msSinceLastFrame ) {

            var navThreeObject = navObj.threeObject;

            // Compute the distance traveled in the elapsed time
            // Constrain the time to be less than 0.5 seconds, so that if a user has a very low frame rate, 
            // one key press doesn't send them off in space
            var dist = translationSpeed * Math.min( msSinceLastFrame * 0.001, 0.5 );
            var dir = [ 0, 0, 0 ];
            var camera = self.state.cameraInUse;
            var cameraWorldTransformArray = camera.matrixWorld.elements;

            var orbiting = ( navMode == "fly" ) && mouseDown.middle && positionUnderMouseClick;

            if ( orbiting ) {
                if ( y ) {

                    dir = [ positionUnderMouseClick[ 0 ] - cameraWorldTransformArray[ 12 ],
                            positionUnderMouseClick[ 1 ] - cameraWorldTransformArray[ 13 ],
                            positionUnderMouseClick[ 2 ] - cameraWorldTransformArray[ 14 ] ];

                    if ( y > 0 ) {
                        var distToOrbitTarget = Math.sqrt( dir[ 0 ] * dir[ 0 ] + dir[ 1 ] * dir[ 1 ] + dir[ 2 ] * dir[ 2 ] );
                        var epsilon = 0.01;
                        var almostDistToOrbit = distToOrbitTarget - epsilon;
                        if ( dist > almostDistToOrbit ) {
                            dist = almostDistToOrbit;
                        }
                        if ( dist < epsilon ) {
                            dir = [ 0, 0, 0 ];
                        }
                    } else {
                        dir = [ -dir[ 0 ], -dir[ 1 ], -dir[ 2 ] ];
                    }
                }
                if ( x ) {
                    var pitchRadians = 0;
                    var yawRadians = x * ( rotationSpeed * degreesToRadians ) * 
                                     Math.min( msSinceLastFrame * 0.001, 0.5 );
                    orbit( pitchRadians, yawRadians );
                }
            } else {

                // Get the camera's rotation matrix in the world's frame of reference
                // (remove its translation component so it is just a rotation matrix)
                
                var camWorldRotMat = goog.vec.Mat4.createFromArray( cameraWorldTransformArray );
                camWorldRotMat[ 12 ] = 0;
                camWorldRotMat[ 13 ] = 0;
                camWorldRotMat[ 14 ] = 0;

                // Calculate a unit direction vector in the camera's parent's frame of reference
                var moveVectorInCameraFrame = goog.vec.Vec4.createFromValues( x, 0, -y, 1 ); // Accounts for z-up (VWF) to y-up (three.js) change
                moveVectorInCameraFrame = goog.vec.Vec4.createFromValues( x, 0, -y, 1 ); // Accounts for z-up (VWF) to y-up (three.js) change
                dir = goog.vec.Mat4.multVec4( camWorldRotMat, moveVectorInCameraFrame, goog.vec.Vec3.create() );
            }
            
            // If user is walking, constrain movement to the horizontal plane
            if ( navMode == "walk") {
                dir[ 2 ] = 0;
            }

            var length = Math.sqrt( dir[ 0 ] * dir[ 0 ] + dir[ 1 ] * dir[ 1 ] + dir[ 2 ] * dir[ 2 ] );

            if ( length ) {

                goog.vec.Vec3.normalize( dir, dir );
                
                // Extract the navObject world position so we can add to it
                var navObjectWorldTransformMatrixArray = navThreeObject.matrixWorld.elements;
                var navObjectWorldPos = [ navObjectWorldTransformMatrixArray[ 12 ], 
                                          navObjectWorldTransformMatrixArray[ 13 ], 
                                          navObjectWorldTransformMatrixArray[ 14 ] ];
                
                // Take the direction and apply a calculated magnitude 
                // to that direction to compute the displacement vector
                var deltaTranslation = goog.vec.Vec3.scale( dir, dist, goog.vec.Vec3.create() );

                // Add the displacement to the current navObject position
                goog.vec.Vec3.add( navObjectWorldPos, deltaTranslation, navObjectWorldPos );

                if ( boundingBox != undefined ) {
                    if ( navObjectWorldPos[ 0 ] < boundingBox[ 0 ][ 0 ] ) {
                        navObjectWorldPos[ 0 ] = boundingBox[ 0 ][ 0 ];
                    }
                    else if ( navObjectWorldPos[ 0 ] > boundingBox[ 0 ][ 1 ] ) {
                        navObjectWorldPos[ 0 ] = boundingBox[ 0 ][ 1 ];
                    }
                    if ( navObjectWorldPos[ 1 ] < boundingBox[ 1 ][ 0 ] ) {
                        navObjectWorldPos[ 1 ] = boundingBox[ 1 ][ 0 ];
                    }
                    else if ( navObjectWorldPos[ 1 ] > boundingBox[ 1 ][ 1 ] ) {
                        navObjectWorldPos[ 1 ] = boundingBox[ 1 ][ 1 ];
                    }
                    if ( navObjectWorldPos[ 2 ] < boundingBox[ 2 ][ 0 ] ) {
                        navObjectWorldPos[ 2 ] = boundingBox[ 2 ][ 0 ];
                    }
                    else if ( navObjectWorldPos[ 2 ] > boundingBox[ 2 ][ 1 ] ) {
                        navObjectWorldPos[ 2 ] = boundingBox[ 2 ][ 1 ];
                    }
                }
                
                // We are about to use the translationMatrix, so let's update it
                extractRotationAndTranslation( navObject.threeObject );

                // Insert the new navObject position into the translation array
                var translationArray = translationMatrix.elements;
                translationArray[ 12 ] = navObjectWorldPos [ 0 ];
                translationArray[ 13 ] = navObjectWorldPos [ 1 ];
                translationArray[ 14 ] = navObjectWorldPos [ 2 ];

                // Since this translation already accounts for pitch and yaw, insert it directly into the navObject 
                // transform
                navObjectWorldTransformMatrixArray[ 12 ] = navObjectWorldPos [ 0 ];
                navObjectWorldTransformMatrixArray[ 13 ] = navObjectWorldPos [ 1 ];
                navObjectWorldTransformMatrixArray[ 14 ] = navObjectWorldPos [ 2 ];
            }
        }

        this.rotateNavObjectByKey = function( direction, navObj, navMode, rotationSpeed, translationSpeed, msSinceLastFrame ) {

            var navThreeObject = navObj.threeObject;

            // Compute the distance rotated in the elapsed time
            // Constrain the time to be less than 0.5 seconds, so that if a user has a very low frame rate, 
            // one key press doesn't send them off in space
            var theta = direction * ( rotationSpeed * degreesToRadians ) * 
                        Math.min( msSinceLastFrame * 0.001, 0.5 );

            var orbiting = ( navMode == "fly" ) && mouseDown.middle && positionUnderMouseClick;

            if ( orbiting ) {
                var pitchRadians = 0;
                var yawRadians = -theta;
                orbit( pitchRadians, yawRadians );
            } else {

                // We will soon want to use the yawMatrix and pitchMatrix,
                // so let's update them
                extractRotationAndTranslation( navObject.threeObject );

                var cos = Math.cos( theta );
                var sin = Math.sin( theta );
                var rotation = [  cos, sin, 0, 0,
                                 -sin, cos, 0, 0,
                                    0,   0, 1, 0,
                                    0,   0, 0, 1 ];
                
                // Left multiply the current transform matrix by the rotation transform
                // and assign the result back to the navObject's transform
                var yawArray = yawMatrix.elements;

                // Perform the rotation
                goog.vec.Mat4.multMat( rotation, yawArray, yawArray );

                // Construct the new transform from pitch, yaw, and translation
                var navObjectWorldTransform = navThreeObject.matrixWorld;
                navObjectWorldTransform.multiplyMatrices( yawMatrix, pitchMatrix );
                navObjectWorldTransform.multiplyMatrices( translationMatrix, navObjectWorldTransform );
                if ( navThreeObject instanceof THREE.Camera ) {
                    var navObjectWorldTransformArray = navObjectWorldTransform.elements;
                    navObjectWorldTransform.elements = convertCameraTransformFromVWFtoThreejs( navObjectWorldTransformArray );
                }
            }
        }

        var handleKeyNavigation = function( keyCode, keyIsDown ) {

            var key = getKeyValue( keyCode ).key;
            key = key && key.toLowerCase();

            switch ( self.navigationKeyMapping[ key ] ) {
                case "forward":
                    movingForward = keyIsDown;
                    break;
                case "back":
                    movingBack = keyIsDown;
                    break;
                case "left":
                    movingLeft = keyIsDown;
                    break;
                case "right":
                    movingRight = keyIsDown;
                    break;
                case "rotateLeft":
                    rotatingLeft = keyIsDown;
                    break;
                case "rotateRight":
                    rotatingRight = keyIsDown;
                    break;
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


    // TODO: is this function needed?
    // seems to be an exact copy of the ThreeJSPick
    // should be tested and removed if this is not needed
    function ThreeJSTouchPick ( canvas, sceneNode, mousepos )
    {
        if(!this.lastEventData) return;

        var threeCam = this.state.cameraInUse;
        if ( !threeCam ) {
            this.logger.errorx( "Cannot perform pick because there is no camera to pick from" );
            return;
        }

        var intersects = undefined;
         var mousepos = { 
            "x": this.lastEventData.eventData[0].position[0], 
            "y": this.lastEventData.eventData[0].position[1] 
        }; // window coordinates

        var x = ( mousepos.x ) * 2 - 1;
        var y = -( mousepos.y ) * 2 + 1;

        pickDirection.set( x, y, threeCam.near );

        var camPos = new THREE.Vector3(
            threeCam.matrixWorld.elements[ 12 ],  
            threeCam.matrixWorld.elements[ 13 ], 
            threeCam.matrixWorld.elements[ 14 ]  
        );

        pickDirection.unproject( threeCam );
        raycaster.ray.set( camPos, pickDirection.sub( camPos ).normalize() );
        intersects = raycaster.intersectObjects( sceneNode.threeScene.children, true );

        // Cycle through the list of intersected objects and return the first visible one
        for ( var i = 0; i < intersects.length; i++ ) {
            if ( intersects[ i ].object.visible ) {
                if ( getPickObjectID( intersects[ i ].object ) !== null ) {
                    return intersects[ i ];
                }
            }
        }
        return null;
    }

    function ThreeJSPick( canvas, sceneNode, debug )
    {
        if(!this.lastEventData) return;

        var threeCam = this.state.cameraInUse;
        if ( !threeCam ) {
            this.logger.errorx( "Cannot perform pick because there is no camera to pick from" );
            return;
        }

        var intersects = undefined;
        var target = undefined;
        var mousepos = { 
            "x": this.lastEventData.eventData[0].position[0], 
            "y": this.lastEventData.eventData[0].position[1] 
        }; // window coordinates

        var x = ( mousepos.x ) * 2 - 1;
        var y = -( mousepos.y ) * 2 + 1;

        pickDirection.set( x, y, threeCam.near );

        var camPos = new THREE.Vector3(
            threeCam.matrixWorld.elements[ 12 ],  
            threeCam.matrixWorld.elements[ 13 ], 
            threeCam.matrixWorld.elements[ 14 ]  
        );

        pickDirection.unproject( threeCam );
        raycaster.ray.set( camPos, pickDirection.sub( camPos ).normalize() );
        intersects = raycaster.intersectObjects( sceneNode.threeScene.children, true );

        // Cycle through the list of intersected objects and return the first visible one
        for ( var i = 0; i < intersects.length && target === undefined; i++ ) {
            if ( debug ) {
                for ( var j = 0; j < intersects.length; j++ ) { 
                    console.info( j + ". " + intersects[ j ].object.name ) 
                }
            }   
            if ( intersects[ i ].object.visible ) {
                if ( getPickObjectID( intersects[ i ].object ) !== null ) {
                    target = intersects[ i ];
                }
            }
        }
        return target;
    }
    function getPickObjectID(threeObject)
    {   
        
        if(threeObject.vwfID)
            return threeObject.vwfID;
        else if(threeObject.parent)
         return getPickObjectID(threeObject.parent);
        return null;    
    }

    function vec3ToArray( vec ) {
        return [ vec.x, vec.y, vec.z ];
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

    function getWorldTransform( node ) {
        var parent = self.state.nodes[ node.parentID ];
        if ( parent ) {
            var worldTransform = new THREE.Matrix4();
            if ( node.transform === undefined ) {
                node.transform = new THREE.Matrix4();    
            }
            return worldTransform.multiplyMatrices( getWorldTransform( parent ), node.transform );
        } else {
            return node.transform;
        }
    }

    function setWorldTransform( node, worldTransform ) {
        if ( node.parent ) {
            var parentInverse = goog.vec.Mat4.create();
            if ( goog.vec.Mat4.invert( getWorldTransform( node.parent ), parentInverse ) ) {
                
                node.transform = goog.vec.Mat4.multMat( parentInverse, worldTransform, 
                                                        goog.vec.Mat4.create() );
            } else {
                self.logger.errorx( "Parent world transform is not invertible - did not set world transform " +
                                    "on node '" + node.id + "'" );
            }
        } else {
            node.transform = worldTransform;
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

    function controlNavObject( node ) {      
        if ( !node ) {
            self.logger.error( "Attempted to control non-existent navigation object" );
            return;
        }

        // If there is already a navObject, make that object opaque if we had made it transparent
        if ( navObject && !makeOwnAvatarVisible ) {
            setVisibleRecursively( navObject.threeObject, true );
        }

        // Set the new navigation object
        navObject = node;
        
        // Set the 3D model transparent if requested
        if ( !makeOwnAvatarVisible ) {
            setVisibleRecursively( navObject.threeObject, false );
        }

        // TODO: The model should keep track of a shared navObject, not just the shared camera that it tracks now. See Redmine #3145.
        if( !usersShareView ) {
            // Search for a camera in the navigation object and if it exists, make it active
            var cameraIds = self.kernel.find( navObject.ID, 
                                              "descendant-or-self::element(*,'http://vwf.example.com/camera.vwf')" );
            if ( cameraIds.length ) {

                // Set the view's active camera
                var rendererState = self.state;
                var cameraId = cameraIds[ 0 ];
                cameraNode = rendererState.nodes[ cameraId ];
                rendererState.cameraInUse = cameraNode.threeObject;
            }
        }

        // Request properties from the navigation object
        vwf_view.kernel.getProperty( navObject.ID, "navmode" );
        vwf_view.kernel.getProperty( navObject.ID, "touchmode" );
        vwf_view.kernel.getProperty( navObject.ID, "translationSpeed" );
        vwf_view.kernel.getProperty( navObject.ID, "rotationSpeed" );
    }

    function findNavObject() {
        // Find the navigable objects in the scene
        var sceneRootID = self.state.sceneRootID;
        var navObjectIds = self.kernel.find( sceneRootID,
                                             ".//element(*,'http://vwf.example.com/navigable.vwf')" );
        numNavCandidates = navObjectIds.length;

        // If there are navigation objects in the scene, get their owner property values (The rest of the logic
        // of choosing the correct navigation object is in the gotProperty call for owner)
        // Else, retrieve the userObject property so we may create a navigation object from it for this user
        if ( numNavCandidates ) {
            for ( var i = 0; i < numNavCandidates; i++ ) {
                vwf_view.kernel.getProperty( navObjectIds[ i ], "owner" );
            }
        } else {
            vwf_view.kernel.getProperty( sceneRootID, "makeOwnAvatarVisible" );
            vwf_view.kernel.getProperty( sceneRootID, "boundingBox" );
            vwf_view.kernel.getProperty( sceneRootID, "userObject" );
            userObjectRequested = true;

        }
    }

    function inputHandleMouseNavigation( mouseEventData ) {
        var deltaX = 0;
        var deltaY = 0;

        if ( pointerLocked ) {
            deltaX = mouseEventData.movementX / self.width;
            deltaY = mouseEventData.movementY / self.height;
        } else if ( startMousePosition ) {
            var currentMousePosition = mouseEventData[ 0 ].position;
            deltaX = currentMousePosition[ 0 ] - startMousePosition [ 0 ];
            deltaY = currentMousePosition[ 1 ] - startMousePosition [ 1 ];
        }

        if ( deltaX || deltaY ) {
            if ( navObject ) {
                var navThreeObject = navObject.threeObject;
                var originalTransform = goog.vec.Mat4.clone( navThreeObject.matrix.elements );

                self.handleMouseNavigation( deltaX, deltaY, navObject, navmode, 
                    rotationSpeed, translationSpeed, mouseDown, mouseEventData );

                setTransformFromWorldTransform( navThreeObject );
                callModelTransformBy( navObject, originalTransform, navThreeObject.matrix.elements );
            } else {
                self.logger.warnx( "handleMouseNavigation: There is no navigation object to move" );
            }

            startMousePosition = currentMousePosition;
        } 
    }

    function inputHandleScroll( wheelDelta, distanceToTarget ) {
        var navThreeObject = navObject.threeObject;
        var originalTransform = goog.vec.Mat4.clone( navThreeObject.matrix.elements );
        self.handleScroll( wheelDelta, navObject, navmode, rotationSpeed, translationSpeed, distanceToTarget );
        setTransformFromWorldTransform( navThreeObject );
        callModelTransformBy( navObject, originalTransform, navThreeObject.matrix.elements );
    }

    function inputMoveNavObject( msSinceLastFrame ) {
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

        if ( navObject ) {
            var navThreeObject = navObject.threeObject;
            var originalTransform = goog.vec.Mat4.clone( navThreeObject.matrix.elements );

            self.moveNavObject( x, y, navObject, navmode, rotationSpeed, translationSpeed, msSinceLastFrame );

            // Update the navigation object's local transform from its new world transform
            setTransformFromWorldTransform( navThreeObject );
            callModelTransformBy( navObject, originalTransform, navThreeObject.matrix.elements );
        } else {
            self.logger.warnx( "moveNavObject: There is no navigation object to move" );
        }
    }    

    function inputRotateNavObjectByKey( msSinceLastFrame ) {
        var direction = 0;

        // Calculate movement increment
        if ( rotatingLeft )
            direction += 1;
        if ( rotatingRight )
            direction -= 1;

        // If there is no rotation this frame, return
        if ( !direction )
            return;

        if ( navObject ) {
            var navThreeObject = navObject.threeObject;
            var originalTransform = goog.vec.Mat4.clone( navThreeObject.matrix.elements );

            self.rotateNavObjectByKey( direction, navObject, navmode, 
                rotationSpeed, translationSpeed, msSinceLastFrame );

            // Force the navObject's world transform to update from its local transform
            setTransformFromWorldTransform( navThreeObject );
            callModelTransformBy( navObject, originalTransform, navThreeObject.matrix.elements );
        } else {
            self.logger.warnx( "rotateNavObjectByKey: There is no navigation object to move" );
        }
    }
     
    // Receive Model Transform Changes algorithm 
    // 1.0 If (own view changes) then IGNORE (only if no external changes have occurred since the user’s view 
    //       requested this change – otherwise, will need to treat like 1.1 or 1.2)
    // 1.1 Elseif (other external changes and no outstanding own view changes) then ADOPT
    // 1.2 Else Interpolate to the model’s transform (conflict b/w own view and external sourced model changes)

    function receiveModelTransformChanges( nodeID, transformMatrix ) {
        var node = self.state.nodes[ nodeID ];

        // If the node does not exist in the state's list of nodes, then this update is from a prototype and we
        // should ignore it
        if ( !node ) {
            return;
        }

        // If the transform property was initially updated by this view....
        if ( node.ignoreNextTransformUpdate ) {
            node.outstandingTransformRequests.shift();
            node.ignoreNextTransformUpdate = false;
        } else { // this transform change request is not from me
            adoptTransform( node, transformMatrix );
            if ( node.outstandingTransformRequests ) {
                var threeObject = node.threeObject;
                for ( var i = 0; i < node.outstandingTransformRequests.length; i++ ) {
                    goog.vec.Mat4.multMat( node.outstandingTransformRequests[ i ], 
                                           threeObject.matrix.elements, 
                                           threeObject.matrix.elements );
                }
                updateRenderObjectTransform( threeObject );
            }
        }
    }

    function adoptTransform ( node, transform ) {
        var transformMatrix = goog.vec.Mat4.clone( transform );
        var threeObject = node.threeObject;

        if ( threeObject instanceof THREE.Camera ) {  
            transformMatrix = convertCameraTransformFromVWFtoThreejs( transformMatrix );
        } else if( threeObject instanceof THREE.ParticleSystem ) {
            // I don't see where this function is defined. Maybe a copy-paste bug from
            // GLGE driver? - Eric (5/13/13)
            threeObject.updateTransform( transformMatrix );
        }

        threeObject.matrix.elements = transformMatrix;
        updateRenderObjectTransform( threeObject );   
        nodeLookAt( node );
    }

    function callModelTransformBy( node, originalViewTransform, goalViewTransform ) {
        var nodeID = node.ID;

        if ( nodeID ) {
            var inverseOriginalViewTransform = goog.vec.Mat4.createFloat32();
            if ( goog.vec.Mat4.invert( originalViewTransform, inverseOriginalViewTransform ) ) {
                var deltaViewTransform = goog.vec.Mat4.multMat( goalViewTransform, inverseOriginalViewTransform, 
                                                                goog.vec.Mat4.createFloat32() );
                var deltaModelTransform;
                if ( node.threeObject instanceof THREE.Camera ) {
                    var originalModelTransform = convertCameraTransformFromThreejsToVWF( originalViewTransform );
                    var goalModelTransform = convertCameraTransformFromThreejsToVWF( goalViewTransform );
                    var inverseOriginalModelTransform = goog.vec.Mat4.createFloat32();
                    if ( goog.vec.Mat4.invert( originalModelTransform, inverseOriginalModelTransform ) ) {
                        deltaModelTransform = goog.vec.Mat4.multMat( goalModelTransform, 
                                                                     inverseOriginalModelTransform, 
                                                                     goog.vec.Mat4.createFloat32() );
                    } else {
                        self.logger.errorx( "callModelTransformBy: Original model transform is not invertible" );
                    }
                } else {
                    deltaModelTransform = deltaViewTransform;
                }
                vwf_view.kernel.fireEvent( nodeID, "changingTransformFromView");
                vwf_view.kernel.callMethod( nodeID, "transformBy", [ deltaModelTransform ] );
                node.outstandingTransformRequests = node.outstandingTransformRequests || [];
                node.outstandingTransformRequests.push( deltaViewTransform );

            } else {
                self.logger.errorx( "callModelTransformBy: Original view transform is not invertible" );
            }
        } else {
            self.logger.errorx( "callModelTransformBy: Cannot set property on node that does not have a " +
                                "valid ID" );
        }
    }

    function setTransformFromWorldTransform( threeObject ) {
        if ( !threeObject ) {
            self.logger.warnx( "setTransformFromWorldTransform: There is no threeObject to update" );
            return;
        }

        var parent = threeObject.parent;
        if ( parent ) {
            var inverseParentWorldMatrix = new THREE.Matrix4();
            inverseParentWorldMatrix.getInverse( parent.matrixWorld );
            threeObject.matrix.multiplyMatrices( inverseParentWorldMatrix, threeObject.matrixWorld );
        } else {
            threeObject.matrix.elements = goog.vec.Mat4.clone( threeObject.matrixWorld.elements );
        }
        updateRenderObjectTransform( threeObject );
    }

    function updateRenderObjectTransform( threeObject ) {
        // Tell three.js not to update the transform matrix from position and rotation values (which are older)
        threeObject.matrixAutoUpdate = false;

        // Update the object's world transform
        threeObject.updateMatrixWorld( true );
    }

    // Function to make the object continuously look at a position or node
    // (for use when setting 'transform' or 'lookAt')
    // An almost identical function is copied in model/threejs.js, so if any modifications are made here, they 
    // should be made there, also
    function nodeLookAt( node ) {
        if ( !node ) {
            self.logger.warnx( "nodeLookAt: Node does not exist" );
            return;
        }

        // Function to make the object look at a particular position
        // (For use in the following conditional)
        var lookAtWorldPosition = function( targetWorldPos ) {
            // Get the eye position
            var eye = new THREE.Vector3();
            var threeObject = node.threeObject;
            eye.setFromMatrixPosition( threeObject.matrixWorld );

            var look = new THREE.Vector3();
            look.subVectors( targetWorldPos, eye );
                
            if ( look.length() > 0 ) {
                look.normalize();

                // Set the up vector to be z
                var roughlyUp = new THREE.Vector3();
                roughlyUp.set( 0, 0, 1 );

                var right = new THREE.Vector3();
                right.crossVectors( look, roughlyUp );
                if ( right.length() == 0 ) {
                    look.x += 0.0001;
                    right.crossVectors( look, roughlyUp );
                }
                right.normalize();

                var up = new THREE.Vector3();
                up.crossVectors( right, look );

                var worldTransform = threeObject.matrixWorld.elements;
                worldTransform[ 0 ] = right.x; worldTransform[ 4 ] = look.x; worldTransform[ 8 ] = up.x;
                worldTransform[ 1 ] = right.y; worldTransform[ 5 ] = look.y; worldTransform[ 9 ] = up.y;
                worldTransform[ 2 ] = right.z; worldTransform[ 6 ] = look.z; worldTransform[ 10 ] = up.z;
                
                setTransformFromWorldTransform( threeObject );

                if ( threeObject instanceof THREE.Camera ) {
                    var nodeTransformArray = threeObject.matrix.elements;
                    threeObject.matrix.elements = convertCameraTransformFromVWFtoThreejs( nodeTransformArray );
                    updateRenderObjectTransform( threeObject );
                }
            }
        }

        // The position for the object to look at - to be set in the following conditional
        var targetWorldPos = new THREE.Vector3();

        //Threejs does not currently support auto tracking the lookat,
        //instead, we'll take the position of the node and look at that.
        if ( typeof node.lookatval == 'string' ) {
            
            var lookatNode = self.state.nodes[ node.lookatval ];
            
            if ( lookatNode )
            {
                targetWorldPos.setFromMatrixPosition( lookatNode.threeObject.matrixWorld );
                lookAtWorldPosition( targetWorldPos );                         
            }
        
        } else if ( node.lookatval instanceof Array ) {
            targetWorldPos.set( node.lookatval[0], node.lookatval[1], node.lookatval[2] );
            lookAtWorldPosition( targetWorldPos );   
        }
    }

    function convertCameraTransformFromVWFtoThreejs( transform ) {

        // Rotate 90 degrees around X to convert from VWF Z-up to three.js Y-up.

        var newTransform = goog.vec.Mat4.clone( transform );

        // Get column y and z out of the matrix
        var columny = goog.vec.Vec4.create();
        goog.vec.Mat4.getColumn( newTransform, 1, columny );
        var columnz = goog.vec.Vec4.create();
        goog.vec.Mat4.getColumn( newTransform, 2, columnz );

        // Swap the two columns, negating columny
        goog.vec.Mat4.setColumn( newTransform, 1, columnz );
        goog.vec.Mat4.setColumn( newTransform, 2, goog.vec.Vec4.negate( columny, columny ) );

        return newTransform;
    }

    function convertCameraTransformFromThreejsToVWF( transform ) {

        // Rotate -90 degrees around X to convert from three.js Y-up to VWF Z-up.

        var newTransform = goog.vec.Mat4.clone( transform );
                                    
        // Get column y and z out of the matrix
        var columny = goog.vec.Vec4.create();
        goog.vec.Mat4.getColumn( newTransform, 1, columny );
        var columnz = goog.vec.Vec4.create();
        goog.vec.Mat4.getColumn( newTransform, 2, columnz );

        // Swap the two columns, negating columnz
        goog.vec.Mat4.setColumn( newTransform, 1, goog.vec.Vec4.negate( columnz, columnz ) );
        goog.vec.Mat4.setColumn( newTransform, 2, columny );

        return newTransform;
    }

    // TODO: This should be replaced with self.state.setMeshPropertyRecursively
    function setVisibleRecursively( threeObject, visible ) {
        if ( !threeObject ) {
            return;
        }
        threeObject.visible = visible;
        for ( var i = 0; i < threeObject.children.length; i++ ) {
            setVisibleRecursively( threeObject.children[ i ], visible );
        }
    }

    function extractRotationAndTranslation( threeObject ) {
        // Pull the pitch, yaw, and translation out of the transform

        var worldTransformArray = threeObject.matrixWorld.elements;
        var vwfWorldTransformArray;

        // If this threeObject is a camera, it has a 90-degree rotation on it to account for the different 
        // coordinate systems of VWF and three.js.  We need to undo that rotation before using it as a VWF 
        // property.
        // Else, just use the transform as-is
        if ( threeObject instanceof THREE.Camera ) {
            vwfWorldTransformArray = convertCameraTransformFromThreejsToVWF( worldTransformArray );
        } else {
            vwfWorldTransformArray = goog.vec.Mat4.clone( worldTransformArray );
        }

        pitchMatrix = new THREE.Matrix4();
        var pitchArray = pitchMatrix.elements;
        var costheta = vwfWorldTransformArray[ 10 ];
        var sintheta = vwfWorldTransformArray[ 6 ];
        pitchArray[ 5 ] = costheta;
        pitchArray[ 6 ] = sintheta;
        pitchArray[ 9 ] = -sintheta;
        pitchArray[ 10 ] = costheta;

        yawMatrix = new THREE.Matrix4();
        var yawArray = yawMatrix.elements;
        var cosphi = vwfWorldTransformArray[ 0 ];
        var sinphi = vwfWorldTransformArray[ 1 ];
        yawArray[ 0 ] = cosphi;
        yawArray[ 1 ] = sinphi;
        yawArray[ 4 ] = -sinphi;
        yawArray[ 5 ] = cosphi;

        translationMatrix = new THREE.Matrix4();
        var translationArray = translationMatrix.elements;
        translationArray[ 12 ] = vwfWorldTransformArray[ 12 ];
        translationArray[ 13 ] = vwfWorldTransformArray[ 13 ];
        translationArray[ 14 ] = vwfWorldTransformArray[ 14 ];
    }

    function orbit( pitchRadians, yawRadians ) {
        if ( navObject ) {

            // We can only orbit around a point if there is a point to orbit around
            if ( positionUnderMouseClick ) {

                // We will soon want to use the yawMatrix and pitchMatrix,
                // so let's update them
                extractRotationAndTranslation( navObject.threeObject );

                var navThreeObject = navObject.threeObject;
                var originalTransform = goog.vec.Mat4.clone( navThreeObject.matrix.elements );

                var originalPitchMatrix = pitchMatrix.clone();

                // --------------------
                // Calculate new pitch
                // --------------------

                var pitchQuat = new THREE.Quaternion();
                pitchQuat.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), pitchRadians );
                var pitchDeltaMatrix = new THREE.Matrix4();
                pitchDeltaMatrix.makeRotationFromQuaternion( pitchQuat );
                pitchMatrix.multiplyMatrices( pitchDeltaMatrix, pitchMatrix );

                // Constrain the camera's pitch to +/- 90 degrees
                // We need to do something if zAxis.z is < 0
                var pitchMatrixElements = pitchMatrix.elements;
                var pitchIsConstrained = false;
                var zenithOrNadirMult = 0;
                if ( pitchMatrixElements[ 10 ] < 0 ) {

                    var xAxis = goog.vec.Vec3.create();
                    xAxis = goog.vec.Vec3.setFromArray( xAxis, [ pitchMatrixElements[ 0 ], 
                                                                 pitchMatrixElements[ 1 ], 
                                                                 pitchMatrixElements[ 2 ] ] );

                    var yAxis = goog.vec.Vec3.create();

                    // If forward vector is tipped up
                    if ( pitchMatrixElements[ 6 ] > 0 ) {
                        yAxis = goog.vec.Vec3.setFromArray( yAxis, [ 0, 0, 1 ] );
                    } else {
                        yAxis = goog.vec.Vec3.setFromArray( yAxis, [ 0, 0, -1 ] );
                    }

                    // Calculate the zAxis as a crossProduct of x and y
                    var zAxis = goog.vec.Vec3.cross( xAxis, yAxis, goog.vec.Vec3.create() );

                    // Put these values back in the camera matrix
                    pitchMatrixElements[ 4 ] = yAxis[ 0 ];
                    pitchMatrixElements[ 5 ] = yAxis[ 1 ];
                    pitchMatrixElements[ 6 ] = yAxis[ 2 ];
                    pitchMatrixElements[ 8 ] = zAxis[ 0 ];
                    pitchMatrixElements[ 9 ] = zAxis[ 1 ];
                    pitchMatrixElements[ 10 ] = zAxis[ 2 ];

                    pitchIsConstrained = true;
                    zenithOrNadirMult = -yAxis[ 2 ];
                }

                // ------------------
                // Calculate new yaw
                // ------------------

                var yawQuat = new THREE.Quaternion();
                yawQuat.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), yawRadians );
                var yawDeltaMatrix = new THREE.Matrix4();
                yawDeltaMatrix.makeRotationFromQuaternion( yawQuat );
                yawMatrix.multiplyMatrices( yawDeltaMatrix, yawMatrix );

                // --------------------------
                // Calculate new translation
                // --------------------------

                if ( pitchIsConstrained ) {
                    var inverseOriginalPitchMatrix = new THREE.Matrix4();
                    inverseOriginalPitchMatrix.getInverse( originalPitchMatrix );
                    pitchDeltaMatrix.multiplyMatrices( pitchMatrix, inverseOriginalPitchMatrix );
                }

                var rotatedOrbitFrameInWorld = new THREE.Matrix4();
                //rotatedOrbitFrameInWorld.multiplyMatrices( yawMatrix, pitchMatrix );
                rotatedOrbitFrameInWorld = yawMatrix.clone();
                rotatedOrbitFrameInWorld.setPosition( new THREE.Vector3( positionUnderMouseClick[ 0 ],
                                                                         positionUnderMouseClick[ 1 ], 
                                                                         positionUnderMouseClick[ 2 ] ) ); 

                var worldToRotatedOrbit = new THREE.Matrix4();
                worldToRotatedOrbit.getInverse( rotatedOrbitFrameInWorld );

                var translationInRotatedOrbitFrame = new THREE.Matrix4();
                translationInRotatedOrbitFrame.multiplyMatrices( worldToRotatedOrbit, translationMatrix );

                // Apply pitch and then yaw
                translationInRotatedOrbitFrame.multiplyMatrices( pitchDeltaMatrix, translationInRotatedOrbitFrame );
                translationInRotatedOrbitFrame.multiplyMatrices( yawDeltaMatrix, translationInRotatedOrbitFrame );

                // Transform back to world
                var newTranslationInWorld = new THREE.Matrix4();
                newTranslationInWorld.multiplyMatrices( rotatedOrbitFrameInWorld, translationInRotatedOrbitFrame );

                var translationArray = translationMatrix.elements;
                var newTranslationInWorldArray = newTranslationInWorld.elements;
                translationArray[ 12 ] = newTranslationInWorldArray[ 12 ];
                translationArray[ 13 ] = newTranslationInWorldArray[ 13 ];
                translationArray[ 14 ] = newTranslationInWorldArray[ 14 ];
                var boundByBoundingBox = false;
                if ( boundingBox != undefined ) {
                    if ( translationArray[ 12 ] < boundingBox[ 0 ][ 0 ] ) {
                        boundByBoundingBox = true;
                    }
                    else if ( translationArray[ 12 ] > boundingBox[ 0 ][ 1 ] ) {
                        boundByBoundingBox = true;
                    }
                    if ( translationArray[ 13 ] < boundingBox[ 1 ][ 0 ] ) {
                        boundByBoundingBox = true;
                   }
                    else if ( translationArray[ 13 ] > boundingBox[ 1 ][ 1 ] ) {
                        boundByBoundingBox = true;
                    }
                    if ( translationArray[ 14 ] < boundingBox[ 2 ][ 0 ] ) {
                        boundByBoundingBox = true;
                    }
                    else if ( translationArray[ 14 ] > boundingBox[ 2 ][ 1 ] ) {
                        boundByBoundingBox = true;
                    }
                }
                // -------------------------------------------------
                // Put all components together and set the new pose
                // -------------------------------------------------
                if ( boundByBoundingBox == false ) {
                    var navObjectWorldMatrix = navThreeObject.matrixWorld;
                    navObjectWorldMatrix.multiplyMatrices( yawMatrix, pitchMatrix );
                    navObjectWorldMatrix.multiplyMatrices( translationMatrix, navObjectWorldMatrix );
                
                    if ( navThreeObject instanceof THREE.Camera ) {
                        var navObjWrldTrnsfmArr = navObjectWorldMatrix.elements;
                        navObjectWorldMatrix.elements = convertCameraTransformFromVWFtoThreejs( navObjWrldTrnsfmArr );
                    }
                }
                setTransformFromWorldTransform( navThreeObject );
                callModelTransformBy( navObject, originalTransform, navThreeObject.matrix.elements );
            }
        } else {
            self.logger.warnx( "orbit: There is no navigation object to move" );
        }
    }

    function setActiveCamera( cameraID ) {
        var sceneRootID = this.state.sceneRootID;
        var modelCameraInfo = this.state.scenes[ sceneRootID ].camera;
        if( modelCameraInfo.threeJScameras[ cameraID ] ) {
            // If the view is currently using the model's activeCamera, update it to the new activeCamera
            if ( usersShareView ) {
                cameraNode = this.state.nodes[cameraID];
                this.state.cameraInUse = cameraNode.threeObject;
                var canvas = this.canvasQuery[ 0 ];
                this.state.cameraInUse.aspect = canvas.clientWidth / canvas.clientHeight;
            }
        }
    }
});
