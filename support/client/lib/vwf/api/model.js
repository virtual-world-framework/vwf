/// @name vwf.api.view
/// @namespace

define( {

    /// Description.
    /// 
    /// @name vwf.api.view#creatingNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {ID} childID
    /// @param {String} childExtendsID 
    /// @param {String[]} childImplementsIDs
    /// @param {String} childSource
    /// @param {String} childType 
    /// @param {String} childName
    /// @param {Function} [callback]
    /// 
    /// @returns {} 

    creatingNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName, callback /- ( ready ) -/ */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#deletingNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {}

    deletingNode: [ /* nodeID */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#prototyping
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    prototyping: [],

    /// Description.
    /// 
    /// @name vwf.api.view#addingChild
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    addingChild: [],

    /// Description.
    /// 
    /// @name vwf.api.view#removingChild
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    removingChild: [],

    /// Description.
    /// 
    /// @name vwf.api.view#parenting
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    parenting: [],

    /// Description.
    /// 
    /// @name vwf.api.view#childrening
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    childrening: [],

    /// Description.
    /// 
    /// @name vwf.api.view#naming
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}
    naming: [],

    /// Description.
    /// 
    /// @name vwf.api.view#settingProperties
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    settingProperties: [],

    /// Description.
    /// 
    /// @name vwf.api.view#gettingProperties
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    gettingProperties: [],

    /// Description.
    /// 
    /// @name vwf.api.view#creatingProperties
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    creatingProperty: [],
    
    /// Description.
    /// 
    /// @name vwf.api.view#initializingProperty
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    initializingProperty: [],

    /* TODO: deletingProperty, */
    
    /// Description.
    /// 
    /// @name vwf.api.view#settingProperty
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    settingProperty: [],

    /// Description.
    /// 
    /// @name vwf.api.view#gettingProperty
    /// @function
    /// 
    /// @param {} 
    /// 
    /// @returns {}

    gettingProperty: [],

    /// Description.
    /// 
    /// @name vwf.api.view#creatingMethod
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} methodName
    /// @param {String[]} methodParameters
    /// @param {String} methodBody
    /// 
    /// @returns {}

    creatingMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],

    /* TODO: deletingMethod, */

    /// Description.
    /// 
    /// @name vwf.api.view#callingMethod
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} methodName
    /// @param {String[]} methodParameters
    /// 
    /// @returns {}

    callingMethod: [ /* nodeID, methodName, methodParameters */ ],


    /// Description.
    /// 
    /// @name vwf.api.view#creatingEvent
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} eventName
    /// @param {String[]} eventParameters
    /// 
    /// @returns {}

    creatingEvent: [ /* nodeID, eventName, eventParameters */ ],

    /* TODO: deletingEvent, */


    /// Description.
    /// 
    /// @name vwf.api.view#firingEvent
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} eventName
    /// @param {String[]} eventParameters
    /// 
    /// @returns {}

    firingEvent: [ /* nodeID, eventName, eventParameters */ ],


    /// Description.
    /// 
    /// @name vwf.api.view#executing
    /// @function
    /// 
    /// @param {}
    /// @returns {}

    executing: [],


    /// Description.
    /// 
    /// @name vwf.api.view#ticking
    /// @function
    /// 
    /// @param {}
    /// @returns {}

    ticking: [],

} );
