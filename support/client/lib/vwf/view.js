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

/// vwf/view.js is the common implementation of all Virtual World Framework views. Views
/// interpret information from the simulation, present it to the user, and accept user input
/// influencing the simulation.
///
/// Views are outside of the simulation. Unlike models, they may accept external input--such as
/// pointer and key events from a user--but may only affect the simulation indirectly through the
/// synchronization server.
/// 
/// vwf/view and all deriving views are loaded as RequireJS (http://requirejs.org) modules.
/// 
/// @module vwf/view
/// @requires logger
/// @requires vwf/api/kernel
/// @requires vwf/api/view

define( [ "module", "logger", "vwf/api/kernel", "vwf/api/view" ], function( module, logger, kernel_api, view_api ) {

    // TODO: most of this is the same between vwf/model.js and vwf/view.js. Find a way to share.

    var label = module.id.replace( /\//g, "." );

    logger.for( label ).debug( "loading" );

    var exports = {

        module: module,

        logger: logger.for( label ),

        load: function( module, initializer, viewGenerator, kernelGenerator ) {

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

            viewGenerator && Object.keys( view_api ).forEach( function( viewFunctionName ) {
                if ( ! instance.hasOwnProperty( viewFunctionName ) ) {
                    instance[viewFunctionName] = viewGenerator.call( instance, viewFunctionName );
                    instance[viewFunctionName] || delete instance[viewFunctionName];
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

        create: function( kernel, view, stages, state, parameters ) {

            this.logger.debug( "creating" );

            // Interpret create( kernel, stages, ... ) as create( kernel, undefined, stages, ... )

            if ( view && view.length !== undefined ) { // is an array?
                parameters = state;
                state = stages;
                stages = view;
                view = undefined;
            }

            // Append this driver's stages to the pipeline to be placed in front of this driver.

            if ( ! view ) {
                stages = Array.prototype.concat.apply( [], ( this.pipeline || [] ).map( function( stage ) {
                    return ( stages || [] ).concat( stage );
                } ) ).concat( stages || [] );
            } else {
                stages = ( stages || [] ).concat( this.pipeline || [] );
            }

            // Create the driver stage using its module as its prototype.

            var instance = Object.create( this );

            // Attach the reference to the stage to the right through the view API.

            viewize.call( instance, view, view_api );

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

            // Call viewize() on the driver.

            function viewize( view, view_api ) {
                Object.getPrototypeOf( this ) && viewize.call( Object.getPrototypeOf( this ), view, view_api ); // depth-first recursion through the prototypes
                this.hasOwnProperty( "viewize" ) && this.viewize.call( instance, view, view_api ); // viewize() from the bottom up
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

            if ( ! view ) {
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
