( function( modules ) {

    console.info( "loading vwf.view.html" );

    var module = modules.html = function( vwf ) {

        if ( ! vwf ) return;

        console.info( "creating vwf.view.html" );

        modules.view.call( this, vwf );

        return this;
    };

    module.prototype = new modules.view();

    // == Response API =============================================================================

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function( nodeID, nodeName, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
        console.info( "vwf.view.html.createdNode " + nodeID + " " +  nodeName + " " +  nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );
    };

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.view.html.satProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

} ) ( window.vwf.modules );
