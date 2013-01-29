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

/// vwf/model.js is the common implementation of all Virtual World Framework models. Each model
/// is part of a federation with other models attached to the simulation that implements part of
/// the greater model. Taken together, the models create the entire model system for the
/// simulation.
///
/// Models are inside of, and directly part of the simulation. They may control the simulation
/// and cause immediate change, but they cannot accept external input. The model configuration is
/// identical for all participants in a shared world.
/// 
/// A given model might be responsible for a certain subset of nodes in the the simulation, such
/// as those representing Flash objects. Or it might implement part of the functionality of any
/// node, such as translating 3-D transforms and material properties back and forth to a scene
/// manager. Or it might implement functionality that is only active for a short period, such as
/// importing a document.
/// 
/// vwf/model and all deriving models are loaded as RequireJS (http://requirejs.org) modules.
/// 
/// @module vwf/model
/// @requires logger
/// @requires vwf/api/kernel
/// @requires vwf/api/model

define( [ "module", "logger", "vwf/api/kernel", "vwf/api/model" ], function( module, logger, kernel_api, model_api ) {

    // TODO: most of this is the same between vwf/model.js and vwf/view.js. Find a way to share.

    var label = module.id.replace( /\//g, "." );

    logger.for( label ).debug( "loading" );

    var exports = {

        module: module,

        logger: logger.for( label ),

        load: function( module, initializer, modelGenerator, kernelGenerator ) {

            var instance = Object.create( this );

            instance.module = module;
            instance.logger = logger.for( instance.module.id.replace( /\//g, "." ), instance );
            
            instance.logger.debug( "loading" );

            if ( typeof initializer == "function" || initializer instanceof Function ) {
                initializer = initializer();
            }

            for ( var key in initializer ) {
                instance[key] = initializer[key]; 
            }

            modelGenerator && Object.keys( model_api ).forEach( function( modelFunctionName ) {
                if ( ! instance.hasOwnProperty( modelFunctionName ) ) {
                    instance[modelFunctionName] = modelGenerator.call( instance, modelFunctionName );
                    instance[modelFunctionName] || delete instance[modelFunctionName];
                }
            } );

            kernelGenerator && Object.keys( kernel_api ).forEach( function( kernelFunctionName ) {
                if ( ! instance.hasOwnProperty( kernelFunctionName ) ) {
                    instance[kernelFunctionName] = kernelGenerator.call( instance, kernelFunctionName );
                    instance[kernelFunctionName] || delete instance[kernelFunctionName];
                }
            } );

            return instance;
        },

        create: function( kernel, model, stages, state, parameters ) {

            this.logger.debug( "creating" );

            // Interpret create( kernel, stages, ... ) as create( kernel, undefined, stages, ... )

            if ( model && model.length !== undefined ) { // is an array?
                parameters = state;
                state = stages;
                stages = model;
                model = undefined;
            }

            // Append this driver's stages to the pipeline to be placed in front of this driver.

            if ( ! model ) {
                stages = Array.prototype.concat.apply( [], ( this.pipeline || [] ).map( function( stage ) {
                    return ( stages || [] ).concat( stage );
                } ) ).concat( stages || [] );
            } else {
                stages = ( stages || [] ).concat( this.pipeline || [] );
            }

            // Create the driver stage using its module as its prototype.

            var instance = Object.create( this );

            // Attach the reference to the stage to the right through the model API.

            modelize.call( instance, model, model_api );

            // Create the pipeline to the left and attach the reference to the stage to the left
            // through the kernel API.

            kernelize.call( instance,
                stages.length ?
                    stages.pop().create( kernel, instance, stages ) :
                    kernel,
                kernel_api );

            // Attach the shared state object.

            instance.state = state || {};

            // Call the driver's initialize().

            initialize.apply( instance, parameters );

            // Call modelize() on the driver.

            function modelize( model, model_api ) {
                Object.getPrototypeOf( this ) && modelize.call( Object.getPrototypeOf( this ), model, model_api ); // depth-first recursion through the prototypes
                this.hasOwnProperty( "modelize" ) && this.modelize.call( instance, model, model_api ); // modelize() from the bottom up
            }

            // Call kernelize() on the driver.

            function kernelize( kernel, kernel_api ) {
                Object.getPrototypeOf( this ) && kernelize.call( Object.getPrototypeOf( this ), kernel, kernel_api ); // depth-first recursion through the prototypes
                this.hasOwnProperty( "kernelize" ) && this.kernelize.call( instance, kernel, kernel_api ); // kernelize() from the bottom up
            }

            // Call initialize() on the driver.

            function initialize( /* parameters */ ) {
                Object.getPrototypeOf( this ) && initialize.apply( Object.getPrototypeOf( this ), arguments ); // depth-first recursion through the prototypes
                this.hasOwnProperty( "initialize" ) && this.initialize.apply( instance, arguments ); // initialize() from the bottom up
            }

            // Return the driver stage. For the actual driver, return the leftmost stage in the
            // pipeline.

            if ( ! model ) {
                while ( instance.kernel !== kernel ) {
                    instance = instance.kernel;
                }
            }

            return instance;
        },

        kernelize: function( kernel, kernel_api ) {
            this.kernel = kernel;
        },
        
    };

    return exports;

} );
