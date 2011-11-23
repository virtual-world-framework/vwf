( function( modules, namespace ) {

    window.console && console.info && console.info( "loading " + namespace );

    // vwf-view.js is the common implementation of all Virtual World Framework views. Views
    // interpret information from the simulation, present it to the user, and accept user input
    // influencing the simulation.
    //
    // Views are outside of the simulation. Unlike models, they may accept external input--such as
    // pointer and key events from a user--but may only affect the simulation indirectly through the
    // synchronization server.
    // 
    // vwf-view, as well as all deriving views, is constructed as a JavaScript module
    // (http://www.yuiblog.com/blog/2007/06/12/module-pattern). It attaches to the vwf modules list
    // as vwf.modules.view.

    var module = modules[namespace.split(".").pop()] = function( vwf ) {

        if ( ! vwf ) return;

        vwf.logger.info( "creating " + namespace );

        this.vwf = vwf;
        this.namespace = namespace;

    };

    // == Stimulus API =============================================================================

    // The base view stands between the VWF manager and the deriving view classes. API calls pass
    // through in two directions. Calls from a deriving view to the manager are commands, causing
    // change. These calls are the stimulus half of the API.
    // 
    // Since views can't directly manipulate the simulation, stimulus calls are sent via the manager
    // to the replication server. Future development will move some functionality from the deriving
    // views to provide a common service for mapping between vwf and view object identifiers.

    // -- createNode -------------------------------------------------------------------------------

    module.prototype.createNode = function( nodeID, childComponent, childName ) {
        vwf.logger.info( namespace + ".createNode " + nodeID + " " + childComponent + " " + childName );
        vwf.send( 0, nodeID, "createNode", undefined, [ childComponent, childName ] );  // TODO: swap childComponent & childName
    };

    // -- deleteNode -------------------------------------------------------------------------------

    module.prototype.deleteNode = function( nodeID, childName ) {
        vwf.logger.info( namespace + ".deleteNode " + nodeID + " " + childName );
        vwf.send( 0, nodeID, "deleteNode", childName );
    };

    // -- addChild ---------------------------------------------------------------------------------

    module.prototype.addChild = function( nodeID, childID, childName ) {
        vwf.logger.info( namespace + ".addChild " + nodeID + " " + childID + " " + childName );
        vwf.send( 0, nodeID, "addChild", undefined, [ childID, childName ] );
    };

    // -- removeChild ------------------------------------------------------------------------------

    module.prototype.removeChild = function( nodeID, childID ) {
        vwf.logger.info( namespace + ".removeChild " + nodeID + " " + childID );
        vwf.send( 0, nodeID, "removeChild", undefined, [ childID ] );
    };

    // -- createProperty ------------------------------------------------------------------------------

    module.prototype.createProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".createProperty " + nodeID + " " + propertyName + " " + propertyValue );
        vwf.send( 0, nodeID, "createProperty", propertyName, [ propertyValue ] );
    };

    // TODO: deleteProperty

    // -- setProperty ------------------------------------------------------------------------------

    module.prototype.setProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".setProperty " + nodeID + " " + propertyName + " " + propertyValue );
        vwf.send( 0, nodeID, "setProperty", propertyName, [ propertyValue ] );
    };

    // -- getProperty ------------------------------------------------------------------------------

    module.prototype.getProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".getProperty " + nodeID + " " + propertyName + " " + propertyValue );
        vwf.send( 0, nodeID, "getProperty", propertyName );
    };
    
    // -- createMethod -----------------------------------------------------------------------------

    module.prototype.createMethod = function( nodeID, methodName, methodParameters, methodBody ) {
        vwf.logger.info( namespace + ".createMethod " + nodeID + " " + methodName + " " + methodParameters );
        vwf.send( 0, nodeID, "createMethod", methodName, [ methodParameters, methodBody ] );
    };

    // TODO: deleteMethod

    // -- callMethod -------------------------------------------------------------------------------

    module.prototype.callMethod = function( nodeID, methodName, methodParameters ) {
        vwf.logger.info( namespace + ".callMethod " + nodeID + " " + methodName + " " + methodParameters );
        vwf.send( 0, nodeID, "callMethod", methodName, [ methodParameters ] );
    };

    // -- createEvent ------------------------------------------------------------------------------

    module.prototype.createEvent = function( nodeID, eventName, eventParameters ) {
        vwf.logger.info( namespace + ".createEvent " + nodeID + " " + eventName + " " + eventParameters );
        vwf.send( 0, nodeID, "createEvent", eventName, [ eventParameters ] );
    };

    // TODO: deleteEvent

    // -- fireEvent --------------------------------------------------------------------------------

    module.prototype.fireEvent = function( nodeID, eventName, eventParameters ) {
        vwf.logger.info( namespace + ".fireEvent " + nodeID + " " + eventName + " " + eventParameters );
        vwf.send( 0, nodeID, "fireEvent", eventName, [ eventParameters ] );
    };
    
    // -- execute ----------------------------------------------------------------------------------

    module.prototype.execute = function( nodeID, scriptText, scriptType ) {
        vwf.logger.info( namespace + ".execute " + nodeID + " " + ( scriptText || "" ).substring( 0, 100 ) + " " + scriptType );
        vwf.send( 0, nodeID, "execute", undefined, [ scriptText, scriptType ] );
    };

    // -- time -------------------------------------------------------------------------------------

    module.prototype.time = function() {
        return vwf.time(); 
    };

// TODO: implement two paths for stimulus functions: if callback provided, send and serialize onto queue and return value via callback when complete; otherwise, for read functions only, make direct call to vwf to get current state (which will be in past wrt serialized calls); time() does only the second case; the others only do the first case but don't return the result.

    // == Response API =============================================================================

    // Calls from the manager to a deriving view are notifications, informing of change. These calls
    // are the response half of the API.

    // Views generally handle a response by updating a UI element to reflect the internal state
    // change in the simulation.

    // Each of these implementations provides the default, null response. A deriving view only needs
    // to implement the response handlers that it needs for its work. These will handle the rest.

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function( nodeID, childID, childExtendsID, childImplementsIDs,
        childSource, childType, childName, callback /* ( ready ) */ ) {

        vwf.logger.info( namespace + ".createdNode " + nodeID + " " + childID + " " + childExtendsID + " " +  childImplementsIDs + " " +
            childSource + " " +  childType + " " + childName );
    };

    // -- deletedNode ------------------------------------------------------------------------------

    module.prototype.deletedNode = function( nodeID, childName ) {
        vwf.logger.info( namespace + ".deletedNode " + nodeID + " " + childName );
    };


    // -- addedChild -------------------------------------------------------------------------------

    module.prototype.addedChild = function( nodeID, childID, childName ) {
        vwf.logger.info( namespace + ".addedChild " + nodeID + " " + childID + " " + childName );
    };

    // -- removedChild -----------------------------------------------------------------------------

    module.prototype.removedChild = function( nodeID, childID ) {
        vwf.logger.info( namespace + ".removedChild " + nodeID + " " + childID );
    };

    // -- createdProperty --------------------------------------------------------------------------

    module.prototype.createdProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".createdProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // TODO: deletedProperty

    // -- satProperty ------------------------------------------------------------------------------

    // Please excuse the horrible grammar. It needs to be a past tense verb distinct from the
    // present tense command that invokes the action.

    module.prototype.satProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".satProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".gotProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // -- createdMethod ----------------------------------------------------------------------------

    module.prototype.createdMethod = function( nodeID, methodName, methodParameters, methodBody ) {
        vwf.logger.info( namespace + ".createdMethod " + nodeID + " " + methodName + " " + methodParameters );
    };

    // TODO: deletedMethod

    // -- calledMethod -----------------------------------------------------------------------------

    module.prototype.calledMethod = function( nodeID, methodName, methodParameters ) {
        vwf.logger.info( namespace + ".calledMethod " + nodeID + " " + methodName + " " + methodParameters );
    };

    // -- createdEvent -----------------------------------------------------------------------------

    module.prototype.createdEvent = function( nodeID, eventName, eventParameters ) {
        vwf.logger.info( namespace + ".createdEvent " + nodeID + " " + eventName + " " + eventParameters );
    };

    // TODO: deletedEvent

    // -- calledEvent ------------------------------------------------------------------------------

    module.prototype.firedEvent = function( nodeID, eventName, eventParameters ) {
        vwf.logger.info( namespace + ".firedEvent " + nodeID + " " + eventName + " " + eventParameters );
    };

    // -- executed ---------------------------------------------------------------------------------

    module.prototype.executed = function( nodeID, scriptText, scriptType ) {
        vwf.logger.info( namespace + ".executed " + nodeID + " " + ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ) + " " + scriptType );
    };

    // -- ticked -----------------------------------------------------------------------------------

    module.prototype.ticked = function( time ) {
    };

} ) ( window.vwf.modules, "vwf.view" );
