( function( modules ) {

console.info( "loading vwf.model.scenejs" );

    var module = modules.scenejs = function( vwf ) {

        if ( ! vwf ) return;

console.info( "creating vwf.model.scenejs" );

        modules.model.call( this, vwf );

        return this;
    };

    module.prototype = new modules.model();

    // -- xxx --------------------------------------------------------------------------------------

    module.prototype.constructing = function( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType ) {
console.info( "vwf.model.scenejs.constructing " + nodeID + " " +  nodeName + " " +  nodeExtends + " " +  nodeImplements + " " +  nodeSource + " " +  nodeType );
        return undefined;
    };

} ) ( window.vwf.modules );
