"use strict";

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {


    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.state.nodes = {};
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

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.settingProperty( nodeID, propertyName, propertyValue );
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.state.nodes[ nodeID ];
            var value;
            if ( node ) {
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

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters, methodValue ) {
            var node = this.state.nodes[ nodeID ];
            var eventName, eventHandlerName;

            if ( node ) {                
                switch ( methodName ) {
                    case "addListener":
                        eventName = methodParameters[ 0 ];
                        eventHandlerName = methodParameters[ 1 ];
                        node.eventMap[ eventName ] = eventHandlerName;
                        break;
                    case "removeListener":
                        eventName = methodParameters[ 0 ];
                        delete node.eventMap[ eventName ];
                        break;
                }
            }

        },

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {
            
            var node = this.state.nodes[ nodeID ];
            var listenerIDs, listenerNode;
            if ( node && node.isBroadcasting ) {
                listenerIDs = findListenerIDs( this.state.nodes, eventName );
                for ( var i = 0; i < listenerIDs.length; i++ ) {
                    listenerNode = this.state.nodes[ listenerIDs[ i ] ];
                    this.kernel.callMethod(
                        listenerIDs[ i ],
                        listenerNode.eventMap[ eventName ],
                        eventParameters
                    );
                }
            }

        },

    } );

    function isEventManager( implementsIDs ) {
        return implementsIDs && implementsIDs.indexOf( "http-vwf-example-com-eventManager-vwf" ) !== -1;
    }

    function findListenerIDs( nodes, eventName ) {
        var listenerIDs = [];
        var keys = Object.keys( nodes );
        var node;
        for ( var i = 0; i < keys.length; i++ ) {
            node = nodes[ keys[ i ] ]
            if ( node.isListening && node.eventMap.hasOwnProperty( eventName ) ) {
                listenerIDs.push( keys[ i ] );
            }
        }
        return listenerIDs;
    }

} );