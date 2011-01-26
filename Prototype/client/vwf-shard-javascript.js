( function( window ) {

    var JavaScriptShard = function( vwf ) {

        var map = {};
        
        this.onConstruct = function( nodeID, nodeType, nodeName, source, mimeType ) {

            map[nodeID] = new Node( nodeID, nodeName, source, mimeType );

        };

        this.onDestruct = function( nodeID ) {
        
        };

        this.onChildAdded = function( nodeID, childID ) { // TODO: node undef for root?

            var node = map[nodeID];
            var child = map[childID];

            node.children[child.name] = child;
            node.children.push( child );

            Object.defineProperty( node, child.name, {
                get: function() { return child },
                set: function( child ) { }, // TODO
                enumerable: true
            } );
        };

        this.onChildRemoved = function( nodeID ) {
        
        };

        this.onResolveAddress = function( nodeID ) {
        
        };
    
        this.onChildren = function( nodeID ) {
        
        };

        this.onCreateProperty = function( nodeID, propertyName, propertyValue ) {

            var node = map[nodeID];
            var property = node.properties[propertyName] = new Property( node, propertyValue ); // TODO: value from json

            Object.defineProperty( node, propertyName, {
                get: function() { return vwf.getProperty( nodeID, propertyName ) },
                set: function( value ) { vwf.setProperty( nodeID, propertyName, value ) },
                enumerable: true
            } );

// property.set = function( value ) { return this.properties[propertyName].value = value };
// property.get = function() { return this.properties[propertyName].value; };

            return this.onSetProperty( nodeID, propertyName, propertyValue );
        };

        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {

            var node = map[nodeID];
            var property = node.properties[propertyName];

            return property.set ? property.set.call( node, propertyValue ) : ( property.value = propertyValue );
        };

        this.onGetProperty = function( nodeID, propertyName ) {
        
            var node = map[nodeID];
            var property = node.properties[propertyName];

            return property.get ? property.get.call( node ) : property.value;
        };

        this.onCreateMethod = function( nodeID, methodName ) {
        
        };

        this.onCallMethod = function( nodeID, methodName ) {
        
        };

        this.onCreateEvent = function( nodeID, eventName ) {
        
        };

        this.onFireEvent = function( nodeID, eventName ) {
        
        };

        // Node

        var Node = JavaScriptShard.Node = function( nodeID, nodeName, source, mimeType ) {

            this.id = nodeID; // TODO: make private
            this.parent = undefined;

            this.name = nodeName;
            this.source = source;
            this.mimeType = mimeType;

            this.properties = {};
            this.methods = {};
            this.events = {};
            this.children = [];

        };

        Node.prototype.createChild = function( nodeType, nodeName, source, mimeType ) {
            return vwf.createNode( nodeType, nodeName, source, mimeType, this.id );
        };

        Node.prototype.createProperty = function( propertyName, propertyValue ) {
            return vwf.createProperty( this.id, propertyName, propertyValue );
        };

        Node.prototype.createMethod = function( methodName ) {
            return vwf.createMethoe( this.id, methodName );
        };

        Node.prototype.createEvent = function( eventName ) {
            return vwf.createEvent( this.id, eventName );
        };

        var Property = JavaScriptShard.Property = function( node, value ) {
            this.node = node; // TODO: make private
            this.value = value;
            this.get = undefined;
            this.set = undefined;
        };

        vwf.root = map[0] = new Node( 0 ); // TODO: symbol for global node ID
    };
    
    return window.vwf.js = JavaScriptShard;

} ) ( window );
