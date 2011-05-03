( function( modules ) {

    console.info( "loading vwf.view.glge" );

    // vwf-view-glge.js is a placeholder for an GLGE WebGL view of the scene.
    //
    // vwf-view-glge is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern).
    // It attaches to the vwf modules list as vwf.modules.glge.

    var module = modules.glge = function( vwf, rootSelector ) {

        if ( ! vwf ) return;

        console.info( "creating vwf.view.glge" );

        modules.view.call( this, vwf );

        this.rootSelector = rootSelector;

        this.scenes = {}; // id => { document: new GLGE.Document(), renderer: new GLGE.Renderer(), scene: new GLGE.Scene() }

        jQuery( rootSelector ).append( "<h2>Scene</h2>" );
        jQuery( rootSelector ).append( "<canvas id='canvas' width='900' height='500'/>" );
        jQuery( rootSelector ).append( "<div id='debug' style='padding: 5px'/>" );

        return this;
    };

    // Delegate any unimplemented functions to vwf-view.

    module.prototype = new modules.view();

    // == Response API =============================================================================

    // This is a placeholder for maintaining a view of the changing state of the simulation using
    // nested HTML block elements.

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {

        console.info( "vwf.view.glge.createdNode " + nodeID + " " +
            nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );

        if ( nodeSource && nodeType == "model/x-glge" /* nodeExtendsID == 9 */ ) {  // TODO: glge: scene : node2 type

            var scene = this.scenes[nodeID] = {
                document: new GLGE.Document(),
                renderer: undefined,
                scene: undefined
            };

var view = this;

            scene.document.onLoad = function() {
                scene.renderer = new GLGE.Renderer( jQuery( view.rootSelector ).find( "#canvas" ).get(0) );
                scene.scene = scene.document.getElement( "mainscene" );
                scene.renderer.setScene( scene.scene );
                function render() { scene.renderer.render() }
                setInterval( render, 1 );
            };

            if ( nodeSource && nodeType == "model/x-glge" ) {
                scene.document.load( nodeSource );  // TODO: else onLoad now?  // TODO: adjust relative paths?
            }

        }

    };

    // TODO: deletedNode

    // -- addedChild -------------------------------------------------------------------------------

    module.prototype.addedChild = function( nodeID, childID, childName ) {

        console.info( "vwf.view.glge.addedChild " + nodeID + " " + childID + " " + childName );

    };

    // -- removedChild -----------------------------------------------------------------------------

    module.prototype.removedChild = function( nodeID, childID ) {

        console.info( "vwf.view.glge.removedChild " + nodeID + " " + childID );

    };

    // -- createdProperty --------------------------------------------------------------------------

    module.prototype.createdProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.view.glge.createdProperty " + nodeID + " " + propertyName + " " + propertyValue );

    };

    // TODO: deletedProperty

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.view.glge.satProperty " + nodeID + " " + propertyName + " " + propertyValue );

    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.view.glge.gotProperty " + nodeID + " " + propertyName + " " + propertyValue );

    };

} ) ( window.vwf.modules );
