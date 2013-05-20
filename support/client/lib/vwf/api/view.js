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

/// View API.
/// 
/// @module vwf/api/view

define( function() {

    var exports = {

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {ID} childID
        /// @param {String} childExtendsID
        /// @param {String[]} childImplementsIDs
        /// @param {String} childSource
        /// @param {String} childType
        /// @param {String} childIndex
        ///   When `nodeID` is falsy, the URI of the component, or `undefined` if the component
        ///   wasn't loaded from a URI. When `nodeID` is truthy, the numerical index of the child's
        ///   position in the parent's array, starting at `0`. When child order is significant to
        ///   the driver, the child should be placed at the given position in the parent's array.
        ///   Nodes won't necessarily arrive in numerical order since varying dependencies cause
        ///   nodes to become ready at indeterminate times.
        /// @param {String} childName
        /// @param {module:vwf/api/view~readyCallback} callback
        /// 
        /// @returns {}

        createdNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType,
            childIndex, childName, callback( ready ) */ ],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {ID} childID
        /// @param {String} childExtendsID
        /// @param {String[]} childImplementsIDs
        /// @param {String} childSource
        /// @param {String} childType
        /// @param {String} childIndex
        ///   When `nodeID` is falsy, the URI of the component, or `undefined` if the component
        ///   wasn't loaded from a URI. When `nodeID` is truthy, the numerical index of the child's
        ///   position in the parent's array, starting at `0`. When child order is significant to
        ///   the driver, the child should be placed at the given position in the parent's array.
        ///   Nodes won't necessarily arrive in numerical order since varying dependencies cause
        ///   nodes to become ready at indeterminate times.
        /// @param {String} childName
        /// 
        /// @returns {}

        initializedNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType,
            childIndex, childName */ ],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {}

        deletedNode: [ /* nodeID */ ],

        /// Description.
        /// 
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
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {ID} childID
        /// 
        /// @returns {}

        removedChild: [ /* nodeID, childID */ ],

        /// Description.
        /// 
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
        /// @function
        /// 
        /// @param {ID} nodeID
        /// @param {String} methodName
        /// @param {String[]} methodParameters
        /// @param {Value} methodValue
        /// 
        /// @returns {}

        calledMethod: [ /* nodeID, methodName, methodParameters, methodValue */ ],

        /// Description.
        /// 
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
        /// @function
        /// 
        /// @param {Number} time
        /// 
        /// @returns {}

        ticked: [ /* time */ ],

        /// Description.
        /// 
        /// @callback module:vwf/api/view~readyCallback
        /// 
        /// @param {Boolean} ready

    };

    return exports;

} );
