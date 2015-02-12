"use strict";

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

    var logger;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

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

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            var node = undefined;
            var protos = getPrototypes.call( this, kernel, childExtendsID );

            if ( protos && isOverlay( protos ) ) {

                node = this.state.overlays[ childID ] = {
                    "elements": {},
                    "properties": {},
                    "initialized": false
                };

            } else if ( protos && isElement( protos ) ) {

                node = this.state.elements[ childID ] = {
                    "overlay": this.state.overlays[ node.parentID ],
                    "properties": {},
                    "drawProperties": {},
                    "initialized": false
                };
                node.overlay.elements[ childID ] = node;
                node.initialized = false;

            }
        },

        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {

            var node;

            if ( this.state.overlays[ childID ] ) {

                node = this.state.overlays[ childID ];
                node.properties = {
                    "drawRate": undefined,
                    "visible": undefined
                };

            } else if ( this.state.elements[ childID ] ) {

                node = this.state.elements[ childID ];
                node.properties = {
                      "images": undefined,
                      "width": undefined,
                      "height": undefined,
                      "visible": undefined,
                      "enabled": undefined,
                      "alignH": undefined,
                      "alignV": undefined,
                      "offsetH": undefined,
                      "offsetV": undefined
                };
                node.drawProperties = {};

            }

        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

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

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
            var node, value;

            if ( this.state.overlays[ childID ] ) {

                node = this.state.overlays[ childID ];
                if ( node.properties.hasOwnProperty( propertyName ) ) {
                    node.properties[ propertyName ] = propertyValue;
                    value = propertyValue;
                }

            } else if ( this.state.elements[ childID ] ) {

                node = this.state.elements[ childID ];
                if ( node.properties.hasOwnProperty( propertyName ) ) {
                    if ( node.initialized ) {
                        switch ( propertyName ) {
                            case "images":
                                node.properties.images = loadImages( node, propertyValue );
                                break;
                        }
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

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
        },

        // -- creatingMethod ------------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {
            if ( this.state.elements[ nodeID ] ) {
                var node = this.state.elements[ nodeID ];
                if ( methodName === "draw" ) {
                    node.draw = methodBody;
                }
            }
        }

        // -- callingMethod ------------------------------------------------------------------------

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

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {
        },

    } );

    function loadImages( node, images ) {
        var keys = Object.keys( images );
        var newImage, oldImage;
        for ( var i = 0; i < keys.length; i++ ) {
            newImage = images[ keys[ i ] ];
            if ( !newImage.hasOwnProperty( "src" ) ) {
                logger.errorx( "loadImages", "Image \"" + keys[ i ] + "\" is malformed! It " +
                    "does not contain a \"src\" property! Skipping image load!" );
                continue;
            } else if ( !newImage.hasOwnProperty( "value" ) ) {
                logger.warnx( "loadImages", "Image \"" + keys[ i ] + "\" does not contain a " +
                    "\"value\" property! One will be generated automatically." );
            }
            oldImage = node.properties.images[ keys[ i ] ];
            // If the image property doesn't exist or the image hasn't been loaded or the image src
            // has changed, then we need to load the image. Otherwise, just copy the old image data
            if ( !oldImage || !( oldImage.value instanceof Image ) || oldImage.src !== newImage.src ) {
                newImage.value = new Image();
                newImage.value.src = newImage.src;
            } else {
                newImage = oldImage;
            }
        }
        return images;
    }

} );