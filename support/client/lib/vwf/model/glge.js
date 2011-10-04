define( [ "module", "vwf/model" ], function( module, model ) {

    // vwf/model/glge.js is an interface to the GLGE WebGL scene manager.

    // For historical reasons yet to be resolved, the GLGE model code currently resides in
    // vwf-view.glge.js intermixed with the view code. This driver is a gross hack to delegate model
    // calls to the appropriate parts of the GLGE view.

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.glge_view = undefined;
        },

        // == Model API ============================================================================

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.glge_view || ( this.glge_view = find_glge_view( this.kernel ) ) ) {
                // if ( propertyName != "playing" && propertyName != "looping" && propertyName != "speed" ) { // vwf-view-glge expects to vwf.getProperty() on these to get to default property settings
                if ( propertyName == "vertices" || propertyName == "vertexIndices" ) { // only proxy the large physics-related properties now; don't get from glge what we also aren't setting into glge, otherwise initialized values aren't recognized
                    return this.glge_view.gotProperty( nodeID, propertyName, propertyValue );
                }
            }

        },

    } );

    // -- find_glge_view ---------------------------------------------------------------------------

    function find_glge_view( kernel ) {

        // Walk the pipeline backwards to the kernel.

        while ( kernel.kernel ) {
            kernel = kernel.kernel;
        }

        // Locate the GLGE view in the kernel's view list.

        return kernel.views.reduce( function( dummy, view ) {
            return view.namespace == "vwf.view.glge" ? view : undefined;
        }, undefined );

    }

} );
