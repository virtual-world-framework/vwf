define( [ "vwf-model", "module" ], function( model, module ) {

    // vwf-model-object.js is a backstop property store.

    return model.register( module, {

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {

            this.logger.info( "creatingProperty", nodeID, propertyName, propertyValue );

            var object = this.private.objects[nodeID] || ( this.private.objects[nodeID] = {} );

            return object[propertyName] = propertyValue;
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            this.logger.info( "settingProperty", nodeID, propertyName, propertyValue );

            var object = this.private.objects[nodeID] || ( this.private.objects[nodeID] = {} );

            return object[propertyName] = propertyValue;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            this.logger.info( "gettingProperty", nodeID, propertyName, propertyValue );

            var object = this.private.objects[nodeID];

            return object && object[propertyName];
        },

        // == Private ==============================================================================

        private: {
            objects: {} // maps id => { property: value, ... }
        }

    } );

} );
