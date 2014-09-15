define(function() {
    var EntityLibrary = {};
    var isInitialized = false;
    var currentDrag;
    return {
        getSingleton: function() {
            if (!isInitialized) {
                initialize.call(EntityLibrary);
                isInitialized = true;
            }
            return EntityLibrary;
        }
    }
    var isOpen = true;

    function matcpy(mat) {
        var newmat = [];
        for (var i = 0; i < 16; i++) newmat[i] = mat[i];
        return newmat;
    }

    function toGMat(threemat) {
        var mat = [];
        mat = matcpy(threemat.elements);
        mat = (MATH.transposeMat4(mat));
        return mat;
    }

    function sizeWindowTimer() {
        if (!_Editor.findcamera()) return;
        _Editor.findcamera().aspect = ($('#index-vwf').width() / $('#index-vwf').height());

        _Editor.findcamera().updateProjectionMatrix();

        _ScriptEditor.resize();

        if ($('#index-vwf').offset()) {
            $('#glyphOverlay').css('position', 'absolute');
            $('#glyphOverlay').css('left', $('#index-vwf').offset().left);
            $('#glyphOverlay').css('top', $('#index-vwf').offset().top);
        }
    }

    function ToSafeID(value) {
        return value.replace(/[^A-Za-z0-9]/g, "");
    }

    function initialize() {
        $(document.body).append("<div id='EntityLibrary'></div>")
        $('#EntityLibrary').append("<div id='EntityLibrarySideTab'>Library</div>");
        $('#EntityLibrary').append("<div id='EntityLibraryMain'></div>");
        $('#EntityLibraryMain').append("<div id='entitylibrarytitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span id='entitylibrarytitletext' class='ui-dialog-title' id='ui-dialog-title-Players'>Content Libraries</span></div>");

        $('#entitylibrarytitle').append('<a id="entitylibraryclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
        $('#entitylibrarytitle').prepend('<div class="headericon properties" />');
        $('#EntityLibraryMain').append("<div id='EntityLibraryAccordion'></div>");

        //fetch the list if libraries, and fetch the content of each library
        this.setup = function() {
            $.getJSON("./contentlibraries/libraries.json", function(libs) {
                var keys = Object.keys(libs);
                async.eachSeries(keys, function(i, cb) {
                    var url = libs[i].url;
                    $.getJSON(url, function(lib) {
                        libs[i].library = lib;
                        cb()
                    })
                }, function(err) {

                    EntityLibrary.libraries = libs;
                    for (var i in libs) {
                        var section = '<h3 class="modifiersection" ><a href="#"><div style="font-weight:bold;display:inline">' + i + "</div>" + '</a></h3>' + '<div class="modifiersection" id="library' + ToSafeID(i) + '">' + '</div>';
                        $('#EntityLibraryAccordion').append(section);

                        //for every asset in every library, setup the gui
                        for (var j in libs[i].library) {
                            $('#library' + ToSafeID(i)).append('<div  class = "libraryAsset">' +
                                '<img id = "asset' + ToSafeID(i) + ToSafeID(j) + '" src="' + libs[i].library[j].preview + '" draggable=true></img>' +
                                '<div>' + j + '</div>' +
                                '</div>'
                            );
                            (function(i1, j1) {

                                $("#asset" + ToSafeID(i1) + ToSafeID(j1)).on('dragstart', function(evt) {


                                    var dragIcon = document.createElement('img');
                                    dragIcon.src = '../vwf/adl/view/editorview/images/icons/paste.png';
                                    dragIcon.width = 100;
                                    evt.originalEvent.dataTransfer.setDragImage(dragIcon, 10, 10);

                                    currentDrag = libs[i1].library[j1];
                                    evt.originalEvent.dataTransfer.setData('json', JSON.stringify(libs[i1].library[j1]));
                                    $(this).css('opacity', .5);
                                });
                                $("#asset" + ToSafeID(i1) + ToSafeID(j1)).on('dragend', function() {

                                    $(this).css('opacity', 1);
                                     currentDrag = null;
                                });

                            })(i, j)

                        }
                    }

                    //when dragging over the 3d view, update the preview positoin    
                    $("#index-vwf").live('dragover', function(evt) {
                        evt.preventDefault();
                        if(!currentDrag) return;
                        if (currentDrag.type == 'asset') {
                            var pos = _Editor.GetInsertPoint(evt.originalEvent);
                            
                            EntityLibrary.dropPreview.position = new THREE.Vector3(pos[0], pos[1], pos[2]);
                            EntityLibrary.dropPreview.updateMatrixWorld();
                        }
                        if (currentDrag.type == 'material' || currentDrag.type == 'child') {
                            var ID = EntityLibrary.GetPick(evt);
                            if (ID) {

                                var bound = _Editor.findviewnode(ID).GetBoundingBox(true);
                                bound = bound.transformBy(toGMat(_Editor.findviewnode(ID).matrixWorld));
                                var x = ((bound.max[0] - bound.min[0]) / 2) + bound.min[0];
                                var y = ((bound.max[1] - bound.min[1]) / 2) + bound.min[1];
                                var z = ((bound.max[2] - bound.min[2]) / 2) + bound.min[2];

                                var ss = MATH.distanceVec3(bound.max, bound.min) / 1.9;
                                EntityLibrary.dropPreview.position.set(x, y, z);
                                EntityLibrary.dropPreview.scale.set(ss, ss, ss);
                                EntityLibrary.dropPreview.updateMatrixWorld();
                            }
                        }
                        if (currentDrag.type == 'environment') {
                            EntityLibrary.dropPreview.position.set(0, 0, 0);
                            EntityLibrary.dropPreview.scale.set(10, 10, 10);
                            EntityLibrary.dropPreview.updateMatrixWorld();
                        }
                    })
                    //when dragging into the 3d view, create a preview sphere, then try to attach the preview model
                    $("#index-vwf").live('dragenter', function(evt) {

                        if(!currentDrag) return;
                        var data = currentDrag;
                        if (currentDrag.type == 'asset') {
                            if (!EntityLibrary.dropPreview) {
                                EntityLibrary.dropPreview = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 30), EntityLibrary.createPreviewMaterial());
                                _dScene.add(EntityLibrary.dropPreview, true);

                                if (data.dropPreview) {
                                    //the asset must have a 'drop preview' key
                                    _assetLoader.getOrLoadAsset(data.dropPreview.url, data.dropPreview.type, function(asset) {
                                        if (asset && EntityLibrary.dropPreview) {
                                            var transformNode = new THREE.Object3D();
                                            transformNode.matrixAutoUpdate = false;
                                            if (data.dropPreview.transform)
                                                transformNode.matrix.fromArray(data.dropPreview.transform)
                                            EntityLibrary.dropPreview.visible = false;
                                            transformNode.add(asset.scene, true);
                                            EntityLibrary.dropPreview.add(transformNode, true);
                                        }
                                    });
                                }
                            }
                        }
                        if (currentDrag.type == 'material' || currentDrag.type == 'child' || currentDrag.type == 'environment') {

                            if (!EntityLibrary.dropPreview) {
                                EntityLibrary.dropPreview = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 30), EntityLibrary.createPreviewMaterial());
                                _dScene.add(EntityLibrary.dropPreview, true);
                            }
                        }
                    });
                    //remove the preview,
                    $("#index-vwf").live('dragleave', function(evt) {
                        if (EntityLibrary.dropPreview) {
                            _dScene.remove(EntityLibrary.dropPreview, true);
                            delete EntityLibrary.dropPreview;
                            
                        }
                    })
                    //remove the preview and do the creation
                    $("#index-vwf").live('drop', function(evt) {
                        evt.preventDefault();
                        if(!currentDrag) return;
                        data = JSON.parse(evt.originalEvent.dataTransfer.getData('json'));
                        
                        if (EntityLibrary.dropPreview) {
                            _dScene.remove(EntityLibrary.dropPreview, true);
                            delete EntityLibrary.dropPreview;
                            EntityLibrary.create(data, evt);
                           
                        }
                    })

                    $("#EntityLibraryAccordion").accordion({
                        heightStyle: 'fill',
                        activate: function() {

                        }
                    });
                    $(".ui-accordion-content").css('height', 'auto');

                });
            })
        }
        this.setup();
        this.GetPick = function(evt) {
            var ray = _Editor.GetWorldPickRay(evt.originalEvent);
            var o = _Editor.getCameraPosition();
            var hit = _SceneManager.CPUPick(o, ray, {
                ignore: [_Editor.GetMoveGizmo()]
            });
            if (hit) {
                var object = hit.object;
                while (!object.vwfID && object.parent)
                    object = object.parent;
                return object.vwfID;
            }
            return null;
        }
        this.isOpen = function() {
            return isOpen;
        }
        this.show = function() {


            $('#EntityLibrary').animate({
                'left': 0
            });
            var w = $(window).width() - 250 - ($(window).width() - $('#sidepanel').offset().left);
            $('#ScriptEditor').animate({
                'left': $('#EntityLibrary').width(),
                width: w
            }, {
                step: _ScriptEditor.resize
            });
            $('#index-vwf').animate({
                'left': $('#EntityLibrary').width(),
                width: w
            }, {
                step: sizeWindowTimer
            });

            $('#EntityLibraryAccordion').css('height', $('#index-vwf').css('height') - $('#entitylibrarytitle').height());
            $('#EntityLibrary').css('height', $('#index-vwf').css('height'));
            $('#EntityLibraryAccordion').css('overflow', 'auto');
            isOpen = true;
        }
        this.hide = function() {


            $('#EntityLibrary').animate({
                'left': -$('#EntityLibrary').width()
            });
            var w = $(window).width() - ($(window).width() - $('#sidepanel').offset().left);
            $('#ScriptEditor').animate({
                'left': 0,
                width: w
            }, {
                step: _ScriptEditor.resize
            });
            $('#index-vwf').animate({
                'left': 0,
                width: w
            }, {
                step: sizeWindowTimer
            });
            isOpen = false;
        }
        this.create = function(data, evt) {
            //if its a 3d file or a node prototype
            if (data.type == 'asset') {
                var pos = _Editor.GetInsertPoint(evt.originalEvent);
                $.getJSON(data.url, function(proto) {

                    //very important to clean the node! Might have accidently left a name or id in the libarary
                    proto = _DataManager.getCleanNodePrototype(proto);
                    if (!proto.properties)
                        proto.properties = {};
                    proto.properties.owner = _UserManager.GetCurrentUserName()
                    if (!proto.properties.transform)
                        proto.properties.transform = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                    proto.properties.transform[12] = pos[0];
                    proto.properties.transform[13] = pos[1];
                    proto.properties.transform[14] = pos[2];
                    proto.properties.translation = pos;
                    var newname = GUID();
                    _Editor.createChild('index-vwf', newname, proto);
                    _Editor.SelectOnNextCreate([newname]);

                })
            }
            if (data.type == 'child') {



                var ID = EntityLibrary.GetPick(evt);
                if (ID) {
                    $.getJSON(data.url, function(proto) {
                        //very important to clean the node! Might have accidently left a name or id in the libarary
                        proto = _DataManager.getCleanNodePrototype(proto);
                        if (!proto.properties)
                            proto.properties = {};
                        proto.properties.owner = _UserManager.GetCurrentUserName()
                        if (!proto.properties.transform)
                            proto.properties.transform = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                        var newname = GUID();
                        _Editor.createChild(ID, newname, proto);
                        _Editor.SelectOnNextCreate([newname]);

                    })
                }

            }
            if (data.type == 'material') {

                var ID = EntityLibrary.GetPick(evt);
                if (ID) {
                    $.getJSON(data.url, function(proto) {
                        _PrimitiveEditor.setProperty(ID, 'materialDef', proto);
                    })
                }

            }
            if (data.type == 'environment') {
                $.getJSON(data.url, function(proto) {
                    _UndoManager.startCompoundEvent();
                    for (var i in proto.properties)
                        _PrimitiveEditor.setProperty(vwf.application(), i, proto.properties[i]);
                    for (var i in proto.children)
                        _Editor.createChild(vwf.application(), GUID(), proto.children[i]);
                    _UndoManager.stopCompoundEvent();
                })
            }
        }
        this.createPreviewMaterial = function() {
            if (!this.material) {
                this.material = new THREE.ShaderMaterial({
                    uniforms: {},
                    vertexShader: [
                        "varying vec2 vUv;",
                        "varying vec3 norm;",
                        "varying vec3 tocam;",
                        "void main()",
                        "{",
                        "vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );",
                        "norm = (viewMatrix * vec4(normal,0.0)).xyz;",

                        "vec3 vecPos = (modelMatrix * vec4(position, 1.0 )).xyz;",
                        "norm = (modelMatrix * vec4(normal, 0.0)).xyz;",
                        "tocam = vecPos.xyz - cameraPosition;",
                        "gl_Position = projectionMatrix * mvPosition;",
                        "}"
                    ].join('\n'),
                    fragmentShader: [
                        "varying vec3 norm;",
                        "varying vec3 tocam;",
                        "void main()",
                        "{",
                        "float d = 1.0-dot(normalize(norm),normalize(-tocam));",
                        "d = pow(d,3.0);",
                        "gl_FragColor = vec4(0.0,0.0,d,d);",
                        "}"
                    ].join('\n'),

                });
                this.material.transparent = true;
            }
            return this.material;
        }
        $('#EntityLibrarySideTab').click(function() {
            if (EntityLibrary.isOpen())
                EntityLibrary.hide();
            else
                EntityLibrary.show();
        })
    }
});