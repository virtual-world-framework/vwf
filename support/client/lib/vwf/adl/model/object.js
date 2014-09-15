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

/// vwf/model/object.js is a backstop property store.
/// 
/// @module vwf/model/object
/// @requires vwf/model
/// @requires vwf/configuration

define( [ "module", "vwf/model", "vwf/configuration" ], function( module, model, configuration ) {

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
                childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            // The kernel calls vwf/model/object's `creatingNode` multiple times: once at the start
            // of `createChild` so that we can claim our spot in the parent's children array before
            // doing any async operations, a second time after loading the prototype and behaviors,
            // then a third time in the normal order as the last driver.

            var parent = nodeID != 0 && this.objects[nodeID];

            var child = this.objects[childID];

            if ( ! child ) {

                // First time: initialize the node.

                child = this.objects[childID] = {

                    id: childID,

                    prototype: undefined,
                    behaviors: undefined,

                    source: childSource,
                    type: childType,

                    uri: parent ? undefined : childIndex,

                    name: childName,

                    properties: {},

                    parent: undefined,
                    children: [],

                    sequence: 0,                      // counter for child ID assignments

                    prng: parent ?                    // pseudorandom number generator, seeded by ...
                        new Alea( JSON.stringify( parent.prng.state ), childID ) :  // ... the parent's prng and the child ID, or
                        new Alea( configuration.active["random-seed"], childID ),   // ... the global seed and the child ID

                    // Change list for patchable objects. This field is omitted until needed.

                    // patches: {
                    //     root: true,                // node is the root of the component
                    //     descendant: true,          // node is a descendant still within the component
                    //     internals: true,           // random, seed, or sequence has changed
                    //     properties: true,          // placeholder for a property change list
                    //     methods: [],               // array of method names for methods that changed
                    // },

                    initialized: false,

                };

                // Connect to the parent.

                if ( parent ) {
                    child.parent = parent;
                    parent.children[childIndex] = child;
                }

                // Create the `patches` field for tracking changes if the node is patchable (if it's
                // the root or a descendant in a component).

                if ( child.uri ) {
                    child.patches = { root: true };
                } else  if ( parent && ! parent.initialized && parent.patches ) {
                    child.patches = { descendant: true };
                }

            } else if ( ! child.prototype  && childID != childExtendsID) {

                // Second time: fill in the prototype and behaviors.

                child.prototype = childExtendsID && this.objects[childExtendsID];

                child.behaviors = ( childImplementsIDs || [] ).map( function( childImplementsID ) {
                    return this.objects[childImplementsID];
                }, this );

            } else {

                // Third time: ignore since nothing is new.
            }

        },

        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                childSource, childType, childIndex, childName ) {
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

        // addingChild: function( nodeID, childID, childName ) {  // TODO: not for global anchor node 0
        // },

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
            if(!this.objects[nodeID]) return undefined;
            return this.objects[nodeID].properties[propertyName];
        },

        // == Special Model API ====================================================================

        // The kernel delegates the corresponding API calls exclusively to vwf/model/object without
        // calling any other models.

        // -- random -------------------------------------------------------------------------------

        random: function( nodeID ) {
            var object = this.objects[nodeID];
            object.initialized && object.patches && ( object.patches.internals = true );
            return object.prng();
        },

        // -- seed ---------------------------------------------------------------------------------

        seed: function( nodeID, seed ) {
            var object = this.objects[nodeID];
            object.initialized && object.patches && ( object.patches.internals = true );
            object.prng = new Alea( seed );
        },

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
            var node = this.objects[ nodeID ];
            if ( node ) {
                return node.uri;
            } else {
                this.logger.warnx( "Could not find uri of nonexistent node: '" + nodeID + "'" );
            }
        },

        // -- name ---------------------------------------------------------------------------------

        name: function( nodeID ) {
            return this.objects[nodeID].name || "";
        },

        // -- prototype ----------------------------------------------------------------------------

        prototype: function( nodeID ) {  // TODO: not for global anchor node 0
             if(!this.objects[nodeID]) return null;
            var object = this.objects[nodeID];
            return object.prototype && object.prototype.id;
        },

        // -- behaviors ----------------------------------------------------------------------------

        behaviors: function( nodeID ) {  // TODO: not for global anchor node 0
            if(!this.objects[nodeID]) return [];
            var behaviors = this.objects[nodeID].behaviors;
            if ( behaviors ) {
                return behaviors.map( function( behavior ) {
                    return behavior.id;
                } );
            } else {
                this.logger.warnx( "Node '" + nodeID + "' does not have a valid behaviors array" );
            }
        },

        // -- parent -------------------------------------------------------------------------------

        parent: function( nodeID, initializedOnly ) {

            var object = this.objects[ nodeID ];

            if ( object ) {
                return ( !initializedOnly || object.initialized ) ?
                    ( object.parent && object.parent.id || 0 ) : undefined;
            } else {
                this.logger.error( "Cannot find node: '" + nodeID + "'" );
            }
        },

        // -- children -----------------------------------------------------------------------------

        children: function( nodeID ) {

            if ( nodeID === undefined ) {
                this.logger.errorx( "children", "cannot retrieve children of nonexistent node");
                return;
            }

            var node = this.objects[ nodeID ];

            if ( node )
                return node.children.map( function( child ) {
                    return child.id;
                } );
            else
                this.logger.error( "Cannot find node: " + nodeID );

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

            if ( !object ) {
                this.logger.errorx( "internals: object does not exist with id = '" + nodeID + "'" );
                return;
            }

            if ( internals ) { // set
                object.sequence = internals.sequence !== undefined ? internals.sequence : object.sequence;
                jQuery.extend( object.prng.state, internals.random || {} );
            } else { // get
                internals = {};
                internals.sequence = object.sequence;
                internals.random = object.prng.state;  // TODO: tag as Alea data
            }

            return internals;
        },

        // -- sequence -----------------------------------------------------------------------------

        sequence: function( nodeID ) {
            var object = this.objects[nodeID];
            object.initialized && object.patches && ( object.patches.internals = true );
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

        // -- initialized --------------------------------------------------------------------------

        initialized: function( nodeID ) {
            return this.objects[nodeID].initialized;
        },

    } );

} );
