(function(){
		function lsection(childID, childSource, childName)
		{
			
			this._length = 1;
			this.width = 1;
			this.thickness1 = .5;
			this.thickness2 = .5;
			
			this.EditorData = {};
			this.EditorData._length = {displayname:'Length',property:'_length',type:'slider',min:0,max:10,step:.01};
			this.EditorData.width = {displayname:'Width',property:'width',type:'slider',min:0,max:10,step:.01};
			this.EditorData.thickness1 = {displayname:'Thickness 1',property:'thickness1',type:'slider',min:0,max:10,step:.01};
			this.EditorData.thickness2 = {displayname:'Thickness 2',property:'thickness2',type:'slider',min:0,max:10,step:.01};
			
			
			this.frac = function(e){return e-Math.floor(e)}
			this.inherits = ['vwf/model/threejs/spline.js'];
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == '_length')
				{
					this._length = propertyValue;
					this.dirtyStack(true);
				}
				if(propertyName == 'width')
				{
					this.width = propertyValue;
					this.dirtyStack(true);
				}
				if(propertyName == 'thickness1')
				{
					this.thickness1 = propertyValue;
					this.dirtyStack(true);
				}
				if(propertyName == 'thickness2')
				{
					this.thickness2 = propertyValue;
					this.dirtyStack(true);
				}
				
			}
			this.initializingNode = function()
			{
				this.dirtyStack(true);
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == 'width')
				{
					return this.width;
					
				}
				if(propertyName == '_length')
				{
					return this._length;
					
				}
				
				if(propertyName == 'EditorData')
				{
					return this.EditorData;
									
				}	
				if(propertyName == 'thickness1')
				{
					return this.thickness1;
									
				}	
				if(propertyName == 'thickness2')
				{
					return this.thickness2;
									
				}					
			}
			this.BuildLine = function(mat)
			{
				
				
				
				var pts = [];
				pts.push([0,0,0]);
				pts.push([this._length,0,0]);
				pts.push([this._length,this.thickness2,0]);
				pts.push([this.thickness1,this.thickness2,0]);
				pts.push([this.thickness1,this.width,0]);
				pts.push([0,this.width,0]);
				pts.push([0,0,0]);
			//	pts.push([this._length /2,-this.width/2,0]);
				//pts.push(pts[0]);
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
            return new lsection(childID, childSource, childName);
        }
})();