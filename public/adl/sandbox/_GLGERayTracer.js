function distcomp(a,b)
{
		return a.distance > b.distance;
}
function pcomp(a,b)
{
		return a.priority < b.priority;
}
GLGE.Scene.prototype.CPUPick = function(origin,direction,maxdist)
{
	  if(!maxdist)
	   maxdist = Infinity;
	   
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
	  
	  hitlist.sort(distcomp);
	  hitlist.sort(pcomp);
	  return hitlist[0];
}

GLGE.Group.prototype.CPUPick = function(origin,direction,maxdist)
{

	  if(this.InvisibleToCPUPick)
		return null;
		
      var hitlist = [];

	  async.map(this.children,function(item,callback){
	  
			 
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
		
	  });
	  
	  
	  // for(var i=0; i <  this.children.length; i++)
	  // {
		 // if(this.children[i].CPUPick)
		 // {
			 // var hit = this.children[i].CPUPick(origin,direction,maxdist);
			 // if(hit)
			 // {
				// for(var j =0; j<hit.length; j++)
					// hitlist.push(hit[j]);
			 // }
		 // }
	  // }
	  return hitlist;
}
GLGE.Collada.prototype.CPUPick = GLGE.Group.prototype.CPUPick;
JSONNode.prototype.CPUPick = GLGE.Group.prototype.CPUPick;
GLGE.Mesh.prototype.GenerateBounds = function()
{
	
	
	
	var min = [Infinity,Infinity,Infinity];
	var max = [-Infinity,-Infinity,-Infinity];
	
	
	for(var i =0; i<this.positions.length-2; i+=3)
	{	
		var vert = [this.positions[i],this.positions[i+1],this.positions[i+2]];
		if(vert[0] > max[0]) max[0] = vert[0];
		if(vert[1] > max[1]) max[1] = vert[1];
		if(vert[2] > max[2]) max[2] = vert[2];
		
		if(vert[0] < min[0]) min[0] = vert[0];
		if(vert[1] < min[1]) min[1] = vert[1];
		if(vert[2] < min[2]) min[2] = vert[2];
	}
	
	this.BoundingSphere = new BoundingSphereRTAS(min,max);
	this.BoundingBox = new BoundingBoxRTASNew(min,max);
}

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
function face(v0,v1,v2)
{
	
	this.v0 = v0;
	this.v1 = v1;
	this.v2 = v2;
	this.c = [0,0,0];
	this.c[0] = (this.v0[0] + this.v1[0] + this.v2[0] )/3.0;
	this.c[1] = (this.v0[1] + this.v1[1] + this.v2[1] )/3.0;
	this.c[2] = (this.v0[2] + this.v1[2] + this.v2[2] )/3.0;
	this.r = Math.max(GLGE.distanceVec3(this.v0,this.c),GLGE.distanceVec3(this.v1,this.c),GLGE.distanceVec3(this.v2,this.c));
	
	//todo
	var s1 = GLGE.subVec3(v1,v0);
	var s2 = GLGE.subVec3(v2,v0);
	s1 = GLGE.scaleVec3(s1,1.0/GLGE.lengthVec3(s1));
	s2 = GLGE.scaleVec3(s2,1.0/GLGE.lengthVec3(s1));
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
face.prototype.intersect1 = function(p,d)
{
	
	var hit = intersectRaySphere(p,d,this.c,this.r)
	if(hit < 0) return null;
	
	
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
		return {point:point,norm:norm};
	}

	else // this means that there is a line intersection
		 // but not a ray intersection
		 return null;

}

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
function BoundingSphereRTAS(min,max)
{
		
	this.center = GLGE.scaleVec3(GLGE.addVec3(min,max),.5);
	this.radius = GLGE.lengthVec3(GLGE.subVec3(max,min))/2.0;
}
BoundingSphereRTAS.prototype.intersect = function(origin,direction)
{
	return intersectRaySphere(origin,direction,this.center,this.radius);
}
function BoundingBoxRTAS(min,max)
{
	this.faces = [];   
	
	
		//bottom
		this.faces.push(new face([min[0],min[1],min[2]],[min[0],max[1],min[2]],[max[0],max[1],min[2]]));
		this.faces.push(new face([max[0],max[1],min[2]],[max[0],min[1],min[2]],[min[0],min[1],min[2]]));
		//top
		this.faces.push(new face([min[0],min[1],max[2]],[min[0],max[1],max[2]],[max[0],max[1],max[2]]));
		this.faces.push(new face([max[0],max[1],max[2]],[max[0],min[1],max[2]],[min[0],min[1],max[2]]));
		//left
		this.faces.push(new face([min[0],min[1],min[2]],[min[0],max[1],min[2]],[min[0],max[1],max[2]]));
		this.faces.push(new face([min[0],max[1],max[2]],[min[0],min[1],max[2]],[min[0],min[1],min[2]]));
		//right
		this.faces.push(new face([max[0],min[1],min[2]],[max[0],max[1],min[2]],[max[0],max[1],max[2]]));
		this.faces.push(new face([max[0],max[1],max[2]],[max[0],min[1],max[2]],[max[0],min[1],min[2]]));
		//back
		this.faces.push(new face([min[0],min[1],min[2]],[max[0],min[1],min[2]],[max[0],min[1],max[2]]));
		this.faces.push(new face([max[0],min[1],max[2]],[min[0],min[1],max[2]],[min[0],min[1],min[2]]));
		//front
		this.faces.push(new face([min[0],max[1],min[2]],[max[0],max[1],min[2]],[max[0],max[1],max[2]]));
		this.faces.push(new face([max[0],max[1],max[2]],[min[0],max[1],max[2]],[min[0],max[1],min[2]]));
	
}
BoundingBoxRTAS.prototype.intersect = SimpleFaceListRTAS.prototype.intersect;

function BoundingBoxRTASNew(min,max)
{
	this.min = min;
	this.max = max;
}
BoundingBoxRTASNew.prototype.intersect = function(o,d)
{
		
		var dirfrac = [0,0,0];
		var t;
		// d is unit direction vector of ray
		dirfrac[0] = 1.0 / d[0];
		dirfrac[1] = 1.0 / d[1];
		dirfrac[2] = 1.0 / d[2];
		// this.min is the corner of AABB with Math.minimal coordinates - left bottom, this.max is Math.maximal corner
		// o is origin of ray
		var t1 = (this.min[0] - o[0])*dirfrac[0];
		var t2 = (this.max[0] - o[0])*dirfrac[0];
		var t3 = (this.min[1] - o[1])*dirfrac[1];
		var t4 = (this.max[1] - o[1])*dirfrac[1];
		var t5 = (this.min[2] - o[2])*dirfrac[2];
		var t6 = (this.max[2] - o[2])*dirfrac[2];

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
	
}

GLGE.Mesh.prototype.BuildRayTraceAccelerationStructure = function()
{
	
	this.RayTraceAccelerationStructure = new SimpleFaceListRTAS(this.faces.data,this.positions);

}

GLGE.Mesh.prototype.CPUPick = function(origin,direction,maxdist)
{

	  
	  if(this.InvisibleToCPUPick)
		return null;
	  if(!this.BoundingSphere || !this.BoundingBox || this.dirtyMesh)
	  {
			this.GenerateBounds();
	  }
	   
	  
	  var hit = this.BoundingSphere.intersect(origin,direction);
	  var intersections = [];
	  
	  if(hit > 0 && hit < maxdist)
	  {
		 
		 var bbhit = this.BoundingBox.intersect(origin,direction); 
		
		 if(bbhit.length > 0)
		 {
			 if(!this.RayTraceAccelerationStructure || this.dirtyMesh)
			 {
				 this.BuildRayTraceAccelerationStructure();
				
			 }
			 intersections = this.RayTraceAccelerationStructure.intersect(origin,direction); 		 
		 }
	  }
	  this.dirtyMesh = false;
      return intersections;
	 

}

GLGE.Object.prototype.CPUPick = function(origin,direction,maxdist)
{
	  if(this.InvisibleToCPUPick || this.getVisible() == false)
		return null;

	  
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
			
			ret = this.mesh.CPUPick(newo,newd,nmaxdist);
			for(var i = 0; i < ret.length; i++)
			{
				var mat2 = this.getModelMatrix().slice(0);
				ret[i].point = GLGE.mulMat4Vec3(mat2,ret[i].point);
				mat2[3] = 0;
				mat2[7] = 0;
				mat2[11] = 0;
				ret[i].norm = GLGE.mulMat4Vec3(mat2,ret[i].norm);
				ret[i].norm = GLGE.scaleVec3(ret[i].norm,1.0/GLGE.lengthVec3(ret[i].norm));
				ret[i].distance = GLGE.distanceVec3(origin,ret[i].point);
				ret[i].object = this;
				ret[i].priority = this.PickPriority ? this.PickPriority :  1;
			}
	  }
	  return ret;
}


