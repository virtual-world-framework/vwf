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

        if (propertyName == "angle" || propertyName == "rotX" || propertyName == "rotY" || propertyName == "rotZ") {

            propertyQuery = containerQuery.append(
                "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + JSON.stringify(propertyValue) + "</span>" +
                    "</p>" +
                    "<div class='vwf-control-slider'></div>" +
                "</div>"
            ).children(":last");

        } else if (propertyName == "eulers" || propertyName == "worldEulers") {

            var propValue;
            if (typeof propertyValue == "String" || typeof propertyValue == "string" || propertyValue instanceof String)
                propValue = propertyValue;
            else
                propValue = JSON.stringify(propertyValue);
            var values = propValue.replace("[", "");
            values = values.replace("]", "");
            values = values.split(',');
            propertyQuery = containerQuery.append(
                "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + propValue + "</span>" +
                    "</p>" +
                    "<p class='vwf-label'>roll: " +
                        "<span class='vwf-control-roll-slider' id='slider-roll'></span>" +
                    "</p>" +
                    "<p class='vwf-label'>pitch: " +
                        "<span class='vwf-control-pitch-slider' id='slider-pitch'></span>" +
                    "</p>" +
                    "<p class='vwf-label'>yaw: " +
                        "<span class='vwf-control-yaw-slider' id='slider-yaw'></span>" +
                    "</p>" +
                "</div>"
            ).children(":last");

        } else if (propertyName == "position" || propertyName == "worldPosition" || propertyName == "scale") {

            var propValue;
            if (typeof propertyValue == "String" || typeof propertyValue == "string" || propertyValue instanceof String)
                propValue = propertyValue;
            else
                propValue = JSON.stringify(propertyValue);
            var values = propValue.replace("[", "");
            values = values.replace("]", "");
            values = values.split(',');
            propertyQuery = containerQuery.append(
                "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + propValue + "</span>" +
                    "</p>" +
                    "<p class='vwf-label'>x: " +
                        "<span class='vwf-control-x-slider' id='slider-x'></span>" +
                    "</p>" +
                    "<p class='vwf-label'>y: " +
                        "<span class='vwf-control-y-slider' id='slider-y'></span>" +
                    "</p>" +
                    "<p class='vwf-label'>z: " +
                        "<span class='vwf-control-z-slider' id='slider-z'></span>" +
                    "</p>" +
                "</div>"
            ).children(":last");

        } else if (typeof propertyValue == "Boolean" || typeof propertyValue == "boolean" || propertyValue instanceof Boolean) {

            propertyQuery = containerQuery.append(
                "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + JSON.stringify(propertyValue) + "</span>" +
	                    "<div class='vwf-" + propertyName + "-bool-control' id='bool-control'>" +
		                    "<input type='radio' class='vwf-" + propertyName + "-bool-control-true' id='" + nodeID + "-" + propertyName + "-true' name='" + nodeID + " - " + propertyName + "-radio' /><label for='bool-" + propertyName + "-true'>true</label>" +
		                    "<input type='radio' class='vwf-" + propertyName + "-bool-control-false' id='" + nodeID + "-" + propertyName + "-false' name='" + nodeID + " - " + propertyName + "-radio' checked='checked' /><label for='bool-" + propertyName + "-false'>false</label>" +
	                    "</div>" +
                    "</p>" +
                "</div>"
            ).children(":last");

        } else if (typeof propertyValue == "Number" || typeof propertyValue == "number" || propertyValue instanceof Number) {

            propertyQuery = containerQuery.append(
                "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + JSON.stringify(propertyValue) + "</span>" +
                        "<div class='vwf-" + propertyName + "-numeric-input' id='" + propertyName + "-numeric-input'>" +
	                        "<label for='tags'>Value: </label>" +
	                        "<input id='tags' />" +
                        "</div>" +
                    "</p>" +
                "</div>"
            ).children(":last");

        } else if (typeof propertyValue == "String" || typeof propertyValue == "string" || propertyValue instanceof String) {

            propertyQuery = containerQuery.append(
                "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + JSON.stringify(propertyValue) + "</span>" +
                        "<div class='vwf-" + propertyName + "-string-input' id='" + propertyName + "-string-input'>" +
	                        "<label for='tags'>Value: </label>" +
	                        "<input id='tags' />" +
                        "</div>" +
                    "</p>" +
                "</div>"
            ).children(":last");

        } else {

            propertyQuery = containerQuery.append(
                "<div id='view-html-" + nodeID + "-" + propertyName + "' class='vwf-property'>" +
                    "<p class='vwf-label'>" + propertyName + ": " +
                        "<span class='vwf-value'>" + JSON.stringify(propertyValue) + "</span>" +
                    "</p>" +
                "</div>"
            ).children(":last");

        }

        var view = this;

        if (propertyName == "angle" || propertyName == "rotX" || propertyName == "rotY" || propertyName == "rotZ") {

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

        } else if (propertyName == "eulers" || propertyName == "worldEulers") {

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

        } else if (propertyName == "position" || propertyName == "worldPosition" || propertyName == "scale") {

            propertyQuery.find(".vwf-control-x-slider").slider({
                range: "min",
                value: 0,
                min: -200,
                max: 200,
                slide: function (event, ui) {
                    var y = $("#slider-y").slider("value");
                    var z = $("#slider-z").slider("value");
                    if (!y) y = 0;
                    if (!z) z = 0;
                    var propertyValue = [Number(ui.value), Number(y), Number(z)];

                    vwf.logger.info("setProperty " + nodeID + "." + propertyName + " = " + propertyValue);
                    view.setProperty(nodeID, propertyName, JSON.stringify(propertyValue));
                }
            });
            propertyQuery.find(".vwf-control-y-slider").slider({
                range: "min",
                value: 0,
                min: -200,
                max: 200,
                slide: function (event, ui) {
                    var x = $("#slider-x").slider("value");
                    var z = $("#slider-z").slider("value");
                    if (!x) x = 0;
                    if (!z) z = 0;
                    var propertyValue = [Number(x), Number(ui.value), Number(z)];

                    vwf.logger.info("setProperty " + nodeID + "." + propertyName + " = " + propertyValue);
                    view.setProperty(nodeID, propertyName, JSON.stringify(propertyValue));
                }
            });
            propertyQuery.find(".vwf-control-z-slider").slider({
                range: "min",
                value: 0,
                min: -200,
                max: 200,
                slide: function (event, ui) {
                    var x = $("#slider-x").slider("value");
                    var y = $("#slider-y").slider("value");
                    if (!x) x = 0;
                    if (!y) y = 0;
                    var propertyValue = [Number(x), Number(y), Number(ui.value)];

                    vwf.logger.info("setProperty " + nodeID + "." + propertyName + " = " + propertyValue);
                    view.setProperty(nodeID, propertyName, JSON.stringify(propertyValue));
                }
            });

        } else if (typeof propertyValue == "Boolean" || typeof propertyValue == "boolean" || propertyValue instanceof Boolean) {

            var trueRadio = propertyQuery.find(".vwf-" + propertyName + "-bool-control-true");
            var falseRadio = propertyQuery.find(".vwf-" + propertyName + "-bool-control-false");

            if (propertyValue) trueRadio[0].checked = true;
            else falseRadio[0].checked = true;

            trueRadio.click(function () {
                view.setProperty(nodeID, propertyName, true);
            });
            falseRadio.click(function () {
                view.setProperty(nodeID, propertyName, false);
            });

        } else if (typeof propertyValue == "Number" || typeof propertyValue == "number" || propertyValue instanceof Number) {

            var numericInput = propertyQuery.find(".vwf-" + propertyName + "-numeric-input");
            numericInput[0].lastChild.value = propertyValue;
            numericInput.keydown(function (event) {
                // Prevent shift key since its not needed
                if (event.shiftKey == true) {
                    event.preventDefault();
                }
                // Allow Only: keyboard 0-9, numpad 0-9, backspace, tab, left arrow, right arrow, delete
                if ((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105) || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 37 || event.keyCode == 39 || event.keyCode == 46) {
                    // Allow normal operation
                } else {
                    // Prevent the rest
                    event.preventDefault();
                }
            });

            numericInput.keyup(function (event) {
                if (event.target && event.target.value && event.target.value != "")
                    view.setProperty(nodeID, propertyName, Number(event.target.value));
            });

        } else if (typeof propertyValue == "String" || typeof propertyValue == "string" || propertyValue instanceof String) {

            var stringInput = propertyQuery.find(".vwf-" + propertyName + "-string-input");

            stringInput[0].lastChild.value = propertyValue;
            stringInput.keyup(function (event) {
                if ( event.keyCode == 13 && event.target && event.target.value && event.target.value != "")
                    view.setProperty(nodeID, propertyName, event.target.value );
            });

        }
    };

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function (nodeID, propertyName, propertyValue) {

        var isVectorProp = false;
        if (propertyName == "eulers" || propertyName == "worldEulers" || propertyName == "position" || propertyName == "worldPosition" || propertyName == "scale")
            isVectorProp = true;

        if (isVectorProp && propertyValue.constructor != Array)
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

        if (propertyName == "angle" || propertyName == "rotX" || propertyName == "rotY" || propertyName == "rotZ") {

            propertyQuery.find(".vwf-control-slider").slider("value", Number(propertyValue));

        } else if (propertyName == "eulers" || propertyName == "worldEulers") {

            var propValue = JSON.stringify(propertyValue);
            var values = propValue.replace("[", "");
            values = values.replace("]", "");
            values = values.split(',');
            propertyQuery.find(".vwf-control-roll-slider").slider("value", Number(values[0]));
            propertyQuery.find(".vwf-control-pitch-slider").slider("value", Number(values[1]));
            propertyQuery.find(".vwf-control-yaw-slider").slider("value", Number(values[2]));
            propertyQuery.find(".vwf-roll-value").text(values[0]);
            propertyQuery.find(".vwf-pitch-value").text(values[1]);
            propertyQuery.find(".vwf-yaw-value").text(values[2]);

        } else if (propertyName == "position" || propertyName == "worldPosition" || propertyName == "scale") {

            var propValue = JSON.stringify(propertyValue);
            var values = propValue.replace("[", "");
            values = values.replace("]", "");
            values = values.split(',');
            propertyQuery.find(".vwf-control-x-slider").slider("value", Number(values[0]));
            propertyQuery.find(".vwf-control-y-slider").slider("value", Number(values[1]));
            propertyQuery.find(".vwf-control-z-slider").slider("value", Number(values[2]));
            propertyQuery.find(".vwf-x-value").text(values[0]);
            propertyQuery.find(".vwf-y-value").text(values[1]);
            propertyQuery.find(".vwf-z-value").text(values[2]);

        } else if (typeof propertyValue == "Boolean" || typeof propertyValue == "boolean" || propertyValue instanceof Boolean) {

            var trueRadio = propertyQuery.find(".vwf-" + propertyName + "-bool-control-true");
            var falseRadio = propertyQuery.find(".vwf-" + propertyName + "-bool-control-false");
            if (propertyValue) trueRadio[0].checked = true;
            else falseRadio[0].checked = true;

        } else if (typeof propertyValue == "Number" || typeof propertyValue == "number" || propertyValue instanceof Number) {

            var numericInput = propertyQuery.find(".vwf-" + propertyName + "-numeric-input");
            numericInput[0].lastChild.value = propertyValue;

        } else if (typeof propertyValue == "String" || typeof propertyValue == "string" || propertyValue instanceof String) {

            var stringInput = propertyQuery.find(".vwf-" + propertyName + "-string-input");
            stringInput[0].lastChild.value = propertyValue;

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
