(function(){
		function terrain(childID, childSource, childName)
		{
			
			var self = this;
			var minTileSize = 50;
			var maxTileSize = 1500;
			var worldExtents = 100000;
			var tileres = 50;
			var SW = 0;
			var SE = 1;
			var NW = 3;
			var NE = 2;
			function TileCache()
			{
				this.tiles = {};
				
				this.mat = new THREE.MeshPhongMaterial();
							this.mat.color.r = .5;
							this.mat.color.g = .5;
							this.mat.color.b = .5;
							this.mat.transparent = true;
							this.mat.depthcheck = false;
							this.mat.wireframe = true;
							this.mat.fog = false;
							
				this.getMesh = function(res,size)
				{
					if(this.tiles[res])
						for(var i = 0; i < this.tiles[res].length; i++)
							if(!this.tiles[res][i].parent && this.tiles[res][i].size == size)
								return this.tiles[res][i];
					if(!this.tiles[res])		
						this.tiles[res] = [];
						
					var newtile = new THREE.Mesh(new THREE.PlaneGeometry(size,size,res,res),this.mat);
					newtile.geometry.dynamic = true;
					newtile.size = size;
					newtile.receiveShadow = true;
					newtile.castShadow = true;
					this.tiles[res].push(newtile);
					return newtile;
				}
			}
			self.TileCache = new TileCache();
			self.debug = new THREE.Mesh(new THREE.SphereGeometry(3));
			self.debug2 = new THREE.Mesh(new THREE.SphereGeometry(3));
			self.debug.material.fog = false;
			self.debug2.material.fog = false;
			function QuadtreeNode(min,max,root,depth,quad)
			{
				
				if(!depth)
					this.depth = 1;
				else
					this.depth = depth;
				this.children = [];
				this.mesh = null;
				this.min = min;
				this.max = max;
				this.quadrent = quad;
				
				this.THREENode = root;
				this.c = [this.min[0] + (this.max[0]-this.min[0])/2,this.min[1] + (this.max[1]-this.min[1])/2]
				this.split = function(removelist)
				{
					if(this.mesh)
					{
						//this.mesh.parent.remove(this.mesh);
						removelist.push(this.mesh);
						this.mesh = null;
					}
					
					var sw = new QuadtreeNode([this.min[0],this.min[1]],[this.c[0],this.c[1]],this.THREENode,this.depth+1,SW);
					var se = new QuadtreeNode([this.c[0],this.min[1]],[this.max[0],this.c[1]],this.THREENode,this.depth+1,SE);
					var nw = new QuadtreeNode([this.min[0],this.c[1]],[this.c[0],this.max[1]],this.THREENode,this.depth+1,NW);
					var ne = new QuadtreeNode([this.c[0],this.c[1]],[this.max[0],this.max[1]],this.THREENode,this.depth+1,NE);
					
					sw.parent = this;
					se.parent = this;
					nw.parent = this;
					ne.parent = this;
					
					this.children[SW] = sw;
					this.children[SE] = se;
					this.children[NW] = nw;
					this.children[NE] = ne;
					
					
				}
				this.SW = function()
				{
					return this.children[SW];
				}
				this.SE = function()
				{
					return this.children[SE];
				}
				this.NW = function()
				{
					return this.children[NW];
				}
				this.NE = function()
				{
					return this.children[NE];
				}
				this.child = function(quad)
				{
					return this.children[quad];
				}
				this.sibling = function(quad)
				{
					return this.parent.child(quad);
				}
				this.twodeep = function()
				{
					if(!this.isSplit())
						return false;
					
					for(var i = 0; i < 4; i++)
					{
						if(this.children[i].isSplit())
							return true;

					}				
					return false;					
				}
				this.balance = function(removelist)
				{
				
				
					
					var leaves = this.getLeavesB();
					while(leaves.length > 0)
					{
						var l = leaves.shift();
						
						var nn = l.NN();
						var sn = l.SN();
						var en = l.EN();
						var wn = l.WN();
						if(nn && nn.twodeep())
						{
							
							l.split(removelist);
								 leaves.splice(0,0,l.NW());
							 leaves.splice(0,0,l.NE());
							 leaves.splice(0,0,l.SW());
							 leaves.splice(0,0,l.SE());
							
						 }else if(sn && sn.twodeep())
						 {
							 l.split(removelist);
							 leaves.splice(0,0,l.NW());
							 leaves.splice(0,0,l.NE());
							 leaves.splice(0,0,l.SW());
							 leaves.splice(0,0,l.SE());
							
						 }
						 else if(en && en.twodeep())
						{
							l.split(removelist);
								 leaves.splice(0,0,l.NW());
							 leaves.splice(0,0,l.NE());
							 leaves.splice(0,0,l.SW());
							 leaves.splice(0,0,l.SE());
							
						}
						 
						else if(wn && wn.twodeep())
						{
							l.split(removelist);
								 leaves.splice(0,0,l.NW());
							 leaves.splice(0,0,l.NE());
							 leaves.splice(0,0,l.SW());
							 leaves.splice(0,0,l.SE());
							
						}
						
						
						
						
						
					}
				}
				
				this.northNeighbor = function()
				{
					var p = this;
					while(p.quadrent != SW && p.quadrent != SE)
					{
						if(!p.parent) return null;
						p = p.parent;
					}
					var walk = -1;
					if(p.quadrent == SW)
					{
						p = p.sibling(NW);
						walk = SE;
					}
					else if(p.quadrent == SE)
					{
						p = p.sibling(NE);
						walk = SW;
					}
					while(p && p.depth < this.depth && p.isSplit())
					{
						if(p.c[0] > this.c[0])
							p = p.child(SW);
						if(p.c[0] < this.c[0])
							p = p.child(SE);	
					}
						
					return p;		
						
				}
				this.NN = this.northNeighbor;
				
				this.southNeighbor = function()
				{
					var p = this;
					while(p.quadrent != NW && p.quadrent != NE)
					{
						if(!p.parent) return null;
						p = p.parent;
					}
					var walk = -1;
					if(p.quadrent == NW)
					{
						p = p.sibling(SW);
						walk = NE;
					}
					else if(p.quadrent == NE)
					{
						p = p.sibling(SE);
						walk = NW;
					}
					while(p && p.depth < this.depth && p.isSplit())
					{
						if(p.c[0] > this.c[0])
							p = p.child(NW);
						if(p.c[0] < this.c[0])
							p = p.child(NE);	
					}
						
					return p;		
						
				}
				this.SN = this.southNeighbor;
				
				this.eastNeighbor = function()
				{
					var p = this;
					while(p.quadrent != NW && p.quadrent != SW)
					{
						if(!p.parent) return null;
						p = p.parent;
					}
					var walk = -1;
					if(p.quadrent == NW)
					{
						p = p.sibling(NE);
						walk = SW;
					}
					else if(p.quadrent == SW)
					{
						p = p.sibling(SE);
						walk = NW;
					}
					while(p && p.depth < this.depth && p.isSplit())
					{
						if(p.c[1] > this.c[1])
							p = p.child(SW);
						if(p.c[1] < this.c[1])
							p = p.child(NW);	
					}
					return p;		
						
				}
				this.EN = this.eastNeighbor;
				
				this.westNeighbor = function()
				{
					var p = this;
					while(p.quadrent != NE && p.quadrent != SE)
					{
						if(!p.parent) return null;
						p = p.parent;
					}
					var walk = -1;
					if(p.quadrent == NE)
					{
						p = p.sibling(NW);
						walk = NE;
					}
					else if(p.quadrent == SE)
					{
						p = p.sibling(SW);
						walk = SE;
					}
					while(p && p.depth < this.depth && p.isSplit())
					{
						if(p.c[1] > this.c[1])
							p = p.child(SE);
						if(p.c[1] < this.c[1])
							p = p.child(NE);	
					}
					return p;		
						
				}
				this.WN = this.westNeighbor;
				
				this.getLeavesB = function(list)
				{
					if(!list)
						list = [];
				
					
					if(!this.isSplit())
						list.push(this);
					else
					{
						for(var i = 0; i < this.children.length; i ++)
						{
							this.children[i].getLeaves(list);
						}
						this.children[0].getLeaves(list);
					}
					
					return list;
				}
				this.getLeaves = function(list)
				{
					if(!list)
						list = [];
				
					
					if(!this.isSplit())
						list.push(this);
					else
					{
						for(var i = 0; i < this.children.length; i ++)
						{
							this.children[i].getLeaves(list);
						}
						
					}
					
					return list;
				}
				
				this.updateMesh = function()
				{
					if(!this.isSplit())
					{
						if(!this.mesh)
						{
							
							
							if(this.max[0] - this.min[0] < maxTileSize)
							{
								var res = tileres;
								this.mesh = self.TileCache.getMesh(res,this.max[0] - this.min[0]);
								if(self.removelist.indexOf(this.mesh)>-1)
								self.removelist.splice(self.removelist.indexOf(this.mesh),1);
								this.mesh.position.x = this.c[0];
								this.mesh.position.y = this.c[1];
								this.mesh.position.z = 1;
								self.BuildTerrainInner(this.mesh);
								this.THREENode.add(this.mesh,true);
								this.mesh.updateMatrixWorld(true);
							}
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
				this.deSplit = function(removelist)
				{
					for(var i=0; i < this.children.length; i++)
						this.children[i].destroy(removelist);
					this.children = [];
				}
				this.destroy = function(removelist)
				{
					if(this.mesh)
					{
						//this.mesh.parent.remove(this.mesh);
						removelist.push(this.mesh);
						this.mesh = null;
					}
					for(var i=0; i < this.children.length; i++)
						this.children[i].destroy(removelist);
				}
				this.contains = function(point)
				{
					
					var tempmin = this.min;
					var tempmax = this.max;
					if(tempmin[0] < point[0] && tempmax[0] > point[0] && 
					tempmin[1] < point[1] && tempmax[1] > point[1])
						return true;
					return false;
				}
				this.loosecontains = function(point)
				{
					
					var tempmin = [this.min[0] - (this.max[0] - this.min[0])/1 , this.min[1] - (this.max[1] - this.min[1])/1]
					var tempmax = [this.max[0] + (this.max[0] - this.min[0])/1 , this.max[1] + (this.max[1] - this.min[1])/1]
					if(tempmin[0] < point[0] && tempmax[0] > point[0] && 
					tempmin[1] < point[1] && tempmax[1] > point[1])
						return true;
					return false;
				}
				this.containing = function(point)
				{
					if(this.contains(point) && !this.isSplit())
						return this;
					if(this.isSplit())
					{
						if(this.NW().contains(point))
							return this.NW().containing(point);
						if(this.NE().contains(point))
							return this.NE().containing(point);
						if(this.SW().contains(point))
							return this.SW().containing(point);
						if(this.SE().contains(point))
							return this.SE().containing(point);							
					
					}
					return null;
				}
				this.walk = function(cb)
				{
					cb(this);
					for(var i =0 ; i < this.children.length; i++)
					{
						this.children[i].walk(cb);
					
					}
					
				}
				this.getBottom = function(list)
				{
					if(!list)
						list = [];
					this.walk(function(node)
					{
						if(node.bottom)
							list.push(node);
					
					});
					return list;	
				}
				this.update = function(campos,removelist)
				{
				
					if(this.contains(campos))
					{
						
						if(!this.isSplit())
						{
							if(this.max[0]-this.min[0] > minTileSize)
							{
								this.split(removelist);
								
								for(var i=0; i < this.children.length; i++)
									if(this.children[i].max[0]-this.children[i].min[0] < minTileSize)
										this.children[i].bottom = true;;
				
				
							}else
							{
								
							}
							
						}else
						{
						
						}
					}else
					{
						if(this.isSplit())
						{
							this.deSplit(removelist);
						}
					
					}
					for(var i=0; i < this.children.length; i++)
						this.children[i].update(campos,removelist);
				}
			}
			
			
			
			function ControlPoint(x,y,z,d,f)
			{
			    
				this.x = x || 0;
				this.y = y || 0;
				this.z = z || 0;
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
				
				
				//this.controlPoints.push(new ControlPoint(0,0,0,1,1));
				
				
				}
				
				//this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(100,100,100,100),new THREE.MeshPhongMaterial());
				//this.mesh.material.color.r = .5;
				//this.mesh.material.color.g = .5;
				//this.mesh.material.color.b = .5;
				//this.geo = this.mesh.geometry;
				//this.getRoot().add(this.mesh);
				this.DisableTransform();
				this.BuildTerrain();
				this.quadtree = new QuadtreeNode([-worldExtents,-worldExtents],[worldExtents,worldExtents],this.getRoot());
			
				this.minSize = 32;
				this.quadtree.update([1,1],[]);
				//this.quadtree.balance();
				this.quadtree.updateMesh();
				window.terrain = self;
				this.counter = 0;
			}
			this.Debug = function(pt)
			{
				this.debug.position.x = pt.c[0];
				this.debug.position.y = pt.c[1];
				this.debug.updateMatrixWorld();
			}
			this.removelist = [];
			this.ticking = function()
			{
				this.counter ++;
				if(this.counter == 30)
				{
					this.counter = 0;
					var x = _Editor.findcamera().position.x;
					var y = _Editor.findcamera().position.y;
					 
					 if(this.containing != this.quadtree.containing([x,y]))
					 {
						
						var cache = {};
						var oldleaves = this.quadtree.getLeaves();
						for(var i = 0; i <  oldleaves.length; i++)
						{
							var c = oldleaves[i].c;
							if(!cache[c[0]]) cache[c[0]] = {};
							
							cache[c[0]][c[1]] = oldleaves[i].mesh;
						}
						self.removelist.forEach(function(e,i)
								{
									if(e && e.parent)
										e.parent.remove(e);
								})
								self.removelist = []
						
						this.quadtree.update([x,y],this.removelist);
						
						this.containing = this.quadtree.containing([x,y]);
						this.quadtree.balance(this.removelist);
						
						var nodes = this.quadtree.getBottom();
						
						// for(var i = 0; i < nodes.length; i ++)
						// {
							// nodes[i].parent.parent.NN().balance();
							// nodes[i].parent.parent.SN().balance();
							// nodes[i].parent.parent.EN().balance();
							// nodes[i].parent.parent.WN().balance();
							// nodes[i].parent.parent.balance();
						// }
						
						var newleaves = this.quadtree.getLeaves();
						var needRebuild = [];
						for(var i = 0; i <  newleaves.length; i++)
						{
							var c = newleaves[i].c;
							if(cache[c[0]] && cache[c[0]][c[1]])
							{
								newleaves[i].mesh = cache[c[0]][c[1]];
								if(this.removelist.indexOf(newleaves[i].mesh) > -1)
									this.removelist.splice(this.removelist.indexOf(newleaves[i].mesh),1);
								delete cache[c[0]][c[1]];
								if(!newleaves[i].mesh.parent)
								newleaves[i].THREENode.add(newleaves[i].mesh,true);
							}else
								needRebuild.push(newleaves[i]);
								
						}
						console.log('Rebuilding Terrain Tiles: ' +needRebuild.length);
						
						var rebuild = function()
						{
							if (needRebuild.length > 0)
							{
								var tile = needRebuild.shift();
								tile.updateMesh();
								self.buildTimeout = window.setTimeout(self.rebuild,3);
							
							}else
							{
								self.removelist.forEach(function(e,i)
								{
									if(e && e.parent)
										e.parent.remove(e);
								})
								self.removelist = []
							}
						}.bind(self);
						self.rebuild = rebuild;
						if(self.buildTimeout)
							window.clearTimeout(self.buildTimeout);
						self.buildTimeout = window.setTimeout(self.rebuild,3);
						//this.quadtree.balance();
						//this.quadtree.updateMesh();
					}
					
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
				//return;
				
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
						// for(var j = 0; j < this.controlPoints.length; j++)
						// {
							// var cp = this.controlPoints[j];
							// var dist = Math.sqrt(((vert.x + mx) - cp.x) * ((vert.x + mx) - cp.x) + ((vert.y + my) - cp.y) * ((vert.y + my) - cp.y));
							// dist = Math.max(dist,0);
							// z +=  Math.max(0, cp.z - Math.pow(cp.z * dist/cp.dist,cp.falloff));
						// }
						z = Math.sin((mx + vert.x)/10) * 10;
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