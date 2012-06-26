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

            this.objects[childID] = {

                id: childID,
                uri: childURI,

                name: childName,
                source: childSource,
                type: childType,

                prototype: childExtendsID &&
                    this.objects[childExtendsID],

                behaviors: ( childImplementsIDs || [] ).map( function( childImplementsID ) {
                    return this.objects[childImplementsID];
                }, this ),

                parent: undefined,
                children: [],

                properties: {},

                sequence: 0,

                initialized: false,
                changed: false, // any changes since initialization?
                added: false, // added since parent's initialization?

            };

        },

        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function( nodeID, childID ) {

            this.objects[childID].changed = false;
            this.objects[childID].initialized = true;

            if ( nodeID != 0 && this.objects[nodeID].initialized ) {
                this.objects[childID].changed = true;
                this.objects[childID].added = true;
            }

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

if ( ! this.objects[nodeID] ) return;  // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            var node_properties = this.objects[nodeID].properties;

            for ( var propertyName in properties ) {  // TODO: since undefined values don't serialize to json, interate over node_properties (has-own only) instead and set to undefined if missing from properties?

                if ( ! node_properties.hasOwnProperty( propertyName ) ) {
                    this.kernel.setProperty( nodeID, propertyName, properties[propertyName] );
                }  // TODO: this needs to be handled in vwf.js for setProperties() the way it's now handling setProperty() create vs. initiailize vs. set

                node_properties[propertyName] = properties[propertyName];

            }

            this.objects[nodeID].changed = true;

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
            this.objects[nodeID].changed = true;
            return this.objects[nodeID].properties[propertyName] = propertyValue;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.objects[nodeID].properties[propertyName];
        },

        // -- intrinsics ---------------------------------------------------------------------------

        intrinsics: function( nodeID, result ) {

            var object = this.objects[nodeID];

            result = result || {};

            result.id = object.id;
            result.uri = object.uri;

            result.name = object.name;
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

        properties: function( nodeID ) {
            return this.objects[nodeID].properties;
        },

        // -- sequence -----------------------------------------------------------------------------

        sequence: function( nodeID ) {

            var object = this.objects[nodeID];

            if ( object ) {
                return ++object.sequence; // TODO: different function to increment and return?
            }

            return undefined;
        },

        // -- exists -------------------------------------------------------------------------------

        exists: function( nodeID ) {
            return !! this.objects[nodeID];
        },

        // -- changed ------------------------------------------------------------------------------

        changed: function( nodeID ) {
            return this.objects[nodeID].changed;
        },

        // -- added --------------------------------------------------------------------------------

        added: function( nodeID ) {
            return this.objects[nodeID].added;
        },

    } );

} );
