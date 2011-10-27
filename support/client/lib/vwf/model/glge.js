define( [ "module", "vwf/model" ], function( module, model ) {

    // vwf/model/glge.js is an interface to the GLGE WebGL scene manager.

    // For historical reasons yet to be resolved, the GLGE model code currently resides in
    // vwf-model.glge.js intermixed with the view code. This driver is a gross hack to delegate model
    // calls to the appropriate parts of the GLGE view.

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {

            this.glge_view = undefined;
 
            this.state.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
            this.state.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }

            this.glgeColladaObjects = [];
            this.parentIDMap = {};
            this.childIDMap = {};

            this.delayedProperties = {};
 
        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
        
            var node;
            var childName = nodeID.substring( nodeID.lastIndexOf( '-' )+1 );

            switch ( nodeExtendsID ) {
                case "http-vwf-example-com-types-glge":
                case "appscene-vwf":
                    if ( nodeID == "index-vwf" ) {

                        var sceneNode = this.state.scenes[nodeID] = {
                            glgeDocument: new GLGE.Document(),
                            glgeRenderer: undefined,
                            glgeScene: undefined,
                            ID: nodeID,
                            glgeKeys: new GLGE.KeyInput()
                        };

                        var model = this;
                        sceneNode.glgeDocument.onLoad = function () {
                            initScene.call( model, sceneNode );
                        };

                        // Load the GLGE document into the scene.
                        function colladaLoaded( collada ) { 
                            var bRemoved = false;
                            for ( var j = 0; j < model.glgeColladaObjects.length; j++ ) {
                                if ( model.glgeColladaObjects[j] == collada ){
                                    model.glgeColladaObjects.splice( j, 1 );
                                    bRemoved = true;
                                }
                            } 

                            //console.info( "++ 3 ++        model.glgeColladaObjects.length = " + model.glgeColladaObjects.length );
                            if ( bRemoved ){
                                if ( model.glgeColladaObjects.length == 0 ) {
                                    bindSceneChildren.call( model, nodeID );
                                    vwf.setProperty( sceneNode.ID, "loadDone", true );
                                    loadComplete.call( model );
                                }

                                var id = collada.vwfID;
                                if ( !id ) id = getObjectID.call( model, collada, true, false );
                                if ( id && id != "" ){
                                    model.callMethod( id, "loadComplete" );
                                }
                            }
                        }

                        if ( nodeSource ) {
                            switch ( nodeType ) {
                                case "model/x-glge":
                                    sceneNode.glgeDocument.load(nodeSource);
                                    break;

                            }
                        }

                        if ( !sceneNode.camera ) {
                            sceneNode.camera = {}; 
                            sceneNode.camera.defaultCam = undefined;
                            sceneNode.camera.defaultCamNode = undefined;
                            sceneNode.camera.camNode = undefined;
                            sceneNode.camera.name = "";
                            sceneNode.camera.defaultName = "defaultCamera";

                            sceneNode.camera.glgeCameras = {};
                        }

                    } 

                    break;

                case "http-vwf-example-com-types-node3":
                    switch ( nodeType ) {
                        case "model/vnd.collada+xml":
                            node = this.state.nodes[nodeID] = {
                                name: undefined,  
                                glgeObject: undefined,
                                type: nodeExtendsID,
                                source: nodeSource,
                                ID: nodeID,
                                sourceType: nodeType 
                            };
                            break;

                        case "text/xml":
                            node = this.state.nodes[nodeID] = {
                                name: undefined,  
                                glgeObject: undefined,
                                type: nodeExtendsID,
                                source: nodeSource,
                                ID: nodeID,
                                sourceType: nodeType 
                            };
                            break;

                        default:
                            node = this.state.nodes[nodeID] = {
                                name: undefined,  // TODO: needed?
                                glgeObject: undefined,
                                ID: nodeID,
                                type: nodeExtendsID
                            };
                            break;
                    }  
                    break;
                case "http-vwf-example-com-types-camera":
                    var camName = nodeID.substring( nodeID.lastIndexOf( '-' ) + 1 );
                    var sceneNode = this.state.scenes["index-vwf"];
                    node = this.state.nodes[nodeID] = {
                        name: undefined,
                        glgeObject: undefined,
                        ID: nodeID,
                        sceneID: "index-vwf",
                        glgeScene: sceneNode ? sceneNode.glgeScene : undefined,
                        type: nodeExtendsID
                    };

                    if ( sceneNode && sceneNode.camera ) {
                        if ( camName == sceneNode.camera.defaultName ) {
                            if ( !sceneNode.camera.defaultCam ) {
                                var cam = new GLGE.Camera();
                                sceneNode.camera.defaultCam = cam;
                                sceneNode.camera.glgeCameras[ camName ] = cam;
                                initCamera.call( this, cam );
                            }
                
                            sceneNode.camera.defaultCamNode = node;
                
                            node.name = camName;
                            node.glgeObject = sceneNode.camera.defaultCam;

                            if ( !sceneNode.camera.camNode ) {
                                sceneNode.camera.camNode = node;
                            }
                
                        } else if ( !sceneNode.camera.camNode ) {
                            sceneNode.camera.camNode = node;
                        }
                    }                    
                    break;


                case "http-vwf-example-com-types-light":
                    node = this.state.nodes[nodeID] = {
                        name: undefined,
                        glgeObject: undefined,
                        ID: nodeID,
                        type: nodeExtendsID
                    };
                    break;

                case "http-vwf-example-com-types-material":
                    node = this.state.nodes[nodeID] = {
                        name: undefined,
                        glgeObject: undefined,
                        glgeMaterial: true,
                        ID: nodeID,
                        type: nodeExtendsID
                    };
                    break;

                case "http-vwf-example-com-types-particlesystem":
                    node = this.state.nodes[nodeID] = {
                        name: undefined,
                        glgeObject: undefined,
                        ID: nodeID,
                        type: nodeExtendsID
                    };
                    break;

                case "http-vwf-example-com-types-group3":
                    node = this.state.nodes[nodeID] = {
                        name: childName,
                        glgeObject: new GLGE.Group(),
                        ID: nodeID,
                        type: nodeExtendsID
                    };
                    
                    node.gui = node.glgeObject.uid;
                    node.glgeObject.name = childName;                    
                    break;


                case "index-vwf":
                case "http-vwf-example-com-types-node":
                case "http-vwf-example-com-types-node2":
                case "http-vwf-example-com-types-scene":
                case "http-vwf-example-com-types-glge":
                case "appscene-vwf":
                case undefined:
                    break;

                default:
                    node = this.state.nodes[nodeID] = {
                        name: undefined,
                        glgeObject: undefined,
                        ID: nodeID,
                        type: nodeExtendsID
                    };
            
            }   
        },
         
        // -- addingChild ------------------------------------------------------------------------
        
        addingChild: function( nodeID, childID, childName ) {
            var glgeModel = this;
            var child = this.state.nodes[ childID ];
            var parent = this.state.nodes[ nodeID ];
            var createIfNotFound = false;
            var success = false;

            if ( !childName ) 
                childName = childID.substring( childID.lastIndexOf( '-' ) + 1 );

            if ( parent && parent.type == "http-vwf-example-com-types-group3" ) {
                if ( !parent.glgeObject ) {
                    parent.glgeObject = new GLGE.Group();
                }
                var childIsAddedToGroup = false;

                if ( parent.glgeObject ) {
                    var children = parent.glgeObject.getChildren();
                    for ( var i = 0; i < children.length && !childIsAddedToGroup; i++ ) {
                        if ( children[i] === child.glgeObject )
                        childIsAddedToGroup = true;
                    }

                    if ( !childIsAddedToGroup ) {
                        if ( child.glgeObject ) {
                            parent.glgeObject.addChild( child.glgeObject );
                            //console.info( "    adding child: " + childID + " to " + nodeID );
                        } else {
                            if ( !this.parentIDMap[ nodeID ] )
                                this.parentIDMap[ nodeID ] = [];
                            this.parentIDMap[ nodeID ].push( childID );
                            this.childIDMap[ childID ] = nodeID;
                        }

                    }
                }
            }

            if ( child ) {
                if ( child.type == "http-vwf-example-com-types-group3" ) {
                    var glgeParent;
                    if ( ( !parent || ( parent && !parent.glgeObject ) && this.state.scenes[ nodeID ] ) ) {
                        glgeParent = this.state.scenes[ nodeID ].glgeScene;
                    } else {
                        if ( parent )
                            glgeParent = parent.glgeObject;
                    }
                    if ( glgeParent ) {
                        var childIsAddedToGroup = false;

                        var children = glgeParent.getChildren();
                        for ( var i = 0; i < children.length && !childIsAddedToGroup; i++ ) {
                            if ( children[i] === child.glgeObject )
                                childIsAddedToGroup = true;
                        }

                        if ( !childIsAddedToGroup ) {
                            if ( child.glgeObject ) {
                                glgeParent.addChild( child.glgeObject );
                                //console.info( "    adding child: " + childID + " to " + nodeID );
                            } else { 
                                if ( !this.parentIDMap[ nodeID ] )
                                    this.parentIDMap[ nodeID ] = [];
                                this.parentIDMap[ nodeID ].push( childID );
                                this.childIDMap[ childID ] = nodeID;
                            }
                        }
                    }
                }


                if ( child.source ) {

                    if ( child.sourceType == "model/vnd.collada+xml" ) {
                        function colladaLoaded( collada ) { 
                            var bRemoved = false;
                            console.info( "++ 2 ++ "+collada.vwfID+" colladaLoaded( "+ collada.docURL +" )" );
                            for ( var j = 0; j < glgeModel.glgeColladaObjects.length; j++ ) {
                                if ( glgeModel.glgeColladaObjects[j] == collada ){
                                    glgeModel.glgeColladaObjects.splice( j, 1 );
                                    bRemoved = true;
                                }
                            } 
                            if ( bRemoved ) {
                                bindColladaChildren.call( glgeModel, childID );
                                //console.info( "++ 2 ++        glgeModel.glgeColladaObjects.length = " + glgeModel.glgeColladaObjects.length );
                                if ( glgeModel.glgeColladaObjects.length == 0 ) {
                                    vwf.setProperty( "index-vwf", "loadDone", true );
                                    loadComplete.call( glgeModel );
                                }

                                var id = collada.vwfID;
                                if ( !id ) id = getObjectID.call( glgeModel, collada, true, false );
                                if ( id && id != "" ){
                                    glgeModel.kernel.callMethod( id, "loadComplete" );
                                }
        //                        if ( glgeModel.glgeColladaIDs[ collada ] ){
        //                            glgeModel.callMethod( glgeModel.glgeColladaIDs[ collada ], "loadComplete" );
        //                        }
                            }
                        }

                        child.name = childName;
                        child.glgeObject = new GLGE.Collada;
                        this.glgeColladaObjects.push( child.glgeObject );
                        child.glgeObject.vwfID = childID;
        //                this.glgeColladaIDs[ child.glgeObject ] = childID;

                        child.glgeObject.setDocument( child.source, window.location.href, colladaLoaded);
                        child.glgeObject.loadedCallback = colladaLoaded;
                        if ( parent && parent.glgeObject ) {
                            parent.glgeObject.addCollada(child.glgeObject);
                            //console.info( "    adding collada child: " + childID + " to " + nodeID );
                        } else {
                            var sceneNode = this.state.scenes[nodeID];
                            if ( sceneNode ) {
                                if ( !sceneNode.glgeScene ) {
                                    this.initScene.call( this, sceneNode );
                                }

                                sceneNode.glgeScene.addCollada(child.glgeObject);
                                //console.info( "    adding collada child: " + childID + " to the scene" );
                            }    
                        }
                    } else if ( child.sourceType == "text/xml" ) {
                        var sceneNode = this.state.scenes[ "index-vwf" ];
                        if ( sceneNode && sceneNode.glgeDocument ){
                            var meshDef = sceneNode.glgeDocument.getElement( child.source );
                            if ( meshDef ) {
                                child.glgeObject = new GLGE.Object();
                                child.glgeObject.setMesh( meshDef );
                                var matName = vwf.getProperty( childID, "material", "" );
                                if ( matName && matName.constructor == Array ) matName = matName[(Math.random() * matName.length) | 0];
                                if ( !matName ) matName = "grey";
                                child.glgeObject.setMaterial( sceneNode.glgeDocument.getElement( matName ) );
                                if ( this.state.nodes[nodeID] && this.state.nodes[nodeID].glgeObject ) {
                                    this.state.nodes[nodeID].glgeObject.addObject( child.glgeObject );
                                } else {
                                    if ( sceneNode.glgeScene ) {
                                        sceneNode.glgeScene.addObject( child.glgeObject );
                                    }
                                }

                                var callLoadComplete = true;
                                var phyType = vwf.getProperty( childID, "physics", "" );
                                if ( !phyType || phyType == "mesh" || ( phyType.constructor == Array && phyType[0] == "mesh" ) ) {
                                    var meshList = findAllMeshes.call( this, child.glgeObject );

                                    if ( meshList && meshList.length ) {
                                        child.meshesCreated = [];
                                        //console.info( "     adding meshes to : " + objID );
                                        for ( var k = 0; k < meshList.length; k++ ) {
                                            child.meshesCreated.push( name( meshList[k] ) );
                                            createViewNode.call( this, childID, meshList[k] );
                                        }
                                    }
                                }
                                if ( callLoadComplete ) {
                                    this.kernel.callMethod( childID, "loadComplete" );
                                }
                            }
                        }
                    }
                }

                switch ( child.type ) {
                    case "http-vwf-example-com-types-light":
                    case "http-vwf-example-com-types-camera":
                    case "http-vwf-example-com-types-particleSystem":
                        createIfNotFound = true;
                        break;
                } 

                success = bindChild.call( this, this.state.scenes[nodeID], this.state.nodes[nodeID], child, childName, childID);
                if ( success ) {
                    bindNodeChildren.call(this, childID);
                } else if ( createIfNotFound ) {
                    switch ( child.type ) {
                        case "http-vwf-example-com-types-light":
                            createLight.call( this, nodeID, childID, childName );
                            break;                    
                        case "http-vwf-example-com-types-camera":
                            createCamera.call( this, nodeID, childID, childName );
                            break;
                        case "http-vwf-example-com-types-particlesystem":
                            createParticleSystem.call( this, nodeID, childID, childName );
                            break;
                    }
                    success = bindChild.call( this, this.state.scenes[nodeID], this.state.nodes[nodeID], child, childName, childID);                 
                }

            }

            if ( success && child.type == "http-vwf-example-com-types-camera") {
                if ( childName.toLowerCase() == "maincamera" ) {
                    setActiveCamera.call( this, child.glgeObject, this.state.scenes["index-vwf"], childID );
                }
            }

            return success;            
        },

        // -- removingChild ------------------------------------------------------------------------
        
        removingChild: function( nodeID, childID, childName ) {
            
        },

        // -- parenting ----------------------------------------------------------------------------

        parenting: function( nodeID ) {  // TODO: move to a backstop model

        },

        // -- childrening --------------------------------------------------------------------------

        childrening: function( nodeID ) {  // TODO: move to a backstop model

        },

        // -- naming -------------------------------------------------------------------------------

        naming: function( nodeID ) {  // TODO: move to a backstop model

        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
        
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            //console.info( "glgeModel.settingProperty( "+nodeID+", "+propertyName+", "+propertyValue+" )" );
            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
            var value = propertyValue;

            if ( node && node.glgeObject ) {

                var glgeObject = node.glgeObject;
                var isAnimatable = glgeObject.animate; // implements GLGE.Animatable?
    isAnimatable = isAnimatable && glgeObject.animation || propertyName == "looping" && glgeObject.constructor == GLGE.ParticleSystem; // has an animation?
    isAnimatable = isAnimatable && node.name != "cityblock.dae"; // TODO: this is a hack to prevent disabling the animation that keeps the world upright


    //            vwf.logger.info( namespace + ".satProperty " + path( glgeObject ) + " " + propertyName + " " + propertyValue);

                if ( isAnimatable ) {

                    switch ( propertyName ) {

                        case "playing":

    if ( !Boolean( propertyValue ) && glgeObject.animFinished ) {  // TODO: GLGE finished doesn't flow back into node3's playing yet; assume playing is being toggled and interpret it as true if the animation has played and finished.
        propertyValue = true;
    }

    if ( !node.initialized ) {  // TODO: this is a hack to set the animation to frame 0 during initialization
        //if ( glgeObject.animFrames == 100 ) { glgeObject.setFrames( 50 ); } // hack to use only the opening half of the door animation
        glgeObject.setStartFrame( 0, 0, glgeObject.getLoop() );
        glgeObject.getInitialValues( glgeObject.animation, glgeObject.animationStart );
    }

                            if ( Boolean( propertyValue ) ) {
                                if ( glgeObject.animFinished ) {
                                    glgeObject.setStartFrame( 0, 0, glgeObject.getLoop() );
                                } else if ( glgeObject.getPaused() ) {
                                    if ( glgeObject.animFrames == 100 ) {
                                        glgeObject.setFrames( 50 );
                                    }
                                    glgeObject.setPaused( GLGE.FALSE );
                                }
                            }

                            else {
                                glgeObject.setPaused( GLGE.TRUE );
                            }

                            break;

                        case "looping":
                            var glgeLoop = Boolean( propertyValue ) ? GLGE.TRUE : GLGE.FALSE;
                            glgeObject.setLoop( glgeLoop );
                            break;

                        case "speed":
                            var glgeFrameRate = Number( propertyValue ) * 30; // TODO: not safe to assume default speed is 30 fps
                            glgeObject.setFrameRate( glgeFrameRate );
                            break;
                    }
                }

                var pieDiv180 = 3.14159/180.0;
                var pv = propertyValue;
                switch ( propertyName ) {

                    case "roll":
                        value = glgeObject.setRotX( pv * pieDiv180 );
                        break;

                    case "pitch":
                        value = glgeObject.setRotY( pv * pieDiv180 );
                        break;

                    case "yaw":
                        value = glgeObject.setRotZ( pv * pieDiv180 );
                        break;

                    case "rotX":
                        value = glgeObject.setRotX( pv );
                        break;

                    case "rotY":
                        value = glgeObject.setRotY( pv );
                        break;

                    case "rotZ":
                        value = glgeObject.setRotZ( pv );
                        break;

                    case "eulers":
                        value = glgeObject.setRot( pv[0] * pieDiv180, pv[1]* pieDiv180, pv[2] * pieDiv180 );
                        break;
                    case "rotation":
                        value = glgeObject.setRot( pv[0], pv[1], pv[2] );
                        break;
                    case "position":
                        value = glgeObject.setLoc( pv[0], pv[1], pv[2] );
                        break;
                    case "posRotMatrix":
                        value = [];
                        value.push( glgeObject.setLoc( pv[0], pv[1], pv[2] ) );
                        value.push( glgeObject.setRotMatrix( pv[3] ) );
                        break;                            
                    case "worldEulers":
                        value = glgeObject.setDRot( pv[0] * pieDiv180, pv[1] * pieDiv180, pv[2] * pieDiv180 );
                        break;
                    case "worldPosition":
                        value = glgeObject.setDLoc( pv[0], pv[1], pv[2] );
                        break;
                    case "scale":                            
                        value = glgeObject.setScale( pv[0], pv[1], pv[2] );
                        break;
                    case "transform":
                        break;

                    case "texture": {
                            var txtr;
                            var mat;
                            if ( node.glgeMaterial && node.glgeMaterial.textures ) {
                                mat = node.glgeMaterial;
                                txtr = node.glgeMaterial.textures[0];
                            } else if ( node.glgeObject && node.glgeObject.material ) {
                                mat = node.glgeObject.material; 
                                txtr = node.glgeObject.material.textures[0];
                            }

                            if ( txtr ) {
                                txtr.setSrc( propertyValue );
                            } else if ( mat ) {
					            var ml=new GLGE.MaterialLayer;
					            ml.setMapto(GLGE.M_COLOR);
					            //ml.setMapto(GLGE.M_NOR);
					            ml.setMapinput(GLGE.UV1);
                                var txt = new GLGE.Texture();
                                txt.setSrc( propertyValue );
                                mat.addTexture( txt );
					            ml.setTexture(txt);
					            mat.addMaterialLayer(ml);
                            }
                        }
                        break;

                    default:
                        switch ( node[ "type" ] ) {
                            case "http-vwf-example-com-types-light":
                                value = setLightProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-types-camera":
                                value = setCameraProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-types-particlesystem":
                                value = setParticleSystemProperty.call( this, nodeID, propertyName, propertyValue );
                                break;                        
                            case "http-vwf-example-com-types-glge":
                            case "appscene-vwf":
                                value = setSceneProperty.call( this, nodeID, propertyName, propertyValue );
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

//            if ( this.glge_view || ( this.glge_view = find_glge_view( this.kernel ) ) ) {
//                // if ( propertyName != "playing" && propertyName != "looping" && propertyName != "speed" ) { // vwf-model-glge expects to vwf.getProperty() on these to get to default property settings
//                switch ( propertyName ) {
//                    case "vertices":
//                    case "vertexIndices":
//                    case "boundingbox":
//                    case "centerOffset":
//                        return this.glge_view.gotProperty( nodeID, propertyName, propertyValue );
//                        break;
//                }
//            }

            var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
            var value;

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
                        value.push( glgeObject.getRotX() * _180divPi, glgeObject.getRotY()* _180divPi, glgeObject.getRotZ()* _180divPi );
                        break;
                    case "rotation":
                        value = new Array;
                        value.push( glgeObject.getRotX(), glgeObject.getRotY(), glgeObject.getRotZ() );
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
                        break;
                
                    case "boundingbox":
                        var bbox = getLocalBoundingBox.call( this, glgeObject );
                        var scale = vwf.getProperty( nodeID, "scale", undefined );
                        value = [ bbox.xMin * scale[0], bbox.xMax* scale[0], bbox.yMin* scale[1], bbox.yMax * scale[1], bbox.zMin * scale[2], bbox.zMax * scale[2] ];
                        break;

                    case "centerOffset":
                        var centerOff = getCenterOffset.call( this, glgeObject );
                        var scale = vwf.getProperty( nodeID, "scale", undefined );
                        value = new Array;
                        value.push( centerOff[0] * scale[0], centerOff[1] * scale[1], centerOff[2] * scale[2] ); 
                        break;

                    case "vertices":
                        value = getMeshVertices.call( this, glgeObject );
                        break;

                    case "vertexIndices":
                        value = getMeshVertexIndices.call( this, glgeObject );
                        break;

                    default:
                        switch ( node.type ) {
                            case "http-vwf-example-com-types-light":
                                value = getLightProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-types-camera":
                                value = getCameraProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                            case "http-vwf-example-com-types-particlesystem":
                                value = getParticleSystemProperty.call( this, nodeID, propertyName, propertyValue );
                                break;                        
                            case "http-vwf-example-com-types-scene":
                                value = getSceneProperty.call( this, nodeID, propertyName, propertyValue );
                                break;
                        }
                        break;    

                }
            }

        return value;


        },

        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters

            return undefined;

        },

        // -- executing ------------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {

            var value;
            return value;

        },


    } );

    // -- find_glge_view ---------------------------------------------------------------------------

    function find_glge_view( kernel ) {

        // Walk the pipeline backwards to the kernel.

        while ( kernel.kernel ) {
            kernel = kernel.kernel;
        }

        // Locate the GLGE view in the kernel's view list.
        return kernel.views.reduce( function( dummy, view ) {
            return view.namespace == "vwf.view.glge" ? view : undefined;
        }, undefined );

    }

    // -- createScene ------------------------------------------------------------------------

    function initScene ( sceneNode ) {

        console.info( "glgeModel.initScene [[[ "+sceneNode.ID+" ]]]" );

        if ( sceneNode.glgeScene.camera ) {
            sceneNode.camera.defaultCam = sceneNode.glgeScene.camera;
            sceneNode.camera.glgeCameras[ sceneNode.camera.defaultName ] = sceneNode.camera.defaultCam;
        }

        createDefaultCamera.call( this, sceneNode );
        this.state.cameraInUse = sceneNode.glgeScene.camera;
        findAllColladaObjs.call( this, sceneNode.glgeScene, sceneNode.ID );
    } 

    // -- findCollada ------------------------------------------------------------------------

    function findCollada( grp, nodeID ) {

        if ( grp && grp.getChildren ) {
            var children = grp.getChildren();
 
            for ( var i = 0; i < children.length; i++ ) {
                if ( children[i].constructor == GLGE.Collada ) {
                    var modelID = nodeID;
                    var glgeModel = this;
                    this.glgeColladaObjects.push( children[i] );


                    function colladaLoaded( collada ) { 
                        var bRemoved = false;
                        console.info( "++ XML Loaded ++        colladaLoaded( "+ collada.docURL +" )" );
                        for ( var j = 0; j < glgeModel.glgeColladaObjects.length; j++ ) {
                            if ( glgeModel.glgeColladaObjects[j] == collada ){
                                glgeModel.glgeColladaObjects.splice( j, 1 );
                                bRemoved = true;
                            }
                        } 

                        //console.info( "++ 1 ++        glgeView.glgeColladaObjects.length = " + glgeView.glgeColladaObjects.length );

                        if ( bRemoved ){
                            if ( glgeModel.glgeColladaObjects.length == 0 ) {
                                bindSceneChildren.call( glgeModel, modelID );
                                vwf.setProperty( modelID, "loadDone", true );
                                loadComplete.call( glgeModel );
                            }
                        }
                        var id = collada.vwfID;
                        if ( !id ) id = getObjectID.call( glgeModel, collada, true, false );
                        if ( id && id != "" ){
                            glgeModel.kernel.callMethod( id, "loadComplete" );
                        }
//                      if ( glgeView.glgeColladaIDs[ collada ] ){
//                          glgeView.callMethod( glgeView.glgeColladaIDs[ collada ], "loadComplete" );
//                      }
                    }

 
                    children[i].loadedCallback = colladaLoaded;
                }
                findCollada.call( this, children[i] ); 
            }
        }
        
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

        var sceneNode = this.state.scenes[ nodeID ];
        if ( sceneNode && sceneNode.glgeScene ) {
            var value = propertyValue;
            switch ( propertyName ) {
                    case "ambientColor":
                    sceneNode.glgeScene.setAmbientColor( propertyValue );
                    break;
                case "activeCamera":
                    if ( sceneNode.camera && sceneNode.camera.glgeCameras ) {
                        if ( sceneNode.camera.glgeCameras[propertyValue] ) {
                            var cam = sceneNode.camera.glgeCameras[propertyValue];
                            if ( cam ) {
                                setActiveCamera.call( this, cam, sceneNode, nodeID );
                            }
                        }
                    }
                    break;
            }
        }
        return value;

    }

    // -- setParticleSystemProperty ------------------------------------------------------------------------

    function setParticleSystemProperty( nodeID, propertyName, propertyValue ) {

        //console.info(namespace + ".setParticleSystemProperty( " + nodeID + ", " + propertyName + ", " + propertyValue + " )");

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
                break;V
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
                }
                break;
            case "far":
                node.glgeObject.setFar( Number( propertyValue ) );
            case "near":
                node.glgeObject.setNear( Number( propertyValue ) );
                break;
            case "fovy":
                node.glgeObject.setFovY( Number( propertyValue ) );
                break;            
            case "aspect":
                node.glgeObject.setAspect( Number( propertyValue ) );
                break;            
            case "orthoscale":
                node.glgeObject.setOrthoScale( Number( propertyValue ) );
                break;
        }
        return value;

    }

    // -- setLightProperty ------------------------------------------------------------------------

    function setLightProperty( nodeID, propertyName, propertyValue ) {
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
        }
        return value;
    }

    // -- getSceneProperty ------------------------------------------------------------------------------

    function getSceneProperty( nodeID, propertyName, propertyValue ) {

        var sceneNode = this.state.scenes[nodeID] // { name: childName, glgeObject: undefined }
        var value = propertyValue;
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

        }
        return value;

    }

    // -- getParticleSystemProperty ------------------------------------------------------------------------------

    function getParticleSystemProperty( nodeID, propertyName, propertyValue ) {
        var node = this.state.nodes[nodeID] 
        var value = propertyValue;
        switch ( propertyName ) {
            default:
                vwf.logger.info( "WARNING: unable to get property " + namespace + " " + nodeID + " " + propertyName );
                break;
        }
        return value;
    }

    // -- getLightProperty ------------------------------------------------------------------------------

    function getLightProperty( nodeID, propertyName, propertyValue ) {
        var value;

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
                value = node.glgeObject.getAttenuationConstant();
                break;

            case "linearAttenuation":
                value = node.glgeObject.getAttenuationLinear();
                break;

            case "quadraticAttenuation":
                value = node.glgeObject.getAttenuationQuadratic();
                break;

            case "spotCosCutOff":
                value = node.glgeObject.getSpotCosCutOff();
                break;

            case "spotExponent":
                value = node.glgeObject.getSpotExponent();
                break;

            case "diffuse":
                value = node.glgeObject.getDiffuse();
                break;

            case "specular":
                value = node.glgeObject.getSpecular();
                break;

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
        }
        return value;    
    
    }

    // -- getCameraProperty ------------------------------------------------------------------------------

    function getCameraProperty(nodeID, propertyName, propertyValue) {

        var value;
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
        }
        return value;

    }


    function findGlgeObject( objName, type ) {
        var obj = undefined;
        var assetObj = undefined;
        var glgeObjName = "";

        //console.info( "=======   Trying to find: " + objName + " of type: " + type );
        for ( key in GLGE.Assets.assets ) {
            assetObj = GLGE.Assets.assets[key];
            if ( assetObj ) {
                glgeObjName = name( assetObj );
                //console.info( "            Checking: '" + glgeObjName + "' of type " + assetObj.constructor.name );
                if ( glgeObjName == objName ) {
                    switch ( type ) {
                        case "http-vwf-example-com-types-node3":
                            if ( ( assetObj.constructor == GLGE.Group ) || ( assetObj.constructor == GLGE.Object ) )
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-types-light":
                            if ( assetObj.constructor == GLGE.Light )
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-types-camera":
                            if ( assetObj.constructor == GLGE.Camera )
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-types-scene":
                            if ( assetObj.constructor == GLGE.Scene )
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-types-particleSystem":
                            if ( assetObj.constructor == GLGE.ParticleSystem )
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-types-mesh":
                            if ( assetObj.constructor == GLGE.Mesh )
                                obj = assetObj;
                            break;
                    }

                    if ( obj ) {
                        //console.info( "=======   FOUND : " + objName );
                        break;
                    }
                }
            }
        }

        return obj;
    }

    function bindSceneChildren( nodeID) {

        vwf.logger.info("      bindSceneChildren: " + nodeID );
        var sceneNode = this.state.scenes[nodeID];
        if ( sceneNode ) {
            var child;

            if ( sceneNode.glgeScene ) {
                var glgeModel = this;
                jQuery.each(vwf.children(nodeID), function (childIndex, childID) {
                    if ( child = glgeModel.state.nodes[childID] ) { // assignment is intentional
                        if ( bindChild.call( glgeModel, sceneNode, undefined, child, vwf.name(childID), childID)) {
                            bindNodeChildren.call( glgeModel, childID);
                        }
                    }
                });
            }
        } else {
            vwf.logger.warn("bindSceneChildren ===>>> Invalid sceneNode reference: " + nodeID );
        }
     }

    function setActiveCamera( glgeCamera, sceneNode, nodeID ) {
        if ( sceneNode && sceneNode.glgeScene && glgeCamera ) {
            sceneNode.glgeScene.setCamera( glgeCamera );
            if ( nodeID && this.state.nodes[nodeID] ) {
                sceneNode.camera.camNode = this.state.nodes[ nodeID ];
                sceneNode.camera.ID = nodeID;
            } else {
                sceneNode.camera.camNode = sceneNode.camera.defaultCamNode;
                sceneNode.camera.ID = undefined;
            }
        }
    }

    
    function activeCamera( sceneNode ) {

        var cam = undefined;
        if ( sceneNode && sceneNode.camera ) {
            if ( sceneNode.camera.camNode )
                cam = sceneNode.camera.camNode;
            else 
                cam = sceneNode.camera.defaultCamNode;
        }
        console.info( "Changing active camera: " + name( cam ) );
        this.state.cameraInUse = cam;
        return cam;
    }


    function createDefaultCamera( sceneNode ) {
        vwf.createNode( { "extends": "http://vwf.example.com/types/camera" }, undefined, sceneNode.camera.defaultName );    
    }

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

    function createCamera( nodeID, childID, childName ) {
        var sceneNode = this.state.scenes[nodeID];
        if ( sceneNode ) {
            var child = this.state.nodes[childID];
            if ( child ) {
                var cam;
                
                if ( sceneNode.camera && sceneNode.camera.glgeCameras ) {
                    if ( !sceneNode.camera.glgeCameras[childName] ) {
                        cam = new GLGE.Camera();
                        initCamera.call( this, cam );
                        sceneNode.camera.glgeCameras[childName] = cam;
                    } else {
                        cam = sceneNode.camera.glgeCameras[childName];
                    }

                    child.name = childName;
                    child.glgeObject = cam;
                    child.uid = child.glgeObject.uid;
                    cam.name = childName;
                }
            }
        }
    }

    function createParticleSystem( nodeID, childID, childName ) {
    
    }

    function initCamera( glgeCamera ) {
        if ( glgeCamera ) {
            glgeCamera.setLoc( 0, 0, 0 );
            glgeCamera.setRot( 0, 0, 0 );
            glgeCamera.setType( GLGE.C_PERSPECTIVE );
            glgeCamera.setRotOrder( GLGE.ROT_XZY );
        }        
    }

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

    function getCenterOffset( glgeObject ) {
        var offset = [ 0, 0, 0 ];
        if ( glgeObject ) {
            var bBox = getLocalBoundingBox.call( this, glgeObject )
            offset[0] = ( bBox.xMax - bBox.xMin ) * 0.50;
            offset[1] = ( bBox.yMax - bBox.yMin ) * 0.50;
            offset[2] = ( bBox.zMax - bBox.zMin ) * 0.50;
        }
        return offset;
    }

    function getNodeVertices( nodeID ) {
        if ( this.state.nodes[nodeID] ) {
            return getMeshVertices.call( this, this.state.nodes[nodeID] );
        }
        return undefined;
    }

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

    function getNodeVertexIndices( nodeID ) {
        if ( this.state.nodes[nodeID] ) {
            return getMeshVertexIndices.call( this, this.state.nodes[nodeID] );
        }
        return undefined;
    }


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
                        vertexIndices.push([faces[i], faces[i + 1], faces[i + 2]]);
                    }
                }
            }
        }

        return vertexIndices;
    }

    function bindColladaChildren( nodeID ) {

        vwf.logger.info("      bindColladaChildren: " + nodeID );
        var colladaTopNode = this.state.nodes[nodeID];
        var child;
        var glgeModel = this;

        jQuery.each( vwf.children(nodeID), function (childIndex, childID) {
            if ( child = glgeModel.state.nodes[childID] ) { // assignment is intentional
                if ( bindChild.call( glgeModel, undefined, colladaTopNode, child, vwf.name(childID), childID) ) {
                    bindNodeChildren.call( glgeModel, childID );
                }
            }
        });

        if ( this.childIDMap[ nodeID ] ) {
            var parentID = this.childIDMap[ nodeID ];
            addGlgeChild.call( this, parentID, nodeID );
            this.childIDMap[nodeID] = undefined;
            if ( this.parentIDMap[parentID] ) {
                var index = -1;
                var parentArray = this.parentIDMap[parentID]
                for ( var i = 0; i < parentArray.length && index == -1; i++ ) {
                    if ( parentArray[i] == nodeID )
                        index = i;
                }

                if ( index != -1)
                    parentArray.splice( index, 1 );
            }
        }

        if ( colladaTopNode.delayLoadObjects ) {
            var dObjs = colladaTopNode.delayLoadObjects;
            var meshList, parentID, objID;
            //console.info( "FINDING and adding children: " );
            for ( var j = 0; j < dObjs.length; j++ ) {
                meshList = findAllMeshes.call( this, dObjs[j] );
                if ( meshList && meshList.length ) {
                    objID = getObjectID.call( this, dObjs[j], false, false );
                    parentID = getObjectID.call( this, dObjs[j].parent, true, false );
                    if ( parentID && !objID ) {
                        createViewNode.call( this, parentID, dObjs[j] );
                    }
                    objID = getObjectID.call( this, dObjs[j],false, false );
                    //console.info( "     adding meshes to : " + objID );
                    for ( var k = 0; k < meshList.length; k++ ) {
                        createViewNode.call( this, objID, meshList[k] );
                    }
                }
            }
            //console.info( "DONE adding children: " );
        }
    };

    var meshesCreated = 0;
    var meshExtendType = "http://vwf.example.com/types/mesh";
    function createViewNode( parentID, glgeObject ) {
        var extendType, type, newChildID, mesh;
        var objName = name( glgeObject );

        if ( glgeObject.constructor == GLGE.Mesh ) {
            mesh = glgeObject;
            if ( objName == "" ) {
                objName = "Mesh" + meshIndex++;
                mesh.name = objName;
            }             
            extendType = meshExtendType;
            type = "http-vwf-example-com-types-mesh";
            newChildID = type +"-"+ objName;  
            meshesCreated++;        
        } else {
            extendType = "http://vwf.example.com/types/node3";
            type = "http-vwf-example-com-types-node3";
            newChildID = type +"-"+ objName;
        }

        var addedID;
        var parentNode = this.state.nodes[ parentID ];
        if ( newChildID && type ) {
            if ( !this.state.nodes[ newChildID ] ) {
                //console.info( "[[  Creating " + type + " as child of " + parentID );
//                vwf.createNode( { "extends": extendType }, undefined, objName );
                vwf.createNode( { "extends": extendType }, function( nodeID, prototypeID ) {
                    //console.info( "     [[  Adding " + type + "     nodeID: " + nodeID );
                    vwf.addChild( parentID, nodeID, objName );
                    addedID = nodeID;
                    //console.info( "     ]]  Adding " + type + "     nodeID: " + nodeID );
                    if ( extendType == meshExtendType ) {
                        meshesCreated--;
                        if (  parentNode && parentNode.meshesCreated ) {
                            var found = false;
                            var i = 0;
                            for ( i = 0; i < parentNode.meshesCreated.length && !found; i++ ) {
                                if ( parentNode.meshesCreated[i] == objName ) {
                                    found = true;
                                    parentNode.meshesCreated.splice(i,1);
                                }
                            }
                            if ( parentNode.meshesCreated.length == 0 ) {
                                this.callMethod( parentID, "loadComplete" );
                            }

                        }
                        //console.info( "   meshesCreated = " + meshesCreated );
                        if ( meshesCreated == 0 ) {
                            console.info( "   ALL MESHES Created and Added" );
                            vwf.setProperty( "index-vwf", "loadDone", true );
                            //vwf.logger.enable = true;
                        }
                    }
                }, objName );
                //console.info( "]]  Creating " + type  );
            }
        }
        return addedID;    
    }

    function loadComplete() {
        var itemsToDelete = [];
        for ( var id in this.delayedProperties ) {
            if ( this.state.nodes[id] ) {
                var props = this.delayedProperties[id];
                for ( var propertyName in props ) {
                    //console.info( id + " delayed property set: " + propertyName + " = " + props[propertyName] );
                    this.__proto__.settingProperty.call( this, id, propertyName, props[propertyName] );
                }
                itemsToDelete.push( id );
            }
        }
        
        for ( var i = 0; i < itemsToDelete.length; i++ ) {
            delete this.delayedProperties[itemsToDelete[i]];
        }
    }

    function bindNodeChildren( nodeID ) {

        vwf.logger.info("      bindNodeChildren: " + nodeID);
        var node = this.state.nodes[nodeID];
        var child;

        if ( node.glgeObject ) {
            var glgeModel = this;
            jQuery.each(vwf.children(nodeID), function ( childIndex, childID ) {
                if (child = glgeModel.state.nodes[childID]) { // assignment is intentional
                    if ( bindChild.call( glgeModel, undefined, node, child, vwf.name(childID), childID) ) {
                        bindNodeChildren.call( glgeModel, childID );
                    }
                }
            });
        }

    }

    var meshIndex = 1;
    function bindChild( sceneNode, node, child, childName, childID) {

        vwf.logger.info("      bindChild: " + sceneNode + " " + node + " " + child + " " + childName);
        
        if (sceneNode && sceneNode.glgeScene && !child.glgeObject) {
            child.name = childName;
            child.glgeObject = sceneNode.glgeScene && glgeSceneChild.call( this, sceneNode.glgeScene, childName);
            if (child.glgeObject) {
                child.uid = child.glgeObject.uid;
                glgeInitProperties.call( this, childID, child.glgeObject);
                child.initialized = true;
            } else {
                var obj = findGlgeObject.call( this, childName, child.type );
                if ( obj ) {
                    child.glgeObject = obj;
                    child.uid = obj.uid;
                    child.initialized = true;
                    glgeInitProperties.call( this, childID, child.glgeObject);
                }
            }
        } else if (node && !child.glgeObject) {
            child.name = childName;
            if ( this.state.nodes[ childID ] && this.state.nodes[ childID ].glgeMaterial ) {
                bindMaterial.call( this, childID, childName, node );
                child.initialized = true;
            } else {
                child.glgeObject = node.glgeObject && glgeObjectChild.call( this, node.glgeObject, childName);
                if (child.glgeObject) {
                    child.uid = child.glgeObject.uid;
                    glgeInitProperties.call( this, childID, child.glgeObject);
                    child.initialized = true;
                } else {
                    var glgeObj = findGlgeObject.call( this, childName, child.type );
                    if ( glgeObj ) {
                        child.glgeObject = glgeObj;
                        child.uid = glgeObj.uid;
                        child.initialized = true;
                        glgeInitProperties.call( this, childID, child.glgeObject);
                    } 
                }
            }
        }

        var success = Boolean(child.glgeObject);

        if ( !success ) {
            vwf.logger.info( "     unable to bind: " + childID );
            //console.info( "     unable to bind: " + childID );
        } else {
            //console.info( "VWF binded to glge object: " + childID );
            var temp;
            var phyProp = vwf.getProperty( childID, "physics", temp );
            //console.info( "        " + childID + ".physics = " + phyProp );
            if ( child.glgeObject.getChildren && phyProp == "mesh" ) {
                var children = child.glgeObject.getChildren();
                //console.info( "      bounded glge object has children: " + children.length  );
                if ( children && children.length > 0 ) {
                    var colladaParent = findColladaParent.call( this, child.glgeObject );
                    //console.info( "     ADDING children for: " )
                    if ( colladaParent ) {
                        colladaID = colladaParent.vwfID;
                        if ( !colladaID ) { 
                            colladaID = getObjectID.call( this, colladaParent, true, false );
                            colladaParent.vwfID = colladaID;
                        }
                        if ( colladaID ) {
                            //console.info( "     CHECKING children for: " + childID );
                            colladaNode = this.state.nodes[ colladaID ];
                            if ( !colladaNode.delayLoadObjects ) { colladaNode.delayLoadObjects = []; }
                            var dObjs = colladaNode.delayLoadObjects;
                            var phyProp;
                            for ( var j = 0; j < children.length; j++ ) {
                                dObjs.push( children[j] );
                                //console.info( "         ++ ADDING child: " + name( children[j] ) );
                            }                        
                        }
                    }
                }
            }

            if ( child.glgeObject.animate && child.glgeObject.animation ) {
               vwf.logger.info( "$$$$$     child id " + childID + " with name " + childName ); 
            }
            vwf.logger.info( "+++++     SUCCESSFULL bind: " + childID );
        }

        return success;

        //vwf.logger.info( "scene: " + nodeID + " " + childID + " " + childName + " " + this.state.nodes[childID].glgeObject );
        //vwf.logger.info( "node: " + nodeID + " " + childID + " " + childName + " " + this.state.nodes[childID].glgeObject );
    };

    // Search a GLGE.Scene for a child with the given name.

    function glgeSceneChild(glgeScene, childName) {

        var childToReturn = jQuery.grep(glgeScene.children || [], function (glgeChild) {
            return (glgeChild.name || glgeChild.id || glgeChild.sourceURL || "") == childName;
        }).shift();

        //vwf.logger.info("      glgeSceneChild( " + childName + " ) returns " + childToReturn);
        return childToReturn;

    }

    // Search a GLGE.Object, GLGE.Collada, GLGE.Light for a child with the given name.  TODO: really, it's anything with children[]; could be the same as glgeSceneChild().

    function glgeObjectChild( glgeObject, childName ) {
        
        var childToReturn;
        if ( GLGE.Assets && GLGE.Assets.assets ) 
           childToReturn = GLGE.Assets.assets[childName];

        if ( !childToReturn ) {
            childToReturn = jQuery.grep(glgeObject.children || [], function (glgeChild) {
               return (glgeChild.colladaName || glgeChild.colladaId || glgeChild.name || glgeChild.id || "") == childName;
            }).shift();
        }

        //vwf.logger.info("      glgeObjectChild( " + childName + " ) returns " + childToReturn);
        return childToReturn;

    }

    function bindMaterial( childID, childName, node ) {

        var materialStringIndex, materialIndex, parentName;
        var childNode = this.state.nodes[childID];

        // the material name is a combination of the following information
        // groupParentName + 'Material' + indexOfTheMultiMaterial

        if ( childNode ) {
            materialStringIndex = childName.lastIndexOf( "Material" );
            materialIndex = Number( childName.substr( materialStringIndex + 8 ) ) - 1;
            parentName = childName.substr( 0, materialStringIndex );
            if ( node && node.glgeObject ) {
                var glgeObjs = [];
                var found = false;
                findAllGlgeObjects.call( this, node.glgeObject, glgeObjs );
                if ( glgeObjs && glgeObjs.length ) {
                    for ( var i = 0; i < glgeObjs.length && !found; i++ ) {
                        if ( name( glgeObjs[i].parent ) == parentName ) {
                            childNode.glgeObject = glgeObjs[i];
                            childNode.glgeMaterial = glgeObjs[i].getMaterial( materialIndex );
                            found = true;                        
                        }                   
                    }
                } else if ( node.glgeObject.children.length == 1 && node.glgeObject.children[0].constructor == GLGE.Object ) {

                    var glgeChild = node.glgeObject.children[0];
                    materialStringIndex = childName.lastIndexOf( "Material" );
                    materialIndex = Number( childName.substr( materialStringIndex + 8 ) ) - 1;

                    childNode.glgeObject = glgeChild;
                    childNode.glgeMaterial = glgeChild.getMaterial( materialIndex );
                
                    if ( !( childNode.glgeMaterial ) && ( childNode.glgeObject ) ) {
                        childNode.glgeMaterial = childNode.glgeObject.material;
                    }

//                  if ( childNode.glgeMaterial === childNode.glgeObject.material ) {
//                       console.info( " materials are the same object!!!!! " );
//                  }
                }
            }
        }

    }

    function addGlgeChild( parentID, childID ) {
        
        var glgeParent
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

    function glgeInitProperties( nodeID, glgeObject ) {

        this.settingProperty( nodeID, "playing", vwf.getProperty( nodeID, "playing" ) );
        this.settingProperty( nodeID, "looping", vwf.getProperty( nodeID, "looping" ) );
        this.settingProperty( nodeID, "speed", vwf.getProperty( nodeID, "speed" ) );

    }




} );
