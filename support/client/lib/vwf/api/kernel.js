"use strict";

// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

/// Kernel API.
/// 
/// @module vwf/api/kernel

define( function() {

    var exports = {

        // TODO: setState
        // TODO: getState
        // TODO: hashState

        /// Create a node from a component specification. Construction may require loading data from
        /// multiple remote documents. This function returns before construction is complete. A callback
        /// is invoked once the node has fully loaded.
        /// 
        /// A simple node consists of a set of properties, methods and events, but a node may specialize
        /// a prototype component and may also contain multiple child nodes, any of which may specialize
        /// a prototype component and contain child nodes, etc. So components cover a vast range of
        /// complexity. The application definition for the overall simulation is a single component
        /// instance.
        /// 
        /// A node is a component instance--a single, anonymous specialization of its component. Nodes
        /// specialize components in the same way that any component may specialize a prototype
        /// component. The prototype component is made available as a base, then new or modified
        /// properties, methods, events, child nodes and scripts are attached to modify the base
        /// implemenation.
        /// 
        /// To create a node, we first make the prototoype available by loading it (if it has not
        /// already been loaded). This is a recursive call to createNode() with the prototype
        /// specification. Then we add new, and modify existing, properties, methods, and events
        /// according to the component specification. Then we load an add any children, again
        /// recursively calling createNode() for each. Finally, we attach any new scripts and invoke an
        /// initialization function.
        /// 
        /// @function
        /// 
        /// @param {String|Object} nodeComponent
        /// @param {String} [nodeAnnotation]
        /// @param {module:vwf/api/kernel~nodeCallback} [callback]
        /// 
        /// @returns {}

        createNode: [ /* nodeComponent, nodeAnnotation, callback( nodeID ) */ ],

        /// Delete a node.
        /// 
        /// The node and all of its descendants will be removed from the application.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {}

        deleteNode: [ /* nodeID */ ],

        /// Set node will set the properties of the node specified by the given id and component.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String|Object} nodeComponent
        /// @param {module:vwf/api/kernel~nodeCallback} [callback]
        /// 
        /// @returns {}

        setNode: [ /* nodeID, nodeComponent, callback( nodeID ) */ ],

        /// Get node will retrieve the component of the node specified by the given id.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {Boolean} full
        /// @param {Boolean} normalize
        /// 
        /// @returns {Object}

        getNode: [ /* nodeID, full, normalize */ ],

        // TODO: hashNode

        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} childName
        /// @param {String|Object} childComponent
        /// @param {String} [childURI]
        /// @param {module:vwf/api/kernel~nodeCallback} [callback]
        /// 
        /// @returns {}

        createChild: [ /* nodeID, childName, childComponent, childURI, callback( childID ) */ ],

        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} childName
        /// 
        /// @returns {}

        deleteChild: [ /* nodeID, childName */ ],

        /// addChild calls addingChild() on each model. The child is considered added after each model has
        /// run.  Additionally, it calls addedChild() on each view. The view is being notified that a 
        /// child has been added.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {ID} childID
        /// @param {String} childName
        /// 
        /// @returns {}

        addChild: [ /* nodeID, childID, childName */ ],

        /// removeChild calls removingChild() on each model. The child is considered removed after each model
        /// has run.  Additionally, it calls removedChild() on each view. The view is being notified that a 
        /// child has been removed.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {ID} childID
        /// 
        /// @returns {}

        removeChild: [ /* nodeID, childID */ ],

        /// setProperties sets all of the properties for a node.  It will call settingProperties() 
        /// on each model and satProperties() on each view.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {Object} properties
        /// 
        /// @returns {Object}

        setProperties: [ /* nodeID, properties */ ],

        /// getProperties will get all of the properties for a node.  It will call 
        /// gettingProperties() on each model and gotProperties() on each view.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {Object}

        getProperties: [ /* nodeID */ ],

        /// createProperty will create a property on a node and assign an initial value.
        /// It will call creatingProperty() on each model. The property is considered created after each
        /// model has run.  Additionally, it wil call createdProperty() on each view. The view is being
        /// notified that a property has been created.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} propertyName
        /// @param propertyValue
        /// @param {String} propertyGet
        /// @param {String} propertySet
        /// 
        /// @returns {} propertyValue

        createProperty: [ /* nodeID, propertyName, propertyValue, propertyGet, propertySet */ ],

        // TODO: deleteProperty

        /// setProperty setsa specific property value on a node.  It will call settingProperty() 
        /// on each model. The first model to return a non-undefined value has performed the
        /// set and dictates the return value. The property is considered set after each model has run.
        /// It will also call satProperty() on each view. The view is being notified that a property has
        /// been set.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} propertyName
        /// @param {Value} propertyValue
        /// 
        /// @returns {Value} propertyValue

        setProperty: [ /* nodeID, propertyName, propertyValue */ ],

        /// getProperty will retrive a property value for a node.  It will call gettingProperty() 
        /// on each model. The first model to return a non-undefined value dictates the return value.
        /// It will also call gotProperty() on each view.
        ///
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} propertyName
        /// 
        /// @returns {Value} propertyValue

        getProperty: [ /* nodeID, propertyName */ ],

        /// It will call creatingMethod() on each model. The method is considered created after each
        /// model has run.  It will also call createdMethod() on each view. The view is being 
        /// notified that a method has been created.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} methodName
        /// @param {String[]} methodParameters
        /// @param {String} methodBody
        /// 
        /// @returns {Handler} methodHandler

        createMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],

        // TODO: deleteMethod

        /// xxx
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} methodName
        /// @param {Handler} methodHandler
        /// 
        /// @returns {Handler} methodHandler

        setMethod: [ /* nodeID, methodName, methodHandler */ ],

        /// xxx
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} methodName
        /// 
        /// @returns {Handler} methodHandler

        getMethod: [ /* nodeID, methodName */ ],

        /// It will call callingMethod() on each model. The first model to return a non-undefined value
        /// dictates the return value.  It will also call calledMethod() on each view.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} methodName
        /// @param {Value[]} methodParameters
        /// 
        /// @returns {Value} returnValue

        callMethod: [ /* nodeID, methodName, methodParameters */ ],

        /// Create an event on a node.
        /// 
        /// Events are outgoing function calls that a node makes to announce changes to the node, or
        /// to announce changes within a set of nodes that the node manages. Other nodes may attach
        /// listener functions to the event which will be called when the event fires.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} eventName
        /// @param {String[]} eventParameters
        /// 
        /// @returns {}

        createEvent: [ /* nodeID, eventName, eventParameters */ ],

        // TODO: deleteEvent

        /// xxx
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} eventName
        /// @param {} eventDescriptor
        /// 
        /// @returns {}

        setEvent: [ /* nodeID, eventName, eventDescriptor */ ],

        /// xxx
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} eventName
        /// 
        /// @returns {}

        getEvent: [ /* nodeID, eventName */ ],

        /// Add a function to a node's event to be called when the event fires.
        /// 
        /// By default, the handler will be invoked in the context of the sender. For JavaScript
        /// handlers, this means that `this` will refer to the node with ID `nodeID`. To invoke the
        /// handler on a different node, provide an `eventContextID` when adding the listener.
        /// 
        /// For dispatched events (invoked with `kernel.dispatchEvent`), events are fired from a
        /// series of nodes until the event is handled. Starting at the application root, the event
        /// is fired on the target's ancestors, downward, in a "capture" phase, fired on the target
        /// node, then again fired on the target's ancestors, upward, in a "bubbling" phase.
        /// 
        /// For dispatched events, after firing the event at a particular node, if any of the
        /// handlers returned a truthy value, the event is considered _handled_ and the dispatch
        /// process stops at that node. An event that is handled during the capture phase prevents
        /// lower nodes or the target node from receiving the event. Events handled during the
        /// bubbling phase are catching events not handled by lower nodes or by the target node.
        /// 
        /// By default, a listener will only be invoked if it is attached to the event target or
        /// during the bubbling phase if it attached to a node above the target. To also invoke a
        /// listener during the capture phase, pass `eventPhases` as the array `[ "capture" ]`.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        ///   The ID of a node containing an event `eventName`.
        /// @param {String} eventName
        ///   The name of an event on the `nodeID` node. When the event is fired, all of its
        ///   listeners will be called.
        /// @param {Handler} eventHandler
        ///   A script to be evaluated as a function body and added as a handler for the event.
        ///   Strings will be interpreted as JavaScript; other script types may be supported in
        ///   future releases. The `eventParameters` that were provided to the `createEvent` call
        //    will be available to the handler body as function parameters.
        /// @param {ID} [eventContextID]
        ///   The ID of the node that the handler is _invoked on_. For JavaScript handlers, `this`
        ///   will refer to the `eventContextID` node. If `eventContextID` is not provided, the
        ///   handler will be invoked in the context of the global root pseudo-node.
        /// @param {String[]} [eventPhases]
        ///   An array of strings indicating the event dispatch phases that this handler should
        ///   respond to. Handlers will be invoked at the target and during the bubbling phase
        ///   regardless of its `eventPhases`. To also invoke a handler during the capture phase,
        ///   include `"capture"` in the `eventPhases` array.` `eventPhases` only applies to the
        ///   propagation performed by `kernel.dispatchEvent`. Once `kernel.fireEvent` is called, it
        ///   always invokes all of the event's handlers.
        /// 
        /// @returns {ListenerID}

        addEventListener: [ /* nodeID, eventName, eventHandler, eventContextID, eventPhases */ ],

        /// Remove a function from a node's event. The handler will no longer be called when the
        /// event fires.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        ///   The ID of a node containing an event `eventName`.
        /// @param {String} eventName
        ///   The name of an event on the `nodeID` node.
        /// @param {ListenerID} eventListenerID
        ///   A listener ID previously returned by `kernel.addEventListener` that identifies a
        ///   listener attached to this `nodeID` and `eventName`.
        /// 
        /// @returns {ListenerID}
        ///   `eventListenerID` if the listener was removed successfully. Otherwise, a falsy value.

        removeEventListener: [ /* nodeID, eventName, eventListenerID */ ],

        /// xxx
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        ///   The ID of a node containing an event `eventName`.
        /// @param {String} eventName
        ///   The name of an event on the `nodeID` node.
        /// @param {ListenerID} eventListenerID
        ///   A listener ID previously returned by `kernel.addEventListener` that identifies a
        ///   listener attached to this `nodeID` and `eventName`.
        /// @param {Listener} eventListener
        ///   A script to be evaluated as a function body and added as a handler for the event.
        ///   Strings will be interpreted as JavaScript; other script types may be supported in
        ///   future releases. The `eventParameters` that were provided to the `createEvent` call
        //    will be available to the handler body as function parameters.
        /// 
        /// @returns {Listener}

        setEventListener: [ /* nodeID, eventName, eventListenerID, eventListener */ ],

        /// xxx
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        ///   The ID of a node containing an event `eventName`.
        /// @param {String} eventName
        ///   The name of an event on the `nodeID` node.
        /// @param {ListenerID} eventListenerID
        ///   A listener ID previously returned by `kernel.addEventListener` that identifies a
        ///   listener attached to this `nodeID` and `eventName`.
        /// 
        /// @returns {Listener}

        getEventListener: [ /* nodeID, eventName, eventListenerID */ ],

        /// flushEventListeners.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} eventName
        /// @param {ID} eventContextID
        /// 
        /// @returns {}

        flushEventListeners: [ /* nodeID, eventName, eventContextID */ ],

        /// It will call firingEvent() on each model and firedEvent() on each view.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} eventName
        /// @param {Value[]} eventParameters
        /// 
        /// @returns {}

        fireEvent: [ /* nodeID, eventName, eventParameters */ ],

        /// Dispatch an event toward a node. Using fireEvent(), capture (down) and bubble (up) along
        /// the path from the global root to the node. Cancel when one of the handlers returns a
        /// truthy value to indicate that it has handled the event.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} eventName
        /// @param {Value[]} eventParameters
        /// @param {Object} eventNodeParameters
        /// 
        /// @returns {}

        dispatchEvent: [ /* nodeID, eventName, eventParameters, eventNodeParameters */ ],

        /// It will call executing() on each model. The script is considered executed after each model
        /// has run and all asynchronous calls made inside them have returned.
        /// It will then call executed() on each view to notify it that a script has been executed.
        /// It will then call the caller-provided callback to notify the caller that the
        /// script has been fully executed and all asynchronous actions have completed.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} scriptText
        /// @param {String} scriptType
        /// @param {module:vwf/api/kernel~valueCallback} [callback]
        /// 
        /// @returns {Value} returnValue

        execute: [ /* nodeID, scriptText, scriptType, callback( returnValue ) */ ],

        /// @function
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {Number}

        random: [ /* nodeID */ ],

        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} seed

        seed: [ /* nodeID, seed */ ],

        /// It will return the current simulation time.
        /// 
        /// @function
        /// 
        /// @returns {Number}

        time: [],

        /// It will return the moniker of the client responsible for the current action. Will be 
        /// falsy for actions originating in the server, such as time ticks.
        /// 
        /// @function
        /// 
        /// @returns {String}

        client: [],

        /// It will return the identifer the server assigned to this client.
        /// 
        /// @function
        /// 
        /// @returns {String}

        moniker: [],

        /// Return the application root node. `kernel.application( initializedOnly )` is equivalent
        /// to `kernel.global( "application", initializedOnly )`.
        /// 
        /// @function
        /// 
        /// @param {Boolean} [initializedOnly]
        ///   If set, only return the application node if the application has completed
        ///   initialization. Drivers that manage application code should set `initializedOnly`
        ///   since applications should never have access to uninitialized parts of the application
        ///   graph.
        /// 
        /// @returns {ID}
        ///   The ID of the application root. `application` may return `undefined` if the entire
        ///   application has been deleted.

        application: [ /* initializedOnly */ ],

        /// Return the node's intrinsic state. This consists of:
        /// 
        ///   source -- the URI of the node's data blob
        ///   type -- the MIME type of the node's data blob
        /// 
        /// The values are returned in an Object with the named properties. If the optional result
        /// parameter is provided, the fields are added there (without disturbing any other fields) and
        /// result is returned. Otherwise, a new object is created, filled, and returned.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        ///   ID of the node to query.
        /// @param {Object} [result]
        ///   An optional Object to receive the result.
        /// 
        /// @returns {Object}

        intrinsics: [ /* nodeID, result */ ],

        /// Return the node's URI. This value will be the component URI for the root node of a component
        /// loaded from a URI, and undefined in all other cases.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {String}

        uri: [ /* nodeID */ ],

        /// Name calls naming() on each model. The first model to return a non-undefined value dictates
        /// the return value.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {String}

        name: [ /* nodeID */ ],

        /// Return a node's prototype.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {ID}
        ///   The ID of the node's prototype, or `undefined` if called on the proto-prototype,
        ///   `node.vwf`.

        prototype: [ /* nodeID */ ],

        /// Return a node's prototype, its prototype, etc. up to and including `node.vwf`.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {Boolean} [includeBehaviors]
        ///   If set, also include the node's and prototypes' behaviors.
        /// 
        /// @returns {ID[]}
        ///   An array of IDs of the node's prototypes.

        prototypes: [ /* nodeID, includeBehaviors */ ],

        /// Return a node's behaviors.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {ID[]}
        ///   An array of IDs of the node's behaviors. An empty array is returned if the node
        ///   doesn't have any behaviors.

        behaviors: [ /* nodeID */ ],

        /// Return the set of global root nodes. Each global node is the root of a tree.
        /// 
        /// @function
        /// 
        /// @param {Boolean} [initializedOnly]
        ///   If set, only return root nodes that have completed initialization. Drivers that manage
        ///   application code should set `initializedOnly` and should also only provide the
        ///   `kernel.globals` result (even with `initializedOnly` set) to the application if the
        ///   application itself has completed initialization. Applications should never have access
        ///   to uninitialized parts of the simulation.
        /// 
        /// @returns {Object}
        ///   An object whose keys are the IDs of the global root nodes. `Object.keys` may be used
        ///   on the result to get an array of IDs. The global trees are not ordered, and the order
        ///   of the IDs is not significant.

        globals: [ /* initializedOnly */ ],

        /// Return a global root node selected by its URI or annotation.
        /// 
        /// @function
        /// 
        /// @param {String} globalReference
        ///   A selector that identifies the root to return. `globalReference` may specify either a
        ///   URI or annotation. The root nodes are searched first by URI, then by annotation if no
        ///   match is found.
        /// @param {Boolean} [initializedOnly]
        ///   If set, only return a root node if it has completed initialization. Drivers that
        ///   manage application code should set `initializedOnly` and should also only provide the
        ///   result of `kernel.global` (even with `initializedOnly` set) to the application if the
        ///   application itself has completed initialization. Applications should never have access
        ///   to uninitialized parts of the simulation.
        /// 
        /// @returns {ID}
        ///   The ID of the root node of the selected tree, or `undefined` if `globalReference`
        ///   doesn't match any root or if `initializedOnly` is set and the selected tree has not
        ///   completed initialization.

        global: [ /* globalReference, initializedOnly */ ],

        /// Return the node at the root of the tree containing a node.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {Boolean} [initializedOnly]
        ///   If set, only return the root node if the node and its ancestors have completed
        ///   initialization. Drivers that manage application code should set `initializedOnly`
        ///   since applications should never have access to uninitialized parts of the application
        ///   graph.
        /// 
        /// @returns {ID}
        ///   The ID of the node at the root of the tree containing the node, or `undefined` if
        ///   `initializedOnly` is set and the node or one of its ancestors has not completed
        ///   initialization.

        root: [ /* nodeID, initializedOnly */ ],

        /// Return a node's parent, grandparent, its parent, etc.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {Boolean} [initializedOnly]
        ///   If set, only include parents of nodes that have completed initialization. If a portion
        ///   of the tree containing the node is still initializing, the node's parent, grandparent,
        ///   etc. will be included if the preceding node is initialized, but the remaining
        ///   ancestors will be omitted. Drivers that manage application code should set
        ///   `initializedOnly` since applications should never have access to uninitialized parts
        ///   of the application graph.
        /// 
        /// @returns {ID[]}
        ///   An array of IDs of the node's ancestors. An empty array is returned for global,
        ///   top-level nodes that don't have a parent.

        ancestors: [ /* nodeID, initializedOnly */ ],

        /// Return a node's parent.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {Boolean} [initializedOnly]
        ///   If set, only return the parent if the node has completed initialization. Drivers that
        ///   manage application code should set `initializedOnly` since applications should never
        ///   have access to uninitialized parts of the application graph.
        /// 
        /// @returns {ID}
        ///   The ID of the node's parent, or `undefined` for the application root node or other
        ///   global, top-level nodes.

        parent: [ /* nodeID, initializedOnly */ ],

        /// Return a node's children.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {Boolean} [initializedOnly]
        ///   If set, only return children that have completed initialization. Uninitialized
        ///   children will appear in the result as `undefined`. Drivers that manage application
        ///   code should set `initializedOnly` since applications should never have access to
        ///   uninitialized parts of the application graph.
        /// 
        /// @returns {ID[]}
        ///   An array of IDs of the node's children. An empty array is returned if the node
        ///   doesn't have any children. The result always contains one element for each child,
        ///   regardless of their initialization state and whether `initializedOnly` is set.
        ///   However, `initializedOnly` will cause uninitialized children to appear as `undefined`.

        children: [ /* nodeID, initializedOnly */ ],

        /// Return a node's child selected by index or name.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} childReference
        ///   A selector indicating the child to return. If `childReference` is a number, the child
        ///   at that index location is returned. Otherwise, a child with the name matching
        ///   `childReference` (if any) is returned.
        /// @param {Boolean} [initializedOnly]
        ///   If set, only return a child if it has completed initialization. Drivers that manage
        ///   application code should set `initializedOnly` since applications should never have
        ///   access to uninitialized parts of the application graph.
        /// 
        /// @returns {ID}
        ///   The ID of the selected child, or `undefined` if `childReference` doesn't match a child
        ///   or if `initializedOnly` is set and the selected child has not completed
        ///   initialization.

        child: [ /* nodeID, childReference, initializedOnly */ ],

        /// Return a node's children, grandchildren, their children, etc.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {Boolean} [initializedOnly]
        ///   If set, only return descendants that have completed initialization. Uninitialized
        ///   descendants will appear in the result as `undefined`. Descendants of uninitialized
        ///   descendants will not appear. Drivers that manage application code should set
        ///   `initializedOnly` since applications should never have access to uninitialized parts
        ///   of the application graph.
        /// 
        /// @returns {ID[]}
        ///   An array of IDs of the node's descendants. An empty array is returned if the node
        ///   doesn't have any descendants. The result may contain `undefined` elements when
        ///   `initializedOnly` is set and some descendants have not completed initialization.

        descendants: [ /* nodeID, initializedOnly */ ],

        /// Locate nodes matching a search pattern. matchPattern supports an XPath subset consisting of
        /// the following:
        /// 
        ///   "/" -- the application root node
        ///   "/*" -- children of the application
        ///   "/name" -- a child of the application having the specified name
        ///   "/name1/name2/name3/..." -- a descendant of the application along the specified path
        ///   "//name" -- descendants of the application having the specified name
        ///   "//*" -- all descendants of the application
        ///   "//element(*,uri)" -- descendants of the application having uri in their prototype chain
        ///   
        ///   ".." -- the reference node's parent
        ///   "." -- the reference node
        ///   "*", "./*" -- children of the reference node
        ///   "name", "./name" -- a child of the reference node having the specified name
        ///   "name1/name2/name3/..." -- a descendant of the reference node along the specified path
        ///   ".//name" -- descendants of the reference node having the specified name
        ///   ".//*" -- all descendants of the reference node
        ///   ".//element(name)" -- same as ".//name"
        ///   ".//element(*)" -- same as ".//*"
        ///   ".//element(name,uri)" -- descendants having the specified name and extending uri
        ///   ".//element(*,uri)" -- descendants extending uri
        ///   
        ///   "name[name2]" -- a child "name" which also has a child having the second name
        ///   "name[name2/name3/...]" -- a child "name" which also has a descendant along the path
        ///   "*[*]" -- children which also have at least one child
        ///   "name[@property]" -- a child "name" which also has a truthy property with the provided name
        ///   "*[@*]" -- children which also have at least one truthy property
        ///  
        /// XPath elements are interpreted as VWF nodes and XPath attributes are interpreted as VWF
        /// properties. The expression must evaluate to an element (node) set since only nodes are
        /// distinctly addressable entities in VWF. Properties may be used in predicates.
        ///  
        /// The following XPath axes are supported:
        ///   ancestor-or-self, ancestor, parent, self, child, descendant, descendant-or-self, and
        ///     attribute (predicates only)
        /// along with the following node tests:
        ///   element(name,type), attribute(name) (in predicates only), and node()
        /// the shortcut notation:
        ///   "//": descendant-or-self:node(), ".": self::node(), "..": "parent::node()",
        ///   "name": "child::name", "@name": "attribute::name"
        /// and the wildcard name:
        ///   "*"
        /// 
        /// This is a naive implementation with several limitations. There is no particular
        /// optimization, and some queries can yield large intermediate or final results. Use caution
        /// when applying the descendant operators. The results will not necessarily maintain document
        /// order. Overlapping queries will cause nodes to be repeated in the results. For example, the
        /// query `*``/..` will return the reference node several times, once for each of its children.
        /// 
        /// Names in XPath expressions may only contain the characters A-Z, a-z, 0-9, -, and .
        /// (period). As an extension, this implementation allows names to contain any character so
        /// long as it is quoted using either double or single quotes. Within a quoted name, use the
        /// charater "\" to escape the quoting character or the escape character. When assembling an
        /// expression, use vwf.utility.xpath.quoteName() to quote names that may have invalid
        /// characters.
        ///
        /// @function
        /// 
        /// @param {ID} nodeID
        ///   The reference node. Relative patterns are resolved with respect to this node. `nodeID`
        ///   is ignored for absolute patterns.
        /// @param {String} matchPattern
        ///   The search pattern.
        /// @param {Boolean} [initializedOnly]
        ///   Interpret nodes that haven't completed initialization as though they don't have
        ///   ancestors. Drivers that manage application code should set `initializedOnly` since
        ///   applications should never have access to uninitialized parts of the application graph.
        /// @param {module:vwf/api/kernel~nodeCallback} [callback]
        ///   A callback to receive the search results. If callback is provided, find invokes
        ///   callback( matchID ) for each match. Otherwise the result is returned as an array.
        /// 
        /// @returns {ID[]|undefined}
        ///   If callback is provided, undefined; otherwise an array of the node ids of the result.

        find: [ /* nodeID, matchPattern, initializedOnly, callback( matchID ) */ ],

        /// Test a node against a search pattern. See vwf.api.kernel#find for details of the query
        /// syntax.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        ///   The reference node. Relative patterns are resolved with respect to this node. `nodeID`
        ///   is ignored for absolute patterns.
        /// @param {String} matchPattern
        ///   The search pattern.
        /// @param {ID} testID
        ///   A node to test against the pattern.
        /// @param {Boolean} [initializedOnly]
        ///   Interpret nodes that haven't completed initialization as though they don't have
        ///   ancestors. Drivers that manage application code should set `initializedOnly` since
        ///   applications should never have access to uninitialized parts of the application graph.
        /// 
        /// @returns {Boolean}
        ///   true when testID matches the pattern.

        test: [ /* nodeID, matchPattern, testID, initializedOnly */ ],

        /// Return client object matching the given search pattern.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        ///   The reference node. Relative patterns are resolved with respect to this node. `nodeID`
        ///   is ignored for absolute patterns.
        /// @param {String} matchPattern
        ///   The search pattern.
        /// @param {module:vwf/api/kernel~nodeCallback} [callback]
        ///   A callback to receive the search results. If callback is provided, find invokes
        ///   callback( matchID ) for each match. Otherwise the result is returned as an array.
        /// 
        /// @returns {ID[]|undefined}
        ///   If callback is provided, undefined; otherwise an array of the node ids of the result.
        /// 
        /// @deprecated in version 0.6.21. Instead of `kernel.findClients( reference, "/pattern" )`,
        ///   use `kernel.find( reference, "doc('http://vwf.example.com/clients.vwf')/pattern" )`.

        findClients: [ /* nodeID, matchPattern, callback( matchID ) */ ],

        /// Description.
        /// 
        /// @callback module:vwf/api/kernel~nodeCallback
        /// 
        /// @param {ID} nodeID

        /// Description.
        /// 
        /// @callback module:vwf/api/kernel~valueCallback
        /// 
        /// @param {Value} returnValue

        /// A `Handler` describes a function that may be attached to a property as a setter or
        /// getter, to a method, or to an event as a listener.
        /// 
        /// A `Handler` is an object containing the following properties. Alternately, a `Handler`
        /// may be provided as a `string` or `function` representing just the `body` field.
        /// 
        /// @typedef {Object} Handler
        /// 
        /// @property {string[]} [parameters]
        ///   An ordered list of names of the function's positional parameters. The function body
        ///   uses these names to refer to the caller's arguments. `parameters` may be omitted if
        ///   the function doesn't declare any parameters, or if `body` is a JavaScript `function`,
        ///   in which case the parameters are taken from the JavaScript function itself.
        /// @property {string|function} body
        ///   A representation of the statements making up the function body. For handlers of `type`
        ///   `application/javascript`, `body` should be a string containing JavaScript text that is
        ///   correct for the span between the opening and closing braces of a JavaScript function
        ///   definition: `function(...) {` |<= this is the body text =>| `}`. `body` may also be
        ///   provided as a JavaScript `function` value, in which case the handler's `body` and
        ///   `arguments` will be taken from the function.
        /// @property {string} [type]
        ///   The {@link https://www.iana.org/assignments/media-types Media Type} of the `body`
        ///   text. When `body` is a `string`, the default type is `"application/javascript"`, and
        ///   `type` may be omitted. `type` should be omitted if `body` is a JavaScript `function`
        ///   value since the type is implicit in that case.

        /// A `ListenerID` is a JavaScript primitive value that identifies an event listener. Each
        /// listener is assigned a `ListenerID` when it is created that is unique within the node
        /// and event.
        /// 
        /// @typedef {string|number|boolean|null} ListenerID

        /// A `Listener` is an extended `Handler` with additional fields for event listeners.
        /// 
        /// @typedef {Object} Listener
        /// 
        /// @property {ListenerID} [id]
        ///   A unique ID as returned by `kernel.addEventListener` that identifies the listener for
        ///   a particular `nodeID` and `eventName`.
        /// @property {string[]} [parameters]
        ///   @see {@link module:vwf/api/kernel.Handler}
        /// @property {string|function} body
        ///   @see {@link module:vwf/api/kernel.Handler}
        /// @property {string} [type]
        ///   @see {@link module:vwf/api/kernel.Handler}
        /// @property {ID} [contextID]
        ///   The ID of a node that the handler will be _invoked on_. For JavaScript handlers,
        ///   `this` will refer to the `contextID` node. If `contextID` is not provided, the context
        ///   will be the global root pseudo-node.
        /// @property {String[]} [phases]
        ///   An array of strings indicating the event dispatch phases that this handler should
        ///   respond to. Listeners will be invoked at the target and during the bubbling phase
        ///   regardless of its `phases`. To also invoke a handler during the capture phase, include
        ///   `"capture"` in the `phases` array.` `phases` only applies to the propagation performed
        ///   by `kernel.dispatchEvent`. Once `kernel.fireEvent` is called, it always invokes all of
        ///   the event's handlers.
    };

    return exports;

} );
