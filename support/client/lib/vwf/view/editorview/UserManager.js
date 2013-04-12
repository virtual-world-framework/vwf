define({
	initialize:function()
{
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
	
	$('#UserProfileWindow').css('border-bottom','5px solid #444444')
	$('#UserProfileWindow').css('border-left','2px solid #444444')	
	$('#userprofiletitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/user.png" />');
	
	$("#UserProfileWindow").append("<div id='FollowUser'></div>");
	$("#UserProfileWindow").append("<div id='PrivateMessage'></div>");
	$("#UserProfileWindow").append("<div id='EditProfile'></div>");
	$("#userprofileclose").click(function(){
		$("#UserProfileWindow").hide('blind',function(){
		if($('#sidepanel').data('jsp'))
					$('#sidepanel').data('jsp').reinitialise();
		if(!$('#sidepanel').children().is(':visible'))
				hideSidePanel();});
	});
	$(document.body).append('<div id="Logon">'+
	'	<form id="loginForm">'+
	'      <input type="text" placeholder="username" tabindex="300" id="profilenames" style="font-size: 1.6em;width: 90%;height: 22px;padding: 0px;margin-right: 16px;border-radius: 3px;" pop_up_selection="0"> </input>'+
	'      <input type="password" placeholder="password" tabindex="301"  id="password" style="font-size: 1.6em;width:90%;padding:0px;border-radius: 3px;" pop_up_selection="0"> </input>'+
	//'			<input type="text" name="name" id="name" onKeyPress="return disableEnterKey(event)" class="text ui-widget-content ui-corner-all" />'+
	//'			<div id="AvatarChoice">'+
	//'				<input type="radio" id="radio1" name="radio" value="usmale.dae" checked="checked" /><label for="radio1">Human</label>'+
	//'				<input type="radio" id="radio2" name="radio" value="mech.dae" /><label for="radio2">Robot</label>'+
	//'			</div>'+
	'	</form>'+
	'<div style="margin-top: 2em;color: grey;font-size: 0.8em;">Please note that this login system is not indended to be secure in any way. This is only a demonstration system. Your profile, inventory, and access to any objects you create are easily available to anyone with malicious intent. We never store your password, so this information is safe, but please consider this warning when creating content. If you would like to export a permanant copy of your work for archival purposes, please contact the site administrators. Content, profiles, and inventories are subject to deletion and removal at any time. </div>'+
	'</div>');
	
	$('#sidepanel').append('<div id="Players"  class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active" style="width: 100%;margin:0px;padding:0px">'+
	"<div id='playerstitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Players</span></div>"+
	'	 <div id="PlayerList"></div>'+
	'</div>');
	
	$('#playerstitle').append('<a id="playersclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
		$('#playersclose').click(function()
		{
			$('#Players').hide('blind',function(){
			if($('#sidepanel').data('jsp'))
					$('#sidepanel').data('jsp').reinitialise();
			if(!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible'))
				hideSidePanel();});
		});
	$('#playerstitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/users.png" />');	
	$('#Players').css('border-bottom','5px solid #444444')
	$('#Players').css('border-left','2px solid #444444')	
	$(document.body).append('<div id="CreateProfileDialog"/>');
	
	$("#CreateProfileDialog").append("<table id='CreateUserProfiletable' class='usertable'></table>");
	$("#CreateUserProfiletable").append("<tr><td><div>Username</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileUsername'></div></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Password</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='password' id='SetProfilePassword'></div></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Confirm</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='password' id='SetProfilePasswordConfirm'></div></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Name</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileName'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Age</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileAge'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Birthday</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileBirthday'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Relationship</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileRelationship'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>City</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileCity'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>State</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileState'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Homepage</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileHomepage'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Employer</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileEmployer'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Title</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileTitle'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Height</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileHeight'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Weight</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileWeight'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Nationality</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileNationality'></input></td></tr>");
	$("#CreateUserProfiletable").append("<tr><td><div>Avatar</div></td><td style='width: auto;width:70%;max-width: 100%;'><select size='3' style='border-radius: 2px;width: 100%;' type='text' id='SetProfileAvatar'>"+
										"<option value='usmale.dae'>US Soldier 1</choice>"+
										"<option value='usmale2.dae'>US Soldier 2</choice>"+
										"<option value='afganman.dae'>Afghani Man</choice>"+
										"</select></td></tr>");
	
	$(document.body).append('<div id="EditProfileDialog"/>');
	
	$("#EditProfileDialog").append("<table id='EditUserProfiletable' class='usertable'></table>");
	$("#EditUserProfiletable").append("<tr><td><div>Username</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' disabled='disabled'type='text' id='SetProfileUsername'></div></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>Name</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileName'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>Age</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileAge'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>Birthday</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileBirthday'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>Relationship</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileRelationship'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>City</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileCity'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>State</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileState'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>Homepage</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileHomepage'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>Employer</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileEmployer'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>Title</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileTitle'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>Height</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileHeight'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>Weight</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileWeight'></input></td></tr>");
	$("#EditUserProfiletable").append("<tr><td><div>Nationality</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileNationality'></input></td></tr>");
	$('#EditUserProfiletable input').keypress(function(e){
			e.stopPropagation();
	});
	$('#EditUserProfiletable input').keydown(function(e){
			e.stopPropagation();
	});
	
	$('#password').keydown(function(e){
			e.stopPropagation();
	});
	$("#EditProfile").button({label:'Edit My Profile'});
	$("#EditProfile").click(function()
	{
		$("#EditProfileDialog").dialog('open');
		
		for(i in _UserManager.SelectedProfile)
		{
			$('#EditUserProfiletable tbody tr td #SetProfile'+i).val(_UserManager.SelectedProfile[i]);
		}
	});
	
	$("#FollowUser").button({label:'Follow This User'});
	$("#FollowUser").click(function()
	{
		
		var id = '-object-Object-player-'+_UserManager.SelectedProfile.Username;
		vwf.models[0].model.nodes['index-vwf'].setCameraMode('Orbit');
		vwf.models[0].model.nodes['index-vwf'].followObject(vwf.models[0].model.nodes[id]);
		
		
	});
	$("#PrivateMessage").button({label:'Private Message'});
	$("#PrivateMessage").click(function()
	{
		
		setupPmWindow(_UserManager.SelectedProfile.Username);
	});
	this.SelectedProfile = null;
	this.showProfile = function(profile)
	{
		if(!profile)
			return;
		$('#UserProfileWindow').prependTo($('#UserProfileWindow').parent());
		$('#UserProfileWindow').show('blind',function(){
			
		});
		showSidePanel();
		
		this.SelectedProfile = profile;
	    //$('#UserProfileWindow').dialog('open');
		//$('#UserProfileWindow').dialog('option','position',[1282,40]);
		//_Editor.SelectObject(null);
		for(i in profile)
		{
			$('#Profile' + i).text(profile[i]);
		}
		
		$('#EditProfile').hide();
		$('#PrivateMessage').show();
		if(this.SelectedProfile.Username == this.GetCurrentUserName())
		{
			$('#EditProfile').show();
			$('#PrivateMessage').hide();
		}
	}
    this.GetCurrentUserName = function() 
    {
        return this.currentUsername;
    }
    this.GetCurrentUserID = function() 
    {
        return 'character-vwf-'+this.currentUsername;
    }
    this.PlayerProto  = { 
                    
                    extends: 'character.vwf',
                    source: $("#AvatarChoice :radio:checked").attr('value'),
                    type: 'model/vnd.collada+xml',
                    properties: {
                        PlayerNumber: 1,
                        },
					events: {
						ShowProfile: null,
						Message: null
                    },
					scripts: ["this.ShowProfile = function(){if(vwf.client() != vwf.moniker()) return; _UserManager.showProfile(_DataManager.GetProfileForUser(this.PlayerNumber))     }; \n" +
					          "this.Message = function(){if(vwf.client() != vwf.moniker()) return; setupPmWindow(this.PlayerNumber)     }"]
					};
					
					
	this.Login = function(username,password)
	{
	
		//clear this. No reason to have it saved in the dom
		$('#profilenames').val('');
		$('#password').val('');
		$('#SetProfilePassword').val('');
		$('#SetProfileUsername').val('');
		$('#SetProfilePasswordConfirm').val('');
		password = _UserManager.EncryptPassword(password,username);
			
		//take ownership of the client connection
		var S = window.location.pathname;
		
		var data = jQuery.ajax({
				type: 'GET',
				url: PersistanceServer + "/vwfDataManager.svc/login?S="+S+"&UID="+username+"&P="+password+"&CID="+vwf.moniker(),
				data: null,
				success: null,
				async:false,
				dataType: "json"
			});
		
		var profile = _DataManager.GetProfileForUser(username,password,true);
			if(!profile)
			{
				alert('There is no account with that username');
				return;
			}
			if(profile.constructor == String)
			{
				alert(profile);
				return;
			}
		
		if(data.status != 200)
		{
			alert(data.responseText);
			return;
		}
		
	    $('#MenuLogInicon').css('background',"#555555");
		$('#MenuLogOuticon').css('background',"");
        $('#MenuLogIn').attr('disabled','disabled');
		$('#MenuLogOut').removeAttr('disabled');
		//disabled until 
		this.PlayerProto.source= 'usmale.dae';//profile['Avatar'];
		
		
		if(document.Players && document.Players.indexOf(username) != -1)
		{
			alert('User is already logged into this space');
			return;
		}
		
	
		var newintersectxy = _Editor.GetInsertPoint();
		
		$('#Logon').dialog('close');
		this.PlayerProto.properties.PlayerNumber = username;
		this.PlayerProto.properties.owner = username;
        this.PlayerProto.properties.ownerClientID = vwf.moniker();
		this.PlayerProto.properties.profile = profile;
		this.PlayerProto.properties.translation = newintersectxy;
		document[username + 'link'] = null;
		//this.PlayerProto.id = "player"+username;
		document["PlayerNumber"] = username;
		var parms = new Array();
		parms.push(JSON.stringify(this.PlayerProto));
		
		this.currentUsername = profile.Username;
		//vwf_view.kernel.callMethod('index-vwf','newplayer',parms);
		vwf_view.kernel.createChild('index-vwf',this.currentUsername,this.PlayerProto);
		
		if(vwf.getProperty('index-vwf','owner') == null)
			vwf.setProperty('index-vwf','owner',this.currentUsername);
			
		var parms = new Array();
		parms.push(JSON.stringify({sender:'*System*',text:(document.PlayerNumber + " logging on")}));
		vwf_view.kernel.callMethod('index-vwf','receiveChat',parms);
		
	}
	this.CreateNPC = function(filename)
	{
		this.PlayerProto.source= filename;
		var name = 'NPC' + Math.floor(Math.random() * 1000);
		this.PlayerProto.properties.PlayerNumber = name;
		this.PlayerProto.properties.owner = this.currentUsername ;
        this.PlayerProto.properties.ownerClientID = null;
		this.PlayerProto.properties.profile = null;
		this.PlayerProto.id = "player"+name;
		
		var parms = new Array();
		parms.push(JSON.stringify(this.PlayerProto));
		vwf_view.kernel.callMethod('index-vwf','newplayer',parms);
	
	}
	this.PlayerDeleted = function(e)
	{
		$("#"+e+"label").remove();
	
	}
    this.PlayerCreated = function(e,id)
	{
		
		$("#PlayerList").append("<div id='"+(e+"label")+"'  class='playerlabel'>"+e+"</div>");
		$("#"+e+"label").attr("playerid",id);
		$("#"+e+"label").click(function()
		{
			$(".playerlabel").css("background-image","");// -webkit-linear-gradient(right, white 0%, #D9EEEF 100%)
			$(this).css("background-image","-webkit-linear-gradient(right, white 0%, #D9EEEF 100%)");
			
			
			var profile = vwf.getProperty($(this).attr("playerid"),'profile');
			_UserManager.showProfile(profile);
		});
		if(e == document.PlayerNumber)
		{
			$("#"+e+"label").attr("self","true");
			$("#"+e+"label").append(" (me)");
		}
	}
	this.Logout = function()
	{
	
	
		if(!_UserManager.GetCurrentUserName())
			return;
	
	
	
        $('#MenuLogOuticon').css('background',"#555555");
		$('#MenuLogInicon').css('background',"");
		$('#MenuLogIn').removeAttr('disabled');
		$('#MenuLogOut').attr('disabled','disabled');
	    //var parms = new Array();
		//parms.push(document[document.PlayerNumber +'link'].id);
		//alert(JSON.stringify(parms));
		//vwf_view.kernel.callMethod('index-vwf','deleteplayer',parms);
		var parms = new Array();
		parms.push(JSON.stringify({sender:'*System*',text:(document.PlayerNumber + " logging off")}));
		//
		//vwf_view.kernel.callMethod('index-vwf','receiveChat',parms);
		
		if(document[document.PlayerNumber +'link'])
			vwf_view.kernel.deleteNode(document[document.PlayerNumber +'link'].id);
		
		//take ownership of the client connection
		
		var profile = _DataManager.GetProfileForUser(_UserManager.GetCurrentUserName());
		
		var S = window.location.pathname;
		var data = jQuery.ajax({
				type: 'GET',
				url: PersistanceServer + "/vwfDataManager.svc/logout?S="+S+"&UID="+profile.Username+"&P="+profile.Password+"&CID="+vwf.moniker(),
				data: null,
				success: null,
				async:false,
				dataType: "json"
			});
		
		if(data.status != 200)
		{
			alert(data.responseText);
			return;
		}
		
		
		document[document.PlayerNumber +'link'] = null;
		document.PlayerNumber = null;
		_UserManager.currentUsername = null;
		
	}
	this.showCreateProfile = function()
	{
		$('#CreateProfileDialog').dialog('open');
	}
	this.showLogin = function()
	{
		$('#Logon').dialog('open');
		
		$('#profilenames').empty();
		
		//var users = _DataManager.GetUsers();
		//users = ['New Profile...'].concat(users);
		//$('#profilenames').combobox(users);
		//for(var i in _DataManager.rawdata.profiles)
		//{
		//	var profile = _DataManager.rawdata.profiles[i];
		//	$('#profilenames').append('<option value="'+profile.Username+'">'+profile.Username+'</option>');
		//}
	}
    $(window).unload(function(){this.Logout();}.bind(this));
	//$('#Players').dialog({ position:['left','bottom'],width:300,height:200,title: "Players",autoOpen:false});
	$('#Logon').dialog({autoOpen:false,title:'Log in',modal:true,buttons:{"Create Profile":function(){ 
			_UserManager.showCreateProfile(); 
	},
	"Log In": function()
	{
			
			
			_UserManager.Login($('#profilenames').val(),$('#password').val());
	},
	"Cancel" : function(){
		$('#Logon').dialog('close');
	}}});
	$('#EditProfileDialog').dialog({autoOpen:false,title:'Create New Profile',modal:true,buttons:{"Save":function(){ 	
			
			var newprofile = _DataManager.GetProfileForUser(_UserManager.GetCurrentUserName());
			
			var inputs = $('#EditUserProfiletable tbody tr input');
			
			for(var i=0; i<inputs.length;i++)
			{
				newprofile[$(inputs[i]).attr('id').substr(10)] = $(inputs[i]).val();
			}
			if(newprofile.Username == "")
			{
				alert('you must enter a user name');
				return;
			}
			_DataManager.saveProfile(newprofile);
			_UserManager.showProfile(newprofile);
			$('#EditProfileDialog').dialog('close');
			vwf_view.kernel.setProperty(_UserManager.GetCurrentUserID(),'profile',newprofile);
	}}});
	
	this.salt = 'OBS#$%SGSDF##$%#DA';
	this.EncryptPassword = function(password,username)
	{
			var unencrpytedpassword = password + username + this.salt;
			for(var i = 0; i < 1000; i ++)
			{
				unencrpytedpassword = CryptoJS.SHA256(unencrpytedpassword) + '';
			}
			return unencrpytedpassword;
	}
	
	$('#CreateProfileDialog').dialog({autoOpen:false,title:'Create New Profile',modal:true,buttons:{"Save and Log in":function(){ 	
			
			var newprofile = {};
			
			var inputs = $('#CreateUserProfiletable tbody tr input');
			
			for(var i=0; i<inputs.length;i++)
			{
				newprofile[$(inputs[i]).attr('id').substr(10)] = $(inputs[i]).val();
			}
			if(newprofile.Username == "")
			{
				alert('you must enter a user name');
				return;
			}
			if(newprofile.Password == "")
			{
				alert('The password cannot be blank');
				return;
			}
			if(newprofile.Password != newprofile.PasswordConfirm)
			{
				alert('The password confirm box must be the same as the password box.');
				return;
			}
			
			delete newprofile.PasswordConfirm;
			var unencryptedPassword = newprofile.Password;
			newprofile.Password = _UserManager.EncryptPassword(newprofile.Password,newprofile.Username)
			
			newprofile['Avatar'] = 'usmale.dae';//$('#SetProfileAvatar').val();
			
			//var userprofile = _DataManager.GetProfileForUser(newprofile.Username)
			var users = _DataManager.GetUsers();
			if(users.indexOf(newprofile.Username) != -1)
			{
				alert('User already exists');
				return;
			}
			
			_DataManager.saveProfile(newprofile);
			$('#CreateProfileDialog').dialog('close');
			_UserManager.Login(newprofile.Username,unencryptedPassword);
	},
	"Cancel" : function()
	{
		$('#CreateProfileDialog').dialog('close');
	}
	}});
	$('#SetProfileAvatar').val($("#SetProfileAvatar option:first").val());
	$('#UserProfileWindow').hide();
	$('#Players').hide();
}});

