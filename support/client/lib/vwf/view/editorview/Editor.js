function Editor()
{
	var SelectedVWFNodes = [];
	var MoveGizmo = null;
	var WorldMouseDownPoint = null;
	var SelectMode = 'None';
	var ClickOffset = null;
	var Move = 0; var Rotate = 1; var Scale = 2; var Multi = 3;
	var GizmoMode = Move;
	var oldintersectxy = [];
	var oldintersectxz = [];
	var oldintersectyz = [];
	
	this.mouseDownScreenPoint = [0,0];
	this.mouseUpScreenPoint = [0,0];
	this.selectionMarquee = null; 
	
	var WorldCoords = 0;
	var LocalCoords = 1;
	var CoordSystem = WorldCoords;
	
	var NewSelect = 0;
	var Add = 2;
	var Subtract = 3;
	this.PickMod = NewSelect;
	
	var WorldZ = [0,0,1];
	var WorldY = [0,1,0];
	var WorldX = [1,0,0];
	
	var CurrentZ = [0,0,1];
	var CurrentY = [0,1,0];
	var CurrentX = [1,0,0];
	
	var RotateSnap = 5 * 0.0174532925;
	var MoveSnap = .2;
	var ScaleSnap = .15;
	
	var oldxrot = 0;
	var oldyrot = 0;
	var oldzrot = 0;
	
	var SelectionBounds = [];
	
	var lastscale = [1,1,1];
	var lastpos = [1,1,1];
	var OldX = 0;
	var OldY = 0;
	var MouseMoved = false;
	document.AxisSelected = -1;

	this.TempPickCallback = null;
	
	$(document.body).append('<div id="statusbar" class="statusbar" />');
	$('#statusbar').css('top',(document.height - 25) + 'px');
	
	$(window).resize(function(){
	
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
		$('#index-vwf').focus();
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
		
		
		MouseMoved = false;
		if(MoveGizmo && e.button == 0)
		{
			
			//console.log(vwf.views[0].lastPick.object.uid);
			var axis = -1;
			for(var i =0; i < MoveGizmo.children.length;i++)
			{
				if(vwf.views[0].lastPick.object)
				if(vwf.views[0].lastPick.object.uid == MoveGizmo.children[i].uid)
				axis = i;
			}			
			
			document.AxisSelected = axis;
			
			OldX = e.clientX;
			OldY = e.clientY;
			updateGizmoOrientation(true);
			var gizpos = [MoveGizmo.getLocX(),MoveGizmo.getLocY(),MoveGizmo.getLocZ()];
			var campos = [findscene().camera.getLocX(),findscene().camera.getLocY(),findscene().camera.getLocZ()];
			var ray = GetWorldPickRay(e);
			
			var dxy = intersectLinePlaneTEST(ray,campos,gizpos,WorldZ);
			oldintersectxy = dxy;//GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy));
			
			var dxz = intersectLinePlaneTEST(ray,campos,gizpos,WorldY);
			oldintersectxz = dxz;//GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxz));
			
			var dyz = intersectLinePlaneTEST(ray,campos,gizpos,WorldX);
			oldintersectyz = dyz;//GLGE.addVec3(campos,GLGE.scaleVec3(ray,dyz));
			
			
			if(document.AxisSelected == 3 || document.AxisSelected == 16 ||document.AxisSelected == 4 || document.AxisSelected == 17 || document.AxisSelected == 5 || document.AxisSelected == 18)
			{
				dxy = intersectLinePlane(ray,campos,gizpos,CurrentZ);
				oldintersectxy = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy));
				
				dxz = intersectLinePlane(ray,campos,gizpos,CurrentY);
				oldintersectxz = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxz));
				
				dyz = intersectLinePlane(ray,campos,gizpos,CurrentX);
				oldintersectyz = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dyz));
			}
			
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
			
			
			
			
			if(document.AxisSelected == -1 && SelectMode == 'Pick')
			{
				this.MouseLeftDown = true;
				this.mouseDownScreenPoint = [e.clientX,e.clientY];
				this.selectionMarquee.css('left',this.mouseDownScreenPoint[0]);
				this.selectionMarquee.css('top',this.mouseDownScreenPoint[1]);
				this.selectionMarquee.css('width','0');
				this.selectionMarquee.css('height','0');
				this.selectionMarquee.show();
				this.selectionMarquee.css('z-index','100');
			}
			
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
		//if(MoveGizmo)
		//updateGizmoSize();	
	}.bind(this);
	
	this.GetUniqueName = function(newname)
	{	
		if(!newname) newname = 'Object';
		newname = newname.replace(/[0-9]*$/g,"");
		var nodes = vwf.models[3].model.objects;
		var count = 1;
		for(var i in nodes)
		{
			var thisname = nodes[i].properties.DisplayName || '';
			thisname = thisname.replace(/[0-9]*$/g,"");
			if(thisname == newname)
				count++;
		}
		return newname+count;
	}
	var click=function(e)
	{
		
	}.bind(this);
	this.ShowContextMenu = function(e)
	{
			e.preventDefault();
			e.stopPropagation();
			var ray = GetWorldPickRay(e);
			var campos = [findscene().camera.getLocX(),findscene().camera.getLocY(),findscene().camera.getLocZ()];
			
			MoveGizmo.InvisibleToCPUPick = true;
			var pick = findscene().CPUPick(campos,ray);
			MoveGizmo.InvisibleToCPUPick = false;
			
			var vwfnode;
			while(pick && pick.object && !pick.object.vwfID)
				pick.object = pick.object.parent;
			if(pick && pick.object)
				vwfnode = pick.object.vwfID;
			if(_Editor.isSelected(vwfnode))
			{
				$('#ContextMenuCopy').show();
				$('#ContextMenuDelete').show();
				$('#ContextMenuFocus').show();
				$('#ContextMenuDuplicate').show();
				$('#ContextMenuSelect').hide();
				$('#ContextMenuSelectNone').show();
			}
			else
			{
				$('#ContextMenuCopy').hide();
				$('#ContextMenuDelete').hide();
				$('#ContextMenuFocus').hide();
				$('#ContextMenuDuplicate').hide();
				$('#ContextMenuSelectNone').hide();
				if(vwfnode)
				{
					$('#ContextMenuSelect').show();
				}
			}
			var dispName;
			if(vwfnode)
				dispName = vwf.getProperty(vwfnode,'DisplayName');
			if(!dispName)
				dispName = vwfnode;
			$('#ContextMenuName').html(dispName || "{none selected}");
			$('#ContextMenuName').attr('VWFID',vwfnode);
			
			$('#ContextMenu').show();
			$('#ContextMenu').css('z-index','1000000');
			$('#ContextMenu').css('left',e.clientX + 'px');
			$('#ContextMenu').css('top',e.clientY + 'px');
			this.ContextShowEvent = e;
			$('#ContextMenuActions').empty();
			
			var actions = vwf.getEvents(vwfnode);
			
			for(var i in actions)
			{
				if(actions[i].parameters.length == 1 && $.trim(actions[i].parameters[0]) == '')
				{
					$('#ContextMenuActions').append('<div id="Action'+i+'" class="ContextMenuAction">'+i+'</div>');
					
					$('#Action'+i).attr('EventName',i);
					$('#Action'+i).click(function(){
						$('#ContextMenu').hide();
						$('#ContextMenu').css('z-index','-1');
						$(".ddsmoothmenu").find('li').trigger('mouseleave');
						$('#index-vwf').focus();
						console.log($(this).attr('EventName'));
						vwf_view.kernel.dispatchEvent(vwfnode,$(this).attr('EventName'));
					});
				}
			}
	}
	this.mouseleave = function(e)
	{
		if(e.toElement != $('#ContextMenu')[0] && $(e.toElement).parent()[0] != $('#ContextMenu')[0] && !$(e.toElement).hasClass('glyph'))
		{	
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
		}
	}
	var mouseup = function(e){ 		
		
		
		if(e.button == 2 && !MouseMoved)
		{
			_Editor.ShowContextMenu(e);
			
			
			return false;
		}
		if(e.mouseleave)
		{
			return;
		}
		
		this.MouseLeftDown = false;
		this.selectionMarquee.hide();
		this.selectionMarquee.css('z-index','-1');
		
		this.mouseUpScreenPoint = [e.clientX,e.clientY];
		
		var w = this.mouseUpScreenPoint[0]-this.mouseDownScreenPoint[0];
		var h = this.mouseUpScreenPoint[1]-this.mouseDownScreenPoint[1];
		var picksize = Math.sqrt(w*w+h*h);
		
	
		if( document.AxisSelected == -1 && e.button == 0)
		{	
			
			if(SelectMode=='Pick')
			{
				if(picksize < 10)
				{
					if(vwf.views[0].lastPickId)
						SelectObject(vwf.getNode(vwf.views[0].lastPickId),this.PickMod);	
				}
				else
				{
					
						var top = this.mouseDownScreenPoint[1];
						var left = this.mouseDownScreenPoint[0]
						var bottom = this.mouseUpScreenPoint[1];
						var right = this.mouseUpScreenPoint[0];
						if(h < 0)
						{
							top = top + h;
							bottom = top + -h;
						}		
						if(w < 0)
						{
							left = left + w;
							right = left + -w;
						}	
		
					var TopLeftRay = GetWorldPickRay({clientX:left,clientY:top});
					var TopRightRay = GetWorldPickRay({clientX:right,clientY:top});
					var BottomLeftRay = GetWorldPickRay({clientX:left,clientY:bottom});
					var BottomRighttRay = GetWorldPickRay({clientX:right,clientY:bottom});
					var campos = [findscene().camera.getLocX(),findscene().camera.getLocY(),findscene().camera.getLocZ()];
					
					var ntl = GLGE.addVec3(campos,TopLeftRay);
					var ntr = GLGE.addVec3(campos,TopRightRay);
					var nbl = GLGE.addVec3(campos,BottomLeftRay);
					var nbr = GLGE.addVec3(campos,BottomRighttRay);
					
					var ftl = GLGE.addVec3(campos,GLGE.scaleVec3(TopLeftRay,10000));
					var ftr = GLGE.addVec3(campos,GLGE.scaleVec3(TopRightRay,10000));
					var fbl = GLGE.addVec3(campos,GLGE.scaleVec3(BottomLeftRay,10000));
					var fbr = GLGE.addVec3(campos,GLGE.scaleVec3(BottomRighttRay,10000));
					
					var frustrum = new Frustrum(ntl,ntr,nbl,nbr,ftl,ftr,fbl,fbr);	
					
					var hits = this.findscene().FrustrumCast(frustrum);
					var vwfhits = [];
					for(var i = 0; i < hits.length; i++)
					{
						var vwfnode;
						while(hits[i] && hits[i].object && !hits[i].object.vwfID)
							hits[i].object = hits[i].object.parent;
						if(hits[i] && hits[i].object)
							vwfnode = hits[i].object.vwfID;
						if(vwfhits.indexOf(vwfnode) == -1)
							vwfhits.push(vwfnode);	
					}
					SelectObject(vwfhits,this.PickMod);
				}				
				e.stopPropagation();
			}
			if(SelectMode=='TempPick')
			{
				if(this.TempPickCallback)
					this.TempPickCallback(vwf.getNode(vwf.views[0].lastPickId));
				e.stopPropagation();	
			}
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
		for(var s =0; s<SelectedVWFNodes.length; s++)
		{
			if(document.PlayerNumber == null)
			{
				_Notifier.notify('You must log in to participate');
				return;
			}
			var owner = vwf.getProperty(SelectedVWFNodes[s].id,'owner');
			if(!_Editor.isOwner(SelectedVWFNodes[s].id,document.PlayerNumber))
			{
				_Notifier.notify('You do not have permission to delete this object');
				return;
			}
			if(SelectedVWFNodes[s])
			{
				vwf_view.kernel.deleteNode(SelectedVWFNodes[s].id);
				$('#StatusSelectedID').html('No Selection');
				$('#StatusPickMode').html('Pick: None');
				if(_PrimitiveEditor.isOpen())
					_PrimitiveEditor.hide();
				if(_MaterialEditor.isOpen())
					_MaterialEditor.hide();
				if(_ScriptEditor.isOpen())
					_ScriptEditor.hide();
			}
		}
		SelectObject(null);
		
	}.bind(this);
	//	$('#vwf-root').keyup(function(e){
	var keyup = function(e)
	{
		if(e.keyCode == 17)
		{
			this.PickMod = NewSelect;
			$('#index-vwf').css('cursor','default');
		}
		if(e.keyCode == 18)
		{
			this.PickMod = NewSelect;
			$('#index-vwf').css('cursor','default');
		}
	}.bind(this);
	var keydown = function(e)
	{
		//console.log(e);

		if(e.keyCode == 17)
		{
			this.PickMod = Add;
			$('#index-vwf').css('cursor','all-scroll');
		}
		if(e.keyCode == 18)
		{
			this.PickMod = Subtract;
			$('#index-vwf').css('cursor','not-allowed');
		}

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
	this.SelectParent = function()
	{
		if(_Editor.GetSelectedVWFNode())
			_Editor.SelectObject(vwf.parent(_Editor.GetSelectedVWFNode().id));
	}
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
	
	var intersectLinePlaneTEST = function(ray,raypoint,planepoint,planenormal)
	{
		var tmatrix = [CurrentX[0],CurrentY[0],CurrentZ[0],0,
					   CurrentX[1],CurrentY[1],CurrentZ[1],0,
					   CurrentX[2],CurrentY[2],CurrentZ[2],0,
					   0,0,0,1];
		tmatrix = GLGE.transposeMat4(tmatrix);			   
		var tplanepoint = GLGE.mulMat4Vec3(tmatrix ,planepoint);
		var tplanenormal = GLGE.mulMat4Vec3(tmatrix ,planenormal);
		var traypoint = GLGE.mulMat4Vec3(tmatrix ,raypoint);
		var tray = GLGE.mulMat4Vec3(tmatrix ,ray);
		
		var n = GLGE.dotVec3(GLGE.subVec3(tplanepoint,traypoint),tplanenormal);
		var d = GLGE.dotVec3(tray,tplanenormal);
		if(d == 0)
		return null;
		
		var dist = n/d;
		
		var tpoint = GLGE.addVec3(raypoint,GLGE.scaleVec3(tray,dist));
		return tpoint;
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
		
		
		var OldX = e.clientX - $('#index-vwf').offset().left;
		var OldY = e.clientY - $('#index-vwf').offset().top;
		
		var screenmousepos = [OldX/document.getElementById('index-vwf').clientWidth,OldY/document.getElementById('index-vwf').clientHeight,0,1];
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
	var RotateAroundAxis = function(RotationMatrix, Axis, Radians,rotationMatrix)
	{
		
		if(CoordSystem == WorldCoords)
		{	
		
			var childmat = GetRotationMatrix(_Editor.findviewnode(_Editor.GetSelectedVWFNode().id).getModelMatrix());
			var parentmat = GetRotationMatrix(_Editor.findviewnode(_Editor.GetSelectedVWFNode().id).parent.getModelMatrix());
			Axis = GLGE.mulMat4Vec3(GLGE.inverseMat4(parentmat),Axis);
			
		}
		if(CoordSystem == LocalCoords)
		{	
			var childmat = GetRotationMatrix(_Editor.findviewnode(_Editor.GetSelectedVWFNode().id).getModelMatrix());
			Axis = GLGE.mulMat4Vec3(GLGE.inverseMat4(childmat),Axis);
		}
		//Get a quaternion for the input matrix
		var OriginalQuat = goog.vec.Quaternion.fromRotationMatrix4( RotationMatrix,Quat());
		var RotationQuat = goog.vec.Quaternion.fromAngleAxis(Radians, Axis, Quat());
		var RotatedQuat = goog.vec.Quaternion.concat(RotationQuat,OriginalQuat, Quat());
		var NewMatrix = goog.vec.Quaternion.toRotationMatrix4(RotatedQuat, Matrix());
		return NewMatrix;
		
		
	}.bind(this);
	var TransformOffset =function(gizoffset,id)
	{
			
			//_Editor.findviewnode(id).parent.updateMatrix();
			var parentmat = _Editor.findviewnode(id).parent.getModelMatrix();
			parentmat = GLGE.inverseMat4(parentmat);
			parentmat[3] = 0;
			parentmat[7] = 0;
			parentmat[11] = 0;
		//return gizoffset;
		return GLGE.mulMat4Vec3(parentmat,gizoffset);
	}.bind(this)
	var GetRotationTransform = function(Axis, Radians)
	{
		if(CoordSystem == WorldCoords)
		{	
		
			_Editor.findviewnode(_Editor.GetSelectedVWFNode().id).parent.updateMatrix();
			var parentmat = GetRotationMatrix(_Editor.findviewnode(_Editor.GetSelectedVWFNode().id).parent.getModelMatrix());
			Axis = GLGE.mulMat4Vec3(parentmat,Axis);
			
		}
		if(CoordSystem == LocalCoords)
		{	
			_Editor.findviewnode(_Editor.GetSelectedVWFNode().id).updateMatrix();
			var childmat = GetRotationMatrix(_Editor.findviewnode(_Editor.GetSelectedVWFNode().id).staticMatrix);
			Axis = GLGE.mulMat4Vec3(GLGE.inverseMat4(childmat),Axis);
		}
		//Get a quaternion for the input matrix
		var RotationQuat = goog.vec.Quaternion.fromAngleAxis(Radians, Axis, Quat());
		
		var NewMatrix = goog.vec.Quaternion.toRotationMatrix4(RotationQuat, Matrix());
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
	var MoveTransformGizmo = function(axis,amount)
	{
		var pos = GetLocation(MoveGizmo);
		pos = GLGE.addVec3(pos,GLGE.scaleVec3(axis,amount));
		SetLocation(MoveGizmo,pos);
	
	}
	
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
	function tI(x,y)
	{
		x = x-1;
		y=y-1;
		return x*4+y;
	}
	function GetRotationMatrix(mat)
	{
		
		var rmat = Matrix();
		for(var i = 0; i < mat.length; i++)
		rmat[i] = mat[i];
		rmat[3] = 0;
		rmat[7] = 0;
		rmat[11] = 0;
		rmat = GLGE.transposeMat4(rmat)
		
		var sx = Math.sqrt(mat[tI(1,1)]*mat[tI(1,1)]     + mat[tI(1,2)]*mat[tI(1,2)]    +       mat[tI(1,3)]*mat[tI(1,3)] );
		var sy = Math.sqrt(mat[tI(2,1)]*mat[tI(2,1)]     + mat[tI(2,2)]*mat[tI(2,2)]    +       mat[tI(2,3)]*mat[tI(2,3)] );
		var sz = Math.sqrt(mat[tI(3,1)]*mat[tI(3,1)]     + mat[tI(3,2)]*mat[tI(3,2)]    +       mat[tI(3,3)]*mat[tI(3,3)] );

		rmat[tI(1,1)] = mat[tI(1,1)]/sx; rmat[tI(1,2)] = mat[tI(1,2)]/sx; rmat[tI(1,3)] = mat[tI(1,3)]/sx;	
		rmat[tI(2,1)] = mat[tI(2,1)]/sy; rmat[tI(2,2)] = mat[tI(2,2)]/sy; rmat[tI(2,3)] = mat[tI(2,3)]/sy;
		rmat[tI(3,1)] = mat[tI(3,1)]/sz; rmat[tI(3,2)] = mat[tI(3,2)]/sz; rmat[tI(3,3)] = mat[tI(3,3)]/sz;			
	
		
		return GLGE.transposeMat4(rmat);
	}
	this.waitingForSet = [];
	var mousemove = function(e)
	{
		if(this.waitingForSet.length > 0) return; 
		MouseMoved = true;
		
		if(!MoveGizmo || MoveGizmo==null)
		{
			return;
		}
		var originalGizmoPos = [MoveGizmo.getLocX(),MoveGizmo.getLocY(),MoveGizmo.getLocZ()];
		//updateGizmoSize();
		updateGizmoOrientation(false);
		
		if(this.MouseLeftDown)
		{
			this.mouseLastScreenPoint = [e.clientX,e.clientY];
			var w = this.mouseLastScreenPoint[0] - this.mouseDownScreenPoint[0];
			var h = this.mouseLastScreenPoint[1] - this.mouseDownScreenPoint[1];
			if(w > 0)
				this.selectionMarquee.css('width',w);
			else
			  {
				this.selectionMarquee.css('width',-w);
				this.selectionMarquee.css('left',this.mouseLastScreenPoint[0]);
			  }			  
			if(h > 0)  
				this.selectionMarquee.css('height',h);
			else
			{
				this.selectionMarquee.css('height',-h);
				this.selectionMarquee.css('top',this.mouseLastScreenPoint[1]);
			}
		}
		
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
			
			var rotmat2 = GetRotationMatrix(findviewnode(SelectedVWFNodes[0].id).getLocalMatrix());//GLGE.angleAxis(aa[3] * 0.0174532925,[aa[0],aa[1],aa[2]]);
			var invRot2 = GLGE.inverseMat4(rotmat2);
			
			var MoveAxisX = CurrentX;
			var MoveAxisY = CurrentY;
			var MoveAxisZ = CurrentZ;
			
			
			var dxy = intersectLinePlaneTEST(ray,campos,gizpos,CurrentZ);
			var newintersectxy = dxy;//GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy));
			
			var dxz = intersectLinePlaneTEST(ray,campos,gizpos,CurrentY);
			var newintersectxz = dxz;//GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxz));
			
			var dyz = intersectLinePlaneTEST(ray,campos,gizpos,CurrentX);
			var newintersectyz = dyz;//GLGE.addVec3(campos,GLGE.scaleVec3(ray,dyz));
			
			if(document.AxisSelected == 3 || document.AxisSelected == 16 ||document.AxisSelected == 4 || document.AxisSelected == 17 || document.AxisSelected == 5 || document.AxisSelected == 18)
			{
				dxy = intersectLinePlane(ray,campos,gizpos,CurrentZ);
				newintersectxy = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy));
				
				dxz = intersectLinePlane(ray,campos,gizpos,CurrentY);
				newintersectxz = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxz));
				
				dyz = intersectLinePlane(ray,campos,gizpos,CurrentX);
				newintersectyz = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dyz));
			}
			
			
			
			
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
			
			
					var PickDist = 10000/vwf.views[0].lastPick.distance;
					//var tempscale = vwf.getProperty(SelectedVWFNode.id,'scale');
					//var s = findviewnode(SelectedVWFNode.id).getScale();
					
					if(document.AxisSelected == 0)
					{
						wasMoved = true;
						if(Math.abs(GLGE.dotVec3(ray,CurrentZ)) > .8)
						MoveTransformGizmo(CurrentX,relintersectxy[0]);
						else
						MoveTransformGizmo(CurrentX,relintersectxz[0]);
					}
					if(document.AxisSelected == 1)
					{
						wasMoved = true;
						if(Math.abs(GLGE.dotVec3(ray,CurrentZ)) > .8)
						MoveTransformGizmo(CurrentY,relintersectxy[1]);
						else
						MoveTransformGizmo(CurrentY,relintersectyz[1]);
					}
					if(document.AxisSelected == 2)
					{
						wasMoved = true;
						if(Math.abs(GLGE.dotVec3(ray,CurrentX)) > .8)
						MoveTransformGizmo(MoveAxisZ,relintersectyz[2]);
						else	
						MoveTransformGizmo(MoveAxisZ,relintersectxz[2]);
					}
					if(document.AxisSelected == 12)
					{
						wasMoved = true;
						MoveTransformGizmo(MoveAxisX,relintersectxy[0]);
						MoveTransformGizmo(MoveAxisY,relintersectxy[1]);
					}
					if(document.AxisSelected == 13)
					{
						wasMoved = true;
						MoveTransformGizmo(MoveAxisX,relintersectxz[0]);
						MoveTransformGizmo(MoveAxisZ,relintersectxz[2]);
					}
					if(document.AxisSelected == 14)
					{
						wasMoved = true;
						MoveTransformGizmo(MoveAxisY,relintersectyz[1]);
						MoveTransformGizmo(MoveAxisZ,relintersectyz[2]);
					}
					
					
			for(var s = 0; s < SelectedVWFNodes.length;s++)
			{
				if(SelectedVWFNodes[s])
				{	
				
					var tempscale =  [lastscale[s][0],lastscale[s][1],lastscale[s][2]];//[s.x,s.y,s.z];
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
				    var rotationTransform;
					if(document.AxisSelected == 3 || document.AxisSelected == 16)
					{
						wasRotated = true;
						
						rotationTransform = GetRotationTransform(WorldX,relrotx);
					}
					if(document.AxisSelected == 4 || document.AxisSelected == 17)
					{
						wasRotated = true;
						
						rotationTransform = GetRotationTransform(WorldY,relroty);						
					}
					if(document.AxisSelected == 5 || document.AxisSelected == 18)
					{
						wasRotated = true;
						
						rotationTransform = GetRotationTransform(WorldZ,relrotz);
					}
					
					if(wasMoved)
					{
						
						var gizoffset = GLGE.subVec3([MoveGizmo.getLocX(),MoveGizmo.getLocY(),MoveGizmo.getLocZ()],originalGizmoPos);
						gizoffset = TransformOffset(gizoffset,SelectedVWFNodes[s].id);
						
						
						var newloc = GLGE.addVec3(lastpos[s],gizoffset);
						lastpos[s] = newloc;
						var transform = vwf.getProperty(SelectedVWFNodes[s].id,'transform');
						transform[12] += gizoffset[0];
						transform[13] += gizoffset[1];
						transform[14] += gizoffset[2];
						
						var success = this.setProperty(SelectedVWFNodes[s].id,'transform',transform);
						if(success) this.waitingForSet.push(SelectedVWFNodes[s].id);
						if(!success) SetLocation(MoveGizmo,originalGizmoPos);
					}
					
					if(wasScaled && tempscale[0] > 0 && tempscale[1] > 0 && tempscale[2] > 0)
					{
						
						var relScale = GLGE.subVec3(tempscale,lastscale[s]);
						
						var success = this.setProperty(SelectedVWFNodes[s].id,'scale',[tempscale[0],tempscale[1],tempscale[2]]);
						
						if(SelectedVWFNodes.length > 1)
						{
							
							var gizoffset = GLGE.subVec3(lastpos[s],originalGizmoPos);
							
							gizoffset[0] /= lastscale[s][0];
							gizoffset[1] /= lastscale[s][1];
							gizoffset[2] /= lastscale[s][2];
							
							gizoffset[0] *= tempscale[0];
							gizoffset[1] *= tempscale[1];
							gizoffset[2] *= tempscale[2];
							
							var newloc = GLGE.addVec3(originalGizmoPos,gizoffset);
							lastpos[s] = newloc;
							this.waitingForSet.push(SelectedVWFNodes[s].id);
							var success = this.setProperty(SelectedVWFNodes[s].id,'translation',newloc);
							if(success) this.waitingForSet.push(SelectedVWFNodes[s].id);							
						}
						lastscale[s] = tempscale;
						
					}
					if(wasRotated)
					{		
						
						
						var transform = vwf.getProperty(SelectedVWFNodes[s].id,'transform');
						
						var x = transform[12];
						var y = transform[13];
						var z = transform[14];
						
						var scale = vwf.getProperty(SelectedVWFNodes[s].id,'scale');
						
						transform[12] = 0;
						transform[13] = 0;
						transform[14] = 0;
						
						
						
						transform = GLGE.mulMat4(transform,rotationTransform);
						
						
						
						transform[12] = x;
						transform[13] = y;
						transform[14] = z;
						var success = this.setProperty(SelectedVWFNodes[s].id,'transform',transform);
						if(success) this.waitingForSet.push(SelectedVWFNodes[s].id);
						if(SelectedVWFNodes.length > 1)
						{
							
							var gizoffset = GLGE.subVec3(lastpos[s],originalGizmoPos);
							var rotmat = GLGE.inverseMat4(rotationTransform);
							gizoffset = GLGE.mulMat4Vec3(rotmat,gizoffset);
							
							
							var newloc = GLGE.addVec3(originalGizmoPos,gizoffset);
							lastpos[s] = newloc;
							var success = this.setProperty(SelectedVWFNodes[s].id,'translation',newloc);	
							if(success) this.waitingForSet.push(SelectedVWFNodes[s].id);
						}
					}
					//triggerSelectionTransformed(SelectedVWFNode);
					_Editor.updateGizmoOrientation(false);
					
				}
				
				
			}
			if(wasScaled || wasRotated|| wasMoved && _Editor.getSelectionCount() > 1) _Editor.updateBounds();
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
	this.isOwner = function(id,player)
	{
		var owner = vwf.getProperty(id,'owner');
		if(typeof owner === 'string' && owner==player)
		{
			return true;
		}
		if(typeof owner === 'object' && owner.indexOf && owner.indexOf(player) != -1)
		{
			return true;
		}
		return false;
	}
	this.setProperty = function(id,prop,val)
	{
		// if(document.PlayerNumber == null)
		// {
			// _Notifier.notify('You must log in to participate');
			// return false;
		// }
		
		// if(!_Editor.isOwner(id,document.PlayerNumber))
		// {
			// _Notifier.notify('You do not permission to edit this object.');
			// return false;
		// }
		vwf_view.kernel.setProperty(id,prop,val)
		return true;
	}
	this.GetInsertPoint = function()
	{
			var campos = [_Editor.findscene().camera.getLocX(),_Editor.findscene().camera.getLocY(),_Editor.findscene().camera.getLocZ()];
			var ray = _Editor.GetCameraCenterRay();
			var pick = _Editor.findscene().CPUPick(campos,ray);
			var dxy = pick.distance;
			var newintersectxy = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy));
			
			var dxy2 = _Editor.intersectLinePlane(ray,campos,[0,0,0],[0,0,1]);
			var newintersectxy2 = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy2));
			return newintersectxy[2] > newintersectxy2[2]?newintersectxy:newintersectxy2;
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
	this.createLight = function(type,pos,owner)
	{
		
				var proto  = { 
                    extends: 'SandboxLight.vwf',
					properties:{
					  rotation: [ 1, 0, 0, 0 ],
					  translation: pos,
					  owner:owner,
					  type:'Light',
					  lightType:type,
					  DisplayName: _Editor.GetUniqueName('Light')
					  }
                    };
		this.createChild('index-vwf',GUID(),proto,null,null); 
	}
	this.createParticleSystem = function(type,pos,owner)
	{
	
				var proto  = { 
                    extends: 'SandboxParticleSystem.vwf',
					properties:{
					  rotation: [ 1, 0, 0, 0 ],
					  translation: pos,
					  owner:owner,
					  type:'ParticleSystem',
					  DisplayName: _Editor.GetUniqueName('ParticleSystem')
					  }
                    };
		this.createChild('index-vwf',GUID(),proto,null,null); 
	}
	var CreatePrim = function(type,translation,size,texture,owner,id)
	{       
			translation[0] = SnapTo(translation[0],MoveSnap);
			translation[1] = SnapTo(translation[1],MoveSnap);
			translation[2] = SnapTo(translation[2],MoveSnap);
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
			proto.properties.DisplayName = _Editor.GetUniqueName(type);
			
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
			proto.properties.DisplayName = _Editor.GetUniqueName(type);
			
			var id = GetFirstChildLeaf(GetSelectedVWFNode()).id;
			
			var owner = vwf.getProperty(id,'owner');
			if(!_Editor.isOwner(id,document.PlayerNumber))
			{
				_Notifier.notify('You do not have permission to edit this object');
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
					if(vwf.getProperty(object.children[i].id,'isModifier') == true)
						return GetFirstChildLeaf(object.children[i]);
				}
			}
			return object;
		}
		return null;
	}
	var Duplicate = function()
	{
		for(var i = 0; i < SelectedVWFNodes.length; i++)
		{
			var proto = _DataManager.getCleanNodePrototype(SelectedVWFNodes[i].id);
			proto.properties.DisplayName = _Editor.GetUniqueName(proto.properties.DisplayName);
			var parent = vwf.parent(_Editor.GetSelectedVWFNode().id);
			_Editor.createChild(parent,GUID(),proto,null,null,function(){alert();}); 
		}
		_Editor.SelectOnNextCreate(SelectedVWFNodes.length);
		_Editor.SelectObject(null);
	}.bind(this);
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
		_CoppiedNodes = [];
		for(var i = 0; i < SelectedVWFNodes.length; i++)
		{
			var t = _DataManager.getCleanNodePrototype(SelectedVWFNodes[i].id);
			var originalGizmoPos = [MoveGizmo.getLocX(),MoveGizmo.getLocY(),MoveGizmo.getLocZ()];
			var gizoffset = GLGE.subVec3(vwf.getProperty(SelectedVWFNodes[i].id,'translation'),originalGizmoPos);
			t.properties.transform[12] = gizoffset[0];
			t.properties.transform[13] = gizoffset[1];
			t.properties.transform[14] = gizoffset[2];
			t.properties.translation[0] = gizoffset[0];
			t.properties.translation[1] = gizoffset[1];
			t.properties.translation[2] = gizoffset[2];
			
			_CoppiedNodes.push(t);
		}
	}.bind(this);

	var Paste = function(useMousePoint)
	{
		_Editor.SelectObject(null);
		for(var i = 0; i < _CoppiedNodes.length; i++)
		{
			var t = _CoppiedNodes[i];
			
			var campos = [_Editor.findscene().camera.getLocX(),_Editor.findscene().camera.getLocY(),_Editor.findscene().camera.getLocZ()];
				var ray;
				if(!useMousePoint)
					ray = _Editor.GetCameraCenterRay();
				else
					ray = _Editor.GetWorldPickRay(this.ContextShowEvent);
				_Editor.GetMoveGizmo().InvisibleToCPUPick = true;
				var pick = _Editor.findscene().CPUPick(campos,ray);
				_Editor.GetMoveGizmo().InvisibleToCPUPick = false;
				var dxy = pick.distance;
				var newintersectxy = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy*.99));
			
			t.properties.transform[12] += newintersectxy[0];
			t.properties.transform[13] += newintersectxy[1];
			t.properties.transform[14] += newintersectxy[2];
			t.properties.translation[0] += newintersectxy[0];
			t.properties.translation[1] += newintersectxy[1];
			t.properties.translation[2] += newintersectxy[2];
			proto.properties.DisplayName = _Editor.GetUniqueName(proto.properties.DisplayName);
			_Editor.SelectOnNextCreate();
			this.createChild('index-vwf',GUID(),t,null,null); 
			t.properties.transform[12] -= newintersectxy[0];
			t.properties.transform[13] -= newintersectxy[1];
			t.properties.transform[14] -= newintersectxy[2];
			t.properties.translation[0] -= newintersectxy[0];
			t.properties.translation[1] -= newintersectxy[1];
			t.properties.translation[2] -= newintersectxy[2];
		}
	}
	var updateGizmoOrientation = function(updateBasisVectors)
	{
		if(CoordSystem == LocalCoords && SelectedVWFNodes[0])
		{
			
			var aa = vwf.getProperty(SelectedVWFNodes[0].id,'rotation');
			var rotmat = GetRotationMatrix(findviewnode(SelectedVWFNodes[0].id).getModelMatrix());//GLGE.angleAxis(aa[3] * 0.0174532925,[aa[0],aa[1],aa[2]]);
			var invRot = GLGE.inverseMat4(rotmat);
			MoveGizmo.setRotMatrix(invRot);
			if(updateBasisVectors)
			{
				CurrentZ = GLGE.mulMat4Vec3(invRot,WorldZ);
				CurrentX = GLGE.mulMat4Vec3(invRot,WorldX);
				CurrentY = GLGE.mulMat4Vec3(invRot,WorldY);
			}
		}else
		{
			//var rotmat = GetRotationMatrix(findviewnode(SelectedVWFNode.id).parent.getModelMatrix());//GLGE.angleAxis(aa[3] * 0.0174532925,[aa[0],aa[1],aa[2]]);
			MoveGizmo.setRotMatrix([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
			//var invRot = GLGE.inverseMat4(rotmat);
			CurrentZ = WorldZ; //GLGE.mulMat4Vec3(invRot,WorldZ);
			CurrentX = WorldX; //GLGE.mulMat4Vec3(invRot,WorldX);
			CurrentY = WorldY; //GLGE.mulMat4Vec3(invRot,WorldY);
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
	this.updateGizmoLocation = function()
	{
			
			var childmat = this.findviewnode(this.GetSelectedVWFNode().id).getModelMatrix();
			
			lastpos[0] = [childmat[3],childmat[7],childmat[11]];
			
			var gizpos = [0,0,0];
			
			gizpos = [childmat[3],childmat[7],childmat[11]];
			
			for(var s =1; s < SelectedVWFNodes.length; s++)
			{
				this.findviewnode(SelectedVWFNodes[s].id).updateMatrix();
				var nextchildmat = this.findviewnode(SelectedVWFNodes[s].id).getModelMatrix();
				gizpos[0] += nextchildmat[3];
				gizpos[1] += nextchildmat[7];
				gizpos[2] += nextchildmat[11];
				
				var trans = vwf.getProperty(SelectedVWFNodes[s].id,'transform');
				lastpos[s] = [trans[12],trans[13],trans[14]];
				lastscale[s] = vwf.getProperty(SelectedVWFNodes[s].id,'scale');
			}
			
			gizpos[0] /= SelectedVWFNodes.length;
			gizpos[1] /= SelectedVWFNodes.length;
			gizpos[2] /= SelectedVWFNodes.length;
			
			MoveGizmo.setLoc(gizpos[0],gizpos[1],gizpos[2]);
	}
	this.updateBounds = function()
	{
			
			for(var i =0; i < SelectionBounds.length; i++)
			{
				SelectionBounds[i].parent.removeChild(SelectionBounds[i]);
			}
			SelectionBounds = [];
			for(var i =0; i < SelectedVWFNodes.length; i++)
			{	
				var box;
				var mat;
				
				box = _Editor.findviewnode(SelectedVWFNodes[i].id).GetBoundingBox(true);
				mat = _Editor.findviewnode(SelectedVWFNodes[i].id).getModelMatrix().slice(0);
				
				
				var color = [1,1,1,1];
				if(findviewnode(SelectedVWFNodes[i].id).initializedFromAsset)
					color = [1,0,0,1];
				SelectionBounds[i] = BuildBox([box.max[0] - box.min[0],box.max[1] - box.min[1],box.max[2] - box.min[2]],[box.min[0] + (box.max[0] - box.min[0])/2,box.min[1] + (box.max[1] - box.min[1])/2,box.min[2] + (box.max[2] - box.min[2])/2],color);
				
			
				SelectionBounds[i].setStaticMatrix(mat);
				SelectionBounds[i].InvisibleToCPUPick = true;
				SelectionBounds[i].setCastShadows(false);
				SelectionBounds[i].setDrawType(GLGE.DRAW_LINELOOPS);
				SelectionBounds[i].setDepthTest(false);
				SelectionBounds[i].setZtransparent(true);
				SelectionBounds[i].setCull(GLGE.NONE);
				SelectionBounds[i].setPickable(false);
				SelectionBounds[i].RenderPriority = 999;
				this.SelectionBoundsContainer.addChild(SelectionBounds[i]);
			}
	}
	this.getSelectionCount =function()
	{
		return SelectedVWFNodes.length;
	
	}.bind(this);
	this.isSelected =function(id)
	{
			var index = -1;
			
			for(var i = 0; i < SelectedVWFNodes.length; i++)
				if(SelectedVWFNodes[i] && SelectedVWFNodes[i].id == id)
					index = i;		
			if(index == -1)
				return false;
			return true;	
	}.bind(this);
	var SelectObject = function(VWFNode,selectmod)
	{
		
		if(VWFNode && VWFNode.constructor.name == 'Array')
		{
			for(var i =0; i < VWFNode.length; i++)
				VWFNode[i] = vwf.getNode(VWFNode[i]);
		}else if(typeof(VWFNode) == 'object')
			VWFNode = [VWFNode];
		else if(typeof(VWFNode) == 'string')
			VWFNode = [vwf.getNode(VWFNode)];
			
		
			
		
		if(!selectmod)
		{
			SelectedVWFNodes = [];
		}
		
		if(VWFNode)
		for(var i =0; i < VWFNode.length; i++)
		{
			if(!selectmod)
			{
				if(VWFNode[i])
					SelectedVWFNodes.push(VWFNode[i]);
			}
			
			if(selectmod == Add)
			{
				
				if(!this.isSelected(VWFNode[i].id) )
					SelectedVWFNodes.push(VWFNode[i]);
			}
			
			if(selectmod == Subtract)
			{
				var index = -1;
				
				for(var j = 0; j < SelectedVWFNodes.length; j++)
					if(SelectedVWFNodes[j] && SelectedVWFNodes[j].id == VWFNode[i].id)
						index = j;
						
				SelectedVWFNodes.splice(index,1);		
				
			}
		}
		
		if(SelectedVWFNodes[0])
			this.SelectedVWFID = SelectedVWFNodes[0].id;
		else
			this.SelectedVWFID = null;
			
		triggerSelectionChanged(SelectedVWFNodes[0]);
		
		if(MoveGizmo == null)
		{
			BuildMoveGizmo();
		}
		MoveGizmo.InvisibleToCPUPick = false;
		if(SelectedVWFNodes[0])
		{
			for(var s = 0; s < SelectedVWFNodes.length; s++)
			{
				lastscale[s] = vwf.getProperty(SelectedVWFNodes[s].id,'scale');
				
				MoveGizmo.setVisible(true);
				
				if(findviewnode(SelectedVWFNodes[s].id))
				{
					findviewnode(SelectedVWFNodes[s].id).setTransformMode(GLGE.P_MATRIX);
					//findviewnode(SelectedVWFNodes[s].id).setRotMatrix(GetRotationMatrix(findviewnode(SelectedVWFNodes[s].id).getLocalMatrix()));
					//findviewnode(SelectedVWFNodes[s].id).updateMatrix
				}
			}
			updateBoundsAndGizmoLoc();
			updateGizmoOrientation(true);
		}
		else
		{
			MoveGizmo.setVisible(false);
			MoveGizmo.InvisibleToCPUPick = true;
			if(SelectionBounds.length > 0)
			{
				for(var i =0; i < SelectionBounds.length; i++)
				{
					SelectionBounds[i].parent.removeChild(SelectionBounds[i]);
				}
				SelectionBounds = [];
			}
		}
	}.bind(this);
	var updateBoundsAndGizmoLoc = function()
	{
	
	
			
			_Editor.updateGizmoLocation();
			_Editor.updateGizmoSize();
			_Editor.updateGizmoOrientation(false);
			_Editor.updateBounds();
			$('#StatusSelectedID').html(SelectedVWFNodes[0].id);
			
			
	
	
	}.bind(this);
	var updateGizmoSize = function()
	{
		var gizpos = [MoveGizmo.getLocX(),MoveGizmo.getLocY(),MoveGizmo.getLocZ()];
		var campos = [findscene().camera.getLocX(),findscene().camera.getLocY(),findscene().camera.getLocZ()];
		var dist = GLGE.lengthVec3(GLGE.subVec3(gizpos,campos));
		dist = dist/10;
		
		var windowXadj = 1600.0/$('#index-vwf').width();
		var windowYadj = 1200.0/$('#index-vwf').height();
		var winadj = Math.max(windowXadj,windowYadj);
		MoveGizmo.setScaleX(dist*winadj);
		MoveGizmo.setScaleY(dist*winadj);
		MoveGizmo.setScaleZ(dist*winadj);
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
		MoveGizmo.children[0].getMesh().setPickMesh(BuildBox([1,.20,.20],[.5,0,0],red).getMesh());
		MoveGizmo.addChild(BuildBox([.030,1,.030],[0,.5,0],green));//move y
		MoveGizmo.children[1].getMesh().setPickMesh(BuildBox([.2,1,.20],[0,.5,0],red).getMesh());
		MoveGizmo.addChild(BuildBox([.030,.030,1],[0,0,.5],blue));//move z
		MoveGizmo.children[2].getMesh().setPickMesh(BuildBox([.2,.20,1],[0,0,.5],red).getMesh());
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
		MoveGizmo.children[12].getMesh().setPickMesh(BuildBox([.50,.50,.030],[.25,.25,.015],red).getMesh());
		MoveGizmo.addChild(BuildBox([.150,.030,.150],[.075,.015,.075],[.75,.25,.75,1]));//movexz
		MoveGizmo.children[13].getMesh().setPickMesh(BuildBox([.50,.030,.5],[.25,.015,.25],red).getMesh());
		MoveGizmo.addChild(BuildBox([.030,.150,.150],[.015,.075,.075],[.25,.75,.75,1]));//moveyz
		MoveGizmo.children[14].getMesh().setPickMesh(BuildBox([.030,.50,.5],[.015,.25,.25],red).getMesh());
		MoveGizmo.addChild(BuildRing([0,.170,0],[0,.240,0],[0,0,-1],4,[1,1,1,1],90,450));//rotate z
		
		MoveGizmo.addChild(BuildRing([0,1.050,0],[0,1,0],[1,0,0],37,red,0,370));//rotate x
		MoveGizmo.addChild(BuildRing([0,0,1.050],[0,0,1],[0,1,0],37,green,0,370));//rotate y
		MoveGizmo.addChild(BuildRing([0,1.050,0],[0,1,0],[0,0,-1],37,blue,0,370));//rotate z
		
		MoveGizmo.children[16].getMesh().setPickMesh(BuildRing([0,1.120,0],[0,.9,0],[1,0,0],37,red,0,370).getMesh());//rotate x
		MoveGizmo.children[17].getMesh().setPickMesh(BuildRing([0,0,1.120],[0,0,.9],[0,1,0],37,green,0,370).getMesh());//rotate y
		MoveGizmo.children[18].getMesh().setPickMesh(BuildRing([0,1.120,0],[0,.9,0],[0,0,-1],37,blue,0,370).getMesh());//rotate z
		
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
			MoveGizmo.children[i].PickPriority = Infinity;
			MoveGizmo.children[i].RenderPriority = 1000+i;
			MoveGizmo.children[i].setCastShadows(false);
		}
		MoveGizmo.InvisibleToCPUPick = false;
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
		
		
		
		var planemesh = new GLGE.Mesh();
		var planeobj = new GLGE.Object();
		planeobj.setMesh(planemesh);
		
		planemesh.setPositions(positions);
		planemesh.setFaces(faces);
		planemesh.setVertexColors(colors);
		planemesh.cullFaces = false;
		var mat = new GLGE.Material();
		
		planeobj.setPickable(true);
		planeobj.setMaterial(mat);
		mat.setVertexColorMode(GLGE.VC_MUL);
		mat.setShadeless(true);
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
		
		var indexes = [0,2,6,6,4,0,
					   1,3,7,7,5,1,
					   0,1,3,3,2,0,
					   4,5,7,7,6,4,
					   0,1,5,5,4,0,
					   2,3,7,7,6,2];
		
		planemesh.setPositions(positions);
		planemesh.setVertexColors(colors);
		planemesh.setFaces(indexes);
		planemesh.cullFaces = false;
		var mat = new GLGE.Material();
		
		planeobj.setPickable(true);
		planeobj.setMaterial(mat);
		mat.setVertexColorMode(GLGE.VC_MUL);
		mat.setShadeless(true);
		//mat.setColor(color);
		//mat.setEmit(color);
		//mat.setShadeless(true);
		//mat.setAmbient([.5,.5,.5,1]);
		return planeobj;
	}.bind(this);
	this.PickParentCallback = function(parentnode)
	{
		
		this.TempPickCallback = null;
		var node = _DataManager.getCleanNodePrototype(this.GetSelectedVWFNode().id);
		
		
		var childmat = this.findviewnode(this.GetSelectedVWFNode().id).getModelMatrix();
		var parentmat = this.findviewnode(parentnode.id).getModelMatrix();
		var invparentmat = GLGE.inverseMat4(parentmat);
		childmat = GLGE.mulMat4(invparentmat,childmat);
		
		delete node.properties.translation;
		delete node.properties.rotation;
		delete node.properties.quaternion;
		delete node.properties.scale;
		
		node.properties.transform = GLGE.transposeMat4(childmat);
	
		
		this.DeleteSelection();
		this.createChild(parentnode.id,GUID(),node);
		_Editor.SelectOnNextCreate();
		SetSelectMode('Pick');
	}
	this.RemoveParent = function()
	{
		
		var node = _DataManager.getCleanNodePrototype(this.GetSelectedVWFNode().id);

		var childmat = this.findviewnode(this.GetSelectedVWFNode().id).getModelMatrix();

		delete node.properties.translation;
		delete node.properties.rotation;
		delete node.properties.quaternion;
		delete node.properties.scale;
		
		node.properties.transform = GLGE.transposeMat4(childmat);
		
		this.DeleteSelection();
		_Editor.SelectOnNextCreate();
		this.createChild('index-vwf',GUID(),node);
		SetSelectMode('Pick');
	}
	this.SetParent = function()
	{
		if(!this.GetSelectedVWFNode())
		{
			_Notifier.alert('No object selected. Select the desired child, then use this to choose the parent.');
			return;
		}
		SetSelectMode('TempPick');
		this.TempPickCallback = this.PickParentCallback;
	}
	var findviewnode = function(id)
	{
		for(var i =0; i<vwf.views.length;i++)
		{
			if(vwf.views[i] && vwf.views[i].state && vwf.views[i].state.nodes && vwf.views[i].state.nodes[id] && vwf.views[i].state.nodes[id].glgeObject ) return vwf.views[i].state.nodes[id].glgeObject ;
			if(vwf.views[i] && vwf.views[i].state && vwf.views[i].state.scenes && vwf.views[i].state.scenes[id] && vwf.views[i].state.scenes[id].glgeScene ) return vwf.views[i].state.scenes[id].glgeScene ;
			
			
		}
		return null;
	}.bind(this);
	this.SelectScene = function()
	{
		this.SelectObject('index-vwf');
	}
	var SetSelectMode = function(e)
	{
		SelectMode = e;
		$('#StatusPickMode').html('Pick: ' + e);
		if(e == 'Pick')
			$('#MenuSelectPickicon').css('background',"#9999FF");
		else
			$('#MenuSelectPickicon').css('background',"");	
			
		if(SelectMode == 'TempPick')
		{
			$('#index-vwf').css('cursor','crosshair');
		}else
		{
			$('#index-vwf').css('cursor','default');
		}
	}.bind(this);
	var SetCoordSystem	= function(e)
	{
		CoordSystem = e;
		if(e == WorldCoords)
		{
			$('#StatusCoords').html('World Coords');
			$('#MenuWorldicon').css('background',"#9999FF");
			$('#MenuLocalicon').css('background',"");
		}
		else
		{
			$('#StatusCoords').html('Local Coords');
			$('#MenuWorldicon').css('background',"");
			$('#MenuLocalicon').css('background',"#9999FF");
		}
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
	this.GetSelectedVWFID = function()
	{
		return this.SelectedVWFID;
	}
	this.CallCreateNodeCallback = function(e)
	{
		try
		{
			this.createNodeCallback(e);
			
		}catch(e)
		{
			console.log(e);
		}
	}
	this.SetCreateNodeCallback = function(callback)
	{
		this.createNodeCallback = callback;
	}
	this.SelectOnNextCreate = function(count)
	{
		if(!count)
			count = 1;
		var c = count;	
		this.SetCreateNodeCallback(function(e){
				
				_Editor.SelectObject(e,Add);
				if(_Editor.getSelectionCount() == c)
					_Editor.createNodeCallback = null;
		});
	}
	var GetSelectedVWFNode = function(idx)
	{
		if(idx === undefined)
			idx = 0;
		try{
			
			if(SelectedVWFNodes[idx])
			return vwf.getNode(SelectedVWFNodes[idx].id);
		}catch(e)
		{
			
			return null;
		}
	}.bind(this);
	var findscene = function()
	{
		return vwf.views[0].state.scenes["index-vwf"].glgeScene;
        
	}.bind(this);
	this.buildContextMenu = function()
	{
		$(document.body).append('<div id="ContextMenu" />');
		
		$('#ContextMenu').append('<div id="ContextMenuName" style="border-bottom: 3px solid gray;">name</div>');
		$('#ContextMenu').append('<div id="ContextMenuActions" style="border-bottom: 2px gray dotted;"></div>');
		$('#ContextMenu').append('<div id="ContextMenuSelect" class="ContextMenuItem" style="border-bottom: 1px solid gray;">Select</div>');
		$('#ContextMenu').append('<div id="ContextMenuSelectNone" class="ContextMenuItem" style="border-bottom: 1px solid gray;" >Select None</div>');
		$('#ContextMenu').append('<div id="ContextMenuMove" class="ContextMenuItem">Move</div>');
		$('#ContextMenu').append('<div id="ContextMenuRotate" class="ContextMenuItem">Rotate</div>');
		$('#ContextMenu').append('<div id="ContextMenuScale" class="ContextMenuItem" style="border-bottom: 1px solid gray;">Scale</div>');
		$('#ContextMenu').append('<div id="ContextMenuFocus" class="ContextMenuItem" style="border-bottom: 1px solid gray;" >Focus</div>');
		$('#ContextMenu').append('<div id="ContextMenuCopy" class="ContextMenuItem">Copy</div>');
		$('#ContextMenu').append('<div id="ContextMenuPaste" class="ContextMenuItem">Paste</div>');
		$('#ContextMenu').append('<div id="ContextMenuDuplicate" class="ContextMenuItem" style="border-bottom: 1px solid gray;">Duplicate</div>');
		$('#ContextMenu').append('<div id="ContextMenuDelete" class="ContextMenuItem" style="border-bottom: 1px solid gray;">Delete</div>');
		
		
		$('#ContextMenu').disableSelection();
		
		$('#ContextMenuSelect').click(function()
		{
			_Editor.SelectObject($('#ContextMenuName').attr('VWFID'));
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
			$(".ddsmoothmenu").find('li').trigger('mouseleave');
			$('#index-vwf').focus();
		});
		
		$('#ContextMenuSelectNone').click(function()
		{
			_Editor.SelectObject(null);
			_Editor.SetSelectMode('None');
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
			$(".ddsmoothmenu").find('li').trigger('mouseleave');
			$('#index-vwf').focus();
		});
		$('#ContextMenuMove').click(function()
		{
			$('#MenuMove').click();
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
			$(".ddsmoothmenu").find('li').trigger('mouseleave');
			$('#index-vwf').focus();
		});
		$('#ContextMenuRotate').click(function()
		{
			$('#MenuRotate').click();
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
			$(".ddsmoothmenu").find('li').trigger('mouseleave');
			$('#index-vwf').focus();
		});
		$('#ContextMenuScale').click(function()
		{
			$('#MenuScale').click();
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
			$(".ddsmoothmenu").find('li').trigger('mouseleave');
			$('#index-vwf').focus();
		});
		$('#ContextMenuFocus').click(function()
		{
			$('#MenuFocusSelected').click();
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
			$(".ddsmoothmenu").find('li').trigger('mouseleave');
			$('#index-vwf').focus();
		});
		$('#ContextMenuCopy').click(function()
		{
			$('#MenuCopy').click();
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
			$(".ddsmoothmenu").find('li').trigger('mouseleave');
			$('#index-vwf').focus();
		});
		$('#ContextMenuPaste').click(function(e)
		{
			_Editor.Paste(true);
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
		});
		$('#ContextMenuDuplicate').click(function()
		{
			$('#MenuDuplicate').click();
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
			$(".ddsmoothmenu").find('li').trigger('mouseleave');
			$('#index-vwf').focus();
		});
		$('#ContextMenuDelete').click(function()
		{
			$('#MenuDelete').click();
			$('#ContextMenu').hide();
			$('#ContextMenu').css('z-index','-1');
			$(".ddsmoothmenu").find('li').trigger('mouseleave');
			$('#index-vwf').focus();
		});
		
	}
	
	this.initialize = function()
	{
		
		this.BuildMoveGizmo();
		this.SelectObject(null);
		$(document).bind('prerender',this.updateGizmoSize.bind(this));
		document.oncontextmenu = function() {return false;};
		this.SelectionBoundsContainer = new GLGE.Group();
		this.findscene().addChild(this.SelectionBoundsContainer);
		this.buildContextMenu();
		
		this.mouseDownScreenPoint = [0,0];
		this.mouseUpScreenPoint = [0,0];
		
		$(document.body).append('<div id="selectionMarquee" />');
		this.selectionMarquee = $('#selectionMarquee'); 
		this.selectionMarquee.css('position','absolute');
		this.selectionMarquee.css('width','100');
		this.selectionMarquee.css('height','100');
		this.selectionMarquee.css('top','100');
		this.selectionMarquee.css('left','100');
		this.selectionMarquee.css('z-index','100');
		this.selectionMarquee.css('border','2px dotted darkslategray');
		this.selectionMarquee.css('border-radius','10px');
		//this.selectionMarquee.css('box-shadow','0px 0px 10px lightgray, 0px 0px 10px lightgray inset');
		this.selectionMarquee.mousedown(function(e){_Editor.mousedown(e);e.preventDefault();e.stopPropagation();return false;});
		this.selectionMarquee.mouseup(function(e){_Editor.mouseup(e);e.preventDefault();e.stopPropagation();return false;});
		this.selectionMarquee.mousemove(function(e){_Editor.mousemove(e);e.preventDefault();e.stopPropagation();return false;});
		
		$('body *').not(':has(input)').not('input').disableSelection();
		this.selectionMarquee.hide();
		$('#ContextMenu').hide();
	}
	
	this.GetSelectionBounds = function(){return SelectionBounds;};
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
	this.SelectedVWFNodes = SelectedVWFNodes;
	this.RotateSnap = RotateSnap;
	this.MoveSnap = MoveSnap;
	this.ScaleSnap = ScaleSnap;
	this.WorldZ = WorldZ;
	this.WorldY = WorldY;
	this.WorldX = WorldX;
	this.GetCurrentZ = function(){return CurrentZ};
	this.GetCurrentY = function(){return CurrentY};
	this.GetCurrentX = function(){return CurrentX};
	this.SetSelectMode = SetSelectMode;
	this.SetCoordSystem = SetCoordSystem;
	this.GetMoveGizmo = GetMoveGizmo;
	this.SetSnaps = SetSnaps;
	this.GetSelectedVWFNode = GetSelectedVWFNode;
	this.SelectObject = SelectObject;
	this.Copy = Copy;
	this.click=click;
	this.Paste = Paste;
	this.Duplicate = Duplicate;
	this.CreateModifier = CreateModifier;
	this.GetRotationMatrix = GetRotationMatrix;
	this.updateBoundsAndGizmoLoc = updateBoundsAndGizmoLoc;
	this.keyup = keyup;
	this.GetSelectMode = function(){return SelectMode;}
	
	
	

	//$(document).bind('prerender',this.rt.bind(this));
}

_Editor = new Editor();
_Editor.initialize();