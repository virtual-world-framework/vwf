"use strict";

define( [ "module", "vwf/view" ], function( module, view ) {

    return view.load( module, {

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                               childSource, childType, childIndex, childName, callback ) {
            if ( self.kernel.test( childID,
                                   "self::element(*,'http://vwf.example.com/soundManager.vwf')",
                                   childID ) ) {

                if ( this.state.soundManager !== undefined ) {
                    this.logger.errorx( "createdNode", "Sound manager already exists!  Ignoring this one..." );
                    return undefined;
                } 

                this.state.soundManager = {
                    "id": childID,
                    "name": childName
                };
            }
        }
    }
}
