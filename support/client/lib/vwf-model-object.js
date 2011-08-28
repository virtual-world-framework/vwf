( function( modules ) {

    console.info( "loading vwf.model.object" );

    // vwf-model-object.js is a backstop property store.

    var module = modules.object = function( vwf ) {

        if ( ! vwf ) return;

        console.info( "creating vwf.model.object" );

        modules.model.call( this, vwf );

        return this;
    };

    // Delegate any unimplemented functions to vwf-model.

    module.prototype = new modules.model();

    // == Private variables ====================================================================

    this.private = {}; // for debugging

    var objects = this.private.objects = {}; // ID => { property: value, ... }

    // == Response API =============================================================================

    // -- creatingProperty -------------------------------------------------------------------------

    module.prototype.creatingProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.model.object.creatingProperty " + nodeID + " " + propertyName + " " + propertyValue );
        var object = objects[nodeID] || ( objects[nodeID] = {} );
        return object[propertyName] = propertyValue;
    };

    // -- settingProperty --------------------------------------------------------------------------

    module.prototype.settingProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.model.object.settingProperty " + nodeID + " " + propertyName + " " + propertyValue );
        var object = objects[nodeID] || ( objects[nodeID] = {} );
        return object[propertyName] = propertyValue;
    };

    // -- gettingProperty --------------------------------------------------------------------------

    module.prototype.gettingProperty = function( nodeID, propertyName, propertyValue ) {
        console.info( "vwf.model.object.gettingProperty " + nodeID + " " + propertyName + " " + propertyValue );
        var object = objects[nodeID];
        return object && object[propertyName];
    };

} ) ( window.vwf.modules );
