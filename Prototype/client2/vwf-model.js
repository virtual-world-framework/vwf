( function( modules ) {

console.info( "loading vwf.model" );

    var module = modules.model = function( vwf ) {

        if ( ! vwf ) return;
        
console.info( "creating vwf.model" );

        this.vwf = vwf;

        return this;
    };

    // -- xxx --------------------------------------------------------------------------------------

    module.prototype.createNode = function( component_uri_or_object, callback ) {
console.info( "vwf.model.createNode " + component_uri_or_object )
        return this.vwf.createNode( component_uri_or_object, callback );
    };

    // -- xxx --------------------------------------------------------------------------------------

    module.prototype.constructing = function( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType ) {
console.info( "vwf.model.constructing " + nodeID + " " +  nodeName + " " +  nodeExtends + " " +  nodeImplements + " " +  nodeSource + " " +  nodeType );
        return undefined;
    };

} ) ( window.vwf.modules );
