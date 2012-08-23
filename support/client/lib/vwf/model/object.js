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

define( [ "module", "vwf/model" ], function( module, model ) {

    // vwf/model/object.js is a backstop property store.

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.objects = {}; // maps id => { property: value, ... }
            this.creatingNode( undefined, 0 ); // global root  // TODO: to allow vwf.children( 0 ), vwf.getNode( 0 ); is this the best way, or should the kernel createNode( global-root-id /* 0 */ )?
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                childSource, childType, childURI, childName, callback /* ( ready ) */ ) {

            var parent = nodeID != 0 && this.objects[nodeID];

            var child = this.objects[childID] = {

                id: childID,

                prototype: childExtendsID &&
                    this.objects[childExtendsID],

                behaviors: ( childImplementsIDs || [] ).map( function( childImplementsID ) {
                    return this.objects[childImplementsID];
                }, this ),

                source: childSource,
                type: childType,

                uri: childURI,

                name: childName,

                properties: {},

                parent: undefined,
                children: [],

                sequence: 0,

                // Change list for patchable objects; created when needed

                // patches: {
                //     root: true,                 // node is the root of the component
                //     descendant: true,           // node is a descendant still within the component
                //     properties: true,           // placeholder for a property change list
                // },

                initialized: false,

            };

            if ( child.uri ) {
                child.patches = { root: true };
            } else  if ( parent && ! parent.initialized && parent.patches ) {
                child.patches = { descendant: true };
            }

        },

        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function( nodeID, childID ) {
            this.objects[childID].initialized = true;
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            var child = this.objects[nodeID];
            var object = child.parent;

            if ( object ) {

                var index = object.children.indexOf( child );

                if ( index >= 0 ) {
                    object.children.splice( index, 1 );
                }

                child.parent = undefined;

            }

            delete this.objects[nodeID];

        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {  // TODO: not for global anchor node 0

            var object = this.objects[nodeID];
            var child = this.objects[childID];

            child.parent = object;
            object.children.push( child );

        },

        // -- removingChild ------------------------------------------------------------------------

        // removingChild: function( nodeID, childID ) {
        // },

        // TODO: creatingProperties, initializingProperties

        // -- settingProperties --------------------------------------------------------------------

        settingProperties: function( nodeID, properties ) {

            var object = this.objects[nodeID];

if ( ! object ) return;  // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            var node_properties = object.properties;

            for ( var propertyName in properties ) {  // TODO: since undefined values don't serialize to json, interate over node_properties (has-own only) instead and set to undefined if missing from properties?

                if ( ! node_properties.hasOwnProperty( propertyName ) ) {
                    this.kernel.setProperty( nodeID, propertyName, properties[propertyName] );
                }  // TODO: this needs to be handled in vwf.js for setProperties() the way it's now handling setProperty() create vs. initialize vs. set

                node_properties[propertyName] = properties[propertyName];

            }

            object.initialized && object.patches && ( object.patches.properties = true ); // placeholder for a property change list

            return node_properties;
        },

        // -- gettingProperties --------------------------------------------------------------------

        gettingProperties: function( nodeID, properties ) {
            return this.objects[nodeID].properties;
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.settingProperty( nodeID, propertyName, propertyValue );
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
            var object = this.objects[nodeID];
            object.initialized && object.patches && ( object.patches.properties = true ); // placeholder for a property change list
            return object.properties[propertyName] = propertyValue;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.objects[nodeID].properties[propertyName];
        },

        // == Special Model API ====================================================================

        // The kernel delegates the corresponding API calls exclusively to vwf/model/object without
        // calling any other models.

        // -- intrinsics ---------------------------------------------------------------------------

        intrinsics: function( nodeID, result ) {

            var object = this.objects[nodeID];

            result = result || {};

            // TODO: extends and implements IDs

            result.source = object.source;
            result.type = object.type;

            return result;
        },

        // -- uri ----------------------------------------------------------------------------------

        uri: function( nodeID ) {
            return this.objects[nodeID].uri;
        },

        // -- name ---------------------------------------------------------------------------------

        name: function( nodeID ) {
            return this.objects[nodeID].name || "";
        },

        // -- prototype ----------------------------------------------------------------------------

        prototype: function( nodeID ) {  // TODO: not for global anchor node 0
            var object = this.objects[nodeID];
            return object.prototype && object.prototype.id;
        },

        // -- behaviors ----------------------------------------------------------------------------

        behaviors: function( nodeID ) {  // TODO: not for global anchor node 0
            return this.objects[nodeID].behaviors.map( function( behavior ) {
                return behavior.id;
            } );
        },

        // -- parent -------------------------------------------------------------------------------

        parent: function( nodeID ) {
            var object = this.objects[nodeID];
            return object.parent && object.parent.id || 0;
        },

        // -- children -----------------------------------------------------------------------------

        children: function( nodeID ) {
            return this.objects[nodeID].children.map( function( child ) {
                return child.id;
            } );
        },

        // == Special utilities ====================================================================

        // The kernel depends on these utility functions but does not expose them directly in the
        // public API.

        // -- properties ---------------------------------------------------------------------------

        properties: function( nodeID ) {
            return this.objects[nodeID].properties;
        },

        // -- internals ----------------------------------------------------------------------------

        internals: function( nodeID, internals ) {

            var object = this.objects[nodeID];

            if ( internals ) { // set
                object.sequence = internals.sequence || 0;
            } else { // get
                internals = {};
                internals.sequence = object.sequence;
            }

            return internals;
        },

        // -- sequence -----------------------------------------------------------------------------

        sequence: function( nodeID ) {
            var object = this.objects[nodeID];
            return object && ++object.sequence;
        },

        // -- patches ------------------------------------------------------------------------------

        patches: function( nodeID ) {
            return this.objects[nodeID].patches;
        },

        // -- exists -------------------------------------------------------------------------------

        exists: function( nodeID ) {
            return !! this.objects[nodeID];
        },

    } );

} );
