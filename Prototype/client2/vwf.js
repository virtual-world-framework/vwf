( function( window ) {

console.info( "loading vwf" );

    window.vwf = new function() {

console.info( "creating vwf" );

        var vwf = this;

        // -- Public attributes --------------------------------------------------------------------

        this.root = undefined;

        this.modules = [];
        
        this.types = {};

        this.models = [];
        this.views = [];

        // -- Public functions ---------------------------------------------------------------------

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

            // When the document is ready, create and attach the models and views, then load the
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

var rootID = 0, lastID = undefined;

        this.ready = function( component_uri_or_object ) {

            vwf.createNode( component_uri_or_object, function( node ) {
                vwf.root = node;
            } );

        }; // ready

        this.createNode = function( component_uri_or_object, callback ) {

console.info( "vwf.createNode " + component_uri_or_object );

var spec = {};
var type = vwf.types.node;
var nodeID = ( lastID == undefined ? ( lastID = rootID ) : ++lastID );

            var node = new type( spec.name, type.prototype.name, undefined, spec.source, spec.type, nodeID ); // TODO: name from parent, not child


        }

        // -- Private functions --------------------------------------------------------------------

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

        // -- Private functions --------------------------------------------------------------------

        var node = vwf.types.node = function( nodeName, nodeExtends, nodeImplements, nodeSource, nodeType, nodeID ) {

this.id = nodeID;
// TODO: name not in component

            this.parent = undefined;

            this.name = nodeName;

            this.source = nodeSource;
            this.type = nodeType;

            this.properties = {};
            this.methods = {};
            this.events = {};
            this.children = [];

            jQuery.each( vwf.models, function( index, model ) {
                model.constructing && model.constructing( this.id, this.name, nodeExtends, nodeImplements, this.source, this.type );
            } );

            jQuery.each( vwf.views, function( index, view ) {
                view.constructed && view.constructed( this.id, this.name, nodeExtends, nodeImplements, this.source, this.type );
            } );

        };

    };

} ) ( window );
