define( [ "vwf-model", "module" ], function( model, module ) {

    // vwf-model-scenejs.js is a placeholder for a 3-D scene manager.

    return model.register( module, {

        // This is a placeholder for connecting to the SceneJS WebGL scene manager.

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {
            this.logger.info( "creatingNode", nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType );
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
            this.logger.info( "settingProperty", nodeID, propertyName, propertyValue );
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            this.logger.info( "gettingProperty", nodeID, propertyName, propertyValue );
        },

    } );

} );
