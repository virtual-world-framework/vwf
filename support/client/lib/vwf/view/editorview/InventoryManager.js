function InventoryManager()
{
	
	$('#sidepanel').append("<div id='InventoryManager' class='ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active' style='padding-bottom:5px;overflow:hidden;height:auto'></div>");
	$(document.body).append("<div id='InventoryViewer' style='overflow:hidden'><div id='InventoryView' style='width: 100%;height: 100%;margin: -5px -5px 5px -10px;'/></div>");
	
	
	$('#InventoryManager').append("<div id='inventorymanagertitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Inventory</span></div>");
	$('#InventoryManager').append("<div id='InventoryDisplay' style='font:1.5em sans-serif;padding-bottom:5px;background:#FFFFF8;border: 1px black solid;margin: 3px 3px 3px 3px;height:auto'></div>");
	$('#InventoryManager').append("<div id='InventoryManagerCreate'></div>");
	$('#InventoryManager').append("<div id='InventoryManagerDelete'></div>");
	$('#InventoryManager').append("<div id='InventoryManagerView'></div>");
	$('#InventoryManager').append("<div id='InventoryManagerRename'></div>");
	$('#InventoryManager').append("<div id='InventoryManagerMessage'></div>");
	$('#InventoryManagerCreate').button({label:'Create'});
	$('#InventoryManagerDelete').button({label:'Delete'});
	$('#InventoryManagerView').button({label:'View'});
	$('#InventoryManagerRename').button({label:'Rename'});
	$('#inventorymanagertitle').append('<a id="inventoryclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
	$('#inventorymanagertitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/inventory.png" />');	
	$('#InventoryManager').css('border-bottom','5px solid #444444')
	$('#InventoryManager').css('border-left','2px solid #444444')
		
		$('#inventoryclose').click(function(){_InventoryManager.hide()});
	this.renameSelectedItem = function()
	{
		$('#InventoryRename').show();
		$('#InventoryRename').focus();
	}
	$('#InventoryManagerRename').click(this.renameSelectedItem);
	this.createInventoryItem = function()
	{
		
		if(!_Editor.GetSelectedVWFNode() && _InventoryManager.selectedType == 'script')
		{
			_Notifier.alert('You must select an object before createing a script from inventory');
			//$('#InventoryManagerMessage').dialog('open');
		}	
		if(_Editor.GetSelectedVWFNode() && _InventoryManager.selectedType == 'script')
		{
			_ScriptEditor.show();
			var t = _InventoryManager.selectedItem;
			if(t.type == 'method')
			_ScriptEditor.setSelectedMethod(t.name,t.body);
			if(t.type == 'event')
			_ScriptEditor.setSelectedEvent(t.name,t.body);
			
			
		}		
		if(_InventoryManager.selectedType == 'object')
		{
			var t = _InventoryManager.selectedItem;
		
		
			var newintersectxy = _Editor.GetInsertPoint()
			
			if(t.properties.type != 'modifier' && t.properties.type != 'behavior')
			{
				t.properties.transform[12] = newintersectxy[0];
				t.properties.transform[13] = newintersectxy[1];
				t.properties.transform[14] = newintersectxy[2];
				//t.properties.translation[0] = newintersectxy[0];
				//t.properties.translation[1] = newintersectxy[1];
				//t.properties.translation[2] = newintersectxy[2];
				t.properties.DisplayName = _Editor.GetUniqueName(t.properties.DisplayName);
				
				t = _DataManager.getCleanNodePrototype(t);
				_InventoryManager.setOwner(t,_UserManager.GetCurrentUserName());
				_Editor.SelectOnNextCreate();
				_InventoryManager.createChild('index-vwf',GUID(),t,null,null);
			}
			else{
				
				if(!_Editor.GetSelectedVWFNode())
				{
					_Notifier.alert('You must select an object before createing a script from inventory');
					return;
				}
				t = _DataManager.getCleanNodePrototype(t);
				_InventoryManager.setOwner(t,_UserManager.GetCurrentUserName());
				_InventoryManager.createChild(_Editor.GetSelectedVWFID(),GUID(),t,null,null);
			}
		}		
	}
	this.setOwner = function(t,owner)
	{
		t.properties.owner = owner;
		if(t.children)
		{
			for(var i in t.children)
			{
				this.setOwner(t.children[i],owner);
			}
		}
	}
	$('#InventoryManagerCreate').click(this.createInventoryItem);
	this.deleteSelectedItem = function()
	{
		
		_DataManager.deleteInventoryItem(document.PlayerNumber,_InventoryManager.selectedItem);
		_InventoryManager.BuildGUI();
	}
	$('#InventoryManagerDelete').click(this.deleteSelectedItem);
	this.viewInventoryItem = function()
	{
		$('#InventoryViewer').dialog('open');
		if(_InventoryManager.selectedType == 'object')
		{
		
			var text = JSON.stringify(_InventoryManager.selectedItem);
			text = text.replace(/([^\n])\{/gm,'$1\n\{');
			text = text.replace(/([^\n])\}/gm,'$1\n\}');
			var opening = 0;
			var inbracket = 0;
			var indentedtext = "";
			
			for(var i = 0; i < text.length-1; i++)
			{
				
				
				
				if(text[i] == '{')
					opening++;
				if(text[i] == ']')
					inbracket--;
				if(text[i] == '[')
					inbracket++;	
					
					
				if(text[i] == '\n'  )
				{
					
				}				
				else if(text[i] == ',' && !inbracket )
				{
					indentedtext += ',\n';
					for(var j = 0; j<opening;j++)
						indentedtext+='   ';
					
				}				
				else if(text[i] == '{'  )
				{
					indentedtext += '\n'
					for(var j = 0; j<opening;j++)
						indentedtext+='   ';
					indentedtext += '{\n'
					for(var j = 0; j<opening;j++)
						indentedtext+='   ';
				}
				else if(text[i] == '}'  )
				{
					indentedtext += '\n';
					for(var j = 0; j<opening;j++)
						indentedtext+='   ';
					indentedtext += '}\n'
					for(var j = 0; j<opening;j++)
						indentedtext+='   ';
					
					
				}
				else 
				{
				
				
				
					indentedtext += text[i];
				}

				if(text[i] == '}')
					opening--;
			}
			indentedtext += text[text.length-1];	
		
		
			_InventoryManager.itemViewer.setValue(indentedtext);
			_InventoryManager.itemViewer.selection.clearSelection();
			_InventoryManager.itemViewer.getSession().setMode("ace/mode/json");
		}
		if(_InventoryManager.selectedType == 'script')
		{
		
		
			_InventoryManager.itemViewer.setValue(_InventoryManager.selectedItem.body);
			_InventoryManager.itemViewer.selection.clearSelection();
			_InventoryManager.itemViewer.getSession().setMode("ace/mode/javascript");
		}
	}
	$('#InventoryManagerView').click(this.viewInventoryItem);
	this.DeleteIDsAndOwner = function(t)
	{
		
		
		delete t.id;
		delete t.owner;
		delete t.properties.owner;
		
		if(t.children)
		{	
			var children = []
			for(var i in t.children)
			{
				_InventoryManager.DeleteIDsAndOwner(t.children[i]);
				children.push(t.children[i]);
				delete t.children[i];
			}
			for(var i = 0; i < children.length; i++)
			{
				t.children[GUID()]=children[i];
			}
		}
	}
	this.Take = function(id)
	{
		
		if(!id)
			id = _Editor.GetSelectedVWFNode().id
		var t = _DataManager.getCleanNodePrototype(id);
		var name = t.properties.DisplayName || GUID();
		_DataManager.addInventoryItem(document.PlayerNumber,t,name,'object');
		_InventoryManager.BuildGUI();
		showSidePanel();
		window.setTimeout(function(){
		_InventoryManager.selectItem(name,'object');},450);
		if(!_InventoryManager.isOpen())
			_InventoryManager.show();
	}	
	this.createChild = function(parent,name,proto,uri,callback)
	{
		if(document.PlayerNumber == null)
		{
			_Notifier.notify('You must log in to participate');
			return;
		}
		
		vwf_view.kernel.createChild(parent,name,proto,uri,callback);
	}
	this.show = function()
	{
		//$('#InventoryManager').dialog('open');
		$('#InventoryManager').prependTo($('#InventoryManager').parent());
		$('#InventoryManager').show('blind',function()
		{
			if($('#sidepanel').data('jsp'))
					$('#sidepanel').data('jsp').reinitialise();
		});
		
		//$('#InventoryManager').dialog('option','position',[1282,40]);
		_InventoryManager.BuildGUI();
		showSidePanel();
		_InventoryManager.open =true;
		this.resize();
	}
	this.addScript = function(body,name,type)
	{
		var t = {};
		t.name = name;
		t.body = body;
		t.type = type;
		_DataManager.addInventoryItem(document.PlayerNumber,t,GUID(),'script');
		this.BuildGUI();
	}
	this.resize = function()
	{
		
		//var h = ($('#InventoryDisplay').parent().height()-45);
		//$('#InventoryDisplay').css('height',h+'px');
	}
	//$('#InventoryManager').dialog({title:'Inventory',modal:false,autoOpen:false,resizable:true,resize:this.resize,width:'300px',height:435});
	//$('#InventoryManager').dialog('option','position',[1282,640]);
	$('#InventoryManagerMessage').dialog({title:'Inventory Message',modal:true,autoOpen:false,resizable:false});
	
	$('#InventoryViewer').dialog({title:'Inventory Viewer',modal:true,autoOpen:false,width:600,height:600,resizable:true,resize:function()
	{
		_InventoryManager.itemViewer.resize();
		
	}});
	//$('#InventoryManager').dialog('option','position','center');
	this.hide = function()
	{
		//$('#InventoryManager').dialog('close');
		$('#InventoryManager').hide('blind',function(){
		if($('#sidepanel').data('jsp'))
					$('#sidepanel').data('jsp').reinitialise();
		if(!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible'))
				hideSidePanel();});
		
	}
	this.isOpen = function()
	{
		//return $("#InventoryManager").dialog( "isOpen" );
		return $('#InventoryManager').is(':visible');
	}
	this.offClicked = function()
	{
		$('#InventoryRename').hide();
		if(_InventoryManager.inRename)
		{
			_DataManager.renameInventoryItem(document.PlayerNumber,_InventoryManager.selectedName,$('#InventoryRename').val(),_InventoryManager.selectedType);
			_InventoryManager.BuildGUI();
			_InventoryManager.inRename = false;
		}
	}
	
	$('#InventoryDisplay').click(this.offClicked);
	
	this.itemClicked = function()
	{
		
		if(_InventoryManager.inRename)
		{
			_DataManager.renameInventoryItem(document.PlayerNumber,_InventoryManager.selectedName,$('#InventoryRename').val(),_InventoryManager.selectedType);
			_InventoryManager.BuildGUI();
			_InventoryManager.inRename = false;
		}
		$('#InventoryRename').hide();
		
		var name = $(this).attr('name');
		var type = $(this).attr('type');
		_InventoryManager.selectItem(name,type);
		
		$('#InventoryRename').val(name);
		$('#InventoryRename').css('top',($(this).position().top - .5)+'px');
	}
	this.selectItem = function(name,type)
	{

		var inventory = _DataManager.getInventory(document.PlayerNumber);
		if(type == 'script')
		_InventoryManager.selectedItem = inventory.scripts[name];
		if(type == 'object')
		_InventoryManager.selectedItem = inventory.objects[name];
		_InventoryManager.selectedType = type;
		_InventoryManager.selectedName = name;
		$(".inventoryItem").css('background','#FFFFF8');
		$('#InventoryDisplay').find('[name="'+name+'"]').css('background','lightblue');
	}
	this.rename = function(e)
	{
		e.stopPropagation();
		_InventoryManager.inRename = true;
		if(e.keyCode == 13)
		{
			
			_DataManager.renameInventoryItem(document.PlayerNumber,_InventoryManager.selectedName,$(this).val(),_InventoryManager.selectedType);
				$('#InventoryRename').hide();
			_InventoryManager.BuildGUI();
			_InventoryManager.inRename = false;
		}
	
	}
	this.BuildGUI = function()
	{
		
		$('#InventoryDisplay').empty();
		$('#InventoryDisplay').append("<input type='text' id='InventoryRename' style='display: inline-block;top: 22.0px;position: absolute;padding: 0px;font: 1.0em sans-serif;border: 1px solid black;margin: 0px;width: 80%;'/>");
		$('#InventoryRename').hide();
		$('#InventoryRename').keypress(_InventoryManager.rename)
		$('#InventoryRename').keydown(function(e){e.stopPropagation();})
		
		$('#InventoryRename').focus(function() { $(this).select(); } );
		
		$('#InventoryDisplay').append("<div id='InventoryObjects'><div style='font-weight:bold;border-bottom: 1px solid black;'>Objects</div></div>");
		$('#InventoryDisplay').append("<div id='InventoryScripts'><div style='font-weight:bold;border-bottom: 1px solid black;'>Scripts</div></div>");
		var inventory = _DataManager.getInventory(document.PlayerNumber);
		if(!inventory) return;
		for(var i in inventory.objects)
		{
			$('#InventoryObjects').append('<div class="inventoryItem" style="background:#FFFFF8;padding-left: 10px;" id="inventoryObject'+ToSafeID(i)+'" />');
			$('#inventoryObject'+ToSafeID(i)).html("<div style='font-weight:bold;display:inline'>"+i+"</div>" + " : " + (inventory.objects[i].properties.type || ""));
			$('#inventoryObject'+ToSafeID(i)).attr('name',i);
			$('#inventoryObject'+ToSafeID(i)).attr('type','object');
			$('#inventoryObject'+ToSafeID(i)).click(_InventoryManager.itemClicked);
		}
		
		for(var i in inventory.scripts)
		{
			$('#InventoryScripts').append('<div class="inventoryItem" id="inventoryScript'+ToSafeID(i)+'" style="background:#FFFFF8;padding-left: 10px;"/>');
			$('#inventoryScript'+ToSafeID(i)).html(i);
			$('#inventoryScript'+ToSafeID(i)).attr('name',i);
			$('#inventoryScript'+ToSafeID(i)).attr('type','script');
			$('#inventoryScript'+ToSafeID(i)).click(_InventoryManager.itemClicked);
		}
		
		if($('#sidepanel').data('jsp'))
					$('#sidepanel').data('jsp').reinitialise();
					
	}
	this.itemViewer = ace.edit("InventoryView");
    this.itemViewer.setTheme("ace/theme/chrome");
    this.itemViewer.getSession().setMode("ace/mode/json");
	this.itemViewer.setPrintMarginColumn(false);
	this.itemViewer.setFontSize('15px');
}
_InventoryManager = new InventoryManager();
_InventoryManager.hide();