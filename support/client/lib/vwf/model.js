define( [ "module", "vwf/api/kernel", "vwf/api/model", "vwf-proxy" ], function( module, kernel_api, model_api ) {  // TODO: remove explicit reference to vwf / require( "vwf-proxy" )

    // vwf/model.js is the common implementation of all Virtual World Framework models. Each model
    // is part of a federation with other models attached to the simulation that implements part of
    // the greater model. Taken together, the models create the entire model system for the
    // simulation.
    //
    // Models are inside of, and directly part of the simulation. They may control the simulation
    // and cause immediate change, but they cannot accept external input. The model configuration is
    // identical for all participants in a shared world.
    // 
    // A given model might be responsible for a certain subset of nodes in the the simulation, such
    // as those representing Flash objects. Or it might implement part of the functionality of any
    // node, such as translating 3-D transforms and material properties back and forth to a scene
    // manager. Or it might implement functionality that is only active for a short period, such as
    // importing a document.
    // 
    // vwf/model and all deriving models are loaded as RequireJS (http://requirejs.org) modules.

    // TODO: most of this is the same between vwf/model.js and vwf/view.js. Find a way to share.

    var logger = require( "vwf-proxy" ).logger_for( module.id.replace( /\//g, "." ) );  // TODO: remove explicit reference to vwf / require( "vwf-proxy" )
    logger.info( "load" );

    return {

        module: module,

        logger: logger,

        load: function( module, initializer, kernelGenerator, modelGenerator ) {

            var instance = Object.create( this );

            instance.module = module;
            instance.logger = require( "vwf-proxy" ).logger_for( instance.module.id.replace( /\//g, "." ) );  // TODO: remove explicit reference to vwf / require( "vwf-proxy" )
            
            instance.logger.info( "load" );

            if ( typeof initializer == "function" || initializer instanceof Function ) {
                initializer = initializer();
            }

            for ( var key in initializer ) {
                instance[key] = initializer[key]; 
            }

            kernelGenerator && Object.keys( kernel_api ).forEach( function( kernelFunctionName ) {
                instance[kernelFunctionName] = kernelGenerator.call( instance, kernelFunctionName ); // TODO: ignore if undefined
            } );

            modelGenerator && Object.keys( model_api ).forEach( function( modelFunctionName ) {
                instance[modelFunctionName] = modelGenerator.call( instance, modelFunctionName ); // TODO: ignore if undefined
            } );
                
            return instance;
        },

        create: function( kernel, model, stages, state ) {  // TODO: configuration parameters

            this.logger.info( "create" );

            // Interpret create( kernel, stages, state ) as create( kernel, undefined, stages, state )

            if ( model && model.length !== undefined ) {
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

            initialize.call( instance );  // TODO: configuration parameters

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

            function initialize() {
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

} );
