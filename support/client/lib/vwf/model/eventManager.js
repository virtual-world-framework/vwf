"use strict";

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {


    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.state.nodes = {};
            this.state.kernel = this.kernel.kernel.kernel;
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            if ( isEventManager( childImplementsIDs ) ) {
                this.state.nodes[ childID ] = {
                    "isBroadcasting": true,
                    "isListening": true,
                    "eventMap": {}
                };
            }

        },

        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            if ( nodeID ) {
                var childNode = this.state.nodes[ nodeID ];
                if ( childNode ) {
                    var threeObject = childNode.threeObject;
                    if ( threeObject && threeObject.parent ) {
                        threeObject.parent.remove( threeObject );
                    }
                    delete this.state.nodes[ childNode ];
                }
            }

        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {
        },

        // -- removingChild ------------------------------------------------------------------------

        removingChild: function( nodeID, childID ) {
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {

            return this.initializingProperty( nodeID, propertyName, propertyValue );

        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;
            if ( propertyValue !== undefined ) {
                var node = this.state.nodes[ nodeID ];
                if ( node !== undefined && propertyName ) {
                    value = this.settingProperty( nodeID, propertyName, propertyValue );
                }
            }
            return value;

        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var node, value;
            if ( this.state.nodes[ nodeID ] ) {
                node = this.state.nodes[ nodeID ];
                switch ( propertyName ) {
                    case "isBroadcasting":
                        value = propertyValue;
                        node.isBroadcasting = value;
                        break;
                    case "isListening":
                        value = propertyValue;
                        node.isListening = value;
                        break;
                    case "eventMap":
                        value = propertyValue;
                        node.eventMap = value;
                        break;
                }
            }
            return value;

        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.state.nodes[ nodeID ];
            var value;
            if ( node ) {
                switch ( propertyName ) {
                    case "isBroadcasting":
                        value = node.isBroadcasting;
                        break;
                    case "isListening":
                        value = node.isListening;
                        break;
                    case "eventMap":
                        value = node.eventMap;
                        break;
                }
            }
            return value;

        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {
        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters, methodValue ) {
            var node = this.state.nodes[ nodeID ];
            var eventName, callbackName;

            if ( node ) {                
                switch ( methodName ) {
                    case "addListener":
                        eventName = methodParameters[ 0 ];
                        callbackName = methodParameters[ 1 ];
                        node.eventMap[ eventName ] = callbackName;
                        break;
                    case "removeListener":
                        eventName = methodParameters[ 0 ];
                        delete node.eventMap[ eventName ];
                        break;
                }
            }

        },

        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function( nodeID, eventName, eventParameters ) {
        },

        // TODO: deletingEvent

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {
            
            var node = this.state.nodes[ nodeID ];
            var listeners, listenerNode;
            if ( node && node.isBroadcasting ) {
                listeners = findListeners( this.state.nodes, eventName );
                for ( var i = 0; i < listeners.length; i++ ) {
                    listenerNode = this.state.nodes[ listeners[ i ] ];
                    this.kernel.callMethod(
                        listeners[ i ],
                        listenerNode.eventMap[ eventName ],
                        eventParameters
                    );
                }
            }

        },

        // -- executing ----------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {
        },

    } );

    function isEventManager( implementsIDs ) {
        return implementsIDs && implementsIDs.indexOf( "http-vwf-example-com-eventManager-vwf" ) !== -1;
    }

    function findListeners( nodes, eventName ) {
        var listeners = new Array();
        var keys = Object.keys( nodes );
        var node;
        for ( var i = 0; i < keys.length; i++ ) {
            node = nodes[ keys[ i ] ]
            if ( node.isListening && node.eventMap.hasOwnProperty( eventName ) ) {
                listeners.push( keys[ i ] );
            }
        }
        return listeners;
    }

} );