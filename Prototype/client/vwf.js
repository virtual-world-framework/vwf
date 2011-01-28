// Suffix notes:
//   - Query: jQuery selection
//   - Selector: jQuery selector string
//   - HTML: HTML-encoded text
//   - JSON: JSON-encoded text

( function( window ) {

    var VirtualWorldFramework = new function() {

        var vwf = this;

        vwf.socket = undefined;
        vwf.internal = 0;

        var engines = [];

        var rootID = 0, lastID = undefined;

        // deleteNode, addChild, removeChild, moveChild, createProperty, deleteProperty, method, event, ...

        // With no arguments, the world is empty unless it is specified in the URI. Use the default
        // shard configurations.

        //   vwf.initialize()

        // Specify a world using a URI or a configuration object. Use the default shard
        // configurations.

        //   vwf.initialize( "http://example.com/path/to/world" )
        //   vwf.initialize( { properties: { worldconfig: value } } )

        // Specify one or more shard configurations, but don't specify a world.

        //   vwf.initialize( { html: [ "html shard arguments", ... ],
        //     webgl: [ "webgl shard arguments", ... ], ... } )

        // Specify a world using either a URI or a configuration object and specify shard
        // configurations.

        //   vwf.initialize( "http://example.com/path/to/world",
        //     { html: [ "html shard arguments", ... ],
        //       webgl: [ "webgl shard arguments", ... ], ... } )

        //   vwf.initialize( { properties: { worldconfig: value } },
        //     { html: [ "html shard arguments", ... ],
        //       webgl: [ "webgl shard arguments", ... ], ... } )

        this.initialize = function( /* [ worldURI|worldObject, ] [ shardArguments ] */ ) {

            var args = Array.prototype.slice.call( arguments );

            // Get the world specification if one is provided in the query string. Parse it into a
            // world specification object if it's valid JSON, otherwise keep the query string and
            // assume it's a URI.

            var world = jQuery.getQueryString( "world" );

            try { world = jQuery.parseJSON( world ) || world || {}; } catch( e ) { }

            // Parse the function arguments. The first parameter is a world specification if there
            // are two or more parameters, it's a string, or it's an object with the right keys.
            // Otherwise, fall back to whatever was in the query string.

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
                shardArguments.webgl && vwf.addEngine( vwf.webgl.apply( new vwf.webgl(), [ vwf ].concat( shardArguments.webgl || [] ) ) );
                vwf.addEngine( vwf.html.apply( new vwf.html(), [ vwf ].concat( shardArguments.html || [] ) ) );
                vwf.addEngine( vwf.js.apply( new vwf.js(), [ vwf ].concat( shardArguments.js || [] ) ) );
                vwf.ready( world );
            } );

        }; // initialize

        this.ready = function( world ) {

            try {
                vwf.socket = new io.Socket();
            } catch ( e ) {

                var time = 0;
                vwf.tick( time );

                setInterval( function() {
                    time += 10;
                    vwf.tick( time );
                }, 10 );

            }

            if ( vwf.socket ) {

                vwf.socket.on( "connect", function() { console.log( "(client) Connected" ) } );

                vwf.socket.on( "message", function( message ) {

                    console.log( "(client) Message: " + message );

vwf.internal++;

                    var time_node_statement = message.split( " " );

                    var time = Number( time_node_statement[0] ) || 0;
                    var node = time_node_statement[1]; // may be undefined
                    var property_value = ( time_node_statement[2] || "" ).split( "=" );

                    var property = property_value[0];
                    var value = property_value[1];

                    vwf.tick( time );

                    if ( node && property ) {
                        vwf.setProperty( node, property, value );
                    }

vwf.internal--;

                } );

                vwf.socket.on( "disconnect", function() { console.log( "(client) Disconnected" ) } );

                vwf.socket.connect();

            }

            if ( typeof world == "string" || world instanceof String ) {

                jQuery.ajax( {
                    url: world,
                    dataType: "jsonp",
                    jsonpCallback: "cb", // use statically-defined callback=cb with static js files until JSON provider can do JSONP
                    success: function( json ) { vwf.load( json ) }
                } );

            } else {

                vwf.load( world );

            }

        }; // ready

        this.load = function( json, parentID ) {

            if ( parentID == undefined ) {

                parentID = rootID;

                vwf.createNode( undefined,
                    json.extends, json.implements && [].concat( json.implements ),
                    json.source, json.type, undefined );

            }

            if ( json ) {

                json.properties && jQuery.each( json.properties, function( index, valueJSON ) {
                    vwf.createProperty( parentID, index, valueJSON );
                } );

                json.methods && jQuery.each( json.methods, function( index, valueJSON ) {
                    vwf.createMethod( parentID, index );
                } );

                json.events && jQuery.each( json.events, function( index, valueJSON ) {
                    vwf.createEvent( parentID, index );
                } );

                json.children && jQuery.each( json.children, function( index, valueJSON ) {
                    vwf.load( valueJSON, vwf.createNode( index,
                        valueJSON.extends, valueJSON.implements && [].concat( valueJSON.implements ),
                        valueJSON.source, valueJSON.type, parentID )
                    );
                } );

                json.scripts && jQuery.each( json.scripts, function( index, valueJSON ) {
valueJSON.text && // TODO: external scripts too
                    vwf.execute( parentID, valueJSON.text, valueJSON.type );
                } );

            }

        }; // load
        
        this.addEngine = function( engine ) {
            engines.unshift( engine );
        };

        this.createNode = function( nodeName, nodeExtends, nodeImplements, nodeSource, nodeType, parentID ) {

            var nodeID = ( lastID == undefined ? ( lastID = rootID ) : ++lastID );

            console.info( "VirtualWorldFramework onConstruct " + vwf.internal + " " + nodeID + " " +
                nodeName + " " + nodeExtends + " " + nodeImplements + " " + nodeSource + " " + nodeType );

            jQuery.each( engines, function( index, engine ) {
                engine.onConstruct && engine.onConstruct( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType );
            } );

            if ( nodeID != rootID ) {
                parentID = parentID || rootID;
                this.addChild( parentID, nodeID );
            }

            return nodeID;
        };

        this.addChild = function( nodeID, childID ) {

            console.info( "VirtualWorldFramework onChildAdded " + vwf.internal + " " + nodeID + " " + childID );

            jQuery.each( engines, function( index, engine ) {
                engine.onChildAdded && engine.onChildAdded( nodeID, childID );
            } );

        };

        this.createProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "VirtualWorldFramework onCreateProperty " + vwf.internal + " " + nodeID + " " + propertyName + " " + propertyValue );

vwf.internal++;

            jQuery.each( engines, function( index, engine ) {
                engine.onCreateProperty && engine.onCreateProperty( nodeID, propertyName, propertyValue );
            } );

vwf.internal--;

            return propertyValue;
        };

        this.setProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "VirtualWorldFramework onSetProperty " + vwf.internal + " " + nodeID + " " + propertyName + " " + propertyValue );

            if ( vwf.internal == 0 && vwf.socket )
                vwf.socket.send( "0 " + nodeID + " " + propertyName  + "=" + propertyValue );
            else {
                
vwf.internal++;

                jQuery.each( engines, function( index, engine ) {
                    engine.onSetProperty && engine.onSetProperty( nodeID, propertyName, propertyValue );
                } );

vwf.internal--;

        }

            return propertyValue;
        };

        this.getProperty = function( nodeID, propertyName ) {

            console.info( "VirtualWorldFramework onGetProperty " + vwf.internal + " " + nodeID + " " + propertyName );

            var propertyValue = undefined;

            jQuery.each( engines, function( index, engine ) {
                var v = engine.onGetProperty && engine.onGetProperty( nodeID, propertyName );
                propertyValue = v != undefined ? v : propertyValue;
            } );

            return propertyValue;
        };

        this.createMethod = function( nodeID, methodName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onCreateMethod && engine.onCreateMethod( nodeID, methodName );
            } );

        };

        this.callMethod = function( nodeID, methodName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onCallMethod && engine.onCallMethod( nodeID, methodName );
            } );

        };

        this.createEvent = function( nodeID, eventName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onCreateEvent && engine.onCreateEvent( nodeID, eventName );
            } );

        };

        this.fireEvent = function( nodeID, eventName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onFireEvent && engine.onFireEvent( nodeID, eventName );
            } );

        };

        this.execute = function( nodeID, scriptText, scriptType ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onExecute && engine.onExecute( nodeID, scriptText, scriptType );
            } );

        };

        this.tick = function( time ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onTick && engine.onTick( time );
            } );

        };

    };

    return window.vwf = VirtualWorldFramework;

} ) ( window );







// From http://stackoverflow.com/questions/901115/get-querystring-values-with-jquery/2880929#2880929
// and http://stackoverflow.com/questions/901115/get-querystring-values-with-jquery/3867610#3867610.

jQuery.extend( {

    getQueryString: function( name ) {

        function parseParams() {
            var params = {},
                e,
                a = /\+/g, // regex for replacing addition symbol with a space
                r = /([^&;=]+)=?([^&;]*)/g,
                d = function( s ) { return decodeURIComponent( s.replace(a, " ") ); },
                q = window.location.search.substring(1);

            while ( e = r.exec(q) )
                params[ d(e[1]) ] = d(e[2]);

            return params;
        }

        if ( !this.queryStringParams )
            this.queryStringParams = parseParams();

        return this.queryStringParams[name];

    } // getQueryString

} );



// changed
// 0 function (nnew, old) { alert( "changed " + nnew + " " + old );}
// 
// changing
// 0 function (nnew, old) { alert( "changing " + nnew + " " + old );}
// 
