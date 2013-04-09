var maxObjects = 1; 
var maxDepth = 16;
var batchAtLevel = 4;
var drawSceneManagerRegions = false;

function SceneManager(scene)
{
	
}

function GetAllLeafMeshes(threeObject,list)
{
	if(threeObject instanceof THREE.Mesh)
	{
		list.push(threeObject);
	}
	if(threeObject.children)
	{
		for(var i=0; i < threeObject.children.length; i++)
		{
			GetAllLeafMeshes(threeObject.children[i],list);
		}               
	}     
}
SceneManager.prototype.rebuild = function(mo,md)
{
	
	maxObjects = mo;
	maxDepth = md;
	var children = this.root.getChildren();
	this.root.deinitialize();
	this.min = [-130,-130,-120];
	this.max = [130,130,140];
	this.root = new SceneManagerRegion(this.min,this.max,0,this.scene,0);
	for(var i =0; i < children.length; i++)
		this.root.addChild(children[i]);
}
SceneManager.prototype.show = function()
{
	drawSceneManagerRegions = true;
	this.rebuild(maxObjects,maxDepth)
}
SceneManager.prototype.hide = function()
{
	drawSceneManagerRegions = false;
	this.rebuild(maxObjects,maxDepth)
}
SceneManager.prototype.addToRoot = function(child)
{
	this.specialCaseObjects.push(child);
}
SceneManager.prototype.CPUPick = function(o,d,opts)
{
	//console.profile("PickProfile");

	var hitlist = this.root.CPUPick(o,d,opts || new THREE.CPUPickOptions());
	
	for(var i = 0; i < this.specialCaseObjects.length; i++)
	{
		var childhits = this.specialCaseObjects[i].CPUPick(o,d,opts|| new THREE.CPUPickOptions());
		if(childhits)
			hitlist = hitlist.concat(childhits);
	}
	
	//sort the hits by priority and distance
	hitlist = hitlist.sort(function(a,b){
		var ret = b.priority - a.priority;
		if(ret == 0)
			ret = a.distance - b.distance;
		return ret;
	
	});
	// Enter name of script here
	//console.profileEnd();
	return hitlist[0];
}
SceneManager.prototype.FrustrumCast = function(f,opts)
{
	//console.profile("PickProfile");

	var hitlist = this.root.FrustrumCast(f,opts || new THREE.CPUPickOptions());
	for(var i = 0; i < this.specialCaseObjects.length; i++)
	{
		var childhits = this.specialCaseObjects[i].FrustrumCast(f,opts || new THREE.CPUPickOptions());
		if(childhits)
			hitlist = hitlist.concat(childhits);
	}
	
	return hitlist;
}	
SceneManager.prototype.initialize = function(scene)
{
	this.min = [-130,-130,-120];
	this.max = [130,130,140];
	this.BatchManagers = [];
	this.specialCaseObjects = [];
	THREE.Object3D.prototype.add_internal = THREE.Object3D.prototype.add;
	THREE.Object3D.prototype.add = function(child,SceneManagerIgnore)
	{
		
		this.add_internal(child);
		if(SceneManagerIgnore)
			return;
		
		var list = [];
		GetAllLeafMeshes(child,list);
		for(var i =0; i < list.length; i++)
		{
			_SceneManager.addChild(list[i]);
		}
		
		
	}
	THREE.Object3D.prototype.remove_internal = THREE.Object3D.prototype.remove;
	THREE.Object3D.prototype.remove = function(child,SceneManagerIgnore)
	{
		
		var meshes = [];
		
		this.remove_internal(child);
		
		if(SceneManagerIgnore)
			return;
		
		GetAllLeafMeshes(child,meshes);		
		for(var i =0; i < meshes.length; i++)
		{
			_SceneManager.removeChild(meshes[i]);
		}
	}
	THREE.Object3D.prototype.sceneManagerUpdate = function()
	{
		for(var i =0; i <  this.children.length; i++)
		{
			this.children[i].sceneManagerUpdate();
		}
		
	}
	THREE.Object3D.prototype.sceneManagerDelete = function()
	{
		for(var i =0; i <  this.children.length; i++)
		{
			this.children[i].sceneManagerDelete();
		}
		
	}
	THREE.Object3D.prototype.sceneManagerIgnore = function()
	{
		for(var i =0; i <  this.children.length; i++)
		{
			this.children[i].sceneManagerIgnore();
		}
		
	}
	THREE.Mesh.prototype.sceneManagerIgnore = function()
	{
		_SceneManager.removeChild(this);
		this.SceneManagerIgnore = true;
	}
	this.root = new SceneManagerRegion(this.min,this.max,0,scene,0);
	this.scene = scene;
}
SceneManager.prototype.addChild = function(c)
{
	this.root.addChild(c);
}
SceneManager.prototype.removeChild = function(c)
{
	this.root.removeChild(c);
}
function SceneManagerRegion(min, max, depth,scene,order)
{
	
	this.min = min;
	this.max = max;
	this.childCount = 0;
	this.c = [(this.max[0]+this.min[0])/2,(this.max[1]+this.min[1])/2,(this.max[2]+this.min[2])/2];
	this.childRegions = [];
	this.childObjects = [];
	this.depth = depth;
	this.scene = scene;
	this.order = order;
	if(drawSceneManagerRegions)
	{
		this.mesh = new THREE.Mesh(new THREE.CubeGeometry(this.max[0]-this.min[0],this.max[0]-this.min[0],this.max[0]-this.min[0]),new THREE.MeshBasicMaterial(0xFF0000));
		this.mesh.material.wireframe = true;
		this.mesh.material.depthTest = false;
		this.mesh.material.depthWrite = false;
		this.mesh.material.transparent = true;
		this.mesh.material.color.r = (this.depth/maxDepth) * 2;
		this.mesh.material.color.g = 0;
		this.mesh.material.color.b = 0;
		this.mesh.position.x = this.c[0];
		this.mesh.position.y = this.c[1];
		this.mesh.position.z = this.c[2];
		this.mesh.InvisibleToCPUPick =  true;
		this.mesh.renderDepth = this.depth * 8 + this.order;
		this.scene.add(this.mesh,true);
	}
	if(this.depth <= batchAtLevel)
	{
		this.RenderBatchManager = new THREE.RenderBatchManager(scene,GUID());
		_SceneManager.BatchManagers.push(this.RenderBatchManager);
	}
}
SceneManagerRegion.prototype.deinitialize = function()
{
	if(this.mesh)
		this.mesh.parent.remove(this.mesh,true);
	for(var i=0; i < this.childRegions.length; i++)
	{
		this.childRegions[i].deinitialize();
	}
	if(this.RenderBatchManager)
	{
		_SceneManager.BatchManagers.splice(_SceneManager.BatchManagers.indexOf(this.RenderBatchManager),1);
		this.RenderBatchManager.deinitialize();
	}
}


SceneManagerRegion.prototype.getChildren = function()
{
	var count = [];
	for(var i=0; i < this.childRegions.length; i++)
	{
		count = count.concat(this.childRegions[i].getChildren());
	}
	return count.concat(this.childObjects);
}

SceneManagerRegion.prototype.getChildCount = function()
{
	//can we keep track without the recursive search?
	//return this.childCount;
	
	var count = 0;
	for(var i=0; i < this.childRegions.length; i++)
	{
		count += this.childRegions[i].getChildCount();
	}
	return count + this.childObjects.length;
}
SceneManagerRegion.prototype.removeChild= function(child)
{
	var removed = false;
	if(this.childObjects.indexOf(child) != -1)
	{
		removed = true;
		this.childCount--;
		this.childObjects.splice(this.childObjects.indexOf(child),1);
		
		if(this.depth <= batchAtLevel)
		{
			this.RenderBatchManager.remove(child);
		}
		
	}
	else
	{
		for(var i=0; i < this.childRegions.length; i++)
		{
			removed = this.childRegions[i].removeChild(child);
			if(removed)
			{
				this.childCount--;
				break;	
			}
		}
	}
	if(this.getChildCount() <= maxObjects)
			this.desplit();
	return 	removed;	
}
SceneManagerRegion.prototype.desplit = function()
{
	var children = this.getChildren();
	for(var i=0; i < this.childRegions.length; i++)
	{
		this.childRegions[i].deinitialize();
	}
	this.childObjects = children;
	for(var j = 0; j < children.length; j++)
		children[j].sceneManagerNode = this;
	
	this.childRegions = [];
}
SceneManagerRegion.prototype.completelyContains = function(object)
{
	
	if(!object.tempbounds) 
	{
		object.updateMatrixWorld();
		object.tempbounds = object.GetBoundingBox().transformBy(object.getModelMatrix());
	}
	var box = object.tempbounds;
	if(box.min[0] > this.min[0] && box.max[0] < this.max[0])
	if(box.min[1] > this.min[1] && box.max[1] < this.max[1])
	if(box.min[2] > this.min[2] && box.max[2] < this.max[2])
		return true;
	return false;	
}
SceneManagerRegion.prototype.addChild= function(child)
{
	//sort the children down into sub nodes
	var added = this.distributeObject(child);
	
	//
	if(this.depth == batchAtLevel && added)
	{
		this.RenderBatchManager.add(child);
	}
	if(this.depth >= 0 && this.depth <= batchAtLevel && !added)
	{
		this.RenderBatchManager.add(child);
	}
}
SceneManagerRegion.prototype.distributeObject = function(object)
{
	var added = false;
	if(this.childObjects.length + 1 > maxObjects && this.depth < maxDepth && this.childRegions.length == 0)
		this.split();
	if(this.childRegions)
	{
		for(var i = 0; i < this.childRegions.length; i++)
		{
			if(this.childRegions[i].completelyContains(object))
			{
				this.childRegions[i].addChild(object);
				added = true;
				//it either goes in me or my children
				this.childCount++;
				break;
			}
		}
	}
	if(!added)
	{
		if(this.childObjects.indexOf(object) == -1)
		{
			this.childObjects.push(object);
			//it either goes in me or my children
				this.childCount++;
			if(this.mesh)
			{
				this.mesh.material.color.g = this.childObjects.length / maxObjects;
				this.mesh.renderDepth = this.depth * 8 + this.order + this.childObjects.length;
			}
			
			object.sceneManagerNode = this;
			
			object.sceneManagerUpdate = function()
			{
				if(this.SceneManagerIgnore)
					return;
					
				this.updateMatrixWorld();
				this.tempbounds = object.GetBoundingBox().transformBy(this.getModelMatrix());
				this.sceneManagerNode.updateObject(this);
			}.bind(object)
			object.sceneManagerDelete = function()
			{
				this.sceneManagerNode.removeChild(this);
			}.bind(object)
		}
	}
	return added;
}
SceneManagerRegion.prototype.updateObject = function(object)
{
	
	if(this.completelyContains(object))
	{
		if(this.childObjects.indexOf(object) != -1)
			this.removeChild(object)
		
			this.addChild(object);
				
	}
	else
	{
		//if dont have parent, then at top level and cannot toss up
		if(this.parent)
		{
			this.removeChild(object);
			this.parent.updateObject(object);
		}
	}
}
SceneManagerRegion.prototype.split = function()
{
	
	var v0 = [this.min[0],this.min[1],this.min[2]];
	var v0 = [this.min[0],this.min[1],this.min[2]];
	var v1 = [this.min[0],this.min[1],this.max[2]];
	var v2 = [this.min[0],this.max[1],this.min[2]];
	var v3 = [this.min[0],this.max[1],this.max[2]];
	var v4 = [this.max[0],this.min[1],this.min[2]];
	var v5 = [this.max[0],this.min[1],this.max[2]];
	var v6 = [this.max[0],this.max[1],this.min[2]];
	var v7 = [this.max[0],this.max[1],this.max[2]];
	
	this.c = [(this.max[0]+this.min[0])/2,(this.max[1]+this.min[1])/2,(this.max[2]+this.min[2])/2];
	
	this.r = MATH.distanceVec3(this.c,this.max);
	
	var m1 = [this.c[0],this.min[1],this.min[2]];
	var m2 = [this.max[0],this.c[1],this.c[2]];
	var m3 = [this.min[0],this.c[1],this.min[2]];
	var m4 = [this.c[0],this.max[1],this.c[2]];
	var m5 = [this.c[0],this.c[1],this.min[2]];
	var m6 = [this.max[0],this.max[1],this.c[2]];
	var m7 = [this.min[0],this.min[1],this.c[2]];
	var m8 = [this.c[0],this.c[1],this.max[2]];
	var m9 = [this.c[0],this.min[1],this.c[2]];
	var m10 = [this.max[0],this.c[1],this.max[2]];
	var m11 = [this.min[0],this.c[1],this.c[2]];
	var m12 = [this.c[0],this.max[1],this.max[2]];
	
	this.childRegions[0] = new SceneManagerRegion(v0,this.c,this.depth+1,this.scene,0);
	this.childRegions[1] = new SceneManagerRegion(m1,m2,this.depth+1,this.scene,1);
	this.childRegions[2] = new SceneManagerRegion(m3,m4,this.depth+1,this.scene,2);
	this.childRegions[3] = new SceneManagerRegion(m5,m6,this.depth+1,this.scene,3);
	this.childRegions[4] = new SceneManagerRegion(m7,m8,this.depth+1,this.scene,4);
	this.childRegions[5] = new SceneManagerRegion(m9,m10,this.depth+1,this.scene,5);
	this.childRegions[6] = new SceneManagerRegion(m11,m12,this.depth+1,this.scene,6);
	this.childRegions[7] = new SceneManagerRegion(this.c,v7,this.depth+1,this.scene,7);
	
	this.childRegions[0].parent = this;
	this.childRegions[1].parent = this;
	this.childRegions[2].parent = this;
	this.childRegions[3].parent = this;
	this.childRegions[4].parent = this;
	this.childRegions[5].parent = this;
	this.childRegions[6].parent = this;
	this.childRegions[7].parent = this;
	
	//if I have faces, but I split, I need to distribute my faces to my children
	var objectsBack = this.childObjects;
	this.childObjects = [];
	for(var i = 0; i < objectsBack.length; i++)
	    this.distributeObject(objectsBack[i]);
	
	this.isSplit = true;	
}

SceneManagerRegion.prototype.contains = function(o)
{
	if(o[0] > this.min[0] && o[0] < this.max[0])
	if(o[1] > this.min[1] && o[1] < this.max[1])
	if(o[2] > this.min[2] && o[2] < this.max[2])
		return true;
	return false;	
}

//Test a ray against an octree region
SceneManagerRegion.prototype.CPUPick = function(o,d,opts)
{
	
	var hits = [];
	//if no faces, can be no hits. 
	//remember, faces is all faces in this node AND its children
	if(this.getChildCount().length == 0)
		return hits;
		
	//reject this node if the ray does not intersect it's bounding box
	if(this.testBoundsRay(o,d).length == 0)
		return hits;
	
	//the the opts specify a max dist
	//if the start is not in me, and im to far, don't bother with my children or my objcts
	if(opts.maxDist > 0 && this.r + MATH.distanceVec3(o,this.c) > opts.maxDist)
	{
		
		if(!this.contains(o))
			return hits;
	}	
	
	//check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
	//for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
	for(var i = 0; i < this.childRegions.length; i++)
	{
		var childhits = this.childRegions[i].CPUPick(o,d,opts);
		if(childhits)
			hits = hits.concat(childhits);
	}
	for(var i = 0; i < this.childObjects.length; i++)
	{
		var childhits = this.childObjects[i].CPUPick(o,d,opts);
		if(childhits)
			hits = hits.concat(childhits);
	}
	return hits;
	
}

//Test a ray against an octree region
SceneManagerRegion.prototype.FrustrumCast = function(frustrum,opts)
{
	
	var hits = [];
	//if no faces, can be no hits. 
	//remember, faces is all faces in this node AND its children
	if(this.getChildCount().length == 0)
		return hits;
		
	//reject this node if the ray does not intersect it's bounding box
	if(this.testBoundsFrustrum(frustrum).length == 0)
		return hits;
	
	//the the opts specify a max dist
	//if the start is not in me, and im to far, don't bother with my children or my objcts
	if(opts.maxDist > 0 && this.r + MATH.distanceVec3(o,this.c) > opts.maxDist)
	{
		if(!this.contains(o))
			return hits;
	}	
	
	//check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
	//for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
	for(var i = 0; i < this.childRegions.length; i++)
	{
		var childhits = this.childRegions[i].FrustrumCast(frustrum,opts);
		if(childhits)
			hits = hits.concat(childhits);
	}
	for(var i = 0; i < this.childObjects.length; i++)
	{
		var childhits = this.childObjects[i].FrustrumCast(frustrum,opts);
		if(childhits)
			hits = hits.concat(childhits);
	}
	return hits;
}

SceneManagerRegion.prototype.testBoundsRay = BoundingBoxRTAS.prototype.intersect;
SceneManagerRegion.prototype.intersect = BoundingBoxRTAS.prototype.intersect;
SceneManagerRegion.prototype.testBoundsFrustrum = BoundingBoxRTAS.prototype.intersectFrustrum;

_SceneManager = new SceneManager();


























THREE.RenderBatchManager = function(scene,name)
{
	this.scene = scene;
	this.name = name;
	this.objects = [];
	
	this.prerender = function()
	{
		if(this.dirty)
		 this.build();
		delete this.dirty;
	}
	this.prerenderhandle = this.prerender.bind(this);
	$(document).bind('prerender',this.prerenderhandle);
}

THREE.RenderBatchManager.prototype.add = function(child)
{
	if(this.objects.indexOf(child) != -1)
		return;
		
	this.objects.push(child)
//	console.log('adding ' + child.name + ' to batch' + this.name);  
	this.dirty = true;
}

THREE.RenderBatchManager.prototype.remove = function(child)
{
	if(this.objects.indexOf(child) == -1)
		return;
	
//	console.log('removing ' + child.name + ' from batch' + this.name);  
	this.objects.splice(this.objects.indexOf(child),1);
	this.dirty = true;
}

THREE.RenderBatchManager.prototype.build = function()
{
	console.log('Building batch' + this.name); 
	if(this.objects.length == 0) return;
	
	//first, reset all the parents, so that we can get the world matrix
	for(var i =0; i < this.objects.length; i++)
	{
		//if(!this.objects[i].parent && this.objects[i].parentBatchBack)
			//this.objects[i].parentBatchBack.add_internal(this.objects[i]);
		this.objects[i].visible = false;	
	}
	
	//do the merge:
	if(this.mesh)
		this.scene.remove_internal(this.mesh);
	this.mesh = null;
    var geo = new THREE.Geometry();
	this.mesh = new THREE.Mesh(geo,this.objects[0].material);
	this.scene.add_internal(this.mesh);
	
	for(var i =0; i < this.objects.length; i++)
	{
		var tg = this.objects[i].geometry;
		var matrix = this.objects[i].matrixWorld.clone();
		var normalMatrix = new THREE.Matrix3();
		normalMatrix.getInverse(matrix);
		normalMatrix.transpose();
		//normalMatrix.elements[3] = normalMatrix.elements[7] = normalMatrix.elements[11] = 0;
		if(tg)
		{	
			
			for(var j = 0; j < tg.faces.length; j++)
			{
				var face = tg.faces[j];
				var newface;
				if(face.d !== undefined)
					newface = new THREE.Face4();
				else
					newface = new THREE.Face3();
					
				newface.a = face.a + geo.vertices.length;	
				newface.b = face.b + geo.vertices.length;
				newface.c = face.c + geo.vertices.length;
				if(face.d !== undefined)
					newface.d = face.d + geo.vertices.length;

				newface.materialIndex = face.materialIndex;
				newface.centroid.copy( face.centroid );
				newface.normal.copy(face.normal);		
				newface.normal.applyMatrix3( normalMatrix ).normalize();
				for(var k = 0; k < face.vertexNormals.length; k++)
					newface.vertexNormals.push(face.vertexNormals[k].clone().applyMatrix3(normalMatrix).normalize());
				
				geo.faces.push(newface);
			
			}
			for(var j = 0; j < tg.vertices.length; j++)
			{
				geo.vertices.push(tg.vertices[j].clone().applyMatrix4(matrix));
			}
			
			for(var j = 0; j < tg.normals.length; j++)
			{
				geo.normals.push(tg.normals[j].clone().applyMatrix4(matrix));
			}
			
			
			var uvs2 = tg.faceVertexUvs[ 0 ];
			
			for ( u = 0, il = uvs2.length; u < il; u ++ ) {

				var uv = uvs2[ u ], uvCopy = [];

				for ( var j = 0, jl = uv.length; j < jl; j ++ ) {

					uvCopy.push( new THREE.Vector2( uv[ j ].x, uv[ j ].y ) );

				}

				geo.faceVertexUvs[0].push( uvCopy );

			}

	
		}
	}
	
	for(var i =0; i < this.objects.length; i++)
	{
		if(this.objects[i].parent)
		{
			//this.objects[i].parentBatchBack = this.objects[i].parent;
			//this.objects[i].parent.remove_internal(this.objects[i]);
		}
	}
}

THREE.RenderBatchManager.prototype.deinitialize = function(child)
{
	$(document).unbind('prerender',this.prerenderhandle);
	if(this.mesh)
		this.scene.remove_internal(this.mesh);
}