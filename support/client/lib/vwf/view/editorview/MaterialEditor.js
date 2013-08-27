define(["vwf/view/editorview/mapbrowser"], function ()
{
	var MaterialEditor = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(MaterialEditor);
				isInitialized = true;
			}
			return MaterialEditor;
		}
	}

	function initialize()
	{
		window._MapBrowser = require("vwf/view/editorview/mapbrowser").getSingleton();
		$('#sidepanel').append("<div id='materialeditor'>" + "<div id='materialeditortitle' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' >Material Editor</div>" + "</div>");
		//$('#materialeditor').dialog({title:'Material Editor',autoOpen:false});
		$('#materialeditor').css('border-bottom', '5px solid #444444')
		$('#materialeditor').css('border-left', '2px solid #444444')
		$(document.head).append('<link rel="stylesheet" media="screen" type="text/css" href="css/colorpicker.css" />');
		$(document.head).append('<script type="text/javascript" src="js/colorpicker.js"></script>');
		this.show = function ()
		{
			if(!this.currentMaterial)
			{
				alertify.alert('This object does not expose a material interface');
				return;
			}
			//$('#materialeditor').dialog('open');
			$('#materialeditor').prependTo($('#materialeditor').parent());
			$('#materialeditor').show('blind', function ()
			{
				if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
			});
			showSidePanel();
			this.BuildGUI();
			//if(_PrimitiveEditor.isOpen())
			//$('#materialeditor').dialog('option','position',[1282,456]);
			//else
			//$('#materialeditor').dialog('option','position',[1282,40]);
			//this.open =true;
		}
		this.hide = function ()
		{
			//$('#materialeditor').dialog('close');
			if (this.isOpen())
			{
				$('#materialeditor').hide('blind', function ()
				{
					if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
					if (!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible')) hideSidePanel();
				});
			}
		}
		this.isOpen = function ()
		{
			//$("#materialeditor").dialog( "isOpen" )
			return $('#materialeditor').is(':visible');
		}
		this.RootPropTypein = function ()
		{
			var prop = $(this).attr('prop');
			_MaterialEditor.currentMaterial[prop] = $('#' + prop + 'value').val();
			$('#' + prop + 'slider').slider('value', $('#' + prop + 'value').val());
			_MaterialEditor.updateObject();
		}
		this.RootPropUpdate = function (e, ui)
		{
			var prop = $(this).attr('prop');
			_MaterialEditor.currentMaterial[prop] = ui.value;
			$('#' + prop + 'value').val(ui.value);
			_MaterialEditor.updateObject();
		}
		this.LayerPropTypein = function ()
		{
			var prop = $(this).attr('prop');
			var layer = $(this).attr('layer');
			var rootid = 'Layer' + layer + 'Settings';
			_MaterialEditor.currentMaterial.layers[layer][prop] = $('#' + rootid + prop + 'value').val();
			$('#' + rootid + prop + 'slider').slider('value', $('#' + rootid + prop + 'value').val());
			_MaterialEditor.updateObject();
		}
		this.LayerPropUpdate = function (e, ui)
		{
			var prop = $(this).attr('prop');
			var layer = $(this).attr('layer');
			var rootid = 'Layer' + layer + 'Settings';
			_MaterialEditor.currentMaterial.layers[layer][prop] = ui.value;
			$('#' + rootid + prop + 'value').val(ui.value);
			_MaterialEditor.updateObject();
		}
		this.updateObject = function ()
		{
			if(document.PlayerNumber == null)
			{
			_Notifier.notify('You must log in to participate');
			return;
			}
			for (var i = 0; i < _Editor.getSelectionCount(); i++)
			{
				var id = _Editor.GetSelectedVWFNode(i).id;
				if(_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(),id) == 0)
				{
				_Notifier.notify('You do not have permission to edit this material');
				continue;
				}
				
				vwf_view.kernel.setProperty(id, 'materialDef', _MaterialEditor.currentMaterial);
			}
		}
		this.BuildGUI = function ()
		{
			var sliderprops = [
				{
					prop: 'alpha',
					min: 0,
					max: 1,
					step: .01
				},
				{
					prop: 'specularLevel',
					min: 0,
					max: 10,
					step: .05
				},
				{
					prop: 'reflect',
					min: 0,
					max: 10,
					step: .05
				},
				{
					prop: 'shininess',
					min: 0,
					max: 10,
					step: .05
				},
				{
					prop: 'side',
					min: 0,
					max: 2,
					step: 1
				}
			];
			$("#materialeditor").empty();
			$("#materialeditor").append("<div id='materialeditortitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Material Editor</span></div>");
			$('#materialeditortitle').append('<a href="#" id="materialeditorclose" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
			$('#materialeditortitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/material.png" />');
			$("#materialeditor").append('<div id="materialaccordion" style="height:100%;overflow:hidden">' + '	<h3>' + '		<a href="#">Material Base</a>' + '	</h3>' + '	<div id="MaterialBasicSettings">' + '	</div>' + '</div>');
			$("#materialeditorclose").click(function ()
			{
				_MaterialEditor.hide()
			});
			for (var i = 0; i < sliderprops.length; i++)
			{
				var prop = sliderprops[i].prop;
				var inputstyle = "display: inline;float: right;padding: 0;width: 50px;border-radius: 6px;background: transparent;text-align: center;border-width: 1px;color: grey;"
				$('#MaterialBasicSettings').append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + prop + ': </div>');
				$('#MaterialBasicSettings').append('<input style="' + inputstyle + '" id="' + prop + 'value"></input>');
				$('#' + prop + 'value').change(this.RootPropTypein);
				$('#MaterialBasicSettings').append('<div id="' + prop + 'slider"/>');
				$('#' + prop + 'slider').attr('prop', prop);
				$('#' + prop + 'value').attr('prop', prop);
				var val = this.currentMaterial[prop];
				$('#' + prop + 'value').val(val);
				$('#' + prop + 'slider').slider(
				{
					step: sliderprops[i].step,
					min: sliderprops[i].min,
					max: sliderprops[i].max,
					slide: this.RootPropUpdate,
					stop: this.RootPropUpdate,
					value: val
				});
			}
			$('#MaterialBasicSettings').append('<div id="brightdiv" />');
			$('#MaterialBasicSettings').append('<div style="clear:both" />');
		
			
			var colorswatchstyle = "margin: 5px;float:right;clear:right;background-color: #FF19E9;width: 25px;height: 25px;border: 2px solid lightgray;border-radius: 3px;display: inline-block;margin-left: 20px;vertical-align: middle;box-shadow: 2px 2px 5px,1px 1px 3px gray inset;background-image: url(vwf/view/editorview/images/select3.png);background-position: center;";
			$('#MaterialBasicSettings').append('<div style="clear:both" />');
			$('#MaterialBasicSettings').append('<div style="margin-bottom:10px" id="colordiv" />');
			$('#colordiv').append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 15px;">Diffuse Color: </div>');
			$('#colordiv').append('<div id="ColorColorPicker" style="' + colorswatchstyle + '"></div>')
			var col = this.currentMaterial.color;
			$('#ColorColorPicker').css('background-color', 'rgb(' + Math.floor(col.r * 255) + ',' + Math.floor(col.g * 255) + ',' + Math.floor(col.b * 255) + ')');
			$('#ColorColorPicker').ColorPicker(
			{
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
					$('#ColorColorPicker').css('background-color', "#" + hex);
					_MaterialEditor.currentMaterial.color.r = rgb.r / 255;
					_MaterialEditor.currentMaterial.color.g = rgb.g / 255;
					_MaterialEditor.currentMaterial.color.b = rgb.b / 255;
					_MaterialEditor.updateObject();
				},
				onChange: function (hsb, hex, rgb)
				{
					$('#ColorColorPicker').css('background-color', "#" + hex);
					_MaterialEditor.currentMaterial.color.r = rgb.r / 255;
					_MaterialEditor.currentMaterial.color.g = rgb.g / 255;
					_MaterialEditor.currentMaterial.color.b = rgb.b / 255;
					_MaterialEditor.updateObject();
				}
			});
			$('#MaterialBasicSettings').append('<div />');
			$('#MaterialBasicSettings').append('<div style="margin-bottom:10px" id="ambientdiv" />');
			$('#ambientdiv').append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 15px;">Ambient Color: </div>');
			$('#ambientdiv').append('<div id="AmbientColorPicker" style="' + colorswatchstyle + '"></div>')
			var amb = this.currentMaterial.ambient;
			$('#AmbientColorPicker').css('background-color', 'rgb(' + Math.floor(amb.r * 255) + ',' + Math.floor(amb.g * 255) + ',' + Math.floor(amb.b * 255) + ')');
			$('#AmbientColorPicker').ColorPicker(
			{
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
					$('#AmbientColorPicker').css('background-color', "#" + hex);
					_MaterialEditor.currentMaterial.ambient.r = rgb.r / 255;
					_MaterialEditor.currentMaterial.ambient.g = rgb.g / 255;
					_MaterialEditor.currentMaterial.ambient.b = rgb.b / 255;
					_MaterialEditor.updateObject();
				},
				onChange: function (hsb, hex, rgb)
				{
					$('#AmbientColorPicker').css('background-color', "#" + hex);
					_MaterialEditor.currentMaterial.ambient.r = rgb.r / 255;
					_MaterialEditor.currentMaterial.ambient.g = rgb.g / 255;
					_MaterialEditor.currentMaterial.ambient.b = rgb.b / 255;
					_MaterialEditor.updateObject();
				}
			});
			$('#MaterialBasicSettings').append('<div />');
			$('#MaterialBasicSettings').append('<div style="margin-bottom:10px" id="emitdiv" />');
			$('#emitdiv').append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 15px;">Emission Color: </div>');
			$('#emitdiv').append('<div id="EmitColorPicker" style="' + colorswatchstyle + '"></div>')
			var emt = this.currentMaterial.emit;
			$('#EmitColorPicker').css('background-color', 'rgb(' + Math.floor(emt.r * 255) + ',' + Math.floor(emt.g * 255) + ',' + Math.floor(emt.b * 255) + ')');
			$('#EmitColorPicker').ColorPicker(
			{
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
					$('#EmitColorPicker').css('background-color', "#" + hex);
					_MaterialEditor.currentMaterial.emit.r = rgb.r / 255;
					_MaterialEditor.currentMaterial.emit.g = rgb.g / 255;
					_MaterialEditor.currentMaterial.emit.b = rgb.b / 255;
					_MaterialEditor.updateObject();
				},
				onChange: function (hsb, hex, rgb)
				{
					$('#EmitColorPicker').css('background-color', "#" + hex);
					_MaterialEditor.currentMaterial.emit.r = rgb.r / 255;
					_MaterialEditor.currentMaterial.emit.g = rgb.g / 255;
					_MaterialEditor.currentMaterial.emit.b = rgb.b / 255;
					_MaterialEditor.updateObject();
				}
			});
			$('#MaterialBasicSettings').append('<div />');
			$('#MaterialBasicSettings').append('<div style="margin-bottom:10px" id="specdiv" />');
			$('#specdiv').append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 15px;">Specular Color: </div>');
			$('#specdiv').append('<div id="SpecColorPicker" style="' + colorswatchstyle + '"></div>')
			var spec = this.currentMaterial.specularColor;
			$('#SpecColorPicker').css('background-color', 'rgb(' + Math.floor(spec.r * 255) + ',' + Math.floor(spec.g * 255) + ',' + Math.floor(spec.b * 255) + ')');
			$('#SpecColorPicker').ColorPicker(
			{
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
					$('#SpecColorPicker').css('background-color', "#" + hex);
					_MaterialEditor.currentMaterial.specularColor.r = rgb.r / 255;
					_MaterialEditor.currentMaterial.specularColor.g = rgb.g / 255;
					_MaterialEditor.currentMaterial.specularColor.b = rgb.b / 255;
					_MaterialEditor.updateObject();
				},
				onChange: function (hsb, hex, rgb)
				{
					$('#SpecColorPicker').css('background-color', "#" + hex);
					_MaterialEditor.currentMaterial.specularColor.r = rgb.r / 255;
					_MaterialEditor.currentMaterial.specularColor.g = rgb.g / 255;
					_MaterialEditor.currentMaterial.specularColor.b = rgb.b / 255;
					_MaterialEditor.updateObject();
				}
			});
			$('#' + 'MaterialBasicSettings').append('<div id="MaterialBasicSettingsnewLayer" style=width:100%;margin-top:10px/>');
			$('#' + 'MaterialBasicSettingsnewLayer').button(
			{
				label: 'Add Layer'
			});
			$('#' + 'MaterialBasicSettingsnewLayer').click(this.addLayer);
			for (var i = 0; i < this.currentMaterial.layers.length; i++)
			{
				$('#materialaccordion').append('	<h3>' + '		<a href="#">Texture Layer ' + i + '</a>' + '	</h3>' + '	<div id="Layer' + i + 'Settings">' + '	</div>');
				var layer = this.currentMaterial.layers[i];
				var rootid = 'Layer' + i + 'Settings';
				$('#' + rootid).append('<img id="' + rootid + 'thumb" class="BigTextureThumb"/>');
				$('#' + rootid + 'thumb').attr('src', this.currentMaterial.layers[i].src);
				$('#' + rootid).append('<div id="' + rootid + 'thumbsrc" class="BigTextureThumb" style="overflow:hidden; text-overflow:ellipsis; text-align: center;font-weight: bold;border: none;"/>');
				$('#' + rootid + 'thumbsrc').text(this.currentMaterial.layers[i].src);
				$('#' + rootid + 'thumb').attr('layer', i);
				$('#' + rootid + 'thumb').click(function ()
				{
					_MaterialEditor.activeTexture = $(this).attr('layer');
					_MapBrowser.show();
				});
				var layersliderprops = [
					{
						prop: 'alpha',
						min: 0,
						max: 1,
						step: .01
					},
					{
						prop: 'scalex',
						min: -10,
						max: 10,
						step: .1
					},
					{
						prop: 'scaley',
						min: -10,
						max: 10,
						step: .1
					},
					{
						prop: 'offsetx',
						min: -1,
						max: 1,
						step: .01
					},
					{
						prop: 'offsety',
						min: -1,
						max: 1,
						step: .01
					}, //		{prop:'rot',min:-2,max:2,step:.01}

				];
				for (var j = 0; j < layersliderprops.length; j++)
				{
					var prop = layersliderprops[j].prop;
					var inputstyle = "display: inline;float: right;padding: 0;width: 50px;border-radius: 6px;background: transparent;text-align: center;border-width: 1px;color: grey;"
					$('#' + rootid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + prop + ': </div>');
					$('#' + rootid).append('<input style="' + inputstyle + '" id="' + rootid + prop + 'value"></input>');
					$('#' + rootid + prop + 'value').change(this.LayerPropTypein);
					$('#' + rootid).append('<div id="' + rootid + prop + 'slider"/>');
					$('#' + rootid + prop + 'slider').attr('prop', prop);
					$('#' + rootid + prop + 'value').attr('prop', prop);
					$('#' + rootid + prop + 'slider').attr('layer', i);
					$('#' + rootid + prop + 'value').attr('layer', i);
					var val = this.currentMaterial.layers[i][prop];
					$('#' + rootid + prop + 'value').val(val);
					$('#' + rootid + prop + 'slider').slider(
					{
						step: layersliderprops[j].step,
						min: layersliderprops[j].min,
						max: layersliderprops[j].max,
						slide: this.LayerPropUpdate,
						stop: this.LayerPropUpdate,
						value: val
					});
				}
				$('#' + rootid).append('<div style="clear:right" id="' + rootid + 'mapToDiv" />');
				$('#' + rootid + 'mapToDiv').append('<div  style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">Map To Property: </div>');
				$('#' + rootid + 'mapToDiv').append('<select id="' + rootid + 'mapTo" style="float:right;clear:right">' + '<option value="1">Diffuse Color</option>' + '<option value="2">Bump Map</option>' + '<option value="3">Light Map</option>' + '<option value="4">Normal Map</option>' + '<option value="5">Specular Map</option>' + '<option value="6">Environment Map</option>' + '</select>');
				$('#' + rootid + 'mapTo').val(this.currentMaterial.layers[i].mapTo + "");
				$('#' + rootid + 'mapTo').attr('layer', i);
				$('#' + rootid + 'mapTo').change(function ()
				{
					_MaterialEditor.currentMaterial.layers[$(this).attr('layer')].mapTo = $(this).val();
					_MaterialEditor.updateObject();
				});
				$('#' + rootid).append('<div style="clear:right" id="' + rootid + 'mapInputDiv" />');
				$('#' + rootid + 'mapInputDiv').append('<div  style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">Coord Type: </div>');
				$('#' + rootid + 'mapInputDiv').append('<select id="' + rootid + 'mapInput" style="float:right;clear:right">' + '<option value="0">UV Set 1</option>' + '<option value="1">Cube Reflection</option>' + '<option value="2">Cube Refraction</option>' + '<option value="3">Spherical Reflection</option>' + '<option value="4">Spherical Reflection</option>' + '</select>');
				$('#' + rootid + 'mapInput').val(this.currentMaterial.layers[i].mapTo + "");
				$('#' + rootid + 'mapInput').attr('layer', i);
				$('#' + rootid + 'mapInput').change(function ()
				{
					_MaterialEditor.currentMaterial.layers[$(this).attr('layer')].mapInput = $(this).val();
					_MaterialEditor.updateObject();
				});
				//		$('#'+rootid).append('<div style="clear:right" id="'+rootid+'blendModeDiv" />');
				//		$('#'+rootid+'blendModeDiv').append('<div  style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">Blend Mode: </div>');
				//		$('#'+rootid+'blendModeDiv').append('<select id="'+rootid+'blendMode" style="float:right;clear:right">'+
				//		'<option value="0">Multiply</option>'+
				//		'<option value="1">Mix</option>'+
				//		'</select>');
				$('#' + rootid + 'blendMode').val(this.currentMaterial.layers[i].mapTo + "");
				$('#' + rootid + 'blendMode').attr('layer', i);
				$('#' + rootid + 'blendMode').change(function ()
				{
					_MaterialEditor.currentMaterial.layers[$(this).attr('layer')].blendMode = $(this).val();
					_MaterialEditor.updateObject();
				});
				$('#' + rootid).append('<div id="' + rootid + 'deleteLayer" style="width: 100%;margin-top: 10px;"/>');
				$('#' + rootid + 'deleteLayer').button(
				{
					label: 'Delete Layer'
				});
				$('#' + rootid + 'deleteLayer').attr('layer', i);
				$('#' + rootid + 'deleteLayer').click(this.deletelayer);
			}
			$("#materialaccordion").accordion(
			{
				fillSpace: true,
				heightStyle: "content",
				change: function ()
				{
					if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
				}
			});
			$(".ui-accordion-content").css('height', 'auto');
			//$('#materialeditor').resizable({
			//    maxHeight: 550,
			//    maxWidth: 320,
			//    minHeight: 150,
			//    minWidth: 320
			//});
		}
		this.setActiveTextureSrc = function (e)
		{
			var i = this.activeTexture;
			var rootid = 'Layer' + i + 'Settings';
			$('#' + rootid + "thumbsrc").text(e);
			$('#' + rootid + "thumb").attr('src', e);
			$('#Layer' + i + 'Settingsthumb').attr('class', '');
			window.setTimeout(function ()
			{
				$('#Layer' + i + 'Settingsthumb').attr('class', 'BigTextureThumb');
			}, 10);
			this.currentMaterial.layers[i].src = e;
			this.updateObject();
		}
		this.deletelayer = function ()
		{
			var layer = $(this).attr('layer');
			_MaterialEditor.currentMaterial.layers.splice(layer, 1);
			_MaterialEditor.updateObject();
			_MaterialEditor.BuildGUI();
		}
		this.addLayer = function ()
		{
			var newlayer = {};
			newlayer.offsetx = 0;
			newlayer.offsety = 0;
			newlayer.scalex = 1;
			newlayer.scaley = 1;
			newlayer.rot = 0;
			newlayer.blendMode = 0;
			newlayer.mapTo = 1;
			newlayer.mapInput = 0;
			newlayer.alpha = 1;
			newlayer.src = 'checker.jpg';
			_MaterialEditor.currentMaterial.layers.push(newlayer);
			_MaterialEditor.updateObject();
			_MaterialEditor.BuildGUI();
		}
		this.SelectionChanged = function (e, node)
		{
			try
			{
				if (node)
				{
					
					this.currentMaterial = vwf.getProperty(node.id, 'materialDef');
					if (!this.currentMaterial){
					if(this.isOpen()) this.hide();
					return;
					}
					if (this.isOpen()) this.BuildGUI();
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
		$(document).bind('selectionChanged', this.SelectionChanged.bind(this));
	}
});