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
	$('#PainterToolGUITexture').attr('src','./vwfDataManager.svc/texture?UID=checker.jpg');
	$('#paintertoolclose').click(function(){_PainterTool.hide()});
	
	this.display = new THREE.Mesh(new THREE.CubeGeometry(1,1,1),new THREE.MeshLambertMaterial());
	
	this.display.InvisibleToCPUPick = true;
	this.display.material.wireframe = false;
	this.display.material.opacity = .25;
	this.display.material.transparent = true;
	this.lastNames = [];
	this.display.material.map = _SceneManager.getTexture('./vwfDataManager.svc/texture?UID=checker.jpg');
	$('#PainterToolGUIChooseBlock').click(function()
	{
		_MapBrowser.setTexturePickedCallback(function(e)
		{
			this.nodeProto.properties.materialDef.layers[0].src = e;
			$('#PainterToolGUITexture').attr('src',e);
			this.display.material.map = _SceneManager.getTexture(e);
			_MapBrowser.hide();
		}.bind(this));
		_MapBrowser.show();
	
	}.bind(this));
	$('#PainterToolGUIActivteTool').change(function(e){
		
		var checked = ($(this).next().attr('aria-pressed'));
		if(checked == 'true')
		{
			$(this).next().children().css('background-color','red');
			_Editor.addTool('Painter',_PainterTool);
			_Editor.setActiveTool('Painter');
			_dScene.add(_PainterTool.display);
			_Editor.setSelectMode('None');
		}
		else
		{
			$(this).next().children().css('background-color','');
			_Editor.setActiveTool('Gizmo');
			_dScene.remove(_PainterTool.display);
			_Editor.setSelectMode('Pick');
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
						"src": "./vwfDataManager.svc/texture?UID=checker.jpg"
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
		
		if(_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(),vwfnode) == 0)
		{
			return;
		}
		_UndoManager.recordDelete(vwfnode);
		vwf_view.kernel.deleteNode(vwfnode);

		//_Editor.SelectObject(vwfnode);
		//_Editor.DeleteSelection();
	}
	this.createObject = function(e)
	{
		
		if(e.button != 0) return;
		
		
			var t = _DataManager.getCleanNodePrototype(this.nodeProto);
			if(!t.properties)
				t.properties = {};
			t.properties.owner = _UserManager.GetCurrentUserName();
		
			
			t.properties.transform[12] = this.display.position.x;
			t.properties.transform[13] = this.display.position.y;
			t.properties.transform[14] = this.display.position.z;

			t.properties.translation[0] = this.display.position.x;
			t.properties.translation[1] = this.display.position.y;
			t.properties.translation[2] = this.display.position.z;
		
			t.properties.DisplayName = _Editor.GetUniqueName(t.properties.DisplayName);
			
			var lastName = GUID();
			this.lastNames.push(lastName);
			
			_Editor.createChild('index-vwf',lastName,t,null,null); 
			
		//this.mousemove(e);
	}
	this.mousedown = function(e)
	{
		if(e.button != 0) return;
		
		this.mouseisdown = true;
	}
	this.mouseup = function(e)
	{
		if(e.button != 0) return;
		this.mouseisdown = false;
		
	}
	this.click = function(e)
	{
		if(this.currentClickCallback && this.lastNames.length == 0)
			this.currentClickCallback(e)
		this.lastNames = [];	
	}
	this.mousemove = function(e)
	{
		
		var c = _Editor.findcamera();
		var campos = [c.position.x,c.position.y,c.position.z];
		var pick = _Editor.ThreeJSPick(campos,_Editor.GetWorldPickRay(e),{filter:function(o){ return o.isAvatar != true;}});
		
		
		if(pick && pick.object)
		{
			

			var pos = new THREE.Vector3();
			
			
			pos.setFromMatrixPosition(pick.object.matrixWorld);
			
			var bounds = pick.object.getBoundingBox();
			var norm = pick.norm;
			
			if(_PainterTool.currentClickCallback != _PainterTool.deleteObject)
			{
				if(norm[0] == -1)
				{
					pos.x += bounds.min[0];
					pos.x += (this.protoBounds.min.x);
				}
				if(norm[0] == 1)
				{
					pos.x += bounds.max[0];
					pos.x += (this.protoBounds.max.x);
				}
				
				if(norm[1] == -1)
				{
					pos.y += bounds.min[1];
					pos.y += (this.protoBounds.min.y);
				}
				if(norm[1] == 1)
				{
					pos.y += bounds.max[1];
					pos.y += (this.protoBounds.max.y);
				}
				
				if(norm[2] == -1)
				{
					pos.z += bounds.min[2];
					pos.z += (this.protoBounds.min.z);
				}
				if(norm[2] == 1)
				{
					pos.z += bounds.max[2];
					pos.z += (this.protoBounds.max.z);
				}
			}else
			{
			
			}
			
			if(pick.object.name == 'GroundPlane' || pick.object.name == 'SkyCube')
			{
				
				var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];
				var ray;
				ray = _Editor.GetWorldPickRay(e);
				var dxy2 = _Editor.intersectLinePlane(ray, campos, [0, 0, 0], [0, 0, 1]);
				var npos = MATH.addVec3(campos, MATH.scaleVec3(ray, dxy2));
				pos.x = Math.round(npos[0]);
				pos.y = Math.round(npos[1]);
				pos.z = Math.round(npos[2])+.5;
				
			}
			
			this.display.position = pos.clone();
			this.display.updateMatrixWorld();
			
			if(false&&this.mouseisdown == true && this.currentClickCallback)
			{
				if(pick.object && pick.object.parent && pick.object.parent.parent)
				{

					if(this.lastNames.indexOf(pick.object.parent.parent.name) == -1)
						this.currentClickCallback(e);
				}else
				{
					this.currentClickCallback(e);
				}
			}
		}else
		{
			
		}
		
		
		
		
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