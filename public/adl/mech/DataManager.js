function DataManager()
{
	
	//if(localStorage) throw "No localStorage available";
	this.datahandle = "LOCALHOST:VWFTEST";
	this.stringdata = localStorage[this.datahandle];
	this.currentSceneName = "";
	if(this.stringdata)
		this.rawdata = JSON.parse(this.stringdata);
	if(!this.rawdata)
		this.rawdata = {scenes:{},profiles:{},inventory:{}};
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
	}
	this.GetProfileForUser = function(username)
	{
		for(var i in this.rawdata.profiles)
		{
			if(this.rawdata.profiles[i].Username == username)
				return this.rawdata.profiles[i];
		}
		return null;
	}
	this.saveProfile = function(profile)
	{
		this.rawdata.profiles[profile.Username] = profile;
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
		this.saveData();			
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
		this.saveData();	
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
		this.saveData();
	}
	this.captureScene = function(name)
	{
			var scene = vwf.getNode('index-vwf');
		    var nodes = [];
			for( var i in scene.children)
			{
				if(scene.children[i].extends != 'character.vwf' && scene.children[i] .extends != "http://vwf.example.com/camera.vwf")
				{
					var stringd = JSON.stringify(scene.children[i]);
					var destring = JSON.parse(stringd);
					this.DeleteIDs(destring);
					nodes.push(destring);
				}
			}
			
			this.addScene(name,nodes);
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
						var name = $(".loadchoice[selected=selected]").attr('scenename');
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
	this.saveData = function()
	{
		localStorage[this.datahandle] = JSON.stringify(this.rawdata);
	}
}
_DataManager = new DataManager();