"use strict";
/// @name vwf.api.kernel
/// @namespace

define( {

    /// Description.
    /// 
    /// @name vwf.api.kernel#createNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String|Object} childComponent
    /// @param {String} childName
    /// @param {Function} [callback]
    /// 
    /// @returns {}

    createNode: [ /* nodeID, childComponent, childName, callback /- ( childID ) -/ */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#deleteNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {}

    deleteNode: [ /* nodeID */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#setNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String|Object} component
    /// 
    /// @returns {}

    setNode: [ /* nodeID, component */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#getNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {Object}

    getNode: [ /* nodeID */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#prototype
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {ID}

    prototype: [ /* nodeID */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#prototypes
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {ID[]}

    prototypes: [ /* nodeID */ ],

    /// Description.
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

    /// Description.
    /// 
    /// @name vwf.api.kernel#removeChild
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {ID} childID
    /// 
    /// @returns {}

    removeChild: [ /* nodeID, childID */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#ancestors
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {ID[]}

    ancestors: [ /* nodeID */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#parent
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {ID}

    parent: [ /* nodeID */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#children
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {ID[]}

    children: [ /* nodeID */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#name
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {String}

    name: [ /* nodeID */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#setProperties
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {Object} properties
    /// 
    /// @returns {Object}

    setProperties: [ /* nodeID, properties */ ],

    /// Description.
    /// 
    /// @name vwf.api.kernel#getProperties
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {Object}

    getProperties: [ /* nodeID */ ],

    /// Description.
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

    /// Description.
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

    /// Description.
    /// 
    /// @name vwf.api.kernel#getProperty
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} propertyName
    /// 
    /// @returns {Value} propertyValue

    getProperty: [ /* nodeID, propertyName */ ],

    /// Description.
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

    /// Description.
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

    /// Description.
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

    /// Description.
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

    /// Description.
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

    /// Description.
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

    /// Description.
    /// 
    /// @name vwf.api.kernel#time
    /// @function
    /// 
    /// @returns {Number}

    time: [],

    /// Description.
    /// 
    /// @name vwf.api.kernel#client
    /// @function
    /// 
    /// @returns {String}

    client: [],

    /// Description.
    /// 
    /// @name vwf.api.kernel#moniker
    /// @function
    /// 
    /// @returns {String}

    moniker: [],

} );
