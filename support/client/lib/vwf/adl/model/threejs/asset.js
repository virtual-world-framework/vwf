(function() {
    function asset(childID, childSource, childName, childType, assetSource, asyncCallback, assetRegistry) {


        //asyncCallback(false);

        //handle for wrapping the glTF animation format so animatable.js can read it
        function AnimationHandleWrapper(gltfAnimations) {
            this.duration = 0;
            this.glTFAnimations = gltfAnimations;
            for (var i in this.glTFAnimations) {
                this.duration = Math.max(this.duration, this.glTFAnimations[i].duration)
            }
            this.setKey = function(key) {
                for (var j in this.glTFAnimations) {
                    var i, len = this.glTFAnimations[j].interps.length;
                    for (i = 0; i < len; i++) {
                        this.glTFAnimations[j].interps[i].interp(key / 30);
                    }
                }

            }
            this.data = {
                length: this.duration,
                fps: 30
            };
        }

        this.inherits = ['vwf/model/threejs/transformable.js', 'vwf/model/threejs/materialDef.js', 'vwf/model/threejs/animatable.js', 'vwf/model/threejs/shadowcaster.js', 'vwf/model/threejs/passable.js', 'vwf/model/threejs/visible.js', 'vwf/model/threejs/static.js', 'vwf/model/threejs/selectable.js'];
        this.initializingNode = function() {

        }
        this.gettingProperty = function(propertyName) {


        }
        this.settingProperty = function(propertyName, propertyValue) {

        }
        this.gettingProperty = function(propertyName) {
            if (propertyName == 'materialDef') {

                if (this.materialDef == null) {

                    var list = [];
                    this.GetAllLeafMeshes(this.rootnode, list);
                    if (list[0])
                        return this.getDefForMaterial(list[0].material);
                    else return undefined;

                } else {
                    return this.materialDef;
                }
            }
        }
        //must be defined by the object
        this.getRoot = function() {
            return this.rootnode;
        }
        this.rootnode = new THREE.Object3D();

        //for the subNode case
        this.setAsset = function(asset) {
            if (asset) {

                this.initializedFromAsset = true;
                this.backupmats = [];
                this.backupMatrix = asset.matrix;
                //asset.matrix = asset.matrix.clone();
                this.rootnode = asset;
                this.rootnode = asset;
                asset.initializedFromAsset = true;
                var list = [];
                this.GetAllLeafMeshes(this.rootnode, list);
                for (var i = 0; i < list.length; i++) {
                    if (list[i].material) {
                        this.backupmats.push([list[i], list[i].material.clone()]);
                    }
                }
                asset.matrixAutoUpdate = false;
                asset.updateMatrixWorld(true);
                _SceneManager.setDirty(asset);

                this.settingProperty('transform', this.gettingProperty('transform'));

                if (asset instanceof THREE.Bone) {


                    for (var i in asset.children) {
                        if (asset.children[i].name == 'BoneSelectionHandle') {
                            asset.children[i].material.color.r = 1;
                        }
                    }
                }
            }
        }
        this.deletingNode = function() {

            if (this.initializedFromAsset) {

                delete this.rootnode.vwfID;
                //delete this.rootnode.initializedFromAsset;

                for (var i = 0; i < this.backupmats.length; i++) {

                    this.backupmats[i][0].material = this.backupmats[i][1];
                }
                this.rootnode.matrix = this.backupMatrix
                this.rootnode.updateMatrixWorld(true);

                //AHH be very careful - this is handled in the main driver, and if you do it here,
                //the main driver will not know that it was linked, and will delete the node
                //delete this.rootnode.initializedFromAsset;
                if (this.rootnode instanceof THREE.Bone) {

                    for (var i in this.rootnode.children) {
                        if (this.rootnode.children[i].name == 'BoneSelectionHandle') {
                            this.rootnode.children[i].material.color.r = .5;
                        }
                    }
                    //need to update root skin if changed transform of bone
                    var parent = this.rootnode.parent;
                    while (parent) {
                        if (parent instanceof THREE.SkinnedMesh) {
                            parent.updateMatrixWorld();
                            //since it makes no sense for a bone to effect the skin farther up the hierarchy
                            break;
                        }
                        parent = parent.parent
                    }
                }

            }
        }
        this.loadFailed = function(id) {


            //the collada loader uses the failed callback as progress. data means this is not really an error;
            if (!id) {
                if (window._Notifier) {
                    _Notifier.alert('error loading asset ' + this.assetSource);
                }
                //get the entry from the asset registry
                reg = this.assetRegistry[this.assetSource];
                $(document).trigger('EndParse');
                //it's not pending, and it is loaded
                reg.pending = false;
                reg.loaded = true;
                //store this asset in the registry
                reg.node = null;

                //if any callbacks were waiting on the asset, call those callbacks
                for (var i = 0; i < reg.callbacks.length; i++)
                    reg.callbacks[i](null);
                //nothing should be waiting on callbacks now.
                reg.callbacks = [];

                _ProgressBar.hide();
                asyncCallback(true);
            } else {

                //this is actuall a progress event!
                _ProgressBar.setProgress(id.loaded / id.total);
                _ProgressBar.setMessage(this.assetSource);
                _ProgressBar.show();


            }

        }
        this.GetAllLeafMeshes = function(threeObject, list) {
            if (threeObject instanceof THREE.Mesh) {
                list.push(threeObject);
                for (var i = 0; i < threeObject.children.length; i++) {
                    this.GetAllLeafMeshes(threeObject.children[i], list);
                }
            }
            if (threeObject.children) {
                for (var i = 0; i < threeObject.children.length; i++) {
                    this.GetAllLeafMeshes(threeObject.children[i], list);
                }
            }
        }
        this.removeLights = function(node) {
            if (node instanceof THREE.DirectionalLight ||
                node instanceof THREE.PointLight ||
                node instanceof THREE.SpotLight ||
                node instanceof THREE.AmbientLight) {
                node.parent.remove(node);
                return;
            }
            if (node && node.children) {
                for (var i = 0; i < node.children.length; i++)
                    this.removeLights(node.children[i]);
            }
        }
        this.cleanTHREEJSnodes = function(node) {
            var list = [];
            this.removeLights(node);
            this.GetAllLeafMeshes(node, list);
            for (var i = 0; i < list.length; i++) {
                list[i].geometry.dynamic = false;
                list[i].castShadow = _SettingsManager.getKey('shadows');
                list[i].receiveShadow = _SettingsManager.getKey('shadows');
                if (list[i].geometry instanceof THREE.BufferGeometry) continue;
                //humm, the below looks useful. Why is it removed?
                /*	if(list[i].material)
                 {
                 list[i].material = list[i].material.clone();
                 list[i].material.needsUpdate = true;
                 if(list[i].material.map)
                 {
                 list[i].material.map =  _SceneManager.getTexture(list[i].material.map._SMsrc || list[i].material.map.image.src);
                 list[i].material.map.needsUpdate = true;
                 }else
                 {
                 list[i].material.map =  _SceneManager.getTexture('white.png');
                 list[i].material.map.needsUpdate = true;
                 }
                 if(list[i].material.bumpMap)
                 {
                 list[i].material.bumpMap = _SceneManager.getTexture(list[i].material.map._SMsrc || list[i].material.map.image.src);
                 list[i].material.bumpMap.needsUpdate = true;
                 }
                 if(list[i].material.lightMap)
                 {
                 list[i].material.lightMap = _SceneManager.getTexture(list[i].material.map._SMsrc || list[i].material.map.image.src);
                 list[i].material.lightMap.needsUpdate = true;
                 }
                 if(list[i].material.normalMap)
                 {
                 list[i].material.normalMap = _SceneManager.getTexture(list[i].material.map._SMsrc || list[i].material.map.image.src);
                 list[i].material.normalMap.needsUpdate = true;
                 }

                 list[i].materialUpdated();
                 }else
                 {
                 list[i].material = new THREE.MeshPhongMaterial();
                 list[i].material.map =  _SceneManager.getTexture('white.png');
                 }
                 */

                //If the incomming mesh does not have UVs on channel one, fill with zeros.
                if (!list[i].geometry.faceVertexUvs[0] || list[i].geometry.faceVertexUvs[0].length == 0) {
                    list[i].geometry.faceVertexUvs[0] = [];
                    for (var k = 0; k < list[i].geometry.faces.length; k++) {
                        if (!list[i].geometry.faces[k].d)
                            list[i].geometry.faceVertexUvs[0].push([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
                        else
                            list[i].geometry.faceVertexUvs[0].push([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
                    }
                }

                //lets set all animations to frame 0
                if (list[i].animationHandle) {
                    list[i].animationHandle.setKey(this.animationFrame);
                    list[i].updateMatrixWorld();
                    //odd, does not seem to update matrix on first child bone. 
                    //how does the bone relate to the skeleton?
                    for (var j = 0; j < list[i].children.length; j++) {
                        list[i].children[j].updateMatrixWorld(true);
                    }
                }
            }
        }
        this.loaded = function(asset) {
            _ProgressBar.hide();
            if (!asset) {
                this.loadFailed();
                return;
            }

            $(document).trigger('EndParse', ['Loading...', assetSource]);


            //get the entry from the asset registry
            reg = this.assetRegistry[this.assetSource];
            //it's not pending, and it is loaded
            reg.pending = false;
            reg.loaded = true;

            //store this asset in the registry

            //actually, is this necessary? can we just store the raw loaded asset in the cache? 
            if (childType !== 'subDriver/threejs/asset/vnd.gltf+json')
                reg.node = asset.scene.clone();
            else {
                glTFCloner.clone(asset.scene, asset.rawAnimationChannels, function(clone) {
                    reg.node = clone;
                    reg.rawAnimationChannels = asset.rawAnimationChannels
                });
            }
            this.cleanTHREEJSnodes(reg.node);

            //you may be wondering why we are cloning again - this is so that the object in the scene is 
            //never the same object as in the cache
            var self = this;
            if (childType !== 'subDriver/threejs/asset/vnd.gltf+json')
                this.getRoot().add(reg.node.clone());
            else {
                glTFCloner.clone(asset.scene, asset.rawAnimationChannels, function(clone) {
                    self.getRoot().add(clone);
                    self.getRoot().GetBoundingBox();
                });
            }

            //set some defaults now that the mesh is loaded
            //the VWF should set some defaults as well
            this.settingProperty('materialDef', this.materialDef);
            this.settingProperty('animationFrame', 0);
            //if any callbacks were waiting on the asset, call those callbacks

            for (var i = 0; i < reg.callbacks.length; i++)
                reg.callbacks[i](asset.scene, asset.rawAnimationChannels);
            //nothing should be waiting on callbacks now.
            reg.callbacks = [];

            this.getRoot().GetBoundingBox();
            asyncCallback(true);



        }.bind(this);


        //if there is no asset source, perhaps because this linked to an existing node from a parent asset, just continue with loading
        if (!assetSource) {

            return;
        }



        this.assetRegistry = assetRegistry;
        this.assetSource = assetSource;

        // if there is no entry in the registry, create one
        if (!assetRegistry[assetSource]) {
            //its new, so not waiting, and not loaded
            assetRegistry[assetSource] = {};
            assetRegistry[assetSource].loaded = false;
            assetRegistry[assetSource].pending = false;
            assetRegistry[assetSource].callbacks = [];

            //see if it was preloaded
            if (childType == 'subDriver/threejs/asset/vnd.osgjs+json+compressed' && _assetLoader.getUtf8Json(assetSource)) {
                assetRegistry[assetSource].loaded = true;
                assetRegistry[assetSource].pending = false;
                assetRegistry[assetSource].node = _assetLoader.getUtf8Json(assetSource).scene;
                this.cleanTHREEJSnodes(assetRegistry[assetSource].node);
            }
            if (childType == 'subDriver/threejs/asset/vnd.osgjs+json+compressed+optimized' && _assetLoader.getUtf8JsonOptimized(assetSource)) {
                assetRegistry[assetSource].loaded = true;
                assetRegistry[assetSource].pending = false;
                assetRegistry[assetSource].node = _assetLoader.getUtf8JsonOptimized(assetSource).scene;
                this.cleanTHREEJSnodes(assetRegistry[assetSource].node);
            }
            if (childType == 'subDriver/threejs/asset/vnd.collada+xml' && _assetLoader.getCollada(assetSource)) {
                assetRegistry[assetSource].loaded = true;
                assetRegistry[assetSource].pending = false;
                assetRegistry[assetSource].node = _assetLoader.getCollada(assetSource).scene;
                this.cleanTHREEJSnodes(assetRegistry[assetSource].node);
            }
            if (childType == 'subDriver/threejs/asset/vnd.collada+xml+optimized' && _assetLoader.getColladaOptimized(assetSource)) {
                assetRegistry[assetSource].loaded = true;
                assetRegistry[assetSource].pending = false;
                assetRegistry[assetSource].node = _assetLoader.getColladaOptimized(assetSource).scene;
                this.cleanTHREEJSnodes(assetRegistry[assetSource].node);
            }
            if (childType == 'subDriver/threejs/asset/vnd.gltf+json' && _assetLoader.getglTF(assetSource)) {

                assetRegistry[assetSource].loaded = true;
                assetRegistry[assetSource].pending = false;
                assetRegistry[assetSource].node = _assetLoader.getglTF(assetSource).scene;
                assetRegistry[assetSource].animations = _assetLoader.getglTF(assetSource).animations;
                assetRegistry[assetSource].rawAnimationChannels = _assetLoader.getglTF(assetSource).rawAnimationChannels;
                this.cleanTHREEJSnodes(assetRegistry[assetSource].node);
            }
        }


        //grab the registry entry for this asset
        var reg = assetRegistry[assetSource];

        //if the asset entry is not loaded and not pending, you'll have to actaully go download and parse it
        if (reg.loaded == false && reg.pending == false) {


            //thus, it becomes pending
            reg.pending = true;
            asyncCallback(false);

            if (childType == 'subDriver/threejs/asset/vnd.collada+xml') {
                this.loader = new THREE.ColladaLoader();

                this.loader.load(assetSource, this.loaded.bind(this), this.loadFailed.bind(this));

                asyncCallback(false);
            }
            if (childType == 'subDriver/threejs/asset/vnd.collada+xml+optimized') {
                this.loader = new ColladaLoaderOptimized();

                this.loader.load(assetSource, this.loaded.bind(this), this.loadFailed.bind(this));

                asyncCallback(false);
            }
            if (childType == 'subDriver/threejs/asset/vnd.osgjs+json+compressed+optimized') {
                this.loader = new UTF8JsonLoader_Optimized({
                    source: assetSource
                }, this.loaded.bind(this), this.loadFailed.bind(this));
                asyncCallback(false);
            }
            if (childType == 'subDriver/threejs/asset/vnd.osgjs+json+compressed') {

                this.loader = new UTF8JsonLoader({
                    source: assetSource
                }, this.loaded.bind(this), this.loadFailed.bind(this));

                asyncCallback(false);
            }
            if (childType == 'subDriver/threejs/asset/vnd.gltf+json') {
                this.loader = new THREE.glTFLoader()
                this.loader.useBufferGeometry = true;
                this.loader.load(assetSource, this.loaded.bind(this));

                asyncCallback(false);
            }



        }
        //if the asset registry entry is not pending and it is loaded, then just grab a copy, no download or parse necessary
        else if (reg.loaded == true && reg.pending == false) {

            if (childType === 'subDriver/threejs/asset/vnd.gltf+json') {
                //here we signal the driver that we going to execute an asynchronous load

                //asyncCallback(false);
                var self = this;


                //self.getRoot().add(reg.node);
                glTFCloner.clone(reg.node, reg.rawAnimationChannels, function(clone) {
                    // Finally, attach our cloned model
                    self.getRoot().add(clone);
                    self.cleanTHREEJSnodes(self.getRoot());

                    self.settingProperty('materialDef', self.materialDef);
                    $(document).trigger('EndParse');

                    self.getRoot().updateMatrixWorld(true);

                    self.getRoot().GetBoundingBox();
                    //ok, load is complete - ask the kernel to continue the simulation
                    window.setImmediate(function() {
                        //asyncCallback(true);
                    })

                });
            } else {
                this.getRoot().add(reg.node.clone());
                this.cleanTHREEJSnodes(this.getRoot());
                this.settingProperty('materialDef', this.materialDef);
                $(document).trigger('EndParse');
                this.getRoot().updateMatrixWorld(true);
                this.getRoot().GetBoundingBox();
            }
        }
        //if it's pending but not done, register a callback so that when it is done, it can be attached.
        else if (reg.loaded == false && reg.pending == true) {
            asyncCallback(false);
            var tcal = asyncCallback;
            reg.callbacks.push(function(node, rawAnimationChannels) {

                //just clone the node and attach it.
                //this should not clone the geometry, so much lower memory.
                //seems to take near nothing to duplicated animated avatar

                if (node) {

                    if (childType === 'subDriver/threejs/asset/vnd.gltf+json') {
                        var self = this;

                        var obj = _assetLoader.getglTF(assetSource);
                        node = obj.scene;

                        glTFCloner.clone(node, rawAnimationChannels, function(clone) {
                            // Finally, attach our cloned model
                            self.cleanTHREEJSnodes(self.getRoot());
                            self.getRoot().add(clone);

                            self.settingProperty('materialDef', self.materialDef);
                            $(document).trigger('EndParse');
                            self.getRoot().updateMatrixWorld(true);

                            tcal(true);
                        })
                    } else {
                        $(document).trigger('EndParse');
                        this.getRoot().add(node.clone());
                        this.cleanTHREEJSnodes(this.getRoot());
                        this.settingProperty('materialDef', this.materialDef);
                        this.getRoot().updateMatrixWorld(true);

                        tcal(true);
                    }
                } else {
                    tcal(true);
                }
            }.bind(this));
        }



        //this.Build();
    }
    //default factory code
    return function(childID, childSource, childName, childType, assetSource, asyncCallback) {
        //name of the node constructor



        //create an asset registry if one does not exist for this driver
        if (!this.assetRegistry) {
            this.assetRegistry = {};
        }



        return new asset(childID, childSource, childName, childType, assetSource, asyncCallback, this.assetRegistry);
    }
})();