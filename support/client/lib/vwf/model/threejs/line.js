(function(){
		function line(childID, childSource, childName)
		{
			
			this.selectedIndex = -1;
			this.EditorData = {};
			
			this.inherits = ['vwf/model/threejs/spline.js'];
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'selectedIndex')
					this.selectedIndex = propertyValue;
				if(propertyName == 'point')
				{
					if(this.selectedIndex > -1)
						this.points[selectedIndex] = propertyValue;	
				}
				if(propertyName == 'points')
				{
					this.points = propertyValue;
					this.dirtyStack(true);
				}
			}
			this.initializingNode = function()
			{
				this.dirtyStack(true);
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == 'selectedIndex')
					return this.selectedIndex = propertyValue;
				if(propertyName == 'points')
				{
					return this.points ;
				}				
			}
			this.BuildLine = function(mat)
			{
				return this.points;
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
            return new line(childID, childSource, childName);
        }
})();