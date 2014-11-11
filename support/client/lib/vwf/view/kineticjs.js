"use strict";

define( [ "module", "vwf/view", "jquery", "vwf/utility", "vwf/utility/color" ], 
    function( module, view, $, utility, color ) {

    var self;
    var stageContainer;
    var stageWidth = 800;
    var stageHeight = 600;

    var processEvent = function( e, node, isTouchEvent, propagate ) {
        var returnData = { eventData: undefined, eventNodeData: undefined };

        if ( !propagate ) {
            // For the "dragend" event, kinetic sometimes sends us an event object that doesn't
            // have all the expected functions and properties attached
            e.evt.stopPropagation && e.evt.stopPropagation();
        }

        var eventPosition;
        if ( isTouchEvent ) {
            eventPosition = e.evt.changedTouches[ 0 ];
        } else {
            eventPosition = e.evt;
        }

        returnData.eventData = [ { 
            "button": e.evt.button,
            "timeStamp": e.evt.timeStamp,
            "location": [ eventPosition.x, eventPosition.y ],
            "stage": [ 0, 0 ],
            "stageRelative": [ eventPosition.pageX, eventPosition.pageY ],
            "client": [ eventPosition.clientX, eventPosition.clientY ],
            "screen": [ eventPosition.screenX, eventPosition.screenY ],
            "layer": [ eventPosition.layerX, eventPosition.layerY ],
            "page": [ eventPosition.pageX, eventPosition.pageY ],
            "offset": [ eventPosition.offsetX, eventPosition.offsetY ],
            "movement": [ eventPosition.webkitMovementX, eventPosition.webkitMovementY ],
            "shiftKey": e.evt.shiftKey,
            "ctrlKey": e.evt.ctrlKey,                        
            "altKey": e.evt.altKey, 
            "metaKey": e.evt.metaKey
        } ];

        var stageId = undefined;
        if ( node && node.stage ) {
            var stage = node.stage;
            stageId = stage.getId();
            returnData.eventData[ 0 ].stage = [ stage.x(), stage.y() ];

            // The "adjust" is any adjustment due to the application changing the position of the 
            // stage's canvas in the window (this needs to be supplied by the application if it 
            // moves the canvas), whereas the stage.x() and stage.y() are the translation of the
            // contents of the stage
            if ( stage.adjustX === undefined ) {
                stage.adjustX = 0;
            }
            if ( stage.adjustY === undefined ) {
                stage.adjustY = 0;
            }
            returnData.eventData[ 0 ].stageRelative = [ 
                ( eventPosition.pageX - stage.adjustX - stage.x() ) / stage.scaleX(),
                ( eventPosition.pageY - stage.adjustY - stage.y() ) / stage.scaleY()
            ];    
        }

        if ( propagate ) {

            var pointerPickID = e.targetNode ? e.targetNode.getId() : stageId;

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
        }

        return returnData;
    };

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
            if ( self.state.isKineticClass( protos, [ "kinetic", "stage", "vwf" ] ) ) {
                
                var stage = this.state.stage = node.kineticObj;
 
            }
               
        },

         initializedNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
               childSource, childType, childIndex, childName, callback ) {
            
            var node = this.state.nodes[ childID ];
            
            // If the "nodes" object does not have this object in it, it must not be one that
            // this driver cares about
            if ( !node ) {

                //var stage = this.state.stages[ childID ];
                //renderScene( stage );
                return;
            }

            if ( node.kineticObj ) {

                var mouseDown = false;

                var TOUCH_EVENT = true;

                node.kineticObj.on( "mousemove", function( evt ) {
                    var eData = processEvent( evt, node, !TOUCH_EVENT, false );
                    //self.kernel.dispatchEvent( node.ID, 'pointerMove', eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'pointerMove', eData.eventData );
                } );

                node.kineticObj.on( "mouseout", function( evt ) {
                    var eData = processEvent( evt, node, !TOUCH_EVENT, false );
                    self.kernel.fireEvent( node.ID, 'pointerOut', eData.eventData );
                } );

                node.kineticObj.on( "mouseenter", function( evt ) {
                    var eData = processEvent( evt, node, !TOUCH_EVENT, false );
                    //self.kernel.dispatchEvent( node.ID, 'pointerEnter', eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'pointerEnter', eData.eventData );
                } );

                node.kineticObj.on( "mouseleave", function( evt ) {
                    var eData = processEvent( evt, node, !TOUCH_EVENT, false );
                    // self.kernel.dispatchEvent( node.ID, 'pointerLeave', eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'pointerLeave', eData.eventData );
                } );

                node.kineticObj.on( "mousedown", function( evt ) { 
                    var eData = processEvent( evt, node, !TOUCH_EVENT, false );
                    mouseDown = true;
                    //self.kernel.dispatchEvent( node.ID, 'pointerDown', eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'pointerDown', eData.eventData );
                } );

                node.kineticObj.on( "mouseup", function( evt ) {
                    var eData = processEvent( evt, node, !TOUCH_EVENT, false );
                    mouseDown = false;
                    //self.kernel.dispatchEvent( node.ID, 'pointerUp', eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'pointerUp', eData.eventData );
                } );

                node.kineticObj.on( "click", function( evt ) {
                    var eData = processEvent( evt, node, !TOUCH_EVENT, false );
                    //self.kernel.dispatchEvent( node.ID, 'pointerClick', eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'pointerClick', eData.eventData );
                } );

                node.kineticObj.on( "dblclick", function( evt ) {
                    var eData = processEvent( evt, node, !TOUCH_EVENT, false );
                    //self.kernel.dispatchEvent( node.ID, 'pointerDoubleClick', eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'pointerDoubleClick', eData.eventData );
                } );

                node.kineticObj.on( "touchstart", function( evt ) {
                    var eData = processEvent( evt, node, TOUCH_EVENT, false );
                    //self.kernel.dispatchEvent( node.ID, "touchStart", eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'touchStart', eData.eventData );
                } );

                node.kineticObj.on( "touchmove", function( evt ) {
                    var eData = processEvent( evt, node, TOUCH_EVENT, false );
                    //self.kernel.dispatchEvent( node.ID, "touchMove", eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'touchMove', eData.eventData );
                } );

                node.kineticObj.on( "touchend", function( evt ) {
                    var eData = processEvent( evt, node, TOUCH_EVENT, false );
                    //self.kernel.dispatchEvent( node.ID, "touchEnd", eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'touchEnd', eData.eventData );
                } );

                node.kineticObj.on( "tap", function( evt ) {
                    var eData = processEvent( evt, node, TOUCH_EVENT, false );
                    //self.kernel.dispatchEvent( node.ID, "tap", eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'tap', eData.eventData );
                } );

                node.kineticObj.on( "dbltap", function( evt ) {
                    var eData = processEvent( evt, node, TOUCH_EVENT, node );
                    //self.kernel.dispatchEvent( node.ID, "dragStart", eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'dragStart', eData.eventData );
                } );

                node.kineticObj.on( "dragstart", function( evt ) {
                    var eData = processEvent( evt, node, undefined, false );
                    //self.kernel.dispatchEvent( node.ID, "dragStart", eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'dragStart', eData.eventData );
                } );

                node.kineticObj.on( "dragmove", function( evt ) {
                    var eData = processEvent( evt, node, undefined, false );
                    //self.kernel.dispatchEvent( node.ID, "dragMove", eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'dragMove', eData.eventData );
                } );

                node.kineticObj.on( "dragend", function( evt ) {
                    var eData = processEvent( evt, node, undefined, false );
                    //self.kernel.dispatchEvent( node.ID, "dragEnd", eData.eventData, eData.eventNodeData );
                    self.kernel.fireEvent( node.ID, 'dragEnd', eData.eventData );
                } );

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

        satProperty: function( nodeID, propertyName, propertyValue ) {
            
            if ( propertyName === "enableEvents" ) {
                var node = this.state.nodes[ nodeID ];
                if ( node && node.kineticObj ) {
                    var mouseDown = false;
                    var touch = false;
                    var mouseDownTime = null;
                    var mouseDownId = undefined;
                    var touchId = undefined;
                    var timer = new Date();

                    var protos = node.prototypes;
                    if ( self.state.isKineticClass( protos, [ "kinetic", "stage", "vwf" ] ) ) {

                        var stage = node.kineticObj;
                        var TOUCH_EVENT = true;

                        // these are the events for the global space, ie the stage
                        // we did originally implement the mouse events this way
                        // but then we added the events for the individual objects
                        // which appeared to work better.  We were getting duplicate events
                        // which is why I moved these events down inside a property
                        // just in case they were needed for another apllication that
                        // is set up differently

                        if ( Boolean( propertyValue ) ) {

                            // defined handlers
                            stage.on( 'contentMousedown', function( evt ) {
                                var node = evt.targetNode;
                                mouseDownId = ( node !== undefined ) ? node.getId() : stage.getId();
                                mouseDown = true;
                                mouseDownTime = timer.getTime();
                                var eData = processEvent( evt, self.state.nodes[ mouseDownId ], !TOUCH_EVENT, true );  // false might be more corret here

                                self.kernel.dispatchEvent( mouseDownId, 'pointerDown', eData.eventData, eData.eventNodeData );
                            });

                            stage.on( 'contentMousemove', function( evt ) {
                                var node = evt.targetNode;
                                
                                var eData = processEvent( evt, self.state.nodes[ mouseDownId ], !TOUCH_EVENT, true );  // false might be more corret here

                                self.kernel.dispatchEvent( mouseDownId ? mouseDownId : stage.getId(), 'pointerMove', eData.eventData, eData.eventNodeData ); 
                            });

                            stage.on( 'contentMouseup', function( evt ) {
                                var node = evt.targetNode;
                                mouseDown = false;

                                var eData = processEvent( evt, self.state.nodes[ mouseDownId ], !TOUCH_EVENT, true );  // false might be more corret here
                                if ( timer.getTime() - mouseDownTime < 700.0 ) {
                                    self.kernel.dispatchEvent( mouseDownId, 'pointerClick', eData.eventData, eData.eventNodeData );
                                }
                                self.kernel.dispatchEvent( mouseDownId ? mouseDownId : stage.getId(), 'pointerUp', eData.eventData, eData.eventNodeData );

                                mouseDownTime = null;
                                mouseDownId = null;
                            });


                            // touch events: below, never tested but these are the events 
                            // for the touch, ie mobile devices
                            //
                            // stage.on( 'contentTouchstart', function( evt ) {
                            //     var node = evt.targetNode;
                            //     touchId = ( node !== undefined ) ? node.getId() : stage.getId();
                            //     touch = true;
                            //     if ( node ) {
                            //         console.info( "node: " + touchId )
                            //     }
                            // });

                            // stage.on( 'contentTouchmove', function( evt ) {
                            //     var shape = evt.targetNode;

                            // });

                            // stage.on( 'contentTouchend', function( evt ) {
                            //     var shape = evt.targetNode;

                            //     touch = null;
                            //     touchId = null;
                            // });

                            // stage.on( 'contentTap', function( evt ) {
                            //     var shape = evt.targetNode;
                            // });
                        } else {

                            // remove handlers
                            stage.off( 'contentMousedown' );
                            stage.off( 'contentMousemove' );
                            stage.off( 'contentMouseup' );
                            // stage.off( 'contentTouchstart' );
                            // stage.off( 'contentTouchmove' );
                            // stage.off( 'contentTouchend' );
                            // stage.off( 'contentTap' );                            
                        }

                    }

                }

            }            

        },

        firedEvent: function( nodeID, eventName ) {
            if ( eventName == "draggingFromView" ) {
                var clientThatSatProperty = self.kernel.client();
                var me = self.kernel.moniker();

                // If the transform property was initially updated by this view....
                if ( clientThatSatProperty == me ) {

                    // Tell the model not to update the view on the next position update because 
                    // kinetic has already done so
                    // (this event is fired right before this driver sets the model property, so we 
                    // can be sure that the very next set of the position property is from us)
                    var node = this.state.nodes[ nodeID ];
                    node.viewIgnoreNextPositionUpdate = true;
                }
            }
        },

        ticked: function( vwfTime ) {
            var nodeIDs = Object.keys( this.state.nodes );
            for ( var i = 0; i < nodeIDs.length; i++ ) {
                var nodeID = nodeIDs[ i ];
                var node = this.state.nodes[ nodeID ];

                // If users can drag this node and all clients should stay synchronized, we must 
                // pull the new node position out of kinetic and update the model with it
                if ( node.kineticObj.draggable() && !node.uniqueInView ) {
                    var kineticX = node.kineticObj.x();
                    var kineticY = node.kineticObj.y();

                    // If the position of this node has changes since it's last model value, set the
                    // model property with the new value
                    if ( ( node.kineticObj.modelX !== kineticX ) || 
                        ( node.kineticObj.modelY !== kineticY ) ) {

                        // Fire this event to notify the model that kinetic has already updated the
                        // view and it doesn't need to (if the model set the value, it would risk 
                        // having the model set the view back to an old value, which results in 
                        // jitter while the user is dragging the node)
                        vwf_view.kernel.fireEvent( nodeID, "draggingFromView" );
                        vwf_view.kernel.setProperty( nodeID, "position", [ kineticX, kineticY ] );
                    }
                }
            }
            for ( var id in self.state.stages ){
                renderScene( self.state.stages[ id ] );                
            } 
            
        }
    
    
    } );

    function renderScene( stage ) {
        //window.requestAnimationFrame( renderScene( stage ) );
        if ( stage !== undefined ) {
            stage.batchDraw();    
        }
    }


});