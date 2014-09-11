(function(){
		function shadowCaster(childID, childSource, childName)
		{
			this.castShadows = true;
			this.receiveShadows = true;
			
			this.initializingNode = function()
			{
				
			
			}
			
			this.CasterGetAllLeafMeshes = function(threeObject,list)
			{
				if(!list) list = [];
				if(threeObject instanceof THREE.Mesh && threeObject.name !== 'BoneSelectionHandle')
				{
					list.push(threeObject);
				}
				if(threeObject.children)
				{
					for(var i=0; i < threeObject.children.length; i++)
					{
						this.CasterGetAllLeafMeshes(threeObject.children[i],list);
					}               
				}
				return list;
			}
			this.settingProperty = function(propname,propval)
			{
				if(propname == 'castShadows')
				{
					
					this.castShadows = propval;
					var list = this.CasterGetAllLeafMeshes(this.getRoot())
					for(var i = 0; i < list.length; i++)
						list[i].castShadow = this.castShadows && _SettingsManager.getKey('shadows');
					return propval;	
				}
				if(propname == 'receiveShadows')
				{
					this.receiveShadows = propval;
					var list = this.CasterGetAllLeafMeshes(this.getRoot())
					for(var i = 0; i < list.length; i++)
					{
						list[i].receiveShadow = this.receiveShadows  && _SettingsManager.getKey('shadows');
						if(list[i].material)
							list[i].material.needsUpdate = true
					}
					return propval;
				}
				
			}
			this.gettingProperty = function(propname,propval)
			{
				if(propname == 'castShadows')
				{
					
					return this.castShadows;
					
				}
				if(propname == 'receiveShadows')
				{
					return this.receiveShadows;
					
				}
			}
		}
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new shadowCaster(childID, childSource, childName);
        }
})();