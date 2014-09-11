(function(){
		function circle(childID, childSource, childName)
		{
			
			this.radius = 1;
			this.steps = 10;
			this.EditorData = {};
			this.EditorData.radius = {displayname:'Radius',property:'radius',type:'slider',min:0,max:10,step:.01};
			this.EditorData.steps = {displayname:'Steps',property:'steps',type:'slider',min:0,max:50,step:1};
			
			
			this.inherits = ['vwf/model/threejs/spline.js'];
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'radius')
				{
					this.radius = propertyValue;
					this.dirtyStack(true);
				}
				if(propertyName == 'steps')
				{
					this.steps = propertyValue;
					this.dirtyStack(true);					
				}
			}
			this.initializingNode = function()
			{
				this.dirtyStack(true);
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == 'radius')
				{
					return this.radius;
					
				}
				if(propertyName == 'steps')
				{
					return this.steps;
									
				}
				if(propertyName == 'EditorData')
				{
					return this.EditorData;
									
				}				
			}
			this.BuildLine = function(mat)
			{
				var offset = new THREE.Vector3(this.radius,0,0);
				var rotstep = (Math.PI * 2) / Math.round(this.steps);
				var pts = [];
				
				for(var i = 0; i < (Math.PI * 2); i += rotstep)
				{
					var r = new THREE.Matrix4();
					r.makeRotationZ(rotstep);
					offset.applyMatrix4(r);
					pts.push([offset.x,offset.y,offset.z]);
					
				}
				pts.push(pts[0]);
				return pts;
				
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
            return new circle(childID, childSource, childName);
        }
})();