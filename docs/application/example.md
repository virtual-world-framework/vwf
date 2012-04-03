example.js
==========

A component's JavaScript scripts execute in a context that is natural for the language.

	{

*this.parent* is a reference to the JavaScript object for this node's parent.

	    parent: parent,

*this.name* is the name given to this node by its parent.

	    name: "name",

The JavaScript object for this node's prototype is attached properly to *this.__proto__* so that inheritance works as expected.

	    __proto__: prototype,

Properties appear by name in `this.properties`. Getting or setting a property (*xyz* = `this.properties.name`, or `this.properties.name` = *xyz*) invokes the getter or setter function when defined. Within the function, *this* refers to this node.
    
The getter is invoked with no parameters and is expected to return a value. The setter is invoked with a single parameter `value` and is expected to assign to the property.

		properties: {
			name: value,
			another: value,
		}

Properties whose names don't conflict with others will also appear directly on the node. Property names take precedence over method, event and child names.

		name: value,
		another: value,

Methods appear by name in `this.methods`. The method may be invoked as `node.methods.name( parameter, ... )` for some node *node*. Within the function, *this* refers to this node. Assigning to the method (`this.methods.name = function( parameter, ... ) { ... }`) updates the function.

		methods: {
			name: function( parameter, ... ) { ... },
			another: function( parameter, ... ) { ... },
			unique: function( parameter, ... ) { ... },
		}

Methods whose names don't conflict with others will also appear directly on the node. Method names take precedence over event and child names, but property names take precedence over method names.

	    unique: function( parameter, ... ) { ... },

Events appear by name in `this.events`. This node fires an event by invoking it like a function as `this.events.name( parameter, ... )`.
    
Listeners call `node.events.name.add( function() { ... }, this )` for some node *node* to register a handler. A handler can be removed by passing the same function to `node.events.name.remove( function() { ... } )` or by calling `node.events.name.flush( this )` with the same *this*.

		events: {
			name: function() { ... },
			another: function() { ... },
			different: function() { ... },
		}

Events whose names don't conflict with others will also appear directly on the node. Event names take precedence over child names, but property and method names take precedence over event names.

	    different: function() { ... },

JavaScript objects for each child node appear by name in `this.children`.

		children: {
			name: name,
			another: another,
		}

Children whose names don't conflict with others will also appear directly on the node. Property, method and event names take precedence over child names.

	    special: special,

*this.id* contains the node's kernel id. The id is generally not needed from JavaScript, but it may useful for debugging. Nothing is specified about the id other that it is unique across all nodes and is either a number or a string.

		id: id, // number or string

	}

