"use strict";

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

    var logger;

    return model.load( module, {

        initialize: function() {
            var lastKernel;
            this.state.overlays = {};
            this.state.elements = {};
            lastKernel = this.kernel;
            while ( lastKernel.kernel ) {
                lastKernel = lastKernel.kernel;
            }
            this.state.kernel = lastKernel;
            logger = this.logger;
        },

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            var node = undefined;
            var protos = getPrototypes.call( this, this.state.kernel, childExtendsID );

            if ( protos && isOverlay( protos ) ) {

                node = this.state.overlays[ childID ] = {
                    "id": childID,
                    "name": childName,
                    "elements": {},
                    "properties": {
                        "visible": undefined
                    },
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
                node.initialized = false;

            }
        },

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        initializingProperty: function( nodeID, propertyName, propertyValue ) {
            var value = undefined;

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
            var node, value;

            if ( this.state.overlays[ nodeID ] ) {

                node = this.state.overlays[ nodeID ];
                if ( node.properties.hasOwnProperty( propertyName ) ) {
                    node.properties[ propertyName ] = propertyValue;
                    value = propertyValue;
                }

            } else if ( this.state.elements[ nodeID ] ) {

                node = this.state.elements[ nodeID ];
                if ( node.properties.hasOwnProperty( propertyName ) ) {
                    node.properties[ propertyName ] = propertyValue;
                } else {
                    node.drawProperties[ propertyName ] = propertyValue;
                }
                value = propertyValue;

            }

            return value;
        },

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {
            if ( this.state.elements[ nodeID ] ) {
                var node = this.state.elements[ nodeID ];
                if ( methodName === "draw" ) {
                    node.draw = methodBody;
                }
            }
        },

        callingMethod: function( nodeID, methodName, methodParameters, methodValue ) {
            if ( this.state.elements[ nodeID ] ) {
                var node = this.state.elements[ nodeID ];
                if ( methodName === "draw" ) {
                    this.logger.errorx( "callingMethod", "The draw method should not be called " +
                        "from outside the HUD driver!" );
                    return undefined;
                }
            }
        },

    } );

    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;
        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
        return prototypes;
    }

    function isOverlay( prototypes ) {
        var foundOverlay = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundOverlay; i++ ) {
                foundOverlay = ( prototypes[i] == "http-vwf-example-com-hud-overlay-vwf" );    
            }
        }

        return foundOverlay;
    }

    function isElement( prototypes ) {
        var foundElement = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundElement; i++ ) {
                foundElement = ( prototypes[i] == "http-vwf-example-com-hud-element-vwf" );    
            }
        }

        return foundElement;
    }

} );