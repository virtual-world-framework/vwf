(function(){
		function terrain(childID, childSource, childName)
		{
			
			var self = this;
			function TileCache()
			{
				this.tiles = {};
				
				this.mat = new THREE.MeshPhongMaterial();
							this.mat.color.r = .5;
							this.mat.color.g = .5;
							this.mat.color.b = .5;
						//	this.mat.transparent = true;
						//	this.mat.depthcheck = false;
						//	this.mat.wireframe = true;
							
				this.getMesh = function(res,size)
				{
					if(this.tiles[res])
						for(var i = 0; i < this.tiles[res].length; i++)
							if(!this.tiles[res][i].parent && this.tiles[res][i].size == size)
								return this.tiles[res][i];
					if(!this.tiles[res])		
						this.tiles[res] = [];
						
					var newtile = new THREE.Mesh(new THREE.PlaneGeometry(size,size,res,res),this.mat);
					newtile.size = size;
					newtile.receiveShadow = true;
					newtile.castShadow = true;
					this.tiles[res].push(newtile);
					return newtile;
				}
			}
			self.TileCache = new TileCache();
			function QuadtreeNode(min,max,root,depth)
			{
				
				if(!depth)
					this.depth = 1;
				else
					this.depth = depth;
				this.children = [];
				this.mesh = null;
				this.min = min;
				this.max = max;
				
				this.THREENode = root;
				this.c = [this.min[0] + (this.max[0]-this.min[0])/2,this.min[1] + (this.max[1]-this.min[1])/2]
				this.split = function()
				{
					if(this.mesh)
					{
						this.mesh.parent.remove(this.mesh);
						this.mesh = null;
					}
					
					this.children.push(new QuadtreeNode([this.min[0],this.min[1]],[this.c[0],this.c[1]],this.THREENode,this.depth+1))
					this.children.push(new QuadtreeNode([this.c[0],this.min[1]],[this.max[0],this.c[1]],this.THREENode,this.depth+1));
					this.children.push(new QuadtreeNode([this.min[0],this.c[1]],[this.c[0],this.max[1]],this.THREENode,this.depth+1));
					this.children.push(new QuadtreeNode([this.c[0],this.c[1]],[this.max[0],this.max[1]],this.THREENode,this.depth+1));
				}
				this.updateMesh = function()
				{
					if(!this.isSplit())
					{
						if(!this.mesh)
						{
							
							
							var res = this.max[0] - this.min[0];
							res /= (11-this.depth) * (11-this.depth);
							res = Math.floor(res);
							res = 32;
							this.mesh = self.TileCache.getMesh(res,this.max[0] - this.min[0]);
							
							
			
							this.mesh.position.x = this.c[0];
							this.mesh.position.y = this.c[1];
							this.mesh.position.z = 1;
							self.BuildTerrainInner(this.mesh);
							this.THREENode.add(this.mesh);
							this.mesh.updateMatrixWorld(true);
						}
					}else
					{
						if(this.mesh)
						{
							this.mesh.parent.remove(this.mesh);
							this.mesh = null;
						}
					}
					
					for(var i=0; i < this.children.length; i++)
						this.children[i].updateMesh();
				}
				this.isSplit = function() {return this.children.length > 0;}
				this.deSplit = function()
				{
					for(var i=0; i < this.children.length; i++)
						this.children[i].destroy();
					this.children = [];
				}
				this.destroy = function()
				{
					if(this.mesh)
					{
						this.mesh.parent.remove(this.mesh);
						this.mesh = null;
					}
					for(var i=0; i < this.children.length; i++)
						this.children[i].destroy();
				}
				this.contains = function(point)
				{
					var tempmin = [this.min[0] - (this.max[0]-this.min[0])/2,this.min[1] - (this.max[1]-this.min[1])/2,]
					var tempmax = [this.max[0] + (this.max[0]-this.min[0])/2,this.max[1] + (this.max[1]-this.min[1])/2,]
					if(tempmin[0] < point[0] && tempmax[0] > point[0] && 
					tempmin[1] < point[1] && tempmax[1] > point[1])
						return true;
					return false;
				}
				
				this.update = function(campos)
				{
				
					if(this.contains(campos))
					{
						
						if(!this.isSplit())
						{
							if(this.depth < 9)
							{
								this.split();
							}
							
						}else
						{
						
						}
					}else
					{
						if(this.isSplit())
						{
							this.deSplit();
						}
					
					}
					for(var i=0; i < this.children.length; i++)
						this.children[i].update(campos);
				}
			}
			
			
			
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
				
				//this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(100,100,100,100),new THREE.MeshPhongMaterial());
				//this.mesh.material.color.r = .5;
				//this.mesh.material.color.g = .5;
				//this.mesh.material.color.b = .5;
				//this.geo = this.mesh.geometry;
				//this.getRoot().add(this.mesh);
				this.DisableTransform();
				this.BuildTerrain();
				this.quadtree = new QuadtreeNode([-10000,-10000],[10000,10000],this.getRoot());
				this.minSize = 32;
				this.quadtree.update([1,1]);
				this.quadtree.updateMesh();
				window.quadtree = this.quadtree;
				this.counter = 0;
			}
			this.ticking = function()
			{
				this.counter ++;
				if(this.counter == 30)
				{
					this.counter = 0;
					var x = _Editor.findcamera().position.x;
					var y = _Editor.findcamera().position.y;
					this.quadtree.update([x,y]);
					this.quadtree.updateMesh();
				}
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
			
			this.BuildTerrain = function()
			{
				for(var i =0; i < this.getRoot().children.length; i++)
					this.BuildTerrainInner(this.getRoot().children[i]);
			
			}
			
			this.BuildTerrainInner= function(mesh)
			{
				//if(!this.geo) return;
				
				
				var geo = mesh.geometry;
				var mx = mesh.position.x;
				var my = mesh.position.y;
				var normals = [];
				for(var i = 0; i < geo.vertices.length; i++)
				{
					
					var vertn = geo.vertices[i];
					var vertx0 = new THREE.Vector3(vertn.x-1,vertn.y,vertn.z);
					var verty0 = new THREE.Vector3(vertn.x,vertn.y-1,vertn.z);
					var vertx1 = new THREE.Vector3(vertn.x+1,vertn.y,vertn.z);
					var verty1 = new THREE.Vector3(vertn.x,vertn.y+1,vertn.z);
					var verts = [vertn,vertx0,verty0,vertx1,verty1];
					for(var k = 0; k < verts.length; k++)
					{
						var z = 0;
						var vert = verts[k];
						for(var j = 0; j < this.controlPoints.length; j++)
						{
							var cp = this.controlPoints[j];
							var dist = Math.sqrt(((vert.x + mx) - cp.x) * ((vert.x + mx) - cp.x) + ((vert.y + my) - cp.y) * ((vert.y + my) - cp.y));
							dist = Math.max(dist,0);
							z +=  Math.max(0, cp.z - Math.pow(cp.z * dist/cp.dist,cp.falloff));
						}
						vert.z = z;
					}
					//var n = vertn.clone().sub(vertx).cross(vertn.clone().sub(verty)).normalize();
					var n = new THREE.Vector3(vertx1.z - vertx0.z,verty1.z - verty0.z,2)
					normals.push(n);
				}
				
				for(var i =0; i < geo.faces.length; i++)
				{	
					geo.faces[i].vertexNormals[0] = normals[geo.faces[i].a];
					geo.faces[i].vertexNormals[1] = normals[geo.faces[i].b];
					geo.faces[i].vertexNormals[2] = normals[geo.faces[i].c];
					geo.faces[i].vertexNormals[3] = normals[geo.faces[i].d];
				
				}
				geo.verticesNeedUpdate = true;
				
				geo.normalsNeedUpdate = true
				
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