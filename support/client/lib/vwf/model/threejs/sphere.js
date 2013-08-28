(function(){
		function sphere(childID, childSource, childName)
		{
			this.radius = 1;
			this.rsegs = 10;
			this.ssegs = 10;
			this.EditorData = {};
			this.EditorData.radius = {displayname:'Radius',property:'radius',type:'slider',min:0,max:10,step:.01};
			this.EditorData.rsegs = {displayname:'R Segments',property:'rsegs',type:'slider',min:3,max:16};
			this.EditorData.ssegs = {displayname:'S Segments',property:'ssegs',type:'slider',min:3,max:16};
			this.inherits = ['vwf/model/threejs/prim.js'];
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'radius')
				{
					this.radius = propertyValue;
					this.dirtyStack(true);
				}
				if(propertyName == 'rsegs')
				{
					this.rsegs = propertyValue;
					this.dirtyStack(true);
				}
				if(propertyName == 'ssegs')
				{
					this.ssegs = propertyValue;
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
				if(propertyName == 'rsegs')
				{
					return this.rsegs;
				}
				if(propertyName == 'ssegs')
				{
					return this.ssegs;
				}
				if(propertyName == 'EditorData')
				{	
					return this.EditorData;
				}
				
			}
			this.BuildMesh = function(mat)
			{
				var mesh=  new THREE.Mesh(new THREE.SphereGeometry(this.radius, this.rsegs*2, this.ssegs), mat);
				mesh.rotation.x = Math.PI/2;
				return mesh;
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
            return new sphere(childID, childSource, childName);
        }
})();