"use strict";

define( [ "module", "vwf/view", "jquery", "vwf/utility", "vwf/utility/color" ], 
    function( module, view, $, utility, color ) {

    var self;
    var stageContainer;
    var stageWidth = 800;
    var stageHeight = 600;

    function processEvent( e, node, propagate ) {
        var returnData = { eventData: undefined, eventNodeData: undefined };

        if ( !propagate ) {
            // For the "dragend" event, kinetic sometimes sends us an event object that doesn't
            // have all the expected functions and properties attached
            e.evt.stopPropagation && e.evt.stopPropagation();
        }

        var eventPosition;
        var isTouchEvent = ( e.evt instanceof TouchEvent );
        if ( isTouchEvent ) {
            eventPosition = e.evt.changedTouches[ 0 ];
        } else {
            eventPosition = e.evt;
        }

        var stage = node && node.stage;
        returnData.eventData = [ convertBrowserEventDataToVwf( eventPosition, stage ) ];

        var eventDataElement = returnData.eventData[ 0 ];
        eventDataElement.button = e.evt.button;
        eventDataElement.timeStamp = e.evt.timeStamp;
        eventDataElement.shiftKey = e.evt.shiftKey;
        eventDataElement.ctrlKey = e.evt.ctrlKey;
        eventDataElement.altKey = e.evt.altKey;
        eventDataElement.metaKey = e.evt.metaKey;

        if ( isTouchEvent ) {
            returnData.eventData[ 0 ].touches = [];
            for ( var i = 0; i < e.evt.touches.length; i++ ) {
                returnData.eventData[ 0 ].touches[ i ] = convertBrowserEventDataToVwf( 
                    e.evt.touches[ i ], 
                    stage 
                );
            }    
        }

        if ( propagate ) {

            var stageId = stage && stage.getId();
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
    }

    function convertBrowserEventDataToVwf( browserEventData, stage ) {
        var vwfEventData = { 
            "location": [ browserEventData.x, browserEventData.y ],
            "stageRelative": [ browserEventData.pageX, browserEventData.pageY ],
            "client": [ browserEventData.clientX, browserEventData.clientY ],
            "screen": [ browserEventData.screenX, browserEventData.screenY ],
            "layer": [ browserEventData.layerX, browserEventData.layerY ],
            "page": [ browserEventData.pageX, browserEventData.pageY ],
            "offset": [ browserEventData.offsetX, browserEventData.offsetY ],
            "movement": [ browserEventData.webkitMovementX, browserEventData.webkitMovementY ]
        };

        if ( stage ) {
            vwfEventData.stage = [ stage.x(), stage.y() ];
            vwfEventData.stageRelative = [ 
                ( browserEventData.pageX - stage.x() ) / stage.scaleX(),
                ( browserEventData.pageY - stage.y() ) / stage.scaleY()
            ];    
        }
        return vwfEventData;
    }

    function attachMouseEvents( node ) {

        var mouseDown = false;

        node.kineticObj.on( "mousemove", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'pointerMove', eData.eventData );
        } );

        node.kineticObj.on( "mouseout", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'pointerOut', eData.eventData );
        } );

        node.kineticObj.on( "mouseenter", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'pointerEnter', eData.eventData );
        } );

        node.kineticObj.on( "mouseleave", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'pointerLeave', eData.eventData );
        } );

        node.kineticObj.on( "mousedown", function( evt ) { 
            var eData = processEvent( evt, node, false );
            mouseDown = true;
            self.kernel.fireEvent( node.ID, 'pointerDown', eData.eventData );
        } );

        node.kineticObj.on( "mouseup", function( evt ) {
            var eData = processEvent( evt, node, false );
            mouseDown = false;
            self.kernel.fireEvent( node.ID, 'pointerUp', eData.eventData );
            if ( node.kineticObj.mouseDragging ) {
                self.kernel.fireEvent( node.ID, 'dragEnd', eData.eventData );
                node.kineticObj.mouseDragging = false;
            }
        } );

        node.kineticObj.on( "click", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'pointerClick', eData.eventData );
        } );

        node.kineticObj.on( "dblclick", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'pointerDoubleClick', eData.eventData );
        } );

        node.kineticObj.on( "dragstart", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'dragStart', eData.eventData );
            node.kineticObj.mouseDragging = true;
        } );

        node.kineticObj.on( "dragmove", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'dragMove', eData.eventData );
        } );

    }

    function attachTouchEvents( node ) {

        var TOUCH_EVENT = true;

        node.kineticObj.on( "touchstart", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'touchStart', eData.eventData );
        } );

        node.kineticObj.on( "touchmove", function( evt ) {
            var eData = processEvent( evt, node, false );
             self.kernel.fireEvent( node.ID, 'touchMove', eData.eventData );
        } );

        node.kineticObj.on( "touchend", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'touchEnd', eData.eventData );
        } );

        node.kineticObj.on( "tap", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'tap', eData.eventData );
        } );

        node.kineticObj.on( "dbltap", function( evt ) {
            var eData = processEvent( evt, node, false );
            self.kernel.fireEvent( node.ID, 'doubleTap', eData.eventData );
        } );

    }



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

            if ( node.kineticObj )  { 

                // Attach the mouse and/or touch events based on property settings
                vwf_view.kernel.getProperty( childID, "supportMouseEvents" );
                vwf_view.kernel.getProperty( childID, "supportTouchEvents" );

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
            
            var node = this.state.nodes[ nodeID ];

            // If we don't have a record of this node, it is not a kinetic node, and we ignore it
            if ( !( node && node.kineticObj ) ) {
                return;
            }

            var kineticObj = node.kineticObj;
            switch ( propertyName ) {
                case "supportMouseEvents":
                    if ( propertyValue === true ) {
                        attachMouseEvents( node );
                    }
                    break;
                    
                case "supportTouchEvents":
                    if ( propertyValue === true ) {
                        attachTouchEvents( node );
                    }
                    break;
                    
                case "enableEvents":
                    var mouseDown = false;
                    var touch = false;
                    var mouseDownTime = null;
                    var mouseDownId = undefined;
                    var touchId = undefined;
                    var timer = new Date();

                    var protos = node.prototypes;
                    if ( self.state.isKineticClass( protos, [ "kinetic", "stage", "vwf" ] ) ) {

                        var stage = kineticObj;
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
                                var eData = processEvent( evt, self.state.nodes[ mouseDownId ], true );  // false might be more corret here

                                self.kernel.dispatchEvent( mouseDownId, 'pointerDown', eData.eventData, eData.eventNodeData );
                            });

                            stage.on( 'contentMousemove', function( evt ) {
                                var node = evt.targetNode;
                                
                                var eData = processEvent( evt, self.state.nodes[ mouseDownId ], true );  // false might be more corret here

                                self.kernel.dispatchEvent( mouseDownId ? mouseDownId : stage.getId(), 'pointerMove', eData.eventData, eData.eventNodeData ); 
                            });

                            stage.on( 'contentMouseup', function( evt ) {
                                var node = evt.targetNode;
                                mouseDown = false;

                                var eData = processEvent( evt, self.state.nodes[ mouseDownId ], true );  // false might be more corret here
                                if ( timer.getTime() - mouseDownTime < 700.0 ) {
                                    self.kernel.dispatchEvent( mouseDownId, 'pointerClick', eData.eventData, eData.eventNodeData );
                                }
                                self.kernel.dispatchEvent( mouseDownId ? mouseDownId : stage.getId(), 'pointerUp', eData.eventData, eData.eventNodeData );

                                mouseDownTime = null;
                                mouseDownId = null;
                            } );
                            
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
                    break;
                case "scale":
                    if ( !node.uniqueInView ) {
                        kineticObj.scale( { 
                            "x": kineticObj.modelScaleX, 
                            "y": kineticObj.modelScaleY 
                        } );
                    }
                    break;
                case "scaleX":
                    if ( !node.uniqueInView ) {
                        kineticObj.scaleX( kineticObj.modelScaleX );
                    }
                    break;
                case "scaleY":
                    if ( !node.uniqueInView ) {
                        kineticObj.scaleY( kineticObj.modelScaleY );
                    }
                    break;
            }            

        },

        gotProperty: function( nodeID, propertyName, propertyValue ) {
 
            var node = this.state.nodes[ nodeID ];
            var eventsAdded = false;

            // If we don't have a record of this node, it is not a kinetic node, and we ignore it
            if ( !( node && node.kineticObj ) ) {
                return eventsAdded;
            }

            switch ( propertyName ) {
                case "supportMouseEvents":
                    if ( ( propertyValue === true ) && ( !node.hasMouseEvents ) ) {
                        attachMouseEvents( node );
                        node.hasMouseEvents = true;
                        eventsAdded = node.hasMouseEvents;
                    }
                    break;
                    
                case "supportTouchEvents":
                    if ( ( propertyValue === true ) && ( !node.hasTouchEvents ) ) {
                        attachTouchEvents( node );
                        node.hasTouchEvents = true;
                        eventsAdded = node.hasTouchEvents;
                    }
                    break;

                default:
                    break;
            }

            return eventsAdded;
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