"use strict";

define( [ "module", "vwf/view", "jquery", "vwf/utility", "vwf/utility/color" ], 
    function( module, view, $, utility, color ) {

    var viewDriver;
    var stageContainer;
    var stageWidth = ( window && window.innerWidth ) ? window.innerWidth : 800;
    var stageHeight = ( window && window.innerHeight ) ? window.innerHeight : 600;
    var drawing_private = {
        "drawingObject": null,
        "drawingDef": null,
        "drawingParentID": undefined,
        "drawingChildName": "",
        "initialDownPoint": [ -1, -1 ],
        "previousPoint": [ -1, -1 ],
        "mouseDown": false,
        "imageDataURL": null
    };
    var drawing_client = {  
        "drawing_mode": 'none',
        "drawing_visible": 'inherit',
        "drawing_color": 'black',
        "drawing_width": 4,
        "drawing_parentPath": '/',
        "drawing_parentID": undefined,
        "drawing_opacity": 1.0,
        "nameIndex": 1,
        "fontSize": 16,
        "angle": 30,
        "lineCap": 'round',
        "lineJoin": 'round',
        "dashLineStyle": null,
        "fillStyle": null,
        "zIndex": 4,
        "shadows": {} 
    };
    var private_node = undefined;
    var privateNodesToDelete = {};
    var activelyDrawing = false;
    var clearBeforeDraw = false;
    var lastRenderTime = 0;     // last time whole scene was rendered
    var renderTimeout = 1000;    // ms between renders
    var mouseDown = false;
    var doRenderScene = false;
    var eventHandlers = {};

    // Object implements tapHold behavior (kineticJS doesn't have a built-in one)
    var tapHold = { 
        "node":             null,
        "initialPosition":  [ 0, 0],
        "timeout":          1500,       // timeout in milliseconds
        "moveThreshold":    64,         // Square of the threshold
        "timerId":          null,
        "protoFilter":      null,
        "isListening":      false,             
        "start":            function( node, position ) {
            if ( this.isListening && !this.node && this.matchesProtoFilter( node.prototypes ) ) {
                this.node = node;
                this.initialPosition = position.client;
                this.timerId = setTimeout( function(){ fireTapHold(); }, this.timeout );
            }
        },
        "moved":            function( node, position ) {
            if ( node === this.node ) {
                //console.info( " tapHold moved for node: " + this.node.ID + " at position: [ " + position.client[0] + ", " +  position.client[1] + " ], timerId = " + this.timerId );
                if ( this.timerId ) {
                    var deltaPos = [ ( position.client[0] - this.initialPosition[0] ),
                                     ( position.client[1] - this.initialPosition[1] ) ];
                    var distanceSquared = ( ( deltaPos[0] * deltaPos[0] ) + ( deltaPos[1] * deltaPos[1] ) );
                    if ( distanceSquared > this.moveThreshold ) {
                        this.cancel();
                    }
                }
            }
        },  
        "cancel":           function() {
            if ( this.timerId ) {
                clearTimeout( this.timerId );
            }
            this.node = null;
            this.initialPosition = [ 0, 0 ];
            this.timerId = null;
        },  
        "matchesProtoFilter": function( prototypes ) {
            var found = false;
            if ( this.protoFilter ) { 
                if ( prototypes ) {
                    var kIndex;
                    for ( var i = 0; i < prototypes.length && !found; i++ ) {
                        for ( var j = 0; j < this.protoFilter.length && !found; j++ ) {
                            found = ( prototypes[ i ] === this.protoFilter[ j ] ); 
                        }
                    }
                }
            } else {
                found = true;  // Not filtering anything
            } 
            return found;
        },
        "registerForTapHoldEvents": function( protoFilters ) {
            for ( var i = 0; i < protoFilters.length; i++ ) {
                console.info( i + ". " + protoFilters[i] );
            }
            this.protoFilter = protoFilters;
        },
        "listenForTapHold":         function( listen ) {
            this.isListening = listen;
            if ( !listen ) {
                tapHold.cancel();
            }
        } 

    };

    function fireTapHold() {
        if ( tapHold.node ) {
            fireViewEvent( "tapHold", {
                nodeID: tapHold.node.ID,
                initialPosition: tapHold.initialPosition
            } );
            tapHold.cancel();
        }
    }

    var swipe = {
        "protoFilter":     null,
        "isListening":     false,
        "parentFilter":    null,
        "touchStartIsTap": null,  
        "swipedAcross": function( node, isTouchStart, eventData ) {
            if ( this.isListening && this.isSwipe( node ) ) {
                if ( isTouchStart && this.touchStartIsTap ) {
                    fireViewEvent( "tap", {
                        nodeID: node.ID,
                        eventData: eventData[ 0 ]
                    } );
                } else {
                    fireViewEvent( "swipe", {
                        nodeID: node.ID
                    } );
                }
            }
        },  
        "isSwipe":      function( node ) {
            var found      = false;
            var prototypes = node.prototypes;
            if ( this.parentFilter && ( !isChildOf( node.kineticObj, this.parentFilter ) ) ) {
                return found;
            } 
            if ( this.protoFilter ) { 
                if ( prototypes ) {
                    var kIndex;
                    for ( var i = 0; i < prototypes.length && !found; i++ ) {
                        for ( var j = 0; j < this.protoFilter.length && !found; j++ ) {
                            found = ( prototypes[ i ] === this.protoFilter[ j ] ); 
                        }
                    }
                }
            } else {
                found = true;  // Not filtering anything
            } 
            return found;            
        },
        "registerForSwipeEvents":   function( protoFilters ) {
            this.protoFilter = protoFilters;
        },
        "listenForSwipes":          function( params ) {
            this.isListening      = params.listen;
            this.parentFilter     = params.parent;
            this.touchStartIsTap  = params.touchStartIsTap;
        } 
    };

    // Attach handlers for mouse events
    function attachMouseEvents( node ) {

        node.kineticObj.on( "mousemove", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();

            drawMove( node.ID, eData.eventData[0], node, false ); 

            var userState = drawing_client;

            if ( !!userState[ "drawing_mode" ] ) {
                switch ( userState[ "drawing_mode" ] ) {
                    case 'none':
                    case 'edit':
                        activelyDrawing = false;
                        break;
                    default:
                        break;
                }
            } else {
                activelyDrawing = false;
            }

        } );

        node.kineticObj.on( "mouseout", function( evt ) {
            var eData = processEvent( evt, node, false );
            if ( mouseDown || ( evt.evt.buttons ) ) {
                swipe.swipedAcross( node );
            }
        } );

        node.kineticObj.on( "mouseenter", function( evt ) {
            // Correct `mouseDown` if the button changed outside any node with an active "on mouseup"
            mouseDown = !!( evt.evt.buttons & 1 );

            var eData = processEvent( evt, node, false );

            if ( mouseDown || ( evt.evt.buttons ) ) {
                swipe.swipedAcross( node );
            }
        } );

        node.kineticObj.on( "mouseleave", function( evt ) {
            var eData = processEvent( evt, node, false );

            if ( mouseDown || ( evt.evt.buttons ) ) {
                swipe.swipedAcross( node );
            }

        } );

        node.kineticObj.on( "mousedown", function( evt ) { 
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();

            // Track mouseDown so we know we're holding the button during a move/drag
            mouseDown = true;

            // Process drawing (if actively drawing)
            drawDown( node.ID, eData.eventData[0], node, false ); 
            var userState = drawing_client;
            if ( !!userState[ "drawing_mode" ] ) {
                switch ( userState[ "drawing_mode" ] ) {
                    case 'edit':
                    case 'none':
                        fireViewEvent( "pointerClick", {
                            nodeID: node.ID,
                            eventData: eData.eventData[ 0 ]
                        } );
                        break;
                    default:
                        activelyDrawing = true;
                        break;
                }
            }

        } );

        node.kineticObj.on( "mouseup", function( evt ) {
            var eData = processEvent( evt, node, false );
            mouseDown = false;

            // Cancel tapHold event (if any)
            tapHold.cancel();

            drawUp( node.ID, eData.eventData[0], node, true ); 

            activelyDrawing = false;

            if ( node.kineticObj.mouseDragging ) {
                fireViewEvent( "dragend", {
                    nodeID: node.ID,
                    eventData: eData.eventData[ 0 ]
                } );
                node.kineticObj.mouseDragging = false;
            
                if ( viewDriver.state.draggingNodes[ node.ID ] !== undefined ) {
                    delete viewDriver.state.draggingNodes[ node.ID ]; 
                }
            } else {
                fireViewEvent( "mouseup", {
                    nodeID: node.ID,
                    eventData: eData.eventData[ 0 ]
                } );
            }

        } );

        node.kineticObj.on( "click", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();
            activelyDrawing = false;

            fireViewEvent( "pointerClick", {
                nodeID: node.ID,
                eventData: eData.eventData[ 0 ]
            } );
        } );

        node.kineticObj.on( "dblclick", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();
            activelyDrawing = false;

            fireViewEvent( "pointerDoubleClick", {
                nodeID: node.ID,
                eventData: eData.eventData[ 0 ]
            } );
        } );
        
        node.kineticObj.on( "dragstart", function( evt ) {
            var eData = processEvent( evt, node, false );

            viewDriver.state.draggingNodes[ node.ID ] = node;
            node.kineticObj.mouseDragging = true;
            var prevPos;
            if (node.kineticObj.attrs) {
                prevPos = [node.kineticObj.attrs.x, node.kineticObj.attrs.y];
            }
            fireViewEvent( "dragstart", {
                nodeID: node.ID,
                prevPos: prevPos,
                eventData: eData.eventData[ 0 ]
            } );
            if ( node.dragToTop ) {
                node.kineticObj.moveToTop();
            }

            swipe.swipedAcross( node );

        } );

        node.kineticObj.on( "dragmove", function( evt ) {
            var eData = processEvent( evt, node, false );

            tapHold.moved( node, eData.eventData[0] );
            activelyDrawing = false;

        } );

        node.kineticObj.on( "dragend", function( evt ) {
            var eData = processEvent( evt, node, false );

            activelyDrawing = false;

            node.kineticObj.mouseDragging = false;
            fireViewEvent( "dragend", {
                nodeID: node.ID,
                eventData: eData.eventData[ 0 ]
            } );
            if ( viewDriver.state.draggingNodes[ node.ID ] !== undefined ) {
                delete viewDriver.state.draggingNodes[ node.ID ]; 
            }

        } );

    }

    // Attach handlers for touch events
    function attachTouchEvents( node ) {

        var TOUCH_EVENT = true;

        node.kineticObj.on( "touchstart", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Start tapHold
            tapHold.start( node, eData.eventData[0].touches[0] );

            drawDown( node.ID, eData.eventData[0], node, false ); 

            var userState = drawing_client;
            if ( !!userState[ "drawing_mode" ] ) {
                switch ( userState[ "drawing_mode" ] ) {
                    case 'none':
                    case 'edit':
                        activelyDrawing = false;
                        break;
                    default:
                        break;
                }
            } else {
                activelyDrawing = false;
            }
            var prevPos;
            if (node.kineticObj.attrs) {
                prevPos = [node.kineticObj.attrs.x, node.kineticObj.attrs.y];
            }
            fireViewEvent( "dragstart", {
                nodeID: node.ID,
                prevPos: prevPos,
                eventData: eData.eventData[ 0 ]
            } );
            swipe.swipedAcross( node, true, eData.eventData );

        } );

        node.kineticObj.on( "touchmove", function( evt ) {
            var eData = processEvent( evt, node, false );

            // If tapHold started, check that we haven't moved too much
            tapHold.moved( node, eData.eventData[0].touches[0] );

            drawMove( node.ID, eData.eventData[0], node, false ); 

            var userState = drawing_client;
            if ( userState[ "drawing_mode" ] ) {           
                switch ( userState[ "drawing_mode" ] ) {
                    case 'edit':
                    case 'none':
                        break;
                    default:
                        activelyDrawing = true;
                        break;
                }
            }

            swipe.swipedAcross( node );
        } );

        node.kineticObj.on( "touchend", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();

            drawUp( node.ID, eData.eventData[0], node, true ); 
            fireViewEvent( "dragend", {
                nodeID: node.ID,
                eventData: eData.eventData[ 0 ]
            } );
            activelyDrawing = false;
        } );

        node.kineticObj.on( "tap", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();
            activelyDrawing = false;

            fireViewEvent( "tap", {
                nodeID: node.ID,
                eventData: eData.eventData[ 0 ]
            } );
            swipe.swipedAcross( node, true, eData.eventData );
        } );

        node.kineticObj.on( "dbltap", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();
            activelyDrawing = false;

            fireViewEvent( "doubleTap", {
                nodeID: node.ID,
                eventData: eData.eventData[ 0 ]
            } );
        } );
    }

    // Create and return the view driver object ----------------------------------------------------

    return view.load( module, {

        initialize: function( options ) {
           
            viewDriver = this;

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
            
            // If this node represents the public version of a private drawing that we hold locally,
            // delete the private drawing (now that it exists publicly)
            var privateNodesForThisParent = privateNodesToDelete[ nodeID ];
            if ( privateNodesForThisParent ) {
                var privateDrawing = privateNodesForThisParent[ childName ];
                if ( privateDrawing ) {
                    clearPrivateDrawing( privateDrawing );
                    delete privateNodesForThisParent[ childName ];
                    if ( !Object.keys( privateNodesForThisParent ).length ) {
                        delete privateNodesToDelete[ nodeID ];
                    }
                }
            }
        },

        initializedNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
               childSource, childType, childIndex, childName, callback ) {

            var node = this.state.nodes[ childID ];
            
            // If the "nodes" object does not have this object in it, it must not be one that
            // this driver cares about
            if ( !node ) {
                return;
            }

            var objectDriver = getKernel().models.object;
            var disableScaleAndRotationForSpeed =
                objectDriver.gettingProperty( childID, "disableScaleAndRotationForSpeed" );
            var prototypeID = objectDriver.prototype( childID );
            while ( ( disableScaleAndRotationForSpeed === undefined ) && ( prototypeID ) ) {
                disableScaleAndRotationForSpeed =
                    objectDriver.gettingProperty( prototypeID, "disableScaleAndRotationForSpeed" );
                prototypeID = objectDriver.prototype( prototypeID );
            }
            var transformsEnabled = disableScaleAndRotationForSpeed ? "position" : "all";
            node.kineticObj.transformsEnabled( transformsEnabled );
        },
 
        // -- deletedNode ------------------------------------------------------------------------------

        // deletedNode: function( nodeID ) { },

        // -- addedChild -------------------------------------------------------------------------------

        //addedChild: function( nodeID, childID, childName ) { },

        // -- removedChild -----------------------------------------------------------------------------

        //removedChild: function( nodeID, childID ) { },

        // -- createdProperty --------------------------------------------------------------------------

        //createdProperty: function (nodeID, propertyName, propertyValue) { },

        // -- initializedProperty ----------------------------------------------------------------------

        initializedProperty: function ( nodeID, propertyName, propertyValue ) { 
            this.satProperty( nodeID, propertyName, propertyValue );
        },

        // -- satProperty ------------------------------------------------------------------------------

        satProperty: function( nodeID, propertyName, propertyValue ) {
            
            var node = this.state.nodes[ nodeID ];

            // If we don't have a record of this node, it is not a kinetic node, and we ignore it
            if ( !( node && node.kineticObj ) ) {
                return;
            }

            var drawThis = false;
            var clearBefore = false;
            var kineticObj = node.kineticObj;

            switch ( propertyName ) {
                case "supportMouseAndTouchEvents":
                    if ( ( propertyValue === true ) && ( !node.hasMouseAndTouchEvents ) ) {
                        attachMouseEvents( node );
                        attachTouchEvents( node );
                        node.hasMouseAndTouchEvents = true;
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
                    if ( viewDriver.state.isKineticClass( protos, [ "kinetic", "stage", "vwf" ] ) ) {

                        var stage = kineticObj;
                        var TOUCH_EVENT = true;

                        // these are the events for the global space, ie the stage
                        // we did originally implement the mouse events this way
                        // but then we added the events for the individual objects
                        // which appeared to work better.  We were getting duplicate events
                        // which is why I moved these events down inside a property
                        // just in case they were needed for another application that
                        // is set up differently

                        if ( Boolean( propertyValue ) ) {

                            // defined handlers
                            stage.on( 'contentMousedown', function( evt ) {
                                var node = evt.targetNode;
                                mouseDownId = ( node !== undefined ) ? node.getId() : stage.getId();
                                mouseDown = true;
                                mouseDownTime = timer.getTime();
                                var eData = processEvent( evt, viewDriver.state.nodes[ mouseDownId ], true );  // false might be more corret here

                                viewDriver.kernel.dispatchEvent( mouseDownId, 'pointerDown', eData.eventData, eData.eventNodeData );
                            });

                            stage.on( 'contentMousemove', function( evt ) {
                                var node = evt.targetNode;
                                
                                var eData = processEvent( evt, viewDriver.state.nodes[ mouseDownId ], true );  // false might be more corret here

                                viewDriver.kernel.dispatchEvent( mouseDownId ? mouseDownId : stage.getId(), 'pointerMove', eData.eventData, eData.eventNodeData ); 
                            });

                            stage.on( 'contentMouseup', function( evt ) {
                                var node = evt.targetNode;
                                mouseDown = false;

                                var eData = processEvent( evt, viewDriver.state.nodes[ mouseDownId ], true );  // false might be more corret here
                                if ( timer.getTime() - mouseDownTime < 700.0 ) {
                                    viewDriver.kernel.dispatchEvent( mouseDownId, 'pointerClick', eData.eventData, eData.eventNodeData );
                                }
                                viewDriver.kernel.dispatchEvent( mouseDownId ? mouseDownId : stage.getId(), 'pointerUp', eData.eventData, eData.eventNodeData );

                                mouseDownTime = null;
                                mouseDownId = null;
                            } );
                            
                        } else {

                            // remove handlers
                            stage.off( 'contentMousedown' );
                            stage.off( 'contentMousemove' );
                            stage.off( 'contentMouseup' );
                        }
                    }
                    break;
                case "position":
                    drawObject( kineticObj, true );
                    break;
                case "disableScaleAndRotationForSpeed":
                    kineticObj.transformsEnabled( propertyValue ? "position" : "all" );
                    break;
                case "scale":
                    if ( node.model.scale !== undefined ) {
                        kineticObj.scale( { 
                            "x": node.model.scale.x, 
                            "y": node.model.scale.y 
                        } );
                        drawThis = !activelyDrawing;
                    }
                    break;
                case "scaleX":
                    if ( node.model.scaleX !== undefined ) {
                        kineticObj.scaleX( node.model.scaleX );
                        drawThis = !activelyDrawing;
                    }
                    break;
                case "scaleY":
                    if ( node.model.scaleX !== undefined ) {
                        kineticObj.scaleY( node.model.scaleX );
                        drawThis = !activelyDrawing;
                    }
                    break;

                case "activeLayerID":
                    if ( this.kernel.client() === this.kernel.moniker() ) {
                        drawing_client.drawing_parentID = propertyValue;
                    }
                    break;

                case "text":
                    if ( isDrawingObject( nodeID ) ) {
                        var drawingObject = drawing_private.drawingObject;
                        drawingObject.text( propertyValue );
                        drawObject( drawingObject, true );
                        propagateNodeToModel( drawing_private );
                    }
                    break;

                case "dragToTop":
                    // TODO: Currently getting from object driver.
                    //       In future, this should be moved to model driver.
                    node.dragToTop = propertyValue;
                    break;

                case "visible":
                    var visible = propertyValue;
                    if ( this.state.pauseRendering ) {
                        drawThis = false;
                    } else {
                        drawThis = !activelyDrawing;
                        clearBefore = visible ? clearBefore : false;
                    }
                    break;

                case "pauseRendering":
                    this.state.pauseRendering = propertyValue;
                    drawThis = false;
                    break;

                default:
                    drawThis = this.state.pauseRendering ? false : !activelyDrawing;
            }

            if ( drawThis ) {
                drawObject( kineticObj, clearBefore );
            }

        },

        calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {

            if ( this.kernel.client() === this.kernel.moniker() ) {
                switch ( methodName ) {

                    case "refreshState":
                        if ( !this.state.pauseRendering ) {
                            refreshState();
                        }
                        break;

                    case "enableLayerHitGraph":
                        var layers = methodParameters[ 0 ];
                        for ( var id in layers ) {
                            var layer = this.state.nodes[ nodeID ];
                            if ( layer && ( layer.nodeType === "Layer" ) && layer.kineticObj ) {
                                ( layers[ id ] ? layer.kineticObj.enableHitGraph() : layer.kineticObj.disableHitGraph() );
                            }
                        }
                        break;

                }
            }
            // for methods that all clients need to execute
            switch ( methodName ) {

                case "refreshLayer":
                    refreshLayer( methodParameters );
                    break;

            }

        },

        firedEvent: function( nodeID, eventName, eventData ) {
            switch ( eventName ) {

                case "draggingFromView":

                    // If the transform property was initially updated by this view....
                    var kernel = viewDriver.kernel;
                    if ( kernel.client() === kernel.moniker() ) {

                        // Tell the model not to update the view on the next position update because 
                        // kinetic has already done so
                        // (this event is fired right before this driver sets the model property, so we 
                        // can be sure that the very next set of the position property is from us)
                        var node = this.state.nodes[ nodeID ];
                        node.model.position.ignoreNextPositionUpdate = true;
                    }
                    break;

                case "textValueUpdated":
                    if ( isDrawingObject( eventData[ 0 ] ) ) {
                        var drawingObject = drawing_private.drawingObject;
                        drawingObject.text( eventData[ 1 ] );
                        drawObject( drawingObject, true );
                        propagateNodeToModel( drawing_private );
                    }
                    break;

                default:
                    break;
            }

        },

        // firedEvent: function( nodeID, eventName ) { },

        ticked: function( vwfTime ) {
            update( vwfTime );
        },

        // This is intended to be called directly from the application view
        setViewProperty: function( id, propertyName, propertyValue, modelChangeShouldUpdateView ) {
            var node = viewDriver.state.nodes[ id ];
            var kineticObj = ( node || {} ).kineticObj;
            
            if ( !kineticObj ) {
                console.error(
                    "konva.setViewProperty: Attempted to set view property on a non-konva object" );
                return;
            }

            if ( !utility.validObject( propertyValue ) ) {
                console.error(
                    "konva.setViewProperty: Attempted to set view property with an invalid value" );
                return;
            }

            // If we have not yet saved off the model value
            // to keep it safe from unique-in-view property changes, do that now
            if ( node.model[ propertyName ] === undefined ) {
                node.model[ propertyName ] = {
                    "value": viewDriver.state.getProperty( node.kineticObj, propertyName ),
                    "modelChangeShouldUpdateView": !!modelChangeShouldUpdateView
                };
            } else {

                // If we had already saved off the model value,
                // honor the new value that the caller has passed in for modelChangeShouldUpdateView
                node.model[ propertyName ].modelChangeShouldUpdateView =
                    !!modelChangeShouldUpdateView;
            }

            // Set the konva object property to use the unique-in-view value
            viewDriver.state.setProperty( kineticObj, propertyName, propertyValue );
        },

        setDrawingState: function ( stateObj ) {
            if ( stateObj !== undefined ) {
                var userState = drawing_client;
                for ( var property in stateObj ) {
                    userState[ property ] = stateObj[ property ];
                }
            }
        },

        getDrawingState: function ( property ) {
            if ( !!drawing_client ) {
                return drawing_client[ property ];
            }
            return undefined;
        },

        registerForTapHoldEvents: function( protoFilters ) {
            tapHold.registerForTapHoldEvents( protoFilters );
        },

        listenForTapHold: function( listen ) {
            tapHold.listenForTapHold( listen );
        },

        registerForSwipeEvents: function( protoFilters ) {
            swipe.registerForSwipeEvents( protoFilters );
        },

        listenForSwipes: function( params ) {
            swipe.listenForSwipes( params );
        },

        setListening: function( nodeID, listen ) {
            this.state.nodes[ nodeID ].kineticObj.listening( listen );
        },

        setChildListening: function( nodeID, childNames, listen ) {
            var node = this.state.nodes[ nodeID ];

            var kineticObj = node && node.kineticObj;
            if ( !kineticObj ) {
                view.logger.errorx( "setChildListening",
                    "Node '", nodeID, "' is not a konva node" );
                return;
            }

            var children = kineticObj.children;
            for ( var i = 0; i < children.length; i++ ) {
                var child = children[ i ];
                var childWasRequested = child && ( childNames.indexOf( child.name() ) > -1 );
                childWasRequested && child.listening( listen );
            }
        },

        on: function( eventName, callback ) {
            eventHandlers[ eventName ] = callback;
        }, 

        setText: function( text ) {
            if ( !createTextObject( text ) ) {
                console.error( "setText: Could not create text object" );
                return;
            }
            var drawingObject = drawing_private.drawingObject;
            drawingObject.fontSize( drawing_client.fontSize || 16 );
            drawingObject.fontStyle( 'bold' );
            drawingObject.text( text );
            drawingObject.fill( drawing_client.drawing_color );
            drawObject( drawingObject, true );
            propagateNodeToModel( drawing_private );
        },

        setImage: setImage,
        refreshLayer: refreshLayer
    } );

    // Private helper functions --------------------------------------------------------------------

    function update( vwfTime ) {
        // switch to update, when the tickless branch is merged to development
        var nodeIDs = Object.keys( viewDriver.state.draggingNodes );
        var renderNodes = {};
        var doRenderNodes = false;
        
        for ( var i = 0; i < nodeIDs.length; i++ ) {
        
            var nodeID = nodeIDs[ i ];
            var node = viewDriver.state.draggingNodes[ nodeID ];

            // If users can drag this node and all clients should stay synchronized, we must 
            // pull the new node position out of kinetic and update the model with it
            var kineticObj = node.kineticObj;
            if ( kineticObj ) {
                var draggable = kineticObj.draggable();

                var positionProperty = ( node.model || {} ).position;
                var modelChangeShouldUpdateView =
                    ( positionProperty || {} ).modelChangeShouldUpdateView;

                if ( draggable && modelChangeShouldUpdateView )  { 
                    var kineticX = kineticObj.x();
                    var kineticY = kineticObj.y();

                    // If the position of this node has changed since its last model value, set the
                    // model property with the new value
                    if ( ( positionProperty.value.x !== kineticX ) || 
                         ( positionProperty.value.y !== kineticY ) ) {

                        // Fire this event to notify the model that kinetic has already updated the
                        // view and it doesn't need to (if the model set the value, it would risk 
                        // having the model set the view back to an old value, which results in 
                        // jitter while the user is dragging the node)
                        viewDriver.kernel.fireEvent( nodeID, "draggingFromView" );
                        viewDriver.kernel.callMethod( nodeID, "setMapPositionFromPosition",
                            [ 
                                {
                                    x: kineticX,
                                    y: kineticY
                                },
                                kineticObj.scaleX()
                            ] );

                        doRenderNodes = true;
                        renderNodes[ nodeID ] = kineticObj;
                    }
                }
            }

        }
        
        if ( doRenderNodes ) {
            for ( var id in renderNodes ) {
                render( renderNodes[ id ], false, true );
            }
        }
    }

    function renderScene( stage, force, drawHit ) {
        if ( stage && ( !activelyDrawing || force ) ) {
            if ( stage.batchDraw instanceof Function ) {
                batchRender( stage, force );
            } else {
                render( stage, force, drawHit );
            }
            doRenderScene = false;
        }
    }

    function render( kineticObj, force, drawHit ) {
        var now = Date.now();
        if ( kineticObj && ( ( ( now - lastRenderTime ) > renderTimeout ) || force ) ) {
            ( drawHit ? kineticObj.draw() : kineticObj.drawScene() );
            lastRenderTime = now;
        }
    }

    function batchRender( kineticObj, force ) {
        var now = Date.now();
        if ( kineticObj && ( ( ( now - lastRenderTime ) > renderTimeout ) || force ) ) {
            kineticObj.batchDraw();
            lastRenderTime = now;
        }
    }

    function processEvent( e, node, propagate ) {
        var returnData = { eventData: undefined, eventNodeData: undefined };

        if ( !propagate ) {
            // For the "dragend" event, kinetic sometimes sends us an event object that doesn't
            // have all the expected functions and properties attached
            e.evt.stopPropagation && e.evt.stopPropagation();
        }

        var isTouchEvent = !!e.evt.touches;
        var eventPosition = isTouchEvent ? e.evt.changedTouches[ 0 ] : e.evt;

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
                returnData.eventData[ 0 ].touches[ i ] =
                    convertBrowserEventDataToVwf( e.evt.touches[ i ], stage );
            }    
        }

        if ( propagate ) {

            var stageId = stage && stage.getId();
            var pointerPickID = e.targetNode ? e.targetNode.getId() : stageId;

            returnData.eventNodeData = { "": [ {
                pickID: pointerPickID,
            } ] };

            if ( viewDriver && viewDriver.state.nodes[ pointerPickID ] ) {
                var childID = pointerPickID;
                var child = viewDriver.state.nodes[ childID ];
                while ( child ) {

                    returnData.eventNodeData[ childID ] = [ {
                        pickID: pointerPickID,
                    } ];

                    // Line up the next "child" up the hierarchy
                    childID = child.parentID;
                    child = viewDriver.state.nodes[ childID ];
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

    // When the user begins a new part of a drawing,
    // check to see if this is is for an existing drawing or the beginning of a new drawing.
    // If it is the beginning of a new drawing, populate the drawing_private object with
    // a new konva object and a VWF descriptor that will be used to create a model object
    // when the user is done drawing
    function drawDown( nodeID, eventData, nodeData, touch ) {

        var userState = drawing_client;
        var privateState = drawing_private;
        var drawingMode = userState.drawing_mode;

        if ( privateState.drawingObject || drawingMode === 'none' || drawingMode === 'edit' ) {
            return;
        }

        var compExtends = undefined;
        var section = ( drawingMode === "freeDraw" || drawingMode === "line") ? "/lines" : "/shapes";

        switch ( drawingMode ) {
            
            case "arc":
            case "circle":
            case "ellipse":
            case "regularPolygon":
            case "rect":
            case "ring":
            case "star":
            case "wedge":
            case "sprite":            
            case "image":
                compExtends = [ "http://vwf.example.com/kinetic/", drawingMode, ".vwf" ].join('') 
                break;

            case "text":
                compExtends = "http://vwf.example.com/kinetic/rect.vwf";
                break;

            case "freeDraw":
            case "polygon":
            case "line":
            case "borderRect":
            case "arrow":
            case "thickArrow":
                compExtends = "http://vwf.example.com/kinetic/line.vwf";
                break;

            default:
                break;

        }

        var eventPointDown = eventData.stageRelative;

        if ( compExtends !== undefined ) {

            privateState.initialDownPoint = eventPointDown;
            var parentPath = userState.drawing_parentPath + section;
            var parentIDs = viewDriver.kernel.find( viewDriver.kernel.application(), parentPath );

            if ( parentIDs.length === 0 ) {
                view.logger.errorx( "drawDown", "Could not find parent node '", parentPath, "'",
                    " - Cannot create drawn line" );
                return;
            }

            var parentID = parentIDs[ 0 ];
            var shapeDef = {
                "extends": compExtends,
                "properties": getDefaultProperties( drawingMode, false, eventPointDown )
            };

            var name = drawingMode + "-" + randomSuffix();
            var childID = parentID + ":" + name ;
            private_node = createLocalKineticNode( parentID, childID, shapeDef, [], undefined, undefined, name );
            drawing_private.drawingObject = private_node.kineticObj;

            // Save data to be used to create the node in the model
            drawing_private.drawingDef = shapeDef;
            drawing_private.drawingParentID = parentID;
            drawing_private.drawingChildName = name;

            drawUpdate( drawing_private.drawingObject.ID, eventData, nodeData, false );

        }

        // Return a hex string representing a random 32-bit integer.

        function randomSuffix() {
            return ( "00000000" + Math.floor( Math.random() * 0x100000000 ).toString( 16 ) ).substr( -8 );
        }
    };

    function drawMove( nodeID, eventData, nodeData, touch ) {

        var node = viewDriver.state.nodes[ nodeID ];

        var userState = drawing_client;
        if ( ( userState.drawing_mode === 'none' ) || ( userState.drawing_mode === 'edit' ) ) {
            return;
        }

        if ( drawing_private.drawingObject ) {
           drawUpdate( drawing_private.drawingObject.ID, eventData, nodeData, false );
        }
    };

    function drawUp( nodeID, eventData, nodeData, touch ) {

        var node = viewDriver.state.nodes[ nodeID ];
        var appID = viewDriver.kernel.application();
        var drawAndPropagate = false;
        var debugOn = false;

        if ( debugOn ) {
            console.info( ' ' );
            console.info( ' === Nodes listening and visibility states ===' );
            for(var key in viewDriver.state.nodes) {
                var kNode = viewDriver.state.nodes[ key ];
                var listening = ( kNode.kineticObj.isListening instanceof Function ? kNode.kineticObj.isListening() : undefined );
                var visible = ( kNode.kineticObj.isVisible instanceof Function ? kNode.kineticObj.isVisible() : undefined );
                console.info( '     Node: ' + kNode.kineticObj.id() + ', listening: ' + listening + ', visibility: ' + visible );
            }
            console.info( ' === End ===' );
            console.info( ' ' );
        }

        if ( drawing_private !== undefined && 
             drawing_private.drawingObject ) {
            var drawingObject = drawing_private.drawingObject;
            drawUpdate( drawingObject.ID, eventData, nodeData, true );
            
            fireViewEvent( "drawingObjectCreated", {
                nodeID: drawingObject.id()
            } );

            var userState = drawing_client;
            drawingObject.setZIndex( userState.zIndex );

            switch( userState.drawing_mode ) {
                
                case "text":
                    fireViewEvent( "textCreated", {
                        nodeID: drawingObject.id()
                    } );
                    break;

                case "sprite":
                case "image":
                    var stroke = drawingObject.stroke();
                    if ( stroke ) {
                        fireViewEvent( "imageLocationSelected", {
                            nodeID: drawingObject.id()
                        } );
                        drawAndPropagate = false;
                    }

                    break;

                case "line":
                    drawAndPropagate = true;
                    break;

                case "freeDraw":
                case "polygon":
                case "circle":
                case "ellipse":
                case "rect":
                case "arrow":
                case "thickArrow":
                    drawingObject.dash( userState.dashLineStyle );
                    switch ( userState.fillStyle ) {
                        case 'noFill':
                            drawingObject.fill( null );
                            break;

                        case 'solidFill':
                        case 'transparentFill':
                            var colorRGB = Konva.Util.getRGB( userState.drawing_color );
                            var alpha = ( userState.fillStyle === 'transparentFill' ? 0.5 : 1.0 );
                            var rgbaText = 'rgba( ' + colorRGB.r + ', ' + colorRGB.g + ', ' + colorRGB.b + ', ' + alpha + ' )';
                            drawingObject.fill( rgbaText );
                            break;

                        default:
                            break;
                    }
                    drawAndPropagate = true;
                    break;

                default:
                    break;
            } 

            if ( drawAndPropagate ) {
                drawObject( drawingObject, true );

                // Create a node in the model so it gets replicated on all clients
                propagateNodeToModel( drawing_private );
            }
        }    
    };

    function drawUpdate( nodeID, eventData, nodeData, upEvent ) {

        var node = viewDriver.state.nodes[ nodeID ];

        if ( drawing_private === undefined || 
             !isValid( drawing_client ) ) {
            return;
        }

        if ( drawing_private.drawingObject && !upEvent ) {
            
            var eventPoint = eventData.stageRelative;
            var userState = drawing_client;        
            var privateState = drawing_private;
            var drawingObject = privateState.drawingObject;
            var pointAccepted = true;

            if ( drawingObject.visible !== userState.drawing_visible ) {
                drawingObject.visible = userState.drawing_visible;
            }
            if ( drawingObject.listening !== userState.drawing_listening ) {
                drawingObject.listening = userState.drawing_listening;
            }
            var diffX = eventPoint[ 0 ] - privateState.initialDownPoint[ 0 ];
            var diffY = eventPoint[ 1 ] - privateState.initialDownPoint[ 1 ];
            var pos = [ privateState.initialDownPoint[ 0 ], privateState.initialDownPoint[ 1 ] ];
            var width = diffX;  
            var height = diffY;
            var dist = Math.sqrt( ( diffX * diffX ) + ( diffY * diffY ) );
            var angleDeg = Math.atan2( diffY, diffX ) * 180.0 / Math.PI;

            // this keeps the pos as the top left corner for the 
            // rectangular objects
            switch ( userState.drawing_mode ) {

                case "line":
                case "arrow":
                case "thickArrow":
                case "freeDraw":
                case "polygon":
                case "borderRect":
                case "text":
                    break;

                default:
                    if ( diffX < 0 ) {
                        pos[ 0 ] += diffX;  
                        width = Math.abs( diffX );
                    } 
                    if ( diffY < 0 ) {
                        pos[ 1 ] += diffY;  
                        height = Math.abs( diffY );
                    } 
                    drawingObject.position( privateState.initialDownPoint );
                    drawingObject.width( width );
                    drawingObject.height( height );  
                    break;          
            }

            switch ( userState.drawing_mode ) {
                
                case "arc":
                    drawingObject.angle = userState.angle ? userState.angle : 30;
                    if ( dist > node.drawing_width ) {
                        drawingObject.innerRadius( dist - node.drawing_width );
                        drawingObject.outerRadius( dist );
                    }
                    clearBeforeDraw = true;
                    break;

                case "ellipse":         
                    drawingObject.radius( { "x": width * 0.5, "y": height * 0.5 } );
                    drawingObject.stroke( userState.drawing_color );
                    drawingObject.strokeWidth( userState.drawing_width );
                    drawingObject.fill( null );
                    clearBeforeDraw = true;
                    break;

                case "circle":
                    drawingObject.radius( dist );
                    drawingObject.stroke( userState.drawing_color );
                    drawingObject.strokeWidth( userState.drawing_width );
                    drawingObject.fill( null );
                    clearBeforeDraw = true;
                    break;

                case "line":
                    drawingObject.stroke( userState.drawing_color );
                    drawingObject.strokeWidth( userState.drawing_width );
                    drawingObject.points( [ 0, 0, diffX, diffY ] );
                    drawingObject.lineCap( userState.lineCap );
                    drawingObject.dash( userState.dashLineStyle );
                    clearBeforeDraw = true;
                    break;

                case "freeDraw":
                case "polygon":
                    drawingObject.stroke( userState.drawing_color );
                    drawingObject.strokeWidth( userState.drawing_width );
                    drawingObject.lineCap( userState.lineCap );
                    drawingObject.lineJoin( userState.lineJoin );
                    var points = drawingObject.points();
                    var isFirstStrokeOfNewLine = false;

                    if ( !points || ( points.length === 0 ) ) {
                        points = [ 0, 0, diffX, diffY ];
                        isFirstStrokeOfNewLine = true;
                    }

                    var posX = eventPoint[ 0 ] - drawingObject.x();
                    var posY = eventPoint[ 1 ] - drawingObject.y();
                    
                    if ( isFirstStrokeOfNewLine ) {
                        if ( ( Math.abs( posX ) + Math.abs( posY ) ) > 0 ) {
                            points = [ 0, 0, posX, posY ];
                            privateState[ "previousPoint" ] = [ posX, posY ];
                        } else {
                            pointAccepted = false;   
                        }
                        privateState.previousPoint = [ posX, posY ];
                    } else  {
                        var dragDiff = [ 
                            posX - privateState.previousPoint[ 0 ], 
                            posY - privateState.previousPoint[ 1 ] 
                        ];

                        if ( ( Math.abs( dragDiff[0] ) + Math.abs( dragDiff[1] ) ) > 0 ) {
                            points.push( posX );
                            points.push( posY );
                            privateState.previousPoint = [ posX, posY ];
                        } else {
                            pointAccepted = false;    
                        }

                    }
                    drawingObject.points( points );

                    if ( userState.drawing_mode === 'polygon' ) {
                        drawingObject.closed( true );
                        drawingObject.fill( null );
                        clearBeforeDraw = true;
                    }
                    break;

                case "regularPolygon":
                     // needs defining
                     break;

                case "ring":
                    if ( dist > userState.drawing_width ) {
                        drawingObject.innerRadius( dist - userState.drawing_width );
                        drawingObject.outerRadius( dist );
                        clearBeforeDraw = true;
                    }
                    break;

                case "star":
                    drawingObject.points( 5 );
                    drawingObject.innerRadius( dist * 80 );
                    drawingObject.outerRadius( dist );
                    clearBeforeDraw = true;
                    break;

                case "wedge":
                    // needs defining
                    drawingObject.angle( userState.angle ? userState.angle : 30 );
                    drawingObject.radius( dist );
                    drawingObject.clockwise( false );
                    clearBeforeDraw = true;
                    break;

                case "borderRect":
                    drawingObject.stroke( userState.drawing_color );
                    drawingObject.strokeWidth( userState.drawing_width );
                    drawingObject.points( [ 0, 0, width, 0, width, height, 0, height, 0, 0 ] );
                    drawingObject.lineCap( userState.lineCap );
                    drawingObject.lineJoin( userState.lineJoin );
                    drawingObject.dash( userState.dashLineStyle );
                    clearBeforeDraw = true;
                    break;

                case "arrow":
                case "thickArrow":
                    var arrowWidthMult = ( userState.drawing_mode === 'arrow' ? 3 : 8 );

                    drawingObject.x( drawingObject.position[ 0 ] );
                    drawingObject.y( drawingObject.position[ 1 ] ); 

                    drawingObject.stroke( userState.drawing_color );
                    drawingObject.strokeWidth( userState.drawing_width );
                    drawingObject.lineCap( userState.lineCap );
                    drawingObject.lineJoin( userState.lineJoin );
                    drawingObject.dash( null );
                    drawingObject.fill( null );
                    drawingObject.closed( true );
                    var arrowThickness = userState.drawing_width * arrowWidthMult;
                    var headWidth = userState.drawing_width * arrowWidthMult * 2;
                    var headLength = userState.drawing_width * arrowWidthMult * 2;
                    var arrowLength = dist;
                    var arrowShaft = arrowLength - headLength;
                    var arrowPts = [ 0, 0, 0, arrowThickness, arrowShaft, arrowThickness, arrowShaft, headWidth, arrowLength, 0, arrowShaft, (-1 * headWidth), arrowShaft, (-1 * arrowThickness), 0, (-1 * arrowThickness) ];
                    drawingObject.points( arrowPts );
                    drawingObject.rotation( angleDeg );
                    clearBeforeDraw = true;
                    break;
                
                case "sprite":
                case "image":
                    drawingObject.x( pos[ 0 ] );
                    drawingObject.y( pos[ 1 ] ); 
                    drawingObject.stroke( userState.drawing_color );
                    drawingObject.strokeWidth( 2 );
                    drawingObject.lineCap( userState.lineCap );
                    drawingObject.lineJoin( userState.lineJoin );
                    drawingObject.dash( [ 2, 5 ] );
                    drawingObject.width( width );
                    drawingObject.height( height );
                    drawingObject.transformsEnabled( "all" );
                    drawingObject.image( null );
                    clearBeforeDraw = true;
                    break;

                case "text":
                    drawingObject.x( pos[ 0 ] );
                    drawingObject.y( pos[ 1 ] ); 
                    drawingObject.size( { "width": dist, "height": drawing_client.fontSize} );
                    drawingObject.stroke( userState.drawing_color );
                    drawingObject.strokeWidth( 2 );
                    drawingObject.lineCap( userState.lineCap );
                    drawingObject.lineJoin( userState.lineJoin );
                    drawingObject.dash( [ 2, 5 ] );
                    drawingObject.fill( null );
                    drawingObject.rotation( angleDeg );
                    clearBeforeDraw = true;
                    break;

                case "rect":
                    drawingObject.x( pos[ 0 ] );
                    drawingObject.y( pos[ 1 ] ); 
                    drawingObject.stroke( userState.drawing_color );
                    drawingObject.strokeWidth( userState.drawing_width );
                    drawingObject.fill( null );
                    drawingObject.size( { "width": width, "height": height} );
                    drawingObject.lineCap( userState.lineCap );
                    drawingObject.lineJoin( userState.lineJoin );
                    clearBeforeDraw = true;                    
                    break;

                default:
                    break;

            }

            if ( pointAccepted ) {

                // Update the view to keep pace with user input
                if ( drawingObject && activelyDrawing ) {
                    drawObject( drawingObject, clearBeforeDraw );
                    clearBeforeDraw = false;
                }
            }

        }   
    };

    function isValid( obj ) {
        var objType = ( {} ).toString.call( obj ).match( /\s([a-zA-Z]+)/ )[ 1 ].toLowerCase();
        return ( objType != 'null' && objType != 'undefined' );
    };

    function refreshState() {
        for ( var id in viewDriver.state.stages ) {
            renderScene( viewDriver.state.stages[ id ], true );
        }
    }

    function refreshLayer( layerID ) {
        var layer = viewDriver.state.nodes[ layerID ];
        if ( layer && layer.kineticObj ) {
            drawObject( layer.kineticObj, true );
        }
    }

    function findChild( parent, names ) {
        if ( names.length > 0 ) {
            var childName = names.shift();
            while ( childName === "" ) {
                childName = names.shift();
            }
            if ( parent.children[ childName ] ) {
                if ( names.length === 0 ) {
                    return parent.children[ childName ];
                } else {
                    return this.findChild( parent.children[ childName ], names );
                }
            }
            else {
                return undefined;
            }
        }
        return undefined;
    }

    function findSection( parentID, name ) {
        var parent = viewDriver.state.nodes[ parentID ];

        if ( parent && parent.children ) {
            for ( var i = 0; i < parent.children.length; i++ ) {
                if ( parent.children[ i ].indexOf( name, parentID.length ) >=  0 ) {
                    var childID = parent.children[ i ];
                    var child = viewDriver.state.nodes[ childID ];
                    return child;
                }
            }
        }

        return undefined;
    }

    function createLocalKineticNode( parentID, drawingID, objDef, implementsID, source, type, name ) {

        var extendsID = objDef.extends;

        var node = viewDriver.state.createLocalNode( parentID, drawingID, extendsID, implementsID, source, type, null, name );
        node.prototypes = [];
        node.prototypes.push( extendsID );

        node.kineticObj = createKineticObject( node, objDef.properties );

        viewDriver.state.addNodeToHierarchy( node );

        return node;
    }

    function createKineticObject( node, config ) {
        var protos = node.prototypes;
        var kineticObj = undefined;

        if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/arc.vwf" ) ) {
            kineticObj = new Konva.Arc( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/baseLayer.vwf" ) ) {
            kineticObj = new Konva.BaseLayer( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/canvas.vwf" ) ) {
            kineticObj = new Konva.Canvas( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/circle.vwf" ) ) {
            kineticObj = new Konva.Circle( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/ellipse.vwf" ) ) {
            kineticObj = new Konva.Ellipse( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/fastLayer.vwf" ) ) {
            kineticObj = new Konva.FastLayer( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/group.vwf" ) ) {
            kineticObj = new Konva.Group( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/drawingGroup.vwf" ) ) {
            kineticObj = new Konva.Group( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/image.vwf" ) ) {
            var imageObj = new Image();
            node.scaleOnLoad = config.scaleOnLoad;
            kineticObj = new Konva.Image( {
                image: imageObj
            } );
            if ( node.source !== undefined ) {
                imageObj.src = node.source;    
            }
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/layer.vwf" ) ) {
            kineticObj = new Konva.Layer( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/line.vwf" ) ) {
            kineticObj = new Konva.Line( config || { "points": [] } );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/path.vwf" ) ) {
            kineticObj = new Konva.Path( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/rect.vwf" ) ) {
            kineticObj = new Konva.Rect( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/regularPolygon.vwf" ) ) {
            kineticObj = new Konva.RegularPolygon( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/ring.vwf" ) ) {
            kineticObj = new Konva.Ring( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/sprite.vwf" ) ) {
            var imageObj = new Image();
            node.scaleOnLoad = false;
            kineticObj = new Konva.Sprite( {
                image: imageObj
            } );
            if ( node.source !== undefined ) {
                imageObj.src = node.source;    
            }
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/stage.vwf" ) ) {
            var stageWidth = ( window && window.innerWidth ) ? window.innerWidth : 800;
            var stageHeight = ( window && window.innerHeight ) ? window.innerHeight : 600;
            var stageContainer = ( config && config.container ) || 'vwf-root';
            var stageWidth = ( config && config.width ) || stageWidth;
            var stageHeight = ( config && config.height ) || stageHeight;
            var stageDef = {
                "container": stageContainer, 
                "width": stageWidth, 
                "height": stageHeight 
            };
            kineticObj = new Konva.Stage( stageDef );
            viewDriver.state.stages[ node.ID ] = kineticObj;
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/star.vwf" ) ) {
            kineticObj = new Konva.Star( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/text.vwf" ) ) {
            kineticObj = new Konva.Text( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/textPath.vwf" ) ) {
            kineticObj = new Konva.TextPath( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/wedge.vwf" ) ) {
            kineticObj = new Konva.Wedge( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/shape.vwf" ) ) {
            kineticObj = new Konva.Shape( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/container.vwf" ) ) {
            kineticObj = new Konva.Container( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/node.vwf" ) ) {
            kineticObj = new Konva.Node( config || {} );
        }

        return kineticObj;
    }

    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }

    function isContainerDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/kinetic/container.vwf" );
            }
        }
        return found;
    }

    function findLayer( kineticObj ) {

        var layer = undefined;
        var parent = kineticObj;
        while ( parent !== undefined && layer === undefined ) {
            if ( parent.nodeType === "Layer" ) {
                layer = parent;
            }
            parent = parent.parent;
        }
        return layer;
        
    }

    function isChildOf( kineticObj, parentID ) {

        var foundParent = false;
        var parent = kineticObj;
        while ( parent !== undefined && !foundParent ) {
            if ( parent.id() === parentID ) {
                foundParent = true;
            }
            parent = parent.parent;
        }
        return foundParent;
    }

    function propagateNodeToModel( localDrawingInfo ) {
        // Update the VWF node descriptor with attributes from the intermediate Kinetic nodes used
        // while editing
        var drawingDef = localDrawingInfo.drawingDef;
        drawingDef.properties = 
            createDrawingDefProperties( drawingDef.properties, localDrawingInfo.drawingObject );

        var drawingDefChildren = drawingDef.children;
        for ( var childName in drawingDefChildren ) {
            var child = localDrawingInfo.drawingObject[ childName ];
            if ( !child ) {
                console.error( "propagateNodeToModel: No child named '", childName, "'" );
                continue;
            }
            var childDef = drawingDefChildren[ childName ];
            childDef.properties = createDrawingDefProperties( childDef.properties, child );
        }

        // Create the node in the model
        viewDriver.kernel.createChild( localDrawingInfo.drawingParentID,
            localDrawingInfo.drawingChildName, drawingDef );

        var action = {
            type: "drawing",
            drawingInfo: localDrawingInfo,
            drawingDef: drawingDef
        };
        action.undo = function(){
            // Delete the drawing from the model
            if (this.drawingInfo) {
                viewDriver.kernel.deleteChild( this.drawingInfo.drawingParentID,
                    this.drawingInfo.drawingChildName);
            }
        };
        action.redo = function(){
            if (this.drawingInfo && this.drawingDef) {
                viewDriver.kernel.createChild( this.drawingInfo.drawingParentID,
                    this.drawingInfo.drawingChildName, this.drawingDef );
            }
        };

        fireViewEvent( "action", action );
        // Delete the private node - we no longer need it
        // Remove the kinetic object from the tree and destroy the object
        markPrivateDrawingNodeForDeletion();

        // Set a VWF descriptor's `properties` to describe a Kinetic node using its attributes
        function createDrawingDefProperties( startingProperties, kineticNode ) {

            var properties = $.extend( {}, startingProperties, {
                "attributes": $.extend( {}, kineticNode.getAttrs() ),
            } );

            properties.image = localDrawingInfo.imageDataURL || properties.image;

            // Remove attributes related to editing with the intermediate node.
            delete properties.attributes.id;
            delete properties.attributes.name;

            // Ensure that `radius` is the last attribute since `width` or `height` will override
            // `radius` if both are provided.
            switch ( kineticNode.className ) {
                case "Circle":
                case "Ellipse":
                    delete properties.attributes.height;
                    delete properties.attributes.width;
                    break;
            }

            return properties;

        }

    }

    function drawObject( kineticObject, clearBefore ) {

        if ( clearBefore ) {

            // Draw the full layer
            // (we need only draw an object if it is a child of a layer -
            //  otherwise, it is the stage itself and doesn't need redrawing)
            var layer = findLayer( kineticObject );
            layer && layer.batchDraw();
        } else if ( kineticObject.batchDraw instanceof Function ) {
            kineticObject.batchDraw();
            console.log( "Warning: drawObject called on state" );
        } else {
            kineticObject.draw();
        }
    }

    function getDefaultProperties( drawingMode, groupParent, eventPoint ) {

        var userState = drawing_client;

        var retObj = {
            "visible": 'inherit',
            "listening": 'inherit',
            "opacity": userState.drawing_opacity,
            "index": 4
        };

        if ( userState.shadows ) {
            for ( var shadowProp in userState.shadows ) {
                retObj[ shadowProp ] = userState.shadows[ shadowProp ];
            }
        }

        switch( drawingMode ) {
            case "sprite":
            case "text":
            case "image":
                retObj.opacity = 1.0;
                retObj.scaleOnLoad = true;
                if ( drawingMode === "text" ) {
                    retObj.disableScaleAndRotationForSpeed = false;
                }
                break;
            case "arrow":
            case "thickArrow":
                retObj.disableScaleAndRotationForSpeed = false;
                break;
            default:
                retObj.fill = userState.drawing_color;
                break;
        }

        if ( groupParent ) {
            retObj.x = 0;
            retObj.y = 0;
            retObj.position = [ 0, 0 ];
        } else {
            retObj.x = eventPoint[ 0 ];
            retObj.y = eventPoint[ 1 ];
            retObj.position = eventPoint;
        }

        return retObj; 
    }

    function createTextObject( textValue ) {

        var textCreated = false;

        // Get the location and dimensions from the border rectangle
        var position = [ drawing_private.drawingObject.x(), drawing_private.drawingObject.y() ];
        var width = drawing_private.drawingObject.width();
        var height = drawing_private.drawingObject.height();
        var childID = drawing_private.drawingObject.id();
        var parentID = drawing_private.drawingObject.parent.id();
        var name = drawing_private.drawingObject.name();
        var compExtends = "http://vwf.example.com/kinetic/text.vwf";
        var shapeDef = {
            "extends": compExtends,
            "properties": getDefaultProperties( "text", false, position )
        };
        shapeDef.properties.rotation = drawing_private.drawingObject.rotation();

        // Delete the border rectangle
        deletePrivateNode( false );
        drawing_private.drawingDef = shapeDef;

        // Create the text object
        if ( textValue && ( textValue !== "" ) ) {
            private_node = createLocalKineticNode( parentID, childID, shapeDef, [], undefined, undefined, name );
            drawing_private.drawingObject = private_node.kineticObj;
            textCreated = true;
        } else {
            drawing_private = {};
            private_node = undefined;            
        }

        return textCreated;
    }

    function setImage( imageUrl ) {

        var drawingObject = drawing_private.drawingObject;
        if ( !drawingObject ) {
            console.error( "setImage: There is no drawing object on which to set an image" );
            return;
        }
        drawingObject.stroke( null );
        drawingObject.strokeEnabled( false );
        if ( imageUrl ) {
            var imageObj = new Image();

            imageObj.onload = function() {
                drawing_private.imageDataURL = imageUrl;

                // Set the width and height to maintain aspect ratio
                var imgAspectRatio = imageObj.width / imageObj.height;
                var width = drawingObject.width();
                var height = drawingObject.height();

                // Use the larger dimension to set the width and height
                if ( width >= height ) {
                    height = width / imgAspectRatio;
                } else {
                    width = height * imgAspectRatio;
                }
                drawingObject.width( width );
                drawingObject.height( height );

                // Propagate the node to the model
                propagateNodeToModel( drawing_private );
            };

            imageObj.onerror = function() {
                deletePrivateNode( true );
            };
            
            imageObj.src = imageUrl;
        } else {
            deletePrivateNode( true );
        }
    }

    function deletePrivateNode( fullyDelete ) {

        // Find this object's layer so we can redraw it once we have cleared the private object
        var layer = findLayer( drawing_private.drawingObject );

        clearPrivateDrawing( drawing_private );

        if ( fullyDelete ) {
            drawing_private = {};
            private_node = undefined;            
        }

        if ( layer ) {
            layer.batchDraw();
        }
    }

    function markPrivateDrawingNodeForDeletion() {

        // Mark this private drawing object for deletion
        // It will be deleted when createdNode notifies us that
        // the public version of the drawing has been created
        var parentID = drawing_private.drawingParentID;
        var nodeName = drawing_private.drawingChildName;
        privateNodesToDelete[ parentID ] = privateNodesToDelete[ parentID ] || {};
        privateNodesToDelete[ parentID ][ nodeName ] = drawing_private;

        // Unset the private drawing node
        drawing_private = {};
        private_node = undefined;            
    }

    function isDrawingObject( nodeID ) {
        var drawingObject = drawing_private && drawing_private.drawingObject;
        return drawingObject && ( nodeID === drawingObject.id() );
    }

    function clearPrivateDrawing( privateDrawingState ) {
        privateDrawingState.drawingObject.remove();
        privateDrawingState.drawingObject.destroy();
        privateDrawingState.drawingObject = null;
        privateDrawingState.imageDataURL = null;
    }

    function fireViewEvent( eventName, parameters ) {
        var eventHandler = eventHandlers[ eventName ];
        if ( typeof eventHandler === "function" ) {
            eventHandler( parameters );
        }
    }
} );
