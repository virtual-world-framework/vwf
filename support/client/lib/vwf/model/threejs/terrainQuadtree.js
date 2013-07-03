			var tileres = 32;
			var SW = 0;
			var SE = 1;
			var NW = 3;
			var NE = 2;
			var self;
 var perfectstitch = false;
 
function quadtreesetSelf(s) { self = s};
function quadtreesetRes(s) {tileres = s;}
function QuadtreeNode(min,max,root,depth,quad,minsize,maxsize)
			{
				
				
				this.minTileSize = minsize;
				this.maxTileSize = maxsize;
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
						if(!l) continue;
						var nn = l.NN();
						var sn = l.SN();
						var en = l.EN();
						var wn = l.WN();
						if((nn && nn.twodeep() )||(sn && sn.twodeep())||(en && en.twodeep())||(wn && wn.twodeep()))
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
						else if(p.c[0] < this.c[0])
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
						else if(p.c[0] < this.c[0])
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
						else if(p.c[1] < this.c[1])
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
						else if(p.c[1] < this.c[1])
							p = p.child(NE);	
					}
					return p;		
						
				}
				this.WN = this.westNeighbor;
				
				this.northEastNeighbor = function()
				{
					var nn = this.NN();
					if(nn)
					return nn.EN();
					return null;
						
				}
				this.NEN = this.northEastNeighbor;
				
				this.southEastNeighbor = function()
				{
					var sn = this.SN();
					if(sn)
					return sn.EN();
					return null;
						
				}
				this.SEN = this.southEastNeighbor;
				
				this.northWestNeighbor = function()
				{
					var nn = this.NN();
					if(nn)
					return nn.WN();
					return null;
						
				}
				this.NWN = this.northWestNeighbor;
				
				this.southWestNeighbor = function()
				{
					var sn = this.SN();
					if(sn)
					return sn.WN();
					return null;
						
				}
				this.SWN = this.southWestNeighbor;
				
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
							this.children[i].getLeavesB(list);
						}
						this.children[0].getLeavesB(list);
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
				this.sideNeeded = function()
				{
					var nn = this.NN();
					var sn = this.SN();
					var wn = this.WN();
					var en = this.EN();
					
					var lowresside = 0;
					if(nn && nn.depth < this.depth)
						nn = true;
					else
						nn = false;
						
					if(sn && sn.depth < this.depth)
						sn = true;
					else
						sn = false;
					if(en && en.depth < this.depth)
						en = true;
					else
						en = false;
					if(wn && wn.depth < this.depth)
						wn = true;
					else
						wn = false;
						
					if(!nn && !sn && !wn &&!en)
						return 0;
					if(nn && !sn && !wn &&!en)
						return 1;
					if(!nn && sn && !wn &&!en)
						return 2;
					if(!nn && !sn && wn &&!en)
						return 3;
					if(!nn && !sn && !wn &&en)
						return 4;		
					
					if(nn && !sn && !wn &&en)
						return 5;
					if(!nn && sn && !wn &&en)
						return 6;
					if(nn && !sn && wn &&!en)
						return 7;
					if(!nn && sn && wn &&!en)
						return 8;
						
					return 0;
				}
				this.meshNeeded = function(i)
				{
					if(i == 0) return 0;
					if(i<=4) return 1;
					if(i<=8) return 2;
				
				}
				this.getRotation = function(i)
				{
					
					if(i ==0) return 0;
					if(i== 1) return -Math.PI/2;
					if(i== 2) return Math.PI/2;
					if(i== 4) return Math.PI;
					if(i== 7) return -Math.PI/2;
					if(i== 5) return -Math.PI;
					if(i== 6) return Math.PI/2;
					return 0;
				}
				this.debug = function(r,g,b)
				{
					if(this.mesh)
					{
						this.mesh.material.uniforms.debugColor.value.r = r;
						this.mesh.material.uniforms.debugColor.value.g = g;
						this.mesh.material.uniforms.debugColor.value.b = b;
					}
				}
				this.updateMesh = function(cb,force)
				{
					var rebuilt = false;
					if(!this.isSplit())
					{
						//if I'm a leaf node, but the side I need (for sticthing) is not the one I have, or I have no mesh (because I'm new) generate my mesh
						var neededSide = this.sideNeeded();
						
						if(this.mesh && (neededSide != this.side && perfectstitch == false) )
						{
							this.side = neededSide;
							this.mesh.material.uniforms.side.value = this.side;
							
							
							cb(this,force);
							return;
						}
						else if(!this.mesh || (neededSide != this.side) || force )
						{
							//if were just switching sides, backup the old mesh
							//it will be shown when the new one is ready
							this.badsidemesh = null;
							if((this.mesh && neededSide != this.side && perfectstitch == true))
							{
								this.debug(1,0,0);
								this.badsidemesh = this.mesh;
								this.mesh = null;
							}
							
							//if I'm a leaf, and I'm small enough
							//note, we should never arrive here for meshes that don't need an update.
							if(this.max[0] - this.min[0] < this.maxTileSize)
							{
								if(!force)
								{
									var res = tileres;
									
									var scale = this.max[0] - this.min[0];
									
									this.side = neededSide;
									//get the right mesh off the cache
									
									if(perfectstitch == true)
										this.mesh = self.TileCache.getMesh(res,this.meshNeeded(this.side));
									else
										this.mesh = self.TileCache.getMesh(res,0);
									if(perfectstitch == false)
										this.mesh.material.uniforms.side.value = this.side;	
									else
										this.mesh.material.uniforms.side.value = -1;	
									//scale and rotate to fit
									this.mesh.scale.x = scale/100;
									this.mesh.scale.y = scale/100;
									this.mesh.scale.z = 1;//scale/100;
									if(perfectstitch == true)
										this.mesh.rotation.z = this.getRotation(this.side);
									this.debug(0,0,0);
									this.mesh.quadnode = this;
									if(self.removelist.indexOf(this.mesh)>-1)
									self.removelist.splice(self.removelist.indexOf(this.mesh),1);
									
									this.mesh.position.x = this.c[0];
									this.mesh.position.y = this.c[1];
									this.mesh.position.z = 1;
									
									//go ahead and add it to the world
									rebuilt = true;	
									this.mesh.updateMatrixWorld(true);
									this.THREENode.add(this.mesh,true);	
									this.mesh.visible = false;
									this.mesh.waitingForRebuild = true;
									self.terrainGenerator.updateMaterial(this.mesh);
								}
									
								// displace the mesh
								// the callback will indicate if this mesh was canceled before the thread returned with the updated mesh
								self.BuildTerrainInner(this.mesh,(this.max[0] - this.min[0])/tileres,function(cancel)
								{
									
									
									if(!cancel)
									{
										this.debug(.5,.5,.5);
										this.mesh.waitingForRebuild = false;
										//so, the mesh has been updated, go ahead and make it visible
										this.mesh.visible = true;
										//if there is a badside mesh, then this is an instant swap, and badside mesh can be removed
										if(this.badsidemesh)
										{
											this.badsidemesh.parent.remove(this.badsidemesh);
											this.badsidemesh.quadnode = null;
											self.TileCache.returnMesh(this.badsidemesh);
											this.badsidemesh = null;
											
										}
										this.mesh.geometry.dirtyMesh = true;
										this.mesh.geometry.BoundingSphere = null;
										this.mesh.geometry.BoundingBox = null;
										this.mesh.geometry.RayTraceAccelerationStructure = null;
										//go head and callback into the rebuild look to deal with fadein/out stuff, and dispatch the next tile update
										cb(this,force);
									}else
									{
										//so, we got canceled before the worker returned
										//the worker will finish, but the callback will not fire when it does, and the data will just be lost
										if(this.badsidemesh)
										{
											//if we were doing a side swap (for seam stitching) just forgot it, hide the new tile, link back to the old
											this.mesh.parent.remove(this.mesh);
											self.TileCache.returnMesh(this.mesh);
											this.mesh.quadnode = null;
											this.mesh = this.badsidemesh;
											this.badsidemesh = null;
											
										}
									}
								}.bind(this));
								
								//prevents CB from happening immediately. very important
								return;
							}
						}
					}else
					{
						//if I'm not split (not a leaf) but have a mesh, that mesh needs to be removed
						//changes in the way updates are dispatched means we should never execute here
						if(this.mesh  )
						{
							this.mesh.quadnode = null;
							if(this.mesh.parent)
							this.mesh.parent.remove(this.mesh);
							self.TileCache.returnMesh(this.mesh);
							this.mesh.quadnode = null;
							this.mesh = null;
						}
					}
					
					//go ahead and callback (should not get here)
					if(cb)
						cb(rebuilt,force);
				}
				this.cleanup = function(removelist)
				{
					this.walk(function(n)
					{
						if(n.setForDesplit)
						{
							
							for(var i=0; i < n.children.length; i++)
							n.children[i].destroy(removelist);
							n.children = [];
							n._issplit =  false;
							delete n.setForDesplit;
						}
					});
				}
				this.isSplit = function() {if(this.setForDesplit) return false; return this.children.length > 0}
				this.split = function(removelist)
				{
					
					if(this.setForDesplit)
					{
						delete this.setForDesplit;
						
					}
					if(this.isSplit())
						return;
					if(this.mesh)
					{
						//this.mesh.parent.remove(this.mesh);
						//removelist.push(this.mesh);
						this.backupmesh = this.mesh;
						this.mesh = null;
						
					}
					
					var sw = new QuadtreeNode([this.min[0],this.min[1]],[this.c[0],this.c[1]],this.THREENode,this.depth+1,SW,this.minTileSize,this.maxTileSize);
					var se = new QuadtreeNode([this.c[0],this.min[1]],[this.max[0],this.c[1]],this.THREENode,this.depth+1,SE,this.minTileSize,this.maxTileSize);
					var nw = new QuadtreeNode([this.min[0],this.c[1]],[this.c[0],this.max[1]],this.THREENode,this.depth+1,NW,this.minTileSize,this.maxTileSize);
					var ne = new QuadtreeNode([this.c[0],this.c[1]],[this.max[0],this.max[1]],this.THREENode,this.depth+1,NE,this.minTileSize,this.maxTileSize);
					
					sw.parent = this;
					se.parent = this;
					nw.parent = this;
					ne.parent = this;
					
					this.children[SW] = sw;
					this.children[SE] = se;
					this.children[NW] = nw;
					this.children[NE] = ne;
					
					this._issplit =  true;
				}
				this.updateMinMax = function(min,max)
				{
					this.minTileSize = min;
					this.maxTileSize = max;
					for(var i = 0; i < this.children.length; i++)
						this.children[i].updateMinMax(min,max);
				}
				
				this.deSplit = function(removelist)
				{
					//this.walk(function(n)
					//{
						
					
					//});
					
					for(var i=0; i < this.children.length; i++)
						this.children[i].deSplit(removelist);
					this.setForDesplit = true;
				}
				this.destroy = function(removelist)
				{
					if(this.mesh)
					{
						//this.mesh.parent.remove(this.mesh);
						removelist.push(this.mesh);
						if(this.backupmesh)
						removelist.push(this.backupmesh);
						this.oldmesh = this.mesh;
						this.mesh = null;
					}
					for(var i=0; i < this.children.length; i++)
						this.children[i].destroy(removelist);
				}
				this.contains = function(point)
				{
					
					var tempmin = this.min;
					var tempmax = this.max;
					if(tempmin[0] <= point[0] && tempmax[0] > point[0] && 
					tempmin[1] <= point[1] && tempmax[1] > point[1])
						return true;
					return false;
				}
				this.loosecontains = function(point)
				{
					
					var tempmin = [this.min[0] - (this.max[0] - this.min[0])/2 , this.min[1] - (this.max[1] - this.min[1])/2]
					var tempmax = [this.max[0] + (this.max[0] - this.min[0])/2 , this.max[1] + (this.max[1] - this.min[1])/2]
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
					if(this.isSplit())
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
				//walk down the graph, unspliting nodes that to not contain target points, and spliting nodes that do
				this.update = function(campos,removelist)
				{
					var cont = false
					for(var i =0; i < campos.length; i++)
					{
						cont = cont || this.contains(campos[i]);
					}
					if(cont)
					{
						
						if(!this.isSplit())
						{
							if(this.max[0]-this.min[0] > this.minTileSize)
							{
								this.split(removelist);
								
								for(var i=0; i < this.children.length; i++)
									if(this.children[i].max[0]-this.children[i].min[0] < this.minTileSize)
										this.children[i].bottom = true;;
				
				
							}else
							{
								
							}
							
						}else
						{
							if(this.max[0]-this.min[0] < this.minTileSize)
							{
								this.deSplit(removelist);
							}
						}
					}else
					{
						if(this.isSplit())
						{
							this.deSplit(removelist);
							
						}
					
					}
					if(this.isSplit())
					for(var i=0; i < this.children.length; i++)
						this.children[i].update(campos,removelist);
				}
			}