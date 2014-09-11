define([], function() {
    var Publisher = {};
    var isInitialized = false;
    return {
        getSingleton: function() {
            if (!isInitialized) {
                initialize.call(Publisher);
                isInitialized = true;
            }
            return Publisher;
        }
    }

    function initialize() {
        this.setup = function() {
            $(document.body).append('<div id="publishSettings"></div>');
            $('#publishSettings').dialog({
                title: "Test Publish",
                buttons: {
                    ok: function() {
                        _Publisher.savePublishSettings();
                        $(this).dialog('close');
                    },
                    cancel: function() {
                        $(this).dialog('close');
                    }
                },
                position: 'center',
                width: 'auto',
                height: 'auto',
                resizable: 'false',
                moveable: 'false',
                modal: 'true',
                autoOpen: false
            });
            $('#publishSettings').append('<div><input type="checkbox" id="singlePlayer" /><span>Single Player</span></div>');
            $('#publishSettings').append('<div><input type="checkbox" id="allowAnonymous" /><span>Allow Anonymous</span></div>');
            $('#publishSettings').append('<div><input type="checkbox" id="createAvatar" /><span>Create Avatars</span></div>');
            $('#publishSettings').append('<div><input type="checkbox" id="allowTools" /><span>Allow Tools</span></div>');
            $('#publishSettings').append('<div id="chooseCamera" >Choose Camera</div>');

            $('#chooseCamera').button();
            $('#chooseCamera').click(function() {

                var list = _dView.getCameraList();

                var camList = list[0];
                var idList = list[1];

                alertify.choice("Choose the camera to use in the Published Scene", function(ok, val) {
                    $('#chooseCamera').button('option', 'label', val);
                    $('#chooseCamera').attr('cameraID', idList[camList.indexOf(val)]);
                }, camList)
            })
        }

        this.setup();

        this.show = function() {
            this.loadPublishSettings();
            $('#publishSettings').dialog('open');
        }
        this.savePublishSettings = function() {
            var statedata = {};
            statedata.SinglePlayer = $('#singlePlayer').is(':checked');
            statedata.camera = $('#chooseCamera').attr('cameraID');
            statedata.allowAnonymous = $('#allowAnonymous').is(':checked');
            statedata.createAvatar = $('#createAvatar').is(':checked');
            statedata.allowTools = $('#allowTools').is(':checked');
            _Editor.setProperty(vwf.application(), 'publishSettings', statedata);
        }
        this.loadPublishSettings = function() {
            var statedata = vwf.getProperty(vwf.application(), 'publishSettings') || {};

            if (statedata.SinglePlayer)
                $('#singlePlayer').attr('checked', 'checked');
            else
                $('#singlePlayer').removeAttr('checked');

            if (statedata.allowAnonymous)
                $('#allowAnonymous').attr('checked', 'checked');
            else
                $('#allowAnonymous').removeAttr('checked');

            if (statedata.createAvatar)
                $('#createAvatar').attr('checked', 'checked');
            else
                $('#createAvatar').removeAttr('checked');

            if (statedata.allowTools)
                $('#allowTools').attr('checked', 'checked');
            else
                $('#allowTools').removeAttr('checked');

            if (statedata.camera) {
                $('#chooseCamera').button('option', 'label', vwf.getProperty(statedata.camera, 'DisplayName'));
                $('#chooseCamera').attr('cameraID', statedata.camera);
            } else {
                $('#chooseCamera').button('option', 'label', "Choose Camera");
                $('#chooseCamera').attr('cameraID', null);
            }

        }

        this.stateBackup = null;
        this.backupState = function() {
            var s = _Editor.getNode(vwf.application());

            function walk(node) {
                for (var i in node.properties) {
                    //4th param as true returns whether or not delegation happened during get. if so, no need to store this property.
                    if (vwf.getProperty(node.id, i, false, true)) {
                        console.log('Removing delegated property', node.id, i);
                        delete node.properties[i];
                    }
                }
                for (var i in node.children) {
                    walk(node.children[i]);
                }
            }
            walk(s)

            vwf_view.kernel.setProperty(vwf.application(), 'playBackup', s);


        }
        this.satProperty = function(id, prop, val) {
            if (id == vwf.application()) {
                if (prop == 'playMode' && val == 'play') {
                    $('#playButton').addClass('pulsing');
                    $('#pauseButton').removeClass('pulsing');
                    $('#stopButton').removeClass('pulsing');

                    $('#toolbar, #EntityLibrary, .sidetab, #smoothmenu1, #smoothmenu1 ul li a').css('opacity', .3);
                    $('#toolbar, #EntityLibrary, .sidetab, #smoothmenu1, #smoothmenu1 ul li a').css('background-color', 'gray');
                    $('#toolbar, #EntityLibrary, .sidetab, #smoothmenu1, #smoothmenu1 ul li a').css('pointer-events', 'none');
                    $('#toolbar, #EntityLibrary, .sidetab, #smoothmenu1, #smoothmenu1 ul li a').css('cursor', 'not-allowed');
                    _Editor.SelectObject(null);
                    _Editor.SetSelectMode('none');
                    $('#index-vwf').focus();

                }

                if (prop == 'playMode' && val == 'paused') {


                    $('#playButton').addClass('pulsing');
                    $('#pauseButton').addClass('pulsing');
                    $('#stopButton').removeClass('pulsing');

                }
                if (prop == 'playMode' && val == 'stop') {


                    $('#playButton').removeClass('pulsing');
                    $('#pauseButton').removeClass('pulsing');
                    $('#stopButton').addClass('pulsing');
                    $('#toolbar, #EntityLibrary, .sidetab, #smoothmenu1, #smoothmenu1 ul li a').css('opacity', '');
                    $('#toolbar, #EntityLibrary, .sidetab, #smoothmenu1, #smoothmenu1 ul li a').css('pointer-events', '');
                    $('#toolbar, #EntityLibrary, .sidetab, #smoothmenu1, #smoothmenu1 ul li a').css('cursor', '');
                    $('#toolbar, #EntityLibrary, .sidetab, #smoothmenu1, #smoothmenu1 ul li a').css('background-color', '');
                    _Editor.SetSelectMode('Pick');
                }
            }
        }
        this.calledMethod = function(id, name, args) {
            if (id == vwf.application() && name == 'restoreState') {
                this.restoreState_imp(args[0]);
            }
        }
        this.restoreState_imp = function(s) {
            //when stopping a published world, there will be no backup
            if (!s) return;
            vwf.private.queue.suspend();
            vwf.models.kernel.disable();
            var currentState = _Editor.getNode(vwf.application());

            //find a node from one state in another
            var find = function(node, id) {
                if (node.id == id)
                    return true;
                for (var i in node.children) {
                    var ret = find(node.children[i], id);
                    if (ret) return true;
                }
                return false;
            }
            //async walk the graph and create nodes that don't exist. if htey do exist, set all their props
            var walk = function(node, walkCallback) {
                if (!node.children) {
                    walkCallback();
                    return;
                }
                async.eachSeries(Object.keys(node.children), function(i, eachSeriesCallback) {


                    //does the node exist?
                    var exists = false;
                    try {
                        exists = vwf.getNode(node.children[i].id);
                    } catch (e) {
                        //create it and when done, do the next child of the current node
                        if (node.children[i].extends != 'character.vwf')
                            vwf.createChild(node.id, i, node.children[i], null, null, eachSeriesCallback);
                        else
                            eachSeriesCallback();
                        return;
                    }
                    if (exists) {
                        //set all the props of this node
                        for (var j in node.children[i].properties) {
                            var currentprop = vwf.getProperty(node.children[i].id, j);
                            //dont set props that have not changed, as this can be a lot of work for nothign
                            if (JSON.stringify(currentprop) !== JSON.stringify(node.children[i].properties[j]))
                                vwf.setProperty(node.children[i].id, j, node.children[i].properties[j]);
                        }
                        //create or set props of the child
                        walk(node.children[i], eachSeriesCallback)

                    } else {
                        //create it and when done, do the next child of the current node
                        if (node.children[i].extends != 'character.vwf')
                            vwf.createChild(node.id, i, node.children[i], null, null, eachSeriesCallback);
                        else
                            eachSeriesCallback();
                    }

                }, walkCallback);
            }

            //walk, and when done, delete anything that was created
            walk(s, function() {

                //set all the properties on the root scene
                for (var j in s.properties) {
                    var currentprop = vwf.getProperty(s.id, j);
                    //dont set props that have not changed, as this can be a lot of work for nothign
                    if (JSON.stringify(currentprop) !== JSON.stringify(s.properties[j]) && j !== 'clients')
                        vwf.setProperty(s.id, j, s.properties[j]);
                }
                //synchronous walk of graph to find children that exist in the current state but not the old one. Delete nodes that were created
                var walk2 = function(node) {
                    //don't delete avatars
                    if (!find(s, node.id) && node.extends != 'character.vwf') {
                        vwf.deleteNode(node.id);
                    } else {
                        for (var i in node.children) {
                            walk2(node.children[i]);
                        }
                    }
                }
                walk2(currentState);

                vwf.models.kernel.enable();

                vwf.callMethod(vwf.application(), 'postWorldRestore');
                vwf.private.queue.resume();

            });

         //_PhysicsDriver.resetWorld();

        }
        this.restoreState = function() {
            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), vwf.application()) == 0) {
                alertify.log('You do not have permission to modify this world');
                return;
            }
            var s = vwf.getProperty(vwf.application(), 'playBackup');
            vwf_view.kernel.setProperty(vwf.application(), 'playBackup', null);
            vwf_view.kernel.callMethod(vwf.application(), 'restoreState', [s]);



        }
        this.playWorld = function() {
            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), vwf.application()) == 0) {
                alertify.log('You do not have permission to modify this world');
                return;
            }
            var currentState = vwf.getProperty(vwf.application(), 'playMode');
            if (currentState === 'play') return;
            if (currentState === 'stop')
                this.backupState();
            vwf_view.kernel.callMethod(vwf.application(), 'preWorldPlay');
            vwf_view.kernel.setProperty(vwf.application(), 'playMode', 'play')


        }
        this.stopWorld = function() {
            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), vwf.application()) == 0) {
                alertify.log('You do not have permission to modify this world');
                return;
            }
            var currentState = vwf.getProperty(vwf.application(), 'playMode');
            if (currentState === 'stop') return;
            this.restoreState();
            this.stateBackup = null;
            vwf_view.kernel.callMethod(vwf.application(), 'preWorldStop');
            vwf_view.kernel.setProperty(vwf.application(), 'playMode', 'stop')

        }
        this.togglePauseWorld = function() {
            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), vwf.application()) == 0) {
                alertify.log('You do not have permission to modify this world');
                return;
            }
            var currentState = vwf.getProperty(vwf.application(), 'playMode');
            if (currentState === 'stop') return;
            vwf_view.kernel.setProperty(vwf.application(), 'playMode', 'paused')
        }
        //quickly clone a world, publish it and open it. When that world closes, delete it.
        this.testPublish = function() {


            var testSettings = vwf.getProperty(vwf.application(), 'publishSettings') || {
                SinglePlayer: true,
                camera: null,
                allowAnonymous: false,
                createAvatar: false,
                allowTools: false
            };
            var instance = _DataManager.getCurrentSession();
            var instanceSettings = _DataManager.getInstanceData();
            var user = _UserManager.GetCurrentUserName();
            if (user != instanceSettings.owner) {
                alertify.alert('You must be the world owner to complete this action');
                return;
            }
            _DataManager.saveToServer(true);
            $.get('./vwfdatamanager.svc/copyinstance?SID=' + instance, function(o) {
                var newID = $.trim(o);
                var statedata = testSettings;



                jQuery.ajax({
                    type: 'POST',
                    url: './vwfDataManager.svc/publish?SID=' + newID,
                    data: JSON.stringify(statedata),
                    contentType: statedata ? "application/json; charset=utf-8" : "application/text; charset=utf-8",
                    dataType: "text",
                    success: function(data, status, xhr) {
                        var windowObjectReference;
                        var strWindowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
                        windowObjectReference = window.open("../../.." + newID.replace(/_/g, "/"), "TESTPUBLISH", strWindowFeatures);
                        var thisconsole = console;
                        if (windowObjectReference) {
                            $(document.body).append("<div id='publishblocker' style='position:absolute;top:0px;bottom:0px;left:0px;right:0px;background-color:black;opacity:.8;z-index:10000000' ></div>");
                            _dView.paused = true;
                            windowObjectReference.onbeforeunload = function() {

                                jQuery.ajax({
                                    type: 'DELETE',
                                    url: './vwfDataManager.svc/state?SID=' + newID,
                                    dataType: "text",
                                    success: function(data, status, xhr) {
                                        $('#publishblocker').remove();
                                        _dView.paused = false;
                                    },
                                    error: function(xhr, status, err) {

                                    }

                                });

                            };
                        }
                    },
                    error: function(xhr, status, err) {

                    }
                });
            });
        }
    }
});