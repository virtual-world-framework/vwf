( function( window ) {

    var HTMLShard = function( vwf, rootSelector ) {

        jQuery( rootSelector ).addClass( "vwf-node" );

        this.onConstruct = function( nodeID, nodeType, nodeName, source, mimeType ) {

            var nodeQuery = jQuery( "#vwf-orphans" ).append( "<div id='" + nodeID + "'></div>" ).children().last().
                addClass( "vwf-node" ).
                append( "<p>" + nodeName + "</p>" ).children().last().addClass( "vwf-label" ).end().end();

        };

        this.onDestruct = function( nodeID ) {

        };

        this.onChildAdded = function( nodeID, childID ) { // TODO: node undef for root?

            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

            var nodeDepth = Number( ( ( nodeQuery.parent( ".vwf-children" ).attr( "class" ) || "" ).
                match( /\bvwf-depth-(\d+)\b/ ) || [] )[1] || "0" );

            var childDepth = nodeDepth + 1;

            var containerQuery = findOrCreate( nodeQuery, function() { return this.children( ".vwf-children" ) }, function() {
                return this.append( "<div></div>" ).children().last().
                    addClass( "vwf-children vwf-depth-" + childDepth ).
                    append( "<p>" + "Children" + "</p>" ).children().last().addClass( "vwf-label" ).end().end();
            } );

            var childQuery = jQuery( "#" + childID );

            containerQuery.append( childQuery ).children().last().
                addClass( "vwf-depth-" + ( nodeDepth + 1 ) );

        };

        this.onChildRemoved = function( nodeID ) {

        };

        this.onResolveAddress = function( nodeID ) {

        };

        this.onChildren = function( nodeID ) {

        };

        this.onCreateProperty = function( nodeID, propertyName, propertyValue ) {

            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

            var containerQuery = findOrCreate( nodeQuery, function() { return this.children( ".vwf-properties" ) }, function() {
                return this.append( "<div></div>" ).children().last().
                    addClass( "vwf-properties" ).
                    append( "<p>" + "Properties" + "</p>" ).children().last().addClass( "vwf-label" ).end().end();
            } );

            var propertyQuery = containerQuery.append( "<div id='" + nodeID + "-" + propertyName + "'></div>" ).children().last().
                addClass( "vwf-property" ).
                append( "<p>" + propertyName + "</p>" ).children().last().addClass( "vwf-label" ).end().end();


// Demo hacks: increment by 1 on click

if ( propertyName == "hello_my_name_is" ) {
    
} else {
    propertyQuery.children( ".vwf-label" ).click( function() {
        var nodeID = Number( jQuery(this).parents( ".vwf-node" )[0].id ) || 0; // TODO: symbol for global id
        vwf.setProperty( nodeID, propertyName, Number( vwf.getProperty( nodeID, propertyName ) ) + 1 );
    } );
}

            return this.onSetProperty( nodeID, propertyName, propertyValue );
        };

        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {

            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

            var propertyQuery = nodeQuery.children( ".vwf-properties" ).children( "#" + nodeID + "-" + propertyName );
            propertyQuery.children( ".vwf-label" ).text( propertyName + ": " + propertyValue );

            return undefined;
        };

        this.onGetProperty = function( nodeID, propertyName ) {

            return undefined;
        };
        
        this.onCreateMethod = function( nodeID, methodName ) {
        
            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

            var containerQuery = findOrCreate( nodeQuery, function() { return this.children( ".vwf-methods" ) }, function() {
                return this.append( "<div></div>" ).children().last().
                    addClass( "vwf-methods" ).
                    append( "<p>" + "Methods" + "</p>" ).children().last().addClass( "vwf-label" ).end().end();
            } );

            containerQuery.append( "<div id='" + nodeID + "-" + methodName + "'></div>" ).children().last().
                addClass( "vwf-method" ).
                append( "<p>" + methodName + "</p>" ).children().last().addClass( "vwf-label" ).end().end();

        };

        this.onCallMethod = function( nodeID, methodName ) {
        
        };

        this.onCreateEvent = function( nodeID, eventName ) {
        
            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

            var containerQuery = findOrCreate( nodeQuery, function() { return this.children( ".vwf-events" ) }, function() {
                return this.append( "<div></div>" ).children().last().
                    addClass( "vwf-events" ).
                    append( "<p>" + "Events" + "</p>" ).children().last().addClass( "vwf-label" ).end().end();
            } );

            containerQuery.append( "<div id='" + nodeID + "-" + eventName + "'></div>" ).children().last().
                addClass( "vwf-event" ).
                append( "<p>" + eventName + "</p>" ).children().last().addClass( "vwf-label" ).end().end();

        };

        this.onFireEvent = function( nodeID, eventName ) {
        
        };

        var findOrCreate = function( contextQuery, traverser, manipulator ) {
            var traversalQuery = traverser.call( contextQuery );
            return traversalQuery.length ? traversalQuery : manipulator.call( contextQuery );
        };

    };

    return window.vwf.html = HTMLShard;

} ) ( window );
