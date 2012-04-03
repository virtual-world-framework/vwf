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

        createNode: function( node, childComponent, childName, callback /* ( childID ) */ ) {
            return this.kernel.createNode( this.model_to_kernel[this.object_id(node)] || node,
                childComponent, childName, callback );  // TODO: remap callback parameter
        },

        // -- deleteNode ---------------------------------------------------------------------------

        deleteNode: function( node ) {
            return this.kernel.deleteNode( this.model_to_kernel[this.object_id(node)] || node );
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
            childSource, childType, childName, callback /* ( ready ) */ ) {

            var child = this.model.creatingNode && this.model.creatingNode(
                this.kernel_to_model[nodeID] || nodeID,
                childID,
                this.kernel_to_model[childExtendsID] || childExtendsID,
                childImplementsIDs, childSource, childType, callback );  // TODO: remap nodeImplementsIDs array values

            if ( child !== undefined ) {
                this.kernel_to_model[childID] = child;
                this.model_to_kernel[this.object_id(child)] = childID;
            }

            return undefined; // creatingNode doesn't return anything to the kernel
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
