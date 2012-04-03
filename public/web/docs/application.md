Application Reference
=====================
---------------------

A Virtual World Framework application is an arrangement of nodes communicating through properties,
methods, and events. Applications are constructed from components, which may themselves build on
more fundamental components. An application is an instance of some component, and any component may
be launched as an application.

The fundamental component is *node*. Components build on *node* and others by *extending* a
component, *implementing* functionality from multiple components, and adding components as children.
Components add new properties, methods and events to the base component and define behavior by
adding new scripts.

Drivers loaded into the kernel provide additional intrisic components providing access to scene
managers, external devices, and other functions.


Format
------

Components are written as either JSON or YAML documents and served as Internet resources. The two
formats are equivalent, although YAML is somewhat easier for humans to write.

[Specification](specification.html).


Script Bindings
---------------

Component scripts execute in a context appropriate for the scripting language.

[JavaScript binding](binding.html).
