define( [ "module", "vwf/model" ], function( module, model ) {

    return model.load( module, {

        // == Module Definition ====================================================================

        initialize: function( kernel, model ) {
            this.model = model;
        },
        
    }, function( kernelFunctionName ) {

        // == Kernel API ===========================================================================

        return function() {  // TODO: possible to return this.kernel[kernelFunctionName] instead for passthrough?
            return this.kernel[kernelFunctionName].apply( this.kernel, arguments );
        };
        
    }, function( modelFunctionName ) {
        
        // == Model API ============================================================================

        return function() {  // TODO: possible to return this.model[modelFunctionName] instead for passthrough?
            return this.model[modelFunctionName] && this.model[modelFunctionName].apply( this.model, arguments );
        };

    } );

} );
