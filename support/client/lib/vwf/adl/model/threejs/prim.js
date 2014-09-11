(function() {
    function prim(childID, childSource, childName) {
        this.callingMethod = function(methodName, args) {
            if (methodName == 'GetMesh') {
                return this.GetMesh();
            }
            if (methodName == 'dirtyStack') {
                return this.dirtyStack();
            }
            if (methodName == 'updateStack') {
                return this.updateStack();
            }
            if (methodName == 'updateSelf') {
                return this.updateSelf();
            }
        }
        this.PrimGetAllLeafMeshes = function(threeObject, list) {
            if (!list) list = [];
            if (threeObject instanceof THREE.Mesh || threeObject instanceof THREE.Line) {
                list.push(threeObject);
            }
            if (threeObject.children) {
                for (var i = 0; i < threeObject.children.length; i++) {
                    this.PrimGetAllLeafMeshes(threeObject.children[i], list);
                }
            }
            return list;
        }
        this.initializingNode = function() {
            this.dirtyStack();
        }
        this.GetMesh = function() {
            return this.rootnode.children[0];
        }
        this.GetBounds = function() {
            return this.GetMesh().getBoundingBox(true);
        }
        this.updateSelf = function(rebuild, cache) {
            if (rebuild) {
                this.Build(cache);
                this.backupMesh();
            } else {
                this.restoreMesh();
            }
            if (this.GetMesh())
                this.GetMesh().geometry.dirtyMesh = true;

        }

        this.dirtyStack = function(rebuild, cache) {
            this.updateStack(rebuild, cache);
        }
        this.gettingProperty = function(propertyName) {
            if (propertyName == 'type') {
                return 'Primitive';
            }

        }
        this.hasModifiers = function() {
            var has = false;
            if (this.children)
                for (var i = 0; i < this.children.length; i++) {
                    if (vwf.getProperty(this.children[i].ID, 'type') == 'modifier')
                        has = true;

                }
            return has;
        }
        this.updateStack = function(rebuild, cache) {

            this.updateSelf(rebuild, cache && !this.hasModifiers());

            var children = vwf.children(this.ID);


            for (var i in children) {
                vwf.callMethod(children[i], 'updateStack');
            }
        }
        this.backupMesh = function() {

            if (!this.GetMesh())
                return;
            var geometry = this.GetMesh().geometry;
            if (geometry.vertices)
                geometry.originalPositions = this.copyArray([], geometry.vertices);
            if (geometry.faces)
                geometry.originalFaces = this.copyArray([], geometry.faces);
            if (geometry.normals)
                geometry.originalNormals = this.copyArray([], geometry.normals);
            if (geometry.faceVertexUvs[0]) {

                geometry.originalfaceVertexUvs = [];
                for (var i = 0; i < geometry.faceVertexUvs[0].length; i++) {
                    var arr = [];
                    for (var j = 0; j < geometry.faceVertexUvs[0][i].length; j++)
                        arr.push(geometry.faceVertexUvs[0][i][j].clone());
                    geometry.originalfaceVertexUvs.push(arr);
                }
            }

        }
        this.copyArray = function(arrNew, arrOld) {
            if (!arrNew)
                arrNew = [];
            arrNew.length = 0;
            for (var i = 0; i < arrOld.length; i++)
                arrNew.push(arrOld[i].clone());
            return arrNew;
        }
        this.restoreMesh = function() {
            if (!this.GetMesh())
                return;
            var geometry = this.GetMesh().geometry;
            if (!geometry)
                return;
            if (geometry.originalPositions)
                this.copyArray(geometry.vertices, geometry.originalPositions);
            if (geometry.originalNormals)
                this.copyArray(geometry.normals, geometry.originalNormals);
            if (geometry.originalFaces)
                this.copyArray(geometry.faces, geometry.originalFaces);
            if (geometry.originalfaceVertexUvs) {

                geometry.faceVertexUvs[0] = [];
                for (var i = 0; i < geometry.originalfaceVertexUvs.length; i++) {
                    var arr = [];
                    for (var j = 0; j < geometry.originalfaceVertexUvs[i].length; j++)
                        arr.push(geometry.originalfaceVertexUvs[i][j].clone());
                    geometry.faceVertexUvs[0].push(arr);
                }
            }

            geometry.verticesNeedUpdate = true;
            geometry.normalsNeedUpdate = true;
            geometry.facesNeedUpdate = true;
            geometry.uvsNeedUpdate = true;
            this.GetMesh().position.x = 0;
            this.GetMesh().position.y = 0;
            this.GetMesh().position.z = 0;
            this.GetMesh().updateMatrixWorld(true);
        }
        this.Build = function(cache) {
            var mat;
            if (this.rootnode.children[0])
                mat = this.rootnode.children[0].material;
            else
                mat = new THREE.MeshPhongMaterial();

            if (this.mesh) {
                this.rootnode.remove(this.mesh);
                //here, we need to deallocate the geometry
                var list = [];
                this.PrimGetAllLeafMeshes(this.mesh, list);
                for (var i = 0; i < list.length; i++) {
                    if (list[i] && list[i].geometry) {
                        //currently, we can't deallocate because we cache cubes
                        //list[i].geometry.deallocate();
                    }
                }
            }

            var mesh = this.BuildMesh(mat, cache);
            this.mesh = mesh;
          

            this.rootnode.add(mesh);

            this.mesh.updateMatrixWorld();
            var cast = this.gettingProperty('castShadows');
            var rec = this.gettingProperty('receiveShadows');

            var pass = this.gettingProperty('passable');
            var sel = this.gettingProperty('isSelectable');
            // reset the shadows flags for the new mesh
            this.settingProperty('castShadows', cast);
            this.settingProperty('visible', this.gettingProperty('visible'));
            this.settingProperty('receiveShadows', rec);
            this.settingProperty('passable', pass);
            this.settingProperty('isSelectable', sel);

        }
        this.inherits = ['vwf/model/threejs/materialDef.js', 'vwf/model/threejs/shadowcaster.js', 'vwf/model/threejs/transformable.js', 'vwf/model/threejs/passable.js', 'vwf/model/threejs/visible.js', 'vwf/model/threejs/static.js', 'vwf/model/threejs/selectable.js'];
    }
    //default factory code
    return function(childID, childSource, childName) {
        //name of the node constructor
        return new prim(childID, childSource, childName);
    }
})();