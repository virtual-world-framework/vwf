( function( window ) {

    window.vwf = new function() {

        console.info( "vwf loading" );

        this.models = [];
        this.views = [];

        this.initialize = function( /* [ worldURI|worldObject, ] [ shardArguments ] */ ) {

            var args = Array.prototype.slice.call( arguments );

            // Parse the function arguments. The first parameter is a world specification if there
            // are two or more parameters, if it's a string, or if it's an object with the right
            // keys. Otherwise, fall back to whatever was in the query string.

            if ( args.length > 0 ) {
                if ( args.length > 1 ) {
                    world = args.shift();
                } else if ( typeof args[0] == "string" || args[0] instanceof String ) {
                    world = args.shift();
                } else if ( args[0] != null && ( typeof args[0] == "object" || args[0] instanceof Object ) &&
                        ( args[0].properties || args[0].methods || args[0].events || args[0].children || args[0].scripts ) ) {
                    world = args.shift();
                }
            }

            // Shift off the object containing arguments for the shards.

            var shardArguments = args.shift() || {};

            if ( typeof shardArguments != "object" && ! shardArguments instanceof Object )
                shardArguments = {};

            // When the document is ready, create and attach the shards and load the world.

            jQuery( window.document ).ready( function() {

                jQuery.each( vwf.models, function( model ) {
                    new model()
                } );

                // shardArguments.webgl && vwf.addEngine( vwf.webgl.apply( new vwf.webgl(), [ vwf ].concat( shardArguments.webgl || [] ) ) );
                vwf.addEngine( vwf.html.apply( new vwf.html(), [ vwf ].concat( shardArguments.html || [] ) ) );
                // vwf.addEngine( vwf.js.apply( new vwf.js(), [ vwf ].concat( shardArguments.js || [] ) ) );

                vwf.ready( world );
            } );

        }; // initialize



    };

} ) ( window );
