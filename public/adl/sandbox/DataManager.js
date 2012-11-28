function DataManager()
{
	
	//if(localStorage) throw "No localStorage available";
	this.datahandle = "LOCALHOST:VWFTEST";
	//this.stringdata = localStorage[this.datahandle];
	this.currentSceneName = "";
	//if(this.stringdata)
	//	this.rawdata = JSON.parse(this.stringdata);
	//if(!this.rawdata)
		this.rawdata = {scenes:{},profiles:{},inventory:{}};
	this.loadedScene = null;	
	this.DeleteIDs = function(t)
	{
		
		if(t.id != undefined)
			delete t.id;
		if(t.children)
		{	
			var children = []
			for(var i in t.children)
			{
				this.DeleteIDs(t.children[i]);
				children.push(t.children[i]);
				delete t.children[i];
			}
			for(var i = 0; i < children.length; i++)
			{
				t.children[GUID()]=children[i];
			}
		}
		return t;
	}
	this.GetUsers = function()
	{
			var data = jQuery.ajax({
				type: 'GET',
				url: 'http://10.100.21.71/vwfDataManager.svc/Profiles',
				data: null,
				success: null,
				async:false,
				dataType: "json"
			});
			data = JSON.parse(JSON.parse(data.responseText).GetProfilesResult);
			return data;
	}
	this.GetProfileForUser = function(username)
	{
		var profile = null;
		for(var i in this.rawdata.profiles)
		{
			if(this.rawdata.profiles[i].Username == username)
				profile = this.rawdata.profiles[i];
		}
		if(!profile)
		{
		
			var UID  = this.getCurrentSession();
			var data = jQuery.ajax({
				type: 'GET',
				url: 'http://10.100.21.71/vwfDataManager.svc/Profile?UID=' + username,
				data: null,
				success: null,
				async:false,
				dataType: "json"
			});
		
			try{
				data = JSON.parse(JSON.parse(data.responseText).GetProfileResult);
				profile = data;
				this.rawdata.inventory[username] = profile.inventory;
				delete profile.inventory;
				this.rawdata.profiles.push(profile);
			}catch(e)
			{
			}
		    
		}
		return profile;
	}
	this.saveProfile = function(profile)
	{
		this.rawdata.profiles[profile.Username] = profile;
		profile.inventory = this.getInventory(profile.Username);
		$.post("http://10.100.21.71/VWFDataManager.svc/Profile?UID="+profile.Username, JSON.stringify(profile),function(){});
		this.saveData();
	}
	this.getInventory = function(name)
	{
		for(var i in this.rawdata.inventory)
		{
			if(i == name)
				return this.rawdata.inventory[i];
		}
		return null;
	}
	this.addInventoryItem = function(owner,data,name,type)
	{
	    var inventory = this.getInventory(owner);
		if(!inventory)
		   this.rawdata.inventory[owner] = {objects:{},scripts:{}}
		inventory = this.getInventory(owner);
		if(type == 'script')
			inventory.scripts[name] = data;
		if(type == 'object')
			inventory.objects[name] = data;
		this.saveProfile(this.GetProfileForUser(owner));			
	}
	this.renameInventoryItem = function(owner,oldname,newname,type)
	{	
		if(oldname == newname) return;
		var inventory = this.getInventory(owner);
		if(!inventory) return;
		if(type == 'script')
		{	
			inventory.scripts[newname] = inventory.scripts[oldname];
			delete inventory.scripts[oldname];
		}
		if(type == 'object')
		{	
			inventory.objects[newname] = inventory.objects[oldname];
			delete inventory.objects[oldname];
		}
		this.saveProfile(this.GetProfileForUser(owner));			
	}
	this.deleteInventoryItem = function(owner,item)
	{
		
		var inventory = this.getInventory(owner);
		if(!inventory) return;
		for(var i in inventory.scripts)
		{
			if(inventory.scripts[i] == item)
			{
				delete inventory.scripts[i];
				break;
			}
		}
		for(var i in inventory.objects)
		{
			if(inventory.objects[i] == item)
			{
				delete inventory.objects[i];
				break;
			}
		}
		this.saveProfile(this.GetProfileForUser(owner));			
	}
	this.captureScene = function(name)
	{
			var scene = vwf.getNode('index-vwf');
		    var nodes = [];
			for( var i in scene.children)
			{
					var stringd = JSON.stringify(scene.children[i].id);
					var destring = JSON.parse(stringd);
					this.DeleteIDs(destring);
					nodes.push(destring);
			}
			
			this.addScene(name,nodes);
	}
	this.fixExtends = function(object)
	{
		if(object.extends.patches)
			  object.extends = object.extends.patches;
		if(object.children)
		{
			for(var i in object.children)
			{
				object.children[i] = this.fixExtends(object.children[i]);
			}
		}
		return object;	
	}
	this.GetNode = function(id)
	{
		var node = vwf.getNode(id);
		if(node.children)
		{
			for(var i =0; i < node.children.length; i++)
			{
				node.children[i] = this.GetNode(node.children[i].id);
			}
		}
		return node;
	}
	this.compareNode = function(node1, node2)
	{
	
	}
	//return false if a node has been deleted that did not belong to the logged in user
	this.checkForViolations = function(nodes)
	{
		//does not currently check for delete of modifiers
		var original = this.loadedScene;
		for(var i = 0; i < original.length; i++)
		{
			var oNode = original[i];
			var nNode = null;
			for(var j = 0; j < nodes.length; j++)
			{
				if(nodes[j].id == oNode.id)
				{
					nNode = nodes[j].id;
				}
			}
			if(!nNode)
			{
				//node has been removed;
				if(oNode.properties.owner != _UserManager.GetCurrentUserName() && node.extends != "character.vwf" && node.extends != 'http://vwf.example.com/camera.vwf')
					return false;
			
			}
			
		}
		return true;
	}
	this.getCleanNodePrototype = function(id)
	{
		return this.DeleteIDs(this.fixExtends(this.GetNode(id)));
	}
	this.saveToServer = function()
	{
		if(!_UserManager.GetCurrentUserName())
		{
			console.log('no user logged in, so not saving');
			return;
		}
		
			var scene = vwf.getNode('index-vwf');
		    var nodes = [];
			for( var i in scene.children)
			{
				var node = this.getCleanNodePrototype(scene.children[i].id);
				if(node.extends != "character.vwf" && node.extends != 'http://vwf.example.com/camera.vwf')
					nodes.push(node);
				if(node.extends == "character.vwf" && node.properties.ownerClientID == null)
					nodes.push(node);
			}
		
		//this does not make sense. someone else in the space could delete their own node.		
		// if(!_DataManager.checkForViolations(nodes))
		// {
			// alert('Something must have gone wrong. A node is missing that you did not own. Save canceled.')
			// return;
		// }		
		var UID  = this.getCurrentSession();
		if(nodes.length > 0)
		jQuery.ajax({
			type: 'POST',
			url: 'http://10.100.21.71/vwfDataManager.svc/State?UID=' + UID,
			data: JSON.stringify(nodes),
			success: null,
			async:false,
			dataType: "json"
		});
		this.loadedScene = nodes;
	}
	this.save = function()
	{
		if(this.currentSceneName != "")
		{
			this.captureScene(this.currentSceneName);
		}
		else
		{
			this.saveAs();
		}
	}
	this.saveAs = function()
	{
		if($('#SaveDialog').length == 0)
		{
			$(document.body).append('<div id="SaveDialog" style="overflow:hidden"/>');
			$('#SaveDialog').append('<input type="text" style="border-radius:10px;width:95%" id="SaveDialogName" />');
			$('#SaveDialog').dialog({
				title:'Save As',
				autoOpen:true,
				modal:true,
				buttons:{
					cancel:function(){
						$('#SaveDialog').dialog('close');
					},
					save:function(){
						_DataManager.captureScene($('#SaveDialogName').val());
						$('#SaveDialog').dialog('close');
					}
				}
			});
		}else
		{
			$('#SaveDialog').dialog('open');
		}
		$('#SaveDialogName').val(this.currentSceneName);
	}
	this.load = function()
	{
		if($('#LoadDialog').length == 0)
		{
			
			$(document.body).append('<div id="LoadDialog" style="overflow:auto;overflow: auto;min-height: 61.40000009536743px;height: auto;box-shadow: -3px -3px 18px gray inset;width: 91%;border-radius: 10px;"/>');
			""
			$('#LoadDialog').append('<div style="border-radius:10px;width:95%;" id="LoadDialogList" />');
			for(var i in this.rawdata.scenes)
			{
				
				$('#LoadDialogList').append('<div class="loadchoice" id="LoadDialog'+i+'" >'+i+'</div>');
				$('#LoadDialog'+i).attr('scenename',i);
				$('#LoadDialog'+i).click(function(){
					$(".loadchoice").css('font-weight','normal');
					$(".loadchoice").removeAttr('selected')
					$(this).attr('selected','selected');
					$(this).css('font-weight','bold');
				});
			}
			$('#LoadDialog').dialog({
				title:'Load',
				autoOpen:true,
				modal:true,
				buttons:{
					cancel:function(){
						$('#LoadDialog').dialog('close');
					},
					load:function(){
						var name = $("#LoadDialogList .loadchoice[selected=selected]").attr('scenename');
						_DataManager.loadScene(name);
						$('#LoadDialog').dialog('close');
					}
				}
			});
		}else
		{
			$('#LoadDialog').dialog('open');
		}
		
	}
	this.getInstances = function()
	{
		var data = jQuery.ajax({
			type: 'GET',
			url: 'http://10.100.21.71/vwfDataManager.svc/States',
			data: null,
			success: null,
			async:false,
			dataType: "json"
		});
		data = JSON.parse(JSON.parse(data.responseText).GetStatesResult);
		return data;
	}
	this.switchInstance = function(instance)
	{
		window.location = this.getCurrentApplication() + "/" + instance +"/";
	}
	this.chooseInstance = function()
	{
		$('#InstanceDialog').remove();
		if($('#InstanceDialog').length == 0)
		{
			
			$(document.body).append('<div id="InstanceDialog" style="overflow:auto;overflow: auto;min-height: 61.40000009536743px;height: auto;box-shadow: -3px -3px 18px gray inset;width: 91%;border-radius: 10px;"/>');
			$('#InstanceDialog').append('<div style="border-radius:10px;width:95%;" id="InstanceDialogList" />');
			var instances = this.getInstances();
			for(var j =0; j<instances.length;j++)
			{
				var i = instances[j];
				$('#InstanceDialogList').append('<div class="loadchoice" id="InstanceDialog'+i+'" >'+i+'</div>');
				$('#InstanceDialog'+i).attr('instancename',i);
				$('#InstanceDialog'+i).click(function(){
					$(".loadchoice").css('font-weight','normal');
					$(".loadchoice").removeAttr('selected')
					$(this).attr('selected','selected');
					$(this).css('font-weight','bold');
				});
			}
			$('#InstanceDialog').dialog({
				title:'Switch to instance',
				autoOpen:true,
				modal:true,
				buttons:{
					cancel:function(){
						$('#InstanceDialog').dialog('close');
					},
					load:function(){
						
						var name = $("#InstanceDialogList .loadchoice[selected=selected]").attr('instancename');
						_DataManager.switchInstance(name);
						$('#InstanceDialog').dialog('close');
					}
				}
			});
		}else
		{
			$('#InstanceDialog').dialog('open');
		}
		
	}
	this.getCurrentSession = function()
	{
	   var reg = /\w*?(?=\/#*$)/;
	   
	   
	   return reg.exec(window.location.pathname)[0];
	}
	this.getCurrentApplication = function()
	{
	   var reg = /^.*(?=\/\w*?\/)/;
	   return reg.exec(window.location.href)[0];
	}
	this.getClientCount = function()
	{
		
		var instances = jQuery.ajax({
			type: 'GET',
			url: this.getCurrentApplication()+"/"+this.getCurrentSession() + "/admin/instances",
			data: null,
			success: null,
			async:false,
			dataType: "json"
		});

		instances = JSON.parse(instances.responseText);
		var clients = null;
		
		for( var i in instances)
		{
			if(i.substr(i.lastIndexOf('/')+1) == this.getCurrentSession())
			{
			    clients = instances[i].clients;
			}
			
		}
		var count = 0;
		for(var i in clients)
		 count++;
		
		return count;		
	}
	this.clearScene = function()
	{
			var scene = vwf.getNode('index-vwf');
		    var nodes = [];
			for( var i in scene.children)
			{
				if(scene.children[i].extends != 'character.vwf' && scene.children[i] .extends != "http://vwf.example.com/camera.vwf")
				{
					nodes.push(scene.children[i]);
				}
			}
			for(var i=0; i < nodes.length; nodes++)
			{
				vwf_view.kernel.deleteNode(i);
			}
	}
	this.loadScene  = function(num)
	{
		this.clearScene();
		for(var i =0; i<this.rawdata.scenes[num].length; i++)
		{
			vwf_view.kernel.createChild('index-vwf',GUID(),this.rawdata.scenes[num][i],null,null);
		}
		this.currentSceneName = name;
		$('#SceneName').html(name);
	}
	this.addScene = function(name,s)
	{
		this.rawdata.scenes[name] = s;
		this.saveData();
		this.currentSceneName = name;
		$('#SceneName').html(name);
	}
	this.loadFromServer = function()
	{
		
		var UID  = this.getCurrentSession();
		var data = jQuery.ajax({
			type: 'GET',
			url: 'http://10.100.21.71/vwfDataManager.svc/State?UID=' + UID,
			data: null,
			success: null,
			async:false,
			dataType: "json"
		});
		
		try{
			data = JSON.parse(JSON.parse(data.responseText).GetStateResult);
		}catch(e)
		{
			data = [];
		}
		this.loadedScene = data;
		this.rawdata.scenes[UID] = data;
		this.loadScene(UID);
	}
	this.saveTimer = function()
	{
		var num = this.getClientCount();
		var milliseconds = num * 1000 * 60;
		this.saveToServer();
		window.setTimeout(this.saveTimer.bind(this),milliseconds);
	}
	this.saveData = function()
	{
		localStorage[this.datahandle] = JSON.stringify(this.rawdata);
	}
}
_DataManager = new DataManager();