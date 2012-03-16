"use strict";
define( [ "module", "vwf/model" ], function( module, model ) {

    return model.load( module, {

        // == Module Definition ====================================================================

        modelize: function( model, model_api ) {

            this.model = model;

            // Suppress functions that aren't implemented in the stage to the right.

            Object.keys( model_api ).forEach( function( modelFunctionName ) {
                if ( ! model[modelFunctionName] ) {
                    this[modelFunctionName] = undefined;
                }
            }, this );

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
