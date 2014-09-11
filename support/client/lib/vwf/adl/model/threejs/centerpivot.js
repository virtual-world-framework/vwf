(function(){
		function centerpivot(childID, childSource, childName)
		{
			this.updateSelf = function()
			{
				var mesh = this.GetMesh();
				mesh.geometry.dirtyMesh = true;
				var bounds = mesh.geometry.GetBoundingBox(true);
				mesh.position.x = 0-(bounds.min[0] + (bounds.max[0]-bounds.min[0])/2);
				mesh.position.z = 0-(bounds.min[1] + (bounds.max[1]-bounds.min[1])/2);
				mesh.position.y = 0-(bounds.min[2] + (bounds.max[2]-bounds.min[2])/2);
				mesh.rotation.x = 0;
				mesh.updateMatrixWorld(true);
			}
			this.settingProperty = function(prop,val)
			{
				if(prop == 'active')
				{
					this.dirtyStack();
				}
			}
			this.gettingProperty = function(prop)
			{
				if(prop == 'EditorData')
				{
					return {
						_active:{displayname : 'Active',property:'active',type:'check',min:-10,max:10,step:.01}
						
					}
				}
			}
			this.inherits = ['vwf/model/threejs/modifier.js'];
		}
		
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new centerpivot(childID, childSource, childName);
        }
})();
