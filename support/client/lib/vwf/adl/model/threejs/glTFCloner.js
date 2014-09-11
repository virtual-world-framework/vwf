/**
 * Helper for cloning glTF models
 *
 */

define(["vwf/model/threejs/glTF-parser"], function() {



    var glTFCloner = glTFCloner || {};

    glTFCloner.clone = function(glTFModel, rawAnimationChannels, callback) {

        var newObj = glTFModel.clone(new THREE.Object3D, false);
        newObj = copyObject3DChildren(newObj, glTFModel);

        copyMesh(glTFModel, newObj, rawAnimationChannels, function(clone) {
            // Clone & add animations if present
            if (rawAnimationChannels) {
                var animations = [];

                for (var name in rawAnimationChannels) {
                    var nodeAnimationChannels = rawAnimationChannels[name];

                    var anim = new THREE.glTFAnimation(nodeAnimationChannels);
                    anim.name = "animation_" + name;
                    animations.push(anim);
                }

                // Now add AnimationHandler wrapper
                var list = [];

                getAllLeafMeshes(clone, list);
                for (var i = 0; i < list.length; i++) {
                    if (list[i] instanceof THREE.SkinnedMesh) {

                        list[i].animationHandle = new AnimationHandleWrapper(animations);
                    }
                }
            }

            callback(clone);
        });

    }

    // Clones all Object3D children (and children of children)
    var copyObject3DChildren = function(newObj, glTFModel) {

        glTFModel.traverse(function(child) {
            if (child.__proto__ === THREE.Object3D.prototype) {
                var obj = child.clone(new THREE.Object3D, false);
                obj.instanceSkin = child.instanceSkin;

                if (child.parent && child.parent.name !== '')
                    getObject3D(newObj, child.parent.name, function(object3d) {
                        object3d.add(obj);
                    });
                else
                    newObj.add(obj);
            }
        })

        return newObj;
    }

    // Finds an object with a specified name
    var getObject3D = function(object, name, callback) {

        if (object.name === name)
            return callback(object);
        else
            for (var i in object.children)
                getObject3D(object.children[i], name, callback);
    }


    // Accepts an Object3D (or any of its inherited instances)
    // Calls provided callback when done with cloned Object3D
    var copyMesh = function(glTFModel, newObj, rawAnimationChannels, callback) {
        if (glTFModel instanceof THREE.SkinnedMesh) {

            // Clone SkinnedMesh
            var mesh = glTFModel.clone(new THREE.SkinnedMesh(glTFModel.geometry, glTFModel.material, glTFModel.skeleton.useVertexTexture), true);

            // Create new skeleton with bones
            mesh.skeleton = new THREE.Skeleton(glTFModel.skeleton.bones, glTFModel.skeleton.useVertexTexture);
            mesh.skeleton.boneInverses = glTFModel.skeleton.boneInverses;

            // Now correct our bones
            mesh.children = [];
            for (var i in mesh.skeleton.bones) {
                var bone = mesh.skeleton.bones[i];
                var oldBone = glTFModel.skeleton.bones[i];

                bone.skinMatrix.copy(oldBone.skinMatrix);
                bone.scale.copy(oldBone.scale);
                bone.position.copy(oldBone.position);
                bone.rotation.copy(oldBone.rotation);
                bone.matrix.copy(oldBone.matrix);

                // Create a hierarchy of bones
                if (oldBone.parent && oldBone.parent instanceof THREE.Bone)
                    getBone(oldBone.parent.name, mesh.skeleton.bones).add(bone);
                else if (oldBone.parent && oldBone.parent instanceof THREE.Mesh)
                    mesh.add(bone);
            }

            // Now clone animations, if any
            if (rawAnimationChannels) {
                for (var name in rawAnimationChannels) {
                    var nodeAnimationChannels = rawAnimationChannels[name];

                    // Since we cloned our bones, change to our new bones in animation channels
                    var boneName = nodeAnimationChannels[0].target.name;
                    var newBone = getBone(boneName, mesh.skeleton.bones);
                    for (var i in nodeAnimationChannels)
                        nodeAnimationChannels[i].target = newBone;
                }
            }

            mesh.pose();

            parentName = glTFModel.parent.name;
            addClonedMesh(mesh, newObj, parentName);
            return callback(newObj);
        } else if (glTFModel instanceof THREE.Mesh) {
            var mesh = new THREE.Mesh(glTFModel.geometry, glTFModel.material);
            parentName = glTFModel.parent.name;
            addClonedMesh(mesh, newObj, parentName);
            return callback(newObj);
        } else if (glTFModel.children) {
            for (var id in glTFModel.children)
                copyMesh(glTFModel.children[id], newObj, rawAnimationChannels, callback);
        }
    }


    // Attaches a mesh to the Object3D whith specified name
    var addClonedMesh = function(mesh, obj, parentName) {
        if (obj.name === parentName)
            return obj.add(mesh);
        else
            for (var i in obj.children)
                addClonedMesh(mesh, obj.children[i], parentName);
    }

    // Retrieves a bone from skeleton based on its name
    var getBone = function(name, bones) {
        if (name && bones && bones.length > 0) {
            for (var i in bones) {
                if (bones[i].name === name) {
                    return bones[i];
                    break;
                } else if ((i + 1) === bones.length) {
                    return null;
                }
            }
        } else {
            return null;
        }
    }

    var getAllLeafMeshes = function(threeObject, list) {
        if (threeObject instanceof THREE.Mesh) {
            list.push(threeObject);
        }
        if (threeObject.children) {
            for (var i = 0; i < threeObject.children.length; i++) {
                getAllLeafMeshes(threeObject.children[i], list);
            }
        }
    }

    //handle for wrapping the glTF animation format
    function AnimationHandleWrapper(gltfAnimations) {
        this.duration = 0;
        this.lastKey = null;
        this.glTFAnimations = gltfAnimations;
        for (var i in this.glTFAnimations) {
            this.duration = Math.max(this.duration, this.glTFAnimations[i].duration)
        }
        this.setKey = function(key) {
            if (this.lastKey == key) return;
            this.lastKey = key;

            for (var j in this.glTFAnimations) {
                var i, len = this.glTFAnimations[j].interps.length;
                for (i = 0; i < len; i++) {

                    this.glTFAnimations[j].interps[i].interp(key / 30);
                    this.glTFAnimations[j].interps[i].targetNode.updateMatrix();
                }
            }

        }
        this.data = {
            length: this.duration,
            fps: 30
        };
    }


    // Slightly altered Skeleton model
    // 
    // Altered:
    // 
    // p = gbone.position;
    // q = gbone.rotation;
    // s = gbone.scale;
    //
    //
    // if (gbone.parent !== -1 && this.bones[gbone.parent]) {
    //   this.bones[gbone.parent].add(this.bones[b]);
    // }

    var calculateInverses = THREE.Skeleton.prototype.calculateInverses;
    var addBone = THREE.Skeleton.prototype.addBone;

    THREE.Skeleton = function(boneList, useVertexTexture) {

        this.useVertexTexture = useVertexTexture !== undefined ? useVertexTexture : true;

        // init bones

        this.bones = [];
        this.boneMatrices = [];

        var bone, gbone, p, q, s;

        if (boneList !== undefined) {

            for (var b = 0; b < boneList.length; ++b) {

                gbone = boneList[b];

                p = gbone.pos || gbone.position;
                q = gbone.rotation || gbone.rotq;
                s = gbone.scale || gbone.scl;

                bone = this.addBone();

                bone.name = gbone.name;
                bone.position.set(p[0], p[1], p[2]);
                bone.quaternion.set(q[0], q[1], q[2], q[3]);

                if (s !== undefined) {

                    bone.scale.set(s[0], s[1], s[2]);

                } else {

                    bone.scale.set(1, 1, 1);

                }

            }

            for (var b = 0; b < boneList.length; ++b) {

                gbone = boneList[b];

                if (gbone.parent !== -1 && this.bones[gbone.parent]) {

                    this.bones[gbone.parent].add(this.bones[b]);

                }

            }

            //

            var nBones = this.bones.length;

            if (this.useVertexTexture) {

                // layout (1 matrix = 4 pixels)
                //  RGBA RGBA RGBA RGBA (=> column1, column2, column3, column4)
                //  with  8x8  pixel texture max   16 bones  (8 * 8  / 4)
                //     16x16 pixel texture max   64 bones (16 * 16 / 4)
                //     32x32 pixel texture max  256 bones (32 * 32 / 4)
                //     64x64 pixel texture max 1024 bones (64 * 64 / 4)

                var size;

                if (nBones > 256)
                    size = 64;
                else if (nBones > 64)
                    size = 32;
                else if (nBones > 16)
                    size = 16;
                else
                    size = 8;

                this.boneTextureWidth = size;
                this.boneTextureHeight = size;

                this.boneMatrices = new Float32Array(this.boneTextureWidth * this.boneTextureHeight * 4); // 4 floats per RGBA pixel

                this.boneTexture = new THREE.DataTexture(this.boneMatrices, this.boneTextureWidth, this.boneTextureHeight, THREE.RGBAFormat, THREE.FloatType);
                this.boneTexture.minFilter = THREE.NearestFilter;
                this.boneTexture.magFilter = THREE.NearestFilter;
                this.boneTexture.generateMipmaps = false;
                this.boneTexture.flipY = false;

            } else {

                this.boneMatrices = new Float32Array(16 * nBones);

            }

        }

    };

    THREE.Skeleton.prototype.calculateInverses = calculateInverses;
    THREE.Skeleton.prototype.addBone = addBone;

    exports = glTFCloner;
    window.glTFCloner = glTFCloner;
});