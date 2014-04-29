//define( ["vwf/model/threejs/three","vwf/model/threejs/MATH"], function(three, MATH ) {

var Mat4 = goog.vec.Mat4;
var Vec3 = goog.vec.Vec3;
///////////////////////////////////////////////////////////////////////////////
// add cpu side ray casting to MATH. Faster then GPU based picking in many cases

//Max number of faces a octree node may have before subdivding
var OCTMaxFaces = 20;
//max depth of the octree
var OCTMaxDepth = 4;



THREE.Object3D.prototype.getModelMatrix = function(mat)
{
	if(!mat) mat = [];
	var ele = this.matrixWorld.elements;
	mat[0] = ele[0]; mat[4] = ele[1]; mat[8] = ele[2]; mat[12] = ele[3];
	mat[1] = ele[4]; mat[5] = ele[5]; mat[9] = ele[6]; mat[13] = ele[7];
	mat[2] = ele[8]; mat[6] = ele[9]; mat[10] = ele[10]; mat[14] = ele[11];
	mat[3] = ele[12]; mat[7] = ele[13]; mat[11] = ele[14]; mat[15] = ele[15];
	
	return mat;
}

THREE.Object3D.prototype.getLocalMatrix = function(mat)
{
	
	if(!mat) mat = [];
	var ele = this.matrix.elements;
	mat[0] = ele[0]; mat[4] = ele[1]; mat[8] = ele[2]; mat[12] = ele[3];
	mat[1] = ele[4]; mat[5] = ele[5]; mat[9] = ele[6]; mat[13] = ele[7];
	mat[2] = ele[8]; mat[6] = ele[9]; mat[10] = ele[10]; mat[14] = ele[11];
	mat[3] = ele[12]; mat[7] = ele[13]; mat[11] = ele[14]; mat[15] = ele[15];
	
	return mat;
	
}

THREE.CPUPickOptions = function()
{
	this.UserRenderBatches = false;
	this.ignore = [];
	this.OneHitPerMesh = false;
}
// Return the nearsest, highest priority hit 
THREE.Scene.prototype.CPUPick = function(origin,direction,options)
{
	   //not currently using the max dist, but could make for some good optimizations	
	  
	   if(!options) options = new THREE.CPUPickOptions();
	   
	  
	  //concat all hits from children	  
      var hitlist = [];
	  var count = 0;
	  for(var i=0; i <  this.children.length; i++)
	  {
	     if(this.children[i].CPUPick)
		 {
				 var hit = this.children[i].CPUPick(origin,direction,options);
				 if(hit)
				 {
					for(var j =0; j<hit.length; j++)
						hitlist.push(hit[j]);
				 }
		 }
	  }
	if(options.UserRenderBatches && this.renderBatches)
	{
		for(var i = 0; i < this.renderBatches.length; i++)
		{
			if(this.renderBatches[i].renderObject)
			{
				 var hit = this.renderBatches[i].renderObject.CPUPick(origin,direction,options);
				 if(hit)
				 {
					for(var j =0; j<hit.length; j++)
						hitlist.push(hit[j]);
				 }
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





//MATH.Collada.prototype.CPUPick = MATH.Group.prototype.CPUPick;
//MATH.Collada.prototype.FrustrumCast = MATH.Group.prototype.FrustrumCast;
//this is a custom geometry type, not included in MATH distro
//JSONNode.prototype.CPUPick = MATH.Group.prototype.CPUPick;
//JSONNode.prototype.FrustrumCast = MATH.Group.prototype.FrustrumCast;
//MATH.Collada.prototype.GetBoundingBox = MATH.Group.prototype.GetBoundingBox;
//JSONNode.prototype.GetBoundingBox = MATH.Group.prototype.GetBoundingBox;

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
THREE.Geometry.prototype.GenerateBounds = function()
{
	var positions = [];
	for(var i =0; i < this.vertices.length; i++)
	{
		positions.push(this.vertices[i].x);
		positions.push(this.vertices[i].y);
		positions.push(this.vertices[i].z);
	}
	var bounds = FindMaxMin(positions);
	var min = bounds[0];
	var max = bounds[1];
	
	this.BoundingSphere = new BoundingSphereRTAS(min,max);
	this.BoundingBox = new BoundingBoxRTAS(min,max);
}
var n4 ;
var d4 ;
function intersectLinePlane(ray, raypoint, planepoint, planenormal)
		{
			n4 = MATH.dotVec3(MATH.subVec3(planepoint, raypoint), planenormal);
			d4 = MATH.dotVec3(ray, planenormal);
			if (d4 == 0) return null;
			
			var alongray = MATH.scaleVec3(ray,n4 / d4);
			return MATH.addVec3(alongray,	raypoint);
		}
		
//return the intersection of a ray and a sphere
var intersectRaySphere = function(origin,direction,center,radius)
{
		direction = MATH.scaleVec3(direction,1.0/MATH.lengthVec3(direction));
		center = MATH.subVec3(center,origin);
		var LdotC = MATH.dotVec3(direction,center);
		var c = MATH.lengthVec3(center);
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
	this.r = Math.max(MATH.distanceVec3(this.v0,this.c),MATH.distanceVec3(this.v1,this.c),MATH.distanceVec3(this.v2,this.c));
	
	//precomp some values used in intersection
	var s1 = MATH.subVec3(v1,v0);
	var s2 = MATH.subVec3(v2,v0);
	this.area = (MATH.lengthVec3(s1) * MATH.lengthVec3(s2))/2.0
	s1 = MATH.scaleVec3(s1,1.0/MATH.lengthVec3(s1));
	s2 = MATH.scaleVec3(s2,1.0/MATH.lengthVec3(s2));
	
	//generate the face normal
	var norm = MATH.crossVec3(s2,s1);
	norm = MATH.scaleVec3(norm,1.0/MATH.lengthVec3(norm));
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


function distanceLineSegment(o,d,v1,v2,hitData)
{
	//P(s) = P0 + sU
	//Q(t) = Q0 + tV
	
	var p0 = o;
	var q0 = v1;
	var s = 1;
	var t = MATH.distanceVec3(v1,v2);
	var v = MATH.toUnitVec3(MATH.subVec3(v2,v1));
	var u = d;
	var a = MATH.dotVec3(u,u);
	var b = MATH.dotVec3(u,v);
	var c = MATH.dotVec3(v,v);
	
	var w0 = MATH.subVec3(p0,q0);
	
	var d = MATH.dotVec3(u,w0);
	var e = MATH.dotVec3(v,w0);
	
	var Sc = (b * e - c*d)/(a*c - b*b);
	var Tc = (a*e - b*d)/(a*c - b*b);
	
	if(Tc/t < 0 || Tc/t > 1)
		return Infinity;
	
	var I1 = MATH.addVec3(p0,MATH.scaleVec3(u,Sc));	
	var I2 = MATH.addVec3(q0,MATH.scaleVec3(v,Tc));
	hitData.point = I2;
	var dist = MATH.distanceVec3(I1,I2)
	hitData.t = Tc/MATH.distanceVec3(v1,v2);
	
	return dist;
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
		var vec = MATH.subVec3(point,frustrum.planes[i].point);
		vec = MATH.toUnitVec3(vec);
		if(MATH.dotVec3(vec,frustrum.planes[i].normal) < 0)
			return false;
	}
	return true;

}



face.prototype.intersectFrustrum = function(frustrum,opts)
{
	if(pointInFrustrum(this.v0,frustrum)||pointInFrustrum(this.v0,frustrum)||pointInFrustrum(this.v0,frustrum))
	{
		var point = this.c;
		var norm = this.norm;
		return {point:point,norm:norm,face:this};
	}
	for(var i=0; i < 4; i ++)
	{
		
		if(this.intersect1(frustrum.cornerRays[i].o,frustrum.cornerRays[i].d,opts))
		{
			var point = this.c;
			var norm = this.norm;
			return {point:point,norm:norm,face:this};	
		}
	}
	return null;
}



function FaceIntersect()
{

	this.point = null;
	this.face = null;
	this.norm = null;

}


var temparray = [];
//intersect a ray with a face
face.prototype.intersect1 = function(p,d,opts)
{
	
	//huh. profiling shows this is much slower.
	//var hit = intersectRaySphere(p,d,this.c,this.r)
	//if(hit < 0) return null;
	if(opts)
		opts.faceTests++;
	
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
	{
		
		return null;
	}
		

	f = 1/a;
	vector(s,p,v0);
	u = f * (innerProduct(s,h));

	if (u < 0.0 || u > 1.0)
	{
		
		return null;
	}

	crossProduct(q,s,this.e1);
	v = f * innerProduct(d,q);

	if (v < 0.0 || u + v > 1.0)
	{
		
		return null;
	}

	// at this stage we can compute t to find out where
	// the intersection point is on the line
	t = f * innerProduct(this.e2,q);

	if (t > 0.00001) // ray intersection
	{
		var point = Vec3.add(p,Vec3.scale(d,t,temparray),[]);
		var norm = this.norm;
		if(MATH.dotVec3(d,norm) > 0)
		  norm = Vec3.scale(norm,-1,[]);

		var ret = new FaceIntersect();
		ret.point = point;
		ret.norm = norm;
		ret.face = this;
		
		
		return ret;
	}

	else // this means that there is a line intersection
		 // but not a ray intersection
	{
		
		return null;
	}

}

var A ;
	var B ;
	var C ;
	var rr ;
	var V  ;
	var d  ;
	var e  ;
	var sep1;
	var aa ;
	var ab ;
	var ac;
	var bb ;
	var bc;
	var cc;
	var sep2 ;
	var sep3 ;
	var sep4;
	var AB ;
	var BC ;
	var CA ;
	var d1 ;
	var d2 ;
	var d3 ;
	var e1 ;
	var e2 ;
	var e3 ;
	var Q1 ;
	var Q2 ;
	var Q3 ;
	var QC;
	var QA ;
	var QB;
	var sep5 ;
	var sep6 ;
	var sep7 ;
	var separated;


//p = [x,y,z] of center
face.prototype.intersectSphere = function(P,r,opts)
{
	 
	 A = MATH.subVec3(this.v0 , P);
	 B = MATH.subVec3(this.v1 , P);
	 C = MATH.subVec3(this.v2 , P);
	 rr = r * r;
	 V = MATH.crossVec3(MATH.subVec3(B , A), MATH.subVec3(C , A));
	 d = MATH.dotVec3(A, V);
	 e = MATH.dotVec3(V, V);
	 sep1 = d * d > rr * e;
	 aa = MATH.dotVec3(A, A);
	 ab = MATH.dotVec3(A, B);
	 ac = MATH.dotVec3(A, C);
	 bb = MATH.dotVec3(B, B);
	 bc = MATH.dotVec3(B, C);
	 cc = MATH.dotVec3(C, C);
	 sep2 = (aa > rr) && (ab > aa) && (ac > aa);
	 sep3 = (bb > rr) && (ab > bb) && (bc > bb);
	 sep4 = (cc > rr) && (ac > cc) && (bc > cc);
	 AB = MATH.subVec3(B , A);
	 BC = MATH.subVec3(C , B);
	 CA = MATH.subVec3(A , C);
	 d1 = ab - aa;
	 d2 = bc - bb;
	 d3 = ac - cc;
	 e1 = MATH.dotVec3(AB, AB);
	 e2 = MATH.dotVec3(BC, BC);
	 e3 = MATH.dotVec3(CA, CA);
	 Q1 = MATH.subVec3(MATH.scaleVec3(A , e1) , MATH.scaleVec3(AB,d1));
	 Q2 = MATH.subVec3(MATH.scaleVec3(B , e2) , MATH.scaleVec3(BC,d2));
	 Q3 = MATH.subVec3(MATH.scaleVec3(C , e3) , MATH.scaleVec3(CA,d3));
	 QC = MATH.subVec3(MATH.scaleVec3(C , e1) , Q1);
	 QA = MATH.subVec3(MATH.scaleVec3(A , e2) , Q2);
	 QB = MATH.subVec3(MATH.scaleVec3(B , e3) , Q3);
	 sep5 = (MATH.dotVec3(Q1, Q1) > rr * e1 * e1) && (MATH.dotVec3(Q1, QC) > 0);
	 sep6 = (MATH.dotVec3(Q2, Q2) > rr * e2 * e2) && (MATH.dotVec3(Q2, QA) > 0);
	 sep7 = (MATH.dotVec3(Q3, Q3) > rr * e3 * e3) && (MATH.dotVec3(Q3, QB) > 0);
	 separated = sep1 || sep2 || sep3 || sep4 || sep5 || sep6 || sep7;
	if(!separated)
	{
		 
		 var point;
		 if(d < 0)
		 {
			point = this.intersect1(P,this.norm,opts)
			if(point) point =  point.point;
			else
			point = intersectLinePlane(this.norm,P,this.v0,this.norm);
		 }
		 if(d >= 0)
		 {
			point = this.intersect1(P,MATH.scaleVec3(this.norm,-1),opts);
				if(point) point =  point.point;
			else
			point = intersectLinePlane(MATH.scaleVec3(this.norm,-1),P,this.v0,this.norm);
		 }
		 
		  var dp0 = Vec3.magnitudeSquared(MATH.subVec3(point,this.v0));
		  var dp1 = Vec3.magnitudeSquared(MATH.subVec3(point,this.v1));
		  var dp2 = Vec3.magnitudeSquared(MATH.subVec3(point,this.v2));
			
		  if(Math.min(dp0,dp1,dp2) == dp0)
			point = this.v0;
		  if(Math.min(dp0,dp1,dp2) == dp1)
			point = this.v1;
		  if(Math.min(dp0,dp1,dp2) == dp1)
			point = this.v1;
		return {norm:this.norm,face:this,point:point};
	
	}
	return null;

}

function testSphereTriPerf()
{
	var face1 = new face([Math.random(),Math.random(),Math.random()],[Math.random(),Math.random(),Math.random()],[Math.random(),Math.random(),Math.random()]);
	var start = performance.now();
	var p = [Math.random(),Math.random(),Math.random()];
	var r = Math.random();
	for(var i = 0; i < 100000; i++)
	{
	   face1.intersectSphere(p,r);
	}
	console.log(performance.now() - start);
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
SimpleFaceListRTAS.prototype.intersect = function(origin,direction,opts)
{
	var intersects = [];
	 intersects.length = 0;
	intersects.length = 0;
    for(var i =0; i < this.faces.length; i++)
	{
		var intersect = this.faces[i].intersect1(origin,direction,opts);
		if(intersect)
		{
			intersects.push(intersect);
			if(opts && opts.OneHitPerMesh)
			{
				return intersects;
			}
		}
	}
	return intersects;
}

//Intersect a sphere with a list of faces
SimpleFaceListRTAS.prototype.intersectSphere = function(center,radius,opts)
{
	var intersects = [];
    for(var i =0; i < this.faces.length; i++)
	{
		var intersect = this.faces[i].intersectSphere(center,radius);
		if(intersect)
		{
			intersects.push(intersect);
			if(opts && opts.OneHitPerMesh)
				return intersects;
		}
	}
	return intersects;
}

//Intersect a frustrum with a list of faces
SimpleFaceListRTAS.prototype.intersectFrustrum = function(frustrum,opts)
{
	var intersects = [];
    for(var i =0; i < this.faces.length; i++)
	{
		var intersect = this.faces[i].intersectFrustrum(frustrum,opts);
		if(intersect)
		{
			intersects.push(intersect);
			if(opts && opts.OneHitPerMesh)
			{
				
				return intersects;
			}
		}
	}
	return intersects;
}
//a quick structure to test bounding spheres
function BoundingSphereRTAS(min,max)
{
		
	this.center = MATH.scaleVec3(MATH.addVec3(min,max),.5);
	this.radius = MATH.lengthVec3(MATH.subVec3(max,min))/2.0;
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

	//avoid flipping min and max when they are infinity
	if(this.min[0] == Infinity || this.max[0] == -Infinity)
		return this;
	
	var mat = [];
	for(var i = 0; i < matrix.length; i++)
	 mat.push(matrix[i]);
	//mat = MATH.inverseMat4(mat); 
	
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
		allpoints = allpoints.concat(MATH.mulMat4Vec3(mat,points[i]));
	}
	//find new axis aligned bounds
	var bounds = FindMaxMin(allpoints);
	var min2 = bounds[0];
	var max2 = bounds[1];
	return new  BoundingBoxRTAS(min2,max2);
}

BoundingBoxRTAS.prototype.intersectFrustrum = function(frustrum,opts)
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
	for(var i=0; i < 4; i ++)
	{
		if(this.intersect(frustrum.cornerRays[i].o,frustrum.cornerRays[i].d))
			return [true];
	}
	return [];
}
//intersect ray and bounding box
BoundingBoxRTAS.prototype.intersect = function(o,d)
{	
		//TODO: are these loose bounds necessary?
		var min = [0,0,0]; min[0] = this.min[0]; min[1] = this.min[1]; min[2] = this.min[2];
		var max = [0,0,0]; max[0] = this.max[0]; max[1] = this.max[1]; max[2] = this.max[2];
 		var dirfrac = [0,0,0]; dirfrac[0] = 0; dirfrac[1] = 0; dirfrac[2] = 0; 
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
			return false;
		}

		// if tMath.min > tMath.max, ray doesn't intersect AABB
		if (tMathmin > tMathmax)
		{
			t = tMathmax;
			return false;
		}

		t = tMathmin;
		
    
   
    return true; // if we made it here, there was an intersection - YAY

}
BoundingBoxRTAS.prototype.buildFacelist = function()
{
	this.faces = [];
	
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));
	this.faces.push(new face([this.min[0],this.min[1],this.min[2]],[this.min[0],this.min[0],this.min[0]],[this.min[0],this.min[0],this.min[0]]));

}
BoundingBoxRTAS.prototype.intersectSphere = function(center,r)
{
	closest = [];
	closest[0] = (center[0] < this.min[0])? this.min[0] : (center[0] > this.max[0])? this.max[0] :center[0];
    closest[1] = (center[1] < this.min[1])? this.min[1]: (center[1] > this.max[1])?this.max[1] : center[1];
    closest[2] = (center[2] < this.min[2])? this.min[2]: (center[2] > this.max[2])? this.max[2] : center[2];
	var xDiff = MATH.subVec3(center,closest);
	var diff = Vec3.magnitudeSquared(xDiff);
	if(diff > r*r)
		return [];
//	var fDist = Math.sqrt(diff);	
//	var fDcoll = r - fDist;
//	xNcoll = xDiff  / fDist;
	return [true];
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
	this.c = [0,0,0]
	this.c[0] = this.min[0] + (this.max[0] - this.min[0])/2;
	this.c[1] = this.min[1] + (this.max[1] - this.min[1])/2;
	this.c[2] = this.min[2] + (this.max[2] - this.min[2])/2;

	this.r = MATH.distanceVec3(this.min,this.max)/2;
	var delta = this.r/1000;

	if(this.min[0] == this.max[0])
	{
		this.min[0] -= delta;
		this.max[0] += delta;
	}
	if(this.min[1] == this.max[1])
	{
		this.min[1] -= delta;
		this.max[1] += delta;
	}
	if(this.min[2] == this.max[2])
	{
		this.min[2] -= delta;
		this.max[2] += delta;
	}	
	this.isSplit = false;
	//The list of child regions
	this.children = [null,null,null,null,null,null,null,null];
}
//testing the bounds of the octree region is the same as testing a bounding box
OctreeRegion.prototype.testBounds = BoundingBoxRTAS.prototype.intersect;
OctreeRegion.prototype.testBoundsSphere = BoundingBoxRTAS.prototype.intersectSphere;
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

	if(point[0] >= this.min[0] && point[0] <= this.max[0])
		if(point[1] >= this.min[1] && point[1] <= this.max[1])
			if(point[2] >= this.min[2] && point[2] <= this.max[2])
				return true;	
	return false;		
}
//a face is inside if any of the verts are inside;
//OctreeRegion.prototype.testFace = function(face)
//{
//	if(this.pointInside(face.v0) && this.pointInside(face.v1) && this.pointInside(face.v2))
//		return true;
//    return false;
//}

function Project(points,norm)
{
	var min = Infinity;
	var max = -Infinity;

	for(var i =0; i < points.length; i++)
	{
		var val = MATH.dotVec3(norm,points[i]);
		if(val < min) min = val;
		if(val > max) max = val;
	}
	return [min,max];
}
function getCorners(box)
{
	return [
	[box.min[0],box.min[1],box.min[2]],
	[box.min[0],box.min[1],box.max[2]],
	[box.min[0],box.max[1],box.min[2]],
	[box.min[0],box.max[1],box.max[2]],
	[box.max[0],box.min[1],box.min[2]],
	[box.max[0],box.min[1],box.max[2]],
	[box.max[0],box.max[1],box.min[2]],
	[box.max[0],box.max[1],box.max[2]],
	];
}
function AABBTriTest(box,tri)
{
	var triMin, triMax;
	var boxMin, boxMax;

	var boxNorms = [[1,0,0],[0,1,0],[0,0,1]];
	for(var i = 0; i < 3; i++)
	{
		var n = boxNorms[i];
		var ret = Project([tri.v0,tri.v1,tri.v2],n);
		triMin = ret[0]; 
		triMax = ret[1];
		if(triMax < box.min[i] || triMin > box.max[i])
			return false;
	}

	var boxVerts = getCorners(box);
	var triOffset = MATH.dotVec3(tri.norm,tri.v0);
	var ret = Project(boxVerts,tri.norm);
	boxMin = ret[0];
	boxMax = ret[1];
	if(boxMax < triOffset || boxMin > triOffset)
			return false;

	var triEdges = [MATH.subVec3(tri.v0,tri.v1),MATH.subVec3(tri.v1,tri.v2),MATH.subVec3(tri.v2,tri.v0)];
	for (var i = 0; i < 3; i++)
    for (var j = 0; j < 3; j++)
    {
    	var axis = MATH.crossVec3(triEdges[i],boxNorms[j]);
    	var ret = Project(boxVerts,axis);
    	boxMin = ret[0];
    	boxMax = ret[1];
    	var ret = Project([tri.v0,tri.v1,tri.v2],axis);
    	triMin = ret[0];
		triMax = ret[1];
		if(boxMax < triMin ||boxMin > triMax)
			return false;
    }
    return true;
}

//a face is inside if any of the verts are inside;
OctreeRegion.prototype.testFace = function(face)
{
	if(this.pointInside(face.v0) || this.pointInside(face.v1)|| this.pointInside(face.v2))
		return true;
	
	return AABBTriTest(this,face);
    
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
	//no, makes sense.
	// no it doesn't. There can be no faces that are in this region but intersect no child regions
	if(added == 0)
	{
		
		this.distributeFace(face);
		this.facesNotDistributed.push(face);
	}
}
OctreeRegion.prototype.getFaces = function(list)
{
	if(!list) list = [];
	if(this.isSplit)
		list = list.concat(this.facesNotDistributed)
	else
		list = list.concat(this.faces)

	if(this.isSplit)
		for(var i =0; i < this.children.length; i++)
			list = this.children[i].getFaces(list);

		return list;

}
//Test a ray against an octree region
OctreeRegion.prototype.intersect = function(o,d,opts)
{
	
	var hits = [];
	hits.length = 0;
	//if no faces, can be no hits. 
	//remember, faces is all faces in this node AND its children
	if(this.faces.length == 0)
		return hits;
	
	//if the node is split, then we test the non distributed faces, which are not in any children
	var facelist = this.faces;
	if(this.isSplit)
	   facelist = this.facesNotDistributed;


//cant do this until can figure way to deal with 1D distance move into nonuniform scale space
//	if(opts && opts.maxDist)
//	{
//		if(MATH.distanceVec3(o,this.c) - this.r > opts.maxDist)
//		{
//				opts.objectRegionsRejectedByDist++;
//				return hits;
//		}
//
//	}

	//check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
	//for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
	for(var i = 0; i < facelist.length; i++)
	{
		
		
		var facehits = facelist[i].intersect1(o,d,opts);
		if(facehits)
		{
			hits.push(facehits);
			if(opts && opts.OneHitPerMesh)
			{
				
				return hits;
			}
		}
	}
	
	
	
	
	if(opts) opts.objectRegionsTested++;
	
	//if the node is split, concat the hits from all children
	if(this.isSplit)
	{
		for(var i = 0; i < this.children.length; i++)
		{

			//reject this node if the ray does not intersect it's bounding box
			if(this.children[i].testBounds(o,d)== true)
			{
				//console.log('region rejected');
				var childhits = this.children[i].intersect(o,d,opts);
				if(childhits)
				{
					for(var j = 0; j < childhits.length; j++)
					{
					    hits.push(childhits[j]);
						if(opts && opts.OneHitPerMesh)
						{
							childhits[j] = null;
							
							return hits;
						}
					}
					childhits.length = 0;
					
				}
			}
			else if(opts)
					opts.objectRegionsRejectedByBounds++;
		}
	}
	return hits;
}

//Test a ray against an octree region
OctreeRegion.prototype.intersectFrustrum = function(frustrum,opts)
{
	
	var hits = [];
	

//reject this node if the ray does not intersect it's bounding box
	if(this.testBoundsFrustrum(frustrum).length == 0)
	{
		//console.log('region rejected');
		return hits;
	}

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
		var facehits = facelist[i].intersectFrustrum(frustrum,opts);
		if(facehits)
		{
			hits.push(facehits);
			if(opts && opts.OneHitPerMesh)
			{
				
				return hits;
			}
		}
	}
	
	
	
	//if the node is split, concat the hits from all children
	if(this.isSplit)
	{
		for(var i = 0; i < this.children.length; i++)
		{
			var childhits = this.children[i].intersectFrustrum(frustrum,opts);
			if(childhits)
			{
				for(var j = 0; j < childhits.length; j++)
				{
				    hits.push(childhits[j]);
					if(opts && opts.OneHitPerMesh)
					{
						
						return hits;
					}
				}
			}
		}
	}
	return hits;
}

//Test a ray against an octree region
OctreeRegion.prototype.intersectSphere = function(center,r,opts)
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
		var facehits = facelist[i].intersectSphere(center,r,opts);
		if(facehits)
		{
			hits.push(facehits);
			if(opts && opts.OneHitPerMesh)
			{
				
				return hits;
			}
			if(hits.length > 5)
				break;
			
		}
	}
	
	//reject this node if the ray does not intersect it's bounding box
	if(this.testBoundsSphere(center,r).length == 0)
	{
		//console.log('region rejected');
		return hits;
	}
	
	//if the node is split, concat the hits from all children
	if(this.isSplit)
	{
		for(var i = 0; i < this.children.length; i++)
		{
			var childhits = this.children[i].intersectSphere(center,r,opts);
			if(childhits)
			{
				for(var j = 0; j < childhits.length; j++)
				{
				    hits.push(childhits[j]);
					if(opts && opts.OneHitPerMesh)
					{
						
						return hits;
					}
				}
			}
		}
	}
	return hits;
}

OctreeRegion.prototype.getLeaves = function(leaves)
{
	if (!leaves)
		leaves = [];
	if(this.isSplit)
	{
		for(var i = 0; i < this.children.length; i++)
			leaves = this.children[i].getLeaves(leaves);
	}else
	{
		if(this.faces.length > 0)
		leaves.push(this);
	}
	return leaves;
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
OctreeRTAS.prototype.intersect = function(o,d,opts)
{
	
	return this.root.intersect(o,d,opts);
}
OctreeRTAS.prototype.intersectFrustrum = function(frustrum,opts)
{
	return this.root.intersectFrustrum(frustrum,opts);
}
OctreeRTAS.prototype.intersectSphere = function(center,r,opts)
{
	return this.root.intersectSphere(center,r,opts);
}
//Generate either an octree of a face list to test rays.
//note: the max faces can make big performance difference here.
THREE.Geometry.prototype.BuildRayTraceAccelerationStructure = function()
{
	
	var positions = [];
	for(var i =0; i < this.vertices.length; i++)
	{
		positions.push(this.vertices[i].x);
		positions.push(this.vertices[i].y);
		positions.push(this.vertices[i].z);
	}
	//decompose the face3 and face4 data from the THREEjs faces into a list of tri indexes
	var facedata = [];
	for(var i = 0; i < this.faces.length; i++)
	{
		var face = this.faces[i];
		if(face instanceof THREE.Face3)
		{
			facedata.push(face.a);
			facedata.push(face.b);
			facedata.push(face.c);
		}
		if(face instanceof THREE.Face4)
		{
			facedata.push(face.a);
			facedata.push(face.b);
			facedata.push(face.c);
			
			facedata.push(face.c);
			facedata.push(face.d);
			facedata.push(face.a);
		}
	
	
	}
	
	if(this.faces.length > OCTMaxFaces)
	{
	
		this.RayTraceAccelerationStructure = new OctreeRTAS(facedata,positions,this.BoundingBox.min,this.BoundingBox.max);
		
	}
	else
	{
		this.RayTraceAccelerationStructure = new SimpleFaceListRTAS(facedata,positions);
	}
	
}
THREE.Geometry.prototype.clone_internal = THREE.Geometry.prototype.clone;
THREE.Geometry.prototype.clone = function()
{

	var ret = this.clone_internal();
	ret.RayTraceAccelerationStructure = this.RayTraceAccelerationStructure;
	return ret;
}
//Get the bounds for an object
THREE.Geometry.prototype.GetBoundingBox = function()
{
      if(!this.BoundingSphere || !this.BoundingBox || this.dirtyMesh)
	  {
			this.GenerateBounds();
	  }
	  return this.BoundingBox;
}
//Get the bounds for an object
THREE.Geometry.prototype.setPickGeometry = function(PickGeometry)
{
	  this.PickGeometry = PickGeometry;
}
//Do the actuall intersection with the mesh;
THREE.Geometry.prototype.CPUPick = function(origin,direction,options,collisionType,meshparent)
{
		
		//sseems like it's possible that nan can creep into the three.matrix, reject this whole mesh in that case.
	  if(isNaN(origin[0]) || isNaN(direction[0]))
	  	return [];

	  if(!collisionType)
		collisionType = 'mesh';
		
	  if(this.InvisibleToCPUPick)
		return [];
	  
	  //allow a picking mesh that differs from the visible mesh
	  if(this.PickGeometry)
	  {
		
		return this.PickGeometry.CPUPick(origin,direction,options,collisionType,meshparent);
	  }
		
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
	  intersections.length = 0;
	  //if(hit > 0 && hit < maxdist)
	  {
		 
		 //try to reject based on bounding box.
		 var bbhit = this.BoundingBox.intersect(origin,direction); 
		 if(collisionType == 'mesh')
		 {
			 if(bbhit)
			 {
				
				var oldTests = options? options.faceTests : 0;
				 //build the octree or the facelist
				 if(!this.RayTraceAccelerationStructure || this.dirtyMesh)
				 {
				 	 
					 this.BuildRayTraceAccelerationStructure();
					 
					 if(false && this.RayTraceAccelerationStructure.root)
					 {
					 	
					 	var leafBounds = this.RayTraceAccelerationStructure.root.getLeaves();
						console.log(leafBounds);
						var mat = new THREE.MeshPhongMaterial();
						mat.color.r = 1;
						mat.color.g = 0;
						mat.color.b = 0;
						mat.ambient.r = 1;
						mat.ambient.g = 0;
						mat.ambient.b = 0;
						//mat.opacity = .2;
						//mat.transparent = true;
						mat.wireframe = true;
						var faces = 0;
						for(var i =0; i < leafBounds.length; i++)
						{
							faces += leafBounds[i].faces.length;
							var mesh = SceneManagerRegion.prototype.BuildWireBox([leafBounds[i].max[0] - leafBounds[i].min[0],leafBounds[i].max[1] - leafBounds[i].min[1],leafBounds[i].max[2] - leafBounds[i].min[2]],[0,0,0],[0,0,0]);
							
							mesh.matrix.elements[12]=leafBounds[i].c[0];
							mesh.matrix.elements[13]=leafBounds[i].c[1];
							mesh.matrix.elements[14]=leafBounds[i].c[2];
							mesh.matrixAutoUpdate = false;
							meshparent.add(mesh,true);
							mesh.updateMatrixWorld(true);
						}	
						console.log(faces);
					}
				 }
				 
				 intersections = this.RayTraceAccelerationStructure.intersect(origin,direction,options); 
				 //do actual mesh intersection
				 if(options)
				 {
				 	options.objectTests ++;
				 	options.objectsTested && options.objectsTested.push({object:meshparent,hits:( options.faceTests - oldTests)});
				 }		 
			 }else
			 {
			 	 if(options)
			 	 	options.objectsRejectedByBounds++;
			 }
		 }
		 if(collisionType == 'box')
		 {
			
		 }
		 if(collisionType == 'sphere')
		 {
		 
		 }
	  }
	  this.dirtyMesh = false;
      return intersections;
	 

}
//Do the actuall intersection with the mesh;
THREE.Geometry.prototype.FrustrumCast = function(frustrum,opts)
{
	  if(this.InvisibleToCPUPick)
		return null;
	  
	  //allow a picking mesh that differs from the visible mesh
	  if(this.PickGeometry)
		return this.PickGeometry.FrustrumCast(frustrum,opts);
		
      //if for some reason dont have good bounds, generate	 
	  if(!this.BoundingSphere || !this.BoundingBox || this.dirtyMesh)
	  {
			this.GenerateBounds();
	  }
	   	
	 var intersections = [];
	 //try to reject based on bounding box.
	 var bbhit = this.BoundingBox.intersectFrustrum(frustrum,opts); 
	
	 if(bbhit.length > 0)
	 {
				
		 //build the octree or the facelist
		 if(!this.RayTraceAccelerationStructure || this.dirtyMesh)
		 {
			 this.BuildRayTraceAccelerationStructure();
			
		 }
		 //do actual mesh intersection
		 intersections = this.RayTraceAccelerationStructure.intersectFrustrum(frustrum,opts); 		 
	 }
	  
	  this.dirtyMesh = false;
      return intersections;
}

//Do the actuall intersection with the mesh;
THREE.Geometry.prototype.SphereCast = function(center,r,opts)
{
	  if(this.InvisibleToCPUPick)
		return null;
	  
	  //allow a picking mesh that differs from the visible mesh
	  if(this.PickGeometry)
		return this.PickGeometry.SphereCast(center,r,opts);
		
      //if for some reason dont have good bounds, generate	 
	  if(!this.BoundingSphere || !this.BoundingBox || this.dirtyMesh)
	  {
			this.GenerateBounds();
	  }
	   	
	 var intersections = [];
	 //try to reject based on bounding box.
	 
	 var bbhit = this.BoundingBox.intersectSphere(center,r,opts); 
	
	 if(bbhit.length > 0)
	 {
				
				bbhit = this.BoundingBox.intersectSphere(center,r,opts); 
		 //build the octree or the facelist
		 if(!this.RayTraceAccelerationStructure || this.dirtyMesh)
		 {
			 this.BuildRayTraceAccelerationStructure();
			
		 }
		 //do actual mesh intersection
		 intersections = this.RayTraceAccelerationStructure.intersectSphere(center,r,opts); 		 
	 }
	  
	  this.dirtyMesh = false;
      return intersections;
}

THREE.BufferGeometry.prototype.GetBoundingBox = THREE.Geometry.prototype.GetBoundingBox;
THREE.BufferGeometry.prototype.FrustrumCast  = THREE.Geometry.prototype.FrustrumCast;
THREE.BufferGeometry.prototype.CPUPick  = THREE.Geometry.prototype.CPUPick;
THREE.BufferGeometry.prototype.SphereCast  = THREE.Geometry.prototype.SphereCast;
THREE.BufferGeometry.prototype.GenerateBounds = function()
{

	var positions = this.attributes.position.array;
	var bounds = FindMaxMin(positions);
	var min = bounds[0];
	var max = bounds[1];
	
	this.BoundingSphere = new BoundingSphereRTAS(min,max);
	this.BoundingBox = new BoundingBoxRTAS(min,max);
}

THREE.BufferGeometry.prototype.BuildRayTraceAccelerationStructure = function()
{

	
	var positions = this.attributes.position.array;
	//decompose the face3 and face4 data from the THREEjs faces into a list of tri indexes
	var facedata = this.attributes.index.array;

	
	if(this.attributes.index.array.length/3 > OCTMaxFaces)
	{
	
		this.RayTraceAccelerationStructure = new OctreeRTAS(facedata,positions,this.BoundingBox.min,this.BoundingBox.max);
		
	}
	else
	{
		this.RayTraceAccelerationStructure = new SimpleFaceListRTAS(facedata,positions);
	}



}
//Get the bounding box for a group
THREE.Object3D.prototype.GetBoundingBox = function(local)
{
	//make blank box and expand by children's bounds
	var box = new BoundingBoxRTAS();
	for(var i=0; i <  this.children.length; i++)
	{
		if(this.children[i].GetBoundingBox)
			box.expandBy(this.children[i].GetBoundingBox());
	}
	if(this.geometry)
	{
		box.expandBy(this.geometry.GetBoundingBox());	
	}
	
	//Transform by the local matrix.
	//set local to true to get the bounds without this top node transform
	//useful for drawing the bounds in non AABB form
	if(!local)
		box = box.transformBy(this.getLocalMatrix());
	return box;
}
THREE.Object3D.prototype.getBoundingBox = THREE.Object3D.prototype.GetBoundingBox;
//Should I ignore this? true for yes
THREE.Object3D.prototype.ignoreTest =function(ignore)
{
	if(!ignore)
		return false;
	if(ignore.length == 0)
		return false;
	var parent = this;
	while(parent)
	{
		if(ignore.indexOf(parent) != -1) return true;
	
		parent = parent.parent;
	}
	return false;
}
//no need to test bounding box here. Can only contain one mesh, and the mesh will check its own
//boudning box.
THREE.Object3D.prototype.CPUPick = function(origin,direction,options)
{
	  
	 if(options && options.filter && this)
	 {
			
			if(!options.filter(this))
				return null;
	  }
	  
	  if(this.ignoreTest(options && options.ignore))
		return null;
	  if(options.UserRenderBatches && this.isBatched)
		return null;
	  if(this.InvisibleToCPUPick)
		return null;

		
	  var ret = [];
	  ret.length = 0;
	  //iterate the children and concat all hits
	  //note - still in world space here
	  for(var i=0; i <  this.children.length; i++)
	  {
		 if(this.children[i].CPUPick)
		 {
			 var hit = this.children[i].CPUPick(origin,direction,options);
			 if(hit)
			 {
				for(var j =0; j<hit.length; j++)
					ret.push(hit[j]);
				hit.length = 0;
				
			 }
		 }
	  }
	 
		
	  if(this.geometry)
	  {	
	  	
	  //at this point, were going to move the ray into the space relative to the mesh. until now, the ray has been in worldspace.
	  var mat = this.getModelMatrix([]);
	  var tmp2 = [];
	  Mat4.invert(mat,tmp2);
	 
	  mat = tmp2;
	  var newo = MATH.mulMat4Vec3(mat,origin);
	  
	  

	  mat = this.getModelMatrix([]);
	  mat[3] = 0;
	  mat[7] = 0;
	  mat[11] = 0;
	  var tmp = [];
	  Mat4.invert(mat,tmp);
	  
	  mat = tmp;
      var newd = MATH.mulMat4Vec3(mat,direction);
	  var mat2 = this.getModelMatrix([]);
	  var mat3 = this.getModelMatrix([]);
	  mat3[3] = 0;
	  mat3[7] = 0;
	  mat3[11] = 0;
	  
	  
	  
		  if(this instanceof THREE.Mesh)
		  {
				//collide with the mesh
				var ret2 = this.geometry.CPUPick(newo,newd,options,null,this);
				
				for(var i = 0; i < ret2.length; i++)
				{	
					
					//move the normal and hit point into worldspace
					

					var tmp = MATH.mulMat4Vec3(mat2,ret2[i].point,[0,0,0]);
					
					ret2[i].point = tmp;

					tmp = MATH.mulMat4Vec3(mat3,ret2[i].norm,[0,0,0]);
					
					ret2[i].norm = tmp;

					tmp = Vec3.normalize(ret2[i].norm,[0,0,0]);
					
					ret2[i].norm = tmp;
					ret2[i].distance = MATH.distanceVec3(origin,ret2[i].point);
					ret2[i].object = this;
					ret2[i].priority = this.PickPriority !== undefined ? this.PickPriority :  1;
				}
				for(var i = 0; i < ret2.length; i++)
					ret.push(ret2[i]);
				ret2.length = 0;
				
			}
			if(this instanceof THREE.Line)
			{
				for(var i =0; i < this.geometry.vertices.length-1; i++)
				{
					var hitdata = {};
					
					var v1 = [this.geometry.vertices[i].x,this.geometry.vertices[i].y,this.geometry.vertices[i].z];
					var v2 = [this.geometry.vertices[i+1].x,this.geometry.vertices[i+1].y,this.geometry.vertices[i+1].z];
					var hitdist = distanceLineSegment(newo,newd,v1,v2,hitdata);
					if(hitdist < Math.min(MATH.distanceVec3(newo,v1),MATH.distanceVec3(newo,v2))/50 )
					{
					   var hit = {};
					   hit.point = hitdata.point;
					   hit.vertindex = hitdata.t < .5?i:i+1;
					   hit.t = hitdata.t;
					   hit.norm = [0,0,1];
					   hit.distance = hitdist;
					   hit.object = this;
					   hit.priority = this.PickPriority !== undefined ? this.PickPriority :  1;
					   ret.push(hit);
					}
				}
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
					

	this.nearnorm=MATH.toUnitVec3(MATH.crossVec3(MATH.subVec3(this.ntr,this.nbr),MATH.subVec3(this.nbl,this.nbr)));
	this.farnorm=MATH.toUnitVec3(MATH.crossVec3(MATH.subVec3(this.ftl,this.fbl),MATH.subVec3(this.ftr,this.fbl)));
	this.leftnorm=MATH.toUnitVec3(MATH.crossVec3(MATH.subVec3(this.nbl,this.fbl),MATH.subVec3(this.ftl,this.fbl)));
	this.rightnorm=MATH.toUnitVec3(MATH.crossVec3(MATH.subVec3(this.ftr,this.ntr),MATH.subVec3(this.ntr,this.nbr)));
	this.topnorm=MATH.toUnitVec3(MATH.crossVec3(MATH.subVec3(this.ftl,this.ntr),MATH.subVec3(this.ntr,this.ftr)));
	this.bottomnorm=MATH.toUnitVec3(MATH.crossVec3(MATH.subVec3(this.nbl,this.nbr),MATH.subVec3(this.fbl,this.nbl)));
	
	this.nearplane = {point:this.ntl,normal:MATH.scaleVec3(this.nearnorm,-1)};
	this.farplane = {point:this.ftl,normal:MATH.scaleVec3(this.farnorm,-1)};
	this.leftplane = {point:this.ftl,normal:MATH.scaleVec3(this.leftnorm,-1)};
	this.rightplane = {point:this.ntr,normal:MATH.scaleVec3(this.rightnorm,-1)};
	this.topplane = {point:this.ftl,normal:MATH.scaleVec3(this.topnorm,-1)};
	this.bottomplane = {point:this.fbl,normal:MATH.scaleVec3(this.bottomnorm,-1)};
	this.planes = [this.nearplane,this.farplane,this.leftplane,this.rightplane,this.topplane,this.bottomplane];
	
	this.cornerRays = [];
	var rayTL = MATH.toUnitVec3(MATH.subVec3(this.ftl,this.ntl));
	var rayTR = MATH.toUnitVec3(MATH.subVec3(this.ftr,this.ntr));
	var rayBL = MATH.toUnitVec3(MATH.subVec3(this.fbl,this.nbl));
	var rayBR = MATH.toUnitVec3(MATH.subVec3(this.fbr,this.nbr));
	
	this.cornerRays.push({o:this.ntl,d:rayTL});
	this.cornerRays.push({o:this.ntr,d:rayTR});
	this.cornerRays.push({o:this.nbl,d:rayBL});
	this.cornerRays.push({o:this.nbr,d:rayBR});
	
	
	this.transformBy = function(matrix)
	{
		var ntl = MATH.mulMat4Vec3(matrix,this.ntl);
		var ntr = MATH.mulMat4Vec3(matrix,this.ntr);
		var nbl = MATH.mulMat4Vec3(matrix,this.nbl);
		var nbr = MATH.mulMat4Vec3(matrix,this.nbr);
		
		var ftl = MATH.mulMat4Vec3(matrix,this.ftl);
		var ftr = MATH.mulMat4Vec3(matrix,this.ftr);
		var fbl = MATH.mulMat4Vec3(matrix,this.fbl);
		var fbr = MATH.mulMat4Vec3(matrix,this.fbr);
		
		return new Frustrum(ntl,ntr,nbl,nbr,ftl,ftr,fbl,fbr);	
	}
}

THREE.Object3D.prototype.FrustrumCast = function(frustrum,options)
{
	  

		if(options && options.filter && this)
	 {
			
			if(!options.filter(this))
				return null;
	  }
	  
	  if(this.ignoreTest(options && options.ignore))
		return null;
	  if(options.UserRenderBatches && this.isBatched)
		return null;
	  if(this.InvisibleToCPUPick)
		return null;
	
     var ret = [];
	  
	  //iterate the children and concat all hits
	  for(var i=0; i <  this.children.length; i++)
	  {
		 if(this.children[i].FrustrumCast)
		 {
			 var hit = this.children[i].FrustrumCast(frustrum,options);
			 if(hit)
			 {
				for(var j =0; j<hit.length; j++)
					ret.push(hit[j]);
			 }
		 }
	  }
		
		
	  
	  
	  
      if(this.geometry)
	  {
	  
			  //at this point, were going to move the ray into the space relative to the mesh. until now, the ray has been in worldspace.
			  var mat;
			  var mat2;
			  
			  
			 
			  mat = this.getModelMatrix().slice(0);
			  mat = MATH.inverseMat4(mat);
			  var tfrustrum = frustrum.transformBy(mat);
	  
			if(this instanceof THREE.Mesh)
			{
				//collide with the mesh
				ret = this.geometry.FrustrumCast(tfrustrum,options);
				if(ret.length)
					mat2 = this.getModelMatrix().slice(0);
				for(var i = 0; i < ret.length; i++)
				{	
					//move the normal and hit point into worldspace
					
					ret[i].point = MATH.mulMat4Vec3(mat2,ret[i].point);
					mat2[3] = 0;
					mat2[7] = 0;
					mat2[11] = 0;
					ret[i].norm = MATH.mulMat4Vec3(mat2,ret[i].norm);
					ret[i].norm = MATH.scaleVec3(ret[i].norm,1.0/MATH.lengthVec3(ret[i].norm));
					ret[i].distance = MATH.distanceVec3([0,0,0],ret[i].point);
					ret[i].object = this;
					ret[i].priority = this.PickPriority !== undefined ? this.PickPriority :  1;
				}
			}
			if(this instanceof THREE.Line)
			{
				mat2 = this.getModelMatrix().slice(0);
				for(var i = 0; i < this.geometry.vertices.length; i++)
				{
					var v0 = [this.geometry.vertices[i].x,this.geometry.vertices[i].y,this.geometry.vertices[i].z];
					if(pointInFrustrum(v0,tfrustrum))
					{
						var hit = {};
						hit.point = MATH.mulMat4Vec3(mat2,v0);
						mat2[3] = 0;
						mat2[7] = 0;
						mat2[11] = 0;
						hit.norm = MATH.mulMat4Vec3(mat2,[0,0,1]);
						hit.distance = MATH.distanceVec3([0,0,0],hit.point);
						hit.object = this;
						hit.priority = this.PickPriority !== undefined ? this.PickPriority :  1;
						ret.push(hit);
					}
				}
			}
			
	  }
	  return ret;
}

THREE.Object3D.prototype.SphereCast = function(center,r,options)
{
	if(options && options.filter && this)
	 {
			
			if(!options.filter(this))
				return null;
	  }
	  
	 if(this.ignoreTest(options && options.ignore))
		return null;
	  if(options.UserRenderBatches && this.isBatched)
		return null;
	  if(this.InvisibleToCPUPick)
		return null;

	
     var ret = [];
	  
	  //iterate the children and concat all hits
	  for(var i=0; i <  this.children.length; i++)
	  {
		 if(this.children[i].SphereCast)
		 {
			 var hit = this.children[i].SphereCast(center,r,options);
			 if(hit)
			 {
				for(var j =0; j<hit.length; j++)
					ret.push(hit[j]);
			 }
		 }
	  }
		
		
	  
	  
	  
      if(this.geometry)
	  {
	  
			  //at this point, were going to move the ray into the space relative to the mesh. until now, the ray has been in worldspace.
			  var mat;
			  var mat2;
			  
	  var mat = this.getModelMatrix().slice(0);
	  mat = MATH.inverseMat4(mat);
	  var tCenter = MATH.mulMat4Vec3(mat,center);
	  
	  
	  mat[3] = 0;
	  mat[7] = 0;
	  mat[11] = 0; 
	  var tR = r * MATH.lengthVec3([mat[0],mat[4],mat[8]]);
	 
	  var mat2 = this.getModelMatrix().slice(0);
	  var mat3 = this.getModelMatrix().slice(0);
	  mat3[3] = 0;
	  mat3[7] = 0;
	  mat3[11] = 0;
	  
			 
			  
			     
			if(this instanceof THREE.Mesh)
			{
				//collide with the mesh
				ret = this.geometry.SphereCast(tCenter,tR,options);
				if(ret.length)
					mat2 = this.getModelMatrix().slice(0);
				for(var i = 0; i < ret.length; i++)
				{	
					//move the normal and hit point into worldspace
					
					
					
					ret[i].point = MATH.mulMat4Vec3(mat2,ret[i].point);
					ret[i].norm = MATH.mulMat4Vec3(mat3,ret[i].norm);
					ret[i].norm = MATH.scaleVec3(ret[i].norm,1.0/MATH.lengthVec3(ret[i].norm));
					ret[i].distance = MATH.distanceVec3([0,0,0],ret[i].point);
					ret[i].object = this;
					ret[i].priority = this.PickPriority !== undefined ? this.PickPriority :  1;
				}
			}
			// if(this instanceof THREE.Line)
			// {
				// mat2 = this.getModelMatrix().slice(0);
				// for(var i = 0; i < this.geometry.vertices.length; i++)
				// {
					// var v0 = [this.geometry.vertices[i].x,this.geometry.vertices[i].y,this.geometry.vertices[i].z];
					// if(pointInFrustrum(v0,tfrustrum))
					// {
						// var hit = {};
						// hit.point = MATH.mulMat4Vec3(mat2,v0);
						// mat2[3] = 0;
						// mat2[7] = 0;
						// mat2[11] = 0;
						// hit.norm = MATH.mulMat4Vec3(mat2,[0,0,1]);
						// hit.distance = MATH.distanceVec3([0,0,0],hit.point);
						// hit.object = this;
						// hit.priority = this.PickPriority !== undefined ? this.PickPriority :  1;
						// ret.push(hit);
					// }
				// }
			// }
			
	  }
	  return ret;
}

THREE.Scene.prototype.SphereCast = THREE.Object3D.prototype.SphereCast;
/* MATH.Light.prototype.CPUPick = function(origin,direction,maxdist)
{
	  

	  //at this point, were going to move the ray into the space relative to the mesh. until now, the ray has been in worldspace.
	  var mat = this.getModelMatrix().slice(0);
	  mat = MATH.inverseMat4(mat);
	  var newo = MATH.mulMat4Vec3(mat,origin);
	  var nmaxdist = maxdist;// * Math.abs(mat[0]);
	  mat = this.getModelMatrix().slice(0);
	  mat[3] = 0;
	  mat[7] = 0;
	  mat[11] = 0;
	  mat = MATH.inverseMat4(mat);
      var newd = MATH.mulMat4Vec3(mat,direction);
	  
	  
	  
	  var ret = [];
      
			
			//collide with the mesh
			ret = this.GetBoundingBox().intersect(newo,newd);
			
			for(var i = 0; i < ret.length; i++)
			{	
				
				//move the normal and hit point into worldspace
				var mat2 = this.getModelMatrix().slice(0);
				ret[i] = {};
				ret[i].point = MATH.mulMat4Vec3(mat2,[0,0,0]);
				mat2[3] = 0;
				mat2[7] = 0;
				mat2[11] = 0;
				ret[i].norm = MATH.mulMat4Vec3(mat2,[0,0,1]);
				ret[i].distance = MATH.distanceVec3(origin,ret[i].point);
				ret[i].object = this;
				ret[i].priority = this.PickPriority !== undefined ? this.PickPriority :  1;
			}
	  
	  return ret;
} */
/*
MATH.ParticleSystem.prototype.CPUPick = function(origin,direction,maxdist)
{
	  

	  //at this point, were going to move the ray into the space relative to the mesh. until now, the ray has been in worldspace.
	  var mat = this.getModelMatrix().slice(0);
	  mat = MATH.inverseMat4(mat);
	  var newo = MATH.mulMat4Vec3(mat,origin);
	  var nmaxdist = maxdist;// * Math.abs(mat[0]);
	  mat = this.getModelMatrix().slice(0);
	  mat[3] = 0;
	  mat[7] = 0;
	  mat[11] = 0;
	  mat = MATH.inverseMat4(mat);
      var newd = MATH.mulMat4Vec3(mat,direction);
	  
	  
	  
	  var ret = [];
      
			
			//collide with the mesh
			ret = this.GetBoundingBox().intersect(newo,newd);
			
			for(var i = 0; i < ret.length; i++)
			{	
				
				//move the normal and hit point into worldspace
				var mat2 = this.getModelMatrix().slice(0);
				ret[i] = {};
				ret[i].point = MATH.mulMat4Vec3(mat2,[0,0,0]);
				mat2[3] = 0;
				mat2[7] = 0;
				mat2[11] = 0;
				ret[i].norm = MATH.mulMat4Vec3(mat2,[0,0,1]);
				ret[i].distance = MATH.distanceVec3(origin,ret[i].point);
				ret[i].object = this;
				ret[i].priority = this.PickPriority !== undefined ? this.PickPriority :  1;
			}
	  
	  return ret;
}
*/


function findscene(node)
{
	while(node && !(node instanceof MATH.Scene))
		node = node.parent;
	return node;	
}

THREE.Light.prototype.GetBoundingBox = function()
{
	var bound = 1;

	return new BoundingBoxRTAS([-bound,-bound,-bound],[bound,bound,bound]);

}
THREE.ParticleSystem.prototype.GetBoundingBox = THREE.Light.prototype.GetBoundingBox;
THREE.Scene.prototype.GetBoundingBox = function(){
	var box = new BoundingBoxRTAS([-.0001,-.0001,-.0001],[.0001,.0001,.0001]);
	for(var i= 0; i < this.children.length; i++)
	{
		box.expandBy(this.children[i].GetBoundingBox());
	}
	return box;
}
//Do the actuall intersection with the mesh;
THREE.Light.prototype.FrustrumCast = function(frustrum)
{
	
	
	//try to reject based on bounding box.
	var mat2 = this.getModelMatrix().slice(0);
	var mat = MATH.inverseMat4(mat2);
	var tfrustrum = frustrum.transformBy(mat);
	var ret = this.GetBoundingBox().intersectFrustrum(tfrustrum); 
	
	for(var i = 0; i < ret.length; i++)
	{	
		//move the normal and hit point into worldspace
		
		ret[i] = {};
		ret[i].point = MATH.mulMat4Vec3(mat2,[0,0,0]);
		mat2[3] = 0;
		mat2[7] = 0;
		mat2[11] = 0;
		ret[i].norm = MATH.mulMat4Vec3(mat2,[0,0,1]);
		ret[i].norm = MATH.scaleVec3(ret[i].norm,1.0/MATH.lengthVec3(ret[i].norm));
		ret[i].distance = MATH.distanceVec3([0,0,0],ret[i].point);
		ret[i].object = this;
		ret[i].priority = this.PickPriority !== undefined ? this.PickPriority :  1;
	}
	return ret;
}

THREE.ParticleSystem.prototype.FrustrumCast = THREE.Light.prototype.FrustrumCast;
THREE.Scene.prototype.FrustrumCast =  function(frustrum)
{
	
	var hitlist = this.GetBoundingBox().intersectFrustrum(frustrum); 
	
	for(var i = 0; i < hitlist.length; i++)
	{	
		//move the normal and hit point into worldspace
		
		hitlist[i] = {};
		hitlist[i].point = [0,0,0];
		
		hitlist[i].norm = [0,0,1];
		hitlist[i].norm = MATH.scaleVec3(hitlist[i].norm,1.0/MATH.lengthVec3(hitlist[i].norm));
		hitlist[i].distance = MATH.distanceVec3([0,0,0],hitlist[i].point);
		hitlist[i].object = this;
		hitlist[i].priority = this.PickPriority !== undefined ? this.PickPriority :  1;
	}
	
	
	  //concat all hits from children	  
     
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


//window.Frustrum = Frustrum;
//return {
//	BoundingBoxRTAS:BoundingBoxRTAS
//
//};
//});