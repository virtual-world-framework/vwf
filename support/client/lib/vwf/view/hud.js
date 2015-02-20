"use strict";

define( [ "module", "vwf/model", "vwf/utility", "vwf/view/hud/hud" ], function( module, model, utility, HUD ) {

    return model.load( module, {

        initialize: function() {},

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
            var value;
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
            if ( this.state.overlays[ nodeID ] ) {
                node = this.state.overlays[ nodeID ];
                if ( node.initialized && node.properties.hasOwnProperty( propertyName ) ) {
                    node.viewObject[ propertyName ] = propertyValue;
                }
                value = propertyValue;
            } else if ( this.state.elements[ nodeID ] ) {
                node = this.state.elements[ nodeID ];
                if ( node.initialized ) {
                    if ( propertyName === "images" ) {
                        updateImages( node, propertyValue );
                    } else if ( node.properties.hasOwnProperty( propertyName ) ||
                        node.drawProperties.hasOwnProperty( propertyName ) ) {
                        node.viewObject[ propertyName ] = propertyValue;
                    }
                }
                value = propertyValue;
            }
            return value;
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
        if ( node.elementPreDraw ) {
            overlay.elementPreDraw = function( context, element ) {
                eval( node.elementPreDraw )
            }
        }
        if ( node.elementPostDraw ) {
            overlay.elementPostDraw = function( context, element ) {
                eval( node.elementPostDraw )
            }
        }
        if ( node.globalPreDraw ) {
            overlay.globalPreDraw = function( context ) {
                eval( node.globalPreDraw )
            }
        }
        if ( node.globalPostDraw ) {
            overlay.globalPostDraw = function( context ) {
                eval( node.globalPostDraw )
            }
        }
        return overlay;
    }

    function createElement( node ) {
        var props = node.properties;
        var drawProps = node.drawProperties;
        var drawFunction = function( context, position ) { eval( node.draw ) };
        var element = new HUD.Element( node.name, drawFunction, props.width, props.height, props.visible );
        var i, keys, images;
        // Add custom properties to the element
        keys = Object.keys( drawProps );
        for ( i = 0; i < keys.length; i++ ) {
            element[ keys[ i ] ] = drawProps[ keys[ i ] ];
        }
        // Add images to the element as properties
        if ( props.images ) {
            images = loadImages( node );
            keys = Object.keys( images );
            for ( i = 0; i < keys.length; i++ ) {
                element[ keys[ i ] ] = images[ keys[ i ] ];
            }
        }
        // Add event listeners to the element
        element.onClick = function( event ) {
            vwf_view.kernel.fireEvent( node.id, "onClick" );
        };
        element.onMouseDown = function( event ) {
            vwf_view.kernel.fireEvent( node.id, "onMouseDown" );
        };
        element.onMouseUp = function( event ) {
            vwf_view.kernel.fireEvent( node.id, "onMouseUp" );
        };
        element.onMouseMove = function( event ) {
            vwf_view.kernel.fireEvent( node.id, "onMouseMove" );
        };
        element.onMouseOver = function( event ) {
            vwf_view.kernel.fireEvent( node.id, "onMouseOver" );
        };
        element.onMouseOut = function( event ) {
            vwf_view.kernel.fireEvent( node.id, "onMouseOut" );
        };
        return element;
    }

    function loadImages( node ) {
        var images = node.properties.images;
        var keys = Object.keys( images );
        var image, src;
        var results = {};
        for ( var i = 0; i < keys.length; i++ ) {
            image = new Image();
            src = images[ keys[ i ] ];
            if ( src ) {
                image.src = src;
            }
            results[ keys[ i ] ] = image;
        }
        return results;
    }

    function updateImages( node, images ) {
        var keys = Object.keys( images );
        var newImageSrc, oldImage;
        for ( var i = 0; i < keys.length; i++ ) {
            newImageSrc = images[ keys[ i ] ];
            oldImage = node.viewObject[ keys[ i ] ];
            if ( newImageSrc && oldImage instanceof Image && newImageSrc !== oldImage.src ) {
                oldImage.src = newImageSrc;
            }
        }
    }

} );