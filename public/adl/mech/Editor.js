function Editor()
{
	var SelectedVWFNode = null;
	var MoveGizmo = null;
	var WorldMouseDownPoint = null;
	var SelectMode = 'None';
	var ClickOffset = null;
	var Move = 0; var Rotate = 1; var Scale = 2; var Multi = 3;
	var GizmoMode = Move;
	var oldintersectxy = [];
	var oldintersectxz = [];
	var oldintersectyz = [];
	
	var WorldCoords = 0;
	var LocalCoords = 1;
	var CoordSystem = WorldCoords;
	
	var WorldZ = [0,0,1];
	var WorldY = [0,1,0];
	var WorldX = [1,0,0];
	
	var CurrentZ = [0,0,1];
	var CurrentY = [0,1,0];
	var CurrentX = [1,0,0];
	
	var RotateSnap = 5 * 0.0174532925;
	var MoveSnap = .25;
	var ScaleSnap = .5;
	
	var oldxrot = 0;
	var oldyrot = 0;
	var oldzrot = 0;
	
	var SelectionBounds = null;
	
	var lastscale = [1,1,1];
	var OldX = 0;
	var OldY = 0;
	var MouseMoved = false;
	document.AxisSelected = -1;

	
	
	$(document.body).append('<div id="statusbar" class="statusbar" />');
	$('#statusbar').css('top',(document.height - 25) + 'px');
	
	$(window).resize(function(){
	$('#statusbar').css('top',(document.height - 25) + 'px');
	});
	
	$('#statusbar').append('<div id="SceneName" class="statusbarElement" />');
	$('#SceneName').html('Not Saved');	
	$('#statusbar').append('<div id="StatusSelectedID" class="statusbarElement" />');
	$('#StatusSelectedID').html('No Selection');
	$('#statusbar').append('<div id="StatusPickMode" class="statusbarElement" />');
	$('#StatusPickMode').html('Pick: None');
	$('#statusbar').append('<div id="StatusSnaps" class="statusbarElement" />');
	$('#StatusSnaps').html('Snaps: 15deg, .5m, .1%');
	$('#statusbar').append('<div id="StatusAxis" class="statusbarElement" />');
	$('#StatusAxis').html('Axis: -1');
	$('#statusbar').append('<div id="StatusCoords" class="statusbarElement" />');
	$('#StatusCoords').html('World Coords');
	$('#statusbar').append('<div id="StatusTransform" class="statusbarElement" />');
	$('#StatusTransform').html('Move');
	$('#statusbar').append('<div id="StatusGizmoLocation" class="statusbarElement" />');
	$('#StatusGizmoLocation').html('[0,0,0]');
	$('#statusbar').append('<div id="StatusCameraLocation" class="statusbarElement" />');
	$('#StatusCameraLocation').html('[0,0,0]');		
	var _CoppiedNodes = [];
	//	$('#vwf-root').mousedown(function(e){
	var mousedown = function(e)
	{	
		MouseMoved = false;
		if(MoveGizmo)
		{
        
			OldX = e.clientX;
			OldY = e.clientY;
			updateGizmoOrientation(true);
			var gizpos = [MoveGizmo.getLocX(),MoveGizmo.getLocY(),MoveGizmo.getLocZ()];
			var campos = [findscene().camera.getLocX(),findscene().camera.getLocY(),findscene().camera.getLocZ()];
			var ray = GetWorldPickRay(e);
			
			var dxy = intersectLinePlane(ray,campos,gizpos,CurrentZ);
			oldintersectxy = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy));
			
			var dxz = intersectLinePlane(ray,campos,gizpos,CurrentY);
			oldintersectxz = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxz));
			
			var dyz = intersectLinePlane(ray,campos,gizpos,CurrentX);
			oldintersectyz = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dyz));
			
			var relgizxy = GLGE.subVec3(gizpos,oldintersectxy);
			relgizxy = GLGE.scaleVec3(relgizxy,1.0/GLGE.lengthVec3(relgizxy));
			oldzrot = Math.acos(GLGE.dotVec3(CurrentX,relgizxy));
			if(GLGE.dotVec3(CurrentY,relgizxy) > -.01)
			oldzrot *= -1;
			
			
			var relgizxz = GLGE.subVec3(gizpos,oldintersectxz);
			relgizxz = GLGE.scaleVec3(relgizxz,1.0/GLGE.lengthVec3(relgizxz));
			oldyrot = -Math.acos(GLGE.dotVec3(CurrentX,relgizxz));
			if(GLGE.dotVec3(CurrentZ,relgizxz) > -.01)
			oldyrot *= -1;
			
			var relgizyz = GLGE.subVec3(gizpos,oldintersectyz);
			relgizyz = GLGE.scaleVec3(relgizyz,1.0/GLGE.lengthVec3(relgizyz));
			oldxrot = -Math.acos(GLGE.dotVec3(CurrentZ,relgizyz));
			if(GLGE.dotVec3(CurrentY,relgizyz) > -.01)
			oldxrot *= -1;
			
			
			
			//console.log(vwf.views[0].lastPick.object.uid);
			var axis = -1;
			for(var i =0; i < MoveGizmo.children.length;i++)
			{
				if(vwf.views[0].lastPick.object.uid == MoveGizmo.children[i].uid)
				axis = i;
			}			
			
			document.AxisSelected = axis;
			$('#StatusAxis').html('Axis: '+axis);
			for(var i =0; i < MoveGizmo.children.length;i++)
			{
				if(MoveGizmo.children[i].material)
				MoveGizmo.children[i].material.setVertexColorMode(GLGE.VC_MUL);
			}
			if(axis >= 0)
			{
				if(MoveGizmo.children[axis].material)
				MoveGizmo.children[axis].material.setVertexColorMode(GLGE.VC_AMB);
			}
		}
	}.bind(this);
	//$('#vwf-root').mousewheel(function(event, delta, deltaX, deltaY) {
	var mousewheel = 	function(event, delta, deltaX, deltaY){
		if(MoveGizmo)
		updateGizmoSize();	
	}.bind(this);
	//$('#vwf-root').mouseup(function(e){
	var mouseup = function(e){ 		
		
		
		if(vwf.views[0].lastPickId && document.AxisSelected == -1 && SelectMode=='Pick' && MouseMoved == false && e.button == 0)
		{	
			SelectObject(vwf.getNode(vwf.views[0].lastPickId));
			
		}
		//else if(document.AxisSelected == -1)
		//	SelectObject(null);
		if(document.AxisSelected == 15)
		{
			
			SetCoordSystem(CoordSystem == WorldCoords? LocalCoords : WorldCoords);
			updateGizmoOrientation(true);
		}
		if(MoveGizmo)
		{
			for(var i =0; i < MoveGizmo.children.length;i++)
			{
				if(MoveGizmo.children[i].material)
				MoveGizmo.children[i].material.setVertexColorMode(GLGE.VC_MUL);
			}
			document.AxisSelected = -1;
			$('#StatusAxis').html('Axis: -1');
			updateGizmoOrientation(true);
		}
		
		
	}.bind(this);
	var DeleteSelection = function()
	{
		if(document.PlayerNumber == null)
		{
			_Notifier.notify('You must log in to participate');
			return;
		}
		var owner = vwf.getProperty(SelectedVWFNode.id,'owner');
		if(owner!=document.PlayerNumber)
		{
			_Notifier.notify('You do not own this object. It`s owned by '+ owner);
			return;
		}
		if(SelectedVWFNode)
		{
			vwf_view.kernel.deleteNode(SelectedVWFNode.id);
			$('#StatusSelectedID').html('No Selection');
			$('#StatusPickMode').html('Pick: None');
		}
		SelectObject(null);
	}.bind(this);
	//	$('#vwf-root').keyup(function(e){
	var keydown = function(e)
	{
		//console.log(e);

		if(e.keyCode == 87)
		{
			SetGizmoMode(Move);
		}
		if(e.keyCode == 69)
		{
			SetGizmoMode(Rotate);
		}
		if(e.keyCode == 82)
		{
			SetGizmoMode(Scale);
		}
		if(e.keyCode == 84)
		{
			SetGizmoMode(Multi);
		}
		if(e.keyCode == 81)
		{
			SetSelectMode('Pick');
		}
		if(e.keyCode == 46)
		{
			DeleteSelection();
		}
		if(e.keyCode == 68 && e.shiftKey)
		{
			Duplicate();
		}
		if(e.keyCode == 67 && e.ctrlKey)
		{
			Copy();
		}
		if(e.keyCode == 86 && e.ctrlKey)
		{
			Paste();
		}
	}.bind(this);
	var intersectLinePlane = function(ray,raypoint,planepoint,planenormal)
	{
		var n = GLGE.dotVec3(GLGE.subVec3(planepoint,raypoint),planenormal);
		var d = GLGE.dotVec3(ray,planenormal);
		if(d == 0)
		return null;
		
		var dist = n/d;
		
		return dist;
		//var alongray = GLGE.scaleVec3(ray,dist);
		//var intersect = GLGE.addVec3(alongray,	raypoint);
		//return intersect;
	}.bind(this);
	var GetCameraCenterRay = function(e)
	{
		screenmousepos = [0,0,0,1];
		var worldmousepos = GLGE.mulMat4Vec4(GLGE.inverseMat4(findscene().camera.getViewProjection()),screenmousepos);
		worldmousepos[0] /= worldmousepos[3];
		worldmousepos[1] /= worldmousepos[3];
		worldmousepos[2] /= worldmousepos[3];
		
		
		var campos = [findscene().camera.getLocX(),findscene().camera.getLocY(),findscene().camera.getLocZ()];
		var ray = GLGE.subVec3(worldmousepos,campos);
		var dist = GLGE.lengthVec3(ray);
		ray = GLGE.scaleVec3(ray,1.0/GLGE.lengthVec3(ray));
		return ray;
	}.bind(this);
	var GetWorldPickRay = function(e)
	{
		
		
		var OldX = e.clientX - $('#vwf-root').offset().left;
		var OldY = e.clientY - $('#vwf-root').offset().top;
		
		var screenmousepos = [OldX/document.getElementById('vwf-root').clientWidth,OldY/document.getElementById('vwf-root').clientHeight,0,1];
		screenmousepos[0] *= 2;
		screenmousepos[1] *= 2;
		screenmousepos[0] -= 1;
		screenmousepos[1] -= 1;
		screenmousepos[1] *= -1;
		var worldmousepos = GLGE.mulMat4Vec4(GLGE.inverseMat4(findscene().camera.getViewProjection()),screenmousepos);
		worldmousepos[0] /= worldmousepos[3];
		worldmousepos[1] /= worldmousepos[3];
		worldmousepos[2] /= worldmousepos[3];
		
		
		var campos = [findscene().camera.getLocX(),findscene().camera.getLocY(),findscene().camera.getLocZ()];
		var ray = GLGE.subVec3(worldmousepos,campos);
		var dist = GLGE.lengthVec3(ray);
		ray = GLGE.scaleVec3(ray,1.0/GLGE.lengthVec3(ray));
		return ray;
	}.bind(this);
	//quick function to initialize a blank matrix array
	var Matrix = function()
	{
		var mat = [];
		for(var i=0; i < 16; i++)
		{
			mat.push(0);
		}
		return mat;
	}.bind(this);
	//quick function to initialize a blank vector array
	var Vec3 = function()
	{
		var vec = [];
		for(var i=0; i < 3; i++)
		{
			vec.push(0);
		}
		return vec;
	}.bind(this);
	var Quat = function()
	{
		var quat = [];
		for(var i=0; i < 4; i++)
		{
			quat.push(0);
		}
		return quat;
	}.bind(this);
	var SnapTo = function(value,nearist)
	{
		value = value/nearist;
		if(value > 0)
		value = Math.floor(value);
		else
		value = Math.ceil(value);
		value *= nearist;
		return value;
	}.bind(this);
	//input rotation matrix, axis, angle in radians, return rotation matrix
	var RotateAroundAxis = function(RotationMatrix, Axis, Radians)
	{
		
		//Get a quaternion for the input matrix
		var OriginalQuat = goog.vec.Quaternion.fromRotationMatrix4( RotationMatrix,Quat());
		var RotationQuat = goog.vec.Quaternion.fromAngleAxis(Radians, Axis, Quat());
		var RotatedQuat = goog.vec.Quaternion.concat(RotationQuat,OriginalQuat, Quat());
		var NewMatrix = goog.vec.Quaternion.toRotationMatrix4(RotatedQuat, Matrix());
		return NewMatrix;
		
		
	}.bind(this);
	//takes a normal 4x4 rotation matrix and returns a VWF style angle axis
	//in the format {angle:0,axis:[0,1,0]} with the angle in degrees
	var RotationToVWFAngleAxis = function(RotationMatrix)
	{
		
		var OriginalQuat = goog.vec.Quaternion.fromRotationMatrix4( RotationMatrix,Quat() );
		//convert to angle axis with angle in Radians
		var NewAxis = [0,0,0];
		var NewAngle = goog.vec.Quaternion.toAngleAxis(OriginalQuat,NewAxis);
		return {angle: 57.2957795 * NewAngle,axis:NewAxis};
	}.bind(this);
	var isMove = function(axis)
	{
		if(axis == 0 || axis == 1 || axis == 2 || axis == 12 || axis == 13 || axis == 14)
		return true;
		return false;	
	}.bind(this);
	var isRotate = function(axis)
	{
		if(axis == 3 || axis == 4 || axis == 5 || axis == 16 || axis == 17 || axis == 18)
		return true;
		return false;	
	}.bind(this);
	var SetLocation = function(object,vector)
	{
		object.setLocX(vector[0]);
		object.setLocY(vector[1]);
		object.setLocZ(vector[2]);
	}.bind(this);
	var GetLocation = function(object)
	{
		var vector =[0,0,0];
		vector[0]=object.getLocX();
		vector[1]=object.getLocY();
		vector[2]=object.getLocZ();
		return vector;
	}.bind(this);
	var isScale = function(axis)
	{
		if(axis == 6 || axis == 7 || axis == 8 || axis == 9 || axis == 10 || axis == 11 ||(axis >=19 && axis <=25) )
		return true;
		return false;	
	}.bind(this);
	//input rotation matrix, axis, angle in radians, return rotation matrix
	var RotateVecAroundAxis = function(Vector, Axis, Radians)
	{
		
		//Get a quaternion for the input matrix
		
		var RotationQuat = goog.vec.Quaternion.fromAngleAxis(Radians, Axis, Quat());
		var NewMatrix = goog.vec.Quaternion.toRotationMatrix4(RotationQuat, Matrix());
		return GLGE.mulMat4Vec3(NewMatrix,Vector);
		
		
	}.bind(this);
	//$('#vwf-root').mousemove(function(e){
	var displayVec = function(e)
	{
		for(var i =0; i<e.length;i++)
		{
		e[i] *= 100;
		e[i] = Math.floor(e[i]);
		e[i] /= 100;
		}
		return JSON.stringify(e);
	}
	var mousemove = function(e)
	{
		
		MouseMoved = true;
		if(!MoveGizmo || MoveGizmo==null)
		{
			return;
		}
		updateGizmoSize();
		updateGizmoOrientation(false);
		if(document.AxisSelected != -1)
		{
			
			var gizpos = [MoveGizmo.getLocX(),MoveGizmo.getLocY(),MoveGizmo.getLocZ()];
			$('#StatusGizmoLocation').html(displayVec(gizpos));	
			var campos = [findscene().camera.getLocX(),findscene().camera.getLocY(),findscene().camera.getLocZ()];
			$('#StatusCameraLocation').html(displayVec(campos));	
			var ray = GetWorldPickRay(e);
			
			var IntersectPlaneNormalX = CurrentX;
			var IntersectPlaneNormalY = CurrentY;
			var IntersectPlaneNormalZ = CurrentZ;
			
			

			
			var dxy = intersectLinePlane(ray,campos,gizpos,IntersectPlaneNormalZ);
			var newintersectxy = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy));
			
			var dxz = intersectLinePlane(ray,campos,gizpos,IntersectPlaneNormalY);
			var newintersectxz = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxz));
			
			var dyz = intersectLinePlane(ray,campos,gizpos,IntersectPlaneNormalX);
			var newintersectyz = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dyz));
			
			var relintersectxy = GLGE.subVec3(newintersectxy,oldintersectxy);
			var relintersectxz = GLGE.subVec3(newintersectxz,oldintersectxz);
			var relintersectyz = GLGE.subVec3(newintersectyz,oldintersectyz);
			
			
			
			var relgizxy = GLGE.subVec3(gizpos,newintersectxy);
			var newrotz;
			relgizxy = GLGE.scaleVec3(relgizxy,1.0/GLGE.lengthVec3(relgizxy));
			newrotz = Math.acos(GLGE.dotVec3(CurrentX,relgizxy));
			
			if(GLGE.dotVec3(CurrentY,relgizxy) > -.01)
			newrotz *= -1;
			
			
			var relgizxz = GLGE.subVec3(gizpos,newintersectxz);
			var newroty;
			relgizxz = GLGE.scaleVec3(relgizxz,1.0/GLGE.lengthVec3(relgizxz));
			newroty = -Math.acos(GLGE.dotVec3(CurrentX,relgizxz));
			if(GLGE.dotVec3(CurrentZ,relgizxz) > -.01)
			newroty *= -1;
			
			var relgizyz = GLGE.subVec3(gizpos,newintersectyz);
			var newrotx;
			relgizyz = GLGE.scaleVec3(relgizyz,1.0/GLGE.lengthVec3(relgizyz));
			newrotx = -Math.acos(GLGE.dotVec3(CurrentZ,relgizyz));
			if(GLGE.dotVec3(CurrentY,relgizyz) > -.01)
			newrotx *= -1;
			
			var relrotz = oldzrot - newrotz;
			var relroty = oldyrot - newroty;
			var relrotx = oldxrot - newrotx;
			
			if(Math.abs(relrotz) < 6)
			relrotz *= 1.33;
			if(Math.abs(relroty) < 6)
			relroty *= 1.33;
			if(Math.abs(relrotx) < 6)
			relrotx *= 1.33;
			
			relrotz = SnapTo(relrotz,RotateSnap);
			relroty = SnapTo(relroty,RotateSnap);
			relrotx = SnapTo(relrotx,RotateSnap);
			
			var SnapType = null;
			if(isMove(document.AxisSelected )) SnapType = MoveSnap;
			if(isScale(document.AxisSelected )) SnapType = ScaleSnap;
			if(SnapType != null)
			{
				relintersectxy[0] = SnapTo(relintersectxy[0],SnapType);
				relintersectxy[1] = SnapTo(relintersectxy[1],SnapType);
				relintersectxy[2] = SnapTo(relintersectxy[2],SnapType);
				
				relintersectxz[0] = SnapTo(relintersectxz[0],SnapType);
				relintersectxz[1] = SnapTo(relintersectxz[1],SnapType);
				relintersectxz[2] = SnapTo(relintersectxz[2],SnapType);
				
				relintersectyz[0] = SnapTo(relintersectyz[0],SnapType);
				relintersectyz[1] = SnapTo(relintersectyz[1],SnapType);
				relintersectyz[2] = SnapTo(relintersectyz[2],SnapType);			
			}
			
			if(relrotz != 0)
			oldzrot = newrotz;
			if(relroty != 0)
			oldyrot = newroty;
			if(relrotx != 0)
			oldxrot = newrotx;
			
          
               
                
			if(GLGE.lengthVec3(relintersectxy) != 0)
			oldintersectxy = GLGE.addVec3(oldintersectxy , relintersectxy);
			if(GLGE.lengthVec3(relintersectxz) != 0)
			oldintersectxz = GLGE.addVec3(oldintersectxz , relintersectxz);;
			if(GLGE.lengthVec3(relintersectyz) != 0)
			oldintersectyz = GLGE.addVec3(oldintersectyz , relintersectyz);;
			
            //save some time and bail is nothing is changing
            if(GLGE.lengthVec3(relintersectxy) == 0 && GLGE.lengthVec3(relintersectxz) == 0 && GLGE.lengthVec3(relintersectyz) == 0)
            return;
           
			if( CoordSystem == LocalCoords)
			{
				var mat = findviewnode(SelectedVWFNode.id).getRotMatrix();
				//mat = GLGE.inverseMat4(mat);
				
				var lenxy = GLGE.lengthVec3(relintersectxy);
				if(lenxy)
				{
					relintersectxy = GLGE.scaleVec3(relintersectxy,1.0/lenxy);
					relintersectxy = GLGE.mulMat4Vec3(mat,relintersectxy);
					relintersectxy = GLGE.scaleVec3(relintersectxy,lenxy);
				}
				
				var lenxz = GLGE.lengthVec3(relintersectxz);
				if(lenxz){
					relintersectxz = GLGE.scaleVec3(relintersectxz,1.0/lenxz);
					relintersectxz = GLGE.mulMat4Vec3(mat,relintersectxz);
					relintersectxz = GLGE.scaleVec3(relintersectxz,lenxz);
				}
				
				var lenyz = GLGE.lengthVec3(relintersectyz);
				if(lenyz){
					relintersectyz = GLGE.scaleVec3(relintersectyz,1.0/lenyz);
					relintersectyz = GLGE.mulMat4Vec3(mat,relintersectyz);
					relintersectyz = GLGE.scaleVec3(relintersectyz,lenyz);
				}
				
			}
			
			  var ScaleXY = [0,0,0];
                ScaleXY[0] = relintersectxy[0] /1;
                ScaleXY[1] = relintersectxy[1] /1;
                ScaleXY[2] = relintersectxy[2] /1;
              
                var ScaleXZ = [0,0,0];
                ScaleXZ[0] = relintersectxz[0] /1;
                ScaleXZ[1] = relintersectxz[1] /1;
                ScaleXZ[2] = relintersectxz[2] /1;
                var ScaleYZ = [0,0,0];
                ScaleYZ[0] = relintersectyz[0] /1;
                ScaleYZ[1] = relintersectyz[1] /1;
                ScaleYZ[2] = relintersectyz[2] /1;
				
			var scalemult = .5;
			var wasMoved = false;
            var wasRotated = false;
            var wasScaled = false;
			if(SelectedVWFNode)
			{
				var PickDist = 10000/vwf.views[0].lastPick.distance;
				//var tempscale = vwf.getProperty(SelectedVWFNode.id,'scale');
                //var s = findviewnode(SelectedVWFNode.id).getScale();
                var tempscale =  lastscale;//[s.x,s.y,s.z];
				if(document.AxisSelected == 0)
				{
                    wasMoved = true;
					if(Math.abs(GLGE.dotVec3(ray,CurrentZ)) > .8)
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentX,relintersectxy[0])));
					else
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentX,relintersectxz[0])));
				}
				if(document.AxisSelected == 1)
				{
                    wasMoved = true;
					if(Math.abs(GLGE.dotVec3(ray,CurrentZ)) > .8)
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentY,relintersectxy[1])));
					else
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentY,relintersectyz[1])));
				}
				if(document.AxisSelected == 2)
				{
                    wasMoved = true;
					if(Math.abs(GLGE.dotVec3(ray,CurrentX)) > .8)
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentZ,relintersectyz[2])));
					else	
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentZ,relintersectxz[2])));
				}
				if(document.AxisSelected == 3 || document.AxisSelected == 16)
                {
                    wasRotated = true;
                    findviewnode(SelectedVWFNode.id).setRotMatrix(RotateAroundAxis(findviewnode(SelectedVWFNode.id).getRotMatrix(),CurrentX,relrotx));
                }
				if(document.AxisSelected == 4 || document.AxisSelected == 17)
                {
                    wasRotated = true;
                    findviewnode(SelectedVWFNode.id).setRotMatrix(RotateAroundAxis(findviewnode(SelectedVWFNode.id).getRotMatrix(),CurrentY,relroty));	
                }
				if(document.AxisSelected == 5 || document.AxisSelected == 18)
                {
                    wasRotated = true;
                    findviewnode(SelectedVWFNode.id).setRotMatrix(RotateAroundAxis(findviewnode(SelectedVWFNode.id).getRotMatrix(),CurrentZ,relrotz));
				}
                if(document.AxisSelected == 6 || document.AxisSelected == 20  )
                {
                    wasScaled = true;
                    tempscale[0] += scalemult * ScaleXY[0];	
				}
                if(document.AxisSelected == 7 || document.AxisSelected == 21)
				{
                     wasScaled = true;
                    tempscale[1] += scalemult * ScaleXY[1];	
				}
                if(document.AxisSelected == 8 || document.AxisSelected == 22)
				{
                     wasScaled = true;
                    tempscale[2] += scalemult * ScaleXZ[2];
				}
                if(document.AxisSelected == 23  )
				{
                     wasScaled = true;
                    tempscale[0] += -scalemult * ScaleXY[0];	
				}
                if(document.AxisSelected == 24)
				{
                     wasScaled = true;
                    tempscale[1] += -scalemult * ScaleXY[1];	
				}
                if(document.AxisSelected == 25)
				{
                     wasScaled = true;
                    tempscale[2] += -scalemult * ScaleXZ[2];			
				}
				if(document.AxisSelected == 19)// || document.AxisSelected == 10 || document.AxisSelected == 11)
				{
                     wasScaled = true;
					tempscale[2] += scalemult * ScaleXY[0];
					tempscale[1] += scalemult * ScaleXY[0];
					tempscale[0] += scalemult * ScaleXY[0];
				}
				if(document.AxisSelected == 9)// || document.AxisSelected == 10 || document.AxisSelected == 11)
				{
                     wasScaled = true;
					tempscale[2] += scalemult * ScaleXY[0];
					tempscale[1] += scalemult * ScaleXY[0];
					tempscale[0] += scalemult * ScaleXY[0];
				}
				if(document.AxisSelected == 10)// || document.AxisSelected == 10 || document.AxisSelected == 11)
				{
                     wasScaled = true;
					tempscale[2] += scalemult * ScaleYZ[1];
					tempscale[1] += scalemult * ScaleYZ[1];
					tempscale[0] += scalemult * ScaleYZ[1];
				}
				if(document.AxisSelected == 11)// || document.AxisSelected == 10 || document.AxisSelected == 11)
				{
                     wasScaled = true;
					tempscale[2] += scalemult * ScaleXZ[2];
					tempscale[1] += scalemult * ScaleXZ[2];
					tempscale[0] += scalemult * ScaleXZ[2];
				}
				if(document.AxisSelected == 12)
				{
                    wasMoved = true;
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentX,relintersectxy[0])));
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentY,relintersectxy[1])));
				}
				if(document.AxisSelected == 13)
				{
                     wasMoved = true;
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentX,relintersectxz[0])));
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentZ,relintersectxz[2])));
				}
				if(document.AxisSelected == 14)
				{
                     wasMoved = true;
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentY,relintersectyz[1])));
					SetLocation(MoveGizmo, GLGE.addVec3(GetLocation(MoveGizmo),GLGE.scaleVec3(CurrentZ,relintersectyz[2])));
				}
				
				
				
				if(wasMoved)
				this.setProperty(SelectedVWFNode.id,'translation',[MoveGizmo.getLocX(),MoveGizmo.getLocY(),MoveGizmo.getLocZ()]);				
				
				if(wasScaled && tempscale[0] > 0 && tempscale[1] > 0 && tempscale[2] > 0)
                {
					lastscale = tempscale;
                    this.setProperty(SelectedVWFNode.id,'scale',[tempscale[0],tempscale[1],tempscale[2]]);
                    //findviewnode(SelectedVWFNode.id).setScale(tempscale[0],tempscale[1],tempscale[2]);
                }
				if(wasRotated)
				{		
					var angleaxis = RotationToVWFAngleAxis(findviewnode(SelectedVWFNode.id).getRotMatrix());
					this.setProperty(SelectedVWFNode.id,'rotation',[angleaxis.axis[0],angleaxis.axis[1],angleaxis.axis[2],angleaxis.angle]);
				}
				triggerSelectionTransformed(SelectedVWFNode);
			}
			
			
		}
		else
		{
			//console.log(vwf.views[0].lastPick.object.uid);
			var axis = -1;
            
			for(var i =0; i < MoveGizmo.children.length;i++)
			{
				if(vwf.views[0].lastPick && vwf.views[0].lastPick.object && vwf.views[0].lastPick.object.uid == MoveGizmo.children[i].uid)
				axis = i;
			}			
			
			for(var i = 0; i < MoveGizmo.children.length; i++)
			{
				if(i!=document.AxisSelected)
				if(MoveGizmo.children[i].material)
				MoveGizmo.children[i].material.setVertexColorMode(GLGE.VC_MUL);
			}
			
			if(axis >= 0)
			if(MoveGizmo.children[axis].material)
			MoveGizmo.children[axis].material.setVertexColorMode(GLGE.VC_AMB);
		}
		
	}.bind(this);
	this.setProperty = function(id,prop,val)
	{
		if(document.PlayerNumber == null)
		{
			_Notifier.notify('You must log in to participate');
			return;
		}
		var owner = vwf.getProperty(id,'owner');
		if(owner!=document.PlayerNumber)
		{
			_Notifier.notify('You do not own this object. It`s owned by '+ owner);
			return;
		}
		vwf_view.kernel.setProperty(id,prop,val)
	}
	this.createChild = function(parent,name,proto,uri,callback)
	{
		if(document.PlayerNumber == null)
		{
			_Notifier.notify('You must log in to participate');
			return;
		}
		
		vwf_view.kernel.createChild(parent,name,proto,uri,callback);
	}
	var CreatePrim = function(type,translation,size,texture,owner,id)
	{       
			
			var BoxProto = { 
				
			extends: type+'.vwf',
			properties: {
			NotProto: ""
				}
			};
			var proto = BoxProto;
			proto.NotProto = "NOT!";
			proto.properties.NotProto = "NOT!";
			proto.properties.size = size;
			proto.properties.translation = translation;
			proto.properties.scale = [1,1,1];
			proto.properties.rotation = [0,0,1,0];
			proto.properties.owner = owner;
			proto.properties.texture = texture;
			proto.properties.type = type;
			proto.properties.tempid = id;
			
			this.createChild('index-vwf',GUID(),proto,null,null); 
		
	}.bind(this);
	var CreateModifier = function(type,owner)
	{       
		if(GetSelectedVWFNode() == null)
		{
			_Notifier.notify('no object selected');
			return;
		}
		
			var ModProto = { 
				
			extends: type+'.vwf',
			properties: {
			NotProto: ""
				}
			};
			var proto = ModProto;
			proto.NotProto = "NOT!";
			proto.properties.NotProto = "NOT!";
			proto.properties.translation = [0,0,0];
			proto.properties.scale = [1,1,1];
			proto.properties.rotation = [0,0,1,0];
			proto.properties.owner = owner;
			proto.properties.type = type;
			
			var id = GetFirstChildLeaf(GetSelectedVWFNode()).id;
			
			var owner = vwf.getProperty(id,'owner');
			if(owner!=document.PlayerNumber)
			{
				_Notifier.notify('You do not own this object. It`s owned by '+ owner);
				return;
			}
		
			this.createChild(id,GUID(),proto,null,null); 
		
		    window.setTimeout(function(){$(document).trigger('modifierCreated',GetSelectedVWFNode());},500);
			
	}.bind(this);
	var GetFirstChildLeaf = function(object)
	{
		if(object)
		{
			if(object.children)
			{
				for(var i in object.children)
				{
					return GetFirstChildLeaf(object.children[i]);
				}
			}
			return object;
		}
		return null;
	}
	var Duplicate = function()
	{
		
		var proto = vwf.getNode(_Editor.GetSelectedVWFNode().id);
		var protot = JSON.stringify(proto);
		var protoj = JSON.parse(protot);
		DeleteIDs(protoj);
		_Editor.createChild('index-vwf',GUID(),protoj,null,null); 
	}
	var DeleteIDs = function(t)
	{
		
		if(t.id != undefined)
			delete t.id;
		if(t.children)
		{	
			var children = []
			for(var i in t.children)
			{
				DeleteIDs(t.children[i]);
				children.push(t.children[i]);
				delete t.children[i];
			}
			for(var i = 0; i < children.length; i++)
			{
				t.children[GUID()]=children[i];
			}
		}
	}
	var Copy = function()
	{
		
		var t = vwf.getNode(_Editor.GetSelectedVWFNode().id);
		t = JSON.stringify(t);
		t = JSON.parse(t);
		DeleteIDs(t);
		SetCopyPrototype(t);
	}
	var SetCopyPrototype = function(t)
	{
		_CoppiedNodes.push(t);
	}
	var Paste = function(t)
	{
		
		var t = _CoppiedNodes[_CoppiedNodes.length -1];
		
		var campos = [_Editor.findscene().camera.getLocX(),_Editor.findscene().camera.getLocY(),_Editor.findscene().camera.getLocZ()];
		var ray = _Editor.GetCameraCenterRay();
		var dxy = _Editor.intersectLinePlane(ray,campos,[0,0,0],_Editor.WorldZ);
		var newintersectxy = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy*.99));
		
		t.properties.transform[12] = newintersectxy[0];
		t.properties.transform[13] = newintersectxy[1];
		t.properties.transform[14] = newintersectxy[2];
		t.properties.translation[0] = newintersectxy[0];
		t.properties.translation[1] = newintersectxy[1];
		t.properties.translation[2] = newintersectxy[2];
		this.createChild('index-vwf',GUID(),t,null,null); 
	}
	var updateGizmoOrientation = function(updateBasisVectors)
	{
		if(CoordSystem == LocalCoords && SelectedVWFNode)
		{
			var aa = vwf.getProperty(SelectedVWFNode.id,'rotation');
			var rotmat = GLGE.angleAxis(aa[3] * 0.0174532925,[aa[0],aa[1],aa[2]]);
			var invRot = GLGE.inverseMat4(rotmat);
			MoveGizmo.setRotMatrix(rotmat);
			if(updateBasisVectors)
			{
				CurrentZ = GLGE.mulMat4Vec3(rotmat,WorldZ);
				CurrentX = GLGE.mulMat4Vec3(rotmat,WorldX);
				CurrentY = GLGE.mulMat4Vec3(rotmat,WorldY);
			}
		}else
		{
			MoveGizmo.setRotMatrix([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
			CurrentZ = WorldZ;
			CurrentX = WorldX;
			CurrentY = WorldY;
		}
	}.bind(this);
	var triggerSelectionChanged = function(VWFNode)
	{
		
		$(document).trigger('selectionChanged', [VWFNode]);
		
	}.bind(this);
	var triggerSelectionTransformed = function(VWFNode)
	{
		
		$(document).trigger('selectionTransformedLocal', [VWFNode]);
		
	}.bind(this);
	
	var SelectObject = function(VWFNode)
	{
		if(typeof(VWFNode) == 'string')
			VWFNode = vwf.getNode(VWFNode);
		triggerSelectionChanged(VWFNode);
		SelectedVWFNode = VWFNode;
		
		if(MoveGizmo == null)
		{
			BuildMoveGizmo();
		}
		if(SelectedVWFNode)
		{
			lastscale = vwf.getProperty(SelectedVWFNode.id,'scale');
			MoveGizmo.setVisible(true);
			var t = vwf.getProperty(_Editor.GetSelectedVWFNode().id,'translation');
			MoveGizmo.setLoc(t[0],t[1],t[2]);
			updateGizmoSize();
			updateGizmoOrientation(true);
			$('#StatusSelectedID').html(SelectedVWFNode.id);
			
			if(SelectionBounds != null)
			{
				SelectionBounds.parent.removeChild(SelectionBounds);
				SelectionBounds = null;
			}
				var box = vwf.getProperty(SelectedVWFNode.id,'boundingbox');
				SelectionBounds = BuildBox([box.max[0] - box.min[0],box.max[1] - box.min[1],box.max[2] - box.min[2]],[0,0,0],[1,1,1,1]);
				
				SelectionBounds.setDrawType(GLGE.DRAW_LINELOOPS);
				SelectionBounds.setDepthTest(false);
				SelectionBounds.setZtransparent(true);
				SelectionBounds.setCull(GLGE.NONE);
				SelectionBounds.setPickable(false);
				findviewnode(SelectedVWFNode.id).addChild(SelectionBounds);
			

		}
		else
		{
			MoveGizmo.setVisible(false);
			if(SelectionBounds != null)
			{
				SelectionBounds.parent.removeChild(SelectionBounds);
				SelectionBounds = null;
			}
		}
	}.bind(this);
	var updateGizmoSize = function()
	{
		var gizpos = [MoveGizmo.getLocX(),MoveGizmo.getLocY(),MoveGizmo.getLocZ()];
		var campos = [findscene().camera.getLocX(),findscene().camera.getLocY(),findscene().camera.getLocZ()];
		var dist = GLGE.lengthVec3(GLGE.subVec3(gizpos,campos));
		dist = dist/10;
		MoveGizmo.setScaleX(dist);
		MoveGizmo.setScaleY(dist);
		MoveGizmo.setScaleZ(dist);
	}.bind(this);
	var BuildMoveGizmo = function()
	{
		
		if(MoveGizmo != null)
		return;
		
		var red = [1,.55,.55,1];
		var green = [.55,1,.55,1];
		var blue = [.55,.55,1,1];
		
		MoveGizmo = new GLGE.Group();
		MoveGizmo.addChild(BuildBox([1,.030,.030],[.5,0,0],red));               //move x
		MoveGizmo.addChild(BuildBox([.030,1,.030],[0,.5,0],green));//move y
		MoveGizmo.addChild(BuildBox([.030,.030,1],[0,0,.5],blue));//move z
		MoveGizmo.addChild(BuildRing([0,1.070,0],[0,1,0],[1,0,0],6,red,25,62));//rotate x
		MoveGizmo.addChild(BuildRing([0,0,1.070],[0,0,1],[0,1,0],6,green,25,62));//rotate y
		MoveGizmo.addChild(BuildRing([0,1.070,0],[0,1,0],[0,0,-1],6,blue,25,62));//rotate z
		MoveGizmo.addChild(BuildBox([.05,.05,.05],[1.025,0,0],red));//scale x
		MoveGizmo.addChild(BuildBox([.05,.05,.05],[0,1.025,0],green));//scale y
		MoveGizmo.addChild(BuildBox([.05,.05,.05],[0,0,1.025],blue));//scale z
		MoveGizmo.addChild(BuildBox([.085,.085,.085],[.925,0,0],red));//scale xyz
		MoveGizmo.addChild(BuildBox([.085,.085,.085],[0,.925,0],green));//scale xyz
		MoveGizmo.addChild(BuildBox([.085,.085,.085],[0,0,.925],blue));//scale xyz
		MoveGizmo.addChild(BuildBox([.150,.150,.030],[.075,.075,.015],[.75,.75,25,1]));//movexy
		MoveGizmo.addChild(BuildBox([.150,.030,.150],[.075,.015,.075],[.75,.25,.75,1]));//movexz
		MoveGizmo.addChild(BuildBox([.030,.150,.150],[.015,.075,.075],[.25,.75,.75,1]));//moveyz
		MoveGizmo.addChild(BuildRing([0,.170,0],[0,.240,0],[0,0,-1],4,[1,1,1,1],90,450));//rotate z
		
		MoveGizmo.addChild(BuildRing([0,1.120,0],[0,1,0],[1,0,0],37,red,0,370));//rotate x
		MoveGizmo.addChild(BuildRing([0,0,1.120],[0,0,1],[0,1,0],37,green,0,370));//rotate y
		MoveGizmo.addChild(BuildRing([0,1.120,0],[0,1,0],[0,0,-1],37,blue,0,370));//rotate z
		
		MoveGizmo.addChild(BuildBox([.5,.5,.5],[0,0,0],[1,1,1,1]));//scale uniform
		MoveGizmo.addChild(BuildBox([.030,.5,.5],[.5,0,0],red));//scale uniform
		MoveGizmo.addChild(BuildBox([.5,.030,.5],[0,.5,0],green));//scale uniform
		MoveGizmo.addChild(BuildBox([.5,.5,.030],[0,0,.5],blue));//scale uniform
		MoveGizmo.addChild(BuildBox([.030,.5,.5],[-.5,0,0],red));//scale uniform
		MoveGizmo.addChild(BuildBox([.5,.030,.5],[0,-.5,0],green));//scale uniform
		MoveGizmo.addChild(BuildBox([.5,.5,.030],[0,0,-.5],blue));//scale uniform
		for(var i=0; i < MoveGizmo.children.length;i++){
			MoveGizmo.children[i].setZtransparent(true); MoveGizmo.children[i].setDepthTest(false);
			SetGizmoMode(Move);
		}
		
		findscene().addChild(MoveGizmo);
		
	}.bind(this);
	var SetGizmoMode = function(type)
	{
		
		if(type == Move)
		{
			$('#StatusTransform').html('Move');	
			for(var i=0; i < MoveGizmo.children.length;i++){
				if((i>=0 && i <=2) || (i>=12 && i<=14))
				{
					MoveGizmo.children[i].setVisible(true);
				}
				else
				{
					MoveGizmo.children[i].setVisible(false);
				}
				GizmoMode = Move;
			}
		}
		if(type == Rotate)
		{
			$('#StatusTransform').html('Rotate');	
			for(var i=0; i < MoveGizmo.children.length;i++){
				if(i>=16 && i <=18)
				{
					MoveGizmo.children[i].setVisible(true);
				}
				else
				{
					MoveGizmo.children[i].setVisible(false);
				}
				GizmoMode = Rotate;
			}
		}
		if(type == Scale)
		{
			$('#StatusTransform').html('Scale');
			//SetCoordSystem(LocalCoords);			
			for(var i=0; i < MoveGizmo.children.length;i++){
				if(i>=19 && i <=25)
				{
					MoveGizmo.children[i].setVisible(true);
				}
				else
				{
					MoveGizmo.children[i].setVisible(false);
				}
				GizmoMode = Scale;
			}
		}
		if(type == Multi)
		{
			$('#StatusTransform').html('Multi');	
			for(var i=0; i < MoveGizmo.children.length;i++){
				if(i <=15)
				{
					MoveGizmo.children[i].setVisible(true);
				}
				else
				{
					MoveGizmo.children[i].setVisible(false);
				}
				
				GizmoMode = Multi;
			}
		}
		
		
		
		
	}.bind(this);
	var BuildRing = function(radius1,radius2,axis,steps,color,startdeg,enddeg)
	{
		
		var positions = [];
		//var startdeg = 25;
		//var enddeg = 65;
		for(var i=startdeg; i<enddeg;i+=((enddeg-startdeg)/steps))
		{
			var rotmat = GLGE.angleAxis(i*0.0174532925,axis);		  
			var offset1 =  GLGE.mulMat4Vec3(rotmat,radius1);
			var offset2 =  GLGE.mulMat4Vec3(rotmat,radius2);
			positions.push(offset1[0]);
			positions.push(offset1[1]);
			positions.push(offset1[2]);
			positions.push(offset2[0]);
			positions.push(offset2[1]);
			positions.push(offset2[2]);  
		}
		var faces = [];
		console.log(positions.length);
		for(var i = 0; i < positions.length/3-3; i+=2)
		{
			faces.push(i);	
			faces.push(i+1);
			faces.push(i+2);
			faces.push(i+2);
			faces.push(i+1);
			faces.push(i+3);
		}
		
		//	faces.push(positions.length/3-2);
		//	faces.push(positions.length/3-1);
		//	faces.push(0);
		//	faces.push(0);
		//	faces.push(positions.length/3-1);
		//	faces.push(1);
		
		var colors = [];
		for(var i = 0; i < positions.length/3; i+=1)
		{
			colors.push(color[0]);
			colors.push(color[1]);
			colors.push(color[2]);
			colors.push(color[3]);
			
		}
		
		
		console.log(faces);
		var planemesh = new GLGE.Mesh();
		var planeobj = new GLGE.Object();
		planeobj.setMesh(planemesh);
		
		planemesh.setPositions(positions);
		planemesh.setFaces(faces);
		planemesh.setVertexColors(colors);
		
		var mat = new GLGE.Material();
		
		planeobj.setPickable(true);
		planeobj.setMaterial(mat);
		mat.setVertexColorMode(GLGE.VC_MUL);
		//mat.setColor(color);
		//mat.setShadeless(true);
		//mat.setAmbient([.5,.5,.5,1]);
		//mat.setEmit(color);
		return planeobj;
	}.bind(this);
	var BuildBox = function(size,offset,color)
	{
		
		var hx = size[0]/2;
		var hy = size[1]/2;
		var hz = size[2]/2;
		
		var ox = offset[0];
		var oy = offset[1];
		var oz = offset[2];
		
		var planemesh = new GLGE.Mesh();
		var planeobj = new GLGE.Object();
		planeobj.setMesh(planemesh);
		
		var positions = [
		hx + ox,hy + oy,hz + oz, 
		hx + ox,hy + oy,-hz + oz, 
		hx + ox,-hy + oy,hz + oz, 
		hx + ox,-hy + oy,-hz + oz,
		-hx + ox,hy + oy,hz + oz,
		-hx + ox,hy + oy,-hz + oz, 
		-hx + ox,-hy + oy,hz + oz, 
		-hx + ox,-hy + oy,-hz + oz
		];
		
		var colors = [];
		for(var i = 0; i < (positions.length/3); i++)
		{	colors.push(color[0]);
			colors.push(color[1]);
			colors.push(color[2]);
			colors.push(color[3]);
		}
		
		var indexes = [0,2,6,6,4,0,1,3,7,7,5,1,0,1,3,3,2,0,4,5,7,7,6,4,0,1,5,5,4,0,2,3,7,7,6,2];
		
		planemesh.setPositions(positions);
		planemesh.setVertexColors(colors);
		planemesh.setFaces(indexes);
		
		var mat = new GLGE.Material();
		
		planeobj.setPickable(true);
		planeobj.setMaterial(mat);
		mat.setVertexColorMode(GLGE.VC_MUL);
		//mat.setColor(color);
		//mat.setEmit(color);
		//mat.setShadeless(true);
		//mat.setAmbient([.5,.5,.5,1]);
		return planeobj;
	}.bind(this);
	var findviewnode = function(id)
	{
		for(var i =0; i<vwf.views.length;i++)
		{
			if(vwf.views[i].state.nodes[id].glgeObject) return vwf.views[i].state.nodes[id].glgeObject;
		}
		return null;
	}.bind(this);
	var SetSelectMode = function(e)
	{
		SelectMode = e;
		$('#StatusPickMode').html('Pick: ' + e);
		
	}.bind(this);
	var SetCoordSystem	= function(e)
	{
		CoordSystem = e;
		if(e == WorldCoords)
			$('#StatusCoords').html('World Coords');
		else
			$('#StatusCoords').html('Local Coords');
	}.bind(this);
	var GetMoveGizmo = function(e)
	{	
		return MoveGizmo;
	}.bind(this);
	var SetSnaps = function(m,r,s)
	{	
		RotateSnap = r;
		MoveSnap = m;
		ScaleSnap = s;
		
		$('#StatusSnaps').html('Snaps: '+(r/0.0174532925)+'deg, '+m+'m, '+s+'%');
		
	}.bind(this);
	var GetSelectedVWFNode = function()
	{
		if(SelectedVWFNode)
		return vwf.getNode(SelectedVWFNode.id);
		return null;
	}.bind(this);
	var findscene = function()
	{
		return vwf.views[0].state.scenes["index-vwf"].glgeScene;
        
	}.bind(this);
	
	this.findscene = findscene;
	this.findviewnode =findviewnode;
	this.mousedown = mousedown;
	this.mousemove =mousemove;
	this.mousewheel =mousewheel;
	this.mouseup =mouseup;
	this.DeleteSelection =DeleteSelection;
	this.keydown =keydown ;
	this.intersectLinePlane =intersectLinePlane;
	this.GetCameraCenterRay =GetCameraCenterRay;
	this.GetWorldPickRay =GetWorldPickRay;
	this.Matrix =Matrix;
	this.Vec3 =Vec3;
	this.Quat =Quat;
	this.SnapTo =SnapTo;
	this.RotateAroundAxis =RotateAroundAxis;
	this.RotationToVWFAngleAxis =RotationToVWFAngleAxis;
	this.isMove =isMove;
	this.isRotate =isRotate;
	this.SetLocation =SetLocation;
	this.GetLocation =GetLocation;
	this.isScale =isScale;
	this.RotateVecAroundAxis =RotateVecAroundAxis;
	this.CreatePrim =CreatePrim;
	this.updateGizmoOrientation =updateGizmoOrientation;
	this.updateGizmoSize =updateGizmoSize;
	this.BuildMoveGizmo =BuildMoveGizmo;
	this.SetGizmoMode =SetGizmoMode;
	this.BuildRing =BuildRing;
	this.BuildBox =BuildBox;
	this.Move = Move;
	this.Rotate = Rotate;
	this.Scale = Scale;
	this.Multi = Multi;
	this.CoordSystem = CoordSystem;
	this.WorldCoords = WorldCoords;
	this.LocalCoords = LocalCoords;
	this.MoveGizmo = MoveGizmo;
	this.SelectedVWFNode = SelectedVWFNode;
	this.RotateSnap = RotateSnap;
	this.MoveSnap = MoveSnap;
	this.ScaleSnap = ScaleSnap;
	this.WorldZ = WorldZ;
	this.WorldY = WorldY;
	this.WorldX = WorldX;
	this.CurrentZ = CurrentZ;
	this.CurrentY = CurrentY;
	this.CurrentX = CurrentX;
	this.SetSelectMode = SetSelectMode;
	this.SetCoordSystem = SetCoordSystem;
	this.GetMoveGizmo = GetMoveGizmo;
	this.SetSnaps = SetSnaps;
	this.GetSelectedVWFNode = GetSelectedVWFNode;
	this.SelectObject = SelectObject;
	this.Copy = Copy;
	this.Paste = Paste;
	this.Duplicate = Duplicate;
	this.CreateModifier = CreateModifier;
	BuildMoveGizmo();
	SelectObject(null);
	
}

_Editor = new Editor();