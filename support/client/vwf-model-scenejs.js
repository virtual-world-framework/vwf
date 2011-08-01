( function( modules, namespace ) {

    console.info( "loading " + namespace );

    // vwf-model-scenejs.js is a placeholder for a 3-D scene manager.
    //
    // vwf-model is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern). It
    // attaches to the vwf modules list as vwf.modules.scenejs.

    var module = modules[namespace.split(".").pop()] = function( vwf ) {

        if ( ! vwf ) return;

        console.info( "creating " + namespace );

        modules.model.call( this, vwf );
        this.namespace = namespace;

    };

    // Delegate any unimplemented functions to vwf-model.

    module.prototype = new modules.model();

    // == Response API =============================================================================

    // This is a placeholder for connecting to the SceneJS WebGL scene manager.

    // -- creatingNode -----------------------------------------------------------------------------

    module.prototype.creatingNode = function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
        console.info( namespace + ".creatingNode " + nodeID + " " + 
            nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );
    };

    // -- settingProperty --------------------------------------------------------------------------

    module.prototype.settingProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( namespace + ".settingProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

    // -- gettingProperty --------------------------------------------------------------------------

    module.prototype.gettingProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( namespace + ".gettingProperty " + nodeID + " " + propertyName + " " + propertyValue );
    };

} ) ( window.vwf.modules, "vwf.model.scenejs" );
