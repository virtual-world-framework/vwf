function UserManager()
{
	this.currentUsername = null;
	$(document.body).append("<div id='UserProfileWindow'></div>");
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
	$('#UserProfileWindow').dialog({title:'Profile',autoOpen:false});
	$("#UserProfileWindow").append("<div id='FollowUser'></div>");
	$("#UserProfileWindow").append("<div id='PrivateMessage'></div>");
	$("#UserProfileWindow").append("<div id='EditProfile'></div>");
	
	$(document.body).append('<div id="Logon">'+
	'	<form id="loginForm">'+
	'      <select id="profilenames" style="width: 100%;height: 2em;border-radius: 10px;"> </select>'+
	//'			<input type="text" name="name" id="name" onKeyPress="return disableEnterKey(event)" class="text ui-widget-content ui-corner-all" />'+
	//'			<div id="AvatarChoice">'+
	//'				<input type="radio" id="radio1" name="radio" value="usmale.dae" checked="checked" /><label for="radio1">Human</label>'+
	//'				<input type="radio" id="radio2" name="radio" value="mech.dae" /><label for="radio2">Robot</label>'+
	//'			</div>'+
	'	</form>'+
	'</div>'+
	'<div id="Players" style="width: 100%;margin:0px;padding:0px">'+
	'	 <div id="PlayerList"></div>'+
	'</div>');
	$(document.body).append('<div id="CreateProfileDialog"/>');
	
	$("#CreateProfileDialog").append("<table id='CreateUserProfiletable' class='usertable'></table>");
	$("#CreateUserProfiletable").append("<tr><td><div>Username</div></td><td style='width: auto;max-width: 100%;'><input style='border-radius: 10px;width: auto;' type='text' id='SetProfileUsername'></div></td></tr>");
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
		
		var id = 'player-'+_UserManager.SelectedProfile.Username;
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
		this.SelectedProfile = profile;
	    $('#UserProfileWindow').dialog('open');
		$('#UserProfileWindow').dialog('option','position',[1282,40]);
		_PrimitiveEditor.hide();
		_MaterialEditor.hide();
		_Editor.SelectObject(null);
		for(i in profile)
		{
			$('#Profile' + i).html(profile[i]);
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
        return 'player-'+this.currentUsername;
    }
    this.PlayerProto  = { 
                    
                    extends: 'character.vwf',
                    source: $("#AvatarChoice :radio:checked").attr('value'),
                    type: 'model/vnd.collada+xml',
                    properties: {
                        PlayerNumber: 1,
                        },
                    };
	this.Login = function(profile)
	{
	    
        $('#MenuLogIn').attr('disabled','disabled');
		$('#MenuLogOut').removeAttr('disabled');
		this.PlayerProto.source= 'usmale.dae';//$("#AvatarChoice :radio:checked").attr('value');
		var name = profile.Username;
		$('#Logon').dialog('close');
		this.PlayerProto.properties.PlayerNumber = name;
		this.PlayerProto.properties.owner = name;
        this.PlayerProto.properties.ownerClientID = vwf.moniker();
		this.PlayerProto.properties.profile = profile;
		document[name + 'link'] = null;
		this.PlayerProto.id = "player"+name;
		document["PlayerNumber"] = name;
		var parms = new Array();
		parms.push(JSON.stringify(this.PlayerProto));
		
		console.log(vwf_view);
		vwf_view.kernel.callMethod('index-vwf','newplayer',parms);
		
		this.currentUsername = profile.Username;
		var parms = new Array();
		parms.push(JSON.stringify({sender:'*System*',text:(document.PlayerNumber + " logging on")}));
		vwf_view.kernel.callMethod('index-vwf','receiveChat',parms);
		
	}
    this.PlayerCreated = function(e)
	{
		$("#PlayerList").append("<div id='"+(e+"label")+"'  class='playerlabel'>"+e+"</div>");
		$("#"+e+"label").attr("playerid","player-"+e);
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
	this.SceneDestroy = function()
	{
        
		$('#MenuLogIn').removeAttr('disabled');
		$('#MenuLogOut').attr('disabled','disabled');
	    var parms = new Array();
		parms.push(document[document.PlayerNumber +'link'].id);
		//alert(JSON.stringify(parms));
		vwf_view.kernel.callMethod('index-vwf','deleteplayer',parms);
		 parms = new Array();
		parms.push(JSON.stringify({sender:'*System*',text:(document.PlayerNumber + " logging off")}));
		
		vwf_view.kernel.callMethod('index-vwf','receiveChat',parms);
		document[document.PlayerNumber +'link'] = null;
		document.PlayerNumber = null;
		
	}
	this.showCreateProfile = function()
	{
		$('#CreateProfileDialog').dialog('open');
	}
	this.showLogin = function()
	{
		$('#Logon').dialog('open');
		$('#profilenames').empty();
		$('#profilenames').append('<option value="New Profile">New Profile...</option>');
		
		for(var i in _DataManager.rawdata.profiles)
		{
			var profile = _DataManager.rawdata.profiles[i];
			$('#profilenames').append('<option value="'+profile.Username+'">'+profile.Username+'</option>');
		}
	}
    $(window).unload(function(){this.SceneDestroy();}.bind(this));
	$('#Players').dialog({ position:['left','bottom'],width:300,height:200,title: "Players",autoOpen:false});
	$('#Logon').dialog({autoOpen:false,title:'Select Profile',modal:true,buttons:{"Log In":function(){ 
		if($('#profilenames').val() == "New Profile") 
			_UserManager.showCreateProfile(); 
		else 
			_UserManager.Login(_DataManager.GetProfileForUser($('#profilenames').val()));
	},
	"Cancel" : function(){
		$('#Logon').dialog('close');
	}}});
	$('#EditProfileDialog').dialog({autoOpen:false,title:'Create New Profile',modal:true,buttons:{"Save":function(){ 	
			
			var newprofile = {};
			
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
			_DataManager.saveProfile(newprofile);
			$('#CreateProfileDialog').dialog('close');
			_UserManager.Login(_DataManager.GetProfileForUser(newprofile.Username));
	},
	"Cancel" : function()
	{
		$('#CreateProfileDialog').dialog('close');
	}
	}});
	
}
_UserManager = new UserManager();