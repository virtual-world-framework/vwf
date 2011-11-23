define( {

    creatingNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName, callback /- ( ready ) -/ */ ],
    deletingNode: [ /* nodeID */ ],

    prototyping: [],

    addingChild: [],
    removingChild: [],
    parenting: [],
    childrening: [],
    naming: [],

    settingProperties: [],
    gettingProperties: [],
    creatingProperty: [],
    /* TODO: deletingProperty, */
    settingProperty: [],
    gettingProperty: [],

    creatingMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],
    /* TODO: deletingMethod, */
    callingMethod: [ /* nodeID, methodName, methodParameters */ ],

    creatingEvent: [ /* nodeID, eventName, eventParameters */ ],
    /* TODO: deletingEvent, */
    firingEvent: [ /* nodeID, eventName, eventParameters */ ],

    executing: [],

    ticking: [],

} );
