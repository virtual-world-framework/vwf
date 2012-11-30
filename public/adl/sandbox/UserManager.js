//jquery combobox
/***************************************************
 Native Combo Box
 by Peter of the Norse <RahmCoff@Radio1190.org>
 2009-05-06

 What is a combo box? It's a text box with a menu of
 selections. Useful when any value is possible, but
 few are common. 
 
 It takes one required argument, either something that
 translates to a <select> element, or an array that it
 turns into a <select> element.
 
 example:
 $('[name=salutation]').combobox(['Mr.', 'Ms.', 'Dr.']);

 Issues:
 Looks like crap when input boxes or pop-up menus are 
 styled. There are other comboboxes for that.

 I know it uses the deprecated jQuery.browser methods,
 but there are important differnences between how
 browsers render. I wish there was a better way to find
 out which engine/OS/version we're on.
***************************************************/

jQuery.fn.combobox = function(select){
  //Build a select element
  if (select.constructor == Array) {
    var sel = jQuery('<select>');
    for (var key in select) {
      sel.append(jQuery('<option>').text(select[key]));
    }
  } else {
    var sel = jQuery(select);
    if (sel.length != 1) return;
  }
  
  sel.change(function() {
    var sel = jQuery(this);
	
    sel.prev().val(sel.val());
	sel.prev().change();
    sel.prev().select();
    sel.prev().attr('pop_up_selection', sel.attr('selectedIndex'));
    sel.attr('selectedIndex', -1);
  })
  sel.attr('tabindex', -2); //Don't get tabbed to

  
  this.each(function(i){
    var input = $(this);
    if (input.width() < 2) return; // Either type=hidden or not in the render
    if (i>0) var menu = sel.clone(true); 
    else var menu = sel; //don't leave an extra lying around
    
    input.wrap(jQuery('<span></span>').css('position', 'relative'));
    

    input.css('margin-right', '16px');
    input.keydown(function(event) { 
      var input = $(this);
      if (event.keyCode == 40) {
        input.next().attr('selectedIndex', input.attr('pop_up_selection')-0+1);
	if (input.next().attr('selectedIndex') != -1) input.next().change();
        return false;
      }
      if (event.keyCode == 38) {
        input.next().attr('selectedIndex', input.attr('pop_up_selection')-1);
	if (input.next().attr('selectedIndex') != -1) input.next().change();
        return false;
      }
    });
    var width = input.width() - 0;
    var style;
    
    //Might have to be updated depending on the version or OS.
    //Let me know when jQuery adds support for OS.
    if (jQuery.browser.msie) {
      style = {clip: 'rect(0 '+(width+22)+'px 30px '+(width+5)+'px)',
        position: 'absolute',
        left: 0,
        top: '1px',
        width: (width+22)+'px',
		height:'26px'};
    } else if (jQuery.browser.opera) {
      width = input.parent().width();
      style = {clip: 'rect(0 '+(width+2)+'px 30px '+(width-15)+'px)',
        position: 'absolute',
        left: 0,
        top: '1px',
        width: (width+2)+'px',
		height:'26px'};

    } else if (jQuery.browser.safari) {
      style = {clip: 'rect(0px, '+(width+18)+'px, 30px, '+(width+2)+'px)',
        position: 'absolute',
        right: '0',
        width: (width+18)+'px',
		height:'26px'};
    } else { // Mozilla
      style = {clip: 'rect(0px, '+(width+22)+'px, 30px, '+(width+4)+'px)',
        position: 'absolute',
        right: '0',
        width: (width+22)+'px',
        top:'0',
		height:'26px'};
    }
    
    menu.css(style);
    input.after(menu);
    menu.attr('selectedIndex', -1);
  });
  
  return this;
};

function UserManager()
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
	$('#userprofiletitle').prepend('<img class="headericon" src="images/icons/user.png" />');
	
	$("#UserProfileWindow").append("<div id='FollowUser'></div>");
	$("#UserProfileWindow").append("<div id='PrivateMessage'></div>");
	$("#UserProfileWindow").append("<div id='EditProfile'></div>");
	$("#userprofileclose").click(function(){
		$("#UserProfileWindow").hide('blind',function(){if(!$('#sidepanel').children().is(':visible'))
				hideSidePanel();});
	});
	$(document.body).append('<div id="Logon">'+
	'	<form id="loginForm">'+
	'      <input type="text" id="profilenames" style="font-size: 1.6em;width: 90%;height: 22px;padding: 0px;margin-right: 16px;border-radius: 3px;" pop_up_selection="0"> </input>'+
	'      <input type="password" placeholder="password" id="password" style="font-size: 1.6em;width:90%;padding:0px;border-radius: 3px;" pop_up_selection="0"> </input>'+
	//'			<input type="text" name="name" id="name" onKeyPress="return disableEnterKey(event)" class="text ui-widget-content ui-corner-all" />'+
	//'			<div id="AvatarChoice">'+
	//'				<input type="radio" id="radio1" name="radio" value="usmale.dae" checked="checked" /><label for="radio1">Human</label>'+
	//'				<input type="radio" id="radio2" name="radio" value="mech.dae" /><label for="radio2">Robot</label>'+
	//'			</div>'+
	'	</form>'+
	'<div style="margin-top: 2em;color: grey;font-size: 0.8em;">Please note that this login system is not indended to be secure in any way. This is only a demonstration system. Your profile, inventory, and access to any objects you create are easily available to anyone with malicious intent. We never store your password, so this information is safe, but please consider this warning when creating content. If you would like to export a permanant copy of your work for archival purposes, please contact the site administrators. Content, profiles, and inventories are subject to deletion and removal at any time. </div>'+
	'</div>');
		$('#password').hide();
	$('#profilenames').change(function()
	{
		if($('#profilenames').val() == 'New Profile...')
		{
			$('#Logon').parent().children().last().children().first().children().first().children().first().html('Create Profile');
			$('#password').hide();
		
		}else
		{
			$('#Logon').parent().children().last().children().first().children().first().children().first().html('Log in');
			$('#password').show();
		}
		
	});
	
	$('#sidepanel').append('<div id="Players"  class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active" style="width: 100%;margin:0px;padding:0px">'+
	"<div id='playerstitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Players</span></div>"+
	'	 <div id="PlayerList"></div>'+
	'</div>');
	
	$('#playerstitle').append('<a id="playersclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
		$('#playersclose').click(function()
		{
			$('#Players').hide('blind',function(){if(!$('#sidepanel').children().is(':visible'))
				hideSidePanel();});
		});
	$('#playerstitle').prepend('<img class="headericon" src="images/icons/users.png" />');	
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
	$("#CreateUserProfiletable").append("<tr><td><div>Avatar</div></td><td style='width: auto;max-width: 100%;'><select style='border-radius: 10px;width: auto;' type='text' id='SetProfileAvatar'>"+
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
	    $('#MenuLogInicon').css('background',"#555555");
		$('#MenuLogOuticon').css('background',"");
        $('#MenuLogIn').attr('disabled','disabled');
		$('#MenuLogOut').removeAttr('disabled');
		this.PlayerProto.source= profile['Avatar'];
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
		
		
		vwf_view.kernel.callMethod('index-vwf','newplayer',parms);
		
		this.currentUsername = profile.Username;
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
        $('#MenuLogOuticon').css('background',"#555555");
		$('#MenuLogInicon').css('background',"");
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
		if($('#profilenames').next().get(0) && $('#profilenames').next().get(0).type == "select-one")
		{
			$('#profilenames').next().remove();
		}
		$('#profilenames').val('New Profile...');
		var users = _DataManager.GetUsers();
		users = ['New Profile...'].concat(users);
		$('#profilenames').combobox(users);
		//for(var i in _DataManager.rawdata.profiles)
		//{
		//	var profile = _DataManager.rawdata.profiles[i];
		//	$('#profilenames').append('<option value="'+profile.Username+'">'+profile.Username+'</option>');
		//}
	}
    $(window).unload(function(){this.SceneDestroy();}.bind(this));
	//$('#Players').dialog({ position:['left','bottom'],width:300,height:200,title: "Players",autoOpen:false});
	$('#Logon').dialog({autoOpen:false,title:'Select Profile',modal:true,buttons:{"Create Profile":function(){ 
		if($('#profilenames').val() == "New Profile...") 
			_UserManager.showCreateProfile(); 
		else
		{
			var profile = _DataManager.GetProfileForUser($('#profilenames').val());
			if(!profile)
			{
				alert('There is no account with that username');
				return;
			}
			
			if(profile.Password != CryptoJS.SHA256($('#password').val()) + '')
			{
				alert('The password is incorrect.');
				return;
			}
			_UserManager.Login(_DataManager.GetProfileForUser($('#profilenames').val()));
		}
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
			newprofile.Password = CryptoJS.SHA256(newprofile.Password) + '';
			
			newprofile['Avatar'] = $('#SetProfileAvatar').val();
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
$('#UserProfileWindow').hide();
$('#Players').hide();