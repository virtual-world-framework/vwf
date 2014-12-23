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

            //rs.setSymbologyStandard( rs.Symbology_2525Bch2_USAS_13_14 );  
            rs.setSymbologyStandard( rs.Symbology_2525C ); 
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

        // createdProperty: function (nodeID, propertyName, propertyValue) {
        //     this.satProperty(nodeID, propertyName, propertyValue);
        // },

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
                var clientThatCalledMethod = this.kernel.client();
                var me = this.kernel.moniker();
                switch ( methodName ) {
                    case "insertUnits":
                        if ( clientThatCalledMethod === me ) {
                            addInsertableUnits( methodParameters[ 0 ] );
                        }
                        break;
                    case "getUnitSymbol":
                        if ( clientThatCalledMethod === me ) {
                            getUnitSymbol( methodParameters[ 0 ], methodParameters[ 1 ], methodParameters[ 2 ], methodParameters[ 3 ], methodParameters[ 4 ], methodParameters[ 5 ] );
                        }
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
        var actualName = undefined;
        var searchAcronym = undefined;
        var searchName = undefined;
        var unitsToAdd = undefined;
        var image = undefined;
        var appID = self.kernel.application();
        var description = undefined;
        var unitDef;

        if ( cws ) {

            // units must be an object with battleDivision members that are defined in cws
            // ex. ground, sea, air, subsurface, space

            for ( var battleDivision in units ) {
                
                unitsToAdd = units[ battleDivision ];
                if ( ! ( unitsToAdd instanceof Array ) ) {
                    unitsToAdd = [ unitsToAdd ];
                }
                // unitsToAdd is now an array of acronyms from cws.defs
                // a series of acronyms make up the 'fullNames' of the units separated by '.'
                // those fullNames also kind of describe the hierarchy of the objects definition               

                for ( var i = 0; i < unitsToAdd.length; i++ ) {

                    searchAcronym = unitsToAdd[ i ];
                    searchName = cws.decode( searchAcronym );

                    // searchAcronym is a single acronym defined in CWS
                    // findAll will search through all of the fullNames 
                    // for this 'battleDivision' and return an array of those units

                    foundUnits = cws.findAll( battleDivision, searchAcronym );
                    if ( foundUnits ) {

                        // loop through the array and send out an event 
                        // so the application can present the user
                        // with options to add these units to the application instance

                        for ( fullName in foundUnits ) {
                            
                            unit = foundUnits[ fullName ];

                            // render all of the affiliations, so that the UI doesn't
                            // have to request them on an as needed basis
                            image = {
                                "unknown": getUnitImage( cws.unknown( unit.symbolID ) ),
                                "friendly": getUnitImage( cws.friendly( unit.symbolID ) ),
                                "neutral": getUnitImage( cws.neutral( unit.symbolID ) ),
                                "hostile": getUnitImage( cws.hostile( unit.symbolID ) )
                            };

                            description = cws.description( fullName, unit.tag );
                            actualName = cws.decode( cws.postTag( fullName, unit.tag ) ).replace( ".", " " );

                            unitDef = {
                                "fullName": fullName,
                                "actualName": actualName,
                                "searchAcronym": searchAcronym,
                                "searchName": searchName,
                                "description": description,
                                "tag": unit.tag,
                                "symbolID": unit.symbolID,
                                "image": image    
                            };

                            self.kernel.fireEvent( appID, "insertableUnitAdded", [ unitDef ] );
                        }
                    } else {
                        self.logger.warnx( "Unable to find: " + unitsToAdd[ i ] + " in " + battleDivision );
                    }
                }
            }

            self.kernel.fireEvent( appID, "unitLoadingComplete", [ true ] );
        }    
    }

    function getUnitSymbol( symbolID, affiliation, echelonID, modifierList, unit, options ) {
        var updatedUnit = {};
        var appID = self.kernel.application();
        var renderer = armyc2.c2sd.renderer;
        var msa = renderer.utilities.MilStdAttributes;
        var rs = renderer.utilities.RendererSettings;
        var symUtil = renderer.utilities.SymbolUtilities;
        var modifiers = {};

        self.logger.info(" Mil-SymJS  SymbolID before echelon and affiliation: " + symbolID );
    
        if ( cws ) {
            updatedUnit = unit;
            
            // Set affiliation in unit symbol id
            updatedUnit.symbolID = cws.addAffiliationToSymbolId( symbolID, affiliation );
            
            // Add echelon
            if ( echelonID != undefined ) {
                self.logger.info(" Mil-SymJS Adding Echelon: " + echelonID );            
                updatedUnit.symbolID = cws.addEchelonToSymbolId( updatedUnit.symbolID, echelonID );
                self.logger.info(" Mil-SymJS  SymbolID after echelon and affiliation: " + updatedUnit.symbolID );
            }
            
            // Add modifiers
            modifiers[ msa.PixelSize ] = "60";
            for ( var prop in modifierList ) {
                if (modifierList[prop] != undefined) {
                    switch ( prop ) {
                        case "pixelSize":
                        case "PixelSize":
                            modifiers[ msa.PixelSize ] = modifierList[ prop ];
                            break;
                        case "icon":
                        case "Icon":
                            modifiers[ msa.Icon ] = modifierList[ prop ];
                            break;
                        default:
                            modifiers[ prop ] = modifierList[ prop ];
                            break;
                    }
                }
            }
            
            // Define the list of valid modifiers
            updatedUnit.validModifiers = [];
            
            updatedUnit.validModifiers.push( "pixelSize" );
            var aliases = Object.keys( cws.aliasModifiers );
            for ( var i = 0; i < aliases.length; i++ ) {

                var alias = aliases[ i ];
                var modObj = cws.aliasModifiers[ alias ];
                
                var modifier = renderer.utilities.ModifiersUnits[ modObj.modifier ];
                if ( symUtil.hasModifier( updatedUnit.symbolID, 
                                          modifier,
                                          rs.getSymbologyStandard() ) ) {
                    // Add to the array of valid modifiers
                    updatedUnit.validModifiers.push( alias );
                }

            }
            
            // Render the unit image
            
            // if icon == true then you'll get no modifiers
            modifiers[ msa.Icon ] = false;
            
            modifiers[ msa.SymbologyStandard ] = rs.Symbology_2525C;
            var img = renderer.MilStdIconRenderer.Render( updatedUnit.symbolID, modifiers );
            if ( img ) {
                var imgBounds = img.getImageBounds();
                updatedUnit.image["selected"] = {
                    "url": img.toDataUrl(),
                    "width": imgBounds.width,
                    "height": imgBounds.height
                }
            }
        }

        var unitEvent = "selectedUnitSymbolRendered";
        if ( (options.request) && (options.unitID) ) {
            switch ( options.request ) {
                case "addQuickUnit":
                    unitEvent = "quickUnitAdded";
                    self.kernel.fireEvent( appID, unitEvent, [ options.unitID, updatedUnit ] );
                    break;
                case "addFavoriteUnit":
                    unitEvent = "favoriteUnitAdded";
                    self.kernel.fireEvent( appID, unitEvent, [ options.unitID, updatedUnit ] );
                    break;
                case "addRecentUnit":
                    var unitEvent = "recentUnitAdded";
                    self.kernel.fireEvent( appID, unitEvent, [ options.unitID, updatedUnit ] );
                    break;
                case "renderSelectedUnit":
                default:
                    // If nothing else, make this the selected unit
                    self.kernel.fireEvent( appID, unitEvent, [ updatedUnit ] );
                    break;
            }
        }
        else {
            self.kernel.fireEvent( appID, unitEvent, [ updatedUnit ] );
        }
    }
    
    function getUnitImage( symbolID ) {
        var renderer = armyc2.c2sd.renderer;
        var msa = renderer.utilities.MilStdAttributes;
        var rs = renderer.utilities.RendererSettings;
        var modifiers = {};

        modifiers[ msa.PixelSize ] = 32;
        modifiers[ msa.Icon ] = true;
        modifiers[ msa.SymbologyStandard ] = rs.Symbology_2525C;
        
        var img = renderer.MilStdIconRenderer.Render( symbolID, modifiers );
        if ( img ) {
            return img.toDataUrl();
        } else {
            return "";
        }
    }

} );
