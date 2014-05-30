"use strict";

define( [ "module", "vwf/view" ], function( module, view ) {

    return view.load( module, {

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                               childSource, childType, childIndex, childName, callback ) {
            if ( this.kernel.test( childID,
                                   "self::element(*,'http://vwf.example.com/sound/soundManager.vwf')",
                                   childID ) ) {

                // If this is the prototype, exit early - we want to register the actual sound manager.
                if (nodeID === 0 && ( childID !== this.kernel.application() ) ) {
                    return undefined;
                }

                if ( this.state.soundManager.nodeID !== undefined ) {
                    this.logger.errorx( "createdNode", "Sound manager already exists!  Ignoring this one..." );
                    return undefined;
                } 

                this.state.soundManager = {
                    "nodeID": childID,
                    "name": childName
                };
            }
        }
    } );
} );
