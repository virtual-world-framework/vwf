(function() {
    var matComploose = window.matComploose;
    function transformable(childID, childSource, childName) {
        this.overrideTransform = false;
        this.DisableTransform = function() {
            this.overrideTransform = true;
        }
        this.EnableTransform = function() {
            this.overrideTransform = false;
        }
        this.TransformEnabled = function() {
            return !this.overrideTransform;
        }
        //this my be called by the view driver during interpolation
        //in which case, there is no point in dirtying the scenemanager, as you may not 
        //reason over the interpolated values anyway
        this.setTransformInternal = function(propertyValue, sceneManagerUpdate) {

            var threeObject = this.getRoot().parent;
            if (this.getRoot().initializedFromAsset)
                threeObject = this.getRoot();
            var transform = propertyValue || goog.vec.Mat4.createIdentity();

            //hummm, this is slow for sort of an edge case. I wonder if there is not a better place to do this...
            var det = goog.vec.Mat4.determinant(transform);
            if (det == 0) {
                console.log('error setting matrix. determinant is 0');
                return;
            }
            // Rotate 90 degress around X to convert from VWF Z-up to MATH Y-up.
            if (threeObject instanceof THREE.Camera) {
                var columny = goog.vec.Vec4.create();
                goog.vec.Mat4.getColumn(transform, 1, columny);
                var columnz = goog.vec.Vec4.create();
                goog.vec.Mat4.getColumn(transform, 2, columnz);
                goog.vec.Mat4.setColumn(transform, 1, columnz);
                goog.vec.Mat4.setColumn(transform, 2, goog.vec.Vec4.negate(columny, columny));
            }

            if (!matComploose(transform, threeObject.matrix.elements)) {
                if (threeObject instanceof THREE.PointCloud) {
                    threeObject.updateTransform(transform);
                }

                threeObject.matrixAutoUpdate = false;
                for (var i = 0; i < 16; i++)
                    threeObject.matrix.elements[i] = transform[i];
                threeObject.updateMatrixWorld(true);

                //walk and find mesh for the bone, update it
                if (threeObject instanceof THREE.Bone) {
                    threeObject.matrixAutoUpdate = true;
                    threeObject.matrix.decompose(threeObject.position, threeObject.rotation, threeObject.scale);
                    var parent = threeObject.parent;
                    while (parent) {
                        if (parent instanceof THREE.SkinnedMesh) {
                            parent.updateMatrixWorld();
                            //since it makes no sense for a bone to effect the skin farther up the hierarchy
                            break;
                        }
                        parent = parent.parent
                    }

                }

                //need to set this to update bone handle positions
                if (this.setAnimationFrameInternal)
                    this.setAnimationFrameInternal(this.gettingProperty('animationFrame'), sceneManagerUpdate);


                //removed as of threejs r67
                //if this transformable is a bone, we need to update the skin
                //if (threeObject.skin)
                //    threeObject.skin.updateMatrixWorld(true);
                if (sceneManagerUpdate)
                    _SceneManager.setDirty(threeObject);
            }

            //signals the driver that we don't have to process further, this prop was handled
            return propertyValue;
        }
        this.settingProperty = function(propertyName, propertyValue) {

            if (propertyName == 'transform') {

                if (!this.TransformEnabled()) {

                    return propertyValue;
                };

                return this.setTransformInternal(propertyValue, true);
            }
            if (propertyName == 'inheritScale') {
                var walk = function(node, val, force) {
                    if (node.vwfID && !force)
                        return;
                    node.inheritScale = val;
                    for (var i = 0; i < node.children.length; i++)
                        walk(node.children[i], val, false);
                }

                //walk(this.getRoot(), propertyValue, true);
                this.getRoot().inheritScale = propertyValue;
                this.getRoot().updateMatrixWorld(true);
                if (this.getRoot() instanceof THREE.Bone) {
                    var skin = this.getRoot();
                    while (!(skin instanceof THREE.SkinnedMesh))
                        skin = skin.parent;
                    skin.updateMatrixWorld(true);
                }
                //need to set this to update bone handle positions
                if (this.setAnimationFrameInternal)
                    this.setAnimationFrameInternal(this.gettingProperty('animationFrame'), true);


                //removed as of threejs r67
                //if this transformable is a bone, we need to update the skin
                //if (threeObject.skin)
                //    threeObject.skin.updateMatrixWorld(true);

                _SceneManager.setDirty(this.getRoot());
            }

        }
        this.gettingProperty = function(propertyName, propertyValue) {
            if (!this.TransformEnabled()) {
                return propertyValue
            };
            if (propertyName == 'transform') {
                var threeObject = this.getRoot().parent;
                if (this.getRoot().initializedFromAsset)
                    threeObject = this.getRoot();
                var value = matCpy(threeObject.matrix.elements);

                if (threeObject instanceof THREE.Camera) {
                    var columny = goog.vec.Vec4.create();
                    goog.vec.Mat4.getColumn(value, 1, columny);
                    var columnz = goog.vec.Vec4.create();
                    goog.vec.Mat4.getColumn(value, 2, columnz);
                    goog.vec.Mat4.setColumn(value, 2, columny);
                    goog.vec.Mat4.setColumn(value, 1, goog.vec.Vec4.negate(columnz, columnz));
                }

                var ret = value;
                return ret;
            }
            if (propertyName == 'worldPosition') {
                var threeObject = this.getRoot().parent;
                if (this.getRoot().initializedFromAsset)
                    threeObject = this.getRoot();
                var x = threeObject.matrixWorld.elements[12];
                var y = threeObject.matrixWorld.elements[13];
                var z = threeObject.matrixWorld.elements[14];
                return [x, y, z];
            }
            if (propertyName == 'worldTransform') {
                var threeObject = this.getRoot().parent;
                if (this.getRoot().initializedFromAsset)
                    threeObject = this.getRoot();
                var value = matCpy(threeObject.matrixWorld.elements);

                if (threeObject instanceof THREE.Camera) {
                    var columny = goog.vec.Vec4.create();
                    goog.vec.Mat4.getColumn(value, 1, columny);
                    var columnz = goog.vec.Vec4.create();
                    goog.vec.Mat4.getColumn(value, 2, columnz);
                    goog.vec.Mat4.setColumn(value, 2, columny);
                    goog.vec.Mat4.setColumn(value, 1, goog.vec.Vec4.negate(columnz, columnz));
                }
                if (threeObject instanceof THREE.Bone) {



                    threeObject.updateMatrixWorld(true);
                    var mat = threeObject.matrixWorld.clone();
                    //	mat = (new THREE.Matrix4()).multiplyMatrices(skinmat,mat);
                    return mat.elements;

                }
                return value;
            }
        }
    }
    //default factory code
    return function(childID, childSource, childName) {
        //name of the node constructor
        return new transformable(childID, childSource, childName);
    }
})();