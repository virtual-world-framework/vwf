Components
===================
-------------------
Components define the behavior, state and visual representation of an object, and are the basic building blocks of VWF. Components make up a hierarchical structure, with each component acting as the parent or child to another component. At the root of the structure is the application, which is also a component, and is created automatically when the application loads.

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

**extends**

This specifies the URI or descriptor of the prototype component that is extended to make the new component. All behaviors, properties, methods, events, children and scripts are inherited by the component. The default prototype is <code>http://vwf.example.com/node.vwf</code>.

To specify a prototype using a URI, simply provide the URI.

	extends: http://vwf.example.com/path/to/prototype.vwf

Since a prototype is also a component, it can be specified using the same format.

	extends:
	  extends:
	  implements:
	  source:
	  type:
	  properties:
	  methods:
	  events:
	  children:
	  scripts:

See [prototypes](prototypes.html) for more information.

**implements**

This specifies the URIs of components that will be used as behaviors. All behaviors, properties, methods, events, children and scripts are inherited by the component, allowing functionality to be added from a separate file.

	implements:
	- http://vwf.example.com/path/to/behavior.vwf

See [behaviors](behaviors.html) for more information.

**source/type**

The source and type allow the component to load a seperate data blob, usually in the form of a 3D model or image. Source is the URI of the data, and type is the MIME type. If type is not specified, it will default to the MIME type taken from the server's response.

	source: model.dae
	type: model/vnd.collada+xml

**properties**

Properties are the public variables of the component. The component inherits properties from its prototype and any behaviors. Initializing a property will override any default values from the prototype or behavior.

The declaration for a property provides only a name, and an optional value.

	properties:
	  aProperty: value

Properties can also be declared with accessor functions that allow the component to detect changes, allow only acceptable values, or serve as a proxy for another property. 

	properties:
	  aProperty:
	    set: | # calculate and set the value
	      this.aProperty = value
	    get: | # calculate and return the value
	      return this.aProperty
	    value: # the value is available to the accessor functions
	      value

**methods**

Methods are the public functions of the component. The component inherits methods from its prototype and behaviors. Redefining those methods here will override the inherited ones.

The method declaration only provides the body of the method.

	methods:
	  aMethod: |
	  	// method body

The extended method specifier allows named parameters. Additional parameters can still be parsed out of the arguments object when needed.

	methods:
	  anotherMethod:
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

**events**

Events define the outgoing messages a node can trigger. The component inherits events from its prototype and behaviors. 

The event specifier only provides the name of the event.

	events:
	  anEvent:

The extended event specifier describes the arguments passed to the event. As with methods, additional parameters can still be parsed out of the arguments object in the event handler.

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

VWF also defines several dispatched events. These are triggered when outside actions, such as a key press or mouse click occur. When one of these events occurs, the system automatically finds any nodes that have been definined as triggering the event, and dispatches the event from those nodes. Currently, the dispatched events defined by VWF are:

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

**children**

Children are instances of other components that are attached to this component. A child can be a simple reference to a seperate component, or the reference can include a configuration. The format for a child specification is the same as for a component.

	children:
	  childFromURI: http://vwf.example.com/path/to/component.vwf
	  childFromDescriptor:
	    extends: http://vwf.example.com/path/to/component.vwf
	    properties:
          something: value
      childFromDescriptorDetailed:
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
            descriptor
          another:
            descriptor
        methods:
          name:
            descriptor
          another:
            descriptor
        events:
          name:
            descriptor
          another:
            descriptor
        children:
        - name:
            component
        - another:
            component
        scripts:
        - specifier
        - specifier

**scripts**

Scripts define the component's internal behavior and can be used to create and use private variables and methods, and event handlers. Currently the only language supported for scripts is JavaScript.

	scripts:
	- |
	  var aVariable;
	  this.aFunction = function() {
	  	...
	  }

Inside a script <code>this</code> always refers to the component that owns the script. Other components can be accessed by navigating up or down the component hierarchy using <code>this.parent</code> and <code>this.children.childName</code>. VWF also defines an <code>intialize</code> function that is automatically executed when a component is intialized. In order to use this function, define it like any other function.

	scripts:
	- |
	  this.initialize = function() {
	  	...
	  }

-------------------

Manipulating Components With JavaScript
-------------------
-------------------

The various parts of a component can also be modified from JavaScript after the component has been initialized as a node. VWF defines several functions to make these changes.

**properties**

New properties can be added using the following syntax.

	this.properties.create("propertyName", value);

The first parameter is the name of the new property, and the second is the value the property will be initialized with. There are also two optional parameters that customize the getter and setter of the parameter. These are passed in as strings.
	
	this.properties.create("propertyName", value, "return this.propertyName;", "this.propertyName = value;");

**methods**

New methods can be added using the following syntax.

	this.methods.create("methodName", [methodParameters,...], methodBody);

The first parameter is the name of the new method, the second is an array of any parameters the method will take, and the third is the body of the method, as a string.

**events**

Creating a new event uses the following syntax.

	this.events.create("eventName", [eventParameters]);

The first parameter is the name of the new event and the second is an array of any parameters the event will take.

New event listeners can also be added.

	this.events.eventName = this.events.add(function() { ... }, phases, this.children.listeningNode);

The first parameter is the function that will be executed when the event occurs. The second parameter is optional and defaults to "bubble". Setting phases to "capture" will prevent the event from propagating to other nodes. The final parameter is the node that is listening for the event. 

**children**

A component can be written as a JavaScript object in the following format.

	var component = {
	  extends: "http://vwf.example.com/path/to/prototype.vwf",
	  implements: ["http://vwf.example.com/path/to/behavior.vwf"],
	  properties: {
	    aProperty: value
	  },
	  methods: {
	    aMethod: function( parameter, ... ) { ... },
        anotherMethod: function( parameter, ... ) { ... }
	  },
	  events: {
	    anEvent: function() { ... },
        anotherEvent: function() { ... }
	  },
	  children: {
	    childFromURI: "http://vwf.example.com/path/to/component.vwf",
        childFromDescriptor: {
	      extends: "http://vwf.example.com/path/to/component.vwf",
	      properties: {
              something: "value"
          }
        }
	  },
	  scripts: [  "this.aFunction = function() { ... }"]
	};

From inside an existing node, the new component can be created using the following syntax.

	this.children.create("componentName", component);

The first argument is the name the new component will be created with, and the second is the JavaScript object for the component itself. The new component will be created as a child of <code>this</code>, and will be treated the same as any other children that were already present.

Children can also be deleted. The delete function takes the JavaScript object of the child that will be deleted.

	this.children.delete(this.children.component);

-------------------

