(function(){
		function passable(childID, childSource, childName)
		{
			this.passable = false;
			
			this.initializingNode = function()
			{
				
			
			}
			this.PassableGetAllLeafMeshes = function(threeObject,list)
			{
				if(!list) list = [];
				if(threeObject instanceof THREE.Mesh || threeObject instanceof THREE.Line)
				{
					list.push(threeObject);
				}
				if(threeObject.children)
				{
					for(var i=0; i < threeObject.children.length; i++)
					{
						this.PassableGetAllLeafMeshes(threeObject.children[i],list);
					}               
				}
				return list;
			}
			this.settingProperty = function(propname,propval)
			{
				if(propname == 'passable')
				{
					
					this.passable = propval;
					var list = this.PassableGetAllLeafMeshes(this.getRoot())
					for(var i = 0; i < list.length; i++)
						list[i].passable = propval;
					return propval;	
				}
			}
			this.gettingProperty = function(propname,propval)
			{
				if(propname == 'passable')
				{
					
					return this.passable;	
				}
			}
		}
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new passable(childID, childSource, childName);
        }
})();