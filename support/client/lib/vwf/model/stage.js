define( [ "module", "vwf/model" ], function( module, model ) {

    return model.load( module, {

        // == Module Definition ====================================================================

        initialize: function( kernel, model ) {
            this.model = model;
        },
        
    }, function( kernel_function ) {

        // == Kernel API ===========================================================================

        return function() {  // TODO: possible to return this.kernel[kernel_function] instead for passthrough?
            return this.kernel[kernel_function].apply( this.kernel, arguments );
        };
        
    }, function( model_function ) {
        
        // == Model API ============================================================================

        return function() {  // TODO: possible to return this.model[model_function] instead for passthrough?
            return this.model[model_function] && this.model[model_function].apply( this.model, arguments );
        };

    } );

} );
