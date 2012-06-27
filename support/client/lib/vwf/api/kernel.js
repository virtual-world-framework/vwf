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

/// @name vwf.api.kernel
/// @namespace

define( {

    /// Create a node from a component specification. Construction may require loading data from
    /// multiple remote documents. This function returns before construction is complete. A
    /// callback is invoked once the node has fully loaded. 
    /// A simple node consists of a set of properties, methods and events, but a node may
    /// specialize a prototype component and may also contain multiple child nodes, any of which
    /// may specialize a prototype component and contain child nodes, etc. So components cover a
    /// vast range of complexity. The application definition for the overall simulation is a
    /// single component instance.
    /// A node is a component instance--a single, anonymous specialization of its component.
    /// Nodes specialize components in the same way that any component may specialize a prototype
    /// component. The prototype component is made available as a base, then new or modified
    /// properties, methods, events, child nodes and scripts are attached to modify the base
    /// implemenation.
    /// To create a node, we first make the prototoype available by loading it (if it has not
    /// already been loaded). This is a recursive call to createNode() with the prototype
    /// specification. Then we add new, and modify existing, properties, methods, and events
    /// according to the component specification. Then we load an add any children, again
    /// recursively calling createNode() for each. Finally, we attach any new scripts and invoke
    /// an initialization function.
    /// 
    /// @name vwf.api.kernel#createNode
    /// @function
    /// 
    /// @param {String|Object} nodeComponent
    /// @param {Function} [callback]
    /// 
    /// @returns {}

    createNode: [ /* nodeComponent, callback /- ( nodeID ) -/ */ ],

    /// Delete node will delete a node specified by the id given on each model and view.
    /// 
    /// @name vwf.api.kernel#deleteNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {}

    deleteNode: [ /* nodeID */ ],

    /// Set node will set the properties of the node specified by the given id and component.
    /// 
    /// @name vwf.api.kernel#setNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String|Object} component
    /// 
    /// @returns {}

    setNode: [ /* nodeID, component */ ],

    /// Get node will retrieve the component of the node specified by the given id.
    /// 
    /// @name vwf.api.kernel#getNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {Object}

    getNode: [ /* nodeID */ ],

    /// Prototype calls prototyping() on each model. The first model to return a non-undefined value
    /// dictates the return value.
    /// 
    /// @name vwf.api.kernel#prototype
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {ID}

    prototype: [ /* nodeID */ ],

    /// Prototypes returns a list of all the prototype ids for a given node id.
    /// 
    /// @name vwf.api.kernel#prototypes
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {ID[]}

    prototypes: [ /* nodeID */ ],

    /// @name vwf.api.kernel#createChild
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} childName
    /// @param {String|Object} childComponent
    /// @param {Function} [callback]
    /// 
    /// @returns {}

    createChild: [ /* nodeID, childName, childComponent, callback /- ( childID ) -/ */ ],

    /// addChild calls addingChild() on each model. The child is considered added after each model has
    /// run.  Additionally, it calls addedChild() on each view. The view is being notified that a 
    /// child has been added.
    /// 
    /// @name vwf.api.kernel#addChild
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
    /// @name vwf.api.kernel#removeChild
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {ID} childID
    /// 
    /// @returns {}

    removeChild: [ /* nodeID, childID */ ],

    /// Returns an array of node ids for all of the parents for the given child node id.
    /// 
    /// @name vwf.api.kernel#ancestors
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {ID[]}

    ancestors: [ /* nodeID */ ],

    /// Parent calls parenting() on each model. The first model to return a non-undefined value
    /// dictates the return value.
    /// 
    /// @name vwf.api.kernel#parent
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {ID}

    parent: [ /* nodeID */ ],

    /// Children Calls childrening() on each model. The return value is the union of the non-undefined
    /// results.
    /// 
    /// @name vwf.api.kernel#children
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {ID[]}

    children: [ /* nodeID */ ],

    /// Name calls naming() on each model. The first model to return a non-undefined value dictates
    /// the return value.
    /// 
    /// @name vwf.api.kernel#name
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {String}

    name: [ /* nodeID */ ],

    /// setProperties sets all of the properties for a node.  It will call settingProperties() 
    /// on each model and satProperties() on each view.
    /// 
    /// @name vwf.api.kernel#setProperties
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
    /// @name vwf.api.kernel#getProperties
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
    /// @name vwf.api.kernel#createProperty
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

    /* TODO: deleteProperty, */

    /// setProperty setsa specific property value on a node.  It will call settingProperty() 
    /// on each model. The first model to return a non-undefined value has performed the
    /// set and dictates the return value. The property is considered set after each model has run.
    /// It will also call satProperty() on each view. The view is being notified that a property has
    /// been set.
    /// 
    /// @name vwf.api.kernel#setProperty
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
    /// @name vwf.api.kernel#getProperty
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
    /// @name vwf.api.kernel#createMethod
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} methodName
    /// @param {String[]} methodParameters
    /// @param {String} methodBody
    /// 
    /// @returns {}

    createMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],

    /* TODO: deleteMethod, */

    /// It will call callingMethod() on each model. The first model to return a non-undefined value
    /// dictates the return value.  It will also call calledMethod() on each view.
    /// 
    /// @name vwf.api.kernel#callMethod
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
    /// @name vwf.api.kernel#createEvent
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} eventName
    /// @param {String[]} eventParameters
    /// 
    /// @returns {}

    createEvent: [ /* nodeID, eventName, eventParameters */ ],

    /* TODO: deleteEvent, */

    /// It will call firingEvent() on each model and firedEvent() on each view.
    /// 
    /// @name vwf.api.kernel#fireEvent
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
    /// @name vwf.api.kernel#dispatchEvent
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
    /// @name vwf.api.kernel#execute
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} scriptText
    /// @param {String} scriptType
    /// 
    /// @returns {Value} returnValue

    execute: [ /* nodeID, scriptText, scriptType */ ],

    /// It will return the current simulation time.
    /// 
    /// @name vwf.api.kernel#time
    /// @function
    /// 
    /// @returns {Number}

    time: [],

    /// It will return the moniker of the client responsible for the current action. Will be 
    /// falsy for actions originating in the server, such as time ticks.
    /// 
    /// @name vwf.api.kernel#client
    /// @function
    /// 
    /// @returns {String}

    client: [],

    /// It will return the identifer the server assigned to this client.
    /// 
    /// @name vwf.api.kernel#moniker
    /// @function
    /// 
    /// @returns {String}

    moniker: [],

} );
