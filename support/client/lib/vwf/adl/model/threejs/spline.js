(function(){
		function prim(childID, childSource, childName)
		{
			
			this.closed = true;
			
			this.points = [[0,0,0],[0,1,0],[1,1,0],[1,0,0]]
			
			this.callingMethod = function(methodName,args)
			{
				if(methodName == 'GetMesh')
				{
					return this.GetMesh();
				}
				if(methodName == 'dirtyStack')
				{
					return this.dirtyStack();
				}
				if(methodName == 'updateStack')
				{
					return this.updateStack();
				}
				if(methodName == 'updateSelf')
				{
					return this.updateSelf();
				}
				if(methodName == 'pathPercent')
				{
					
					var p = this.spline.getPoint(args[0]);
					var mat = new THREE.Matrix4();
					//mat.getInverse(this.getRoot().matrixWorld);
					p = p.applyMatrix4(this.getRoot().matrixWorld);
				
					return [p.x,p.y,p.z];
				}
				if(methodName == 'getLength')
				{
					
					return this.spline.getLength();
				}
				if(methodName == 'getPoints')
				{
					
					return this.BuildLine(null);
				}
			}	
			this.initializingNode = function()
			{
				this.dirtyStack();
			}			
			this.GetMesh = function()
			{
				return this.mesh;
			}
			this.GetBounds = function()
			{
				return this.GetMesh().getBoundingBox(true);
			}
			this.updateSelf = function(rebuild)
			{
				
				this.Build();
				
				this.GetMesh().geometry.dirtyMesh = true;
				this.GetMesh().updateMatrixWorld(true);
			}
			
			this.dirtyStack = function(rebuild)
			{
				this.updateStack(rebuild);
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == 'type')
				{	
					return 'Spline';
				}
				
			}
			this.updateStack = function(rebuild)
			{

				this.updateSelf(rebuild);
				
				var children = vwf.children(this.ID);
				
				
				for(var i in children)
				{
					vwf.callMethod(children[i],'updateStack');
				}
			}
			this.backupMesh = function()
			{
				
				
			   
			}
			this.copyArray = function(arrNew, arrOld)
			{
				if(!arrNew)
					arrNew = [];
				arrNew.length = 0;
				for(var i =0; i< arrOld.length; i++)
					arrNew.push(arrOld[i].clone());
				return arrNew;
			}
			this.restoreMesh = function()
			{
			  
			}
			this.Build = function()
			{
				var mat;

				
				if( this.rootnode.children[0])
					mat = this.rootnode.children[0].material;
				else
					mat =  new THREE.MeshPhongMaterial();
				
				if(this.mesh)
					this.rootnode.remove(this.mesh);
				
				var line = this.BuildLine(mat);
				
				
				this.spline = new THREE.SplineCurve3([]);
				for(var i = 0; i < line.length; i++)
				{
					this.spline.points.push(new THREE.Vector3(line[i][0],line[i][1],line[i][2]));
				}
				var geo = new THREE.Geometry();
				
				
				for(var i = 0; i < line.length; i++)
				{
					geo.vertices.push(new THREE.Vector3(line[i][0],line[i][1],line[i][2]));
				}

				var mesh=  new THREE.Line(geo, new THREE.LineBasicMaterial('#0000FF'));
				mesh.material.color.r = 0;
				mesh.material.color.g = 0;
				
				
				this.mesh = mesh;
				
				this.rootnode.add(mesh);
				mesh.updateMatrixWorld(true);
				var cast = this.gettingProperty('castShadows');
				var rec = this.gettingProperty('receiveShadows');
				var vis = this.gettingProperty('visible');
				var pass = this.gettingProperty('passable');
				// reset the shadows flags for the new mesh
				this.settingProperty('castShadows',cast);
				this.settingProperty('receiveShadows',rec);
				this.settingProperty('passable',pass);
				this.settingProperty('visible',vis);
				
			}
			this.inherits = ['vwf/model/threejs/visible.js','vwf/model/threejs/materialDef.js','vwf/model/threejs/shadowcaster.js','vwf/model/threejs/transformable.js','vwf/model/threejs/passable.js', 'vwf/model/threejs/selectable.js'];
		}
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new prim(childID, childSource, childName);
        }
})();