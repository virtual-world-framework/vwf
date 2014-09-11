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
		var UserList = [];
		$(document.body).append('<div id="PermissionsManager"><div id="PermissionsOwner" style="font-size: 1.5em;width: 100%;border-bottom: 1px solid gray;margin-bottom: 14px;color: gray;"/><div id="PermissionsDisplay" style="border-bottom: 1px solid gray;padding-bottom: 16px;"></div></div>');
		
		$('#PermissionsManager').append('<div id="AddPermission" />');
		$('#PermissionsManager').append('<input type="text" style="height:2em" id="AddPermissionName" />');
		$('#AddPermission').button({label:'Add User'});
		$('#AddPermission').click(function()
		{
		
			
			var i = $('#AddPermissionName').val();
			if(self.UserList.indexOf(i) == -1)
			{
				$('#AddPermissionName').css('background','rgb(255, 10, 10)');
				$('#AddPermissionName').animate({backgroundColor:'rgb(209, 140, 140)'});
			}
			else
			{
				$('#AddPermissionName').val('');
				$('#AddPermissionName').css('background','white');
				if($('#permisisonFor'+i).length == 0)
				{
					var id = ToSafeID(i);
					$('#PermissionsDisplay').append('<div><span id="permisisonCloseFor'+id+'" class="ui-icon ui-icon-closethick" style="float:right;cursor:pointer">Close</span><input type="checkbox" id="permisisonFor'+id+'" name="permisisonFor'+id+'" /><label for="permisisonFor'+id+'">'+i+'</label></div>');
					$('#permisisonCloseFor'+id).attr('user',i);
					 $('#permisisonCloseFor'+id).click(function()
					 {
						   $(this).parent().remove();
					 });
					$('#permisisonFor'+id).attr('user',i);
					
				}
			}
			
		
		});
		
		$('#AddPermissionName').keyup(function()
		{
			
			var i = $('#AddPermissionName').val();
			if(self.UserList.indexOf(i) == -1)
			{
				$(this).css('background','rgb(209, 140, 140)');
			
			}else
			{
				
				$(this).css('background','rgb(156, 187, 156)');
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
				$('#PermissionsManager').dialog('option','title','Edit Permissions:Scene');
				self.BuildGUI();
			}
		});
		this.save = function()
		{
			var newperm = {}
			$('#PermissionsManager input[type="checkbox"]').each(function(i,v){
				newperm[$(v).attr('user')] = $(v).attr('checked')=='checked'?1:0;
			
			});
			this.setProperty(vwf.application(),'permission',newperm,'You do not have permission to edit this object');
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

			var allowAnonymous = false;
			var instanceData = _DataManager.getInstanceData();
			allowAnonymous = instanceData && instanceData.publishSettings? instanceData.publishSettings.allowAnonymous : false;
			level = allowAnonymous?1:level;
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
			var self = this;
			$('#AddPermissionName').css('background','white');
			if(UserList.length > 0)
			{
				$('#PermissionsManager').dialog('open');
			}
			else
			{
				$.get('vwfDataManager.svc/profiles',function(data,status,xhr)
				{
					
					self.UserList = JSON.parse(xhr.responseText);
					$('#PermissionsManager').dialog('open');
				
				});
			}
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
			
			$('#PermissionsOwner').text('Owner: ' + vwf.getProperty(vwf.application(),'owner'));
			var permission = vwf.getProperty(vwf.application(),'permission');
			if(permission)
			{
				for(var i in permission)
				{
					var id = ToSafeID(i);
				     $('#PermissionsDisplay').append('<div><span id="permisisonCloseFor'+id+'" class="ui-icon ui-icon-closethick" style="float:right;cursor:pointer">Close</span><input type="checkbox" id="permisisonFor'+id+'" name="permisisonFor'+id+'" /><label for="permisisonFor'+id+'">'+i+'</label></div>');
				     $('#permisisonFor'+id).attr('user',i);
					 $('#permisisonCloseFor'+id).attr('user',i);
					 $('#permisisonCloseFor'+id).click(function()
					 {
						   $(this).parent().remove();
					 });
				     if(permission[i] !== 0)
				     {
					$('#permisisonFor'+id).attr('checked','checked');
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