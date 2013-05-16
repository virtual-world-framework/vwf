define(["vwf/view/editorview/Editor"], function (Editor)
{
	var __PermissionsManager = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(__PermissionsManager);
				isInitialized = true;
			}
			return __PermissionsManager;
		}
	}

	function initialize()
	{
		var self = this;
	
		$(document.body).append('<div id="PermissionsManager"><div id="PermissionsOwner" style="font-size: 1.5em;width: 100%;border-bottom: 1px solid gray;margin-bottom: 14px;color: gray;"/><div id="PermissionsDisplay" style="border-bottom: 1px solid gray;padding-bottom: 16px;"></div></div>');
		
		$('#PermissionsManager').append('<div id="AddPermission" />');
		$('#PermissionsManager').append('<input type="text" style="height:2em" id="AddPermissionName" />');
		$('#AddPermission').button({label:'Add User'});
		$('#AddPermission').click(function()
		{
		
			
			var i = $('#AddPermissionName').val();
			if($('#permisisonFor'+i).length == 0)
			{
				$('#PermissionsDisplay').append('<div><input type="checkbox" id="permisisonFor'+i+'" name="permisisonFor'+i+'" /><label for="permisisonFor'+i+'">'+i+'</label></div>');
				$('#permisisonFor'+i).attr('user',i);
				
			}
			
		
		});
		$('#PermissionsManager').dialog({title:'Edit Permissions',
			autoOpen:false,
			modal:true,
			buttons:{
				'Save':function()
				{
				    self.save();
				    self.hide();
				},
				'Cancel':function()
				{
				    self.hide();
				}
			},
			open:function()
			{
				$('#PermissionsManager').dialog('option','title','Edit Permissions:' + _Editor.GetSelectedVWFID());
				self.BuildGUI();
			}
		});
		this.save = function()
		{
			var newperm = {}
			$('#PermissionsManager input[type="checkbox"]').each(function(i,v){
				newperm[$(v).attr('user')] = $(v).attr('checked')=='checked'?1:0;
			
			});
			this.setProperty(_Editor.GetSelectedVWFID(),'permission',newperm,'You do not have permission to edit this object');
		}
		this.getPermission = function(user,id)
		{
			var level = 0;
			var permission = vwf.getProperty(id,'permission');
			var owner = vwf.getProperty(id,'owner');
			if(owner == user)
			{
				level = Infinity;
				return level;
			}
			if(permission)
			{
				level = Math.max(level?level:0,permission[user]?permission[user]:0,permission['Everyone']?permission['Everyone']:0);
			}
			var parent = vwf.parent(id);
			if(parent)
				level = Math.max(level?level:0,this.getPermission(user,parent));
			return level?level:0;	
		}
		this.setProperty = function(id,name,val,deniedMessage)
		{
			if(!_UserManager.GetCurrentUserName())
			{
			     _Notifier.notify("You must log in to participate");
			     return false;
			}
			var allowed = this.getPermission(_UserManager.GetCurrentUserName(),id);
			if(!allowed)
			{
				if(deniedMessage)
					_Notifier.notify(deniedMessage);
				return false;
			}
			vwf_view.kernel.setProperty(id,name,val);
			return true;
		}
		this.show = function()
		{
			$('#PermissionsManager').dialog('open');
		}
		this.hide = function()
		{
			$('#PermissionsManager').dialog('close');
		}
		this.isOpen = function()
		{
			$('#PermissionsManager').is(':visible');
		}
		this.BuildGUI = function()
		{
			$('#PermissionsDisplay').empty();
			
			$('#PermissionsOwner').text('Owner: ' + vwf.getProperty(_Editor.GetSelectedVWFID(),'owner'));
			var permission = vwf.getProperty(_Editor.GetSelectedVWFID(),'permission');
			if(permission)
			{
				for(var i in permission)
				{
				     $('#PermissionsDisplay').append('<div><input type="checkbox" id="permisisonFor'+i+'" name="permisisonFor'+i+'" /><label for="permisisonFor'+i+'">'+i+'</label></div>');
				     $('#permisisonFor'+i).attr('user',i);
				     if(permission[i] !== 0)
				     {
					$('#permisisonFor'+i).attr('checked','checked');
				     }
				}
				
				
			}
			if($('#permisisonFor'+'Everyone').length == 0)
				{
					$('#PermissionsDisplay').append('<div><input type="checkbox" id="permisisonFor'+'Everyone'+'" name="permisisonFor'+'Everyone'+'" /><label for="permisisonFor'+'Everyone'+'">'+'Everyone'+'</label></div>');
					$('#permisisonFor'+'Everyone').attr('user','Everyone');
					
				}
		}
	}
});