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

/// @name vwf.api.view
/// @namespace

define( {

    /// Description.
    /// 
    /// @name vwf.api.view#createdNode
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

    createdNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childURI, childName, callback( ready ) */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#initializedNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {ID} childID
    /// 
    /// @returns {}

    initializedNode: [ /* nodeID, childID */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#deletedNode
    /// @function
    /// 
    /// @param {ID} nodeID
    /// 
    /// @returns {}

    deletedNode: [ /* nodeID */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#addedChild
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {ID} childID
    /// @param {String} childName
    /// 
    /// @returns {}

    addedChild: [ /* nodeID, childID, childName */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#removedChild
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {ID} childID
    /// 
    /// @returns {}

    removedChild: [ /* nodeID, childID */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#createdProperty
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} propertyName
    /// @param {Value} propertyValue
    /// 
    /// @returns {}

    createdProperty: [ /* nodeID, propertyName, propertyValue */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#initializedProperty
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} propertyName
    /// @param {Value} propertyValue
    /// 
    /// @returns {}

    initializedProperty: [ /* nodeID, propertyName, propertyValue */ ],

    // TODO: deletedProperty

    /// Description.
    /// 
    /// @name vwf.api.view#satProperty
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} propertyName
    /// @param {Value} propertyValue
    /// 
    /// @returns {}

    satProperty: [ /* nodeID, propertyName, propertyValue */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#gotProperty
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} propertyName
    /// @param {Value} propertyValue
    /// 
    /// @returns {}

    gotProperty: [ /* nodeID, propertyName, propertyValue */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#createdMethod
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} methodName
    /// @param {String[]} methodParameters
    /// @param {String} methodBody
    /// 
    /// @returns {}

    createdMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],

    // TODO: deletedMethod

    /// Description.
    /// 
    /// @name vwf.api.view#calledMethod
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} methodName
    /// @param {String[]} methodParameters
    /// 
    /// @returns {}

    calledMethod: [ /* nodeID, methodName, methodParameters */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#createdEvent
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} eventName
    /// @param {String[]} eventParameters
    /// 
    /// @returns {}

    createdEvent: [ /* nodeID, eventName, eventParameters */ ],

    // TODO: deletedEvent

    /// Description.
    /// 
    /// @name vwf.api.view#firedEvent
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} eventName
    /// @param {String[]} eventParameters
    /// 
    /// @returns {}

    firedEvent: [ /* nodeID, eventName, eventParameters */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#executed
    /// @function
    /// 
    /// @param {ID} nodeID
    /// @param {String} scriptText
    /// @param {String} scriptType
    /// 
    /// @returns {}

    executed: [ /* nodeID, scriptText, scriptType */ ],

    /// Description.
    /// 
    /// @name vwf.api.view#ticked
    /// @function
    /// 
    /// @param {Number} time
    /// 
    /// @returns {}

    ticked: [ /* time */ ],

} );
