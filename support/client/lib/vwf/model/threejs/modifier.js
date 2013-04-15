(function(){
		function modifier(childID, childSource, childName)
		{
			this.active = true;
			this.callingMethod = function(methodName,args)
			{
				if(methodName == 'GetMesh')
				{
					return this.GetMesh();
				}
				if(methodName == 'dirtyStack')
				{
					return this.dirtyStack();
				}
				if(methodName == 'updateStack')
				{
					return this.updateStack();
				}
				if(methodName == 'updateSelf')
				{
					return this.updateSelf();
				}
			}	
			this.gettingProperty = function(prop)
			{
				if(prop == 'isModifier') return true;
				if(prop == 'active') return this.active;
			}
			this.settingProperty = function(prop,val)
			{
				if(prop == 'isModifier') return true;
				if(prop == 'active')
				{	
					this.active = val;
					this.dirtyStack();
				}
			}
			this.initializingNode = function()
			{
				
				this.dirtyStack();
			}
			this.updateStack = function()
			{
				if(this.active)
					this.updateSelf();
				var children = vwf.children(this.ID);
				for(var i in children)
				{
					return vwf.callMethod(children[i],'updateStack');
				}
			}
			this.GetMesh = function()
			{
				if(this.parentNode)
					if(this.parentNode.GetMesh)
						return this.parentNode.GetMesh();
				return vwf.callMethod(vwf.parent(this.ID),'GetMesh');
			}
			this.GetBounds = function()
			{
				
				return vwf.callMethod(vwf.parent(this.ID),'GetBounds');
			}
			this.dirtyStack = function()
			{
				
				
				return vwf.callMethod(vwf.parent(this.ID),'dirtyStack');
			}
			//must be defined by the object
			this.getRoot = function()
			{
				return this.rootnode;
			}
			this.rootnode = new THREE.Object3D();
			//this.Build();
		}
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new modifier(childID, childSource, childName);
        }
})();