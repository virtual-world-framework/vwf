// Suffix notes:
//   - Query: jQuery selection
//   - Selector: jQuery selector string
//   - HTML: HTML-encoded text
//   - JSON: JSON-encoded text


( function( window ) {

var root = undefined; // TODO: temp

    var VirtualWorldFramework = {

        root: undefined,

        initialize: function( rootElementSelector ) {

            var worldURI = jQuery.getQueryString( "world" );
            var parentQuery = jQuery( rootElementSelector );

            jQuery.ajax( {
                url: worldURI,
                dataType: "jsonp",
                jsonpCallback: "cb", // use statically-defined callback=cb with static js files until JSON provider can do JSONP
                success: function( json ) { VirtualWorldFramework.root = root = new Node( undefined, json ) }
            } );

            return parentQuery;

    	} // initialize

    };

    var Node = VirtualWorldFramework.node = function( parent, json, name ) {

this.name = name;

        this.parent = parent;

        this.properties = {};
        Object.defineProperty( this.properties, "added", { writable: true, value: undefined } );
        Object.defineProperty( this.properties, "removed", { writable: true, value: undefined } );

        this.methods = {};
        Object.defineProperty( this.methods, "added", { writable: true, value: undefined } );
        Object.defineProperty( this.methods, "removed", { writable: true, value: undefined } );

        this.events = {};
        Object.defineProperty( this.events, "added", { writable: true, value: undefined } );
        Object.defineProperty( this.events, "removed", { writable: true, value: undefined } );

        this.children = [];
        Object.defineProperty( this.children, "added", { writable: true, value: undefined } );
        Object.defineProperty( this.children, "removed", { writable: true, value: undefined } );

        this.constructed = null;
        this.initialized = null;

this.constructed = function() { console.log( "constructed " + this.name ) };
this.initialized = function() { console.log( "initialized " + this.name ) };

        if ( json ) {

            var node = this;

            json.properties && jQuery.each( json.properties, function( index, valueJSON ) {
                node.createProperty( index, valueJSON );
            } );

            json.methods && jQuery.each( json.methods, function( index, valueJSON ) {
                node.createMethod( index, valueJSON );
            } );

            json.events && jQuery.each( json.events, function( index, valueJSON ) {
                node.createEvent( index, valueJSON );
            } );

            // TODO: scripts
        }

        this.constructed && this.constructed.call( this ); // TODO: better names

        if ( json ) {

            var node = this;

            json.children && jQuery.each( json.children, function( index, valueJSON ) {
                node.createChild( index, valueJSON );
            } );
        }

        this.initialized && this.initialized.call( this ); // TODO: better names
    };

    Node.prototype.createProperty = function( name, json ) {

        var property = this.properties[name] = new Property( this, json ); // TODO: value from json

        var node = this;

        Object.defineProperty( this, name, {
            get: function() { return property.get ? property.get.call( node ) : property.value },
            set: function( value ) { property.set ? property.set.call( node, value ) : ( property.value = value ) },
            enumerable: true
        } );

        this.properties.added && this.properties.added.call( this, property ); // TODO: not during construction

        return property;
    };

    Node.prototype.createMethod = function( name, json ) {

        var method = this.methods[name] = new Method( this );

        this.methods.added && this.methods.added.call( this, method ); // TODO: not during construction

        return method;
    };

    Node.prototype.createEvent = function( name, json ) {

        var event = this.events[name] = new Event( this );

        this.events.added && this.events.added.call( this, event ); // TODO: not during construction

        return event;
    };

    Node.prototype.createChild = function( name, json ) {

        var child = this.children[name] = new Node( this, json, name );
        this.children.push( child );

        Object.defineProperty( this, name, {
            get: function() { return child },
            set: function( child ) { }, // TODO
            enumerable: true
        } );

        this.children.added && this.children.added.call( this, child ); // TODO: not during construction

        return child;
    };

    // TODO: assign parent after construct, before init? after construct, after init?


    // root
    // - a
    //   - aa
    // - b

    // root.new: parent=null, p=defined, children=[]
    //   a.new: parent=?, p=defined, children=[]
    //     aa.new: parent=?, p=defined, children=[]
    //     aa.init: parent=?, p=defined, children=[]
    //   a.init: parent=?, p=defined, children=[aa]
    //   b.new: parent=?, p=defined, children=[]
    //   b.init: parent=?, p=defined, children=[]
    // root.init: parent=null, p=defined, children=[a,b]


    // construct parent
    //   construct child1
    //   construct child2
    //   child1.parent = parent
    //   child2.parent = parent
    //   init child1
    //   init child2
    // init parent

    // construct parent
    //   construct child1
    //   init child1
    //   child1.parent = parent
    //   construct child2
    //   init child2
    //   child2.parent = parent
    // init parent
    // parent.parent = null



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
