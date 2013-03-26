function GlobalInventoryManager()
{
	
	$('#sidepanel').append("<div id='GlobalInventoryManager' class='ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active' style='padding-bottom:5px;overflow:hidden;height:auto'></div>");
	$(document.body).append("<div id='InventoryViewer' style='overflow:hidden'><div id='InventoryView' style='width: 100%;height: 100%;margin: -5px -5px 5px -10px;'/></div>");
	
	
	$('#GlobalInventoryManager').append("<div id='GlobalInventoryManagertitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Global Inventory</span></div>");
	$('#GlobalInventoryManager').append("<div id='InventoryDisplay' style='cursor:pointer;font:1.5em sans-serif;padding-bottom:5px;background:#FFFFF8;border: 1px black solid;margin: 3px 3px 3px 3px;height:auto'></div>");
	$('#GlobalInventoryManager').append("<div id='GlobalInventoryManagerCreate'></div>");
	$('#GlobalInventoryManager').append("<div id='GlobalInventoryManagerDelete'></div>");
	$('#GlobalInventoryManager').append("<div id='GlobalInventoryManagerView'></div>");
	$('#GlobalInventoryManager').append("<div id='GlobalInventoryManagerRename'></div>");
	$('#GlobalInventoryManager').append("<div id='GlobalInventoryManagerMessage'></div>");
	$('#GlobalInventoryManagerCreate').button({label:'Create'});
	$('#GlobalInventoryManagerDelete').button({label:'Delete'});
	$('#GlobalInventoryManagerView').button({label:'View'});
	$('#GlobalInventoryManagerRename').button({label:'Rename'});
	$('#GlobalInventoryManagertitle').append('<a id="ginventoryclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
	$('#GlobalInventoryManagertitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/inventory.png" />');	
	$('#GlobalInventoryManager').css('border-bottom','5px solid #444444')
	$('#GlobalInventoryManager').css('border-left','2px solid #444444')
		
		$('#ginventoryclose').click(function(){_GlobalInventoryManager.hide()});
	this.renameSelectedItem = function()
	{
	
			
			if(_GlobalInventoryManager.selectedItem.properties.owner != _UserManager.GetCurrentUserName())
			{
				_Notifier.alert('Only the owner of this object may rename it in the global inventory');
				return;
			}
				
		$('#InventoryRename').show();
		$('#InventoryRename').focus();
	}
	$('#GlobalInventoryManagerRename').click(this.renameSelectedItem);
	this.createInventoryItem = function()
	{
		
		
			
			 var ret = $.ajax({
			  type: "GET",
			  url: '/vwfDataManager.svc/globalasset?AID='+_GlobalInventoryManager.selectedItem,
			  data: JSON.stringify(t),
			  async:false
			});
			
			var t = JSON.parse(ret.responseText);
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
				_GlobalInventoryManager.setOwner(t,_UserManager.GetCurrentUserName());
				_Editor.SelectOnNextCreate();
				_GlobalInventoryManager.createChild('index-vwf',GUID(),t,null,null);
			}
			else{
				
				if(!_Editor.GetSelectedVWFNode())
				{
					_Notifier.alert('You must select an object before createing a script from inventory');
					return;
				}
				t = _DataManager.getCleanNodePrototype(t);
				_GlobalInventoryManager.setOwner(t,_UserManager.GetCurrentUserName());
				_GlobalInventoryManager.createChild(_Editor.GetSelectedVWFID(),GUID(),t,null,null);
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
	$('#GlobalInventoryManagerCreate').click(this.createInventoryItem);
	this.deleteSelectedItem = function()
	{
		
	}
	$('#GlobalInventoryManagerDelete').click(this.deleteSelectedItem);
	this.viewInventoryItem = function()
	{
		$('#InventoryViewer').dialog('open');
		if(_GlobalInventoryManager.selectedType == 'object')
		{
			
	    var ret = $.ajax({
		  type: "GET",
		  url: '/vwfDataManager.svc/globalasset?AID='+_GlobalInventoryManager.selectedItem,
		  data: JSON.stringify(t),
		  async:false
		});
			
			var text = ret.responseText;
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
		
		
			_GlobalInventoryManager.itemViewer.setValue(indentedtext);
			_GlobalInventoryManager.itemViewer.selection.clearSelection();
			_GlobalInventoryManager.itemViewer.getSession().setMode("ace/mode/json");
		}
		if(_GlobalInventoryManager.selectedType == 'script')
		{
		
		
			_GlobalInventoryManager.itemViewer.setValue(_GlobalInventoryManager.selectedItem.body);
			_GlobalInventoryManager.itemViewer.selection.clearSelection();
			_GlobalInventoryManager.itemViewer.getSession().setMode("ace/mode/javascript");
		}
	}
	$('#GlobalInventoryManagerView').click(this.viewInventoryItem);
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
				_GlobalInventoryManager.DeleteIDsAndOwner(t.children[i]);
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
		if(t.properties.owner != _UserManager.GetCurrentUserName())
		{
			_Notifier.alert('You may only publish objects that you own');
			return;
		}		
		var name = t.properties.DisplayName || GUID();
		var AID = name;
		var UID = _UserManager.GetCurrentUserName();
		var P = _DataManager.GetProfileForUser(UID).Password;
		$.ajax({
		  type: "POST",
		  url: '/vwfDataManager.svc/globalasset?AID='+AID+'&UID='+UID+'&P='+P,
		  data: JSON.stringify(t),
		  async:false
		});
		
		_GlobalInventoryManager.BuildGUI();
		showSidePanel();
		window.setTimeout(function(){
		_GlobalInventoryManager.selectItem(name,'object');},450);
		if(!_GlobalInventoryManager.isOpen())
			_GlobalInventoryManager.show();
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
		//$('#GlobalInventoryManager').dialog('open');
		$('#GlobalInventoryManager').prependTo($('#GlobalInventoryManager').parent());
		$('#GlobalInventoryManager').show('blind',function()
		{
			if($('#sidepanel').data('jsp'))
					$('#sidepanel').data('jsp').reinitialise();
		});
		
		//$('#GlobalInventoryManager').dialog('option','position',[1282,40]);
		_GlobalInventoryManager.BuildGUI();
		showSidePanel();
		_GlobalInventoryManager.open =true;
		this.resize();
	}
	
	this.resize = function()
	{
		
		//var h = ($('#InventoryDisplay').parent().height()-45);
		//$('#InventoryDisplay').css('height',h+'px');
	}
	//$('#GlobalInventoryManager').dialog({title:'Inventory',modal:false,autoOpen:false,resizable:true,resize:this.resize,width:'300px',height:435});
	//$('#GlobalInventoryManager').dialog('option','position',[1282,640]);
	$('#GlobalInventoryManagerMessage').dialog({title:'Inventory Message',modal:true,autoOpen:false,resizable:false});
	
	$('#InventoryViewer').dialog({title:'Inventory Viewer',modal:true,autoOpen:false,width:600,height:600,resizable:true,resize:function()
	{
		_GlobalInventoryManager.itemViewer.resize();
		
	}});
	//$('#GlobalInventoryManager').dialog('option','position','center');
	this.hide = function()
	{
		//$('#GlobalInventoryManager').dialog('close');
		$('#GlobalInventoryManager').hide('blind',function(){
		
		if($('#sidepanel').data('jsp'))
					$('#sidepanel').data('jsp').reinitialise();
		if(!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible'))
				hideSidePanel();});
		
	}
	this.isOpen = function()
	{
		//return $("#GlobalInventoryManager").dialog( "isOpen" );
		return $('#GlobalInventoryManager').is(':visible');
	}
	this.offClicked = function()
	{
		$('#InventoryRename').hide();
		if(_GlobalInventoryManager.inRename)
		{	
			
			if(_GlobalInventoryManager.selectedItem.properties.owner == _UserManager.GetCurrentUserName())
			{	
				//_DataManager.renameInventoryItem("___Global___",_GlobalInventoryManager.selectedName,$('#InventoryRename').val(),_GlobalInventoryManager.selectedType);
				_GlobalInventoryManager.BuildGUI();
				_GlobalInventoryManager.inRename = false;
			}
			else
				_Notifier.alert('Only the owner of this object may rename it in the global inventory');
		}
	}
	
	$('#InventoryDisplay').click(this.offClicked);
	
	this.itemClicked = function()
	{
		
		if(_GlobalInventoryManager.inRename)
		{
			
			if(_GlobalInventoryManager.selectedItem.properties.owner == _UserManager.GetCurrentUserName())
			{	
				//_DataManager.renameInventoryItem("___Global___",_GlobalInventoryManager.selectedName,$('#InventoryRename').val(),_GlobalInventoryManager.selectedType);
				_GlobalInventoryManager.BuildGUI();
				_GlobalInventoryManager.inRename = false;
			}
			else
				_Notifier.alert('Only the owner of this object may remove it from the global inventory');
		}
		$('#InventoryRename').hide();
		
		var name = $(this).attr('name');
		var type = $(this).attr('type');
		_GlobalInventoryManager.selectItem(name,type);
		
		$('#InventoryRename').val(name);
		$('#InventoryRename').css('top',($(this).position().top - .5)+'px');
	}
	this.selectItem = function(name,type)
	{

		console.log(name);
		_GlobalInventoryManager.selectedItem = name;
		_GlobalInventoryManager.selectedType = type;
		_GlobalInventoryManager.selectedName = name;
		$(".inventoryItem").css('background','#FFFFF8');
		$('#InventoryDisplay').find('[name="'+name+'"]').css('background','lightblue');
	}
	this.rename = function(e)
	{
		e.stopPropagation();
		_GlobalInventoryManager.inRename = true;
		if(e.keyCode == 13)
		{
			
			
			if(_GlobalInventoryManager.selectedItem.properties.owner == _UserManager.GetCurrentUserName())
			{	
				//_DataManager.renameInventoryItem("___Global___",_GlobalInventoryManager.selectedName,$('#InventoryRename').val(),_GlobalInventoryManager.selectedType);
				_GlobalInventoryManager.BuildGUI();
				_GlobalInventoryManager.inRename = false;
			}
			else
				_Notifier.alert('Only the owner of this object may rename it in the global inventory');
		}
	
	}
	this.recurseDefs = function(rootid,inventory)
	{
		for(var j=0; j < inventory.length; j++)
		{	
			var  i = inventory[j];
			if(i.constructor == String)
			{
			$('#'+rootid).append('<div class="inventoryItem" style="overflow:hidden;background:#FFFFF8;padding-left: 10px;border-left: 1px solid rgb(228, 228, 228);" id="inventoryObject'+ToSafeID(i)+'" />');
			$('#inventoryObject'+ToSafeID(i)).html("<div style='display:inline'>"+i.substr(i.lastIndexOf('/')+1)+"</div>");
			$('#inventoryObject'+ToSafeID(i)).attr('name',i);
			$('#inventoryObject'+ToSafeID(i)).attr('type','object');
			$('#inventoryObject'+ToSafeID(i)).click(_GlobalInventoryManager.itemClicked);
			}
			else
			{	
				var sectiontitle = Object.keys(i)[0] + "";
				
				var o = i[sectiontitle];
				if(o.length > 0)
				{
					$('#'+rootid).append("<div id='"+ToSafeID(sectiontitle)+"' style='overflow:hidden;border-left: 1px solid rgb(228, 228, 228);padding-left:10px'><span style='width: 10px;display: inline-block;cursor:pointer;font-weight:bold' id='"+ToSafeID(sectiontitle)+'collapse'+"'>-</span><span style='font-weight:bold'>"+sectiontitle.substr(sectiontitle.lastIndexOf('/')+1)+"</span></div>");
					$('#'+ToSafeID(sectiontitle)+'collapse').click(function()
					{
						
						if($(this).parent()[0].style.height != '1em')
						{
							$(this).html('+');
							$(this).parent().css('height','1em');
							
						}
						else
						{
							$(this).parent().css('height','initial');
							$(this).html('-');
						}
					});
					
					
					this.recurseDefs(ToSafeID(sectiontitle),o);
				}
			}
		}
	}
	this.BuildGUI = function()
	{
		//_DataManager.GetProfileForUser("___Global___",true);
		$('#InventoryDisplay').empty();
		$('#InventoryDisplay').append("<input type='text' id='InventoryRename' style='display: inline-block;top: 22.0px;position: absolute;padding: 0px;font: 1.0em sans-serif;border: 1px solid black;margin: 0px;width: 80%;'/>");
		$('#InventoryRename').hide();
		$('#InventoryRename').keypress(_GlobalInventoryManager.rename)
		$('#InventoryRename').keydown(function(e){e.stopPropagation();})
		
		$('#InventoryRename').focus(function() { $(this).select(); } );
		
		$('#InventoryDisplay').append("<div id='InventoryObjects'></div>");
		//$('#InventoryDisplay').append("<div id='InventoryScripts'></div>");
		
		var ret = $.ajax({
		  type: "GET",
		  url: '/vwfDataManager.svc/globalassets',
		  data: JSON.stringify(t),
		  async:false
		});
		
		
		
		var inventory = JSON.parse(JSON.parse(ret.responseText).replace(/\\/g,'/'));
		if(!inventory) return;
		
		this.recurseDefs('InventoryObjects',inventory.root);
		
		// for(var i in inventory.scripts)
		// {
			// $('#InventoryScripts').append('<div class="inventoryItem" id="inventoryScript'+ToSafeID(i)+'" style="background:#FFFFF8;padding-left: 10px;"/>');
			// $('#inventoryScript'+ToSafeID(i)).html(i);
			// $('#inventoryScript'+ToSafeID(i)).attr('name',i);
			// $('#inventoryScript'+ToSafeID(i)).attr('type','script');
			// $('#inventoryScript'+ToSafeID(i)).click(_GlobalInventoryManager.itemClicked);
		// }
		
		if($('#sidepanel').data('jsp'))
					$('#sidepanel').data('jsp').reinitialise();
	}
	this.itemViewer = ace.edit("InventoryView");
    this.itemViewer.setTheme("ace/theme/chrome");
    this.itemViewer.getSession().setMode("ace/mode/json");
	this.itemViewer.setPrintMarginColumn(false);
	this.itemViewer.setFontSize('15px');
}
_GlobalInventoryManager = new GlobalInventoryManager();
_GlobalInventoryManager.hide();