define(["vwf/view/sandbox/lib/jstree.min"],function (jstree)
{
	var WireEditor = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(WireEditor);
				isInitialized = true;
			}
			return WireEditor;
		}
	}

	function initialize()
	{
		$(document.body).append("<div id='selectionEditor'><div id='selectionEditorMenu'></div><div id='selectionEditorTree'></div></div>");
//		$(document.head).append('<script type="text/javascript" src="./jstree.min.js"></script>');
		$(document.head).append('<link rel="stylesheet" href="./jstreestyle.min.css"></link>');
		
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

		$('#selectionEditor').parent().find('.ui-dialog-buttonpane').append("<input type='text' id='selectionEditorSearch'></input>")
		$('#selectionEditorSearch').addClass('alertify-text');
		$('#selectionEditorSearch').css('width',"auto");
		$('#selectionEditorSearch').attr('placeholder',"search");
var to = null;
$('#selectionEditorSearch').keyup(function () {
    if(to) { clearTimeout(to); }
    to = setTimeout(function () {
      var v = $('#selectionEditorSearch').val();
      $('#selectionEditorTree').jstree(true).search(v);
    }, 250);
  });

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
		this.search = function()
		{

			alertify.prompt('Search for what name?',function(ok,val)
			{
				if(ok)
				{
					var tree  =$.jstree.reference("#selectionEditorTree");
					tree.search(val);
				}
			},'name');
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
				if(node.state.selected)
					node.state.opened = true;
				node.id = node.id +'_treeviewitem';
			}
		}
		this.buildGUI = function()
		{
			
			$.jstree.defaults.core.themes.dots = true;
			$.jstree.defaults.core.themes.stripes = true;
			$.jstree.defaults.checkbox.three_state = false;
			var root = JSON.parse(JSON.stringify(vwf.getNode('index-vwf',true)));
			this.nodeData = root;
			this.walkToBuildJSTreeData(root);
			root.state.opened = true;
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