define( [ "module", "vwf/model" ], function( module, model ) {

    // vwf/model/object.js is a backstop property store.

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.objects = {}; // maps id => { property: value, ... }
        },

        // == Model API ============================================================================

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            var object = this.objects[nodeID] || ( this.objects[nodeID] = {} );
            return object[propertyName] = propertyValue;
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
            var object = this.objects[nodeID] || ( this.objects[nodeID] = {} );
            return object[propertyName] = propertyValue;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            var object = this.objects[nodeID];
            return object && object[propertyName];
        }

    } );

} );
