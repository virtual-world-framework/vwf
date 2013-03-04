function hierarchyManager()
{
	
	$('#sidepanel').append("<div id='hierarchyManager' class='ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active' style='padding-bottom:5px;overflow:hidden;height:auto'></div>");
	
	$('#hierarchyManager').append("<div id='hierarchyManagertitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Hierarchy</span></div>");
	$('#hierarchyManager').append("<div id='hierarchyDisplay' style='font:1.5em sans-serif;padding-bottom:5px;background:#FFFFF8;border: 1px black solid;margin: 3px 3px 3px 3px;height:auto'></div>");
	$('#hierarchyManager').append("<div id='hierarchyManagerMakeNode'></div>");
	$('#hierarchyManager').append("<div id='hierarchyManagerSelect'></div>");
	$('#hierarchyManagerMakeNode').button({label:'Make VWF Node'});
	$('#hierarchyManagerSelect').button({label:'Select'});
	$('#hierarchyManagertitle').append('<a id="hierarchyclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
	$('#hierarchyManagertitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/hierarchy.gif" />');	
	$('#hierarchyManager').css('border-bottom','5px solid #444444')
	$('#hierarchyManager').css('border-left','2px solid #444444')
		
	$('#hierarchyclose').click(function(){HierarchyManager.hide()});
	$('#hierarchyManagerMakeNode').click(function(){HierarchyManager.makeVWFNode()});
	$('#hierarchyManagerSelect').click(function(){HierarchyManager.select()});
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
		//$('#hierarchyManager').dialog('open');
		$('#hierarchyManager').prependTo($('#hierarchyManager').parent());
		$('#hierarchyManager').show('blind',function()
		{
			
		});
		
		//$('#hierarchyManager').dialog('option','position',[1282,40]);
		HierarchyManager.BuildGUI();
		showSidePanel();
		HierarchyManager.open =true;
		
	}
	
	this.hide = function()
	{
		//$('#hierarchyManager').dialog('close');
		$('#hierarchyManager').hide('blind',function(){if(!$('#sidepanel').children().is(':visible'))
				hideSidePanel();});
		
	}
	this.isOpen = function()
	{
		//return $("#hierarchyManager").dialog( "isOpen" );
		return $('#hierarchyManager').is(':visible');
	}
	this.offClicked = function()
	{
		$('#InventoryRename').hide();
		if(HierarchyManager.inRename)
		{
			_DataManager.renamehierarchyItem(document.PlayerNumber,HierarchyManager.selectedName,$('#InventoryRename').val(),HierarchyManager.selectedType);
			HierarchyManager.BuildGUI();
			HierarchyManager.inRename = false;
		}
	}
	this.makeBounds = function(node,color)
	{
		if(node)
		{
			if(this.SelectionBounds != null)
			{
				this.SelectionBounds.parent.removeChild(this.SelectionBounds);
				this.SelectionBounds = null;
			}
				var box = node.GetBoundingBox(true);
				box = box.clone();
				box.max[0] += .05;
				box.max[1] += .05;
				box.max[2] += .05;
				box.min[0] -= .05;
				box.min[1] -= .05;
				box.min[2] -= .05;
				var mat = node.getModelMatrix().slice(0);
				//mat = GLGE.inverseMat4(mat);
				//mat[3] = 0;
				//mat[7] = 0;
				//mat[11] = 0;
				
				
				this.SelectionBounds = _Editor.BuildBox([box.max[0] - box.min[0],box.max[1] - box.min[1],box.max[2] - box.min[2]],[box.min[0] + (box.max[0] - box.min[0])/2,box.min[1] + (box.max[1] - box.min[1])/2,box.min[2] + (box.max[2] - box.min[2])/2],color);
				
				this.SelectionBounds.setStaticMatrix(mat);
				this.SelectionBounds.InvisibleToCPUPick = true;
				this.SelectionBounds.setDrawType(GLGE.DRAW_LINELOOPS);
				this.SelectionBounds.setDepthTest(false);
				this.SelectionBounds.setZtransparent(true);
				this.SelectionBounds.setCull(GLGE.NONE);
				this.SelectionBounds.setPickable(false);
				_Editor.findscene().addChild(this.SelectionBounds);
		}
	
	}
	$('#hierarchyDisplay').click(this.offClicked);
	this.makeVWFNode = function()
	{
		
		if(HierarchyManager.selectedType == 'glge')
		{
			var parent = this.selectedID;
			var childname = HierarchyManager.selectedName;
			var proto  = { 
                    extends: '3DRObject.vwf',
					type: "link_existing/glge",
					source: childname,
					properties:{
					  owner:document.PlayerNumber,
					  type:'3DR Object',
					  DisplayName:childname
					  }
                    };
			
			vwf_view.kernel.createChild(parent,GUID(),proto,null);
		}
	}
	this.select = function()
	{
		if(HierarchyManager.selectedType == 'vwf')
		{
			_Editor.SelectObject(HierarchyManager.selectedName);
		}
	}
	this.itemClicked = function()
	{
		var name = $(this).attr('name');
		var type = $(this).attr('type');
		HierarchyManager.selectItem(name,type);
	}
	this.selectItem = function(name,type)
	{
		
		HierarchyManager.selectedType = type;
		HierarchyManager.selectedName = name;
		
		var node;
		var color = [0,.5,1,1];
		if(type =='vwf')
		{
			node = _Editor.findviewnode(name);
			color = [0,1,.5,1];
		}
		if(type =='glge')
			node = HierarchyManager.findGLGEChild(_Editor.findviewnode(HierarchyManager.selectedID),name);
			
		HierarchyManager.makeBounds(node,color);
		$(".hierarchyItem").css('background','#FFFFF8');
		$('#hierarchyDisplay').find('[name="'+name+'"]').css('background','lightblue');
	}
	this.getVWFChildren = function(node,list,depth)
	{
		if(node === undefined)
		{
		    node = this.selectedID;
			list = [];
			depth = 0;	
			var children = vwf.children(node);
			for(var i = 0; i < children.length; i++)
			{
				this.getVWFChildren(children[i],list,depth+1);
			}
			return list;
		}
		
		list.push({name:node,depth:depth});
		var children = vwf.children(node);
		for(var i = 0; i < children.length; i++)
		{
			this.getVWFChildren(children[i],list,depth+1);
		}
		return list;
	}
	this.findGLGEChild = function(node,name)
	{
		
		if(node.name == name)
			return node;
		
		if(node.children)
		for(var i = 0; i < node.children.length; i++)
		{
			var ret2 = this.findGLGEChild(node.children[i],name);
			if(ret2)
				return ret2;
		}
		return null;
	}
	this.getGLGEChildren = function(node,list,depth)
	{
		if(node === undefined)
		{
		    node = _Editor.findviewnode(this.selectedID);
			list = [];
			depth = 1;	
			var children = node.children;
			if(children)
			for(var i = 0; i < children.length; i++)
			{
				this.getGLGEChildren(children[i],list,depth+1);
			}
			return list;
		}
		if(node.vwfID)
			return;
		var nodename = node.name;
		if(!nodename)
			nodename = node.uid;
		if(!nodename)
			nodename = node.vwfID;	
		list.push({name:nodename,depth:depth});
		var children = node.children;
		if(children)
		for(var i = 0; i < children.length; i++)
		{
			this.getGLGEChildren(children[i],list,depth+1);
		}
		return list;
	}
	this.BuildGUI = function()
	{
		 
		$('#hierarchyDisplay').empty();
		
		$('#InventoryRename').hide();
		$('#InventoryRename').keypress(HierarchyManager.rename)
		$('#InventoryRename').keydown(function(e){e.stopPropagation();})
		
		$('#InventoryRename').focus(function() { $(this).select(); } );
		
		$('#hierarchyDisplay').append("<div id='VWFChildren' style='font-weight:bold'><div>VWF Object Children</div></div>");
		$('#hierarchyDisplay').append("<div id='GLGEChildren' style='font-weight:bold'><div>SceneNode Children</div></div>");
		var VWFChildren = HierarchyManager.getVWFChildren();
		
		for(var j in VWFChildren)
		{
			var i = VWFChildren[j];
			var thisid = 'VWFChild' + ToSafeID(i.name) + i.depth;
			$('#VWFChildren').append('<div class="hierarchyItem" style="font-weight:normal;white-space: nowrap;text-overflow: ellipsis;height:1.3em;overflow:hidden;background:#FFFFF8;padding-left:0px;" id="'+thisid+'" />');
			
			var dispName = vwf.getProperty(i.name,'DisplayName');
			if(dispName)
				$('#' + thisid).html(dispName);
			else
				$('#' + thisid).html(i.name);	
			for(var t=0; t<i.depth;t++)
				$('#' + thisid).prepend('<div style="padding-bottom: 5px;border-left: 1px solid lightgray;margin-right: 10px;margin-left: 0px;display: inline;height: 1.3em;white-space: nowrap;" />');
				
			$('#' + thisid).attr('name',i.name);
			$('#' + thisid).attr('type','vwf');
			$('#' + thisid).click(HierarchyManager.itemClicked);
		}
		
		var GLGEChildren = HierarchyManager.getGLGEChildren();
		
		for(var j in GLGEChildren)
		{
			var i = GLGEChildren[j];
			var thisid = 'GLGEChild' + ToSafeID(i.name) + i.depth;
			$('#GLGEChildren').append('<div class="hierarchyItem" style="font-weight:normal;white-space: nowrap;text-overflow: ellipsis;height:1.3em;overflow:hidden;background:#FFFFF8;padding-left:0px;" id="'+thisid+'" />');
			
			$('#' + thisid).html(i.name);
			for(var t=0; t<i.depth;t++)
				$('#' + thisid).prepend('<div style="padding-bottom: 5px;border-left: 1px solid lightgray;margin-right: 10px;margin-left: 0px;display: inline;height: 1.3em;white-space: nowrap;" />');
				
			$('#' + thisid).attr('name',i.name);
			$('#' + thisid).attr('type','glge');
			$('#' + thisid).click(HierarchyManager.itemClicked);
		}
	}
	this.SelectionChanged = function(e,node)
	{
		try{
			
			if(this.SelectionBounds != null)
			{
				this.SelectionBounds.parent.removeChild(this.SelectionBounds);
				this.SelectionBounds = null;
			}
			
			if(node)
			{	
				this.selectedID = node.id
				this.BuildGUI();
			}
		}
		catch(e)
		{
			 console.log(e);
		}
	}
	$(document).bind('selectionChanged',this.SelectionChanged.bind(this));
	
}
HierarchyManager = new hierarchyManager();
HierarchyManager.hide();