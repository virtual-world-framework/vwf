( function( modules ) {

console.info( "loading vwf.view.html" );

    var module = modules.html = function( vwf ) {

        if ( ! vwf ) return;

console.info( "creating vwf.view.html" );

        modules.view.call( this, vwf );

        return this;
    };

    module.prototype = new modules.view();

    // -- xxx --------------------------------------------------------------------------------------

    module.prototype.constructed = function( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType ) {
console.info( "vwf.view.html.constructed " + nodeID + " " +  nodeName + " " +  nodeExtends + " " +  nodeImplements + " " +  nodeSource + " " +  nodeType );
        return undefined;
    };

} ) ( window.vwf.modules );
