( function( window ) {

    var HTMLShard = function( vwf, rootSelector ) {

        if ( ! vwf ) return;

        jQuery( rootSelector ).
            addClass( "vwf-node" ).
            append( "<div class='vwf-orphanage' style='display:none'></div>" );

        this.onConstruct = function( nodeID, nodeType, nodeName, source, mimeType ) {

            var nodeQuery = jQuery( ".vwf-orphanage" ).append(
                "<div id='" + nodeID + "' class='vwf-node'>" +
                    "<p class='vwf-label'>" + nodeName + "</p>" +
                "</div>"
            ). children( ":last" );

            nodeQuery.children( ".vwf-label" ).click( function() {
                jQuery(this).siblings( ".vwf-properties, .vwf-methods, .vwf-events, .vwf-children" ).toggle();
            } );

        };

        this.onDestruct = function( nodeID ) {

        };

        this.onChildAdded = function( nodeID, childID ) { // TODO: node undef for root?

            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );
            var containerQuery = nodeQuery.children( ".vwf-children" );

            if ( containerQuery.length == 0 ) {

                containerQuery = nodeQuery.append(
                    "<div class='vwf-children'>" +
                        "<p class='vwf-label'>Children</p>" +
                    "</div>"
                ).children( ":last" );

                containerQuery.children( ".vwf-label" ).click( function() {
                    jQuery(this).siblings( ".vwf-node" ).toggle();
                } );

            }

            var childQuery = jQuery( "#" + childID );
            containerQuery.append( childQuery );

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

                containerQuery = nodeQuery.append(
                    "<div class='vwf-properties'>" +
                        "<p class='vwf-label'>Properties</p>" +
                    "</div>"
                ).children( ":last" );

                containerQuery.children( ".vwf-label" ).click( function() {
                    jQuery(this).siblings( ".vwf-property" ).toggle();
                } );

            }

            var propertyQuery = containerQuery.append(
                "<div id='" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + "</p>" +
                "</div>"
            ). children( ":last" );

// Demo hack: increment by 1 on click

            propertyQuery.click( function() {
                var nodeID = Number( jQuery(this).parents( ".vwf-node" )[0].id ) || 0; // TODO: symbol for global id
                vwf.setProperty( nodeID, propertyName, Number( vwf.getProperty( nodeID, propertyName ) ) + 1 );
            } );

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
            var containerQuery = nodeQuery.children( ".vwf-methods" );

            if ( containerQuery.length == 0 ) {

                containerQuery = nodeQuery.append(
                    "<div class='vwf-methods'>" +
                        "<p class='vwf-label'>Methods</p>" +
                    "</div>"
                ).children( ":last" );

                containerQuery.children( ".vwf-label" ).click( function() {
                    jQuery(this).siblings( ".vwf-method" ).toggle();
                } );

            }

            var methodQuery = containerQuery.append(
                "<div id='" + nodeID + "-" + methodName + "' class='vwf-method'>" +
                    "<p class='vwf-label'>" + methodName + "</p>" +
                "</div>"
            ). children( ":last" );
        };

        this.onCallMethod = function( nodeID, methodName ) {
        
        };

        this.onCreateEvent = function( nodeID, eventName ) {
        
            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );
            var containerQuery = nodeQuery.children( ".vwf-events" );

            if ( containerQuery.length == 0 ) {

                containerQuery = nodeQuery.append(
                    "<div class='vwf-events'>" +
                        "<p class='vwf-label'>Events</p>" +
                    "</div>"
                ).children( ":last" );

                containerQuery.children( ".vwf-label" ).click( function() {
                    jQuery(this).siblings( ".vwf-event" ).toggle();
                } );

            }

            var eventQuery = containerQuery.append(
                "<div id='" + nodeID + "-" + eventName + "' class='vwf-event'>" +
                    "<p class='vwf-label'>" + eventName + "</p>" +
                "</div>"
            ). children( ":last" );

        };

        this.onFireEvent = function( nodeID, eventName ) {
        
        };

        this.onTick = function( time ) {
        
        };

        var findOrCreate = function( contextQuery, traverser, manipulator ) {
            var traversalQuery = traverser.call( contextQuery );
            return traversalQuery.length ? traversalQuery : manipulator.call( contextQuery );
        };
        
        return this;

    };

    return window.vwf.html = HTMLShard;

} ) ( window );
