( function( modules ) {

    console.info( "loading vwf.model" );

    var module = modules.model = function( vwf ) {

        if ( ! vwf ) return;

        console.info( "creating vwf.model" );

        this.vwf = vwf;

        return this;
    };

    // == Stimulus API =============================================================================

    // -- createNode -------------------------------------------------------------------------------

    module.prototype.createNode = function( component_uri_or_object, callback ) {
        console.info( "vwf.model.createNode " + component_uri_or_object )
        return this.vwf.createNode( component_uri_or_object, callback );
    };

    // -- setProperty ------------------------------------------------------------------------------

    module.prototype.setProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.model.setProperty " + nodeID + " " + propertyName + " " + propertyValue );
        return this.vwf.setProperty( nodeID, propertyName, propertyValue );
    };

    // -- getProperty ------------------------------------------------------------------------------

    module.prototype.getProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.model.getProperty " + nodeID + " " + propertyName + " " + propertyValue );
        return this.vwf.getProperty( nodeID, propertyName, propertyValue );
    };

    // == Response API =============================================================================

    // -- creatingNode -----------------------------------------------------------------------------

    module.prototype.creatingNode = function( nodeID, nodeName, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
        console.info( "vwf.model.creatingNode " + nodeID + " " +  nodeName + " " +  nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );
    };

    // -- settingProperty --------------------------------------------------------------------------

    module.prototype.settingProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.model.settingProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // -- gettingProperty --------------------------------------------------------------------------

    module.prototype.gettingProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.model.gettingProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

} ) ( window.vwf.modules );
