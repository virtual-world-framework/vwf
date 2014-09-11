define(["../../../jstree.min"],function (jstree)
{
	var SelectionEditor = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(SelectionEditor);
				isInitialized = true;
			}
			return SelectionEditor;
		}
	}

	function initialize()
	{
		$(document.body).append("<div id='selectionEditor'><div id='selectionEditorTree'></div></div>");

		
		$(document.head).append('<link rel="stylesheet" href="../vwf/view/editorview/css/jstreestyle.min.css"></link>');
		
		var self = this;
		//$('#selectionEditorTree').jstree();
		$('#selectionEditor').dialog(
		{
			modal: true,
			autoOpen: false,
			resizable: true,
			title:"Selection Editor",
			height:500,
			width:700,
			position:'center',
			movable:false,
			buttons : {
		        
		        "Cancel" : function() {
		          self.Hide();
		        },
		        "Select" : function() {
		          self.select();
		        }
      		}
		});

		$('#selectionEditor').css('width','100%');
		$('#selectionEditor').css('padding','0%');
		$('#selectionEditor').before("<div id='selectionEditorMenu' style='background-color:#444; padding-bottom:2px'></div>");
		$('#selectionEditorMenu').append('<div id="selectionEditorSelectNone" class="icon selectnone"></div>');
		$('#selectionEditorMenu').append('<div id="selectionEditorfilterLights" filter="filterLights" style="background-image:url(../vwf/view/editorview/images/icons/light_icon.png)" class="icon light "></div>');
		$('#selectionEditorMenu').append('<div id="selectionEditorfilter3Dmodels" filter="filterModels" class="icon models "></div>');
		$('#selectionEditorMenu').append('<div id="selectionEditorfilterBehaviors" filter="filterBehaviors" class="icon script "></div>');
		$('#selectionEditorMenu').append('<div id="selectionEditorfilterPrimitives" filter="filterPrimitives" class="icon cube "></div>');
		$('#selectionEditorMenu').append('<div id="selectionEditorfilterModifiers" filter="filterModifiers" class="icon hierarchy "></div>');
		$('#selectionEditorMenu').append('<div id="selectionEditorfilterCameras" filter="filterCameras" class="icon camera "></div>');
		$('#selectionEditorMenu').append('<div id="selectionEditorfilterLines" filter="filterLines" class="icon plane "></div>');

		
		$('#selectionEditorSelectNone').tooltip(
			{
				content: i18n.t("Clear Selection"),
				items: "div",
				show: {
					delay:500
				}
			});
		$('#selectionEditorfilterLights').tooltip(
			{
				content: i18n.t("Show Lights"),
				items: "div",
				show: {
					delay:500
				}
			});
		$('#selectionEditorfilter3Dmodels').tooltip(
			{
				content: i18n.t("Show 3D Models"),
				items: "div",
				show: {
					delay:500
				}
			});
		$('#selectionEditorfilterBehaviors').tooltip(
			{
				content: i18n.t("Show Behaviors"),
				items: "div",
				show: {
					delay:500
				}
			});
		$('#selectionEditorfilterPrimitives').tooltip(
			{
				content: i18n.t("Show Primitives"),
				items: "div",
				show: {
					delay:500
				}
			});
		$('#selectionEditorfilterModifiers').tooltip(
			{
				content: i18n.t("Show Modifiers"),
				items: "div",
				show: {
					delay:500
				}
			});
		$('#selectionEditorfilterCameras').tooltip(
			{
				content: i18n.t("Show Cameras"),
				items: "div",
				show: {
					delay:500
				}
			});
		$('#selectionEditorfilterLines').tooltip(
			{
				content: i18n.t("Show Lines"),
				items: "div",
				show: {
					delay:500
				}
			});

		$('#selectionEditor').parent().find('.ui-dialog-buttonpane').append("<input type='text' id='selectionEditorSearch'></input>")
		$('#selectionEditorSearch').addClass('alertify-text');
		$('#selectionEditorSearch').css('width',"auto");
		$('#selectionEditorSearch').attr('placeholder',"search");
		var to = null;
		$('#selectionEditorSearch').keyup(function () {
		    if(to) { clearTimeout(to); }
		    to = setTimeout(function () {
		      var v = $('#selectionEditorSearch').val();
		     self.search(v);
		    }, 250);
		  });


		$('#selectionEditorSelectNone').click(function()
		{
			$('#selectionEditorTree').jstree(true).deselect_all();
		});
		
		
		this.filterLights = false;
		this.filterCameras = false;
		this.filterBehaviors = false;
		this.filterModels = false;
		this.filterModifiers = false;
		this.filterPrimitives = false;
		this.filterLines = false;
		this.searchTerm = null;
		this.search = function(v)
		{
			this.searchTerm = v;
			if(!this.searchTerm)
				this.searchTerm = null;
			this.buildGUI();
		}
		this.filterIconClicked = function()
		{
			
			$(this).toggleClass('iconselected');
			self.toggleFilter($(this).attr('filter'))
		}
		$('#selectionEditorMenu').children('[filter]').click(self.filterIconClicked)
		this.toggleFilter = function(filterType)
		{
			this[filterType] = !this[filterType];	
			this.buildGUI();
		}
		this.buildFilterTypeArray = function()
		{
			var filterType = [];
			if(this.filterLights) filterType.push('light');
			if(this.filterCameras) filterType.push('camera');
			if(this.filterBehaviors) filterType.push('behavior');
			if(this.filterModels) filterType.push('model');
			if(this.filterModifiers) filterType.push('modifier');
			if(this.filterPrimitives) filterType.push('primitive');
			if(this.filterLines) filterType.push('line');

			if(filterType.length == 0)
				return null;
			filterType.push('scene');
			return filterType;
		}
		this.clearFilter = function()
		{
			this.filterLights = true;
			this.filterCameras = true;
			this.filterBehaviors = true;
			this.filterModels = true;
			this.filterModifiers = true;
			this.filterPrimitives = true;
			$('#selectionEditor').children().addClass('iconSelected');
		}
		this.select = function()
		{
			
			var tree  =$.jstree.reference("#selectionEditorTree");
			var selection = tree.get_selected();
			for(var i = 0; i < selection.length; i++)
			{
				selection[i] = selection[i].substring(0,selection[i].length - 13);
			}
			_Editor.SelectObjectPublic(selection);
			$('#selectionEditor').dialog('close');
		}
		this.Show = function()
		{
			$('#selectionEditor').dialog('open');
			this.buildGUI();
		}
		
		this.Hide = function()
		{
			$('#selectionEditor').dialog('close');
		}
		this.isOpen = function()
		{
			return $('#selectionEditor').is(":visible");
		}
		this.walkToBuildJSTreeData = function(node)
		{
			if(node)
			{
				if(node.properties && node.properties.DisplayName)
					node.text = node.properties.DisplayName;
				else
					node.text = node.id;
				
				if(node.children)
				{

					var oldchildren = node.children;
					node.children = [];
					for(var i in oldchildren)
						node.children.push(oldchildren[i]);

					for(var i =0; i < node.children.length; i++)
						this.walkToBuildJSTreeData(node.children[i]);
				}
				node.state = {};
				node.state.selected = _Editor.isSelected(node.id);
				node.state.visible = true;
				if(node.state.selected)
					node.state.opened = true;
				node.id = node.id +'_treeviewitem';
			}
		}
		this.filterNodes = function(root,list)
		{
			if(root.children)
			{
				for(var i in root.children)
					this.filterNodes(root.children[i],list)
			}
			if(root.properties && root.properties.type)
			{
				if(list.indexOf(root.properties.type.toLowerCase()) > -1)
				{
					root.state.visible = true;
					root.state.opened = true;
				}else
				{
					root.state.visible = false;
				}
			}
		}
		this.filterSearch = function(root)
		{
			if(root.children)
			{
				for(var i in root.children)
					this.filterSearch(root.children[i])
			}
			if(root.properties && root.properties.DisplayName)
			{
				if(root.properties.DisplayName.indexOf(this.searchTerm) >= 0)
				{
					root.state.visible = true;
					root.state.opened = true;
				}
				else
					root.state.visible = false;
			}
		}
		this.rollUp = function(root)
		{

			if(root.children)
			{
				for(var i in root.children)
					this.rollUp(root.children[i])
			}
			
			if(root.children)
			{
				
				
				for(var i = root.children.length -1; i >=0; i--)
				{
					if(root.children[i].state.disabled && !root.state.visible)
					{
						root.state.disabled = true;
						root.state.opened = true;
					}
					if(!root.children[i].state.visible && !root.children[i].state.disabled)
					{
						root.children.splice(i,1);
					}
				}
				if(root.children.length	 > 0 && !root.state.visible )
				{
					root.state.disabled = true;
					root.state.opened = true;
				}

			}

		}
		this.buildGUI = function()
		{
			
			$.jstree.defaults.core.themes.dots = true;
			$.jstree.defaults.core.themes.stripes = true;
			$.jstree.defaults.checkbox.three_state = false;
			var root = JSON.parse(JSON.stringify(_Editor.getNode('index-vwf',true)));
			this.nodeData = root;
			this.walkToBuildJSTreeData(root);
			root.state.opened = true;
			
			var filterList = this.buildFilterTypeArray();
			if(filterList)
				this.filterNodes(root,filterList);
			if(this.searchTerm)
				this.filterSearch(root);
			this.rollUp(root);
			if($.jstree.reference("#selectionEditorTree"))
				{
					$('#selectionEditorTree').jstree('destroy');
					$('#selectionEditorTree').jstree().destroy();
					$('#selectionEditorTree').jstree().teardown();
					$('#selectionEditorTree').jstree(true).destroy();
					$('#selectionEditorTree').empty();
					$('#selectionEditorTree').removeAttr('class');
					$('#selectionEditorTree').removeAttr('role');
					$('#selectionEditorTree').remove();
					$('#selectionEditor').append("<div id='selectionEditorTree'></>");
				}
			
				$('#selectionEditorTree').jstree({ 
				'core' : {
			    	'data' : root
				 }, 
				"plugins" : [ "wholerow", "checkbox","search" ]
				
			});
		}
	}
});