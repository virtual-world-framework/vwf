"use strict";

define( [ "module", "vwf/view", "jquery", "vwf/utility", "vwf/utility/color" ], 
    function( module, view, $, utility, color ) {

    var self;
    var stageContainer;
    var stageWidth = 800;
    var stageHeight = 600;

    return view.load( module, {

        initialize: function( options ) {
           
            self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            this.options = options || {}; 

            if ( window && window.innerWidth ) {
                stageWidth = window.innerWidth - 20;
            }            
            if ( window && window.innerHeight ) {
                stageHeight = window.innerHeight - 20;
            }

            stageContainer = this.options.container || 'vwf-root';
            stageWidth = this.options.width || stageWidth;
            stageHeight = this.options.height || stageHeight;

        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
               childSource, childType, childIndex, childName, callback ) {
           
            var node = this.state.nodes[ childID ];
            
            // If the "nodes" object does not have this object in it, it must not be one that
            // this driver cares about
            if ( !node ) {
                return;
            }

            var protos = node.prototypes;
            if ( self.state.isKineticClass( protos, "kinetic-stage-vwf" ) || self.state.isKineticClass( protos, "kinetic.stage.vwf" ) ) {
                
                var stage = node.kineticObj;
                var mouseDown = false;
                var mouseDownTime = null;
                var timer = new Date();


                var getEventData = function( e ) {
                    var returnData = { eventData: undefined, eventNodeData: undefined };

                    returnData.eventData = { 
                        "button": e.evt.button,
                        "timeStamp": e.evt.timeStamp,
                        "location": [ e.evt.x, e.evt.y ],
                        "client": [ e.evt.clientX, e.evt.clientY ],
                        "screen": [ e.evt.screenX, e.evt.screenY ],
                        "layer": [ e.evt.layerX, e.evt.layerY ],
                        "page": [ e.evt.pageX, e.evt.pageY ],
                        "offset": [ e.evt.offsetX, e.evt.offsetY ],
                        "movement": [ e.evt.webkitMovementX, e.evt.webkitMovementY ],
                        "shiftKey": e.evt.shiftKey,
                        "ctrlKey": e.evt.ctrlKey,                        
                        "altKey": e.evt.altKey, 
                        "metaKey": e.evt.metaKey
                    };

                    var pointerPickID = e.targetNode ? e.targetNode.getId() : stage.getId();

                    returnData.eventNodeData = { "": [ {
                        pickID: pointerPickID,
                    } ] };

                    if ( self && self.state.nodes[ pointerPickID ] ) {
                        var childID = pointerPickID;
                        var child = self.state.nodes[ childID ];
                        var parentID = child.parentID;
                        var parent = self.state.nodes[ child.parentID ];
                        while ( child ) {

                            returnData.eventNodeData[ childID ] = [ {
                                pickID: pointerPickID,
                            } ];

                            childID = parentID;
                            child = self.state.nodes[ childID ];
                            parentID = child ? child.parentID : undefined;
                            parent = parentID ? self.state.nodes[ child.parentID ] : undefined;

                        }
                    }

                    return returnData;
                };

                // bind stage handlers
                stage.on( 'mousedown', function( evt ) {
                    var node = evt.targetNode;
                    mouseDown = true;
                    mouseDownTime = timer.getTime();
                    var eData = getEventData( evt );

                    self.kernel.dispatchEvent( stage.getId(), 'pointerDown', eData.eventData, eData.eventNodeData );

                });

                stage.on( 'mousemove', function( evt ) {
                    var node = evt.targetNode;
                    
                    var eData = getEventData( evt );

                    console.info( "dispatchEvent( "+stage.getId()+", 'pointerMove', "+eData.eventData+", "+eData.eventNodeData+" );" )
                    self.kernel.dispatchEvent( stage.getId(), 'pointerMove', eData.eventData, eData.eventNodeData ); 

                });

                stage.on( 'mouseup', function( evt ) {
                    var node = evt.targetNode;
                    mouseDown = false;

                    var eData = getEventData( evt );
                    if ( timer.getTime() - mouseDownTime < 700.0 ) {
                        self.kernel.dispatchEvent( stage.getId(), 'pointerClick', eData.eventData, eData.eventNodeData );
                    }
                    self.kernel.dispatchEvent( stage.getId(), 'pointerUp', eData.eventData, eData.eventNodeData );

                    mouseDownTime = null;
                });

                stage.on( 'mouseup', function( evt ) {
                    var shape = evt.targetNode;


                    console.info( 'mouseup' )
                });

                stage.on( 'dragstart', function( evt ) {
                    var shape = evt.targetNode;
                });

                stage.on( 'dragend', function( evt ) {
                    var shape = evt.targetNode;

                });

            }
               
        },
 
 
        // -- deletedNode ------------------------------------------------------------------------------

        //deletedNode: function( nodeID ) { },

        // -- addedChild -------------------------------------------------------------------------------

        //addedChild: function( nodeID, childID, childName ) { },

        // -- removedChild -----------------------------------------------------------------------------

        //removedChild: function( nodeID, childID ) { },

        // -- createdProperty --------------------------------------------------------------------------

        //createdProperty: function (nodeID, propertyName, propertyValue) { },

        // -- initializedProperty ----------------------------------------------------------------------

        //initializedProperty: function (nodeID, propertyName, propertyValue) { },

        // TODO: deletedProperty

        // -- satProperty ------------------------------------------------------------------------------

        satProperty: function (nodeID, propertyName, propertyValue) {
        
        },

        // -- gotProperty ------------------------------------------------------------------------------

        gotProperty: function ( nodeID, propertyName, propertyValue ) { 
        },

        ticked: function( vwfTime ) {
            for ( var i = 0; i < self.state.stages.length; i++ ) {
                self.state.stages[ i ].draw();    
            }
            
        }
    
    
    } );

    // private functions



});