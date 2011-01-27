( function( window ) {

    var WebGLShard = function( vwf, setters ) {

        if ( ! vwf ) return;

        this.onConstruct = function( nodeID, nodeType, nodeName, source, mimeType ) {

        };

        this.onDestruct = function( nodeID ) {

        };

        this.onChildAdded = function( nodeID, childID ) { // TODO: node undef for root?

        };

        this.onChildRemoved = function( nodeID ) {

        };

        this.onResolveAddress = function( nodeID ) {

        };

        this.onChildren = function( nodeID ) {

        };

        this.onCreateProperty = function( nodeID, propertyName, propertyValue ) {

            return this.onSetProperty( nodeID, propertyName, propertyValue );
        };

        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {

            if ( propertyName == "enabled" ) {
                setters.enabled( nodeID, propertyValue == "false" ? false : Boolean( propertyValue ) );
            } else if ( propertyName = "angle" ) {
                setters.angle( nodeID, Number( propertyValue ) );
            }

            return undefined;
        };

        this.onGetProperty = function( nodeID, propertyName ) {

            return undefined;
        };
        
        this.onCreateMethod = function( nodeID, methodName ) {
        
        };

        this.onCallMethod = function( nodeID, methodName ) {
        
        };

        this.onCreateEvent = function( nodeID, eventName ) {
        
        };

        this.onFireEvent = function( nodeID, eventName ) {
        
        };

        this.onTick = function( time ) {
        
            setters.tick( time );

        };

        var findOrCreate = function( contextQuery, traverser, manipulator ) {
            var traversalQuery = traverser.call( contextQuery );
            return traversalQuery.length ? traversalQuery : manipulator.call( contextQuery );
        };
        
        return this;

    };

    return window.vwf.webgl = WebGLShard;

} ) ( window );
