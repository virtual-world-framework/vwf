define( [ "module", "vwf/model" ], function( module, model ) {

    // vwf/model/test.js is a dummy driver used for tests.

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.arguments = Array.prototype.slice.call( arguments );
        },

    } );

} );
