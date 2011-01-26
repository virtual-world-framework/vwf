( function( window ) {

    var JavaScriptShard = function( vwf ) {

        var map = {};
        
        this.onConstruct = function( nodeID, nodeType, source, mimeType ) {
            map[nodeID] = new Node( nodeID, source, mimeType );
        };

        this.onDestruct = function( nodeID ) {
        
        };

        this.onChildAdded = function( nodeID, childID ) { // TODO: node undef for root?

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

        };

        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {

        };

        this.onGetProperty = function( nodeID, propertyName ) {
        
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

    return window.vwf.js = JavaScriptShard;

} ) ( window );
