function PainterTool()
{
	
	$('#sidepanel').append("<div id='PainterToolGUI' class='ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active' style='padding-bottom:5px;overflow:hidden;height:auto'></div>");
	
	$('#PainterToolGUI').append("<div id='PainterToolGUItitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Painter Tool</span></div>");
	$('#PainterToolGUI').append("<input type='checkbox' id='PainterToolGUIActivteTool'></input><label for='PainterToolGUIActivteTool' style = 'display:block'/>");
	$('#PainterToolGUI').append("<div id='PainterToolGUIBuild' style = 'display:block'></div>");
	$('#PainterToolGUI').append("<div id='PainterToolGUIDelete'style = 'display:block'></div>");
	
	$('#PainterToolGUI').append("<div id='PainterToolGUIChooseBlock'style = 'display:block'></div>");
	
	
	$('#PainterToolGUI').append("<img id='PainterToolGUITexture' style='width:150px;height:150px;margin-left: auto;border: 3px solid black;margin-top: 10px;margin-right: auto;text-align: center;display: block;' style = 'display:block'></img>");

	$('#PainterToolGUIActivteTool').button({label:'Active'});
	$('#PainterToolGUIChooseBlock').button({label:'Pick Texture'});
	$('#PainterToolGUIBuild').button({label:'Build'});
	$('#PainterToolGUIDelete').button({label:'Delete'});
	
	$('#PainterToolGUItitle').append('<a id="paintertoolclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
	$('#PainterToolGUItitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/inventory.png" />');	
	$('#PainterToolGUI').css('border-bottom','5px solid #444444')
	$('#PainterToolGUI').css('border-left','2px solid #444444')
		
	$('#paintertoolclose').click(function(){_PainterTool.hide()});
	
	$('#PainterToolGUIChooseBlock').click(function()
	{
		_MapBrowser.setTexturePickedCallback(function(e)
		{
			this.nodeProto.properties.materialDef.layers[0].src = e;
			$('#PainterToolGUITexture').attr('src',e);
			
			_MapBrowser.hide();
		}.bind(this));
		_MapBrowser.show();
	
	}.bind(this));
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
	
	$(document).bind('sidePanelClosed',function()
	{
	
		_Editor.setActiveTool('Gizmo');
		var checked = ($('#PainterToolGUIActivteTool').next().attr('aria-pressed'));
		if(checked == 'true')
			$('#PainterToolGUIActivteTool').click();
	});
	
	
	
	this.nodeProto = {
		"extends": "box2.vwf",
		"source": "vwf/model/threejs/box.js",
		"type": "subDriver/threejs",
		"properties": {
			"size": [
				1,
				1,
				1
			],
			"translation": [
				-6.199999809265137,
				7,
				1.2010000944137573
			],
			"scale": [
				1,
				1,
				1
			],
			"rotation": [
				1,
				0,
				0,
				0
			],
			"isStatic":"true",
			"owner": "Rob",
			"texture": "checker.jpg",
			"type": "Primitive",
			"tempid": "",
			"DisplayName": "box1",
			"transform": [
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				-6.199999809265137,
				7,
				1.2010000944137573,
				1
			],
			"quaternion": [
				0,
				0,
				0,
				1
			],
			"materialDef": {
				"shininess": 15,
				"alpha": 1,
				"ambient": {
					"r": 1,
					"g": 1,
					"b": 1
				},
				"color": {
					"r": 1,
					"g": 1,
					"b": 1,
					"a": 1
				},
				"emit": {
					"r": 0,
					"g": 0,
					"b": 0
				},
				"reflect": 0.8,
				"shadeless": false,
				"shadow": true,
				"specularColor": {
					"r": 0.5773502691896258,
					"g": 0.5773502691896258,
					"b": 0.5773502691896258
				},
				"specularLevel": 1,
				"layers": [
					{
						"alpha": .48,
						"blendMode": 0,
						"mapInput": 0,
						"mapTo": 1,
						"offsetx": 0,
						"offsety": 0,
						"rot": 0,
						"scalex": 1,
						"scaley": 1,
						"src": "/adl/sandbox/zqDBa4NK7n8pfREs//vwfDataManager.svc/texture?UID=grass.jpg"
					}
				]
			}
		}
	}
	
	
	this.protoBounds = {min:new THREE.Vector3(-.5,-.5,-.5),max:new THREE.Vector3(.5,.5,.5)};
	
	
	
	
	
	
	
	
	
	
	this.deleteObject = function(e)
	{
		if(e.button != 0) return;
		var c = _Editor.findcamera();
		var campos = [c.position.x,c.position.y,c.position.z];
		var pick = _Editor.ThreeJSPick(campos,_Editor.GetWorldPickRay(e),{filter:function(o){ return o.isAvatar != true;}});
		
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