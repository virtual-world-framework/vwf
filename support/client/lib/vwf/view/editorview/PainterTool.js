function PainterTool()
{
	
	$('#sidepanel').append("<div id='PainterToolGUI' class='ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active' style='padding-bottom:5px;overflow:hidden;height:auto'></div>");
	
	$('#PainterToolGUI').append("<div id='PainterToolGUItitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Painter Tool</span></div>");
	$('#PainterToolGUI').append("<div id='PainterToolGUIBuild'></div>");
	$('#PainterToolGUI').append("<div id='PainterToolGUIDelete'></div>");
	$('#PainterToolGUI').append("<div id='PainterToolGUIStop'></div>");
	$('#PainterToolGUI').append("<div id='PainterToolGUIPick'></div>");
	$('#PainterToolGUI').append("<input type='checkbox' id='PainterToolGUIActivteTool'></input><label for='PainterToolGUIActivteTool'/>");
	$('#PainterToolGUI').append("<div id='PainterToolGUIPick'></div>");

	$('#PainterToolGUIActivteTool').button({label:'Active'});
	$('#PainterToolGUIPick').button({label:'Pick Object'});
	$('#PainterToolGUIBuild').button({label:'Start Build'});
	$('#PainterToolGUIDelete').button({label:'Start Delete'});
	$('#PainterToolGUIStop').button({label:'Stop'});
	$('#PainterToolGUItitle').append('<a id="paintertoolclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
	$('#PainterToolGUItitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/inventory.png" />');	
	$('#PainterToolGUI').css('border-bottom','5px solid #444444')
	$('#PainterToolGUI').css('border-left','2px solid #444444')
		
	$('#paintertoolclose').click(function(){_PainterTool.hide()});
	
	$('#PainterToolGUIActivteTool').change(function(e){
		
		
		var checked = ($(this).next().attr('aria-pressed'));
		if(checked == 'true')
		{
			_Editor.addTool('Painter',_PainterTool);
			_Editor.setActiveTool('Painter');
		}
		else
		{
			
			_Editor.setActiveTool('Gizmo');
		}
	})
	
	$('#PainterToolGUIPick').click(function(){
		_PainterTool.currentClickCallback = _PainterTool.selectObject;
	})
	
	$('#PainterToolGUIPick').click(function(){
		_PainterTool.currentClickCallback = _PainterTool.selectObject;
	})
	
	$('#PainterToolGUIBuild').click(function(){
		if(!_PainterTool.nodeProto)
		{
				_Notifier.alert('there is no source object selected');
		}
		_PainterTool.currentClickCallback = _PainterTool.createObject;
		
	});
	$('#PainterToolGUIDelete').click(function(){
		_PainterTool.currentClickCallback = _PainterTool.deleteObject;
	});
	$('#PainterToolGUIStop').click(function(){
		_PainterTool.currentClickCallback = null;
	});
	
	$(document).bind('sidePanelClosed',function()
	{
	
		_Editor.setActiveTool('Gizmo');
		var checked = ($('#PainterToolGUIActivteTool').next().attr('aria-pressed'));
		if(checked == 'true')
			$('#PainterToolGUIActivteTool').click();
	});
	
	this.deleteObject = function(e)
	{
		if(e.button != 0) return;
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
		
			
		_Editor.SelectObject(vwfnode);
		_Editor.DeleteSelection();
	}
	this.createObject = function(e)
	{
		
		if(e.button != 0) return;
		
		var c = _Editor.findcamera();
		var campos = [c.position.x,c.position.y,c.position.z];
		var pick = _Editor.ThreeJSPick(campos,_Editor.GetWorldPickRay(e),{filter:function(o){ return o.isAvatar != true;}});
		
		if(pick && pick.object)
		{
			if(pick.object.name == 'GroundPlane')
				return;
				
			var t = _DataManager.getCleanNodePrototype(this.nodeProto);
			if(!t.properties)
				t.properties = {};
			t.properties.owner = _UserManager.GetCurrentUserName();
			var pos = new THREE.Vector3();
			pos.getPositionFromMatrix(pick.object.matrixWorld);
			var bounds = pick.object.getBoundingBox();
			var norm = pick.norm;
			
			
			if(norm[0] == -1)
			{
				pos.x += bounds.min.x;
				pos.x += (this.protoBounds.min.x);
			}
			if(norm[0] == 1)
			{
				pos.x += bounds.max.x;
				pos.x += (this.protoBounds.max.x);
			}
			
			if(norm[1] == -1)
			{
				pos.y += bounds.min.y;
				pos.y += (this.protoBounds.min.y);
			}
			if(norm[1] == 1)
			{
				pos.y += bounds.max.y;
				pos.y += (this.protoBounds.max.y);
			}
			
			if(norm[2] == -1)
			{
				pos.z += bounds.min.z;
				pos.z += (this.protoBounds.min.z);
			}
			if(norm[2] == 1)
			{
				pos.z += bounds.max.z;
				pos.z += (this.protoBounds.max.z);
			}
			
			t.properties.transform[12] = pos.x;
			t.properties.transform[13] = pos.y;
			t.properties.transform[14] = pos.z;
		
			t.properties.DisplayName = _Editor.GetUniqueName(t.properties.DisplayName);
			
			_Editor.createChild('index-vwf',GUID(),t,null,null); 
			
		}
	}
	this.selectObject = function(e)
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
		if(!vwfnode)
			_Notifier.alert('No node selected');
			
		this.nodeProto = _DataManager.getCleanNodePrototype(vwfnode);
		
		this.currentClickCallback = null;
	}
	this.mousedown = function(e)
	{
		
	}
	this.mouseup = function(e)
	{
		
	}
	this.click = function(e)
	{
		if(this.currentClickCallback)
			this.currentClickCallback(e)
	}
	this.mousemove = function(e)
	{
		
	}
	this.mousewheel = function(e)
	{
		
	}
	this.keyup = function(e)
	{
		
	}
	this.keydown = function(e)
	{
		
	}
	
	
	this.show = function()
	{
		//$('#PainterToolGUI').dialog('open');
		$('#PainterToolGUI').prependTo($('#PainterToolGUI').parent());
		$('#PainterToolGUI').show('blind',function()
		{
			if($('#sidepanel').data('jsp'))
					$('#sidepanel').data('jsp').reinitialise();
		});
		
		//$('#PainterToolGUI').dialog('option','position',[1282,40]);
		
		_Editor.SelectObject();
		
		
		
		showSidePanel();
		_PainterTool.open =true;
		
	}
	
	this.hide = function()
	{
		//$('#PainterToolGUI').dialog('close');
		$('#PainterToolGUI').hide('blind',function(){
		
		if($('#sidepanel').data('jsp'))
					$('#sidepanel').data('jsp').reinitialise();
		if(!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible'))
				hideSidePanel();});
		
		var checked = ($('#PainterToolGUIActivteTool').next().attr('aria-pressed'));
		if(checked == 'true')
			$('#PainterToolGUIActivteTool').click();
			
	}
	this.isOpen = function()
	{
		//return $("#PainterToolGUI").dialog( "isOpen" );
		return $('#PainterToolGUI').is(':visible');
	}
}
_PainterTool = new PainterTool();
_PainterTool.hide();