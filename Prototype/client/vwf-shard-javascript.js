( function( window ) {

    var JavaScriptShard = function( vwf ) {

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

    return window.vwf.js = JavaScriptShard;

} ) ( window );
