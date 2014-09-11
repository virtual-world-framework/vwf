function clearCameraModeIcons() {
    $('#MenuCameraOrbiticon').removeClass('iconselected');
    $('#MenuCamera3RDPersonicon').removeClass('iconselected');
    $('#MenuCameraNavigateicon').removeClass('iconselected');
    $('#MenuCameraFreeicon').removeClass('iconselected');
}

define({

    initialize: function() {
        //$(document.body).append('');
        window.menus = ddsmoothmenu.init({
            mainmenuid: "smoothmenu1", //menu DIV id
            orientation: 'h', //Horizontal or vertical menu: Set to "h" or "v"
            classname: 'ddsmoothmenu', //class added to menu's outer DIV
            //customtheme: ["#1c5a80", "#18374a"],
            contentsource: "markup", //"markup" or ["container_id", "path_to_menu_file"]
            method: 'hover'
        });

        $(document).on('setstatecomplete', function() {


            //lets try to grab a screenshot if it's not set already

            if (vwf.getProperty('index-vwf', 'owner') != _UserManager.GetCurrentUserName()) {
                //don't bother if this is not the owner
                return;
            }

            window.setTimeout(function() {
                window.setThumbnail();

            }, 10000)

            //let's warn people that they have to hit stop
             $('#stopButton').tooltip('open');
            window.setTimeout(function() {
                $('#stopButton').tooltip('close');
            }, 2000)


        });

        window.setThumbnail = function() {

            if (vwf.getProperty('index-vwf', 'owner') != _UserManager.GetCurrentUserName()) {
                alertify.alert('Sorry, only the world owner can set the thumbnail');
                return;
            }

            var h = $('#index-vwf').attr('height');
            var w = $('#index-vwf').attr('width');
            _dRenderer.setSize(600, 300);
            var camera = _dView.getCamera();
            var a = camera.aspect;
            camera.aspect = 6 / 3;
            camera.updateProjectionMatrix();

            window.takeimage = function() {

                var img = $('#index-vwf')[0].toDataURL();
                _dRenderer.setSize(w, h);
                camera.aspect = a;
                camera.updateProjectionMatrix();


                jQuery.ajax({
                    type: 'POST',
                    url: './vwfDataManager.svc/thumbnail?SID=' + _DataManager.getCurrentSession().replace(/\//g, '_'),
                    data: JSON.stringify({
                        image: img
                    }),
                    contentType: "application/json; charset=utf-8",
                    success: function(data, status, xhr) {

                    },
                    error: function(xhr, status, err) {


                    },
                    dataType: "text"
                });
                _dView.unbind('postrender', takeimage);
                $(window).resize();
            }
            _dView.bind('postrender', takeimage);



        }

        $('#SetThumbnail').click(function(e) {
            window.setThumbnail();
        });

        $('#MenuCreateGUIDialog').click(function(e) {
            _GUIView.createDialog();
        });
        $('#MenuCreateGUIButton').click(function(e) {
            _GUIView.createButton();
        });
        $('#MenuCreateGUILabel').click(function(e) {
            _GUIView.createLabel();
        });
        $('#MenuCreateGUISlider').click(function(e) {
            _GUIView.createSlider();
        });
        $('#MenuCreateGUICheck').click(function(e) {
            _GUIView.createCheckbox();
        });
        $('#MenuCreateGUIPanel').click(function(e) {
            _GUIView.createPanel();
        });


        $('#MenuEn').click(function(e) {
            i18n.setLng('en', function(t) { /* loading done */ });
            location.reload();
        });

        $('#MenuRu').click(function(e) {
            i18n.setLng('ru', function(t) { /* loading done */ });
            location.reload();

        });
        $('#MenuEs_ES').click(function(e) {
            i18n.setLng('es_ES', function(t) { /* loading done */ });
            location.reload();
        });


        //make the menu items disappear when you click one
        //$(".ddsmoothmenu").find('li').click(function(){$(".ddsmoothmenu").find('li').trigger('mouseleave');});
        $('#MenuLogOut').attr('disabled', 'true');
        $('#MenuLogIn').click(function(e) {
            if ($('#MenuLogIn').attr('disabled') == 'disabled') return;
            _UserManager.showLogin();
        });
        $('#MenuSaveNow').click(function(e) {
            _DataManager.saveToServer();
        });




        $('#MenuShareWorld').click(function(e) {

            var state = _DataManager.getCurrentSession();
            state = state.replace(/\//g, '_');
            var turl = "/vwfdatamanager.svc/statedata?SID=" + state;
            $.getJSON(turl, function(data) {
                placehodler = '';
                if (data)
                    placeholder = data.title;
                alertify.prompt('Use the URL below to share this world with your friends! Just have them paste it into their browsers address bar.', function() {},
                    window.location.host + '/worlds/' + placeholder);

            });

        });

        $('#MenuLogOut').click(function(e) {
            if ($('#MenuLogOut').attr('disabled') == 'disabled') return;
            _UserManager.Logout();
        });
        $('#MenuSelectPick').click(function(e) {
            _Editor.SetSelectMode('Pick');
        });
        $('#MenuSelectNone').click(function(e) {
            _Editor.SelectObject(null);

        });
        $('#MenuMove').click(function(e) {
            _Editor.SetGizmoMode(_Editor.Move);
            $('#MenuRotateicon').removeClass('iconselected');
            $('#MenuScaleicon').removeClass('iconselected');
            $('#MenuMoveicon').addClass('iconselected');
        });
        $('#MenuRotate').click(function(e) {
            _Editor.SetGizmoMode(_Editor.Rotate);
            $('#MenuRotateicon').addClass('iconselected');
            $('#MenuScaleicon').removeClass('iconselected');
            $('#MenuMoveicon').removeClass('iconselected');
        });
        $('#MenuScale').click(function(e) {
            _Editor.SetGizmoMode(_Editor.Scale);
            $('#MenuRotateicon').removeClass('iconselected');
            $('#MenuScaleicon').addClass('iconselected');
            $('#MenuMoveicon').removeClass('iconselected');
        });
        $('#MenuMulti').click(function(e) {
            _Editor.SetGizmoMode(_Editor.Multi);
        });
        $('#MenuSaveCopy').click(function(e) {
            _InventoryManager.Take();
        });
        $('#MenuShare').click(function(e) {
            _PermissionsManager.show();
        });
        $('#MenuSetParent').click(function(e) {
            _Editor.SetParent();
        });
        $('#MenuSelectScene').click(function(e) {
            _Editor.SelectScene();
        });
        $('#MenuRemoveParent').click(function(e) {
            _Editor.RemoveParent();
        });
        $('#MenuSelectParent').click(function(e) {
            _Editor.SelectParent();
        });
        $('#MenuHierarchyManager').click(function(e) {
            if (HierarchyManager.isOpen())
                HierarchyManager.hide();
            else
                HierarchyManager.show();
        });
        $('#MenuLocal').click(function(e) {
            _Editor.SetCoordSystem(_Editor.LocalCoords);
            if (_Editor.GetMoveGizmo()) _Editor.updateGizmoOrientation(true);
        });
        $('#MenuWorld').click(function(e) {
            _Editor.SetCoordSystem(_Editor.WorldCoords);
            if (_Editor.GetMoveGizmo()) _Editor.updateGizmoOrientation(true);
        });
        $('#MenuDelete').click(function(e) {
            _Editor.DeleteSelection();
        });
        $('#MenuPublish').click(function(e) {
            _InventoryManager.Publish();
        });
        $('#MenuChat').click(function(e) {
            $('#ChatWindow').dialog('open');
        });
        $('#MenuUsers').click(function(e) {
            $('#Players').prependTo($('#Players').parent());
            $('#Players').show('blind', function() {});
            showSidePanel();
        });
        $('#MenuModels').click(function(e) {
            _ModelLibrary.show();
        });
        $('#MenuSnapLarge').click(function(e) {
            _Editor.SetSnaps(1, 15 * 0.0174532925, .15);
        });
        $('#MenuSnapMedium').click(function(e) {
            _Editor.SetSnaps(.5, 5 * 0.0174532925, .05);
        });
        $('#MenuSnapSmall').click(function(e) {
            _Editor.SetSnaps(.25, 1 * 0.0174532925, .01);
        });
        $('#MenuSnapOff').click(function(e) {
            _Editor.SetSnaps(.001, .01 * 0.0174532925, .00005);
        });
        $('#MenuMaterialEditor').click(function(e) {

            if (_MaterialEditor.isOpen())
                _MaterialEditor.hide();
            else
                _MaterialEditor.show();
        });
        $('#MenuScriptEditor').click(function(e) {
            if (_ScriptEditor.isOpen())
                _ScriptEditor.hide();
            else
                _ScriptEditor.show();
        });
        $('#MenuInventory').click(function(e) {
            if (_InventoryManager.isOpen())
                _InventoryManager.hide();
            else {
                _InventoryManager.show();
                $("#InventoryTypeChoicePersonal").click()
            }


        });



        $('#MenuPhysicsEditor').click(function(e) {

            if (_PhysicsEditor.isOpen())
                _PhysicsEditor.hide();
            else
                _PhysicsEditor.show();
        });

        $('#MenuObjectProperties').click(function(e) {

            if (_PrimitiveEditor.isOpen())
                _PrimitiveEditor.hide();
            else
                _PrimitiveEditor.show();
        });
        $('#MenuGlobalInventory').click(function(e) {
            if (_InventoryManager.isOpen())
                _InventoryManager.hide();
            else {
                _InventoryManager.show();
                $("#InventoryTypeChoiceGlobal").click()
            }

        });
        $('#MenuLatencyTest').click(function(e) {
            var e = {};
            e.time = new Date();
            vwf_view.kernel.callMethod('index-vwf', 'latencyTest', [e]);
        });
        $('#ResetTransforms').click(function(e) {
            _Editor.ResetTransforms();
        });
        $('#MenuCopy').click(function(e) {
            _Editor.Copy();
        });


        $('#MenuSelectName').click(function(e) {
            _SelectionEditor.Show();
        });

        $('#MenuPaste').click(function(e) {
            _Editor.Paste();
        });
        $('#MenuDuplicate').click(function(e) {
            _Editor.Duplicate();
        });
        $('#MenuCreatePush').click(function(e) {
            _Editor.CreateModifier('push', document.PlayerNumber, true);
        });
        $('#MenuCreateExtrude').click(function(e) {
            _Editor.CreateModifier('extrude', document.PlayerNumber, true);
        });
        $('#MenuCreateLathe').click(function(e) {
            _Editor.CreateModifier('lathe', document.PlayerNumber, true);
        });
        $('#MenuCreateTaper').click(function(e) {
            _Editor.CreateModifier('taper', document.PlayerNumber);
        });
        $('#MenuCreateBend').click(function(e) {
            _Editor.CreateModifier('bend', document.PlayerNumber);
        });
        $('#MenuCreateTwist').click(function(e) {
            _Editor.CreateModifier('twist', document.PlayerNumber);
        });

        $('#MenuCreateUVMap').click(function(e) {
            _Editor.CreateModifier('uvmap', document.PlayerNumber, true);
        });
        $('#MenuCreateCenterPivot').click(function(e) {
            _Editor.CreateModifier('centerpivot', document.PlayerNumber, true);
        });
        $('#MenuCreatePerlinNoise').click(function(e) {
            _Editor.CreateModifier('perlinnoise', document.PlayerNumber);
        });
        $('#MenuCreateSimplexNoise').click(function(e) {
            _Editor.CreateModifier('simplexnoise', document.PlayerNumber);
        });
        $('#MenuCreateOffset').click(function(e) {
            _Editor.CreateModifier('offset', document.PlayerNumber);
        });
        $('#MenuCreateStretch').click(function(e) {
            _Editor.CreateModifier('stretch', document.PlayerNumber);
        });

        $('#MenuCreateBehaviorRotator').click(function(e) {
            _Editor.CreateBehavior('rotator', _UserManager.GetCurrentUserName());
        });

        $('#MenuCreateBehaviorDialog').click(function(e) {
            _Editor.CreateBehavior('DialogSystem', _UserManager.GetCurrentUserName());
        });


        $('#MenuCreateBehaviorOrbit').click(function(e) {
            _Editor.CreateBehavior('orbit', _UserManager.GetCurrentUserName());
        });
        $('#MenuCreateBehaviorHyperlink').click(function(e) {
            _Editor.CreateBehavior('hyperlink', _UserManager.GetCurrentUserName());
        });
        $('#MenuCreateBehaviorHoverlabel').click(function(e) {
            _Editor.CreateBehavior('hoverlabel', _UserManager.GetCurrentUserName());
        });
        $('#MenuCreateBehaviorLookat').click(function(e) {
            _Editor.CreateBehavior('lookat', _UserManager.GetCurrentUserName());
        });
        $('#MenuCreateBehaviorOneClick').click(function(e) {
            _Editor.CreateBehavior('oneClick', _UserManager.GetCurrentUserName());
        });
        $('#MenuCreateBehaviorSeek').click(function(e) {
            _Editor.CreateBehavior('seek', _UserManager.GetCurrentUserName());
        });
        $('#MenuCreateBehaviorPathFollow').click(function(e) {
            _Editor.CreateBehavior('pathfollow', _UserManager.GetCurrentUserName());
        });
        $('#MenuCreateBehaviorClampToGround').click(function(e) {
            _Editor.CreateBehavior('clamptoground', _UserManager.GetCurrentUserName());
        });



        //trigger section
        $('#MenuCreateTriggerDistance').click(function(e) {
            _Editor.CreateBehavior('distancetrigger', _UserManager.GetCurrentUserName());
        });

        //trigger section
        $('#MenuCreateTriggerProperty').click(function(e) {
            _Editor.CreateBehavior('propertytrigger', _UserManager.GetCurrentUserName());
        });

        //trigger section
        $('#MenuCreateTriggerMethod').click(function(e) {
            _Editor.CreateBehavior('methodtrigger', _UserManager.GetCurrentUserName());
        });



        $('#MenuHelpBrowse').click(function(e) {
            window.open('http://vwf.adlnet.gov/r/c/documentation/', '_blank');
        });
        $('#MenuHelpAbout').click(function(e) {
            $('#NotifierAlertMessage').dialog('open');
            $('#NotifierAlertMessage').html('VWF Sandbox version 0.99 <br/> VWF 0.6 <br/>Rob Chadwick, ADL <br/> robert.chadwick.ctr@adlnet.gov<br/> texture attribution: <br/>http://opengameart.org/content/45-high-res-metal-and-rust-texture-photos CC-BY-3.0<br/>http://opengameart.org/content/golgotha-textures  public domain<br/>http://opengameart.org/content/p0sss-texture-pack-1  CC-BY-3.0<br/>http://opengameart.org/content/117-stone-wall-tilable-textures-in-8-themes    GPL2<br/>http://opengameart.org/content/wall-grass-rock-stone-wood-and-dirt-480 public domain<br/>http://opengameart.org/content/29-grounds-and-walls-and-water-1024x1024  CC-By-SA<br/>http://opengameart.org/content/filth-texture-set  GPL2');
            $('#NotifierAlertMessage').dialog('option', 'height', 'auto');
            $('#NotifierAlertMessage').dialog('option', 'width', 'auto');
        });
        $('#MenuSave').click(function(e) {
            _DataManager.save();
        });
        $('#MenuSaveAs').click(function(e) {
            _DataManager.saveAs();
        });
        $('#MenuLoad').click(function(e) {
            _DataManager.load();
        });
        $('#ChatInput').keypress(function(e) {
            e.stopPropagation();
            ChatKeypress(e);
        });
        $('#ChatInput').keydown(function(e) {
            e.stopPropagation();
        });
        $('#MenuCreateBlankBehavior').click(function(e) {
            _Editor.AddBlankBehavior();
        });
        $('#MenuViewGlyphs').click(function(e) {
            if ($('#glyphOverlay').css('display') == 'block') {
                $('#glyphOverlay').hide();
                _Notifier.notify('Glyphs hidden');
            } else {
                $('#glyphOverlay').show();
                _Notifier.notify('Glyphs displayed');
            }
        });

        
        $('#MenuViewOctree').click(function(e) {
            _SceneManager.setShowRegions(!_SceneManager.getShowRegions());
        });
        $('#MenuViewStats').click(function(e) {
            if (window.stats.domElement.style.display == 'none')
                window.stats.domElement.style.display = 'block';
            else
                window.stats.domElement.style.display = 'none';
        });
        $('#MenuViewShadows').click(function(e) {
            var val = !_Editor.findscene().children[1].castShadows;
            _Editor.findscene().children[1].setCastShadows(val);
        });
        $('#MenuViewBatchingForce').click(function(e) {
            _Editor.findscene().buildBatches(true);
        });
        $('#MenuViewStaticBatching').click(function(e) {
            _Editor.findscene().staticBatchingEnabled = !_Editor.findscene().staticBatchingEnabled;
            if (!_Editor.findscene().staticBatchingEnabled) {
                _SceneManager.forceUnbatchAll();
                _Notifier.notify('static batching disabled');
            } else {
                _Notifier.notify('static batching enabled');
            }
        });
        $('#MenuGroup').click(function(e) {
            _Editor.GroupSelection();
        });
        $('#MenuUngroup').click(function(e) {
            _Editor.UngroupSelection();
        });
        $('#MenuOpenGroup').click(function(e) {
            _Editor.OpenGroup();
        });
        $('#MenuCloseGroup').click(function(e) {
            _Editor.CloseGroup();
        });
        $('#MenuAlign').click(function(e) {
            _AlignTool.show();
        });
        $('#MenuBlockPainter').click(function(e) {
            _PainterTool.show();
        });
        $('#MenuSnapMove').click(function(e) {
            _SnapMoveTool.show();
        });
        $('#MenuSplineTools').click(function(e) {
            _SplineTool.show();

        });

        $('#MenuViewInterpolation').click(function(e) {
            _dView.interpolateTransforms = !_dView.interpolateTransforms;
            if (!_dView.interpolateTransforms)
                alertify.log('Animation interpolation disabled');
            else
                alertify.log('Animation interpolation enabled');
        });
        $('#MenuViewToggleWireframe').click(function(e) {

            if (_Editor.findscene().overrideMaterial) {
                _Editor.findscene().overrideMaterial = null;
            } else {
                _Editor.findscene().overrideMaterial = new THREE.MeshPhongMaterial();
                _Editor.findscene().overrideMaterial.wireframe = true;
                _Editor.findscene().overrideMaterial.color.r = 0;
                _Editor.findscene().overrideMaterial.color.g = 0;
                _Editor.findscene().overrideMaterial.color.b = 0;
                _Editor.findscene().overrideMaterial.fog = false;
            }
        });

        $('#MenuViewToggleBones').click(function(e) {
            if (_SceneManager.getBonesVisible())
                _SceneManager.hideBones();
            else
                _SceneManager.showBones();

        })

        $('#MenuViewToggleAO').click(function(e) {
            if (_Editor.findscene().getFilter2d()) {
                _Editor.findscene().setFilter2d();
            } else {
                var ao = new MATH.FilterAO();
                _Editor.findscene().setFilter2d(ao)
            }
        });

        function focusSelected() {
            _Editor.focusSelected();
        }

        $('#MenuActivateCamera').click(function(e) {
            _dView.chooseCamera();
        });
        $('#MenuFocusSelected').click(function(e) {
            _dView.setCameraDefault();
            focusSelected();
        });
        $('#MenuCameraOrbit').click(function(e) {
            _dView.setCameraDefault();
            clearCameraModeIcons();
            $('#MenuCameraOrbiticon').addClass('iconselected');
            var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];
            var ray = _Editor.GetCameraCenterRay();
            var dxy = _Editor.intersectLinePlane(ray, campos, [0, 0, 0], _Editor.WorldZ);
            var newintersectxy = MATH.addVec3(campos, MATH.scaleVec3(ray, dxy));
            vwf.models[0].model.nodes['index-vwf'].orbitPoint(newintersectxy);
            vwf.models[0].model.nodes['index-vwf'].updateCamera();
        });
        // click events for touching sub menus
        $('#MenuViewBatching,#MenuParticles,#MenuLights,#MenuModifiers,#MenuGrouping,#MenuPrimitives,#MenuTransforms,#MenuSnaps,#MenuSelect').click(function(e) {
            $(this).mouseenter();
        });

        $('#MenuCameraNavigate').click(function(e) {
            _dView.setCameraDefault();
            clearCameraModeIcons();
            $('#MenuCameraNavigateicon').addClass('iconselected');
            vwf.models[0].model.nodes['index-vwf'].setCameraMode('Orbit');
            vwf.models[0].model.nodes['index-vwf'].setCameraMode('Navigate');
        });

        $('#MenuCameraDeviceOrientation').click(function(e) {
            _dView.setCameraDefault();
            clearCameraModeIcons();
            vwf.models[0].model.nodes['index-vwf'].setCameraMode('DeviceOrientation');
        });
        $('#MenuViewHideTools').click(function(e) {
            hideTools();
        });




        $('#MenuCameraShare').click(function(e) {
            if (!_UserManager.GetCurrentUserName()) {
                alertify.confirm("Anonymous users may not share their camera view.", function(ok) {});
            }
            _dView.setCameraDefault();
            var broadcasting = vwf.callMethod('index-vwf', 'getBroadcasting', []);
            if (!broadcasting) {

                alertify.confirm("Are you sure you want to share your camera position? Other users will be able to see from your camera!", function(ok) {
                    if (ok) {
                        vwf_view.kernel.callMethod('index-vwf', 'cameraBroadcastStart', []);
                        $('#MenuCameraShare').text('Stop Camera Sharing');
                    }
                }.bind(this));
            } else {
                alertify.confirm("You are currently sharing your camera view. Would you like to stop sharing?", function(ok) {
                    if (ok) {
                        vwf_view.kernel.callMethod('index-vwf', 'cameraBroadcastEnd', []);
                        $('#MenuCameraShare').text('Share Camera View');

                    }
                }.bind(this));

            }
        });

        $('#MenuCameraFly').click(function(e) {
            _dView.setCameraDefault();
            clearCameraModeIcons();
            $('#MenuCameraNavigateicon').addClass('iconselected');
            vwf.models[0].model.nodes['index-vwf'].setCameraMode('Fly');

        });

        $('#MenuCameraNone').click(function(e) {
            _dView.setCameraDefault();
            clearCameraModeIcons();
            vwf.models[0].model.nodes['index-vwf'].setCameraMode('None');
        });
        $('#MenuCameraFree').click(function(e) {
            _dView.setCameraDefault();
            clearCameraModeIcons();
            $('#MenuCameraFreeicon').addClass('iconselected');
            vwf.models[0].model.nodes['index-vwf'].setCameraMode('Orbit');
            vwf.models[0].model.nodes['index-vwf'].setCameraMode('Free');
        });
        var pfx = ["webkit", "moz", "ms", "o", ""];

        function RunPrefixMethod(obj, method, param) {
            var p = 0,
                m, t;
            while (p < pfx.length && !obj[m]) {
                m = method;
                if (pfx[p] == "") {
                    m = m.substr(0, 1).toLowerCase() + m.substr(1);
                }
                m = pfx[p] + m;
                t = typeof obj[m];
                if (t != "undefined") {
                    pfx = [pfx[p]];
                    return (t == "function" ? obj[m](param) : obj[m]);
                }
                p++;
            }
        }
        $('#MenuViewFullscreen').click(function(e) {
            if (RunPrefixMethod(document, "FullScreen") || RunPrefixMethod(document, "IsFullScreen")) {
                RunPrefixMethod(document, "CancelFullScreen");
            } else {

                RunPrefixMethod(document.body, "RequestFullScreen", Element.ALLOW_KEYBOARD_INPUT);
            }
        });
        $('#MenuCamera3RDPerson').click(function(e) {

            if (_UserManager.GetCurrentUserName()) {
                _dView.setCameraDefault();
                clearCameraModeIcons();
                $('#MenuCamera3RDPersonicon').addClass('iconselected');
                vwf.models[0].model.nodes['index-vwf'].followObject(vwf.models[0].model.nodes[_UserManager.GetCurrentUserID()]);
                vwf.models[0].model.nodes['index-vwf'].setCameraMode('3RDPerson');
            } else {
                _Notifier.alert('First person mode is not available when you are not logged in.');
            }
        });


        $('#MenuCreateCameraPerspective').click(function(e) {
            _Editor.CreateCamera(_Editor.GetInsertPoint(), document.PlayerNumber);
        });
        $('#MenuCreateParticlesBasic').click(function(e) {
            _Editor.createParticleSystem('basic', _Editor.GetInsertPoint(), document.PlayerNumber);
        });
        $('#MenuCreateLightPoint').click(function(e) {
            _Editor.createLight('point', _Editor.GetInsertPoint(), document.PlayerNumber);
        });
        $('#MenuCreateLightSpot').click(function(e) {
            _Editor.createLight('spot', _Editor.GetInsertPoint(), document.PlayerNumber);
        });
        $('#MenuCreateLightDirectional').click(function(e) {
            _Editor.createLight('directional', _Editor.GetInsertPoint(), document.PlayerNumber);
        });
        $('#MenuCreateBox').click(function(e) {
            _Editor.CreatePrim('box', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreateLine').click(function(e) {
            _Editor.CreatePrim('line', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreateCircle').click(function(e) {
            _Editor.CreatePrim('circle', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreateStar').click(function(e) {
            _Editor.CreatePrim('star', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreateRectangle').click(function(e) {
            _Editor.CreatePrim('rectangle', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreateLSection').click(function(e) {
            _Editor.CreatePrim('lsection', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreateTSection').click(function(e) {
            _Editor.CreatePrim('tsection', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreateTerrain').click(function(e) {
            if (!window._dTerrain)
                _Editor.CreatePrim('terrain', [0, 0, 0], [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
            else {
                alertify.alert('Only one terrain can be created at a time');
            }
        });

        $('#MenuCreateUploadMesh').click(function(e) {
            _ModelLibrary.showUpload();
        });


        $('#MenuUndo').click(function(e) {
            _UndoManager.undo();
        });
        $('#MenuRedo').click(function(e) {
            _UndoManager.redo();
        });

        $('#MenuCreateLoadMeshURL').click(function(e) {
            alertify.choice("Choose the mesh format", function(ok, type) {

                if (ok) {
                    alertify.prompt('Input a URL to the mesh. Please note: this must serve from a CORS capable host!', function(ok, val) {
                        if (ok) {
                            if (type == 'Collada')
                                _Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.collada+xml');
                            if (type == 'Optimized Collada')
                                _Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.collada+xml+optimized');
                            if (type == '3DR JSON')
                                _Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.osgjs+json+compressed');
                            if (type == 'glTF JSON')
                                _Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.gltf+json');


                        }
                    }, 'http://');
                }

            }, ["Collada", "Optimized Collada", "3DR JSON", 'glTF JSON'])

        });


        $('#MenuCreateSphere').click(function(e) {
            _Editor.CreatePrim('sphere', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });

        $('#MenuCreateText').click(function(e) {
            _Editor.CreatePrim('text', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreateTorus').click(function(e) {
            _Editor.CreatePrim('torus', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreatePlane').click(function(e) {
            _Editor.CreatePrim('plane', _Editor.GetInsertPoint(), [1, 1, 5], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreateCylinder').click(function(e) {
            _Editor.CreatePrim('cylinder', _Editor.GetInsertPoint(), [1, .5, .5], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreateCone').click(function(e) {
            _Editor.CreatePrim('cone', _Editor.GetInsertPoint(), [.500, 1, .5], 'checker.jpg', document.PlayerNumber, '');
        });
        $('#MenuCreatePyramid').click(function(e) {
            _Editor.CreatePrim('pyramid', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
        });

        $('#LocationGoToPosition').click(function(e) {
            _LocationTools.GoToPosition();
        });

        $('#LocationGoToPlacemark').click(function(e) {
            _LocationTools.GoToPlaceMark();
        });

        $('#LocationAddPlacemark').click(function(e) {
            _LocationTools.AddPlacemark();
        });

        $('#ToolsShowID').click(function(e) {
            if (_Editor.GetSelectedVWFID())
                alertify.prompt(vwf.getProperty(_Editor.GetSelectedVWFID(), "DisplayName"), function() {}, _Editor.GetSelectedVWFID());
            else
                alertify.alert('No Selection');
        });



        $('#LocationMoveToGround').click(function(e) {
            _LocationTools.MoveToGround();
        });

        $('#MenuCreateTerrainGrass').click(function(e) {
            if (!_dTerrain) {
                alertify.alert('The scene must first contain a terrain object');
                return
            }
            var parent = _dTerrain.ID;

            var GrassProto = {
                extends: 'http://vwf.example.com/node3.vwf',
                properties: {}
            };
            GrassProto.type = 'subDriver/threejs';
            GrassProto.source = 'vwf/model/threejs/' + 'terrainDecorationManager' + '.js';

            GrassProto.properties.owner = _UserManager.GetCurrentUserName();
            GrassProto.properties.DisplayName = _Editor.GetUniqueName('Grass');
            _Editor.createChild(parent, GUID(), GrassProto, null, null);

        });

        $('#MenuCreateTerrainDecorator').click(function(e) {
            if (!_dTerrain) {
                alertify.alert('The scene must first contain a terrain object');
                return
            }
        });

        $('#MenuViewRenderNormal').click(function(e) {
            _dView.setRenderModeNormal();
        });
        $('#MenuViewRenderStereo').click(function(e) {
            _dView.setRenderModeStereo()
        });

        $('#TestSettings').click(function(e) {
            _Publisher.show();
        });

        $('#TestLaunch').click(function(e) {
            _Publisher.testPublish();
        });
        $('#MenuViewTabletDemo').click(function(e) {
            $('#MenuViewRenderStereo').click();
            $('#MenuCameraDeviceOrientation').click();
            $('#MenuViewFullscreen').click();
        });




        list = $('#smoothmenu1').find('[id]');

        //make every clicked menu item close all menus
        // $('#smoothmenu1').find('[id]').filter(':only-child').click(function(){ddsmoothmenu.closeall({type:'click',target:'asd'})});

    }
});