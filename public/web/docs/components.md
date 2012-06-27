Components
===================
-------------------
Components define the behavior, state and visual representation of an object, and are the basic building blocks of VWF. Components make up a hierarchical structure, with each component acting as the parent or child to another component. At the root of the structure is the index-vwf node, which is created automatically from the index file when the application loads.

-------------------

Component Contents
-------------------
-------------------

There are eight parts that make up a component, seen here as a skeleton in YAML.

	---
	extends:
	implements:
	source:
	type:
	properties:
	methods:
	events:
	children:
	scripts:


Each part is optional and only needs to be include in the component definition if that part needs to be customized in the component. All relative paths are resolved using the current component as the base.

**Extends**

This specifies the URI of the prototype component that is extended to make the new component. All behaviors, properties, methods, events, children and scripts are inherited by the component. The default prototype is <code>http://vwf.example.com/node.vwf</code>.

	extends: http://vwf.example.com/path/to/prototype.vwf

See [prototypes](prototypes.html) for more information.

**Implements**

Implements specifies the URIs of components that will be used as behaviors. All behaviors, properties, methods, events, children and scripts are copied from the behavior to the new component, allowing functionality to be added from a seperate file.

	implements:
	- http://vwf.example.com/path/to/behavior.vwf

See [behaviors](behaviors.html) for more information.

**Source/Type**

Source and type allow the component to load a seperate data blob, usually in the form of a 3D model or image. Source is the URI of the data, and type is the MIME type. If type is not specified, it will default to the MIME type taken from the server's response.

	source: asset.dat
	type: mime/type

**Properties**

Properties are the public variables of the component. The component inherits properties from its prototype and receives copies of properties declared in its behaviors. Initializing a property will override any default values from the prototype or behavior.

The basic declaration for a property provides only a name, and an optional value.

	properties:
	  propertyName: value

Properties can also be declared with accessor functions that allow the component to detect changes, allow only acceptable values, or serve as a proxy for another property. Declaring <code>get</code> as null will prevent reads, and declaring <code>set</code> as null will prevent writes.

	properties:
	  propertyName:
	    set: | # calculate and set the value
	      this.propertyName = value
	    get: | # calculate and return the value
	      return this.propertyName
	    value: # the value is available to the accessor functions
	      value

**Methods**

Methods are the public functions of the component. The component inherits methods from its prototype and receives copies of methods defined in its behaviors. Redefining those methods here will override the inherited ones.

The short method specifier only provides the body of the method.

	methods:
	  aMethod: |
	  	// method body

The long method specifier allows named parameters. Additional parameters can still be parsed out of the arguments object when needed.

	methods:
	  aMethod:
	    parameters:
	    - one
	    - two
	    body: |
	      var three = arguments[2];
	      this.something(one, two, three);

Methods can also be declared empty, and intialized in a script later.

	methods:
	  aMethod:
	scripts:
	- |
	  this.aMethod = function(one, two, three) {

	  }

**Events**

Java style event listener and fire events
Operating system events (pointerHover) uses kernel method to fire events from itself

Events define the outgoing messages a node can trigger. The component inherits events from its prototype and receives copies of events defined in its behaviors. 

The short event specifier only provides the name of the event.

	events:
	  anEvent:

The long event specifier describes the arguments passed to the event. As with methods, additional parameters can still be parsed out of the arguments object in the event handler.

	events:
	  anotherEvent:
	    parameters:
	    - one
	    - two

To listen for events, a javascript function that matches the event name is added to the Scripts section of the component.

    events:
	  anEvent:
	scripts:
	- |
	  this.anEvent = function() {

	  }

VWF also defines several system events. These are triggered when outside actions, such as a key press or mouse click occur. When one of these events occurs, the system automatically finds any nodes that have been definined as triggering the event, and dispatches the event from those nodes. Currently, the system events used by VWF are:

* keyDown
* keyUp
* pointerClick
* pointerDown
* pointerEnter
* pointerHover
* pointerLeave
* pointerMove
* pointerUp
* pointerWheel

**Children**

Children are instances of other components that are attached to this component. A child can be a simple reference to a seperate component, or the reference can include a configuration. The format for a child specification is the same as for a component.

	children:
	  simple: http://vwf.example.com/path/to/component.vwf
	  configured:
	    extends: http://vwf.example.com/path/to/component.vwf
	    properties:
          something: value
      detailed:
        extends: http://vwf.example.com/path/to/prototype.vwf
        implements:
        - http://vwf.example.com/path/to/behavior.vwf
        - http://vwf.example.com/a/different/behavior.vwf
        source:
          asset.dat
        type:
          mime/type
        properties:
          name:
            initializer
          another:
            initializer
        methods:
          name:
            initializer
          another:
            initializer
        events:
          name:
            initializer
          another:
            initializer
        children:
        - name:
            component
        - another:
            component
        scripts:
        - specifier
        - specifier

**Scripts**

Scripts define the component's internal behavior and can be used to create private variables and methods, and event handlers. Currently the only language supported for scripts is JavaScript.

	scripts:
	- |
	  var aVariable;
	  this.aFunction = function() {

	  }

External scripts can also be loaded using the following syntax.

	scripts:
	- source:
        http://vwf.example.com/path/to/script.js
      type:
        application/javascript

Inside a script <code>this</code> always refers to the component that owns the script. Other components can be accessed by navigating up or down the component hierarchy using <code>this.parent</code> and <code>this.children.childName</code>.

-------------------

Creating Components With JavaScript
-------------------
-------------------

Components can also be created after the application has loaded through JavaScript. A component can be written as a JavaScript object in the following format.

	var component = {
	  extends: "http://vwf.example.com/path/to/prototype.vwf",
	  properties: {
	    name: value,
        another: value,
	  },
	  methods: {
	    name: function( parameter, ... ) { ... },
        another: function( parameter, ... ) { ... },
        unique: function( parameter, ... ) { ... },
	  },
	  events: {
	    name: function() { ... },
        another: function() { ... },
        different: function() { ... },
	  },
	  children: {
	    name: name,
        another: another,
	  }
	};

From inside an existing component, the new component can be created using the following syntax.

	existingComponent.children.create("componentName", component);

The first argument is the name the new component will be created with, and the second is the JavaScript object for the component itself. The new component will be created as a child of existingComponent, and will be treated the same as any other children that were already present.

From outside a component, such as in the javascript of an HTML file, the component can be created with the following syntax.

	vwf_view.kernel.createChild("index-vwf", "componentName", component, callback);

The first argument is the name of the node that will be the parent of the new component. The second argument is the name of the new component, and the third is the JavaScript object defining the new component. The final argument is optional, and is a function that will be called after the new component has been created.

-------------------

