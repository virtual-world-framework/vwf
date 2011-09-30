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
		this.canvasQuery = undefined;
		this.rootNodeID = undefined;

        this.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
        this.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }

        this.smoke = undefined; // { name: string, glgeObject: GLGE.ParticleSystem }
        this.smokeID = undefined;

        this.glgeColladaObjects = new Array();
        this.keysDown = {};

		this.parentIDMap = {};
		this.childIDMap = {};

		this.delayedProperties = {};
		this.loadingObjects = {};
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

            this.canvasQuery = jQuery(this.rootSelector).append(
                "<canvas id='" + nodeID + "' class='vwf-scene' width='800' height='600'/>"
            ).children(":last");

			if ( !this.rootNodeID ) {
				this.rootNodeID = nodeID;
			}

           
			window.onkeydown = function( event ) {
              //console.info( "keydown( " + event.keyCode + " )" );
			  view.keysDown[ event.keyCode ] = true;
            };

			window.onkeyup = function( event ) {
              //console.info( "keyup( " + event.keyCode + " )" );
			  view.keysDown[ event.keyCode ] = true;
            };

            var sceneNode = this.scenes[nodeID] = {
                glgeDocument: new GLGE.Document(),
                glgeRenderer: undefined,
                glgeScene: undefined,
				ID: nodeID,
                glgeKeys: new GLGE.KeyInput()
            };

            var view = this;

            // Connect GLGE to the VWF timeline.

            GLGE.now = function() {
                return vwf.time() * 1000;
            };

            sceneNode.glgeDocument.onLoad = function () {
				view.initScene( sceneNode );
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

				//console.info( "++ 3 ++		view.glgeColladaObjects.length = " + view.glgeColladaObjects.length );

                if ( bRemoved && view.glgeColladaObjects.length == 0 ){
                    bindSceneChildren( view, nodeID );
					vwf.setProperty( sceneNode.ID, "loadComplete", true );
                }
            }

			if ( nodeSource ) {
				switch ( nodeType ) {
					case "model/x-glge":
						sceneNode.glgeDocument.load(nodeSource);
						break;

				}
			}

        } else if (nodeExtendsID == "http-vwf-example-com-types-node3") {

			if ( nodeType == "model/vnd.collada+xml" ) {
				var node = this.nodes[nodeID] = {
					name: undefined,  
					glgeObject: undefined,
					type: nodeExtendsID,
					source: nodeSource,
					ID: nodeID,
					sourceType: nodeType 
				};
			} else {

				var node = this.nodes[nodeID] = {
					name: undefined,  // TODO: needed?
					glgeObject: undefined,
					ID: nodeID,
					type: nodeExtendsID
				};
			}

        } else if (nodeExtendsID == "http-vwf-example-com-types-camera") {

			var camName = nodeID.substring( nodeID.lastIndexOf( '-' ) + 1 );
var sceneNode = this.scenes["index-vwf"];
            var node = this.nodes[nodeID] = {
                name: undefined,
                glgeObject: undefined,
				ID: nodeID,
				glgeScene: sceneNode ? sceneNode.glgeScene : undefined,
				type: nodeExtendsID
            };

			if ( camName == sceneNode.camera.defaultName ) {
				if ( !sceneNode.camera.defaultCam ) {
					var cam = new GLGE.Camera();
					sceneNode.camera.defaultCam = cam;
					sceneNode.camera.glgeCameras[ camName ] = cam;
					initCamera( cam );
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

			
        } else if (nodeExtendsID == "http-vwf-example-com-types-light") {

            var node = this.nodes[nodeID] = {
                name: undefined,
                glgeObject: undefined,
				ID: nodeID,
				type: nodeExtendsID
            };

        } else if (nodeExtendsID == "http-vwf-example-com-types-material") {

            var node = this.nodes[nodeID] = {
                name: undefined,
                glgeObject: undefined,
                glgeMaterial: true,
				ID: nodeID,
				type: nodeExtendsID
            };

        } else if (nodeExtendsID == "http-vwf-example-com-types-particlesystem") {

            var node = this.nodes[nodeID] = {
                name: undefined,
                glgeObject: undefined,
				ID: nodeID,
				type: nodeExtendsID
            };

        } else {

			var node;
			var childName;
			switch ( nodeExtendsID ) {
				case "index-vwf":
				case "http-vwf-example-com-types-node":
				case "http-vwf-example-com-types-node2":
				case "http-vwf-example-com-types-scene":
				case "http-vwf-example-com-types-glge":
				case undefined:
					break;

				case "http-vwf-example-com-types-group3":
					childName = nodeID.substring( nodeID.lastIndexOf( '-' )+1 );
					node = this.nodes[nodeID] = {
						name: childName,
						glgeObject: new GLGE.Group(),
						ID: nodeID,
						type: nodeExtendsID
					};
					
					node.gui = node.glgeObject.uid;
					node.glgeObject.name = childName;					
					break;

				default:
					node = this.nodes[nodeID] = {
						name: undefined,
						glgeObject: undefined,
						ID: nodeID,
						type: nodeExtendsID
					};
				break;	
			}		
		}

    };

	module.prototype.initScene = function( sceneNode ) {

        var canvas = this.canvasQuery.get(0);

		sceneNode.camera = {}; 
		sceneNode.camera.defaultCam = undefined;
        sceneNode.camera.defaultCamNode = undefined;
        sceneNode.camera.camNode = undefined;
        sceneNode.camera.name = "";
		sceneNode.camera.defaultName = "defaultCamera";

		sceneNode.camera.glgeCameras = {};

        sceneNode.glgeRenderer = new GLGE.Renderer(canvas);
        sceneNode.glgeScene = sceneNode.glgeDocument.getElement("mainscene");
		if ( !sceneNode.glgeScene ) {
			sceneNode.glgeScene = this.createScene( sceneNode );
		} else if ( sceneNode.glgeScene.camera ) {
			sceneNode.camera.defaultCam = sceneNode.glgeScene.camera;
			sceneNode.camera.glgeCameras[ sceneNode.camera.defaultName ] = sceneNode.camera.defaultCam;
		}

        sceneNode.glgeRenderer.setScene( sceneNode.glgeScene );

		createDefaultCamera( sceneNode );

		cameraInUse = sceneNode.glgeScene.camera;

        this.findAllColladaObjs( sceneNode.glgeScene, this.rootNodeID );

        // set up all of the mouse event handlers
        initMouseEvents(canvas, this.rootNodeID, this );

        // Schedule the renderer.

		var view = this;
		var scene = sceneNode.glgeScene;
		var renderer = sceneNode.glgeRenderer;
        var lasttime = 0;
        var now;
        function renderScene() {
            now = parseInt( new Date().getTime() );
            renderer.render();
            checkKeys( view.rootNodeID, view, now, lasttime );
			if ( mouseDown && ( ( now - mouseDownTime ) > 700 ) ) {
				mouselook( now, lasttime );
			}
            lasttime = now;
        };

        setInterval(renderScene, 1);
		
	} 

	module.prototype.createScene = function( sceneNode ) {

		var glgeScene = new GLGE.Scene();
		var cam;

		sceneNode.glgeScene = glgeScene;
		if ( glgeScene.camera ) {
			cam = glgeScene.camera;
			sceneNode.camera.defaultCam = cam;
			sceneNode.camera.glgeCameras[ sceneNode.camera.defaultName ] = cam;
		} else {
			cam = new GLGE.Camera();
			sceneNode.camera.defaultCam = cam; 
			sceneNode.camera.glgeCameras[ sceneNode.camera.defaultName ] = cam;
		}
		initCamera( cam );
		setActiveCamera( this, cam, sceneNode, undefined );
		glgeScene.setAmbientColor( [ 183, 183, 183 ] );
		return glgeScene;
	}

    module.prototype.findCollada = function ( grp, nodeID ) {

        if ( grp && grp.getChildren ) {
            var children = grp.getChildren();
            var glgeView = this;
            var viewID = nodeID;
  
            function colladaLoaded( collada ) { 
                var bRemoved = false;
				console.info( "++ 1 ++		colladaLoaded( "+ collada.docURL +" )" );
                for ( var j = 0; j < glgeView.glgeColladaObjects.length; j++ ) {
                    if ( glgeView.glgeColladaObjects[j] == collada ){
                        glgeView.glgeColladaObjects.splice( j, 1 );
                        bRemoved = true;
                    }
                } 

				//console.info( "++ 1 ++		glgeView.glgeColladaObjects.length = " + glgeView.glgeColladaObjects.length );

                if ( bRemoved && glgeView.glgeColladaObjects.length == 0 ){
                    bindSceneChildren( glgeView, viewID );
					vwf.setProperty( viewID, "loadComplete", true );
                }
            }
  
            for ( var i = 0; i < children.length; i++ ) {
                if ( children[i].constructor == GLGE.Collada ) {
                    this.glgeColladaObjects.push( children[i] );
                    children[i].loadedCallback = colladaLoaded;
                }
                this.findCollada( children[i] ); 
            }
        }
        
    }

    module.prototype.findAllColladaObjs = function( glgeScene, nodeID ) {

        this.findCollada( glgeScene, nodeID );

    }


    // TODO: deletedNode

    // -- addedChild -------------------------------------------------------------------------------

    module.prototype.addedChild = function (nodeID, childID, childName) {

        vwf.logger.info(namespace + ".addedChild " + nodeID + " " + childID + " " + childName);
//        console.info(namespace + ".addedChild " + nodeID + " " + childID + " " + childName);

		var view = this;
        var child = this.nodes[ childID ];
		var parent = this.nodes[ nodeID ];
		var createIfNotFound = false;
		var success = false;

		if ( !childName ) 
			childName = childID.substring( childID.lastIndexOf( '-' ) + 1 );

		if ( !this.loadingObjects[ childID ] )
			this.loadingObjects[ childID ] = [];
		this.loadingObjects[ childID ].push( { "parentID": nodeID, "name": childName } );

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
						//console.info( "	adding child: " + childID + " to " + nodeID );
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
				if ( ( !parent || ( parent && !parent.glgeObject ) && this.scenes[ nodeID ] ) ) {
					glgeParent = this.scenes[ nodeID ].glgeScene;
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
							//console.info( "	adding child: " + childID + " to " + nodeID );
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

				function colladaLoaded( collada ) { 
					var bRemoved = false;
					console.info( "++ 2 ++		colladaLoaded( "+ collada.docURL +" )" );
					for ( var j = 0; j < view.glgeColladaObjects.length; j++ ) {
						if ( view.glgeColladaObjects[j] == collada ){
							view.glgeColladaObjects.splice( j, 1 );
							bRemoved = true;
						}
					} 
					if ( bRemoved ) {
						bindColladaChildren( view, childID );
						//console.info( "++ 2 ++		view.glgeColladaObjects.length = " + view.glgeColladaObjects.length );
						if ( view.glgeColladaObjects.length == 0 ) {
							vwf.setProperty( "index-vwf", "loadComplete", true );
						}
					}
				}

				child.name = childName;
				child.glgeObject = new GLGE.Collada;
				this.glgeColladaObjects.push( child.glgeObject );

				child.glgeObject.setDocument( child.source, window.location.href, colladaLoaded);
				child.glgeObject.loadedCallback = colladaLoaded;
				if ( parent && parent.glgeObject ) {
					parent.glgeObject.addCollada(child.glgeObject);
					//console.info( "	adding collada child: " + childID + " to " + nodeID );
				} else {
					var sceneNode = this.scenes[nodeID];
					if ( sceneNode ) {
						if ( !sceneNode.glgeScene ) {
							this.initScene( sceneNode );
						}

						sceneNode.glgeScene.addCollada(child.glgeObject);
						//console.info( "	adding collada child: " + childID + " to the scene" );
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

			success = bindChild(this, this.scenes[nodeID], this.nodes[nodeID], child, childName, childID);
            if ( success ) {
                bindNodeChildren(this, childID);
            } else if ( createIfNotFound ) {
				switch ( child.type ) {
					case "http-vwf-example-com-types-light":
						createLight( this, nodeID, childID, childName );
						break;					
					case "http-vwf-example-com-types-camera":
						createCamera( this, nodeID, childID, childName );
						break;
					case "http-vwf-example-com-types-particlesystem":
						createParticleSystem( this, nodeID, childID, childName );
						break;
				}
				success = bindChild(this, this.scenes[nodeID], this.nodes[nodeID], child, childName, childID); 				
			}

		}

		if ( success && child.type == "http-vwf-example-com-types-camera") {
			if ( childName.toLowerCase() == "maincamera" ) {
				setActiveCamera( this, child.glgeObject, this.scenes["index-vwf"], childID );
			}
		}

		return success;
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

                case "roll":
                    value = glgeObject.setRotX( Number( propertyValue ) * ( 3.14159/180.0 ) );
                    break;

                case "pitch":
                    value = glgeObject.setRotY( Number( propertyValue ) * ( 3.14159/180.0 ) );
                    break;

                case "yaw":
                    value = glgeObject.setRotZ( Number( propertyValue ) * ( 3.14159/180.0 ) );
                    break;

                case "rotX":
                    value = glgeObject.setRotX( Number( propertyValue ) );
                    break;

                case "rotY":
                    value = glgeObject.setRotY( Number( propertyValue ) );
                    break;

                case "rotZ":
                    value = glgeObject.setRotZ( Number( propertyValue ) );
                    break;

                case "eulers":
                case "position":
				case "rotation":
                case "worldEulers":
                case "worldPosition":
                case "scale":
				case "tranform":
				case "posRot":
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
                            case "rotation":
                                value = glgeObject.setRot( Number( values[0] ), Number( values[1] ), Number( values[2] ) );
                                break;
                            case "position":
                                value = glgeObject.setLoc( Number( values[0] ), Number( values[1] ), Number( values[2] ) );
                                break;
                            case "posRot":
								value = [];
                                value.push( glgeObject.setLoc( Number( values[0] ), Number( values[1] ), Number( values[2] ) ) );
                                value.push( glgeObject.setRot( Number( values[3] ), Number( values[4] ), Number( values[5] ) ) );
                                break;
                            case "posRotMatrix":
								value = [];
                                value.push( glgeObject.setLoc( Number( values[0] ), Number( values[1] ), Number( values[2] ) ) );
                                value.push( glgeObject.setRotMatrix( values[3] ) );
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
							case "transform":
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

                default:
					switch ( node[ "type" ] ) {
						case "http-vwf-example-com-types-light":
							value = this.satLightProperty( nodeID, propertyName, propertyValue );
							break;
						case "http-vwf-example-com-types-camera":
							value = this.satCameraProperty( nodeID, propertyName, propertyValue );
							break;
						case "http-vwf-example-com-types-particlesystem":
							value = this.satParticleSystemProperty( nodeID, propertyName, propertyValue );
							break;						
						case "http-vwf-example-com-types-glge":
							value = this.satSceneProperty( nodeID, propertyName, propertyValue );
							break;
					}
					break;
            }
        } else if ( this.scenes[nodeID] ) {
			//switch ( node[ "type" ] ) {
			//	case "http-vwf-example-com-types-glge":
					value = this.satSceneProperty( nodeID, propertyName, propertyValue );
			//		break;
			//}
		} else {
			var propArray;
			if ( !this.delayedProperties[nodeID] ) {
				this.delayedProperties[nodeID] = [];
			}
			propArray = this.delayedProperties[nodeID];

			propArray.push( { "property": propertyName, "value": propertyValue } );

		}

        return value;
    };

	module.prototype.satSceneProperty = function( nodeID, propertyName, propertyValue ) {

		var sceneNode = this.scenes[ nodeID ];
		if ( sceneNode && sceneNode.glgeScene ) {
			var value = propertyValue;
			switch ( propertyName ) {
  				case "ambientColor":
					var arrayPropValue = propertyValue;
					if ( propertyValue.constructor != Array )
						arrayPropValue = JSON.parse( propertyValue );
					sceneNode.glgeScene.setAmbientColor( arrayPropValue );
					break;
				case "activeCamera":
					if ( sceneNode.camera.glgeCameras[propertyValue] ) {
						var cam = sceneNode.camera.glgeCameras[propertyValue];
						if ( cam ) {
							setActiveCamera( this, cam, sceneNode, nodeID );
						}
					}
					break;
			}
		}
		return value;

	};

	module.prototype.satParticleSystemProperty = function( nodeID, propertyName, propertyValue ) {

		//console.info(namespace + ".satParticleSystemProperty( " + nodeID + ", " + propertyName + ", " + propertyValue + " )");

		var node = this.nodes[nodeID]; // { name: childName, glgeObject: undefined }
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

	};


	module.prototype.satCameraProperty = function( nodeID, propertyName, propertyValue ) {

		var node = this.nodes[nodeID]; // { name: childName, glgeObject: undefined }
        var value = propertyValue;
		switch ( propertyName ) {
//  			case "active":
//				var sceneNode = this.scenes["index-vwf"];
//				var node = this.nodes[nodeID];
//				if ( propertyValue ) {
//					setActiveCamera( this, node.glgeObject, sceneNode, nodeID );
//				} else {
//					setActiveCamera( this, sceneNode.camera.defaultCam, sceneNode, undefined );
//				}
//				break;
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
				node.glgeObject.setsetFovY( Number( propertyValue ) );
				break;			
			case "aspect":
				node.glgeObject.setAspect( Number( propertyValue ) );
				break;			
			case "orthoscale":
				node.glgeObject.setOrthoScale( Number( propertyValue ) );
				break;
		}
		return value;

	};

	module.prototype.satLightProperty = function( nodeID, propertyName, propertyValue ) {
		var node = this.nodes[nodeID]; // { name: childName, glgeObject: undefined }
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

                case "roll":
                    value = glgeObject.getRotX() * ( 180.0/3.14159 );
                    break;

                case "pitch":
                    value = glgeObject.getRotY() * ( 180.0/3.14159 );
                    break;

                case "yaw":
                    value = glgeObject.getRotZ() * ( 180.0/3.14159 );
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
                    value.push( glgeObject.getRotX() * ( 180.0/3.14159 ), glgeObject.getRotY()* ( 180.0/3.14159 ), glgeObject.getRotZ()* ( 180.0/3.14159 ) );
                    break;
                case "rotation":
                    value = new Array;
                    value.push( glgeObject.getRotX(), glgeObject.getRotY(), glgeObject.getRotZ() );
                    break;
                case "position":
                    value = new Array;
                    value.push( glgeObject.getLocX(), glgeObject.getLocY(), glgeObject.getLocZ() );
                    break;
                case "posRot":
                    value = new Array;
                    value.push( glgeObject.getLocX() );
					value.push( glgeObject.getLocY() );
					value.push( glgeObject.getLocZ() );
                    value.push( glgeObject.getRotX() );
					value.push( glgeObject.getRotY() );
					value.push( glgeObject.getRotZ() );
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
                    value = glgeObject.getModelMatrix();   
                    break;

				case "transform":
					break;
				
				case "boundingbox":
					var bbox = getLocalBoundingBox( glgeObject );
					value = [ bbox.xMin, bbox.xMax, bbox.yMin, bbox.yMax, bbox.zMin, bbox.zMax ];
					break;

				case "centerOffset":
					value = getCenterOffset( glgeObject );
					break;

				case "vertices":
					value = getMeshVertices( glgeObject );
					break;

				case "vertexIndices":
					value = getMeshVertexIndices( glgeObject );
					break;

				default:
					switch ( node.type ) {
						case "http-vwf-example-com-types-light":
							value = this.gotLightProperty( nodeID, propertyName, propertyValue );
							break;
						case "http-vwf-example-com-types-camera":
							value = this.gotCameraProperty( nodeID, propertyName, propertyValue );
							break;
						case "http-vwf-example-com-types-particlesystem":
							value = this.gotParticleSystemProperty( nodeID, propertyName, propertyValue );
							break;						
						case "http-vwf-example-com-types-scene":
							value = this.gotSceneProperty( nodeID, propertyName, propertyValue );
							break;
					}
					break;	

            }
        }

        return value;
    };

	module.prototype.gotSceneProperty = function( nodeID, propertyName, propertyValue ) {

		var sceneNode = this.scenes[nodeID] // { name: childName, glgeObject: undefined }
        var value = propertyValue;
		switch ( propertyName ) {
  			case "ambientColor":
				var color = sceneNode.glgeScene.getAmbientColor();
				value = [ color['r'], color['g'], color['b'] ];
				break;
			case "activeCamera":
				value = name( sceneNode.glgeScene.camera );
				break;

		}
		return value;

	};

	module.prototype.gotParticleSystemProperty = function( nodeID, propertyName, propertyValue ) {
		var node = this.nodes[nodeID] 
        var value = propertyValue;
		switch ( propertyName ) {
			default:
				vwf.logger.info( "WARNING: unable to get property " + namespace + " " + nodeID + " " + propertyName );
				break;
		}
		return value;
	};

    // -- gotLightProperty ------------------------------------------------------------------------------

    module.prototype.gotLightProperty = function ( nodeID, propertyName, propertyValue ) {
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
	
	};

    // -- gotCameraProperty ------------------------------------------------------------------------------

    module.prototype.gotCameraProperty = function (nodeID, propertyName, propertyValue) {

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
				value = node.glgeObject.getsetFovY();
				break;			
			case "aspect":
				value = node.glgeObject.getAspect();
				break;			
			case "orthoscale":
				value = node.glgeObject.getOrthoScale();
				break;
		}
		return value;

	};



    // == Private functions ========================================================================

	var findGlgeObject = function( objName, type ) {
		var obj = undefined;
		var assetObj = undefined;
		var glgeObjName = "";

		//console.info( "=======   Trying to find: " + objName + " of type: " + type );
		for ( key in GLGE.Assets.assets ) {
			assetObj = GLGE.Assets.assets[key];
			if ( assetObj ) {
				glgeObjName = name( assetObj );
				//console.info( "			Checking: " + glgeObjName + " of type " + assetObj.constructor.name );
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

	var isChildOfLoadingObject = function( childID ) {
		var childOfLoading = false;


		return childOfLoading;
	}

    var bindSceneChildren = function (view, nodeID) {

        vwf.logger.info("      bindSceneChildren: " + nodeID );
        var sceneNode = view.scenes[nodeID];
		if ( sceneNode ) {
			var child;

			if ( sceneNode.glgeScene ) {
				jQuery.each(vwf.children(nodeID), function (childIndex, childID) {
					if (child = view.nodes[childID]) { // assignment is intentional
						if (bindChild(view, sceneNode, undefined, child, vwf.name(childID), childID)) {
							bindNodeChildren(view, childID);
						}
					}
				});
			}
		} else {
			vwf.logger.warn("bindSceneChildren ===>>> Invalid sceneNode reference: " + nodeID );
		}

    };

	var setActiveCamera = function( view, glgeCamera, sceneNode, nodeID ) {
		if ( sceneNode && sceneNode.glgeScene && glgeCamera ) {
			sceneNode.glgeScene.setCamera( glgeCamera );
			if ( nodeID && view.nodes[nodeID] )
				sceneNode.camera.camNode = view.nodes[ nodeID ];
			else
				sceneNode.camera.camNode = sceneNode.camera.defaultCamNode;
		}
	}

	var cameraInUse;
	var activeCamera = function( view, sceneNode ) {
		var cam = undefined;
		if ( sceneNode && sceneNode.camera ) {
			if ( sceneNode.camera.camNode )
				cam = sceneNode.camera.camNode;
			else 
				cam = sceneNode.camera.defaultCamNode;
		}
		cameraInUse = cam;
		return cam;
	}


	var createDefaultCamera = function( sceneNode ) {
		vwf.createNode( { "extends": "http://vwf.example.com/types/camera" }, undefined, sceneNode.camera.defaultName );	
	}

	var createLight = function( view, nodeID, childID, childName ) {
		var child = view.nodes[childID];
		if ( child ) {
			child.glgeObject = new GLGE.Light();
			child.glgeObject.name = childName;
			child.name = childName;
			child.uid = child.glgeObject.uid;
			addGlgeChild( view, nodeID, childID );
		}		
	}

	var createCamera = function( view, nodeID, childID, childName ) {
		var sceneNode = view.scenes[nodeID];
		if ( sceneNode ) {
			var child = view.nodes[childID];
			if ( child ) {
				var cam;
				
				if ( !sceneNode.camera.glgeCameras[childName] ) {
					cam = new GLGE.Camera();
					initCamera( cam );
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

	var createParticleSystem = function( view, nodeID, childID, childName ) {
	
	}

	var initCamera = function( glgeCamera ) {
		if ( glgeCamera ) {
			glgeCamera.setLoc( 0, 0, 0 );
			glgeCamera.setRot( 0, 0, 0 );
			glgeCamera.setType( GLGE.C_PERSPECTIVE );
			glgeCamera.setRotOrder( GLGE.ROT_XZY );
		}		
	}

	var getLocalBoundingBox = function( glgeObject ) {
		var bBox = { xMin: Number.MAX_VALUE, xMax: Number.MIN_VALUE,
					 yMin: Number.MAX_VALUE, yMax: Number.MIN_VALUE,
					 zMin: Number.MAX_VALUE, zMax: Number.MIN_VALUE };

		var glgeObjectList = [];
		findAllGlgeObjects( glgeObject, glgeObjectList );

		for ( var j = 0; j < glgeObjectList.length; j++ ) {
			var vertices = getMeshVertices( glgeObjectList[j] );
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

	var getCenterOffset = function( glgeObject ) {
		var offset = [ 0, 0, 0 ];
		if ( glgeObject ) {
			var bBox = getLocalBoundingBox( glgeObject )
			offset[0] = ( bBox.xMax - bBox.xMin ) * 0.50;
			offset[1] = ( bBox.yMax - bBox.yMin ) * 0.50;
			offset[2] = ( bBox.zMax - bBox.zMin ) * 0.50;
		}
		return offset;
	}

	var getNodeVertices = function( view, nodeID ) {
		if ( view && view.nodes[nodeID] ) {
			return getMeshVertices( view.nodes[nodeID] );
		}
		return undefined;
	}

	var getMeshVertices = function( glgeObject ) {
		var vertices = [];
		var glgeMesh;
		if ( glgeObject ) {
			if ( glgeObject.getChildren && !glgeObject.getMesh ) {
				var objects = []; 
				findAllGlgeObjects( glgeObject, objects );
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

	var getNodeVertexIndices = function( view, nodeID ) {
		if ( view && view.nodes[nodeID] ) {
			return getMeshVertexIndices( view.nodes[nodeID] );
		}
		return undefined;
	}

	var getMeshVertexIndices = function( glgeObject ) {
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

    var bindColladaChildren = function (view, nodeID) {

        vwf.logger.info("      bindColladaChildren: " + nodeID );
        var colladaTopNode = view.nodes[nodeID];
        var child;

        jQuery.each(vwf.children(nodeID), function (childIndex, childID) {
            if ( child = view.nodes[childID] ) { // assignment is intentional
                if (bindChild(view, undefined, colladaTopNode, child, vwf.name(childID), childID)) {
					bindNodeChildren( view, childID );
                }
            }
        });

		if ( view.childIDMap[ nodeID ] ) {
			var parentID = view.childIDMap[ nodeID ];
			addGlgeChild( view, parentID, nodeID );
			view.childIDMap[nodeID] = undefined;
			if ( view.parentIDMap[parentID] ) {
				var index = -1;
				var parentArray = view.parentIDMap[parentID]
				for ( var i = 0; i < parentArray.length && index == -1; i++ ) {
					if ( parentArray[i] == nodeID )
						index = i;
				}

				if ( index != -1)
					parentArray.splice( index, 1 );
			}
		}

		if ( view.delayedProperties[nodeID] ) {
			var props = view.delayedProperties[nodeID];
			for ( var i = 0; i < props.length; i++ ) {
				view.satProperty( nodeID, props[i].property, props[i].value );
			}
			delete view.delayedProperties[nodeID];
		}

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

	var meshIndex = 1;
    var bindChild = function (view, sceneNode, node, child, childName, childID) {

        vwf.logger.info("      bindChild: " + sceneNode + " " + node + " " + child + " " + childName);
		
		if (sceneNode && sceneNode.glgeScene && !child.glgeObject) {
			child.name = childName;
			child.glgeObject = sceneNode.glgeScene && glgeSceneChild(sceneNode.glgeScene, childName);
			if (child.glgeObject) {
				child.uid = child.glgeObject.uid;
				glgeObjectInitializeFromProperties(view, childID, child.glgeObject);
				child.initialized = true;
			} else {
				var obj = findGlgeObject( childName, child.type );
				if ( obj ) {
					child.glgeObject = obj;
					child.uid = obj.uid;
					child.initialized = true;
					glgeObjectInitializeFromProperties(view, childID, child.glgeObject);
				}
			}
		} else if (node && !child.glgeObject) {
			child.name = childName;
			if ( view.nodes[ childID ] && view.nodes[ childID ].glgeMaterial ) {
				bindMaterial( view, childID, childName, node );
				child.initialized = true;
			} else {
				child.glgeObject = node.glgeObject && glgeObjectChild(node.glgeObject, childName);
				if (child.glgeObject) {
					child.uid = child.glgeObject.uid;
					glgeObjectInitializeFromProperties(view, childID, child.glgeObject);
					child.initialized = true;
				} else {
					var glgeObj = findGlgeObject( childName, child.type );
					if ( glgeObj ) {
						child.glgeObject = glgeObj;
						child.uid = glgeObj.uid;
						child.initialized = true;
						glgeObjectInitializeFromProperties(view, childID, child.glgeObject);
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
            vwf.logger.info( "     unable to bind: " + childID );
        } else {
			delete view.loadingObjects[ childID ];
			if ( child.glgeObject.getChildren ) {
				var children = child.glgeObject.getChildren();
				var childObj;
				var objName;
				var node;
				var type;
				var extendType;
				for ( var i = 0; i < children.length; i++ ) {
					childObj = children[i];
					objName = name( childObj );
					
					if ( childObj.constructor == GLGE.Group || childObj.constructor == GLGE.Object ) {
						extendType = "http://vwf.example.com/types/node3";
						type = "http-vwf-example-com-types-node3";
						node = type +"-"+ objName;
					}

					if ( node && type ) {
						if ( !view.nodes[ node ] ) {
							//console.info( "[[  Creating " + type + " named: " + objName );
							vwf.createNode( { "extends": extendType }, function() {
								vwf.addChild( childID, node, objName );
							}, objName );
							//console.info( "]]  Creating " + type + " named: " + objName );
						}
					}

					var mesh;
					var meshType;
					var meshName;
					var meshNodeID;
					var meshID;
					if ( childObj.constructor == GLGE.Object && childObj.getMesh && childObj.getMesh() ) {
						mesh = childObj.getMesh();
						meshName = name( mesh );
						if ( meshName == "" ) {
							meshName = objName + "Mesh" + meshIndex++;
							mesh.name = meshName;
						}
						meshType = "http://vwf.example.com/types/mesh";
						meshID = "http-vwf-example-com-types-mesh";
						meshNodeID = meshID +"-"+ meshName;	

						//vwf.logger.enable = true;
						if ( meshNodeID && meshType ) {
							if ( !view.nodes[ meshNodeID ] ) {
								//console.info( "		++  Creating Mesh  " + meshNodeID + " Named: " + meshName );
								vwf.createNode( { "extends": meshType }, function() {
									//vwf.logger.enable = true;
									vwf.addChild( node, meshNodeID, meshName );
									//vwf.logger.enable = false;
								}, meshName );
								//console.info( "		++  Creating Mesh " + meshNodeID + " Named: " + meshName );
							}
						}	
						//vwf.logger.enable = false;					
												
					}
				}  
			}

            if ( child.glgeObject.animate && child.glgeObject.animation ) {
               vwf.logger.info( "$$$$$     child id " + childID + " with name " + childName ); 
            }
			vwf.logger.info( "+++++     SUCCESSFULL bind: " + childID );
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

//                if ( childNode.glgeMaterial === childNode.glgeObject.material ) {
//                    console.info( " materials are the same object!!!!! " );
//                }
            }
        }

    };

	var addGlgeChild = function( view, parentID, childID ) {
		
		var glgeParent
		var parent = view.nodes[ parentID ];
		if ( !parent && view.scenes[ parentID ] ) {
			parent = view.scenes[ parentID ];
			glgeParent = parent.glgeScene;
		} else {
			glgeParent = parent.glgeObject;
		}
			
		if ( glgeParent && view.nodes[ childID ]) {
			var child = view.nodes[ childID ];

			if ( child.glgeObject ) {
				glgeParent.addChild( child.glgeObject );
				//console.info( "	adding child: " + childID + " to " + parentID );
			}
		}
	}

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

	var lastCubeCreated;
    //var keysDown = {};

    var checkKeys = function (nodeID, view, now, lasttime) {
        
        var sceneNode = view.scenes[nodeID], child;
        if (sceneNode && sceneNode.glgeScene) {
            var camera = sceneNode.glgeScene.camera;
			if ( camera ) {
				var cameraComponent = sceneNode.camera.camNode;

				if ( cameraComponent && false ) {
  
				  var mat = camera.getRotMatrix();
				  var trans = GLGE.mulMat4Vec4(mat, [0, 0, -1, 1]);
				  var mag = Math.pow( Math.pow( trans[0], 2 ) + Math.pow( trans[1], 2 ), 0.5 );
 
				  // should only be sending the keysDown, now, lastime, but I'm going to
				  // inlcude the additional data for now to cut some corners
				  var strParams = JSON.stringify( [ view.keysDown, now, lasttime, mat, trans, mag ] );
				  //view.callMethod( this.cameraID, "handleKeyEvents", strParams );
				  vwf.execute( view.cameraID, "this.handleKeyEvents("+strParams+")", "application/javascript" );
				} else {
					camerapos = camera.getPosition();
					camerarot = camera.getRotation();
					var mat = camera.getRotMatrix();
					var trans = GLGE.mulMat4Vec4(mat, [0, 0, -1, 1]);
					var mag = Math.pow( Math.pow( trans[0], 2 ) + Math.pow( trans[1], 2 ), 0.5 );

					var yinc = 0;
					var xinc = 0;
					var zinc = 0;
					var yRot = 0;
					if ( mag == 0 ) mag = 1; 
					trans[0] = trans[0] / mag;
					trans[1] = trans[1] / mag;

					if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_W) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_UP_ARROW)) {
						yinc = yinc + parseFloat(trans[1]); xinc = xinc + parseFloat(trans[0]);
					}
					if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_S) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_DOWN_ARROW)) {
						yinc = yinc - parseFloat(trans[1]); xinc = xinc - parseFloat(trans[0]);
					}
					if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_LEFT_ARROW) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_Q)) {
						yinc = yinc + parseFloat(trans[0]); xinc = xinc - parseFloat(trans[1]); 
					}
					if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_RIGHT_ARROW) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_E)) {
						yinc = yinc - parseFloat(trans[0]); xinc = xinc + parseFloat(trans[1]); 
					}
					if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_R)) { zinc = zinc + 1.0 }
					if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_C)) { zinc = zinc - 1.0 }
					if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_A)) { yRot = 0.04; }
					if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_D)) { yRot = -0.04; }
					if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_Z)) {
						console.info("	camerapos = " + camerapos.x + ", " + camerapos.y + ", " + camerapos.z);
						console.info("	camerarot = " + camerarot.x + ", " + camerarot.y + ", " + camerarot.z);
					}

					var speed = 2.0;
					if ( cameraComponent && (yRot != 0 ) || (xinc != 0 || yinc != 0 || zinc != 0) ) {

						var pr = [ camerapos.x + xinc * speed, camerapos.y + yinc * speed, camerapos.z + zinc, camerarot.x, (camerarot.y + yRot),  camerarot.z ];
						view.setProperty( sceneNode.camera.camNode.ID, "posRot", pr );
												
					} else {
						if (xinc != 0 || yinc != 0 || zinc != 0) {
	//						var pos = [ camerapos.x + xinc * 0.05 * (now - lasttime), camerapos.y + yinc * 0.05 * (now - lasttime),  camerapos.z + zinc ];
							if ( cameraComponent ) {
								var pos = [ camerapos.x + xinc * speed, camerapos.y + yinc * speed,  camerapos.z + zinc ];
								view.setProperty( sceneNode.camera.camNode.ID, "position", pos );
							} else {
								var pos = [ camerapos.x + xinc * speed, camerapos.y + yinc * speed,  camerapos.z + zinc ];
								camera.setLocY(pos[1]);
								camera.setLocX(pos[0]);
								camera.setLocZ(pos[2]);
							}
						}
						if (yRot != 0 ) {
							//var rot = [ camerarot.x, (camerarot.y + yRot),  camerarot.z];
							if ( cameraComponent ) {
								view.setProperty( sceneNode.camera.camNode.ID, "rotY", (camerarot.y + yRot) );
							} else {
								camera.setRotY( camerarot.y + yRot );
							}

	//						var rot = [ camerarot.x * ( 180.0/3.14159 ), (camerarot.y + yRot) * ( 180.0/3.14159 ),  camerarot.z * ( 180.0/3.14159 ) ];
	//						if ( cameraComponent ) {
	//							view.setProperty( view.cameraID, "eulers", JSON.stringify(rot) );
	//						} else {
	//							camera.setRotY( camerarot.y + yRot );
	//						}
						}
					}

					if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_SPACE)) {
						var useCube = true;

						if ( !lastCubeCreated )
							lastCubeCreated = now - 1001;

						if ( now - lastCubeCreated > 1000 ) {
//							if ( useCube ) {
//								var physics=new GLGE.PhysicsBox;
//								var collada=new GLGE.Collada;
//								collada.setDocument("yellowCube.dae");
//								collada.setScale(1);
//								physics.setHeight( 15 );
//								physics.setWidth( 15 );
//								physics.setDepth( 15 );
//								physics.setMass( 8 );
//								physics.setRotationalVelocityDamping([0.8, 0.8, 0.8]);//								physics.setLinearVelocityDamping([0.99,0.99,0.99,0]);//								physics.setFriction(0.5);//								physics.setRestitution(0.1);
//								physics.addChild(collada);
//								sceneNode.glgeScene.addChild(physics);//								physics.setLoc( camerapos.x, camerapos.y, camerapos.z + 100 );//								var mat=camera.getRotMatrix();//								var trans=GLGE.mulMat4Vec4(mat,[0,0,-1,1]);
//								physics.setVelocity([trans[0]*60,trans[1]*60,trans[2]*60]);						
//							} else {
//								var physics=new GLGE.PhysicsSphere;
//								var collada=new GLGE.Collada;
//								collada.setDocument("yellowSphere.dae");
//								collada.setScale(1);
//								physics.setRadius( 3.4 );
//								physics.setMass( 8 );
//								physics.setRotationalVelocityDamping([0.5, 0.5, 0.5]);//								physics.setLinearVelocityDamping([0.99,0.99,0.99,0]);//								physics.setFriction(0.5);//								physics.setRestitution(0.1);
//								physics.addChild(collada);
//								sceneNode.glgeScene.addChild(physics);//								physics.setLoc( camerapos.x, camerapos.y, camerapos.z );//								var mat=camera.getRotMatrix();//								var trans=GLGE.mulMat4Vec4(mat,[0,0,-1,1]);
//								physics.setVelocity([trans[0]*60,trans[1]*60,trans[2]*60]);
//							}
						}
						lastCubeCreated = now;
					}

				}
			}
        }

    }


	var mouselook = function( now, lasttime ) {
		var mousepos = mouse.getMousePosition();
		mousepos.x = mousepos.x - sceneCanvas.offsetLeft + window.scrollX;
		mousepos.y = mousepos.y - sceneCanvas.offsetTop + window.scrollY;
		var camera = cameraInUse;
		camerarot = camera.getRotation();
		inc = (mousepos.y - (sceneCanvas.offsetHeight / 2)) / 500;

		var trans = GLGE.mulMat4Vec4(camera.getRotMatrix(), [0, 0, -1, 1]);
		var mag = Math.pow(Math.pow(trans[0], 2) + Math.pow(trans[1], 2), 0.5);
		trans[0] = trans[0] / mag;
		trans[1] = trans[1] / mag;
		camera.setRotX(1.56 - trans[1] * inc);
		camera.setRotZ(-trans[0] * inc);
		var width = sceneCanvas.offsetWidth;
		if (mousepos.x < width * 0.3) {
			var turn = Math.pow((mousepos.x - width * 0.3) / (width * 0.3), 2) * 0.005 * (now - lasttime);
			camera.setRotY(camerarot.y + turn);
		}
		if (mousepos.x > width * 0.7) {
			var turn = Math.pow((mousepos.x - width * 0.7) / (width * 0.3), 2) * 0.005 * (now - lasttime);
			camera.setRotY(camerarot.y - turn);
		}
	}

	var mouse; 
    var sceneCanvas;
	var container;
	var mouseDown = false;
	var mouseDownTime = undefined;
    var mouseOverCanvas = false;

    var initMouseEvents = function (canvas, nodeID, view) {

        var sceneNode = view.scenes[nodeID], child;
        var sceneID = nodeID;
        var sceneView = view;

        var mouseDownObjectID = undefined;
        var mouseOverObjectID = undefined;

        var lastXPos = -1;
        var lastYPos = -1;

		container = document.getElementById("container");
		sceneCanvas = canvas;
		mouse = new GLGE.MouseInput( sceneCanvas );

        canvas.onmousedown = function (e) {
            mouseDown = true;
            mouseDownObjectID = getPickObjectID( mousePick(e, sceneNode ), sceneView, true );

            //vwf.logger.info("CANVAS mouseDown: " + mouseDownObjectID);
            //this.throwEvent( "onMouseDown", mouseDownObjectID);
            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );
			mouseDownTime = parseInt( new Date().getTime() );
        }

        canvas.onmouseup = function (e) {
			var pickInfo = mousePick( e, sceneNode );
            var mouseUpObjectID = getPickObjectID( pickInfo, sceneView, false );
            // check for time??
            if ( mouseUpObjectID && mouseDownObjectID && mouseUpObjectID == mouseDownObjectID ) {
                vwf.logger.info("pointerClick: id:" + mouseDownObjectID + "   name: " + name( view.nodes[mouseDownObjectID].glgeObject ) );
                //this.throwEvent( "onMouseClick", mouseDownObjectID);
                view.callMethod( mouseUpObjectID, "pointerClick" );

				if( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_CTRL) ) {
					if ( sceneView.nodes[mouseUpObjectID] ) {
						var colladaObj = undefined;
						var currentObj;
						var glgeObj = sceneView.nodes[mouseUpObjectID].glgeObject;
						if ( glgeObj ) {
							currentObj = glgeObj;
							while ( !colladaObj && currentObj ) {
								if ( currentObj.constructor == GLGE.Collada )
									colladaObj = currentObj;
								else
									currentObj = currentObj.parent;
							} 
						}
						if ( colladaObj ) {
							recurseGroup( colladaObj, 0 );
						}
					}				
				}
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
            var pickInfo = mousePick( e, sceneNode );
            var mouseOverID = getPickObjectID( pickInfo, sceneView, false );
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

    var mouseXPos = function(e) {
        return e.clientX - e.currentTarget.offsetLeft + window.scrollX;
    }

    var mouseYPos = function(e) {
        return e.clientY - e.currentTarget.offsetTop + window.scrollY;
    }

    var getPickObjectID = function( pickInfo, view, debug ) {

        if (pickInfo && pickInfo.object) {
			return getObjectID( pickInfo.object, view, debug );
        }
        return undefined;

    }

    var getObjectID = function( objectToLookFor, view, debug ) {

        var objectIDFound = -1;
            
        while (objectIDFound == -1 && objectToLookFor) {
            if ( debug ) {
				vwf.logger.info("====>>>  vwf.view-glge.mousePick: searching for: " + path(objectToLookFor) );
			}
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

        return undefined;
    }

    var mousePick = function( e, sceneNode ) {

        if (sceneNode && sceneNode.glgeScene) {
            var objectIDFound = -1;
            var x = mouseXPos( e );
            var y = mouseYPos( e );

            return sceneNode.glgeScene.pick(x, y);
        }
        return undefined;

    };

	var findAllGlgeObjects = function( glgeNode, objList ) {
		if ( glgeNode ) {
			if ( glgeNode.constructor == GLGE.Object )
				objList.push( glgeNode );

			if ( glgeNode.getChildren ) {
				var nodeChildren = glgeNode.getChildren();
				for (var i = 0; i < nodeChildren.length; i++) {
					findAllGlgeObjects( nodeChildren[i], objList );
				}
			}
		}
	}

    var recurseGroup = function(grp, iDepth) {
        var grpChildren = grp.getChildren();
        var sOut = indent(iDepth);
        var name = "";

        for (var i = 0; i < grpChildren.length; i++) {
            if (grpChildren[i].constructor == GLGE.Collada) {
                iDepth++;
                outputCollada(grpChildren[i], iDepth, true);
                recurseGroup(grpChildren[i], iDepth + 1);
                outputCollada(grpChildren[i], iDepth, false);
                iDepth--;
            } else if (grpChildren[i].constructor == GLGE.Group) {
                iDepth++;
                outputGroup(grpChildren[i], iDepth, true);
                recurseGroup(grpChildren[i], iDepth + 1);
                outputGroup(grpChildren[i], iDepth, false);
                iDepth--;
            } else if (grpChildren[i].constructor == GLGE.Object) {
                outputObject(grpChildren[i], iDepth);
            }
        }
    }


    var getChildCount = function(grp) {
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
    }

    var indentStr = function() {
        return "  ";
    }

    var indent = function(iIndent) {
        var sOut = "";
        for (var j = 0; j < iIndent; j++) { sOut = sOut + indentStr(); }
        return sOut;
    }

    var outputCollada = function(collada, iIndent, open) {
        var sOut = indent(iIndent);
        if (open) {
            console.info(sOut + "children:")
        }
    }

    var outputGroup = function(group, iIndent, open) {
        var sOut = indent(iIndent + 1);
        if (open) {
            lastGroupName = name(group);
            console.info(indent(iIndent) + lastGroupName + ":");
            console.info(indent(iIndent + 1) + "extends: http://vwf.example.com/types/node3");

            if (getChildCount(group) > 0)
                console.info(sOut + "children:");
        }
    }

    var outputObject = function(obj, iIndent) {
        if (obj.multimaterials && obj.multimaterials.length > 0) {
            console.info(indent(iIndent) + "children:");
            materialIndex = 1;
            for (var i = 0; i < obj.multimaterials.length; i++) {
                outputMaterial(obj.getMaterial(i), iIndent + 1);
            }
        }
    }

    var outputMaterial = function(obj, iIndent) {

        var sOut = indent(iIndent + 1);
        console.info(indent(iIndent) + lastGroupName + "Material" + materialIndex++ + ":");
        console.info(sOut + "extends: 'http://vwf.example.com/types/material'");

    }

})(window.vwf.modules, "vwf.view.glge");


        /*var keysDown = {};
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_A) ) keysDown[GLGE.KI_A] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_B) ) keysDown[GLGE.KI_B] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_C) ) keysDown[GLGE.KI_C] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_D) ) keysDown[GLGE.KI_D] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_E) ) keysDown[GLGE.KI_E] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_F) ) keysDown[GLGE.KI_F] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_G) ) keysDown[GLGE.KI_G] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_H) ) keysDown[GLGE.KI_H] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_I) ) keysDown[GLGE.KI_I] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_J) ) keysDown[GLGE.KI_J] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_K) ) keysDown[GLGE.KI_K] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_L) ) keysDown[GLGE.KI_L] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_M) ) keysDown[GLGE.KI_M] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_N) ) keysDown[GLGE.KI_N] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_O) ) keysDown[GLGE.KI_O] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_P) ) keysDown[GLGE.KI_P] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_Q) ) keysDown[GLGE.KI_Q] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_R) ) keysDown[GLGE.KI_R] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_S) ) keysDown[GLGE.KI_S] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_T) ) keysDown[GLGE.KI_T] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_U) ) keysDown[GLGE.KI_U] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_V) ) keysDown[GLGE.KI_V] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_W) ) keysDown[GLGE.KI_W] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_X) ) keysDown[GLGE.KI_X] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_Y) ) keysDown[GLGE.KI_Y] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_Z) ) keysDown[GLGE.KI_Z] = true;

        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_1) ) keysDown[GLGE.KI_1] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_2) ) keysDown[GLGE.KI_2] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_3) ) keysDown[GLGE.KI_3] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_4) ) keysDown[GLGE.KI_4] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_5) ) keysDown[GLGE.KI_5] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_6) ) keysDown[GLGE.KI_6] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_7) ) keysDown[GLGE.KI_7] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_8) ) keysDown[GLGE.KI_8] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_9) ) keysDown[GLGE.KI_9] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_0) ) keysDown[GLGE.KI_0] = true;

        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_LEFT_ARROW) ) keysDown[GLGE.KI_LEFT_ARROW] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_RIGHT_ARROW) ) keysDown[GLGE.KI_RIGHT_ARROW] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_UP_ARROW) ) keysDown[GLGE.KI_UP_ARROW] = true;
        if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_DOWN_ARROW) ) keysDown[GLGE.KI_DOWN_ARROW] = true;*/



        /*if (sceneNode && sceneNode.glgeScene) {
            var camera = sceneNode.glgeScene.camera;
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
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_W) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_UP_ARROW)) {
                        // orbit up
                         orbitPitch += orbitInc;
                         bKeyDown = true;
                    }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_S) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_DOWN_ARROW)) {
                        // orbit down
                        orbitPitch -= orbitInc;
                          bKeyDown = true;
                    }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_LEFT_ARROW) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_A)) {
                        // orbit left
                        orbitYaw += orbitInc;
                        bKeyDown = true;
                    }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_RIGHT_ARROW) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_D)) {
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

                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_W) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_UP_ARROW)) {
                        yinc = yinc + parseFloat(trans[1]); xinc = xinc + parseFloat(trans[0]);
                    }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_S) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_DOWN_ARROW)) {
                        yinc = yinc - parseFloat(trans[1]); xinc = xinc - parseFloat(trans[0]);
                    }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_LEFT_ARROW) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_Q)) {
                        yinc = yinc + parseFloat(trans[0]); xinc = xinc - parseFloat(trans[1]); 
                    }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_RIGHT_ARROW) || sceneNode.glgeKeys.isKeyPressed(GLGE.KI_E)) {
                        yinc = yinc - parseFloat(trans[0]); xinc = xinc + parseFloat(trans[1]); 
                    }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_R)) { zinc = zinc + 1.0 }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_C)) { zinc = zinc - 1.0 }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_A)) { camera.setRotY(camerarot.y + 0.04); }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_D)) { camera.setRotY(camerarot.y - 0.04); }
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_Z)) {
                        vwf.logger.info("camerapos = " + camerapos.x + ", " + camerapos.y + ", " + camerapos.z);
                        vwf.logger.info("camerarot = " + camerarot.x + ", " + camerarot.y + ", " + camerarot.z);
                    }
                    if (view.smokeID && sceneNode.glgeKeys.isKeyPressed(GLGE.KI_P)) {
                        if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_SHIFT)) {
                            view.setProperty( view.smokeID, "looping", false );
                        } else {
                            view.setProperty( view.smokeID, "looping", true );
                        }
                    }

                    var allowCameraPositions = false;
                    var cp = "";
                    if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_1)) cp = "1";
                    else if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_2)) cp = "2";
                    else if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_3)) cp = "3";
                    else if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_4)) cp = "4";
                    else if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_5)) cp = "5";
                    else if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_6)) cp = "6";
                    else if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_7)) cp = "7";
                    else if (sceneNode.glgeKeys.isKeyPressed(GLGE.KI_8)) cp = "8";

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