( function( modules ) {

    console.info( "loading vwf.model.scenejs" );

    var module = modules.scenejs = function( vwf ) {

        if ( ! vwf ) return;

        console.info( "creating vwf.model.scenejs" );

        modules.model.call( this, vwf );

        return this;
    };

    module.prototype = new modules.model();

    // -- creatingNode -----------------------------------------------------------------------------

    module.prototype.creatingNode = function( nodeID, nodeName, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
        console.info( "vwf.model.scenejs.creatingNode " + nodeID + " " +  nodeName + " " +  nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );
    };

    // -- settingProperty --------------------------------------------------------------------------

    module.prototype.settingProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.model.scenejs.settingProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // -- gettingProperty --------------------------------------------------------------------------

    module.prototype.gettingProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.model.scenejs.gettingProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

} ) ( window.vwf.modules );
