"use strict";

// Copyright 2014 United States Government, as represented by the Secretary of Defense, Under
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

/// Kernel utility functions and objects.
/// 
/// @module vwf/kernel/utility

define( [ "module" ], function( module ) {

    var exports = {

        /// ID of the pseudo node that appears as the parent of the simulation's global nodes.
        /// 
        /// @field

        globalRootID: 0,

        /// The URI of the VWF proto-prototype node `node.vwf`. `nodeTypeDescriptor` contains the
        /// descriptor associated with this URI.
        /// 
        /// @field

        nodeTypeURI: "http://vwf.example.com/node.vwf",

        /// The component descriptor of the VWF proto-prototype node `node.vwf`.
        /// 
        /// @field

        nodeTypeDescriptor: { extends: null },  // TODO: detect nodeTypeDescriptor in createChild() a different way and remove this explicit null prototype

        /// Wrap `nodeID` in an object in such a way that it can stand in for a node reference
        /// without being confused with any other application value. The returned object will
        /// contain `nodeID` in the `id` field. `valueIsNodeReference` may be used to determine if
        /// an arbitrary value is such a node reference.
        /// 
        /// @param {ID} nodeID
        /// 
        /// @returns {Object}

        nodeReference: function( nodeID ) {
            return Object.create( nodeReferencePrototype, {
                id: { value: nodeID }  // TODO: same wrapper for same id so that === works
            } );
        },

        /// Determine if a value is a node reference. If it is, it will contain the `nodeID` in the
        /// `id` field.
        /// 
        /// @param {Object} value
        /// 
        /// @returns {Boolean}

        valueIsNodeReference: function( value ) {
            return nodeReferencePrototype.isPrototypeOf( value );
        },

    };

    /// The key prototype for application values that reference nodes.
    /// 
    /// Application values that reference VWF nodes are objects of the form `{ id: id }` that also
    /// extend this object. Application values include property values, method parameters and
    /// results, and event listener parameters.
    /// 
    /// `nodeReferencePrototype` serves as a key to distinguish real node references from other
    /// arbitrary values.
    /// 
    /// @field

    var nodeReferencePrototype = {};

    // Return the module.

    return exports;

} );
