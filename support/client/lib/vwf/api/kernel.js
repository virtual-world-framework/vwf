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
        /// @returns {}

        createMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],

        // TODO: deleteMethod

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

        /// It will call creatingEvent() on each model. The event is considered created after each model
        /// has run.  It will also call createdEvent() on each view. The view is being notified that a
        /// event has been created.
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
        /// has run.  It will also call executed() on each view. The view is being notified that a 
        /// script has been executed.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} scriptText
        /// @param {String} scriptType
        /// 
        /// @returns {Value} returnValue

        execute: [ /* nodeID, scriptText, scriptType */ ],

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

        /// Return the application root node.
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
        /// 
        /// @returns {ID[]}
        ///   An array of IDs of the node's children. An empty array is returned if the node
        ///   doesn't have any children.

        children: [ /* nodeID */ ],

        /// Return a node's children, grandchildren, their children, etc.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {ID[]}
        ///   An array of IDs of the node's descendants. An empty array is returned if the node
        ///   doesn't have any children.

        descendants: [ /* nodeID */ ],

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
        /// @param {Function} [callback]
        ///   A callback to receive the search results. If callback is provided, find invokes
        ///   callback( matchID ) for each match. Otherwise the result is returned as an array.

        findClients: [ /* nodeID, matchPattern, callback( matchID ) */ ],

        /// Description.
        /// 
        /// @callback module:vwf/api/kernel~nodeCallback
        /// 
        /// @param {ID} nodeID

    };

    return exports;

} );
