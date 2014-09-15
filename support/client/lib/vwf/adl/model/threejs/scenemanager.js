function GUID() {
    var S4 = function() {
        return Math.floor(Math.SecureRandom() * 0x10000 /* 65536 */ ).toString(16);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

//values tuned for VTCE
var maxObjects = 5;
var maxDepth = 16;
var batchAtLevel = 0;
var drawSceneManagerRegions = false;
var maxSize = 640;


//hook these up at the prototype so that we are not changing the chrome hidden class
THREE.Object3D.prototype.sceneManagerNode = null;
THREE.Object3D.prototype.sceneManagerUpdate = null;
THREE.Object3D.prototype.sceneManagerDelete = null;
THREE.Object3D.prototype.boundsCache = null;
THREE.Object3D.prototype.RenderBatchManager = null;
THREE.Object3D.prototype._static = false;
THREE.Object3D.prototype._dynamic = false;

function SceneManager(scene) {

}

function GetAllLeafMeshes(threeObject, list) {
    if (threeObject instanceof THREE.Mesh || threeObject instanceof THREE.Line) {
        if (!(threeObject instanceof THREE.SkinnedMesh))
            list.push(threeObject);

    }
    if (threeObject.children) {
        for (var i = 0; i < threeObject.children.length; i++) {
            GetAllLeafMeshes(threeObject.children[i], list);
        }
    }
}
SceneManager.prototype.forceBatchAll = function() {

    var list = [];
    GetAllLeafMeshes(this.scene, list);
    for (var i = 0; i < list.length; i++) {
        if (list[i].material.skinning)
            continue;
        if (list[i] instanceof THREE.SkinnedMesh)
            continue;

        if (list[i].setStatic)

            list[i].setStatic(true);
    }
}
SceneManager.prototype.bonesVisible = false;

SceneManager.prototype.getBonesVisible = function() {
    return this.bonesVisible;
}
SceneManager.prototype.showBones = function() {
    this.bonesVisible = true;
    this.updateBoneVisiblitiy(true);
}
SceneManager.prototype.hideBones = function() {
    this.bonesVisible = false;
    this.updateBoneVisiblitiy(false);
}
SceneManager.prototype.updateBoneVisiblitiy = function(visible) {


    var walk = function(root) {
        if (root instanceof THREE.Bone) {
            for (var i in root.children) {
                if (root.children[i].name == "BoneSelectionHandle") {
                    root.children[i].visible = visible;
                }
                walk(root.children[i]);
            }
        }
        for (var i in root.children) {
            walk(root.children[i]);
        }
    }
    walk(this.scene);
}
SceneManager.prototype.forceUnbatchAll = function() {
    var list = [];
    GetAllLeafMeshes(this.scene, list);
    for (var i = 0; i < list.length; i++) {
        if (list[i].setStatic)
            list[i].setStatic(false);
    }
}
SceneManager.prototype.setMaxObjects = function(mo) {
    maxObjects = mo;
    this.rebuild();
}
SceneManager.prototype.setMaxDepth = function(mo) {
    maxDepth = mo;
    this.rebuild();
}
SceneManager.prototype.setBatchLevel = function(bl) {
    batchAtLevel = bl;
    this.rebuild();
}
SceneManager.prototype.setShowRegions = function(bool) {
    drawSceneManagerRegions = bool;
    this.rebuild();
}
SceneManager.prototype.getShowRegions = function() {
    return drawSceneManagerRegions;
}
SceneManager.prototype.setExtents = function(extents) {
    maxSize = extents;
    this.rebuild();
}
SceneManager.prototype.rebuild = function() {

    var children = this.root.getChildren();
    this.root.deinitialize();
    this.min = [-maxSize, -maxSize, -maxSize];
    this.max = [maxSize, maxSize, maxSize];
    this.root = new SceneManagerRegion(this.min, this.max, 0, this.scene, 0);
    for (var i = 0; i < children.length; i++) {
        if (!children[i].isDynamic())
            this.root.addChild(children[i]);
        else
            this.addToRoot(children[i]);

    }
}
SceneManager.prototype.show = function() {
    drawSceneManagerRegions = true;
    this.rebuild(maxObjects, maxDepth)
}
SceneManager.prototype.hide = function() {
    drawSceneManagerRegions = false;
    this.rebuild(maxObjects, maxDepth)
}
SceneManager.prototype.addToRoot = function(child) {
    this.specialCaseObjects.push(child);
}
SceneManager.prototype.removeFromRoot = function(child) {
    if (this.specialCaseObjects.indexOf(child) != -1)
        this.specialCaseObjects.splice(this.specialCaseObjects.indexOf(child), 1);
}
SceneManager.prototype.defaultPickOptions = new THREE.CPUPickOptions();
SceneManager.prototype.buildCPUPickOptions = function(opts) {
    if (!opts) return this.defaultPickOptions;
    if (!(opts instanceof THREE.CPUPickOptions)) {
        var newopts = new THREE.CPUPickOptions();
        for (var i in newopts)
            newopts[i] = opts[i];
        return newopts;
    }
    return null;
}
SceneManager.prototype.CPUPick = function(o, d, opts) {

    //let's lazy update only on demand;
    //removed for performance test. Seems like there might be some work that is done on every update, even if nothing is dirty
    //appears to be in the static batching. 
    //move to scene render for now.
    //this.update();
    if (d[0] == 0 && d[1] == 0 && d[2] == 0)
        return null;
    //console.profile("PickProfile");

    opts = this.buildCPUPickOptions(opts)

    if (opts) opts.faceTests = 0;
    if (opts) opts.objectTests = 0;
    if (opts) opts.regionTests = 0;
    if (opts) opts.regionsRejectedByDist = 0;
    if (opts) opts.regionsRejectedByBounds = 0;
    if (opts) opts.objectsRejectedByBounds = 0;
    if (opts) opts.objectRegionsRejectedByDist = 0;
    if (opts) opts.objectRegionsRejectedByBounds = 0;
    if (opts) opts.objectRegionsTested = 0;
    if (opts) opts.objectsTested = [];

    var hitlist = [];
    this.root.CPUPick(o, d, opts, hitlist);

    for (var i = 0; i < this.specialCaseObjects.length; i++) {
       this.specialCaseObjects[i].CPUPick(o, d, opts || this.defaultPickOptions,hitlist);
    }

    //sort the hits by priority and distance
    hitlist = hitlist.sort(function(a, b) {
        var ret = b.priority - a.priority;
        if (ret == 0)
            ret = a.distance - b.distance;
        return ret;

    });
    // Enter name of script here
    //console.profileEnd();
    var ret = hitlist[0];
    hitlist[0] = null;


    //var intersect = new FaceIntersect();
    //for(var i in ret)
    //	intersect[i] = ret[i];

    //_DEALLOC(ret);
    return ret;
}
SceneManager.prototype.FrustrumCast = function(f, opts) {

    //let's lazy update only on demand;
    this.update();
    var hitlist = this.root.FrustrumCast(f, opts || this.defaultPickOptions);
    for (var i = 0; i < this.specialCaseObjects.length; i++) {
        var childhits = this.specialCaseObjects[i].FrustrumCast(f, opts || this.defaultPickOptions);
        if (childhits)
            hitlist = hitlist.concat(childhits);
    }

    //return an array that is not tracked by the pool, so users will not have to manually deallocate
    var unTrackedReturn = [];
    unTrackedReturn = hitlist.slice(0);

    return unTrackedReturn;
}
SceneManager.prototype.SphereCast = function(center, r, opts) {
    //console.profile("PickProfile");
    //let's lazy update only on demand;
    this.update();
    var hitlist = this.root.SphereCast(center, r, opts || this.defaultPickOptions);
    for (var i = 0; i < this.specialCaseObjects.length; i++) {
        var childhits = this.specialCaseObjects[i].SphereCast(center, r, opts || this.defaultPickOptions);
        if (childhits)
            hitlist = hitlist.concat(childhits);
    }

    //return an array that is not tracked by the pool, so users will not have to manually deallocate
    var unTrackedReturn = [];
    unTrackedReturn = hitlist.slice(0);
    return unTrackedReturn;
}
SceneManager.prototype.dirtyObjects = [];
SceneManager.prototype.setDirty = function(object) {

    object.boundsCache = null;

    if (object.children && object.children.length) {

        for (var i = 0; i < object.children.length; i++)
            this.setDirty(object.children[i]);
        return;
    }

    //object has no children, and it's a mesh or a line  but not a skinned mesh
    //we create boxes for all the skinned meshes to stand in for bone collision
    if (this.dirtyObjects.indexOf(object) == -1 && (object instanceof THREE.Mesh || object instanceof THREE.Line) && !(object instanceof THREE.SkinnedMesh)) {
        this.dirtyObjects.push(object);
    }
}
SceneManager.prototype.update = function(dt) {

    if (!this.initialized) return;



    for (var i = 0; i < this.dirtyObjects.length; i++) {
        this.dirtyObjects[i].sceneManagerUpdate();
    }



    this.dirtyObjects = [];

    var dirtybatchcount = 0;
    for (var i = 0; i < this.BatchManagers.length; i++) {
        //only update at most one batch manager per frame
        if (this.BatchManagers[i].dirty) {
            dirtybatchcount++;
        }
    }

    for (var i = 0; i < this.BatchManagers.length; i++) {
        //only update at most one batch manager per frame
        if (this.BatchManagers[i].dirty) {

            this.BatchManagers[i].update();
            break;
        }
    }
    if (dirtybatchcount == 0) {

    }
    var removelist = [];
    for (var i = 0; i < this.tempDebatchList.length; i++) {

        this.tempDebatchList[i].updateCount -= .5;
        if (this.tempDebatchList[i].updateCount < 0) {

            removelist.push(i);
            delete this.tempDebatchList[i]._static;
            console.log('Rebatching ' + this.tempDebatchList[i].name);
            this.tempDebatchList[i].sceneManagerUpdate();
        }
    }
    for (var i = 0; i < removelist.length; i++) {
        this.tempDebatchList.splice(removelist[i], 1);
    }
    for (var i = 0; i < this.particleSystemList.length; i++) {
        this.particleSystemList[i].update(dt);
    }


}
SceneManager.prototype.releaseTexture = function(texture) {

    if (!texture) return;
    texture.refCount--;
    if (!texture.refCount) {
        texture.dispose();
    }
}
SceneManager.prototype.getDefaultTexture = function() {
    if (!this.defaultTexture) {

        this.defaultTexture = THREE.ImageUtils.generateDataTexture(8, 8, new THREE.Color(0x0000ff));
        this.defaultTexture.image.src = "";
        this.defaultTexture.minFilter = THREE.LinearMipMapLinearFilter;
        this.defaultTexture.magFilter = THREE.LinearFilter;
        if (window._dRenderer)
            this.defaultTexture = 1; //_dRenderer.getMaxAnisotropy();
        this.defaultTexture.wrapS = THREE.RepeatWrapping;
        this.defaultTexture.wrapT = THREE.RepeatWrapping;
    }

    return this.defaultTexture;
}
SceneManager.prototype.loadTexture = function(url, mapping, onLoad, onError) {


    //test to see if the url ends in .dds
    if ((/\.dds$/).test(url)) {


        //create a new texture. This texture will be returned now, and filled with the compressed dds data
        //once that data is available
        var temptexture = new THREE.Texture(this.getDefaultTexture().image, mapping);
        temptexture.format = this.getDefaultTexture().format;


        if (_SettingsManager.settings.filtering) {
            temptexture.minFilter = THREE.LinearMipMapLinearFilter;
            temptexture.magFilter = THREE.LinearFilter;
        } else {
            temptexture.minFilter = THREE.NearestFilter;
            temptexture.magFilter = THREE.NearestFilter;
        }


        temptexture.minFilter = THREE.LinearMipMapLinearFilter;
        temptexture.magFilter = THREE.LinearFilter;
        temptexture.anisotropy = 1;
        temptexture.sourceFile = url;

        //a variable to hold the loaded texture
        var texture;

        //callback to copy data from the compressed texture to the one we retuned synchronously from this function
        var load = function(event) {


            //image is in closure scope. Copy all relevant data
            temptexture.image = texture.image;



            temptexture._needsUpdate = texture._needsUpdate;

            temptexture.flipY = texture.flipY;
            temptexture.format = texture.format;
            temptexture.generateMipmaps = texture.generateMipmaps;

            temptexture.image = texture.image;
            //temptexture.magFilter = texture.magFilter;
            temptexture.mapping = texture.mapping;
            //temptexture.minFilter = texture.minFilter;
            temptexture.mipmaps = texture.mipmaps;


            temptexture.offset = texture.offset;

            temptexture.premultiplyAlpha = texture.premultiplyAlpha;
            temptexture.repeat = texture.repeat;
            temptexture.type = texture.type;
            temptexture.unpackAlignment = texture.unpackAlignment;

            temptexture.wrapS = texture.wrapS;
            temptexture.wrapT = texture.wrapT;

            temptexture.isActuallyCompressed = true;

            //hit the async callback
            if (onLoad) onLoad(texture);
        };

        var error = function(event) {

            if (onError) onError(event.message);

        };

        //create the new texture, and decompress. Copy over with the onload callback above
        //texture = THREE.ImageUtils.loadCompressedTexture(url, mapping, load, error);

var loader = new THREE.DDSLoader();
        texture = loader.load( url, load, error );

        if (_SettingsManager.settings.filtering) {
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
        } else {
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
        }
        texture.generateMipmaps = false;

        if (window._dRenderer)
            texture.anisotropy = 1; //_dRenderer.getMaxAnisotropy();
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;



        //return the temp one, which will be filled later.
        return temptexture;
    } else {
        var image = new Image();

        var texture = new THREE.Texture(this.getDefaultTexture().image, mapping);
        texture.format = this.getDefaultTexture().format;

        if (_SettingsManager.settings.filtering) {
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
        } else {
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
        }

        if (window._dRenderer)
            texture.anisotropy = 1; //_dRenderer.getMaxAnisotropy();
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        var loader = new THREE.ImageLoader();

        var load = function(event) {


            texture.image = event;
            texture.format = THREE.RGBAFormat;
            texture.needsUpdate = true;

            if (onLoad) onLoad(texture);

        };

        var error = function(event) {

            if (onError) onError(event.message);

        };

        loader.crossOrigin = 'anonymous';
        loader.load(url, load, null, error, image);

        texture.sourceFile = url;

        return texture;

    }



}
SceneManager.prototype.useSimpleMaterials = false;
SceneManager.prototype.createMaterial = function() {
    if (_SceneManager.useSimpleMaterials)
        return new THREE.MeshBasicMaterial();
    return new THREE.MeshPhongMaterial();
}

SceneManager.prototype.GetLoadedTextures = function() {
    var ret = []
    for (var i in this.textureList) {
        if (this.textureList[i].image.src !== '')
            ret.push(i);
    }
    return ret;
}
SceneManager.prototype.getTexture = function(src, noclone) {
    //return THREE.ImageUtils.loadTexture(src)

    var originalSrc = src;
    var p = window.location.pathname;
    if (p[p.length - 1] == '/') {
        p = p.substring(0, p.length - 1)
    };
    p = p.substring(p.lastIndexOf('/') + 1);
    src = src.replace(p, '');


    if (!this.textureList)
        this.textureList = {};
    if (!this.textureList[src]) {

        var tex = this.textureList[src];

        var onload = function(texture) {

            if (texture.clones) {
                for (var i = 0; i < tex.clones.length; i++) {
                    tex.clones[i].image = texture.image;
                    tex.clones[i].format = texture.format;
                    tex.clones[i].needsUpdate = true;
                }


            }
        }.bind(this);

        this.textureList[src] = this.loadTexture(src, new THREE.UVMapping(), onload);
        var tex = this.textureList[src];
        tex.clones = [];
        tex._SMsrc = originalSrc;
        return this.textureList[src];
    }
    var ret = this.textureList[src];
    if (noclone) {
        ret.refCount++;
        return ret;
    }
    ret = new THREE.Texture(ret.image);
    ret.format = this.textureList[src].format;
    ret._SMsrc = originalSrc;
    ret.refCount = 1;
    ret.wrapS = this.textureList[src].wrapS;
    ret.wrapT = this.textureList[src].wrapT;
    ret.magFilter = this.textureList[src].magFilter;
    ret.minFilter = this.textureList[src].minFilter;
    ret.repeat.x = this.textureList[src].repeat.x;
    ret.repeat.y = this.textureList[src].repeat.y;
    ret.offset.x = this.textureList[src].offset.x;
    ret.offset.y = this.textureList[src].offset.y;
    ret.anisotropy = this.textureList[src].anisotropy;
    ret.flipY = this.textureList[src].flipY;
    ret.generateMipmaps = this.textureList[src].generateMipmaps;
    ret.needsUpdate = true;
    ret.mipmaps = this.textureList[src].mipmaps;
    ret.isActuallyCompressed = this.textureList[src].isActuallyCompressed;
    this.textureList[src].clones.push(ret);
    return ret;
}
SceneManager.prototype.initialize = function(scene) {
    this.min = [-maxSize, -maxSize, -maxSize];
    this.max = [maxSize, maxSize, maxSize];
    this.BatchManagers = [];
    this.specialCaseObjects = [];
    this.tempDebatchList = [];
    this.particleSystemList = [];
    if (!this.textureList)
        this.textureList = {};
    this.initialized = true;
    THREE.Object3D.prototype.add_internal = THREE.Object3D.prototype.add;
    THREE.Object3D.prototype.add = function(child, SceneManagerIgnore) {
        if (!child) return;
        this.add_internal(child);



        //here, we need to walk up the graph and make sure that at some point, the object is a child of the scene.
        // if it's not, it should not go in the scenemanager.
        var parent = this;
        var found = false;
        while (parent) {
            if (parent instanceof THREE.Scene) {
                found = true;
                break;
            } else {
                parent = parent.parent;
            }
        }
        if (!found) return;

        if (SceneManagerIgnore)
            return;

        var list = [];
        GetAllLeafMeshes(child, list);
        for (var i = 0; i < list.length; i++) {

            list[i].updateMatrixWorld(true);

        }
        for (var i = 0; i < list.length; i++) {
            if (!list[i].isDynamic())
                _SceneManager.addChild(list[i]);
            else
                _SceneManager.addToRoot(list[i]);
            _SceneManager.setDirty(list[i]);
        }

        //DO NOT PUT OBJECT3Ds ON THE DIRTY LIST!	
        //_SceneManager.setDirty(this);
    }
    THREE.Object3D.prototype.remove_internal = THREE.Object3D.prototype.remove;
    THREE.Object3D.prototype.remove = function(child, SceneManagerIgnore) {

        var meshes = [];

        this.remove_internal(child);

        if (SceneManagerIgnore)
            return;

        GetAllLeafMeshes(child, meshes);

        for (var i = 0; i < meshes.length; i++) {
            meshes[i].sceneManagerDelete();
            //_SceneManager.removeChild(meshes[i]);
        }
    }
    THREE.Object3D.prototype.materialUpdated = function() {
        var meshes = [];
        GetAllLeafMeshes(this, meshes);
        for (var i = 0; i < meshes.length; i++) {
            meshes[i].materialUpdated();
            //_SceneManager.removeChild(meshes[i]);
        }

    }

    THREE.Mesh.prototype.materialUpdated = function() {
        if (!this.updateCount)
            this.updateCount = 1;
        this.updateCount++;
        if (this.updateCount == 100) {
            console.log(this.name + ' is not static, debatching');
            this._static = false;
            if (this.RenderBatchManager)
                this.RenderBatchManager.remove(this);

            _SceneManager.tempDebatchList.push(this);
            return;
        }

        if (this.RenderBatchManager)
            this.RenderBatchManager.materialUpdated(this);
    }
    THREE.Line.prototype.materialUpdated = THREE.Mesh.prototype.materialUpdated;
    THREE.Object3D.prototype.setStatic = function(_static) {
        if (this.isDynamic && this.isDynamic()) return;
        this._static = _static;
        this.sceneManagerUpdate();
    }
    THREE.Object3D.prototype.setDynamic = function(_dynamic) {
        if (this.dynamic == _dynamic) return;
        this._dynamic = _dynamic;
        this._static = false;
        if (this._dynamic) {
            this.sceneManagerDelete();
            _SceneManager.addToRoot(this);
        } else {
            _SceneManager.removeFromRoot(this);
            var list = [];
            GetAllLeafMeshes(this, list);
            for (var i = 0; i < list.length; i++) {
                _SceneManager.addChild(list[i]);
            }
            this.sceneManagerUpdate();
        }
    }
    THREE.Object3D.prototype.isStatic = function() {
        if (this._static != undefined)
            return this._static;
        return (this.parent && this.parent.isStatic());
    }
    THREE.Object3D.prototype.isDynamic = function() {
        if (this._dynamic != undefined)
            return this._dynamic;
        return (this.parent && this.parent.isDynamic());
    }
    THREE.Object3D.prototype.sceneManagerUpdate = function() {
        //this.updateMatrixWorld(true);
        this.boundsCache = null;
        if (this.isDynamic && this.isDynamic()) return;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].sceneManagerUpdate();
        }

    }
    THREE.Object3D.prototype.sceneManagerDelete = function() {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].sceneManagerDelete();
        }

    }
    THREE.Object3D.prototype.sceneManagerIgnore = function() {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].sceneManagerIgnore();
        }

    }
    THREE.Mesh.prototype.sceneManagerIgnore = function() {
        _SceneManager.removeChild(this);
        this.SceneManagerIgnore = true;
    }
    this.root = new SceneManagerRegion(this.min, this.max, 0, scene, 0);
    this.scene = scene;
}
SceneManager.prototype.addChild = function(c) {

    this.root.addChild(c);
}
SceneManager.prototype.removeChild = function(c) {

    //be sure to remove objects from the dirty list, so they don't get sorted back in
    if (this.dirtyObjects.indexOf(c) != -1) {
        this.dirtyObjects.splice(this.dirtyObjects.indexOf(c), 1);
    }
    if (this.tempDebatchList.indexOf(c) != -1) {
        this.tempDebatchList.splice(this.tempDebatchList.indexOf(c), 1);
    }

    var removed = this.root.removeChild(c);


}

function SceneManagerRegion(min, max, depth, scene, order) {

    this.min = min;
    this.max = max;
    this.r = Vec3.distance(min, max) / 2;
    this.childCount = 0;
    this.c = [(this.max[0] + this.min[0]) / 2, (this.max[1] + this.min[1]) / 2, (this.max[2] + this.min[2]) / 2];
    this.childRegions = [];
    this.childObjects = [];
    this.depth = depth;
    this.scene = scene;
    this.order = order;
    if (drawSceneManagerRegions) {
        this.mesh = this.BuildWireBox([this.max[0] - this.min[0], this.max[0] - this.min[0], this.max[0] - this.min[0]], [0, 0, 0], [(this.depth / maxDepth) * 2, 0, 0]);

        this.mesh.material.depthTest = false;
        this.mesh.material.depthWrite = false;
        this.mesh.material.transparent = true;
        this.mesh.position.x = this.c[0];
        this.mesh.position.y = this.c[1];
        this.mesh.position.z = this.c[2];
        this.mesh.InvisibleToCPUPick = true;
        this.mesh.renderDepth = this.depth * 8 + this.order;
        this.scene.add(this.mesh, true);
        this.mesh.updateMatrixWorld(true);
    }
    if (this.depth <= batchAtLevel) {
        this.RenderBatchManager = new THREE.RenderBatchManager(scene, GUID());
        _SceneManager.BatchManagers.push(this.RenderBatchManager);
    }
}
SceneManagerRegion.prototype.BuildWireBox = function(size, offset, color) {

    var mesh = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial(), THREE.LinePieces);
    mesh.material.color.r = color[0];
    mesh.material.color.g = color[1];
    mesh.material.color.b = color[2];


    var vertices = [
        new THREE.Vector3(size[0] / 2, size[1] / 2, size[2] / 2),
        new THREE.Vector3(-size[0] / 2, size[1] / 2, size[2] / 2),
        new THREE.Vector3(-size[0] / 2, -size[1] / 2, size[2] / 2),
        new THREE.Vector3(size[0] / 2, -size[1] / 2, size[2] / 2),

        new THREE.Vector3(size[0] / 2, size[1] / 2, -size[2] / 2),
        new THREE.Vector3(-size[0] / 2, size[1] / 2, -size[2] / 2),
        new THREE.Vector3(-size[0] / 2, -size[1] / 2, -size[2] / 2),
        new THREE.Vector3(size[0] / 2, -size[1] / 2, -size[2] / 2)
    ];

    //mesh.matrix.setPosition(new THREE.Vector3(offset[0],offset[1],offset[2]));
    for (var i = 0; i < vertices.length; i++) {
        vertices[i].x += offset[0];
        vertices[i].y += offset[1];
        vertices[i].z += offset[2];
    }

    // TODO: Wouldn't be nice if Line had .segments?

    var geometry = mesh.geometry;
    geometry.vertices.push(
        vertices[0], vertices[1],
        vertices[1], vertices[2],
        vertices[2], vertices[3],
        vertices[3], vertices[0],

        vertices[4], vertices[5],
        vertices[5], vertices[6],
        vertices[6], vertices[7],
        vertices[7], vertices[4],

        vertices[0], vertices[4],
        vertices[1], vertices[5],
        vertices[2], vertices[6],
        vertices[3], vertices[7]
    );



    mesh.matrixAutoUpdate = true;
    mesh.updateMatrixWorld(true);
    return mesh;
}
SceneManagerRegion.prototype.deinitialize = function() {
    if (this.mesh)
        this.mesh.parent.remove(this.mesh, true);
    for (var i = 0; i < this.childRegions.length; i++) {
        this.childRegions[i].deinitialize();
    }
    if (this.RenderBatchManager) {
        _SceneManager.BatchManagers.splice(_SceneManager.BatchManagers.indexOf(this.RenderBatchManager), 1);
        this.RenderBatchManager.deinitialize();
    }
}


SceneManagerRegion.prototype.getChildren = function() {
    var count = [];
    for (var i = 0; i < this.childRegions.length; i++) {
        count = count.concat(this.childRegions[i].getChildren());
    }
    return count.concat(this.childObjects);
}

SceneManagerRegion.prototype.getChildCount = function() {
    //can we keep track without the recursive search?
    //return this.childCount;

    var count = 0;
    for (var i = 0; i < this.childRegions.length; i++) {
        count += this.childRegions[i].getChildCount();
    }
    return count + this.childObjects.length;
}
SceneManagerRegion.prototype.removeChild = function(child) {
    var removed = false;
    if (this.childObjects.indexOf(child) != -1) {
        removed = true;
        this.childCount--;
        this.childObjects.splice(this.childObjects.indexOf(child), 1);

        if (this.RenderBatchManager) {

            this.RenderBatchManager.remove(child);
        }

    } else {
        for (var i = 0; i < this.childRegions.length; i++) {
            removed = this.childRegions[i].removeChild(child);
            if (removed) {
                this.childCount--;
                break;
            }
        }
    }
    if (this.getChildCount() <= maxObjects)
        this.desplit();
    return removed;
}
SceneManagerRegion.prototype.desplit = function() {
    var children = this.getChildren();
    for (var i = 0; i < this.childRegions.length; i++) {
        this.childRegions[i].deinitialize();
    }
    this.childObjects = children;
    for (var j = 0; j < children.length; j++) {
        children[j].sceneManagerNode = this;
        //this.updateObject(children[j]);


        if (children[j].isStatic()) {

            //search up for the lowest level batch manager I fit in
            var p = this;
            var found = false;
            while (!found && p) {
                if (p.RenderBatchManager) {
                    found = true;
                    break;
                }
                p = p.parent;

            }

            //remove me from my old batch, if any
            if (children[j].RenderBatchManager)
                children[j].RenderBatchManager.remove(children[j]);

            //add to the correct batch, if I'm static
            p.RenderBatchManager.add(children[j]);

        }

    }

    this.childRegions = [];
}
SceneManagerRegion.prototype.getLeaves = function(list) {
    if (!list)
        list = [];
    for (var i = 0; i < this.childRegions.length; i++) {
        this.childRegions[i].getLeaves(list);
    }
    if (this.childRegions.length == 0)
        list.push(this);
}
SceneManagerRegion.prototype.completelyContains = function(object) {

    //changing transforms make this cache not work
    if (!object.boundsCache)
        object.boundsCache = object.GetBoundingBox(true).transformBy(object.getModelMatrix());
    return this.completelyContainsBox(object.boundsCache);
}
SceneManagerRegion.prototype.completelyContainsBox = function(box) {


    if (box.min[0] > this.min[0] && box.max[0] < this.max[0])
        if (box.min[1] > this.min[1] && box.max[1] < this.max[1])
            if (box.min[2] > this.min[2] && box.max[2] < this.max[2])
                return true;
    return false;

}
SceneManagerRegion.prototype.addChild = function(child) {
    //sort the children down into sub nodes
    var added = this.distributeObject(child);

    if (child.isStatic()) {
        if (this.depth == batchAtLevel && added) {
            this.RenderBatchManager.add(child);
        }
        if (this.depth >= 0 && this.depth <= batchAtLevel && !added) {
            this.RenderBatchManager.add(child);
        }
    }
}

function objectSceneManagerDelete() {
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].sceneManagerDelete();
    }
    if (this.RenderBatchManager)
        this.RenderBatchManager.remove(this);
    _SceneManager.removeChild(this);
}

function objectSceneManagerUpdate() {
    //dynamic objects currently should not belong to the octree
    //we really should  try to not get here in the first place. Because when we set 
    delete this.boundsCache;
    if (this.isDynamic()) return;
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].sceneManagerUpdate();
    }
    if (this.SceneManagerIgnore)
        return;

    if (!this.updateCount)
        this.updateCount = 1;
    this.updateCount++;
    if (this.updateCount == 100 && this.isStatic()) {
        console.log(this.name + ' is not static, debatching');
        this._static = false;
        _SceneManager.tempDebatchList.push(this);
    }

    // this.updateMatrixWorld(true);



    this.sceneManagerNode.updateObject(this);

}

SceneManagerRegion.prototype.distributeObject = function(object) {
    var added = false;
    if (this.childObjects.length + 1 > maxObjects && this.depth < maxDepth && this.childRegions.length == 0)
        this.split();
    if (this.childRegions) {
        for (var i = 0; i < this.childRegions.length; i++) {
            if (this.childRegions[i].completelyContains(object)) {
                this.childRegions[i].addChild(object);
                added = true;
                //it either goes in me or my children
                this.childCount++;
                break;
            }
        }
    }
    if (!added) {
        if (this.childObjects.indexOf(object) == -1) {
            this.childObjects.push(object);
            //it either goes in me or my children
            this.childCount++;
            if (this.mesh) {
                this.mesh.material.color.g = this.childObjects.length / maxObjects;
                this.mesh.renderDepth = this.depth * 8 + this.order + this.childObjects.length;
            }

            object.sceneManagerNode = this;
            object.sceneManagerUpdate = objectSceneManagerUpdate;
            object.sceneManagerDelete = objectSceneManagerDelete;
        }
    }
    return added;
}
SceneManagerRegion.prototype.updateObject = function(object) {
    //the object has not crossed  into a new region, so no need to search up
    if (this.completelyContains(object)) {
        if (this.childObjects.indexOf(object) != -1)
            this.removeChild(object)


        this.addChild(object);

        if (!this.RenderBatchManager) {
            //search up for the lowest level batch manager I fit in
            var p = this;
            var found = false;
            while (!found && p) {
                if (p.RenderBatchManager) {
                    found = true;
                    break;
                }
                p = p.parent;

            }

            //remove me from my old batch, if any
            if (object.RenderBatchManager)
                object.RenderBatchManager.remove(object);

            //add to the correct batch, if I'm static
            if (object.isStatic())
                p.RenderBatchManager.add(object);
        }
    }
    //the object has left the region, search up.
    else {
        //if dont have parent, then at top level and cannot toss up
        if (this.parent) {
            this.removeChild(object);
            this.parent.updateObject(object);
        }
    }
}
SceneManagerRegion.prototype.split = function() {

    var v0 = [this.min[0], this.min[1], this.min[2]];
    var v0 = [this.min[0], this.min[1], this.min[2]];
    var v1 = [this.min[0], this.min[1], this.max[2]];
    var v2 = [this.min[0], this.max[1], this.min[2]];
    var v3 = [this.min[0], this.max[1], this.max[2]];
    var v4 = [this.max[0], this.min[1], this.min[2]];
    var v5 = [this.max[0], this.min[1], this.max[2]];
    var v6 = [this.max[0], this.max[1], this.min[2]];
    var v7 = [this.max[0], this.max[1], this.max[2]];

    this.c = [(this.max[0] + this.min[0]) / 2, (this.max[1] + this.min[1]) / 2, (this.max[2] + this.min[2]) / 2];

    this.r = MATH.distanceVec3(this.c, this.max);

    var m1 = [this.c[0], this.min[1], this.min[2]];
    var m2 = [this.max[0], this.c[1], this.c[2]];
    var m3 = [this.min[0], this.c[1], this.min[2]];
    var m4 = [this.c[0], this.max[1], this.c[2]];
    var m5 = [this.c[0], this.c[1], this.min[2]];
    var m6 = [this.max[0], this.max[1], this.c[2]];
    var m7 = [this.min[0], this.min[1], this.c[2]];
    var m8 = [this.c[0], this.c[1], this.max[2]];
    var m9 = [this.c[0], this.min[1], this.c[2]];
    var m10 = [this.max[0], this.c[1], this.max[2]];
    var m11 = [this.min[0], this.c[1], this.c[2]];
    var m12 = [this.c[0], this.max[1], this.max[2]];

    this.childRegions[0] = new SceneManagerRegion(v0, this.c, this.depth + 1, this.scene, 0);
    this.childRegions[1] = new SceneManagerRegion(m1, m2, this.depth + 1, this.scene, 1);
    this.childRegions[2] = new SceneManagerRegion(m3, m4, this.depth + 1, this.scene, 2);
    this.childRegions[3] = new SceneManagerRegion(m5, m6, this.depth + 1, this.scene, 3);
    this.childRegions[4] = new SceneManagerRegion(m7, m8, this.depth + 1, this.scene, 4);
    this.childRegions[5] = new SceneManagerRegion(m9, m10, this.depth + 1, this.scene, 5);
    this.childRegions[6] = new SceneManagerRegion(m11, m12, this.depth + 1, this.scene, 6);
    this.childRegions[7] = new SceneManagerRegion(this.c, v7, this.depth + 1, this.scene, 7);

    this.childRegions[0].parent = this;
    this.childRegions[1].parent = this;
    this.childRegions[2].parent = this;
    this.childRegions[3].parent = this;
    this.childRegions[4].parent = this;
    this.childRegions[5].parent = this;
    this.childRegions[6].parent = this;
    this.childRegions[7].parent = this;

    //if I have faces, but I split, I need to distribute my faces to my children
    var objectsBack = this.childObjects;
    this.childObjects = [];
    for (var i = 0; i < objectsBack.length; i++) {
        if (this.RenderBatchManager)
            this.RenderBatchManager.remove(objectsBack[i]);
        var added = this.distributeObject(objectsBack[i]);
        if (!added) {
            if (this.RenderBatchManager)
                if (objectsBack[i].isStatic())
                    this.RenderBatchManager.add(objectsBack[i]);
        }
    }

    this.isSplit = true;
}

SceneManagerRegion.prototype.contains = function(o) {
    if (o[0] > this.min[0] && o[0] < this.max[0])
        if (o[1] > this.min[1] && o[1] < this.max[1])
            if (o[2] > this.min[2] && o[2] < this.max[2])
                return true;
    return false;
}

//Test a ray against an octree region
SceneManagerRegion.prototype.CPUPick = function(o, d, opts, hits) {

    if(!hits)
       hits = [];
    //if no faces, can be no hits. 
    //remember, faces is all faces in this node AND its children
    if (this.getChildCount().length == 0)
        return hits;

    //reject this node if the ray does not intersect it's bounding box
    if (this.testBoundsRay(o, d) == false) {
        opts.regionsRejectedByBounds++
        return hits;
    }

    //use the render batch. Note that this will not give a VWFID, only good when you don't care what you hit
    if (this.RenderBatchManager && opts && opts.useRenderBatches) {
        opts.batchesTested++;
        return this.RenderBatchManager.CPUPick(o, d, opts,hits);
    }

    //the the opts specify a max dist
    //if the start is not in me, and im to far, don't bother with my children or my objcts
    if (opts.maxDist > 0) {

        if ((MATH.distanceVec3(o, this.c) - this.r) > opts.maxDist) {

            opts.regionsRejectedByDist++;
            return hits;
        }
    }

    opts.regionTests++;
    //check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
    //for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
    for (var i = 0; i < this.childRegions.length; i++) {
        this.childRegions[i].CPUPick(o, d, opts,hits);
    }
    for (var i = 0; i < this.childObjects.length; i++) {
        this.childObjects[i].CPUPick(o, d, opts, hits);
    }
    return hits;

}

//Test a ray against an octree region
SceneManagerRegion.prototype.FrustrumCast = function(frustrum, opts) {

    var hits = [];

    //if no faces, can be no hits. 
    //remember, faces is all faces in this node AND its children
    if (this.getChildCount().length == 0)
        return hits;

    //reject this node if the ray does not intersect it's bounding box
    if (this.testBoundsFrustrum(frustrum).length == 0)
        return hits;

    //the the opts specify a max dist
    //if the start is not in me, and im to far, don't bother with my children or my objcts
    if (opts.maxDist > 0 && this.r + MATH.distanceVec3(o, this.c) > opts.maxDist) {
        if (!this.contains(o))
            return hits;
    }

    //check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
    //for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
    for (var i = 0; i < this.childRegions.length; i++) {
        var childhits = this.childRegions[i].FrustrumCast(frustrum, opts);
        if (childhits) {
            for (var j = 0; j < childhits.length; j++)
                hits.push(childhits[j]);


        }
    }
    for (var i = 0; i < this.childObjects.length; i++) {
        var childhits = this.childObjects[i].FrustrumCast(frustrum, opts);
        if (childhits) {
            for (var j = 0; j < childhits.length; j++)
                hits.push(childhits[j]);

        }
    }
    return hits;
}

//Test a ray against an octree region
SceneManagerRegion.prototype.SphereCast = function(center, r, opts) {

    var hits = [];

    //if no faces, can be no hits. 
    //remember, faces is all faces in this node AND its children
    if (this.getChildCount().length == 0)
        return hits;

    //reject this node if the ray does not intersect it's bounding box
    if (this.testBoundsSphere(center, r).length == 0)
        return hits;

    //the the opts specify a max dist
    //if the start is not in me, and im to far, don't bother with my children or my objcts
    if (opts.maxDist > 0 && this.r + MATH.distanceVec3(o, this.c) > opts.maxDist) {
        if (!this.contains(o))
            return hits;
    }

    //check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
    //for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
    for (var i = 0; i < this.childRegions.length; i++) {
        var childhits = this.childRegions[i].SphereCast(center, r, opts);
        if (childhits) {
            for (var j = 0; j < childhits.length; j++)
                hits.push(childhits[j]);

        }
    }
    for (var i = 0; i < this.childObjects.length; i++) {
        var childhits = this.childObjects[i].SphereCast(center, r, opts);
        if (childhits) {
            for (var j = 0; j < childhits.length; j++)
                hits.push(childhits[j]);

        }
    }
    return hits;
}

SceneManagerRegion.prototype.testBoundsRay = BoundingBoxRTAS.prototype.intersect;
SceneManagerRegion.prototype.testBoundsSphere = BoundingBoxRTAS.prototype.intersectSphere;
SceneManagerRegion.prototype.intersect = BoundingBoxRTAS.prototype.intersect;
SceneManagerRegion.prototype.testBoundsFrustrum = BoundingBoxRTAS.prototype.intersectFrustrum;

_SceneManager = new SceneManager();



THREE.RenderBatch = function(material, scene) {
    this.objects = [];
    this.material = material;
    //hack for VTCE - should probably find and deal with mirrored meshes better

    this.dirty = false;
    this.scene = scene;
    this.totalVerts = 0;
    this.totalFaces = 0;
    this.toAdd = [];
    this.toRemove = [];
}
THREE.RenderBatch.prototype.addObject = function(object) {
    if (this.objects.indexOf(object) == -1) {
        this.totalVerts += object.geometry.vertices.length;
        this.totalFaces += object.geometry.faces.length;
        this.objects.push(object);
        //this.toAdd.push(object);
        this.dirty = true;
    }

}
THREE.RenderBatch.prototype.removeObject = function(object) {
    if (this.objects.indexOf(object) != -1) {
        this.totalVerts -= object.geometry.vertices.length;
        this.totalFaces -= object.geometry.faces.length;
        this.objects.splice(this.objects.indexOf(object), 1);
        //this.toRemove.push(object);
        this.dirty = true;
    }

}
THREE.RenderBatch.prototype.update = function() {

    if (this.dirty)
        this.build();
    this.dirty = false;
}
THREE.RenderBatch.prototype.checkSuitability = function(object) {

    if (this.totalFaces + object.geometry.faces.length > 32767 || this.totalVerts + object.geometry.vertices.length > 32767) return false;
    return compareMaterials(this.material, object.material);
}
THREE.RenderBatch.prototype.deinitialize = function() {
    if (this.mesh)
        this.scene.remove_internal(this.mesh);
}
THREE.RenderBatch.prototype.CPUPick = function(o, d, opts,hits) {
    if(!hits)
        hits = [];
    if (this.mesh)
        return this.mesh.CPUPick(o, d, opts,hits);
    return hits;
}
THREE.RenderBatch.prototype.testForMirroredMatrix = function(matrix) {

    if (!matrix)
        throw new Error('matrix was null');

    var xAxis = new THREE.Vector3(matrix.elements[0], matrix.elements[4], matrix.elements[8]);
    var yAxis = new THREE.Vector3(matrix.elements[1], matrix.elements[5], matrix.elements[9]);
    var zAxis = new THREE.Vector3(matrix.elements[2], matrix.elements[6], matrix.elements[10]);

    xAxis.normalize();
    yAxis.normalize();
    zAxis.normalize();

    var xDot = xAxis.clone().cross(yAxis).dot(zAxis);
    var yDot = yAxis.clone().cross(zAxis).dot(xAxis);
    var zDot = zAxis.clone().cross(xAxis).dot(yAxis);

    if (xDot * yDot * zDot < 0) {

        return true;
    }
    return false;
}
THREE.RenderBatch.prototype.build = function() {
    //console.log('Building batch ' + this.name + ' : objects = ' + this.objects.length); 

    //do the merge:
    if (this.mesh) {
        this.scene.remove_internal(this.mesh);
        this.mesh.geometry.dispose();
    }

    if (this.objects.length == 0) return;

    this.mesh = null;
    var geo = new THREE.Geometry();
    geo.normals = [];
    this.mesh = new THREE.Mesh(geo, this.objects[0].material.clone());
    this.mesh.castShadow = _SettingsManager.getKey('shadows');
    this.mesh.receiveShadow = _SettingsManager.getKey('shadows');
    this.scene.add_internal(this.mesh);

    var totalUVSets = 1;

    var needColors = false;
    for (var i = 0; i < this.objects.length; i++) {

        totalUVSets = Math.max(totalUVSets, this.objects[i].geometry.faceVertexUvs.length);
        needColors = needColors || (this.objects[i].geometry.vertexColors && this.objects[i].geometry.vertexColors.length);
    }
    //console.log(totalUVSets);
    for (var i = 0; i < totalUVSets; i++) {
        geo.faceVertexUvs[i] = [];
    }
    for (var i = 0; i < this.objects.length; i++) {

        var tg = this.objects[i].geometry;
        var matrix = this.objects[i].matrixWorld.clone();
        var matrixIsMirrored = this.testForMirroredMatrix(matrix);

        var normalMatrix = new THREE.Matrix3();
        normalMatrix.getInverse(matrix);
        normalMatrix.transpose();
        //normalMatrix.elements[3] = normalMatrix.elements[7] = normalMatrix.elements[11] = 0;
        if (tg) {

            for (var j = 0; j < tg.faces.length; j++) {
                var face = tg.faces[j];
                var newface;
                if (face.d !== undefined)
                    newface = new THREE.Face4();
                else
                    newface = new THREE.Face3();

                if (!matrixIsMirrored) {
                    newface.a = face.a + geo.vertices.length;
                    newface.b = face.b + geo.vertices.length;
                    newface.c = face.c + geo.vertices.length;
                    if (face.d !== undefined)
                        newface.d = face.d + geo.vertices.length;
                } else {
                    newface.b = face.a + geo.vertices.length;
                    newface.a = face.b + geo.vertices.length;
                    if (face.d !== undefined) {
                        newface.d = face.c + geo.vertices.length;
                        newface.c = face.d + geo.vertices.length;
                    } else {
                        newface.c = face.c + geo.vertices.length;
                    }

                }
                //newface.materialIndex = face.materialIndex;

                newface.normal.copy(face.normal);

                newface.normal.applyMatrix3(normalMatrix).normalize();
                for (var k = 0; k < face.vertexNormals.length; k++)
                    newface.vertexNormals.push(face.vertexNormals[k].clone().applyMatrix3(normalMatrix).normalize());
                for (var k = 0; k < face.vertexColors.length; k++)
                    if (face.vertexColors[k])
                        newface.vertexColors.push(face.vertexColors[k].clone());

                geo.faces.push(newface);

            }
            for (var j = 0; j < tg.vertices.length; j++) {
                geo.vertices.push(tg.vertices[j].clone().applyMatrix4(matrix));
            }

            if (tg.normals)
                for (var j = 0; j < tg.normals.length; j++) {
                    geo.normals.push(tg.normals[j].clone().applyMatrix4(matrix));
                }



            for (var l = 0; l < totalUVSets; l++) {
                var uvs2 = tg.faceVertexUvs[l];

                if (uvs2 && uvs2.length === tg.faces.length) {
                    for (u = 0, il = uvs2.length; u < il; u++) {

                        var uv = uvs2[u],
                            uvCopy = [];

                        for (var j = 0, jl = uv.length; j < jl; j++) {

                            uvCopy.push(new THREE.Vector2(uv[j] ? uv[j].x : 0, uv[j] ? uv[j].y : 0));

                        }

                        geo.faceVertexUvs[l].push(uvCopy);

                    }
                } else {
                    for (u = 0, il = tg.faces.length; u < il; u++) {

                        var count = 3;
                        if (tg.faces[u].d !== undefined)
                            count = 4;

                        var uvCopy = [];
                        for (var j = 0, jl = count; j < jl; j++) {

                            uvCopy.push(new THREE.Vector2(0, 0));

                        }

                        geo.faceVertexUvs[l].push(uvCopy);

                    }

                }
            }
        }
    }
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
}

function compareMaterials(m1, m2) {

    if (!m1 || !m2) return false;

    // this does not catch all!!!!
    if (m1.constructor != m2.constructor) {
        return false;
    }
    if (m1 instanceof THREE.MeshPhongMaterial && m2 instanceof THREE.MeshPhongMaterial) {
        return compareMaterialsPhong(m1, m2);
    }
    if (m1 instanceof THREE.MeshBasicMaterial && m2 instanceof THREE.MeshBasicMaterial) {
        return compareMaterialsBasic(m1, m2);
    }
    if (m1 instanceof THREE.MeshLambertMaterial && m2 instanceof THREE.MeshLambertMaterial) {
        return compareMaterialsLambert(m1, m2);
    }
    if (m1 instanceof THREE.MeshFaceMaterial && m2 instanceof THREE.MeshFaceMaterial) {
        return compareMaterialsFace(m1, m2);
    }
    return false;
}

function compareMaterialsFace(m1, m2) {
    //TODO: not used in VTCE
}

function compareMaterialsBasic(m1, m2) {
    //TODO: not used in VTCE
}

function compareMaterialsLambert(m1, m2) {

    var delta = 0;
    delta += Math.abs(m1.color.r - m2.color.r);
    delta += Math.abs(m1.color.g - m2.color.g);
    delta += Math.abs(m1.color.b - m2.color.b);

    delta += Math.abs(m1.ambient.r - m2.ambient.r);
    delta += Math.abs(m1.ambient.g - m2.ambient.g);
    delta += Math.abs(m1.ambient.b - m2.ambient.b);

    delta += Math.abs(m1.emissive.r - m2.emissive.r);
    delta += Math.abs(m1.emissive.g - m2.emissive.g);
    delta += Math.abs(m1.emissive.b - m2.emissive.b);

    delta += Math.abs(m1.opacity - m2.opacity);

    delta += Math.abs(m1.transparent - m2.transparent);

    delta += Math.abs(m1.reflectivity - m2.reflectivity);
    delta += Math.abs(m1.alphaTest - m2.alphaTest);

    delta += m1.side != m2.side ? 1000 : 0;
    var mapnames = ['map', 'lightMap', 'specularMap'];
    for (var i = 0; i < mapnames.length; i++) {
        var mapname = mapnames[i];



        if (m1[mapname] && !m2[mapname]) {
            delta += 1000;
        }
        if (!m1[mapname] && m2[mapname]) {
            delta += 1000;
        }
        if (m1[mapname] && m2[mapname]) {
            if (m1[mapname].image && m2[mapname].image)
                if (m1[mapname].image.src && m1[mapname].image.src) {
                    if (m1[mapname].image.src.toString() != m2[mapname].image.src.toString())
                        delta += 1000;
                    if (m1[mapname]._SMsrc != m2[mapname]._SMsrc)
                        delta += 1000;
                } else {
                    if (m1[mapname].image != m2[mapname].image)
                        delta += 1000;
                }



            delta += m1[mapname].wrapS != m1[mapname].wrapS;
            delta += m1[mapname].wrapT != m1[mapname].wrapT;
            delta += Math.abs(m1[mapname].mapping.constructor != m2[mapname].mapping.constructor) * 1000;
            delta += Math.abs(m1[mapname].repeat.x - m2[mapname].repeat.x);
            delta += Math.abs(m1[mapname].repeat.y - m2[mapname].repeat.y);
            delta += Math.abs(m1[mapname].offset.x - m2[mapname].offset.x);
            delta += Math.abs(m1[mapname].offset.y - m2[mapname].offset.y);
        }

    }

    if (delta < .001)
        return true;
    return false;
}

function compareMaterialsPhong(m1, m2) {

    var delta = 0;
    delta += Math.abs(m1.color.r - m2.color.r);
    delta += Math.abs(m1.color.g - m2.color.g);
    delta += Math.abs(m1.color.b - m2.color.b);

    delta += Math.abs(m1.ambient.r - m2.ambient.r);
    delta += Math.abs(m1.ambient.g - m2.ambient.g);
    delta += Math.abs(m1.ambient.b - m2.ambient.b);

    delta += Math.abs(m1.emissive.r - m2.emissive.r);
    delta += Math.abs(m1.emissive.g - m2.emissive.g);
    delta += Math.abs(m1.emissive.b - m2.emissive.b);

    delta += Math.abs(m1.specular.r - m2.specular.r);
    delta += Math.abs(m1.specular.g - m2.specular.g);
    delta += Math.abs(m1.specular.b - m2.specular.b);

    delta += Math.abs(m1.opacity - m2.opacity);

    delta += Math.abs(m1.transparent - m2.transparent);

    delta += Math.abs(m1.shininess - m2.shininess);

    delta += Math.abs(m1.reflectivity - m2.reflectivity);
    delta += Math.abs(m1.alphaTest - m2.alphaTest);
    delta += Math.abs(m1.bumpScale - m2.bumpScale);
    delta += Math.abs(m1.normalScale.x - m2.normalScale.x);
    delta += Math.abs(m1.normalScale.y - m2.normalScale.y);
    delta += m1.side != m2.side ? 1000 : 0;
    var mapnames = ['map', 'bumpMap', 'lightMap', 'normalMap', 'specularMap'];
    for (var i = 0; i < mapnames.length; i++) {
        var mapname = mapnames[i];



        if (m1[mapname] && !m2[mapname]) {
            delta += 1000;
        }
        if (!m1[mapname] && m2[mapname]) {
            delta += 1000;
        }
        if (m1[mapname] && m2[mapname]) {
            if (m1[mapname].image && m2[mapname].image)
                if (m1[mapname].image.src && m1[mapname].image.src) {
                    if (m1[mapname].image.src.toString() != m2[mapname].image.src.toString())
                        delta += 1000;
                    if (m1[mapname]._SMsrc != m2[mapname]._SMsrc)
                        delta += 1000;
                } else {
                    if (m1[mapname].image != m2[mapname].image)
                        delta += 1000;
                }



            delta += m1[mapname].wrapS != m1[mapname].wrapS;
            delta += m1[mapname].wrapT != m1[mapname].wrapT;
            delta += Math.abs(m1[mapname].mapping.constructor != m2[mapname].mapping.constructor) * 1000;
            delta += Math.abs(m1[mapname].repeat.x - m2[mapname].repeat.x);
            delta += Math.abs(m1[mapname].repeat.y - m2[mapname].repeat.y);
            delta += Math.abs(m1[mapname].offset.x - m2[mapname].offset.x);
            delta += Math.abs(m1[mapname].offset.y - m2[mapname].offset.y);
        }

    }

    if (delta < .001)
        return true;
    return false;


}


THREE.RenderBatchManager = function(scene, name) {
    this.scene = scene;
    this.name = name;
    this.objects = [];
    this.batches = [];

}
THREE.RenderBatchManager.prototype.CPUPick = function(o, d, opts,hits) {
    if(!hits)
        hits = [];
    for (var i = 0; i < this.batches.length; i++)
        this.batches[i].CPUPick(o, d, opts,hits);
    return hits;

}
THREE.RenderBatchManager.prototype.update = function() {

    if (this.dirty)
        for (var i = 0; i < this.batches.length; i++)
            this.batches[i].update();
    this.dirty = false;
}

THREE.RenderBatchManager.prototype.add = function(child) {

    //if(this.objects.indexOf(child) != -1)
    //	return;

    if (child.RenderBatchManager)
        child.RenderBatchManager.remove(child);



    this.objects.push(child);
    child.visible = false;

    child.RenderBatchManager = this;

    var added = false;
    for (var i = 0; i < this.batches.length; i++) {
        if (this.batches[i].checkSuitability(child)) {
            this.batches[i].addObject(child);
            if (!child.reBatchCount)
                child.reBatchCount = 0;
            child.reBatchCount++;
            added = true;
        }
    }
    if (!added) {
        var newbatch = new THREE.RenderBatch(child.material.clone(), this.scene);
        newbatch.addObject(child);
        this.batches.push(newbatch);
    }

    //	console.log('adding ' + child.name + ' to batch' + this.name);  
    this.dirty = true;
}

THREE.RenderBatchManager.prototype.remove = function(child) {

    if (this.objects.indexOf(child) == -1)
        return;

    child.visible = true;
    child.RenderBatchManager = null;
    //	console.log('removing ' + child.name + ' from batch' + this.name);  
    this.objects.splice(this.objects.indexOf(child), 1);

    var indexToDelete = [];
    for (var i = 0; i < this.batches.length; i++) {
        this.batches[i].removeObject(child);
        if (this.batches[i].objects.length == 0)
            indexToDelete.push(i);
    }
    for (var i = 0; i < indexToDelete.length; i++) {
        this.batches[indexToDelete[i]].deinitialize();
        this.batches.splice(indexToDelete[i], 1);
    }
    this.dirty = true;
}

THREE.RenderBatchManager.prototype.materialUpdated = function(child) {
    if (this.objects.indexOf(child) == -1) {
        console.log('Should have never got here. Updating material in batch taht does not contain object');
        return;
    }
    this.remove(child);
    this.add(child);
}
THREE.RenderBatchManager.prototype.deinitialize = function(child) {

    if (this.mesh)
        this.scene.remove_internal(this.mesh);
    for (var i = 0; i < this.batches.length; i++) {
        this.batches[i].deinitialize();
    }
}



//return _SceneManager;
//});