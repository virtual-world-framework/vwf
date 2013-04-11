function AlignTool()
{
	this.buildGUI = function()
	{
		$(document.body).append("<div id='AlignToolGUI'/>");
		$('#AlignToolGUI').append("<div id='AlignToolGUI_PickTarget'/>");
		$('#AlignToolGUI').append("<div id='AlignToolGUI_PickTargetID' style='display: inline;margin-left: 10px;'/>");
		$('#AlignToolGUI').append("<div style='width:400px'>"+
			"<input type='checkbox' id='AlignX' /><label for='AlignX'>X</label>"+
			"<div id='XFrom' style='display: inline;margin-left: 10px;'>"+
			"  <input type='radio' id='xFromMin' name='XFrom'/><label for='xFromMin'>Min</label>"+
			"  <input type='radio' id='xFromMax' name='XFrom'/><label for='xFromMax'>Max</label>"+
			"  <input type='radio' id='xFromCenter' name='XFrom' checked=checked/><label for='xFromCenter'>Center</label>"+
			"</div>"+
			"<div id='XTo' style='display: inline;margin-left: 10px;'>"+
			"  <input type='radio' id='xToMin' name='XTo'/><label for='xToMin'>Min</label>"+
			"  <input type='radio' id='xToMax' name='XTo'/><label for='xToMax'>Max</label>"+
			"  <input type='radio' id='xToCenter' name='XTo' checked=checked/><label for='xToCenter'>Center</label>"+
			"</div>"+
			"</div>"
		);
	
		$('#AlignToolGUI').append("<div style='width:400px'>"+
			"<input type='checkbox' id='AlignY' /><label for='AlignY'>Y</label>"+
			"<div id='YFrom' style='display: inline;margin-left: 10px;'>"+
			"  <input type='radio' id='yFromMin' name='YFrom'/><label for='yFromMin'>Min</label>"+
			"  <input type='radio' id='yFromMax' name='YFrom'/><label for='yFromMax'>Max</label>"+
			"  <input type='radio' id='yFromCenter' name='YFrom' checked=checked/><label for='yFromCenter'>Center</label>"+
			"</div>"+
			"<div id='YTo' style='display: inline;margin-left: 10px;'>"+
			"  <input type='radio' id='yToMin' name='YTo'/><label for='yToMin'>Min</label>"+
			"  <input type='radio' id='yToMax' name='YTo'/><label for='yToMax'>Max</label>"+
			"  <input type='radio' id='yToCenter' name='YTo' checked=checked/><label for='yToCenter'>Center</label>"+
			"</div>"+
			"</div>"
		);
		
			
		$('#AlignToolGUI').append("<div style='width:400px'>"+
			"<input type='checkbox' id='AlignZ' /><label for='AlignZ'>Z</label>"+
			"<div id='ZFrom' style='display: inline;margin-left: 10px;'>"+
			"  <input type='radio' id='zFromMin' name='ZFrom'/><label for='zFromMin'>Min</label>"+
			"  <input type='radio' id='zFromMax' name='ZFrom'/><label for='zFromMax'>Max</label>"+
			"  <input type='radio' id='zFromCenter' name='ZFrom' checked=checked/><label for='zFromCenter'>Center</label>"+
			"</div>"+
			"<div id='ZTo' style='display: inline;margin-left: 10px;'>"+
			"  <input type='radio' id='zToMin' name='ZTo'/><label for='zToMin'>Min</label>"+
			"  <input type='radio' id='zToMax' name='ZTo'/><label for='zToMax'>Max</label>"+
			"  <input type='radio' id='zToCenter' name='ZTo' checked=checked/><label for='zToCenter'>Center</label>"+
			"</div>"+
			"</div>"
		);
		
		$('#AlignToolGUI input').change(function()
		{	
			_AlignTool.updateDisplay();
		});
		$('#AlignToolGUI_PickTarget').button({label:'Pick Target'});
		$('#AlignToolGUI_PickTarget').click(function(){_AlignTool.PickTarget()});
		$( "#AlignX" ).button();
		$( "#XFrom" ).buttonset();
		$( "#XTo" ).buttonset();
		$( "#AlignY" ).button();
		$( "#YFrom" ).buttonset();
		$( "#YTo" ).buttonset();
		$( "#AlignZ" ).button();
		$( "#ZFrom" ).buttonset();
		$( "#ZTo" ).buttonset();
		$('#AlignToolGUI').dialog({
		
			
			closeOnEscape:false,
			buttons:{
				OK:function()
				{
					_AlignTool.OK();
					$(this).dialog('close');
				},
				Cancel:function()
				{
					_AlignTool.Cancel();
					$(this).dialog('close');
				}
				
			},
			close:function()
			{
				_AlignTool.hide();
			},
			autoOpen:false,
			width: 'auto'
		
		});
	}
	this.OK = function()
	{
		
		
	}
	this.Cancel = function()
	{
	
		
		for(var i = 0; i < this.sourceNodeIDs.length; i++)
		{
			vwf.setProperty(this.sourceNodeIDs[i],'transform',this.sourceBackupTransform[this.sourceNodeIDs[i]]);
		}
	
	}
	this.updateDisplay = function()
	{
		var target = _Editor.findviewnode(this.targetNodeID);
		var tbounds = target.GetBoundingBox(true);
		var tcenter = this.tcenter.clone();
		
		var xFrom = $('#AlignToolGUI').find('#XFrom :checked').next().text();
		var xTo = $('#AlignToolGUI').find('#XTo :checked').next().text();
		
		var yFrom = $('#AlignToolGUI').find('#YFrom :checked').next().text();
		var yTo = $('#AlignToolGUI').find('#YTo :checked').next().text();
		
		var zFrom = $('#AlignToolGUI').find('#ZFrom :checked').next().text();
		var zTo = $('#AlignToolGUI').find('#ZTo :checked').next().text();
		
		var alignX = $( "#AlignX" ).next().attr('aria-pressed');
		var alignY = $( "#AlignY" ).next().attr('aria-pressed');
		var alignZ = $( "#AlignZ" ).next().attr('aria-pressed');
		
		for(var i = 0; i < this.sourceNodeIDs.length; i++)
		{
			var source = _Editor.findviewnode(this.sourceNodeIDs[i])
			var sbounds = source.GetBoundingBox(true);
			var scenter = this.scenter[i].clone();
			var spos = scenter.clone();
			
			if(alignX)
			{
				spos.x = tcenter.x
				if(xFrom == 'Center' && xTo == 'Max')
				{
					spos.x -= tbounds.min[0];
				}
				if(xFrom == 'Max' && xTo == 'Center')
				{
					spos.x += sbounds.min[0];
				}
				
				if(xFrom == 'Center' && xTo == 'Min')
				{
					spos.x -= tbounds.max[0];
				}
				if(xFrom == 'Min' && xTo == 'Center')
				{
					spos.x += sbounds.max[0];
				}
				
				if(xFrom == 'Min' && xTo == 'Max')
				{
					spos.x += sbounds.max[0];
					spos.x += tbounds.max[0];
				}
			
				if(xFrom == 'Max' && xTo == 'Min')
				{
					spos.x += sbounds.min[0];
					spos.x += tbounds.min[0];
				}	
				if(xFrom == 'Min' && xTo == 'Min')
				{
					spos.x += sbounds.max[0];
					spos.x += tbounds.min[0];
				}
				if(xFrom == 'Max' && xTo == 'Max')
				{
					spos.x += sbounds.min[0];
					spos.x += tbounds.max[0];
				}
			}
			
			if(alignY)
			{
				spos.y = tcenter.y;
				if(yFrom == 'Center' && yTo == 'Max')
				{
					spos.y -= tbounds.min[1];
				}
				if(yFrom == 'Max' && yTo == 'Center')
				{
					spos.y += sbounds.min[1];
				}
				
				if(yFrom == 'Center' && yTo == 'Min')
				{
					spos.y -= tbounds.max[1];
				}
				if(yFrom == 'Min' && yTo == 'Center')
				{
					spos.y += sbounds.max[1];
				}
				
				if(yFrom == 'Min' && yTo == 'Max')
				{
					spos.y += sbounds.max[1];
					spos.y += tbounds.max[1];
				}
			
				if(yFrom == 'Max' && yTo == 'Min')
				{
					spos.y += sbounds.min[1];
					spos.y += tbounds.min[1];
				}	
				if(yFrom == 'Min' && yTo == 'Min')
				{
					spos.y += sbounds.max[1];
					spos.y += tbounds.min[1];
				}
				if(yFrom == 'Max' && yTo == 'Max')
				{
					spos.y += sbounds.min[1];
					spos.y += tbounds.max[1];
				}
			}
			
			if(alignZ)
			{
				spos.z = tcenter.z;
				if(zFrom == 'Center' && zTo == 'Max')
				{
					spos.z -= tbounds.min[2];
				}
				if(zFrom == 'Max' && zTo == 'Center')
				{
					spos.z += sbounds.min[2];
				}
				
				if(zFrom == 'Center' && zTo == 'Min')
				{
					spos.z -= tbounds.max[2];
				}
				if(zFrom == 'Min' && zTo == 'Center')
				{
					spos.z += sbounds.max[2];
				}
				
				if(zFrom == 'Min' && zTo == 'Max')
				{
					spos.z += sbounds.max[2];
					spos.z += tbounds.max[2];
				}
			
				if(zFrom == 'Max' && zTo == 'Min')
				{
					spos.z += sbounds.min[2];
					spos.z += tbounds.min[2];
				}	
				if(zFrom == 'Min' && zTo == 'Min')
				{
					spos.z += sbounds.max[2];
					spos.z += tbounds.min[2];
				}
				if(zFrom == 'Max' && zTo == 'Max')
				{
					spos.z += sbounds.min[2];
					spos.z += tbounds.max[2];
				}
			}
	
			
			vwf_view.kernel.setProperty(this.sourceNodeIDs[i],'translation',[spos.x,spos.y,spos.z]);
		}
	}
	this.PickTarget = function()
	{	
		this.backcolor = $('#AlignToolGUI_PickTarget').css('background');
		$('#AlignToolGUI_PickTarget').css('background','lightyellow');
		this.pickMode = 'Pick';
		
		
	}
	this.show = function()
	{
		
		if($('#AlignToolGUI').length == 0)
		{
			this.buildGUI();
		}
		var count = _Editor.getSelectionCount();
		if(!count)
		{
			_Notifier.alert('You must select at least one object beforing activating the Align tool.');
			return;
		}
		this.sourceNodeIDs = [];
		this.scenter = [];
		this.sourceBackupTransform = {};
		for(var i = 0; i < count; i++)
		{
		
			this.sourceNodeIDs.push(_Editor.GetSelectedVWFNode(i).id);
			this.sourceBackupTransform[_Editor.GetSelectedVWFNode(i).id] = vwf.getProperty(_Editor.GetSelectedVWFNode(i).id,'transform');
			this.scenter.push(new THREE.Vector3().getPositionFromMatrix(_Editor.findviewnode(_Editor.GetSelectedVWFNode(i).id).matrixWorld));
		}
		
		
		$('#AlignToolGUI').dialog('open');
		
		$( "#AlignX" ).removeAttr('checked');
		$( "#AlignY" ).removeAttr('checked');
		$( "#AlignZ" ).removeAttr('checked');
		$('#AlignToolGUI_PickTarget').click();
		$('#AlignToolGUI_PickTargetID').text('No Target Selected');
		//_Editor.SelectObject();
		_Editor.addTool('AlignTool',this);
		_Editor.setActiveTool('AlignTool');
		_AlignTool.open =true;
		
	}
	this.hide = function()
	{
		_Editor.setActiveTool('Gizmo');
		if(this.backcolor)
			$('#AlignToolGUI_PickTarget').css('background',this.backcolor);
		this.pickMode = "";	
	}
	this.isOpen = function()
	{
		return $('#AlignToolGUI').is(':visible');
	}
	this.click = function(e)
	{
		if(this.pickMode == 'Pick')
		{
		
			var c = _Editor.findcamera();
			var campos = [c.position.x,c.position.y,c.position.z];
			var pick = _Editor.ThreeJSPick(campos,_Editor.GetWorldPickRay(e),{filter:function(o){ return o.isAvatar != true;}});
			if(pick.object)
				this.protoBounds = pick.object.getBoundingBox();
			var vwfnode;
			
			while(pick && pick.object && !pick.object.vwfID)
				pick.object = pick.object.parent;
			if(pick && pick.object)
				vwfnode = pick.object.vwfID;
			
			console.log(vwfnode);
			$('#AlignToolGUI_PickTargetID').text(vwfnode);
			if(!vwfnode)
			{
				console.log('No node selected');
				return;
			}
			
			//put everything back where it was, to allow picking new target from list of source obhects
			this.Cancel();
			
			this.targetNodeID = vwfnode;
			
			var target = _Editor.findviewnode(this.targetNodeID);
			
			this.tcenter = new THREE.Vector3().getPositionFromMatrix(target.matrixWorld);
			
			
			this.updateDisplay();
			this.pickMode = '';
			$('#AlignToolGUI_PickTarget').css('background',this.backcolor);
		}
	}
}
_AlignTool = new AlignTool();
_AlignTool.hide();