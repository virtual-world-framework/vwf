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
        /// @param {ID} nodeID
        /// @param {ID} childID
        /// 
        /// @returns {}

        initializingNode: [ /* nodeID, childID */ ],

        /// Description.
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {}

        deletingNode: [ /* nodeID */ ],

        /// Description.
        /// 
        /// @param {}
        /// 
        /// @returns {}

        addingChild: [],

        /// Description.
        /// 
        /// @param {}
        /// 
        /// @returns {}

        removingChild: [],

        /// Description.
        /// 
        /// @param {}
        /// 
        /// @returns {}

        settingProperties: [],

        /// Description.
        /// 
        /// @param {}
        /// 
        /// @returns {}

        gettingProperties: [],

        /// Description.
        /// 
        /// @param {}
        /// 
        /// @returns {}

        creatingProperty: [],

        /// Description.
        /// 
        /// @param {}
        /// 
        /// @returns {}

        initializingProperty: [],

        // TODO: deletingProperty
      
        /// Description.
        /// 
        /// @param {}
        /// 
        /// @returns {}

        settingProperty: [],

        /// Description.
        /// 
        /// @param {}
        /// 
        /// @returns {}

        gettingProperty: [],

        /// Description.
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
        /// @param {ID} nodeID
        /// @param {String} methodName
        /// @param {String[]} methodParameters
        /// @param {Value} methodValue
        /// 
        /// @returns {}

        callingMethod: [ /* nodeID, methodName, methodParameters, methodValue */ ],

        /// Description.
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
        /// @param {ID} nodeID
        /// @param {String} eventName
        /// @param {String[]} eventParameters
        /// 
        /// @returns {}

        firingEvent: [ /* nodeID, eventName, eventParameters */ ],

        /// Description.
        /// 
        /// @param {}
        /// @returns {}

        executing: [],

        /// Description.
        /// 
        /// @param {}
        /// @returns {}

        ticking: [],

    };

    return exports;

} );
