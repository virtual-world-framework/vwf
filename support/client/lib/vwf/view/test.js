define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/test.js is a dummy driver used for tests.

    return view.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.arguments = Array.prototype.slice.call( arguments );
        },

    } );

} );
