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

        var globalID = 0, lastID = globalID;

        this.addEngine = function( engine ) {
            engines.unshift( engine );
        };

        this.createNode = function( nodeType, nodeName, source, mimeType, parentID ) {
    
            var nodeID = ++lastID;

            console.info( "VirtualWorldFramework onConstruct " + vwf.internal + " " + nodeID + " " + nodeType + " " + nodeName + " " + source + " " + mimeType );

            jQuery.each( engines, function( index, engine ) {
                engine.onConstruct( nodeID, nodeType, nodeName, source, mimeType );
            } );

            parentID = parentID || globalID;
            this.addChild( parentID, nodeID );

            return nodeID;
        };

        this.addChild = function( nodeID, childID ) {

            console.info( "VirtualWorldFramework onChildAdded " + vwf.internal + " " + nodeID + " " + childID );

            jQuery.each( engines, function( index, engine ) {
                engine.onChildAdded( nodeID, childID );
            } );

        };

        this.createProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "VirtualWorldFramework onCreateProperty " + vwf.internal + " " + nodeID + " " + propertyName + " " + propertyValue );

vwf.internal++;

            jQuery.each( engines, function( index, engine ) {
                engine.onCreateProperty( nodeID, propertyName, propertyValue );
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
                    engine.onSetProperty( nodeID, propertyName, propertyValue );
                } );

vwf.internal--;

        }

            return propertyValue;
        };

        this.getProperty = function( nodeID, propertyName ) {

            console.info( "VirtualWorldFramework onGetProperty " + vwf.internal + " " + nodeID + " " + propertyName );

            var propertyValue = undefined;

            jQuery.each( engines, function( index, engine ) {
                var v = engine.onGetProperty( nodeID, propertyName );
                propertyValue = v != undefined ? v : propertyValue;
            } );

            return propertyValue;
        };

        this.createMethod = function( nodeID, methodName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onCreateMethod( nodeID, methodName );
            } );

        };

        this.callMethod = function( nodeID, methodName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onCallMethod( nodeID, methodName );
            } );

        };

        this.createEvent = function( nodeID, eventName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onCreateEvent( nodeID, eventName );
            } );

        };

        this.fireEvent = function( nodeID, eventName ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onFireEvent( nodeID, eventName );
            } );

        };

        this.tick = function( time ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onTick( time );
            } );

        };

        // deleteNode, addChild, removeChild, moveChild, createProperty, deleteProperty, method, event, ...

        this.initialize = function() {

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



            var worldURI = jQuery.getQueryString( "world" );

            jQuery.ajax( {
                url: worldURI,
                dataType: "jsonp",
                jsonpCallback: "cb", // use statically-defined callback=cb with static js files until JSON provider can do JSONP
                success: function( json ) { vwf.load( json, 0 ) } // TODO: parentID
            } );

        }; // initialize

        this.load = function( json, parentID ) {

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
                    var childID = vwf.createNode( undefined, index, undefined, undefined, parentID );
                    vwf.load( valueJSON, childID );
                } );
            }

        }; // load
        
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
