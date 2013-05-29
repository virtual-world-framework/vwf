(function(){
		function line(childID, childSource, childName)
		{
			
			
			this.EditorData = {};
			
			this.inherits = ['vwf/model/threejs/spline.js'];
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'points')
				{
					this.points = propertyValue;
					this.dirtyStack(true);
				}
				if(propertyName == 'subobjectSelectionSet')
				{
					this.subobjectSelectionSet = propertyValue;
				}
				
				
			}
			this.initializingNode = function()
			{
				
				vwf.setProperty(this.ID,'points',this.points);
				this.dirtyStack(true);
			}
			this.gettingProperty = function(propertyName)
			{
				
				if(propertyName == 'points')
				{
					return this.points ;
				}
				if(propertyName == 'type')
				{	
					return 'Line';
				}				
				if(propertyName == 'EditorData')
				{
					return {
						amount:{
								displayname : 'selectedIndex',
								property:'selectedIndex',
								type:'slider',
								min:-1,
								max:this.points.length,
								step:1
						}
				
					}
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