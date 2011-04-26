( function( modules ) {

    console.info( "loading vwf.view.html" );

    // vwf-view-html.js is a placeholder for an HTML view of the simulation state. It is a stand-in
    // for any number of potential UI elements, including WebGL renderings, traditional UI controls,
    // and connections to external services.
    //
    // vwf-view is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern). It
    // attaches to the vwf modules list as vwf.modules.html.

    var module = modules.html = function( vwf ) {

        if ( ! vwf ) return;

        console.info( "creating vwf.view.html" );

        modules.view.call( this, vwf );

        return this;
    };

    // Delegate any unimplemented functions to vwf-view.

    module.prototype = new modules.view();

    // == Response API =============================================================================

    // This is a placeholder for maintaining a view of the changing state of the simulation using
    // nested HTML block elements.

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function( nodeID, nodeName, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
        console.info( "vwf.view.html.createdNode " + nodeID + " " +  nodeName + " " +  nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );
    };

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.view.html.satProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

} ) ( window.vwf.modules );
