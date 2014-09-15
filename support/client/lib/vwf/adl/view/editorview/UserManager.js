define(function() {
    var UserManager = {};
    var isInitialized = false;
    return {
        getSingleton: function() {
            if (!isInitialized) {
                initialize.call(UserManager);
                isInitialized = true;
            }
            return UserManager;
        }
    }

    function initialize() {
        this.currentUsername = null;
        $('#sidepanel').append("<div id='UserProfileWindow' class='ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active' style='padding-bottom:5px;overflow:hidden;height:auto'></div>");
        $('#UserProfileWindow').append("<div id='userprofiletitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>User Profile</span></div>");
        $('#userprofiletitle').append('<a id="userprofileclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
        $("#UserProfileWindow").append("<table id='UserProfiletable' class='usertable'></table>");
        $("#UserProfiletable").append("<tr><td><div>Username</div></td><td><div id='ProfileUsername'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Name</div></td><td><div id='ProfileName'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Age</div></td><td><div id='ProfileAge'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Birthday</div></td><td><div id='ProfileBirthday'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Relationship</div></td><td><div id='ProfileRelationship'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>City</div></td><td><div id='ProfileCity'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>State</div></td><td><div id='ProfileState'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Homepage</div></td><td><div id='ProfileHomepage'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Employer</div></td><td><div id='ProfileEmployer'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Title</div></td><td><div id='ProfileTitle'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Height</div></td><td><div id='ProfileHeight'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Weight</div></td><td><div id='ProfileWeight'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Nationality</div></td><td><div id='ProfileNationality'></div></td></tr>");
        //$('#UserProfileWindow').dialog({title:'Profile',autoOpen:false});
        $('#UserProfileWindow').css('border-bottom', '5px solid #444444')
        $('#UserProfileWindow').css('border-left', '2px solid #444444')
        $('#userprofiletitle').prepend('<div class="headericon user" />');
        $("#UserProfileWindow").append("<div id='FollowUser'></div>");
        $("#UserProfileWindow").append("<div id='PrivateMessage'></div>");
        $("#UserProfileWindow").append("<div id='CallUser'></div>");
        $("#UserProfileWindow").append("<div id='VideoCallUser'></div>");


        $("#userprofileclose").click(function() {
            $("#UserProfileWindow").hide('blind', function() {


                if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
                if (!$('#sidepanel').children().is(':visible')) hideSidePanel();
            });
        });
        $('#sidepanel').append('<div id="Players"  class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active" style="width: 100%;margin:0px;padding:0px">' + "<div id='playerstitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Players</span></div>" + '	 <div id="PlayerList"></div>' + '</div>');
        $('#playerstitle').append('<a id="playersclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
        $('#playersclose').click(function() {
            $('#Players').hide('blind', function() {
                $('#MenuUsersicon').removeClass('iconselected');
                if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
                if (!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible')) hideSidePanel();
            });
        });
        $('#playerstitle').prepend('<div class="headericon users"  />');
        $('#Players').css('border-bottom', '5px solid #444444')
        $('#Players').css('border-left', '2px solid #444444')
        $(document.body).append('<div id="CreateProfileDialog"/>');

        $("#FollowUser").button({
            label: 'Follow This User'
        });
        $("#FollowUser").click(function() {
            var id = '-object-Object-player-' + _UserManager.SelectedProfile.Username;
            vwf.models[0].model.nodes['index-vwf'].setCameraMode('Orbit');
            vwf.models[0].model.nodes['index-vwf'].followObject(vwf.models[0].model.nodes[id]);
        });
        $("#PrivateMessage").button({
            label: 'Private Message'
        });
        $("#PrivateMessage").click(function() {
            setupPmWindow(_UserManager.SelectedProfile.Username);
        });

        $("#CallUser").button({
            label: 'Voice Call'
        });
        $("#CallUser").click(function() {
            vwf.callMethod('index-vwf', 'rtcCall', {
                target: _UserManager.SelectedProfile.Username
            });
        });

        $("#VideoCallUser").button({
            label: 'Video Call'
        });
        $("#VideoCallUser").click(function() {
            vwf.callMethod('index-vwf', 'rtcVideoCall', {
                target: _UserManager.SelectedProfile.Username
            });
        });

        $(document).on('setstatecomplete', function() {

            if (this.GetCurrentUserName()) return;
            if ($('#GuestLogin').length > 0) return;

            //by default, you need to log in. Only in the case of published states do you not need to log in.
            var needlogin = true;
            var statedata = _DataManager.getInstanceData();

            //published worlds may choose to allow anonymous users
            //singleplayers worlds do not need login
            if (statedata && statedata.publishSettings && (statedata.publishSettings.allowAnonymous || statedata.publishSettings.singlePlayer))
                needlogin = false;

            if (needlogin) {
                $.ajax('/vwfDataManager.svc/logindata', {
                    cache: false,
                    async: false,
                    success: function(data, status, xhr) {
                        var logindata = JSON.parse(xhr.responseText);
                        var username = logindata.username || logindata.user_uid || logindata.UID;
                        var userID = logindata.user_uid || logindata.UID;


                        //only the first client from a given login should create the avatart
                        if (vwf.models[0].model.nodes['character-vwf-' + userID.replace(/ /g, '-')] == undefined)
                            this.Login(username, userID);
                        else {
                            alertify.alert('You are already logged into this space from another tab. This session will be an anonymous guest');
                        }


                    }.bind(this),
                    error: function(xhr, status, err) {


                        hideTools();
                        //$('#NotifierAlertMessage').dialog('open');
                        //$('#NotifierAlertMessage').html('You are viewing this world as a guest. Please <a style="color:blue" href="'+_DataManager.getCurrentApplication() + "/login?return=" + _DataManager.getCurrentSession().substr(13)+'">sign in</a> to participate');



                        $(document.body).append('<a href="#" id="GuestLogin" style="font-family: sans-serif;z-index:99;position:fixed;font-size: 2em;" class="alertify-button alertify-button-ok" id="alertify-ok">' + i18n.t('Login') + '</a>');
                        $('#GuestLogin').click(function() {

                            window.location = _DataManager.getCurrentApplication() + "login?return=" + window.location.pathname.substring(window.location.pathname.indexOf(window.appPath) + window.appPath.length) + window.location.hash + window.location.search;
                        });

                    }.bind(this)
                });
            } else {
                //this is a published world, and you do not need to be logged in
                 $.ajax('/vwfDataManager.svc/logindata', {
                    cache: false,
                    async: false,
                    success: function(data, status, xhr) {
                        //however, if you are logged in, this manager needs to know your name
                        //since the server knows your name via the session cookie, it will fire
                        //a login event with the users name. 
                        var logindata = JSON.parse(xhr.responseText);
                        var username = logindata.username || logindata.user_uid || logindata.UID;
                        var userID = logindata.user_uid || logindata.UID;


                        //only the first client from a given login should create the avatart
                        if (vwf.models[0].model.nodes['character-vwf-' + userID.replace(/ /g, '-')] == undefined)
                            this.Login(username, userID);
                        else {
                            this.Login('Anonymous' + _UserManager.getPlayers().length, 'Anonymous' + _UserManager.getPlayers().length);
                        }


                    }.bind(this),
                    error: function(xhr, status, err) {
                        //in this case, the world allows anonymous users, and you really are anonymous, so log in as
                        //anonymous;
                        this.Login('Anonymous' + _UserManager.getPlayers().length, 'Anonymous' + _UserManager.getPlayers().length);
                    }.bind(this)
                });



            }



        }.bind(this));
        this.SelectedProfile = null;
        this.showProfile = function(profile) {
            if (!profile) return;
            $('#UserProfileWindow').prependTo($('#UserProfileWindow').parent());
            $('#UserProfileWindow').show('blind', function() {
                $('#MenuUsersicon').addClass('iconselected');

            });
            showSidePanel();
            this.SelectedProfile = profile;
            //$('#UserProfileWindow').dialog('open');
            //$('#UserProfileWindow').dialog('option','position',[1282,40]);
            //_Editor.SelectObject(null);
            for (i in profile) {
                $('#Profile' + i).text(profile[i]);
            }
            $('#EditProfile').hide();
            $('#PrivateMessage').show();
            $('#CallUser').show();
            if (this.SelectedProfile.Username == this.GetCurrentUserName()) {
                $('#EditProfile').show();
                $('#PrivateMessage').hide();
                $('#CallUser').hide();
            }
        }
        this.GetCurrentUserName = function() {
            return this.currentUsername;
        }
        this.GetCurrentUserID = function() {
            return 'character-vwf-' + this.currentUsername.replace(/ /g, '-');
        }
        this.createdNode = function(nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childURI, childName, callback /* ( ready ) */ ) {
            if (childName && childName == this.GetCurrentUserName()) {
                var statedata = _DataManager.getInstanceData();


                if ((statedata && statedata.publishSettings && !statedata.publishSettings.camera) || !statedata || !statedata.publishSettings) {

                    _dView.setCameraDefault();
                    clearCameraModeIcons();
                    $('#MenuCamera3RDPersonicon').addClass('iconselected');
                    vwf.models[0].model.nodes['index-vwf'].followObject(vwf.models[0].model.nodes[_UserManager.GetCurrentUserID()]);
                    vwf.models[0].model.nodes['index-vwf'].setCameraMode('3RDPerson');
                }



            }
        }
        this.Login = function(username, userID) {

            $('#StatusUserName').text(username);
            var needlogin = true;
            var createAvatar = true;
            var statedata = _DataManager.getInstanceData();

            //published worlds may choose to allow anonymous users
            //singleplayers worlds do not need login
            if (statedata && statedata.publishSettings && (statedata.publishSettings.allowAnonymous || statedata.publishSettings.singlePlayer))
                needlogin = false;

            if (statedata && statedata.publishSettings && statedata.publishSettings.createAvatar === false)
                createAvatar = false;


            if (this.GetCurrentUserName()) return;
            //clear this. No reason to have it saved in the dom

            this.currentUsername = userID;
            //only take control of hte websocket if you have to log in. Don't do this for allow anon and or singleplayer
            if (needlogin) {
                //take ownership of the client connection
                var S = _DataManager.getCurrentSession();
                var data = jQuery.ajax({
                    type: 'GET',
                    url: PersistanceServer + "./vwfDataManager.svc/login?S=" + S + "&CID=" + vwf.moniker(),
                    data: null,
                    success: null,
                    async: false,
                    dataType: "json"
                });

                var profile = _DataManager.GetProfileForUser(userID, true);
                if (!profile) {
                    alert('There is no account with that username');
                    return;
                }
                if (profile.constructor == String) {
                    alert(profile);
                    return;
                }
                if (data.status != 200) {
                    alert(data.responseText);
                    return;
                }
            }
            $('#MenuLogInicon').addClass('icondisabled')
            $('#MenuLogOuticon').removeClass('icondisabled');
            $('#MenuLogIn').attr('disabled', 'disabled');
            $('#MenuLogOut').removeAttr('disabled');


            this.PlayerProto = {
                extends: 'character.vwf',
                source: 'usmale.dae',
                type: 'subDriver/threejs/asset/vnd.collada+xml',
                properties: {
                    PlayerNumber: 1,
                    isDynamic: true,
                    castShadows: true,
                    receiveShadows: true,
                    activeCycle: [],
                    standingOnID: null,
                    standingOnOffset: null,
                    ___physics_activation_state: 4,
                    ___physics_deactivation_time: 0,
                    ___physics_velocity_linear: [0, 0, 0],
                    ___physics_velocity_angular: [0, 0, 0],
                    ___physics_factor_linear: [0, 0, 0],
                    ___physics_factor_angular: [0, 0, 0],
                    ___physics_enabled: true,
                    ___physics_mass: 100,
                     transform: [
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1
                    ],
                },
                events: {
                    ShowProfile: null,
                    Message: null
                },
                scripts: ["this.ShowProfile = function(){if(vwf.client() != vwf.moniker()) return; _UserManager.showProfile(_DataManager.GetProfileForUser(this.PlayerNumber))     }; \n" +
                    "this.Message = function(){if(vwf.client() != vwf.moniker()) return; setupPmWindow(this.PlayerNumber)     }"
                ],
                children: {

                }
            };

            var collision = {
                "extends": "box2.vwf",
                "source": "vwf/model/threejs/box.js",
                "type": "subDriver/threejs",
                "properties": {
                    "___physics_activation_state": 1,
                    "___physics_deactivation_time": 0,
                    "___physics_velocity_linear": [
                        0,
                        0,
                        0
                    ],
                    "___physics_velocity_angular": [
                        0,
                        0,
                        0
                    ],
                    "DisplayName": "CharacterCollision",
                    "_length": 0.8,
                    "height": 1.54,
                    "isSelectable": false,
                    "owner": userID,
                    "transform": [
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0.8009999394416809,
                        1
                    ],
                    "type": "Primitive",
                    "width": 0.62,
                    "visible": false,
                    "___physics_enabled": true
                }
            }
            this.PlayerProto.children[GUID()] = collision;
            //this.PlayerProto.source = 'usmale.dae'; //profile['Avatar'];

            if (!profile) profile = {};

            this.PlayerProto.source = profile.avatarModel || './avatars/VWS_Business_Female1.DAE';

            this.PlayerProto.properties.cycles = {
                stand: {
                    start: 1,
                    length: 0,
                    speed: 1.25,
                    current: 0,
                    loop: true
                },
                walk: {
                    start: 6,
                    length: 27,
                    speed: 1.0,
                    current: 0,
                    loop: true
                },
                straferight: {
                    start: 108,
                    length: 16,
                    speed: 1.5,
                    current: 0,
                    loop: true
                },
                strafeleft: {
                    start: 124,
                    length: 16,
                    speed: -1.5,
                    current: 0,
                    loop: true
                },
                walkback: {
                    start: 0,
                    length: 30,
                    speed: -1.25,
                    current: 0,
                    loop: true
                },
                run: {
                    start: 70,
                    length: 36,
                    speed: 1.25,
                    current: 0,
                    loop: true
                },
                jump: {
                    start: 70,
                    length: 36,
                    speed: 1.25,
                    current: 0,
                    loop: false
                },
                runningjump: {
                    start: 109,
                    length: 48,
                    speed: 1.25,
                    current: 0,
                    loop: false
                }
            };


            this.PlayerProto.properties.materialDef = {
                "color": {
                    "r": 1,
                    "g": 1,
                    "b": 1
                },
                "ambient": {
                    "r": 1,
                    "g": 1,
                    "b": 1
                },
                "emit": {
                    "r": 0.27058823529411763,
                    "g": 0.2549019607843137,
                    "b": 0.2549019607843137
                },
                "specularColor": {
                    "r": 0.2,
                    "g": 0.2,
                    "b": 0.2
                },
                "specularLevel": 1,
                "alpha": 1,
                "shininess": 0,
                "side": 0,
                "reflect": 0,
                "layers": [{
                    "mapTo": 1,
                    "scalex": 1,
                    "scaley": 1,
                    "offsetx": 0,
                    "offsety": 0,
                    "alpha": 1,
                    "src": profile.avatarTexture || "./avatars/VWS_B_Female1-1.jpg",
                    "mapInput": 0
                }],
                "type": "phong",
                "depthtest": true,
                "morphTargets": true
            }

            this.PlayerProto.properties.standing = 0;


            if (document.Players && document.Players.indexOf(userID) != -1) {
                alert('User is already logged into this space');
                return;
            }
            var newintersectxy = _LocationTools.getCurrentPlacemarkPosition() || _LocationTools.getPlacemarkPosition('Origin') || _Editor.GetInsertPoint();
            //vwf.models[0].model.nodes['index-vwf'].orbitPoint(newintersectxy);
            this.PlayerProto.properties.PlayerNumber = username;
            this.PlayerProto.properties.owner = userID;
            this.PlayerProto.properties.ownerClientID = vwf.moniker();
            this.PlayerProto.properties.profile = profile;
            this.PlayerProto.properties.transform[12] = newintersectxy[0];
            this.PlayerProto.properties.transform[13] = newintersectxy[1];
            this.PlayerProto.properties.transform[14] = newintersectxy[2];
            this.PlayerProto.properties.scale = [profile.avatarHeight || 1.0, profile.avatarHeight || 1.0, profile.avatarHeight || 1.0];

            vwf.models.javascript.nodes['index-vwf'].orbitPoint(newintersectxy);
            document[username + 'link'] = null;
            //this.PlayerProto.id = "player"+username;
            document["PlayerNumber"] = username;
            var parms = new Array();
            parms.push(JSON.stringify(this.PlayerProto));

            //vwf_view.kernel.callMethod('index-vwf','newplayer',parms);

            if (createAvatar)
                vwf_view.kernel.createChild('index-vwf', this.currentUsername, this.PlayerProto);

            //if no one has logged in before, this world is yours
            if (vwf.getProperty('index-vwf', 'owner') == null) vwf.setProperty('index-vwf', 'owner', this.currentUsername);

            //if single player, world is yours
            if (statedata && statedata.publishSettings && statedata.publishSettings.singlePlayer)
                vwf.setProperty('index-vwf', 'owner', this.currentUsername);

            var parms = new Array();
            parms.push(JSON.stringify({
                sender: '*System*',
                text: (document.PlayerNumber + " logging on")
            }));
            vwf_view.kernel.callMethod('index-vwf', 'receiveChat', parms);
        }
        this.CreateNPC = function(filename) {
            this.PlayerProto.source = filename;
            var name = 'NPC' + Math.floor(Math.SecureRandom() * 1000);
            this.PlayerProto.properties.PlayerNumber = name;
            this.PlayerProto.properties.owner = this.currentUsername;
            this.PlayerProto.properties.ownerClientID = null;
            this.PlayerProto.properties.profile = null;
            this.PlayerProto.id = "player" + name;
            var parms = new Array();
            parms.push(JSON.stringify(this.PlayerProto));
            vwf_view.kernel.callMethod('index-vwf', 'newplayer', parms);
        }
        this.PlayerDeleted = function(e) {

            $("#" + e + "label").remove();
            var index = this.playerNames.indexOf(e);
            this.playerNames.splice(index, 1);
            index = this.playerIDs.indexOf('character-vwf-' + e);
            this.playerIDs.splice(index, 1);
        }
        this.getPlayerIDs = function() {
            return this.playerIDs || [];
        }
        this.getPlayers = function() {
            var playerNodes = [];
            for (var i = 0; i < this.getPlayerIDs().length; i++) {
                playerNodes.push(vwf.models.javascript.nodes[this.getPlayerIDs()[i]]);

            }
            playerNodes.sort(function(a, b) {

                if (a.ownerClientID > b.ownerClientID) return 1;
                return -1;
            })
            return playerNodes;
        }
        this.PlayerCreated = function(e, id) {
            if (!this.playerNames)
                this.playerNames = [];
            if (!this.playerIDs)
                this.playerIDs = [];

            this.playerNames.push(e);
            this.playerIDs.push(id);

            $("#PlayerList").append("<div id='" + (e + "label") + "'  class='playerlabel'>" + e + "</div>");
            $("#" + e + "label").attr("playerid", id);
            $("#" + e + "label").click(function() {
                $(".playerlabel").css("background-image", ""); // -webkit-linear-gradient(right, white 0%, #D9EEEF 100%)
                $(this).css("background-image", "-webkit-linear-gradient(right, white 0%, #D9EEEF 100%)");
                var profile = vwf.getProperty($(this).attr("playerid"), 'profile');
                _UserManager.showProfile(profile);
            });
            if (e == document.PlayerNumber) {
                $("#" + e + "label").attr("self", "true");
                $("#" + e + "label").append(" (me)");
            }
        }
        this.Logout = function() {
            //if (!_UserManager.GetCurrentUserName()) return;

            var needlogin = true;
            var statedata = _DataManager.getInstanceData();

            //published worlds may choose to allow anonymous users
            //singleplayers worlds do not need login
            if (statedata && statedata.publishSettings && (statedata.publishSettings.allowAnonymous || statedata.publishSettings.singlePlayer))
                needlogin = false;


            $('#MenuLogOuticon').addClass('icondisabled')
            $('#MenuLogInicon').removeClass('icondisabled')
            $('#MenuLogIn').removeAttr('disabled');
            $('#MenuLogOut').attr('disabled', 'disabled');
            //var parms = new Array();
            //parms.push(document[document.PlayerNumber +'link'].id);
            //alert(JSON.stringify(parms));
            //vwf_view.kernel.callMethod('index-vwf','deleteplayer',parms);
            var parms = new Array();
            parms.push(JSON.stringify({
                sender: '*System*',
                text: (document.PlayerNumber + " logging off")
            }));


            //
            //vwf_view.kernel.callMethod('index-vwf','receiveChat',parms);
            if (document[document.PlayerNumber + 'link']) vwf_view.kernel.deleteNode(document[document.PlayerNumber + 'link'].id);
            //take ownership of the client connection
            var profile = _DataManager.GetProfileForUser(_UserManager.GetCurrentUserName());
            var S = _DataManager.getCurrentSession();

            _DataManager.saveToServer(true);

            //inform the server that you intend to disconnect from the world
            if (needlogin) {
                var data = jQuery.ajax({
                    type: 'GET',
                    url: "./vwfDataManager.svc/logout?S=" + S + "&CID=" + vwf.moniker(),
                    data: null,
                    success: null,
                    async: false,
                    dataType: "json"
                });
                if (data.status != 200) {
                    alert(data.responseText);
                    return;
                }
            }

            document[document.PlayerNumber + 'link'] = null;
            document.PlayerNumber = null;
            _UserManager.currentUsername = null;

            window.location = window.location.pathname.replace('/sandbox/', '/sandbox/world/')
            return;
        }
        this.showLogin = function() {
            //new system does not do logins!


            $.ajax('/vwfDataManager.svc/logindata', {
                cache: false,
                success: function(data, status, xhr) {
                    var logindata = JSON.parse(xhr.responseText);
                    var username = logindata.username;

                    if (logindata.instances.indexOf(_DataManager.getCurrentSession()) != -1) {
                        _Notifier.alert('You are already logged into this space from another tab, browser or computer. This session will be a guest.');
                    } else {
                        this.Login(username);
                    }

                }.bind(this),
                error: function(xhr, status, err) {

                    window.onbeforeunload = '';

                    window.location = _DataManager.getCurrentApplication() + "login?return=" + _DataManager.getCurrentSession().substring(window.location.pathname.indexOf(window.appPath) + window.appPath.length) + window.location.hash;
                }.bind(this)
            });

        }
        $(window).unload(function() {
            if (this.GetCurrentUserName())
                this.Logout();
        }.bind(this));
        //$('#Players').dialog({ position:['left','bottom'],width:300,height:200,title: "Players",autoOpen:false});


        //these three functions should be deprecated and replaced by the ClientAPI on the Scene object for access
        //from within the model.
        this.GetPlayernameForClientID = function(id) {
            var clients = vwf.getProperty(vwf.application(),'clients')
            if(clients && clients[id])
                return clients[id].UID;
        }
        this.GetAvatarForClientID = function(id) {
            for (var i in vwf.models[0].model.nodes) {
                var node = vwf.models[0].model.nodes[i];
                if (node.ownerClientID == id)
                    return node;
            }
        }
        this.GetClientIDForPlayername = function(id) {
            var clients = vwf.getProperty(vwf.application(),'clients')
            for(var i in clients)
            {
                if(clients[i].UID == id) return clietns[i].cid;
            }
        }

        $('#UserProfileWindow').hide();
        $('#Players').hide();
    }
});