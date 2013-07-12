define(function ()
{
	var LocationTools = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(LocationTools);
				isInitialized = true;
			}
			return LocationTools;
		}
	}

	function initialize()
	{
		this.GoToPosition = function()
		{
			if (!_UserManager.GetCurrentUserName())
				{
					_Notifier.alert('First person mode is not available when you are not logged in.');
					return;
				}
			alertify.prompt('Type the location in the form of "x,y,z"',function(ok,val)
			{
			
				
				if(ok)
				{
					
					
					var vals = val.split(',');
					for(var i =0; i < vals.length; i++)
					{
						vals[i] = parseFloat(vals[i]);
						if(isNaN(vals[i]))
						{
							_Notifier.alert('Invalid Format');
							return;
						}
						
						
							
					}
					if(vals.length != 3)
						{
							_Notifier.alert('Invalid Format');
							return;
						}
				$('#MenuCamera3RDPersonicon').click();		
				_Editor.setProperty(_UserManager.GetCurrentUserID(),'translation',vals);
				
				
				}
			},'0,0,0');
		
		}
		this.GoToPlaceMark = function()
		{
			if (!_UserManager.GetCurrentUserName())
				{
					_Notifier.alert('First person mode is not available when you are not logged in.');
					return;
				}
				
			var placemarks = vwf.getProperty('index-vwf','placemarks');
			if(!placemarks || Object.keys(placemarks).length == 0)
			{
				_Notifier.alert('There are no placemarks in this scene.');
			}
			var labels = [];
			for(var i in placemarks)
				labels.push(i);
				
			alertify.choice('Choose a placemark',function(ok,val)
			{
				if(ok)
				{
					var pos;
					for(var i in placemarks)
					{
						if(i == val)
							pos = placemarks[i];
					}
					if(pos)
					{
						$('#MenuCamera3RDPersonicon').click();		
						_Editor.setProperty(_UserManager.GetCurrentUserID(),'translation',pos);
					}
				}
			
			},labels);
		
		}
		this.AddPlacemark = function()
		{
			if (!_UserManager.GetCurrentUserName())
				{
					_Notifier.alert('First person mode is not available when you are not logged in.');
					return;
				}
				
			alertify.prompt('Enter a title for your placemark. The placemark location will be taken from your avatars position.',function(ok,val){
			
				if(ok)
				{
					var title = val;
					var location = vwf.getProperty(_UserManager.GetCurrentUserID(),'translation');
					var placemarks = vwf.getProperty('index-vwf','placemarks');
					placemarks[title] = location;
					_Editor.setProperty('index-vwf','placemarks',placemarks);
				
				}
			},'title');
		}
		this.MoveToGround = function()
		{
			if (!_UserManager.GetCurrentUserName())
				{
					_Notifier.alert('First person mode is not available when you are not logged in.');
					return;
				}
			
			var location = vwf.getProperty(_UserManager.GetCurrentUserID(),'translation');
			location[2] = 10000;
			var hit=_SceneManager.CPUPick(location,[0,0,-1],{ignore:[_Editor.findviewnode(_UserManager.GetCurrentUserID()),_Editor.GetMoveGizmo(),_dSky]});
			if(hit)
			{
				location[2] = hit.point[2];
				_Editor.setProperty(_UserManager.GetCurrentUserID(),'translation',location);
				$('#MenuCamera3RDPersonicon').click();		
			}
		
		}
	}
});