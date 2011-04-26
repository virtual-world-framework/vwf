( function( window ) {

    console.info( "loading vwf" );

    window.vwf = new function() {

        console.info( "creating vwf" );

        // == Private variables ====================================================================

        var vwf = this;

        this.private = {}; // for debugging

        var lastID = 0;

        var nodeTypeURI = "http://vwf.example.com/types/node";
        var nodeTypeID = 1; // convention

        var rootID = 2; // by convention

        var socket = undefined;
        var queue = this.private.queue = [];

        var types = this.private.types = {}; // maps type URIs to node IDs

        // == Public attributes ====================================================================

        this.modules = [];

        this.models = [];
        this.views = [];


        this.time = 0;

        // == Public functions =====================================================================

        // -- initialize ---------------------------------------------------------------------------

        this.initialize = function( /* [ componentURI|componentObject ] [ modelArguments ] [ viewArguments ] */ ) {

            var args = Array.prototype.slice.call( arguments );

            // Get the world specification if one is provided in the query string. Parse it into a
            // world specification object if it's valid JSON, otherwise keep the query string and
            // assume it's a URI.

            var world = jQuery.getQueryString( "world" );

            try { world = jQuery.parseJSON( world ) || world || {}; } catch( e ) { }

            // Parse the function parameters. If the first parameter is a string or contains
            // component properties, then treat it as the world specification. Otherwise, fall back
            // to the "world" parameter in the query string.

            if ( typeof args[0] == "string" || args[0] instanceof String || objectIsComponent( args[0] ) ) {
                world = args.shift();
            }

            // Shift off the parameter containing the model argument lists.

            var modelArgumentLists = args.shift() || {};

            if ( typeof modelArgumentLists != "object" && ! modelArgumentLists instanceof Object )
                modelArgumentLists = {};

            // Shift off the parameter containing the view argument lists.

            var viewArgumentLists = args.shift() || {};

            if ( typeof viewArgumentLists != "object" && ! viewArgumentLists instanceof Object )
                viewArgumentLists = {};

            // When the document is ready, create and attach the models and views and load the
            // world.

            jQuery( window.document ).ready( function() {

                jQuery.each( modelArgumentLists, function( modelName, modelArguments ) {
                    var model = vwf.modules[modelName];
                    model && vwf.models.push( model.apply( new model(), [ vwf ].concat( modelArguments || [] ) ) );
                } );

                jQuery.each( viewArgumentLists, function( viewName, viewArguments ) {
                    var view = vwf.modules[viewName];
                    view && vwf.views.push( view.apply( new view(), [ vwf ].concat( viewArguments || [] ) ) );
                } );

                vwf.ready( world );

            } );

        };

        // -- ready --------------------------------------------------------------------------------

        this.ready = function( component_uri_or_object ) {

            try {

                socket = new io.Socket();

            } catch ( e ) {

                this.dispatch( 0 );

                setInterval( function() {

                    vwf.time += 10;
                    vwf.dispatch( vwf.time );

                }, 10 );

            }

            if ( socket ) {

                socket.on( "connect", function() { console.info( "vwf.socket connected" ) } );

                socket.on( "message", function( message ) {

                    console.info( "vwf.socket message " + message );

                    var fields = message.split( " " );
                    var time = Number( fields[0] );

                    vwf.dispatch( time );

                } );

                socket.on( "disconnect", function() { console.log( "vwf.socket disconnected" ) } );

                socket.connect();

            }

            this.createNode( component_uri_or_object );

        };

        // -- send ---------------------------------------------------------------------------------

        this.send = function( /* nodeID, actionName, parameters ... */ ) {

            var args = Array.prototype.slice.call( arguments );

            var fields = [ this.time ].concat( args );

            if ( socket ) {

                var message = fields.join( " " ); // TODO: json encode
                socket.send( message );

            } else {

                queue.push( fields );
                queue.sort( function( a, b ) { return a[0] - b[0] } );

            }

        };

        // -- receive ------------------------------------------------------------------------------

        this.receive = function( message ) {

            var fields = message.split( " " ); // TODO: json decode

            var time = Number( fields.shift() );
            var nodeID = Number( fields.shift() );
            var actionName = fields.shift();

            this[actionName] && this[actionName].apply( this, [ nodeID ] + parameters );
            
        };

        // -- dispatch -----------------------------------------------------------------------------

        this.dispatch = function( currentTime ) {

            while ( queue.length > 0 ) {

                var fields = queue[0].split( " " );
                var messageTime = Number( fields[0] );

                if ( messageTime > currentTime ) {
                    break;
                }

                this.receive( queue.shift() );

            }
            
        };

        // -- createNode ---------------------------------------------------------------------------

        this.createNode = function( /* [ parentID, ] */ component_uri_or_object, callback ) {

            console.info( "vwf.createNode " + component_uri_or_object );

var name = undefined;

            // spec|uri => spec => type

            if ( typeof component_uri_or_object == "string" || component_uri_or_object instanceof String ) {

                if ( component_uri_or_object == nodeTypeURI ) {

                    var prototypeID = undefined;
                    var component = {};

                    console.log( "vwf.createNode: creating " + nodeTypeURI + " prototype" );
                    construct.call( this, prototypeID, component );

                } else {

                    console.log( "vwf.createNode: creating node of type " + component_uri_or_object );

                    jQuery.ajax( {
                        url: component_uri_or_object,
                        dataType: "jsonp",
                        jsonpCallback: "cb",
                        success: function( component ) {
                            this.findType( component["extends"] || nodeTypeURI, function( prototypeID ) {
                                construct.call( this, prototypeID, component );
                            } )
                        },
                        context: this
                    } );

                }
            } else {

                var component = component_uri_or_object;

                console.log( "vwf.createNode: creating node of literal subclass of " + ( component["extends"] || nodeTypeURI ) );

                this.findType( component["extends"] || nodeTypeURI, function( prototypeID ) {
                    construct.call( this, prototypeID, component );
                } );

            }

            // type => new/init

            function construct( prototypeID, component ) {

                var nodeID = ++lastID;

                console.info( "vwf.createNode " + nodeID + " " + component.source + " " + component.type );

                // Call creatingNode() on each model.

                jQuery.each( vwf.models, function( index, model ) {
                    model.creatingNode && model.creatingNode( nodeID, name, prototypeID, [], component.source, component.type );
                } );

                // Call createdNode() on each view.

                jQuery.each( vwf.views, function( index, view ) {
                    view.createdNode && view.createdNode( nodeID, name, prototypeID, [], component.source, component.type );
                } );

// PMEC here

                callback && callback.call( this, nodeID, prototypeID );

            }

        };

        // -- findType -----------------------------------------------------------------------------

        this.findType = function( component_uri_or_object, callback ) {

            var typeURI = undefined, typeID = undefined;

            if ( typeof component_uri_or_object == "string" || component_uri_or_object instanceof String ) {
                typeURI = component_uri_or_object;
                typeID = types[typeURI];
            }
            
            if ( typeID ) {

                callback && callback.call( this, typeID );

//            } else if ( typeURI == nodeTypeURI ) {

//                typeID = nodeTypeID;
//                callback && callback.call( this, typeID );

            } else if ( typeURI ) {

                this.createNode( component_uri_or_object, function( typeID, prototypeID ) {
                    types[typeURI] = typeID;
                    callback && callback.call( this, typeID );
                } );

            } else {

                this.createNode( component_uri_or_object, function( typeID, prototypeID ) {
                    callback && callback.call( this, typeID );
                } );

            }

        };

        // -- setProperty --------------------------------------------------------------------------

        this.setProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "vwf.setProperty " + nodeID + " " + propertyName + " " + propertyValue );

            // Call settingProperty() on each model.

            jQuery.each( vwf.models, function( index, model ) {
                model.settingProperty && model.settingProperty( nodeID, propertyName, propertyValue );
            } );

            // Call satProperty() on each view.

            jQuery.each( vwf.views, function( index, view ) {
                view.satProperty && view.satProperty( nodeID, propertyName, propertyValue );
            } );

            return propertyValue;
        };

        // -- getProperty --------------------------------------------------------------------------

        this.getProperty = function( nodeID, propertyName ) {

            console.info( "vwf.getProperty " + nodeID + " " + propertyName + " " + propertyValue );

            // Call gettingProperty() on each model.

            var propertyValue = undefined;

            jQuery.each( vwf.models, function( index, model ) {
                var value = model.gettingProperty && model.gettingProperty( nodeID, propertyName );
                propertyValue = value !== undefined ? value : propertyValue;
            } );

            // Call gotProperty() on each view.

            jQuery.each( vwf.views, function( index, view ) {
                view.gotProperty && view.gotProperty( nodeID, propertyName, propertyValue );
            } );

            return propertyValue;
        };

        // == Private functions ====================================================================

        // -- objectIsComponent --------------------------------------------------------------------

        // Determine if a JavaScript object is a component specification by searching for component
        // specification attributes in the candidate object.

        var objectIsComponent = function( candidate ) {

            var componentAttributes = [
                "extends",
                "implements",
                "source",
                "type",
                "properties",
                "methods",
                "events",
                "children",
                "scripts",
            ];

            var isComponent = false;

            if ( ( typeof candidate == "object" || candidate instanceof Object ) && candidate != null ) {

                jQuery.each( componentAttributes, function( index, attributeName ) {
                    isComponent = isComponent || Boolean( candidate[attributeName] );
                } );

            }
            
            return isComponent; 
        };

    };

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
