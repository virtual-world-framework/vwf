(function (modules, namespace) {

    window.console && console.info && console.info("loading " + namespace);

    // vwf-view-glge.js is a placeholder for an GLGE WebGL view of the scene.
    //
    // vwf-view-glge is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern).
    // It attaches to the vwf modules list as vwf.modules.glge.

    var module = modules[namespace.split(".").pop()] = function(vwf, rootSelector) {

        if (!vwf) return;

        vwf.logger.info("creating " + namespace);

        modules.view.call(this, vwf);
        this.namespace = namespace;

        this.rootSelector = rootSelector;

        this.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
        this.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }

        this.smoke = undefined; // { name: string, glgeObject: GLGE.ParticleSystem }
        this.smokeID = undefined;

        this.glgeColladaObjects = new Array();
        this.keysDown = {};

        this.defaultCamera = undefined;
        this.defaultCameraID = undefined;

    };

    // Delegate any unimplemented functions to vwf-view.

    module.prototype = new modules.view();

    // == Response API =============================================================================

    // This is a placeholder for maintaining a view of the changing state of the simulation using
    // nested HTML block elements.

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function (nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType) {

        vwf.logger.info(namespace + ".createdNode " + nodeID + " " +
            nodeExtendsID + " " + nodeImplementsIDs + " " + nodeSource + " " + nodeType);

        if (nodeExtendsID == "http-vwf-example-com-types-glge") {

            // jQuery(this.rootSelector).append(
            //     "<h2>Scene</h2>"
            // );

            var canvasQuery = jQuery(this.rootSelector).append(
                "<canvas id='" + nodeID + "' class='vwf-scene' width='640' height='480'/>"
            ).children(":last");

            canvasQuery.keydown( function( event ) {
              view.keysDown[ event.keyCode ] = true;
            });

            canvasQuery.keyup( function( event ) {
              view.keysDown[ event.keyCode ] = false;
            });

            var scene = this.scenes[nodeID] = {
                glgeDocument: new GLGE.Document(),
                glgeRenderer: undefined,
                glgeScene: undefined,
                glgeKeys: new GLGE.KeyInput()
            };

            var view = this;

            // Connect GLGE to the VWF timeline.

            GLGE.now = function() {
                return vwf.time() * 1000;
            };

            scene.glgeDocument.onLoad = function () {
                var canvas = canvasQuery.get(0);
                scene.glgeRenderer = new GLGE.Renderer(canvas);
                scene.glgeScene = scene.glgeDocument.getElement("mainscene");
                scene.glgeRenderer.setScene(scene.glgeScene);

                view.findAllColladaObjs( scene.glgeScene, view, nodeID );

                // set up all of the mouse event handlers
                initMouseEvents(canvas, nodeID, view);

                // Schedule the renderer.

                var lasttime = 0;
                var now;
                function renderScene() {
                    now = parseInt(new Date().getTime());
                    scene.glgeRenderer.render();
                    checkKeys(nodeID, view, now, lasttime);
                    lasttime = now;
                };

                setInterval(renderScene, 1);
            };

            // Load the GLGE document into the scene.

            function colladaLoaded( collada ) { 
                var bRemoved = false;
                for ( var j = 0; j < view.glgeColladaObjects.length; j++ ) {
                    if ( view.glgeColladaObjects[j] == collada ){
                        view.glgeColladaObjects.splice( j, 1 );
                        bRemoved = true;
                    }
                } 

                if ( bRemoved && view.glgeColladaObjects.length == 0 ){
                    bindSceneChildren( view, nodeID );
                }
            }

            if (nodeSource && nodeType == "model/x-glge") {
                scene.glgeDocument.load(nodeSource);
            }

            else if (nodeSource && nodeType == "model/vnd.collada+xml") {  // TODO: need to loadDocument() from somewhere first
                var newCollada = new GLGE.Collada;
                glgeColladaObjects.push( newCollada );
                newCollada.loadedCallback = colladaLoaded;
                newCollada.setDocument(nodeSource, window.location.href);
                scene.glgeDocument.getElement("mainscene").addCollada(newCollada);
            }

        }
        
        else if (nodeExtendsID == "http-vwf-example-com-types-node3") {

            var node = this.nodes[nodeID] = {
                name: undefined,  // TODO: needed?
                glgeObject: undefined,
				type: nodeExtendsID
            };

        }

        else if (nodeExtendsID == "http-vwf-example-com-types-camera") {

            var node = this.nodes[nodeID] = {
                name: undefined,
                glgeObject: undefined,
				type: nodeExtendsID
            };

			if ( this.defaultCamera ) {
				this.defaultCamera = node;
				this.defaultCameraID = nodeID;

				node["name"] = "vwfDefaultCam";
				node["glgeObject"] = new GLGE.Camera();
			} else {
				this.camera = node;
				this.cameraID = nodeID;
			}
        }

        else if (nodeExtendsID == "http-vwf-example-com-types-light") {

            var node = this.nodes[nodeID] = {
                name: undefined,
                glgeObject: undefined,
				type: nodeExtendsID
            };

        }

        else if (nodeExtendsID == "http-vwf-example-com-types-material") {

            var node = this.nodes[nodeID] = {
                name: undefined,
                glgeObject: undefined,
                glgeMaterial: true,
				type: nodeExtendsID
            };

        }
    };

    module.prototype.findCollada = function ( grp, view, nodeID ) {

        if ( grp && grp.getChildren ) {
            var children = grp.getChildren();
            var glgeView = view;
            var viewID = nodeID;
  
            function colladaLoaded( collada ) { 
                var bRemoved = false;
                for ( var j = 0; j < glgeView.glgeColladaObjects.length; j++ ) {
                    if ( glgeView.glgeColladaObjects[j] == collada ){
                        glgeView.glgeColladaObjects.splice( j, 1 );
                        bRemoved = true;
                    }
                } 

                if ( bRemoved && glgeView.glgeColladaObjects.length == 0 ){
                    bindSceneChildren( glgeView, viewID );
                }
            }
  
            for ( var i = 0; i < children.length; i++ ) {
                if ( children[i].constructor == GLGE.Collada ) {
                    glgeView.glgeColladaObjects.push( children[i] );
                    children[i].loadedCallback = colladaLoaded;
                }
                view.findCollada( children[i], view ); 
            }
        }
        
    }

    module.prototype.findAllColladaObjs = function (glgeScene, view, nodeID) {

        this.findCollada( glgeScene, view, nodeID );

    }


    // TODO: deletedNode

    // -- addedChild -------------------------------------------------------------------------------

    module.prototype.addedChild = function (nodeID, childID, childName) {

        vwf.logger.info(namespace + ".addedChild " + nodeID + " " + childID + " " + childName);

        var child = this.nodes[childID];


        if (child) {
            if (bindChild(this, this.scenes[nodeID], this.nodes[nodeID], child, childName, childID)) {
                bindNodeChildren(this, childID);
            }
        }

    };

    // -- removedChild -----------------------------------------------------------------------------

    module.prototype.removedChild = function (nodeID, childID) {

        vwf.logger.info(namespace + ".removedChild " + nodeID + " " + childID);

    };

    // -- createdProperty --------------------------------------------------------------------------

    module.prototype.createdProperty = function (nodeID, propertyName, propertyValue) {

        vwf.logger.info(namespace + ".createdProperty " + nodeID + " " + propertyName + " " + propertyValue);

    };

    // TODO: deletedProperty

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function (nodeID, propertyName, propertyValue) {

        vwf.logger.info(namespace + ".satProperty " + nodeID + " " + propertyName + " " + propertyValue);

        var node = this.nodes[nodeID]; // { name: childName, glgeObject: undefined }
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

            switch ( propertyName ) {

                case "rotX":
                    value = glgeObject.setRotX( Number( propertyValue ) * ( 3.14159/180.0 ) );
                    break;

                case "rotY":
                    value = glgeObject.setRotY( Number( propertyValue ) * ( 3.14159/180.0 ) );
                    break;

                case "rotZ":
                    value = glgeObject.setRotZ( Number( propertyValue ) * ( 3.14159/180.0 ) );
                    break;

                case "eulers":
                case "position":
                case "worldEulers":
                case "worldPosition":
                case "scale":
                    {
                        var values;
                        var propValue;
                       
                        if ( propertyValue.constructor != String )
                            propValue = JSON.stringify(propertyValue);
                        else
                            propValue = propertyValue;

                        values = propValue.replace("[", "");
                        values = values.replace("]", "");
                        values = values.split(',');
                        switch ( propertyName )
                        {
                            case "eulers":
                                value = glgeObject.setRot( Number( values[0] ) * ( 3.14159/180.0 ) , Number( values[1] )* ( 3.14159/180.0 ), Number( values[2] ) * ( 3.14159/180.0 ) );
                                break;
                            case "position":
                                value = glgeObject.setLoc( Number( values[0] ), Number( values[1] ), Number( values[2] ) );
                                break;
                            case "worldEulers":
                                value = glgeObject.setDRot( Number( values[0] )* ( 3.14159/180.0 ), Number( values[1] )* ( 3.14159/180.0 ), Number( values[2] )* ( 3.14159/180.0 ) );
                                break;
                            case "worldPosition":
                                value = glgeObject.setDLoc( Number( values[0] ), Number( values[1] ), Number( values[2] ) );
                                break;
                            case "scale":                            
                                value = glgeObject.setScale( Number( values[0] ), Number( values[1] ), Number( values[2] ) );
                                break;
                        }
                    }
                    break;
                case "texture":
                    {
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
                            mat.addTexture( propertyValue );
                        }

                    }
                    break;



				// light properties begin
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

  				case "diffuse":
					node.glgeObject.setDiffuse( propertyValue );
					break;

  				case "specular":
					node.glgeObject.setSpecular( propertyValue );
					break;

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
				// light properties end

            }
        }

        return value;
    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function (nodeID, propertyName, propertyValue) {

        vwf.logger.info(namespace + ".gotProperty " + nodeID + " " + propertyName + " " + propertyValue);

        var node = this.nodes[nodeID]; // { name: childName, glgeObject: undefined }
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

            switch ( propertyName ) {

                case "rotX":
                    value = glgeObject.getRotX() * ( 180.0/3.14159 );
                    break;

                case "rotY":
                    value = glgeObject.getRotY() * ( 180.0/3.14159 );
                    break;

                case "rotZ":
                    value = glgeObject.getRotZ() * ( 180.0/3.14159 );
                    break;

                case "eulers":
                    value = new Array;
                    value.push( glgeObject.getRotX() * ( 180.0/3.14159 ), glgeObject.getRotY()* ( 180.0/3.14159 ), glgeObject.getRotZ()* ( 180.0/3.14159 ) );
                    break;
                case "position":
                    value = new Array;
                    value.push( glgeObject.getLocX(), glgeObject.getLocY(), glgeObject.getLocZ() );
                    break;
                case "worldEulers":
                    value = new Array;
                    value.push( glgeObject.getDRotX()* ( 180.0/3.14159 ), glgeObject.getDRotY()* ( 180.0/3.14159 ), glgeObject.getDRotZ()* ( 180.0/3.14159 ) );
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
                    //glgeObject.    
                    break;

				// light properties begin
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
				// light properties end

            }
        }

        return value;
    };

    // == Private functions ========================================================================

    var bindSceneChildren = function (view, nodeID) {

        vwf.logger.info("      bindSceneChildren: " + nodeID);
        var scene = view.scenes[nodeID];
        var child;

        if ( scene.glgeScene ) {
            jQuery.each(vwf.children(nodeID), function (childIndex, childID) {
                if (child = view.nodes[childID]) { // assignment is intentional
                    if (bindChild(view, scene, undefined, child, vwf.name(childID), childID)) {
                        bindNodeChildren(view, childID);
                    }
                }
            });
        }

        this.defaultCamera = true;
        vwf.createNode( "http://vwf.example.com/types/camera", dummy, "vwfDefaultCam" ); 

		function dummy( nodeID, name ) {}

    };

    var bindNodeChildren = function (view, nodeID) {

        vwf.logger.info("      bindNodeChildren: " + nodeID);
        var node = view.nodes[nodeID];
        var child;

        if ( node.glgeObject ) {
            jQuery.each(vwf.children(nodeID), function (childIndex, childID) {
                if (child = view.nodes[childID]) { // assignment is intentional
                    if (bindChild(view, undefined, node, child, vwf.name(childID), childID)) {
                        bindNodeChildren(view, childID);
                    }
                }
            });
        }

    };

    var bindChild = function (view, scene, node, child, childName, childID) {

        vwf.logger.info("      bindChild: " + scene + " " + node + " " + child + " " + childName);
        if (scene && !child.glgeObject) {
            child.name = childName;
            child.glgeObject = scene.glgeScene && glgeSceneChild(scene.glgeScene, childName);
            if (child.glgeObject) {
                glgeObjectInitializeFromProperties(view, childID, child.glgeObject);
                child.initialized = true;
            } else {
				var obj = GLGE.Assets.get(childName);
				if ( obj ) {
					child.glgeObject = obj;
					child.initialized = true;
				}
			}
       }

        else if (node && !child.glgeObject) {
            child.name = childName;
            if ( view.nodes[ childID ] && view.nodes[ childID ].glgeMaterial ) {
                bindMaterial( view, childID, childName, node );
                child.initialized = true;
            } else {
                child.glgeObject = node.glgeObject && glgeObjectChild(node.glgeObject, childName);
                if (child.glgeObject) {
                    glgeObjectInitializeFromProperties(view, childID, child.glgeObject);
                    child.initialized = true;
                } else {
					switch( child["type"] ) {
						case "http-vwf-example-com-types-light":
							var obj = GLGE.Assets.get(childName);
							if ( obj ) {
								child.glgeObject = obj;
								child.initialized = true;
							} else {
								obj = GLGE.Assets.get(childName+"-light");
								if ( obj ) {
									child.glgeObject = obj;
									child.initialized = true;
								}
							}							
							break;
					}
				}
            }
        }

        if (child.glgeObject && child.glgeObject.constructor == GLGE.ParticleSystem && child.name == "smoke") {
            view.smoke = child;
            view.smokeID = childID;
        }

        var success = Boolean(child.glgeObject);

        if ( !success ) {
            vwf.logger.info( "     unable to bind: " + childName );
        } else {
            if ( child.glgeObject.animate && child.glgeObject.animation ) {
               vwf.logger.info( "$$$$$     child id " + childID + " with name " + childName ); 
            }
        }

        return success;

        //vwf.logger.info( "scene: " + nodeID + " " + childID + " " + childName + " " + this.nodes[childID].glgeObject );
        //vwf.logger.info( "node: " + nodeID + " " + childID + " " + childName + " " + this.nodes[childID].glgeObject );
    };

    // Search a GLGE.Scene for a child with the given name.

    var glgeSceneChild = function (glgeScene, childName) {

        var childToReturn = jQuery.grep(glgeScene.children || [], function (glgeChild) {
            return (glgeChild.name || glgeChild.id || glgeChild.sourceURL || "") == childName;
        }).shift();

        //vwf.logger.info("      glgeSceneChild( " + childName + " ) returns " + childToReturn);
        return childToReturn;

    };

    // Search a GLGE.Object, GLGE.Collada, GLGE.Light for a child with the given name.  TODO: really, it's anything with children[]; could be the same as glgeSceneChild().

    var glgeObjectChild = function (glgeObject, childName) {

        var childToReturn = jQuery.grep(glgeObject.children || [], function (glgeChild) {
            return (glgeChild.colladaName || glgeChild.colladaId || glgeChild.name || glgeChild.id || "") == childName;
        }).shift();

        //vwf.logger.info("      glgeObjectChild( " + childName + " ) returns " + childToReturn);
        return childToReturn;

    };

    var bindMaterial = function( view, childID, childName, node ) {

        if ( node && node.glgeObject && view.nodes[childID] ) {
            if ( node.glgeObject.children.length == 1 && node.glgeObject.children[0].constructor == GLGE.Object ) {
                var childNode = view.nodes[childID];
                var glgeChild = node.glgeObject.children[0];
                var materialStringIndex = childName.lastIndexOf( "Material" );
                var materialIndex = Number( childName.substr( materialStringIndex + 8 ) ) - 1;

                childNode.glgeObject = glgeChild;
                childNode.glgeMaterial = glgeChild.getMaterial( materialIndex );
                
                if ( !( childNode.glgeMaterial ) && ( childNode.glgeObject ) ) {
                    childNode.glgeMaterial = childNode.glgeObject.material;
                }

                if ( childNode.glgeMaterial === childNode.glgeObject.material ) {
                    console.info( " materials are the same object!!!!! " );
                }
            }
        }

    };

    var glgeObjectInitializeFromProperties = function( view, nodeID, glgeObject ) {

        view.satProperty( nodeID, "playing", vwf.getProperty( nodeID, "playing" ) );
        view.satProperty( nodeID, "looping", vwf.getProperty( nodeID, "looping" ) );
        view.satProperty( nodeID, "speed", vwf.getProperty( nodeID, "speed" ) );

    };

    var cameraPositions = {
        "1": { "position": [ 42.5, 198.2, 113 ], "rotation": [ 1.56, 2.9, 0 ], },
        "2": { "position": [ -165.9, 130.8, 98 ], "rotation": [ 1.56, 4.26, 0 ], },
        "3": { "position": [ 53.6, 97.1, 98 ], "rotation": [ 1.56, 4.4, 0 ], },
        "4": { "position": [ -41.7, 111.5, 98 ], "rotation": [ 1.56, 3.14, 0 ], },
        "5": { "position": [ -149.6, 44, 98 ], "rotation": [ 1.56, 4.8, 0 ], },
        "6": { "position": [ -154.2, -7.3, 98 ], "rotation": [ 1.56, 4.54, 0 ], },
        "7": { "position": [ -70.7, -122, 98 ], "rotation": [ 1.56, 6.02, 0 ], },
        "8": { "position": [ 165, -70, 98 ], "rotation": [ 1.56, 2.0, 0 ], },
    };

    var orbitYaw = 0;
    var orbitPitch = 0;
    var orbitInc = 2.0;
    var objectCenter = {};

    var centerGroup = undefined;
    //var keysDown = {};

    var checkKeys = function (nodeID, view, now, lasttime) {
        
        var scene = view.scenes[nodeID], child;
        if (scene && scene.glgeScene) {
            var camera = scene.glgeScene.camera;
            if (camera && camera.handleKeyEvents) {
  
              var mat = camera.getRotMatrix();
              var trans = GLGE.mulMat4Vec4(mat, [0, 0, -1, 1]);
              var mag = Math.pow( Math.pow( trans[0], 2 ) + Math.pow( trans[1], 2 ), 0.5 );
 
              // should only be sending the keysDown, now, lastime, but I'm going to
              // inlcude the additional data for now to cut some corners
              camera.handleKeyEvents( view.keysDown, now, lasttime, mat, trans, mag );
            } else {
                camerapos = camera.getPosition();
                camerarot = camera.getRotation();
                var mat = camera.getRotMatrix();
                var trans = GLGE.mulMat4Vec4(mat, [0, 0, -1, 1]);
                var mag = Math.pow( Math.pow( trans[0], 2 ) + Math.pow( trans[1], 2 ), 0.5 );

				var yinc = 0;
				var xinc = 0;
				var zinc = 0;
				trans[0] = trans[0] / mag;
				trans[1] = trans[1] / mag;

				if (scene.glgeKeys.isKeyPressed(GLGE.KI_W) || scene.glgeKeys.isKeyPressed(GLGE.KI_UP_ARROW)) {
					yinc = yinc + parseFloat(trans[1]); xinc = xinc + parseFloat(trans[0]);
				}
				if (scene.glgeKeys.isKeyPressed(GLGE.KI_S) || scene.glgeKeys.isKeyPressed(GLGE.KI_DOWN_ARROW)) {
					yinc = yinc - parseFloat(trans[1]); xinc = xinc - parseFloat(trans[0]);
				}
				if (scene.glgeKeys.isKeyPressed(GLGE.KI_LEFT_ARROW) || scene.glgeKeys.isKeyPressed(GLGE.KI_Q)) {
					yinc = yinc + parseFloat(trans[0]); xinc = xinc - parseFloat(trans[1]); 
				}
				if (scene.glgeKeys.isKeyPressed(GLGE.KI_RIGHT_ARROW) || scene.glgeKeys.isKeyPressed(GLGE.KI_E)) {
					yinc = yinc - parseFloat(trans[0]); xinc = xinc + parseFloat(trans[1]); 
				}
				if (scene.glgeKeys.isKeyPressed(GLGE.KI_R)) { zinc = zinc + 1.0 }
				if (scene.glgeKeys.isKeyPressed(GLGE.KI_C)) { zinc = zinc - 1.0 }
				if (scene.glgeKeys.isKeyPressed(GLGE.KI_A)) { camera.setRotY(camerarot.y + 0.04); }
				if (scene.glgeKeys.isKeyPressed(GLGE.KI_D)) { camera.setRotY(camerarot.y - 0.04); }
				if (scene.glgeKeys.isKeyPressed(GLGE.KI_Z)) {
					vwf.logger.info("camerapos = " + camerapos.x + ", " + camerapos.y + ", " + camerapos.z);
					vwf.logger.info("camerarot = " + camerarot.x + ", " + camerarot.y + ", " + camerarot.z);
				}

				if (xinc != 0 || yinc != 0 || zinc != 0) {
					camera.setLocY(camerapos.y + yinc * 0.05 * (now - lasttime));
					camera.setLocX(camerapos.x + xinc * 0.05 * (now - lasttime));
					camera.setLocZ(camerapos.z + zinc);
				}
			}
        }

        /*var keysDown = {};
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_A) ) keysDown[GLGE.KI_A] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_B) ) keysDown[GLGE.KI_B] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_C) ) keysDown[GLGE.KI_C] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_D) ) keysDown[GLGE.KI_D] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_E) ) keysDown[GLGE.KI_E] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_F) ) keysDown[GLGE.KI_F] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_G) ) keysDown[GLGE.KI_G] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_H) ) keysDown[GLGE.KI_H] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_I) ) keysDown[GLGE.KI_I] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_J) ) keysDown[GLGE.KI_J] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_K) ) keysDown[GLGE.KI_K] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_L) ) keysDown[GLGE.KI_L] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_M) ) keysDown[GLGE.KI_M] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_N) ) keysDown[GLGE.KI_N] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_O) ) keysDown[GLGE.KI_O] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_P) ) keysDown[GLGE.KI_P] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_Q) ) keysDown[GLGE.KI_Q] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_R) ) keysDown[GLGE.KI_R] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_S) ) keysDown[GLGE.KI_S] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_T) ) keysDown[GLGE.KI_T] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_U) ) keysDown[GLGE.KI_U] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_V) ) keysDown[GLGE.KI_V] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_W) ) keysDown[GLGE.KI_W] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_X) ) keysDown[GLGE.KI_X] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_Y) ) keysDown[GLGE.KI_Y] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_Z) ) keysDown[GLGE.KI_Z] = true;

        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_1) ) keysDown[GLGE.KI_1] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_2) ) keysDown[GLGE.KI_2] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_3) ) keysDown[GLGE.KI_3] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_4) ) keysDown[GLGE.KI_4] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_5) ) keysDown[GLGE.KI_5] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_6) ) keysDown[GLGE.KI_6] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_7) ) keysDown[GLGE.KI_7] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_8) ) keysDown[GLGE.KI_8] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_9) ) keysDown[GLGE.KI_9] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_0) ) keysDown[GLGE.KI_0] = true;

        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_LEFT_ARROW) ) keysDown[GLGE.KI_LEFT_ARROW] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_RIGHT_ARROW) ) keysDown[GLGE.KI_RIGHT_ARROW] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_UP_ARROW) ) keysDown[GLGE.KI_UP_ARROW] = true;
        if ( scene.glgeKeys.isKeyPressed(GLGE.KI_DOWN_ARROW) ) keysDown[GLGE.KI_DOWN_ARROW] = true;*/



        /*if (scene && scene.glgeScene) {
            var camera = scene.glgeScene.camera;
            if (camera) {
                var bOrbit = false;

                if ( !centerGroup ) {
                    centerGroup = new GLGE.Group();
                    objectCenter.x = 0.15;
                    objectCenter.y = 0;
                    objectCenter.z = -0.3;
                }

                camerapos = camera.getPosition();
                camerarot = camera.getRotation();
                var mat = camera.getRotMatrix();
                var trans = GLGE.mulMat4Vec4(mat, [0, 0, -1, 1]);
                var mag = Math.pow( Math.pow( trans[0], 2 ) + Math.pow( trans[1], 2 ), 0.5 );

                if ( bOrbit ) {
                    var x, y, z = 0;
                    var dx, dy, dz = 0;
                    var radius = 10.0;

                    dx = objectCenter.x - camerapos.x;
                    dy = objectCenter.y - camerapos.y;
                    dz = objectCenter.z - camerapos.z;

                    radius = Math.sqrt( dx*dx + dy*dy + dz*dz );

                    centerGroup.setLocX( objectCenter.x );
                    centerGroup.setLocY( objectCenter.y );
                    centerGroup.setLocZ( objectCenter.z );
                    
                    var bKeyDown = false;
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_W) || scene.glgeKeys.isKeyPressed(GLGE.KI_UP_ARROW)) {
                        // orbit up
                         orbitPitch += orbitInc;
                         bKeyDown = true;
                    }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_S) || scene.glgeKeys.isKeyPressed(GLGE.KI_DOWN_ARROW)) {
                        // orbit down
                        orbitPitch -= orbitInc;
                          bKeyDown = true;
                    }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_LEFT_ARROW) || scene.glgeKeys.isKeyPressed(GLGE.KI_A)) {
                        // orbit left
                        orbitYaw += orbitInc;
                        bKeyDown = true;
                    }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_RIGHT_ARROW) || scene.glgeKeys.isKeyPressed(GLGE.KI_D)) {
                        // orbit right  
                       orbitYaw -= orbitInc;
                       bKeyDown = true;
                    }  
                     
                    if ( bKeyDown ) {
                        if ( orbitYaw > 90 )
                            orbitYaw = 90.0;
                        if ( orbitYaw < -90 )
                            orbitYaw = -90.0;
                        if ( orbitPitch > 360 )
                            orbitPitch -= 360;
                        if ( orbitPitch < -360 )
                            orbitPitch += 360.0;

                        x = objectCenter.x + radius * Math.sin( orbitYaw ) * Math.cos( orbitPitch );
//                        y = objectCenter.y + radius * Math.sin( orbitPitch ) * Math.sin( orbitYaw );
//                        z = objectCenter.z + radius * Math.cos( orbitPitch );
                        y = objectCenter.y + radius * Math.cos( orbitYaw );
                        z = objectCenter.z + radius * Math.sin( orbitYaw ) * Math.sin( orbitPitch );

                        console.info( " Setting camera position to: [ " + x + ", " + y + ", " + z + " ]" );
                        camera.setLocX( x );
                        camera.setLocY( y );
                        camera.setLocZ( z );
                        camera.setLookat( centerGroup );
                    }
                                
                } else { 
                    var yinc = 0;
                    var xinc = 0;
                    var zinc = 0;
                    trans[0] = trans[0] / mag;
                    trans[1] = trans[1] / mag;

                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_W) || scene.glgeKeys.isKeyPressed(GLGE.KI_UP_ARROW)) {
                        yinc = yinc + parseFloat(trans[1]); xinc = xinc + parseFloat(trans[0]);
                    }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_S) || scene.glgeKeys.isKeyPressed(GLGE.KI_DOWN_ARROW)) {
                        yinc = yinc - parseFloat(trans[1]); xinc = xinc - parseFloat(trans[0]);
                    }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_LEFT_ARROW) || scene.glgeKeys.isKeyPressed(GLGE.KI_Q)) {
                        yinc = yinc + parseFloat(trans[0]); xinc = xinc - parseFloat(trans[1]); 
                    }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_RIGHT_ARROW) || scene.glgeKeys.isKeyPressed(GLGE.KI_E)) {
                        yinc = yinc - parseFloat(trans[0]); xinc = xinc + parseFloat(trans[1]); 
                    }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_R)) { zinc = zinc + 1.0 }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_C)) { zinc = zinc - 1.0 }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_A)) { camera.setRotY(camerarot.y + 0.04); }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_D)) { camera.setRotY(camerarot.y - 0.04); }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_Z)) {
                        vwf.logger.info("camerapos = " + camerapos.x + ", " + camerapos.y + ", " + camerapos.z);
                        vwf.logger.info("camerarot = " + camerarot.x + ", " + camerarot.y + ", " + camerarot.z);
                    }
                    if (view.smokeID && scene.glgeKeys.isKeyPressed(GLGE.KI_P)) {
                        if (scene.glgeKeys.isKeyPressed(GLGE.KI_SHIFT)) {
                            view.setProperty( view.smokeID, "looping", false );
                        } else {
                            view.setProperty( view.smokeID, "looping", true );
                        }
                    }

                    var allowCameraPositions = false;
                    var cp = "";
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_1)) cp = "1";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_2)) cp = "2";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_3)) cp = "3";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_4)) cp = "4";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_5)) cp = "5";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_6)) cp = "6";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_7)) cp = "7";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_8)) cp = "8";

                    if ( allowCameraPositions && cp != "" ) {
                        var pos = cameraPositions[cp]["position"];
                        var rot = cameraPositions[cp]["rotation"];
                        camera.setLocX(pos[0]);
                        camera.setLocY(pos[1]);
                        camera.setLocZ(pos[2]);
                        camera.setRotX(rot[0]);
                        camera.setRotY(rot[1]);
                        camera.setRotZ(rot[2]);
                    }

                    //if (levelmap.getHeightAt(camerapos.x + xinc, camerapos.y) > 30) xinc = 0;
                    //if (levelmap.getHeightAt(camerapos.x, camerapos.y + yinc) > 30) yinc = 0;
                    //if (levelmap.getHeightAt(camerapos.x + xinc, camerapos.y + yinc) > 30) { 
                    //    yinc = 0; xinc = 0; }
                    //else {
                    //    camera.setLocZ(levelmap.getHeightAt(camerapos.x + xinc, camerapos.y + yinc) + 8);
                    //}
                    if (xinc != 0 || yinc != 0 || zinc != 0) {
                        camera.setLocY(camerapos.y + yinc * 0.05 * (now - lasttime));
                        camera.setLocX(camerapos.x + xinc * 0.05 * (now - lasttime));
                        camera.setLocZ(camerapos.z + zinc);
                    }
                }
            }
        }*/

    }

    var initMouseEvents = function (canvas, nodeID, view) {

        var scene = view.scenes[nodeID], child;
        var sceneID = nodeID;
        var sceneView = view;
        var mouseDown = false;
        var mouseOverCanvas = false;

        var mouseDownObjectID = undefined;
        var mouseOverObjectID = undefined;

        var lastXPos = -1;
        var lastYPos = -1;

        canvas.onmousedown = function (e) {
            mouseDown = true;
            mouseDownObjectID = getObjectID( mousePick(e, scene ), sceneView, true );

            //vwf.logger.info("CANVAS mouseDown: " + mouseDownObjectID);
            //this.throwEvent( "onMouseDown", mouseDownObjectID);
            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );

        }

        canvas.onmouseup = function (e) {
            var mouseUpObjectID = getObjectID( mousePick( e, scene ), sceneView, false );
            // check for time??
            if ( mouseUpObjectID && mouseDownObjectID && mouseUpObjectID == mouseDownObjectID ) {
                vwf.logger.info("pointerClick: id:" + mouseDownObjectID + "   name: " + name( view.nodes[mouseDownObjectID].glgeObject ) );
                //this.throwEvent( "onMouseClick", mouseDownObjectID);
                view.callMethod( mouseUpObjectID, "pointerClick" );
            }

            //vwf.logger.info("CANVAS onMouseUp: " + mouseDownObjectID);
            //this.throwEvent( "onMouseUp", mouseDownObjectID);

            mouseDownObjectID = undefined;
            mouseDown = false;

            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );
        }

        canvas.onmouseover = function (e) {
            mouseOverCanvas = true;

            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );
        }

        canvas.onmousemove = function (e) {
            var pickInfo = mousePick( e, scene );
            var mouseOverID = getObjectID( pickInfo, sceneView, false );
            var mouseInfo = { 
                              "lastX": lastXPos,
                              "lastY": lastYPos,
                              "X" : mouseXPos(e),
                              "Y" : mouseYPos(e),
                              "mouseDownID" : mouseDownObjectID,
                              "mouseOverID" : mouseOverID,
                              "pickInfo" : pickInfo,
                            };

            if (mouseDown) {
                if (mouseDownObjectID) {

                    //vwf.logger.info("CANVAS onMouseMove: " + mouseDownObjectID);
                    //this.throwEvent( "onMouseMove", mouseDownObjectID);
                }

                //view.callMethod( mouseDownObjectID, "onMouseMove" );
            } else {
                if (mouseOverID) {
                    if (mouseOverObjectID) {
                        if (mouseOverID != mouseOverObjectID) {

                            //vwf.logger.info("CANVAS onMouseLeave: " + mouseOverObjectID);
                            //this.throwEvent( "onMouseLeave", mouseOverObjectID);

                            mouseOverObjectID = mouseOverID;

                            //vwf.logger.info("CANVAS onMouseEnter: " + mouseOverObjectID);
                            //this.throwEvent( "onMouseEnter", mouseOverObjectID);
                        } else {
                            //vwf.logger.info("CANVAS onMouseHover: " + mouseOverObjectID);
                            //this.throwEvent( "onMouseHover", mouseOverObjectID);

                        }
                    } else {
                        mouseOverObjectID = mouseOverID;

                        //vwf.logger.info("CANVAS onMouseEnter: " + mouseOverObjectID);
                        //this.throwEvent( "onMouseEnter", mouseOverObjectID);
                    }

                } else {
                    if (mouseOverObjectID) {
                        //vwf.logger.info("CANVAS onMouseLeave: " + mouseOverObjectID);
                        //this.throwEvent( "onMouseLeave", mouseOverObjectID);
                        mouseOverObjectID = undefined;

                    }
                }
            }

            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );

            //this.mouseOverCanvas = true; 
        }

        canvas.onmouseout = function (e) {
            if (mouseOverObjectID) {
                //vwf.logger.info("CANVAS onMouseLeave: " + mouseOverObjectID);
                //this.throwEvent( "onMouseLeave", mouseOverObjectID);
                mouseOverObjectID = undefined;
            }
            mouseOverCanvas = false;
        }

        canvas.onmousewheel = function (e) {
        }

    };

    function name(obj) {

        var sName = obj.colladaName || obj.colladaId || obj.name || obj.id || "";
        //vwf.logger.info("  glgeObject is named: " + sName );
        return sName;

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

    var mouseXPos = function(e) {
        return e.clientX - e.currentTarget.offsetLeft + window.scrollX;
    }

    var mouseYPos = function(e) {
        return e.clientY - e.currentTarget.offsetTop + window.scrollY;
    }

    var getObjectID = function( pickInfo, view, debug ) {

        if (pickInfo && pickInfo.object) {
            var objectIDFound = -1;
            var objectToLookFor = pickInfo.object;

            while (objectIDFound == -1 && objectToLookFor) {
                if ( debug ) 
                    vwf.logger.info("====>>>  vwf.view-glge.mousePick: searching for: " + path(objectToLookFor) );
                jQuery.each(view.nodes, function (nodeID, node) {
                    if ( node.glgeObject == objectToLookFor && !node.glgeMaterial ) {
                        //vwf.logger.info("pick object name: " + name(objectToLookFor) + " with id = " + nodeID );
                        objectIDFound = nodeID;
                    }
                });
                objectToLookFor = objectToLookFor.parent;
            }
            if (objectIDFound != -1)
                return objectIDFound;
        }
        return undefined;

    }

    var mousePick = function ( e, scene ) {

        if (scene && scene.glgeScene) {
            var objectIDFound = -1;
            var x = mouseXPos( e );
            var y = mouseYPos( e );

            return scene.glgeScene.pick(x, y);
        }
        return undefined;

    };


})(window.vwf.modules, "vwf.view.glge");
