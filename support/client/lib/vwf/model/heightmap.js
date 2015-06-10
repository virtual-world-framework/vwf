/// vwf/model/heightmap.js is a driver for the heightmap.vwf component.
/// 
/// @module vwf/model/heightmap
/// @requires vwf/model

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.nodes = {};
        },

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            var protos = this.kernel.prototypes( childID );

            if ( isHeightmap( protos ) ) {
                
                var node = this.nodes[ childID ];

                // Create the local copy of the node properties
                if ( this.nodes[ childID ] === undefined && childSource !== undefined ){

                    // Suspend the queue until the load is complete
                    callback( false );

                    // Load the source file
                    var heightmapImage = new Image();
                    // heightmapImage.src = childSource;
                    heightmapImage.src = utility.resolveURI( childSource );

                    var driver = this;

                    heightmapImage.onload = function() {
                        // Create a canvas that we can draw the image into and read back 
                        // the pixels
                        var canvas = document.createElement( "canvas" );
                        canvas.setAttribute( "width", heightmapImage.width );
                        canvas.setAttribute( "height", heightmapImage.height );
                        // document.body.appendChild( canvas );
                        var context = canvas.getContext( "2d" );
                        context.drawImage( heightmapImage, 0, 0 );
                        var heightmap = context.getImageData( 0, 0, heightmapImage.width, 
                            heightmapImage.height );

                        // Store the heightmap on the node for future use
                        driver.nodes[ childID ] = {
                            heightmap: heightmap.data,
                            width: heightmapImage.width,
                            height: heightmapImage.height,
                        }

                        // Resume the queue now that the heightmap image has completely loaded
                        callback( true );
                    }                  
                }
            }
           
        },

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            
            // See if we have stored this node (meaning it is a heightmap node)
            var node = this.nodes[ nodeID ];
            
            // If it is not a heightmap node, we don't care about it, so return            
            if ( !node ) {
                return;
            }

            switch ( propertyName ) {
                case "heightmap":
                    return node.heightmap;
                case "heightmapWidth":
                    return node.width;
                case "heightmapHeight":
                    return node.height;
            }
        }

    } );

    function isHeightmap( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[ i ] === "http://vwf.example.com/heightmap.vwf" );
            }
        }
        return found;
    }

} );
