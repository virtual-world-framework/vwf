// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

/// @module vwf/view/test
/// @requires vwf/view

define( [ "module", "vwf/view", "mil-sym/cws" ], function( module, view, cws ) {

    var self;

    return view.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
            self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            if ( options === undefined ) { options = {}; }

            if ( this.state === undefined ) {   
                this.state = {};
            }
            if ( this.state.nodes === undefined ) {   
                this.state.nodes = {};
            }

            var rs = armyc2.c2sd.renderer.utilities.RendererSettings;

            rs.setSymbologyStandard( rs.Symbology_2525Bch2_USAS_13_14 );  
            //rs.setSymbologyStandard( rs.Symbology_2525C ); 
            rs.setTextOutlineWidth( 1 );

        },

        // createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
        //     childSource, childType, childIndex, childName, callback /* ( ready ) */) {
            
        // },

        // initializedNode: function( nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName  ) {

        // },
 
 
        // -- deletedNode ------------------------------------------------------------------------------

        // deletedNode: function( childID ) { },

        // -- addedChild -------------------------------------------------------------------------------

        //addedChild: function( nodeID, childID, childName ) { },

        // -- removedChild -----------------------------------------------------------------------------

        //removedChild: function( nodeID, childID ) { },

        // -- createdProperty --------------------------------------------------------------------------

   //      createdProperty: function (nodeID, propertyName, propertyValue) {
            // this.satProperty(nodeID, propertyName, propertyValue);
   //      },

        // -- initializedProperty ----------------------------------------------------------------------

        // initializedProperty: function ( nodeID, propertyName, propertyValue ) { 
        //     this.satProperty(nodeID, propertyName, propertyValue);
        // },

        // TODO: deletedProperty

        // -- satProperty ------------------------------------------------------------------------------

        // satProperty: function ( nodeID, propertyName, propertyValue ) { 
        // },

        // -- gotProperty ------------------------------------------------------------------------------

        // gotProperty: function ( nodeID, propertyName, propertyValue ) { 
        // },

        // -- calledMethod -----------------------------------------------------------------------------

        calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {
            if ( nodeID === this.kernel.application() ) {
                switch ( methodName ) {
                    case "insertUnits":
                        addInsertableUnits( methodParameters[ 0 ] );
                        break;
                }
            } 
        },

        // -- firedEvent -----------------------------------------------------------------------------

        // firedEvent: function( nodeID, eventName, eventParameters ) {
        // },

        // -- ticked -----------------------------------------------------------------------------------

        // ticked: function() {
        // },


    } );

    function addInsertableUnits( units ) {
        var foundUnits = undefined;
        var unit = undefined;
        var fullName = undefined;
        var unitsToAdd = undefined;
        var image = undefined;
        var appID = self.kernel.application();
        var description = undefined;

        if ( cws ) {
            for ( var location in units ) {
                unitsToAdd = units[ location ];
                if ( ! ( unitsToAdd instanceof Array ) ) {
                    unitsToAdd = [ unitsToAdd ];
                }                

                for ( var i = 0; i < unitsToAdd.length; i++ ) {
                    foundUnits = cws.findAll( location, unitsToAdd[ i ] );
                    if ( foundUnits ) {
                        for ( fullName in foundUnits ) {
                            unit = foundUnits[ fullName ];
                            image = getUnitImage( unit.symbolID );
                            description = cws.description( fullName, unit.tag );
                            self.kernel.callMethod( appID, "insertableUnitAdded", [ fullName, description, unit.tag, unit.symbolID, image ] );
                        }
                    } else {
                        self.logger.warnx( "Unable to find: " + unitsToAdd[ i ] + " in " + location );
                    }
                }
            }
        }    
    }

    function getUnitImage( symbolID ) {
        var renderer = armyc2.c2sd.renderer;
        var msa = renderer.utilities.MilStdAttributes;
        var rs = renderer.utilities.RendererSettings;
        var modifiers = {};

        modifiers[ msa.PixelSize ] = 32;
        modifiers[ msa.Icon ] = true;
        modifiers[ msa.SymbologyStandard ] = rs.Symbology_2525Bch2_USAS_13_14;
        
        //console.info( "Render( "+symbolID+", "+JSON.stringify( modifiers )+" )" )
        var img = renderer.MilStdIconRenderer.Render( symbolID, modifiers );
        if ( img ) {
            return img.toDataUrl();
        } else {
            return "";
        }
    }


} );
