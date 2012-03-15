"use strict";
define( [ "module", "vwf/model" ], function( module, model ) {

    // vwf/model/glge.js is an interface to the GLGE WebGL scene manager.

    // For historical reasons yet to be resolved, the GLGE model code currently resides in
    // vwf-model.glge.js intermixed with the view code. This driver is a gross hack to delegate model
    // calls to the appropriate parts of the GLGE view.

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {

            //this.glge_view = undefined;
 
            this.state.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
            this.state.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }
            this.state.kernel = this.kernel.kernel.kernel;

            this.state.sceneRootID = "index-vwf";

            this.delayedProperties = {};

            this.meshIndex = 1;

            //this.logger.enable = true;
        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childName, callback ) {

            var node, parentNode, glgeChild, prototypes;
            var kernel = this.kernel.kernel.kernel;

            if ( childExtendsID === undefined /* || childName === undefined */ )
                return;

//            this.logger.enable = true;
//            this.logger.info( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs,
//                                childSource, childType, childName );

            // find the parent node
            if ( nodeID ) {
                if ( this.state.nodes[ nodeID ] )
                    parentNode = this.state.nodes[ nodeID ];
                else 
                    parentNode = this.state.scenes[ nodeID ];

                if ( parentNode ) {
                    var glgeParent = parentNode.glgeObject ? parentNode.glgeObject : parentNode.glgeScene;
                    if ( glgeParent && childName ) {
                        glgeChild = glgeObjectChild.call( this, glgeParent, childName, childExtendsID );
                    }
                }
            }

            prototypes = getPrototypes.call( this, kernel, childExtendsID );
            if ( prototypes && isGlgeSceneDefinition.call( this, prototypes ) && childID == this.state.sceneRootID ) {

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
                } else {
                    var cam = new GLGE.Camera();
                    sceneNode.glgeScene.setCamera( cam );
                    sceneNode.camera.glgeCameras[ sceneNode.camera.defaultCamID ] = cam;
                }
                sceneNode.glgeScene.camera.name = "camera";
                this.state.cameraInUse = sceneNode.glgeScene.camera;

                var camType = "http://vwf.example.com/camera.vwf";
                vwf.createNode( childID, { "extends": camType }, "camera", undefined );    

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
                            sceneNode.glgeDocument.load( childSource );
                            sceneNode.pendingLoads++;
                            break;
                    }
                }
           
            } else if ( prototypes && isGlgeCameraDefinition.call( this, prototypes ) ) {
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

//                    if ( !glgeChild ) {
//                        console.info( "UNABLE TO BIND TO CAMERA: " + childName );
//                    }

                if ( !node.glgeObject ) {
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
            } else if ( prototypes && isGlgeLightDefinition.call( this, prototypes ) ) {
                node = this.state.nodes[childID] = {
                    name: childName,
                    glgeObject: glgeChild,
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID,
                    sourceType: childType,
                };
                if ( !node.glgeObject ) {
                    createLight.call( this, nodeID, childID, childName );
                }
            } else if ( prototypes && isGlgeParticleSystemDefinition.call( this, prototypes ) ) {
                node = this.state.nodes[childID] = {
                    name: childName,
                    glgeObject: glgeChild,
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID
                };
                if ( !node.glgeObject ) {
                    createParticleSystem.call( this, nodeID, childID, childName );
                }
            } else if ( prototypes && isGlgeNodeDefinition.call( this, prototypes ) ) {

                var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                switch ( childType ) {
                    case "model/vnd.collada+xml":
                        callback( false );
                        node = this.state.nodes[childID] = {
                            name: childName,  
                            glgeObject: undefined,
                            source: childSource,
                            ID: childID,
                            parentID: nodeID,
                            sourceType: childType,
                            type: childExtendsID,
                            loadingCollada: callback 
                        };
                        loadCollada.call( this, parentNode, node ); 
                        break;

                    case "text/xml":
                        node = this.state.nodes[childID] = {
                            name: childName,  
                            glgeObject: undefined,
                            source: childSource,
                            ID: childID,                                
                            parentID: nodeID,
                            type: childExtendsID,
                            sourceType: childType 
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
                                sourceType: childType 
                            };
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
                        };
                        if ( node.glgeObject ) {
                            if ( ( node.glgeObject.constructor == GLGE.Collada ) ) {
                                callback( false );
                                node.glgeObject.vwfID = childID;
                                sceneNode.xmlColladaObjects.push( node.glgeObject );
                                //console.info( "ADDING XML Collada +++++++++++++++++++ " + sceneNode.xmlColladaObjects.length );
                                setupColladaCallback.call( this, node.glgeObject, sceneNode );
                                node.loadingCollada = callback;                                    
                            }
                        } else {
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
                        break;
                }  

                this.settingProperty( childID, "playing", false );  // TODO: these are matching the defaults in node3; they should be sent through creatingProperty() so that we don't have to ask
                this.settingProperty( childID, "looping", false );  // TODO: these are matching the defaults in node3; they should be sent through creatingProperty() so that we don't have to ask
                this.settingProperty( childID, "speed", 1 );  // TODO: these are matching the defaults in node3; they should be sent through creatingProperty() so that we don't have to ask

                //console.info( "============ " +childID+ " ============" );
                //console.info( "     LOCAL: " + JSON.stringify( this.gettingProperty( childID, "localMatrix", [] ) ) );
                //console.info( "     MODEL: " + JSON.stringify( this.gettingProperty( childID, "modelMatrix", [] ) ) );


            } else if ( prototypes && isGlgeMaterialDefinition.call( this, prototypes ) ) {
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
            } else {

                switch ( childExtendsID ) {
                    case "appscene-vwf":
                    case "index-vwf":
                    case "http-vwf-example-com-node-vwf":
                    case "http-vwf-example-com-node2-vwf":
                    case "http-vwf-example-com-scene-vwf":
                    case "http-vwf-example-com-glge-vwf":
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

//            this.logger.enable = false;
               
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
        
//        addingChild: function( nodeID, childID, childName ) {
//        },

        // -- movingChild ------------------------------------------------------------------------
        
//        movingChild: function( nodeID, childID, childName ) {
//        },

        // -- removingChild ------------------------------------------------------------------------
        
//        removingChild: function( nodeID, childID, childName ) {
//        },

        // -- parenting ----------------------------------------------------------------------------

//        parenting: function( nodeID ) {  // TODO: move to a backstop model
//        },

        // -- childrening --------------------------------------------------------------------------

//        childrening: function( nodeID ) {  // TODO: move to a backstop model
//        },

        // -- naming -------------------------------------------------------------------------------

//        naming: function( nodeID ) {  // TODO: move to a backstop model
//        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {

            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;

            if ( !( propertyValue === undefined ) ) {
                var node = this.state.nodes[ nodeID ];
                if ( !node ) node = this.state.scenes[ nodeID ];
                if ( node ) {
                    switch ( propertyName ) {

                        case "meshDefinition":
                            createMesh( propertyValue, node );
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

            //console.info( "glgeModel.settingProperty( "+nodeID+", "+propertyName+", "+propertyValue+" )" );
            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
            var value = undefined;

            if ( node && node.glgeObject && propertyValue !== undefined ) {

                var validProperty = false;
                var glgeObject = node.glgeObject;
                var isAnimatable = glgeObject.animate; // implements GLGE.Animatable?
    isAnimatable = isAnimatable && glgeObject.animation || propertyName == "looping" && glgeObject.constructor == GLGE.ParticleSystem; // has an animation?
    isAnimatable = isAnimatable && node.name != "cityblock.dae"; // TODO: this is a hack to prevent disabling the animation that keeps the world upright


                value = propertyValue;
    //            vwf.logger.info( namespace + ".satProperty " + path( glgeObject ) + " " + propertyName + " " + propertyValue);

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
                            }

                            else {
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

                var pieDiv180 = 3.14159 / 180.0;
                var pv = propertyValue;
                switch ( propertyName ) {

                    case "roll":
                        glgeObject.setRotX( pv * pieDiv180 );
                        break;

                    case "pitch":
                        glgeObject.setRotY( pv * pieDiv180 );
                        break;

                    case "yaw":
                        glgeObject.setRotZ( pv * pieDiv180 );
                        break;

                    case "rotX":
                        glgeObject.setRotX( pv );
                        break;

                    case "rotY":
                        glgeObject.setRotY( pv );
                        break;

                    case "rotZ":
                        glgeObject.setRotZ( pv );
                        break;

                    case "eulers":
                        if ( pv && pv.constructor == Array && pv.length > 2 ) {
                            glgeObject.setRot( pv[0] * pieDiv180, pv[1]* pieDiv180, pv[2] * pieDiv180 );
                        }
                        break;
                    case "rotation":
                        if ( pv && pv.constructor == Array && pv.length > 2 ) {
                            glgeObject.setRot( pv[0], pv[1], pv[2] );
                        }
                        break;
                    case "orientation":
                        value = new Array;
                        if ( pv && pv.constructor == Array && pv.length > 3 ) {
                            glgeObject.setQuat( pv[0], pv[1], pv[2], pv[3] );
                        }
                        break;
                    case "position":
                        if ( pv && pv.constructor == Array && pv.length > 2 ) {
                            glgeObject.setLoc( pv[0], pv[1], pv[2] );
                        }
                        break;
                    case "posRotMatrix":
                        if ( pv && pv.constructor == Array && pv.length > 3 ) {
                             glgeObject.setLoc( pv[0], pv[1], pv[2] );
                             glgeObject.setRotMatrix( pv[3] );
                        }
                        break;                            
                    case "worldEulers":
                        if ( pv && pv.constructor == Array && pv.length > 2 ) {
                            glgeObject.setDRot( pv[0] * pieDiv180, pv[1] * pieDiv180, pv[2] * pieDiv180 );
                        }
                        break;
                    case "worldPosition":
                        if ( pv && pv.constructor == Array && pv.length > 2 ) {
                            glgeObject.setDLoc( pv[0], pv[1], pv[2] );
                        }
                        break;
                    case "scale":
                        if ( pv && pv.constructor == Array && pv.length > 2 ) {                            
                            glgeObject.setScale( pv[0], pv[1], pv[2] );
                        }
                        break;
                    case "transform":
                        glgeObject.setStaticMatrix( goog.vec.Mat4.transpose( propertyValue || [], goog.vec.Mat4.create() ) );
                        break;

                    case "rotationMatrix":{
                            if ( glgeObject.setRotMatrix ) 
                                glgeObject.setRotMatrix( propertyValue );
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
                            var lookAtNode = this.state.nodes[ propertyValue ];
                            if ( lookAtNode && lookAtNode.glgeObject ) {
                                glgeObject.setLookat( lookAtNode.glgeObject );
                            } else {
                                if ( glgeObject.getLookat && glgeObject.getLookat() ) 
                                    glgeObject.setLookat( null );
                            }
                        }
                        break;

                    default:
                        switch ( node[ "type" ] ) {
                            case "http-vwf-example-com-material-vwf":
                                value = setMaterialProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-light-vwf":
                                value = setLightProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-camera-vwf":
                                value = setCameraProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-particlesystem-vwf":
                                value = setParticleSystemProperty.call( this, nodeID, propertyName, propertyValue );
                                break;                        
                            case "http-vwf-example-com-glge-vwf":
                            case "appscene-vwf":
                                value = setSceneProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            default:
                                if ( !validProperty ) {
                                    value = undefined;
                                }
                                break;
                        }
                        break;
                }
            } else if ( this.state.scenes[nodeID] ) {
                value = setSceneProperty.call( this, nodeID, propertyName, propertyValue );
            } else {
                var propArray;
                if ( !this.delayedProperties[nodeID] ) {
                    this.delayedProperties[nodeID] = {};
                }
                propArray = this.delayedProperties[nodeID];

                propArray[ propertyName ] = propertyValue;
            }

             return value;        
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
            var value = undefined;
            var glgeModel = this;

            if ( node && node.glgeObject ) {

                var glgeObject = node.glgeObject;
                var isAnimatable = glgeObject.animate; // implements GLGE.Animatable?
    isAnimatable = isAnimatable && glgeObject.animation || propertyName == "looping" && glgeObject.constructor == GLGE.ParticleSystem; // has an animation?
    isAnimatable = isAnimatable && node.name != "cityblock.dae"; // TODO: this is a hack to prevent disabling the animation that keeps the world upright

                if ( isAnimatable ) {

                    switch ( propertyName ) {

                        case "playing":
                            value = !Boolean( glgeObject.getPaused() );
                            break;

                        case "looping":
                            value = Boolean( glgeObject.getLoop() );
                            break;

                        case "speed":
                            value = glgeObject.getFrameRate() / 30; // TODO: not safe to assume default speed is 30 fps
                            break;
                    }
                }

			    var _180divPi = ( 180.0/3.14159 );
                switch ( propertyName ) {

                    case "roll":
                        value = glgeObject.getRotX() * _180divPi;
                        break;

                    case "pitch":
                        value = glgeObject.getRotY() * _180divPi;
                        break;

                    case "yaw":
                        value = glgeObject.getRotZ() * _180divPi;
                        break;

                    case "rotX":
                        value = glgeObject.getRotX();
                        break;

                    case "rotY":
                        value = glgeObject.getRotY();
                        break;

                    case "rotZ":
                        value = glgeObject.getRotZ();
                        break;

                    case "eulers":
                        value = new Array;
                        if ( glgeObject.setRotMode ){
                            glgeObject.setRotMode( 1 );
                            value.push( glgeObject.getRotX() * _180divPi, glgeObject.getRotY()* _180divPi, glgeObject.getRotZ()* _180divPi );
                        }
                        break;
                    case "rotation":
                        value = new Array;
                        if ( glgeObject.setRotMode ){
                            glgeObject.setRotMode( 1 );
                            value.push( glgeObject.getRotX(), glgeObject.getRotY(), glgeObject.getRotZ() );
                        }
                        break;
                    case "orientation":
                        value = new Array;
                        if ( glgeObject.setRotMode ){
                            glgeObject.setRotMode( 2 );
                            value.push( glgeObject.getQuatX(), glgeObject.getQuatY(), glgeObject.getQuatZ(), glgeObject.getQuatW() );
                        }
                        break;
                    case "position":
                        value = new Array;
                        value.push( glgeObject.getLocX(), glgeObject.getLocY(), glgeObject.getLocZ() );
                        break;
                    case "posRotMatrix":
                        value = new Array;
                        value.push( glgeObject.getLocX() );
                        value.push( glgeObject.getLocY() );
                        value.push( glgeObject.getLocZ() );
                        value.push( glgeObject.getRotMatrix() );
                        break;
                    case "worldEulers":
                        value = new Array;
                        value.push( glgeObject.getDRotX()* _180divPi, glgeObject.getDRotY()* _180divPi, glgeObject.getDRotZ()* _180divPi );
                        break;
                    case "worldPosition":
                        value = new Array;
                        value.push( glgeObject.getDLocX(), glgeObject.getDLocY(), glgeObject.getDLocZ() );
                        break;
                    case "scale":
                        value = new Array;                            
                        value.push( glgeObject.getScaleX(), glgeObject.getScaleY(), glgeObject.getScaleZ() );
                        break;

                    case "visible":
                        value = glgeObject.getModelMatrix();   
                        break;

                    case "transform":
                        // We would use glgeObject.getLocalMatrix(), but glgeObject.localMatrix
                        // isn't always recalculated. So, we need to replicate the calculations from
                        // glgeObject.getModelMatrix().
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
                        break;
                
                    case "boundingbox":
                        var bbox = getLocalBoundingBox.call( this, glgeObject );
                        var scale = this.kernel.getProperty( nodeID, "scale", undefined );
                        value = { min: [ bbox.xMin * scale[0], bbox.yMin* scale[1], bbox.zMin*scale[2] ], max: [ bbox.xMax * scale[0], bbox.yMax* scale[1], bbox.zMax*scale[2] ] };
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
                        //console.info( "gettingProperty", " GETTING meshData -------------------" );
                        value = [];
                        var scale = this.gettingProperty( nodeID, "scale", [] ); 
                        var meshList = findAllMeshes.call( this, glgeObject );
                        for ( var i = 0; i < meshList.length; i++ ) {
                            value.push( {  "vertices": getMeshVertices.call( this, meshList[i] ),
                                           "vertexIndices": getMeshVertexIndices.call( this, meshList[i] ),
                                           "scale": scale 
                                        } );
                        }
                        //console.info( "gettingProperty", "  (meshData)  value = " + value + "      value.length = " + value.length );
                        break;
 
                    case "lookAt": {
                            value = "";
                            var lookAtObject = glgeObject.getLookat();
                            if ( lookAtObject ) {
                                value = getObjectID.call( glgeModel, lookAtObject, false, false );
                            }
                        }
                        break;

                    case "localMatrix": {
                            if ( glgeObject.getLocalMatrix ) {
                                var mat4 = goog.vec.Mat4.createFromArray( glgeObject.getLocalMatrix() );
                                goog.vec.Mat4.transpose( mat4, mat4 );
                                value = mat4;
                            }
                        }
                        break;                         

                    case "modelMatrix": {
                            if ( glgeObject.getModelMatrix ) {
                                var mat4 = goog.vec.Mat4.createFromArray( glgeObject.getModelMatrix() );
                                goog.vec.Mat4.transpose( mat4, mat4 );
                                value = mat4;
                            }
                        }
                        break;

                    case "rotationMatrix":{
                            if ( glgeObject.getRotMatrix ) {
                                value = glgeObject.getRotMatrix();
                            }
                        }
                        break;

                    default:
                        switch ( node.type ) {
                            case "http-vwf-example-com-mesh-vwf":
                                value = getObjectProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-material-vwf":
                                value = getMaterialProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-light-vwf":
                                value = getLightProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-camera-vwf":
                                value = getCameraProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-particlesystem-vwf":
                                value = getParticleSystemProperty.call( this, nodeID, propertyName, propertyValue );
                                break;                        
                            case "http-vwf-example-com-scene-vwf":
                                value = getSceneProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                        }
                        break;    

                }
            }

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

    // -- initScene ------------------------------------------------------------------------

    function initScene( sceneNode ) {

        if ( sceneNode && !sceneNode.modelInited ) {
            sceneNode.modelInited = true;

            //findAllColladaObjs.call( this, sceneNode.glgeScene, sceneNode.ID );
        }
    } 

    // -- loadCollada ------------------------------------------------------------------------  
    
    function loadCollada( parentNode, node ) {

        var nodeCopy = node; 
        var nodeID = node.ID;
        var childName = node.name;
        var glgeModel = this;
        var sceneNode = this.state.scenes[ this.state.sceneRootID ];

        function colladaLoaded( collada ) { 
            sceneNode.pendingLoads--;
            var removed = false;
            if ( nodeCopy && nodeCopy.colladaLoaded ) {
                nodeCopy.colladaLoaded( true );
            }
            //console.info( "++ 2 ++ "+collada.vwfID+" colladaLoaded( "+ collada.docURL +" )" );
            for ( var j = 0; j < sceneNode.srcColladaObjects.length; j++ ) {
                if ( sceneNode.srcColladaObjects[j] == collada ){
                    sceneNode.srcColladaObjects.splice( j, 1 );
                    removed = true;
                }
            } 
            if ( removed ) {
                //console.info( "REMOVING SRC Collada ------------------------------- " + sceneNode.srcColladaObjects.length );
                if ( sceneNode.srcColladaObjects.length == 0 ) {
                    //vwf.setProperty( glgeModel.state.sceneRootID, "loadDone", true );
                    loadComplete.call( glgeModel );
                }

                var id = collada.vwfID;
                if ( !id ) id = getObjectID.call( glgeModel, collada, true, false );
                if ( id && id != "" ){
                    //glgeModel.kernel.callMethod( id, "loadComplete" );
                    if ( glgeModel.state.nodes[id] ) {
                        var colladaNode = glgeModel.state.nodes[id];
                        if ( colladaNode.loadingCollada ) {
//                            console.info( "== LOADING COLLADA complete       ==" );
//                            console.info( "====================================" );
                            colladaNode.loadingCollada( true );                    
                        }
                    }
                }
            }
        }

        node.name = childName;
        node.glgeObject = new GLGE.Collada;
        sceneNode.srcColladaObjects.push( node.glgeObject );
        //console.info( "ADDING SRC Collada +++++++++++++++++++ " + sceneNode.srcColladaObjects.length );
        node.glgeObject.vwfID = nodeID;

        node.glgeObject.setDocument( node.source, window.location.href, colladaLoaded );
        node.glgeObject.loadedCallback = colladaLoaded;
        sceneNode.pendingLoads++;
        
        if ( parentNode && parentNode.glgeObject ) {
            parentNode.glgeObject.addCollada( node.glgeObject );
         } else if ( sceneNode ) {
//          if ( !sceneNode.glgeScene ) {
//              this.initScene.call( this, sceneNode );
//          }
            if ( sceneNode.glgeScene ) {
                sceneNode.glgeScene.addCollada( node.glgeObject );
            }
             
        }
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
                    //console.info( "ADDING XML Collada +++++++++++++++++++ " + sceneNode.xmlColladaObjects.length );
                    setupColladaCallback.call( this, children[i], sceneNode );

                    children[i].loadedCallback = colladaLoaded;
                    sceneNode.pendingLoads++;
                }
                findCollada.call( this, children[i] ); 
            }
        }
    }


    // -- setupColladaCallback ------------------------------------------------------------------------

    function setupColladaCallback( glgeCollada, scene ) {

        var glgeModel = this;
        var sceneNode = scene;
        function colladaLoaded( collada ) { 
            sceneNode.pendingLoads--;
            var bRemoved = false;
            //console.info( "++ XML Loaded ++        colladaLoaded( "+ collada.docURL +" )" );
            for ( var j = 0; j < sceneNode.xmlColladaObjects.length; j++ ) {
                if ( sceneNode.xmlColladaObjects[j] == collada ){
                    sceneNode.xmlColladaObjects.splice( j, 1 );
                    bRemoved = true;
                }
            } 
            if ( bRemoved ){
                //console.info( "REMOVING XML Collada -------------------- " + sceneNode.xmlColladaObjects.length );
                if ( sceneNode.xmlColladaObjects.length == 0 ) {
                    //this.kernel.setProperty( modelID, "loadDone", true );
                    loadComplete.call( glgeModel );
                }
            }
            var id = collada.vwfID;
            if ( !id ) id = getObjectID.call( glgeModel, collada, true, false );
            if ( id && id != "" ){
                //glgeModel.kernel.callMethod( id, "loadComplete" );
                if ( glgeModel.state.nodes[id] ) {
                    var colladaNode = glgeModel.state.nodes[id];
                    if ( colladaNode.loadingCollada ) {
//                        console.info( "== LOADING COLLADA complete       ==" );
//                        console.info( "====================================" );
                        colladaNode.loadingCollada( true );                    
                    }
                }
            }
        }
        glgeCollada.loadedCallback = colladaLoaded;
        sceneNode.pendingLoads++;

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
                    sceneNode.glgeScene.setAmbientColor( propertyValue );
                    break;
                case "activeCamera":
                    if ( sceneNode.camera ) {
                        if ( this.state.nodes[ propertyValue ] ) {
                            setActiveCamera.call( this, sceneNode, propertyValue );
                        }
                    }
                    break;
                case "backgroundColor":
                    sceneNode.glgeScene.setBackgroundColor( propertyValue );
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

        //console.info( "glge.setParticleSystemProperty( " + nodeID + ", " + propertyName + ", " + propertyValue + " )");

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
                node.glgeObject.setVelocity( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;
            case "maxVelocity":
                node.glgeObject.setMaxVelocity( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;            
            case "minVelocity":
                node.glgeObject.setMinVelocity( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;    
            case "startAcceleration":
                node.glgeObject.setStartAccelertaion( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;
            case "endAcceleration":
                node.glgeObject.setEndAccelertaion( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;
            case "maxStartAcceleration":
                node.glgeObject.setMaxStartAccelertaion( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;
            case "maxEndAcceleration":
                node.glgeObject.setMaxEndAccelertaion( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;
            case "minStartAcceleration":
                node.glgeObject.setMinStartAccelertaion( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;
            case "minEndAcceleration":
                node.glgeObject.setMinEndAccelertaion( propertyValue[0], propertyValue[1], propertyValue[2] );
                break;
            case "startColor":
                node.glgeObject.setStartColor( propertyValue );
                break;
            case "endColor":
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

        //console.info( "glge-model.setMaterialProperty( " + nodeID + ", " + propertyName + ", '" + propertyValue + "' )");
        var node = this.state.nodes[ nodeID ]; 
        var value = propertyValue;
        var txtr, mat;

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
                    if ( !(( propertyValue === undefined ) || ( propertyValue == "" )) ) {
                        if ( txtr ) {
                            //console.info( "Setting texture source: " + propertyValue );
                            txtr.setSrc( propertyValue );
                        } else if ( mat ) {
					        var ml = new GLGE.MaterialLayer;
					        ml.setMapto( GLGE.M_COLOR );
					        ml.setMapinput( GLGE.UV1 );
                            var txt = new GLGE.Texture();
                            txt.setSrc( propertyValue );
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

        //console.info( "glge-model.setLightProperty( " + nodeID + ", " + propertyName + ", '" + propertyValue + "' )");
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

            case "constantAttenuation":
                node.glgeObject.setAttenuationConstant( propertyValue );
                break;

            case "linearAttenuation":
                node.glgeObject.setAttenuationLinear( propertyValue );
                break;

            case "quadraticAttenuation":
                node.glgeObject.setAttenuationQuadratic( propertyValue );
                break;

            case "spotCosCutOff":
                node.glgeObject.setSpotCosCutOff( propertyValue );
                break;

            case "spotExponent":
                node.glgeObject.setSpotExponent( propertyValue );
                break;

//                  case "diffuse":
//                    node.glgeObject.setDiffuse( propertyValue );
//                    break;

//                  case "specular":
//                    node.glgeObject.setSpecular( propertyValue );
//                    break;

            case "samples":
                node.glgeObject.setShadowSamples( propertyValue );
                break;

            case "softness":
                node.glgeObject.setShadowSoftness( propertyValue );
                break;

            case "bufferHeight":
                node.glgeObject.setBufferHeight( propertyValue );
                break;

            case "bufferWidth":
                node.glgeObject.setBufferWidth( propertyValue );
                break;

            case "shadowBias":
                node.glgeObject.setShadowBias( propertyValue );
                break;

            case "distance":
                node.glgeObject.setDistance( propertyValue );
                break;

            case "castShadows":
                node.glgeObject.setCastShadows( propertyValue );
                break;

            default:
                value = undefined;
                break;
        }
        return value;

    }

    // -- getSceneProperty ------------------------------------------------------------------------------

    function getSceneProperty( nodeID, propertyName, propertyValue ) {

        var sceneNode = this.state.scenes[nodeID] // { name: childName, glgeObject: undefined }
        var value = undefined;
        switch ( propertyName ) {
              case "ambientColor":
                var color = sceneNode.glgeScene.getAmbientColor();
                value = [ color['r'], color['g'], color['b'] ];
                break;
            case "activeCamera":
                if ( sceneNode.glgeScene.camera && sceneNode.glgeScene.camera.ID ) {
                    value = sceneNode.glgeScene.camera.ID;
                } else { 
                    value = name( sceneNode.glgeScene.camera );
                }
                break;

            case "backgroundColor":
                var color = sceneNode.glgeScene.getBackgroundColor();
                value = [ color['r'], color['g'], color['b'] ];
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
        var node = this.state.nodes[nodeID];
        if ( node && node.glgeObject ) {
            var ps = node.glgeObject;
            switch ( propertyName ) {
                case "numberParticles":
                    if ( ps.getNumParticles )
                        value = ps.getNumParticles();
                    break;
                case "lifeTime":
                    if ( ps.getLifeTime )
                        value = ps.getLifeTime();
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
                case "velocity":
                    if ( ps.getVelocity )
                        value = ps.getVelocity();
                    break;
                case "maxVelocity":
                    if ( ps.getMaxVelocity )
                        value = ps.getMaxVelocity();
                    break;            
                case "minVelocity":
                    if ( ps.getMinVelocity )
                        value = ps.getMinVelocity();
                    break;    
                case "startAcceleration":
                    if ( ps.getStartAccelertaion )
                        value = ps.getStartAccelertaion();
                    break;
                case "endAcceleration":
                    if ( ps.getEndAccelertaion )
                        value = ps.getEndAccelertaion();
                    break;
                case "maxStartAcceleration":
                    if ( ps.getMaxStartAccelertaion )
                        value = ps.getMaxStartAccelertaion();
                    break;
                case "maxEndAcceleration":
                    if ( ps.getMaxEndAccelertaion )
                       value = ps.getMaxEndAccelertaion();
                    break;
                case "minStartAcceleration":
                    if ( ps.getMinStartAccelertaion )
                        value = ps.getMinStartAccelertaion();
                    break;
                case "minEndAcceleration":
                    if ( ps.getMinEndAccelertaion )
                        value = ps.getMinEndAccelertaion();
                    break;
                case "startColor":
                    if ( ps.getStartColor )
                        value = ps.getStartColor();
                    break;
                case "endColor":
                    if ( ps.getEndColor )
                        value = ps.getEndColor();
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

        //console.info( "glge-model.getMaterialProperty( " + nodeID + ", " + propertyName + ", '" + propertyValue + "' )");
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

        //console.info( "glge-model.getMaterialProperty( " + nodeID + ", " + propertyName + ", '" + propertyValue + "' )");
        var node = this.state.nodes[ nodeID ]; 
        var value = undefined;
        var txtr, mat;

        switch ( propertyName ) {
            case "texture": {
                    if ( node.glgeMaterial && node.glgeMaterial.textures ) {
                        txtr = node.glgeMaterial.textures[0];
                    } else if ( node.glgeObject && node.glgeObject.material ) {
                        txtr = node.glgeObject.material.textures[0];
                    }

                    if ( txtr ) {
                        value = txtr.getSrc();
                    }
                }
                break;
            case "color":
                if ( mat ) { value = mat.getColor(); } 
                break;                
            case "ambient":
                if ( mat ) { value = mat.getAmbient(); } 
                break;
            case "specColor":
                if ( mat ) { value = mat.getSpecularColor(); } 
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
        var temp;

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

            case "constantAttenuation":
                temp = node.glgeObject.getAttenuation();
                value = temp.constant;
                break;

            case "linearAttenuation":
                temp = node.glgeObject.getAttenuation();
                value = temp.linear;
                break;

            case "quadraticAttenuation":
                temp = node.glgeObject.getAttenuation();
                value = temp.quadratic;
                break;

            case "spotCosCutOff":
                value = node.glgeObject.getSpotCosCutOff();
                break;

            case "spotExponent":
                value = node.glgeObject.getSpotExponent();
                break;

//                  case "diffuse":
//                    value = node.glgeObject.getDiffuse();
//                    break;

//                  case "specular":
//                    value = node.glgeObject.getSpecular();
//                    break;

            case "samples":
                value = node.glgeObject.getShadowSamples();
                break;

            case "softness":
                value = node.glgeObject.getShadowSoftness();
                break;

            case "bufferHeight":
                value = node.glgeObject.getBufferHeight();
                break;

            case "bufferWidth":
                value = node.glgeObject.getBufferWidth();
                break;

            case "shadowBias":
                value = node.glgeObject.getShadowBias();
                break;

            case "distance":
                value = node.glgeObject.getDistance();
                break;

            case "castShadows":
                value = node.glgeObject.getCastShadows();
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

    function findGlgeObject( objName, type ) {

        var obj = undefined;
        var assetObj = undefined;
        var glgeObjName = "";

        //console.info( "=======   Trying to find: " + objName + " of type: " + type );
        for ( var key in GLGE.Assets.assets ) {
            assetObj = GLGE.Assets.assets[key];
            if ( assetObj ) {
                glgeObjName = name( assetObj );
                //console.info( "            Checking: '" + glgeObjName + "' of type " + assetObj.constructor.name );
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

//        if ( obj ) {
//            console.info( "     =======   FOUND : " + objName );
//        } else {
//            console.info( "**     WARNING ======= UNABLE TO FIND: " + objName );
//        }

        return obj;

    }

    // -- setActiveCamera ------------------------------------------------------------------------------

    function setActiveCamera( sceneNode, cameraID ) {

        if ( this.state.nodes[ cameraID ] ) {
            var glgeCamera = this.state.nodes[ cameraID ].glgeObject;
            if ( glgeCamera ) {
                var canvas = document.getElementById(this.state.sceneRootID);
                glgeCamera.setAspect( canvas.width / canvas.height );
                this.state.cameraInUse = glgeCamera;
                this.state.cameraInUseID = cameraID;
                sceneNode.glgeScene.setCamera( glgeCamera );
                sceneNode.camera.ID = cameraID;
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

        var sceneNode = this.state.scenes[nodeID];
        if ( sceneNode ) {
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
            glgeCamera.setRot( 0, 0, 0 );
            glgeCamera.setType( GLGE.C_PERSPECTIVE );
            glgeCamera.setRotOrder( GLGE.ROT_XZY );
        }
                
    }

   // -- getLocalBoundingBox ------------------------------------------------------------------------------

    function getLocalBoundingBox( glgeObject ) {

        var bBox = { xMin: Number.MAX_VALUE, xMax: Number.MIN_VALUE,
                     yMin: Number.MAX_VALUE, yMax: Number.MIN_VALUE,
                     zMin: Number.MAX_VALUE, zMax: Number.MIN_VALUE };

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

        //console.info( "         findAllGlgeObjects( "+name(glgeNode)+", objList )" );
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

        //console.info( "     findAllMeshes(" + name(glgeNode) + " )" );
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

   // -- getObjectID ------------------------------------------------------------------------------

    function getObjectID( objectToLookFor, bubbleUp, debug ) {

        var objectIDFound = -1;
            
        while (objectIDFound == -1 && objectToLookFor) {
            if ( debug ) {
                console.info("====>>>  vwf.model-glge.mousePick: searching for: " + path(objectToLookFor) );
            }
            jQuery.each( this.state.nodes, function (nodeID, node) {
                if ( node.glgeObject == objectToLookFor && !node.glgeMaterial ) {
                    if ( debug ) { console.info("pick object name: " + name(objectToLookFor) + " with id = " + nodeID ); }
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

   
    function createModelNode( parentID, glgeObject ) {
        
        //console.info( "createModelNode( " + parentID + ", " + glgeObject + " )" );

        var extendType = "http://vwf.example.com/node3.vwf";
        var objName = name( glgeObject );

        if ( glgeObject.constructor == GLGE.Mesh ) {
            var mesh = glgeObject;
            if ( objName == "" ) {
                objName = "Mesh" + this.meshIndex++;
                mesh.name = objName;
            }             
            extendType = "http://vwf.example.com/mesh.vwf";
        } 

        this.kernel.createNode( parentID, { "extends": extendType }, objName, undefined );

    }

    function loadComplete() {
        var itemsToDelete = [];
        for ( var id in this.delayedProperties ) {
            if ( this.state.nodes[id] ) {
                var props = this.delayedProperties[id];
                for ( var propertyName in props ) {
                    //console.info( id + " delayed property set: " + propertyName + " = " + props[propertyName] );
                    Object.getPrototypeOf( this ).settingProperty.call( this, id, propertyName, props[propertyName] );
                }
                itemsToDelete.push( id );
            }
        }
        
        for ( var i = 0; i < itemsToDelete.length; i++ ) {
            delete this.delayedProperties[itemsToDelete[i]];
        }
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

    function isGlgeSceneDefinition( prototypes ) {
        var foundGlge = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGlge; i++ ) {
                foundGlge = ( prototypes[i] == "http-vwf-example-com-glge-vwf" );    
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

        //vwf.logger.info("      glgeSceneChild( " + childName + " ) returns " + childToReturn);
        return childToReturn;

    }

    // Search a GLGE.Object, GLGE.Collada, GLGE.Light for a child with the given name.  TODO: really, it's anything with children[]; could be the same as glgeSceneChild().

    function glgeObjectChild( glgeObject, childName, childType ) {
        
        var childToReturn = jQuery.grep( glgeObject.children || [], function ( glgeChild ) {
            return (glgeChild.colladaName || glgeChild.colladaId || glgeChild.name || glgeChild.id || "") == childName;
        }).shift();

        if ( !childToReturn ) {
            childToReturn = findGlgeObject.call( this, childName, childType );
        }
        //vwf.logger.info("      glgeObjectChild( " + childName + " ) returns " + childToReturn);
        return childToReturn;

    }

    function findMaterial( parentID, materialName, materialNode ) {

        var materialStringIndex, materialIndex, childName;
        var parentNode = this.state.nodes[ parentID ];

        // the material name is a combination of the following information
        // groupParentName + 'Material' + indexOfTheMultiMaterial

        if ( parentNode ) {
            if ( parentNode.glgeObject ) {
                if ( parentNode.glgeObject.constructor == GLGE.Object ) {
                    if ( materialName == "material" ) {
                        materialNode.glgeObject = parentNode.glgeObject;
                        materialNode.glgeMaterial = materialNode.glgeObject.material;                        
                    }
                } else {
                    materialStringIndex = materialName.lastIndexOf( "Material" );
                    materialIndex = Number( materialName.substr( materialStringIndex + 8 ) ) - 1;
                    childName = materialName.substr( 0, materialStringIndex );
                    var glgeObjs = [];
                    var found = false;

                    findAllGlgeObjects.call( this, parentNode.glgeObject, glgeObjs );

                    if ( glgeObjs && glgeObjs.length ) {
                        //console.info( "findMaterial found " + glgeObjs.length + " children searching for: " + childName );
                        for ( var i = 0; i < glgeObjs.length && !found; i++ ) {
                            //console.info( "     objName: " + name( glgeObjs[i] ) + "    parentName: " + name( glgeObjs[i].parent ) );
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
                            materialNode.glgeMaterial = childNode.glgeObject.material;
                        }
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
                    //console.info( "findMaterial found " + glgeObjs.length + " children searching for: " + childName );
                    for ( var i = 0; i < glgeObjs.length && !found; i++ ) {
                        //console.info( "     objName: " + name( glgeObjs[i] ) + "    parentName: " + name( glgeObjs[i].parent ) );
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
                        materialNode.glgeMaterial = childNode.glgeObject.material;
                    }
                }
            }
        }

    }

    function createMesh( def, node ) {
        if ( !node.glgeParent ) {
            node.glgeParent = this.state.nodes[ node.parentID ];    
        }
        
        if ( node.glgeParent ) {
            node.glgeObject = new GLGE.Group();
            node.glgeParent.addObject( node.glgeObject );
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
                //console.info( "    adding child: " + childID + " to " + parentID );
            }
        }
    }


} );


//    // -- find_glge_view ---------------------------------------------------------------------------

//    function find_glge_view( kernel ) {

//        // Walk the pipeline backwards to the kernel.

//        while ( kernel.kernel ) {
//            kernel = kernel.kernel;
//        }

//        // Locate the GLGE view in the kernel's view list.
//        return kernel.views.reduce( function( dummy, view ) {
//            return view.namespace == "vwf.view.glge" ? view : undefined;
//        }, undefined );

//    }