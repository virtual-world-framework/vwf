(function(){
		function cylinder(childID, childSource, childName)
		{
			
			this.radius = 1;
			this.height = 1;
			
			
			this.rsegs = 10;
			this.hsegs = 1;
			
			this.EditorData = {};
			
			this.EditorData.radius = {displayname:'Radius',property:'radius',type:'slider',min:0,max:10,step:.01};
			this.EditorData.height = {displayname:'Height',property:'height',type:'slider',min:0,max:10,step:.01};
			
			this.EditorData.rsegs = {displayname:'Radius Segments',property:'rsegs',type:'slider',min:1,max:16};
			this.EditorData.hsegs = {displayname:'Height Segments',property:'hsegs',type:'slider',min:1,max:16};
			
			this.inherits = ['vwf/model/threejs/prim.js'];
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'height' || propertyName == 'radius' ||
				propertyName == 'hsegs'||propertyName == 'rsegs')
				{
					this[propertyName] = propertyValue;
					this.dirtyStack(true);
				}
			}
			this.initializingNode = function()
			{
				this.dirtyStack(true);
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == 'height' || propertyName == 'radius' ||
				propertyName == 'hsegs'||propertyName == 'rsegs' || propertyName =='EditorData')
				return this[propertyName];
			}
			this.BuildMesh = function(mat)
			{
				var mesh=  new THREE.Mesh(new THREE.CylinderGeometry(this.radius, this.radius, this.height,this.rsegs,this.hsegs), mat);
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
            return new cylinder(childID, childSource, childName);
        }
})();