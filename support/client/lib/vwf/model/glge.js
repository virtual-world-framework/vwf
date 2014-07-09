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

/// vwf/model/glge.js is an interface to the GLGE WebGL scene manager.
/// 
/// @module vwf/model/glge
/// @requires vwf/model
/// @requires vwf/utility

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

    // For historical reasons yet to be resolved, the GLGE model code currently resides in
    // vwf-model.glge.js intermixed with the view code. This driver is a gross hack to delegate model
    // calls to the appropriate parts of the GLGE view.

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            checkCompatibility.call(this);
            this.state.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
            this.state.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }
            this.state.prototypes = {}; 
            this.state.kernel = this.kernel;

        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            var childURI = nodeID === 0 ? childIndex : undefined;

            var self = this;

            //console.log(["creatingNode:",nodeID,childID,childName,childExtendsID,childType]);
            var prototypeID = isPrototype.call( this, nodeID, childID );
            if ( prototypeID !== undefined ) {
                //console.info( "FOUND prototype: " + prototypeID );
                this.state.prototypes[ prototypeID ] = {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsID: childImplementsIDs,
                    source: childSource, 
                    type: childType,
                    uri: childURI,
                    name: childName
                };
                return;                
            }
            if ( childExtendsID === undefined )
                return;

            //console.log("Create " + childID);

            var node, parentNode, glgeChild, glgeParent;
            var kernel = this.kernel;
            var prototypes = getPrototypes.call( this, kernel, childExtendsID );

//            this.logger.enabled = true;
//            this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs,
//                                childSource, childType, childIndex, childName );
//            this.logger.enabled = false;

            // find the parent node
            if ( nodeID ) {
                if ( this.state.nodes[ nodeID ] )
                    parentNode = this.state.nodes[ nodeID ];
                else 
                    parentNode = this.state.scenes[ nodeID ];

                if ( parentNode ) {
                    glgeParent = parentNode.glgeObject ? parentNode.glgeObject : parentNode.glgeScene;
                    var recursive = false;
                    if ( glgeParent && childName ) {
                        recursive = ( glgeParent.constructor == GLGE.Collada );
                        glgeChild = glgeObjectChild.call( this, glgeParent, childName, childExtendsID, prototypes, recursive );
                    }
                }
            }

            if ( prototypes && isGlgeSceneDefinition.call( this, prototypes ) && childID == this.kernel.application() ) {

                this.state.sceneRootID = childID;

                var sceneNode = this.state.scenes[childID] = {
                    glgeDocument: new GLGE.Document(),
                    glgeRenderer: undefined,
                    glgeScene: new GLGE.Scene(),
                    ID: childID,
                    parentID: nodeID,
                    glgeKeys: new GLGE.KeyInput(),
                    type: childExtendsID,
                    camera: {
                        ID: undefined,
                        defaultCamID: "http-vwf-example-com-camera-vwf-camera",
                        glgeCameras: {},
                    },
                    xmlColladaObjects: [],
                    srcColladaObjects: [],
                    viewInited: false,
                    modelInited: false,
                    pendingLoads: 0,
                };
				
                if ( sceneNode.glgeScene.camera ) {
                    sceneNode.camera.glgeCameras[ sceneNode.camera.defaultCamID ] = sceneNode.glgeScene.camera;
                    sceneNode.glgeScene.camera.name = "camera";
                    this.state.cameraInUse = sceneNode.glgeScene.camera;
                    initCamera.call( this, sceneNode.glgeScene.camera );
                }   

                var model = this;
                var xmlDocLoadedCallback = callback;
                sceneNode.glgeDocument.onLoad = function () {
                    sceneNode.pendingLoads--;
                    xmlDocLoadedCallback( true );
                };

                if ( childSource ) {
                    switch ( childType ) {
                        case "model/x-glge":
                            callback( false );
                            sceneNode.glgeDocument.load( utility.resolveURI( childSource, childURI ) );
                            sceneNode.pendingLoads++;
                            break;
                    }
                }
           
            } else if ( prototypes && isGlgeCameraDefinition.call( this, prototypes ) ) {
                if ( childName !== undefined ) {
                    var camName = childID.substring( childID.lastIndexOf( '-' ) + 1 );
                    var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                    node = this.state.nodes[childID] = {
                        name: childName,
                        glgeObject: glgeChild,
                        ID: childID,
                        parentID: nodeID,
                        sceneID: this.state.sceneRootID,
                        glgeScene: sceneNode ? sceneNode.glgeScene : undefined,
                        type: childExtendsID,
                        sourceType: childType,
                    };

                    if ( nodeID != 0 && !node.glgeObject ) {
                        createCamera.call( this, nodeID, childID, childName );
                    }

                    if ( sceneNode && sceneNode.camera ) {
                        if ( childID == sceneNode.camera.defaultCamID ) {
                            if ( !sceneNode.camera.glgeCameras[ childID ] ) {
                                var cam = new GLGE.Camera();
                                sceneNode.camera.glgeCameras[ childID ] = cam;
                                initCamera.call( this, cam );
                            }
                            node.name = camName;
                            node.glgeObject = sceneNode.camera.glgeCameras[ childID ];
                      
                        } else if ( node.glgeObject ) {
                            sceneNode.camera.glgeCameras[ childID ] = node.glgeObject;
                        }
                    } 
                }              
            } else if ( prototypes && isGlgeLightDefinition.call( this, prototypes ) ) {
                if ( childName !== undefined ) {
                    node = this.state.nodes[childID] = {
                        name: childName,
                        glgeObject: glgeChild,
                        ID: childID,
                        parentID: nodeID,
                        type: childExtendsID,
                        sourceType: childType,
                    };
                    if ( nodeID != 0 && !node.glgeObject ) {
                        createLight.call( this, nodeID, childID, childName );
                    }
                }
            } else if ( prototypes && isGlgeParticleSystemDefinition.call( this, prototypes ) ) {
                if ( childName !== undefined ) {
                    node = this.state.nodes[childID] = {
                        name: childName,
                        glgeObject: glgeChild,
                        ID: childID,
                        parentID: nodeID,
                        type: childExtendsID
                    };
                    if ( nodeID != 0 && !node.glgeObject ) {
                        createParticleSystem.call( this, nodeID, childID, childName );
                    }
                }
            } else if ( prototypes && isGlgeNodeDefinition.call( this, prototypes ) ) {

                if ( childName !== undefined ) {
                    var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                    switch ( childType ) {
                        case "model/vnd.collada+xml":
                            callback( false );
                            node = this.state.nodes[childID] = {
                                name: childName,  
                                glgeObject: undefined,
                                source: utility.resolveURI( childSource, childURI ),
                                ID: childID,
                                parentID: nodeID,
                                sourceType: childType,
                                type: childExtendsID,
                                loadedCallback: callback,
                                glgeScene: sceneNode
                            };
                            loadCollada.call( this, parentNode, node, notifyDriverOfPrototypeAndBehaviorProps ); 
                            break;

                        case "text/xml":
                            node = this.state.nodes[childID] = {
                                name: childName,  
                                glgeObject: undefined,
                                source: childSource,
                                ID: childID,                                
                                parentID: nodeID,
                                type: childExtendsID,
                                sourceType: childType,
                                glgeScene: sceneNode 
                            };
                                
                            if ( sceneNode && sceneNode.glgeDocument ){
                                var meshDef = sceneNode.glgeDocument.getElement( node.source );
                                if ( meshDef ) {
                                    node.glgeObject = new GLGE.Object();
                                    node.glgeObject.setMesh( meshDef );
                                    if ( glgeParent ) {
                                        glgeParent.addObject( node.glgeObject );
                                    } else {
                                        if ( sceneNode.glgeScene ) {
                                            sceneNode.glgeScene.addObject( node.glgeObject );
                                        }
                                    }
                                }
                            }
                            break;
                            
                        case "definition/mesh": {
                                node = this.state.nodes[childID] = {
                                    name: childName,  
                                    glgeObject: undefined,
                                    glgeParent: glgeParent,
                                    source: childSource,
                                    ID: childID,                                
                                    parentID: nodeID,
                                    type: childExtendsID,
                                    sourceType: childType,
                                    glgeScene: sceneNode  
                                };
                                createMesh.call( this, node );
                            }
                            break;

                        default:
                            node = this.state.nodes[childID] = {
                                name: childName,  
                                glgeObject: glgeChild,
                                ID: childID,
                                parentID: nodeID,
                                type: childExtendsID,
                                sourceType: childType,
                                glgeScene: sceneNode  
                            };
                            if ( node.glgeObject ) {
                                if ( ( node.glgeObject.constructor == GLGE.Collada ) ) {
                                    callback( false );
                                    node.glgeObject.vwfID = childID;
                                    sceneNode.xmlColladaObjects.push( node.glgeObject );
                                    setColladaCallback.call( this, node.glgeObject, sceneNode );
                                    node.loadedCallback = callback;                                    
                                }
                            } else {
                                if ( nodeID != 0 ) {
                                    node.glgeObject = new GLGE.Group();
                                    if ( parentNode ) {
                                        if ( parentNode.glgeObject ) {
                                            parentNode.glgeObject.addObject( node.glgeObject );
                                        } else if ( parentNode.glgeScene ) {
                                            parentNode.glgeScene.addObject( node.glgeObject );
                                        }
                                    }
                            
                                    node.gui = node.glgeObject.uid;
                                    node.glgeObject.name = childName;  
                                }
                            }
                            break;
                    }  

                    this.settingProperty( childID, "playing", false );  // TODO: these are matching the defaults in node3; they should be sent through creatingProperty() so that we don't have to ask
                    this.settingProperty( childID, "looping", false );  // TODO: these are matching the defaults in node3; they should be sent through creatingProperty() so that we don't have to ask
                    this.settingProperty( childID, "speed", 1 );  // TODO: these are matching the defaults in node3; they should be sent through creatingProperty() so that we don't have to ask

                }
            } else if ( prototypes && isGlgeMaterialDefinition.call( this, prototypes ) ) {
                if ( childName !== undefined ) {
                    node = this.state.nodes[childID] = {
                        name: childName,
                        glgeObject: undefined,
                        glgeMaterial: true,
                        ID: childID,
                        parentID: nodeID,
                        type: childExtendsID,
                        sourceType: childType,
                    };
                    findMaterial.call( this, nodeID, childName, node );
                }
            } else {

                switch ( childExtendsID ) {
                    case "appscene-vwf":
                    case "index-vwf":
                    case "http://vwf.example.com/node.vwf":
                    case "http-vwf-example-com-node2-vwf":
                    case "http-vwf-example-com-scene-vwf":
                    case "http-vwf-example-com-navscene-vwf":
                    case undefined:
                        break;

                    default:
                        node = this.state.nodes[ childID ] = {
                            name: childName,
                            glgeObject: glgeChild,
                            ID: childID,
                            parentID: nodeID,
                            type: childExtendsID,
                            sourceType: childType,
                        };
                        break;
                 }  // end of switch
            } // end of else

            // If we do not have a load a model for this node, then we are almost done, so we can update all
            // the driver properties w/ the stop-gap function below.
            // Else, it will be called at the end of the assetLoaded callback
            if ( ! ( childType == "model/vnd.collada+xml" || 
                     childType == "model/vnd.osgjs+json+compressed" ) )
                notifyDriverOfPrototypeAndBehaviorProps();

            // Since prototypes are created before the object, it does not get "setProperty" updates for
            // its prototype (and behavior) properties.  Therefore, we cycle through those properties to
            // notify the drivers of the property values so they can react accordingly
            // TODO: Have the kernel send the "setProperty" updates itself so the driver need not
            // NOTE: Identical code exists in three.js driver, so if an change is necessary, it should be made
            //       there, too
            function notifyDriverOfPrototypeAndBehaviorProps() {
                var ptPropValue;
                var protos = getPrototypes.call( this, kernel, childExtendsID );
                protos.forEach( function( prototypeID ) {
                    for ( var propertyName in kernel.getProperties( prototypeID ) ) {
                        //console.info( " 1    getting "+propertyName+" of: " + childExtendsID  );
                        ptPropValue = kernel.getProperty( childExtendsID, propertyName );
                        if ( ptPropValue !== undefined && ptPropValue !== null && childID !== undefined && childID !== null) {
                            //console.info( " 1    setting "+propertyName+" of: " + nodeID + " to " + ptPropValue );
                            self.settingProperty( childID, propertyName, ptPropValue );
                        }
                    }
                } );
                childImplementsIDs.forEach( function( behaviorID ) {
                    for ( var propertyName in kernel.getProperties( behaviorID ) ) {
                        //console.info( "     2    getting "+propertyName+" of: " + behaviorID  );
                        ptPropValue = kernel.getProperty( behaviorID, propertyName );
                        if ( ptPropValue !== undefined && ptPropValue !== null && childID !== undefined && childID !== null) {
                            //console.info( "     2    setting "+propertyName+" of: " + nodeID + " to " + ptPropValue );
                            self.settingProperty( childID, propertyName, ptPropValue );
                        }
                    }
                } );
            }; 
        },
         
        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            if ( this.state.nodes[ nodeID ] ) {
                var node = this.state.nodes[ nodeID ];
                if ( node.glgeObject ) {
                    var obj = node.glgeObject;
                    var parent = obj.parent;
                    if ( parent ) {
                        if ( parent.removeChild ) parent.removeChild( obj );
                        node.glgeObject = undefined;
                        //delete obj;
                    }
                }
                delete this.state.nodes[ nodeID ];
            }
        },

        // -- addingChild ------------------------------------------------------------------------
        
        addingChild: function( nodeID, childID, childName ) {
            
            var parentGlgeObj = getGlgeObject.call( this, nodeID );
            var childGlgeObj = getGlgeObject.call( this, childID );

            if ( parentGlgeObj && childGlgeObj && parentGlgeObj instanceof GLGE.Group ) {

                var childParent = childGlgeObj.parent;
                // what does vwf do here?  add only if parent is currently undefined
                if ( childParent ) {
                    childParent.remove( childGlgeObj )   
                } 
                parentGlgeObj.add( childGlgeObj );   
            }
        },

        // -- movingChild ------------------------------------------------------------------------
        
        movingChild: function( nodeID, childID, childName ) {
            var parentGlgeObj = getGlgeObject.call( this, nodeID );
            var childGlgeObj = getGlgeObject.call( this, childID );

            if ( parentGlgeObj && childGlgeObj && parentGlgeObj instanceof GLGE.Group ) {

                var childParent = childGlgeObj.parent;
                
                if ( childParent ) {
                    childParent.remove( childGlgeObj ); 
                    parentGlgeObj.add( childGlgeObj );   
                } 
                  
            }
        },

        // -- removingChild ------------------------------------------------------------------------
        
        removingChild: function( nodeID, childID, childName ) {
            var parentGlgeObj = getGlgeObject.call( this, nodeID );
            var childGlgeObj = getGlgeObject.call( this, childID );

            if ( parentGlgeObj && childGlgeObj && parentGlgeObj instanceof GLGE.Group ) {

                var childParent = childGlgeObj.parent;
                if ( childParent === parentGlgeObj ) {
                    parentGlgeObj.remove( childGlgeObj )   
                } 
                  
            }
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {

            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;

            if ( propertyValue !== undefined ) {
                var node = this.state.nodes[ nodeID ];
                if ( !node ) node = this.state.scenes[ nodeID ];
                if ( node ) {
                    switch ( propertyName ) {

                        case "meshDefinition":
                            defineMesh.call( this, propertyValue, node );
                            break;

                        default:
                            value = this.settingProperty( nodeID, propertyName, propertyValue );            
                            break;
                    }
                }
            }

            return value;
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
            var prototypes;
            var value = undefined;

            if ( node && node.glgeObject && propertyValue !== undefined ) {

                var validProperty = false;
                var glgeObject = node.glgeObject;
                var isAnimatable = glgeObject.animate; // implements GLGE.Animatable?
    isAnimatable = isAnimatable && glgeObject.animation || propertyName == "looping" && glgeObject.constructor == GLGE.ParticleSystem; // has an animation?
    isAnimatable = isAnimatable && node.name != "cityblock.dae"; // TODO: this is a hack to prevent disabling the animation that keeps the world upright


                value = propertyValue;

                if ( isAnimatable ) {

                    switch ( propertyName ) {

                        case "playing":

    if ( !Boolean( propertyValue ) && glgeObject.animFinished ) {  // TODO: GLGE finished doesn't flow back into node3's playing yet; assume playing is being toggled and interpret it as true if the animation has played and finished.
        propertyValue = true;
    }

//    if ( !node.initialized ) {  // TODO: this is a hack to set the animation to frame 0 during initialization
//        //if ( glgeObject.animFrames == 100 ) { glgeObject.setFrames( 50 ); } // hack to use only the opening half of the door animation
//        glgeObject.setStartFrame( 0, 0, glgeObject.getLoop() );
//        glgeObject.getInitialValues( glgeObject.animation, glgeObject.animationStart );
//    }

                            if ( Boolean( propertyValue ) ) {
                                if ( glgeObject.animFinished ) {
                                    glgeObject.setStartFrame( 0, 0, glgeObject.getLoop() );
                                } else if ( glgeObject.getPaused() ) {
                                    if ( glgeObject.animFrames == 100 ) {
                                        glgeObject.setFrames( 50 );
                                    }
                                    glgeObject.setPaused( GLGE.FALSE );
                                    value = false;
                                    validProperty = true;
                                }
                            } else {
                                glgeObject.setPaused( GLGE.TRUE );
                                value = true;
                                validProperty = true;
                            }

                            break;

                        case "looping":
                            value = Boolean( propertyValue ) ? GLGE.TRUE : GLGE.FALSE;
                            glgeObject.setLoop( value );
                            value = (value == GLGE.TRUE) ? true : false;
                            validProperty = true;
                            break;

                        case "speed":
                            value = Number( propertyValue ) * 30; // TODO: not safe to assume default speed is 30 fps
                            glgeObject.setFrameRate( value );
                            validProperty = true;
                            break;
                    }
                }

                var pv = propertyValue;
                switch ( propertyName ) {

                    case "transform":

                        //console.info( "setting transform of: " + nodeID + " to " + Array.prototype.slice.call( propertyValue ) );
                        var transform = goog.vec.Mat4.createFromArray( propertyValue || [] );

                        // Rotate 90 degress around X to convert from VWF Z-up to GLGE Y-up.
                        if ( glgeObject instanceof GLGE.Camera ) {
                            var columny = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( transform, 1, columny );
                            var columnz = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( transform, 2, columnz );
                            goog.vec.Mat4.setColumn( transform, 1, columnz );
                            goog.vec.Mat4.setColumn( transform, 2, goog.vec.Vec4.negate( columny, columny ) );
                        }

                        // Assign the transform. GLGE matrices are transposed compared to VWF.
                        // setStaticMatrix() doesn't propagate correctly for cameras, so we have to
                        // decompose camera assignments.

                        if ( glgeObject instanceof GLGE.Camera || glgeObject instanceof GLGE.Light || glgeObject instanceof GLGE.ParticleSystem ) { // setStaticMatrix doesn't work for cameras

                            var translation = goog.vec.Vec3.create();
                            goog.vec.Mat4.getColumn( transform, 3, translation );
                            goog.vec.Mat4.setColumnValues( transform, 3, 0, 0, 0, 1 );
                            goog.vec.Mat4.transpose( transform, transform );
                            glgeObject.setRotMatrix( transform );
                            glgeObject.setLoc( translation[0], translation[1], translation[2] );

                        } else {

                            // Set loc[XYZ] so that GLGE.Placeable.getPosition() will return correct
                            // values for lookAt. setLoc() clears the static matrix, so call it
                            // before setStaticMatrix().

                            var translation = goog.vec.Vec3.create();
                            goog.vec.Mat4.getColumn( transform, 3, translation );
                            glgeObject.setLoc( translation[0], translation[1], translation[2] );

                            // Set the full matrix.

                            glgeObject.setStaticMatrix(
                                goog.vec.Mat4.transpose( transform, goog.vec.Mat4.create() )
                            );
                        }

                        break;

                    case "material": {
                            var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                            if ( sceneNode && node.glgeObject ) {
                                if ( propertyValue && propertyValue.constructor == Array ) propertyValue = propertyValue[(Math.random() * propertyValue.length) | 0];
                                if ( !propertyValue ) propertyValue = "grey";
                                var mat = sceneNode.glgeDocument.getElement( propertyValue );
                                if ( mat ) {
                                    node.glgeObject.setMaterial( mat ); 
                                }
                            } 
                        }                      
                        break;

                    case "lookAt": {
                            //console.info( "settingProperty( " + nodeID + ", " + propertyName + ", " + propertyValue + " )" );
                            if ( propertyValue == "activeCamera" ) {
                                if ( this.state.cameraInUse ) {
                                    glgeObject.setLookat( this.state.cameraInUse );
                                }
                            } else {
                                var lookAtNode = this.state.nodes[ propertyValue ];
                                if ( lookAtNode && lookAtNode.glgeObject ) {
                                    //console.info( "         settingProperty found lookat object" );
                                    glgeObject.setLookat( lookAtNode.glgeObject );
                                } else {
                                    if ( glgeObject.getLookat && glgeObject.getLookat() ) 
                                        glgeObject.setLookat( null );
                                }
                            }
                        }
                        break;

                    case "pickable":
                        if ( glgeObject.setPickable ){
                            glgeObject.setPickable( propertyValue );
                        }                            
                        break;

                    case "visible":
                        if ( glgeObject.setVisible ) {
                            glgeObject.setVisible( propertyValue );
                        }
                        break;

                    default:
                        prototypes = getPrototypes.call( this, this.kernel.kernel.kernel, node["type"] );
                        if ( isGlgeMaterialDefinition.call( this, prototypes ) ){
                            value = setMaterialProperty.call( this, nodeID, propertyName, propertyValue );
                        } else if ( isGlgeCameraDefinition.call( this, prototypes ) ) {
                            value = setCameraProperty.call( this, nodeID, propertyName, propertyValue );
                        } else if ( isGlgeLightDefinition.call( this, prototypes ) ) {
                            value = setLightProperty.call( this, nodeID, propertyName, propertyValue );
                        } else if ( isGlgeParticleSystemDefinition.call( this, prototypes ) ) {
                            value = setParticleSystemProperty.call( this, nodeID, propertyName, propertyValue );
                        } else if ( isGlgeSceneDefinition.call( this, prototypes ) ) {
                            value = setSceneProperty.call( this, nodeID, propertyName, propertyValue );
                        } else {
                            if ( !validProperty ) {
                                value = undefined;
                            }                          
                        }
                        break;
                }
            } else if ( this.state.scenes[nodeID] ) {
                value = setSceneProperty.call( this, nodeID, propertyName, propertyValue );
            } 

             return value;        
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
            var value = undefined;
            var glgeModel = this;
            var prototypes = undefined;
            var validProperty = false;

            if ( node && node.glgeObject ) {

                var glgeObject = node.glgeObject;
                var isAnimatable = glgeObject.animate; // implements GLGE.Animatable?
    isAnimatable = isAnimatable && glgeObject.animation || propertyName == "looping" && glgeObject.constructor == GLGE.ParticleSystem; // has an animation?
    isAnimatable = isAnimatable && node.name != "cityblock.dae"; // TODO: this is a hack to prevent disabling the animation that keeps the world upright

                if ( isAnimatable ) {

                    switch ( propertyName ) {

                        case "playing":
                            value = !Boolean( glgeObject.getPaused() );
                            validProperty = true;
                            break;

                        case "looping":
                            value = Boolean( glgeObject.getLoop() );
                            validProperty = true;
                            break;

                        case "speed":
                            value = glgeObject.getFrameRate() / 30; // TODO: not safe to assume default speed is 30 fps
                            validProperty = true;
                            break;
                    }
                }

                switch ( propertyName ) {

                    case "transform":

                        // We would use glgeObject.getLocalMatrix(), but glgeObject.localMatrix
                        // isn't always recalculated. So, we need to replicate the calculations from
                        // glgeObject.getModelMatrix(). VWF matrices are transposed compared to GLGE.

                        value = goog.vec.Mat4.transpose( glgeObject.staticMatrix ||
                            GLGE.mulMat4(
                                glgeObject.getTranslateMatrix(),
                                GLGE.mulMat4(
                                    glgeObject.getRotMatrix(),
                                    glgeObject.getScaleMatrix()
                                )
                            ),
                            goog.vec.Mat4.create()
                        );

                        // Rotate -90 degress around X to convert from GLGE Y-up to VWF Z-up.

                        if ( glgeObject instanceof GLGE.Camera ) {
                            var columny = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( value, 1, columny );
                            var columnz = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( value, 2, columnz );
                            goog.vec.Mat4.setColumn( value, 2, columny );
                            goog.vec.Mat4.setColumn( value, 1, goog.vec.Vec4.negate( columnz, columnz ) );
                        }

                        break;
                
                    case "boundingbox":
                        var bbox;
                        if ( glgeObject.getBoundingVolume ) {
                            bbox = glgeObject.getBoundingVolume( true );
                            value = { min: { x: bbox.limits[0], y: bbox.limits[2], z: bbox.limits[4] }, max: { x: bbox.limits[1], y: bbox.limits[3], z: bbox.limits[5] } };
                        } 
                        break;

                    case "centerOffset":
                        var centerOff = getCenterOffset.call( this, glgeObject );
                        var scale = this.kernel.getProperty( nodeID, "scale", undefined );
                        value = new Array;
                        value.push( centerOff[0] * scale[0], centerOff[1] * scale[1], centerOff[2] * scale[2] ); 
                        break;

                    case "vertices":
                        value = getMeshVertices.call( this, glgeObject );
                        break;

                    case "vertexIndices":
                        value = getMeshVertexIndices.call( this, glgeObject );
                        break;

                    case "meshData":
                        value = [];
                        var scale = this.gettingProperty( nodeID, "scale", [] ); 
                        var meshList = findAllMeshes.call( this, glgeObject );
                        for ( var i = 0; i < meshList.length; i++ ) {
                            value.push( {  "vertices": getMeshVertices.call( this, meshList[i] ),
                                           "vertexIndices": getMeshVertexIndices.call( this, meshList[i] ),
                                           "scale": scale 
                                        } );
                        }
                        break;
 
                    case "lookAt": {
                            value = "";
                            var lookAtObject = glgeObject.getLookat();
                            if ( lookAtObject ) {
                                value = getObjectID.call( glgeModel, lookAtObject, false, false );
                            }
                        }
                        break;

                    case "pickable":
                        if ( glgeObject.getPickable ){
                            value = glgeObject.getPickable();
                        }                            
                        break;

                    case "visible":
                        if ( glgeObject.getVisible ) {
                            value = glgeObject.getVisible();
                        }
                        break;

                    default:
                        // handle all of the other types
                        prototypes = getPrototypes.call( this, this.kernel.kernel.kernel, node["type"] );
                        if ( isGlgeMaterialDefinition.call( this, prototypes ) ){
                            value = getMaterialProperty.call( this, nodeID, propertyName, propertyValue );
                        } else if ( isGlgeCameraDefinition.call( this, prototypes ) ) {
                            value = getCameraProperty.call( this, nodeID, propertyName, propertyValue );
                        } else if ( isGlgeLightDefinition.call( this, prototypes ) ) {
                            value = getLightProperty.call( this, nodeID, propertyName, propertyValue );
                        } else if ( isGlgeParticleSystemDefinition.call( this, prototypes ) ) {
                            value = getParticleSystemProperty.call( this, nodeID, propertyName, propertyValue );
                        } else if ( isGlgeSceneDefinition.call( this, prototypes ) ) {
                            value = getSceneProperty.call( this, nodeID, propertyName, propertyValue );
                        } else {
                            if ( !validProperty ) {
                                value = undefined;
                            }   
                        }
                        break;    

                }
            } else if ( this.state.scenes[nodeID] ) {
                value = getSceneProperty.call( this, nodeID, propertyName, propertyValue );
            } 

//            if ( value && value instanceof Object && !( value instanceof Array ) && !( value instanceof Float32Array ) ){
//                console.info( "WARNING: gettingProperty( "+nodeID+", "+propertyName+" ) returning an OBJECT: " + value );
//            }

            return value;

        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

//        callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters
//            return undefined;
//        },


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

//        executing: function( nodeID, scriptText, scriptType ) {
//            return undefined;
//        },

        // == ticking =============================================================================

//        ticking: function( vwfTime ) {
//        },

    } );

    // == Private functions ==================================================================

    // -- checkCompatibility -------------------------------------------------------------

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

    // -- initScene ------------------------------------------------------------------------

    function initScene( sceneNode ) {

        if ( sceneNode && !sceneNode.modelInited ) {
            sceneNode.modelInited = true;

            //findAllColladaObjs.call( this, sceneNode.glgeScene, sceneNode.ID );
        }
    } 

    // -- loadCollada ------------------------------------------------------------------------  
    
    function loadCollada( parentNode, node, propertyNotifyCallback ) {

        // Create new GLGE collada object
        node.glgeObject = new GLGE.Collada;

        // Set properties on new GLGE collada object
        var sceneNode = this.state.scenes[ this.state.sceneRootID ];
        var colladaLoadedCallback = setColladaCallback.call( this, node.glgeObject, sceneNode, 
                                                             propertyNotifyCallback );
        node.glgeObject.vwfID = node.ID;
        node.glgeObject.setDocument( node.source, window.location.href, colladaLoadedCallback );

        // Add the new GLGE collada object to the list of those that need to be loaded
        sceneNode.srcColladaObjects.push( node.glgeObject );
        
        // If the new node has a parent, attach its GLGE object to that of the parent
        // Else, attach it to the scene directly as a top-level object
        if ( parentNode && parentNode.glgeObject )
            parentNode.glgeObject.addCollada( node.glgeObject );
        else if ( sceneNode && sceneNode.glgeScene )
            sceneNode.glgeScene.addCollada( node.glgeObject );
    }


    // -- findCollada ------------------------------------------------------------------------

    function findCollada( grp, nodeID ) {

        if ( grp && grp.getChildren ) {
            var children = grp.getChildren();
            var sceneNode = this.state.scenes[ this.state.sceneRootID ];    

            for ( var i = 0; i < children.length; i++ ) {
                if ( children[i].constructor == GLGE.Collada ) {
                    var modelID = nodeID;
                    var glgeModel = this;

                    sceneNode.xmlColladaObjects.push( children[i] );
                    setColladaCallback.call( this, children[i], sceneNode );

                    children[i].loadedCallback = colladaLoaded;
                    sceneNode.pendingLoads++;
                }
                findCollada.call( this, children[i] ); 
            }
        }
    }


    // -- setColladaCallback ------------------------------------------------------------------------

    function setColladaCallback( glgeColladaObject, sceneNode, propertyNotifyCallback ) {

        var self = this;

        // Update the number of pending loads on the scene node
        // This information is just for our own knowledge; it is not used anywhere
        // (But double-check to make sure no one has added a reference before you do anything drastic)
        sceneNode.pendingLoads++;

        // Set the callback as defined below
        glgeColladaObject.loadedCallback = colladaLoaded;

        function colladaLoaded( colladaObject ) {

            // Undo default GLGE rotation applied in GLGE.Collada.initVisualScene that adjusts for +Y up
            colladaObject.setRot( 0, 0, 0 );

            // Update the number of pending loads on the scene node
            // This information is just for our own knowledge; it is not used anywhere
            // (But double-check to make sure no one has added a reference before you do anything drastic)
            sceneNode.pendingLoads--;

            // Now that this object has loaded, remove it from the list of objects to be loaded            
            var removedFromLoadList = false;
            for ( var i = 0; !removedFromLoadList && i < sceneNode.srcColladaObjects.length; i++ ) {
                if ( sceneNode.srcColladaObjects[ i ] == colladaObject ){
                    sceneNode.srcColladaObjects.splice( i, 1 );
                    removedFromLoadList = true;
                }
            }
            for ( var i = 0; !removedFromLoadList && i < sceneNode.xmlColladaObjects.length; i++ ) {
                if ( sceneNode.xmlColladaObjects[ i ] == colladaObject ){
                    sceneNode.xmlColladaObjects.splice( i, 1 );
                    removedFromLoadList = true;
                }
            }

            // Since prototypes are created before the object, it does not get "setProperty" updates for
            // its prototype (and behavior) properties.  Therefore, we cycle through those properties to
            // notify the drivers of the property values so they can react accordingly
            // TODO: Have the kernel send the "setProperty" updates itself so the driver need not
            if ( propertyNotifyCallback )
                propertyNotifyCallback();

            // If the VWF node for the newly loaded collada has a callback function, call it
            // TODO: Since the callback resumes the queue, maybe we should not call it if there are still
            //       objects to be loaded
            var id = colladaObject.vwfID || getObjectID.call( self, colladaObject, true, false );
            if ( id && ( id != "" ) ) {
                var colladaNode = self.state.nodes[ id ];
                if ( colladaNode && colladaNode.loadedCallback ) {
                    colladaNode.loadedCallback( true );                    
                }
            }
        }
        return colladaLoaded;
    }

    // -- findColladaParent ------------------------------------------------------------------------

    function findAllColladaObjs( glgeScene, nodeID ) {

        findCollada.call( this, glgeScene, nodeID );

    }

    // -- findColladaParent ------------------------------------------------------------------------

    function findColladaParent( glgeObject ) {
        var colladaObj = undefined;
        var currentObj;
        if ( glgeObject ) {
            currentObj = glgeObject;
            while ( !colladaObj && currentObj ) {
                if ( currentObj.constructor == GLGE.Collada )
                    colladaObj = currentObj;
                else
                    currentObj = currentObj.parent;
            } 
        }
        return colladaObj;    
    }


    // -- setSceneProperty ------------------------------------------------------------------------

    function setSceneProperty( nodeID, propertyName, propertyValue ) {

        var value = propertyValue;
        var sceneNode = this.state.scenes[ nodeID ];

        if ( sceneNode && sceneNode.glgeScene ) {
            switch ( propertyName ) {
                case "ambientColor":
                    if ( propertyValue )
                        sceneNode.glgeScene.setAmbientColor( propertyValue );
                    else
                        this.logger.warn( "Invalid ambient color");
                    break;
                case "activeCamera":
                        if ( this.state.nodes[ propertyValue ] ) {
                            setActiveCamera.call( this, sceneNode, propertyValue );
                        }
                    break;
                case "backgroundColor":
                    if ( propertyValue )
                        sceneNode.glgeScene.setBackgroundColor( propertyValue );
                    else
                        this.logger.warn( "Invalid background color");
                    break;

                default:
                    value = undefined;
                    break;
            }
        }
        return value;

    }

    // -- setParticleSystemProperty ------------------------------------------------------------------------

    function setParticleSystemProperty( nodeID, propertyName, propertyValue ) {

        var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
        var value = propertyValue;
        switch ( propertyName ) {
            case "numberParticles":
                node.glgeObject.setNumParticles( propertyValue );
                break;
            case "lifeTime":
                node.glgeObject.setLifeTime( propertyValue );
                break;
            case "maxLifeTime":
                node.glgeObject.setMaxLifeTime( propertyValue );
                break;
            case "minLifeTime":
                node.glgeObject.setMinLifeTime( propertyValue );
                break;
            case "startSize":
                node.glgeObject.setStartSize( propertyValue );
                break;
            case "endSize":
                node.glgeObject.setEndSize( propertyValue );
                break;
            case "loop":
                node.glgeObject.setLoop( propertyValue );
                break;
            case "velocity":
                if ( propertyValue )
                    node.glgeObject.setVelocity( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;
            case "maxVelocity":
                if ( propertyValue )
                    node.glgeObject.setMaxVelocity( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;            
            case "minVelocity":
                if ( propertyValue )
                    node.glgeObject.setMinVelocity( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;    
            case "startAcceleration":
                if ( propertyValue )
                    node.glgeObject.setStartAccelertaion( propertyValue[0], propertyValue[1], 
                                                          propertyValue[2] );
                break;
            case "endAcceleration":
                if ( propertyValue )
                    node.glgeObject.setEndAccelertaion( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;
            case "maxStartAcceleration":
                if ( propertyValue )
                    node.glgeObject.setMaxStartAccelertaion( propertyValue[0], propertyValue[1], 
                                                             propertyValue[2] );
                break;
            case "maxEndAcceleration":
                if ( propertyValue )
                    node.glgeObject.setMaxEndAccelertaion( propertyValue[0], propertyValue[1], 
                                                           propertyValue[2] );
                break;
            case "minStartAcceleration":
                if ( propertyValue )
                    node.glgeObject.setMinStartAccelertaion( propertyValue[0], propertyValue[1], 
                                                             propertyValue[2] );
                break;
            case "minEndAcceleration":
                if ( propertyValue )
                    node.glgeObject.setMinEndAccelertaion( propertyValue[0], propertyValue[1], 
                                                           propertyValue[2] );
                break;
            case "startColor":
                if ( propertyValue )
                    node.glgeObject.setStartColor( propertyValue );
                break;
            case "endColor":
                if ( propertyValue )
                    node.glgeObject.setEndColor( propertyValue );
                break;
            case "image":
                node.glgeObject.setImage( propertyValue );
                break;
            default:
                value = undefined;
                break;
        }
        return value;

    }

    // -- setCameraProperty ------------------------------------------------------------------------

    function setCameraProperty( nodeID, propertyName, propertyValue ) {

        var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
        var value = propertyValue;
        switch ( propertyName ) {
            case "cameraType":
                switch ( propertyValue ) {
                    case "perspective":
                        node.glgeObject.setType( GLGE.C_PERSPECTIVE );
                        break;
                    case "orthographic":
                        node.glgeObject.setType( GLGE.C_ORTHO );
                        break;
                    default:
                        value = undefined;
                        break;
                }
                break;
            case "far":
                node.glgeObject.setFar( Number( propertyValue ) );
                break;
            case "near":
                node.glgeObject.setNear( Number( propertyValue ) );
                break;
            case "fovy":
                node.glgeObject.setFovY( Number( propertyValue ) );
                break;            
            case "aspect":
                
                // If the propertyValue is real, set it
                // Else, it will be set to be the aspect ratio of the GLGE canvas
                if ( propertyValue )
                    node.glgeObject.setAspect( Number( propertyValue ) );
                break;            
//            case "orthoscale":
//                if ( propertyValue ) { 
//                    node.glgeObject.setOrthoScale( Number( propertyValue ) );
//                }
//                break;
            default:
                value = undefined;
                break;
        }
        return value;

    }

    // -- setMaterialProperty ------------------------------------------------------------------------

    function setMaterialProperty( nodeID, propertyName, propertyValue ) {

        var node = this.state.nodes[ nodeID ]; 
        var value = propertyValue;
        var txtr, mat, txtrPropValue;

        if ( propertyValue ) {
            if ( node.glgeMaterial && node.glgeMaterial.textures ) {
                mat = node.glgeMaterial;
                txtr = node.glgeMaterial.textures[0];
            } else if ( node.glgeObject && node.glgeObject.material ) {
                mat = node.glgeObject.material; 
                txtr = node.glgeObject.material.textures[0];
            }            
            switch ( propertyName ) {
                case "texture": {
                    
            // setting the texture back to the same value is causing a problem, need 
            // to find out why so this get and check can be removed
            txtrPropValue = getMaterialProperty.call( this, nodeID, propertyName );
                    //console.info( "txtrProp = " + txtrPropValue );
                    //console.info( "Setting the texture of: " + nodeID + " to " + propertyValue);    
                    if ( ( propertyValue !== undefined ) && ( propertyValue != "" ) && ( propertyValue != txtrPropValue ) ) {
                        var textureType = "image";
                        if ( propertyValue == "canvas" ) {
                            textureType = "canvas";
                        } else if ( propertyValue.indexOf( "canvas_" ) == 0 ) {
                            textureType = "canvas";   
                        } else if ( this.state.nodes[propertyValue] ) {
                            textureType = "camera";
                        } else if ( !isImageFileRef.call( this, propertyValue ) /* isVideoFileRef.call( this, propertyValue ) */ ) {
                            textureType = "video";
                        }

                        //console.info( "     mat: " + mat );
                        //console.info( "     txtr: " + txtr );                        
                        //console.info( "     textureType: " + textureType );

                        var isCorrectTexture = false;
                        if ( txtr ) {
                            switch ( textureType ){ 
                                case "image":
                                    isCorrectTexture = ( txtr instanceof GLGE.Texture );
                                    break;
                                case "canvas":
                                    isCorrectTexture = ( txtr instanceof GLGE.TextureCanvas );
                                    break;
                                case "camera":
                                    isCorrectTexture = ( txtr instanceof GLGE.TextureCamera );
                                    break;
                                case "video":
                                    isCorrectTexture = ( txtr instanceof GLGE.TextureVideo );
                                    break;                                    
                            }
                        }

                        //console.info( "     isCorrectTexture: " + isCorrectTexture );

                        if ( isCorrectTexture ) {
                            if ( textureType == "video" || textureType == "image" ){
                                txtr.setSrc( propertyValue );   
                            } else if ( "camera" ) {
                                var camNode = this.state.nodes[ propertyValue ];
                                var cam = findCamera.call( this, camNode );
                                if ( cam ) {
                                    txtr.setCamera( cam );
                                } 
                            } 
                        } else if ( mat ) {
                            var txt;
					        var ml = new GLGE.MaterialLayer;
					        ml.setMapto( GLGE.M_COLOR );
					        ml.setMapinput( GLGE.UV1 );
                            //console.info( "     new textureType: " + textureType );

                            switch ( textureType ) {
                                case "image":
                                    txt = new GLGE.Texture();
                                    txt.setSrc( propertyValue );
                                    break;
                                case "canvas":
                                    //console.info( "     GLGE.TextureCanvas with id = " + propertyValue );
                                    txt = new GLGE.TextureCanvas( undefined, "512", "512", propertyValue );
                                    break;
                                case "camera":
                                    txt = new GLGE.TextureCamera( undefined, "512", "512" );
                                    var camNode = this.state.nodes[ propertyValue ];
                                    var cam = findCamera.call( this, camNode );
                                    if ( cam ) {
                                        txt.setCamera( cam );
                                    }                                     
                                    break;
                                case "video":
                                    txt = new GLGE.TextureVideo( undefined, "1024", "512" );
                                    txt.setSrc( propertyValue );
                                    ml.setScaleX( -1 );
                                    ml.setScaleY( -1 );                                    
                                    break;                                  
                            }
                            //console.info( "     txt: " + txt );
                            mat.addTexture( txt );
					        ml.setTexture( txt );
					        mat.addMaterialLayer( ml );
                        }
                    }
                    }
                    break;

                case "color":
                    if ( mat ) { mat.setColor( propertyValue ); } 
                    break;                
                case "ambient":
                    if ( mat ) { mat.setAmbient( propertyValue ); } 
                    break;
                case "specColor":
                    if ( mat ) { mat.setSpecularColor( propertyValue ); } 
                    break;
                case "shininess":
                    if ( mat ) { mat.setShininess( propertyValue ); } 
                    break;  
                case "reflect":
                    if ( mat ) { mat.setReflectivity( propertyValue ); } 
                    break;
                case "specular":
                    if ( mat ) { mat.setSpecular( propertyValue ); } 
                    break;
                case "emit":
                    if ( mat ) { mat.setEmit( propertyValue ); } 
                    break; 
                case "alpha":
                    if ( mat ) { mat.setAlpha( propertyValue ); } 
                    break;                    
                case "binaryAlpha":
                    if ( mat ) { mat.setBinaryAlpha( propertyValue ); } 
                    break; 

                default:
                    value = undefined;
                    break;
            }
        }

        return value;
    }


    // -- setLightProperty ------------------------------------------------------------------------

    function setLightProperty( nodeID, propertyName, propertyValue ) {

        if ( propertyValue === undefined ) return;

        var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
        var value = propertyValue;

        switch ( propertyName ) {
            case "lightType":
                switch ( propertyValue ) {
                    case "point":
                        node.glgeObject.setType( GLGE.L_POINT );
                        break;
                    case "directional":
                        node.glgeObject.setType( GLGE.L_DIR );
                        break;
                    case "spot":
                        node.glgeObject.setType( GLGE.L_SPOT );
                        break;
                    default:
                        value = undefined;
                        break;
                }
                break;
            case "enable":
                if ( propertyValue && propertyValue != "false" ) {
                    node.glgeObject.enableLight();
                } else {
                    node.glgeObject.disableLight();
                }
                break;

            case "glge-constantAttenuation":
                node.glgeObject.setAttenuationConstant( propertyValue );
                break;

            case "glge-linearAttenuation":
                node.glgeObject.setAttenuationLinear( propertyValue );
                break;

            case "glge-quadraticAttenuation":
                node.glgeObject.setAttenuationQuadratic( propertyValue );
                break;

            case "glge-spotCosCutOff":
                node.glgeObject.setSpotCosCutOff( propertyValue );
                break;

            case "glge-spotCutOff":
                node.glgeObject.setSpotCutOff( propertyValue );
                break;

            case "glge-spotExponent":
                node.glgeObject.setSpotExponent( propertyValue );
                break;

            case "color":
                node.glgeObject.setColor( propertyValue );
                break;

            case "diffuse":
                node.glgeObject.setColor(propertyValue); // no setDiffuse() in GLGE 0.7
                break;

            case "specular":
            case "glge-specular":
                node.glgeObject.specular = propertyValue; // no setSpecular() in GLGE 0.7
                break;

            case "glge-samples":
                node.glgeObject.setShadowSamples( propertyValue );
                break;

            case "glge-softness":
                node.glgeObject.setShadowSoftness( propertyValue );
                break;

            case "glge-bufferHeight":
                node.glgeObject.setBufferHeight( propertyValue );
                break;

            case "glge-bufferWidth":
                node.glgeObject.setBufferWidth( propertyValue );
                break;

            case "glge-shadowBias":
                node.glgeObject.setShadowBias( propertyValue );
                break;

            case "distance":
                node.glgeObject.setDistance( propertyValue );
                break;

            case "castShadows":
                node.glgeObject.setCastShadows( propertyValue );
                break;

            case "glge-spotSoftness":
                node.glgeObject.setSpotSoftness( propertyValue );
                break;

            case "glge-spotSoftnessDistance":
                node.glgeObject.setSpotSoftDistance( propertyValue );
                break;

            case "glge-cascadeLevels":
                node.glgeObject.setCascadeLevels( propertyValue );
                break;

            default:
                value = undefined;
                break;
        }
        return value;

    }

    // -- getSceneProperty ------------------------------------------------------------------------------

    function getSceneProperty( nodeID, propertyName, propertyValue ) {

        var color = undefined, tempClr;
        var sceneNode = this.state.scenes[nodeID] // { name: childName, glgeObject: undefined }
        var value = undefined;
        switch ( propertyName ) {
              case "ambientColor":
                color = vwfColor.call( this, sceneNode.glgeScene.getAmbientColor() );
                value = color.toString();
                break;
            case "activeCamera":
                if ( sceneNode.glgeScene.camera ) {
                    value = getObjectID.call( this, sceneNode.glgeScene.camera, false, false );
                }
                break;

            case "backgroundColor":
                tempClr = sceneNode.glgeScene.getBackgroundColor();
                if ( tempClr ) {
                    if ( tempClr.r && isNaN( tempClr.r ) ) tempClr.r = 0;
                    if ( tempClr.g && isNaN( tempClr.g ) ) tempClr.g = 0;
                    if ( tempClr.b && isNaN( tempClr.b ) ) tempClr.b = 0;
                    if ( tempClr.a && isNaN( tempClr.a ) ) tempClr.a = 0;
                    color = vwfColor.call( this, tempClr );
                    value = color.toString();
                }
                break;
            
            default:
                value = undefined;
                break;

        }
        return value;

    }

    // -- getParticleSystemProperty ------------------------------------------------------------------------------

    function getParticleSystemProperty( nodeID, propertyName, propertyValue ) {

        var value = undefined;
        var obj, color;
        var node = this.state.nodes[nodeID];
        if ( node && node.glgeObject ) {
            var ps = node.glgeObject;
            switch ( propertyName ) {
                case "numberParticles":
                    if ( ps.getNumParticles )
                        value = ps.getNumParticles();
                    break;
                case "maxLifeTime":
                    if ( ps.getMaxLifeTime )
                        value = ps.getMaxLifeTime();
                    break;
                case "minLifeTime":
                    if ( ps.getMinLifeTime )
                    value = ps.getMinLifeTime();
                    break;
                case "startSize":
                    if ( ps.getStartSize )
                        value = ps.getStartSize();
                    break;
                case "endSize":
                    if ( ps.getEndSize )
                        value = ps.getEndSize();
                    break;
                case "loop":
                    if ( ps.getLoop )
                        value = ps.getLoop();
                    break;
                case "maxVelocity":
                    if ( ps.getMaxVelocity ) {
                        obj = ps.getMaxVelocity();    
                        value = [ obj.x, obj.y, obj.z ]; 
                    }
                    break;            
                case "minVelocity":
                    if ( ps.getMinVelocity ) {
                        obj = ps.getMinVelocity();
                        value = [ obj.x, obj.y, obj.z ];
                    }
                    break;    
                case "maxStartAcceleration":
                    if ( ps.getMaxStartAccelertaion ) {
                        obj = ps.getMaxStartAccelertaion();
                        value = [ obj.x, obj.y, obj.z ];
                    }
                    break;
                case "maxEndAcceleration":
                    if ( ps.getMaxEndAccelertaion ) {
                       obj = ps.getMaxEndAccelertaion();
                       value = [ obj.x, obj.y, obj.z ];
                    }
                    break;
                case "minStartAcceleration":
                    if ( ps.getMinStartAccelertaion ) {
                        obj = ps.getMinStartAccelertaion();
                        value = [ obj.x, obj.y, obj.z ];
                    }
                    break;
                case "minEndAcceleration":
                    if ( ps.getMinEndAccelertaion )
                        obj = ps.getMinEndAccelertaion();
                        value = [ obj.x, obj.y, obj.z ]; 
                    break;
                case "startColor":
                    if ( ps.getStartColor ) {
                        color = vwfColor.call( this, ps.getStartColor() );
                        value = color.toString();
                    } else { value = undefined; }
                    break;
                case "endColor":
                    if ( ps.getEndColor ){
                        color = vwfColor.call( this, ps.getEndColor() );
                        value = color.toString();
                    } else { value = undefined; }
                    break;
                case "image":
                    if ( ps.getImage )
                        value = ps.getImage();
                    break;
                default:
                    value = undefined;
                    break;
            }
        }
        return value;

    }

    // -- getObjectProperty ------------------------------------------------------------------------------

    function getObjectProperty( nodeID, propertyName, propertyValue ) {

        var node = this.state.nodes[ nodeID ]; 
        var value = undefined;
        var txtr, mat;

        switch ( propertyName ) {
            case "mesh": {
                    if ( node.glgeObject && node.glgeObject && node.glgeObject.getMesh ) {
                        value = node.glgeObject.getMesh();
                    }
                }
                break;
        }

        return value;
    }

    // -- getMaterialProperty ------------------------------------------------------------------------------

    function getMaterialProperty( nodeID, propertyName, propertyValue ) {
        var node = this.state.nodes[ nodeID ]; 
        var value = undefined;
        var txtr, mat, obj, color;

        if ( node.glgeMaterial && node.glgeMaterial.textures ) {
            mat = node.glgeMaterial;
            txtr = node.glgeMaterial.textures[0];
        } else if ( node.glgeObject && node.glgeObject.material ) {
            mat = node.glgeObject.material; 
            txtr = node.glgeObject.material.textures[0];
        }   

        switch ( propertyName ) {
            case "texture": 
                if ( txtr ) {
                    if ( txtr instanceof GLGE.TextureCanvas ) {
                        var cv = txtr.getCanvas();
                        value = "canvas";
                        if ( cv ) {
                            value = cv.getAttribute( 'id' );
                        }  
                    } else if ( txtr instanceof GLGE.TextureCamera ) {
                        var cam = txtr.getCamera();
                        if ( cam === this.state.cameraInUse ) {
                            value = "activeCamera"; 
                        } else {
                            value = getObjectID.call( this, cam, false, false );
                        }
                    } else {
                        if ( txtr.getSrc ) {
                            value = txtr.getSrc();
                        }
                    }
                }
                break;

            case "color":
                if ( mat ) { 
                    color = vwfColor.call( this, mat.getColor() );
                    value = color.toString();
                } else { value = undefined; }
                break;
                
            case "ambient":
                if ( mat ) { 
                    color = vwfColor.call( this, mat.getAmbient() );
                    value = color.toString();               
                } else { value = undefined; }
                break;
            case "specColor":
                if ( mat ) { 
                    color = vwfColor.call( this, mat.getSpecularColor() );
                    value = color.toString();  
                } else { value = undefined; }
                break;
            case "shininess":
                if ( mat ) { value = mat.getShininess(); } 
                break;  
            case "reflect":
                if ( mat ) { value = mat.getReflectivity(); } 
                break;
            case "specular":
                if ( mat ) { value = mat.getSpecular(); } 
                break;
            case "emit":
                if ( mat ) { value = mat.getEmit(); } 
                break; 
            case "alpha":
                if ( mat ) { value = mat.getAlpha(); } 
                break;                    
            case "binaryAlpha":
                if ( mat ) { value = mat.getBinaryAlpha(); } 
                break;  
        }

        return value;
    }

    // -- getLightProperty ------------------------------------------------------------------------------

    function getLightProperty( nodeID, propertyName, propertyValue ) {

        var value = undefined;
        var node = this.state.nodes[ nodeID ];
        var temp, color;

        switch( propertyName ) {

            case "lightType":
                switch ( node.glgeObject.getType() ) {
                    case GLGE.L_POINT:
                        value = "point";
                        break;
                    case GLGE.L_DIR:
                        value = "directional";
                        break;
                    case GLGE.L_SPOT:
                        value = "spot";
                        break;
                }
                break;

            case "glge-constantAttenuation":
                temp = node.glgeObject.getAttenuation();
                value = temp.constant;
                break;

            case "glge-linearAttenuation":
                temp = node.glgeObject.getAttenuation();
                value = temp.linear;
                break;

            case "glge-quadraticAttenuation":
                temp = node.glgeObject.getAttenuation();
                value = temp.quadratic;
                break;

            case "glge-spotCosCutOff":
                value = node.glgeObject.getSpotCosCutOff();
                break;

            case "glge-spotCutOff":
                node.glgeObject.getSpotCutOff( propertyValue );
                break;

            case "spotExponent":
                value = node.glgeObject.getSpotExponent();
                break;

            case "color":
                color = vwfColor.call( this, node.glgeObject.getColor() );
                value = color.toString();  
                break;

            case "diffuse":
                value = node.glgeObject.diffuse; // no getDiffuse() in GLGE 0.7
                break;

            case "glge-specular":
                value = node.glgeObject.specular; // no getSpecular() in GLGE 0.7
                break;

            case "glge-samples":
                value = node.glgeObject.getShadowSamples();
                break;

            case "glge-softness":
                value = node.glgeObject.getShadowSoftness();
                break;

            case "glge-bufferHeight":
                value = node.glgeObject.getBufferHeight();
                break;

            case "glge-bufferWidth":
                value = node.glgeObject.getBufferWidth();
                break;

            case "glge-shadowBias":
                value = node.glgeObject.getShadowBias();
                break;

            case "distance":
                value = node.glgeObject.getDistance();
                break;

            case "castShadows":
                value = node.glgeObject.getCastShadows();
                break;

            case "glge-spotSoftness":
                value = node.glgeObject.getSpotSoftness();
                break;
                
            case "glge-spotSoftnessDistance":
                value = node.glgeObject.getSpotSoftDistance();
                break;                

            case "glge-cascadeLevels":
                value = node.glgeObject.getCascadeLevels();
                break;

            default:
                value = undefined;
                break;
        }
        return value;    
    
    }

    // -- getCameraProperty ------------------------------------------------------------------------------

    function getCameraProperty(nodeID, propertyName, propertyValue) {

        var node = this.state.nodes[nodeID];
        var value = undefined;
        switch( propertyName ) {
            case "cameraType":
                switch ( node.glgeObject.getType() ) {
                    case GLGE.C_PERSPECTIVE:
                        value = "perspective";
                        break;
                    case GLGE.C_ORTHO:
                        value = "orthographic";
                        break;
                }
                break;
            case "far":
                value = node.glgeObject.getFar();
                break;
            case "near":
                value = node.glgeObject.getNear();
                break;
            case "fovy":
                value = node.glgeObject.getFovY();
                break;            
            case "aspect":
                value = node.glgeObject.getAspect();
                break;            
            case "orthoscale":
                value = node.glgeObject.getOrthoScale();
                break;
            default:
                value = undefined;
                break;
        }
        return value;

    }

    // -- findGlgeObject ------------------------------------------------------------------------------

    function findGlgeObject( objName, type, prototypes ) {

        var obj = undefined;
        var assetObj = undefined;
        var glgeObjName = "";

        for ( var key in GLGE.Assets.assets ) {
            assetObj = GLGE.Assets.assets[key];
            if ( assetObj ) {
                glgeObjName = name( assetObj );
                if ( glgeObjName == objName ) {
                    switch ( type ) {
                        case "http-vwf-example-com-mesh-vwf":
                            if ( assetObj.constructor == GLGE.Object )
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-node3-vwf":
                            if ( ( assetObj.constructor == GLGE.Group ) || ( assetObj.constructor == GLGE.Object ) )
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-light-vwf":
                            if ( assetObj.constructor == GLGE.Light )
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-camera-vwf":
                            if ( assetObj.constructor == GLGE.Camera )
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-scene-vwf":
                            if ( assetObj.constructor == GLGE.Scene )
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-particleSystem-vwf":
                            if ( assetObj.constructor == GLGE.ParticleSystem )
                                obj = assetObj;
                            break;
                    }
                    if ( obj ) break;
                }
            }
        }

        return obj;

    }

    // -- setActiveCamera ------------------------------------------------------------------------------

    function setActiveCamera( sceneNode, nodeID ) {

        if ( this.state.nodes[ nodeID ] ) {
            var glgeCamera = this.state.nodes[ nodeID ].glgeObject;
            if ( glgeCamera ) {
                setAspect.call( this, nodeID );
                this.state.cameraInUse = glgeCamera;
                sceneNode.glgeScene.setCamera( glgeCamera );
            }
        }

    }

    // -- setAspect ------------------------------------------------------------------------------

    function setAspect( nodeID ) {

        if ( this.state.nodes[ nodeID ] ) {
            var glgeCamera = this.state.nodes[ nodeID ].glgeObject;
            if ( glgeCamera ) {
                var canvas = document.getElementById( this.state.sceneRootID );
                glgeCamera.setAspect( canvas.width / canvas.height );
            }
        }
    }


    // -- createLight ------------------------------------------------------------------------------

    function createLight( nodeID, childID, childName ) {

        var child = this.state.nodes[childID];
        if ( child ) {
            child.glgeObject = new GLGE.Light();
            child.glgeObject.name = childName;
            child.name = childName;
            child.uid = child.glgeObject.uid;
            addGlgeChild.call( this, nodeID, childID );
        } 
               
    }

   // -- createCamera ------------------------------------------------------------------------------

    function createCamera( nodeID, childID, childName ) {

        var sceneNode = this.state.scenes[nodeID]
        var parent = sceneNode ? sceneNode : this.state.nodes[nodeID]
        if ( !sceneNode ) sceneNode = parent.glgeScene;
        if ( sceneNode && parent ) {
            var child = this.state.nodes[childID];
            if ( child ) {
                var cam;
                if ( sceneNode.camera && sceneNode.camera.glgeCameras ) {
                    if ( !sceneNode.camera.glgeCameras[childID] ) {
                        cam = new GLGE.Camera();
                        initCamera.call( this, cam );
                        sceneNode.camera.glgeCameras[childID] = cam;
                    } else {
                        cam = sceneNode.camera.glgeCameras[childID];
                    }
                    var glgeParent = parent.glgeObject;
                    if ( glgeParent && ( glgeParent instanceof GLGE.Scene || glgeParent instanceof GLGE.Group )) {
                        glgeParent.addObject( cam );
                    }

                    var glgeParent = parent.glgeObject;
                    if ( glgeParent && ( glgeParent instanceof GLGE.Scene || glgeParent instanceof GLGE.Group )) {
                        glgeParent.addObject( cam );
                    }

                    child.name = childName;
                    child.glgeObject = cam;
                    child.uid = child.glgeObject.uid;
                    cam.name = childName;
                }
            }
        }  

    }

   // -- createParticleSystem ------------------------------------------------------------------------------

    function createParticleSystem( nodeID, childID, childName ) {
        var glgeParent = undefined;
        var parentNode = this.state.nodes[ nodeID ];
        if ( parentNode && parentNode.glgeObject && parentNode.glgeObject.getChildren ) {
            glgeParent = parentNode.glgeObject;   
        }
        if ( !glgeParent ) {
            parentNode = this.state.scenes[ this.state.sceneRootID ];
            glgeParent = parentNode.glgeScene; 
        }
        if ( glgeParent ) {
            var ps = new GLGE.ParticleSystem();
            this.state.nodes[ childID ].glgeObject = ps; 
            glgeParent.addObject( ps );
        }
    }

   // -- initCamera ------------------------------------------------------------------------------

    function initCamera( glgeCamera ) {

        if ( glgeCamera ) {
            glgeCamera.setLoc( 0, 0, 0 );
            glgeCamera.setRot( Math.PI/2, 0, 0 ); // rotate to look at +Y, VWF's default orientation
            glgeCamera.setType( GLGE.C_PERSPECTIVE );
            glgeCamera.setRotOrder( GLGE.ROT_XZY );
        }
                
    }

   // -- getLocalBoundingBox ------------------------------------------------------------------------------

    function getLocalBoundingBox( glgeObject ) {

        var bBox = { xMin: Number.MAX_VALUE, xMax: -Number.MAX_VALUE,
                     yMin: Number.MAX_VALUE, yMax: -Number.MAX_VALUE,
                     zMin: Number.MAX_VALUE, zMax: -Number.MAX_VALUE };

        var glgeObjectList = [];
        findAllGlgeObjects.call( this, glgeObject, glgeObjectList );

        for ( var j = 0; j < glgeObjectList.length; j++ ) {
            var vertices = getMeshVertices.call( this, glgeObjectList[j] );
            for ( var i = 0; i < vertices.length; i++ ) {
                if ( vertices[i][0] < bBox.xMin )
                    bBox.xMin = vertices[i][0];
                if ( vertices[i][0] > bBox.xMax )
                    bBox.xMax = vertices[i][0];
                if ( vertices[i][1] < bBox.yMin )
                    bBox.yMin = vertices[i][1];
                if ( vertices[i][1] > bBox.yMax )
                    bBox.yMax = vertices[i][1];
                if ( vertices[i][2] < bBox.zMin )
                    bBox.zMin = vertices[i][2];
                if ( vertices[i][2] > bBox.zMax )
                    bBox.zMax = vertices[i][2];
            }
        }

        return bBox; 
           
    }

   // -- getCenterOffset ------------------------------------------------------------------------------

    function getCenterOffset( glgeObject ) {

        var offset = [ 0, 0, 0 ];
        if ( glgeObject ) {
            var bBox = getLocalBoundingBox.call( this, glgeObject )
            offset[0] = ( bBox.xMax + bBox.xMin ) * 0.50;
            offset[1] = ( bBox.yMax + bBox.yMin ) * 0.50;
            offset[2] = ( bBox.zMax + bBox.zMin ) * 0.50;
        }
        return offset;

    }

   // -- getNodeVertices ------------------------------------------------------------------------------

    function getNodeVertices( nodeID ) {

        if ( this.state.nodes[nodeID] ) {
            return getMeshVertices.call( this, this.state.nodes[nodeID] );
        }
        return undefined;

    }

   // -- getMeshVertices ------------------------------------------------------------------------------

    function getMeshVertices( glgeObject ) {

        var vertices = [];
        var glgeMesh;
        if ( glgeObject ) {
            if ( glgeObject.getChildren && !glgeObject.getMesh ) {
                var objects = []; 
                findAllGlgeObjects.call( this, glgeObject, objects );
                for ( var j = 0; j < objects.length; j++ ) {
                    if ( objects[j].getMesh ) {
                        var pos = objects[j].getMesh().positions;
                        if ( pos ) {
                            for ( var i = 0; i < pos.length; i = i + 3 ) {
                                vertices.push([pos[i], pos[i + 1], pos[i + 2]]);
                            }
                        }
                    }                    
                }
            } else if ( glgeObject.getMesh && glgeObject.getMesh() ) {
                glgeMesh = glgeObject.getMesh();
            } else if ( glgeObject.constructor == GLGE.Mesh ) {
                glgeMesh = glgeObject;
            }

            if ( glgeMesh ) {
                var pos = glgeMesh.positions;
                if ( pos ) {
                    for ( var i = 0; i < pos.length; i = i + 3 ) {
                        vertices.push( [pos[i], pos[i + 1], pos[i + 2]] );
                    }
                }            
            }
        }    
        return vertices;

    }

   // -- getNodeVertexIndices ------------------------------------------------------------------------------

    function getNodeVertexIndices( nodeID ) {

        if ( this.state.nodes[nodeID] ) {
            return getMeshVertexIndices.call( this, this.state.nodes[nodeID] );
        }
        return undefined;

    }

   // -- findAllGlgeObjects ------------------------------------------------------------------------------

    function findAllGlgeObjects( glgeNode, objList ) {

        if ( glgeNode ) {
            if ( glgeNode.constructor == GLGE.Object )
                objList.push( glgeNode );

            if ( glgeNode.getChildren ) {
                var nodeChildren = glgeNode.getChildren();
                for (var i = 0; i < nodeChildren.length; i++) {
                    findAllGlgeObjects.call( this, nodeChildren[i], objList );
                }
            }
        }

    }

   // -- findAllMeshes ------------------------------------------------------------------------------

    function findAllMeshes( glgeNode ) {

        var meshes = [];
        var objs = [];
        findAllGlgeObjects.call( this, glgeNode, objs );
        for ( var i = 0; i < objs.length; i++ ){
            if ( objs[i].getMesh && objs[i].getMesh() ) {
                meshes.push( objs[i].getMesh() );
            }       
        }
        return meshes;

    }

   // -- getGlgeObject ------------------------------------------------------------------------------

    function getGlgeObject( id ) {
        var glgeObj = undefined;
        var node = this.state.nodes[ id ];
        if ( !node && this.state.scenes[ id ] ) {
            node = this.state.scenes[ id ];
        }
        if ( node ) {
            glgeObj = node.glgeObject;
            if ( !glgeObj && node.glgeScene ) {
                glgeObj = node.glgeScene;
            }
        }
        return glgeObj;
    }

   // -- getObjectID ------------------------------------------------------------------------------

    function getObjectID( objectToLookFor, bubbleUp, debug ) {

        var objectIDFound = -1;
            
        while (objectIDFound == -1 && objectToLookFor) {
            if ( debug ) {
                this.logger.info("====>>>  vwf.model-glge.mousePick: searching for: " + path(objectToLookFor) );
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
                sOut = name(obj);
            else
                sOut = name(obj) + "." + sOut;
            obj = obj.parent;
        }
        return sOut;
    }

    function vwfColor( color ) {
        var vwfColor = {};
        vwfColor['r'] = color['r']*255;
        vwfColor['g'] = color['g']*255;
        vwfColor['b'] = color['b']*255;                                
        if ( color['a'] !== undefined && color['a'] != 1 ) {
            vwfColor['a'] = color['a'];
            vwfColor = new utility.color( "rgba("+vwfColor['r']+","+vwfColor['g']+","+vwfColor['b']+","+vwfColor['a']+")" );
        } else {
            vwfColor = new utility.color( "rgb("+vwfColor['r']+","+vwfColor['g']+","+vwfColor['b']+")" );
        }
        return vwfColor;        
    }

    function getMeshVertexIndices( glgeObject ) {
        var vertexIndices = [];
        var mesh;
        if ( glgeObject ) {
            if ( glgeObject.getMesh && glgeObject.getMesh() ) {
                mesh = glgeObject.getMesh();
            } else if ( glgeObject.constructor == GLGE.Mesh ) {
                mesh = glgeObject;
            }

            if ( mesh && mesh.faces ) {
                var faces = mesh.faces.data;
                if ( faces ) {
                    for (var i = 0; i < faces.length; i = i + 3) {
                        vertexIndices.push( [faces[i], faces[i + 1], faces[i + 2]] );
                    }
                }
            }
        }

        return vertexIndices;
    }

    // get the list of types this ID extends

    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }

    function isPrototype( nodeID, childID ) {
        var ptID;
        if ( ( nodeID == 0 && childID != this.kernel.application() ) || this.state.prototypes[ nodeID ] !== undefined ) {
            if ( nodeID != 0 || childID != this.kernel.application() ) {
                ptID = nodeID ? nodeID : childID;
                if ( this.state.prototypes[ ptID ] !== undefined ) {
                    ptID = childID;
                }
                return ptID;
            } 
        }
        return undefined;
    }


    function isGlgeSceneDefinition( prototypes ) {
        var foundGlge = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGlge; i++ ) {
                foundGlge = ( prototypes[i] == "http-vwf-example-com-navscene-vwf" || prototypes[i] == "http-vwf-example-com-scene-vwf" );    
            }
        }

        return foundGlge;
    }

    function isGlgeNodeDefinition( prototypes ) {
        var foundGlge = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGlge; i++ ) {
                foundGlge = ( prototypes[i] == "http-vwf-example-com-node3-vwf" );    
            }
        }

        return foundGlge;
    }

    function isGlgeCameraDefinition( prototypes ) {
        var foundGlge = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGlge; i++ ) {
                foundGlge = ( prototypes[i] == "http-vwf-example-com-camera-vwf" );    
            }
        }

        return foundGlge;
    }

    function isGlgeLightDefinition( prototypes ) {
        var foundGlge = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGlge; i++ ) {
                foundGlge = ( prototypes[i] == "http-vwf-example-com-light-vwf" );    
            }
        }

        return foundGlge;
    }

    function isGlgeParticleSystemDefinition( prototypes ) {
        var foundGlge = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGlge; i++ ) {
                foundGlge = ( prototypes[i] == "http-vwf-example-com-particlesystem-vwf" );    
            }
        }

        return foundGlge;
    }

    function isGlgeMaterialDefinition( prototypes ) {
        var foundGlge = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGlge; i++ ) {
                foundGlge = ( prototypes[i] == "http-vwf-example-com-material-vwf" );    
            }
        }

        return foundGlge;
    }
    // Search a GLGE.Scene for a child with the given name.

    function glgeSceneChild(glgeScene, childName) {

        var childToReturn = jQuery.grep(glgeScene.children || [], function (glgeChild) {
            return (glgeChild.name || glgeChild.id || glgeChild.sourceURL || "") == childName;
        }).shift();

        //this.logger.info("      glgeSceneChild( " + childName + " ) returns " + childToReturn);
        return childToReturn;

    }

    // Search a GLGE.Object, GLGE.Collada, GLGE.Light for a child with the given name.  TODO: really, it's anything with children[]; could be the same as glgeSceneChild().

    function glgeObjectChild( glgeObject, childName, childType, prototypes, recursive ) {
        
        var childToReturn = jQuery.grep( glgeObject.children || [], function ( glgeChild ) {
            return (glgeChild.colladaName || glgeChild.colladaId || glgeChild.name || glgeChild.id || "") == childName;
        }).shift();

        // to slow, and may bind to the incorrect object
        if ( recursive && childToReturn === undefined ) {
            if ( glgeObject.children ) {
            for ( var i = 0; i < glgeObject.children.length && childToReturn === undefined; i++ )
                childToReturn = glgeObjectChild.call( this, glgeObject.children[i], childName, childType, prototypes, recursive );
            }
        }
        return childToReturn;

    }

    function findMaterial( parentID, materialName, materialNode ) {

        var materialStringIndex, materialIndex;
        var parentNode = this.state.nodes[ parentID ];

        // the material name is a combination of the following information
        // groupParentName + 'Material' + indexOfTheMultiMaterial

        if ( parentNode ) {
            if ( parentNode.glgeObject ) {
                if ( parentNode.glgeObject.constructor == GLGE.Object ) {
                    if ( materialName == "material" ) {
                        materialNode.glgeObject = parentNode.glgeObject;
                        materialNode.glgeMaterial = materialNode.glgeObject.getMaterial();
                    }
                } else {
                    var index = materialName.substr( 8 );
                    var glgeObjs = [];
                    if ( index == "" ) index = 0;

                    findAllGlgeObjects.call( this, parentNode.glgeObject, glgeObjs );

                    for ( var i = 1; i < glgeObjs.length; i++ ) {
                        console.info( "WARNING:  passing other materials .......harding to index to 0 " );
                    }

                    if ( glgeObjs && glgeObjs.length && index < glgeObjs.length ) {
                        materialNode.glgeObject = glgeObjs[index];
                        materialNode.glgeMaterial = glgeObjs[index].getMaterial();
                    }
                }
            }
        }

    }

    function findMesh( parentID, meshName, meshNode ) {

        var materialStringIndex, materialIndex, childName;
        var parentNode = this.state.nodes[ parentID ];

        // the material name is a combination of the following information
        // groupParentName + 'Material' + indexOfTheMultiMaterial

        if ( parentNode ) {
            materialStringIndex = materialName.lastIndexOf( "Material" );
            materialIndex = Number( materialName.substr( materialStringIndex + 8 ) ) - 1;
            childName = materialName.substr( 0, materialStringIndex );

            if ( parentNode.glgeObject ) {
                var glgeObjs = [];
                var found = false;

                findAllGlgeObjects.call( this, parentNode.glgeObject, glgeObjs );

                if ( glgeObjs && glgeObjs.length ) {
                    for ( var i = 0; i < glgeObjs.length && !found; i++ ) {
                        if ( name( glgeObjs[i].parent ) == childName ) {
                            materialNode.glgeObject = glgeObjs[i];
                            materialNode.glgeMaterial = glgeObjs[i].getMaterial( materialIndex );
                            found = true;                        
                        }                   
                    }
                } else if ( parentNode.glgeObject.children.length == 1 && parentNode.glgeObject.children[0].constructor == GLGE.Object ) {

                    var glgeChild = parentNode.glgeObject.children[0];
                    materialNode.glgeObject = glgeChild;
                    materialNode.glgeMaterial = glgeChild.getMaterial( materialIndex );
                
                    if ( !( materialNode.glgeMaterial ) && ( childNode.glgeObject ) ) {
                        materialNode.glgeMaterial = childNode.glgeObject.getMaterial();
                    }
                }
            }
        }

    }

    function createMesh( node ) {
        if ( !node.glgeParent ) {
            node.glgeParent = this.state.nodes[ node.parentID ];    
        }
        
        if ( node.glgeParent ) {
            node.glgeObject = new GLGE.Group();
            node.glgeParent.addObject( node.glgeObject );
            var obj = new GLGE.Object();
            obj.setMaterial( new GLGE.Material() );
            obj.setMesh( new GLGE.Mesh() );
            node.glgeObject.addObject( obj );
        }        
    }

    function defineMesh( def, node ) {
        if ( node.glgeObject ) {
            var obj = new GLGE.Object();
            var mat = new GLGE.Material();
            var mesh = new GLGE.Mesh();

            if ( def.color ) {
                mat.setColor( def.color );
            }
            obj.setMaterial( mat );

            if ( def.positions )
                mesh.setPositions( def.positions );
            if ( def.normals )
                mesh.setNormals( def.normals );
            if ( def.uv1 )
                mesh.setUV( def.uv1 );
            if ( def.faces )
                mesh.setFaces( def.faces );

            obj.setMesh( mesh );
            node.glgeObject.addObject( obj );
        }        
    }
			
	function BuildBox(size,offset,color)
	{
		
		var hx = size[0]/2;
		var hy = size[1]/2;
		var hz = size[2]/2;
		
		var ox = offset[0];
		var oy = offset[1];
		var oz = offset[2];
		
		var planemesh = new GLGE.Mesh();
		var planeobj = new GLGE.Object();
		planeobj.setMesh(planemesh);
		
		var positions = [
		hx + ox,hy + oy,hz + oz, 
		hx + ox,hy + oy,-hz + oz, 
		hx + ox,-hy + oy,hz + oz, 
		hx + ox,-hy + oy,-hz + oz,
		-hx + ox,hy + oy,hz + oz,
		-hx + ox,hy + oy,-hz + oz, 
		-hx + ox,-hy + oy,hz + oz, 
		-hx + ox,-hy + oy,-hz + oz
		];
		
		var colors = [];
		for(var i = 0; i < (positions.length/3); i++)
		{	colors.push(color[0]);
			colors.push(color[1]);
			colors.push(color[2]);
			colors.push(color[3]);
		}
		
		var indexes = [0,2,6,6,4,0,1,3,7,7,5,1,0,1,3,3,2,0,4,5,7,7,6,4,0,1,5,5,4,0,2,3,7,7,6,2];
		
		planemesh.setPositions(positions);
		planemesh.setVertexColors(colors);
		planemesh.setFaces(indexes);
		
		var mat = new GLGE.Material();
		
		planeobj.setPickable(true);
		planeobj.setMaterial(mat);
		mat.setVertexColorMode(GLGE.VC_MUL);
		//mat.setColor(color);
		//mat.setEmit(color);
		//mat.setShadeless(true);
		//mat.setAmbient([.5,.5,.5,1]);
		return planeobj;
	}
	function BuildAxis()
	{	
		var red = [1,.55,.55,1];
		var green = [.55,1,.55,1];
		var blue = [.55,.55,1,1];
		
		var MoveGizmo = new GLGE.Group();
		MoveGizmo.addChild(BuildBox([1,.030,.030],[.5,0,0],red));               //move x
		MoveGizmo.addChild(BuildBox([.030,1,.030],[0,.5,0],green));//move y
		MoveGizmo.addChild(BuildBox([.030,.030,1],[0,0,.5],blue));//move z
		return MoveGizmo;
	}
    function addGlgeChild( parentID, childID ) {
        
        var glgeParent;
        var parent = this.state.nodes[ parentID ];
        if ( !parent && this.state.scenes[ parentID ] ) {
            parent = this.state.scenes[ parentID ];
            glgeParent = parent.glgeScene;
        } else {
            glgeParent = parent.glgeObject;
        }
            
        if ( glgeParent && this.state.nodes[ childID ]) {
            var child = this.state.nodes[ childID ];

            if ( child.glgeObject ) {
                glgeParent.addChild( child.glgeObject );
            }
        }
    }

    function isMovieFileRef( fileName ) {
        var isMovieFile = false;
        if ( fileName && fileName != "" ){
            var fileSplit = fileName.split( "." );
            var fileSLen = fileSplit ? fileSplit.length : 0;
            if ( fileSLen > 0 ) {
                switch ( fileSplit[ fileSLen-1 ] ) {
                    case "ogv":
                        isMovieFile = true;
                        break;
                }
            }             
        }
        return isMovieFile;
    }

    function isImageFileRef( fileName ) {
        var isImageFile = false;
        if ( fileName && fileName != "" ){
            var fileSplit = fileName.split( "." );
            var fileSLen = fileSplit ? fileSplit.length : 0;
            if ( fileSLen > 0 ) {
                switch ( fileSplit[ fileSLen-1 ] ) {
                    case "png":
                    case "jpeg":
                    case "bmp":
                    case "gif":
                    case "tif":
                    case "tiff":
                    case "jpg":
                    case "tga":
                        isImageFile = true;
                        break;
                }
            }             
        }
        return isImageFile;
    }
    function isVideoFileRef( fileName ) {
        var isVideoFile = false;
        if ( fileName && fileName != "" ){
            var fileSplit = fileName.split( "." );
            var fileSLen = fileSplit ? fileSplit.length : 0;
            if ( fileSLen > 0 ) {
                switch ( fileSplit[ fileSLen-1 ] ) {
                    case "ogg":
                    case "mjeg":
                    case "mpeg1":
                    case "mpeg":
                    case "avi":
                    case "mpg":
                    case "mp2":
                    case "m1v":
                        isVideoFile = true;
                        break;
                }
            }             
        }
        return isVideoFile;
    }  

    function findCamera( camNode ) {
        var cam = undefined;
        if ( camNode ) {
            if ( camNode.glgeObject && camNode.glgeObject instanceof GLGE.Camera ){
                cam = camNode.glgeObject;
            } else if ( camNode.glgeObject instanceof GLGE.Group ) {
                cam = new GLGE.Camera();
                camNode.glgeObject.addObject( cam );
            }
        }
        return cam;  
    }

} );
