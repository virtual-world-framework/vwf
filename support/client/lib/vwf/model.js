define( [ "module", "vwf-proxy" ], function( module ) {  // TODO: remove explicit reference to vwf / require( "vwf-proxy" )

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

    var kernel_functions = [  // TODO: get this list from vwf
        "createNode", /* TODO: deleteNode, */
        "addChild", "removeChild", "parent", "children", "name",
        "createProperty", /* TODO: deleteProperty, */ "setProperty", "getProperty",
        "createMethod", /* TODO: deleteMethod, */ "callMethod",
        /* TODO: createEvent, deleteEvent, addEventListener, removeEventListener, fireEvent, */
        "execute",
        "time",
    ];

    var model_functions = [  // TODO: get this list from vwf
        "creatingNode", /* TODO: deletingNode, */
        "addingChild", "removingChild", "parenting", "childrening", "naming",
        "creatingProperty", /* TODO: deletingProperty, */ "settingProperty", "gettingProperty",
        "creatingMethod", /* TODO: deletingMethod, */ "callingMethod",
        /* TODO: creatingEvent, deletingEvent, firingEvent, */
        "executing",
        "ticking",
    ];

    var logger = require( "vwf-proxy" ).logger_for( module.id.replace( /\//g, "." ) );  // TODO: remove explicit reference to vwf / require( "vwf-proxy" )
    logger.info( "load" );

    return {

        module: module,
        logger: logger,

        load: function( module, initializer, kernel_generator, model_generator ) {

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

            if ( kernel_generator ) {

                kernel_functions.forEach( function( kernel_function ) {
                    instance[kernel_function] = kernel_generator( kernel_function );
                } );
                
            }

            if ( model_generator ) {

                model_functions.forEach( function( model_function ) {
                    instance[model_function] = model_generator( model_function );
                } );
                
            }

            return instance;
        },

        create: function( kernel, model, stages ) {

            this.logger.info( "create" );

            if ( model && model.length !== undefined ) {
                stages = model;
                model = undefined;
            }

            if ( ! model ) {
                stages = Array.prototype.concat.apply( [], ( this.pipeline || [] ).map( function( stage ) {
                    return ( stages || [] ).concat( stage );
                } ) ).concat( stages || [] );
            } else {
                stages = ( stages || [] ).concat( this.pipeline || [] );
            }

            var instance = Object.create( this );

            initialize.call( instance,
                stages.length ?
                    stages.pop().create( kernel, instance, stages ) :
                    kernel,
                model );

            function initialize( /* kernel, model */ ) {
                this.__proto__ && initialize.apply( this.__proto__, arguments ); // depth-first recursion
                this.hasOwnProperty( "initialize" ) && this.initialize.apply( instance, arguments ); // initialize() from the bottom up
            }

            if ( ! model ) {
                while ( instance.kernel !== kernel ) {
                    instance = instance.kernel;
                }
            }

            return instance;
        },

        initialize: function( kernel ) {
            this.kernel = kernel;
        },
        
    };

} );
