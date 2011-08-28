( function( modules, namespace ) {

    window.console && console.info && console.info( "loading " + namespace );

    // vwf-model.js is the common implementation of all Virtual World Framework models. Each model
    // is part of a federation with other models attached to the simulation that implements part of
    // the greater model. Taken together, the models create the entire model system for the
    // simulation.
    //
    // Models are inside of, and directly part of the simulation. They may control the simulation
    // and cause immediate change, but they cannot accept external input. The model configuration is
    // identical for all participants in a shared world.
    // 
    // A given model might be responsible for a certain subset of nodes in the the simulation, such
    // as those representing Flash objects. Or it might implement part of the functionality of any
    // node, such as translating 3-D transforms and material properties back and forth to a scene
    // manager. Or it might implement functionality that is only active for a short period, such as
    // importing a document.
    // 
    // vwf-model, as well as all deriving models, is constructed as a JavaScript module
    // (http://www.yuiblog.com/blog/2007/06/12/module-pattern). It attaches to the vwf modules list
    // as vwf.modules.model.

    var module = modules[namespace.split(".").pop()] = function( vwf ) {

        if ( ! vwf ) return;

        vwf.logger.info( "creating " + namespace );

        this.vwf = vwf;
        this.namespace = namespace;

    };

    // == Stimulus API =============================================================================

    // The base model stands between the VWF manager and the deriving model classes. API calls pass
    // through in two directions. Calls from a deriving model to the manager are commands, causing
    // change. These calls are the stimulus half of the API.
    // 
    // For models, stimulus calls pass directly through to the manager. (Views make these calls
    // through the conference reflector.) Future development will move some functionality from the
    // deriving models to provide a common service for mapping between vwf and model object
    // identifiers.

    // -- createNode -------------------------------------------------------------------------------

    module.prototype.createNode = function( component_uri_or_object, callback ) {
        vwf.logger.info( namespace + ".createNode " + component_uri_or_object )
        return vwf.createNode( component_uri_or_object, callback );
    };

    // TODO: deleteNode

    // -- addChild ---------------------------------------------------------------------------------

    module.prototype.addChild = function( nodeID, childID, childName ) {
        vwf.logger.info( namespace + ".addChild " + nodeID + " " + childID + " " + childName );
        return vwf.addChild( nodeID, childID, childName );
    };

    // -- removeChild ------------------------------------------------------------------------------

    module.prototype.removeChild = function( nodeID, childID ) {
        vwf.logger.info( namespace + ".removeChild " + nodeID + " " + childID );
        return vwf.removeChild( nodeID, childID );
    };

    // -- parent -----------------------------------------------------------------------------------

    module.prototype.parent = function( nodeID ) {
        vwf.logger.info( namespace + ".parent " + nodeID );
        return vwf.parent( nodeID );
    };

    // -- children ---------------------------------------------------------------------------------

    module.prototype.children = function( nodeID ) {
        vwf.logger.info( namespace + ".children " + nodeID );
        return vwf.children( nodeID );
    };

    // -- name  ------------------------------------------------------------------------------------

    module.prototype.name = function( nodeID ) {
        vwf.logger.info( namespace + ".name " + nodeID );
        return vwf.name( nodeID );
    };

    // -- createProperty ---------------------------------------------------------------------------

    module.prototype.createProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".createProperty " + nodeID + " " + propertyName + " " + propertyValue );
        return vwf.createProperty( nodeID, propertyName, propertyValue );
    };

    // TODO: deleteProperty

    // -- setProperty ------------------------------------------------------------------------------

    module.prototype.setProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".setProperty " + nodeID + " " + propertyName + " " + propertyValue );
        return vwf.setProperty( nodeID, propertyName, propertyValue );
    };

    // -- getProperty ------------------------------------------------------------------------------

    module.prototype.getProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".getProperty " + nodeID + " " + propertyName + " " + propertyValue );
        return vwf.getProperty( nodeID, propertyName, propertyValue );
    };

    // -- createMethod -----------------------------------------------------------------------------

    module.prototype.createMethod = function( nodeID, methodName ) {
        vwf.logger.info( namespace + ".createMethod " + nodeID + " " + methodName );
        return vwf.createMethod( nodeID, methodName );
    };

    // TODO: deleteMethod

    // -- callMethod -------------------------------------------------------------------------------

    module.prototype.callMethod = function( nodeID, methodName ) { // TODO: parameters
        vwf.logger.info( namespace + ".callMethod " + nodeID + " " + methodName ); // TODO: parameters
        return vwf.callMethod( nodeID, methodName ); // TODO: parameters
    };
    
    // TODO: createEvent, deleteEvent, addEventListener, removeEventListener, fireEvent

    // -- execute ----------------------------------------------------------------------------------

    module.prototype.execute = function( nodeID, scriptText, scriptType ) {
        vwf.logger.info( namespace + ".execute " + nodeID + " " + ( scriptText || "" ).substring( 0, 100 ) + " " + scriptType );
        return vwf.execute( nodeID, scriptText, scriptType );
    };

    // -- time -------------------------------------------------------------------------------------

    module.prototype.time = function() {
        // vwf.logger.debug( namespace + ".time" );
        return vwf.time();
    };

    // == Response API =============================================================================

    // Calls from the manager to a deriving model are notifications, informing of change. These
    // calls are the response half of the API.

    // For models, responses are where work is actually performed, and response implementations may
    // generate additional stimulus calls. (In contrast, views generally transfer data outward, away
    // from the simulation when handling a response.)

    // Each of these implementations provides the default, null response. A deriving model only
    // needs to implement the response handlers that it needs for its work. These will handle the
    // rest.

    // -- creatingNode -----------------------------------------------------------------------------

    module.prototype.creatingNode = function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
        vwf.logger.info( namespace + ".creatingNode " + nodeID + " " + 
            nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );
    };

    // TODO: deletingNode

    // -- addingChild ------------------------------------------------------------------------------

    module.prototype.addingChild = function( nodeID, childID, childName ) {
        vwf.logger.info( namespace + ".addingChild " + nodeID + " " + childID + " " + childName );
    };

    // -- removingChild ----------------------------------------------------------------------------

    module.prototype.removingChild = function( nodeID, childID ) {
        vwf.logger.info( namespace + ".removingChild " + nodeID + " " + childID );
    };

    // -- parenting --------------------------------------------------------------------------------

    module.prototype.parenting = function( nodeID ) {
        vwf.logger.info( namespace + ".parenting " + nodeID );
    };

    // -- childrening ------------------------------------------------------------------------------

    module.prototype.childrening = function( nodeID ) {
        vwf.logger.info( namespace + ".childrening " + nodeID );
    };

    // -- naming -----------------------------------------------------------------------------------

    module.prototype.naming = function( nodeID ) {
        vwf.logger.info( namespace + ".naming " + nodeID );
    };

    // -- creatingProperty -------------------------------------------------------------------------

    module.prototype.creatingProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".creatingProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // TODO: deletingProperty

    // -- settingProperty --------------------------------------------------------------------------

    module.prototype.settingProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".settingProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // -- gettingProperty --------------------------------------------------------------------------

    module.prototype.gettingProperty = function( nodeID, propertyName, propertyValue ) {
        vwf.logger.info( namespace + ".gettingProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // -- creatingMethod ---------------------------------------------------------------------------

    module.prototype.creatingMethod = function( nodeID, methodName ) {
        vwf.logger.info( namespace + ".creatingMethod " + nodeID + " " + methodName );
    };

    // TODO: deletingMethod

    // -- callingMethod ----------------------------------------------------------------------------

    module.prototype.callingMethod = function( nodeID, methodName ) { // TODO: parameters
        vwf.logger.info( namespace + ".callingMethod " + nodeID + " " + methodName ); // TODO: parameters
    };

    // TODO: creatingEvent, deltetingEvent, firingEvent

    // -- executing --------------------------------------------------------------------------------

    module.prototype.executing = function( nodeID, scriptText, scriptType ) {
        vwf.logger.info( namespace + ".executing " + nodeID + " " + ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ) + " " + scriptType );
    };

} ) ( window.vwf.modules, "vwf.model" );
