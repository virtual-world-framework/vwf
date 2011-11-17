define( {

    createNode: [ /* nodeID, childComponent, childName, callback /- ( childID, childPrototypeID ) -/ */ ],
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
    callMethod: [ /* nodeID, methodName, methodParameters */ ],

    createEvent: [ /* nodeID, eventName, eventParameters */ ],
    /* TODO: deleteEvent, */
    fireEvent: [ /* nodeID, eventName, eventParameters */ ],

    execute: [ /* nodeID, scriptText, scriptType */ ],

    time: [],

} );
