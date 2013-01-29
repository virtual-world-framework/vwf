"use strict";

// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

/// @module vwf/model/stage
/// @requires vwf/model

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
        
    }, function( modelFunctionName ) {
        
        // == Model API ============================================================================

        return function() {
            return this.model[modelFunctionName] && this.model[modelFunctionName].apply( this.model, arguments );
        };

    }, function( kernelFunctionName ) {

        // == Kernel API ===========================================================================

        return function() {
            return this.kernel[kernelFunctionName].apply( this.kernel, arguments );
        };
        
    } );

} );
