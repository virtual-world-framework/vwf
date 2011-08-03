(function (modules, namespace) {

    window.console && console.info && console.info("loading " + namespace);

    // vwf-view-html.js is a placeholder for an HTML view of the simulation state. It is a stand-in
    // for any number of potential UI elements, including WebGL renderings, traditional UI controls,
    // and connections to external services.
    //
    // vwf-view-html is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern).
    // It attaches to the vwf modules list as vwf.modules.html.

    var module = modules[namespace.split(".").pop()] = function (vwf, rootSelector) {

        if (!vwf) return;

        vwf.logger.info("creating " + namespace);

        modules.view.call(this, vwf);
        this.namespace = namespace;

        jQuery(rootSelector).append("<h2>Globals</h2>");
        jQuery(rootSelector).append("<div class='vwf-root'></div>");
        jQuery(rootSelector).append("<h2>Types</h2>");
        jQuery(rootSelector).append("<div class='vwf-orphanage'></div>");

        this.rootSelector = rootSelector;

    };

    // Delegate any unimplemented functions to vwf-view.

    module.prototype = new modules.view();

    // == Response API =============================================================================

    // This is a placeholder for maintaining a view of the changing state of the simulation using
    // nested HTML block elements.

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function (nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType) {

        vwf.logger.info(namespace + ".createdNode " + nodeID + " " +
            nodeExtendsID + " " + nodeImplementsIDs + " " + nodeSource + " " + nodeType);

        var nodeQuery = jQuery(".vwf-orphanage").append(
            "<div id='view-html-" + nodeID + "' class='vwf-node'>" +
                "<p class='vwf-label'>" +
                    nodeID + " " + "<span class='vwf-name'/>" +
                        (nodeExtendsID || (nodeImplementsIDs && nodeImplementsIDs.length) ? ", type: " : "") +
                    "<span class='vwf-attribute'>" +
                        ([nodeExtendsID].concat(nodeImplementsIDs || []).join(", ")) +
                    "</span>" +
                    (nodeSource ? "&nbsp;&nbsp;<span class='vwf-attribute'>" +
                        "source=\"" + nodeSource + "\" type=\"" + (nodeType || "") + "\"" +
                    "</span>" : "") +
                "</p>" +
            "</div>"
        ).children(":last");

        nodeQuery.children(".vwf-label").click(function () {
            jQuery(this).siblings(".vwf-properties, .vwf-methods, .vwf-events, .vwf-children, .vwf-scripts").toggle();
        });

    };

    module.prototype.addedChild = function (nodeID, childID, childName) {

        vwf.logger.info(namespace + ".addedChild " + nodeID + " " + childID + " " + childName);

        var nodeQuery = jQuery(nodeID == 0 ? ".vwf-root" : "#view-html-" + nodeID); // TODO: const for root id
        var containerQuery = nodeID == 0 ? nodeQuery : nodeQuery.children(".vwf-children");

        if (containerQuery.length == 0) {

            containerQuery = nodeQuery.append(
                "<div class='vwf-children'>" +
                    "<p class='vwf-label'>Children</p>" +
                "</div>"
            ).children(":last");

            containerQuery.children(".vwf-label").click(function () {
                jQuery(this).siblings(".vwf-node").toggle();
            });

        }

        var childQuery = jQuery("#view-html-" + childID);
        childQuery.find(".vwf-name").first().html(childName);
        containerQuery.append(childQuery);

    };

    // -- createdProperty --------------------------------------------------------------------------

    module.prototype.createdProperty = function (nodeID, propertyName, propertyValue) {

        vwf.logger.info(namespace + ".createdProperty " + nodeID + " " + propertyName + " " + propertyValue);

        var nodeQuery = jQuery(nodeID == 0 ? ".vwf-root" : "#view-html-" + nodeID); // TODO: const for root id
        var containerQuery = nodeQuery.children(".vwf-properties");

        if (containerQuery.length == 0) {

            containerQuery = nodeQuery.append(
                "<div class='vwf-properties'>" +
                    "<p class='vwf-label'>Properties</p>" +
                "</div>"
            ).children(":last");

            containerQuery.children(".vwf-label").click(function () {
                jQuery(this).siblings(".vwf-property").toggle();
            });

        }

        var propertyQuery;

        if (propertyName == "angle") {
            propertyQuery = containerQuery.append(
                "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + JSON.stringify(propertyValue) + "</span>" +
                    "</p>" +
            // Demo hack 3
                    "<div class='vwf-control-slider'></div>" +
                "</div>"
            ).children(":last");
        } else if (propertyName == "eulers") {
            var propValue = JSON.stringify(propertyValue);
            var values = propValue.replace("[", "");
            values = values.replace("]", "");
            values = values.split(',');
            propertyQuery = containerQuery.append(
                "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + propValue + "</span>" +
                    "</p>" +

                    "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                        "<p class='vwf-label'>Roll: " +
                            "<span class='vwf-value'>" + values[0] + "</span>" +
                        "</p>" +
                    "<div class='vwf-control-roll-slider' id='slider-roll'></div>" +

                    "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                        "<p class='vwf-label'>Pitch: " +
                            "<span class='vwf-value'>" + values[1] + "</span>" +
                        "</p>" +
                    "<div class='vwf-control-pitch-slider' id='slider-pitch'></div>" +

                    "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                        "<p class='vwf-label'>Yaw: " +
                            "<span class='vwf-value'>" + values[2] + "</span>" +
                        "</p>" +
                    "<div class='vwf-control-yaw-slider' id='slider-yaw'></div>" +
                "</div>"
            ).children(":last");
        }
        else {
            propertyQuery = containerQuery.append(
                "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + JSON.stringify(propertyValue) + "</span>" +
            // Demo hack 2
            // "<input type='text' class='vwf-control'></input>" +
                    "</p>" +
                "</div>"
            ).children(":last");
        }

        var view = this;

        // Demo hack 1: increment by 1 on click

        propertyQuery.click(function () {
            var nodeID = Number(jQuery(this).parents(".vwf-node")[0].id.split("-").pop()) || 0; // TODO: symbol for global id
            var nodeQuery = jQuery(nodeID == 0 ? ".vwf-root" : "#view-html-" + nodeID);
            var propertyQuery = nodeQuery.children(".vwf-properties").children("#view-html-" + nodeID + "-" + propertyName);
            view.setProperty(nodeID, propertyName, Number(JSON.parse(propertyQuery.find(".vwf-value").text())) + 1);
        });

        // Demo hack 2: show a text control and update character-by-character

        // var controlQuery = propertyQuery.find( ".vwf-control" );

        // controlQuery.keyup( function() {
        //     var nodeID = Number( jQuery(this).parents( ".vwf-node" )[0].id.split("-").pop() ) || 0; // TODO: symbol for global id
        //     view.setProperty( nodeID, propertyName, jQuery(this).val() );
        // } );

        // controlQuery.change( function() {
        //     var nodeID = Number( jQuery(this).parents( ".vwf-node" )[0].id.split("-").pop() ) || 0; // TODO: symbol for global id
        //     view.setProperty( nodeID, propertyName, jQuery(this).val() ); // TODO: json exceptions?
        // } );

        // Demo hack 3: attach a slider

        if (propertyName == "angle") {
            propertyQuery.find(".vwf-control-slider").slider({
                range: "min",
                value: 0,
                min: 0,
                max: 360,
                slide: function (event, ui) {
                    vwf.logger.info("setProperty " + nodeID + "  " + propertyName);
                    view.setProperty(nodeID, propertyName, Number(ui.value));
                }
            });
        }
        else if (propertyName == "eulers") {
            propertyQuery.find(".vwf-control-roll-slider").slider({
                range: "min",
                value: 0,
                min: 0,
                max: 360,
                slide: function (event, ui) {
                    var pitch = $("#slider-pitch").slider("value");
                    var yaw = $("#slider-yaw").slider("value");
                    if (!pitch) pitch = 0;
                    if (!yaw) yaw = 0;
                    var propertyValue = [Number(ui.value), Number(pitch), Number(yaw)];

                    vwf.logger.info("setProperty " + nodeID + "." + propertyName + " = " + propertyValue);
                    view.setProperty(nodeID, propertyName, JSON.stringify(propertyValue));
                }
            });
            propertyQuery.find(".vwf-control-pitch-slider").slider({
                range: "min",
                value: 0,
                min: 0,
                max: 360,
                slide: function (event, ui) {
                    var roll = $("#slider-roll").slider("value");
                    var yaw = $("#slider-yaw").slider("value");
                    if (!roll) roll = 0;
                    if (!yaw) yaw = 0;
                    var propertyValue = [Number(roll), Number(ui.value), Number(yaw)];

                    vwf.logger.info("setProperty " + nodeID + "." + propertyName + " = " + propertyValue);
                    view.setProperty(nodeID, propertyName, JSON.stringify(propertyValue));
                }
            });
            propertyQuery.find(".vwf-control-yaw-slider").slider({
                range: "min",
                value: 0,
                min: 0,
                max: 360,
                slide: function (event, ui) {
                    var roll = $("#slider-roll").slider("value");
                    var pitch = $("#slider-pitch").slider("value");
                    if (!roll) roll = 0;
                    if (!pitch) pitch = 0;
                    var propertyValue = [Number(roll), Number(pitch), Number(ui.value)];

                    vwf.logger.info("setProperty " + nodeID + "." + propertyName + " = " + propertyValue);
                    view.setProperty(nodeID, propertyName, JSON.stringify(propertyValue));
                }
            });
        }


    };

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function (nodeID, propertyName, propertyValue) {

        if (propertyName == "eulers" && propertyValue.constructor != Array)
            propertyValue = JSON.parse(propertyValue);
        vwf.logger.info(namespace + ".satProperty " + nodeID + " " + propertyName + " " + propertyValue);

        var nodeQuery = jQuery(nodeID == 0 ? ".vwf-root" : "#view-html-" + nodeID); // TODO: symbol for global id
        var propertyQuery = nodeQuery.children(".vwf-properties").children("#view-html-" + nodeID + "-" + propertyName);

        // Demo hack 1

        propertyQuery.find(".vwf-value").text(JSON.stringify(propertyValue));

        // Demo hack 2

        // var controlQuery = propertyQuery.find(".vwf-control");

        // controlQuery.val() == propertyValue && typeof controlQuery.val() == typeof propertyValue ||
        //     controlQuery.val( propertyValue );

        // Demo hack 3

        if (propertyName == "angle") {
            propertyQuery.find(".vwf-control-slider").slider("value", Number(propertyValue));
        } else if (propertyName == "eulers") {
            var propValue = JSON.stringify(propertyValue);
            var values = propValue.replace("[", "");
            values = values.replace("]", "");
            values = values.split(',');
            propertyQuery.find(".vwf-control-roll-slider").slider("value", Number(values[0]));
            propertyQuery.find(".vwf-control-pitch-slider").slider("value", Number(values[1]));
            propertyQuery.find(".vwf-control-yaw-slider").slider("value", Number(values[2]));

        }

    };

})(window.vwf.modules, "vwf.view.html");




//( function( window ) {

//    var HTMLShard = function( vwf, rootSelector ) {

//        if ( ! vwf ) return;

//        jQuery( rootSelector ).append( "<div class='vwf-orphanage' style='display:none'></div>" )

//        this.onConstruct = function( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType ) {

//            if ( nodeID == 0 ) { // TODO: const for root id
//            
//                var nodeQuery = jQuery( rootSelector ).addClass( "vwf-node" ).append(
//                    "<p class='vwf-label'>" +
//                        "<span class='vwf-attribute'>" +
//                            ( [ nodeExtends ].concat( nodeImplements || [] ).join( ", " ) ) +
//                        "</span>" +
//                        ( nodeSource ? "&nbsp;&nbsp;<span class='vwf-attribute'>" +
//                            "source=\"" + nodeSource + "\" type=\"" + ( nodeType || "" ) + "\"" +
//                        "</span>" : "" ) +
//                    "</p>"
//                );
//            
//            } else {

//                var nodeQuery = jQuery( ".vwf-orphanage" ).append(
//                    "<div id='" + nodeID + "' class='vwf-node'>" +
//                        "<p class='vwf-label'>" + nodeName + ( nodeExtends || ( nodeImplements && nodeImplements.length ) ? ": " : "" ) +
//                            "<span class='vwf-attribute'>" +
//                                ( [ nodeExtends ].concat( nodeImplements || [] ).join( ", " ) ) +
//                            "</span>" +
//                            ( nodeSource ? "&nbsp;&nbsp;<span class='vwf-attribute'>" +
//                                "source=\"" + nodeSource + "\" type=\"" + ( nodeType || "" ) + "\"" +
//                            "</span>" : "" ) +
//                        "</p>" +
//                    "</div>"
//                ). children( ":last" );

//            }

//            nodeQuery.children( ".vwf-label" ).click( function() {
//                jQuery(this).siblings( ".vwf-properties, .vwf-methods, .vwf-events, .vwf-children, .vwf-scripts" ).toggle();
//            } );

//        };

//        this.onDestruct = function( nodeID ) {

//        };

//        this.onChildAdded = function( nodeID, childID ) { // TODO: node undef for root?

//            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );
//            var containerQuery = nodeQuery.children( ".vwf-children" );

//            if ( containerQuery.length == 0 ) {

//                containerQuery = nodeQuery.append(
//                    "<div class='vwf-children'>" +
//                        "<p class='vwf-label'>Children</p>" +
//                    "</div>"
//                ).children( ":last" );

//                containerQuery.children( ".vwf-label" ).click( function() {
//                    jQuery(this).siblings( ".vwf-node" ).toggle();
//                } );

//            }

//            var childQuery = jQuery( "#" + childID );
//            containerQuery.append( childQuery );

//        };

//        this.onChildRemoved = function( nodeID ) {

//        };

//        this.onResolveAddress = function( nodeID ) {

//        };

//        this.onChildren = function( nodeID ) {

//        };

//        this.onCreateProperty = function( nodeID, propertyName, propertyValue ) {

//            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );
//            var containerQuery = nodeQuery.children( ".vwf-properties" );

//            if ( containerQuery.length == 0 ) {

//                containerQuery = nodeQuery.append(
//                    "<div class='vwf-properties'>" +
//                        "<p class='vwf-label'>Properties</p>" +
//                    "</div>"
//                ).children( ":last" );

//                containerQuery.children( ".vwf-label" ).click( function() {
//                    jQuery(this).siblings( ".vwf-property" ).toggle();
//                } );

//            }

//            var propertyQuery = containerQuery.append(
//                "<div id='" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
//                    "<p class='vwf-label'>" + propertyName + ": " +
//                        "<span class='vwf-value'>" + JSON.stringify( propertyValue ) + "</span>" +
//                        // Demo hack 2
//                        // "<input type='text' class='vwf-control'></input>" +
//                    "</p>" +
//                "</div>"
//            ). children( ":last" );
//            
//            // Demo hack 1: increment by 1 on click
//            
//            propertyQuery.click( function() {
//                var nodeID = Number( jQuery(this).parents( ".vwf-node" )[0].id ) || 0; // TODO: symbol for global id
//                var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );
//                var propertyQuery = nodeQuery.children( ".vwf-properties" ).children( "#" + nodeID + "-" + propertyName );
//                vwf.setProperty( nodeID, propertyName, Number( JSON.parse( propertyQuery.find( ".vwf-value" ).text() ) ) + 1 );
//            } );

//            // Demo hack 2: show a text control and update character-by-character

//            // var controlQuery = propertyQuery.find( ".vwf-control" );

//            // controlQuery.keyup( function() {
//            //     var nodeID = Number( jQuery(this).parents( ".vwf-node" )[0].id ) || 0; // TODO: symbol for global id
//            //     vwf.setProperty( nodeID, propertyName, jQuery(this).val() );
//            // } );

//            // controlQuery.change( function() {
//            //     var nodeID = Number( jQuery(this).parents( ".vwf-node" )[0].id ) || 0; // TODO: symbol for global id
//            //     vwf.setProperty( nodeID, propertyName, jQuery(this).val() ); // TODO: json exceptions?
//            // } );
//            
//            return undefined;
//        };

//        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {

//            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );

//            var propertyQuery = nodeQuery.children( ".vwf-properties" ).children( "#" + nodeID + "-" + propertyName );

//            // Demo hack 1

//            propertyQuery.find( ".vwf-value" ).text( JSON.stringify( propertyValue ) );

//            // Demo hack 2

//            // var controlQuery = propertyQuery.find(".vwf-control");

//            // controlQuery.val() == propertyValue && typeof controlQuery.val() == typeof propertyValue ||
//            //     controlQuery.val( propertyValue );

//            return undefined;
//        };

//        this.onGetProperty = function( nodeID, propertyName ) {

//            return undefined;
//        };
//        
//        this.onCreateMethod = function( nodeID, methodName ) {
//        
//            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );
//            var containerQuery = nodeQuery.children( ".vwf-methods" );

//            if ( containerQuery.length == 0 ) {

//                containerQuery = nodeQuery.append(
//                    "<div class='vwf-methods'>" +
//                        "<p class='vwf-label'>Methods</p>" +
//                    "</div>"
//                ).children( ":last" );

//                containerQuery.children( ".vwf-label" ).click( function() {
//                    jQuery(this).siblings( ".vwf-method" ).toggle();
//                } );

//            }

//            var methodQuery = containerQuery.append(
//                "<div id='" + nodeID + "-" + methodName + "' class='vwf-method'>" +
//                    "<p class='vwf-label'>" + methodName + "</p>" +
//                "</div>"
//            ). children( ":last" );
//        };

//        this.onCallMethod = function( nodeID, methodName ) {
//        
//        };

//        this.onCreateEvent = function( nodeID, eventName ) {
//        
//            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );
//            var containerQuery = nodeQuery.children( ".vwf-events" );

//            if ( containerQuery.length == 0 ) {

//                containerQuery = nodeQuery.append(
//                    "<div class='vwf-events'>" +
//                        "<p class='vwf-label'>Events</p>" +
//                    "</div>"
//                ).children( ":last" );

//                containerQuery.children( ".vwf-label" ).click( function() {
//                    jQuery(this).siblings( ".vwf-event" ).toggle();
//                } );

//            }

//            var eventQuery = containerQuery.append(
//                "<div id='" + nodeID + "-" + eventName + "' class='vwf-event'>" +
//                    "<p class='vwf-label'>" + eventName + "</p>" +
//                "</div>"
//            ). children( ":last" );

//        };

//        this.onFireEvent = function( nodeID, eventName ) {
//        
//        };

//        this.onExecute = function( nodeID, scriptText, scriptType ) {

//            var nodeQuery = jQuery( nodeID == 0 ? rootSelector : "#" + nodeID );
//            var containerQuery = nodeQuery.children( ".vwf-scripts" );

//            if ( containerQuery.length == 0 ) {

//                containerQuery = nodeQuery.append(
//                    "<div class='vwf-scripts'>" +
//                        "<p class='vwf-label'>Scripts</p>" +
//                    "</div>"
//                ).children( ":last" );

//                containerQuery.children( ".vwf-label" ).click( function() {
//                    jQuery(this).siblings( ".vwf-script" ).toggle();
//                } );

//            }

//            var scriptQuery = containerQuery.append(
//                "<div class='vwf-script'>" +
//                    "<p class='vwf-label'><span class='vwf-attribute'>" + scriptType + "</span>&nbsp;&nbsp;" + scriptText + "</p>" +
//                "</div>"
//            ). children( ":last" );

//        };

//        this.onTick = function( time ) {
//        
//        };

//        var findOrCreate = function( contextQuery, traverser, manipulator ) {
//            var traversalQuery = traverser.call( contextQuery );
//            return traversalQuery.length ? traversalQuery : manipulator.call( contextQuery );
//        };
//        
//        return this;

//    };

//    return window.vwf.html = HTMLShard;

//} ) ( window );
