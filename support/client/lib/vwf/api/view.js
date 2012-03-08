define( {

    createdNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName, callback /- ( ready ) -/ */ ],
    deletedNode: [ /* nodeID */ ],

    addedChild: [ /* nodeID, childID, childName */ ],
    removedChild: [ /* nodeID, childID */ ],

    createdProperty: [ /* nodeID, propertyName, propertyValue */ ],
    initializedProperty: [ /* nodeID, propertyName, propertyValue */ ],
    /* TODO: deletedProperty, */
    satProperty: [ /* nodeID, propertyName, propertyValue */ ],
    gotProperty: [ /* nodeID, propertyName, propertyValue */ ],

    createdMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],
    /* TODO: deletedMethod, */
    calledMethod: [ /* nodeID, methodName, methodParameters */ ],

    createdEvent: [ /* nodeID, eventName, eventParameters */ ],
    /* TODO: deletedEvent, */
    firedEvent: [ /* nodeID, eventName, eventParameters */ ],

    executed: [ /* nodeID, scriptText, scriptType */ ],

    ticked: [ /* time */ ],

} );
