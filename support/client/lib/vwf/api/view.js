define( {

    createdNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName, callback /- ( ready ) -/ */ ],
    /* TODO: deletedNode, */

    addedChild: [ /* nodeID, childID, childName */ ],
    removedChild: [ /* nodeID, childID */ ],

    createdProperty: [ /* nodeID, propertyName, propertyValue */ ],
    /* TODO: deletedProperty, */
    satProperty: [ /* nodeID, propertyName, propertyValue */ ],
    gotProperty: [ /* nodeID, propertyName, propertyValue */ ],

    createdMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],
    /* TODO: deletedMethod, */
    calledMethod: [ /* nodeID, methodName, methodParameters */ ],

    /* TODO: createdEvent, */
    /* TODO: deletedEvent, */
    /* TODO: firedEvent, */

    executed: [ /* nodeID, scriptText, scriptType */ ],

    ticked: [ /* time */ ],

} );
