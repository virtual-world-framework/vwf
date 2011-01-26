( function( window ) {

    var HTMLShard = function( vwf, rootSelector ) {

        jQuery( rootSelector ).addClass( "vwf-node" );

        this.onConstruct = function( nodeID, nodeType, source, mimeType ) {
            var nodeQuery = jQuery( "#vwf-orphans" ).append( "<div id='" + nodeID + "'></div>" ).children().last();
        };

        this.onDestruct = function( nodeID ) {

        };

        this.onChildAdded = function( nodeID, childID ) { // TODO: node undef for root?

            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

            var nodeDepth = Number( ( ( nodeQuery.parent( ".vwf-children" ).attr( "class" ) || "" ).
                match( /\bvwf-depth-(\d+)\b/ ) || [] )[1] || "0" );

            var childDepth = nodeDepth + 1;

            var containerQuery = nodeQuery.children( ".vwf-children" );

            if ( containerQuery.length == 0 ) {
                containerQuery = nodeQuery.append( "<div></div>" ).children().last().
                    addClass( "vwf-children vwf-depth-" + childDepth ).
                    append( "<p>" + "Children" + "</p>" ).children().last().addClass( "vwf-label" ).end().end();
            }

            var childQuery = jQuery( "#" + childID );

            containerQuery.append( childQuery ).children().last().
                addClass( "vwf-node vwf-depth-" + ( nodeDepth + 1 ) );

        };

        this.onChildRemoved = function( nodeID ) {

        };

        this.onResolveAddress = function( nodeID ) {

        };

        this.onChildren = function( nodeID ) {

        };

        this.onCreateProperty = function( nodeID, propertyName, propertyValue ) {

            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

            var containerQuery = nodeQuery.children( ".vwf-properties" );

            if ( containerQuery.length == 0 ) {
                containerQuery = nodeQuery.append( "<div></div>" ).children().last().
                    addClass( "vwf-properties" ).
                    append( "<p>" + "Properties" + "</p>" ).children().last().addClass( "vwf-label" ).end().end();
            }

            containerQuery.append( "<div></div>" ).children().last().
                addClass( "vwf-property" ).
                append( "<p>" + propertyName + "</p>" ).children().last().addClass( "vwf-label" ).end().end();

        };

        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {

            if ( propertyName == "name" ) {
                jQuery( "#" + nodeID ).append( "<p>" + propertyValue + "</p>" ).children().last().
                    addClass( "vwf-label" );
            }
        };

        this.onGetProperty = function( nodeID, propertyName ) {

        };
        
        this.onCreateMethod = function( nodeID, methodName ) {
        
            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

            var containerQuery = nodeQuery.children( ".vwf-methods" );

            if ( containerQuery.length == 0 ) {
                containerQuery = nodeQuery.append( "<div></div>" ).children().last().
                    addClass( "vwf-methods" ).
                    append( "<p>" + "Methods" + "</p>" ).children().last().addClass( "vwf-label" ).end().end();
            }

            containerQuery.append( "<div></div>" ).children().last().
                addClass( "vwf-method" ).
                append( "<p>" + methodName + "</p>" ).children().last().addClass( "vwf-label" ).end().end();

        };

        this.onCallMethod = function( nodeID, methodName ) {
        
        };

        this.onCreateEvent = function( nodeID, eventName ) {
        
            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

            var containerQuery = nodeQuery.children( ".vwf-events" );

            if ( containerQuery.length == 0 ) {
                containerQuery = nodeQuery.append( "<div></div>" ).children().last().
                    addClass( "vwf-events" ).
                    append( "<p>" + "Events" + "</p>" ).children().last().addClass( "vwf-label" ).end().end();
            }

            containerQuery.append( "<div></div>" ).children().last().
                addClass( "vwf-event" ).
                append( "<p>" + eventName + "</p>" ).children().last().addClass( "vwf-label" ).end().end();

        };

        this.onFireEvent = function( nodeID, eventName ) {
        
        };

    };

    return window.vwf.html = HTMLShard;

} ) ( window );
