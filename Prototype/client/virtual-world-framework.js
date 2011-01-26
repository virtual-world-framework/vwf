// Suffix notes:
//   - Query: jQuery selection
//   - Selector: jQuery selector string
//   - HTML: HTML-encoded text
//   - JSON: JSON-encoded text


( function( window ) {

var root = undefined;

    var VirtualWorldFramework = {

        root: undefined,

        initialize: function( rootElementSelector ) {

            var worldURI = jQuery.getQueryString( "world" );
            var parentQuery = jQuery( rootElementSelector );

            jQuery.ajax( {
                url: worldURI,
                dataType: "jsonp",
                jsonpCallback: "cb", // use statically-defined callback=cb with static js files until JSON provider can do JSONP
                success: function( data ) { VirtualWorldFramework.root = root = VirtualWorldFramework.load( data, undefined ) }
            } );

            return parentQuery;

    	}, // initialize

        load: function( data, parent ) {

            var node = new Node( parent );

            data.properties && jQuery.each( data.properties, function( index, value ) {
                node.createProperty( index, value );
            } );

            data.methods && jQuery.each( data.methods, function( index, value ) {
                node.createMethod( index, value );
            } );

            data.events && jQuery.each( data.events, function( index, value ) {
                node.createEvent( index, value );
            } );

            data.children && jQuery.each( data.children, function( index, value ) {
                node.createChild( index, value );
            } );

            return node;

        } // load

    };

    var Node = VirtualWorldFramework.node = function( parent ) {

        this.parent = parent;
        this.children = [];

        this.properties = {};
        this.methods = {};
        this.events = {};

    };

    Node.prototype.createProperty = function( name, value ) {

        var property = this.properties[name] = new Property( this, value );

        Object.defineProperty( this, name, {
            get: function() { return property.get ? property.get() : property.value },
            set: function( value ) { property.set ? property.set( value ) : ( property.value = value ) }
        } );

        return property;
    };

    Node.prototype.createMethod = function( name, value ) {

        var method = this.methods[name] = new Method( this );

        return method;
    };

    Node.prototype.createEvent = function( name, value ) {

        var event = this.events[name] = new Event( this );

        return event;
    };

    Node.prototype.createChild = function( name, value ) {

        var child = VirtualWorldFramework.load( value, this );

        this.children.push( child );
        this.children[name] = child;

        Object.defineProperty( this, name, {
            get: function() { return child },
            set: function( child ) { } // TODO
        } );

        return child;
    };

    var Property = VirtualWorldFramework.property = function( node, value ) {

        this.node = node;
        this.value = value;

        this.get = undefined;
        this.set = undefined;

    };

    var Method = VirtualWorldFramework.method = function( node ) {

        this.node = node;

        this.call = undefined;

    };

    var Event = VirtualWorldFramework.event = function( node ) {

        this.node = node;
        this.listeners = [];

    };

    Event.prototype.fire = function() {

        var event = this, args = arguments;

        jQuery.each( event.listeners, function( index, value ) {
            value.apply( event.node, args );
        } );
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
