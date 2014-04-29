"use strict";
define(["module", "version", "vwf/view", "vwf/view/sandbox/alertify.js-0.3.9/src/alertify","vwf/view/sandbox/Menubar","vwf/view/sandbox/ObjectPools","vwf/view/sandbox/LocationTools", "vwf/view/sandbox/WindowResize","vwf/view/sandbox/_PermissionsManager", "vwf/view/sandbox/InputSetup", "vwf/view/sandbox/SaveLoadTimer", "vwf/view/sandbox/TouchHandler", "vwf/view/sandbox/SidePanel", "vwf/view/sandbox/Toolbar", "vwf/view/sandbox/ChatSystemGUI", "vwf/view/sandbox/PrimitiveEditor", "vwf/view/sandbox/MaterialEditor", "vwf/view/sandbox/Notifier", "vwf/view/sandbox/ScriptEditor", "vwf/view/sandbox/Editor", "vwf/view/sandbox/_3DRIntegration", "vwf/view/sandbox/InventoryManager", "vwf/view/sandbox/HeirarchyManager",  "vwf/view/sandbox/DataManager", "vwf/view/sandbox/UserManager", "vwf/view/sandbox/help","vwf/view/sandbox/SideTabs","vwf/view/sandbox/wireeditor","vwf/view/sandbox/selectionEditor","vwf/view/sandbox/UndoManager"], function (module, version, view)
{
	return view.load(module,
	{
		// == Module Definition ====================================================================
		initialize: function ()
		{
			
			


			
			if (!window._EditorInitialized)
			{
				jQuery.extend(
				{
					parseQuerystring: function ()
					{
						var nvpair = {};
						var qs = window.location.search.replace('?', '');
						var pairs = qs.split('&');
						$.each(pairs, function (i, v)
						{
							var pair = v.split('=');
							nvpair[pair[0]] = pair[1];
						});
						return nvpair;
					}
				});
				
					
					console.log('initialize Index-vwf');
					
					window._DataManager = require("vwf/view/sandbox/DataManager").getSingleton();;
					
					
					var instanceData = {};
					
					var needTools =  true;
				
					
					
					window._Editor = require("vwf/view/sandbox/Editor").getSingleton();
					
					if(needTools)
					{

						
						var data = $.ajax('vwf/view/sandbox/menus.html',
						{
							async: false,
							dataType: 'html'
						}).responseText;
						$(document.body).prepend(data);
						$(document.head).append('<link rel="stylesheet" type="text/css" href="vwf/view/sandbox/ddsmoothmenu.css"></link>');
						
						$(document.head).append('<link rel="stylesheet" type="text/css" href="vwf/view/sandbox/sandbox.css"></link>');
						
						$(document.head).append('<link rel="stylesheet" type="text/css" href="vwf/view/sandbox/lib/jquery-ui-1.10.3.custom.css"></link>');
						$(document.head).append('<link rel="stylesheet" type="text/css" href="vwf/view/sandbox/lib/images/icons/sprites.css"></link>');
						$(document.head).append('<link rel="stylesheet" type="text/css" href="vwf/view/sandbox/alertify.js-0.3.9/themes/alertify.bootstrap.css"></link>');
						

						$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/lib/jquery-2.0.3.min.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/lib/jquery-ui-1.10.3.custom.min.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/lib/jquery-scrollpane.min.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/lib/jquery.qtip-1.0.0-rc3.min.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/lib/jquery.transit.min.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/localization/i18next-1.7.2.min.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/ddsmoothmenu.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/alertify.js-0.3.9/src/alertify.js"></script>');


					
					
						require("vwf/view/sandbox/SidePanel").initialize();
						//initialize the primitive editor
						
						//initialize the primitive editor
						window._PrimitiveEditor = require("vwf/view/sandbox/PrimitiveEditor").getSingleton();
						
						//initialize the Material editor
						window._MaterialEditor = require("vwf/view/sandbox/MaterialEditor").getSingleton();
						window._MaterialEditor.hide();
						window._Notifier = require("vwf/view/sandbox/Notifier").getSingleton();
						window._ScriptEditor = require("vwf/view/sandbox/ScriptEditor").getSingleton();;
						
						
					
						window._SelectionEditor = require("vwf/view/sandbox/selectionEditor").getSingleton();
						window._UndoManager = require("vwf/view/sandbox/UndoManager").getSingleton();
						this.addManager(_ScriptEditor);
						this.addManager(_UndoManager);
						
						this.addManager(_Notifier);
						this.addManager(_MaterialEditor);
						this.addManager(_PrimitiveEditor);
					
						
					
						
					
						$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/lib/jquery.qtip-1.0.0-rc3.min.js"></script>');
						$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/beautify.module.js"></script>');

						$(document.head).append('<script type="text/javascript" src="vwf/view/localization/translate.js"></script>');
						$('#sidepanel').css('height', $(window).height() - ($('#statusbar').height() + $('#toolbar').height() + $('#smoothmenu1').height()) + 'px')
						$('#sidepanel').jScrollPane();
						require("vwf/view/sandbox/Toolbar").initialize();
						
						require("vwf/view/sandbox/Menubar").initialize();
						require("vwf/view/sandbox/SideTabs").initialize();


					}

					$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/sha256.js"></script>');
					$(document.head).append('<script type="text/javascript" src="vwf/view/sandbox/lib/jquery.ui.touch-punch.min.js"></script>');

					require("vwf/view/sandbox/WindowResize").initialize();
					$('input[type="text"]').keypress(function(e){e.stopImmediatePropagation();});
					
					
					
					this.addManager(_DataManager);
					this.addManager(_Editor);

				
			}
		},
		managers:[],     //list of objects that need notification of events
		addManager:function(manager)
		{
			this.managers.push(manager);
			manager.sendMessage = this.sendMessage;
			manager.getParent = function(){return this;}.bind(this);

		},
		//actual sending of messages. Stops and returns when a manager returns a value
		_sendMessage:function(message,data,sender)
		{
			
			for(var i=0; i < this.managers.length; i++)
			{
				var manager = this.managers[i];
				if(manager[message] && (typeof manager[message] == "function"))
				{
					var tret = null;
					if(data && data.constructor == Array)
						tret = manager[message].apply(manager,data);
					else
						tret = manager[message].apply(manager,[data]);
					return tret;
				}
				else if(manager.receiveMessage)
				{
					var tret = manager.receiveMessage(message,data,sender);
					if(tret)
						return tret;
				}
			}
			return null;
		},
		//handle that is applied to each registered manager, allowing them to send messages over the bus
		/* message,data */
		sendMessage:function(/* message,data */)
		{
			var args = []
			for(var i =0; i < arguments.length; i++)
			{
				args.push(arguments[i]);
			}
			
			var message = args.shift();
			return this.getParent()._sendMessage(message,args,this);
		},
		// send the VWF events down to all registered objects
		viewAPINotify:function(functionName,data)
		{
			for(var i=0; i < this.managers.length; i++)
			{
				var manager = this.managers[i];
				if(manager[functionName])
				{
					manager[functionName].apply(manager,data)
				}
			}
		},
		createdNode: function (nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childURI, childName, callback /* ( ready ) */ )
		{

			this.viewAPINotify('createdNode',arguments);
		},
		
		initializedNode: function (nodeID, childID)
		{
			this.viewAPINotify('initializedNode',arguments);
			if (childID == 'index-vwf')
			{
				if(window._Editor)
				{
					
					_Editor.initialize();
				
				InitializeEditor();
				}
				
			}
			if (window._Editor && childID != 'index-vwf')
			{
				if (window._Editor.createNodeCallback != null)
				{
					window._Editor.CallCreateNodeCallback(childID, nodeID);
				}
			}
		},
		createdProperty: function (nodeID, propertyName, propertyValue)
		{
			this.viewAPINotify('createdProperty',arguments);
		},
		initializedProperty: function (nodeID, propertyName, propertyValue)
		{
			this.viewAPINotify('initializedProperty',arguments);
		},
		deletedNode: function (nodeID)
		{
			this.viewAPINotify('deletedNode',arguments);
			if (window._Editor && _Editor.SelectedVWFID == nodeID)
			{
				_Editor.SelectObject(null);
			}
		},
		satProperty: function (nodeID, propertyName, propertyValue)
		{
			this.viewAPINotify('satProperty',arguments);
			if (window._Editor && propertyName == _Editor.transformPropertyName && _Editor.isSelected(nodeID))
			{
				_Editor.updateBoundsTransform(nodeID);
				if(vwf.client() == vwf.moniker())
				{
					if(_Editor.waitingForSet.length)
						_Editor.waitingForSet.splice(_Editor.waitingForSet.indexOf(nodeID), 1);
				
				}
				if (_Editor.waitingForSet.length == 0 || vwf.client() != vwf.moniker())
				{
					_Editor.updateGizmoLocation();
					_Editor.updateGizmoSize();
					_Editor.updateGizmoOrientation(false);
				}
				$(document).trigger('selectionTransformedLocal',[{id:nodeID}]);
			}
			
			if(window._PrimitiveEditor)
				_PrimitiveEditor.NodePropertyUpdate(nodeID, propertyName, propertyValue);
		},
		createdMethod: function (nodeID, methodName, methodParameters, methodBody)
		{
			this.viewAPINotify('createdMethod',arguments);
		},
		calledMethod: function (nodeID, methodName, methodParameters)
		{
			this.viewAPINotify('calledMethod',arguments);
		},
		createdEvent: function (nodeID, eventName, eventParameters)
		{
			this.viewAPINotify('createdEvent',arguments);
		},
		firedEvent: function (nodeID, eventName, eventParameters)
		{
			this.viewAPINotify('firedEvent',arguments);
		},
		executed: function (nodeID, scriptText, scriptType)
		{
			this.viewAPINotify('executed',arguments);
		},
	});
});

function InitializeEditor()
{

	var instanceData =  {};				
	var needTools = true;
	
	
	$('#vwf-root').css('overflow', 'hidden');
	$(document.body).css('font-size', '10px');
	$('#tabs').css('z-index', '101');
	$('#vwf-root').attr('tabindex', '0');
	
	

	require("vwf/view/sandbox/InputSetup").initialize();

	require("vwf/view/sandbox/Menubar").initialize();
	
	
	require("vwf/view/sandbox/TouchHandler").initialize();
	
	$(document.body).css('overflow', 'hidden');
	$(window).resize();
	//	$('body *').not(':has(input)').not('input').disableSelection();
	//	$('#vwf-root').enableSelection();
	//	$('#vwf-root').parent().enableSelection();
	//	$('#vwf-root').parent().parent().enableSelection();
	//	$('#index-vwf').enableSelection();
	//	$('* :not(input)').disableSelection();
	
	//localization
	
	
}

function PlayerDeleted(e)
{
	$("#" + e + "label").remove();
}

function GUID()
{
	var S4 = function ()
	{
		return Math.floor(Math.random() * 0x10000 /* 65536 */ ).toString(16);
	};
	return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
