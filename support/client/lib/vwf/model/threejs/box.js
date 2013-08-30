(function(){


		function BoxCache()
		{
			this.boxes = {}
			this.toID = function(length,width,height,lengthsegs,widthsegs,heightsegs)
			{
				return length+","+width+","+height+","+lengthsegs+","+widthsegs+","+heightsegs;
			}
			this.getBox = function(length,width,height,lengthsegs,widthsegs,heightsegs)
			{
				var id = this.toID(length,width,height,lengthsegs,widthsegs,heightsegs);
				if(!this.boxes[id])
					this.boxes[id] = new THREE.CubeGeometry(length,width,height,lengthsegs,widthsegs,heightsegs);
				return this.boxes[id];
			}
		
		
		}
		var _boxCache = new BoxCache();

		function box(childID, childSource, childName)
		{
			this._length = 1;
			this.width = 1;
			this.height = 1;
			
			this.lsegs = 1;
			this.wsegs = 1;
			this.hsegs = 1;
			
			this.EditorData = {};
			this.EditorData._length = {displayname:'Length',property:'_length',type:'slider',min:0,max:10,step:.01};
			this.EditorData.width = {displayname:'Width',property:'width',type:'slider',min:0,max:10,step:.01};
			this.EditorData.height = {displayname:'Height',property:'height',type:'slider',min:0,max:10,step:.01};
			this.EditorData.lsegs = {displayname:'Length Segments',property:'lsegs',type:'slider',min:1,max:16};
			this.EditorData.wsegs = {displayname:'Width Segments',property:'wsegs',type:'slider',min:1,max:16};
			this.EditorData.hsegs = {displayname:'Height Segments',property:'hsegs',type:'slider',min:1,max:16};
			
			this.inherits = ['vwf/model/threejs/prim.js'];
			
			if(!window.OneXOneBox)
				window.OneXOneBox = new THREE.CubeGeometry(1, 1, 1,1,1,1);
			
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == '_length' || propertyName == 'width' || propertyName == 'height'||
				propertyName == 'lsegs'||propertyName == 'wsegs'||propertyName == 'hsegs')
				{
					this[propertyName] = propertyValue;
					this.dirtyStack(true,true);
				}
			}
			this.initializingNode = function()
			{
				this.dirtyStack(true,true);
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == '_length' || propertyName == 'width' || propertyName == 'height'||
				propertyName == 'lsegs'||propertyName == 'wsegs'||propertyName == 'hsegs' || propertyName =='EditorData')
				return this[propertyName];
			}
			this.BuildMesh = function(mat,cache)
			{
				//special case for 1 meter cubes. Used in minecraft mode, so need to be fast
				
				if(cache)
				{
					var mesh=  new THREE.Mesh(_boxCache.getBox(this._length, this.width, this.height,this.lsegs,this.wsegs,this.hsegs), mat);
					
				}
				else
				{
					var mesh=  new THREE.Mesh(new THREE.CubeGeometry(this._length, this.width, this.height,this.lsegs,this.wsegs,this.hsegs), mat);
					
				}
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
            return new box(childID, childSource, childName);
        }
})();