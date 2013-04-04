"use strict";

define( [ "module", "version", "vwf/view" ], function( module, version, view ) {

  

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {

		 
		 $(document.head).append('<link rel="stylesheet" type="text/css" href="vwf/view/editorview/ddsmoothmenu.css" />');
			$(document.head).append('<link rel="stylesheet" type="text/css" href="vwf/view/editorview/ddsmoothmenu-v.css" />')
			$(document.head).append('<link rel="stylesheet" type="text/css" href="vwf/view/editorview/editorview.css" />')
			$(document.body).append($.get('vwf/view/editorview/menus.html',{async:false,datatype:'text'}).responseText);
          
		  
		  if(!window._EditorInitialized)
	      {
			   
					   jQuery.extend({
					  parseQuerystring: function(){
						var nvpair = {};
						var qs = window.location.search.replace('?', '');
						var pairs = qs.split('&');
						$.each(pairs, function(i, v){
						  var pair = v.split('=');
						  nvpair[pair[0]] = pair[1];
						});
						return nvpair;
					  }
					});
			
					if($.parseQuerystring().Edit != 'false')
					{
						window._EditorInitialized = true;
						console.log('initialize Index-vwf');
						var data = $.ajax('vwf/view/editorview/menus.html',{async:false,dataType:'html'}).responseText;
						$(document.body).append(data);
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/ddsmoothmenu.js"></script>');
						
						
						
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/Editor.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/MaterialEditor.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/PrimitiveEditor.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/Notifier.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/UserManager.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/DataManager.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/ScriptEditor.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/_3DRIntegration.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/InventoryManager.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/GlobalInventoryManager.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/HeirarchyManager.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/Help.js"></script>');
						
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/jquery.qtip-1.0.0-rc3.min.js"></script>');
						$(document.head).append('<script type="text/javascript" src="http://crypto-js.googlecode.com/svn/tags/3.0.2/build/rollups/sha256.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/jquery.ui.touch-punch.min.js"></script>');
						
						
					 //  $(document).ready(function(){
						
					 //	});
				   
					}
		   }
		  
			
		  
        },
        
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {
           
			
			
			   
			 
		   
		   
        },
        
		initializedNode: function (nodeID,childID)
		{
			if($.parseQuerystring().Edit != 'false' && childID == 'index-vwf')
			{
				_Editor.initialize();
				InitializeEditor();
			}
		   if(window._Editor && childID != 'index-vwf')
		   {
				if(window._Editor.createNodeCallback != null)
				{
					window._Editor.CallCreateNodeCallback(childID);
				}
		   }
		
		},
        createdProperty: function (nodeID, propertyName, propertyValue) {

        },
        
        initializedProperty: function (nodeID, propertyName, propertyValue) {
			
        },
        
        deletedNode: function (nodeID) {
         
		
			if(window._Editor && _Editor.SelectedVWFID == nodeID )
			{
				_Editor.SelectObject(null);
			}
		 
        },

        satProperty: function (nodeID, propertyName, propertyValue) {
			if(window._Editor && _Editor.isSelected(nodeID) && propertyName == 'transform')
			{
				
				_Editor.updateBoundsTransform(nodeID);
			
				_Editor.waitingForSet.splice(_Editor.waitingForSet.indexOf(nodeID),1);
				if(_Editor.waitingForSet.length == 0)
				{
					_Editor.updateGizmoLocation();
					_Editor.updateGizmoSize();
					_Editor.updateGizmoOrientation(false);
				}
			}
        },
        
        createdMethod: function( nodeID, methodName, methodParameters, methodBody ){
           
        },

        calledMethod: function( nodeID, methodName, methodParameters ) {

        },

        createdEvent: function( nodeID, eventName, eventParameters ) {
          
        },

        firedEvent: function ( nodeID, eventName, eventParameters ) {

        },

        executed: function( nodeID, scriptText, scriptType ) {

        },

    } );
	

	
} );


	
	function InitializeEditor(){

		document._UserManager = _UserManager;
		//hook up the editor object
		$('#vwf-root').mousedown(function(e){_Editor.mousedown(e)});
		
		$('#vwf-root').mouseup(function(e){_Editor.mouseup(e)});
		$('#vwf-root').click(function(e){_Editor.click(e)});
		$('#index-vwf').mouseleave(function(e){_Editor.mouseleave(e)});
		$('#vwf-root').mousemove(function(e){_Editor.mousemove(e)});
		$('#index-vwf').attr('tabindex',0);
		$('#index-vwf').on('touchstart',function(e){
			e.preventDefault();
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			_Editor.mousedown(touch)
		});
		
		// $('#index-vwf')[0].requestPointerLock = $('#index-vwf')[0].requestPointerLock ||
			     // $('#index-vwf')[0].mozRequestPointerLock ||
			     // $('#index-vwf')[0].webkitRequestPointerLock;
		

		//Ask the browser to release the pointer
		// document.exitPointerLock = document.exitPointerLock ||
					   // document.mozExitPointerLock ||
					   // document.webkitExitPointerLock;
		
		
		$('#index-vwf').on('touchmove',function(e){
		e.preventDefault();
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			_Editor.mousemove(touch)
		});
		$('#index-vwf').on('touchend',function(e){
		e.preventDefault();
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			_Editor.mouseup(touch)
		});
		$('#vwf-root').keydown(function(e){
			
			try{
			_Editor.keydown(e)
			if(e.keyCode == 32 && e.shiftKey)
				focusSelected();
			}catch(e)
			{
				
			}
		});
		
		
		
		
		
		$('#vwf-root').keyup(function(e){

			_Editor.keyup(e)
			
		});
		$('#vwf-root').css('overflow','hidden');
		$(document.body).css('font-size','10px');
		$('#tabs').css('z-index','101');
		$('#AvatarChoice').buttonset();
		
		$('#vwf-root').attr('tabindex','0');
		vwf.logger.level = 6;
		$('#ChatWindow').dialog({ position:['left','top'],width:300,height:400,title: "Chat Window",buttons: { "Close": function() { $(this).dialog("close"); },"Send": function() { SendChatMessage(); } },autoOpen:false});

		 
		if(document.Players)
		{
			for(var i = 0; i< document.Players.length; i++)
			{
				_UserManager.PlayerCreated(document.Players[i]);
			}
		}
		
		ddsmoothmenu.init({
			mainmenuid: "smoothmenu1", //menu DIV id
			orientation: 'h', //Horizontal or vertical menu: Set to "h" or "v"
			classname: 'ddsmoothmenu', //class added to menu's outer DIV
			//customtheme: ["#1c5a80", "#18374a"],
			contentsource: "markup" //"markup" or ["container_id", "path_to_menu_file"]
		});
		
		
		//make the menu items disappear when you click one
		//$(".ddsmoothmenu").find('li').click(function(){$(".ddsmoothmenu").find('li').trigger('mouseleave');});
		
		$('#MenuLogOut').attr('disabled','true');
		$('#MenuLogIn').click(function(e){
			
			if($('#MenuLogIn').attr('disabled') == 'disabled')
				return;
				
			_UserManager.showLogin();
		});
		$('#MenuLogOut').click(function(e){
			
			if($('#MenuLogOut').attr('disabled') == 'disabled')
				return;
			_UserManager.Logout();	
			
		});
		$('#MenuSelectPick').click(function(e){
			_Editor.SetSelectMode('Pick');
		});
		$('#MenuSelectNone').click(function(e){
			_Editor.SelectObject(null);
			_Editor.SetSelectMode('None');
		});
		$('#MenuMove').click(function(e){
			_Editor.SetGizmoMode(_Editor.Move);
			$('#MenuRotateicon').css('background',"");
			$('#MenuScaleicon').css('background',"");
			$('#MenuMoveicon').css('background',"#9999FF");
		});
		$('#MenuRotate').click(function(e){
			_Editor.SetGizmoMode(_Editor.Rotate);
			$('#MenuRotateicon').css('background',"#9999FF");
			$('#MenuScaleicon').css('background',"");
			$('#MenuMoveicon').css('background',"");
		});
		$('#MenuScale').click(function(e){
			_Editor.SetGizmoMode(_Editor.Scale);
			$('#MenuRotateicon').css('background',"");
			$('#MenuScaleicon').css('background',"#9999FF");
			$('#MenuMoveicon').css('background',"");
		});
		$('#MenuMulti').click(function(e){
			_Editor.SetGizmoMode(_Editor.Multi);
		});
		$('#MenuSaveCopy').click(function(e){
			_InventoryManager.Take();
		});
		
		
		$('#MenuShare').click(function(e){
			$('#ShareWithDialog').dialog('open');
		});
		
		$('#MenuSetParent').click(function(e){
			_Editor.SetParent();
		});
		$('#MenuSelectScene').click(function(e){
			_Editor.SelectScene();
		});
		$('#MenuRemoveParent').click(function(e){
			_Editor.RemoveParent();
		});
		
		$('#MenuSelectParent').click(function(e){
			_Editor.SelectParent();
		});
		$('#MenuHierarchyManager').click(function(e){
			HierarchyManager.show();
		});
		
		$('#MenuLocal').click(function(e){
			_Editor.SetCoordSystem(_Editor.LocalCoords);
			if(_Editor.GetMoveGizmo())
				_Editor.updateGizmoOrientation(true);
		});
		$('#MenuWorld').click(function(e){
			_Editor.SetCoordSystem(_Editor.WorldCoords);
			if(_Editor.GetMoveGizmo())
				_Editor.updateGizmoOrientation(true);
		});
		$('#MenuDelete').click(function(e){
			_Editor.DeleteSelection();
		});
		$('#MenuPublish').click(function(e){
			_GlobalInventoryManager.Take();
		});
		$('#MenuChat').click(function(e){
			$('#ChatWindow').dialog('open');
		});
		$('#MenuUsers').click(function(e){
			
			$('#Players').prependTo($('#Players').parent());
			$('#Players').show('blind',function(){
			
			});
			
			showSidePanel();
		});
		$('#MenuModels').click(function(e){
			_ModelLibrary.show();
		});
		$('#MenuSnapLarge').click(function(e){
			_Editor.SetSnaps(.60,15 * 0.0174532925,5);
		});
		$('#MenuSnapMedium').click(function(e){
			_Editor.SetSnaps(.20,5 * 0.0174532925,2);
		});
		$('#MenuSnapSmall').click(function(e){
			_Editor.SetSnaps(.1,1 * 0.0174532925,.5);
		});
		$('#MenuSnapOff').click(function(e){
			_Editor.SetSnaps(.005,.01 * 0.0174532925,.001);
		});
	    $('#MenuMaterialEditor').click(function(e){
			_MaterialEditor.show();
		});
		$('#MenuScriptEditor').click(function(e){
			_ScriptEditor.show();
		});
		$('#MenuInventory').click(function(e){
			_InventoryManager.show();
		});
		$('#MenuObjectProperties').click(function(e){
			_PrimitiveEditor.show();
		});
		$('#MenuGlobalInventory').click(function(e){
			_GlobalInventoryManager.show();
		});
		
		
		$('#MenuLatencyTest').click(function(e){
			var e = {};
			e.time = new Date();
			vwf_view.kernel.callMethod('index-vwf','latencyTest',[e]);
		});
		
		$('#MenuCopy').click(function(e){
			_Editor.Copy();
		});
		$('#MenuPaste').click(function(e){
			_Editor.Paste();
		});
		$('#MenuDuplicate').click(function(e){
			_Editor.Duplicate();
		});
		$('#MenuCreateTaper').click(function(e){
			_Editor.CreateModifier('taper',document.PlayerNumber);
		});
		$('#MenuCreateBend').click(function(e){
			_Editor.CreateModifier('bend',document.PlayerNumber);
		});
		$('#MenuCreateTwist').click(function(e){
			_Editor.CreateModifier('twist',document.PlayerNumber);
		});
		$('#MenuCreateUVMap').click(function(e){
			_Editor.CreateModifier('uvmap',document.PlayerNumber);
		});
		$('#MenuCreatePerlinNoise').click(function(e){
			_Editor.CreateModifier('perlinnoise',document.PlayerNumber);
		});
		$('#MenuCreateSimplexNoise').click(function(e){
			_Editor.CreateModifier('simplexnoise',document.PlayerNumber);
		});
		$('#MenuCreateOffset').click(function(e){
			_Editor.CreateModifier('offset',document.PlayerNumber);
		});
		$('#MenuCreateStretch').click(function(e){
			_Editor.CreateModifier('stretch',document.PlayerNumber);
		});
		$('#MenuCreateTangents').click(function(e){
			_Editor.CreateModifier('tangents',document.PlayerNumber);
		});
		$('#MenuHelpBrowse').click(function(e){
			window.open('../vwf/view/editorview/help/help.html','_blank');
		});
		$('#MenuHelpAbout').click(function(e){
			_Notifier.alert('VWF Sandbox version 0.9 <br/> VWF 0.6 <br/>Rob Chadwick, ADL <br/> robert.chadwick.ctr@adlnet.gov<br/> texture attribution: <br/>http://opengameart.org/content/45-high-res-metal-and-rust-texture-photos CC-BY-3.0<br/>http://opengameart.org/content/golgotha-textures  public domain<br/>http://opengameart.org/content/p0sss-texture-pack-1  CC-BY-3.0<br/>http://opengameart.org/content/117-stone-wall-tilable-textures-in-8-themes    GPL2<br/>http://opengameart.org/content/wall-grass-rock-stone-wood-and-dirt-480 public domain<br/>http://opengameart.org/content/29-grounds-and-walls-and-water-1024x1024  CC-By-SA<br/>http://opengameart.org/content/filth-texture-set  GPL2');
		});
		
		
		$('#MenuSave').click(function(e){
			_DataManager.save();
		});
		$('#MenuSaveAs').click(function(e){
			_DataManager.saveAs();
		});
		$('#MenuLoad').click(function(e){
			_DataManager.load();
		});
		$('#MenuChangeInstance').click(function(e){
			_DataManager.chooseInstance();
		});
		
		$('#ChatInput').keypress(function(e){
			e.stopPropagation();
			ChatKeypress(e);
		});
		$('#ChatInput').keydown(function(e){
			e.stopPropagation();
			
		});
		
		
		$('#MenuCreateBlankBehavior').click(function(e){
			_Editor.AddBlankBehavior();
		});
		
		
		$('#MenuViewGlyphs').click(function(e){
			if($('#glyphOverlay').is(':visible'))
			{
				$('#glyphOverlay').hide();
				_Notifier.notify('Glyphs hidden');
			}else
			{
				$('#glyphOverlay').show();
				_Notifier.notify('Glyphs displayed');
			}
		});
		
		$('#MenuViewStats').click(function(e){
			MATH.Stats.showDisplay();
		});
		$('#MenuViewShadows').click(function(e){
			var val = !_Editor.findscene().children[1].castShadows;
			_Editor.findscene().children[1].setCastShadows(val);
		});
		$('#MenuViewBatchingForce').click(function(e){
			_Editor.findscene().buildBatches(true);
		});
		
		$('#MenuViewStaticBatching').click(function(e){
			_Editor.findscene().staticBatchingEnabled = !_Editor.findscene().staticBatchingEnabled;
			if(!_Editor.findscene().staticBatchingEnabled)
			{
				_Editor.findscene().destroyBatches();
				_Notifier.notify('static batching disabled');
			}else
			{
				_Notifier.notify('static batching enabled');
			}
		});
		
		$('#MenuGroup').click(function(e){
			_Editor.GroupSelection();
		});
		
		$('#MenuUngroup').click(function(e){
			_Editor.UngroupSelection();
		});
		
		$('#MenuOpenGroup').click(function(e){
			_Editor.OpenGroup();
		});
		
		$('#MenuCloseGroup').click(function(e){
			_Editor.CloseGroup();
		});
		
		
		
		$('#MenuViewToggleAO').click(function(e){
			if(_Editor.findscene().getFilter2d())
			{
				_Editor.findscene().setFilter2d();
			}else
			{
				var ao = new MATH.FilterAO();
				_Editor.findscene().setFilter2d(ao)
			}
		});
		
		
		function focusSelected()
		{
			if(_Editor.GetSelectedVWFNode())
			 {
				if(_Editor.GetSelectedVWFNode())
				 {
					var t = 	_Editor.GetMoveGizmo().parent.matrixWorld.getPosition();
					var gizpos = [t.x,t.y,t.z];

					var box = _Editor.findviewnode(_Editor.GetSelectedVWFNode().id).getBoundingBox();
					var dist = MATH.distanceVec3([box.max.x,box.max.y,box.max.z],[box.min.x,box.min.y,box.min.z]);
					vwf.models[0].model.nodes['index-vwf'].orbitPoint(gizpos);
					vwf.models[0].model.nodes['index-vwf'].zoom = dist * 2;
					vwf.models[0].model.nodes['index-vwf'].updateCamera();
				 }
			 }
		}
		$('#MenuFocusSelected').click(function(e){
			focusSelected();
		});
		$('#MenuCameraOrbit').click(function(e){
			
				clearCameraModeIcons();
				$('#MenuCameraOrbiticon').css('background','#9999FF');
				var campos = [_Editor.findcamera().position.x,_Editor.findcamera().position.y,_Editor.findcamera().position.z];
				var ray = _Editor.GetCameraCenterRay();
				var dxy = _Editor.intersectLinePlane(ray,campos,[0,0,0],_Editor.WorldZ);
				var newintersectxy = MATH.addVec3(campos,MATH.scaleVec3(ray,dxy));
				vwf.models[0].model.nodes['index-vwf'].orbitPoint(newintersectxy);
				vwf.models[0].model.nodes['index-vwf'].updateCamera();
			 
		});
		
		
		
		// click events for touching sub menus
		$('#MenuViewBatching,#MenuParticles,#MenuLights,#MenuModifiers,#MenuGrouping,#MenuPrimitives,#MenuTransforms,#MenuSnaps,#MenuSelect').click(function(e){
			
			$(this).mouseenter();
		});
		
		$('#MenuCameraNavigate').click(function(e){
			clearCameraModeIcons();
			$('#MenuCameraNavigateicon').css('background','#9999FF');
			vwf.models[0].model.nodes['index-vwf'].setCameraMode('Orbit');
			vwf.models[0].model.nodes['index-vwf'].setCameraMode('Navigate');
			
		});
		$('#MenuCameraFree').click(function(e){
			clearCameraModeIcons();
			$('#MenuCameraFreeicon').css('background','#9999FF');
			vwf.models[0].model.nodes['index-vwf'].setCameraMode('Orbit');
			vwf.models[0].model.nodes['index-vwf'].setCameraMode('Free');
		});
		
		
		var pfx = ["webkit", "moz", "ms", "o", ""];
		function RunPrefixMethod(obj, method) {
			
			var p = 0, m, t;
			while (p < pfx.length && !obj[m]) {
				m = method;
				if (pfx[p] == "") {
					m = m.substr(0,1).toLowerCase() + m.substr(1);
				}
				m = pfx[p] + m;
				t = typeof obj[m];
				if (t != "undefined") {
					pfx = [pfx[p]];
					return (t == "function" ? obj[m]() : obj[m]);
				}
				p++;
			}

		}

		$('#MenuViewFullscreen').click(function(e){
			
				if (RunPrefixMethod(document, "FullScreen") || RunPrefixMethod(document, "IsFullScreen")) {
					RunPrefixMethod(document, "CancelFullScreen");
				}
				else {
					RunPrefixMethod(document.body, "RequestFullScreen");
				}
		});		





		$('#MenuCamera3RDPerson').click(function(e){
			
			if(_UserManager.GetCurrentUserName())
			{
				clearCameraModeIcons();
				$('#MenuCamera3RDPersonicon').css('background','#9999FF');
				vwf.models[0].model.nodes['index-vwf'].followObject(vwf.models[0].model.nodes[_UserManager.GetCurrentUserID()]);
				vwf.models[0].model.nodes['index-vwf'].setCameraMode('3RDPerson');
			}else
			{
				_Notifier.alert('First person mode is not available when you are not logged in.');
			}
		});
		
		$('#MenuCreateParticlesBasic').click(function(e){
			_Editor.createParticleSystem('basic',_Editor.GetInsertPoint(),document.PlayerNumber);
		});
		
		$('#MenuDeleteInstance').click(function(e){
			_DataManager.DeleteInstance();
		});
		$('#MenuCloneInstance').click(function(e){
			_DataManager.CloneInstance();
		});
		
		
		$('#MenuCreateLightPoint').click(function(e){
			_Editor.createLight('point',_Editor.GetInsertPoint(),document.PlayerNumber);
		});
		
		$('#MenuCreateLightSpot').click(function(e){
			_Editor.createLight('spot',_Editor.GetInsertPoint(),document.PlayerNumber);
		});
		$('#MenuCreateLightDirectional').click(function(e){
			_Editor.createLight('directional',_Editor.GetInsertPoint(),document.PlayerNumber);
		});
		$('#MenuCreateBox').click(function(e){
			
			_Editor.CreatePrim('box',_Editor.GetInsertPoint(),[1,1,1],'checker.jpg',document.PlayerNumber,'');
			
		});
		$('#MenuCreateSphere').click(function(e){
			
			_Editor.CreatePrim('sphere',_Editor.GetInsertPoint(),[.5,1,1],'checker.jpg',document.PlayerNumber,'');
			
		});
		$('#MenuCreatePlane').click(function(e){
			
			_Editor.CreatePrim('plane',_Editor.GetInsertPoint(),[1,1,5],'checker.jpg',document.PlayerNumber,'');
			
		});
		$('#MenuCreateCylinder').click(function(e){
			
			_Editor.CreatePrim('cylinder',_Editor.GetInsertPoint(),[1,.5,.5],'checker.jpg',document.PlayerNumber,'');
			
		});
		$('#MenuCreateCone').click(function(e){
			

			_Editor.CreatePrim('cone',_Editor.GetInsertPoint(),[.500,1,.5],'checker.jpg',document.PlayerNumber,'');
			
		});
		$('#MenuCreatePyramid').click(function(e){
			
			_Editor.CreatePrim('pyramid',_Editor.GetInsertPoint(),[1,1,1],'checker.jpg',document.PlayerNumber,'');
			
		});
		 
		
        if(_DataManager.getClientCount() == 1)
		{
			_DataManager.loadFromServer();
		}
	
		window.setTimeout(function(){_DataManager.saveTimer();},60000);		
		window.onbeforeunload = function(){
			if(_DataManager.getClientCount() == 1)
			{
				_DataManager.saveToServer();
				return "Are you sure you want to leave this VWF world?";
			}		
		};
		
		$(window).resize(function(){
			$('#smoothmenu1').css('top','0px');
			$('#smoothmenu1').css('left','0px');
			$('#toolbar').css('top',$('#smoothmenu1').height());
			//$('#toolbar').css('height','35px');
			$('#toolbar').css('left','0px');
			$('#statusbar').css('left','0px');
			if($('#sidepanel').offset().left + 5 < window.innerWidth)
				$('#index-vwf').css('width',window.innerWidth - $('#sidepanel').width() + 'px');
			else
				$('#index-vwf').css('width',window.innerWidth + 'px');
			
			$('#ScriptEditor').css('top',$(window).height() - $('#ScriptEditor').height()-$('#statusbar').height());
			//$('#ScriptEditor').css('height',	$(window).height() - $('#ScriptEditor').offset().top - $('#statusbar').height() + 'px');
			
			$('#ScriptEditor').css('width',$('#index-vwf').width());	
			if($('#ScriptEditor').attr('maximized'))
			{
				$('#ScriptEditor').css('top',$('#toolbar').offset().top + $('#toolbar').height() +'px');
				$('#ScriptEditor').css('height',$(window).height() - $('#toolbar').height()- $('#smoothmenu1').height()- $('#statusbar').height()+'px');
			}
			else
			{
				
				//$('#ScriptEditor').css('top',$('#ScriptEditor').attr('originaltop')+'px');
				//$('#ScriptEditor').css('height',$(window).height() - $('#ScriptEditor').offset().top- $('#statusbar').height()+'px');
				
			}
			_ScriptEditor.resize();
			
			
			$('#index-vwf').css('height',window.innerHeight + 'px' - $('#ScriptEditor').offset().top);
			
			$('#index-vwf').css('top',$('#toolbar').offset().top+$('#toolbar').height());
			$('#index-vwf').css('position','absolute');
			$('#vwf-root').css('overflow','visible');
			$('#vwf-root').css('left','0px');
			$('#vwf-root').css('top','0px');
			var scripteditorheight = $('#ScriptEditor').offset().top;
			if(scripteditorheight != 0)
			   scripteditorheight = $(window).height() - scripteditorheight;
			$('#index-vwf').css('height',window.innerHeight - $('#smoothmenu1').height() - $('#statusbar').height() - $('#toolbar').height() - (scripteditorheight-25) + 'px');
			
			$('#sidepanel').css('left',$('#index-vwf').width() + $('#index-vwf').offset().left);
			//$('#sidepanel').css('width',320);
			$('#sidepanel').css('top',$('#toolbar').offset().top+$('#toolbar').height());
			$('#sidepanel').css('height',$(window).height());
			$('#statusbar').css('top',($(window).height() - 25) + 'px');
			
			
			$('#sidepanel').css('height',$(window).height() - ($('#statusbar').height() + $('#toolbar').height()+$('#smoothmenu1').height()) + 'px');
			_Editor.findcamera().aspect = ($('#index-vwf').width()/$('#index-vwf').height());
			_Editor.findcamera().updateProjectionMatrix();
		});
		$(window).resize();
		
		
		
		
		
		window.setTimeout(function(){$(window).resize();hideSidePanel();},500);
		
		

		$(document.body).css('overflow','hidden');
		
		createIcon('../vwf/view/editorview/images/icons/logout.png','MenuLogIn','Log In');
		createIcon('../vwf/view/editorview/images/icons/login.png','MenuLogOut','Log Out');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/Move.png','MenuMove','Move Tool');
		createIcon('../vwf/view/editorview/images/icons/rotate.png','MenuRotate','Rotate Tool');
		createIcon('../vwf/view/editorview/images/icons/scale.png','MenuScale','Scale Tool');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/worldspace.png','MenuWorld','Use World Coordinates');
		createIcon('../vwf/view/editorview/images/icons/localspace.png','MenuLocal','Use Local Coordinates');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/pick.png','MenuSelectPick','Select by clicking');
		createIcon('../vwf/view/editorview/images/icons/selectnone.png','MenuSelectNone','Select None');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/copy.png','MenuCopy','Copy');
		createIcon('../vwf/view/editorview/images/icons/paste.png','MenuPaste','Paste');
		createIcon('../vwf/view/editorview/images/icons/duplicate.png','MenuDuplicate','Duplicate');
		createIcon('../vwf/view/editorview/images/icons/save.png','MenuSaveCopy','Save to Inventory');
		createIcon('../vwf/view/editorview/images/icons/delete.png','MenuDelete','Delete');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/link.png','MenuSetParent','Link');
		createIcon('../vwf/view/editorview/images/icons/unlink.png','MenuRemoveParent','Unlink');
		createIcon('../vwf/view/editorview/images/icons/up.png','MenuSelectParent','Select Parent');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/camera.png','MenuCameraOrbit','Orbit Camera');
		createIcon('../vwf/view/editorview/images/icons/firstperson.png','MenuCamera3RDPerson','First Person Camera');
		createIcon('../vwf/view/editorview/images/icons/navigate.png','MenuCameraNavigate','Navigation Camera');
		createIcon('../vwf/view/editorview/images/icons/free.png','MenuCameraFree','Free Camera');
		createIcon('../vwf/view/editorview/images/icons/target.png','MenuFocusSelected','Focus to selected object');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/sphere.png','MenuCreateSphere','Create Sphere');
		createIcon('../vwf/view/editorview/images/icons/cube.png','MenuCreateBox','Create Box');
		createIcon('../vwf/view/editorview/images/icons/Cylinder.png','MenuCreateCylinder','Create Cylinder');
		createIcon('../vwf/view/editorview/images/icons/cone.png','MenuCreateCone','Create Cone');
		createIcon('../vwf/view/editorview/images/icons/plane.png','MenuCreatePlane','Create Plane');
		createSeperator();
		
	
  
		createIcon('../vwf/view/editorview/images/icons/users.png','MenuUsers','Show Users Window');
		createIcon('../vwf/view/editorview/images/icons/chat.png','MenuChat','Show Chat Window');
		createIcon('../vwf/view/editorview/images/icons/material.png','MenuMaterialEditor','Show Material Editor Window');
		createIcon('../vwf/view/editorview/images/icons/script.png','MenuScriptEditor','Show Script Editor Window');
		createIcon('../vwf/view/editorview/images/icons/properties.png','MenuObjectProperties','Show Object Properties Window');
		createIcon('../vwf/view/editorview/images/icons/models.png','MenuModels','Show Model Library Window');
		createIcon('../vwf/view/editorview/images/icons/inventory.png','MenuInventory','Show Inventory Window');
		
		createPanelShowHide();
		$('body *').not(':has(input)').not('input').disableSelection();
		$('#vwf-root').enableSelection();
		$('#vwf-root').parent().enableSelection();
		$('#vwf-root').parent().parent().enableSelection();
		$('#index-vwf').enableSelection();
		$('#MenuCameraOrbiticon').css('background','#9999FF');
		$('#MenuMoveicon').css('background',"#9999FF");
		$('#MenuWorldicon').css('background',"#9999FF");
		$('#MenuLogOuticon').css('background',"#555555");
		
		document.addEventListener("touchstart", touchHandler, true);
		document.addEventListener("touchmove", touchHandler, true);
		document.addEventListener("touchend", touchHandler, true);
		document.addEventListener("touchcancel", touchHandler, true); 
		$('* :not(input)').disableSelection();
		$('#sidepanel').css('height',$(window).height() - ($('#statusbar').height() + $('#toolbar').height()+$('#smoothmenu1').height()) + 'px')
		
		$('#sidepanel').jScrollPane();
	}
	var lastbutton = -1;
	var ongoingTouches = [];
	function ongoingTouchIndexById(idToFind) {
	  for (var i=0; i<ongoingTouches.length; i++) {
			var id = ongoingTouches[i].identifier;
			 
			if (id == idToFind) {
			  return i;
			}
		  }
		  return -1;    // not found
		}
	function touchHandler(event)
	{
		try{
		var touches = event.changedTouches,
			first = touches[0],
			type = "";
			 switch(event.type)
		{
			case "touchstart": type = "mousedown"; break;
			case "touchmove":  type="mousemove"; break;        
			case "touchend":   type="mouseup"; break;
			case "touchleave":   type="mouseup"; break;
			case "touchcancel":   type="mouseup"; break;
			default: return;
		}
		if(event.type == 'touchstart')
		{
			for (var i=0; i<touches.length; i++) {
    				if(ongoingTouchIndexById(touches[i].identifier) == -1) ongoingTouches.push(touches[i]);
			}
			var simulatedEvent2 = document.createEvent("MouseEvent");
			simulatedEvent2.initMouseEvent("mouseup", true, true, window, 1, 
								  first.screenX, first.screenY, 
								  first.clientX, first.clientY, false, 
								  false, false, false, lastbutton/*left*/, null);
			simulatedEvent2.currentTarget = first.target;
			first.target.dispatchEvent(simulatedEvent2);

		}
		if(event.type == 'touchend' || event.type == 'touchleave' || event.type == 'touchcancel')
		{
		     for (var i=0; i<touches.length; i++) {
		   	 if(ongoingTouchIndexById(touches[i].identifier) != -1)  ongoingTouches.splice(ongoingTouchIndexById(touches[i].identifier), 1);  // remove it; we're done
			}
  
		}
		
		

		//initMouseEvent(type, canBubble, cancelable, view, clickCount, 
		//           screenX, screenY, clientX, clientY, ctrlKey, 
		//           altKey, shiftKey, metaKey, button, relatedTarget);
		
		var mousebutton = 0;
		mousebutton = ongoingTouches.length -1;
		lastbutton = mousebutton;
                document.title =  ongoingTouches.length;
			

		if(type=="mouseup")
		mousebutton++;			

		var simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent(type, true, true, window, 1, 
								  first.screenX, first.screenY, 
								  first.clientX, first.clientY, false, 
								  false, false, false, mousebutton /*left*/, null);
		simulatedEvent.currentTarget = first.target;
		first.target.dispatchEvent(simulatedEvent);
		if(type == 'mouseup')
		{
			var simulatedEvent = document.createEvent("MouseEvent");
			simulatedEvent.initMouseEvent('click', true, true, window, 1, 
									  first.screenX, first.screenY, 
									  first.clientX, first.clientY, false, 
									  false, false, false, mousebutton /*left*/, null);
			
			 first.target.dispatchEvent(simulatedEvent);
		
		}
		
		event.preventDefault();
		}catch(e)
		{
		document.title = e.message;
		}
	}

	var sizeTimeoutHandle;
	function sizeWindowTimer()
	{
		if(!_Editor.findcamera())
			return;
		_Editor.findcamera().aspect = ($('#index-vwf').width()/$('#index-vwf').height());
		_Editor.findcamera().updateProjectionMatrix();
		_ScriptEditor.resize();
		
	}
	function createIcon(src,menuitemname,tooltip)
	{ 
		
		var iconname = menuitemname+"icon";
		var mn = menuitemname;
		$('#toolbar').append('<img src="'+src+'" id="'+iconname+'" class="icon" />');
		$('#'+iconname).click(function()
		{
			
			$('#'+mn).click();
			$(this).css('background: -webkit-linear-gradient(left, rgb(317, 138, 139) 0%, rgb(217, 238, 239) 100%);');
			$(".ddsmoothmenu").find('li').trigger('mouseleave');
		}
		);
		
		$('#'+iconname).qtip({
			content: tooltip,
			show: { delay: 1000 }
			});
	}
	function clearCameraModeIcons()
	{
		$('#MenuCameraOrbiticon').css('background','');
		$('#MenuCamera3RDPersonicon').css('background','');
		$('#MenuCameraNavigateicon').css('background','');
		$('#MenuCameraFreeicon').css('background','');
	}
	function createPanelShowHide(src)
	{ 
		
		var iconname = "togglesidepanelicon";
		$('#toolbar').append('<img src="../vwf/view/editorview/images/icons/left.png" id="'+iconname+'" class="icon" />');
		$('#togglesidepanelicon').css('float','right');
		$('#'+iconname).click(function()
		{
			if($('#sidepanel').offset().left < $(window).width())
				hideSidePanel();
			else
				showSidePanel();
		}
		);
	}
	function createSeperator()
	{
		
		
		$('#toolbar').append('<div class="seperator" />');
		
	}

	function hideSidePanel()
	{
		window.clearInterval(window.sizeTimeoutHandle);
		window.sizeTimeoutHandle = window.setInterval(sizeWindowTimer,33);
		$('#togglesidepanelicon').attr('src','../vwf/view/editorview/images/icons/left.png');
		$('#sidepanel').animate({'left':$(window).width()});
		$('#ScriptEditor').animate({'width':$(window).width()});
		$('#index-vwf').animate({'width':$(window).width()},function()
		{
			window.clearInterval(window.sizeTimeoutHandle);
			sizeWindowTimer();
			window.sizeTimeoutHandle = null;
			
		});
	}
	function showSidePanel()
	{
		window.clearInterval(window.sizeTimeoutHandle);
		window.sizeTimeoutHandle = window.setInterval(sizeWindowTimer,33);
		$('#togglesidepanelicon').attr('src','../vwf/view/editorview/images/icons/right.png');
		$('#sidepanel').animate({'left':$(window).width()-$('#sidepanel').width()});
		$('#ScriptEditor').animate({'width':$(window).width()-$('#sidepanel').width()});
		$('#index-vwf').animate({'width':$(window).width()-$('#sidepanel').width()},function()
		{
			window.clearInterval(window.sizeTimeoutHandle);
			window.sizeTimeoutHandle = null;
			
		});
	}
	function SendChatMessage()
	{
	
		if(document.PlayerNumber == null)
		{
			_Notifier.notify('You must log in to participate');
			return;
		}
		var parms = new Array();
		parms.push(JSON.stringify({sender:document.PlayerNumber,text:$('#ChatInput').val()}));
		vwf_view.kernel.callMethod('index-vwf','receiveChat',parms);
		$('#ChatInput').val('');
	}
	function SendPM(text,receiver)
	{
		
		if(document.PlayerNumber == null)
		{
			_Notifier.notify('You must log in to participate');
			return;
		}
		var parms = new Array();
		parms.push(JSON.stringify({sender:document.PlayerNumber,text:text,receiver:receiver}));
		vwf_view.kernel.callMethod('index-vwf','PM',parms);
		
	}
	function ToSafeID(value)
	{
		return value.replace(/[^A-Za-z0-9]/g, "");
	}
	function setupPmWindow(e)
	{
		
		var s = e;
		e = ToSafeID(e);
		if($('#PM'+e).length ==1)
		{
			$('#PM'+e).dialog("open");
		}else
		{
			$(document.body).prepend("<div id='"+'PM'+e+"' style='width: 100%;margin:0px;padding:0px;overflow:hidden'/>");
			$('#PM'+e).dialog({title:"Chat with " + s,autoOpen:true});
			$('#PM'+e).attr('receiver',s);
			
			
			var setup = '<div class="text ui-widget-content ui-corner-all" style="background-image: -webkit-linear-gradient(top, white 0%, #D9EEEF 100%);width: 99%;top: 0%; height:80%;padding:0px;margin:0px;position: absolute;overflow-y:auto">'+
			'<table id="ChatLog'+e+'" style="width:100%;background-color: transparent;">'+
			'</table>'+
			'</div>'+
			'<input type="text" name="ChatInput" id="ChatInput'+e+'" class="text ui-widget-content ui-corner-all" style="width: 99%;top: 82%;position: absolute;padding: 0px;font-size: 1.2em;"/>';		
			$('#PM'+e).append(setup);
			$('#ChatInput'+e).attr('receiver',s);
			$('#ChatInput'+e).keypress(function(e){
				
				var text = $(this).val();
				var rec = $(this).attr('receiver');
				
				 var key;
				 if(window.event)
					  key = window.event.keyCode;     //IE
				 else
					  key = e.which;     //firefox
				 if(key == 13)
				{
				
					SendPM(text,rec);
					$(this).val('');
				}
				//e.preventDefault();
				e.stopImmediatePropagation();
				
			});
			$('#ChatInput'+e).keydown(function(e){
				e.stopImmediatePropagation();
				
				
			});
			$('#ChatInput'+e).keyup(function(e){
				e.stopImmediatePropagation();
				
			});
			$('#ChatInput'+e).change(function(e){
				e.stopImmediatePropagation();
				
			});
			
			
		}
	}
	function PMReceived(e)
	{
		
		e = JSON.parse(e);
		
		if(e.sender != document.PlayerNumber && e.receiver != document.PlayerNumber) 
			return;
		
		if(e.sender != document.PlayerNumber && e.receiver == document.PlayerNumber) 
			setupPmWindow(e.sender);
		var color = 'darkred';
		if(e.sender == document.PlayerNumber)
			color = 'darkblue';
		if(e.sender != document.PlayerNumber)	
			$('#ChatLog'+ToSafeID(e.sender)).append('<tr><td style="vertical-align: top;width: 25%;min-width: 25%;margin-right: 1em;color:'+color+';display: table-cell;">'+e.sender+'</td><td style="color:'+color+';width: 75%;max-width: 75%;">'+e.text+'</td></tr>');
		else	
			$('#ChatLog'+ToSafeID(e.receiver)).append('<tr><td style="vertical-align: top;width: 25%;min-width: 25%;margin-right: 1em;color:'+color+';display: table-cell;">'+e.sender+'</td><td style="color:'+color+';width: 75%;max-width: 75%;">'+e.text+'</td></tr>');
	}
	function ChatMessageReceived(e)
	{
		var message = JSON.parse(e);
		var color = 'darkred';
		if(message.sender == document.PlayerNumber)
			color = 'darkblue';
		$('#ChatLog').append('<tr><td style="vertical-align: top;width: 25%;min-width: 25%;margin-right: 1em;color:'+color+';display: table-cell;">'+message.sender+'</td><td style="color:'+color+';width: 75%;max-width: 75%;">'+message.text+'</td></tr>');
	
	}

	function PlayerDeleted(e)
	{
		$("#"+e+"label").remove();
	}
	function GUID()
    {
        var S4 = function ()
        {
            return Math.floor(
                    Math.random() * 0x10000 /* 65536 */
                ).toString(16);
        };

        return (
                S4() + S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + S4() + S4()
            );
    }
	function disableEnterKey(e)
	{
		 var key;
		 if(window.event)
			  key = window.event.keyCode;     //IE
		 else
			  key = e.which;     //firefox
		 if(key == 13)
			  return false;
		 else
			  return true;
	}
	function ChatKeypress(e)
	{
		 var key;
		 
		 if(window.event)
			  key = window.event.keyCode;     //IE
		 else
			  key = e.which;     //firefox
		 if(key == 13)
		 {
			SendChatMessage();
			return false;
		 }
		 
		 return true;
		 
		 
	}
	function PMKeypress(event,to)
	{
		
		 var key;
		 if(window.event)
			  key = window.event.keyCode;     //IE
		 else
			  key = e.which;     //firefox
		 if(key == 13)
		 {
			SendPMMessage('test',to);
			return false;
		 }
		 
		 return true;
		 
		 
	}

	
	