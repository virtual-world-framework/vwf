"use strict";

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

define( [ "module", "vwf/model" ], function( module, model ) {

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.rootSelector = "#vwf-root"; // TODO: was rootSelector parameter from constructor before driver rework; how to specify now?
            this.ests = {}; // extends, source, and type parameters for any Unity3D nodes
            this.unities = {}; // maps id => unityObject.getObjectById( id )
        },

        // == Model API ============================================================================

        // -- creatingNode -----------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {

            if ( childSource && childType == "application/vnd.unity" ) {

                if ( unityObject ) {
                    this.ests[childID] = { extends: childExtendsID, source: childSource, type: childType };
                }

            } else {

                var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

                jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                    unity.SendMessage( "VWFModel", "CreatingNode", argumentsJSON );
                } );

            }

        },

        // -- deletingNode -----------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            this.logger.warnc( "deletingNode", "unimplemented" );

        },

        // -- addingChild ------------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {

            var est = this.ests[childID];

            if ( est ) { // TODO: attach to points other than root // TODO: verify parent is HTML

                if ( nodeID == 0 ) {  // TODO: const for root id

                    jQuery( this.rootSelector ).append(
                        "<div id='" + elementID( childID ) + "'>" +
                            "<div class='missing'>" +
                                "<a href='http://unity3d.com/webplayer/' title='Unity Web Player. Install now!'>" +
                                    "<img alt='Unity Web Player. Install now!' src='http://webplayer.unity3d.com/installation/getunity.png' width='193' height='63' />" +
                                "</a>" +
                            "</div>" +
                        "</div>"
                    ).children( ":last" );

                    var self = this;

                    unityObject.embedUnity( elementID( childID ), est.source, 600, 450, undefined, undefined, function( result ) {

                        self.unities[childID] = result.ref; // result: { success: true/false, id: "id", ref: object }

                        setTimeout( function() { // TODO: horrible hack to work around timing problems for testing
                            var argumentsJSON = JSON.stringify( [ childID, est.extends, [], est.source, est.type ] );
                            self.unities[childID].SendMessage( "VWFModel", "CreatingNode", argumentsJSON );
                        }, 15000 );

                        setTimeout( function() { // TODO: horrible hack to work around timing problems for testing
                            this.createChild( 0, "RedCube", { extends: "http://vwf.example.com/node3.vwf" } );
                            this.createChild( 0, "GreenCube", { extends: "http://vwf.example.com/node3.vwf" } );
                            this.createChild( 0, "infusion_pump_door", { extends: "http://vwf.example.com/node3.vwf" } );
                        }, 16000 );

                        setTimeout( function() { // TODO: horrible hack to work around timing problems for testing
                            this.createProperty( "http-vwf-example-com-node3-vwf-RedCube", "position", [ 0, 0, 0] );
                            // this.createProperty("http-vwf-example-com-node3-vwf-GreenCube", "poisition", 0);
                            // this.createProperty("http-vwf-example-com-node3-vwf-RedCube", "eulers", 0);
                            this.createProperty("http-vwf-example-com-node3-vwf-GreenCube", "eulers", [0, 0, 0]);
                            // this.createProperty("http-vwf-example-com-node3-vwf-RedCube", "scale", [ 1, 1, 1]);
                            // this.createProperty("http-vwf-example-com-node3-vwf-GreenCube", "scale", [ 1, 1, 1]);
                            this.createProperty("http-vwf-example-com-node3-vwf-infusion_pump_door", "angle", 0);
                        }, 17000 );

                        setTimeout( function() { // TODO: horrible hack to work around timing problems for testing
                            this.addChild( "http-vwf-example-com-scene-vwf-undefined", "http-vwf-example-com-node3-vwf-RedCube", "RedCube" );
                            this.addChild( "http-vwf-example-com-scene-vwf-undefined", "http-vwf-example-com-node3-vwf-GreenCube", "GreenCube" );
                            this.addChild( "http-vwf-example-com-scene-vwf-undefined", "http-vwf-example-com-node3-vwf-infusion_pump_door", "infusion_pump_door" );
                        }, 20000 );

                    } );  // TODO: get size from model params or use existing element size

                    // TODO: wait?

                }

            } else {

                var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

                jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                    unity.SendMessage( "VWFModel", "AddingChild", argumentsJSON );
                } );

            }

        },

        // -- removingChild ----------------------------------------------------------------------------

        removingChild: function( nodeID, childID ) {

            var childUnity = this.unities[childID];

            if ( nodeID == 0 && childUnity ) { // TODO: const for root id // TODO: attach other than at root?

                jQuery( ".vwf-orphanage" ).append( elementID( childID ) );

            } else {

                var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

                jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                    unity.SendMessage( "VWFModel", "RemovingChild", argumentsJSON );
                } );

            }

        },

        // -- parenting --------------------------------------------------------------------------------

        parenting: function( nodeID ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "Parenting", argumentsJSON );
            } );

        },

        // -- childrening ------------------------------------------------------------------------------

        childrening: function( nodeID ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "Childrening", argumentsJSON );
            } );

        },

        // -- naming -----------------------------------------------------------------------------------

        naming: function( nodeID ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "Naming", argumentsJSON );
            } );

        },

        // -- creatingProperty -------------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "CreatingProperty", argumentsJSON );
            } );

        },

        // -- initializingProperty ---------------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "InitializingProperty", argumentsJSON );
            } );

        },

        // TODO: deletingProperty

        // -- settingProperty --------------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "SettingProperty", argumentsJSON );
            } );

        },

        // -- gettingProperty --------------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "GettingProperty", argumentsJSON );
            } );

        },

        // -- creatingMethod ---------------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "CreatingMethod", argumentsJSON );
            } );

        },

        // TODO: deletingMethod

        // -- callingMethod ----------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "CallingMethod", argumentsJSON );
            } );

        },

        // -- creatingEvent ---------------------------------------------------------------------------

        creatingEvent: function( nodeID, eventName, eventParameters ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "CreatingEvent", argumentsJSON );
            } );

        },

        // TODO: deletingEvent

        // -- firingEvent ----------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "FiringEvent", argumentsJSON );
            } );

        },

        // -- executing --------------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {

            var argumentsJSON = JSON.stringify( Array.prototype.slice.call( arguments ) );

            jQuery.each( this.unities, function( nodeID, unity ) { // TODO: only to ones where this node is a descendant
                unity.SendMessage( "VWFModel", "Executing", argumentsJSON );
            } );

        },

    } );

    // == Private functions ========================================================================

    // -- elementID --------------------------------------------------------------------------------

    // Convert a VWF node ID to an HTML element id.

    function elementID( nodeID ) {
        return "vwf-model-unity-" + nodeID;
    }

} );
