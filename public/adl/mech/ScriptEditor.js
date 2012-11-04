function ScriptEditor()
{


	
	this.resize = function()
	{
		
		var w = ($('#textinnere').parent().width()-190);
		if (w <= 0) w=($('#textinnerm').parent().width()-190);
		
		var h = ($('#textinnere').parent().height()-85);
		if (h <= 50) h=($('#textinnerm').parent().height()-85);
		
		$('#textinnerm').css('width',w+'px')
		$('#textinnere').css('width',w+'px')
		$('#textinnerm').css('height',h+'px')
		$('#textinnere').css('height',h+'px')
	
	}
	
	$(document.body).append("<div id='ScriptEditorAbandonChanges'>You have are about to load a different script,but you have unsaved changes to this script. Do you want to continue and abandon the changes? This action cannot be undone.</div>");
	$(document.body).append("<div id='ScriptEditorCreateMethod'><input id='newMethodName' type='text' /></div>");
	$(document.body).append("<div id='ScriptEditorCreateEvent'><input id='newEventName' type='text' /></div>");
	$(document.body).append("<div id='ScriptEditorDeleteMethod'>Are you sure you want to delete this script? This cannot be undone.</div>");
	$(document.body).append("<div id='ScriptEditorDeleteEvent'>Are you sure you want to delete this script? This cannot be undone.</div>");
	$(document.body).append("<div id='ScriptEditorMessage'>This script contains syntax errors, and cannot be saved;</div>");
	$(document.body).append("<div id='ScriptEditor'  style='overflow:hidden;padding: 0px 10px 0px 0px;'>" +
	'<div id="ScriptEditorTabs" style="width:100%;height:100%;overflow:hidden;padding: 0px 10px 0px 0px;">'+
	'	<ul>'+
	'		<li><a href="#methods">Methods</a></li>'+
	'		<li><a href="#events">Events</a></li>'+
	'	</ul>'+
	'	<div id="methods" style="height: 100%;padding:4px">'+
	'		<div style="width: 180px;display: inline-block;vertical-align: top;"><div id="methodlist"/><div id="saveMethod"/></div>'+
			'<div id="textinnerm" style="display: inline-block;position:absolute"><div style="width: 100%;height: 100%;position: absolute;border: 1px solid black;" type="text" id="methodtext" />'+
			'<div id="callMethod"/><div id="deleteMethod"/><div id="newMethod"/><div id="checkSyntaxMethod"/>'+
			'</div>'+
	'	</div>'+
	'	<div id="events" style="height: 100%;padding:4px">'+
	'		<div style="width: 180px;display: inline-block;vertical-align: top;"><div id="eventlist"/><div id="saveEvent"/></div>'+
	'		<div id="textinnere" style="display: inline-block;position:absolute"><div style="width: 100%;height: 100%;position: absolute;border: 1px solid black;" type="text" id="eventtext" />'+
	'		<div id="callEvent"/><div id="deleteEvent"/><div id="newEvent"/><div id="checkSyntaxEvent"/>'+
	'		</div>'+
	'	</div>'+
	'</div>'+
	"</div>");
	
	this.MethodChanged = false;
	this.EventChanged = false;
	
	$('#ScriptEditor').dialog({title:'Script Editor',autoOpen:false,resize:this.resize,height:520,width:760,position:'center'});
	
	$('#ScriptEditorDeleteMethod').dialog({title:'Delete Method?',autoOpen:false,height:'auto',width:'200px',position:'center',modal:true,buttons:{
	'Yes':function(){_ScriptEditor.DeleteActiveMethod_imp();$('#ScriptEditorDeleteMethod').dialog('close');},
	'No':function(){$('#ScriptEditorDeleteMethod').dialog('close');},
	}});
	
	$('#ScriptEditorDeleteEvent').dialog({title:'Delete Event?',autoOpen:false,height:'auto',width:'200px',position:'center',modal:true,buttons:{
	'Yes':function(){_ScriptEditor.DeleteActiveEvent_imp();$('#ScriptEditorDeleteEvent').dialog('close');},
	'No':function(){$('#ScriptEditorDeleteEvent').dialog('close');},
	}});
	
	$('#ScriptEditorAbandonChanges').dialog({title:'Abandon Changes?',autoOpen:false,height:'auto',width:'200px',position:'center',modal:true,buttons:{
	'Yes':function(){_ScriptEditor.AbandonChangesCallback();$('#ScriptEditorAbandonChanges').dialog('close');},
	'No':function(){$('#ScriptEditorAbandonChanges').dialog('close');},
	}});
	
	$('#ScriptEditorMessage').dialog({title:'Syntax Error',autoOpen:false,height:'auto',width:'200px',position:'center',modal:true,buttons:{
	'Ok':function(){$('#ScriptEditorMessage').dialog('close');},
	}});
	
	$('#ScriptEditorCreateMethod').dialog({title:'Enter Method Name',autoOpen:false,height:'auto',width:'300px',position:'center',modal:true,buttons:{
	'Ok':function(){
		
		var name=$('#newMethodName').val();
		_ScriptEditor.setSelectedMethod(name,'function '+name+'(){\n\n console.log("got here"); \n\n}');
		$('#ScriptEditorCreateMethod').dialog('close');
		},
	'Cancel':function(){
		$('#ScriptEditorCreateMethod').dialog('close');
		}
	}});
	
	$('#ScriptEditorCreateEvent').dialog({title:'Enter Event Signiture',autoOpen:false,height:'auto',width:'300px',position:'center',modal:true,buttons:{
	'Ok':function(){
		
		var name=$('#newEventName').val();
		name = name.substring(0,name.indexOf('('));
		_ScriptEditor.setSelectedEvent(name,'function '+$('#newEventName').val()+'{\n\n console.log("got here"); \n\n}');
		$('#ScriptEditorCreateEvent').dialog('close');
		},
	'Cancel':function(){
		$('#ScriptEditorCreateEvent').dialog('close');
		}
	}});
	

	
	$('#ScriptEditorTabs').tabs();
	$('#ScriptEditorTabs ul').css('background','lightgray');
	
	$('#methodlist').css('width','180px');
	$('#eventlist').css('width','180px');
	
	$('#saveEvent').css('position','absolute');
	$('#saveEvent').css('bottom','10px');
	$('#saveEvent').css('width','175px');
	$('#saveMethod').css('position','absolute');
	$('#saveMethod').css('bottom','10px');
	$('#saveMethod').css('width','175px');
	$('#saveEvent').button({label:'Save Event'});
	$('#saveMethod').button({label:'Save Method'});
	
	$('#callMethod').button({label:'Call Method'});
	$('#deleteMethod').button({label:'Delete Method'});
	$('#newMethod').button({label:'New Method'});
	
	$('#checkSyntaxEvent').button({label:'Check Code'});
	$('#checkSyntaxMethod').button({label:'Check Code'});
	$('#checkSyntaxMethod').css('float','right');
	$('#checkSyntaxEvent').css('float','right');
	
	$('#callMethod').css('float','right');
	$('#deleteMethod').css('float','right');
	$('#newMethod').css('float','right');
	
	$('#callEvent').button({label:'Trigger Event'});
	$('#deleteEvent').button({label:'Delete Event'});
	$('#newEvent').button({label:'New Event'});

	$('#callEvent').css('float','right');
	$('#deleteEvent').css('float','right');
	$('#newEvent').css('float','right');
	
	$('#eventtext').keydown(function(e){
		e.stopPropagation();
		//return false;
	});
	$('#methodtext').keydown(function(e){
		e.stopPropagation();
		//return false;
	});

	
	this.DeleteActiveMethod_imp = function()
	{
		if(this.currentNode.methods && this.currentNode.methods[this.selectedMethod])
		{
			vwf_view.kernel.deleteMethod(_ScriptEditor.currentNode.id,this.selectedMethod);
			window.setTimeout(function(){_ScriptEditor.currentNode = vwf.getNode(_ScriptEditor.currentNode.id); _ScriptEditor.BuildGUI();},500);
		}
	}
	
	this.DeleteActiveMethod = function(){
	$('#ScriptEditorDeleteMethod').dialog('open');
	}
	
	this.CallActiveMethod = function()
	{
		vwf_view.kernel.callMethod(_ScriptEditor.currentNode.id,_ScriptEditor.selectedMethod);
	}
	
	this.checkMethodSyntaxClick = function()
	{
		
		if(_ScriptEditor.checkMethodSyntax())
		{
			$('#ScriptEditorMessage').html('This script contains no syntax errors.');
			$('#ScriptEditorMessage').dialog('open');
		}
	}
	
	
	this.checkMethodSyntax = function()
	{
		var testobj = {};
		var error;
		try{
			testobj[_ScriptEditor.selectedMethod] = eval($('#methodtext').val());
		}catch(e)
		{
			error = e;
		}
		if(error)
		{
			$('#ScriptEditorMessage').html('This script contains syntax errors, and cannot be saved. The error is: \n' + error.toString());
			$('#ScriptEditorMessage').dialog('open');
			return false;
		}
		return true;
	}
	
	this.DeleteActiveEvent_imp = function()
	{
		if(this.currentNode.events && this.currentNode.events[this.selectedEvent])
		{
			vwf_view.kernel.deleteEvent(_ScriptEditor.currentNode.id,this.selectedEvent);
			window.setTimeout(function(){_ScriptEditor.currentNode = vwf.getNode(_ScriptEditor.currentNode.id); _ScriptEditor.BuildGUI();},500);
		}
	}
	
	this.DeleteActiveEvent = function(){
	$('#ScriptEditorDeleteEvent').dialog('open');
	}
	
	this.CallActiveEvent = function()
	{
		vwf_view.kernel.fireEvent(_ScriptEditor.currentNode.id,_ScriptEditor.selectedEvent);
	}
	
	this.checkEventSyntaxClick = function()
	{
		if(_ScriptEditor.checkEventSyntax())
		{
			$('#ScriptEditorMessage').html('This script contains no syntax errors.');
			$('#ScriptEditorMessage').dialog('open');
		}
	}
	this.checkEventSyntax = function()
	{
		var testobj = {};
		var error;
		try{
			testobj[_ScriptEditor.selectedEvent] = eval($('#eventtext').val());
		}catch(e)
		{
			error = e;
		}
		if(error)
		{
			$('#ScriptEditorMessage').html('This script contains syntax errors, and cannot be saved. The error is: \n' + error.toString());
			$('#ScriptEditorMessage').dialog('open');
			return false;
		}
		return true;
	}
	
	this.NewMethod = function()
	{
		if(_ScriptEditor.MethodChanged)
			_ScriptEditor.PromptAbandon(function(){_ScriptEditor.MethodChanged = false; $('#ScriptEditorCreateMethod').dialog('open');});
		else	
			$('#ScriptEditorCreateMethod').dialog('open');
	}
	
	this.NewEvent = function()
	{
		if(_ScriptEditor.EventChanged)
			_ScriptEditor.PromptAbandon(function(){_ScriptEditor.EventChanged = false; $('#ScriptEditorCreateEvent').dialog('open');});
		else	
			$('#ScriptEditorCreateEvent').dialog('open');
	}
	
	this.MethodChange = function()
	{
		
		if(!_ScriptEditor.selectedMethod)
			return false;
			
		_ScriptEditor.MethodChanged = true;
		$('#methodtext').css('border-color','red');
		return true;
	}
	this.EventChange = function()
	{
		if(!_ScriptEditor.selectedEvent)
			return false;
		_ScriptEditor.EventChanged = true;
		$('#eventtext').css('border-color','red');
		return true;
	}
	$('#deleteMethod').click(this.DeleteActiveMethod);
	$('#callMethod').click(this.CallActiveMethod);
	$('#checkSyntaxMethod').click(this.checkMethodSyntaxClick);
	
	$('#deleteEvent').click(this.DeleteActiveEvent);
	$('#callEvent').click(this.CallActiveEvent);
	$('#checkSyntaxEvent').click(this.checkEventSyntaxClick);
	
	$('#newMethod').click(this.NewMethod);
	$('#newEvent').click(this.NewEvent);
	$('#methodtext').keyup(this.MethodChange);
	$('#eventtext').keyup(this.EventChange);
	
	this.show = function()
	{
		$('#ScriptEditor').dialog('open');
		_ScriptEditor.resize();
		_ScriptEditor.BuildGUI();
		_ScriptEditor.open =true;
	}
	
	this.hide = function()
	{
		$('#ScriptEditor').dialog('close');
		
	}
	this.isOpen = function()
	{
		return $("#ScriptEditor").dialog( "isOpen" );
	}
	this.PostSaveMethod = function()
	{
		_ScriptEditor.currentNode=vwf.getNode(_ScriptEditor.currentNode.id);
		_ScriptEditor.MethodChanged = false;
		$('#methodtext').css('border-color','black');
		_ScriptEditor.BuildGUI(true);
	}
	this.SaveMethodClicked = function()
	{
		
		if(!_ScriptEditor.MethodChanged) return;
		if(!_ScriptEditor.checkMethodSyntax()) 
		{
			//show dialog;
			return false;
		}
		
		var methodname = _ScriptEditor.selectedMethod;
		var rawtext = this.methodeditor.getValue();
		var params = rawtext.substring(rawtext.indexOf('(')+1,	rawtext.indexOf(')'));
		params = params.split(',');
		var body = rawtext.substring(rawtext.indexOf('{')+1,	rawtext.indexOf('}'));
		body = $.trim(body);
		if(_ScriptEditor.currentNode.methods && _ScriptEditor.currentNode.methods[methodname])
		{
			vwf_view.kernel.deleteMethod(_ScriptEditor.currentNode.id,methodname);
		}
		vwf_view.kernel.createMethod(_ScriptEditor.currentNode.id,methodname,null,body);
		window.setTimeout(_ScriptEditor.PostSaveMethod,500);
		return true;
	}
	$('#saveMethod').click(this.SaveMethodClicked);
	
	this.PostSaveEvent = function()
	{
		_ScriptEditor.currentNode=vwf.getNode(_ScriptEditor.currentNode.id);
		_ScriptEditor.EventChanged = false;
		$('#eventtext').css('border-color','black');
		_ScriptEditor.BuildGUI(true);
	}
	this.SaveEventClicked = function()
	{
		
		if(!_ScriptEditor.EventChanged) return;
		if(!_ScriptEditor.checkEventSyntax()) 
		{
			//show dialog;
			return false;
		}
		
		var eventname = _ScriptEditor.selectedEvent;
		var rawtext = this.eventeditor.getValue();
		var params = rawtext.substring(rawtext.indexOf('(')+1,	rawtext.indexOf(')'));
		params = params.split(',');
		var body = rawtext.substring(rawtext.indexOf('{')+1,	rawtext.indexOf('}'));
		body = $.trim(body);
		if(_ScriptEditor.currentNode.events && _ScriptEditor.currentNode.events[eventname])
		{
			vwf_view.kernel.deleteEvent(_ScriptEditor.currentNode.id,eventname);
		}
		vwf_view.kernel.createEvent(_ScriptEditor.currentNode.id,eventname,params,body);
		window.setTimeout(_ScriptEditor.PostSaveEvent,500);
		return true;
	}
	$('#saveEvent').click(this.SaveEventClicked);
	
	this.PromptAbandon = function(callback)
	{
		$('#ScriptEditorAbandonChanges').dialog('open');
		_ScriptEditor.AbandonChangesCallback = callback;
	}
	this.setSelectedMethod_internal = function(name,text)
	{
		if(this.currentNode.methods && this.currentNode.methods[name])
		{
			_ScriptEditor.MethodChanged = false;
			$('#methodtext').css('border-color','black');
		}
		else
		{
			_ScriptEditor.MethodChanged = true;
			$('#methodtext').css('border-color','red');		
		}
		_ScriptEditor.selectedMethod = name;
		//$('#methodtext').val(text);
        this.methodeditor.setValue(text);
		$('#methodtext').css('background','url(images/stripe.png) 100% 100% repeat');
		$('#methodtext').removeAttr('disabled');
	}
	this.setSelectedMethod = function(name,text)
	{
		
		if(_ScriptEditor.MethodChanged)
			_ScriptEditor.PromptAbandon(function(){_ScriptEditor.setSelectedMethod_internal(name,text);})
		else
			_ScriptEditor.setSelectedMethod_internal(name,text);
	}
	this.setSelectedEvent_internal = function(name,text)
	{
		if(this.currentNode.events && this.currentNode.events[name])
		{
			_ScriptEditor.EventChanged = false;
			$('#eventtext').css('border-color','black');
		}else
		{
			_ScriptEditor.EventChanged = true;
			$('#eventtext').css('border-color','red');
		}
		_ScriptEditor.selectedEvent = name;
		this.eventeditor.setValue(text);
		$('#eventtext').css('background','');
		$('#eventtext').css('background','url(images/stripe.png) 100% 100% repeat');
		$('#eventtext').removeAttr('disabled');
	}
	this.setSelectedEvent = function(name,text)
	{
		if(_ScriptEditor.EventChanged)
			_ScriptEditor.PromptAbandon(function(){_ScriptEditor.setSelectedEvent_internal(name,text);})
		else
			_ScriptEditor.setSelectedEvent_internal(name,text);
	}
	this.BuildGUI = function(refresh)
	{
		
		if(!refresh)
		{
			this.selectedMethod = null;
			this.selectedEvent = null;
			this.MethodChanged = false;
			this.EventChanged = false;
			$('#eventtext').css('border-color','black');
			$('#methodtext').css('border-color','black');
			$('#methodtext').attr('disabled','disabled');
			$('#eventtext').attr('disabled','disabled');
			$('#eventtext').css('background','url(images/ui-bg_diagonals-thick_8_cccccc_40x40.png) 50% 50% repeat');
			$('#methodtext').css('background','url(images/ui-bg_diagonals-thick_8_cccccc_40x40.png) 50% 50% repeat');
			this.methodeditor.setValue('');
			this.eventeditor.setValue('');
		}
		
		if(!this.currentNode)
			return;
			
		$('#methodlist').empty();	
		$('#eventlist').empty();


		var style = "cursor:pointer;font-size: 1.5em;border: 1px solid gray;border-radius: 5px;box-shadow: 0px 0px 20px lightgray inset;margin: 2px;padding: 3px;"
		var newstyle = "cursor:pointer;font-size: 1.5em;border: 2px solid gray;border-radius: 5px;box-shadow: 0px 0px 20px gray inset;margin: 2px;padding: 3px;"
		var lightstyle = "color:lightgray;cursor:pointer;font-size: 1.5em;border: 0px solid lightgray;border-radius: 5px;box-shadow: 0px 0px 20px #EEEEEE inset;margin: 2px;padding: 3px;"
		
		for(var i in this.currentNode.methods)
		{
			
			$('#methodlist').append('<div class="scriptchoice" style="'+style+'" id="method'+i+'"></div>');
			$('#method'+i).html(i);
			$('#method'+i).attr('method',i);
			$('#method'+i).click(function(){
			
				$("#methodlist").children().css('border-color','gray');
				$(this).css('border-color','blue');
				var method = $(this).attr('method');
				_ScriptEditor.setSelectedMethod(method,"function " + method +"()\n{\n" + _ScriptEditor.currentNode.methods[method]+"\n}");
			});
			if(refresh)
			{
				if(this.selectedMethod == i)
				{
					$('#method'+i).click();
				}
			}	
		
		}
		

		
		for(var i in this.currentNode.events)
		{
			$('#eventlist').append('<div  style="'+style+'"  id="event'+i+'"></div>');
			$('#event'+i).html(i);
			$('#event'+i).attr('event',i);
			$('#event'+i).click(function(){
			
				$("#eventlist").children().css('border-color','gray');
				$(this).css('border-color','blue');
				var event = $(this).attr('event');
				
				var params = "";
				for(var j in _ScriptEditor.currentNode.events[event].parameters)
				{
					params += _ScriptEditor.currentNode.events[event].parameters[j] + ','
				}
				var eventstring = 'function '+event+'(';
				for(var i in _ScriptEditor.currentNode.events[event].parameters)
				{
					eventstring+=_ScriptEditor.currentNode.events[event].parameters[i]+',';
				}
				eventstring= eventstring.substring(0,eventstring.length-1);
				eventstring += ')\n{\n'+_ScriptEditor.currentNode.events[event].body+'\n}';
				_ScriptEditor.setSelectedEvent(event,eventstring);
				
			});
			
			if(refresh)
			{
				if(this.selectedEvent == i)
				{
					$('#event'+i).click();
				}
			}	
		}
		
		if(!this.currentNode.methods || (this.currentNode.methods && !this.currentNode.methods['tick']))
		{
		
			$('#methodlist').append('<div class="scriptchoice" style="'+lightstyle+'" id="methodtick"></div>');
			$('#methodtick').html('tick');
			$('#methodtick').attr('method','tick');
			$('#methodtick').click(function(){
				$("#methodlist").children().css('border-color','gray');
				$(this).css('border-color','blue');
				var method = $(this).attr('method');
				_ScriptEditor.setSelectedMethod(method,'function tick(){\n\n console.log("got here"); \n\n}');
			});
		}
		var pointersugs = ['pointerDown','pointerUp','pointerOver','pointerOut','pointerClick','pointerMove','keyDown','keyUp','keyPress'];
		
		
		for(var i in pointersugs)
		{
			if(!this.currentNode.events ||(this.currentNode.events && !this.currentNode.events[pointersugs[i]]))
			{
				var name = pointersugs[i];
				$('#eventlist').append('<div class="scriptchoice" style="'+lightstyle+'" id="event'+name+'"></div>');
				$('#event'+name).html(name);
				$('#event'+name).attr('event',name);
				$('#event'+name).click(function(){
					$("#eventlist").children().css('border-color','gray');
					$(this).css('border-color','blue');
					var event = $(this).attr('event');
					_ScriptEditor.setSelectedEvent(event,'function '+event+'(eventData,nodeData){\n\n console.log("got here"); \n\n}');
				});
			}
		}
		
		
		
	}
	this.changeSelection = function(node)
	{
			if(node)
			{
				if(!this.currentNode || (this.currentNode.id != node.id))
				{
					this.currentNode = node;
					this.BuildGUI();
				}else
				{
					this.BuildGUI(true);
				}
			}
	}
	this.SelectionChanged = function(e,node)
	{
		
		if(!this.isOpen())
		{
			_ScriptEditor.currentNode = node
				return;
		}
		try{
			
			if((this.MethodChanged || this.EventChanged) && ((node && this.currentNode && node.id != this.currentNode.id) || (!node && this.currentNode)))
			{
				
				$('#ScriptEditorAbandonChanges').html('You have selected a new object, but you have unsaved changes on this script. Do you want to abandon these changes? If you choose not to, your changes will remain in the editor, but the script editor will show properties for the previoiusly selected node, not the newly selected one.');
				this.PromptAbandon(function(){this.changeSelection(node)});
				
			}else
			{
				this.changeSelection(node);
			}
			
			
		}
		catch(e)
		{
			console.log(e);
		}
	}
	$(document).bind('selectionChanged',this.SelectionChanged.bind(this));
    this.methodeditor = ace.edit("methodtext");
    this.methodeditor.setTheme("ace/theme/monokai");
    this.methodeditor.getSession().setMode("ace/mode/javascript");
    
    this.eventeditor = ace.edit("methodtext");
    this.eventeditor.setTheme("ace/theme/monokai");
    this.eventeditor.getSession().setMode("ace/mode/javascript");
}
_ScriptEditor = new ScriptEditor();