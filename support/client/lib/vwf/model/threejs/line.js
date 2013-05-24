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
				{
					
					this.selectedIndex = propertyValue;
					
					//temp hack for nicer actin with the transform tool. 
					//Need spline specific wrapper on transform tooling
					
					if(window._Editor)
						_Editor.updateGizmoLocation();
					
					if(this.selectedIndex == -1)
						this.EnableTransform();
					else
					{
						if(this.TransformEnabled())
						{
							this.transformBackup = new THREE.Matrix4();
							this.transformBackupInv = new THREE.Matrix4();
							
							this.transformBackup = this.getRoot().parent.matrixWorld.clone();
							this.transformBackupInv.getInverse(this.transformBackup);
							this.DisableTransform();
						}
					}
				}
				if(propertyName == 'transform')
				{
					if(this.selectedIndex != -1)
					{
						var ret = new THREE.Matrix4();
						ret.elements = propertyValue;
						if(this.transformBackupInv)
						{
								ret = ret.multiply(this.transformBackupInv).elements;
								this.points[this.selectedIndex][0] = ret[12];
								this.points[this.selectedIndex][1] = ret[13];
								this.points[this.selectedIndex][2] = ret[14];
								this.dirtyStack();
						}							
					
					}
				}
				
				if(propertyName == 'points')
				{
					this.points = propertyValue;
					this.dirtyStack(true);
				}
			}
			this.initializingNode = function()
			{
				
				vwf.setProperty(this.ID,'points',this.points);
				this.dirtyStack(true);
			}
			this.gettingProperty = function(propertyName)
			{
				//this is very important - needs to reset the selection state to not selected when node is replicated
				//the tooling will have to deal with the fact that it can't read back the editing state.
				if(propertyName == 'selectedIndex')
					return -1;
				if(propertyName == 'points')
				{
					return this.points ;
				}
				if(propertyName == 'transform')
				{
					if(this.selectedIndex != -1)
					{
						var ret = new THREE.Matrix4();
						ret.elements[12] = this.points[this.selectedIndex][0];
						ret.elements[13] = this.points[this.selectedIndex][1];
						ret.elements[14] = this.points[this.selectedIndex][2];
						if(this.transformBackup)
							return this.transformBackup.clone().multiply(ret).elements;
					}
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