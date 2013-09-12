(function(){
	
		function getSkin(node,list)
		{
			if(!list) list = [];
			if(node instanceof THREE.SkinnedMesh)
			{
				list.push(node);
			}
			for(var i = 0; i < node.children.length; i++)
				getSkin(node.children[i],list);
			return list;
		}
		function animatable(childID, childSource, childName)
		{
			this.animationFrame = 0;
			this.animationSpeed = 1;
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'animationFrame')
				{
					
					this.animationFrame = propertyValue;
					
					var skins = getSkin(this.getRoot());
					for(var i = 0; i < skins.length; i++)
					{
						
						var frame = parseInt(propertyValue);
						var mod = propertyValue - frame;
						if(frame < 0) return;
						
						if(frame === null) return;
						for(var j = 0; j < skins[i].morphTargetInfluences.length; j++)
						{
							
								skins[i].morphTargetInfluences[j] = 0;
							
							
						}
						
						
						skins[i].morphTargetInfluences[frame] = mod;
						if(frame > 1)
							skins[i].morphTargetInfluences[frame-1] = 1.0-mod;
						
						
						
					
					}
				}	
				if(propertyName == 'animationState')
				{
					this.animationState = parseInt(propertyValue);
				}
				if(propertyName == 'animationStart')
				{
					this.animationStart = parseInt(propertyValue);
				}
				if(propertyName == 'animationEnd')
				{
					this.animationEnd = parseInt(propertyValue);
				}
				if(propertyName == 'animationSpeed')
				{
					this.animationSpeed = propertyValue;
				}				
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == 'animationFrame')
				{
					return this.animationFrame;		
				}
				if(propertyName == 'animationStart')
				{
					return this.animationStart || 0;		
				}
				if(propertyName == 'animationEnd')
				{
					return this.animationEnd || this.gettingProperty('animationLength');		
				}
				if(propertyName == 'animationLength')
				{
					var skins = getSkin(this.getRoot());
					if(skins[0]) return skins[0].morphTargetInfluences.length;
					return 0;
				}
				if(propertyName == 'animationState')
				{
					return this.animationState;
				}
				if(propertyName == 'animationSpeed')
				{
					return this.animationSpeed;
				}
			}
			this.ticking = function()
			{
				
				if(this.animationState == 1)
				{
					
					var nextframe = this.animationFrame+this.animationSpeed;
					if(nextframe > this.animationEnd)
						nextframe = this.animationStart;
					this.settingProperty(	'animationFrame' , nextframe);
				}
			
			}
		}
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new animatable(childID, childSource, childName);
        }
})();