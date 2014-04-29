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
		var self = this;
		$(window).on('hashchange',function()
		{
			
			self.hashchange();
		});
		this.currentPlacemark = '';
		this.hashchange = function()
		{
			
			var hash = window.location.hash.substr(1);
			if(self.currentPlacemark != hash)
			{
				self.GoToPlacemark_inner(hash);
			}
			
		}
		this.GoToPosition = function()
		{
			
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
					
					if (!_UserManager.GetCurrentUserName())
					{
						vwf.models[0].model.nodes['index-vwf'].orbitPoint(vals);
						vwf.models[0].model.nodes['index-vwf'].zoom = 5;
						vwf.models[0].model.nodes['index-vwf'].updateCamera();
						return;
					}					
					
				$('#MenuCamera3RDPersonicon').click();		
				_Editor.vwf_view.kernel(_UserManager.GetCurrentUserID(),'setPosition',[vals]);
				
				
				}
			},'0,0,0');
		
		}
		this.GoToPlaceMark = function()
		{
			
				
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
					self.GoToPlacemark_inner(val);
				}
			
			},labels);
		
		}
		this.getCurrentPlacemarkPosition = function()
		{
		
			var placemarks = vwf.getProperty('index-vwf','placemarks');
					var pos = null;
					for(var i in placemarks)
					{
						if(i == window.location.hash.substr(1))
							pos = placemarks[i];
					}
					if(pos)
					return [pos[0],pos[1],pos[2]];
					return null;
		}
		this.getPlacemarkPosition = function(name)
		{
		
			var placemarks = vwf.getProperty('index-vwf','placemarks');
					var pos = null;
					for(var i in placemarks)
					{
						if(i == name)
							pos = placemarks[i];
					}
					if(pos)
					return [pos[0],pos[1],pos[2]];
					return null;
		}
		this.GoToPlacemark_inner = function(val)
		{
			
			var placemarks = vwf.getProperty('index-vwf','placemarks');
			this.currentPlacemark = val;
			window.location.hash = val;
					var pos;
					for(var i in placemarks)
					{
						if(i == val)
							pos = placemarks[i];
					}
					if(pos)
					{
						if (!_UserManager.GetCurrentUserName())
						{
							vwf.models[0].model.nodes['index-vwf'].orbitPoint([pos[0],pos[1],pos[2]]);
							vwf.models[0].model.nodes['index-vwf'].zoom = 5;
							vwf.models[0].model.nodes['index-vwf'].updateCamera();
							return;
						}	
					
						$('#MenuCamera3RDPersonicon').click();		
						vwf_view.kernel.callMethod(_UserManager.GetCurrentUserID(),'setPosition',[[pos[0],pos[1],pos[2]]]);
					}
		}
		this.AddPlacemark = function()
		{
			if (!_UserManager.GetCurrentUserName())
				{
					_Notifier.alert('Location tools are not available when you are not logged in.');
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
					_Notifier.alert('Location tools are not available when you are not logged in.');
					return;
				}
			
			var location = vwf.getProperty(_UserManager.GetCurrentUserID(),'translation');
			location[2] = 10000;
			var hit=_SceneManager.CPUPick(location,[0,0,-1],{ignore:[_Editor.findviewnode(_UserManager.GetCurrentUserID()),_Editor.GetMoveGizmo(),_dSky]});
			if(hit)
			{
				location[2] = hit.point[2];
				vwf_view.kernel.callMethod(_UserManager.GetCurrentUserID(),'setPosition',[[location[0],location[1],location[2]]]);
				$('#MenuCamera3RDPersonicon').click();		
			}
		
		}
	}
});