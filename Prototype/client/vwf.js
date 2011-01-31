// Suffix notes:
//   - Query: jQuery selection
//   - Selector: jQuery selector string
//   - HTML: HTML-encoded text
//   - JSON: JSON-encoded text

( function( window ) {

    var VirtualWorldFramework = new function() {

        var vwf = this;

        vwf.socket = undefined;

        vwf.types = {};
        vwf.map = {};

        var engines = [];

        var rootID = 0, lastID = undefined;
var firstPrototypeID = -1, lastPrototypeID = undefined;

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
                // shardArguments.webgl && vwf.addEngine( vwf.webgl.apply( new vwf.webgl(), [ vwf ].concat( shardArguments.webgl || [] ) ) );
                vwf.addEngine( vwf.html.apply( new vwf.html(), [ vwf ].concat( shardArguments.html || [] ) ) );
                // vwf.addEngine( vwf.js.apply( new vwf.js(), [ vwf ].concat( shardArguments.js || [] ) ) );
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

                    var time_node_statement = message.split( " " );

                    var time = Number( time_node_statement[0] ) || 0;
                    var node = time_node_statement[1]; // may be undefined
                    var property_value = ( time_node_statement[2] || "" ).split( "=" );

                    var property = property_value[0];
                    var value = property_value[1];

                    vwf.tick( time );

                    if ( node && property ) {
                        vwf.onSetProperty( node, property, value ); // TODO: method calls too
                    }

                } );

                vwf.socket.on( "disconnect", function() { console.log( "(client) Disconnected" ) } );

                vwf.socket.connect();

            }

            vwf.createNode( world, function( node ) {
                vwf.root = node;
            } );

        }; // ready
        
        this.addEngine = function( engine ) {
            engines.unshift( engine );
        };


        // vwf.createNode( spec|uri, { success: function( node ) { vwf.root = node } } ); // vwf.root = vwf.createNode( spec|uri )

        // spec|uri => spec => type => new/init => callback

        this.createNode = function( spec_or_uri, callback ) {

            // spec|uri => spec => type

            if ( typeof spec_or_uri == "string" || spec_or_uri instanceof String ) {

                console.log( "vwf.createNode: creating node of type " + spec_or_uri );

                jQuery.ajax( {
                    url: spec_or_uri,
                    dataType: "jsonp",
                    jsonpCallback: "cb",
                    success: function( spec ) {
                        this.findType( spec["extends"] || "node", function( type ) { // TODO: constant, proper definition for "node"
                            construct.call( this, type, spec );
                        } )
                    },
                    context: this
                } );
            
            } else {

                var spec = spec_or_uri;

                console.log( "vwf.createNode: creating node of literal subclass of " + ( spec["extends"] || "node" ) );

                this.findType( spec["extends"] || "node", function( type ) { // TODO: constant, proper definition for "node"
                    construct.call( this, type, spec );
                } )
            }

            // type => new/init

            function construct( type, spec ) {

var nodeID = ( lastID == undefined ? ( lastID = rootID ) : ++lastID );

                console.info( "vwf.createNode " + nodeID + " " +
                    spec.name + " " + /* nodeExtends + " " + nodeImplements + " " + */ spec.source + " " + spec.type );

                var node = new type( spec.name, type.prototype.name, undefined, spec.source, spec.type, nodeID ); // TODO: name from parent, not child
                this.map[nodeID] = node;

                spec.properties && jQuery.each( spec.properties, function( propertyName, propertyValue ) {
                    node.createProperty( propertyName, propertyValue );
                } );

                spec.methods && jQuery.each( spec.methods, function( methodName ) {
                    node.createMethod( methodName );
                } );

                spec.events && jQuery.each( spec.events, function( eventName ) {
                    node.createEvent( eventName );
                } );

                var vwf = this ; //, childrenLoaded = {}; // TODO: possible race condition with finalize if first children load before all are added to status hash

                spec.children && jQuery.each( spec.children, function( childName, childSpecOrURI ) {

//                    childrenLoaded[childName] = false;

                    vwf.createNode( childSpecOrURI, function( child ) {
                        node.addChild( childName, child );
                        // childrenLoaded[childName] = true;
//                        finalize.call( vwf, node, type, spec, childrenLoaded );
                    } );

                } );

                spec.scripts && jQuery.each( spec.scripts, function( scriptNumber, script ) { script.text && // TODO: external scripts too
                    node.execute( script.text, script.type ); // TODO: callback
                } );
                
//                finalize.call( this, node, type, spec, childrenLoaded );

callback && callback.call( this, node, type );


            }

            // init => callback

            function finalize( node, type, spec, childrenLoaded ) {
                
                var loaded = true;

                spec.children && jQuery.each( spec.children, function( childName, childSpecOrURI ) {
                    loaded = loaded && childrenLoaded[childName];
                } );

                spec.scripts && jQuery.each( spec.scripts, function( scriptNumber, script ) {
                    // TODO
                } );

                if ( loaded ) {
                    callback && callback.call( this, node, type );
                }
                
            }

        }; // createNode
        

        this.findType = function( spec_or_uri, callback ) {

            if ( typeof spec_or_uri == "string" || spec_or_uri instanceof String ) {
                var guid = spec_or_uri; // TODO: sanitize?
            }
            else {
                var guid = Math.random().toString().substring(2); // TODO: do something smarter and more likely to be unique here; base on referrer, or make more traceable
if ( spec_or_uri.name ) guid = spec_or_uri.name; // TODO: this is to simulate loading
            }

            var type = this.types[guid];

            if ( type ) {

                callback && callback.call( this, type );

            } else {
                
                this.createNode( spec_or_uri, function( prototype, base ) {

var nodeID = ( lastPrototypeID == undefined ? ( lastPrototypeID = firstPrototypeID ) : --lastPrototypeID );
prototype.id = nodeID; lastID--;

                    type = function() { base.apply( this, arguments ) };

                    type.prototype = prototype;
                    type.prototype.constructor = type; // resetting constructor breaks enumerables?

                    this.types[guid] = type;

                    callback && callback.call( this, type );

                } );

            }

        }; // findType


        this.addChild = function( nodeID, childID ) {

            console.info( "vwf.addChild " + nodeID + " " + childID );

            var node = vwf.map[nodeID];
            var child = vwf.map[chilID];

            node && child && node.addChild( child );

        };

        this.createProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "vwf.onCreateProperty " + nodeID + " " + propertyName + " " + propertyValue );

            var node = vwf.map[nodeID];
            node && node.createProperty( propertyName, propertyValue );

        };

        this.setProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "vwf.setProperty " + nodeID + " " + propertyName + " " + propertyValue );

            if ( vwf.socket ) {
                vwf.socket.send( "0 " + nodeID + " " + propertyName  + "=" + propertyValue ); // TODO: time
            } else {
                this.onSetProperty( nodeID, propertyName, propertyValue );
            }

            var node = vwf.map[nodeID];
            node && node.setProperty( propertyName, propertyValue );

        };

        this.getProperty = function( nodeID, propertyName ) {

            console.info( "vwf.getProperty " + nodeID + " " + propertyName );

            var node = vwf.map[nodeID];
            node && node.getProperty( propertyName, propertyValue );

        };

        this.createMethod = function( nodeID, methodName ) {

            console.info( "vwf.createMethod " + nodeID + " " + methodName );

            var node = vwf.map[nodeID];
            node && node.createMethod( methodName );

        };
        
        this.callMethod = function( nodeID, methodName ) {

            console.info( "vwf.callMethod " + nodeID + " " + methodName );

            var node = vwf.map[nodeID];
            node && node.callMethod( methodName );

        };

        this.createEvent = function( nodeID, eventName ) {

            console.info( "vwf.createEvent " + nodeID + " " + eventName );

            var node = vwf.map[nodeID];
            this.onCreateEvent( nodeID, eventName );

        };

        this.fireEvent = function( nodeID, eventName ) {

            console.info( "vwf.fireEvent " + nodeID + " " + eventName );

            var node = vwf.map[nodeID];
            this.onFireEvent( nodeID, eventName );

        };

        this.execute = function( nodeID, scriptText, scriptType ) {

            console.info( "vwf.execute " + nodeID + " " + ( scriptText || "" ).substring( 0, 100 ) + " " + scriptType );

            var node = vwf.map[nodeID];
            this.onExecute( nodeID, scriptText, scriptType );

        };

        this.tick = function( time ) {

            // console.info( "vwf.tick " + time );
            this.onTick( time );

        };


        this.onConstruct = function( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType ) {

            console.info( "vwf.onConstruct " + nodeID + " " +
                nodeName + " " + nodeExtends + " " + nodeImplements + " " + nodeSource + " " + nodeType );

            jQuery.each( engines, function( index, engine ) {
                engine.onConstruct && engine.onConstruct( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType );
            } );

        };


        this.onChildAdded = function( nodeID, childID ) {

            console.info( "vwf.onChildAdded " + nodeID + " " + childID );

            jQuery.each( engines, function( index, engine ) {
                engine.onChildAdded && engine.onChildAdded( nodeID, childID );
            } );

        };

        this.onCreateProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "vwf.onCreateProperty " + nodeID + " " + propertyName + " " + propertyValue );

            jQuery.each( engines, function( index, engine ) {
                engine.onCreateProperty && engine.onCreateProperty( nodeID, propertyName, propertyValue );
            } );

            return propertyValue;
        };


        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "vwf.onSetProperty " + nodeID + " " + propertyName + " " + propertyValue );

            jQuery.each( engines, function( index, engine ) {
                engine.onSetProperty && engine.onSetProperty( nodeID, propertyName, propertyValue );
            } );

            return propertyValue;
        };

        this.onGetProperty = function( nodeID, propertyName ) {

            console.info( "vwf.onGetProperty " + nodeID + " " + propertyName );

            var propertyValue = undefined;

            jQuery.each( engines, function( index, engine ) {
                var v = engine.onGetProperty && engine.onGetProperty( nodeID, propertyName );
                propertyValue = v != undefined ? v : propertyValue;
            } );

            return propertyValue;
        };

        this.onCreateMethod = function( nodeID, methodName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onCreateMethod && engine.onCreateMethod( nodeID, methodName );
            } );

        };
        
        this.onCallMethod = function( nodeID, methodName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onCallMethod && engine.onCallMethod( nodeID, methodName );
            } );

        };

        this.onCreateEvent = function( nodeID, eventName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onCreateEvent && engine.onCreateEvent( nodeID, eventName );
            } );

        };

        this.onFireEvent = function( nodeID, eventName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onFireEvent && engine.onFireEvent( nodeID, eventName );
            } );

        };

        this.onExecute = function( nodeID, scriptText, scriptType ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onExecute && engine.onExecute( nodeID, scriptText, scriptType );
            } );

        };

        this.onTick = function( time ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onTick && engine.onTick( time );
            } );

        };


        var Node = vwf.node = function( nodeName, nodeExtends, nodeImplements, nodeSource, nodeType, nodeID ) {

this.id = nodeID;

            this.parent = undefined;

            this.name = nodeName;

            this.source = nodeSource;
            this.type = nodeType;

            this.properties = {};
            this.methods = {};
            this.events = {};
            this.children = [];

            vwf.onConstruct( this.id, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType ); // TODO: extends & implements?

        };

        Node.prototype.createProperty = function( propertyName, propertyValue ) {

            var property = this.properties[propertyName] = new vwf.property( this, propertyValue );

            Object.defineProperty( this, propertyName, {
                get: function() { return property.value }, // "this" is property's node
                set: function( value ) { property.value = value }, // TODO: getters & setters
                enumerable: true
            } );

            var result = this.setProperty( propertyName, propertyValue );

            vwf.onCreateProperty( this.id, propertyName, propertyValue ); // TODO: redundancy with onSetProperty call

            return result;
        };

        Node.prototype.setProperty = function( propertyName, propertyValue ) {

            var property = this.properties[propertyName];

            var result = property.set ? property.set.call( this, propertyValue ) : ( property.value = propertyValue );

            vwf.onSetProperty( this.id, propertyName, propertyValue );

            return result;
        };

        Node.prototype.getProperty = function( propertyName ) {

            var property = this.properties[propertyName] ||
this.prototype.properties[propertyName] || this.prototype.prototype.properties[propertyName]; // TODO: make recursive

            var result =  property.get ? property.get.call( this ) : property.value;

            vwf.onGetProperty( this.id, propertyName );

            return result;
        };

        Node.prototype.createMethod = function( methodName ) {

        };

        Node.prototype.createEvent = function( eventName ) {

        };

        Node.prototype.addChild = function( childName, child ) {

            this.children[childName] = child;
            this.children.push( child );

            Object.defineProperty( this, childName, {
                get: function() { return child },
                set: function( child ) { }, // TODO
                enumerable: true
            } );
            
            vwf.onChildAdded( this.id, child.id );

        };

        Node.prototype.removeChild = function( child ) {
            
        };


        var Property = vwf.property = function( node, value ) {
            this.node = node; // TODO: make private
            this.value = value;
            this.get = undefined;
            this.set = undefined;
        };


        vwf.types["node"] = Node; // TODO: constant, proper definition for "node"

        var def = { name:"node3", properties: { visible: true, transform: [] } };
        def["extends"] = "node";
        vwf.findType( def );

        vwf.findType( { name: "base", properties: { basep1: true, basep2: [ 1, 2, 3 ] } } );

        var def = { name: "derived", properties: { derivedp1: "abcde" } }
        def["extends"] = "base";
        vwf.findType( def );

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
