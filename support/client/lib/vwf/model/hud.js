"use strict";

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

    var logger;

    return model.load( module, {

        initialize: function() {
            this.state.overlays = {};
            this.state.elements = {};
            logger = this.logger;
        },

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            var node;
            var protos = this.kernel.prototypes( childID );
            if ( protos && isOverlay( protos ) ) {
                node = this.state.overlays[ childID ] = {
                    "id": childID,
                    "name": childName,
                    "elements": {},
                    "properties": {
                        "visible": undefined
                    },
                    "drawProperties" : {},
                    "elementPreDraw": undefined,
                    "elementPostDraw": undefined,
                    "globalPreDraw": undefined,
                    "globalPostDraw": undefined,
                    "initialized": false
                };
            } else if ( protos && isElement( protos ) ) {
                node = this.state.elements[ childID ] = {
                    "id": childID,
                    "name": childName,
                    "overlay": this.state.overlays[ nodeID ],
                    "properties": {
                        "images": undefined,
                        "width": undefined,
                        "height": undefined,
                        "visible": undefined,
                        "enabled": undefined,
                        "alignH": undefined,
                        "alignV": undefined,
                        "offsetH": undefined,
                        "offsetV": undefined
                    },
                    "drawProperties": {},
                    "initialized": false
                };
                node.overlay.elements[ childID ] = node;
            }
        },

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        initializingProperty: function( nodeID, propertyName, propertyValue ) {
            var value;
            if ( propertyValue !== undefined ) {
                var node = this.state.overlays[ nodeID ] || this.state.elements[ nodeID ] ;
                if ( node !== undefined ) {
                    switch ( propertyName ) {
                        default:
                            value = this.settingProperty( nodeID, propertyName, propertyValue );                  
                            break;
                    }
                }
            }
            return value;
        },

        settingProperty: function( nodeID, propertyName, propertyValue ) {
            var node, value, images, keys, i, image;
            if ( this.state.overlays[ nodeID ] ) {
                node = this.state.overlays[ nodeID ];
                if ( node.properties.hasOwnProperty( propertyName ) ) {
                    node.properties[ propertyName ] = propertyValue;
                    value = propertyValue;
                } else {
                    node.drawProperties[ propertyName ] = propertyValue;
                }
            } else if ( this.state.elements[ nodeID ] ) {
                node = this.state.elements[ nodeID ];
                if ( node.properties.hasOwnProperty( propertyName ) ) {
                    if ( propertyName === "images" ) {
                        node.properties.images = propertyValue;
                    } else {
                        node.properties[ propertyName ] = propertyValue;
                    }
                } else {
                    node.drawProperties[ propertyName ] = propertyValue;
                }
                value = propertyValue;
            }

            return value;
        },

        gettingProperty: function( nodeID, propertyName ) {
            var node, value;
            if ( this.state.overlays[ nodeID ] ) {
                node = this.state.overlays[ nodeID ];
                if ( node.properties.hasOwnProperty( propertyName ) ) {
                    value = node.properties[ propertyName ];
                }
            } else if ( this.state.elements[ nodeID ] ) {
                node = this.state.elements[ nodeID ];
                if ( node.properties.hasOwnProperty( propertyName ) ) {
                    value = node.properties[ propertyName ];
                } else if ( node.drawProperties.hasOwnProperty( propertyName ) ) {
                    value = node.drawProperties[ propertyName ];
                }
            }
            return value;
        },

        callingMethod: function( nodeID, methodName, methodParameters, methodValue ) {
            var node;
            if ( this.state.overlays[ nodeID ] ) {
                node = this.state.overlays[ nodeID ];
                switch ( methodName ) {
                    case "elementPreDraw":
                    case "elementPostDraw":
                    case "globalPreDraw":
                    case "globalPostDraw":
                        this.logger.errorx( "callingMethod", "The " + methodName + " method should not " +
                            "be called from outside the HUD driver!" );
                        return;
                        break;
                }
            } else if ( this.state.elements[ nodeID ] ) {
                node = this.state.elements[ nodeID ];
                if ( methodName === "draw" ) {
                    this.logger.errorx( "callingMethod", "The draw method should not be called " +
                        "from outside the HUD driver!" );
                    return;
                }
            }
        }

    } );

    function isOverlay( prototypes ) {
        var foundOverlay = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundOverlay; i++ ) {
                foundOverlay = ( prototypes[i] == "http://vwf.example.com/hud/overlay.vwf" );    
            }
        }
        return foundOverlay;
    }

    function isElement( prototypes ) {
        var foundElement = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundElement; i++ ) {
                foundElement = ( prototypes[i] == "http://vwf.example.com/hud/element.vwf" );    
            }
        }
        return foundElement;
    }

} );