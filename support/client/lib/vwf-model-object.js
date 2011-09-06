( function( modules, namespace ) {

    window.console && console.info && console.info( "loading " + namespace );

    // vwf-model-object.js is a backstop property store.

    var module = modules[namespace.split(".").pop()] = function( vwf ) {

        if ( ! vwf ) return;

        vwf.logger.info( "creating " + namespace );

        modules.model.call( this, vwf );
        this.namespace = namespace;

        this.objects = {}; // maps id => { property: value, ... }

    };

    // Delegate any unimplemented functions to vwf-model.

    module.prototype = new modules.model();

    // == Response API =============================================================================

    // -- creatingProperty -------------------------------------------------------------------------

    module.prototype.creatingProperty = function( nodeID, propertyName, propertyValue ) {

        vwf.logger.info( namespace + ".creatingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var object = this.objects[nodeID] || ( this.objects[nodeID] = {} );

        return object[propertyName] = propertyValue;
    };

    // -- settingProperty --------------------------------------------------------------------------

    module.prototype.settingProperty = function( nodeID, propertyName, propertyValue ) {

        vwf.logger.info( namespace + ".settingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var object = this.objects[nodeID] || ( this.objects[nodeID] = {} );

        return object[propertyName] = propertyValue;
    };

    // -- gettingProperty --------------------------------------------------------------------------

    module.prototype.gettingProperty = function( nodeID, propertyName, propertyValue ) {

        vwf.logger.info( namespace + ".gettingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var object = this.objects[nodeID];

        return object && object[propertyName];
    };

} ) ( window.vwf.modules, "vwf.model.object" );
