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

define( [ "module", "vwf/model/stage" ], function( module, stage ) {

    // vwf/model/stage/map.js translates between kernel-side nodeIDs and model-side objects or ids.

    return stage.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( object_id ) {

            this.kernel_to_model = {}; // maps nodeID => model object
            this.model_to_kernel = {}; // maps model object => nodeID

            if ( typeof object_id == "function" || object_id instanceof Function ) {
                this.object_id = object_id;
            } else if ( typeof object_id == "string" || object_id instanceof String ) {
                this.object_id = function( node ) { return node[object_id] };
            } else {
                this.object_id = function( node ) { return node }; // will use node's toString()
            }

        },

        // == Kernel API ===========================================================================

        // -- createNode ---------------------------------------------------------------------------

        createNode: function( nodeComponent, callback /* ( nodeID ) */ ) {
            return this.kernel.createNode( nodeComponent, callback );  // TODO: remap callback parameter
        },

        // -- deleteNode ---------------------------------------------------------------------------

        deleteNode: function( node ) {
            return this.kernel.deleteNode( this.model_to_kernel[this.object_id(node)] || node );
        },

        // -- createChild --------------------------------------------------------------------------

        createChild: function( node, childName, childComponent, callback /* ( childID ) */ ) {
            return this.kernel.createChild( this.model_to_kernel[this.object_id(node)] || node,
                childName, childComponent, callback );  // TODO: remap callback parameter
        },

        // -- addChild -----------------------------------------------------------------------------

        addChild: function( node, child, childName ) {
            return this.kernel.addChild( this.model_to_kernel[this.object_id(node)] || node,
                this.model_to_kernel[this.object_id(child)] || child, childName );
        },

        // -- removeChild --------------------------------------------------------------------------

        removeChild: function( node, child ) {
            return this.kernel.removeChild( this.model_to_kernel[this.object_id(node)] || node,
                this.model_to_kernel[this.object_id(child)] || child );
        },

        // -- ancestors -------------------------------------------------------------------------------

        ancestors: function( node ) {
            return this.kernel.ancestors( this.model_to_kernel[this.object_id(node)] || node );
        },

        // -- parent -------------------------------------------------------------------------------

        parent: function( node ) {
            return this.kernel.parent( this.model_to_kernel[this.object_id(node)] || node );
        },

        // -- children -----------------------------------------------------------------------------

        children: function( node ) {
            return this.kernel.children( this.model_to_kernel[this.object_id(node)] || node );
        },

        // -- name ---------------------------------------------------------------------------------

        name: function( node ) {
            return this.kernel.name( this.model_to_kernel[this.object_id(node)] || node );
        },

        // -- createProperty -----------------------------------------------------------------------

        createProperty: function( node, propertyName, propertyValue ) {
            return this.kernel.createProperty( this.model_to_kernel[this.object_id(node)] || node,
                propertyName, propertyValue );
        },

        // TODO: deleteProperty

        // -- setProperty --------------------------------------------------------------------------

        setProperty: function( node, propertyName, propertyValue ) {
            return this.kernel.setProperty( this.model_to_kernel[this.object_id(node)] || node,
                propertyName, propertyValue );
        },

        // -- getProperty --------------------------------------------------------------------------

        getProperty: function( node, propertyName, propertyValue ) {
            return this.kernel.getProperty( this.model_to_kernel[this.object_id(node)] || node,
                propertyName, propertyValue );
        },

        // -- createMethod -------------------------------------------------------------------------

        createMethod: function( node, methodName, methodParameters, methodBody ) {
            return this.kernel.createMethod( this.model_to_kernel[this.object_id(node)] || node,
                methodName, methodParameters, methodBody );
        },

        // TODO: deleteMethod

        // -- callMethod ---------------------------------------------------------------------------

        callMethod: function( node, methodName, methodParameters ) {
            return this.kernel.callMethod( this.model_to_kernel[this.object_id(node)] || node,
                methodName, methodParameters );
        },

        // -- createEvent --------------------------------------------------------------------------

        createEvent: function( node, eventName, eventParameters ) {
            return this.kernel.createEvent( this.model_to_kernel[this.object_id(node)] || node,
                eventName, eventParameters );
        },

        // TODO: deleteEvent

        // -- fireEvent ----------------------------------------------------------------------------

        fireEvent: function( node, eventName, eventParameters ) {
            return this.kernel.fireEvent( this.model_to_kernel[this.object_id(node)] || node,
                eventName, eventParameters );
        },

        // -- dispatchEvent ------------------------------------------------------------------------

        dispatchEvent: function( node, eventName, eventParameters, eventNodeParameters ) {
            return this.kernel.dispatchEvent( this.model_to_kernel[this.object_id(node)] || node,
                eventName, eventParameters, eventNodeParameters );  // TODO: remap any node references in eventParameters and eventNodeParameters (possible to do without knowing specific events?)
        },

        // -- execute ------------------------------------------------------------------------------

        execute: function( node, scriptText, scriptType ) {
            return this.kernel.execute( this.model_to_kernel[this.object_id(node)] || node,
                scriptText, scriptType );
        },

        // -- time ---------------------------------------------------------------------------------

        time: function() {
            return this.kernel.time();
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {

            var child = this.model.creatingNode && this.model.creatingNode(
                this.kernel_to_model[nodeID] || nodeID,
                childID,
                this.kernel_to_model[childExtendsID] || childExtendsID,
                childImplementsIDs,  // TODO: remap childImplementsIDs array values
                childSource, childType, childURI, childName, callback );

            if ( child !== undefined ) {
                this.kernel_to_model[childID] = child;
                this.model_to_kernel[this.object_id(child)] = childID;
            }

            return undefined; // creatingNode doesn't return anything to the kernel
        },

        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function( nodeID, childID ) {
            return this.model.initializingNode && this.model.initializingNode(
                this.kernel_to_model[nodeID] || nodeID, this.kernel_to_model[childID] || childID );
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {
            return this.model.deletingNode && this.model.deletingNode( this.kernel_to_model[nodeID] || nodeID );
        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {
            return this.model.addingChild && this.model.addingChild( this.kernel_to_model[nodeID] || nodeID,
                this.kernel_to_model[childID] || childID, childName );
        },

        // -- removingChild ------------------------------------------------------------------------

        removingChild: function( nodeID, childID ) {
            return this.model.removingChild && this.model.removingChild(
                this.kernel_to_model[nodeID] || nodeID, this.kernel_to_model[childID] || childID );
        },

        // -- parenting ----------------------------------------------------------------------------

        parenting: function( nodeID ) {
            return this.model.parenting && this.model.parenting( this.kernel_to_model[nodeID] || nodeID );
        },

        // -- childrening --------------------------------------------------------------------------

        childrening: function( nodeID ) {
            return this.model.childrening && this.model.childrening( this.kernel_to_model[nodeID] || nodeID );
        },

        // -- naming -------------------------------------------------------------------------------

        naming: function( nodeID ) {
            return this.model.naming && this.model.naming( this.kernel_to_model[nodeID] || nodeID );
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.model.creatingProperty && this.model.creatingProperty( this.kernel_to_model[nodeID] || nodeID,
                propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.model.initializingProperty && this.model.initializingProperty( this.kernel_to_model[nodeID] || nodeID,
                propertyName, propertyValue );
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.model.settingProperty && this.model.settingProperty( this.kernel_to_model[nodeID] || nodeID,
                propertyName, propertyValue );
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.model.gettingProperty && this.model.gettingProperty( this.kernel_to_model[nodeID] || nodeID,
                propertyName, propertyValue );
        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {
            return this.model.creatingMethod && this.model.creatingMethod( this.kernel_to_model[nodeID] || nodeID,
                methodName, methodParameters, methodBody );
        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters ) {
            return this.model.callingMethod && this.model.callingMethod( this.kernel_to_model[nodeID] || nodeID,
                methodName, methodParameters );
        },

        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function( nodeID, eventName, eventParameters ) {
            return this.model.creatingEvent && this.model.creatingEvent( this.kernel_to_model[nodeID] || nodeID,
                eventName, eventParameters );
        },

        // TODO: deletingEvent

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {
            return this.model.firingEvent && this.model.firingEvent( this.kernel_to_model[nodeID] || nodeID,
                eventName, eventParameters );
        },

        // -- executing ----------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {
            return this.model.executing && this.model.executing( this.kernel_to_model[nodeID] || nodeID,
                scriptText, scriptType );
        },

        // -- ticking ------------------------------------------------------------------------------

        ticking: function( time ) {
            return this.model.ticking && this.model.ticking( time );
        },

    } );

} );
