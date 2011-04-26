( function( window ) {

    console.info( "loading vwf" );

    window.vwf = new function() {

        console.info( "creating vwf" );

        // == Private variables ====================================================================

        var vwf = this;

        var rootID = 0, lastID = undefined;
        var nodePrototypeID = -1, lastPrototypeID = undefined;

        var queue = [];

        // == Public attributes ====================================================================

        this.modules = [];

        this.models = [];
        this.views = [];

        this.types = {}; // TODO: "http://vwf.example.com/types/node": nodePrototypeID ?

        this.time = 0;

        // == Public functions =====================================================================

        // -- initialize ---------------------------------------------------------------------------

        this.initialize = function( /* [ componentURI|componentObject ] [ modelArguments ] [ viewArguments ] */ ) {

            var args = Array.prototype.slice.call( arguments );

            var world = undefined;

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

        }; // initialize

        // -- ready --------------------------------------------------------------------------------

        this.ready = function( component_uri_or_object ) {

            this.createNode( component_uri_or_object );

        }; // ready

        // -- send ---------------------------------------------------------------------------------

        this.send = function( nodeID, actionName /* , parameters ... */ ) {

            var args = Array.prototype.slice.call( arguments );

            var message = nodeID + " " + actionName + " " + args.slice( 2 ).join( " " ); // TODO: json encode

            if ( this.socket ) {

                this.socket.send( this.time + " " + message );

            } else {

                queue.push( { time: this.time, message: message } );
                queue.sort( function( a, b ) { return a.time - b.time } );

            }

        }; // send

        // -- receive ------------------------------------------------------------------------------

        this.receive = function( message ) {

            var parameters = message.split( " " );

            var nodeID = parameters.shift();
            var actionName = parameters.shift();

            this[actionName] && this[actionName].apply( this, [ nodeID ] + parameters ); // TODO: decode from json
            
        }; // receive

        // -- createNode ---------------------------------------------------------------------------

        this.createNode = function( /* [ parentID, ] */ component_uri_or_object, callback ) {

            console.info( "vwf.createNode " + component_uri_or_object );

var type = vwf.types["http://vwf.example.com/types/node"];
var spec = component_uri_or_object;
var name = undefined;

var nodeID = ( lastID == undefined ? ( lastID = rootID ) : ++lastID );
var prototypeID = nodePrototypeID;

            // Call creatingNode() on each model.

            jQuery.each( vwf.models, function( index, model ) {
                model.creatingNode && model.creatingNode( nodeID, name, prototypeID, [], spec.source, spec.type );
            } );

            // Call createdNode() on each view.

            jQuery.each( vwf.views, function( index, view ) {
                view.createdNode && view.createdNode( nodeID, name, prototypeID, [], spec.source, spec.type );
            } );
            
            return nodeID; // TODO: not with callback ...
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
