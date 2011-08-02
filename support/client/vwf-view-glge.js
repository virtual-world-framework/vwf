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

        if (nodeExtendsID == "http://vwf.example.com/types/glge") {

            // jQuery(this.rootSelector).append(
            //     "<h2>Scene</h2>"
            // );

            var canvasQuery = jQuery(this.rootSelector).append(
                "<canvas id='" + nodeID + "' class='vwf-scene' width='1200' height='600'/>"
            ).children(":last");

            var scene = this.scenes[nodeID] = {
                glgeDocument: new GLGE.Document(),
                glgeRenderer: undefined,
                glgeScene: undefined,
                glgeKeys: new GLGE.KeyInput()
            };

            var view = this;

            scene.glgeDocument.onLoad = function () {
                var canvas = canvasQuery.get(0);
                scene.glgeRenderer = new GLGE.Renderer(canvas);
                scene.glgeScene = scene.glgeDocument.getElement("mainscene");
                scene.glgeRenderer.setScene(scene.glgeScene);

                view.findAllColladaObjs( scene.glgeScene, view, nodeID );

                // set up all of the mouse event handlers
                initMouseEvents(canvas, nodeID, view);

                // Resolve the mapping from VWF nodes to their corresponding GLGE objects for the
                // objects just loaded.

                //bindSceneChildren(view, nodeID);

                // GLGE doesn't provide an onLoad() callback for any Collada documents referenced by
                // the GLGE document. They may still be loaded after we receive onLoad(). As a work-
                // around, click on an <h1/> element on the page to rebind.


                jQuery( "h1" ).click( function() {
                    bindSceneChildren( view, nodeID );
                } )

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
        
        else if (nodeExtendsID == "http://vwf.example.com/types/node3") {

            var node = this.nodes[nodeID] = {
                name: undefined,  // TODO: needed?
                glgeObject: undefined
            };

        }

        else if (nodeExtendsID == "http://vwf.example.com/types/camera") {

            var node = this.nodes[nodeID] = {
                name: undefined,
                glgeObject: undefined
            };

            this.camera = node;
            this.cameraID = nodeID;
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
            bindChild(this, this.scenes[nodeID], this.nodes[nodeID], child, childName, childID);
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
                    value = glgeObject.setRotX( Number( propertyValue ) );
                    break;

                case "rotY":
                    value = glgeObject.setRotY( Number( propertyValue ) );
                    break;

                case "rotZ":
                    value = glgeObject.setRotZ( Number( propertyValue ) );
                    break;
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
                    value = glgeObject.getRotX();
                    break;

                case "rotY":
                    value = glgeObject.getRotY();
                    break;

                case "rotZ":
                    value = glgeObject.getRotZ();
                    break;
            }

        }

        return value;
    };

    // == Private functions ========================================================================

    var bindSceneChildren = function (view, nodeID) {

        //vwf.logger.info("      bindSceneChildren: " + nodeID);
        var scene = view.scenes[nodeID];
        var child;

        jQuery.each(vwf.children(nodeID), function (childIndex, childID) {
            if (child = view.nodes[childID]) {
                if (bindChild(view, scene, undefined, child, vwf.name(childID), childID)) {
                    bindNodeChildren(view, childID);
                }
            }
        });

    };

    var bindNodeChildren = function (view, nodeID) {

        //vwf.logger.info("      bindNodeChildren: " + nodeID);
        var node = view.nodes[nodeID];
        var child;

        jQuery.each(vwf.children(nodeID), function (childIndex, childID) {
            if (child = view.nodes[childID]) {
                if (bindChild(view, undefined, node, child, vwf.name(childID), childID)) {
                    bindNodeChildren(view, childID);
                }
            }
        });

    };

    var bindChild = function (view, scene, node, child, childName, childID) {

        //vwf.logger.info("      bindChild: " + scene + " " + node + " " + child + " " + childName);
        if (scene && !child.glgeObject) {
            child.name = childName;
            child.glgeObject = scene.glgeScene && glgeSceneChild(scene.glgeScene, childName);
            if (child.glgeObject) {
                glgeObjectInitializeFromProperties(view, childID, child.glgeObject);
                child.initialized = true;
            }
        }

        else if (node && !child.glgeObject) {
            child.name = childName;
            child.glgeObject = node.glgeObject && glgeObjectChild(node.glgeObject, childName);
            if (child.glgeObject) {
                glgeObjectInitializeFromProperties(view, childID, child.glgeObject);
                child.initialized = true;
            }
        }


        if (child.glgeObject && child.glgeObject.constructor == GLGE.ParticleSystem && child.name == "smoke") {
            view.smoke = child;
            view.smokeID = childID;
        }

        var success = Boolean(child.glgeObject);

        if ( !success ) {
            vwf.logger.info( "     unable to bind: " + childName );
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
    var orbitInc = 6.0;
    var objectCenter = {};

    var centerGroup = undefined;

    var checkKeys = function (nodeID, view, now, lasttime) {
        var scene = view.scenes[nodeID], child;
        if (scene && scene.glgeScene) {
            var camera = scene.glgeScene.camera;
            if (camera) {
                var bOrbit = false;

                if ( !centerGroup ) {
                    centerGroup = new GLGE.Group();
                    objectCenter.x = 0;
                    objectCenter.y = 2;
                    objectCenter.z = 0;
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
                         orbitYaw += orbitInc;
                         bKeyDown = true;
                    }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_S) || scene.glgeKeys.isKeyPressed(GLGE.KI_DOWN_ARROW)) {
                        // orbit down
                        orbitYaw -= orbitInc;
                          bKeyDown = true;
                    }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_LEFT_ARROW) || scene.glgeKeys.isKeyPressed(GLGE.KI_A)) {
                        // orbit left
                        orbitPitch += orbitInc;
                        bKeyDown = true;
                    }
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_RIGHT_ARROW) || scene.glgeKeys.isKeyPressed(GLGE.KI_D)) {
                        // orbit right  
                       orbitPitch -= orbitInc;
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
                        y = objectCenter.y + radius * Math.sin( orbitYaw ) * Math.sin( orbitPitch );
                        z = objectCenter.z + radius * Math.cos( orbitYaw );

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

                    var cp = "";
                    if (scene.glgeKeys.isKeyPressed(GLGE.KI_1)) cp = "1";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_2)) cp = "2";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_3)) cp = "3";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_4)) cp = "4";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_5)) cp = "5";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_6)) cp = "6";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_7)) cp = "7";
                    else if (scene.glgeKeys.isKeyPressed(GLGE.KI_8)) cp = "8";

                    if ( cp != "" ) {
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
        }
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
            if (mouseUpObjectID && mouseDownObjectID && mouseUpObjectID == mouseDownObjectID) {
                vwf.logger.info("CANVAS onMouseClick: id:" + mouseDownObjectID + "   name: " + name(view.nodes[mouseDownObjectID].glgeObject) );
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

                view.callMethod( mouseInfo, "onMouseMove" );
            }
            else {
                if (mouseOverID) {
                    if (mouseOverObjectID) {
                        if (mouseOverID != mouseOverObjectID) {

                            //vwf.logger.info("CANVAS onMouseLeave: " + mouseOverObjectID);
                            //this.throwEvent( "onMouseLeave", mouseOverObjectID);

                            mouseOverObjectID = mouseOverID;

                            //vwf.logger.info("CANVAS onMouseEnter: " + mouseOverObjectID);
                            //this.throwEvent( "onMouseEnter", mouseOverObjectID);
                        }
                        else {
                            //vwf.logger.info("CANVAS onMouseHover: " + mouseOverObjectID);
                            //this.throwEvent( "onMouseHover", mouseOverObjectID);

                        }
                    }
                    else {
                        mouseOverObjectID = mouseOverID;

                        //vwf.logger.info("CANVAS onMouseEnter: " + mouseOverObjectID);
                        //this.throwEvent( "onMouseEnter", mouseOverObjectID);
                    }

                }
                else {
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

    var getObjectID = function( pickInfo, view, debug ) {
        if (pickInfo && pickInfo.object) {
            var objectIDFound = -1;
            var objectToLookFor = pickInfo.object;

            while (objectIDFound == -1 && objectToLookFor) {
                if ( debug ) 
                    vwf.logger.info("vwf.view-glge.mousePick: searching for: " + path(objectToLookFor) );
                objects = jQuery.each(view.nodes, function (nodeID, node) {
                    if (node.glgeObject == objectToLookFor) {
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
            //return pickInfo;

        }
        return undefined;
    };


})(window.vwf.modules, "vwf.view.glge");
