(function(){
		function plane(childID, childSource, childName)
		{
			this._length = 1;
			this.width = 1;
			
			
			this.lsegs = 1;
			this.wsegs = 1;
			
			
			this.EditorData = {};
			this.EditorData._length = {displayname:'Length',property:'_length',type:'slider',min:0,max:10,step:.01};
			this.EditorData.width = {displayname:'Width',property:'width',type:'slider',min:0,max:10,step:.01};
			
			this.EditorData.lsegs = {displayname:'Length Segments',property:'lsegs',type:'slider',min:1,max:16};
			this.EditorData.wsegs = {displayname:'Width Segments',property:'wsegs',type:'slider',min:1,max:16};
			
			
			this.inherits = ['vwf/model/threejs/prim.js'];
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == '_length' || propertyName == 'width' || 
				propertyName == 'lsegs'||propertyName == 'wsegs')
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
				if(propertyName == '_length' || propertyName == 'width' || 
				propertyName == 'lsegs'||propertyName == 'wsegs' || propertyName =='EditorData')
				return this[propertyName];
			}
			this.BuildMesh = function(mat)
			{
				var mesh=  new THREE.Mesh(new THREE.PlaneGeometry(this._length, this.width,this.lsegs,this.wsegs), mat);
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
            return new plane(childID, childSource, childName);
        }
})();