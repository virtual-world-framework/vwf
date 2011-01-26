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
        }

        this.createNode = function( nodeType, nodeName, source, mimeType, parentID ) {
    
            var nodeID = ++lastID;

            jQuery.each( engines, function( index, engine ) {
            	engine.onConstruct( nodeID, nodeType, source, mimeType );
            } );

            this.setProperty( nodeID, "name", nodeName );

            parentID = parentID || globalID;
            this.addChild( parentID, nodeID );

            return nodeID;
        };

        this.addChild = function( nodeID, childID ) {

            jQuery.each( engines, function( index, engine ) {
                engine.onChildAdded( nodeID, childID );
            } );

        }

        this.setProperty = function( nodeID, propertyName, propertyValue ) {

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

        // deleteNode, addChild, removeChild, moveChild, createProperty, deleteProperty, method, event, ...

        this.initialize = function( rootElementSelector ) {

            this.addEngine( new HTMLShard( this, rootElementSelector ) );
            this.addEngine( new JavaScriptShard( this ) );
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

                json.children && jQuery.each( json.children, function( index, valueJSON ) {
                    var childID = vwf.createNode( undefined, index, undefined, undefined, parentID );
                    vwf.load( valueJSON, childID );
                } );
            }

        }; // load
        
    };

    var JavaScriptShard = VirtualWorldFramework.JavaScriptShard = function( vwf ) {

        var map = {};
        
        this.onConstruct = function( nodeID, nodeType, source, mimeType ) {
console.log( "JavaScriptShard onConstruct " + nodeID );
            map[nodeID] = new Node( nodeID, source, mimeType );
        };

        this.onDestruct = function( nodeID ) {
        
        };

        this.onChildAdded = function( nodeID, childID ) { // TODO: node undef for root?
console.log( "JavaScriptShard onChildAdded " + nodeID + " " + childID );

            var node = map[nodeID];
            var child = map[childID];

            if ( node ) {
                node.children[child.name] = child;
                node.children.push( child );

                Object.defineProperty( node, child.name, {
                    get: function() { return child },
                    set: function( child ) { }, // TODO
                    enumerable: true
                } );
            }

        };

        this.onChildRemoved = function( nodeID ) {
        
        };

        this.onResolveAddress = function( nodeID ) {
        
        };
    
        this.onChildren = function( nodeID ) {
        
        };

        this.onCreateProperty = function( nodeID, propertyName, propertyValue ) {
console.log( "JavaScriptShard onCreateProperty " + nodeID + " " + propertyName + " " + propertyValue );
        };

        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {
console.log( "JavaScriptShard onSetProperty " + nodeID + " " + propertyName + " " + propertyValue );
        };

        this.onGetProperty = function( nodeID, propertyName ) {
        
        };

        // Node

        var Node = JavaScriptShard.Node = function( nodeID, source, mimeType ) {
            this.id = nodeID; // private
            this.parent = undefined;
            this.children = [];
        };

        Node.prototype.createChild = function( nodeType, nodeName, source, mimeType ) {
            return vwf.createNode( nodeType, nodeName, source, mimeType, this.id );
        };

        Node.prototype.createProperty = function( propertyName, propertyValue ) {
            return vwf.createProperty( this.id, propertyName, propertyValue );
        };

    };









    // HTML document view

    var HTMLShard = VirtualWorldFramework.HtmlShard = function( vwf, rootSelector ) {

        this.onConstruct = function( nodeID, nodeType, source, mimeType ) {
console.log( "HTMLShard onConstruct " + nodeID );
            // jQuery( "#vwf-orphans" ).append( "<div id='" + node + "' class='"vwf-node"'><p>" + name + "</p></div>" ) }; // create div, associate with name, and hang on to
        };

        this.onDestruct = function( node ) {

        };

        this.onChildAdded = function( nodeID, childID ) { // TODO: node undef for root?
console.log( "HTMLShard onChildAdded " + nodeID + " " + childID );
            // jQuery( node ? "#" + node : this.rootSelector ).append( "#" + child ) }; // find div for node, find div for child, annotate, and attach
        };

        this.onChildRemoved = function( node ) {

        };

        this.onResolveAddress = function( node ) {

        };

        this.onChildren = function( node ) {

        };

        this.onCreateProperty = function( nodeID, propertyName, propertyValue ) {
console.log( "HTMLShard onCreateProperty " + nodeID + " " + propertyName + " " + propertyValue );
        };

        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {
console.log( "HTMLShard onSetProperty " + nodeID + " " + propertyName + " " + propertyValue );
        };

        this.onGetProperty = function( node, name ) {

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
