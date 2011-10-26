define( {

    createNode: [ /* component_uri_or_json_or_object, callback, childName /- TODO: hack -/ */ ],
    /* TODO: deleteNode, */
    setNode: [],
    getNode: [],

    prototype: [],
    prototypes: [],

    addChild: [ /* nodeID, childID, childName */ ],
    removeChild: [ /* nodeID, childID */ ],
    parent: [ /* nodeID */ ],
    children: [ /* nodeID */ ],
    name: [ /* nodeID */ ],

    setProperties: [],
    getProperties: [],
    createProperty: [ /* nodeID, propertyName, propertyValue, propertyGet, propertySet */ ],
    /* TODO: deleteProperty, */
    setProperty: [ /* nodeID, propertyName, propertyValue */ ],
    getProperty: [ /* nodeID, propertyName */ ],

    createMethod: [ /* nodeID, methodName */ ],
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
