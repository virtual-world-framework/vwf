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

/// vwf/model/scenejs.js is a placeholder for a 3-D scene manager.
/// 
/// @module vwf/model/scenejs
/// @requires vwf/model

define( [ "module", "vwf/model" ], function( module, model ) {

    return model.load( module, {

        // == Module Definition ====================================================================

        // This is a placeholder for connecting to the SceneJS WebGL scene manager.

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {
        },

        // -- deletingNode -------------------------------------------------------------------------

        //deletingNode: function( nodeID ) {
        //},

        // -- settingProperty ----------------------------------------------------------------------

        //settingProperty: function( nodeID, propertyName, propertyValue ) {
        //},

        // -- gettingProperty ----------------------------------------------------------------------

        //gettingProperty: function( nodeID, propertyName, propertyValue ) {
        //},

    } );

} );
