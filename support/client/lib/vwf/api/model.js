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

/// @name vwf.api.model
/// @namespace

define( {

    /// Description.
    /// 
    /// @name vwf.api.model#creatingNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {ID} childID
    /// @param {String} childExtendsID
    /// @param {String[]} childImplementsIDs
    /// @param {String} childSource
    /// @param {String} childType
    /// @param {String} childURI
    /// @param {String} childName
    /// @param {Function} [callback]
    /// 
    /// @returns {}

    creatingNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childURI, childName, callback( ready ) */ ],

    /// Description.
    /// 
    /// @name vwf.api.model#initializingNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {ID} childID
    /// 
    /// @returns {}

    initializingNode: [ /* nodeID, childID */ ],

    /// Description.
    /// 
    /// @name vwf.api.model#deletingNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {}

    deletingNode: [ /* nodeID */ ],

    /// Description.
    /// 
    /// @name vwf.api.model#addingChild
    /// @function
    /// 
    /// @param {}
    /// 
    /// @returns {}

    addingChild: [],

    /// Description.
    /// 
    /// @name vwf.api.model#removingChild
    /// @function
    /// 
    /// @param {}
    /// 
    /// @returns {}

    removingChild: [],

    /// Description.
    /// 
    /// @name vwf.api.model#settingProperties
    /// @function
    /// 
    /// @param {}
    /// 
    /// @returns {}

    settingProperties: [],

    /// Description.
    /// 
    /// @name vwf.api.model#gettingProperties
    /// @function
    /// 
    /// @param {}
    /// 
    /// @returns {}

    gettingProperties: [],

    /// Description.
    /// 
    /// @name vwf.api.model#creatingProperty
    /// @function
    /// 
    /// @param {}
    /// 
    /// @returns {}

    creatingProperty: [],

    /// Description.
    /// 
    /// @name vwf.api.model#initializingProperty
    /// @function
    /// 
    /// @param {}
    /// 
    /// @returns {}

    initializingProperty: [],

    // TODO: deletingProperty
  
    /// Description.
    /// 
    /// @name vwf.api.model#settingProperty
    /// @function
    /// 
    /// @param {}
    /// 
    /// @returns {}

    settingProperty: [],

    /// Description.
    /// 
    /// @name vwf.api.model#gettingProperty
    /// @function
    /// 
    /// @param {}
    /// 
    /// @returns {}

    gettingProperty: [],

    /// Description.
    /// 
    /// @name vwf.api.model#creatingMethod
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} methodName
    /// @param {String[]} methodParameters
    /// @param {String} methodBody
    /// 
    /// @returns {}

    creatingMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],

    // TODO: deletingMethod

    /// Description.
    /// 
    /// @name vwf.api.model#callingMethod
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
    /// @name vwf.api.model#creatingEvent
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} eventName
    /// @param {String[]} eventParameters
    /// 
    /// @returns {}

    creatingEvent: [ /* nodeID, eventName, eventParameters */ ],

    // TODO: deletingEvent

    /// Description.
    /// 
    /// @name vwf.api.model#firingEvent
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
    /// @name vwf.api.model#executing
    /// @function
    /// 
    /// @param {}
    /// @returns {}

    executing: [],

    /// Description.
    /// 
    /// @name vwf.api.model#ticking
    /// @function
    /// 
    /// @param {}
    /// @returns {}

    ticking: [],

} );
