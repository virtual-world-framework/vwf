( function( modules ) {

    console.info( "loading vwf.view" );

    var module = modules.view = function( vwf ) {

        if ( ! vwf ) return;
        
        console.info( "creating vwf.view" );

        this.vwf = vwf;

        return this;
    };

    // == Stimulus API =============================================================================

    // -- createNode -------------------------------------------------------------------------------

    module.prototype.createNode = function( component_uri_or_object ) {
        console.info( "vwf.view.createNode " + component_uri_or_object );
        this.vwf.send( undefined, "createNode", component_uri_or_object );
    };

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

    // == Response API =============================================================================

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function( nodeID, nodeName, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
        console.info( "vwf.view.createdNode " + nodeID + " " +  nodeName + " " +  nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );
    };

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.view.satProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.view.gotProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

} ) ( window.vwf.modules );
