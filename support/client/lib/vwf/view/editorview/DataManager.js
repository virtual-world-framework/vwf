//////////////////////////////
//The datamanager class fetches and posts data to the 
//sandbox API.
window.PersistanceServer = '';
define(function ()
{
	var DataManager = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(DataManager);
				isInitialized = true;
			}
			return DataManager;
		}
	}

	function initialize()
	{
		//if(localStorage) throw "No localStorage available";
		this.datahandle = "LOCALHOST:VWFTEST";
		//this.stringdata = localStorage[this.datahandle];
		this.currentSceneName = "";
		//if(this.stringdata)
		//	this.rawdata = JSON.parse(this.stringdata);
		//if(!this.rawdata)
		this.rawdata = {
			scenes: {},
			profiles: {},
			inventory: {}
		};
		$(document.body).append("<div id='NewInstanceDialog'><input type='text' id='NewInstanceName' style='width: 90%;border-radius: 6px;font-size: 1.6em;'/><div style='margin-top: 2em;color: grey;font-size: 0.8em;'>The name of the instance must be a 16 letter word with no spaces and only alphanumeric characters. The string you enter above will be modified to enforce these rules.</div></div>");
		$(document.body).append("<div id='CloneInstanceDialog'><input type='text' id='CloneInstanceName' style='width: 90%;border-radius: 6px;font-size: 1.6em;'/><div style='margin-top: 2em;color: grey;font-size: 0.8em;'>The name of the instance must be a 16 letter word with no spaces and only alphanumeric characters. The string you enter above will be modified to enforce these rules.</div></div>");
		$(document.body).append("<div id='DeleteInstanceDialog'><div style='margin-top: 2em;color: grey;font-size: 0.8em;'>You must be the owner of an instance to delete it. This world will cease to exist, and the page will load a blank, unsaved world under this name. Simply navigate away after the reload if you do not wish to build in this world again.</div></div>");
		$('#NewInstanceName').keydown(function (e)
		{
			e.stopPropagation();
		});
		$('#NewInstanceDialog').dialog(
		{
			title: "New Instance",
			modal: true,
			autoOpen: false,
			buttons: {
				Create: function ()
				{
					$('#NewInstanceDialog').dialog('close');
					window.location = _DataManager.getCurrentApplication() + "/" + _DataManager.CleanInstanceName($('#NewInstanceName').val());
				},
				Cancel: function ()
				{
					$('#NewInstanceDialog').dialog('close');
				}
			}
		});
		$('#CloneInstanceDialog').dialog(
		{
			title: "Clone Instance",
			modal: true,
			autoOpen: false,
			buttons: {
				Clone: function ()
				{
					$('#CloneInstanceDialog').dialog('close');
					var name = _DataManager.CleanInstanceName($('#CloneInstanceName').val());
					name = window.location.pathname.replace(/\//g, '_').replace(/_[a-zA-Z0-9]*?_$/, '') + '_' + name + '_';
					_DataManager.saveToServer();
					$.ajax(
					{
						url: '/vwfDataManager.svc/clonestate?SID2=' + name,
						success: function ()
						{
							window.onbeforeunload = '';
							window.onunload = '';
							window.location.pathname = name.replace(/_/g, '/');
						},
						error: function (e)
						{
							_Notifier.alert(e.responseText);
						}
					});
				},
				Cancel: function ()
				{
					$('#CloneInstanceDialog').dialog('close');
				}
			}
		});
		$('#DeleteInstanceDialog').dialog(
		{
			title: "Delete Instance",
			modal: true,
			autoOpen: false,
			buttons: {
				Delete: function ()
				{
					$('#DeleteInstanceDialog').dialog('close');
					_DataManager.DeleteInstance_internal();
				},
				Cancel: function ()
				{
					$('#DeleteInstanceDialog').dialog('close');
				}
			}
		});
		this.loadedScene = null;
		this.CleanInstanceName = function (name)
		{
			while (name.length < 16) name = name + '0';
			if (name.length > 16);
			name = name.substr(0, 16);
			name = name.replace(/[^0-9a-zA-Z]/g, '0');
			return name;
		}
		this.DeleteIDs = function (t)
		{
			if (t.id != undefined) delete t.id;
			if (t.name != undefined) delete t.name;
			if (t.children)
			{
				var children = []
				for (var i in t.children)
				{
					this.DeleteIDs(t.children[i]);
					children.push(t.children[i]);
					delete t.children[i];
				}
				for (var i = 0; i < children.length; i++)
				{
					t.children[GUID()] = children[i];
				}
			}
			return t;
		}
		this.GetUsers = function ()
		{
			var data = jQuery.ajax(
			{
				type: 'GET',
				url: PersistanceServer + '/vwfDataManager.svc/Profiles',
				data: null,
				success: null,
				async: false,
				dataType: "json"
			});
			data = JSON.parse(JSON.parse(data.responseText).GetProfilesResult);
			return data;
		}
		this.getCurrentUserName = function()
		{
				var data = jQuery.ajax(
				{
					type: 'GET',
					url: PersistanceServer + '/vwfDataManager.svc/logindata',
					//url: PersistanceServer + '/vwfDataManager.svc/Profile?UID=' + username + "&P=" + password,
					data: null,
					success: null,
					async: false,
					dataType: "json"
				});
				return JSON.parse(data.responseText).username;
		}
		this.GetProfileForUser = function (username, password, reload)
		{
			var profile = null;
			for (var i in this.rawdata.profiles)
			{
				if (this.rawdata.profiles[i].Username == username) profile = this.rawdata.profiles[i];
			}
			if (!profile || reload)
			{
				var UID = this.getCurrentSession();
				var data = jQuery.ajax(
				{
					type: 'GET',
					url: PersistanceServer + '/vwfDataManager.svc/Profile',
					//url: PersistanceServer + '/vwfDataManager.svc/Profile?UID=' + username + "&P=" + password,
					data: null,
					success: null,
					async: false,
					dataType: "json"
				});
				if (data.status == 200)
				{
					try
					{
						data = JSON.parse(JSON.parse(data.responseText).GetProfileResult);
						profile = data;
						this.rawdata.inventory[username] = profile.inventory;
						if (profile.inventory) delete profile.inventory;
						this.rawdata.profiles[username] = profile;
					}
					catch (e)
					{
						return data.responseText;
					}
				}
				else
				{
					return data.responseText;
				}
			}
			return profile;
		}
		this.saveProfile = function (profile)
		{
			this.rawdata.profiles[profile.Username] = profile;
			profile.inventory = this.getInventory(profile.Username);
			$.post(PersistanceServer + "/VWFDataManager.svc/Profile?UID=" + profile.Username + "&P=" + profile.Password, JSON.stringify(profile), function ()
			{});
			this.saveData();
		}
		this.getInventory = function (name)
		{
			for (var i in this.rawdata.inventory)
			{
				if (i == name) return this.rawdata.inventory[i];
			}
			return null;
		}
		this.addInventoryItem = function (owner, data, name, type)
		{
			var inventory = this.getInventory(owner);
			if (!inventory) this.rawdata.inventory[owner] = {
					objects: {},
					scripts: {}
			}
			inventory = this.getInventory(owner);
			if (type == 'script') inventory.scripts[name] = data;
			if (type == 'object') inventory.objects[name] = data;
			this.saveProfile(this.GetProfileForUser(owner));
		}
		this.renameInventoryItem = function (owner, oldname, newname, type)
		{
			if (oldname == newname) return;
			var inventory = this.getInventory(owner);
			if (!inventory) return;
			if (type == 'script')
			{
				inventory.scripts[newname] = inventory.scripts[oldname];
				delete inventory.scripts[oldname];
			}
			if (type == 'object')
			{
				inventory.objects[newname] = inventory.objects[oldname];
				delete inventory.objects[oldname];
			}
			this.saveProfile(this.GetProfileForUser(owner));
		}
		this.deleteInventoryItem = function (owner, item)
		{
			var inventory = this.getInventory(owner);
			if (!inventory) return;
			for (var i in inventory.scripts)
			{
				if (inventory.scripts[i] == item)
				{
					delete inventory.scripts[i];
					break;
				}
			}
			for (var i in inventory.objects)
			{
				if (inventory.objects[i] == item)
				{
					delete inventory.objects[i];
					break;
				}
			}
			this.saveProfile(this.GetProfileForUser(owner));
		}
		this.captureScene = function (name)
		{
			var scene = vwf.getNode('index-vwf');
			var nodes = [];
			for (var i in scene.children)
			{
				var stringd = JSON.stringify(scene.children[i].id);
				var destring = JSON.parse(stringd);
				this.DeleteIDs(destring);
				nodes.push(destring);
			}
			this.addScene(name, nodes);
		}
		this.fixExtendsAndArrays = function (object)
		{
			if (object.extends.patches) object.extends = object.extends.patches;
			for (var i in object.properties)
			{
				if (object.properties[i] && object.properties[i].constructor == Float32Array)
				{
					var newval = [];
					for (var j = 0; j < object.properties[i].length; j++) newval.push(object.properties[i][j]);
					object.properties[i] = newval;
				}
				if (i == 'quaternion')
				{
					object.properties[i] = [object.properties[i][0], object.properties[i][1], object.properties[i][2], object.properties[i][3]];
				}
			}
			if (object.children)
			{
				for (var i in object.children)
				{
					object.children[i] = this.fixExtendsAndArrays(object.children[i]);
				}
			}
			return object;
		}
		this.GetNode = function (id)
		{
			var node = vwf.getNode(id);
			if (node.properties)
			{
				for (var i in node.properties)
				{
					node.properties[i] = vwf.getProperty(id, i);
				}
			}
			if (node.children)
			{
				for (var i in node.children)
				{
					node.children[i] = this.GetNode(node.children[i].id);
				}
			}
			return node;
		}
		this.compareNode = function (node1, node2)
		{}
		//return false if a node has been deleted that did not belong to the logged in user
		this.checkForViolations = function (nodes)
		{
			//does not currently check for delete of modifiers
			var original = this.loadedScene;
			for (var i = 0; i < original.length; i++)
			{
				var oNode = original[i];
				var nNode = null;
				for (var j = 0; j < nodes.length; j++)
				{
					if (nodes[j].id == oNode.id)
					{
						nNode = nodes[j].id;
					}
				}
				if (!nNode)
				{
					//node has been removed;
					if (oNode.properties.owner != _UserManager.GetCurrentUserName() && node.extends != "character.vwf" && node.extends != 'http://vwf.example.com/camera.vwf') return false;
				}
			}
			return true;
		}
		this.getCleanNodePrototype = function (id)
		{
			if (typeof id === "string") return this.DeleteIDs(this.fixExtendsAndArrays(this.GetNode(id)));
			else return this.DeleteIDs(this.fixExtendsAndArrays(id));
		}
		this.saveToServer = function ()
		{
			if (!_UserManager.GetCurrentUserName())
			{
				console.log('no user logged in, so not saving');
				return;
			}
			var scene = vwf.getNode('index-vwf');
			var nodes = [];
			for (var i in scene.children)
			{
				var node = this.getCleanNodePrototype(scene.children[i].id);
				if (node.extends != "character.vwf" && node.extends != 'http://vwf.example.com/camera.vwf') nodes.push(node);
				if (node.extends == "character.vwf" && node.properties.ownerClientID == null) nodes.push(node);
			}
			//this does not make sense. someone else in the space could delete their own node.		
			// if(!_DataManager.checkForViolations(nodes))
			// {
			// alert('Something must have gone wrong. A node is missing that you did not own. Save canceled.')
			// return;
			// }	
			nodes.push(vwf.getProperties('index-vwf'));
			var SID = this.getCurrentSession();
			var UID = _UserManager.GetCurrentUserName();
			if (!UID) return;
			var P = _DataManager.GetProfileForUser(_UserManager.GetCurrentUserName()).Password;
			if (nodes.length > 0) var ret = jQuery.ajax(
				{
					type: 'POST',
					url: PersistanceServer + '/vwfDataManager.svc/state?SID=' + _DataManager.getCurrentSession(),
					data: JSON.stringify(nodes),
					success: null,
					async: false,
					dataType: "json"
				});
			if (ret.status != 200)
			{
				alert('Save failed! Reloading');
				window.onunload = function (e)
				{};
				window.onbeforeunload = function (e)
				{};
				document.location.reload(true);
			}
			this.loadedScene = nodes;
		}
		this.save = function ()
		{
			if (this.currentSceneName != "")
			{
				this.captureScene(this.currentSceneName);
			}
			else
			{
				this.saveAs();
			}
		}
		this.saveAs = function ()
		{
			if ($('#SaveDialog').length == 0)
			{
				$(document.body).append('<div id="SaveDialog" style="overflow:hidden"/>');
				$('#SaveDialog').append('<input type="text" style="border-radius:10px;width:95%" id="SaveDialogName" />');
				$('#SaveDialog').dialog(
				{
					title: 'Save As',
					autoOpen: true,
					modal: true,
					buttons: {
						cancel: function ()
						{
							$('#SaveDialog').dialog('close');
						},
						save: function ()
						{
							_DataManager.captureScene($('#SaveDialogName').val());
							$('#SaveDialog').dialog('close');
						}
					}
				});
			}
			else
			{
				$('#SaveDialog').dialog('open');
			}
			$('#SaveDialogName').val(this.currentSceneName);
		}
		this.load = function ()
		{
			if ($('#LoadDialog').length == 0)
			{
				$(document.body).append('<div id="LoadDialog" style="overflow:auto;overflow: auto;min-height: 61.40000009536743px;height: auto;box-shadow: -3px -3px 18px gray inset;width: 91%;border-radius: 10px;"/>');
				""
				$('#LoadDialog').append('<div style="border-radius:10px;width:95%;" id="LoadDialogList" />');
				for (var i in this.rawdata.scenes)
				{
					$('#LoadDialogList').append('<div class="loadchoice" id="LoadDialog' + i + '" >' + i + '</div>');
					$('#LoadDialog' + i).attr('scenename', i);
					$('#LoadDialog' + i).click(function ()
					{
						$(".loadchoice").css('font-weight', 'normal');
						$(".loadchoice").removeAttr('selected')
						$(this).attr('selected', 'selected');
						$(this).css('font-weight', 'bold');
					});
				}
				$('#LoadDialog').dialog(
				{
					title: 'Load',
					autoOpen: true,
					modal: true,
					buttons: {
						cancel: function ()
						{
							$('#LoadDialog').dialog('close');
						},
						load: function ()
						{
							var name = $("#LoadDialogList .loadchoice[selected=selected]").attr('scenename');
							_DataManager.loadScene(name);
							$('#LoadDialog').dialog('close');
						}
					}
				});
			}
			else
			{
				$('#LoadDialog').dialog('open');
			}
		}
		this.getInstances = function ()
		{
			var data = jQuery.ajax(
			{
				type: 'GET',
				url: PersistanceServer + '/vwfDataManager.svc/States',
				data: null,
				success: null,
				async: false,
				dataType: "json"
			});
			data = JSON.parse(JSON.parse(data.responseText).GetStatesResult);
			//filter out the app name part of the state
			for (var i = 0; i < data.length; i++)
			{
				var parts = data[i].split('_');
				data[i] = parts[parts.length - 2];
			}
			return data;
		}
		this.switchInstance = function (instance)
		{
			window.location = this.getCurrentApplication() + "/" + instance + "/";
		}
		this.chooseInstance = function ()
		{
			$('#InstanceDialog').remove();
			if ($('#InstanceDialog').length == 0)
			{
				$(document.body).append('<div id="InstanceDialog" style="overflow:auto;overflow: auto;min-height: 61.40000009536743px;height: auto;box-shadow: -3px -3px 18px gray inset;width: 91%;border-radius: 10px;"/>');
				$('#InstanceDialog').append('<div style="border-radius:10px;width:95%;max-height: 215px;overflow-y: scroll;" id="InstanceDialogList" />');
				$('#InstanceDialog').append('<div style="margin-top: 2em;color: grey;font-size: 0.8em;">Each instance is separate world. While these worlds share the same server,they exist independantly. Worlds are saved frequently by the server to prevent data loss. Select an instance and click "Load" to switch to it. You will have to log in each time you join a new instance. </div>' + '</div>');
				var instances = this.getInstances();
				for (var j = 0; j < instances.length; j++)
				{
					var i = instances[j];
					$('#InstanceDialogList').append('<div class="loadchoice" id="InstanceDialog' + i + '" >' + i + '</div>');
					$('#InstanceDialog' + i).attr('instancename', i);
					$('#InstanceDialog' + i).click(function ()
					{
						$(".loadchoice").css('font-weight', 'normal');
						$(".loadchoice").removeAttr('selected')
						$(this).attr('selected', 'selected');
						$(this).css('font-weight', 'bold');
					});
				}
				$('#InstanceDialog').dialog(
				{
					title: 'Switch to instance',
					autoOpen: true,
					modal: true,
					buttons: {
						Cancel: function ()
						{
							$('#InstanceDialog').dialog('close');
						},
						Load: function ()
						{
							var name = $("#InstanceDialogList .loadchoice[selected=selected]").attr('instancename');
							_DataManager.switchInstance(name);
							$('#InstanceDialog').dialog('close');
						},
						"New Instance": function ()
						{
							$('#NewInstanceDialog').dialog('open');
						}
					}
				});
			}
			else
			{
				$('#InstanceDialog').dialog('open');
			}
		}
		this.getCurrentSession = function ()
		{
			var reg = /\w*?(?=\/#*$)/;
			return window.location.pathname;
			return reg.exec(window.location.pathname)[0];
		}
		this.getCurrentApplication = function ()
		{
			var reg = /^.*(?=\/\w*?\/)/;
			return reg.exec(window.location.href)[0];
		}
		this.getClientCount = function ()
		{
			var instances = jQuery.ajax(
			{
				type: 'GET',
				url: this.getCurrentApplication() + "/" + this.getCurrentSession() + "/admin/instances",
				data: null,
				success: null,
				async: false,
				dataType: "json"
			});
			instances = JSON.parse(instances.responseText);
			var clients = null;
			for (var i in instances)
			{
				if (i == window.location.pathname)
				{
					clients = instances[i].clients;
				}
			}
			var count = 0;
			for (var i in clients) count++;
			return count;
		}
		this.DeleteInstance = function ()
		{
			$('#DeleteInstanceDialog').dialog('open');
		}
		this.CloneInstance = function ()
		{
			$('#CloneInstanceDialog').dialog('open');
		}
		this.DeleteInstance_internal = function ()
		{
			var SID = this.getCurrentSession();
			var UID = _UserManager.GetCurrentUserName();
			var P = _DataManager.GetProfileForUser(_UserManager.GetCurrentUserName()).Password;
			var ret = $.ajax('/vwfDataManager.svc/state',
			{
				type: "DELETE",
				async: false
			});
			if (ret.status == 200)
			{
				window.onunload = function (e)
				{};
				window.onbeforeunload = function (e)
				{};
				document.location.reload(true);
			}
			else
			{
				_Notifier.alert(ret.responseText);
			}
		}
		this.clearScene = function ()
		{
			var scene = vwf.getNode('index-vwf');
			var nodes = [];
			for (var i in scene.children)
			{
				if (scene.children[i].extends != 'character.vwf' && scene.children[i].extends != "http://vwf.example.com/camera.vwf")
				{
					nodes.push(scene.children[i]);
				}
			}
			for (var i = 0; i < nodes.length; nodes++)
			{
				vwf_view.kernel.deleteNode(i);
			}
		}
		this.loadScene = function (num)
		{
			this.clearScene();
			for (var i = 0; i < this.rawdata.scenes[num].length - 1; i++)
			{
				var node = this.rawdata.scenes[num][i];
				var name = node.properties.DisplayName + i;
				vwf_view.kernel.kernel.createChild('index-vwf', name, node, null, null);
			}
			var props = this.rawdata.scenes[num][this.rawdata.scenes[num].length - 1]
			for (var i in props)
			{
				if (props[i] !== undefined && i != 'EditorData') vwf.setProperty('index-vwf', i, props[i])
			};
			this.currentSceneName = name;
			$('#SceneName').text(name);
			//push the scene up to the server. Should at this point be no other client, but the server needs to know about the state
			vwf.respond("", "stateLoaded", "", [],
			{});
		}
		this.addScene = function (name, s)
		{
			this.rawdata.scenes[name] = s;
			this.saveData();
			this.currentSceneName = name;
			$('#SceneName').text(name);
		}
		this.loadFromServer = function ()
		{
			var SID = this.getCurrentSession();
			var data = jQuery.ajax(
			{
				type: 'GET',
				url: PersistanceServer + '/vwfDataManager.svc/State?SID=' + SID,
				data: null,
				success: null,
				async: false,
				dataType: "json"
			});
			try
			{
				data = JSON.parse(JSON.parse(data.responseText).GetStateResult);
			}
			catch (e)
			{
				data = [];
				startHelp();
			}
			this.loadedScene = data;
			this.rawdata.scenes[SID] = data;
			this.loadScene(SID);
		}
		this.saveTimer = function ()
		{
			var num = this.getClientCount();
			var milliseconds = num * 1000 * 60;
			this.saveToServer();
			window.setTimeout(this.saveTimer.bind(this), milliseconds);
		}
		this.saveData = function ()
		{
			localStorage[this.datahandle] = JSON.stringify(this.rawdata);
		}
		PersistanceServer = this.getCurrentSession();
	}
});