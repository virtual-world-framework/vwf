// Suffix notes:
//   - Query: jQuery selection
//   - Selector: jQuery selector string
//   - HTML: HTML-encoded text
//   - JSON: JSON-encoded text

( function( window ) {

    var VirtualWorldFramework = new function() {

        var vwf = this;

        var engines = [];

        var globalID = 0, lastID = globalID;

        this.addEngine = function( engine ) {
            engines.unshift( engine );
        };

        this.createNode = function( nodeType, nodeName, source, mimeType, parentID ) {
    
            var nodeID = ++lastID;

            console.info( "VirtualWorldFramework onConstruct " + nodeID + " " + nodeType + " " + source + " " + mimeType );

            jQuery.each( engines, function( index, engine ) {
            	engine.onConstruct( nodeID, nodeType, source, mimeType );
            } );

            this.setProperty( nodeID, "name", nodeName );

            parentID = parentID || globalID;
            this.addChild( parentID, nodeID );

            return nodeID;
        };

        this.addChild = function( nodeID, childID ) {

            console.info( "VirtualWorldFramework onChildAdded " + nodeID + " " + childID );

            jQuery.each( engines, function( index, engine ) {
                engine.onChildAdded( nodeID, childID );
            } );

        };

        this.createProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "VirtualWorldFramework onCreateProperty " + nodeID + " " + propertyName + " " + propertyValue );

            jQuery.each( engines, function( index, engine ) {
            	engine.onCreateProperty( nodeID, propertyName, propertyValue );
            } );

            return propertyValue;
        };

        this.setProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "VirtualWorldFramework onSetProperty " + nodeID + " " + propertyName + " " + propertyValue );

            jQuery.each( engines, function( index, engine ) {
            	engine.onSetProperty( nodeID, propertyName, propertyValue );
            } );

            return propertyValue;
        };

        this.getProperty = function( nodeID, propertyName ) {

            jQuery.each( engines, function( index, engine ) {
            	engine.onGetProperty( nodeID, propertyName );
            } );

            return propertyValue; // TODO
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

        // deleteNode, addChild, removeChild, moveChild, createProperty, deleteProperty, method, event, ...

        this.initialize = function( rootElementSelector ) {

            // this.addEngine( new HTMLShard( this, rootElementSelector ) );
            // this.addEngine( new JavaScriptShard( this ) );
            // this.addEngine( new ... );

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
