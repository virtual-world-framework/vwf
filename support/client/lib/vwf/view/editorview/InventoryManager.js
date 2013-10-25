define(function ()
{
	var InventoryManager = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(InventoryManager);
				isInitialized = true;
			}
			return InventoryManager;
		}
	}

	function initialize()
	{
		$('#sidepanel').append("<div id='InventoryManager' class='SidePanelWindowBottomBorder ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active' style='padding-bottom:5px;overflow:hidden;height:auto'></div>");
		
		
		
		$(document.body).append("<div id='InventoryViewer' style='overflow:hidden'><div id='InventoryView' style='width: 100%;height: 100%;margin: -5px -5px 5px -10px;'/></div>");
		$('#InventoryManager').append("<div id='inventorymanagertitle' style = '' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix SidePanelWindowTitle' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Inventory</span></div>");
		
		$('#InventoryManager').append("<div id='InventoryControls' class=''></div>");
		$('#InventoryControls').append("<div id='InventoryTypeChoice' class=''></div>");
		$('#InventoryTypeChoice').append("<input type='radio' id='InventoryTypeChoicePersonal' name='InventoryTypeChoice' class='' checked='checked'></input><label for='InventoryTypeChoicePersonal'>Personal</label>");
		$('#InventoryTypeChoice').append("<input type='radio' id='InventoryTypeChoiceGlobal' name='InventoryTypeChoice' class=''></input><label for='InventoryTypeChoiceGlobal'>Global</label>");
		$('#InventoryControls').append("<input type='text' id='InventoryFilter' placeholder='filter' class=''></input>");
		$( "#InventoryTypeChoice" ).buttonset();
		$( "#InventoryTypeChoiceGlobal" ).click(function(e){
			
			_InventoryManager.global = true;
			_InventoryManager.NoAnimateRedraw();
		
		});
		
		$( "#InventoryFilter" ).keyup(function(e){
			_InventoryManager.BuildGUI();
		});
		
		$( "#InventoryTypeChoicePersonal" ).click(function(e){
			
			_InventoryManager.global = false;
			_InventoryManager.NoAnimateRedraw();
		
		});
		
		$('#InventoryManager').append("<div id='InventoryDisplay' class='InventoryPanel'></div>");
		$('#InventoryManager').append("<div id='InventoryManagerCreate'></div>");
		$('#InventoryManager').append("<div id='InventoryManagerDelete'></div>");
		$('#InventoryManager').append("<div id='InventoryManagerView'></div>");
		$('#InventoryManager').append("<div id='InventoryManagerRename'></div>");
		$('#InventoryManager').append("<div id='InventoryManagerMessage'></div>");
		$('#InventoryManagerCreate').button(
		{
			label: 'Create'
		});
		$('#InventoryManagerDelete').button(
		{
			label: 'Delete'
		});
		$('#InventoryManagerView').button(
		{
			label: 'View'
		});
		$('#InventoryManagerRename').button(
		{
			label: 'Rename'
		});
		$('#inventorymanagertitle').append('<a id="inventoryclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
		$('#inventorymanagertitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/inventory.png" />');
		$('#inventoryclose').click(function ()
		{
			_InventoryManager.hide()
		});
		this.renameSelectedItem = function ()
		{
			$('#InventoryRename').show();
			$('#InventoryRename').focus();
		}
		$('#InventoryManagerRename').click(this.renameSelectedItem);
		this.createInventoryItem = function ()
		{
			this.getInventoryItemAssetData(this.inventory[this.selectedName].key,function(item)
			{
				if (!_Editor.GetSelectedVWFNode() && (_InventoryManager.selectedType == 'event' || _InventoryManager.selectedType == 'method'))
				{
					_Notifier.alert('You must select an object before createing a script from inventory');
					//$('#InventoryManagerMessage').dialog('open');
				}
				if (_Editor.GetSelectedVWFNode() && (_InventoryManager.selectedType == 'event' || _InventoryManager.selectedType == 'method'))
				{
					_ScriptEditor.show();
					var t = item;
					if (t.type == 'method') _ScriptEditor.setSelectedMethod(t.name, t.body);
					if (t.type == 'event') _ScriptEditor.setSelectedEvent(t.name, t.body);
				}
				if (_InventoryManager.selectedType != 'event' && _InventoryManager.selectedType != 'method')
				{
					var t = item;
					var newintersectxy = _Editor.GetInsertPoint()
					if (t.properties.type != 'modifier' && t.properties.type != 'behavior')
					{
						t.properties.transform[12] = newintersectxy[0];
						t.properties.transform[13] = newintersectxy[1];
						t.properties.transform[14] = newintersectxy[2];
						//t.properties.translation[0] = newintersectxy[0];
						//t.properties.translation[1] = newintersectxy[1];
						//t.properties.translation[2] = newintersectxy[2];
						t.properties.DisplayName = _Editor.GetUniqueName(t.properties.DisplayName);
						t = _DataManager.getCleanNodePrototype(t);
						_InventoryManager.setOwner(t, _UserManager.GetCurrentUserName());
						_Editor.SelectOnNextCreate();
						_InventoryManager.createChild('index-vwf', GUID(), t, null, null);
					}
					else
					{
						if (!_Editor.GetSelectedVWFNode())
						{
							_Notifier.alert('You must select an object before createing a script from inventory');
							return;
						}
						t = _DataManager.getCleanNodePrototype(t);
						_InventoryManager.setOwner(t, _UserManager.GetCurrentUserName());
						_InventoryManager.createChild(_Editor.GetSelectedVWFID(), GUID(), t, null, null);
					}
				}
			});
		}.bind(this)
		this.setOwner = function (t, owner)
		{
			t.properties.owner = owner;
			if (t.children)
			{
				for (var i in t.children)
				{
					this.setOwner(t.children[i], owner);
				}
			}
		}
		$('#InventoryManagerCreate').click(this.createInventoryItem);
		this.deleteInventoryItem = function(id,cb)
		{
			var URL = '/vwfDataManager.svc/inventoryitem?AID=';
			if(this.global)
				URL = '/vwfDataManager.svc/globalasset?AID='
			$.ajax(URL + id,{
				
				type:'DELETE',
				success:function(err,d,xhr)
				{
					cb();
				},
			});
		}
		this.deleteSelectedItem = function ()
		{
			this.deleteInventoryItem(this.inventory[_InventoryManager.selectedName].key,function(){
				_InventoryManager.NoAnimateRedraw();
			});
			
		}.bind(this)
		$('#InventoryManagerDelete').click(this.deleteSelectedItem);
		this.getInventoryItemAssetData = function(id,cb)
		{
		
			var URL = '/vwfDataManager.svc/inventoryitemassetdata?AID=';
			if(this.global)
				URL = '/vwfDataManager.svc/globalassetassetdata?AID='
		
			$.ajax(URL + id,{
				type:'GET',
				success:function(err,d,xhr)
				{
					var item = JSON.parse(xhr.responseText);
					cb(item);
				}
			});
		
		}
		this.NoAnimateRedraw = function(cb)
		{
		
			_InventoryManager.getInventory(function(inventory)
				{
					
					if(!_InventoryManager.isOpen())
					{
						$('#InventoryManager').prependTo($('#InventoryManager').parent());
						$('#InventoryManager').show('blind', function ()
						{
							if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
						});
						showSidePanel();
					}
					_InventoryManager.BuildGUI(inventory);
					_InventoryManager.open = true;
					if(cb) cb();
				});
		
		}
		this.viewInventoryItem = function ()
		{
			
			this.getInventoryItemAssetData(this.inventory[this.selectedName].key,
			function(item)
			{
				
				$('#InventoryViewer').dialog('open');
				if (_InventoryManager.selectedType != 'event' &&  _InventoryManager.selectedType != 'method')
				{
					var text = JSON.stringify(item);
					text = text.replace(/([^\n])\{/gm, '$1\n\{');
					text = text.replace(/([^\n])\}/gm, '$1\n\}');
					var opening = 0;
					var inbracket = 0;
					var indentedtext = "";
					for (var i = 0; i < text.length - 1; i++)
					{
						if (text[i] == '{') opening++;
						if (text[i] == ']') inbracket--;
						if (text[i] == '[') inbracket++;
						if (text[i] == '\n')
						{}
						else if (text[i] == ',' && !inbracket)
						{
							indentedtext += ',\n';
							for (var j = 0; j < opening; j++) indentedtext += '   ';
						}
						else if (text[i] == '{')
						{
							indentedtext += '\n'
							for (var j = 0; j < opening; j++) indentedtext += '   ';
							indentedtext += '{\n'
							for (var j = 0; j < opening; j++) indentedtext += '   ';
						}
						else if (text[i] == '}')
						{
							indentedtext += '\n';
							for (var j = 0; j < opening; j++) indentedtext += '   ';
							indentedtext += '}\n'
							for (var j = 0; j < opening; j++) indentedtext += '   ';
						}
						else
						{
							indentedtext += text[i];
						}
						if (text[i] == '}') opening--;
					}
					indentedtext += text[text.length - 1];
					_InventoryManager.itemViewer.setValue(indentedtext);
					_InventoryManager.itemViewer.selection.clearSelection();
					_InventoryManager.itemViewer.getSession().setMode("ace/mode/json");
				}
				if (_InventoryManager.selectedType == 'script')
				{
					_InventoryManager.itemViewer.setValue(_InventoryManager.selectedItem.body);
					_InventoryManager.itemViewer.selection.clearSelection();
					_InventoryManager.itemViewer.getSession().setMode("ace/mode/javascript");
				}
			});
		}.bind(this);
		$('#InventoryManagerView').click(this.viewInventoryItem);
		this.DeleteIDsAndOwner = function (t)
		{
			delete t.id;
			delete t.owner;
			delete t.properties.owner;
			if (t.children)
			{
				var children = []
				for (var i in t.children)
				{
					_InventoryManager.DeleteIDsAndOwner(t.children[i]);
					children.push(t.children[i]);
					delete t.children[i];
				}
				for (var i = 0; i < children.length; i++)
				{
					t.children[GUID()] = children[i];
				}
			}
		}
		this.addInventoryItem = function(data,title,type,cb)
		{
			$.ajax('./vwfDataManager.svc/inventoryitem?title=' + title +'&type=' + type,{
				
				type:'POST',
				success:function(err,d,xhr)
				{
					cb($.trim(xhr.responseText));
				},
				data:JSON.stringify(data),
				dateType:'text'
			});
		
		}
		this.addGlobalInventoryItem = function(data,title,type,cb)
		{
			$.ajax('./vwfDataManager.svc/globalasset?title=' + title +'&type=' + type,{
				
				type:'POST',
				success:function(err,d,xhr)
				{
					cb($.trim(xhr.responseText));
				},
				data:JSON.stringify(data),
				dateType:'text'
			});
		
		}
		this.Take = function (id)
		{
			if (!id) id = _Editor.GetSelectedVWFNode().id
			var t = _DataManager.getCleanNodePrototype(id);
			var title = t.properties.DisplayName || GUID();
			var type = 'object';
			if(t.properties && t.properties.type)
			type = t.properties.type
			this.addInventoryItem(t, title, type,function(key)
			{
				_InventoryManager.global = false;
				_InventoryManager.NoAnimateRedraw(function()
				{
					_InventoryManager.selectKey(key);
				});
			});
		}
		this.Publish = function (id)
		{
			if (!id) id = _Editor.GetSelectedVWFNode().id
			var t = _DataManager.getCleanNodePrototype(id);
			var title = t.properties.DisplayName || GUID();
			var type = 'object';
			if(t.properties && t.properties.type)
			type = t.properties.type
			this.addGlobalInventoryItem(t, title, type,function(key)
			{
				_InventoryManager.global = true;
				_InventoryManager.NoAnimateRedraw(function()
				{
					_InventoryManager.selectKey(key);
				});
			});
		}
		this.createChild = function (parent, name, proto, uri, callback)
		{
			if (_UserManager.GetCurrentUserName() == null)
			{
				_Notifier.notify('You must log in to participate');
				return;
			}
			vwf_view.kernel.createChild(parent, name, proto, uri, callback);
		}
		this.getInventory = function(cb)
		{
			var URL = '/vwfDataManager.svc/inventory';
			if(this.global)
				URL = '/vwfDataManager.svc/globalassets'
			var inventory = null;
			$.ajax(URL,{
				
				type:'GET',
				success:function(err,d,xhr)
				{
					inventory = JSON.parse(xhr.responseText);
					cb(inventory);
				}
			});
		}
		this.show = function ()
		{
			this.getInventory(function(inventory)
			{
				//$('#InventoryManager').dialog('open');
				$('#InventoryManager').prependTo($('#InventoryManager').parent());
				$('#InventoryManager').show('blind', function ()
				{
					if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
				});
				//$('#InventoryManager').dialog('option','position',[1282,40]);
				_InventoryManager.BuildGUI(inventory);
				showSidePanel();
				_InventoryManager.open = true;
				
			});
		}
		this.addScript = function (body, name, type)
		{
			var t = {};
			t.name = name;
			t.body = body;
			t.type = type;
			this.addInventoryItem(t, GUID(), 'script');
			this.BuildGUI();
		}
		this.resize = function ()
		{
			//var h = ($('#InventoryDisplay').parent().height()-45);
			//$('#InventoryDisplay').css('height',h+'px');
		}
		//$('#InventoryManager').dialog({title:'Inventory',modal:false,autoOpen:false,resizable:true,resize:this.resize,width:'300px',height:435});
		//$('#InventoryManager').dialog('option','position',[1282,640]);
		$('#InventoryManagerMessage').dialog(
		{
			title: 'Inventory Message',
			modal: true,
			autoOpen: false,
			resizable: false
		});
		$('#InventoryViewer').dialog(
		{
			title: 'Inventory Viewer',
			modal: true,
			autoOpen: false,
			width: 600,
			height: 600,
			resizable: true,
			resize: function ()
			{
				_InventoryManager.itemViewer.resize();
			}
		});
		//$('#InventoryManager').dialog('option','position','center');
		this.hide = function ()
		{
			//$('#InventoryManager').dialog('close');
			$('#InventoryManager').hide('blind', function ()
			{
				if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
				if (!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible')) hideSidePanel();
			});
		}
		this.isOpen = function ()
		{
			//return $("#InventoryManager").dialog( "isOpen" );
			return $('#InventoryManager').is(':visible');
		}
		this.renameInventoryItem = function(id,val,cb)
		{
			
			$.ajax('./vwfDataManager.svc/inventoryitemmetadata?AID=' + id,{
				
				type:'POST',
				success:function(err,d,xhr)
				{
					cb();
				},
				data:JSON.stringify({title:val}),
				dateType:'text'
			});
		
		}
		this.offClicked = function ()
		{
			$('#InventoryRename').hide();
			if (_InventoryManager.inRename)
			{
				_InventoryManager.renameInventoryItem(this.inventory[_InventoryManager.selectedName].id, $('#InventoryRename').val(),function(){
				
				_InventoryManager.inRename = false;
				_InventoryManager.NoAnimateRedraw();
				});
			}
		}
		$('#InventoryDisplay').click(this.offClicked);
		this.itemClicked = function ()
		{
			if (_InventoryManager.inRename)
			{
				_InventoryManager.renameInventoryItem(this.inventory[_InventoryManager.selectedName].id, $('#InventoryRename').val(),function(){
				_InventoryManager.inRename = false;
				_InventoryManager.NoAnimateRedraw();
				});
			}
			$('#InventoryRename').hide();
			var name = $(this).attr('name');
			var type = $(this).attr('type');
			_InventoryManager.selectItem(name, type);
			$('#InventoryRename').val(_InventoryManager.inventory[name].title);
			$('#InventoryRename').css('top', ($(this).position().top - .5) + 'px');
		}
		this.selectItem = function (name, type)
		{
			var inventory = this.inventory;
			_InventoryManager.selectedType = type;
			_InventoryManager.selectedName = name;
			$(".inventoryItem").css('background', '#FFFFF8');
			$('#InventoryDisplay').find('[name="' + name + '"]').css('background', 'lightblue');
		}
		this.selectKey = function (key)
		{
			var inventory = this.inventory;
			for(var i = 0; i < inventory.length; i++)
			{
				if(inventory[i].key == key)
					this.selectItem(i,inventory[i].type);
			}
		}
		this.rename = function (e)
		{
			e.stopPropagation();
			_InventoryManager.inRename = true;
			if (e.keyCode == 13)
			{
				_InventoryManager.renameInventoryItem(this.inventory[_InventoryManager.selectedName].key, $('#InventoryRename').val(),function(){
				_InventoryManager.inRename = false;
				_InventoryManager.NoAnimateRedraw();
				});
			}
		}.bind(this)
		this.BuildGUI = function (newInventory)
		{
			
			var filter = $('#InventoryFilter').val();
			if(newInventory)
				this.inventory = newInventory
			var inventory = this.inventory;
			
			$('#InventoryDisplay').empty();
			$('#InventoryDisplay').append("<input type='text' id='InventoryRename' class='InventoryRename'/>");
			$('#InventoryRename').hide();
			$('#InventoryRename').keypress(_InventoryManager.rename)
			$('#InventoryRename').keydown(function (e)
			{
				e.stopPropagation();
			})
			$('#InventoryRename').focus(function ()
			{
				$(this).select();
			});
			
			if (!inventory) return;
			for (var i=0;i < inventory.length; i++)
			{
				if(!filter || inventory[i].title.indexOf(filter) != -1 || inventory[i].type.indexOf(filter) != -1 )
				{
					$('#InventoryDisplay').append('<div class="inventoryItem" id="InventoryDisplay' + i + '" />');
					$('#InventoryDisplay' + (i)).html("<div style='font-weight:bold;display:inline'>" + inventory[i].title + "</div>" + " : " + (inventory[i].type || ""));
					$('#InventoryDisplay' + (i)).attr('name', i);
					$('#InventoryDisplay' + (i)).attr('type', inventory[i].type);
					$('#InventoryDisplay' + (i)).click(_InventoryManager.itemClicked);
				}
			}
			
			if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
		}
		this.itemViewer = ace.edit("InventoryView");
		this.itemViewer.setTheme("ace/theme/chrome");
		this.itemViewer.getSession().setMode("ace/mode/json");
		this.itemViewer.setPrintMarginColumn(false);
		this.itemViewer.setFontSize('15px');
		this.hide();
	}
});