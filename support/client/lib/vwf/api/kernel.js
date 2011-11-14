define( {

    createNode: [ /* nodeID, childComponent, childName, callback /- ( childID ) -/ */ ],
    /* TODO: deleteNode, */
    setNode: [ /* nodeID, component */ ],
    getNode: [ /* nodeID */ ],

    prototype: [ /* nodeID */ ],
    prototypes: [ /* nodeID */ ],

    addChild: [ /* nodeID, childID, childName */ ],
    removeChild: [ /* nodeID, childID */ ],
    parent: [ /* nodeID */ ],
    children: [ /* nodeID */ ],
    name: [ /* nodeID */ ],

    setProperties: [ /* nodeID, properties */ ],
    getProperties: [ /* nodeID */ ],
    createProperty: [ /* nodeID, propertyName, propertyValue, propertyGet, propertySet */ ],
    /* TODO: deleteProperty, */
    setProperty: [ /* nodeID, propertyName, propertyValue */ ],
    getProperty: [ /* nodeID, propertyName */ ],

    createMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],
    /* TODO: deleteMethod, */
    callMethod: [ /* nodeID, methodName /- [, parameter1, parameter2, ... ] -/ */ ],

    /* TODO: createEvent, */
    /* TODO: deleteEvent, */
    /* TODO: addEventListener, */
    /* TODO: removeEventListener, */
    /* TODO: fireEvent, */

    execute: [ /* nodeID, scriptText, scriptType */ ],

    time: [],

} );
