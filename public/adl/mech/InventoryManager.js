function InventoryManager()
{
	
	$(document.body).append("<div id='InventoryManager' style='overflow:hidden'></div>");
	$(document.body).append("<div id='InventoryViewer' style='overflow:hidden'><div id='InventoryView' style='width: 100%;height: 100%;margin: -5px -5px 5px -10px;'/></div>");
	
	$('#InventoryManager').append("<div id='InventoryDisplay' style='background:#FFFFF8;border: 1px black solid;margin: 3px 3px 3px 3px;'></div>");
	$('#InventoryManager').append("<div id='InventoryManagerCreate'></div>");
	$('#InventoryManager').append("<div id='InventoryManagerDelete'></div>");
	$('#InventoryManager').append("<div id='InventoryManagerView'></div>");
	$('#InventoryManager').append("<div id='InventoryManagerRename'></div>");
	$('#InventoryManager').append("<div id='InventoryManagerMessage'></div>");
	$('#InventoryManagerCreate').button({label:'Create'});
	$('#InventoryManagerDelete').button({label:'Delete'});
	$('#InventoryManagerView').button({label:'View'});
	$('#InventoryManagerRename').button({label:'Rename'});
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
			$('#InventoryManagerMessage').html('You must select an object before createing a script from inventory');
			$('#InventoryManagerMessage').dialog('open');
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
		
			var campos = [_Editor.findscene().camera.getLocX(),_Editor.findscene().camera.getLocY(),_Editor.findscene().camera.getLocZ()];
			var ray = _Editor.GetCameraCenterRay();
			var dxy = _Editor.intersectLinePlane(ray,campos,[0,0,0],_Editor.WorldZ);
			var newintersectxy = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy*.99));
			
			t.properties.transform[12] = newintersectxy[0];
			t.properties.transform[13] = newintersectxy[1];
			t.properties.transform[14] = newintersectxy[2];
			t.properties.translation[0] = newintersectxy[0];
			t.properties.translation[1] = newintersectxy[1];
			t.properties.translation[2] = newintersectxy[2];
			_InventoryManager.createChild('index-vwf',GUID(),t,null,null); 
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
		
		if(t.id != undefined)
		{
			delete t.id;
			delete t.owner;
		}
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
	this.Take = function()
	{
		var t = vwf.getNode(_Editor.GetSelectedVWFNode().id);
		t = JSON.stringify(t);
		t = JSON.parse(t);
		_InventoryManager.DeleteIDsAndOwner(t);
		_DataManager.addInventoryItem(document.PlayerNumber,t,GUID(),'object');
		_InventoryManager.BuildGUI();
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
		$('#InventoryManager').dialog('open');
		$('#InventoryManager').dialog('option','position',[1282,40]);
		_InventoryManager.BuildGUI();
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
		
		var h = ($('#InventoryDisplay').parent().height()-45);
		$('#InventoryDisplay').css('height',h+'px');
	}
	$('#InventoryManager').dialog({title:'Inventory',modal:false,autoOpen:false,resizable:true,resize:this.resize,width:'300px',height:435});
	$('#InventoryManager').dialog('option','position',[1282,640]);
	$('#InventoryManagerMessage').dialog({title:'Inventory Message',modal:true,autoOpen:false,resizable:false});
	
	$('#InventoryViewer').dialog({title:'Inventory Viewer',modal:true,autoOpen:false,width:600,height:600,resizable:true,resize:function()
	{
		_InventoryManager.itemViewer.resize();
		
	}});
	$('#InventoryManager').dialog('option','position','center');
	this.hide = function()
	{
		$('#InventoryManager').dialog('close');
		
	}
	this.isOpen = function()
	{
		return $("#InventoryManager").dialog( "isOpen" );
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
		$(".inventoryItem").css('background','#FFFFF8');
		$(this).css('background','lightblue');
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
		$('#InventoryDisplay').append("<input type='text' id='InventoryRename' style='display: inline-block;top: 22.0px;position: absolute;padding: 0px;border: 1px solid black;margin: 0px;width: 80%;'/>");
		$('#InventoryRename').hide();
		$('#InventoryRename').keypress(_InventoryManager.rename)
		$('#InventoryRename').keydown(function(e){e.stopPropagation();})
		
		$('#InventoryRename').focus(function() { $(this).select(); } );
		
		$('#InventoryDisplay').append("<div id='InventoryObjects'><div>Objects</div></div>");
		$('#InventoryDisplay').append("<div id='InventoryScripts'><div>Scripts</div></div>");
		var inventory = _DataManager.getInventory(document.PlayerNumber);
		if(!inventory) return;
		for(var i in inventory.objects)
		{
			$('#InventoryObjects').append('<div class="inventoryItem" style="background:#FFFFF8;padding-left: 10px;" id="inventoryObject'+ToSafeID(i)+'" />');
			$('#inventoryObject'+ToSafeID(i)).html(i);
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
	}
	this.itemViewer = ace.edit("InventoryView");
    this.itemViewer.setTheme("ace/theme/chrome");
    this.itemViewer.getSession().setMode("ace/mode/json");
	this.itemViewer.setPrintMarginColumn(false);
	this.itemViewer.setFontSize('15px');
}
_InventoryManager = new InventoryManager();