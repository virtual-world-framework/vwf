///////////////////////////////////////////////////////////////////////////////
// add cpu side ray casting to GLGE. Faster then GPU based picking in many cases
// espically where there are few polys. 

//Max number of faces a octree node may have before subdivding
var OCTMaxFaces = 30;
//max depth of the octree
var OCTMaxDepth = 4;

// Return the nearsest, highest priority hit 
GLGE.Scene.prototype.CPUPick = function(origin,direction,maxdist)
{
	   //not currently using the max dist, but could make for some good optimizations	
	  if(!maxdist)
	   maxdist = Infinity;
	   
	  
	  //concat all hits from children	  
      var hitlist = [];
	  for(var i=0; i <  this.children.length; i++)
	  {
	     if(this.children[i].CPUPick)
		 {
			 var hit = this.children[i].CPUPick(origin,direction,maxdist);
			 if(hit)
			 {
				for(var j =0; j<hit.length; j++)
					hitlist.push(hit[j]);
			 }
		 }
	  }
	
	//sort the hits by priority and distance
	hitlist = hitlist.sort(function(a,b){
		var ret = b.priority - a.priority;
		if(ret == 0)
			ret = a.distance - b.distance;
		return ret;
	
	});
	  return hitlist[0];
}


// Return all hits, takes a list of planes
GLGE.Scene.prototype.FrustrumCast = function(frustrum)
{
	
	  //concat all hits from children	  
      var hitlist = [];
	  for(var i=0; i <  this.children.length; i++)
	  {
	     if(this.children[i].FrustrumCast)
		 {
			 var hit = this.children[i].FrustrumCast(frustrum);
			 if(hit)
			 {
				for(var j =0; j<hit.length; j++)
					hitlist.push(hit[j]);
			 }
		 }
	  }
	  return hitlist;
}

//Get the bounding box for a group
GLGE.Group.prototype.GetBoundingBox = function(local)
{
	//make blank box and expand by children's bounds
	var box = new BoundingBoxRTAS();
	for(var i=0; i <  this.children.length; i++)
	{
		if(this.children[i].GetBoundingBox)
			box.expandBy(this.children[i].GetBoundingBox());
	}
	//Transform by the local matrix.
	//set local to true to get the bounds without this top node transform
	//useful for drawing the bounds in non AABB form
	if(!local)
		box = box.transformBy(this.getLocalMatrix());
	return box;
}

GLGE.Group.prototype.CPUPick = function(origin,direction,maxdist)
{

	  if(this.InvisibleToCPUPick)
		return [];
	
		
      //roll up the bounds, and check. reject if no hits 
	  //get the bound in local space, so we can transform into worldspace to match the ray
//	  var bb = this.GetBoundingBox(true);
	 
//	  bb = bb.transformBy(this.getModelMatrix());
//	  var bbhits = bb.intersect(origin,direction);
//     if(bbhits.length == 0)	  
//	     return [];
		 
      var hitlist = [];

	  //profiling shows this async stuff to be slower than just iterating the children	
	  /*async.map(this.children,function(item,callback){
			 var hit = item.CPUPick(origin,direction,maxdist);
			 if(hit)
			 {
				callback(null,hit);
				return;
			 }
			 callback(null,null);
			 return;
	  },function(err,results){
		  hitlist = results.reduce(function( intermediate_hits, hit )
		  {
		    if(hit)
			for(var i = 0; i < hit.length; i++)
			{
			   intermediate_hits.push(hit[i]);
			  
			}
			return intermediate_hits;
		  },[]);
		
	  });*/
	  
	  //iterate the children and concat all hits
	  for(var i=0; i <  this.children.length; i++)
	  {
		 if(this.children[i].CPUPick)
		 {
			 var hit = this.children[i].CPUPick(origin,direction,maxdist);
			 if(hit)
			 {
				for(var j =0; j<hit.length; j++)
					hitlist.push(hit[j]);
			 }
		 }
	  }
	  return hitlist;
}

GLGE.Group.prototype.FrustrumCast = function(frustrum)
{
	  if(this.InvisibleToCPUPick)
		return [];
	
      var hitlist = [];
	  
	  //iterate the children and concat all hits
	  for(var i=0; i <  this.children.length; i++)
	  {
		 if(this.children[i].FrustrumCast)
		 {
			 var hit = this.children[i].FrustrumCast(frustrum);
			 if(hit)
			 {
				for(var j =0; j<hit.length; j++)
					hitlist.push(hit[j]);
			 }
		 }
	  }
	  return hitlist;
}

GLGE.Collada.prototype.CPUPick = GLGE.Group.prototype.CPUPick;
GLGE.Collada.prototype.FrustrumCast = GLGE.Group.prototype.FrustrumCast;
//this is a custom geometry type, not included in GLGE distro
JSONNode.prototype.CPUPick = GLGE.Group.prototype.CPUPick;
JSONNode.prototype.FrustrumCast = GLGE.Group.prototype.FrustrumCast;
GLGE.Collada.prototype.GetBoundingBox = GLGE.Group.prototype.GetBoundingBox;
JSONNode.prototype.GetBoundingBox = GLGE.Group.prototype.GetBoundingBox;

//Return the min and max XYZ from a list of verts. positions should be a flat array in the form [x,y,z,x2,y2,z2,...]
function FindMaxMin(positions)
{

	var min = [Infinity,Infinity,Infinity];
	var max = [-Infinity,-Infinity,-Infinity];
	
	for(var i =0; i<positions.length-2; i+=3)
	{	
		var vert = [positions[i],positions[i+1],positions[i+2]];
		if(vert[0] > max[0]) max[0] = vert[0];
		if(vert[1] > max[1]) max[1] = vert[1];
		if(vert[2] > max[2]) max[2] = vert[2];
		
		if(vert[0] < min[0]) min[0] = vert[0];
		if(vert[1] < min[1]) min[1] = vert[1];
		if(vert[2] < min[2]) min[2] = vert[2];
	}
	return [min,max];
}

//Generate the bounding box and sphere for a mesh;
GLGE.Mesh.prototype.GenerateBounds = function()
{
	
	var bounds = FindMaxMin(this.positions);
	var min = bounds[0];
	var max = bounds[1];
	
	this.BoundingSphere = new BoundingSphereRTAS(min,max);
	this.BoundingBox = new BoundingBoxRTAS(min,max);
}

//return the intersection of a ray and a sphere
var intersectRaySphere = function(origin,direction,center,radius)
{
		direction = GLGE.scaleVec3(direction,1.0/GLGE.lengthVec3(direction));
		center = GLGE.subVec3(center,origin);
		var LdotC = GLGE.dotVec3(direction,center);
		var c = GLGE.lengthVec3(center);
		var d = Math.sqrt((LdotC*LdotC) - (c*c) + (radius*radius));
		var d1 = LdotC + d;
		var d2 = LdotC - d;
		return Math.max(d1,d2);
}
//The basic representation of a face
function face(v0,v1,v2)
{
	this.v0 = v0;
	this.v1 = v1;
	this.v2 = v2;
	//Find the face center
	//NOTE: no longer used. profiling shows rejecting face bounding sphere too slow.
	this.c = [0,0,0];
	this.c[0] = (this.v0[0] + this.v1[0] + this.v2[0] )/3.0;
	this.c[1] = (this.v0[1] + this.v1[1] + this.v2[1] )/3.0;
	this.c[2] = (this.v0[2] + this.v1[2] + this.v2[2] )/3.0;
	this.r = Math.max(GLGE.distanceVec3(this.v0,this.c),GLGE.distanceVec3(this.v1,this.c),GLGE.distanceVec3(this.v2,this.c));
	
	//precomp some values used in intersection
	var s1 = GLGE.subVec3(v1,v0);
	var s2 = GLGE.subVec3(v2,v0);
	s1 = GLGE.scaleVec3(s1,1.0/GLGE.lengthVec3(s1));
	s2 = GLGE.scaleVec3(s2,1.0/GLGE.lengthVec3(s1));
	
	//generate the face normal
	var norm = GLGE.crossVec3(s2,s1);
	norm = GLGE.scaleVec3(norm,1.0/GLGE.lengthVec3(norm));
	this.norm = norm;
}
function crossProduct(a,b,c)
{
	a[0] = b[1] * c[2] - c[1] * b[2]; 
	a[1] = b[2] * c[0] - c[2] * b[0]; 
	a[2] = b[0] * c[1] - c[0] * b[1];
}
function innerProduct(v,q)
{
		return (v[0] * q[0] + 
		v[1] * q[1] + 
		v[2] * q[2]);
}
function vector(a,b,c)
{
	a[0] = b[0] - c[0];
	a[1] = b[1] - c[1];
	a[2] = b[2] - c[2];
}
function pointInFrustrum(point,frustrum)
{
//checks if cube points are within the frustum planes
	
	
	var x, y, z;
	
		x=point[0];
		y=point[1];
		z=point[2];
	
	for(var i = 0; i < frustrum.planes.length; i++)
	{
		var vec = GLGE.subVec3(point,frustrum.planes[i].point);
		vec = GLGE.toUnitVec3(vec);
		if(GLGE.dotVec3(vec,frustrum.planes[i].normal) < 0)
			return false;
	}
	return true;

}

face.prototype.intersectFrustrum = function(frustrum)
{
	if(pointInFrustrum(this.v0,frustrum)||pointInFrustrum(this.v0,frustrum)||pointInFrustrum(this.v0,frustrum))
	{
		var point = this.c;
		var norm = this.norm;
		return {point:point,norm:norm,face:this};
	}
	return null;
}

//intersect a ray with a face
face.prototype.intersect1 = function(p,d)
{
	
	//huh. profiling shows this is much slower.
	//var hit = intersectRaySphere(p,d,this.c,this.r)
	//if(hit < 0) return null;
	
	
	var v0 = this.v0;
	var v1 = this.v1;
	var v2 = this.v2;

	if(!this.e1)
	{	
		this.e1 = [0,0,0];   //,e2[3],h[3],s[3],q[3];
		vector(this.e1,v1,v0);
	}
	if(!this.e2)
	{
		this.e2 = [0,0,0];
		vector(this.e2,v2,v0);
	}
	var h = [0,0,0];
	var s = [0,0,0];
	var q = [0,0,0];
	var a = 0;
	var f = 0;
	var u = 0;
	var v = 0;

	crossProduct(h,d,this.e2);
	a = innerProduct(this.e1,h);

	if (a > -0.00001 && a < 0.00001)
		return null;

	f = 1/a;
	vector(s,p,v0);
	u = f * (innerProduct(s,h));

	if (u < 0.0 || u > 1.0)
		return null;

	crossProduct(q,s,this.e1);
	v = f * innerProduct(d,q);

	if (v < 0.0 || u + v > 1.0)
		return null;

	// at this stage we can compute t to find out where
	// the intersection point is on the line
	t = f * innerProduct(this.e2,q);

	if (t > 0.00001) // ray intersection
	{
		var point = GLGE.addVec3(p,GLGE.scaleVec3(d,t));
		var norm = this.norm;
		if(GLGE.dotVec3(d,norm) > 0)
		  norm = GLGE.scaleVec3(norm,-1);
		return {point:point,norm:norm,face:this};
	}

	else // this means that there is a line intersection
		 // but not a ray intersection
		 return null;

}
// for meshes that are few polys, just create a list of faces
function SimpleFaceListRTAS(faces,verts)
{
	this.faces = [];   
	
	for(var i =0; i < faces.length-2; i+=3)
	{
		
		this.faces.push(new face([verts[faces[i]*3+0],verts[faces[i]*3+1],verts[faces[i]*3+2]],
								[verts[faces[i+1]*3+0],verts[faces[i+1]*3+1],verts[faces[i+1]*3+2]],
								[verts[faces[i+2]*3+0],verts[faces[i+2]*3+1],verts[faces[i+2]*3+2]]));
	}
}
//Intersect a ray with a list of faces
SimpleFaceListRTAS.prototype.intersect = function(origin,direction)
{
	var intersects = [];
    for(var i =0; i < this.faces.length; i++)
	{
		var intersect = this.faces[i].intersect1(origin,direction);
		if(intersect)
		intersects.push(intersect);
	}
	return intersects;
}
//Intersect a frustrum with a list of faces
SimpleFaceListRTAS.prototype.intersectFrustrum = function(frustrum)
{
	var intersects = [];
    for(var i =0; i < this.faces.length; i++)
	{
		var intersect = this.faces[i].intersectFrustrum(frustrum);
		if(intersect)
		intersects.push(intersect);
	}
	return intersects;
}
//a quick structure to test bounding spheres
function BoundingSphereRTAS(min,max)
{
		
	this.center = GLGE.scaleVec3(GLGE.addVec3(min,max),.5);
	this.radius = GLGE.lengthVec3(GLGE.subVec3(max,min))/2.0;
}
BoundingSphereRTAS.prototype.intersect = function(origin,direction)
{
	return intersectRaySphere(origin,direction,this.center,this.radius);
}
// a quick structure to test bounding boxes
function BoundingBoxRTAS(min,max)
{
	this.max = [-Infinity,-Infinity,-Infinity];
	this.min = [Infinity,Infinity,Infinity];
	if(min)
		this.min = min;
	if(max)	
		this.max = max;
}
// copy
BoundingBoxRTAS.prototype.clone = function()
{
	return new BoundingBoxRTAS([this.min[0],this.min[1],this.min[2]],[this.max[0],this.max[1],this.max[2]]);
}
//sort of like add for two boxes. expand this box to include the new one was well as itself
BoundingBoxRTAS.prototype.expandBy = function(bb)
{
	if(bb.min[0] < this.min[0]) this.min[0] = bb.min[0];
	if(bb.min[1] < this.min[1]) this.min[1] = bb.min[1];
	if(bb.min[2] < this.min[2]) this.min[2] = bb.min[2];
	if(bb.max[0] > this.max[0]) this.max[0] = bb.max[0];
	if(bb.max[1] > this.max[1]) this.max[1] = bb.max[1];
	if(bb.max[2] > this.max[2]) this.max[2] = bb.max[2];
}
//transform the boundging box by a matrix, then re-axis align.
BoundingBoxRTAS.prototype.transformBy = function(matrix)
{
	var mat = [];
	for(var i = 0; i < matrix.length; i++)
	 mat.push(matrix[i]);
	//mat = GLGE.inverseMat4(mat); 
	
	var points = [];
	var allpoints = [];
	var min = this.min;
	var max = this.max;
	//list of all corners
	points.push([min[0],min[1],min[2]]);
	points.push([min[0],min[1],max[2]]);
	points.push([min[0],max[1],min[2]]);
	points.push([min[0],max[1],max[2]]);
	points.push([max[0],min[1],min[2]]);
	points.push([max[0],min[1],max[2]]);
	points.push([max[0],max[1],min[2]]);
	points.push([max[0],max[1],max[2]]);
	for(var i = 0; i < points.length; i++)
	{
		//transform all points
		allpoints = allpoints.concat(GLGE.mulMat4Vec3(mat,points[i]));
	}
	//find new axis aligned bounds
	var bounds = FindMaxMin(allpoints);
	var min2 = bounds[0];
	var max2 = bounds[1];
	return new  BoundingBoxRTAS(min2,max2);
}

BoundingBoxRTAS.prototype.intersectFrustrum = function(frustrum)
{
	var p0 = [this.min[0],this.min[1],this.min[2]];
	var p1 = [this.min[0],this.min[1],this.max[2]];
	var p2 = [this.min[0],this.max[1],this.min[2]];
	var p3 = [this.min[0],this.max[1],this.max[2]];
	var p4 = [this.max[0],this.min[1],this.min[2]];
	var p5 = [this.max[0],this.min[1],this.max[2]];
	var p6 = [this.max[0],this.max[1],this.min[2]];
	var p7 = [this.max[0],this.max[1],this.max[2]];
	
	var points = [p0,p1,p2,p3,p4,p5,p6,p7];
	for(var i =0; i < 8; i++)
	{
		if(pointInFrustrum(points[i],frustrum))
			return [true];
	}
	return [];
}
//intersect ray and bounding box
BoundingBoxRTAS.prototype.intersect = function(o,d)
{	
		//TODO: are these loose bounds necessary?
		var min = [this.min[0]-.01,this.min[1]-.01,this.min[2]-.01];
		var max = [this.max[0]+.01,this.max[1]+.01,this.max[2]+.01];
 		var dirfrac = [0,0,0];
		var t;
		// d is unit direction vector of ray
		dirfrac[0] = 1.0 / d[0];
		dirfrac[1] = 1.0 / d[1];
		dirfrac[2] = 1.0 / d[2];
		// this.min is the corner of AABB with Math.minimal coordinates - left bottom, this.max is Math.maximal corner
		// o is origin of ray
		var t1 = (min[0] - o[0])*dirfrac[0];
		var t2 = (max[0] - o[0])*dirfrac[0];
		var t3 = (min[1] - o[1])*dirfrac[1];
		var t4 = (max[1] - o[1])*dirfrac[1];
		var t5 = (min[2] - o[2])*dirfrac[2];
		var t6 = (max[2] - o[2])*dirfrac[2];

		var tMathmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
		var tMathmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

		// if tMath.max < 0, ray (line) is intersecting AABB, but whole AABB is behing us
		if (tMathmax < 0)
		{
			t = tMathmax;
			return [];
		}

		// if tMath.min > tMath.max, ray doesn't intersect AABB
		if (tMathmin > tMathmax)
		{
			t = tMathmax;
			return [];
		}

		t = tMathmin;
		return [true]; 
    
   
    return [true]; // if we made it here, there was an intersection - YAY

}
function swap(a,b)
{
	var t = a;
	a = b;
	b = t;
}
// a octree octant. Holds a list of faces, and splits at a given number of faces
function OctreeRegion(min,max,depth)
{
	this.faces = [];
	this.depth = depth;
	this.facesNotDistributed = [];
	if(this.depth > 10)
		this.facesNotDistributed = this.faces;
	this.min = min;
	this.max = max;
	
	//Should never reach any of this;
	if(this.min[0] > this.max[0])
		alert();
	if(this.min[1] > this.max[1])
		alert();
	if(this.min[2] > this.max[2])
		alert();		
	this.isSplit = false;
	//The list of child regions
	this.children = [null,null,null,null,null,null,null,null];
}
//testing the bounds of the octree region is the same as testing a bounding box
OctreeRegion.prototype.testBounds = BoundingBoxRTAS.prototype.intersect;
OctreeRegion.prototype.testBoundsFrustrum = BoundingBoxRTAS.prototype.intersectFrustrum;

//add a face, and split if necessary
OctreeRegion.prototype.addFace = function(face)
{
	
	//make the faces unique, or the split algo will go nuts, and keep spliting bounds trying to subdivide the faces if they are over the max face limit, but are have the same 
	//values and can't ever end up in different regions. Will then bottom out at max depth.
	//note max depth grows regions at 8^d;
	//NOTE: This is just way way too slow, and not worth it.
	// var facelisttocheck = this.isSplit? this.facesNotDistributed:this.faces;
	// if(facelisttocheck.length < OCTMaxFaces)                  //nice to have, but building structure takes too long.
	// for(var i = 0; i < facelisttocheck.length;i++)
	// {
		// var collide = false;
		// if(comparefaces(face,facelisttocheck[i]))
		// {
			// collide = true;
			// break;
		// }
		// if(collide)
		// {
			// debugger;
			// console.log("rejecting duplicate face from octree");
			// return;
		// }
	// }
	
	
	this.faces.push(face);
	//split of the new face pushes over the face limit, and not already split, and not too deep in the tree
	if(this.faces.length > OCTMaxFaces && !this.isSplit && this.depth <= OCTMaxDepth)
	   this.split();
	else 
	{	
		//if it's split already, distribute the face to the sub regions
		if(this.isSplit)
			this.distributeFace(face);
	}	
}
//point inside a region
OctreeRegion.prototype.pointInside = function(point)
{
	if(point[0] > this.max[0] || point[0] < this.min[0])
		return false;
	if(point[1] > this.max[1] || point[1] < this.min[1])
		return false;
	if(point[2] > this.max[2] || point[2] < this.min[2])
		return false;
	return true;	
}
//a face is inside if any of the verts are inside;
OctreeRegion.prototype.testFace = function(face)
{
	if(this.pointInside(face.v0) || this.pointInside(face.v1) || this.pointInside(face.v2))
		return true;
    return false;
}
//distriubte a face to the child nodes. 
//NOTE: the face in region test could place the face in multiple sub nodes
OctreeRegion.prototype.distributeFace = function(face)
{
	var added = 0;
	var addchild = null;
	for(var i = 0; i < this.children.length; i++)
	{
		if(this.children[i].testFace(face))
		{
			this.children[i].addFace(face);
			added++;
		}
	}
	//if for some reason, the face is not added to any child, keep the face in a special list at this level
	//NOTE: after some bug fixes, have not seen any faces here, but keeping just in case.
	if(added == 0)
	{
		this.facesNotDistributed.push(face);
	}
}
//Test a ray against an octree region
OctreeRegion.prototype.intersect = function(o,d)
{
	
	var hits = [];
	//if no faces, can be no hits. 
	//remember, faces is all faces in this node AND its children
	if(this.faces.length == 0)
		return hits;
	
	//if the node is split, then we test the non distributed faces, which are not in any children
	var facelist = this.faces;
	if(this.isSplit)
	   facelist = this.facesNotDistributed;
	
	//check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
	//for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
	for(var i = 0; i < facelist.length; i++)
	{
		var facehits = facelist[i].intersect1(o,d);
		if(facehits)
			hits.push(facehits);
	}
	
	//reject this node if the ray does not intersect it's bounding box
	if(this.testBounds(o,d).length == 0)
	{
		//console.log('region rejected');
		return hits;
	}
	
	//if the node is split, concat the hits from all children
	if(this.isSplit)
	{
		for(var i = 0; i < this.children.length; i++)
		{
			var childhits = this.children[i].intersect(o,d);
			if(childhits)
			{
				for(var j = 0; j < childhits.length; j++)
				    hits.push(childhits[j]);
			}
		}
	}
	return hits;
}

//Test a ray against an octree region
OctreeRegion.prototype.intersectFrustrum = function(frustrum)
{
	
	var hits = [];
	//if no faces, can be no hits. 
	//remember, faces is all faces in this node AND its children
	if(this.faces.length == 0)
		return hits;
	
	//if the node is split, then we test the non distributed faces, which are not in any children
	var facelist = this.faces;
	if(this.isSplit)
	   facelist = this.facesNotDistributed;
	
	//check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
	//for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
	for(var i = 0; i < facelist.length; i++)
	{
		var facehits = facelist[i].intersectFrustrum(frustrum);
		if(facehits)
			hits.push(facehits);
	}
	
	//reject this node if the ray does not intersect it's bounding box
	if(this.testBoundsFrustrum(frustrum).length == 0)
	{
		//console.log('region rejected');
		return hits;
	}
	
	//if the node is split, concat the hits from all children
	if(this.isSplit)
	{
		for(var i = 0; i < this.children.length; i++)
		{
			var childhits = this.children[i].intersectFrustrum(frustrum);
			if(childhits)
			{
				for(var j = 0; j < childhits.length; j++)
				    hits.push(childhits[j]);
			}
		}
	}
	return hits;
}

//generate the children nodes from this node, and set the proper min and max
//boy, getting this right is a bit tricky.
OctreeRegion.prototype.split = function()
{
	var v0 = [this.min[0],this.min[1],this.min[2]];
	var v1 = [this.min[0],this.min[1],this.max[2]];
	var v2 = [this.min[0],this.max[1],this.min[2]];
	var v3 = [this.min[0],this.max[1],this.max[2]];
	var v4 = [this.max[0],this.min[1],this.min[2]];
	var v5 = [this.max[0],this.min[1],this.max[2]];
	var v6 = [this.max[0],this.max[1],this.min[2]];
	var v7 = [this.max[0],this.max[1],this.max[2]];
	
	this.c = [(this.max[0]+this.min[0])/2,(this.max[1]+this.min[1])/2,(this.max[2]+this.min[2])/2];
	
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
	
	this.children[0] = new OctreeRegion(v0,this.c,this.depth+1);
	this.children[1] = new OctreeRegion(m1,m2,this.depth+1);
	this.children[2] = new OctreeRegion(m3,m4,this.depth+1);
	this.children[3] = new OctreeRegion(m5,m6,this.depth+1);
	this.children[4] = new OctreeRegion(m7,m8,this.depth+1);
	this.children[5] = new OctreeRegion(m9,m10,this.depth+1);
	this.children[6] = new OctreeRegion(m11,m12,this.depth+1);
	this.children[7] = new OctreeRegion(this.c,v7,this.depth+1);
	
	//if I have faces, but I split, I need to distribute my faces to my children
	for(var i = 0; i < this.faces.length; i++)
	    this.distributeFace(this.faces[i]);
	
	this.isSplit = true;	
}
// compare too verts against a tollerance
function compareverts(v1,v2,t)
{
	return ((v1[0]-v2[0])*(v1[0]-v2[0])  +   (v1[1]-v2[1])*(v1[1]-v2[1])   +   (v1[2]-v2[2])*(v1[2]-v2[2])) < (t*t);
}
// no longer trying to remove duplicate faces, but used to use this to do so
function comparefaces(f1,f2)
{
	//just too expensive
	var v1 = [f1.v0,f1.v1,f1.v2];
	var v2 = [f2.v0,f2.v1,f2.v2];
	for(var i = 0; i < 3; i++)
	{
	   var match = false;
	   for(var j = 0; j < 3; j++)
	   {
			if(	compareverts(v1[i],v2[j],.0001))
			{
				match = true;
				break;
			}
	   }
	   if(!match)
		return false;
	}
	return true;
	//compare based on centroid and radius. 
	//return compareverts(f1.c,f2.c,.001) && Math.abs(f1.r-f2.r) < .001
}
//The base ray trace accleration structure
function OctreeRTAS(faces,verts,min,max)
{
    //first, put the faces in a list
    this.faces = [];
    
    //build the list of faces from the vert list
	for(var i =0; i < faces.length-2; i+=3)
	{
		
		this.faces.push(new face([verts[faces[i]*3+0],verts[faces[i]*3+1],verts[faces[i]*3+2]],
								[verts[faces[i+1]*3+0],verts[faces[i+1]*3+1],verts[faces[i+1]*3+2]],
								[verts[faces[i+2]*3+0],verts[faces[i+2]*3+1],verts[faces[i+2]*3+2]]));
	}
	
	//Then, create a root bound
	this.root = new OctreeRegion(min,max,0);
	for(var i = 0; i<this.faces.length; i++)
		this.root.addFace(this.faces[i]);
}
//just intersect with the root octant
OctreeRTAS.prototype.intersect = function(o,d)
{
	return this.root.intersect(o,d);
}
OctreeRTAS.prototype.intersectFrustrum = function(frustrum)
{
	return this.root.intersectFrustrum(frustrum);
}
//Generate either an octree of a face list to test rays.
//note: the max faces can make big performance difference here.
GLGE.Mesh.prototype.BuildRayTraceAccelerationStructure = function()
{
	
	if(this.faces.data.length/3 > OCTMaxFaces)
	{
		this.RayTraceAccelerationStructure = new OctreeRTAS(this.faces.data,this.positions,this.BoundingBox.min,this.BoundingBox.max);
	}
	else
	{
		this.RayTraceAccelerationStructure = new SimpleFaceListRTAS(this.faces.data,this.positions);
	}
	
}
//Get the bounds for an object
GLGE.Mesh.prototype.GetBoundingBox = function()
{
      if(!this.BoundingSphere || !this.BoundingBox || this.dirtyMesh)
	  {
			this.GenerateBounds();
	  }
	  return this.BoundingBox;
}
//Get the bounds for an object
GLGE.Mesh.prototype.setPickMesh = function(pickmesh)
{
	  this.PickMesh = pickmesh;
}
//Do the actuall intersection with the mesh;
GLGE.Mesh.prototype.CPUPick = function(origin,direction,maxdist)
{

	  
	  if(this.InvisibleToCPUPick)
		return null;
	  
	  //allow a picking mesh that differs from the visible mesh
	  if(this.PickMesh)
		return this.PickMesh.CPUPick(origin,direction,maxdist);
		
      //if for some reason dont have good bounds, generate	 
	  if(!this.BoundingSphere || !this.BoundingBox || this.dirtyMesh)
	  {
			this.GenerateBounds();
	  }
	   
	  
	  //try to reject based on bounding sphere
	  //*** profiling shows reject based on bounding sphere function is way too slow.
	  // ** faster just to check AABB	
	  //var hit = this.BoundingSphere.intersect(origin,direction);
	  var intersections = [];
	  
	  //if(hit > 0 && hit < maxdist)
	  {
		 
		 //try to reject based on bounding box.
		 var bbhit = this.BoundingBox.intersect(origin,direction); 
		
		 if(bbhit.length > 0)
		 {
			 //build the octree or the facelist
			 if(!this.RayTraceAccelerationStructure || this.dirtyMesh)
			 {
				 this.BuildRayTraceAccelerationStructure();
				
			 }
			 //do actual mesh intersection
			 intersections = this.RayTraceAccelerationStructure.intersect(origin,direction); 		 
		 }
	  }
	  this.dirtyMesh = false;
      return intersections;
	 

}
//Do the actuall intersection with the mesh;
GLGE.Mesh.prototype.FrustrumCast = function(frustrum)
{
	  if(this.InvisibleToCPUPick)
		return null;
	  
	  //allow a picking mesh that differs from the visible mesh
	  if(this.PickMesh)
		return this.PickMesh.FrustrumCast(frustrum);
		
      //if for some reason dont have good bounds, generate	 
	  if(!this.BoundingSphere || !this.BoundingBox || this.dirtyMesh)
	  {
			this.GenerateBounds();
	  }
	   	
	 var intersections = [];
	 //try to reject based on bounding box.
	 //var bbhit = this.BoundingBox.intersectFrustrum(planes); 
	
	 //if(bbhit.length > 0)
	 {
		 //build the octree or the facelist
		 if(!this.RayTraceAccelerationStructure || this.dirtyMesh)
		 {
			 this.BuildRayTraceAccelerationStructure();
			
		 }
		 //do actual mesh intersection
		 intersections = this.RayTraceAccelerationStructure.intersectFrustrum(frustrum); 		 
	 }
	  
	  this.dirtyMesh = false;
      return intersections;
}
//Gets it in this groups local space!
GLGE.Object.prototype.GetBoundingBox = function(local)
{
	if(this.mesh)
		{
			var box = this.mesh.GetBoundingBox();
			if(!local)
				box = box.transformBy(this.getLocalMatrix());	
			return box;
		}
	return new BoundingBoxRTAS();	
}

//no need to test bounding box here. Can only contain one mesh, and the mesh will check its own
//boudning box.
GLGE.Object.prototype.CPUPick = function(origin,direction,maxdist)
{
	  if(this.InvisibleToCPUPick || this.getVisible() == false)
		return null;

	  //at this point, were going to move the ray into the space relative to the mesh. until now, the ray has been in worldspace.
	  var mat = this.getModelMatrix().slice(0);
	  mat = GLGE.inverseMat4(mat);
	  var newo = GLGE.mulMat4Vec3(mat,origin);
	  var nmaxdist = maxdist;// * Math.abs(mat[0]);
	  mat = this.getModelMatrix().slice(0);
	  mat[3] = 0;
	  mat[7] = 0;
	  mat[11] = 0;
	  mat = GLGE.inverseMat4(mat);
      var newd = GLGE.mulMat4Vec3(mat,direction);
	  
	  
	  
	  var ret = [];
      if(this.mesh)
	  {
			//collide with the mesh
			ret = this.mesh.CPUPick(newo,newd,nmaxdist);
			
			for(var i = 0; i < ret.length; i++)
			{	
				//move the normal and hit point into worldspace
				var mat2 = this.getModelMatrix().slice(0);
				ret[i].point = GLGE.mulMat4Vec3(mat2,ret[i].point);
				mat2[3] = 0;
				mat2[7] = 0;
				mat2[11] = 0;
				ret[i].norm = GLGE.mulMat4Vec3(mat2,ret[i].norm);
				ret[i].norm = GLGE.scaleVec3(ret[i].norm,1.0/GLGE.lengthVec3(ret[i].norm));
				ret[i].distance = GLGE.distanceVec3(origin,ret[i].point);
				ret[i].object = this;
				ret[i].priority = this.PickPriority !== undefined ? this.PickPriority :  1;
			}
	  }
	  return ret;
}
function Frustrum(ntl,ntr,nbl,nbr,ftl,ftr,fbl,fbr)
{
	this.ntl = ntl;
	this.ntr = ntr;
	this.nbl = nbl;
	this.nbr = nbr;
					
	this.ftl = ftl;
	this.ftr = ftr;
	this.fbl = fbl;
	this.fbr = fbr;
					

	this.nearnorm=GLGE.toUnitVec3(GLGE.crossVec3(GLGE.subVec3(this.ntr,this.nbr),GLGE.subVec3(this.nbl,this.nbr)));
	this.farnorm=GLGE.toUnitVec3(GLGE.crossVec3(GLGE.subVec3(this.ftl,this.fbl),GLGE.subVec3(this.ftr,this.fbl)));
	this.leftnorm=GLGE.toUnitVec3(GLGE.crossVec3(GLGE.subVec3(this.nbl,this.fbl),GLGE.subVec3(this.ftl,this.fbl)));
	this.rightnorm=GLGE.toUnitVec3(GLGE.crossVec3(GLGE.subVec3(this.ftr,this.ntr),GLGE.subVec3(this.ntr,this.nbr)));
	this.topnorm=GLGE.toUnitVec3(GLGE.crossVec3(GLGE.subVec3(this.ftl,this.ntr),GLGE.subVec3(this.ntr,this.ftr)));
	this.bottomnorm=GLGE.toUnitVec3(GLGE.crossVec3(GLGE.subVec3(this.nbl,this.nbr),GLGE.subVec3(this.fbl,this.nbl)));
	
	this.nearplane = {point:this.ntl,normal:GLGE.scaleVec3(this.nearnorm,-1)};
	this.farplane = {point:this.ftl,normal:GLGE.scaleVec3(this.farnorm,-1)};
	this.leftplane = {point:this.ftl,normal:GLGE.scaleVec3(this.leftnorm,-1)};
	this.rightplane = {point:this.ntr,normal:GLGE.scaleVec3(this.rightnorm,-1)};
	this.topplane = {point:this.ftl,normal:GLGE.scaleVec3(this.topnorm,-1)};
	this.bottomplane = {point:this.fbl,normal:GLGE.scaleVec3(this.bottomnorm,-1)};
	this.planes = [this.nearplane,this.farplane,this.leftplane,this.rightplane,this.topplane,this.bottomplane];
	this.transformBy = function(matrix)
	{
		var ntl = GLGE.mulMat4Vec3(matrix,this.ntl);
		var ntr = GLGE.mulMat4Vec3(matrix,this.ntr);
		var nbl = GLGE.mulMat4Vec3(matrix,this.nbl);
		var nbr = GLGE.mulMat4Vec3(matrix,this.nbr);
		
		var ftl = GLGE.mulMat4Vec3(matrix,this.ftl);
		var ftr = GLGE.mulMat4Vec3(matrix,this.ftr);
		var fbl = GLGE.mulMat4Vec3(matrix,this.fbl);
		var fbr = GLGE.mulMat4Vec3(matrix,this.fbr);
		
		return new Frustrum(ntl,ntr,nbl,nbr,ftl,ftr,fbl,fbr);	
	}
}
GLGE.Object.prototype.FrustrumCast = function(frustrum)
{
	  if(this.InvisibleToCPUPick || this.getVisible() == false)
		return null;

	  //at this point, were going to move the ray into the space relative to the mesh. until now, the ray has been in worldspace.
	  var mat;
	  var mat2;
	  
	 
	  mat = this.getModelMatrix().slice(0);
	//  mat2 = this.getModelMatrix().slice(0);
	//  mat[3] = 0;
	//  mat[7] = 0;
	 // mat[11] = 0;
	  
	  
	  
	 // mat[0] = 1;
	 // mat[5] = 1;
	 // mat[10] = 1;
	  
	 // mat2[0] = 1;
	 // mat2[5] = 1;
	 // mat2[10] = 1;
	  
	  mat = GLGE.inverseMat4(mat);
	  var tfrustrum = frustrum.transformBy(mat);
	  
	  
	  var ret = [];
      if(this.mesh)
	  {
			//collide with the mesh
			ret = this.mesh.FrustrumCast(tfrustrum);
			
			for(var i = 0; i < ret.length; i++)
			{	
				//move the normal and hit point into worldspace
				var mat2 = this.getModelMatrix().slice(0);
				ret[i].point = GLGE.mulMat4Vec3(mat2,ret[i].point);
				mat2[3] = 0;
				mat2[7] = 0;
				mat2[11] = 0;
				ret[i].norm = GLGE.mulMat4Vec3(mat2,ret[i].norm);
				ret[i].norm = GLGE.scaleVec3(ret[i].norm,1.0/GLGE.lengthVec3(ret[i].norm));
				ret[i].distance = GLGE.distanceVec3([0,0,0],ret[i].point);
				ret[i].object = this;
				ret[i].priority = this.PickPriority !== undefined ? this.PickPriority :  1;
			}
	  }
	  return ret;
}

