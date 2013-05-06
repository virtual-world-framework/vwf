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

/// Model API.
/// 
/// @module vwf/api/model

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
        /// @param {module:vwf/api/model~readyCallback} callback
        /// 
        /// @returns {}

        creatingNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType,
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

        initializingNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType,
            childIndex, childName */ ],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {}

        deletingNode: [ /* nodeID */ ],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {}
        /// 
        /// @returns {}

        addingChild: [],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {}
        /// 
        /// @returns {}

        removingChild: [],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {}
        /// 
        /// @returns {}

        settingProperties: [],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {}
        /// 
        /// @returns {}

        gettingProperties: [],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {}
        /// 
        /// @returns {}

        creatingProperty: [],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {}
        /// 
        /// @returns {}

        initializingProperty: [],

        // TODO: deletingProperty
      
        /// Description.
        /// 
        /// @function
        /// 
        /// @param {}
        /// 
        /// @returns {}

        settingProperty: [],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {}
        /// 
        /// @returns {}

        gettingProperty: [],

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

        creatingMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],

        // TODO: deletingMethod

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

        callingMethod: [ /* nodeID, methodName, methodParameters, methodValue */ ],

        /// Description.
        /// 
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
        /// @function
        /// 
        /// @param {}
        /// @returns {}

        executing: [],

        /// Description.
        /// 
        /// @function
        /// 
        /// @param {}
        /// @returns {}

        ticking: [],

        /// Description.
        /// 
        /// @callback module:vwf/api/model~readyCallback
        /// 
        /// @param {Boolean} ready

    };

    return exports;

} );
