( function( modules ) {

    console.info( "loading vwf.view" );

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

    modules.view = function( vwf ) {

        if ( ! vwf ) return;

        console.info( "creating vwf.view" );

        this.vwf = vwf;

    };

    var module = modules.view;

    // == Stimulus API =============================================================================

    // The base view stands between the VWF manager and the deriving view classes. API calls pass
    // through in two directions. Calls from a deriving view to the manager are commands, causing
    // change. These calls are the stimulus half of the API.
    // 
    // Since views can't directly manipulate the simulation, stimulus calls are sent via the manager
    // to the replication server. Future development will move some functionality from the deriving
    // views to provide a common service for mapping between vwf and view object identifiers.

    // -- createNode -------------------------------------------------------------------------------

    module.prototype.createNode = function( component_uri_or_object ) {
        console.info( "vwf.view.createNode " + component_uri_or_object );
        this.vwf.send( undefined, "createNode", component_uri_or_object );
    };

    // TODO: deleteNode

    // -- addChild ---------------------------------------------------------------------------------

    module.prototype.addChild = function( nodeID, childID, childName ) {
        console.info( "vwf.view.addChild " + nodeID + " " + childID + " " + childName );
        this.vwf.send( nodeID, "addChild", childID, childName );
    };

    // -- removeChild ------------------------------------------------------------------------------

    module.prototype.removeChild = function( nodeID, childID ) {
        console.info( "vwf.view.removeChild " + nodeID + " " + childID );
        this.vwf.send( nodeID, "removeChild", childID );
    };

    // -- createProperty ------------------------------------------------------------------------------

    module.prototype.createProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.view.createProperty " + nodeID + " " + propertyName + " " + propertyValue );
        this.vwf.send( nodeID, "createProperty", propertyName, propertyValue );
    };

    // TODO: deleteProperty

    // -- setProperty ------------------------------------------------------------------------------

    module.prototype.setProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.view.setProperty " + nodeID + " " + propertyName + " " + propertyValue );
        this.vwf.send( nodeID, "setProperty", propertyName, propertyValue );
    };

    // -- getProperty ------------------------------------------------------------------------------

    module.prototype.getProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.view.getProperty " + nodeID + " " + propertyName + " " + propertyValue );
        this.vwf.send( nodeID, "getProperty", propertyName, propertyValue );
    };
    
    // -- createMethod -----------------------------------------------------------------------------

    module.prototype.createMethod = function( nodeID, methodName ) {
        console.info( "vwf.view.createMethod " + nodeID + " " + methodName );
        this.vwf.send( nodeID, "createMethod", methodName );
    };

    // TODO: deleteMethod

    // -- callMethod -------------------------------------------------------------------------------

    module.prototype.callMethod = function( nodeID, methodName ) { // TODO: parameters
        console.info( "vwf.view.callMethod " + nodeID + " " + methodName ); // TODO: parameters
        this.vwf.send( nodeID, "callMethod", methodName ); // TODO: parameters
    };
    
    // TODO: createEvent, deleteEvent, addEventListener, removeEventListener, fireEvent

    // -- execute ----------------------------------------------------------------------------------

    module.prototype.execute = function( nodeID, scriptText, scriptType ) {
        console.info( "vwf.view.execute " + nodeID + " " + ( scriptText || "" ).substring( 0, 100 ) + " " + scriptType );
        this.vwf.send( nodeID, "execute", scriptText, scriptType );
    };

    // TODO: time

    // == Response API =============================================================================

    // Calls from the manager to a deriving view are notifications, informing of change. These calls
    // are the response half of the API.

    // Views generally handle a response by updating a UI element to reflect the internal state
    // change in the simulation.

    // Each of these implementations provides the default, null response. A deriving view only needs
    // to implement the response handlers that it needs for its work. These will handle the rest.

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
        console.info( "vwf.view.createdNode " + nodeID + " " +
            nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );
    };

    // TODO: deletedNode

    // -- addedChild -------------------------------------------------------------------------------

    module.prototype.addedChild = function( nodeID, childID, childName ) {
        console.info( "vwf.view.addedChild " + nodeID + " " + childID + " " + childName );
    };

    // -- removedChild -----------------------------------------------------------------------------

    module.prototype.removedChild = function( nodeID, childID ) {
        console.info( "vwf.view.removedChild " + nodeID + " " + childID );
    };

    // -- createdProperty --------------------------------------------------------------------------

    module.prototype.createdProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.view.createdProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // TODO: deletedProperty

    // -- satProperty ------------------------------------------------------------------------------

    // Please excuse the horrible grammar. It needs to be a past tense verb distinct from the
    // present tense command that invokes the action.

    module.prototype.satProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.view.satProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.view.gotProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // -- createdMethod ----------------------------------------------------------------------------

    module.prototype.createdMethod = function( nodeID, methodName ) {
        console.info( "vwf.view.createdMethod " + nodeID + " " + methodName );
    };

    // TODO: deletedMethod

    // -- calledMethod -----------------------------------------------------------------------------

    module.prototype.calledMethod = function( nodeID, methodName ) { // TODO: parameters
        console.info( "vwf.view.calledMethod " + nodeID + " " + methodName ); // TODO: parameters
    };

    // TODO: createdEvent, deletedEvent, firedEvent

    // -- executed ---------------------------------------------------------------------------------

    module.prototype.executed = function( nodeID, scriptText, scriptType ) {
        console.info( "vwf.view.executed " + nodeID + " " + ( scriptText || "" ).substring( 0, 100 ) + " " + scriptType );
    };

} ) ( window.vwf.modules );
