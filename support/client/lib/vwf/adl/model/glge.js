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

define(["module", "vwf/model", "vwf/utility"], function(module, model, utility) {

    // vwf/model/glge.js is an interface to the GLGE WebGL scene manager.

    // For historical reasons yet to be resolved, the GLGE model code currently resides in
    // vwf-model.glge.js intermixed with the view code. This driver is a gross hack to delegate model
    // calls to the appropriate parts of the GLGE view.

    return model.load(module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {

            this.state.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
            this.state.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }
            this.state.kernel = this.kernel.kernel.kernel;

            this.state.sceneRootID = "index-vwf";

            this.delayedProperties = {};

        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------

        creatingNode: function(nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback) {

            var node, parentNode, glgeChild, prototypes;
            var kernel = this.kernel.kernel.kernel;

            if (childExtendsID === undefined /* || childName === undefined */ )
                return;

            //            this.logger.enabled = true;
            //            this.logger.infoc( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs,
            //                                childSource, childType, childURI, childName );
            //            this.logger.enable = false;

            // find the parent node
            if (nodeID) {
                if (this.state.nodes[nodeID])
                    parentNode = this.state.nodes[nodeID];
                else
                    parentNode = this.state.scenes[nodeID];

                if (parentNode) {
                    var glgeParent = parentNode.glgeObject ? parentNode.glgeObject : parentNode.glgeScene;
                    if (glgeParent && childName) {
                        glgeChild = glgeObjectChild.call(this, glgeParent, childName, childExtendsID);
                    }
                }
            }

            prototypes = getPrototypes.call(this, kernel, childExtendsID);
            if (prototypes && isGlgeSceneDefinition.call(this, prototypes) && childID == this.state.sceneRootID) {

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

                //sceneNode.glgeScene.vwfID = childID;

                if (sceneNode.glgeScene.camera) {
                    sceneNode.camera.glgeCameras[sceneNode.camera.defaultCamID] = sceneNode.glgeScene.camera;
                } else {
                    var cam = new GLGE.Camera();
                    sceneNode.glgeScene.setCamera(cam);
                    sceneNode.camera.glgeCameras[sceneNode.camera.defaultCamID] = cam;
                }
                sceneNode.glgeScene.camera.name = "camera";
                this.state.cameraInUse = sceneNode.glgeScene.camera;
                initCamera.call(this, sceneNode.glgeScene.camera);

                var camType = "http://vwf.example.com/camera.vwf";
                vwf.createChild(childID, "camera", {
                    "extends": camType
                }, undefined);

                var model = this;
                var xmlDocLoadedCallback = callback;
                sceneNode.glgeDocument.onLoad = function() {
                    sceneNode.pendingLoads--;
                    xmlDocLoadedCallback(true);
                };

                if (childSource) {
                    switch (childType) {
                        case "model/x-glge":
                            callback(false);
                            sceneNode.glgeDocument.load(utility.resolveURI(childSource, childURI));
                            sceneNode.pendingLoads++;
                            break;
                    }
                }

            } else if (prototypes && isGlgeCameraDefinition.call(this, prototypes)) {
                var camName = childID.substring(childID.lastIndexOf('-') + 1);
                var sceneNode = this.state.scenes[this.state.sceneRootID];
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

                if (!node.glgeObject) {
                    createCamera.call(this, nodeID, childID, childName);
                }

                if (sceneNode && sceneNode.camera) {
                    if (childID == sceneNode.camera.defaultCamID) {
                        if (!sceneNode.camera.glgeCameras[childID]) {
                            var cam = new GLGE.Camera();
                            sceneNode.camera.glgeCameras[childID] = cam;
                            initCamera.call(this, cam);
                        }
                        node.name = camName;
                        node.glgeObject = sceneNode.camera.glgeCameras[childID];

                    } else if (node.glgeObject) {
                        sceneNode.camera.glgeCameras[childID] = node.glgeObject;
                    }
                }
            } else if (prototypes && isGlgeLightDefinition.call(this, prototypes)) {
                node = this.state.nodes[childID] = {
                    name: childName,
                    glgeObject: glgeChild,
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID,
                    sourceType: childType,
                };
                if (!node.glgeObject && nodeID) {
                    createLight.call(this, nodeID, childID, childName);
                }
            } else if (prototypes && isGlgeParticleSystemDefinition.call(this, prototypes)) {
                node = this.state.nodes[childID] = {
                    name: childName,
                    glgeObject: glgeChild,
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID
                };
                if (!node.glgeObject && nodeID) {
                    createParticleSystem.call(this, nodeID, childID, childName);
                }
            } else if (prototypes && isGlgeNodeDefinition.call(this, prototypes)) {

                var sceneNode = this.state.scenes[this.state.sceneRootID];
                switch (childType) {
                    case "model/vnd.collada+xml":
                        callback(false);
                        node = this.state.nodes[childID] = {
                            name: childName,
                            glgeObject: undefined,
                            source: utility.resolveURI(childSource, childURI),
                            ID: childID,
                            parentID: nodeID,
                            sourceType: childType,
                            type: childExtendsID,
                            loadingCollada: callback
                        };
                        loadCollada.call(this, parentNode, node);
                        break;
                    case "model/vnd.osgjs+json+compressed":

                        callback(false);
                        node = this.state.nodes[childID] = {
                            name: childName,
                            glgeObject: undefined,
                            source: childSource,
                            ID: childID,
                            parentID: nodeID,
                            sourceType: childType,
                            type: childExtendsID,
                            loadingJson: callback
                        };
                        loadJson.call(this, parentNode, node);
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

                        if (sceneNode && sceneNode.glgeDocument) {
                            var meshDef = sceneNode.glgeDocument.getElement(node.source);
                            if (meshDef) {
                                node.glgeObject = new GLGE.Object();
                                node.glgeObject.setMesh(meshDef);
                                if (glgeParent) {
                                    glgeParent.addObject(node.glgeObject);
                                } else {
                                    if (sceneNode.glgeScene) {
                                        sceneNode.glgeScene.addObject(node.glgeObject);
                                    }
                                }
                            }
                        }
                        break;

                    case "definition/mesh":
                        {
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
                    case "link_existing/glge":
                        {
                            node = this.state.nodes[childID] = {
                                name: childName,
                                glgeObject: null,
                                ID: childID,
                                parentID: nodeID,
                                type: childExtendsID,
                                sourceType: childType,
                            };
                            node.glgeObject = findChildByName(parentNode.glgeObject, childSource);
                            //we need to mark this node - because the VWF node is layered onto a GLGE node loaded from the art asset, deleteing the VWF node should not
                            //delete the GLGE node. This should probably undo any changes made to the GLGE node by the VWF. This is tricky. I'm going to backup the matrix, and reset it
                            //when deleting the VWF node.
                            if (node.glgeObject) {
                                node.glgeObject.initializedFromAsset = true;
                                node.glgeObject.backupMatrix = [];
                                node.glgeObject.vwfID = node.ID;
                                for (var u = 0; u < 16; u++)
                                    node.glgeObject.backupMatrix.push(node.glgeObject.getLocalMatrix()[u]);
                            } else {
                                console.log("failed to find view node for " + childSource);
                                node.glgeObject = new GLGE.Group();
                                node.glgeObject.vwfID = node.ID;
                            }
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
                        if (node.glgeObject) {
                            node.glgeObject.vwfID = node.ID;

                            if ((node.glgeObject.constructor == GLGE.Collada)) {
                                callback(false);
                                node.glgeObject.vwfID = childID;
                                sceneNode.xmlColladaObjects.push(node.glgeObject);
                                setupColladaCallback.call(this, node.glgeObject, sceneNode);
                                node.loadingCollada = callback;
                            }
                        } else {
                            node.glgeObject = new GLGE.Group();
                            node.glgeObject.vwfID = node.ID;
                            if (parentNode) {
                                if (parentNode.glgeObject) {
                                    parentNode.glgeObject.addObject(node.glgeObject);
                                } else if (parentNode.glgeScene) {
                                    parentNode.glgeScene.addObject(node.glgeObject);
                                }
                            }

                            node.gui = node.glgeObject.uid;
                            node.glgeObject.name = childName;
                        }
                        break;
                }

                this.settingProperty(childID, "playing", false); // TODO: these are matching the defaults in node3; they should be sent through creatingProperty() so that we don't have to ask
                this.settingProperty(childID, "looping", false); // TODO: these are matching the defaults in node3; they should be sent through creatingProperty() so that we don't have to ask
                this.settingProperty(childID, "speed", 1); // TODO: these are matching the defaults in node3; they should be sent through creatingProperty() so that we don't have to ask


            } else if (prototypes && isGlgeMaterialDefinition.call(this, prototypes)) {
                node = this.state.nodes[childID] = {
                    name: childName,
                    glgeObject: undefined,
                    glgeMaterial: true,
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID,
                    sourceType: childType,
                };
                findMaterial.call(this, nodeID, childName, node);
            } else {

                switch (childExtendsID) {
                    case "appscene-vwf":
                    case "index-vwf":
                    case "http-vwf-example-com-node-vwf":
                    case "http-vwf-example-com-node2-vwf":
                    case "http-vwf-example-com-scene-vwf":
                    case "http-vwf-example-com-navscene-vwf":
                    case undefined:
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
                        break;
                } // end of switch
            } // end of else

            //            this.logger.enabled = false;

        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function(nodeID) {

            if (this.state.nodes[nodeID]) {
                var node = this.state.nodes[nodeID];
                if (node.glgeObject) {
                    var obj = node.glgeObject;
                    var parent = obj.parent;
                    if (parent) {

                        var sceneNode = this.state.scenes[this.state.sceneRootID];


                        //this node was created in whole by the VWF, so it can be deleted
                        if (!node.glgeObject.initializedFromAsset) {

                            if (node.glgeObject.getObjects) {
                                var objs = node.glgeObject.getObjects();

                                for (var i = 0; i < objs.length; i++) {
                                    if (objs[i].isStatic == true) {

                                        sceneNode.glgeScene.deBatch(objs[i]);
                                    }
                                }
                            }

                            if (parent.removeChild) parent.removeChild(obj);
                            node.glgeObject = undefined;
                            if (obj instanceof GLGE.Light) {
                                sceneNode.glgeScene.updateAllPrograms();
                            }
                            //delete obj;
                        }
                        //This node is a sub node of an asset that was loaded by the VWF. Deleteing the VWF node should reset the asset sub node.
                        //we need to undo some of the changes made by the framework to this asset. 
                        //coded here for now, probably need a delete callback in the framworkd
                        else {
                            restoreObject(node.glgeObject);
                        }
                    }
                }
                delete this.state.nodes[nodeID];
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

        creatingProperty: function(nodeID, propertyName, propertyValue) {

            return this.initializingProperty(nodeID, propertyName, propertyValue);
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function(nodeID, propertyName, propertyValue) {

            var value = undefined;

            if (!(propertyValue === undefined)) {
                var node = this.state.nodes[nodeID];
                if (!node) node = this.state.scenes[nodeID];
                if (node) {
                    switch (propertyName) {

                        case "meshDefinition":
                            createMesh.call(this, propertyValue, node);
                            break;

                        default:
                            value = this.settingProperty(nodeID, propertyName, propertyValue);
                            break;
                    }
                }
            }

            return value;
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function(nodeID, propertyName, propertyValue) {


            var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
            var value = undefined;

            if (node && node.glgeObject && propertyValue !== undefined) {

                var validProperty = false;
                var glgeObject = node.glgeObject;
                var isAnimatable = glgeObject.animate; // implements GLGE.Animatable?
                isAnimatable = isAnimatable && glgeObject.animation || propertyName == "looping" && glgeObject.constructor == GLGE.ParticleSystem; // has an animation?
                isAnimatable = isAnimatable && node.name != "cityblock.dae"; // TODO: this is a hack to prevent disabling the animation that keeps the world upright


                value = propertyValue;
                //            this.logger.info( namespace + ".satProperty " + path( glgeObject ) + " " + propertyName + " " + propertyValue);

                if (isAnimatable) {

                    switch (propertyName) {

                        case "playing":

                            if (!Boolean(propertyValue) && glgeObject.animFinished) { // TODO: GLGE finished doesn't flow back into node3's playing yet; assume playing is being toggled and interpret it as true if the animation has played and finished.
                                propertyValue = true;
                            }

                            //    if ( !node.initialized ) {  // TODO: this is a hack to set the animation to frame 0 during initialization
                            //        //if ( glgeObject.animFrames == 100 ) { glgeObject.setFrames( 50 ); } // hack to use only the opening half of the door animation
                            //        glgeObject.setStartFrame( 0, 0, glgeObject.getLoop() );
                            //        glgeObject.getInitialValues( glgeObject.animation, glgeObject.animationStart );
                            //    }

                            if (Boolean(propertyValue)) {
                                if (glgeObject.animFinished) {
                                    glgeObject.setStartFrame(0, 0, glgeObject.getLoop());
                                } else if (glgeObject.getPaused()) {
                                    if (glgeObject.animFrames == 100) {
                                        glgeObject.setFrames(50);
                                    }
                                    glgeObject.setPaused(GLGE.FALSE);
                                    value = false;
                                    validProperty = true;
                                }
                            } else {
                                glgeObject.setPaused(GLGE.TRUE);
                                value = true;
                                validProperty = true;
                            }

                            break;

                        case "looping":
                            value = Boolean(propertyValue) ? GLGE.TRUE : GLGE.FALSE;
                            glgeObject.setLoop(value);
                            value = (value == GLGE.TRUE) ? true : false;
                            validProperty = true;
                            break;

                        case "speed":
                            value = Number(propertyValue) * 30; // TODO: not safe to assume default speed is 30 fps
                            glgeObject.setFrameRate(value);
                            validProperty = true;
                            break;
                    }
                }

                var pv = propertyValue;
                switch (propertyName) {


                    case "transform":

                        var transform = goog.vec.Mat4.createFromArray(propertyValue || []);

                        // Rotate 90 degress around X to convert from VWF Z-up to GLGE Y-up.

                        if (glgeObject instanceof GLGE.Camera) {
                            var columny = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn(transform, 1, columny);
                            var columnz = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn(transform, 2, columnz);
                            goog.vec.Mat4.setColumn(transform, 1, columnz);
                            goog.vec.Mat4.setColumn(transform, 2, goog.vec.Vec4.negate(columny, columny));
                        }

                        // Assign the transform. GLGE matrices are transposed compared to VWF.
                        // setStaticMatrix() doesn't propagate correctly for cameras, so we have to
                        // decompose camera assignments.

                        if (glgeObject instanceof GLGE.Camera || glgeObject instanceof GLGE.ParticleSystem) { // setStaticMatrix doesn't work for cameras

                            var translation = goog.vec.Vec3.create();
                            goog.vec.Mat4.getColumn(transform, 3, translation);
                            goog.vec.Mat4.setColumnValues(transform, 3, 0, 0, 0, 1);
                            goog.vec.Mat4.transpose(transform, transform);
                            glgeObject.setRotMatrix(transform);
                            glgeObject.setLoc(translation[0], translation[1], translation[2]);
                        } else {

                            // Set loc[XYZ] so that GLGE.Placeable.getPosition() will return correct
                            // values for lookAt. setLoc() clears the static matrix, so call it
                            // before setStaticMatrix().

                            var translation = goog.vec.Vec3.create();
                            goog.vec.Mat4.getColumn(transform, 3, translation);
                            glgeObject.setLoc(translation[0], translation[1], translation[2]);

                            // Set the full matrix.

                            glgeObject.setStaticMatrix(
                                goog.vec.Mat4.transpose(transform, goog.vec.Mat4.create())
                            );
                            //glgeObject.parent.updateMatrix();
                            //glgeObject.updateMatrix();

                            if (glgeObject instanceof GLGE.Light) {
                                var sceneNode = this.state.scenes[this.state.sceneRootID];
                                sceneNode.glgeScene.updateMatrix();
                            }
                        }

                        glgeObject.matrixDirty = true;

                        if (glgeObject.getObjects) {
                            var objs = glgeObject.getObjects();

                            for (var i = 0; i < objs.length; i++) {
                                if (objs[i].isStatic == true)
                                    objs[i].batchDirty = true;
                            }
                        }
                        break;
                    case "isStatic":
                        {
                            glgeObject.isStatic = propertyValue;
                            if (glgeObject.getObjects) {
                                var objs = glgeObject.getObjects();
                                for (var i = 0; i < objs.length; i++) {
                                    objs[i].isStatic = propertyValue;
                                    if (propertyValue)
                                        objs[i].batchDirty = true;
                                    else {
                                        var sceneNode = this.state.scenes[this.state.sceneRootID];
                                        sceneNode.glgeScene.deBatch(objs[i]);
                                    }
                                }
                            }
                        }
                        break;
                    case "optimize":
                        {
                            var sceneNode = this.state.scenes[this.state.sceneRootID];
                            sceneNode.glgeScene.buildBatches(true, glgeObject);
                        }
                        break;
                    case "material":
                        {
                            var sceneNode = this.state.scenes[this.state.sceneRootID];
                            if (sceneNode && node.glgeObject) {
                                if (propertyValue && propertyValue.constructor == Array) propertyValue = propertyValue[(Math.SecureRandom() * propertyValue.length) | 0];
                                if (!propertyValue) propertyValue = "grey";
                                var mat = sceneNode.glgeDocument.getElement(propertyValue);
                                if (mat) {
                                    node.glgeObject.setMaterial(mat);
                                }
                            }
                        }
                        break;

                    case "lookAt":
                        {
                            var lookAtNode = this.state.nodes[propertyValue];
                            if (lookAtNode && lookAtNode.glgeObject) {
                                glgeObject.setLookat(lookAtNode.glgeObject);
                            } else {
                                if (glgeObject.getLookat && glgeObject.getLookat())
                                    glgeObject.setLookat(null);
                            }
                        }
                        break;

                    case "visible":
                        if (glgeObject.setVisible) {
                            glgeObject.setVisible(propertyValue);
                        }
                        break;

                    default:
                        switch (node["type"]) {
                            case "http-vwf-example-com-material-vwf":
                                value = setMaterialProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            case "http-vwf-example-com-light-vwf":
                                value = setLightProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            case "http-vwf-example-com-camera-vwf":
                                value = setCameraProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            case "http-vwf-example-com-particlesystem-vwf":
                                value = setParticleSystemProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            case "http-vwf-example-com-navscene-vwf":
                            case "appscene-vwf":
                                value = setSceneProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            default:
                                if (glgeObject instanceof GLGE.Light) {
                                    value = setLightProperty.call(this, nodeID, propertyName, propertyValue);
                                }
                                if (glgeObject instanceof GLGE.ParticleSystem) {
                                    value = setParticleSystemProperty.call(this, nodeID, propertyName, propertyValue);
                                }
                                if (!validProperty) {
                                    value = undefined;
                                }
                                break;
                        }
                        break;
                }
            } else if (this.state.scenes[nodeID]) {
                value = setSceneProperty.call(this, nodeID, propertyName, propertyValue);
            } else {
                var propArray;
                if (!this.delayedProperties[nodeID]) {
                    this.delayedProperties[nodeID] = {};
                }
                propArray = this.delayedProperties[nodeID];

                propArray[propertyName] = propertyValue;
            }

            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function(nodeID, propertyName, propertyValue) {

            var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
            var value = undefined;
            var glgeModel = this;

            if (node && node.glgeObject) {

                var glgeObject = node.glgeObject;
                var isAnimatable = glgeObject.animate; // implements GLGE.Animatable?
                isAnimatable = isAnimatable && glgeObject.animation || propertyName == "looping" && glgeObject.constructor == GLGE.ParticleSystem; // has an animation?
                isAnimatable = isAnimatable && node.name != "cityblock.dae"; // TODO: this is a hack to prevent disabling the animation that keeps the world upright

                if (isAnimatable) {

                    switch (propertyName) {

                        case "playing":
                            value = !Boolean(glgeObject.getPaused());
                            break;

                        case "looping":
                            value = Boolean(glgeObject.getLoop());
                            break;

                        case "speed":
                            value = glgeObject.getFrameRate() / 30; // TODO: not safe to assume default speed is 30 fps
                            break;
                    }
                }

                switch (propertyName) {

                    case "worldTransform":
                        value = goog.vec.Mat4.transpose(glgeObject.getModelMatrix(),
                            goog.vec.Mat4.create()
                        );

                        // Rotate -90 degress around X to convert from GLGE Y-up to VWF Z-up.

                        if (glgeObject instanceof GLGE.Camera) {
                            var columny = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn(value, 1, columny);
                            var columnz = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn(value, 2, columnz);
                            goog.vec.Mat4.setColumn(value, 2, columny);
                            goog.vec.Mat4.setColumn(value, 1, goog.vec.Vec4.negate(columnz, columnz));
                        }

                        break;

                    case "transform":

                        // We would use glgeObject.getLocalMatrix(), but glgeObject.localMatrix
                        // isn't always recalculated. So, we need to replicate the calculations from
                        // glgeObject.getModelMatrix(). VWF matrices are transposed compared to GLGE.

                        value = goog.vec.Mat4.transpose(glgeObject.staticMatrix ||
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

                        if (glgeObject instanceof GLGE.Camera) {
                            var columny = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn(value, 1, columny);
                            var columnz = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn(value, 2, columnz);
                            goog.vec.Mat4.setColumn(value, 2, columny);
                            goog.vec.Mat4.setColumn(value, 1, goog.vec.Vec4.negate(columnz, columnz));
                        }

                        break;
                    case "isStatic":
                        {

                            value = glgeObject.isStatic;
                            if (value === undefined) value = false;
                            break;
                        }
                    case "boundingbox":
                        var bbox = getLocalBoundingBox.call(this, glgeObject);
                        var scale = this.kernel.getProperty(nodeID, "scale", undefined);
                        value = {
                            min: [bbox.xMin * scale[0], bbox.yMin * scale[1], bbox.zMin * scale[2]],
                            max: [bbox.xMax * scale[0], bbox.yMax * scale[1], bbox.zMax * scale[2]]
                        };
                        break;

                    case "centerOffset":
                        var centerOff = getCenterOffset.call(this, glgeObject);
                        var scale = this.kernel.getProperty(nodeID, "scale", undefined);
                        value = new Array;
                        value.push(centerOff[0] * scale[0], centerOff[1] * scale[1], centerOff[2] * scale[2]);
                        break;

                    case "vertices":
                        value = getMeshVertices.call(this, glgeObject);
                        break;

                    case "vertexIndices":
                        value = getMeshVertexIndices.call(this, glgeObject);
                        break;

                    case "meshData":
                        value = [];
                        var scale = this.gettingProperty(nodeID, "scale", []);
                        var meshList = findAllMeshes.call(this, glgeObject);
                        for (var i = 0; i < meshList.length; i++) {
                            value.push({
                                "vertices": getMeshVertices.call(this, meshList[i]),
                                "vertexIndices": getMeshVertexIndices.call(this, meshList[i]),
                                "scale": scale
                            });
                        }
                        break;

                    case "lookAt":
                        {
                            value = "";
                            var lookAtObject = glgeObject.getLookat();
                            if (lookAtObject) {
                                value = getObjectID.call(glgeModel, lookAtObject, false, false);
                            }
                        }
                        break;

                    case "visible":
                        if (glgeObject.getVisible) {
                            value = glgeObject.getVisible();
                        }
                        break;

                    default:
                        switch (node.type) {
                            case "http-vwf-example-com-mesh-vwf":
                                value = getObjectProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            case "http-vwf-example-com-material-vwf":
                                value = getMaterialProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            case "http-vwf-example-com-light-vwf":
                                value = getLightProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            case "http-vwf-example-com-camera-vwf":
                                value = getCameraProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            case "http-vwf-example-com-particlesystem-vwf":
                                value = getParticleSystemProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            case "http-vwf-example-com-scene-vwf":
                                value = getSceneProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                            default:

                                if (glgeObject instanceof GLGE.Light)
                                    value = getLightProperty.call(this, nodeID, propertyName, propertyValue);
                                if (glgeObject instanceof GLGE.ParticleSystem)
                                    value = getParticleSystemProperty.call(this, nodeID, propertyName, propertyValue);
                                break;
                        }
                        break;

                }
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

    });

    // == Private functions ==================================================================

    // -- initScene ------------------------------------------------------------------------

    function initScene(sceneNode) {

        if (sceneNode && !sceneNode.modelInited) {
            sceneNode.modelInited = true;

            //findAllColladaObjs.call( this, sceneNode.glgeScene, sceneNode.ID );
        }
    }
    // -- loadCollada ------------------------------------------------------------------------  

    function loadJson(parentNode, node) {

        var nodeCopy = node;
        var nodeID = node.ID;
        var childName = node.name;
        var glgeModel = this;
        var sceneNode = this.state.scenes[this.state.sceneRootID];
        $(document).trigger('BeginParse');

        function jsonLoaded(collada) {
            $(document).trigger('EndParse');
            sceneNode.pendingLoads--;
            collada.setRot(0, 0, 0); // undo the default GLGE rotation applied in GLGE.Collada.initVisualScene that is adjusting for +Y up
            var removed = false;
            if (nodeCopy && nodeCopy.colladaLoaded) {
                nodeCopy.colladaLoaded(true);
            }
            for (var j = 0; j < sceneNode.srcColladaObjects.length; j++) {
                if (sceneNode.srcColladaObjects[j] == collada) {
                    sceneNode.srcColladaObjects.splice(j, 1);
                    removed = true;
                }
            }
            if (removed) {
                if (sceneNode.srcColladaObjects.length == 0) {
                    //vwf.setProperty( glgeModel.state.sceneRootID, "loadDone", true );
                    loadComplete.call(glgeModel);
                }

                var id = collada.vwfID;
                if (!id) id = getObjectID.call(glgeModel, collada, true, false);
                if (id && id != "") {
                    //glgeModel.kernel.callMethod( id, "loadComplete" );
                    if (glgeModel.state.nodes[id]) {
                        var colladaNode = glgeModel.state.nodes[id];
                        if (colladaNode.loadingJson) {
                            colladaNode.loadingJson(true);
                        }
                    }
                }
            }
        }

        node.name = childName;
        node.glgeObject = BuildJSON_GLGE_Node(node, jsonLoaded);
        sceneNode.srcColladaObjects.push(node.glgeObject);
        node.glgeObject.vwfID = nodeID;

        sceneNode.pendingLoads++;

        if (parentNode && parentNode.glgeObject) {
            parentNode.glgeObject.addChild(node.glgeObject);
        } else if (sceneNode) {
            //          if ( !sceneNode.glgeScene ) {
            //              this.initScene.call( this, sceneNode );
            //          }
            if (sceneNode.glgeScene) {
                sceneNode.glgeScene.addChild(node.glgeObject);
            }

        }
    }

    // -- loadCollada ------------------------------------------------------------------------  

    function loadCollada(parentNode, node) {

        var nodeCopy = node;
        var nodeID = node.ID;
        var childName = node.name;
        var glgeModel = this;
        var sceneNode = this.state.scenes[this.state.sceneRootID];
        $(document).trigger('BeginParse');

        function colladaLoaded(collada) {
            $(document).trigger('EndParse');
            sceneNode.pendingLoads--;
            collada.setRot(0, 0, 0); // undo the default GLGE rotation applied in GLGE.Collada.initVisualScene that is adjusting for +Y up
            var removed = false;
            if (nodeCopy && nodeCopy.colladaLoaded) {
                nodeCopy.colladaLoaded(true);
            }
            for (var j = 0; j < sceneNode.srcColladaObjects.length; j++) {
                if (sceneNode.srcColladaObjects[j] == collada) {
                    sceneNode.srcColladaObjects.splice(j, 1);
                    removed = true;
                }
            }
            if (removed) {
                if (sceneNode.srcColladaObjects.length == 0) {
                    //vwf.setProperty( glgeModel.state.sceneRootID, "loadDone", true );
                    loadComplete.call(glgeModel);
                }

                var id = collada.vwfID;
                if (!id) id = getObjectID.call(glgeModel, collada, true, false);
                if (id && id != "") {
                    //glgeModel.kernel.callMethod( id, "loadComplete" );
                    if (glgeModel.state.nodes[id]) {
                        var colladaNode = glgeModel.state.nodes[id];
                        if (colladaNode.loadingCollada) {
                            colladaNode.loadingCollada(true);
                        }
                    }
                }
            }
        }

        node.name = childName;
        node.glgeObject = new GLGE.Collada;
        sceneNode.srcColladaObjects.push(node.glgeObject);
        node.glgeObject.vwfID = nodeID;

        node.glgeObject.setDocument(node.source, window.location.href, colladaLoaded);
        node.glgeObject.loadedCallback = colladaLoaded;
        sceneNode.pendingLoads++;

        if (parentNode && parentNode.glgeObject) {
            parentNode.glgeObject.addCollada(node.glgeObject);
        } else if (sceneNode) {
            //          if ( !sceneNode.glgeScene ) {
            //              this.initScene.call( this, sceneNode );
            //          }
            if (sceneNode.glgeScene) {
                sceneNode.glgeScene.addCollada(node.glgeObject);
            }

        }
    }


    // -- findCollada ------------------------------------------------------------------------

    function findCollada(grp, nodeID) {

        if (grp && grp.getChildren) {
            var children = grp.getChildren();
            var sceneNode = this.state.scenes[this.state.sceneRootID];

            for (var i = 0; i < children.length; i++) {
                if (children[i].constructor == GLGE.Collada) {
                    var modelID = nodeID;
                    var glgeModel = this;

                    sceneNode.xmlColladaObjects.push(children[i]);
                    setupColladaCallback.call(this, children[i], sceneNode);

                    children[i].loadedCallback = colladaLoaded;
                    sceneNode.pendingLoads++;
                }
                findCollada.call(this, children[i]);
            }
        }
    }


    // -- setupColladaCallback ------------------------------------------------------------------------

    function setupColladaCallback(glgeCollada, scene) {

        var glgeModel = this;
        var sceneNode = scene;

        function colladaLoaded(collada) {
            sceneNode.pendingLoads--;
            collada.setRot(0, 0, 0); // undo the default GLGE rotation applied in GLGE.Collada.initVisualScene that is adjusting for +Y up
            var bRemoved = false;
            for (var j = 0; j < sceneNode.xmlColladaObjects.length; j++) {
                if (sceneNode.xmlColladaObjects[j] == collada) {
                    sceneNode.xmlColladaObjects.splice(j, 1);
                    bRemoved = true;
                }
            }
            if (bRemoved) {
                if (sceneNode.xmlColladaObjects.length == 0) {
                    //this.kernel.setProperty( modelID, "loadDone", true );
                    loadComplete.call(glgeModel);
                }
            }
            var id = collada.vwfID;
            if (!id) id = getObjectID.call(glgeModel, collada, true, false);
            if (id && id != "") {
                //glgeModel.kernel.callMethod( id, "loadComplete" );
                if (glgeModel.state.nodes[id]) {
                    var colladaNode = glgeModel.state.nodes[id];
                    if (colladaNode.loadingCollada) {
                        colladaNode.loadingCollada(true);
                    }
                }
            }
        }
        glgeCollada.loadedCallback = colladaLoaded;
        sceneNode.pendingLoads++;

    }

    // -- findColladaParent ------------------------------------------------------------------------

    function findAllColladaObjs(glgeScene, nodeID) {

        findCollada.call(this, glgeScene, nodeID);

    }

    // -- findColladaParent ------------------------------------------------------------------------

    function findColladaParent(glgeObject) {
        var colladaObj = undefined;
        var currentObj;
        if (glgeObject) {
            currentObj = glgeObject;
            while (!colladaObj && currentObj) {
                if (currentObj.constructor == GLGE.Collada)
                    colladaObj = currentObj;
                else
                    currentObj = currentObj.parent;
            }
        }
        return colladaObj;
    }


    // -- setSceneProperty ------------------------------------------------------------------------

    function setSceneProperty(nodeID, propertyName, propertyValue) {

        var value = propertyValue;
        var sceneNode = this.state.scenes[nodeID];
        if (sceneNode && sceneNode.glgeScene) {
            switch (propertyName) {
                case "ambientColor":
                    sceneNode.glgeScene.setAmbientColor(propertyValue);
                    break;
                case "activeCamera":
                    if (sceneNode.camera) {
                        if (this.state.nodes[propertyValue]) {
                            setActiveCamera.call(this, sceneNode, propertyValue);
                        }
                    }
                    break;
                case "backgroundColor":
                    sceneNode.glgeScene.setBackgroundColor(propertyValue);
                    break;

                default:
                    value = undefined;
                    break;
            }
        }
        return value;

    }

    // -- setParticleSystemProperty ------------------------------------------------------------------------

    function setParticleSystemProperty(nodeID, propertyName, propertyValue) {


        var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
        var value = propertyValue;
        switch (propertyName) {
            case "numberParticles":
                node.glgeObject.setNumParticles(propertyValue);
                break;
            case "blendMode":
                node.glgeObject.setBlend(propertyValue);
                break;
            case "lifeTime":
                node.glgeObject.setLifeTime(propertyValue);
                break;
            case "maxLifeTime":
                node.glgeObject.setMaxLifeTime(propertyValue);
                break;
            case "minLifeTime":
                node.glgeObject.setMinLifeTime(propertyValue);
                break;
            case "startSize":
                node.glgeObject.setStartSize(propertyValue);
                break;
            case "endSize":
                node.glgeObject.setEndSize(propertyValue);
                break;
            case "loop":
                node.glgeObject.setLoop(propertyValue);
                break;
            case "velocity":
                node.glgeObject.setVelocity(propertyValue[0], propertyValue[1], propertyValue[2]);
                break;
            case "maxVelocity":
                node.glgeObject.setMaxVelocity(propertyValue[0], propertyValue[1], propertyValue[2]);
                break;
            case "minVelocity":
                node.glgeObject.setMinVelocity(propertyValue[0], propertyValue[1], propertyValue[2]);
                break;
            case "startAcceleration":
                node.glgeObject.setStartAccelertaion(propertyValue[0], propertyValue[1], propertyValue[2]);
                break;
            case "endAcceleration":
                node.glgeObject.setEndAccelertaion(propertyValue[0], propertyValue[1], propertyValue[2]);
                break;
            case "maxStartAcceleration":
                node.glgeObject.setMaxStartAccelertaion(propertyValue[0], propertyValue[1], propertyValue[2]);
                break;
            case "maxEndAcceleration":
                node.glgeObject.setMaxEndAccelertaion(propertyValue[0], propertyValue[1], propertyValue[2]);
                break;
            case "minStartAcceleration":
                node.glgeObject.setMinStartAccelertaion(propertyValue[0], propertyValue[1], propertyValue[2]);
                break;
            case "minEndAcceleration":
                node.glgeObject.setMinEndAccelertaion(propertyValue[0], propertyValue[1], propertyValue[2]);
                break;
            case "startColor":
                node.glgeObject.startColor.r = propertyValue[0];
                node.glgeObject.startColor.g = propertyValue[1];
                node.glgeObject.startColor.b = propertyValue[2];
                node.glgeObject.attribute = null;
                break;
            case "endColor":
                node.glgeObject.endColor.r = propertyValue[0];
                node.glgeObject.endColor.g = propertyValue[1];
                node.glgeObject.endColor.b = propertyValue[2];
                node.glgeObject.attribute = null;
                break;
            case "image":
                node.glgeObject.setImage(propertyValue);
                break;
            case "endAlpha":
                node.glgeObject.endColor.a = propertyValue
                node.glgeObject.attribute = null;
                break;
            case "startAlpha":
                node.glgeObject.startColor.a = propertyValue
                node.glgeObject.attribute = null;
                break;
            case "emitter":

                if (propertyValue == 'box') {
                    node.glgeObject.setPositionFunction(function(i) {
                        return [Math.SecureRandom() * 3, Math.SecureRandom() * 3, Math.SecureRandom() * 3];
                    });
                }
                if (propertyValue == 'point') {
                    node.glgeObject.setPositionFunction(function(i) {
                        return [0, 0, 0];
                    });
                }
                break;
            default:
                value = undefined;
                break;
        }
        return value;

    }

    // -- setCameraProperty ------------------------------------------------------------------------

    function setCameraProperty(nodeID, propertyName, propertyValue) {

        var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
        var value = propertyValue;
        switch (propertyName) {
            case "cameraType":
                switch (propertyValue) {
                    case "perspective":
                        node.glgeObject.setType(GLGE.C_PERSPECTIVE);
                        break;
                    case "orthographic":
                        node.glgeObject.setType(GLGE.C_ORTHO);
                        break;
                    default:
                        value = undefined;
                        break;
                }
                break;
            case "far":
                node.glgeObject.setFar(Number(propertyValue));
                break;
            case "near":
                node.glgeObject.setNear(Number(propertyValue));
                break;
            case "fovy":
                node.glgeObject.setFovY(Number(propertyValue));
                break;
            case "aspect":
                node.glgeObject.setAspect(Number(propertyValue));
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

    function setMaterialProperty(nodeID, propertyName, propertyValue) {

        var node = this.state.nodes[nodeID];
        var value = propertyValue;
        var txtr, mat;

        if (propertyValue) {
            if (node.glgeMaterial && node.glgeMaterial.textures) {
                mat = node.glgeMaterial;
                txtr = node.glgeMaterial.textures[0];
            } else if (node.glgeObject && node.glgeObject.material) {
                mat = node.glgeObject.material;
                txtr = node.glgeObject.material.textures[0];
            }
            switch (propertyName) {
                case "texture":
                    {
                        if (!((propertyValue === undefined) || (propertyValue == ""))) {
                            if (txtr) {
                                txtr.setSrc(propertyValue);
                            } else if (mat) {
                                var ml = new GLGE.MaterialLayer;
                                ml.setMapto(GLGE.M_COLOR);
                                ml.setMapinput(GLGE.UV1);
                                var txt = new GLGE.Texture();
                                txt.setSrc(propertyValue);
                                mat.addTexture(txt);
                                ml.setTexture(txt);
                                mat.addMaterialLayer(ml);
                            }
                        }
                    }
                    break;

                case "color":
                    if (mat) {
                        mat.setColor(propertyValue);
                    }
                    break;
                case "ambient":
                    if (mat) {
                        mat.setAmbient(propertyValue);
                    }
                    break;
                case "specColor":
                    if (mat) {
                        mat.setSpecularColor(propertyValue);
                    }
                    break;
                case "shininess":
                    if (mat) {
                        mat.setShininess(propertyValue);
                    }
                    break;
                case "reflect":
                    if (mat) {
                        mat.setReflectivity(propertyValue);
                    }
                    break;
                case "specular":
                    if (mat) {
                        mat.setSpecular(propertyValue);
                    }
                    break;
                case "emit":
                    if (mat) {
                        mat.setEmit(propertyValue);
                    }
                    break;
                case "alpha":
                    if (mat) {
                        mat.setAlpha(propertyValue);
                    }
                    break;
                case "binaryAlpha":
                    if (mat) {
                        mat.setBinaryAlpha(propertyValue);
                    }
                    break;

                default:
                    value = undefined;
                    break;
            }
        }

        return value;
    }


    // -- setLightProperty ------------------------------------------------------------------------

    function setLightProperty(nodeID, propertyName, propertyValue) {

        if (propertyValue === undefined) return;

        var node = this.state.nodes[nodeID]; // { name: childName, glgeObject: undefined }
        var value = propertyValue;

        switch (propertyName) {
            case "lightType":
                switch (propertyValue) {
                    case "point":
                        node.glgeObject.setType(GLGE.L_POINT);
                        break;
                    case "directional":
                        node.glgeObject.setType(GLGE.L_DIR);
                        break;
                    case "spot":
                        node.glgeObject.setType(GLGE.L_SPOT);
                        break;
                    default:
                        value = undefined;
                        break;
                }
                break;

            case "constantAttenuation":
                node.glgeObject.setAttenuationConstant(propertyValue);
                break;

            case "linearAttenuation":
                node.glgeObject.setAttenuationLinear(propertyValue);
                break;

            case "quadraticAttenuation":
                node.glgeObject.setAttenuationQuadratic(propertyValue);
                break;

            case "spotExponent":
                node.glgeObject.setSpotExponent(propertyValue);
                break;

            case "diffuse":
                node.glgeObject.diffuse = propertyValue; // no setDiffuse() in GLGE 0.7
                break;

            case "specular":
                node.glgeObject.specular = propertyValue; // no setSpecular() in GLGE 0.7
                break;
            case "color":
                node.glgeObject.originalColor = propertyValue;
                node.glgeObject.color.r = node.glgeObject.originalColor[0] * (node.glgeObject.brightness || 1);
                node.glgeObject.color.g = node.glgeObject.originalColor[1] * (node.glgeObject.brightness || 1);
                node.glgeObject.color.b = node.glgeObject.originalColor[2] * (node.glgeObject.brightness || 1);
                break;
            case "brightness":
                node.glgeObject.brightness = propertyValue;
                if (node.glgeObject.originalColor) {
                    node.glgeObject.color.r = node.glgeObject.originalColor[0] * (node.glgeObject.brightness || 1);
                    node.glgeObject.color.g = node.glgeObject.originalColor[1] * (node.glgeObject.brightness || 1);
                    node.glgeObject.color.b = node.glgeObject.originalColor[2] * (node.glgeObject.brightness || 1);
                }
                break;
            case "samples":
                node.glgeObject.setShadowSamples(propertyValue);
                break;

            case "softness":
                node.glgeObject.setShadowSoftness(propertyValue);
                break;

            case "bufferHeight":
                node.glgeObject.setBufferHeight(propertyValue);
                break;

            case "bufferWidth":
                node.glgeObject.setBufferWidth(propertyValue);
                break;

            case "shadowBias":
                node.glgeObject.setShadowBias(propertyValue);
                break;

            case "distance":
                node.glgeObject.setDistance(propertyValue);
                break;

            case "castShadows":
                node.glgeObject.setCastShadows(propertyValue);
                break;

            default:
                value = undefined;
                break;
        }
        return value;

    }

    // -- getSceneProperty ------------------------------------------------------------------------------

    function getSceneProperty(nodeID, propertyName, propertyValue) {

        var sceneNode = this.state.scenes[nodeID] // { name: childName, glgeObject: undefined }
        var value = undefined;
        switch (propertyName) {
            case "ambientColor":
                var color = sceneNode.glgeScene.getAmbientColor();
                value = color['a'] ? [color['r'], color['g'], color['b'], color['a']] : [color['r'], color['g'], color['b']];
                break;
            case "activeCamera":
                if (sceneNode.glgeScene.camera && sceneNode.glgeScene.camera.ID) {
                    value = sceneNode.glgeScene.camera.ID;
                } else {
                    value = name(sceneNode.glgeScene.camera);
                }
                break;

            case "backgroundColor":
                var color = sceneNode.glgeScene.getBackgroundColor();
                value = color['a'] ? [color['r'], color['g'], color['b'], color['a']] : [color['r'], color['g'], color['b']];
                break;

            default:
                value = undefined;
                break;

        }
        return value;

    }

    // -- getParticleSystemProperty ------------------------------------------------------------------------------

    function getParticleSystemProperty(nodeID, propertyName, propertyValue) {

        var value = undefined;
        var obj;
        var node = this.state.nodes[nodeID];
        if (node && node.glgeObject) {
            var ps = node.glgeObject;

            switch (propertyName) {

                case "numberParticles":
                    if (ps.numParticles)
                        value = ps.numParticles;
                    break;
                case "maxLifeTime":
                    if (ps.maxLifeTime)
                        value = ps.maxLifeTime;
                    break;
                case "minLifeTime":
                    if (ps.minLifeTime)
                        value = ps.minLifeTime;
                    break;
                case "startSize":
                    if (ps.startSize)
                        value = ps.startSize;
                    break;
                case "endSize":
                    if (ps.endSize)
                        value = ps.endSize;
                    break;
                case "loop":
                    if (ps.getLoop)
                        value = ps.getLoop();
                    break;
                case "maxVelocity":
                    if (ps.startMaxVelocity) {
                        obj = ps.startMaxVelocity;
                        value = [obj.x, obj.y, obj.z];
                    }
                    break;
                case "minVelocity":
                    if (ps.startMinVelocity) {
                        obj = ps.startMinVelocity;
                        value = [obj.x, obj.y, obj.z];
                    }
                    break;
                case "maxStartAcceleration":
                    if (ps.startMaxAcceleration) {
                        obj = ps.startMaxAcceleration;
                        value = [obj.x, obj.y, obj.z];
                    }
                    break;
                case "maxEndAcceleration":
                    if (ps.endMaxAcceleration) {
                        obj = ps.endMaxAcceleration;
                        value = [obj.x, obj.y, obj.z];
                    }
                    break;
                case "minStartAcceleration":
                    if (ps.startMinAcceleration) {
                        obj = ps.startMinAcceleration;
                        value = [obj.x, obj.y, obj.z];
                    }
                    break;
                case "minEndAcceleration":
                    if (ps.endMinAcceleration)
                        obj = ps.endMinAcceleration;
                    value = [obj.x, obj.y, obj.z];
                    break;
                case "startColor":
                    if (ps.startColor) {
                        obj = ps.startColor;
                        value = [obj.r, obj.b, obj.g];
                    }
                    break;
                case "endColor":
                    if (ps.endColor) {
                        obj = ps.endColor;
                        value = [obj.r, obj.b, obj.g];
                    }
                    break;
                case "image":
                    if (ps.getImage)
                        value = ps.getImage().src;
                    break;
                default:
                    value = undefined;
                    break;
            }
        }
        return value;

    }

    // -- getObjectProperty ------------------------------------------------------------------------------

    function getObjectProperty(nodeID, propertyName, propertyValue) {

        var node = this.state.nodes[nodeID];
        var value = undefined;
        var txtr, mat;

        switch (propertyName) {
            case "mesh":
                {
                    if (node.glgeObject && node.glgeObject && node.glgeObject.getMesh) {
                        value = node.glgeObject.getMesh();
                    }
                }
                break;
        }

        return value;
    }

    // -- getMaterialProperty ------------------------------------------------------------------------------

    function getMaterialProperty(nodeID, propertyName, propertyValue) {

        var node = this.state.nodes[nodeID];
        var value = undefined;
        var txtr, mat, obj;

        switch (propertyName) {
            case "texture":
                {
                    if (node.glgeMaterial && node.glgeMaterial.textures) {
                        txtr = node.glgeMaterial.textures[0];
                    } else if (node.glgeObject && node.glgeObject.material) {
                        txtr = node.glgeObject.material.textures[0];
                    }

                    if (txtr) {
                        value = txtr.getSrc();
                    }
                }
                break;
            case "color":
                if (mat) {
                    obj = mat.getColor();
                    value = obj.a ? [obj.r * 255, obj.b * 255, obj.g * 255, obj.a * 255] : [obj.r * 255, obj.b * 255, obj.g * 255];
                }
                break;
            case "ambient":
                if (mat) {
                    obj = mat.getAmbient();
                    value = obj.a ? [obj.r * 255, obj.b * 255, obj.g * 255, obj.a * 255] : [obj.r * 255, obj.b * 255, obj.g * 255];
                }
                break;
            case "specColor":
                if (mat) {
                    obj = mat.getSpecularColor();
                    value = obj.a ? [obj.r * 255, obj.b * 255, obj.g * 255, obj.a * 255] : [obj.r * 255, obj.b * 255, obj.g * 255];
                }
                break;
            case "shininess":
                if (mat) {
                    value = mat.getShininess();
                }
                break;
            case "reflect":
                if (mat) {
                    value = mat.getReflectivity();
                }
                break;
            case "specular":
                if (mat) {
                    value = mat.getSpecular();
                }
                break;
            case "emit":
                if (mat) {
                    value = mat.getEmit();
                }
                break;
            case "alpha":
                if (mat) {
                    value = mat.getAlpha();
                }
                break;
            case "binaryAlpha":
                if (mat) {
                    value = mat.getBinaryAlpha();
                }
                break;
        }

        return value;
    }

    // -- getLightProperty ------------------------------------------------------------------------------

    function getLightProperty(nodeID, propertyName, propertyValue) {

        var value = undefined;
        var node = this.state.nodes[nodeID];
        var temp;

        switch (propertyName) {

            case "lightType":
                switch (node.glgeObject.getType()) {
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

            case "diffuse":
                value = node.glgeObject.diffuse; // no getDiffuse() in GLGE 0.7
                break;

            case "specular":
                value = node.glgeObject.specular; // no getSpecular() in GLGE 0.7
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
        switch (propertyName) {
            case "cameraType":
                switch (node.glgeObject.getType()) {
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

    function findGlgeObject(objName, type) {

        var obj = undefined;
        var assetObj = undefined;
        var glgeObjName = "";

        for (var key in GLGE.Assets.assets) {
            assetObj = GLGE.Assets.assets[key];
            if (assetObj) {
                glgeObjName = name(assetObj);
                if (glgeObjName == objName) {
                    switch (type) {
                        case "http-vwf-example-com-mesh-vwf":
                            if (assetObj.constructor == GLGE.Object)
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-node3-vwf":
                            if ((assetObj.constructor == GLGE.Group) || (assetObj.constructor == GLGE.Object))
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-light-vwf":
                            if (assetObj.constructor == GLGE.Light)
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-camera-vwf":
                            if (assetObj.constructor == GLGE.Camera)
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-scene-vwf":
                            if (assetObj.constructor == GLGE.Scene)
                                obj = assetObj;
                            break;
                        case "http-vwf-example-com-particleSystem-vwf":
                            if (assetObj.constructor == GLGE.ParticleSystem)
                                obj = assetObj;
                            break;
                    }
                    if (obj) break;
                }
            }
        }

        return obj;

    }

    // -- setActiveCamera ------------------------------------------------------------------------------

    function setActiveCamera(sceneNode, cameraID) {

        if (this.state.nodes[cameraID]) {
            var glgeCamera = this.state.nodes[cameraID].glgeObject;
            if (glgeCamera) {
                var canvas = document.getElementById(this.state.sceneRootID);
                glgeCamera.setAspect(canvas.width / canvas.height);
                this.state.cameraInUse = glgeCamera;
                this.state.cameraInUseID = cameraID;
                sceneNode.glgeScene.setCamera(glgeCamera);
                sceneNode.camera.ID = cameraID;
            }
        }

    }

    // -- createLight ------------------------------------------------------------------------------

    function createLight(nodeID, childID, childName) {

        var child = this.state.nodes[childID];
        if (child) {
            child.glgeObject = new GLGE.Light();
            child.glgeObject.name = childName;
            child.name = childName;
            child.uid = child.glgeObject.uid;
            child.glgeObject.vwfID = childID;
            addGlgeChild.call(this, nodeID, childID);
        }

    }

    // -- createCamera ------------------------------------------------------------------------------

    function createCamera(nodeID, childID, childName) {

        var sceneNode = this.state.scenes[nodeID];
        if (sceneNode) {
            var child = this.state.nodes[childID];
            if (child) {
                var cam;

                if (sceneNode.camera && sceneNode.camera.glgeCameras) {
                    if (!sceneNode.camera.glgeCameras[childID]) {
                        cam = new GLGE.Camera();
                        initCamera.call(this, cam);
                        sceneNode.camera.glgeCameras[childID] = cam;
                    } else {
                        cam = sceneNode.camera.glgeCameras[childID];
                    }

                    var glgeParent = parent.glgeObject;
                    if (glgeParent && (glgeParent instanceof GLGE.Scene || glgeParent instanceof GLGE.Group)) {
                        glgeParent.addObject(cam);
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

    function createParticleSystem(nodeID, childID, childName) {
        var glgeParent = undefined;
        var parentNode = this.state.nodes[nodeID];
        if (parentNode && parentNode.glgeObject && parentNode.glgeObject.getChildren) {
            glgeParent = parentNode.glgeObject;
        }
        if (!glgeParent) {
            parentNode = this.state.scenes[this.state.sceneRootID];
            glgeParent = parentNode.glgeScene;
        }
        if (glgeParent) {
            var ps = new GLGE.ParticleSystem();
            ps.vwfID = childID;
            this.state.nodes[childID].glgeObject = ps;
            glgeParent.addObject(ps);
        }
    }

    // -- initCamera ------------------------------------------------------------------------------

    function initCamera(glgeCamera) {

        if (glgeCamera) {
            glgeCamera.setLoc(0, 0, 0);
            glgeCamera.setRot(Math.PI / 2, 0, 0); // rotate to look at +Y, VWF's default orientation
            glgeCamera.setType(GLGE.C_PERSPECTIVE);
            glgeCamera.setRotOrder(GLGE.ROT_XZY);
        }

    }

    // -- getLocalBoundingBox ------------------------------------------------------------------------------

    function getLocalBoundingBox(glgeObject) {

        var bBox = {
            xMin: Number.MAX_VALUE,
            xMax: Number.MIN_VALUE,
            yMin: Number.MAX_VALUE,
            yMax: Number.MIN_VALUE,
            zMin: Number.MAX_VALUE,
            zMax: Number.MIN_VALUE
        };

        var glgeObjectList = [];
        findAllGlgeObjects.call(this, glgeObject, glgeObjectList);

        for (var j = 0; j < glgeObjectList.length; j++) {
            var vertices = getMeshVertices.call(this, glgeObjectList[j]);
            for (var i = 0; i < vertices.length; i++) {
                if (vertices[i][0] < bBox.xMin)
                    bBox.xMin = vertices[i][0];
                if (vertices[i][0] > bBox.xMax)
                    bBox.xMax = vertices[i][0];
                if (vertices[i][1] < bBox.yMin)
                    bBox.yMin = vertices[i][1];
                if (vertices[i][1] > bBox.yMax)
                    bBox.yMax = vertices[i][1];
                if (vertices[i][2] < bBox.zMin)
                    bBox.zMin = vertices[i][2];
                if (vertices[i][2] > bBox.zMax)
                    bBox.zMax = vertices[i][2];
            }
        }

        return bBox;

    }

    // -- getCenterOffset ------------------------------------------------------------------------------

    function getCenterOffset(glgeObject) {

        var offset = [0, 0, 0];
        if (glgeObject) {
            var bBox = getLocalBoundingBox.call(this, glgeObject)
            offset[0] = (bBox.xMax + bBox.xMin) * 0.50;
            offset[1] = (bBox.yMax + bBox.yMin) * 0.50;
            offset[2] = (bBox.zMax + bBox.zMin) * 0.50;
        }
        return offset;

    }

    // -- getNodeVertices ------------------------------------------------------------------------------

    function getNodeVertices(nodeID) {

        if (this.state.nodes[nodeID]) {
            return getMeshVertices.call(this, this.state.nodes[nodeID]);
        }
        return undefined;

    }

    // -- getMeshVertices ------------------------------------------------------------------------------

    function getMeshVertices(glgeObject) {

        var vertices = [];
        var glgeMesh;
        if (glgeObject) {
            if (glgeObject.getChildren && !glgeObject.getMesh) {
                var objects = [];
                findAllGlgeObjects.call(this, glgeObject, objects);
                for (var j = 0; j < objects.length; j++) {
                    if (objects[j].getMesh) {
                        var pos = objects[j].getMesh().positions;
                        if (pos) {
                            for (var i = 0; i < pos.length; i = i + 3) {
                                vertices.push([pos[i], pos[i + 1], pos[i + 2]]);
                            }
                        }
                    }
                }
            } else if (glgeObject.getMesh && glgeObject.getMesh()) {
                glgeMesh = glgeObject.getMesh();
            } else if (glgeObject.constructor == GLGE.Mesh) {
                glgeMesh = glgeObject;
            }

            if (glgeMesh) {
                var pos = glgeMesh.positions;
                if (pos) {
                    for (var i = 0; i < pos.length; i = i + 3) {
                        vertices.push([pos[i], pos[i + 1], pos[i + 2]]);
                    }
                }
            }
        }
        return vertices;

    }

    // -- getNodeVertexIndices ------------------------------------------------------------------------------

    function getNodeVertexIndices(nodeID) {

        if (this.state.nodes[nodeID]) {
            return getMeshVertexIndices.call(this, this.state.nodes[nodeID]);
        }
        return undefined;

    }

    // -- findAllGlgeObjects ------------------------------------------------------------------------------

    function findAllGlgeObjects(glgeNode, objList) {

        if (glgeNode) {
            if (glgeNode.constructor == GLGE.Object)
                objList.push(glgeNode);

            if (glgeNode.getChildren) {
                var nodeChildren = glgeNode.getChildren();
                for (var i = 0; i < nodeChildren.length; i++) {
                    findAllGlgeObjects.call(this, nodeChildren[i], objList);
                }
            }
        }

    }

    // -- findAllMeshes ------------------------------------------------------------------------------

    function findAllMeshes(glgeNode) {

        var meshes = [];
        var objs = [];
        findAllGlgeObjects.call(this, glgeNode, objs);
        for (var i = 0; i < objs.length; i++) {
            if (objs[i].getMesh && objs[i].getMesh()) {
                meshes.push(objs[i].getMesh());
            }
        }
        return meshes;

    }

    // -- getObjectID ------------------------------------------------------------------------------

    function getObjectID(objectToLookFor, bubbleUp, debug) {

        var objectIDFound = -1;

        while (objectIDFound == -1 && objectToLookFor) {
            if (debug) {
                this.logger.info("====>>>  vwf.model-glge.mousePick: searching for: " + path(objectToLookFor));
            }
            jQuery.each(this.state.nodes, function(nodeID, node) {
                if (node.glgeObject == objectToLookFor && !node.glgeMaterial) {
                    if (debug) {
                        this.logger.info("pick object name: " + name(objectToLookFor) + " with id = " + nodeID);
                    }
                    objectIDFound = nodeID;
                }
            });
            if (bubbleUp) {
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


    function getMeshVertexIndices(glgeObject) {
        var vertexIndices = [];
        var mesh;
        if (glgeObject) {
            if (glgeObject.getMesh && glgeObject.getMesh()) {
                mesh = glgeObject.getMesh();
            } else if (glgeObject.constructor == GLGE.Mesh) {
                mesh = glgeObject;
            }

            if (mesh && mesh.faces) {
                var faces = mesh.faces.data;
                if (faces) {
                    for (var i = 0; i < faces.length; i = i + 3) {
                        vertexIndices.push([faces[i], faces[i + 1], faces[i + 2]]);
                    }
                }
            }
        }

        return vertexIndices;
    }

    function loadComplete() {
        var itemsToDelete = [];
        for (var id in this.delayedProperties) {
            if (this.state.nodes[id]) {
                var props = this.delayedProperties[id];
                for (var propertyName in props) {
                    Object.getPrototypeOf(this).settingProperty.call(this, id, propertyName, props[propertyName]);
                }
                itemsToDelete.push(id);
            }
        }

        for (var i = 0; i < itemsToDelete.length; i++) {
            delete this.delayedProperties[itemsToDelete[i]];
        }
    }

    // get the list of types this ID extends

    function getPrototypes(kernel, extendsID) {
        var prototypes = [];
        var id = extendsID;

        while (id !== undefined) {
            prototypes.push(id);
            id = kernel.prototype(id);
        }

        return prototypes;
    }

    function isGlgeSceneDefinition(prototypes) {
        var foundGlge = false;
        if (prototypes) {
            for (var i = 0; i < prototypes.length && !foundGlge; i++) {
                foundGlge = (prototypes[i] == "http-vwf-example-com-navscene-vwf");
            }
        }

        return foundGlge;
    }

    function isGlgeNodeDefinition(prototypes) {
        var foundGlge = false;
        if (prototypes) {
            for (var i = 0; i < prototypes.length && !foundGlge; i++) {
                foundGlge = (prototypes[i] == "http-vwf-example-com-node3-vwf");
            }
        }

        return foundGlge;
    }

    function isGlgeCameraDefinition(prototypes) {
        var foundGlge = false;
        if (prototypes) {
            for (var i = 0; i < prototypes.length && !foundGlge; i++) {
                foundGlge = (prototypes[i] == "http-vwf-example-com-camera-vwf");
            }
        }

        return foundGlge;
    }

    function isGlgeLightDefinition(prototypes) {
        var foundGlge = false;
        if (prototypes) {
            for (var i = 0; i < prototypes.length && !foundGlge; i++) {
                foundGlge = (prototypes[i] == "http-vwf-example-com-light-vwf");
            }
        }

        return foundGlge;
    }

    function isGlgeParticleSystemDefinition(prototypes) {
        var foundGlge = false;
        if (prototypes) {
            for (var i = 0; i < prototypes.length && !foundGlge; i++) {
                foundGlge = (prototypes[i] == "http-vwf-example-com-particlesystem-vwf");
            }
        }

        return foundGlge;
    }

    function isGlgeMaterialDefinition(prototypes) {
        var foundGlge = false;
        if (prototypes) {
            for (var i = 0; i < prototypes.length && !foundGlge; i++) {
                foundGlge = (prototypes[i] == "http-vwf-example-com-material-vwf");
            }
        }

        return foundGlge;
    }
    // Search a GLGE.Scene for a child with the given name.

    function glgeSceneChild(glgeScene, childName) {

        var childToReturn = jQuery.grep(glgeScene.children || [], function(glgeChild) {
            return (glgeChild.name || glgeChild.id || glgeChild.sourceURL || "") == childName;
        }).shift();

        //this.logger.info("      glgeSceneChild( " + childName + " ) returns " + childToReturn);
        return childToReturn;

    }


    function restoreObject(node) {
        if (!node)
            return;

        if (node.originalPositions)
            node.setPositions(node.originalPositions.slice(0));
        if (node.originalNormals)
            node.setNormals(node.originalNormals.slice(0));
        if (node.originalFaces)
            node.setFaces(node.originalFaces.slice(0));
        if (node.originalUV1)
            node.setUV(node.originalUV1.slice(0));
        if (node.originalUV2)
            node.setUV2(node.originalUV2.slice(0));
        if (node.backupMatrix)
            node.setStaticMatrix(node.backupMatrix);
        if (node.originalMaterial)
            node.setMaterial(node.originalMaterial);

        delete node.initializedFromAsset;
        delete node.vwfID;
        delete node.originalPositions;
        delete node.originalNormals;
        delete node.originalFaces;
        delete node.originalUV1;
        delete node.originalUV2;
        delete node.originalMaterial;
        delete node.backupMatrix;

        if (node.getMesh && node.getMesh())
            restoreObject(node.getMesh());
        if (node.children) {
            for (var i = 0; i < node.children.length; i++)
                restoreObject(node.children[i]);
        }
    }

    // Search a GLGE.Object, GLGE.Collada, GLGE.Light for a child with the given name.  TODO: really, it's anything with children[]; could be the same as glgeSceneChild().
    function findChildByName(glgeChild, childName) {
        if ((glgeChild.colladaName || glgeChild.colladaId || glgeChild.name || glgeChild.id || "") == childName)
            return glgeChild;
        var found = null;
        if (glgeChild && glgeChild.children)
            for (var i = 0; i < glgeChild.children.length; i++) {
                var temp = findChildByName(glgeChild.children[i], childName);
                if (temp) {
                    found = temp;
                    break;
                }
            }
        return found;
    }

    function glgeObjectChild(glgeObject, childName, childType) {

        var childToReturn = jQuery.grep(glgeObject.children || [], function(glgeChild) {
            return (glgeChild.colladaName || glgeChild.colladaId || glgeChild.name || glgeChild.id || "") == childName;
        }).shift();

        //childToReturn = findChildByName(glgeObject,childName);

        if (!childToReturn) {
            childToReturn = findGlgeObject.call(this, childName, childType);
        }
        //this.logger.info("      glgeObjectChild( " + childName + " ) returns " + childToReturn);
        return childToReturn;

    }

    function findMaterial(parentID, materialName, materialNode) {

        var materialStringIndex, materialIndex, childName;
        var parentNode = this.state.nodes[parentID];

        // the material name is a combination of the following information
        // groupParentName + 'Material' + indexOfTheMultiMaterial

        if (parentNode) {
            if (parentNode.glgeObject) {
                if (parentNode.glgeObject.constructor == GLGE.Object) {
                    if (materialName == "material") {
                        materialNode.glgeObject = parentNode.glgeObject;
                        materialNode.glgeMaterial = materialNode.glgeObject.material;
                    }
                } else {
                    materialStringIndex = materialName.lastIndexOf("Material");
                    materialIndex = Number(materialName.substr(materialStringIndex + 8)) - 1;
                    childName = materialName.substr(0, materialStringIndex);
                    var glgeObjs = [];
                    var found = false;

                    findAllGlgeObjects.call(this, parentNode.glgeObject, glgeObjs);

                    if (glgeObjs && glgeObjs.length) {
                        for (var i = 0; i < glgeObjs.length && !found; i++) {
                            if (name(glgeObjs[i].parent) == childName) {
                                materialNode.glgeObject = glgeObjs[i];
                                materialNode.glgeMaterial = glgeObjs[i].getMaterial(materialIndex);
                                found = true;
                            }
                        }
                    } else if (parentNode.glgeObject.children.length == 1 && parentNode.glgeObject.children[0].constructor == GLGE.Object) {

                        var glgeChild = parentNode.glgeObject.children[0];
                        materialNode.glgeObject = glgeChild;
                        materialNode.glgeMaterial = glgeChild.getMaterial(materialIndex);

                        if (!(materialNode.glgeMaterial) && (childNode.glgeObject)) {
                            materialNode.glgeMaterial = childNode.glgeObject.material;
                        }
                    }
                }
            }
        }

    }

    function findMesh(parentID, meshName, meshNode) {

        var materialStringIndex, materialIndex, childName;
        var parentNode = this.state.nodes[parentID];

        // the material name is a combination of the following information
        // groupParentName + 'Material' + indexOfTheMultiMaterial

        if (parentNode) {
            materialStringIndex = materialName.lastIndexOf("Material");
            materialIndex = Number(materialName.substr(materialStringIndex + 8)) - 1;
            childName = materialName.substr(0, materialStringIndex);

            if (parentNode.glgeObject) {
                var glgeObjs = [];
                var found = false;

                findAllGlgeObjects.call(this, parentNode.glgeObject, glgeObjs);

                if (glgeObjs && glgeObjs.length) {
                    for (var i = 0; i < glgeObjs.length && !found; i++) {
                        if (name(glgeObjs[i].parent) == childName) {
                            materialNode.glgeObject = glgeObjs[i];
                            materialNode.glgeMaterial = glgeObjs[i].getMaterial(materialIndex);
                            found = true;
                        }
                    }
                } else if (parentNode.glgeObject.children.length == 1 && parentNode.glgeObject.children[0].constructor == GLGE.Object) {

                    var glgeChild = parentNode.glgeObject.children[0];
                    materialNode.glgeObject = glgeChild;
                    materialNode.glgeMaterial = glgeChild.getMaterial(materialIndex);

                    if (!(materialNode.glgeMaterial) && (childNode.glgeObject)) {
                        materialNode.glgeMaterial = childNode.glgeObject.material;
                    }
                }
            }
        }

    }

    function createMesh(def, node) {
        if (!node.glgeParent) {
            node.glgeParent = this.state.nodes[node.parentID];
        }

        if (node.glgeParent) {
            node.glgeObject = new GLGE.Group();
            node.glgeParent.addObject(node.glgeObject);
            var obj = new GLGE.Object();
            var mat = new GLGE.Material();
            var mesh = new GLGE.Mesh();

            if (def.color) {
                mat.setColor(def.color);
            }
            obj.setMaterial(mat);

            if (def.positions)
                mesh.setPositions(def.positions);
            if (def.normals)
                mesh.setNormals(def.normals);
            if (def.uv1)
                mesh.setUV(def.uv1);
            if (def.faces)
                mesh.setFaces(def.faces);

            obj.setMesh(mesh);
            node.glgeObject.addObject(obj);
        }
    }

    function addGlgeChild(parentID, childID) {

        var glgeParent;
        var parent = this.state.nodes[parentID];
        if (!parent && this.state.scenes[parentID]) {
            parent = this.state.scenes[parentID];
            glgeParent = parent.glgeScene;
        } else {
            glgeParent = parent.glgeObject;
        }

        if (glgeParent && this.state.nodes[childID]) {
            var child = this.state.nodes[childID];

            if (child.glgeObject) {
                glgeParent.addChild(child.glgeObject);
            }
        }
    }


});



function DecodeARRAY_BUFFER(str, range, inmin, stride, bits) {
    str = blobarray[str];
    var attribs_out = []; //new Float32Array(str.length);
    //min = min + 0.0;
    var prev = [0, 0, 0];
    var divisor = Math.pow(2, bits);
    for (var i = 5; i < str.length - 5; i += stride) {

        for (var j = 0; j < stride; j++) {
            var code = str.charCodeAt(i + j);
            var dezigzag = (Number(code) >> 1) ^ (-(Number(code) & 1));
            prev[j] += dezigzag;
            var prev_attrib = ((prev[j] / divisor) * (range)) + Number(inmin); //(code >> 1) ^ (-(code & 1));
            attribs_out.push(prev_attrib);
        }
    }

    return attribs_out;
}
var debugarraytype = "";

function DecodeELEMENT_ARRAY_BUFFER(str, range) {

    str = blobarray[str];
    var attribs_out = []; //new Uint16Array(str.length);
    var prev = 0;
    for (var i = 5; i < str.length - 5; i++) {

        var code = str.charCodeAt(i);
        var dezigzag = (code >> 1) ^ (-(code & 1));;
        prev += dezigzag;
        // alert("char code " +code + " dezigzag " + dezigzag + " new value " + prev);
        attribs_out.push(prev);

    }

    return attribs_out;
}

function DecodeArray(array, key) {
    var type = array.type;
    var array2 = [];
    var itemsize = array.itemSize;

    if (type == "ELEMENT_ARRAY_BUFFER")
        array2 = DecodeELEMENT_ARRAY_BUFFER(array.elements.values, array.elements.range);
    if (type == "ARRAY_BUFFER")
        array2 = DecodeARRAY_BUFFER(array.elements.values, array.elements.range, array.elements.min, itemsize, array.elements.bits);

    return array2;
}

var JSONNode = function(node, callback) {
    var self = this;
    this.url = node.source;
    this.callback = callback;
    this.children = [];
    this.texture_load_callback = function(texturename) {
        if (!texturename)
            return null;
        var src = "";
        if (this.url.toLowerCase().indexOf('3dr_federation') != -1)
            src = this.url.substr(0, this.url.indexOf("Model/")) + "textures/NoRedirect/" + encodeURIComponent(texturename) + "?ID=00-00-00";
        else {
            src = this.url.substr(0, this.url.indexOf("Model/")) + "textures/" + encodeURIComponent(texturename) + "?ID=00-00-00";
        }

        src = src.replace("AnonymousUser:@", "");
        var tex = new GLGE.Texture();
        tex.setSrc(src);
        return tex;
    }
    this.jsonLoaded = function(e) {
        var test = 1 + 1;

        var jsonData = JSON.parse(decompress(e));

        var mesh = ParseSceneGraph(jsonData, this.texture_load_callback.bind(this));
        this.addChild(mesh);
        //GLGE.MeshCache.cacheMesh(this.url,jsonData);
        if (this.callback)
            this.callback(this);
    }.bind(this);

    this.error = function(e) {
        console.log("Error loading model: " + e.responseText);
        if (this.callback)
            this.callback(this);
    }.bind(this);


    // var cachedchild = GLGE.MeshCache.getMesh(this.url);
    // if(cachedchild && false)
    // {	
    // var mesh = ParseSceneGraph(cachedchild,this.texture_load_callback.bind(this));
    // this.addChild(mesh);
    // if(this.callback)
    // this.callback(this);
    // }
    // else
    {
        $.ajax({
            url: this.url,
            data: {},
            success: this.jsonLoaded,
            error: this.error,
            dataType: 'text',
            async: true
        });

    }

}

GLGE.augment(GLGE.Group, JSONNode);

function BuildJSON_GLGE_Node(node, callback) {
    return new JSONNode(node, callback);
}

function toColor(arr) {
    var color = {};
    color.r = arr[0];
    color.g = arr[1];
    color.b = arr[2];
    color.a = arr[3];
    return color;
}

function ApplyMaterial(newnode, newmaterial) {
    if (newnode.setMaterial)
        newnode.setMaterial(newmaterial);
    else if (newnode.children) {
        for (var i = 0; i < newnode.children.length; i++)
            ApplyMaterial(newnode.children[0], newmaterial);
    }
}

function isIdentityMatrix(matrix) {

    if (matrix == null)
        return true;
    if (
        matrix[0] == 1 &&
        matrix[1] == 0 &&
        matrix[2] == 0 &&
        matrix[3] == 0 &&
        matrix[4] == 0 &&
        matrix[5] == 1 &&
        matrix[6] == 0 &&
        matrix[7] == 0 &&
        matrix[8] == 0 &&
        matrix[9] == 0 &&
        matrix[10] == 1 &&
        matrix[11] == 0 &&
        matrix[12] == 0 &&
        matrix[13] == 0 &&
        matrix[14] == 0 &&
        matrix[15] == 1)
        return true;
    return false;
}

function ParseSceneGraph(node, texture_load_callback) {

    var newnode;
    //its geometry
    if (node.primitives) {
        newnode = new GLGE.Object();
        var mesh = new GLGE.Mesh();

        //vertex data
        if (node.attributes) {
            jQuery.each(node.attributes, function(key, element) {
                debugarraytype = key;
                var attributeArray = node.attributes[key];
                node.attributes[key] = DecodeArray(attributeArray, key);
                if (key == "Vertex")
                    mesh.setPositions(node.attributes[key]);
                if (key == "Normal")
                    mesh.setNormals(node.attributes[key]);
                if (key == "TexCoord0")
                    mesh.setUV(node.attributes[key]);
                if (key == "TexCoord1")
                    mesh.setUV2(node.attributes[key]);
                if (key == "VertexColor")
                    mesh.setVertexColors(node.attributes[key]);
                if (key == "Tangent")
                    mesh.setTangents(node.attributes[key]);
            });
        }

        var i;
        for (i in node.primitives) {

            if (node.primitives[i].indices) {
                var array = node.primitives[i].indices;
                array = DecodeArray(array);

                mesh.setFaces(array);
            } else {
                mode = gl[mode];
                var first = node.primitives[i].first;
                var count = node.primitives[i].count;
                if (count > 65535)
                    count = 32740;
                //node.primitives[i] = new osg.DrawArrays(mode, first, count);
            }
        }
        newnode.setMesh(mesh);
    }
    var newmaterial = null;
    if (node.stateset) {
        newmaterial = new GLGE.Material();
        if (node.stateset.textures) {
            var textures = node.stateset.textures;
            for (var t = 0, tl = textures.length; t < tl; t++) {
                if (textures[t] === undefined) {
                    continue;
                }
                if (!textures[t].file) {
                    if (console !== undefined) {
                        console.log("no 'file' field for texture " + textures[t]);
                    }
                }

                var tex;
                if (texture_load_callback)
                    tex = texture_load_callback(textures[t].file);
                else {
                    tex = new GLGE.Texture();

                    tex.setSrc(textures[t].file);

                }
                if (tex) {
                    newmaterial.addTexture(tex);
                    var layer = new GLGE.MaterialLayer();
                    layer.setBlendMode(0);
                    layer.setMapinput(0);
                    layer.setMapto(1);
                    layer.setTexture(tex);
                    newmaterial.addMaterialLayer(layer);
                }
            }
        }
        if (node.stateset.material) {
            newmaterial.setAmbient(toColor(node.stateset.material.ambient));
            newmaterial.setColor(toColor(node.stateset.material.diffuse));

            newmaterial.setShininess(node.stateset.material.shininess);
            newmaterial.setSpecularColor(toColor(node.stateset.material.specular));
        }

    }



    if (node.matrix) {

        if (newnode == null)
            newnode = new GLGE.Group();
        var matrix = [];
        for (var i = 0; i < node.matrix.length; i++)
            matrix.push(node.matrix[i]);
        var glmat = GLGE.Mat4(matrix);
        glmat = GLGE.transposeMat4(glmat);


        var mat = GLGE.Mat4([glmat[0], glmat[1], glmat[2], 0,
            glmat[4], glmat[5], glmat[6], 0,
            glmat[8], glmat[9], glmat[10], 0,
            0, 0, 0, 1
        ]);

        newnode.setRotMatrix(mat);
        newnode.setLoc(glmat[3], glmat[7], glmat[11]);
    }

    if (node.children) {
        if (newnode == null)
            newnode = new GLGE.Group();
        for (var child = 0; child < node.children.length; child++) {
            var childnode = ParseSceneGraph(node.children[child], texture_load_callback);
            if (childnode)
                newnode.addChild(childnode);
        }
    }

    var cachedMaterial = GLGE.MaterialManager.findDupeRecord(newmaterial);
    if (cachedMaterial) {
        newmaterial = cachedMaterial;
    }
    if (newnode && newmaterial)
        ApplyMaterial(newnode, newmaterial);

    if (node.name && newnode)
        newnode.name = node.name;
    //optimization for deep trees that have no need for the depth	
    if (newnode && newnode.children && newnode.children.length == 1 && isIdentityMatrix(newnode.getLocalMatrix()))
        return newnode.children[0];
    return newnode;
}
var blobsfound = 0;
var blobarray = [];

function DecompressStrings(data, replace, find) {
    var reg = new RegExp(find, 'g');
    return data.replace(reg, replace);
}

function decompressJsonStrings(data) {
    data = DecompressStrings(data, "\"min\":", "min:");
    data = DecompressStrings(data, "\"max\":", "max:");
    data = DecompressStrings(data, "\"stateset\":", "ss:");
    data = DecompressStrings(data, "\"LINE_LOOP\"", "\"LL\"");
    data = DecompressStrings(data, "\"LINEAR\"", "\"L\"");
    data = DecompressStrings(data, "\"LINEAR_MIPMAP_LINEAR\"", "\"LML\"");
    data = DecompressStrings(data, "\"LINEAR_MIPMAP_NEAREST\"", "\"LMN\"");
    data = DecompressStrings(data, "\"NEAREST\"", "\"NE\"");
    data = DecompressStrings(data, "\"NEAREST_MIPMAP_LINEAR\"", "\"NML\"");
    data = DecompressStrings(data, "\"NEAREST_MIPMAP_NEAREST\"", "\"NMN\"");
    data = DecompressStrings(data, "\"mag_filter\":", "maf:");
    data = DecompressStrings(data, "\"min_filter\":", "mif:");
    data = DecompressStrings(data, "\"file\":", "f:");
    data = DecompressStrings(data, "\"name\":", "n:");
    data = DecompressStrings(data, "\"ambient\":", "a:");
    data = DecompressStrings(data, "\"diffuse\":", "d:");
    data = DecompressStrings(data, "\"specular\":", "s:");
    data = DecompressStrings(data, "\"emission\":", "e:");
    data = DecompressStrings(data, "\"shininess\":", "sh:");
    data = DecompressStrings(data, "\"textures\":", "t:");
    data = DecompressStrings(data, "\"material\":", "m:");
    data = DecompressStrings(data, "\"POINTS\"", "\"P\"");
    data = DecompressStrings(data, "\"LINES\"", "\"LI\"");

    data = DecompressStrings(data, "\"LINE_STRIP\"", "\"LS\"");
    data = DecompressStrings(data, "\"TRIANGLES\"", "\"T\"");
    data = DecompressStrings(data, "\"TRIANGLE_FAN\"", "\"TF\"");
    data = DecompressStrings(data, "\"TRIANGLE_STRIP\"", "\"TS\"");
    data = DecompressStrings(data, "\"first\":", "fi:");
    data = DecompressStrings(data, "\"count\":", "co:");
    data = DecompressStrings(data, "\"mode\":", "mo:");
    data = DecompressStrings(data, "\"undefined\":", "u:");
    data = DecompressStrings(data, "\"children\":", "c:");
    data = DecompressStrings(data, "\"range\":", "r:");
    data = DecompressStrings(data, "\"bits\":", "b:");
    data = DecompressStrings(data, "\"values\":", "v:");
    data = DecompressStrings(data, "\"elements\":", "el:");
    data = DecompressStrings(data, "\"itemSize\":", "iS:");
    data = DecompressStrings(data, "\"type\":", "ty:");
    data = DecompressStrings(data, "\"ARRAY_BUFFER\"", "\"AB\"");
    data = DecompressStrings(data, "\"ELEMENT_ARRAY_BUFFER\"", "\"EAB\"");
    data = DecompressStrings(data, "\"indices\":", "i:");
    data = DecompressStrings(data, "\"Vertex\":", "V:");
    data = DecompressStrings(data, "\"Normal\":", "N:");
    data = DecompressStrings(data, "\"TexCoord0\":", "T0:");
    data = DecompressStrings(data, "\"TexCoord1\":", "T1:");
    data = DecompressStrings(data, "\"TexCoord2\":", "T2:");
    data = DecompressStrings(data, "\"TexCoord3\":", "T3:");
    data = DecompressStrings(data, "\"TexCoord4\":", "T4:");
    data = DecompressStrings(data, "\"attributes\":", "A:");
    data = DecompressStrings(data, "\"primitives\":", "p:");
    data = DecompressStrings(data, "\"projection\":", "pr:");
    data = DecompressStrings(data, "\"matrix\":", "M:");
    data = DecompressStrings(data, "\"Color\":", "COL:");
    data = DecompressStrings(data, "\\", "/");
    return data;
}

function decompress(dataencoded) {
    blobsfound = 0;
    blobarray = [];

    var regex = new RegExp('\u7FFF\u7FFE\u7FFF\u7FFE\u7FFF[\\S\\s]*?\u7FFE\u7FFF\u7FFE\u7FFF\u7FFE', 'igm');
    blobarray = dataencoded.match(regex);
    var data = dataencoded.replace(regex, function(match) {
        return "\"" + (blobsfound++) + "\"";
    });
    data = decompressJsonStrings(data);
    return data;
}
$(document.head).append('<script type="text/javascript" src="vwf/adl/view/editorview/_GLGERayTracer.js"></script>');