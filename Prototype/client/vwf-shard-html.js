( function( window ) {

    var HTMLShard = function( vwf, rootSelector ) {

        if ( ! vwf ) return;

        jQuery( rootSelector ).append( "<div class='vwf-orphanage' style='display:none'></div>" )

        this.onConstruct = function( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType ) {

            if ( nodeID == 0 ) { // TODO: const for root id
            
                var nodeQuery = jQuery( rootSelector ).addClass( "vwf-node" ).append(
                    "<p class='vwf-label'>" +
                        "<span class='vwf-attribute'>" +
                            ( [ nodeExtends ].concat( nodeImplements || [] ).join( ", " ) ) +
                        "</span>" +
                        ( nodeSource ? "&nbsp;&nbsp;<span class='vwf-attribute'>" +
                            "source=\"" + nodeSource + "\" type=\"" + ( nodeType || "" ) + "\"" +
                        "</span>" : "" ) +
                    "</p>"
                );
            
            } else {

                var nodeQuery = jQuery( ".vwf-orphanage" ).append(
                    "<div id='" + nodeID + "' class='vwf-node'>" +
                        "<p class='vwf-label'>" + nodeName + ( nodeExtends || ( nodeImplements && nodeImplements.length ) ? ": " : "" ) +
                            "<span class='vwf-attribute'>" +
                                ( [ nodeExtends ].concat( nodeImplements || [] ).join( ", " ) ) +
                            "</span>" +
                            ( nodeSource ? "&nbsp;&nbsp;<span class='vwf-attribute'>" +
                                "source=\"" + nodeSource + "\" type=\"" + ( nodeType || "" ) + "\"" +
                            "</span>" : "" ) +
                        "</p>" +
                    "</div>"
                ). children( ":last" );

            }

            nodeQuery.children( ".vwf-label" ).click( function() {
                jQuery(this).siblings( ".vwf-properties, .vwf-methods, .vwf-events, .vwf-children, .vwf-scripts" ).toggle();
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
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + JSON.stringify( propertyValue ) + "</span>" +
                        // Demo hack 2
                        // "<input type='text' class='vwf-control'></input>" +
                    "</p>" +
                "</div>"
            ). children( ":last" );
            
            // Demo hack 1: increment by 1 on click
            
            propertyQuery.click( function() {
                var nodeID = Number( jQuery(this).parents( ".vwf-node" )[0].id ) || 0; // TODO: symbol for global id
                var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );
                var propertyQuery = nodeQuery.children( ".vwf-properties" ).children( "#" + nodeID + "-" + propertyName );
                vwf.setProperty( nodeID, propertyName, Number( JSON.parse( propertyQuery.find( ".vwf-value" ).text() ) ) + 1 );
            } );

            // Demo hack 2: show a text control and update character-by-character

            // var controlQuery = propertyQuery.find( ".vwf-control" );

            // controlQuery.keyup( function() {
            //     var nodeID = Number( jQuery(this).parents( ".vwf-node" )[0].id ) || 0; // TODO: symbol for global id
            //     vwf.setProperty( nodeID, propertyName, jQuery(this).val() );
            // } );

            // controlQuery.change( function() {
            //     var nodeID = Number( jQuery(this).parents( ".vwf-node" )[0].id ) || 0; // TODO: symbol for global id
            //     vwf.setProperty( nodeID, propertyName, jQuery(this).val() ); // TODO: json exceptions?
            // } );
            
            return undefined;
        };

        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {

            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

            var propertyQuery = nodeQuery.children( ".vwf-properties" ).children( "#" + nodeID + "-" + propertyName );

            // Demo hack 1

            propertyQuery.find( ".vwf-value" ).text( JSON.stringify( propertyValue ) );

            // Demo hack 2

            // var controlQuery = propertyQuery.find(".vwf-control");

            // controlQuery.val() == propertyValue && typeof controlQuery.val() == typeof propertyValue ||
            //     controlQuery.val( propertyValue );

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

        this.onExecute = function( nodeID, scriptText, scriptType ) {

            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );
            var containerQuery = nodeQuery.children( ".vwf-scripts" );

            if ( containerQuery.length == 0 ) {

                containerQuery = nodeQuery.append(
                    "<div class='vwf-scripts'>" +
                        "<p class='vwf-label'>Scripts</p>" +
                    "</div>"
                ).children( ":last" );

                containerQuery.children( ".vwf-label" ).click( function() {
                    jQuery(this).siblings( ".vwf-script" ).toggle();
                } );

            }

            var scriptQuery = containerQuery.append(
                "<div class='vwf-script'>" +
                    "<p class='vwf-label'><span class='vwf-attribute'>" + scriptType + "</span>&nbsp;&nbsp;" + scriptText + "</p>" +
                "</div>"
            ). children( ":last" );

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
