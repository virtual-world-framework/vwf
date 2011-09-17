define( [ "vwf-proxy", "module" ], function( vwf, module ) {

    // vwf/model.js is the common implementation of all Virtual World Framework models. Each model
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
    // vwf/model and all deriving models are loaded as RequireJS (http://requirejs.org) modules.

    return {

logger: vwf.logger_for( module.id.replace( /\//g, "." ) ),

        register: function( module, spec ) {

            var id = module.id.replace( /\//g, "." );
            this.logger.info( "register", "loading", id );

            var inst = Object.create( this );

            Object.keys( spec ).forEach( function( key ) {
                inst[key] = spec[key];
            } );

inst.logger = vwf.logger_for( id );

            return inst;
        },

        // == Stimulus API =========================================================================

        // The base model stands between the VWF manager and the deriving model classes. API calls
        // pass through in two directions. Calls from a deriving model to the manager are commands,
        // causing change. These calls are the stimulus half of the API.
        // 
        // For models, stimulus calls pass directly through to the manager. (Views make these calls
        // through the conference reflector.) Future development will move some functionality from
        // the deriving models to provide a common service for mapping between vwf and model object
        // identifiers.

        // -- createNode ---------------------------------------------------------------------------

        createNode: function( component_uri_or_object, callback ) {
            this.logger.info( "createNode", component_uri_or_object );
            return vwf.createNode( component_uri_or_object, callback );
        },

        // TODO: deleteNode

        // -- addChild -----------------------------------------------------------------------------

        addChild: function( nodeID, childID, childName ) {
            this.logger.info( "addChild", nodeID, childID, childName );
            return vwf.addChild( nodeID, childID, childName );
        },

        // -- removeChild --------------------------------------------------------------------------

        removeChild: function( nodeID, childID ) {
            this.logger.info( "removeChild", nodeID, childID );
            return vwf.removeChild( nodeID, childID );
        },

        // -- parent -------------------------------------------------------------------------------

        parent: function( nodeID ) {
            this.logger.info( "parent", nodeID );
            return vwf.parent( nodeID );
        },

        // -- children -----------------------------------------------------------------------------

        children: function( nodeID ) {
            this.logger.info( "children", nodeID );
            return vwf.children( nodeID );
        },

        // -- name ---------------------------------------------------------------------------------

        name: function( nodeID ) {
            this.logger.info( "name", nodeID );
            return vwf.name( nodeID );
        },

        // -- createProperty -----------------------------------------------------------------------

        createProperty: function( nodeID, propertyName, propertyValue ) {
            this.logger.info( "createProperty", nodeID, propertyName, propertyValue );
            return vwf.createProperty( nodeID, propertyName, propertyValue );
        },

        // TODO: deleteProperty

        // -- setProperty --------------------------------------------------------------------------

        setProperty: function( nodeID, propertyName, propertyValue ) {
            this.logger.info( "setProperty", nodeID, propertyName, propertyValue );
            return vwf.setProperty( nodeID, propertyName, propertyValue );
        },

        // -- getProperty --------------------------------------------------------------------------

        getProperty: function( nodeID, propertyName, propertyValue ) {
            this.logger.info( "getProperty", nodeID, propertyName, propertyValue );
            return vwf.getProperty( nodeID, propertyName, propertyValue );
        },

        // -- createMethod -------------------------------------------------------------------------

        createMethod: function( nodeID, methodName ) {
            this.logger.info( "createMethod", nodeID, methodName );
            return vwf.createMethod( nodeID, methodName );
        },

        // TODO: deleteMethod

        // -- callMethod ---------------------------------------------------------------------------

        callMethod: function( nodeID, methodName ) { // TODO: parameters
            this.logger.info( "callMethod", nodeID, methodName ); // TODO: parameters
            return vwf.callMethod( nodeID, methodName ); // TODO: parameters
        },
    
        // TODO: createEvent, deleteEvent, addEventListener, removeEventListener, fireEvent

        // -- execute ------------------------------------------------------------------------------

        execute: function( nodeID, scriptText, scriptType ) {
            this.logger.info( "execute", nodeID, ( scriptText || "" ).substring( 0, 100 ), scriptType );
            return vwf.execute( nodeID, scriptText, scriptType );
        },

        // -- time ---------------------------------------------------------------------------------

        time: function() {
            // this.logger.debug( "time", "" );
            return vwf.time();
        },

        // == Response API =========================================================================

        // Calls from the manager to a deriving model are notifications, informing of change. These
        // calls are the response half of the API.

        // For models, responses are where work is actually performed, and response implementations may
        // generate additional stimulus calls. (In contrast, views generally transfer data outward, away
        // from the simulation when handling a response.)

        // Each of these implementations provides the default, null response. A deriving model only
        // needs to implement the response handlers that it needs for its work. These will handle the
        // rest.

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
            this.logger.info( "creatingNode", nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType );
        },

        // TODO: deletingNode

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {
            this.logger.info( "addingChild", nodeID, childID, childName );
        },

        // -- removingChild ------------------------------------------------------------------------

        removingChild: function( nodeID, childID ) {
            this.logger.info( "removingChild", nodeID, childID );
        },

        // -- parenting ----------------------------------------------------------------------------

        parenting: function( nodeID ) {
            this.logger.info( "parenting", nodeID );
        },

        // -- childrening --------------------------------------------------------------------------

        childrening: function( nodeID ) {
            this.logger.info( "childrening", nodeID );
        },

        // -- naming -------------------------------------------------------------------------------

        naming: function( nodeID ) {
            this.logger.info( "naming", nodeID );
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            this.logger.info( "creatingProperty", nodeID, propertyName, propertyValue );
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
            this.logger.info( "settingProperty", nodeID, propertyName, propertyValue );
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            this.logger.info( "gettingProperty", nodeID, propertyName, propertyValue );
        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName ) {
            this.logger.info( "creatingMethod", nodeID, methodName );
        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName ) { // TODO: parameters
            this.logger.info( "callingMethod", nodeID, methodName ); // TODO: parameters
        },

        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ----------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {
            this.logger.info( "executing " + nodeID,
                ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ), scriptType );
        },

    };

} );
