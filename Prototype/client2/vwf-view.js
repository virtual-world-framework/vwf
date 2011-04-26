( function( modules ) {

console.info( "loading vwf.view" );

    var module = modules.view = function( vwf ) {

        if ( ! vwf ) return;
        
console.info( "creating vwf.view" );

        this.vwf = vwf;

        return this;
    };

    // -- xxx --------------------------------------------------------------------------------------

    module.prototype.createNode = function( component_uri_or_object, callback ) {
console.info( "vwf.view.createNode " + component_uri_or_object )
// .. send to socket ..
        return this.vwf.createNode( component_uri_or_object, callback );
    };

    // -- xxx --------------------------------------------------------------------------------------

    module.prototype.constructed = function( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType ) {
console.info( "vwf.view.constructed " + nodeID + " " +  nodeName + " " +  nodeExtends + " " +  nodeImplements + " " +  nodeSource + " " +  nodeType );
        return undefined;
    };

} ) ( window.vwf.modules );
