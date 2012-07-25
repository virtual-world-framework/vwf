Behaviors
===================
-------------------

A behavior is a component that is used to add functionality to another component. It is referenced from a seperate file, allowing multiple components to reuse the same behavior. To use a behavior, add an <code>implements</code> section to the component with the URI to the behavior.

	implements:
	- http://vwf.example.com/path/to/behavior.vwf

When a behavior is loaded, all behaviors, properties, methods, events, children and scripts are inherited by the new component. All the inherited functionality can be used as part of the component. Behaviors can also use properties from the component that implement the behavior. For example, in this behavior, <code>someMethod</code> will perform an action based on the value of <code>behavior-someProperty</code>, which defaults to true. The convention for properties from the behavior is to prefix the property name with the name of the behavior, to avoid accidently overriding the value with a property from the implementing component.

	---
	properties:
	  behavior-someProperty: true 
	methods:
	  someMethod: |
	    if(this.behavior-someProperty && this.anotherProperty) {
	      // Do something
	    }
	    else {
	      // Do something else
	    }

<code>anotherProperty</code> is definied in the implementing component, but is still usable in the behavior. If the component that is implementing the behavior needs <code>behavior-someProperty</code> to be false, it simply overrides the value in its own properties. 

	---
	implements:
	- http://vwf.example.com/path/to/behavior.vwf
	properties:
	  behavior-someProperty: false
	  anotherProperty: true
	scripts:
	- |
	  this.doSomething = function() {
	    this.someMethod();
	  }

When <code>someMethod</code> executes, it will read the overridden value of <code>behavior-someProperty</code>, and go into the else statement.

-------------------

