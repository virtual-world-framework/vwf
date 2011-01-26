( function( window ) {

    var HTMLShard = function( vwf, rootSelector ) {

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

    return window.vwf.html = HTMLShard;

} ) ( window );
