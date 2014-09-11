(function() {
    function terrainDecorator(childID, childSource, childName) {

        this.TerrainRoot = null;
        this.root = new THREE.Object3D();
        this.generator = null;
        this.lastCameraPosition = new THREE.Vector3(0, 0, 0);
        this.grassMeshes = [];
        this.positions = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]

        this.setRoot = function(r) {
            if (r instanceof THREE.Object3D)
                this.root = r;
            else
                console.log("root should be an Object3D");
        }
        this.getRoot = function() {
            return this.root;
        }
        this.setGenerator = function(r) {
            this.generator = r;
        }
        this.deletingNode = function() {
            for (var i in this.positions)
                for (var j in this.positions[i])
                    for (var k in this.positions[i][j].meshes)
                        this.getRoot().remove(this.positions[i][j].meshes[k]);

            window._dGrass = null;

            _dView.unbind('postprerender', this.renderHeightMap);

        }
        this.dim = 8;
        this.tileW = 8;
        this.update = function(cameraPosition, force) {



            //cant do any updates until the generator is set.
            if (!this.generator) return;

            if (!cameraPosition)
                cameraPosition = this.lastCameraPosition.clone();
            var updated = false;

            var updatedMeshLayer = [];

            while ((cameraPosition.x - this.lastCameraPosition.x) <= -this.tileW) {
                var x = this.positions.pop();
                for (var i = 0; i < this.dim; i++) {
                    x[i].position[0] -= this.dim * this.tileW;
                    for (var j = 0; j < x[i].meshes.length; j++) {
                        x[i].meshes[j].position.x -= this.dim * this.tileW;
                        x[i].meshes[j].position.z = this.generator.sample(x[i].meshes[j].position) + 1;
                        x[i].meshes[j].updateMatrixWorld();
                    }
                }
                this.positions.unshift(x);
                this.lastCameraPosition.x -= this.tileW;
                updated = true;
            }
            while ((cameraPosition.x - this.lastCameraPosition.x) > this.tileW) {
                var x = this.positions.shift();
                for (var i = 0; i < this.dim; i++) {
                    x[i].position[0] += this.dim * this.tileW;
                    for (var j = 0; j < x[i].meshes.length; j++) {

                        x[i].meshes[j].position.x += this.dim * this.tileW;
                        x[i].meshes[j].position.z = this.generator.sample(x[i].meshes[j].position) + 1;
                        x[i].meshes[j].updateMatrixWorld();
                    }
                }
                this.positions.push(x);
                this.lastCameraPosition.x += this.tileW;
                updated = true;

            }

            while ((cameraPosition.y - this.lastCameraPosition.y) <= -this.tileW) {

                for (var i = 0; i < this.dim; i++) {

                    var x = this.positions[i].pop();
                    x.position[1] -= this.dim * this.tileW;
                    for (var j = 0; j < x.meshes.length; j++) {
                        x.meshes[j].position.y -= this.dim * this.tileW;
                        x.meshes[j].position.z = this.generator.sample(x.meshes[j].position) + 1;
                        x.meshes[j].updateMatrixWorld();
                    }
                    this.positions[i].unshift(x);
                }

                this.lastCameraPosition.y -= this.tileW;
                updated = true;
            }
            while ((cameraPosition.y - this.lastCameraPosition.y) > this.tileW) {
                for (var i = 0; i < this.dim; i++) {
                    var x = this.positions[i].shift();
                    x.position[1] += this.dim * this.tileW;
                    for (var j = 0; j < x.meshes.length; j++) {
                        x.meshes[j].position.y += this.dim * this.tileW;
                        x.meshes[j].position.z = this.generator.sample(x.meshes[j].position) + 1;
                        x.meshes[j].updateMatrixWorld();
                    }
                    this.positions[i].push(x);
                }
                this.lastCameraPosition.y += this.tileW;
                updated = true;

            }
            if (updated == true || force) {
                //this.renderHeightMap();
                this.needReRender = true;
                this.lastCameraPosition.z = cameraPosition.z;
            }

        }
        this.entroySample = function(val) {
            val = val % window.location.href.length;
            var a = window.location.href.charCodeAt(parseInt(val));
            val *= a;

            val = val % 128;
            return val / 128.0;
        }
        this.random = function() {
            if (!this.RandomCount) {
                this.RandomCount = 0;
            }
            this.RandomCount++;
            return this.entroySample(this.RandomCount);
        }
        this.wind = true;
        this.renderHeightMap = function() {
            if (!this.counter) this.counter = 0;
            this.counter++;
            if (this.wind)
                this.mat.uniforms.time.value += deltaTime * (1.5 + Math.sin(this.counter / 100)) * (1.5 + Math.sin(this.counter / 500)) * (1.5 + Math.sin(this.counter / 1000)) || 1;
            else
                this.mat.uniforms.time.value = 1;
            if (!this.needReRender) return;
            this.needReRender = false;
            var oldparent = this.TerrainRoot.parent;

            this.camera.position = this.lastCameraPosition.clone();
            this.camera.position.z += 500;
            this.camera.updateMatrixWorld();
            this.camera.updateProjectionMatrix();
            //this.cameraHelper.updateMatrixWorld();
            var matrixWorldInverse = new THREE.Matrix4();
            var _viewProjectionMatrix = new THREE.Matrix4();
            matrixWorldInverse.getInverse(this.camera.matrixWorld);

            _viewProjectionMatrix.multiplyMatrices(this.camera.projectionMatrix, matrixWorldInverse);

            this.mat.uniforms.projection.value = _viewProjectionMatrix;
            this.mat.uniforms.campos.value = this.camera.position;
            var meshes_to_toggle = [];
            for (var i = 0; i < this.dim; i++)
                for (var j = 0; j < this.dim; j++) {
                    meshes_to_toggle = meshes_to_toggle.concat(this.positions[i][j].meshes);
                }
            var self = this;
            this.TerrainRoot.parent.parent.traverse(function(child) {
                //ahhh, have to be careful to not turn off the sun
                if (child.parent !== self.root && child.visible === true && child != _dSun) {
                    meshes_to_toggle.push(child);
                }
            });


            for (var i = 0; i < meshes_to_toggle.length; i++) {
                meshes_to_toggle[i].visible = false;
            }

            this.TerrainRoot.traverse(function(child) {
                if (child.visible === true && child.material && child.material.uniforms.renderMode) //should only be terrain tiles 
                {
                    child.material.uniforms.renderMode.value = 1;
                    child.material.side = 2;
                }
            });


            _dRenderer.clearTarget(this.rtt);
            _dRenderer.render(_dScene, this.camera, this.rtt);


            this.TerrainRoot.traverse(function(child) {
                if (child.visible === true && child.material && child.material.uniforms.renderMode) //should only be terrain tiles 
                {
                    child.material.uniforms.renderMode.value = 2;

                }
            });


            _dRenderer.clearTarget(this.rtt2);
            _dRenderer.render(_dScene, this.camera, this.rtt2);


            this.TerrainRoot.traverse(function(child) {
                if (child.visible === true && child.material && child.material.uniforms.renderMode) //should only be terrain tiles 
                {
                    child.material.uniforms.renderMode.value = 0;
                    child.material.side = 0;
                }
            });

            for (var i = 0; i < meshes_to_toggle.length; i++) {
                meshes_to_toggle[i].visible = true;

            }

        }.bind(this);
        this.getGrassMat = function(vertcount) {
            if (!this.mat) {
                var currentmat = new THREE.ShaderMaterial({
                    uniforms: {

                        heightMap: {
                            type: "t",
                            value: this.rtt
                        },
                        gBuffer: {
                            type: "t",
                            value: this.rtt2
                        },
                        diffuseTex: {
                            type: "t",
                            value: _SceneManager.getTexture(this.texture || './terrain/grass.png')
                        },
                        projection: {
                            type: "m4",
                            value: new THREE.Matrix4()
                        },
                        campos: {
                            type: "v3",
                            value: new THREE.Vector3()
                        },
                        time: {
                            type: "f",
                            value: 0
                        }
                    },
                    attributes: {},
                    vertexShader: "varying lowp vec2 tc;" +
                        "varying lowp vec2 progtc;" +
                        "uniform lowp mat4 projection;" +
                        "uniform lowp vec3 campos;" +
                        "uniform lowp sampler2D heightMap;" +
                        "uniform lowp float time;" +
                        "attribute lowp float random;" +
                        "varying lowp float ar;" +
                        "varying lowp float rand;" +
                        "varying lowp vec2 wind;" +
                        "float unpack_depth(const in vec4 rgba_depth)\n" +
                        "{\n" +
                        "const vec4 bit_shift = vec4(1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0);\n" +
                        "float depth = dot(rgba_depth, bit_shift);\n" +
                        "return depth;\n" +
                        "}\n" +
                        "void main() {    " +

                    "    tc = (( projection * modelMatrix  ) * vec4( position, 1.0 )).xy;\n" +
                        "    progtc = (tc + 1.0) / 2.0;\n" +
                        "    lowp vec4 color1 = texture2DLod(heightMap,progtc,0.0);" +
                        "    lowp float z = unpack_depth(color1) * 1000.0;" +
                        "    lowp mat4 modMat = modelMatrix;" +
                        "    modMat[3][2] =0.0;" +
                        "  wind = vec2(sin(position.x/2.0 + time/1900.0)+cos(position.y/2.0 + time/1900.0),0.0);\n" +
                        "wind = (wind + 1.0) / 4.0;\n" +
                        "    gl_Position = modMat * vec4( position.xy + wind * uv.y,position.z+z-0.45, 1.0 );\n" +
                        "    ar = length(gl_Position.xyz - cameraPosition)/20.0;\n" +
                    //"    gl_Position.z = z;"+
                    "    gl_Position = viewMatrix * gl_Position;\n" +

                    "    gl_Position = projectionMatrix * gl_Position;\n" +
                        "tc = uv;\n" +
                        "rand = random;" +
                        "} ",
                    fragmentShader: "uniform lowp sampler2D diffuseTex;" +
                        "uniform lowp sampler2D gBuffer;" +
                        "varying lowp vec2 progtc;" +
                        "varying lowp vec2 tc;" +
                        "varying lowp float rand;" +
                        "varying lowp vec2 wind;" +
                        "varying lowp float ar;" +
                        "void main() { " +
                        "lowp vec4 color1 = texture2D(diffuseTex,tc);" +
                        "lowp vec4 gb = texture2D(gBuffer,progtc);\n" +
                        "lowp float light =  gb.a;" +
                        "lowp float density =  gb.g;" +

                    "if ( color1.a < ar * ar ) discard;\n" +
                        "if ( color1.a * density < .5) discard;\n" +
                        "gl_FragColor = color1;" +
                        "gl_FragColor.xyz *= (light +.15*rand) + wind.x * wind.x * tc.y* tc.y;\n" +

                    "}"


                });
                currentmat.attributes.random = {
                    type: 'f',
                    value: []
                };
                for (var i = 0; i < vertcount; i += 6) {
                    //careful with random!!!! this one is only useful because you cannot ever make a model decision based on it
                    var rand = Math.SecureRandom();
                    for (var j = 0; j < 6; j++)
                        currentmat.attributes.random.value.push(rand);
                }
                this.mat = currentmat;
                this.mat.side = 2;
                this.mat.uniforms.diffuseTex.value.wrapS = THREE.ClampToEdgeWrapping;
                this.mat.uniforms.diffuseTex.value.wrapT = THREE.ClampToEdgeWrapping;
                this.mat.uniforms.diffuseTex.anisotropy = 1;
            }
            return this.mat;

        }
        this.grassDensity = 3;
        this.grassWidth = 1.5;
        this.grassHeight = 1;
        this.buildGeometry = function() {
            var geo = new THREE.Geometry();
            geo.faces = [];
            geo.vertices = [];
            var grassWidth = 1;
            var grassHeight = 1;

            grassWidth *= this.grassWidth;
            grassHeight *= this.grassHeight;
            var grassDensity = this.grassDensity;

            geo.faceVertexUvs[0] = [];
            for (var x = -this.tileW / 2; x < this.tileW / 2; x += .5)
                for (var y = -this.tileW / 2; y < this.tileW / 2; y += .5) {
                    for (var i = 0; i < grassDensity; i++) {
                        grassHeight = this.grassHeight + Math.SecureRandom(); //careful with random!!!! this one is only useful because you cannot ever make a model decision based on it
                        var centerRnd = new THREE.Vector3((Math.SecureRandom() - .5) * 2, (Math.SecureRandom() - .5) * 2, 0);
                        var center = new THREE.Vector3(x + grassWidth + centerRnd.x, y + grassWidth + centerRnd.y, 0);
                        var rot = new THREE.Vector3(Math.SecureRandom() - .5, Math.SecureRandom() - .5, 0);

                        rot = rot.setLength(grassWidth / 2);
                        var point1 = new THREE.Vector3(center.x - rot.x, center.y - rot.y, center.z);
                        var point2 = new THREE.Vector3(center.x + rot.x, center.y + rot.y, center.z);
                        var point3 = new THREE.Vector3(point1.x + rot.y * .5, point1.y + rot.x * .5, point1.z + grassHeight);
                        var point4 = new THREE.Vector3(point2.x + rot.y * .5, point2.y + rot.x * .5, point2.z + grassHeight);
                        var idx = geo.vertices.length;
                        geo.vertices.push(point1);
                        geo.vertices.push(point2);
                        geo.vertices.push(point3);
                        geo.vertices.push(point4);
                        var face1 = new THREE.Face3(idx + 0, idx + 1, idx + 2);
                        var face2 = new THREE.Face3(idx + 2, idx + 3, idx + 1);
                        geo.faces.push(face1, face2);
                        geo.faceVertexUvs[0].push([new THREE.Vector2(1, 0),
                            new THREE.Vector2(0, 0),
                            new THREE.Vector2(1, 1)
                        ]);
                        geo.faceVertexUvs[0].push([new THREE.Vector2(1, 1),
                            new THREE.Vector2(0, 1),
                            new THREE.Vector2(0, 0)
                        ]);

                        geo.faceVertexUvs[0].push([new THREE.Vector2(1, 0),
                            new THREE.Vector2(0, 0),
                            new THREE.Vector2(1, 1)
                        ]);
                        geo.faceVertexUvs[0].push([new THREE.Vector2(1, 1),
                            new THREE.Vector2(0, 1),
                            new THREE.Vector2(0, 0)
                        ]);
                    }
                }

            this.geo = geo;
        }
        this.updateMesh = function() {

            var oldGeo = this.geo;
            this.buildGeometry();
            for (var i = 0; i < this.dim; i++) {
                for (var j = 0; j < this.dim; j++) {
                    for (var k = 0; k < this.positions[i][j].meshes.length; k++) {
                        if (this.positions[i][j].meshes[k].children[0].geometry == oldGeo) {

                            var oldmesh = this.positions[i][j].meshes[k].children[0];
                            var oldmat = oldmesh.material;
                            var newmesh = new THREE.Mesh(this.geo, oldmat);
                            oldmesh.parent.add(newmesh);
                            oldmesh.parent.remove(oldmesh);
                            newmesh.position = oldmesh.position;
                            newmesh.rotation.set(oldmesh.rotation.x, oldmesh.rotation.y, oldmesh.rotation.z, oldmesh.rotation.order);
                            newmesh.vwfID = oldmesh.vwfID;
                            newmesh.InvisibleToCPUPick = true;
                            //oldmesh.dispose();
                        }
                    }
                }
            }
            oldGeo.dispose();
            this.mat.attributes.random.value = [];
            for (var i = 0; i < this.geo.vertices.length; i += 6) {
                //careful with random!!!! this one is only useful because you cannot ever make a model decision based on it
                var rand = Math.SecureRandom();
                for (var j = 0; j < 6; j++)
                    this.mat.attributes.random.value.push(rand);
            }
        }
        this.createGrassMesh = function() {
            if (!this.geo)
                this.buildGeometry();
            return (new THREE.Mesh(this.geo, this.getGrassMat(this.geo.vertices.length)));

        }
        this.queues = {};
        this.meshCache = {};
        this.settingProperty = function(name, val) {
            if (name == 'texture' && this.texture != val) {
                this.texture = val;
                if (this.mat)
                    this.mat.uniforms.diffuseTex.value = _SceneManager.getTexture(this.texture);
            }
            if (name == 'grassWidth' && this.grassWidth != val) {
                this.grassWidth = val;
                this.updateMesh();
            }
            if (name == 'grassHeight' && this.grassHeight != val) {
                this.grassHeight = val;
                this.updateMesh();
            }
            if (name == 'grassDensity' && this.grassDensity != val) {
                this.grassDensity = val;
                this.updateMesh();
            }
            if (name == 'wind') {
                this.wind = val;
            }

        }
        this.gettingProperty = function(name) {
            if (name == 'texture') {
                return this.texture
            }
            if (name == 'grassWidth') {
                return this.grassWidth;
            }
            if (name == 'grassHeight') {
                return this.grassHeight;
            }
            if (name == 'grassDensity') {
                return this.grassDensity;
            }
            if (name == 'wind') {
                return this.wind;
            }
            if (name == 'EditorData') {
                return {
                    diffuseTex: {
                        displayname: "Grass Texture",
                        type: "map",
                        property: "texture"
                    },
                    height: {
                        displayname: "Grass Height",
                        type: "slider",
                        property: "grassHeight",
                        min: 0,
                        max: 3,
                        step: .25
                    },
                    width: {
                        displayname: "Grass Width",
                        type: "slider",
                        property: "grassWidth",
                        min: 0,
                        max: 3,
                        step: .25
                    },
                    density: {
                        displayname: "Grass Density",
                        type: "slider",
                        property: "grassDensity",
                        min: 1,
                        max: 6,
                        step: 1
                    },
                    wind: {
                        displayname: "Enable Wind",
                        type: "check",
                        property: "wind",
                    }
                }
            }
        }
        this.loadMesh = function(parent, url) {

            if (url == 'grass') {
                var grassMesh = this.createGrassMesh();

                grassMesh.vwfID == this.ID;
                parent.add(grassMesh);
                grassMesh.geometry.InvisibleToCPUPick = true;


                grassMesh.updateMatrixWorld();
                grassMesh.geometry.computeBoundingSphere()

                grassMesh.geometry.boundingSphere.radius = Infinity
                return;
            }

            var self = this;
            if (!self.queues[url]) {
                self.queues[url] = async.queue(function(task, callback) {
                    if (self.meshCache[url]) {
                        task.parent.add(self.meshCache[url].clone());

                        callback();
                    } else {

                        var loader = new UTF8JsonLoader_Optimized({
                                source: url
                            },
                            function(asset) {
                                //load the mesh

                                self.meshCache[url] = asset.scene;
                                task.parent.add(self.meshCache[url].clone());

                                task.parent.updateMatrixWorld();
                                callback();
                            },
                            function() {
                                callback();

                            });
                    }

                }, 1);
            }
            self.queues[url].push({
                parent: parent,
                url: url
            })
        }
        this.init = function() {
            window._dGrass = this;

            var h = (this.dim * this.tileW) / 2;

            this.lastCameraPosition = new THREE.Vector3(0, 0, 0);

            this.camera = new THREE.OrthographicCamera(-h, h, -h, h, 0, 1000);
            //this.camera = new THREE.PerspectiveCamera();
            //	this.cameraHelper = new THREE.CameraHelper(this.camera);
            //	this.cameraHelper.InvisibleToCPUPick = true;
            //	this.root.add(this.cameraHelper,true);
            this.rtt = new THREE.WebGLRenderTarget(128, 128, {});
            this.rtt2 = new THREE.WebGLRenderTarget(128, 128, {});
            //	this.rtt.generateMipmaps = false;

            //this.scene.add(this.root);

            _dView.bind('postprerender', this.renderHeightMap);
            for (var i = 0; i < this.dim; i++) {
                this.positions[i] = [];
                for (var j = 0; j < this.dim; j++) {



                    var entry = {
                        meshes: []
                    };
                    entry.position = [(i - this.dim / 2) * this.tileW + this.tileW / 2, (j - this.dim / 2) * this.tileW + this.tileW / 2];


                    var grassMesh = new THREE.Object3D();
                    entry.meshes.push(grassMesh);
                    this.loadMesh(grassMesh, 'grass');

                    //	var o = new THREE.Object3D();
                    //	o.rotation.x = 1.6 + (this.random()-.5)*.7;
                    //	o.rotation.z = (Math.SecureRandom()-.5)*.7;
                    //	this.loadMesh(o,'./vwfdatamanager.svc/3drdownload?pid=adl:1723');
                    //	entry.meshes.push(o);

                    //	o = new THREE.Object3D();
                    //	o.rotation.x = 1.6 + (this.random()-.5)*.7;
                    //	o.rotation.z = (Math.SecureRandom()-.5)*.7;
                    //	this.loadMesh(o,'./vwfdatamanager.svc/3drdownload?pid=adl:1723');
                    //	entry.meshes.push(o);

                    //	o = new THREE.Object3D();
                    //	o.rotation.x = 1.6 + (this.random()-.5)*.7;
                    //	o.rotation.z = (Math.SecureRandom()-.5)*.7;
                    //	this.loadMesh(o,'./vwfdatamanager.svc/3drdownload?pid=adl:1791');
                    //	entry.meshes.push(o);


                    for (var k = 0; k < entry.meshes.length; k++) {
                        this.root.add(entry.meshes[k]);
                        entry.meshes[k].position.x = entry.position[0];
                        entry.meshes[k].position.y = entry.position[1];
                        if (k > 0) {
                            entry.meshes[k].position.x += (this.tileW) * (this.random() - .5)
                            entry.meshes[k].position.y += (this.tileW) * (this.random() - .5)
                        }
                    }


                    this.positions[i][j] = entry;
                }
            }

        }
    }
    //default factory code
    return function(childID, childSource, childName) {
        //name of the node constructor
        return new terrainDecorator(childID, childSource, childName);
    }
})();