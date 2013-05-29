(function(){
		function terrain(childID, childSource, childName)
		{
			
			function ControlPoint(x,y,z,d,f)
			{
			    
				this.x = x || 0;
				this.y = y || 0;
				this.z = z || 1;
				this.falloff = f||1;
				this.dist = d||10;
				this.getPoint = function()
				{
					return new THREE.Vector3(this.x,this.y,this.z);
				}
			}
			
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'controlPoints')
				{
					this.controlPoints = propertyValue;
					this.BuildTerrain();
				}
			}
			this.controlPoints = [];
			this.initializingNode = function()
			{
				
				vwf.setProperty(this.ID,'controlPoints',this.controlPoints);
				Math.sign = function(e){ return e<0?-1:1};
				if(this.controlPoints.length == 0)
				{
				
				
				this.controlPoints.push(new ControlPoint(0,0,10,1,1));
				this.controlPoints.push(new ControlPoint(30,30,10,3,1.5));
				
				}
				
				this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(100,100,100,100),new THREE.MeshPhongMaterial());
				this.mesh.material.color.r = .5;
				this.mesh.material.color.g = .5;
				this.mesh.material.color.b = .5;
				this.geo = this.mesh.geometry;
				this.getRoot().add(this.mesh);
				this.DisableTransform();
				this.BuildTerrain();
			}
			this.callingMethod = function(methodName,args)
			{
				if(methodName == 'setPoint')
				{
					if(args.length == 6)
					{
						var cp = this.controlPoints[args[0]];
						cp.x = args[1];
						cp.y = args[2];
						cp.z = args[3];
						cp.dist = args[4];
						cp.falloff = args[5];
					}
					else if(args.length == 2)
					{
						this.controlPoints[args[0]] = args[1];
					}
					this.BuildTerrain();
					return true;
				}
				if(methodName == 'getPoint')
				{
					return this.controlPoints[args[0]];
				}
				if(methodName == 'getPointCount')
				{
					return this.controlPoints.length;
				}
			}
			this.gettingProperty = function(propertyName)
			{
				
				if(propertyName == 'controlPoints')
				{
					return this.controlPoints ;
				}
				if(propertyName == 'type')
				{	
					return 'Terrain';
				}					
			}
			
			
			this.BuildTerrain= function()
			{
				if(!this.geo) return;
				
				
				
				for(var i = 0; i < this.geo.vertices.length; i++)
				{
					
					var vert = this.geo.vertices[i];
					var z = 0;
					for(var j = 0; j < this.controlPoints.length; j++)
					{
						var cp = this.controlPoints[j];
						var dist = Math.sqrt((vert.x - cp.x) * (vert.x - cp.x) + (vert.y - cp.y) * (vert.y - cp.y));
						dist = Math.max(dist,1);
						z =   Math.max(Math.abs(cp.z) - Math.pow(dist/cp.dist,cp.falloff),z);
						
					
					}
					vert.z = z;
				}
				this.geo.verticesNeedUpdate = true;
				this.geo.computeVertexNormals(true);
				this.geo.normalsNeedUpdate = true
				
			}
			
			
			//must be defined by the object
			this.getRoot = function()
			{
				return this.rootnode;
			}
			this.rootnode = new THREE.Object3D();
			this.inherits = ['vwf/model/threejs/transformable.js'];
			//this.Build();
		}
		
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new terrain(childID, childSource, childName);
        }
})();