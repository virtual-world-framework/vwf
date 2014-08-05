"use strict";

define( [ "module", "vwf/model", "vwf/configuration" ], function( module, model, configuration ) {

    return model.load( module, {

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            if ( childID.match( /prototype/ ) ) {

                callback( false );

                window.setTimeout( function() {
                    callback( true );
                }, 1000 );

            } else if ( childExtendsID && ! childExtendsID.match( /prototype/ ) ) {

                callback( false );

                window.setTimeout( function() {
                    callback( true );
                }, 1000 * Math.random() );

            }

        },

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName ) {
            this.kernel.prototypes( childID, true );
        },

    } );

} );
