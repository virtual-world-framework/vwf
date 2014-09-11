define(function ()
{
	var UndoManager = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(UndoManager);
				isInitialized = true;
			}
			return UndoManager;
		}
	}

	function findid (node,name)
	{
		if(node.name == name)
		{
			return node.id;
		}else
		{
			for(var i in node.children)
			{
				var name1 = findid(node.children[i],name);
				if(name1) return name1;	
			}
		}
		return null;

	}
	//give up on this - creates too much drama
	function SelectionEvent(selectionSet)
	{

		this.oldSelection = [];
		for(var i =0; i < _Editor.getSelectionCount(); i++)
			this.oldSelection.push(_Editor.GetSelectedVWFNode(i).id);
		this.selection = [];
		for(var i =0; i < selectionSet.length; i++)
			if(selectionSet[i])
				this.selection.push(selectionSet[i].id)
		this.undo = function()
		{
			try{
			_Editor.SelectObject(this.oldSelection,null,true);
			}catch(e)
			{
				//the undo system can cause selection events for objects that don't exist
			}
		}
		this.redo = function()
		{
			_Editor.SelectObject(this.selection,null,true);
		}
		this.compare = function(event)
		{
			if(event.constructor !== this.constructor)
				return false;
			if(this.selection.length != event.selection.length)
				return false;
			for(var i = 0; i < this.selection.length; i++)
				if(this.selection[i] != event.selection[i])
					return false;	
			return true;
		}


	}
	function CreateNodeEvent(parent,name,proto,uri)
	{
		this.proto = JSON.parse(JSON.stringify(proto));
		this.name = name;
		this.parent = parent;
		this.uri = uri;
		this.undo = function()
		{
			
			var id = findid(_Editor.getNode('index-vwf'),this.name);
			vwf_view.kernel.deleteNode(id);
		}
		this.redo = function()
		{
			vwf_view.kernel.createChild(this.parent,this.name,this.proto,this.uri);
		}
		this.compare = function(event)
		{
			if(event.constructor !== this.constructor)
				return false;
			if(this.name != event.name)
				return false;
			if(this.parent != event.parent)
				return false;
			if(this.uri != event.uri)
				return false;
			if(JSON.stringify(this.proto) != JSON.stringify(event.proto))
				return false;
			return true;
		}
	}
	function DeleteNodeEvent(id)
	{

		this.id = id;
		this.name = _Editor.getNode(id).name;
		this.proto = _DataManager.getCleanNodePrototype(id);
		this.parent = vwf.parent(id);
		this.undo = function()
		{
			vwf_view.kernel.createChild(this.parent,this.name,this.proto);
		}
		this.redo = function()
		{
			vwf_view.kernel.deleteNode(this.id);
		}
		this.compare = function(event)
		{
			if(event.constructor !== this.constructor)
				return false;
			if(this.name != event.name)
				return false;
			if(this.id != event.id)
				return false;
			if(this.parent != event.parent)
				return false;
			return true;
		}
	}
	function SetPropertyEvent(id,property,val)
	{
		this.property = property;
		this.val = JSON.parse(JSON.stringify(val || null));
		this.id = id;
		this.oldval = JSON.parse(JSON.stringify(vwf.getProperty(id,property) || null));
		this.undo = function()
		{
			vwf_view.kernel.setProperty(this.id,this.property,this.oldval);
		}
		this.redo = function()
		{
			vwf_view.kernel.setProperty(this.id,this.property,this.val);	
		}
		this.compare = function(event)
		{
			if(event.constructor !== this.constructor)
				return false;
			if(this.val != event.val)
				return false;
			if(this.id != event.id)
				return false;
			if(this.property != event.property)
				return false;
			return true;
		}
	}
	function CompoundEvent()
	{
		this.list = [];
		this.undo = function()
		{
			for(var i=this.list.length-1; i > -1; i--)
				this.list[i].undo();
		}
		this.redo = function()
		{
			for(var i=0; i < this.list.length; i++)
				this.list[i].redo();
		}
		this.push = function(newEvent)
		{
			this.list.push(newEvent);
		}
		this.compare = function(event)
		{
			if(event.constructor !== this.constructor)
				return false;
			if(this.list.length != event.list.length)
				return false;
			for(var i = 0; i < this.list.length; i++)
				if(!this.list[i].compare(event.list[i]))
					return false;
			return true;	
		}

	}
	function initialize()
	{
		this.stack = [];
		this.head = -1;
		this.SetPropertyEvent = SetPropertyEvent;
		this.DeleteNodeEvent = DeleteNodeEvent;
		this.CreateNodeEvent = CreateNodeEvent;
		this.CompoundEvent = CompoundEvent;
		this.undo = function()
		{

			if(this.head == 0) return;
			this.stack[this.head-1].undo();
			this.head--;
		}
		this.redo = function()
		{
			if(this.head == this.stack.length) return;

			this.head++;
			this.stack[this.head-1].redo();
		}
		this.pushEvent = function(newevent)
		{

			//if recording a compound action, store it.
			if(this.currentCompoundEvent)
			{
				this.currentCompoundEvent.push(newevent)
				return;
			}

			
			this.stack = this.stack.slice(0,this.head);

			if(this.stack.length > 30) this.stack.shift();
			
			//don't add events that don't change anything
			if(this.stack[this.stack.length-1] && this.stack[this.stack.length-1].compare(newevent))
				return;
			console.log(newevent);
			this.stack.push(newevent);
			this.head = this.stack.length;
		}
		this.recordDelete = function(id)
		{

			
			this.pushEvent(new DeleteNodeEvent(id));
			
		}
		this.recordCreate = function(parent,name,proto,uri)
		{
			
			this.pushEvent(new CreateNodeEvent(parent,name,proto,uri));
			
		}
		this.recordSetProperty = function(id,prop,val)
		{
			this.pushEvent(new SetPropertyEvent(id,prop,val));
		}
		this.recordSelection = function(selection)
		{
			this.pushEvent(new SelectionEvent(selection));
		}
		this.startCompoundEvent = function()
		{
			//start a stack
			if(this.currentCompoundEvent)
			{
				var oldcurrent = this.currentCompoundEvent;
				var newcurrent = new CompoundEvent;
				newcurrent.parent = oldcurrent;
				oldcurrent.push(newcurrent);
				this.currentCompoundEvent = newcurrent;

			}else
			this.currentCompoundEvent = new CompoundEvent();
		}
		this.stopCompoundEvent = function()
		{
			var newevent = this.currentCompoundEvent
			this.currentCompoundEvent = newevent.parent;


			if(newevent && !newevent.parent && newevent.list.length > 0)
			this.pushEvent(newevent);
			
		}
	}
});