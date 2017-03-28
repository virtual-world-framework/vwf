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

define( [ "module", "vwf/view", "mil-sym/cws", "jquery" ], function( module, view, cws, $ ) {

    var self;
    var eventHandlers = {};
    var _rendererReady = false;
    
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

            pollForFontsLoaded();
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

            //console.info( nodeID + " " + methodName );
            if ( nodeID === this.kernel.application() ) {
                var clientThatCalledMethod = this.kernel.client();
                var me = this.kernel.moniker();
                switch ( methodName ) {

                    case "insertUnits":
                        if ( clientThatCalledMethod === me ) {
                            addInsertableUnits( methodParameters[ 0 ] );
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

        renderUnitSymbol: renderUnitSymbol,
        rendererReady: rendererReady,

        on: function( eventName, callback ) {
            eventHandlers[ eventName ] = callback;
        }
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

                            fireViewEvent( "insertableUnitAdded", {
                                unit: unitDef
                            } );
                        }
                    } else {
                        self.logger.warnx( "Unable to find: " + unitsToAdd[ i ] + " in " + battleDivision );
                    }
                }
            }
            fireViewEvent( "unitLoadingComplete" );
        }    
    }

    function renderUnitSymbol( symbolID, affiliation, echelonID, modifierList, unit ) {
        
        if ( !cws ) {
            self.logger.errorx( "cws is undefined - unable to render unit icon" );
            return;
        }

        var updatedUnit = $.extend( true, {}, unit );
        var appID = self.kernel.application();
        var renderer = armyc2.c2sd.renderer;
        var msa = renderer.utilities.MilStdAttributes;
        var rs = renderer.utilities.RendererSettings;
        var symUtil = renderer.utilities.SymbolUtilities;
        
        // Set affiliation in unit symbol id
        updatedUnit.symbolID = cws.addAffiliationToSymbolId( symbolID, affiliation );
        
        // Add echelon
        if ( echelonID != undefined ) {          
            updatedUnit.symbolID = cws.addEchelonToSymbolId( updatedUnit.symbolID, echelonID );
        }
        
        // Define the list of valid modifiers
        updatedUnit.validModifiers = [ "pixelSize" ];
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
        
        // Gather the modifiers that will be passed into the render function
        var modifiers = {};
        modifiers[ msa.PixelSize ] = "60"; // default
        for ( var prop in modifierList ) {
            if (modifierList[prop] != undefined) {
                switch ( prop.toLowerCase() ) {
                    case "pixelsize":
                        modifiers[ msa.PixelSize ] = modifierList[ prop ];
                        break;
                    case "icon":
                        // We ignore this value - it must be "false" or we'll get no modifiers
                        break;
                    default:
                        modifiers[ prop ] = modifierList[ prop ];
                        break;
                }
            }
        }
        modifiers[ msa.Icon ] = false; // Override whatever value might have been passed in
        modifiers[ msa.SymbologyStandard ] = rs.Symbology_2525C;

        // Render the image
        var img = renderer.MilStdIconRenderer.Render( updatedUnit.symbolID, modifiers );
        if ( img ) {
            updatedUnit.image = updatedUnit.image || {};
            var imgBounds = img.getImageBounds();
            updatedUnit.image.selected = {
                "url": img.toDataUrl(),
                "width": imgBounds.width,
                "height": imgBounds.height,
                "center": img.getCenterPoint()
            }
        }

        return updatedUnit;
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

    function fireViewEvent( eventName, parameters ) {
        var eventHandler = eventHandlers[ eventName ];
        if ( typeof eventHandler === "function" ) {
            eventHandler( parameters );
        }
    }

    function pollForFontsLoaded() {
        if ( armyc2.c2sd.renderer.utilities.RendererUtilities.fontsLoaded() ) {
            _rendererReady = true;
            fireViewEvent( "milSymRendererReady" );
        } else {
            setTimeout( pollForFontsLoaded, 500 );
        }
    }

    function rendererReady() {
        return _rendererReady;
    }

} );
