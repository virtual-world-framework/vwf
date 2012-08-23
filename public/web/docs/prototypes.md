Prototypes
===================
-------------------
Prototypes are the base component types for inheritance in the Virtual World Framework. A prototype has the same structure as a VWF [component](components.html), and contains common properties, methods, and events. 

A component can inherit from a prototype by using the <code>extends</code> keyword and specifying the URI of the prototype component. All behaviors, properties, methods, events, children and scripts are inherited by the component. 

	extends: http://vwf.example.com/path/to/prototype.vwf

The default values for properties are defined in the prototype file. These properties can be overridden in the component definition file, or left alone to keep the default value. The same is true for methods and events, which can be extended in the component definition. 

The default prototype for all components is <code>http://vwf.example.com/node.vwf</code>.

Prototypes can be housed on any server, and any URI passed to the extends keyword. Common VWF prototypes use a URI of *vwf.example.com*.

**Common Prototypes**

* *node2.vwf* - base type for 2D components
* *node3.vwf* - base type for 3D components
* *camera.vwf* - base type for cameras
* *light.vwf* - base type for lights
* *material.vwf* - base type for materials
* *navscene.vwf* - base type for a navigational scene

The [Application API](application.html) covers the complete list of VWF prototypes and their property, method, and event definitions.

-------------------

