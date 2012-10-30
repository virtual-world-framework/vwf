function PrimitiveEditor()
{
	
	
		
	

	$(document.body).append("<div id='PrimitiveEditor'>" +
					'<div id="accordion" style="height:100%;overflow:hidden">'+
					'<h3><a href="#">Transforms</a></h3>'+
						'<div>'+
							"<div class='EditorLabel'>Translation</div>" +
							"<div id='Translation'>" +
							"<input type='text' class='TransformEditorInput' id='PositionX'/>" +
							"<input type='text' class='TransformEditorInput' id='PositionY'/>" +
							"<input type='text' class='TransformEditorInput' id='PositionZ'/>" +
							"</div>"+
							"<div class='EditorLabel'>Rotation</div>" +
							"<div id='Rotation'>" +
							"<input type='text' class='TransformEditorInput' id='RotationX'/>" +
							"<input type='text' class='TransformEditorInput' id='RotationY'/>" +
							"<input type='text' class='TransformEditorInput' id='RotationZ'/>" +
							"<input type='text' class='TransformEditorInput' id='RotationW'/>" +
							"</div>"+
							"<div class='EditorLabel'>Scale</div>" +
							"<div id='Scale'>" +
							"<input type='text' class='TransformEditorInput' id='ScaleX'/>" +
							"<input type='text' class='TransformEditorInput' id='ScaleY'/>" +
							"<input type='text' class='TransformEditorInput' id='ScaleZ'/>" +
							"</div>"+
						'</div>'+					
					'</div>'+	
					"</div>" 
					);

	$('#PrimitiveEditor').dialog({title:'Primitive Editor',autoOpen:false, 
		resize:function(){
			$( "#accordion" ).accordion( "resize" );
			this.updateOtherWindows();
		}.bind(this),
		close:function(){
			this.updateOtherWindows();
		}.bind(this)
	});
	$( "#accordion" ).accordion({
			fillSpace: true
		});
	this.show = function()
	{
		$('#PrimitiveEditor').dialog('open');
		$('#PrimitiveEditor').dialog('option','position',[1282,40]);
		this.updateOtherWindows();
		this.SelectionChanged(null,_Editor.GetSelectedVWFNode());
		this.open =true;
	}
	this.hide = function()
	{
		$('#PrimitiveEditor').dialog('close');
		
	}
	this.isOpen = function()
	{
		return $("#PrimitiveEditor").dialog( "isOpen" )
		
	}
	this.setProperty = function(id,prop,val)
	{
		if(document.PlayerNumber == null)
		{
			_Notifier.notify('You must log in to participate');
			return;
		}
		var owner = vwf.getProperty(id,'owner');
		if(owner!=document.PlayerNumber)
		{
			_Notifier.notify('You do not own this object. It`s owned by '+ owner);
			return;
		}
		vwf_view.kernel.setProperty(id,prop,val)
	}
	this.SelectionChanged = function(e,node)
	{
		try{
			
			if(node)
			{
				$( "#accordion" ).accordion('destroy');
				$( "#accordion" ).children('.modifiersection').remove();
				//update to ensure freshness
				node = vwf.getNode(node.id);
				var type = vwf.getProperty(node.id,'type');
				if(type == 'cylinder' || type == 'cone')
				$('#RadiusLabel').html('Radius');
				else
				$('#RadiusLabel').html('Length');
				var val = vwf.getProperty(node.id,'size');
				$("#Radius").slider("value",val[0]);
				$("#Width").slider("value",val[1]);
				$("#Height").slider("value",val[2]);
				
				$('#BaseSectionTitle').html(node.properties.type + ": " + node.id);
				this.SelectionTransformed(null,node);
				this.setupEditorData(node);
				this.recursevlyAddModifiers(node);
				
				$( "#accordion" ).accordion({fillSpace: true});
				
				this.updateOtherWindows();
			}
		}
		catch(e)
		{
			console.log(e);
		}
	}
	this.updateOtherWindows= function()
	{
				$('#materialeditor').dialog('option','position',[1282,40]);
				if(this.isOpen())
				{
					var t = $('#PrimitiveEditor').closest('.ui-dialog').height()+$('#PrimitiveEditor').offset().top;
					$('#materialeditor').dialog('option','position',[1282,t-20]);
				}
				
	}
	this.recursevlyAddModifiers = function(node)
	{
		for(var i in node.children)
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
			this.setupEditorData(node.children[i]);
			this.recursevlyAddModifiers(node.children[i]);
		}
	}
	this.primPropertyUpdate = function(e,ui)
	{
		
		var id = $(this).attr('nodename');
		var prop = $(this).attr('propname');
		$('#'+id+prop+'value').val(ui.value);
		var amount = ui.value;
		_PrimitiveEditor.setProperty(id,prop,amount);
	}
	this.primPropertyTypein = function(e,ui)
	{
		
		var id = $(this).attr('nodename');
		var prop = $(this).attr('propname');
		var amount = $(this).val();
		var slider = $(this).attr('slider');
		$(slider).slider('value',amount);
		_PrimitiveEditor.setProperty(id,prop,amount);
	}
	this.primPropertyValue = function(e,ui)
	{
		
		var id = $(this).attr('nodename');
		var prop = $(this).attr('propname');
		var val = $(this).attr('value');
		_PrimitiveEditor.setProperty(id,prop,val);
	}
	this.primPropertyChecked = function(e,ui)
	{
		
		var id = $(this).attr('nodename');
		var prop = $(this).attr('propname');
		if($(this).attr('checked') == 'checked')
			_PrimitiveEditor.setProperty(id,prop,true);
		else
			_PrimitiveEditor.setProperty(id,prop,false);
		
	}
	this.setupEditorData = function(node)
	{
		var editordata = vwf.getProperty(node.id,'EditorData');
		editordatanames = [];
		for(var i in editordata)
		{
			editordatanames.push(i);
		}
		editordatanames.sort();
		
		section = '<h3 class="modifiersection" ><a href="#">'+node.properties.type+'</a></h3>'+
			'<div class="modifiersection" id="basicSettings'+node.id+'">'+
			'</div>';
			$( "#accordion" ).append(section);
		for(var j =0; j<editordatanames.length; j++)
		{	
			var i = editordatanames[j];
			
			if(editordata[i].type == 'slider')
			{
				var inputstyle = "display: inline;float: right;padding: 0;width: 50px;border-radius: 6px;background: transparent;text-align: center;border-width: 1px;color: grey;"
				$('#basicSettings'+node.id).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">'+editordata[i].displayname+': </div>');
				$('#basicSettings'+node.id).append('<input style="'+inputstyle+'" id="'+node.id+editordata[i].property+'value"></input>');
				$('#'+node.id+editordata[i].property+'value').val(vwf.getProperty(node.id,editordata[i].property));
				$('#'+node.id+editordata[i].property+'value').change(this.primPropertyTypein);
				$('#'+node.id+editordata[i].property+'value').attr("nodename",node.id);
				$('#'+node.id+editordata[i].property+'value').attr("propname",editordata[i].property);
				$('#'+node.id+editordata[i].property+'value').attr("slider",'#'+node.id+i);
				$('#basicSettings'+node.id).append('<div id="'+node.id+i+'" nodename="'+node.id+'" propname="'+editordata[i].property+'"/>');
				var val = vwf.getProperty(node.id,editordata[i].property);
				if(val == undefined) val = 0;
				$('#'+node.id+i).slider({step:parseFloat(editordata[i].step),min:parseFloat(editordata[i].min),max:parseFloat(editordata[i].max),slide:this.primPropertyUpdate,stop:this.primPropertyUpdate,value:val});
			}
			if(editordata[i].type == 'check')
			{
				$('#basicSettings'+node.id).append('<div><input style="vertical-align: middle" type="checkbox" id="'+i+node.id+'" nodename="'+node.id+'" propname="'+editordata[i].property+'"/><div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">'+editordata[i].displayname+': </div></div>');
				var val = vwf.getProperty(node.id,editordata[i].property);
				$('#'+i+node.id).click(this.primPropertyChecked);
				if(val == true)
				{
					$('#'+i+node.id).attr('checked','checked');
				}
				//$('#'+i).
			}
			if(editordata[i].type == 'choice')
			{
				
				var id = 'basicSettings'+node.id+editordata[i].property+'choices';
				$('#basicSettings'+node.id).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">'+editordata[i].displayname+': </div>');
				$('#basicSettings'+node.id).append('<form><div id="'+id+'"></div></form>');
				var val = vwf.getProperty(node.id,editordata[i].property);
				for(var k = 0; k < editordata[i].labels.length; k++)
				{
					var newid = id+editordata[i].labels[k];
					$('#' + id).append('<input type="radio" id="'+newid+'" name="Radio"/><label id="'+newid+'label'+'" for="'+newid+'">'+editordata[i].labels[k]+'</label>');
					$('#' + newid+'label').attr('propname',editordata[i].property);
					$('#' + newid+'label').attr('nodename',node.id);
					$('#' + newid+'label').attr('value',editordata[i].values[k]);
					$('#' + newid+'label').click(this.primPropertyValue);
					if(val == editordata[i].values[k])
						$('#' + newid).attr('checked','checked');
				}
				$('#' + id).buttonset();
				
				//$('#'+i).
			}
		}
		
		$('#basicSettings'+node.id).append('<div style="width: 100%;margin-top: 1em;" nodename="'+node.id+'" id="'+node.id+'deletebutton"/>');
		$('#'+node.id+'deletebutton').button({label:'Delete'});	
		$('#'+node.id+'deletebutton').click(this.deleteButtonClicked);	
		
	}
	this.deleteButtonClicked = function()
	{
		if(document.PlayerNumber == null)
		{
			_Notifier.notify('You must log in to participate');
			return;
		}
		var id = $(this).attr('nodename');
	    var owner = vwf.getProperty(id,'owner');
		if(owner!=document.PlayerNumber)
		{
			_Notifier.notify('You do not own this object. It`s owned by '+ owner);
			return;
		}
		
		vwf_view.kernel.deleteNode(id);
		vwf_view.kernel.callMethod(_Editor.GetSelectedVWFNode().id,'dirtyStack');
		window.setTimeout(function(){_PrimitiveEditor.SelectionChanged(null,_Editor.GetSelectedVWFNode());},500);
	}
	this.modifierAmountUpdate = function(e,ui)
	{
		
		var id = $(this).attr('nodename');
		var amount = ui.value;
		_PrimitiveEditor.setProperty(id,'amount',amount);
	}
	this.positionChanged = function()
	{
		var val = [0,0,0];
		val[0] = $('#PositionX').val();
		val[1] = $('#PositionY').val();
		val[2] = $('#PositionZ').val();
	
		this.setProperty(_Editor.GetSelectedVWFNode().id,'translation',val);
		
	}
	this.rotationChanged = function()
	{
		var val = [0,0,0,0];
		val[0] = $('#RotationX').val();
		val[1] = $('#RotationY').val();
		val[2] = $('#RotationZ').val();
		val[3] = $('#RotationW').val();
		this.setProperty(_Editor.GetSelectedVWFNode().id,'rotation',val);
		
		
	}
	this.scaleChanged = function()
	{
		var val = [0,0,0];
		val[0] = $('#ScaleX').val();
		val[1] = $('#ScaleY').val();
		val[2] = $('#ScaleZ').val();
		this.setProperty(_Editor.GetSelectedVWFNode().id,'scale',val);
		
		
	}
	this.SelectionTransformed = function(e,node)
	{
		try{
			
			if(node)
			{
				
				var pos = vwf.getProperty(node.id,'translation');
				var rot = vwf.getProperty(node.id,'rotation');
				var scl = vwf.getProperty(node.id,'scale');
				$('#PositionX').val(Math.floor(pos[0]));
				$('#PositionY').val(Math.floor(pos[1]));
				$('#PositionZ').val(Math.floor(pos[2]));
				$('#RotationX').val(rot[0]);
				$('#RotationY').val(rot[1]);
				$('#RotationZ').val(rot[2]);
				$('#RotationW').val(rot[3]);
				$('#ScaleX').val(scl[0]);
				$('#ScaleY').val(scl[1]);
				$('#ScaleZ').val(scl[2]);
			}
		}
		catch(e)
		{
			console.log(e);
		}
	}
	$(document).bind('selectionChanged',this.SelectionChanged.bind(this));
	$(document).bind('modifierCreated',this.SelectionChanged.bind(this));
	$(document).bind('selectionTransformedLocal',this.SelectionTransformed.bind(this));
//	$("#Radius").slider({min:0,max:10,step:.10,slide:this.updateSize.bind(this),stop:this.updateSize.bind(this)});
//	$("#Width").slider({min:0,max:10,step:.10,slide:this.updateSize.bind(this),stop:this.updateSize.bind(this)});
//	$("#Height").slider({min:0,max:10,step:.10,slide:this.updateSize.bind(this),stop:this.updateSize.bind(this)});
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
}
_PrimitiveEditor = new PrimitiveEditor();