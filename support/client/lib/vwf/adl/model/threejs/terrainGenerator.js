new(function() {


    var MAXWORKERS = 8;
    var IDLE = 0;
    var RUNNING = 1;
    var CANCELED = 2;

    this.terrainDataReceived = function(dataBack, mesh, readers, cb) {


        var now = performance.now();
        this.regencount++;
        var geo = mesh.geometry;

        var vertices = readers[0];
        var normals = readers[1];
        var everyOtherZ = readers[2];
        var everyOtherNormal = readers[3];

        var ai, aj, ac, bi, bj, bc, ci, cj, cc;
        var res = mesh.res;


        for (var i = 0; i < mesh.res * mesh.res; i++) {
            mesh.material.attributes.ONormal.value[i].x = normals[i * 3];
            mesh.material.attributes.ONormal.value[i].y = normals[i * 3 + 1];
            mesh.material.attributes.ONormal.value[i].z = normals[i * 3 + 2];
        }
        for (var i = 0; i < mesh.res * mesh.res; i++) {
            mesh.material.attributes.everyOtherNormal.value[i].x = everyOtherNormal[i * 3];
            mesh.material.attributes.everyOtherNormal.value[i].y = everyOtherNormal[i * 3 + 1];
            mesh.material.attributes.everyOtherNormal.value[i].z = everyOtherNormal[i * 3 + 2];
        }



        for (var i = 0; i < mesh.res * mesh.res; i++) {
            mesh.material.attributes.everyOtherZ.value[i] = everyOtherZ[i];
        }
        for (var i = 0; i < mesh.res * mesh.res; i++) {
            mesh.geometry.vertices[i].z = vertices[i * 3 + 2];
            mesh.material.attributes.everyZ.value[i] = mesh.geometry.vertices[i].z;
        }

        for (var i = mesh.res * mesh.res; i < mesh.geometry.vertices.length; i++) {
            mesh.material.attributes.everyOtherNormal.value[i].x = everyOtherNormal[(mesh.geometry.vertices[i].topedge) * 3];
            mesh.material.attributes.everyOtherNormal.value[i].y = everyOtherNormal[(mesh.geometry.vertices[i].topedge) * 3 + 1];
            mesh.material.attributes.everyOtherNormal.value[i].z = everyOtherNormal[(mesh.geometry.vertices[i].topedge) * 3 + 2];
        }
        for (var i = mesh.res * mesh.res; i < mesh.geometry.vertices.length; i++) {
            mesh.material.attributes.everyOtherZ.value[i] = everyOtherZ[(mesh.geometry.vertices[i].topedge)] - (mesh.scale.x) * 5;
        }
        for (var i = mesh.res * mesh.res; i < mesh.geometry.vertices.length; i++) {
            //set the position cpu side for collision
            mesh.geometry.vertices[i].z = vertices[(mesh.geometry.vertices[i].topedge) * 3 + 2] - (mesh.scale.x) * 5;
            //but upload vert z via attribute to move less data over bus
            mesh.material.attributes.everyZ.value[i] = mesh.geometry.vertices[i].z;
        }
        for (var i = mesh.res * mesh.res; i < mesh.geometry.vertices.length; i++) {
            mesh.material.attributes.ONormal.value[i].x = normals[(mesh.geometry.vertices[i].topedge) * 3];
            mesh.material.attributes.ONormal.value[i].y = normals[(mesh.geometry.vertices[i].topedge) * 3 + 1];
            mesh.material.attributes.ONormal.value[i].z = normals[(mesh.geometry.vertices[i].topedge) * 3 + 2];
        }

        mesh.material.attributes.everyOtherNormal.needsUpdate = true;
        mesh.material.attributes.everyOtherZ.needsUpdate = true;
        mesh.material.attributes.everyZ.needsUpdate = true;
        mesh.material.attributes.ONormal.needsUpdate = true;

        //geo.verticesNeedUpdate = true;
        geo.computeBoundingSphere();
        geo.computeBoundingBox();

        //	geo.normalsNeedUpdate = true;
        geo.dirtyMesh = true;

        var time = performance.now() - now;
        this.totalregentime += time;
        //console.log(this.totalregentime/this.regencount);
        if (cb)
            cb();

    }

    this.countFreeWorkers = function() {
        if (this.waitingForInit === true)
            return 0;
        var i = 0;
        for (var j = 0; j < MAXWORKERS; j++) {
            if (this.currentMesh[j] === null)
                i++;
        }
        return i;
    }
    this.countBusyWorkers = function() {
        if (this.waitingForInit === true)
            return MAXWORKERS;
        return MAXWORKERS - this.countFreeWorkers();
    }
    this.sendTerrainRequest = function(data, mesh, cb) {
        var i = -1;
        for (var j = 0; j < MAXWORKERS; j++) {
            if (this.currentMesh[j] === null)
                var i = j;
        }
        //if(this.currentMesh[i])
        //	debugger;
        this.currentCB[i] = cb;
        this.currentMesh[i] = mesh;
        this.currentID[i] = Math.floor(Math.random() * 10000000);
        this.currentState[i] = RUNNING;
        if (this.supportsTransferables) {
            var request = {
                command: 'generateTerrain',
                data: data,
                id: this.currentID[i],
                buffers: this.currentBuffers[i]
            };
            this.worker[i].postMessage(request, request.buffers);
        } else {
            var request = {
                command: 'generateTerrain',
                data: data,
                id: this.currentID[i],
                buffers: []
            };
            this.worker[i].postMessage(request);
        }

    }
    this.sample = function(vert, matrix, res) {
        if (this.waitingForInit == true) return 0;
        return this.terrainAlgorithm.displace(vert);
    }
    this.message = function(e) {
        if (e.data.command == "console")
            console.log(e.data.data);
        if (e.data.command == "terrainData") {

            var i = this.currentID.indexOf(e.data.id);
            this.currentBuffers[i] = [e.data.data.vertices, e.data.data.normals, e.data.data.everyOtherZ, e.data.data.everyOtherNormal];
            if (this.currentCB[i] && this.currentState[i] != CANCELED) {

                this.currentState[i] = IDLE;
                var cb = this.currentCB[i];
                var mesh = this.currentMesh[i];
                this.currentCB[i] = null;
                this.currentMesh[i] = null;
                //	console.log("response from  tile");




                if (mesh) {

                    this.readers[i] = [];
                    this.readers[i][0] = new Float32Array(e.data.data.vertices);
                    this.readers[i][1] = new Float32Array(e.data.data.normals);
                    this.readers[i][2] = new Float32Array(e.data.data.everyOtherZ);
                    this.readers[i][3] = new Float32Array(e.data.data.everyOtherNormal);

                    this.terrainDataReceived(e.data.data, mesh, this.readers[i], cb);
                }
            } else {
                this.currentState[i] = IDLE;
                this.currentCB[i] = null;
                this.currentMesh[i] = null;
                console.log("response from canceled tile");
            }
        }

    }
    this.cancel = function() {
        for (var i = 0; i < MAXWORKERS; i++) {
            if (this.currentCB[i])
                this.currentCB[i](true);

            this.currentState[i] = CANCELED;

        }
    }
    this.deinit = function() {
        for (var i = 0; i < MAXWORKERS; i++) {
            if (this.worker && this.worker[i])
                this.worker[i].terminate();
        }
    }
    this.init = function(type, params) {
        for (var i = 0; i < MAXWORKERS; i++) {
            if (this.worker && this.worker[i])
                this.worker[i].terminate();
        }

        this.regencount = 0;
        this.totalregentime = 0;

        this.worker = [];
        this.currentCB = [];
        this.currentMesh = [];
        this.currentID = [];
        this.currentBuffers = [];
        this.readers = [];
        this.currentState = [];

        try {
            loadScript('vwf/model/threejs/' + type + '.js');
        } catch (e) {
            type = 'NoiseTerrainAlgorithm';
            loadScript('vwf/model/threejs/' + type + '.js');
        }
        this.terrainAlgorithm = new(eval(type))();



        this.terrainAlgorithm.importScript = function(url) {

            var xhr = $.ajax("vwf/model/threejs/" + url, {
                async: false
            });
            return eval(xhr.responseText);


        }.bind(this.terrainAlgorithm);

        this.terrainAlgorithm.materialRebuildCB = function() {
            self.TileCache.rebuildAllMaterials();
        }

        var poolSideData;


        var init = function(psd) {
            this.waitingForInit = false;
            this.terrainAlgorithm.init(psd);
            this.terrainAlgorithm.setAlgorithmDataPool(params);


            for (var i = 0; i < MAXWORKERS; i++) {
                this.worker[i] = new Worker("vwf/model/threejs/terrainGeneratorThread.js");
                this.worker[i].addEventListener('message', this.message.bind(this));
                this.worker[i].postMessage({
                    command: 'init',
                    data: {
                        type: type,
                        params: (params)
                    }
                });
                this.worker[i].postMessage({
                    command: 'threadInit',
                    data: psd
                });
                this.worker[i].postMessage({
                    command: 'setAlgorithmData',
                    data: (params)
                });
                this.currentCB[i] = null;
                this.currentMesh[i] = null;
                this.currentID[i] = null;
                this.currentBuffers[i] = [];
            }


            this.supportsTransferables = true;

            try {
                var ab = new ArrayBuffer(1);
                this.worker[0].postMessage(ab, [ab]);
                if (ab.byteLength) {
                    console.log('Transferables are not supported in your browser!');
                    this.supportsTransferables = false;
                } else {
                    // Transferables are supported.
                }
            } catch (e) {
                if (e.message == "DataCloneError") {
                    console.log('Transferables are not supported in your browser!');
                    this.supportsTransferables = false;
                }
            }


        }.bind(this);

        if (this.terrainAlgorithm.poolInit)
            poolSideData = this.terrainAlgorithm.poolInit(init, params);



        if (poolSideData === false)
            this.waitingForInit = true;
        else {
            init(poolSideData);
        }






    }

    this.getMaterialUniforms = function(mesh, matrix) {
        if (this.terrainAlgorithm.getMaterialUniforms)
            return this.terrainAlgorithm.getMaterialUniforms(mesh, matrix);
        return null;
    }
    this.getDiffuseFragmentShader = function(mesh, matrix) {
        if (this.terrainAlgorithm.getDiffuseFragmentShader)
            return this.terrainAlgorithm.getDiffuseFragmentShader(mesh, matrix);
        return null;
    }
    this.getNormalFragmentShader = function(mesh, matrix) {
        if (this.terrainAlgorithm.getNormalFragmentShader)
            return this.terrainAlgorithm.getNormalFragmentShader(mesh, matrix);
        return null;

    }
    this.updateMaterial = function(m, d) {

        if (this.terrainAlgorithm.updateMaterial)
            this.terrainAlgorithm.updateMaterial(m, d);
    }
    this.reInit = function(type, params) {
        this.init(type, params);
    }
    this.getAlgorithmData = function() {
        return this.terrainAlgorithm.getAlgorithmDataPool();
    }
    this.getEditorData = function() {
        return this.terrainAlgorithm.getEditorData();
    }
    this.setAlgorithmData = function(params, updatelist) {
        var list = this.terrainAlgorithm.setAlgorithmDataPool(params, updatelist);
        for (var i = 0; i < MAXWORKERS; i++) {
            this.worker[i].postMessage({
                command: 'setAlgorithmData',
                data: (params)
            });
        }
        return list;
    }
    this.test = function() {
        this.worker[0].postMessage({
            command: 'test',
            data: null
        });
    }


    this.generateTerrain = function(mesh, normlen, cb) {


        var vertices = [];

        for (var i = 0; i < mesh.res * mesh.res; i++) {
            vertices.push(mesh.geometry.vertices[i].x);
            vertices.push(mesh.geometry.vertices[i].y);
            vertices.push(mesh.geometry.vertices[i].z);
        }
        var data = {};
        data.vertices = vertices;
        mesh.updateMatrix();

        data.matrix = mesh.matrix.clone().elements;

        this.sendTerrainRequest(data, mesh, cb);
        //var dataBack = this.generateTerrainSimWorker(data)	


    }

})()