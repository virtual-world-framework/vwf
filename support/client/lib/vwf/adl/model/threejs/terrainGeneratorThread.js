self.init = function(data) {


    var secureCryptoPRGN = function() {
        var buf = new Uint8Array(1);
        Math.SecureRandom = function() {
            if (self.crypto)
                self.crypto.getRandomValues(buf);
            else if (self.msCrypto)
                self.msCrypto.getRandomValues(buf);
            else
                buf[0] = Math.random() * 256;
            return (buf[0]) / 256;
        }

    };
    secureCryptoPRGN();

    var generateType = data.type;
    if (!self.THREE) {
        importScripts('three.js');
    }
    importScripts(generateType + '.js');

    this.terrainAlgorithm = new(eval(generateType))(data.params);
    this.terrainAlgorithm.importScript = function(url) {
        importScripts(url);
    }
    console.log('init complete');

    self.supportsTransferables = true;

    try {
        var ab = new ArrayBuffer(1);
        self.postMessage(ab, [ab]);
        if (ab.byteLength) {
            self.log('Transferables are not supported in your browser!');
            self.supportsTransferables = false;
        } else {
            // Transferables are supported.
        }
    } catch (e) {
        if (e.message == "DataCloneError") {
            self.log('Transferables are not supported in your browser!');
            self.supportsTransferables = false;
        }
    }

}

self.threadInit = function(data) {
    this.terrainAlgorithm.init(data);
    console.log('terrainAlgorithm init complete');
}

self.setAlgorithmData = function(data) {
    this.terrainAlgorithm.setAlgorithmData(data);
    console.log('terrainAlgorithm setdata complete');
}


this.vertices = [];
this.normals = [];
this.everyOtherZ = [];
this.everyOtherNormal = [];
this.normals = [];
this.normalsL2 = [];
this.heights = [];
this.generateTerrainSimWorker = function(datain, buffers) {
    this.vertices.length = 0;
    this.normals.length = 0;
    this.everyOtherZ.length = 0;
    this.everyOtherNormal.length = 0;
    var matrix = new THREE.Matrix4();
    matrix.elements = datain.matrix;

    for (var i = 0; i < datain.vertices.length; i += 3) {
        var ver = new THREE.Vector3();
        ver.x = datain.vertices[i];
        ver.y = datain.vertices[i + 1];
        ver.z = datain.vertices[i + 2];
        vertices.push(ver);
    }


    var vertoffset = 4 * datain.matrix[0];
    vertoffset2 = vertoffset * 2;
    var invmat = new THREE.Matrix4();

    invmat = invmat.getInverse(matrix.clone().setPosition(new THREE.Vector3()));
    invmat.elements[12] = 0;
    invmat.elements[13] = 0;
    invmat.elements[14] = 0;
    var res = Math.floor(Math.sqrt(vertices.length));
    normals.length = 0;
    normalsL2.length = 0;
    heights.length = 0;


    for (var j = 0; j < res; j++) {
        if (!normals[j])
            normals[j] = [];
        else
            normals[j].length = 0;

        if (!normalsL2[j])
            normalsL2[j] = [];
        else
            normalsL2[j].length = 0;

        if (!heights[j])
            heights[j] = [];
        else
            heights[j].length = 0;
        for (var l = 0; l < res; l++) {

            var i = j * res + l;
            var vertn = vertices[i].clone();

            vertn = vertn.applyMatrix4(matrix);

            var vertx0 = new THREE.Vector3(vertn.x - vertoffset, vertn.y, vertn.z);
            var verty0 = new THREE.Vector3(vertn.x, vertn.y - vertoffset, vertn.z);
            var vertx1 = new THREE.Vector3(vertn.x + vertoffset, vertn.y, vertn.z);
            var verty1 = new THREE.Vector3(vertn.x, vertn.y + vertoffset, vertn.z);
            var vert11 = new THREE.Vector3(vertn.x + vertoffset, vertn.y + vertoffset, vertn.z);
            var vert00 = new THREE.Vector3(vertn.x, vertn.y + vertoffset, vertn.z);

            var vertx02 = new THREE.Vector3(vertn.x - vertoffset2, vertn.y, vertn.z);
            var verty02 = new THREE.Vector3(vertn.x, vertn.y - vertoffset2, vertn.z);
            var vertx12 = new THREE.Vector3(vertn.x + vertoffset2, vertn.y, vertn.z);
            var verty12 = new THREE.Vector3(vertn.x, vertn.y + vertoffset2, vertn.z);
            var vert112 = new THREE.Vector3(vertn.x, vertn.y + vertoffset2, vertn.z);
            var vert002 = new THREE.Vector3(vertn.x + vertoffset2, vertn.y + vertoffset2, vertn.z);

            var verts = [vertn, vertx0, verty0, vertx1, verty1, vert11, vert00, vertx02, verty02, vertx12, verty12, vert112, vert002];
            var norms = [];
            for (var k = 0; k < verts.length; k++) {

                var vert = verts[k].clone();
                var vert2 = verts[k].clone();
                var vert3 = verts[k].clone();
                if (k < 6) {
                    vert2.x += vertoffset;
                    vert3.y += vertoffset;
                } else {
                    vert2.x += vertoffset2;
                    vert3.y += vertoffset2;
                }

                var z1 = this.terrainAlgorithm.displace(vert, matrix, res);
                var z2 = this.terrainAlgorithm.displace(vert2, matrix, res);
                var z3 = this.terrainAlgorithm.displace(vert3, matrix, res);

                var n;
                if (k < 6)
                    n = new THREE.Vector3((z1 - z2), (z1 - z3), vertoffset);
                else
                    n = new THREE.Vector3((z1 - z2), (z1 - z3), vertoffset2);
                n.normalize();
                norms.push(n);
                verts[k].z = z1;
            }
            vertices[i].z = vertn.z
            //var n = vertn.clone().sub(vertx).cross(vertn.clone().sub(verty)).normalize();
            var n = norms[1].add(norms[2]).add(norms[3]).add(norms[4]).add(norms[5]);
            n = n.multiplyScalar(1 / 5);
            n.normalize();

            var n2 = norms[6].add(norms[7]).add(norms[8]).add(norms[9]).add(norms[10]);
            n2 = n2.multiplyScalar(1 / 5);
            n2.normalize();
            //n = n.applyMatrix4(invmat);


            normals[j][l] = n;
            normalsL2[j][l] = n2;
            heights[j][l] = vertn.z;
        }
    }

    for (var j = 0; j < res; j++) {

        for (var l = 0; l < res; l++) {
            //remove when not perect stitching

            {
                if (l % 2 == 1 && j % 2 != 1) {
                    var z00 = heights[j - 0 >= 0 ? j - 0 : j][l + 1 < res ? l + 1 : l];
                    var z11 = heights[j + 0 < res ? j + 0 : j][l - 1 >= 0 ? l - 1 : l];
                    var z = (z00 + z11) / 2;


                    var n00 = normalsL2[j - 0 >= 0 ? j - 0 : j][l + 1 < res ? l + 1 : l];
                    var n11 = normalsL2[j + 0 < res ? j + 0 : j][l - 1 >= 0 ? l - 1 : l];


                    var norm = n00.clone().add(n11).multiplyScalar(.5).normalize();

                    everyOtherNormal[j * res + l] = norm;
                    everyOtherZ[j * res + l] = z;
                } else if (l % 2 != 1 && j % 2 == 1) {
                    var z00 = heights[j - 1 >= 0 ? j - 1 : j][l + 0 < res ? l + 0 : l];
                    var z11 = heights[j + 1 < res ? j + 1 : j][l - 0 >= 0 ? l - 0 : l];
                    var z = (z00 + z11) / 2;


                    var n00 = normalsL2[j - 1 >= 0 ? j - 1 : j][l + 0 < res ? l + 0 : l];
                    var n11 = normalsL2[j + 1 < res ? j + 1 : j][l - 0 >= 0 ? l - 0 : l];


                    var norm = n00.clone().add(n11).multiplyScalar(.5).normalize();

                    everyOtherNormal[j * res + l] = norm;
                    everyOtherZ[j * res + l] = z;
                } else if (l % 2 == 1 && j % 2 == 1) {
                    var z00 = heights[j - 1 >= 0 ? j - 1 : j][l + 1 < res ? l + 1 : l];
                    var z11 = heights[j + 1 < res ? j + 1 : j][l - 1 >= 0 ? l - 1 : l];
                    var z001 = heights[j + 1 < res ? j + 1 : j][l + 1 < res ? l + 1 : l];
                    var z111 = heights[j - 1 >= 0 ? j - 1 : j][l - 1 >= 0 ? l - 1 : l];
                    var z = (z00 + z11 + z001 + z111) / 4;


                    var n00 = normalsL2[j - 1 >= 0 ? j - 1 : j][l + 1 < res ? l + 1 : l];
                    var n11 = normalsL2[j + 1 < res ? j + 1 : j][l - 1 >= 0 ? l - 1 : l];
                    var n001 = normalsL2[j + 1 < res ? j + 1 : j][l + 1 < res ? l + 1 : l];
                    var n111 = normalsL2[j - 1 >= 0 ? j - 1 : j][l - 1 >= 0 ? l - 1 : l];

                    var norm = n00.clone().add(n11).add(n111).add(n001).multiplyScalar(.25).normalize();

                    everyOtherNormal[j * res + l] = norm;
                    everyOtherZ[j * res + l] = z;
                } else {


                    everyOtherNormal[j * res + l] = normalsL2[j][l];
                    everyOtherZ[j * res + l] = heights[j][l];
                }

                if (vertices[j * res + l].x > .95 || vertices[j * res + l].x < .05 || vertices[j * res + l].y > .95 || vertices[j * res + l].y < .05) {
                    var n00 = normalsL2[j - 1 >= 0 ? j - 1 : j][l + 1 < res ? l + 1 : l];
                    var n11 = normalsL2[j + 1 < res ? j + 1 : j][l - 1 >= 0 ? l - 1 : l];
                    var n001 = normalsL2[j + 1 < res ? j + 1 : j][l + 1 < res ? l + 1 : l];
                    var n111 = normalsL2[j - 1 >= 0 ? j - 1 : j][l - 1 >= 0 ? l - 1 : l];

                    var norm = n00.clone().add(n11).add(n111).add(n001).multiplyScalar(.25).normalize();
                    everyOtherNormal[j * res + l] = norm;;
                    //everyOtherZ[j * res + l]  = heights[j][l];
                }


            }

        }
    }
    if (buffers.length == 0) {
        console.log('new buffers');
        buffers[0] = new ArrayBuffer(vertices.length * 3 * 4);
        buffers[1] = new ArrayBuffer(vertices.length * 3 * 4);
        buffers[2] = new ArrayBuffer(vertices.length * 4);
        buffers[3] = new ArrayBuffer(vertices.length * 3 * 4);
    }
    var ret = {
        "vertices": buffers[0],
        "normals": buffers[1],
        "everyOtherZ": buffers[2],
        "everyOtherNormal": buffers[3]
    };

    var retVertices = new Float32Array(ret.vertices);
    var retNormals = new Float32Array(ret.normals);
    var retEveryOtherZ = new Float32Array(ret.everyOtherZ);
    var retEveryOtherNormal = new Float32Array(ret.everyOtherNormal);

    var c = 0;
    for (var i = 0; i < vertices.length; i++) {
        retVertices[c] = (vertices[i].x);
        retVertices[c + 1] = (vertices[i].y);
        retVertices[c + 2] = (vertices[i].z);
        c += 3;
    }
    c = 0;
    for (var i = 0; i < everyOtherZ.length; i++) {
        retEveryOtherZ[c] = (everyOtherZ[i]);
        c++;
    }
    c = 0;
    for (var i = 0; i < everyOtherNormal.length; i++) {
        retEveryOtherNormal[c] = (everyOtherNormal[i].x);
        retEveryOtherNormal[c + 1] = (everyOtherNormal[i].y);
        retEveryOtherNormal[c + 2] = (everyOtherNormal[i].z);
        c += 3;
    }
    c = 0;
    for (var j = 0; j < res; j++) {
        for (var l = 0; l < res; l++) {
            retNormals[c] = (normals[j][l].x);
            retNormals[c + 1] = (normals[j][l].y);
            retNormals[c + 2] = (normals[j][l].z);
            c += 3;
        }
    }
    return ret;
}




var console = self;

self.log = function(data) {
    self.postMessage({
        command: 'console',
        data: data
    });
}
self.generateTerrain = function(terraindata, id, buffers) {

    var data = self.generateTerrainSimWorker(terraindata, buffers);

    self.setTimeout(function() {
        var response = {
            command: 'terrainData',
            data: data,
            id: id
        };
        if (self.supportsTransferables)
            self.postMessage(response, [response.data.vertices, response.data.normals, response.data.everyOtherZ, response.data.everyOtherNormal]);
        else
            self.postMessage(response);
    }, 0);
}

self.addEventListener('message', function(e) {

    var window = self;

    var data = e.data;
    if (!data)
        return;
    var command = e.data.command;

    if (self[command])
        self[command](e.data.data, e.data.id, e.data.buffers);



}, false);