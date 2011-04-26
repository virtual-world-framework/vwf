( function( window ) {

    window.vwf = new function() {

        this.models = [];
        this.views = [];

        this.initialize = function( /* [ worldURI|worldObject, ] [ shardArguments ] */ ) {

        };

    };

} ) ( window );

( function( vwf ) {

    vwf.models.push( function( vwf, setters ) {

        this.onConstruct = function( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType ) {

        };

    } );

} ) ( window.vwf );


( function( vwf ) {

    vwf.views.push( function( vwf, setters ) {

        this.onConstruct = function( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType ) {

        };

    } );

} ) ( window.vwf );
