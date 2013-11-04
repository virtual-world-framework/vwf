define(function ()
{
	var PrimEditor = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(PrimEditor);
				isInitialized = true;
			}
			return PrimEditor;
		}
	}

	function initialize()
	{
		$(document.body).append("<div id='ShareWithDialog'> <select id='ShareWithNames'/> </div>");
		this.propertyEditorDialogs = [];
		$('#ShareWithDialog').dialog(
		{
			title: "Share With User",
			autoOpen: false,
			moveable: false,
			modal: true,
			resizable: false,
			resizable: false,
			open: function ()
			{
				$('#ShareWithNames').empty();
				for (var i = 0; i < document.Players.length; i++)
				{
					$('#ShareWithNames').append("<option value='" + document.Players[i] + "'>" + document.Players[i] + "</option>");
				}
				if (!_Editor.GetSelectedVWFNode())
				{
					_Notifier.notify('No object selected');
					$('#ShareWithDialog').dialog('close');
				}
			},
			buttons: {
				Ok: function ()
				{
					var owner = vwf.getProperty(_Editor.GetSelectedVWFNode().id, 'owner');
					if (typeof owner === "string") owner = [owner];
					owner = owner.slice(0);
					owner.push($('#ShareWithNames').val());
					_Editor.setProperty(_Editor.GetSelectedVWFNode().id, 'owner', owner);
					$('#ShareWithDialog').dialog('close');
				},
				Cancel: function ()
				{
					$('#ShareWithDialog').dialog('close');
				}
			}
		});
		$('#sidepanel').append("<div id='PrimitiveEditor'>" 
		+ "<div id='primeditortitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span id='primeditortitletext' class='ui-dialog-title' id='ui-dialog-title-Players'>Object Properties</span></div>" +
		'<div id="accordion" style="height:100%;overflow:hidden">' +
		'<h3><a href="#">Flags</a></h3>' +
		'<div>' +
		"<div id='otherprops'>" +
		"<input class='TransformEditorInput' style='width:50%;margin: 7px 2px 6px 0px;text-align: center;vertical-align: middle;' type='text' id='dispName'>Name</input><br/>" +
		"<input disabled='disabled' class='TransformEditorInput' style='width:50%;margin: 7px 2px 6px 0px;text-align: center;vertical-align: middle;' type='text' id='dispOwner'>Owners</input><br/>" +
		
		"<input style='margin: 7px 2px 6px 0px;text-align: center;vertical-align: middle;' type='checkbox' id='isVisible'>Visible</input><br/>" +
		"<input style='margin: 7px 2px 6px 0px;text-align: center;vertical-align: middle;' type='checkbox' id='isStatic'>Static</input><br/>" +
		"<input style='margin: 7px 2px 6px 0px;text-align: center;vertical-align: middle;' type='checkbox' id='isDynamic'>Dynamic</input><br/>" +
		"<input style='margin: 7px 2px 6px 0px;text-align: center;vertical-align: middle;' type='checkbox' id='castShadows'>Cast Shadows</input><br/>" +
		"<input style='margin: 7px 2px 6px 0px;text-align: center;vertical-align: middle;' type='checkbox' id='receiveShadows'>Receive Shadows</input><br/>" +
		"<input style='margin: 7px 2px 6px 0px;text-align: center;vertical-align: middle;' type='checkbox' id='passable'>Passable</input><br/>" +
		"</div>" +
		'</div>' +
		'<h3><a href="#">Transforms</a></h3>' +
		'<div>' +
		"<div class='EditorLabel'>Translation</div>" +
		"<div id='Translation'>" +
		"<input type='number' step='.001' class='TransformEditorInput' id='PositionX'/>" +
		"<input type='number' step='.001' class='TransformEditorInput' id='PositionY'/>" +
		"<input type='number' step='.001' class='TransformEditorInput' id='PositionZ'/>" +
		"</div>" + "<div class='EditorLabel'>Rotation</div>" +
		"<div id='Rotation'>" +
		"<input type='number' class='TransformEditorInput' id='RotationX'/>" +
		"<input type='number' class='TransformEditorInput' id='RotationY'/>" +
		"<input type='number' class='TransformEditorInput' id='RotationZ'/>" +
		"<input type='number' class='TransformEditorInput' id='RotationW'/>" +
		"</div>" +
		"<div class='EditorLabel'>Scale</div>" +
		"<div id='Scale'>" +
		"<input type='number' class='TransformEditorInput' id='ScaleX'/>" +
		"<input type='number' class='TransformEditorInput' id='ScaleY'/>" +
		"<input type='number' class='TransformEditorInput' id='ScaleZ'/>" +
		"</div>" +
		'</div>' +
		'</div>');
		$('#primeditortitle').append('<a id="primitiveeditorclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
		$('#primeditortitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/properties.png" />');
		$('#primitiveeditorclose').click(function ()
		{
			_PrimitiveEditor.hide();
		});
		
		$('#isStatic').change(function (e)
		{
			_PrimitiveEditor.setProperty('selection', 'isStatic', this.checked)
		});
		$('#isVisible').change(function (e)
		{
			_PrimitiveEditor.setProperty('selection', 'visible', this.checked)
		});
		$('#isDynamic').change(function (e)
		{
			_PrimitiveEditor.setProperty('selection', 'isDynamic', this.checked)
		});
		$('#castShadows').change(function (e)
		{
			_PrimitiveEditor.setProperty('selection', 'castShadows', this.checked)
		});
		$('#receiveShadows').change(function (e)
		{
			_PrimitiveEditor.setProperty('selection', 'receiveShadows', this.checked)
		});
		$('#passable').change(function (e)
		{
			_PrimitiveEditor.setProperty('selection', 'passable', this.checked)
		});
		$('#dispName').blur(function (e)
		{
			if (vwf.getProperty(_Editor.GetSelectedVWFNode().id, 'DisplayName') === undefined)
			{
				vwf.createProperty(_Editor.GetSelectedVWFNode().id, 'DisplayName', $(this).val());
			}
			_PrimitiveEditor.setProperty(_Editor.GetSelectedVWFNode().id, 'DisplayName', $(this).val());
		});
		$('#PrimitiveEditor').css('border-bottom', '5px solid #444444')
		$('#PrimitiveEditor').css('border-left', '2px solid #444444')
		//$('#PrimitiveEditor').resizable({
		//    maxHeight: 550,
		//    maxWidth: 320,
		//    minHeight: 150,
		//    minWidth: 320
		//});
		//$('#PrimitiveEditor').dialog({title:'Primitive Editor',autoOpen:false, 
		//	resize:function(){
		//		$( "#accordion" ).accordion( "resize" );
		//		this.updateOtherWindows();
		//	}.bind(this),
		//	close:function(){
		//		this.updateOtherWindows();
		//	}.bind(this)
		//});
		$("#accordion").accordion(
		{
			fillSpace: true,
			heightStyle: "content",
			change: function ()
			{
				if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
			}
		});
		$(".ui-accordion-content").css('height', 'auto');
		this.show = function ()
		{
			//$('#PrimitiveEditor').dialog('open');
			//$('#PrimitiveEditor').dialog('option','position',[1282,40]);
			$('#PrimitiveEditor').prependTo($('#PrimitiveEditor').parent());
			$('#PrimitiveEditor').show('blind', function ()
			{
				if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
			});
			showSidePanel();
			this.SelectionChanged(null, _Editor.GetSelectedVWFNode());
			this.open = true;
		}
		this.hide = function ()
		{
			//$('#PrimitiveEditor').dialog('close');
			if (this.isOpen())
			{
				$('#PrimitiveEditor').hide('blind', function ()
				{
					if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
					if (!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible')) hideSidePanel();
				});
			}
		}
		this.isOpen = function ()
		{
			//return $("#PrimitiveEditor").dialog( "isOpen" )
			return $('#PrimitiveEditor').is(':visible')
		}
		this.setProperty = function (id, prop, val)
		{
			if(document.PlayerNumber == null)
			{
			_Notifier.notify('You must log in to participate');
			return;
			}
			if (id != 'selection')
			{
				if(_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(),id) == 0)
				{
				_Notifier.notify('You do not have permission to edit this object');
				return;
				}
				vwf_view.kernel.setProperty(id, prop, val)
			}
			if (id == 'selection')
			{
				console.log(_Editor.getSelectionCount());
				for (var k = 0; k < _Editor.getSelectionCount(); k++)
				{
					if(_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(),_Editor.GetSelectedVWFNode(k).id) == 0)
					{
					_Notifier.notify('You do not have permission to edit this object');
					continue;
					}
					vwf_view.kernel.setProperty(_Editor.GetSelectedVWFNode(k).id, prop, val)
				}
			}
		}
		
		this.callMethod = function (id, method)
		{
			if(document.PlayerNumber == null)
			{
			_Notifier.notify('You must log in to participate');
			return;
			}
			if (id != 'selection')
			{
				if(_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(),id) == 0)
				{
				_Notifier.notify('You do not have permission to edit this object');
				return;
				}
				vwf_view.kernel.callMethod(id, method);
			}
			if (id == 'selection')
			{
				alertify.alert('calling methods on multiple selections is not supported');
			}
		}
		
		this.SelectionChanged = function (e, node)
		{
			try
			{
				if (node)
				{
					this.clearPropertyEditorDialogs();
					$("#accordion").accordion('destroy');
					$("#accordion").children('.modifiersection').remove();
					//update to ensure freshness
					node = vwf.getNode(node.id);
					node.properties = vwf.getProperties(node.id);
					if (!node.properties) return;
					
					
					
					$('#ui-dialog-title-ObjectProperties').text(vwf.getProperty(node.id, 'DisplayName') + " Properties");
					$('#dispName').val(vwf.getProperty(node.id, 'DisplayName') || node.id);
					
					this.addPropertyEditorDialog(node.id,'DisplayName',$('#dispName'),'text');
					
					$('#primeditortitletext').text($('#dispName').val() + ' Properties')
					
					if ($('#dispName').val() == "")
					{
						$('#dispName').val(node.name);
					}
					$('#dispOwner').val(vwf.getProperty(node.id, 'owner'));
					
					if (vwf.getProperty(node.id, 'isStatic'))
					{
						$('#isStatic').attr('checked', 'checked');
					}
					else
					{
						$('#isStatic').removeAttr('checked');
					}

					if (vwf.getProperty(node.id, 'visible'))
					{
						$('#isVisible').attr('checked', 'checked');
					}
					else
					{
						$('#isVisible').removeAttr('checked');
					}

					if (vwf.getProperty(node.id, 'isDynamic'))
					{
						$('#isDynamic').attr('checked', 'checked');
					}
					else
					{
						$('#isDynamic').removeAttr('checked');
					}
					if (vwf.getProperty(node.id, 'castShadows'))
					{
						$('#castShadows').attr('checked', 'checked');
					}
					else
					{
						$('#castShadows').removeAttr('checked');
					}
					if (vwf.getProperty(node.id, 'passable'))
					{
						$('#passable').attr('checked', 'checked');
					}
					else
					{
						$('#passable').removeAttr('checked');
					}
					if (vwf.getProperty(node.id, 'receiveShadows'))
					{
						$('#receiveShadows').attr('checked', 'checked');
					}
					else
					{
						$('#receiveShadows').removeAttr('checked');
					}
					$('#BaseSectionTitle').text(node.properties.type + ": " + node.id);
					this.SelectionTransformed(null, node);
					this.setupAnimationGUI(node, true);
					this.setupEditorData(node, true);
					this.recursevlyAddModifiers(node);
					this.addBehaviors(node);
					$("#accordion").accordion(
					{
						fillSpace: true,
						change: function ()
						{
							if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
						}
					});
					$(".ui-accordion-content").css('height', 'auto');
					this.updateOtherWindows();
				}
				else
				{
					this.hide();
				}
			}
			catch (e)
			{
				console.log(e);
			}
		}
		this.updateOtherWindows = function ()
		{
			$('#materialeditor').dialog('option', 'position', [1282, 40]);
			if (this.isOpen())
			{
				var t = $('#PrimitiveEditor').closest('.ui-dialog').height() + $('#PrimitiveEditor').offset().top;
				$('#materialeditor').dialog('option', 'position', [1282, t - 20]);
			}
		}
		this.recursevlyAddModifiers = function (node)
		{
			for (var i in node.children)
			{
				/*	section = '<h3 class="modifiersection" ><a href="#">'+node.children[i].properties.type+'</a></h3>'+
			'<div class="modifiersection">'+
			'<div class="EditorLabel">Amount</div>' +
					'<div id="'+node.children[i].id+'Amount" nodename="'+node.children[i].id+'">'
			'</div>';
			$( "#accordion" ).append(section);
			//$("#Radius").slider({min:0,max:10,step:.10,slide:this.updateSize.bind(this)});
			$("#"+node.children[i].id+"Amount").slider({min:-1,max:1,step:.10,slide:this.modifierAmountUpdate,stop:this.modifierAmountUpdate});
			//$("#"+node.children[i].id+"Amount").slider('value',vwf.getProperty(node.children[i].id,'amount'));
			*/
				if (vwf.getProperty(node.children[i].id, 'isModifier') == true)
				{
					this.setupEditorData(node.children[i], false);
					this.recursevlyAddModifiers(node.children[i]);
				}
			}
		}
		this.addBehaviors = function (node)
		{
			for (var i in node.children)
			{
				/*	section = '<h3 class="modifiersection" ><a href="#">'+node.children[i].properties.type+'</a></h3>'+
			'<div class="modifiersection">'+
			'<div class="EditorLabel">Amount</div>' +
					'<div id="'+node.children[i].id+'Amount" nodename="'+node.children[i].id+'">'
			'</div>';
			$( "#accordion" ).append(section);
			//$("#Radius").slider({min:0,max:10,step:.10,slide:this.updateSize.bind(this)});
			$("#"+node.children[i].id+"Amount").slider({min:-1,max:1,step:.10,slide:this.modifierAmountUpdate,stop:this.modifierAmountUpdate});
			//$("#"+node.children[i].id+"Amount").slider('value',vwf.getProperty(node.children[i].id,'amount'));
			*/
				if (vwf.getProperty(node.children[i].id, 'type') == 'behavior')
				{
					this.setupEditorData(node.children[i], false);
				}
			}
		}
		this.primPropertyUpdate = function (e, ui)
		{
			var id = $(this).attr('nodename');
			var prop = $(this).attr('propname');
			$('#' + id + prop + 'value').val(ui.value);
			var amount = ui.value;
			_PrimitiveEditor.setProperty(id, prop, parseFloat(amount));
		}
		this.primPropertyTypein = function (e, ui)
		{
			var id = $(this).attr('nodename');
			var prop = $(this).attr('propname');
			var amount = $(this).val();
			var slider = $(this).attr('slider');
			$(slider).slider('value', amount);
			_PrimitiveEditor.setProperty(id, prop, parseFloat(amount));
		}
		this.primPropertyValue = function (e, ui)
		{
			var id = $(this).attr('nodename');
			var prop = $(this).attr('propname');
			var val = $(this).attr('value');
			_PrimitiveEditor.setProperty(id, prop, val);
		}
		this.primPropertyChecked = function (e, ui)
		{
			var id = $(this).attr('nodename');
			var prop = $(this).attr('propname');
			if ($(this).attr('checked') == 'checked') _PrimitiveEditor.setProperty(id, prop, true);
			else _PrimitiveEditor.setProperty(id, prop, false);
		}
		this.setupAnimationGUI = function(node,wholeselection)
		{
			
			var animationLength = vwf.getProperty(node.id, 'animationLength');
			if(animationLength > 0)
			{
				
				var animationStart = vwf.getProperty(node.id, 'animationStart');
				var animationEnd = vwf.getProperty(node.id, 'animationEnd');
				var animationFrame = vwf.getProperty(node.id, 'animationFrame');
				var animationSpeed = vwf.getProperty(node.id, 'animationSpeed');
				var nodeid = node.id;
				var section = '<h3 class="modifiersection" ><a href="#"><div style="font-weight:bold;display:inline"> </div>Animation</a></h3><div class="modifiersection" id="animationSettings' + nodeid + '">' + '</div>';
				$("#accordion").append(section);
				$('#animationSettings' + nodeid).append('<div id="animationFrame">');
					var inputstyle = "";
					$('#animationSettings' + nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + 'animationFrame' + ': </div>');
					$('#animationSettings' + nodeid).append('<input class="primeditorinputbox" style="' + inputstyle + '" type="number" id="' + nodeid + 'animationFrame' + 'value"></input>');
					$('#' + nodeid + 'animationFrame' + 'value').val(vwf.getProperty(node.id, 'animationFrame'));
					$('#' + nodeid + 'animationFrame' + 'value').change(this.primPropertyTypein);
					$('#' + nodeid + 'animationFrame' + 'value').attr("nodename", nodeid);
					$('#' + nodeid + 'animationFrame' + 'value').attr("propname", 'animationFrame');
					$('#' + nodeid + 'animationFrame' + 'value').attr("slider", '#' + nodeid + 'animationFrame');
					$('#animationSettings' + nodeid).append('<div id="' + nodeid + 'animationFrame' + '" nodename="' + nodeid + '" propname="' + 'animationFrame' + '"/>');
					var val = vwf.getProperty(node.id, 'animationFrame');
					if (val == undefined) val = 0;
					$('#' + nodeid + 'animationFrame').slider(
					{
						step: .01,
						min: parseFloat(0),
						max: parseFloat(animationLength),
						slide: this.primPropertyUpdate,
						stop: this.primPropertyUpdate,
						value: val
					});
					
					this.addPropertyEditorDialog(node.id,'animationFrame',$('#' + nodeid + 'animationFrame'),'slider');
					this.addPropertyEditorDialog(node.id,'animationFrame',$('#' + nodeid + 'animationFrame' + 'value'),'text');
					
				$('#animationSettings' + nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' +'Animation Cycle' + ': </div>');
					$('#animationSettings' + nodeid).append('<div style="display: block;margin: 5px;" id="' + nodeid + i + '" nodename="' + nodeid + '" propnamemax="' + 'animationEnd' + '" propnamemin="' + 'animationStart' + '"/>');
					
					var minval = animationStart;
					var maxval = animationEnd;
					var val = [minval , maxval ]
					$('#' + nodeid + i).slider(
					{
						range: true,
						step: parseFloat(.1),
						min: 0,
						max: animationLength,
						values: val,
						slide: function (e, ui)
						{
							var propmin = $(this).attr('propnamemin');
							var propmax = $(this).attr('propnamemax');
							var nodeid = $(this).attr('nodename');
							_PrimitiveEditor.setProperty(nodeid, propmin, parseFloat(ui.values[0]));
							_PrimitiveEditor.setProperty(nodeid, propmax, parseFloat(ui.values[1]));
						},
						stop: function (e, ui)
						{
							var propmin = $(this).attr('propnamemin');
							var propmax = $(this).attr('propnamemax');
							var nodeid = $(this).attr('nodename');
							_PrimitiveEditor.setProperty(nodeid, propmin, parseFloat(ui.values[0]));
							_PrimitiveEditor.setProperty(nodeid, propmax, parseFloat(ui.values[1]));
						}
					});	
					
				$('#animationSettings' + nodeid).append('<div id="animationSpeed">');
					var inputstyle = "";
					$('#animationSettings' + nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + 'animationSpeed' + ': </div>');
					$('#animationSettings' + nodeid).append('<input class="primeditorinputbox" style="' + inputstyle + '" type="number" id="' + nodeid + 'animationSpeed' + 'value"></input>');
					$('#' + nodeid + 'animationSpeed' + 'value').val(vwf.getProperty(node.id, 'animationSpeed'));
					$('#' + nodeid + 'animationSpeed' + 'value').change(this.primPropertyTypein);
					$('#' + nodeid + 'animationSpeed' + 'value').attr("nodename", nodeid);
					$('#' + nodeid + 'animationSpeed' + 'value').attr("propname", 'animationSpeed');
					$('#' + nodeid + 'animationSpeed' + 'value').attr("slider", '#' + nodeid + 'animationSpeed');
					$('#animationSettings' + nodeid).append('<div id="' + nodeid + 'animationSpeed' + '" nodename="' + nodeid + '" propname="' + 'animationSpeed' + '"/>');
					var val = vwf.getProperty(node.id, 'animationSpeed');
					if (val == undefined) val = 0;
					$('#' + nodeid + 'animationSpeed').slider(
					{
						step: .01,
						min: parseFloat(0),
						max: parseFloat(10),
						slide: this.primPropertyUpdate,
						stop: this.primPropertyUpdate,
						value: val
					});
					
					this.addPropertyEditorDialog(node.id,'animationSpeed',$('#' + nodeid + 'animationSpeed'),'slider');
					this.addPropertyEditorDialog(node.id,'animationSpeed',$('#' + nodeid + 'animationSpeed' + 'value'),'text');	
			
				
					
					$('#animationSettings' + nodeid).append('<div id="' + nodeid + 'play' + '" nodename="' + nodeid + '" methodname="' + 'play' + '"/>');
					$('#' + nodeid + 'play').button({label:'Play'});
					$('#' + nodeid + 'play').css('display','block');
					$('#' + nodeid + 'play').click(function()
					{
						var nodename = $(this).attr('nodename');
						var method = $(this).attr('methodname');
						_PrimitiveEditor.callMethod(nodename, method);
					});
					
					$('#animationSettings' + nodeid).append('<div id="' + nodeid + 'pause' + '" nodename="' + nodeid + '" methodname="' + 'pause' + '"/>');
					$('#' + nodeid + 'pause').button({label:'Pause'});
					$('#' + nodeid + 'pause').css('display','block');
					$('#' + nodeid + 'pause').click(function()
					{
						var nodename = $(this).attr('nodename');
						var method = $(this).attr('methodname');
						_PrimitiveEditor.callMethod(nodename, method);
					});
			
			}
		}
		this.setupEditorData = function (node, wholeselection)
		{
			var nodeid = node.id;
			if (wholeselection && _Editor.getSelectionCount() > 1) nodeid = 'selection';
			var editordata = vwf.getProperty(node.id, 'EditorData');
			
			editordatanames = [];
			for (var i in editordata)
			{
				editordatanames.push(i);
			}
			editordatanames.sort();
			section = '<h3 class="modifiersection" ><a href="#"><div style="font-weight:bold;display:inline">' + vwf.getProperty(node.id,'type') + ": </div>" + node.properties.DisplayName + '</a></h3>' + '<div class="modifiersection" id="basicSettings' + nodeid + '">' + '</div>';
			$("#accordion").append(section);
			for (var j = 0; j < editordatanames.length; j++)
			{
				var i = editordatanames[j];
				if (editordata[i].type == 'slider')
				{
					var inputstyle = "";
					$('#basicSettings' + nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + editordata[i].displayname + ': </div>');
					$('#basicSettings' + nodeid).append('<input class="primeditorinputbox" style="' + inputstyle + '" type="number" id="' + nodeid + editordata[i].property + 'value"></input>');
					$('#' + nodeid + editordata[i].property + 'value').val(vwf.getProperty(node.id, editordata[i].property));
					$('#' + nodeid + editordata[i].property + 'value').change(this.primPropertyTypein);
					$('#' + nodeid + editordata[i].property + 'value').attr("nodename", nodeid);
					$('#' + nodeid + editordata[i].property + 'value').attr("propname", editordata[i].property);
					$('#' + nodeid + editordata[i].property + 'value').attr("slider", '#' + nodeid + i);
					$('#basicSettings' + nodeid).append('<div id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/>');
					var val = vwf.getProperty(node.id, editordata[i].property);
					if (val == undefined) val = 0;
					$('#' + nodeid + i).slider(
					{
						step: parseFloat(editordata[i].step),
						min: parseFloat(editordata[i].min),
						max: parseFloat(editordata[i].max),
						slide: this.primPropertyUpdate,
						stop: this.primPropertyUpdate,
						value: val
					});
					
					this.addPropertyEditorDialog(node.id,editordata[i].property,$('#' + nodeid + i),'slider');
					this.addPropertyEditorDialog(node.id,editordata[i].property,$('#' + nodeid + editordata[i].property + 'value'),'text');
				}
				if (editordata[i].type == 'check')
				{
					$('#basicSettings' + nodeid).append('<div><input style="vertical-align: middle" type="checkbox" id="' + i + nodeid + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/><div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + editordata[i].displayname + ': </div></div>');
					var val = vwf.getProperty(node.id, editordata[i].property);
					$('#' + i + nodeid).click(this.primPropertyChecked);
					if (val == true)
					{
						$('#' + i + nodeid).attr('checked', 'checked');
					}
					
					this.addPropertyEditorDialog(node.id,editordata[i].property,$('#' + i + nodeid),'check');
					//$('#'+i).
				}
				if (editordata[i].type == 'button')
				{
					
					$('#basicSettings' + nodeid).append('<div id="' + nodeid + i + '" nodename="' + nodeid + '" methodname="' + editordata[i].method + '"/>');
					$('#' + nodeid + i).button({label:editordata[i].label});
					$('#' + nodeid + i).css('display','block');
					$('#' + nodeid + i).click(function()
					{
						var nodename = $(this).attr('nodename');
						var method = $(this).attr('methodname');
						_PrimitiveEditor.callMethod(nodename, method);
					});
				}
				if (editordata[i].type == 'choice')
				{
					
					
					$('#basicSettings' + nodeid).append('<div style="">' + editordata[i].displayname + '</div><input type="text" style="text-align: center;border: outset 1px;background-color: #DDDDDD;margin: 0px 0px 5px 0px;cursor: pointer;display: block;width: 100%;padding: 2px;border-radius: 5px;font-weight: bold;" id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/>');
					$('#' + nodeid + i).val(vwf.getProperty(node.id, editordata[i].property));
					$('#' + nodeid + i).attr('index',i);
					
					$('#' + nodeid + i).click(function ()
					{
						
						var propname = $(this).attr('propname');
						var nodename = $(this).attr('nodename');
						var values = editordata[$(this).attr('index')].values;
						var labels = editordata[$(this).attr('index')].labels;
						var div = this;
						
						alertify.choice('Enter a value for ' + propname,function(ok,value)
						{
							
							if(ok)
							{
								$(div).val(value);
								var k = labels.indexOf(value)
								
								_PrimitiveEditor.setProperty(nodename, propname, values[k]);
							}
						},labels);
					});
					this.addPropertyEditorDialog(node.id,editordata[i].property,$('#' + nodeid + i),'text');
					
					//$('#'+i).
				}
				if (editordata[i].type == 'rangeslider')
				{
					$('#basicSettings' + nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + editordata[i].displayname + ': </div>');
					$('#basicSettings' + nodeid).append('<div style="display: block;margin: 5px;" id="' + nodeid + i + '" nodename="' + nodeid + '" propnamemax="' + editordata[i].property[2] + '" propnamemin="' + editordata[i].property[1] + '"/>');
					var setval = vwf.getProperty(node.id, editordata[i].property[0]);
					var minval = vwf.getProperty(node.id, editordata[i].property[1]);
					var maxval = vwf.getProperty(node.id, editordata[i].property[2]);
					var val = [minval || editordata[i].min, maxval || editordata[i].max]
					$('#' + nodeid + i).slider(
					{
						range: true,
						step: parseFloat(editordata[i].step),
						min: parseFloat(editordata[i].min),
						max: parseFloat(editordata[i].max),
						values: val,
						slide: function (e, ui)
						{
							var propmin = $(this).attr('propnamemin');
							var propmax = $(this).attr('propnamemax');
							var nodeid = $(this).attr('nodename');
							_PrimitiveEditor.setProperty(nodeid, propmin, parseFloat(ui.values[0]));
							_PrimitiveEditor.setProperty(nodeid, propmax, parseFloat(ui.values[1]));
						},
						stop: function (e, ui)
						{
							var propmin = $(this).attr('propnamemin');
							var propmax = $(this).attr('propnamemax');
							var nodeid = $(this).attr('nodename');
							_PrimitiveEditor.setProperty(nodeid, propmin, parseFloat(ui.values[0]));
							_PrimitiveEditor.setProperty(nodeid, propmax, parseFloat(ui.values[1]));
						}
					});
				}
				if (editordata[i].type == 'rangevector')
				{
					var vecvalchanged = function (e)
					{
						var propname = $(this).attr('propname');
						var component = $(this).attr('component');
						var nodeid = $(this).attr('nodename');
						var thisid = $(this).attr('id');
						thisid = thisid.substr(0, thisid.length - 1);
						var x = $('#' + thisid + 'X').val();
						var y = $('#' + thisid + 'Y').val();
						var z = $('#' + thisid + 'Z').val();
						_PrimitiveEditor.setProperty(nodeid, propname, [parseFloat(x), parseFloat(y), parseFloat(z)]);
					}
					$('#basicSettings' + nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + editordata[i].displayname + ': </div>');
					var baseid = 'basicSettings' + nodeid + i + 'min';
					$('#basicSettings' + nodeid).append('<div style="text-align:right"><div style="display:inline" >min:</div> <div style="display:inline-block;">' + '<input id="' + baseid + 'X' + '" component="X" nodename="' + nodeid + '" propname="' + editordata[i].property[0] + '" type="number" step="' + editordata[i].step + '" class="vectorinputfront"/>' + '<input id="' + baseid + 'Y' + '" component="Y" nodename="' + nodeid + '" propname="' + editordata[i].property[0] + '" type="number" step="' + editordata[i].step + '" class="vectorinput"/>' + '<input id="' + baseid + 'Z' + '" component="Z" nodename="' + nodeid + '" propname="' + editordata[i].property[0] + '" type="number" step="' + editordata[i].step + '" class="vectorinput"/>' + '</div></div>');
					var propmin = vwf.getProperty(node.id, editordata[i].property[0]);
					if (propmin)
					{
						$('#' + baseid + 'X').val(propmin[0]);
						$('#' + baseid + 'Y').val(propmin[1]);
						$('#' + baseid + 'Z').val(propmin[2]);
					}
					$('#' + baseid + 'X').change(vecvalchanged);
					$('#' + baseid + 'Y').change(vecvalchanged);
					$('#' + baseid + 'Z').change(vecvalchanged);
					baseid = 'basicSettings' + nodeid + i + 'max';
					$('#basicSettings' + nodeid).append('<div style="text-align:right"><div style="display:inline">max:</div> <div style="display:inline-block;">' + '<input id="' + baseid + 'X' + '" component="X" nodename="' + nodeid + '" propname="' + editordata[i].property[1] + '" type="number" step="' + editordata[i].step + '"  class="vectorinputfront"/>' + '<input id="' + baseid + 'Y' + '" component="Y" nodename="' + nodeid + '" propname="' + editordata[i].property[1] + '" type="number" step="' + editordata[i].step + '"  class="vectorinput"/>' + '<input id="' + baseid + 'Z' + '" component="Z" nodename="' + nodeid + '" propname="' + editordata[i].property[1] + '" type="number" step="' + editordata[i].step + '"  class="vectorinput"/>' + '</div></div>');
					var propmax = vwf.getProperty(node.id, editordata[i].property[1]);
					if (propmax)
					{
						$('#' + baseid + 'X').val(propmax[0]);
						$('#' + baseid + 'Y').val(propmax[1]);
						$('#' + baseid + 'Z').val(propmax[2]);
					}
					$('#' + baseid + 'X').change(vecvalchanged);
					$('#' + baseid + 'Y').change(vecvalchanged);
					$('#' + baseid + 'Z').change(vecvalchanged);
				}
				if (editordata[i].type == 'vector')
				{
					var vecvalchanged = function (e)
					{
						var propname = $(this).attr('propname');
						var component = $(this).attr('component');
						var nodeid = $(this).attr('nodename');
						var thisid = $(this).attr('id');
						thisid = thisid.substr(0, thisid.length - 1);
						var x = $('#' + thisid + 'X').val();
						var y = $('#' + thisid + 'Y').val();
						var z = $('#' + thisid + 'Z').val();
						_PrimitiveEditor.setProperty(nodeid, propname, [parseFloat(x), parseFloat(y), parseFloat(z)]);
					}
					//$('#basicSettings'+nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">'+editordata[i].displayname+': </div>');
					var baseid = 'basicSettings' + nodeid + i + 'min';
					$('#basicSettings' + nodeid).append('<div style="text-align: left;margin-top: 4px;"><div style="display:inline" >' + editordata[i].displayname + ':</div> <div style="display:inline-block;float:right">' + '<input id="' + baseid + 'X' + '" component="X" nodename="' + nodeid + '" propname="' + editordata[i].property + '" type="number" step="' + editordata[i].step + '" class="vectorinputfront"/>' + '<input id="' + baseid + 'Y' + '" component="Y" nodename="' + nodeid + '" propname="' + editordata[i].property + '" type="number" step="' + editordata[i].step + '" class="vectorinput"/>' + '<input id="' + baseid + 'Z' + '" component="Z" nodename="' + nodeid + '" propname="' + editordata[i].property + '" type="number" step="' + editordata[i].step + '" class="vectorinput"/>' + '</div><div style="clear:both"/></div>');
					var propmin = vwf.getProperty(node.id, editordata[i].property);
					if (propmin)
					{
						$('#' + baseid + 'X').val(propmin[0]);
						$('#' + baseid + 'Y').val(propmin[1]);
						$('#' + baseid + 'Z').val(propmin[2]);
					}
					$('#' + baseid + 'X').change(vecvalchanged);
					$('#' + baseid + 'Y').change(vecvalchanged);
					$('#' + baseid + 'Z').change(vecvalchanged);
				}
				if (editordata[i].type == 'map')
				{
					$('#basicSettings' + nodeid).append('<div style="display: block;margin: 5px;" id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/>');
					$('#' + nodeid + i).button(
					{
						label: editordata[i].displayname
					});
					$('#' + nodeid + i).click(function ()
					{
						_MapBrowser.setTexturePickedCallback(function (e)
						{
							var propname = $(this).attr('propname');
							var nodename = $(this).attr('nodename');
							_MapBrowser.setTexturePickedCallback(null);
							_PrimitiveEditor.setProperty(nodename, propname, e);
							_MapBrowser.hide();
						}.bind(this));
						_MapBrowser.show();
					});
				}
				if (editordata[i].type == 'text')
				{
					$('#basicSettings' + nodeid).append('<div style="">' + editordata[i].displayname + '</div><input type="text" style="display: block;width: 100%;padding: 2px;border-radius: 5px;font-weight: bold;" id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/>');
					$('#' + nodeid + i).val(vwf.getProperty(node.id, editordata[i].property));
					$('#' + nodeid + i).keyup(function ()
					{
						var propname = $(this).attr('propname');
						var nodename = $(this).attr('nodename');
						_PrimitiveEditor.setProperty(nodename, propname, $(this).val());
					});
					this.addPropertyEditorDialog(node.id,editordata[i].property,$('#' + nodeid + i),'text');
				}
				if (editordata[i].type == 'prompt')
				{
					$('#basicSettings' + nodeid).append('<div style="">' + editordata[i].displayname + '</div><input type="text" style="text-align: center;border: outset 1px;background-color: #DDDDDD;margin: 0px 0px 5px 0px;cursor: pointer;display: block;width: 100%;padding: 2px;border-radius: 5px;font-weight: bold;" id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/>');
					$('#' + nodeid + i).val(vwf.getProperty(node.id, editordata[i].property));
					$('#' + nodeid + i).click(function ()
					{
					
						var propname = $(this).attr('propname');
						var nodename = $(this).attr('nodename');
						var div = this;
						alertify.prompt('Enter a value for ' + propname,function(ok,value)
						{
							if(ok)
							{
								$(div).val(value);
								_PrimitiveEditor.setProperty(nodename, propname, value);
							}
						},$(this).val() );
					});
				}
				if (editordata[i].type == 'nodeid')
				{
					
					$('#basicSettings' + nodeid).append('<div style="margin-top: 5px;margin-bottom: 5px;"><div >' + editordata[i].displayname + '</div><input type="text" style="display: inline;width: 50%;padding: 2px;border-radius: 5px;font-weight: bold;" id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/><div  style="float:right;width:45%;height:2em" id="' + nodeid + i + 'button" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/></div><div style="clear:both" />');
					$('#' + nodeid + i).val(vwf.getProperty(node.id, editordata[i].property));
					$('#' + nodeid + i).attr('disabled','disabled');
					$('#' + nodeid + i +'button').button({label:'Choose Node'});
					var label = $('#' + nodeid + i);
					$('#' + nodeid + i +'button').click(function ()
					{
						var propname = $(this).attr('propname');
						var nodename = $(this).attr('nodename');
						
						_Editor.TempPickCallback = function(node)
						{
							label.val(node.id);
							_Editor.TempPickCallback = null;
							_Editor.SetSelectMode('Pick');
							_PrimitiveEditor.setProperty(nodename, propname, node.id);
						};
						_Editor.SetSelectMode('TempPick');
						
					});
					
					this.addPropertyEditorDialog(node.id,editordata[i].property,$('#' + nodeid + i),'text');
				}
				if (editordata[i].type == 'color')
				{
					var colorswatchstyle = "margin: 5px;float:right;clear:right;background-color: #FF19E9;width: 25px;height: 25px;border: 2px solid lightgray;border-radius: 3px;display: inline-block;margin-left: 20px;vertical-align: middle;box-shadow: 2px 2px 5px,1px 1px 3px gray inset;background-image: url(vwf/view/editorview/images/select3.png);background-position: center;";
					$('#basicSettings' + nodeid).append('<div style="margin-bottom:10px" id="' + nodeid + i + '" />');
					$('#' + nodeid + i + '').append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 15px;">' + editordata[i].displayname + ': </div>');
					$('#' + nodeid + i + '').append('<div id="' + nodeid + i + 'ColorPicker" style="' + colorswatchstyle + '"></div>')
					var colorval = vwf.getProperty(node.id, editordata[i].property);
					colorval = 'rgb(' + parseInt(colorval[0] * 255) + ',' + parseInt(colorval[1] * 255) + ',' + parseInt(colorval[2] * 255) + ')';
					$('#' + nodeid + i + 'ColorPicker').css('background-color', colorval);
					var parentid = nodeid + i + 'ColorPicker';
					$('#' + nodeid + i + 'ColorPicker').ColorPicker(
					{
						colorpickerId: parentid + 'picker',
						onShow: function (e)
						{
							$(e).fadeIn();
						},
						onHide: function (e)
						{
							$(e).fadeOut();
							return false
						},
						onSubmit: function (hsb, hex, rgb)
						{
							$('#' + (this.attr('parentid'))).css('background-color', "#" + hex);
							_PrimitiveEditor.setProperty(this.attr('nodeid'), this.attr('propname'), [rgb.r / 255, rgb.g / 255, rgb.b / 255]);
						},
						onChange: function (hsb, hex, rgb)
						{
							$('#' + (this.attr('parentid'))).css('background-color', "#" + hex);
							_PrimitiveEditor.setProperty(this.attr('nodeid'), this.attr('propname'), [rgb.r / 255, rgb.g / 255, rgb.b / 255]);
						}
					});
					$('#' + $('#' + nodeid + i + 'ColorPicker').data('colorpickerId')).attr('parentid', parentid);;
					$('#' + $('#' + nodeid + i + 'ColorPicker').data('colorpickerId')).attr('propname', editordata[i].property);
					$('#' + $('#' + nodeid + i + 'ColorPicker').data('colorpickerId')).attr('nodeid', nodeid);
					this.addPropertyEditorDialog(node.id,editordata[i].property,$('#' + nodeid + i + 'ColorPicker'),'color');
				}
			}
			$('#basicSettings' + nodeid).append('<div style="margin-top: 1em;" nodename="' + node.id + '" id="' + nodeid + 'deletebutton"/>');
			$('#' + nodeid + 'deletebutton').button(
			{
				label: 'Delete'
			});
			$('#' + nodeid + 'deletebutton').click(this.deleteButtonClicked);
			$('#basicSettings' + nodeid).append('<div style="margin-top: 1em;" nodename="' + node.id + '" id="' + nodeid + 'selectbutton"/>');
			$('#' + nodeid + 'selectbutton').button(
			{
				label: 'Select'
			});
			$('#' + nodeid + 'selectbutton').click(this.selectButtonClicked);
			//remove save button. too confusing
			// $('#basicSettings' + nodeid).append('<div style="margin-top: 1em;" nodename="' + node.id + '" id="' + nodeid + 'savebutton"/>');
			// $('#' + nodeid + 'savebutton').button(
			// {
				// label: 'Save'
			// });
			// $('#' + nodeid + 'savebutton').click(this.saveButtonClicked);
			$('#basicSettings' + nodeid).append('<div style="margin-top: 1em;" nodename="' + node.id + '" id="' + nodeid + 'copybutton"/>');
			$('#' + nodeid + 'copybutton').button(
			{
				label: 'Copy'
			});
			$('#' + nodeid + 'copybutton').click(this.copyButtonClicked);
		}
		this.deleteButtonClicked = function ()
		{
			if (document.PlayerNumber == null)
			{
				_Notifier.notify('You must log in to participate');
				return;
			}
			var id = $(this).attr('nodename');
			if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(),id) == 0)
			{
				_Notifier.notify('You do not have permission to delete this object');
				return;
			}
			if (id == _Editor.GetSelectedVWFNode().id)
			{
				_Editor.DeleteSelection();
			}
			else
			{
				vwf_view.kernel.deleteNode(id);
				vwf_view.kernel.callMethod(_Editor.GetSelectedVWFNode().id, 'dirtyStack');
				window.setTimeout(function ()
				{
					_PrimitiveEditor.SelectionChanged(null, _Editor.GetSelectedVWFNode());
				}, 500);
			}
		}
		this.selectButtonClicked = function ()
		{
			var id = $(this).attr('nodename');
			_Editor.SelectObject(id);
		}
		this.copyButtonClicked = function ()
		{
			var id = $(this).attr('nodename');
			_Editor.Copy([id]);
		}
		this.saveButtonClicked = function ()
		{
			var id = $(this).attr('nodename');
			_InventoryManager.Take(id);
		}
		this.modifierAmountUpdate = function (e, ui)
		{
			var id = $(this).attr('nodename');
			var amount = ui.value;
			_PrimitiveEditor.setProperty(id, 'amount', amount);
		}
		this.positionChanged = function ()
		{
			var val = [0, 0, 0];
			val[0] = $('#PositionX').val();
			val[1] = $('#PositionY').val();
			val[2] = $('#PositionZ').val();
			this.setProperty(_Editor.GetSelectedVWFNode().id, 'translation', val);
		}
		this.rotationChanged = function ()
		{
			var val = [0, 0, 0, 0];
			val[2] = $('#RotationX').val();
			val[0] = $('#RotationY').val();
			val[1] = $('#RotationZ').val();
			//val[3] = $('#RotationW').val();
			val[0] /= 57.2957795;
			val[1] /= 57.2957795;
			val[2] /= 57.2957795;
			var c1 = Math.cos(val[0] / 2);
			var c2 = Math.cos(val[1] / 2);
			var c3 = Math.cos(val[2] / 2);
			var s1 = Math.sin(val[0] / 2);
			var s2 = Math.sin(val[1] / 2);
			var s3 = Math.sin(val[2] / 2);
			var w = c1 * c2 * c3 - s1 * s2 * s3;
			var x = s1 * s2 * c3 + c1 * c2 * s3;
			var y = s1 * c2 * c3 + c1 * s2 * s3;
			var z = c1 * s2 * c3 - s1 * c2 * s3;
			var q = goog.vec.Quaternion.createFloat32FromValues(x, y, z, w);
			var axis = [0, 0, 0];
			var angle = goog.vec.Quaternion.toAngleAxis(q, axis);
			axis.push(angle * 57.2957795);
			this.setProperty(_Editor.GetSelectedVWFNode().id, 'rotation', axis);
		}
		this.scaleChanged = function ()
		{
			var val = [0, 0, 0];
			val[0] = $('#ScaleX').val();
			val[1] = $('#ScaleY').val();
			val[2] = $('#ScaleZ').val();
			this.setProperty(_Editor.GetSelectedVWFNode().id, 'scale', val);
		}
		this.rotationMatrix_2_XYZ = function (m)
		{
			var theta1 = Math.atan2(m[6], m[10]);
			var c2 = Math.sqrt((m[0] * m[0] + m[1] * m[1]));
			var theta2 = Math.atan2(-m[2], c2);
			var s1 = Math.sin(theta1);
			var c1 = Math.cos(theta1);
			var theta3 = Math.atan2(s1 * m[8] - c1 * m[4], c1 * m[5] - s1 * m[9]);
			return [theta1, theta2, theta3];
		}
		this.NodePropertyUpdate = function(nodeID,propName,propVal)
		{
			
			for(var i = 0; i < this.propertyEditorDialogs.length; i++)
			{	
				
				var diag = this.propertyEditorDialogs[i];
				if(diag.propName == propName && diag.nodeid == nodeID)
				{
					if(diag.type == 'text')
						diag.element.val(propVal);
					if(diag.type == 'slider')
						diag.element.slider('value',propVal);
					if(diag.type == 'check')
						diag.element.attr('checked',propVal);						
				}
			}
		}
		this.addPropertyEditorDialog = function(nodeid,propname,element,type)
		{
			this.propertyEditorDialogs.push({
				propName:propname,
				type:type,
				element:element,
				nodeid:nodeid
			
			});
		}
		this.clearPropertyEditorDialogs = function()
		{
			this.propertyEditorDialogs=[];
		}
		this.SelectionTransformed = function (e, node)
		{
			try
			{
				if (node)
				{
					var mat = MATH.transposeMat4(_Editor.findviewnode(node.id).matrix.elements);
					var angles = this.rotationMatrix_2_XYZ(mat);
					var pos = vwf.getProperty(node.id, 'translation');
					
					var scl = vwf.getProperty(node.id, 'scale');
					$('#PositionX').val(Math.floor(pos[0]*1000)/1000);
					$('#PositionY').val(Math.floor(pos[1]*1000)/1000);
					$('#PositionZ').val(Math.floor(pos[2]*1000)/1000);
					$('#RotationX').val(Math.floor(.05 + angles[0] * -57.2957795));
					$('#RotationY').val(Math.floor(.05 + angles[1] * -57.2957795));
					$('#RotationZ').val(Math.floor(.05 + angles[2] * -57.2957795));
					//$('#RotationW').val(rot[3]);
					$('#ScaleX').val(scl[0]);
					$('#ScaleY').val(scl[1]);
					$('#ScaleZ').val(scl[2]);
				}
			}
			catch (e)
			{
				console.log(e);
			}
		}
		$(document).bind('selectionChanged', this.SelectionChanged.bind(this));
		$(document).bind('modifierCreated', this.SelectionChanged.bind(this));
		$(document).bind('selectionTransformedLocal', this.SelectionTransformed.bind(this));
		$(document).bind('nodePropChanged', this.NodePropertyUpdate.bind(this));
		$('#PositionX').change(this.positionChanged.bind(this));
		$('#PositionY').change(this.positionChanged.bind(this));
		$('#PositionZ').change(this.positionChanged.bind(this));
		$('#RotationX').change(this.rotationChanged.bind(this));
		$('#RotationY').change(this.rotationChanged.bind(this));
		$('#RotationZ').change(this.rotationChanged.bind(this));
		$('#RotationW').change(this.rotationChanged.bind(this));
		$('#ScaleX').change(this.scaleChanged.bind(this));
		$('#ScaleY').change(this.scaleChanged.bind(this));
		$('#ScaleZ').change(this.scaleChanged.bind(this));
		$('#RotationW').hide();
	}
});