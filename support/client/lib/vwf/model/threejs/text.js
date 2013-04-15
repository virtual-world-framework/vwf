(function(){
		function text(childID, childSource, childName)
		{
			
			this.textsize = 1;
			this.text = "hi";
			this.height = 1;
			
			this.rsegs = 10;
			this.hsegs = 1;
			
			this.EditorData = {};
			
			this.EditorData.text = {displayname:'text',property:'text',type:'text'};
			this.EditorData.textsize = {displayname:'textsize',property:'textsize',type:'slider',min:0,max:10,step:.01};
			this.EditorData.height = {displayname:'height',property:'height',type:'slider',min:0,max:10,step:.01};
			

			this.inherits = ['vwf/model/threejs/prim.js'];
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'text' || propertyName == 'textsize' || propertyName == 'height')
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
				if(propertyName == 'text' || propertyName == 'textsize'|| propertyName == 'height' ||
				 propertyName =='EditorData')
				return this[propertyName];
			}
			this.BuildMesh = function(mat)
			{
				
				var mesh=  new THREE.Mesh(new THREE.TextGeometry(this.text || "text",{size:this.textsize,height:this.height,curveSegments:2}), mat);
				
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
            return new text(childID, childSource, childName);
        }
})();