(function (modules) {

    console.info("loading vwf.view.glge");

    // vwf-view-glge.js is a placeholder for an GLGE WebGL view of the scene.
    //
    // vwf-view-glge is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern).
    // It attaches to the vwf modules list as vwf.modules.glge.

    var module = modules.glge = function (vwf, rootSelector) {

        if (!vwf) return;

        console.info("creating vwf.view.glge");

        modules.view.call(this, vwf);

        this.rootSelector = rootSelector;

        this.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
        this.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }

        return this;
    };

    // Delegate any unimplemented functions to vwf-view.

    module.prototype = new modules.view();

    // == Response API =============================================================================

    // This is a placeholder for maintaining a view of the changing state of the simulation using
    // nested HTML block elements.

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function (nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType) {

        console.info("vwf.view.glge.createdNode " + nodeID + " " +
            nodeExtendsID + " " + nodeImplementsIDs + " " + nodeSource + " " + nodeType);

        if (vwf.typeURIs[nodeExtendsID] == "http://localhost/glge.js") {

            jQuery(this.rootSelector).append(
                "<h2>Scene</h2>"
            );

            var canvasQuery = jQuery(this.rootSelector).append(
                "<canvas id='" + nodeID + "' class='vwf-scene' width='800' height='450'/>"
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

                // set up all of the mouse event handlers
                initMouseEvents(canvas, nodeID, view);

                // Resolve the mapping from VWF nodes to their corresponding GLGE objects for the
                // objects just loaded.

                bindSceneChildren(nodeID, view);

                // GLGE doesn't provide an onLoad() callback for any Collada documents referenced by
                // the GLGE document. They may still be loaded after we receive onLoad(). As a work-
                // around, wait 5 seconds after load and rebind.

                setTimeout(bindSceneChildren, 5000, nodeID, view);

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

            if (nodeSource && nodeType == "model/x-glge") {
                scene.glgeDocument.load(nodeSource);
            }
            else if (nodeSource && nodeType == "model/collada") {
                var newCollada = new GLGE.Collada;
                newCollada.setDocument(nodeSource, window.location.href);
                scene.document.getElement("mainscene").addCollada(newCollada);
            }

        } else if (vwf.typeURIs[nodeExtendsID] == "http://localhost/node3.js") {

            var node = this.nodes[nodeID] = {
                name: undefined,  // TODO: needed?
                glgeObject: undefined
            };

        }

    };

    // TODO: deletedNode

    // -- addedChild -------------------------------------------------------------------------------

    module.prototype.addedChild = function (nodeID, childID, childName) {

        console.info("vwf.view.glge.addedChild " + nodeID + " " + childID + " " + childName);

        var child = this.nodes[childID];

        if (child) {
            bindChild(this.scenes[nodeID], this.nodes[nodeID], child, childName);
        }

    };

    // -- removedChild -----------------------------------------------------------------------------

    module.prototype.removedChild = function (nodeID, childID) {

        console.info("vwf.view.glge.removedChild " + nodeID + " " + childID);

    };

    // -- createdProperty --------------------------------------------------------------------------

    module.prototype.createdProperty = function (nodeID, propertyName, propertyValue) {

        console.info("vwf.view.glge.createdProperty " + nodeID + " " + propertyName + " " + propertyValue);

    };

    // TODO: deletedProperty

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function (nodeID, propertyName, propertyValue) {

        console.info("vwf.view.glge.satProperty " + nodeID + " " + propertyName + " " + propertyValue);

        var node = this.nodes[nodeID]; // { name: childName, glgeObject: undefined }

        // Demo hack: pause/resume an object's animation when its "angle" property is odd/even.

        if (node && node.glgeObject && propertyName == "angle") {
            node.glgeObject.setPaused((propertyValue & 1) ? GLGE.TRUE : GLGE.FALSE);
        }

    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function (nodeID, propertyName, propertyValue) {

        console.info("vwf.view.glge.gotProperty " + nodeID + " " + propertyName + " " + propertyValue);

    };

    // == Private functions ========================================================================

    var bindSceneChildren = function (nodeID, view) {

        var scene = view.scenes[nodeID], child;

        jQuery.each(vwf.children(nodeID), function (childIndex, childID) {
            if (child = view.nodes[childID]) {
                if (bindChild(scene, undefined, child, vwf.name(childID))) {
                    bindNodeChildren(childID, view);
                }
            }
        });

    };

    var bindNodeChildren = function (nodeID, view) {

        var node = view.nodes[nodeID], child;

        jQuery.each(vwf.children(nodeID), function (childIndex, childID) {
            if (child = view.nodes[childID]) {
                if (bindChild(undefined, node, child, vwf.name(childID))) {
                    bindNodeChildren(childID, view);
                }
            }
        });

    };

    var bindChild = function (scene, node, child, childName) {

        if (scene) {
            child.name = childName;
            child.glgeObject = scene.glgeScene && glgeSceneChild(scene.glgeScene, childName);
        }

        else if (node) {
            child.name = childName;
            child.glgeObject = node.glgeObject && glgeObjectChild(node.glgeObject, childName);
        }

        return Boolean(child.glgeObject);

        //console.info( "scene: " + nodeID + " " + childID + " " + childName + " " + this.nodes[childID].glgeObject );
        //console.info( "node: " + nodeID + " " + childID + " " + childName + " " + this.nodes[childID].glgeObject );

    };

    // Search a GLGE.Scene for a child with the given name.

    var glgeSceneChild = function (glgeScene, childName) {

        return jQuery.grep(glgeScene.children || [], function (glgeChild) {
            return (glgeChild.name || glgeChild.id || glgeChild.docURL || "") == childName;
        }).shift();

    };

    // Search a GLGE.Object, GLGE.Collada, GLGE.Light for a child with the given name.  TODO: really, it's anything with children[]; could be the same as glgeSceneChild().

    var glgeObjectChild = function (glgeObject, childName) {

        return jQuery.grep(glgeObject.children || [], function (glgeChild) {
            return (glgeChild.colladaName || glgeChild.colladaId || glgeChild.name || glgeChild.id || "") == childName;
        }).shift();

    };

    var checkKeys = function (nodeID, view, now, lasttime) {
        var scene = view.scenes[nodeID], child;
        if (scene && scene.glgeScene) {
            var camera = scene.glgeScene.camera;
            if (camera) {
                camerapos = camera.getPosition();
                camerarot = camera.getRotation();
                var mat = camera.getRotMatrix();
                var trans = GLGE.mulMat4Vec4(mat, [0, 0, -1, 1]);
                var mag = Math.pow(Math.pow(trans[0], 2) + Math.pow(trans[1], 2), 0.5);
                trans[0] = trans[0] / mag;
                trans[1] = trans[1] / mag;
                var yinc = 0;
                var xinc = 0;
                var zinc = 0;
                if (scene.glgeKeys.isKeyPressed(GLGE.KI_W) || scene.glgeKeys.isKeyPressed(GLGE.KI_UP_ARROW)) {
                    yinc = yinc + parseFloat(trans[1]); xinc = xinc + parseFloat(trans[0]); 
                }
                if (scene.glgeKeys.isKeyPressed(GLGE.KI_S) || scene.glgeKeys.isKeyPressed(GLGE.KI_DOWN_ARROW)) {
                    yinc = yinc - parseFloat(trans[1]); xinc = xinc - parseFloat(trans[0]); 
                 }
                if (scene.glgeKeys.isKeyPressed(GLGE.KI_A)) { yinc = yinc + parseFloat(trans[0]); xinc = xinc - parseFloat(trans[1]); }
                if (scene.glgeKeys.isKeyPressed(GLGE.KI_D)) { yinc = yinc - parseFloat(trans[0]); xinc = xinc + parseFloat(trans[1]); }
                if (scene.glgeKeys.isKeyPressed(GLGE.KI_E)) { zinc = zinc + 1.0 }
                if (scene.glgeKeys.isKeyPressed(GLGE.KI_C)) { zinc = zinc - 1.0 }
                if (scene.glgeKeys.isKeyPressed(GLGE.KI_LEFT_ARROW)) { camera.setRotY(camerarot.y + 0.02); }
                if (scene.glgeKeys.isKeyPressed(GLGE.KI_RIGHT_ARROW)) { camera.setRotY(camerarot.y - 0.02); }
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

    var initMouseEvents = function (canvas, nodeID, view) {
        var scene = view.scenes[nodeID], child;
        var mouseDown = false;
        var mouseOverCanvas = false;

        var mouseDownObject = null;
        var mouseOverObject = null;

        canvas.onmousedown = function (e) {
            mouseDown = true;
            mouseDownObject = mousePick(e, scene);

            //console.info("CANVAS mouseDown: " + path(mouseDownObject));
            //this.throwEvent( "onMouseDown", path(mouseDownObject) );

        }

        canvas.onmouseup = function (e) {
            var mouseUpObject = mousePick(e, scene);
            // check for time??
            if (mouseUpObject && mouseDownObject && path(mouseUpObject) == path(mouseDownObject)) {
                //console.info("CANVAS onMouseClick: " + path(mouseDownObject));
                //this.throwEvent( "onMouseClick", path(mouseDownObject) );
            }

            //console.info("CANVAS onMouseUp: " + path(mouseDownObject));
            //this.throwEvent( "onMouseUp", path(mouseDownObject) );

            mouseDownObject = null;
            mouseDown = false;
        }

        canvas.onmouseover = function (e) {
            mouseOverCanvas = true;
        }

        canvas.onmousemove = function (e) {

            if (mouseDown) {
                if (mouseDownObject) {

                    //console.info("CANVAS onMouseMove: " + path(mouseDownObject));
                    //this.throwEvent( "onMouseMove", path(mouseDownObject) );
                }
            }
            else {
                var objectOver = mousePick(e, scene);
                if (objectOver) {
                    if (mouseOverObject) {
                        if (path(objectOver) != path(mouseOverObject)) {

                            //console.info("CANVAS onMouseLeave: " + path(mouseOverObject));
                            //this.throwEvent( "onMouseLeave", path(mouseOverObject) );

                            mouseOverObject = objectOver;

                            //console.info("CANVAS onMouseEnter: " + path(mouseOverObject));
                            //this.throwEvent( "onMouseEnter", path(mouseOverObject) );
                        }
                        else {
                            //console.info("CANVAS onMouseHover: " + path(mouseOverObject));
                            //this.throwEvent( "onMouseHover", path(mouseOverObject) );

                        }
                    }
                    else {
                        mouseOverObject = objectOver;

                        //console.info("CANVAS onMouseEnter: " + path(mouseOverObject));
                        //this.throwEvent( "onMouseEnter", path(mouseOverObject) );
                    }

                }
                else {
                    if (mouseOverObject) {
                        //console.info("CANVAS onMouseLeave: " + path(mouseOverObject));
                        //this.throwEvent( "onMouseLeave", path(mouseOverObject) );
                        mouseOverObject = null;

                    }
                }
            }


            //this.mouseOverCanvas = true; 
        }

        canvas.onmouseout = function (e) {
            if (mouseOverObject) {
                //console.info("CANVAS onMouseLeave: " + path(mouseOverObject));
                //this.throwEvent( "onMouseLeave", path(mouseOverObject) );
                mouseOverObject = null;
            }
            mouseOverCanvas = false;
        }

        canvas.onmousewheel = function (e) {
        }
    };

    // path() and name() should go away
    var path = function (glgeObject) {
        var sOut = "";
        var sName = "";

        while (glgeObject && glgeObject.parent) {
            if (sOut == "")
                sOut = name(glgeObject);
            else
                sOut = name(glgeObject) + "." + sOut;
            glgeObject = glgeObject.parent;
        }
        return sOut;
    };

    var name = function (glgeObject) {
        return glgeObject.colladaName || glgeObject.colladaId || glgeObject.getName();
    }
    // path() and name() should go away

    var mousePick = function (e, scene) {
        if (scene && scene.glgeScene) {
            var pickInfo = scene.glgeScene.pick(e.clientX - e.currentTarget.offsetLeft, e.clientY - e.currentTarget.offsetTop);
            if (pickInfo) {
                //if (pickInfo.object)
                //    console.info("mousePick: " + path(pickInfo.object));
                return pickInfo.object;
            }
        }
        return null;
    };


})(window.vwf.modules);
