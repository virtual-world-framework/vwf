jQuery.fn.extend(
{
	insertAtCaret: function (textToInsert)
	{
		return this.each(function (i)
		{
			if (document.selection)
			{
				this.focus();
				sel = document.selection.createRange();
				sel.text = textToInsert;
				this.focus();
			}
			else if (this.selectionStart || this.selectionStart == '0')
			{
				var startPos = this.selectionStart;
				var endPos = this.selectionEnd;
				var scrollTop = this.scrollTop;
				this.value = this.value.substring(0, startPos) + textToInsert + this.value.substring(endPos, this.value.length);
				this.focus();
				this.selectionStart = startPos + textToInsert.length;
				this.selectionEnd = startPos + textToInsert.length;
				this.scrollTop = scrollTop;
			}
			else
			{
				this.value += textToInsert;
				this.focus();
			}
		})
	}
});
define(function ()
{
	var ScriptEditor = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(ScriptEditor);
				isInitialized = true;
			}
			return ScriptEditor;
		}
	}

	function initialize()
	{
		this.resize = function ()
		{
			$('#ScriptEditorTabs').css('height', $('#ScriptEditor').height() + 'px');
			var w = ($('#textinnere').parent().width() - 190);
			if (w <= 0) w = ($('#textinnerm').parent().width() - 190);
			if (w <= 0) w = ($('#textinnerp').parent().width() - 190);
			var h = ($('#textinnere').parent().height() - 125);
			if (h <= 50) h = ($('#textinnerm').parent().height() - 125);
			if (h <= 50) h = ($('#textinnerp').parent().height() - 125);
			$('#textinnerm').css('width', w + 'px')
			$('#textinnere').css('width', w + 'px')
			$('#textinnerp').css('width', w + 'px')
			$('#textinnerm').css('height', h + 'px')
			$('#textinnere').css('height', h + 'px')
			$('#textinnerp').css('height', h + 'px')
			
			
			$('#methodlist').css('height', h + 'px');
			$('#eventlist').css('height', h + 'px');
			$('#propertylist').css('height', h + 'px');
			
			
			h += 15;
			$('#checkSyntaxMethod').css('top', h + 'px');
			$('#checkSyntaxEvent').css('top', h + 'px');
			$('#callMethod').css('top', h + 'px');
			$('#deleteMethod').css('top', h + 'px');
			$('#newMethod').css('top', h + 'px');
			$('#newProperty').css('top', h + 'px');
			$('#saveMethodCopy').css('top', h + 'px');
			$('#callEvent').css('top', h + 'px');
			$('#deleteEvent').css('top', h + 'px');
			$('#deleteProperty').css('top', h + 'px');
			$('#newEvent').css('top', h + 'px');
			$('#saveEventCopy').css('top', h + 'px');
			_ScriptEditor.methodEditor.resize();
			_ScriptEditor.eventEditor.resize();
			_ScriptEditor.propertyEditor.resize();
			$('#saveMethod').css('top', $('#ScriptEditor').height() - 75);
			$('#saveEvent').css('top', $('#ScriptEditor').height() - 75);
			$('#saveProperty').css('top', $('#ScriptEditor').height() - 75);
		}
		$(document.body).append('<script src="../vwf/view/editorview/ace/src-min-noconflict/ace.js" type="text/javascript" charset="utf-8"></script>');
		$(document.body).append("<div id='ScriptEditorAbandonChanges'>You have are about to load a different script,but you have unsaved changes to this script. Do you want to continue and abandon the changes? This action cannot be undone.</div>");
		$(document.body).append("<div id='ScriptEditorCreateMethod'><input id='newMethodName' type='text' /></div>");
		$(document.body).append("<div id='ScriptEditorCreateEvent'><input id='newEventName' type='text' /></div>");
		$(document.body).append("<div id='ScriptEditorCreateProperty'><input id='newPropertyName' type='text' /></div>");
		$(document.body).append("<div id='ScriptEditorDeleteMethod'>Are you sure you want to delete this script? This cannot be undone.</div>");
		$(document.body).append("<div id='ScriptEditorDeleteProperty'>Are you sure you want to delete this property? This cannot be undone.</div>");
		$(document.body).append("<div id='ScriptEditorDeleteEvent'>Are you sure you want to delete this script? This cannot be undone.</div>");
		$(document.body).append("<div id='ScriptEditorMessage'>This script contains syntax errors, and cannot be saved;</div>");
		$(document.body).append("<div id='ScriptEditor'  style=''>" +
		"<div id='scripteditortitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' >"+
		"<span class='ui-dialog-title' id='ui-dialog-title-Players'>ScriptEditor</span></div>" +
		 '<div id="ScriptEditorTabs" style="width:100%;height:100%;overflow:hidden;padding: 0px 10px 0px 0px;">' +
		 '	<ul>' +
		 '		<li><a href="#methods">Methods</a></li>'+ 
		 '		<li><a href="#events">Events</a></li>' +
		 '		<li><a href="#properties">Properties</a></li>' +
		 '	</ul>'+
		 '	<div id="methods" style="height: 100%;padding:4px">' +
		 '		<div style="width: 180px;display: inline-block;vertical-align: top;">'+
		 '      <div id="methodlist"/><div id="saveMethod"/></div>' +
		 '      <div id="textinnerm" style="display: inline-block;position:absolute">' +
		'          <div style="position: absolute;top: 0px;width: 100%;height: 100%;border: 1px black solid;"  id="methodtext" />' +
		 '         <div id="callMethod"/><div id="deleteMethod"/><div id="newMethod"/><div id="checkSyntaxMethod"/><div id="saveMethodCopy"/>'+
		 '      </div>' + 
		 '	</div>' + 
		 '	<div id="events" style="height: 100%;padding:4px">'+
		 '		<div style="width: 180px;display: inline-block;vertical-align: top;">'+
		'       <div id="eventlist"/><div id="saveEvent"/></div>' + 
		'		<div id="textinnere" style="display: inline-block;position:absolute">' +
		'          <div style="position: absolute;top: 0px;width: 100%;height: 100%;border: 1px black solid;"  id="eventtext" />'		+
		'		   <div id="callEvent"/><div id="deleteEvent"/><div id="newEvent"/><div id="checkSyntaxEvent"/><div id="saveEventCopy"/>' +
		'		</div>' +
		'	</div>' +
		 '	<div id="properties" style="height: 100%;padding:4px">'+
		 '		<div style="width: 180px;display: inline-block;vertical-align: top;">'+
		'       <div id="propertylist"/><div id="saveProperty"/></div>' + 
		'		<div id="textinnerp" style="display: inline-block;position:absolute">' +
		'          <div style="position: absolute;top: 0px;width: 100%;height: 100%;border: 1px black solid;"  id="propertytext" />'		+
		'		   <div id="deleteProperty"/><div id="newProperty"/>' +
		'		</div>' +
		'	</div>' +
		'</div>' +
		"</div>");
		this.MethodChanged = false;
		this.EventChanged = false;
		//$('#ScriptEditor').resize(function(){_ScriptEditor.resize()});
		$('#scripteditortitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/script.png" />');
		$('#scripteditortitle').append('<img id="maximizescripteditor" style="float:right" class="icon" src="../vwf/view/editorview/images/icons/up2.png" />');
		$('#scripteditortitle').append('<img id="hidescripteditor" class="icon" style="float:right" src="../vwf/view/editorview/images/icons/down.png" />');
		$('#hidescripteditor').click(function ()
		{
			_ScriptEditor.hide();
		});
		$('#maximizescripteditor').click(function ()
		{
			if (!$('#ScriptEditor').attr('maximized'))
			{
				$('#ScriptEditor').attr('originalheight', $('#ScriptEditor').height());
				$('#ScriptEditor').attr('originaltop', $('#ScriptEditor').offset().top);
				$('#ScriptEditor').css('top', $('#toolbar').offset().top + $('#toolbar').height() + 'px');
				$('#ScriptEditor').attr('maximized', true);
				$('#ScriptEditor').css('height', $(window).height() - $('#toolbar').height() - $('#smoothmenu1').height() - $('#statusbar').height() + 'px');
				$('#maximizescripteditor').attr('src', 'vwf/view/editorview/images/icons/window.png');
			}
			else
			{
				$('#ScriptEditor').css('top', $('#ScriptEditor').attr('originaltop') + 'px');
				$('#ScriptEditor').css('height', $(window).height() - $('#ScriptEditor').offset().top - $('#statusbar').height() + 'px');
				$('#ScriptEditor').removeAttr('maximized');
				$('#maximizescripteditor').attr('src', 'vwf/view/editorview/images/icons/up2.png');
				var scripteditorheight = $('#ScriptEditor').offset().top;
				if (scripteditorheight != 0) scripteditorheight = $(window).height() - scripteditorheight;
				$('#index-vwf').css('height', window.innerHeight - $('#smoothmenu1').height() - $('#statusbar').height() - $('#toolbar').height() - (scripteditorheight - 25) + 'px');
				_Editor.findcamera().aspect = ($('#index-vwf').width() / $('#index-vwf').height());
				_Editor.findcamera().updateProjectionMatrix();
			}
			_ScriptEditor.resize();
		});
		//$('#ScriptEditor').dialog({title:'Script Editor',autoOpen:false,resize:this.resize,height:520,width:760,position:'center'});
		$('#ScriptEditorDeleteMethod').dialog(
		{
			title: 'Delete Method?',
			autoOpen: false,
			height: 'auto',
			width: '200px',
			position: 'center',
			modal: true,
			buttons: {
				'Yes': function ()
				{
					_ScriptEditor.DeleteActiveMethod_imp();
					$('#ScriptEditorDeleteMethod').dialog('close');
				},
				'No': function ()
				{
					$('#ScriptEditorDeleteMethod').dialog('close');
				},
			}
		});
		$('#ScriptEditorDeleteProperty').dialog(
		{
			title: 'Delete Property?',
			autoOpen: false,
			height: 'auto',
			width: '200px',
			position: 'center',
			modal: true,
			buttons: {
				'Yes': function ()
				{
					_ScriptEditor.DeleteActiveProperty_imp();
					$('#ScriptEditorDeleteProperty').dialog('close');
				},
				'No': function ()
				{
					$('#ScriptEditorDeleteProperty').dialog('close');
				},
			}
		});
		$('#ScriptEditorDeleteEvent').dialog(
		{
			title: 'Delete Event?',
			autoOpen: false,
			height: 'auto',
			width: '200px',
			position: 'center',
			modal: true,
			buttons: {
				'Yes': function ()
				{
					_ScriptEditor.DeleteActiveEvent_imp();
					$('#ScriptEditorDeleteEvent').dialog('close');
				},
				'No': function ()
				{
					$('#ScriptEditorDeleteEvent').dialog('close');
				},
			}
		});
		$('#ScriptEditorAbandonChanges').dialog(
		{
			title: 'Abandon Changes?',
			autoOpen: false,
			height: 'auto',
			width: '200px',
			position: 'center',
			modal: true,
			buttons: {
				'Yes': function ()
				{
					_ScriptEditor.AbandonChangesCallback();
					$('#ScriptEditorAbandonChanges').dialog('close');
				},
				'No': function ()
				{
					$('#ScriptEditorAbandonChanges').dialog('close');
				},
			}
		});
		$('#ScriptEditorMessage').dialog(
		{
			title: 'Syntax Error',
			autoOpen: false,
			height: 'auto',
			width: '200px',
			position: 'center',
			modal: true,
			buttons: {
				'Ok': function ()
				{
					$('#ScriptEditorMessage').dialog('close');
				},
			}
		});
		$('#ScriptEditorCreateMethod').dialog(
		{
			title: 'Enter Method Name',
			autoOpen: false,
			height: 'auto',
			width: '300px',
			position: 'center',
			modal: true,
			buttons: {
				'Ok': function ()
				{
					var name = $('#newMethodName').val();
					_ScriptEditor.setSelectedMethod(name, 'function ' + name + '(){\n\n console.log("got here"); \n\n}');
					$('#ScriptEditorCreateMethod').dialog('close');
				},
				'Cancel': function ()
				{
					$('#ScriptEditorCreateMethod').dialog('close');
				}
			}
		});
		$('#ScriptEditorCreateProperty').dialog(
		{
			title: 'Enter Method Name',
			autoOpen: false,
			height: 'auto',
			width: '300px',
			position: 'center',
			modal: true,
			buttons: {
				'Ok': function ()
				{
					var name = $('#newPropertyName').val();
					_ScriptEditor.setSelectedProperty(name, '"null"');
					_ScriptEditor.SavePropertyClicked();
					$('#ScriptEditorCreateProperty').dialog('close');
				},
				'Cancel': function ()
				{
					$('#ScriptEditorCreateProperty').dialog('close');
				}
			}
		});
		$('#ScriptEditorCreateEvent').dialog(
		{
			title: 'Enter Event Signiture',
			autoOpen: false,
			height: 'auto',
			width: '300px',
			position: 'center',
			modal: true,
			buttons: {
				'Ok': function ()
				{
					var name = $('#newEventName').val();
					name = name.substring(0, name.indexOf('('));
					name = $.trim(name);
					_ScriptEditor.setSelectedEvent(name, 'function ' + $('#newEventName').val() + '{\n\n console.log("got here"); \n\n}');
					$('#ScriptEditorCreateEvent').dialog('close');
				},
				'Cancel': function ()
				{
					$('#ScriptEditorCreateEvent').dialog('close');
				}
			}
		});
		$('#ScriptEditorTabs').tabs();
		$('#ScriptEditorTabs ul').css('background', 'lightgray');
		$('#methodlist').css('width', '180px');
		$('#eventlist').css('width', '180px');
		$('#propertylist').css('width', '180px');
		
		
		$('#methodlist').css('overflow-y', 'scroll');
		$('#eventlist').css('overflow-y', 'scroll');
		$('#propertylist').css('overflow-y', 'scroll');
		
		
		$('#saveEvent').css('position', 'absolute');
		$('#saveProperty').css('position', 'absolute');
		//$('#saveEvent').css('bottom','6px');
		$('#saveEvent').css('width', '175px');
		$('#saveProperty').css('width', '175px');
		//$('#saveEventCopy').css('position','absolute');
		$('#saveEventCopy').css('bottom', '10px');
		$('#saveEventCopy').css('width', '145px');
		//$('#saveMethodCopy').css('position','absolute');
		$('#saveMethodCopy').css('bottom', '10px');
		$('#saveMethodCopy').css('width', '145px');
		$('#saveMethod').css('position', 'absolute');
		//$('#saveMethod').css('bottom','6px');
		$('#saveMethod').css('width', '175px');
		$('#saveEventCopy').button(
		{
			label: 'Save in Inventory'
		});
		$('#saveMethodCopy').button(
		{
			label: 'Save in Inventory'
		});
		$('#saveEvent').button(
		{
			label: 'Save Event'
		});
		$('#saveProperty').button(
		{
			label: 'Save Property'
		});
		$('#saveMethod').button(
		{
			label: 'Save Method'
		});
		$('#callMethod').button(
		{
			label: 'Call Method'
		});
		$('#deleteMethod').button(
		{
			label: 'Delete Method'
		});
		$('#deleteProperty').button(
		{
			label: 'Delete Property'
		});
		$('#newMethod').button(
		{
			label: 'New Method'
		});
		$('#newProperty').button(
		{
			label: 'New Property'
		});
		$('#checkSyntaxEvent').button(
		{
			label: 'Check Code'
		});
		$('#checkSyntaxMethod').button(
		{
			label: 'Check Code'
		});
		$('#checkSyntaxMethod').css('float', 'right');
		$('#checkSyntaxEvent').css('float', 'right');
		$('#checkSyntaxMethod').css('margin-top', '3px');
		$('#checkSyntaxEvent').css('margin-top', '3px');
		$('#saveEventCopy').css('float', 'right');
		$('#saveMethodCopy').css('float', 'right');
		$('#saveMethodCopy').css('margin-top', '3px');
		$('#saveEventCopy').css('margin-top', '3px');
		$('#callMethod').css('float', 'right');
		$('#deleteMethod').css('float', 'right');
		$('#newMethod').css('float', 'right');
		$('#newProperty').css('float', 'right');
		$('#callMethod').css('margin-top', '3px');
		$('#deleteMethod').css('margin-top', '3px');
		$('#deleteProperty').css('margin-top', '3px');
		$('#newMethod').css('margin-top', '3px');
		$('#callEvent').button(
		{
			label: 'Trigger Event'
		});
		$('#deleteEvent').button(
		{
			label: 'Delete Event'
		});
		$('#newEvent').button(
		{
			label: 'New Event'
		});
		$('#callEvent').css('float', 'right');
		$('#deleteEvent').css('float', 'right');
		$('#newEvent').css('float', 'right');
		$('#callEvent').css('margin-top', '3px');
		$('#deleteEvent').css('margin-top', '3px');
		$('#deleteProperty').css('margin-top', '3px');
		$('#newEvent').css('margin-top', '3px');
		$('#methodtext,#eventtext,#propertytext').keydown(function (e)
		{
			var code = (e.keyCode ? e.keyCode : e.which);
			e.stopPropagation();
		});
		$('#saveMethodCopy').click(function (e)
		{
			if (!_ScriptEditor.checkMethodSyntax())
			{
				return
			}
			_InventoryManager.addScript(_ScriptEditor.methodEditor.getValue(), _ScriptEditor.selectedMethod, 'method');
		});
		$('#saveEventCopy').click(function (e)
		{
			if (!_ScriptEditor.checkEventSyntax())
			{
				return
			}
			_InventoryManager.addScript(_ScriptEditor.eventEditor.getValue(), _ScriptEditor.selectedEvent, 'event');
		});
		this.DeleteActiveMethod_imp = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			if (this.currentNode.methods && this.currentNode.methods[this.selectedMethod])
			{
				vwf_view.kernel.deleteMethod(_ScriptEditor.currentNode.id, this.selectedMethod);
				window.setTimeout(function ()
				{
					_ScriptEditor.currentNode = vwf.getNode(_ScriptEditor.currentNode.id);
					_ScriptEditor.BuildGUI();
				}, 500);
			}
		}
		this.DeleteActiveProperty_imp = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			if (this.currentNode.properties && this.currentNode.properties[this.selectedProperty])
			{
				vwf_view.kernel.deleteProperty(_ScriptEditor.currentNode.id, this.selectedProperty);
				window.setTimeout(function ()
				{
					_ScriptEditor.currentNode = vwf.getNode(_ScriptEditor.currentNode.id);
					_ScriptEditor.BuildGUI();
				}, 500);
			}
		}
		this.DeleteActiveMethod = function ()
		{
			$('#ScriptEditorDeleteMethod').dialog('open');
		}
		this.DeleteActiveProperty = function ()
		{
			$('#ScriptEditorDeleteProperty').dialog('open');
		}
		this.CallActiveMethod = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			vwf_view.kernel.callMethod(_ScriptEditor.currentNode.id, _ScriptEditor.selectedMethod);
		}
		this.checkMethodSyntaxClick = function ()
		{
			if (_ScriptEditor.checkMethodSyntax())
			{
				$('#ScriptEditorMessage').text('This script contains no syntax errors.');
				$('#ScriptEditorMessage').dialog('open');
			}
		}
		this.checkMethodSyntax = function ()
		{
			var s = _ScriptEditor.methodEditor.getSession().getAnnotations();
			var errors = "";
			for (var i = 0; i < s.length; i++)
			{
				if (s[i].type == 'error') errors += "<br/> line: " + s[i].row + "-" + s[i].text;
			}
			if (errors != "")
			{
				$('#ScriptEditorMessage').text('This script contains syntax errors, and cannot be saved. The errors are: \n' + errors.toString());
				$('#ScriptEditorMessage').dialog('open');
				return false;
			}
			return true;
		}
		this.DeleteActiveEvent_imp = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			if (this.currentNode.events && this.currentNode.events[this.selectedEvent])
			{
				vwf_view.kernel.deleteEvent(_ScriptEditor.currentNode.id, this.selectedEvent);
				window.setTimeout(function ()
				{
					_ScriptEditor.currentNode = vwf.getNode(_ScriptEditor.currentNode.id);
					_ScriptEditor.BuildGUI();
				}, 500);
			}
		}
		this.checkPermission = function ()
		{
			if (!_UserManager.GetCurrentUserName())
			{
				_Notifier.notify('You must log in to edit scripts');
				return false;
			}
			
			if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(),_ScriptEditor.currentNode.id) == 0)
			{
				_Notifier.notify('You do not have permission to script this object');
				return false;
			}
			return true;
		}
		this.DeleteActiveEvent = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			$('#ScriptEditorDeleteEvent').dialog('open');
		}
		this.CallActiveEvent = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			vwf_view.kernel.fireEvent(_ScriptEditor.currentNode.id, _ScriptEditor.selectedEvent);
		}
		this.checkEventSyntaxClick = function ()
		{
			if (_ScriptEditor.checkEventSyntax())
			{
				$('#ScriptEditorMessage').text('This script contains no syntax errors.');
				$('#ScriptEditorMessage').dialog('open');
			}
		}
		this.checkEventSyntax = function ()
		{
			var s = _ScriptEditor.eventEditor.getSession().getAnnotations();
			var errors = "";
			for (var i = 0; i < s.length; i++)
			{
				if (s[i].type == 'error') errors += "<br/> line: " + s[i].row + "-" + s[i].text;
			}
			if (errors != "")
			{
				$('#ScriptEditorMessage').text('This script contains syntax errors, and cannot be saved. The errors are: \n' + errors.toString());
				$('#ScriptEditorMessage').dialog('open');
				return false;
			}
			return true;
		}
		this.NewMethod = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			if (_ScriptEditor.MethodChanged) _ScriptEditor.PromptAbandon(function ()
				{
					_ScriptEditor.MethodChanged = false;
					$('#ScriptEditorCreateMethod').dialog('open');
				});
			else $('#ScriptEditorCreateMethod').dialog('open');
		}
		this.NewEvent = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			if (_ScriptEditor.EventChanged) _ScriptEditor.PromptAbandon(function ()
				{
					_ScriptEditor.EventChanged = false;
					$('#ScriptEditorCreateEvent').dialog('open');
				});
			else $('#ScriptEditorCreateEvent').dialog('open');
		}
		this.NewProperty = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			if (_ScriptEditor.PropertyChanged) _ScriptEditor.PromptAbandon(function ()
				{
					_ScriptEditor.PropertyChanged = false;
					$('#ScriptEditorCreateProperty').dialog('open');
				});
			else $('#ScriptEditorCreateProperty').dialog('open');
		}
		this.MethodChange = function ()
		{
			if (!_ScriptEditor.selectedMethod) return false;
			_ScriptEditor.MethodChanged = true;
			$('#methodtext').css('border-color', 'red');
			return true;
		}
		this.EventChange = function ()
		{
			if (!_ScriptEditor.selectedEvent) return false;
			_ScriptEditor.EventChanged = true;
			$('#eventtext').css('border-color', 'red');
			return true;
		}
		this.PropertyChange = function ()
		{
			if (!_ScriptEditor.selectedProperty) return false;
			_ScriptEditor.PropertyChanged = true;
			$('#propertytext').css('border-color', 'red');
			return true;
		}
		$('#deleteMethod').click(this.DeleteActiveMethod);
		$('#deleteProperty').click(this.DeleteActiveProperty);
		$('#callMethod').click(this.CallActiveMethod);
		$('#checkSyntaxMethod').click(this.checkMethodSyntaxClick);
		$('#deleteEvent').click(this.DeleteActiveEvent);
		$('#callEvent').click(this.CallActiveEvent);
		$('#checkSyntaxEvent').click(this.checkEventSyntaxClick);
		$('#newMethod').click(this.NewMethod);
		$('#newEvent').click(this.NewEvent);
		$('#newProperty').click(this.NewProperty);
		$('#methodtext').keyup(this.MethodChange);
		$('#eventtext').keyup(this.EventChange);
		$('#propertytext').keyup(this.PropertyChange);
		this.show = function ()
		{
			//window.clearInterval(window.scripthideinterval);
			if (!this.isOpen())
			{
				//window.scripthideinterval = window.setInterval(function(){
				//		$('#ScriptEditorTabs').css('height',$('#ScriptEditor').height() + 'px');
				//		$('#index-vwf').css('height',window.innerHeight - $('#smoothmenu1').height() - $('#statusbar').height() - //$('#toolbar').height() - ($(window).height() - $('#ScriptEditor').offset().top-25) + 'px');
				//		_Editor.findscene().camera.setAspect($('#index-vwf').width()/$('#index-vwf').height());
				//		
				//	},33);
				//$('#ScriptEditor').show('slide',{direction:'down'},function(){window.clearInterval(window.scripthideinterval);window.scripthideinterval=null;});
				$('#ScriptEditor').show();
				var newtop = $(window).height() - $('#ScriptEditor').height() - $('#statusbar').height() + 'px';
				console.log(newtop);
				$('#ScriptEditor').animate(
				{
					'top': newtop
				},
				{
					step: function ()
					{
						$('#ScriptEditorTabs').css('height', $('#ScriptEditor').height() + 'px');
						var newheight = window.innerHeight - $('#smoothmenu1').height() - $('#statusbar').height() - $('#toolbar').height() - ($(window).height() - $('#ScriptEditor').offset().top - 25) + 'px';
						console.log(newheight);
						$('#index-vwf').css('height', newheight);
						_Editor.findcamera().aspect = ($('#index-vwf').width() / $('#index-vwf').height());
						_Editor.findcamera().updateProjectionMatrix();
					},
					complete: function ()
					{
						_ScriptEditor.resize();
					}
				});
				_ScriptEditor.BuildGUI();
				_ScriptEditor.open = true;
			}
		}
		this.hide = function ()
		{
			//$('#ScriptEditor').dialog('close');
			//window.clearInterval(window.scripthideinterval);
			//window.scripthideinterval = window.setInterval(function(){
			//		$('#ScriptEditorTabs').css('height',$('#ScriptEditor').height() + 'px');
			//		$('#index-vwf').css('height',window.innerHeight - $('#smoothmenu1').height() - $('#statusbar').height() - //$('#toolbar').height() - ($(window).height() - $('#ScriptEditor').offset().top-25) + 'px');
			//		_Editor.findscene().camera.setAspect($('#index-vwf').width()/$('#index-vwf').height());
			//		
			//	},33);
			//$('#ScriptEditor').hide('slide',{direction:'down'},function(){ window.clearInterval(window.scripthideinterval);window.scripthideinterval=null;});
			if (this.isOpen())
			{
				$('#ScriptEditor').animate(
				{
					'top': $(window).height() + 'px'
				},
				{
					step: function ()
					{
						$('#ScriptEditorTabs').css('height', $('#ScriptEditor').height() + 'px');
						$('#index-vwf').css('height', window.innerHeight - $('#smoothmenu1').height() - $('#statusbar').height() - $('#toolbar').height() - ($(window).height() - $('#ScriptEditor').offset().top - 25) + 'px');
						_Editor.findcamera().aspect = ($('#index-vwf').width() / $('#index-vwf').height());
						_Editor.findcamera().updateProjectionMatrix();
					},
					complete: function ()
					{
						$('#ScriptEditor').hide();
					}
				});
			}
		}
		this.isOpen = function ()
		{
			//return $("#ScriptEditor").dialog( "isOpen" );
			return $('#ScriptEditor').is(':visible');
		}
		this.PostSaveMethod = function ()
		{
			_ScriptEditor.currentNode = vwf.getNode(_ScriptEditor.currentNode.id);
			_ScriptEditor.MethodChanged = false;
			$('#methodtext').css('border-color', 'black');
			_ScriptEditor.BuildGUI(true);
		}
		this.SaveMethodClicked = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			if (!_ScriptEditor.MethodChanged) return;
			if (!_ScriptEditor.checkMethodSyntax())
			{
				//show dialog;
				return false;
			}
			var methodname = $.trim(_ScriptEditor.selectedMethod);
			var rawtext = _ScriptEditor.methodEditor.getValue();
			var params = rawtext.substring(rawtext.indexOf('(') + 1, rawtext.indexOf(')'));
			params = params.split(',');
			var cleanParams = [];
			for (var i = 0; i < params.length; i++)
			{
				params[i] = $.trim(params[i]);
				if (params[i] != '' && params[i] != null && params[i] !== undefined) cleanParams.push(params[i]);
			}
			var body = rawtext.substring(rawtext.indexOf('{') + 1, rawtext.lastIndexOf('}'));
			body = $.trim(body);
			//body = body.replace(/\s*\n\s+/gm,'\n');
			if (_ScriptEditor.currentNode.methods && _ScriptEditor.currentNode.methods[methodname])
			{
				vwf_view.kernel.deleteMethod(_ScriptEditor.currentNode.id, methodname);
			}
			vwf_view.kernel.createMethod(_ScriptEditor.currentNode.id, methodname, cleanParams, body);
			window.setTimeout(_ScriptEditor.PostSaveMethod, 500);
			return true;
		}
		$('#saveMethod').click(this.SaveMethodClicked);
		this.PostSaveEvent = function ()
		{
			_ScriptEditor.currentNode = vwf.getNode(_ScriptEditor.currentNode.id);
			_ScriptEditor.EventChanged = false;
			$('#eventtext').css('border-color', 'black');
			_ScriptEditor.BuildGUI(true);
		}
		this.SaveEventClicked = function ()
		{
			if (!_ScriptEditor.checkPermission()) return;
			if (!_ScriptEditor.EventChanged) return;
			if (!_ScriptEditor.checkEventSyntax())
			{
				//show dialog;
				return false;
			}
			var eventname = _ScriptEditor.selectedEvent;
			eventname = $.trim(eventname);
			var rawtext = _ScriptEditor.eventEditor.getValue();
			var params = rawtext.substring(rawtext.indexOf('(') + 1, rawtext.indexOf(')'));
			params = params.split(',');
			var cleanParams = [];
			for (var i = 0; i < params.length; i++)
			{
				params[i] = $.trim(params[i]);
				if (params[i] != '' && params[i] != null && params[i] !== undefined) cleanParams.push(params[i]);
			}
			var body = rawtext.substring(rawtext.indexOf('{') + 1, rawtext.lastIndexOf('}'));
			body = $.trim(body);
			if (_ScriptEditor.currentNode.events && _ScriptEditor.currentNode.events[eventname])
			{
				vwf_view.kernel.deleteEvent(_ScriptEditor.currentNode.id, eventname);
			}
			vwf_view.kernel.createEvent(_ScriptEditor.currentNode.id, eventname, cleanParams, body);
			window.setTimeout(_ScriptEditor.PostSaveEvent, 500);
			return true;
		}
		$('#saveEvent').click(this.SaveEventClicked);
		
		
		this.PostSaveProperty = function ()
		{
			_ScriptEditor.currentNode = vwf.getNode(_ScriptEditor.currentNode.id);
			_ScriptEditor.PropertyChanged = false;
			$('#propertytext').css('border-color', 'black');
			_ScriptEditor.BuildGUI(true);
		}
		this.SavePropertyClicked = function ()
		{
			
			if (!_ScriptEditor.checkPermission()) return;
			if (!_ScriptEditor.PropertyChanged) return;
			
			var propertyname = _ScriptEditor.selectedProperty;
			propertyname = $.trim(propertyname);
			var rawtext = _ScriptEditor.propertyEditor.getValue();
			var val = rawtext;
			try{val = JSON.parse(rawtext)}catch(e){
			
				if(!isNaN(parseFloat(rawtext)))
					val = parseFloat(rawtext)
				else
				{
					if(rawtext == 'true')
						val = true;
					if(rawtext == 'false')
						val = false;
				}
			
			}
			vwf_view.kernel.setProperty(_ScriptEditor.currentNode.id, propertyname, val);
			window.setTimeout(_ScriptEditor.PostSaveProperty, 500);
			return true;
		}
		$('#saveProperty').click(this.SavePropertyClicked);
		
		
		
		
		
		this.PromptAbandon = function (callback)
		{
			$('#ScriptEditorAbandonChanges').dialog('open');
			_ScriptEditor.AbandonChangesCallback = callback;
		}
		this.setSelectedMethod_internal = function (name, text)
		{
		
			if (this.currentNode.methods && this.currentNode.methods[name])
			{
				_ScriptEditor.MethodChanged = false;
				$('#methodtext').css('border-color', 'black');
			}
			else
			{
				_ScriptEditor.MethodChanged = true;
				$('#methodtext').css('border-color', 'red');
			}
			_ScriptEditor.selectedMethod = name;
			_ScriptEditor.methodEditor.setValue(js_beautify(text,{braces_on_own_line:true,opt_keep_array_indentation:true}));
			_ScriptEditor.methodEditor.selection.clearSelection();
			//$('#methodtextback').text(_ScriptEditor.formatScript(indentedtext));
			$('#methodtext').find(".ace_content").css('background', 'url(vwf/view/editorview/images/stripe.png) 100% 100% repeat');
			$('#methodtext').removeAttr('disabled');
		}
		this.setSelectedMethod = function (name, text)
		{
			if (_ScriptEditor.MethodChanged) _ScriptEditor.PromptAbandon(function ()
				{
					_ScriptEditor.setSelectedMethod_internal(name, text);
				})
			else _ScriptEditor.setSelectedMethod_internal(name, text);
		}
		
		this.setSelectedProperty_internal = function (name, text)
		{
		
			if (this.currentNode.properties && this.currentNode.properties[name])
			{
				_ScriptEditor.PropertyChanged = false;
				$('#propertytext').css('border-color', 'black');
			}
			else
			{
				_ScriptEditor.PropertyChanged = true;
				$('#propertytext').css('border-color', 'red');
			}
			_ScriptEditor.selectedProperty = name;
			_ScriptEditor.propertyEditor.setValue(js_beautify(text.toString(),{braces_on_own_line:true,opt_keep_array_indentation:true}));
			_ScriptEditor.propertyEditor.selection.clearSelection();
			//$('#methodtextback').text(_ScriptEditor.formatScript(indentedtext));
			$('#propertytext').find(".ace_content").css('background', 'url(vwf/view/editorview/images/stripe.png) 100% 100% repeat');
			$('#propertytext').removeAttr('disabled');
		}
		this.setSelectedProperty = function (name, text)
		{
			if (_ScriptEditor.PropertyChanged) _ScriptEditor.PromptAbandon(function ()
				{
					_ScriptEditor.setSelectedProperty_internal(name, text);
				})
			else _ScriptEditor.setSelectedProperty_internal(name, text);
		}
		this.setSelectedEvent_internal = function (name, text)
		{
			if (this.currentNode.events && this.currentNode.events[name])
			{
				_ScriptEditor.EventChanged = false;
				$('#eventtext').css('border-color', 'black');
			}
			else
			{
				_ScriptEditor.EventChanged = true;
				$('#eventtext').css('border-color', 'red');
			}
			_ScriptEditor.selectedEvent = name;
			_ScriptEditor.eventEditor.setValue(js_beautify(text,{braces_on_own_line:true,opt_keep_array_indentation:true}));
			_ScriptEditor.eventEditor.selection.clearSelection();
			//$('#eventtextback').text(_ScriptEditor.formatScript(text));
			$('#eventtext').find(".ace_content").css('background', 'url(vwf/view/editorview/images/stripe.png) 100% 100% repeat');
			$('#eventtext').removeAttr('disabled');
		}
		this.setSelectedEvent = function (name, text)
		{
			if (_ScriptEditor.EventChanged) _ScriptEditor.PromptAbandon(function ()
				{
					_ScriptEditor.setSelectedEvent_internal(name, text);
				})
			else _ScriptEditor.setSelectedEvent_internal(name, text);
		}
		this.NodeHasProperty = function (name)
		{
			if (!_ScriptEditor.currentNode) return false;
			var node = vwf.models[0].model.nodes[_ScriptEditor.currentNode.id];
			while (node)
			{
				var props = node.properties;
				if (node);
				for (var i in node)
				{
					if (name == i) return true;
				}
				node = node.proto;
			}
			return false;
		}
		this.BuildGUI = function (refresh)
		{
			if (!refresh)
			{
				this.selectedMethod = null;
				this.selectedEvent = null;
				this.MethodChanged = false;
				this.EventChanged = false;
				$('#eventtext').css('border-color', 'black');
				$('#methodtext').css('border-color', 'black');
				$('#methodtext').attr('disabled', 'disabled');
				$('#propertytext').attr('disabled', 'disabled');
				$('#eventtext').attr('disabled', 'disabled');
				$('#eventtext').find(".ace_content").css('background', 'url(vwf/view/editorview/images/ui-bg_diagonals-thick_8_cccccc_40x40.png) 50% 50% repeat');
				$('#methodtext').find(".ace_content").css('background', 'url(vwf/view/editorview/images/ui-bg_diagonals-thick_8_cccccc_40x40.png) 50% 50% repeat');
				$('#propertytext').find(".ace_content").css('background', 'url(vwf/view/editorview/images/ui-bg_diagonals-thick_8_cccccc_40x40.png) 50% 50% repeat');
				_ScriptEditor.eventEditor.setValue('');
				_ScriptEditor.methodEditor.setValue('');
			}
			if (!this.currentNode) return;
			$('#methodlist').empty();
			$('#eventlist').empty();
			$('#propertylist').empty();
			var style = "cursor:pointer;font-size: 1.5em;border: 1px solid gray;border-radius: 5px;box-shadow: 0px 0px 20px lightgray inset;margin: 2px;padding: 3px;"
			var newstyle = "cursor:pointer;font-size: 1.5em;border: 2px solid gray;border-radius: 5px;box-shadow: 0px 0px 20px gray inset;margin: 2px;padding: 3px;"
			var lightstyle = "color:lightgray;cursor:pointer;font-size: 1.5em;border: 0px solid lightgray;border-radius: 5px;box-shadow: 0px 0px 20px #EEEEEE inset;margin: 2px;padding: 3px;"
			for (var i in this.currentNode.methods)
			{
				$('#methodlist').append('<div class="scriptchoice" style="' + style + '" id="method' + i + '"></div>');
				$('#method' + i).text(i);
				$('#method' + i).qtip(
				{
					content: "Edit the " + i + " method",
					show: {
						delay: 1000
					}
				});
				$('#method' + i).attr('method', i);
				$('#method' + i).click(function ()
				{
					$("#methodlist").children().css('border-color', 'gray');
					$(this).css('border-color', 'blue');
					var method = $(this).attr('method');
					_ScriptEditor.setSelectedMethod(method, "function " + method + "()\n{\n" + _ScriptEditor.currentNode.methods[method] + "\n}");
				});
				if (refresh)
				{
					if (this.selectedMethod == i)
					{
						$('#method' + i).click();
					}
				}
			}
			for (var i in this.currentNode.properties)
			{
				$('#propertylist').append('<div class="scriptchoice" style="' + style + '" id="property' + i + '"></div>');
				$('#property' + i).text(i);
				$('#property' + i).qtip(
				{
					content: "Edit the " + i + " property",
					show: {
						delay: 1000
					}
				});
				$('#property' + i).attr('property', i);
				$('#property' + i).click(function ()
				{
					$("#propertylist").children().css('border-color', 'gray');
					$(this).css('border-color', 'blue');
					var property = $(this).attr('property');
					var val = _ScriptEditor.currentNode.properties[property];
					if(typeof(val) == 'object')
						val = JSON.stringify(val);
					_ScriptEditor.setSelectedProperty(property, val );
				});
				if (refresh)
				{
					if (this.selectedMethod == i)
					{
						$('#property' + i).click();
					}
				}
			}
			for (var i in this.currentNode.events)
			{
				$('#eventlist').append('<div  style="' + style + '"  id="event' + i + '"></div>');
				$('#event' + i).text(i);
				$('#event' + i).attr('event', i);
				$('#event' + i).qtip(
				{
					content: "Edit the " + i + " event",
					show: {
						delay: 1000
					}
				});
				$('#event' + i).click(function ()
				{
					$("#eventlist").children().css('border-color', 'gray');
					$(this).css('border-color', 'blue');
					var event = $(this).attr('event');
					var params = "";
					for (var j in _ScriptEditor.currentNode.events[event].parameters)
					{
						params += _ScriptEditor.currentNode.events[event].parameters[j] + ','
					}
					var eventstring = 'function ' + event + '(';
					for (var i in _ScriptEditor.currentNode.events[event].parameters)
					{
						eventstring += _ScriptEditor.currentNode.events[event].parameters[i] + ',';
					}
					eventstring = eventstring.substring(0, eventstring.length - 1);
					eventstring += ')\n{\n' + _ScriptEditor.currentNode.events[event].body + '\n}';
					_ScriptEditor.setSelectedEvent(event, eventstring);
				});
				if (refresh)
				{
					if (this.selectedEvent == i)
					{
						$('#event' + i).click();
					}
				}
			}
			if (!this.currentNode.methods || (this.currentNode.methods && !this.currentNode.methods['tick']))
			{
				$('#methodlist').append('<div class="scriptchoice" style="' + lightstyle + '" id="methodtick"></div>');
				$('#methodtick').text('tick');
				$('#methodtick').attr('method', 'tick');
				$('#methodtick').qtip(
				{
					content: "Create the tick method.",
					show: {
						delay: 1000
					}
				});
				$('#methodtick').click(function ()
				{
					$("#methodlist").children().css('border-color', 'gray');
					$(this).css('border-color', 'blue');
					var method = $(this).attr('method');
					_ScriptEditor.setSelectedMethod(method, 'function tick(){\n\n console.log("this is called every 20th of a second"); \n\n}');
				});
			}
			if (!this.currentNode.methods || (this.currentNode.methods && !this.currentNode.methods['initialize']))
			{
				$('#methodlist').append('<div class="scriptchoice" style="' + lightstyle + '" id="methodinitialize"></div>');
				$('#methodinitialize').text('initialize');
				$('#methodinitialize').attr('method', 'initialize');
				$('#methodinitialize').qtip(
				{
					content: "Create the initialize method.",
					show: {
						delay: 1000
					}
				});
				$('#methodinitialize').click(function ()
				{
					$("#methodinitialize").children().css('border-color', 'gray');
					$(this).css('border-color', 'blue');
					var method = $(this).attr('method');
					_ScriptEditor.setSelectedMethod(method, 'function initialize(){\n\n console.log("this is called when the objects is created"); \n\n}');
				});
			}
			if (!this.currentNode.methods || (this.currentNode.methods && !this.currentNode.methods['deinitialize']))
			{
				$('#methodlist').append('<div class="scriptchoice" style="' + lightstyle + '" id="methoddeinitialize"></div>');
				$('#methoddeinitialize').text('deinitialize');
				$('#methoddeinitialize').attr('method', 'deinitialize');
				$('#methoddeinitialize').qtip(
				{
					content: "Create the deinitialize method.",
					show: {
						delay: 1000
					}
				});
				$('#methoddeinitialize').click(function ()
				{
					$("#methoddeinitialize").children().css('border-color', 'gray');
					$(this).css('border-color', 'blue');
					var method = $(this).attr('method');
					_ScriptEditor.setSelectedMethod(method, 'function deinitialize(){\n\n console.log("this is called when the object is destroyed"); \n\n}');
				});
			}
			if (!this.currentNode.methods || (this.currentNode.methods && !this.currentNode.methods['prerender']))
			{
				$('#methodlist').append('<div class="scriptchoice" style="' + lightstyle + '" id="methodprerender"></div>');
				$('#methodprerender').text('prerender');
				$('#methodprerender').attr('method', 'prerender');
				$('#methodprerender').qtip(
				{
					content: "Create the prerender method.",
					show: {
						delay: 1000
					}
				});
				$('#methodprerender').click(function ()
				{
					$("#methodprerender").children().css('border-color', 'gray');
					$(this).css('border-color', 'blue');
					var method = $(this).attr('method');
					_ScriptEditor.setSelectedMethod(method, 'function prerender(){\n\n console.log("this is called when a frame is rendered. Careful, you can break sync here!"); \n\n}');
				});
			}
			var pointersugs = ['pointerDown', 'pointerUp', 'pointerOver', 'pointerOut', 'pointerClick', 'pointerMove', 'keyDown', 'keyUp', 'keyPress'];
			for (var i in pointersugs)
			{
				if (!this.currentNode.events || (this.currentNode.events && !this.currentNode.events[pointersugs[i]]))
				{
					var name = pointersugs[i];
					$('#eventlist').append('<div class="scriptchoice" style="' + lightstyle + '" id="event' + name + '"></div>');
					$('#event' + name).text(name);
					$('#event' + name).qtip(
					{
						content: "Create the " + name + " event.",
						show: {
							delay: 1000
						}
					});
					$('#event' + name).attr('event', name);
					$('#event' + name).click(function ()
					{
						$("#eventlist").children().css('border-color', 'gray');
						$(this).css('border-color', 'blue');
						var event = $(this).attr('event');
						_ScriptEditor.setSelectedEvent(event, 'function ' + event + '(eventData,nodeData){\n\n console.log("got here"); \n\n}');
					});
				}
			}
		}
		this.changeSelection = function (node)
		{
			if (node && this.isOpen())
			{
				if (!this.currentNode || (this.currentNode.id != node.id))
				{
					this.currentNode = node;
					this.BuildGUI();
				}
				else
				{
					this.BuildGUI(true);
				}
			}
			else
			{
				if (this.isOpen()) this.hide();
			}
		}
		this.SelectionChanged = function (e, node)
		{
			if (!this.isOpen())
			{
				_ScriptEditor.currentNode = node
				return;
			}
			try
			{
				if ((this.MethodChanged || this.EventChanged) && ((node && this.currentNode && node.id != this.currentNode.id) || (!node && this.currentNode)))
				{
					$('#ScriptEditorAbandonChanges').text('You have selected a new object, but you have unsaved changes on this script. Do you want to abandon these changes? If you choose not to, your changes will remain in the editor, but the script editor will show properties for the previoiusly selected node, not the newly selected one.');
					this.PromptAbandon(function ()
					{
						this.changeSelection(node)
					});
				}
				else
				{
					this.changeSelection(node);
				}
			}
			catch (e)
			{
				console.log(e);
			}
		}
		$(document).bind('selectionChanged', this.SelectionChanged.bind(this));
		this.methodEditor = ace.edit("methodtext");
		this.methodEditor.setTheme("ace/theme/chrome");
		this.methodEditor.getSession().setMode("ace/mode/javascript");
		this.eventEditor = ace.edit("eventtext");
		this.eventEditor.setTheme("ace/theme/chrome");
		this.eventEditor.getSession().setMode("ace/mode/javascript");
		this.methodEditor.setPrintMarginColumn(false);
		this.methodEditor.setFontSize('15px');
		this.eventEditor.setPrintMarginColumn(false);
		this.eventEditor.setFontSize('15px');
		
		this.propertyEditor = ace.edit("propertytext");
		this.propertyEditor.setTheme("ace/theme/chrome");
		this.propertyEditor.getSession().setMode("ace/mode/javascript");
		this.propertyEditor.setPrintMarginColumn(false);
		this.propertyEditor.setFontSize('15px');
		$('#ScriptEditor').hide();
		$('#ScriptEditor').css('height', '405px');
	}
});