"use strict";

var debugHUD;

define( [ "module", "vwf/model", "vwf/utility", "vwf/model/hud/hud" ], function( module, model, utility, HUD ) {

    return model.load( module, {

        initialize: function() {
            this.runningOverlays = {};
        },

        initializedNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {
            
            var node;
            if ( this.state.overlays[ childID ] ) {
                node = this.state.overlays[ childID ];
                node.viewObject = createOverlay( node );
                node.rafID = requestAnimationFrame( animateHUD.bind( node ) );
                node.initialized = true;
            } else if ( this.state.elements[ childID ] ) {
                node = this.state.elements[ childID ];
                node.viewObject = createElement( node );
                node.initialized = true;
            }
        },

        deletedNode: function( nodeID ) {

            if ( this.state.overlays[ nodeID ] ) {
                var node, keys, i;
                node = this.state.overlays[ nodeID ];
                cancelAnimationFrame( node.rafID );
                delete this.state.overlays[ nodeID ];
            } else if ( this.state.elements[ nodeID ] ) {
                var node, parent;
                node = this.state.elements[ nodeID ];
                delete this.state.elements[ nodeID ];
            }

        },

        createdProperty: function( nodeID, propertyName, propertyValue ) {
            return this.initializedProperty( nodeID, propertyName, propertyValue );
        },

        initializedProperty: function( nodeID, propertyName, propertyValue ) {
            var value = undefined;

            if ( propertyValue !== undefined ) {
                var node = this.state.overlays[ nodeID ] || this.state.elements[ nodeID ] ;
                if ( node !== undefined ) {
                    switch ( propertyName ) {
                        default:
                            value = this.satProperty( nodeID, propertyName, propertyValue );                  
                            break;
                    }
                }
            }

            return value;
        },

        satProperty: function( nodeID, propertyName, propertyValue ) {
            var value, node;
            if ( this.state.elements[ nodeID ] ) {
                node = this.state.elements[ nodeID ];
                if ( propertyName === "images" ) {
                    node.properties.images = loadImages( node, propertyValue );
                } else if ( node.drawProperties.hasOwnProperty( propertyName ) ) {
                    node.viewObject[ propertyName ] = propertyValue;
                }
            }
        }

    } );

    function animateHUD() {
        this.viewObject.update();
        requestAnimationFrame( animateHUD.bind( this ) );
    }

    function createOverlay( node ) {
        var overlay = new HUD();
        var keys = Object.keys( node.elements );
        var element, props;
        for ( var i = 0; i < keys.length; i++ ) {
            element = node.elements[ keys[ i ] ];
            props = element.properties;
            overlay.add( element.viewObject, props.alignH, props.alignV, props.offsetH, props.offsetV );
        }
        return overlay;
    }

    function createElement( node ) {
        var props = node.properties;
        var drawProps = node.drawProperties;
        var drawFunction = function( context, position ) { eval( node.draw ) };
        var element = new HUD.Element( node.name, drawFunction, props.width, props.height, props.visible );
        var i, keys;
        keys = Object.keys( drawProps );
        for ( i = 0; i < keys.length; i++ ) {
            element[ keys[ i ] ] = drawProps[ keys[ i ] ];
        }
        keys = Object.keys( props.images );
        for ( i = 0; i < keys.length; i++ ) {
            element[ keys[ i ] ] = props.images[ keys[ i ] ].value;
        }
        return element;
    }

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