/**
 * Helper for cloning glTF models
 *
 * @author Yasha Prikhodko / http://gorjuspixels.com/
 */

define(["vwf/adl/model/threejs/glTF-parser"], function() {



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
            glTFModel.geometry.bones = glTFModel.skeleton.bones;
            glTFModel.geometry.boneInverses = glTFModel.skeleton.boneInverses;
            var mesh = glTFModel.clone(new THREE.SkinnedMesh(glTFModel.geometry, glTFModel.material, glTFModel.skeleton.useVertexTexture), true);

            // Now correct our bones
            mesh.children = [];
            for (var i in mesh.skeleton.bones) {
                var bone = mesh.skeleton.bones[i];
                var oldBone = glTFModel.skeleton.bones[i];

                // bone.skinMatrix.copy(oldBone.skinMatrix);
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


    exports = glTFCloner;
    window.glTFCloner = glTFCloner;
});