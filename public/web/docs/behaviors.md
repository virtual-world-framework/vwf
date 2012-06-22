Behaviors
===================
-------------------

A behavior is a component that is used to add functionality to another component. It is referenced from a seperate file, allowing multiple components to reuse the same behavior. To use a behavior, add an <code>implements</code> section to the component with the URI to the behavior.

	implements:
	- http://vwf.example.com/path/to/behavior.vwf

When a behavior is loaded, it copies all behaviors, properties, methods, events, children and scripts are copied to the new component. All the copied functionality can be used as part of the component. Also, because the functionality was copied, it can be configured individually on each component that uses the behavior. For example, in this behavior, <code>someMethod</code> will perform an action based on the value of <code>someProperty</code>, which defaults to true.

	---
	properties:
	  someProperty: true
	methods:
	  someMethod: |
	    if(this.someProperty) {
	      // Do something
	    }
	    else {
	      // Do something else
	    }

If the component that is implementing the behavior needs <code>someProperty</code> to be false, it simply overrides the value in its own properties.

	---
	implements:
	- http://vwf.example.com/path/to/behavior.vwf
	properties:
	  someProperty: false
	scripts:
	- |
	  this.doSomething = function() {
	    this.someMethod();
	  }

-------------------

