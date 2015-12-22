"use strict";

define( [ "module", "vwf/view", "jquery", "vwf/utility", "vwf/utility/color" ], 
    function( module, view, $, utility, color ) {

    var viewDriver;
    var stageContainer;
    var stageWidth = ( window && window.innerWidth ) ? window.innerWidth : 800;
    var stageHeight = ( window && window.innerHeight ) ? window.innerHeight : 600;
    var drawing_private = {};
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
            "zIndex": 4 
        };
    var drawing_index = 0;
    var private_node = undefined;
    var activelyDrawing = false;
    var clearBeforeDraw = false;
    var lastRenderTime = 0;     // last time whole scene was rendered
    var renderTimeout = 100;    // ms between renders

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
                console.info( " tapHold moved for node: " + this.node.ID + " at position: [ " + position.client[0] + ", " +  position.client[1] + " ], timerId = " + this.timerId );
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
                console.info( " Cancel tapHold for node: " + this.node.ID );
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
            console.info( " Registering for tapHold events for: ");
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
            console.info( " tapHold event firing for node: " + tapHold.node.ID );
            viewDriver.kernel.fireEvent( tapHold.node.ID, 'tapHold', [ tapHold.initialPosition ] );
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
                console.info( " swiped across node: " + node.ID );
                if ( isTouchStart && this.touchStartIsTap ) {
                    viewDriver.kernel.fireEvent( node.ID, 'tap', eventData );
                } else {
                    viewDriver.kernel.fireEvent( node.ID, 'swipe', [ ] );
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
            console.info( " Registering for swipe events for: ");
            for ( var i = 0; i < protoFilters.length; i++ ) {
                console.info( i + ". " + protoFilters[i] );
            }
            this.protoFilter = protoFilters;
        },
        "listenForSwipes":          function( params ) {
            this.isListening      = params.listen;
            this.parentFilter     = params[ "parent" ];
            this.touchStartIsTap  = params[ "touchStartIsTap" ];
        } 
    };

    // Find the parent of the kinetic node
    function findParent( kineticNode, protoID ) {

        if ( kineticNode !== undefined ) {
            if ( kineticNode.prototypeID === protoID )
                return kineticNode;
            else 
                return findParent( _kineticComponents[ kineticNode.parentID ], protoID );       
        }
        return undefined;
    }

    // Attach handlers for mouse events
    function attachMouseEvents( node ) {

        var mouseDown = false;

        node.kineticObj.on( "mousemove", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();

            //viewDriver.kernel.dispatchEvent( node.ID, 'pointerMove', eData.eventData, eData.eventNodeData );
            //viewDriver.kernel.fireEvent( node.ID, 'pointerMove', eData.eventData );
            //activelyDrawing = mouseDown;

            //var userState = drawing_client;
            //if ( userState[ "drawing_mode" ] && ( userState[ "drawing_mode" ] !== "none" ) ) {
                //activelyDrawing = true;
            //    drawMove( node.ID, eData.eventData[0], node, false );
            //}
            drawMove( node.ID, eData.eventData[0], node, false ); 

            var userState = drawing_client;
            if ( !userState[ "drawing_mode" ] || ( userState[ "drawing_mode" ] === "none" ) ) {
                activelyDrawing = false;
            }

        } );

        node.kineticObj.on( "mouseout", function( evt ) {
            var eData = processEvent( evt, node, false );
            viewDriver.kernel.fireEvent( node.ID, 'pointerOut', eData.eventData );
        } );

        node.kineticObj.on( "mouseenter", function( evt ) {
            var eData = processEvent( evt, node, false );
            //viewDriver.kernel.dispatchEvent( node.ID, 'pointerEnter', eData.eventData, eData.eventNodeData );
            //if ( mouseDown ) {
                swipe.swipedAcross( node );
            //}
            //viewDriver.kernel.fireEvent( node.ID, 'pointerEnter', eData.eventData );
        } );

        node.kineticObj.on( "mouseleave", function( evt ) {
            var eData = processEvent( evt, node, false );
            // viewDriver.kernel.dispatchEvent( node.ID, 'pointerLeave', eData.eventData, eData.eventNodeData );
            //if ( mouseDown ) {
                swipe.swipedAcross( node );
            //}
            //viewDriver.kernel.fireEvent( node.ID, 'pointerLeave', eData.eventData );
        } );

        node.kineticObj.on( "mousedown", function( evt ) { 
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();

            // Track mouseDown so we know we're holding the button during a move/drag
            mouseDown = true;
            //viewDriver.kernel.dispatchEvent( node.ID, 'pointerDown', eData.eventData, eData.eventNodeData );
            //viewDriver.kernel.fireEvent( node.ID, 'pointerDown', eData.eventData );

            // Process drawing (if actively drawing)
            var userState = drawing_client;
            //if ( userState[ "drawing_mode" ] && ( userState[ "drawing_mode" ] !== "none" ) ) {
            //    activelyDrawing = true;
            //    console.info( "VIEW: drawDown" );
            //    drawDown( node.ID, eData.eventData[0], node, false );
            //}
            drawDown( node.ID, eData.eventData[0], node, false ); 

            var userState = drawing_client;
            if ( userState[ "drawing_mode" ] && ( userState[ "drawing_mode" ] !== "none" ) ) {
                activelyDrawing = true;
            }

        } );

        node.kineticObj.on( "mouseup", function( evt ) {
            var eData = processEvent( evt, node, false );
            mouseDown = false;

            // Cancel tapHold event (if any)
            tapHold.cancel();

            //viewDriver.kernel.dispatchEvent( node.ID, 'pointerUp', eData.eventData, eData.eventNodeData );
            //viewDriver.kernel.fireEvent( node.ID, 'pointerUp', eData.eventData );
            drawUp( node.ID, eData.eventData[0], node, true ); 

            activelyDrawing = false;
            render( node.kineticObj, true );

            //var userState = drawing_client;
            //if ( activelyDrawing ) {
             //   console.info( "VIEW: drawUp" );
             //   drawUp( node.ID, eData.eventData[0], node, true ); 
            //}
            //activelyDrawing = false;

            if ( node.kineticObj.mouseDragging ) {
                viewDriver.kernel.fireEvent( node.ID, 'dragEnd', eData.eventData );
                node.kineticObj.mouseDragging = false;
            
                //setViewProperty( node.ID, "x", eData.eventData.stageRelative.x );
                //setViewProperty( node.ID, "y", eData.eventData.stageRelative.y );

                if ( viewDriver.state.draggingNodes[ node.ID ] !== undefined ) {
                    //var x = viewDriver.state.getModelProperty( node.ID, "x" );
                    //var y = viewDriver.state.getModelProperty( node.ID, "y" );
                    delete viewDriver.state.draggingNodes[ node.ID ]; 
                    //viewDriver.state.setModelProperty( node.ID, "x", x );
                    //viewDriver.state.setModelProperty( node.ID, "y", y );   
                }
            }
                     
        } );

        node.kineticObj.on( "click", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();
            activelyDrawing = false;
            render( node.kineticObj, true );

            //viewDriver.kernel.dispatchEvent( node.ID, 'pointerClick', eData.eventData, eData.eventNodeData );
            viewDriver.kernel.fireEvent( node.ID, 'pointerClick', eData.eventData );
        } );

        node.kineticObj.on( "dblclick", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();
            activelyDrawing = false;
            render( node.kineticObj, true );

            //viewDriver.kernel.dispatchEvent( node.ID, 'pointerDoubleClick', eData.eventData, eData.eventNodeData );
            viewDriver.kernel.fireEvent( node.ID, 'pointerDoubleClick', eData.eventData );
        } );

        /*draw
        node.kineticObj.on( "dragstart", function( evt ) {
            var eData = processEvent( evt, node, false );
            viewDriver.kernel.fireEvent( node.ID, 'dragStart', eData.eventData );
            node.kineticObj.mouseDragging = true;
        } );
        
        
        node.kineticObj.on( "dragmove", function( evt ) {
            var eData = processEvent( evt, node, false );
            viewDriver.kernel.fireEvent( node.ID, 'dragMove', eData.eventData );
        } );
        */
        
        node.kineticObj.on( "dragstart", function( evt ) {
            var eData = processEvent( evt, node, false );
            //viewDriver.kernel.dispatchEvent( node.ID, "dragStart", eData.eventData, eData.eventNodeData );
            
            viewDriver.kernel.fireEvent( node.ID, 'dragStart', eData.eventData );

            //var xPos = viewDriver.state.getProperty( node.ID, "x" );
            //var yPos = viewDriver.state.getProperty( node.ID, "y" );

            var xPos = viewDriver.state.getProperty( node.kineticObj, "x" );
            var yPos = viewDriver.state.getProperty( node.kineticObj, "y" );
            //setViewProperty( node.ID, "position", [ xPos, yPos ] );
            ////setViewProperty( node.ID, "x", xPos );
            ////setViewProperty( node.ID, "y", yPos );
            //console.info( "dragstart( "+node.ID+", x: "+xPos+", y: "+yPos+" )" );

            //viewDriver.state.draggingNodes[ node.ID ] = true;
            viewDriver.state.draggingNodes[ node.ID ] = node;
            node.kineticObj.mouseDragging = true;

            swipe.swipedAcross( node );

        } );
        
        node.kineticObj.on( "dragmove", function( evt ) {
            var eData = processEvent( evt, node, false );

            tapHold.moved( node, eData.eventData[0] );
            //viewDriver.kernel.dispatchEvent( node.ID, "dragMove", eData.eventData, eData.eventNodeData );
            viewDriver.kernel.fireEvent( node.ID, 'dragMove', eData.eventData );
            activelyDrawing = false;

            if ( node.kineticObj.mouseDragging ) {
                var xPos = viewDriver.state.getProperty( node.kineticObj, "x" );
                var yPos = viewDriver.state.getProperty( node.kineticObj, "y" );
                //setViewProperty( node.ID, "position", [ xPos, yPos ] );
                ////setViewProperty( node.ID, "x", xPos );
                ////setViewProperty( node.ID, "y", yPos );
            }

        } );
        
        // I couldn't get this to work, so instead I keep track of mouseDragging separately
        // in dragstart and mouseup (Eric - 11/18/14)
        node.kineticObj.on( "dragend", function( evt ) {
            var eData = processEvent( evt, node, false );

            //tapHold.cancel();
            //viewDriver.kernel.dispatchEvent( node.ID, "dragEnd", eData.eventData, eData.eventNodeData );
            viewDriver.kernel.fireEvent( node.ID, 'dragEnd', eData.eventData );
            activelyDrawing = false;

            node.kineticObj.mouseDragging = false;
            if ( viewDriver.state.draggingNodes[ node.ID ] !== undefined ) {
                //var x = viewDriver.state.getModelProperty( node.ID, "x" );
                //var y = viewDriver.state.getModelProperty( node.ID, "y" );
                delete viewDriver.state.draggingNodes[ node.ID ]; 
                //viewDriver.state.setModelProperty( node.ID, "x", x );
                //viewDriver.state.setModelProperty( node.ID, "y", y );   
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

            //viewDriver.kernel.dispatchEvent( node.ID, "touchStart", eData.eventData, eData.eventNodeData );
            //viewDriver.kernel.fireEvent( node.ID, 'touchStart', eData.eventData );
            drawDown( node.ID, eData.eventData[0], node, false ); 

            var userState = drawing_client;
            if ( !userState[ "drawing_mode" ] || ( userState[ "drawing_mode" ] === "none" ) ) {
                activelyDrawing = false;
            }

            swipe.swipedAcross( node, true, eData.eventData );

        } );

        node.kineticObj.on( "touchmove", function( evt ) {
            var eData = processEvent( evt, node, false );

            // If tapHold started, check that we haven't moved too much
            tapHold.moved( node, eData.eventData[0].touches[0] );

            //viewDriver.kernel.dispatchEvent( node.ID, "touchMove", eData.eventData, eData.eventNodeData );
            //viewDriver.kernel.fireEvent( node.ID, 'touchMove', eData.eventData );
            drawMove( node.ID, eData.eventData[0], node, false ); 

            var userState = drawing_client;
            if ( userState[ "drawing_mode" ] && ( userState[ "drawing_mode" ] !== "none" ) ) {
                activelyDrawing = true;
            }

            //swipe.swipedAcross( node );
        } );

        node.kineticObj.on( "touchend", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();

            //viewDriver.kernel.dispatchEvent( node.ID, "touchEnd", eData.eventData, eData.eventNodeData );
            //viewDriver.kernel.fireEvent( node.ID, 'touchEnd', eData.eventData );
            drawUp( node.ID, eData.eventData[0], node, true ); 

            activelyDrawing = false;
            render( node.kineticObj, true );
        } );

        node.kineticObj.on( "tap", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();
            activelyDrawing = false;

            //viewDriver.kernel.dispatchEvent( node.ID, "tap", eData.eventData, eData.eventNodeData );
            viewDriver.kernel.fireEvent( node.ID, 'tap', eData.eventData );
            render( node.kineticObj, true );
        } );

        node.kineticObj.on( "dbltap", function( evt ) {
            var eData = processEvent( evt, node, false );

            // Cancel tapHold event (if any)
            tapHold.cancel();
            activelyDrawing = false;

            //viewDriver.kernel.dispatchEvent( node.ID, "dragStart", eData.eventData, eData.eventNodeData );
            viewDriver.kernel.fireEvent( node.ID, 'doubleTap', eData.eventData );
            render( node.kineticObj, true );
        } );
    }

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

            var protos = node.prototypes;
            if ( viewDriver.state.isKineticClass( protos, [ "kinetic", "stage", "vwf" ] ) ) {
                var stage = this.state.stage = node.kineticObj;
                render( node.kineticObj );
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

                // Attach the mouse and/or touch events based on property settings
                //vwf_view.kernel.getProperty( childID, "supportMouseEvents" );
                //vwf_view.kernel.getProperty( childID, "supportTouchEvents" );
                viewDriver.kernel.getProperty( childID, "supportMouseEvents" );
                viewDriver.kernel.getProperty( childID, "supportTouchEvents" );

                render( node.kineticObj );
            }

         },
 
        // -- deletedNode ------------------------------------------------------------------------------

        deletedNode: function( nodeID ) { 
            for ( var id in viewDriver.state.stages ) {
                renderScene( viewDriver.state.stages[ id ], true );                
            } 
        },

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

            //console.info( "kineticjs(view) satProperty. propertyName: " + propertyName + ", propertyValue: " + propertyValue + ", nodeID: " + nodeID );


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
                    if ( viewDriver.state.isKineticClass( protos, [ "kinetic", "stage", "vwf" ] ) ) {

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
                            // stage.off( 'contentTouchstart' );
                            // stage.off( 'contentTouchmove' );
                            // stage.off( 'contentTouchend' );
                            // stage.off( 'contentTap' );                            
                        }
                    }
                    break;
                case "scale":
                    if ( node.model.scale !== undefined ) {
                        kineticObj.scale( { 
                            "x": node.model.scale.x, 
                            "y": node.model.scale.y 
                        } );
                    }
                    break;
                case "scaleX":
                    if ( node.model.scaleX !== undefined ) {
                        kineticObj.scaleX( node.model.scaleX );
                    }
                    break;
                case "scaleY":
                    if ( node.model.scaleX !== undefined ) {
                        kineticObj.scaleY( node.model.scaleX );
                    }
                    break;

                case "activeLayerID":
                    if ( this.kernel.client() === this.kernel.moniker() ) {
                        drawing_client.drawing_parentID = propertyValue;
                    }
                    break;

                case "text":
                    if ( drawing_private !== undefined && drawing_private.drawingObject ) {
                        var drawingObject = drawing_private.drawingObject;
                        if ( drawingObject.content.id() === nodeID ) {
                            drawingObject.content.text( propertyValue );
                            drawObject( drawingObject, true );
                            propagateNodeToModel();
                        }
                    }
                    break;

            }            

        },

        calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {
            
            console.info( "methodName = " + methodName );

            if ( this.kernel.client() === this.kernel.moniker() ) {
                var prop, value, t;
                switch ( methodName ) {
                    
                    case "setViewProperty":
                        prop = methodParameters[ 0 ];
                        value = methodParameters[ 1 ];
                        var isStatic = methodParameters.length > 1 ? methodParameters[ 2 ] : false ;
                        
                        setViewProperty( nodeID, prop, value, isStatic );
                        break;

                    case "setClientUIState":
                        setClientUIState( methodParameters[0] );
                        break;

                    case "setKineticProperty":
                        if ( private_node && private_node.kineticObj ) {
                            var propertyName = methodParameters[ 1 ];
                            var propertyValue = methodParameters[ 2 ];
                            setKineticProperty( private_node.kineticObj, propertyName, propertyValue );
                        }
                        /*
                        var kineticNode =  viewDriver.state.nodes[ methodParameters[0] ];
                        var propertyName = methodParameters[ 1 ];
                        var propetyValue = methodParameters[ 2 ];
                        if ( kineticNode && kineticNode.kineticObj ) {
                            setKineticProperty( kineticNode.kineticObj, propertyName, propertyValue );
                        }
                        */
                        break;

                    case "registerForTapHoldEvents":
                        tapHold.registerForTapHoldEvents( methodParameters );
                        break;

                    case "listenForTapHold":
                        tapHold.listenForTapHold( methodParameters[0] );
                        break;

                    case "registerForSwipeEvents":
                        swipe.registerForSwipeEvents( methodParameters );
                        break;

                    case "listenForSwipes":
                        swipe.listenForSwipes( methodParameters[0] );
                        break;

                }
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

        firedEvent: function( nodeID, eventName, eventData ) {
            switch ( eventName ) {

                case "draggingFromView":

                    // If the transform property was initially updated by this view....
                    if ( self.kernel.client() === self.kernel.moniker() ) {

                        // Tell the model not to update the view on the next position update because 
                        // kinetic has already done so
                        // (this event is fired right before this driver sets the model property, so we 
                        // can be sure that the very next set of the position property is from us)
                        var node = this.state.nodes[ nodeID ];
                        node.model.position.ignoreNextPositionUpdate = true;
                    }
                    break;

                case "privateDrawingUpdated":
                    // User is actively drawing on the local client
                    // make sure the drawing is displayed as the user draws it.
                    if ( self.kernel.client() === self.kernel.moniker() )  {
                        var node = this.state.nodes[ eventData[0] ];
                        if ( node ) {
                            var kineticObj = node.kineticObj;
                            if ( kineticObj && activelyDrawing ) {
                                //kineticObj.drawScene();
                                //kineticObj.draw();
                            }
                        }
                        /*
                        for ( var id in viewDriver.state.stages ){
                            viewDriver.state.stages[ id ].drawScene();                
                        } */
                    }
                    break;

                case "textValueUpdated":
                    if ( drawing_private !== undefined && drawing_private.drawingObject ) {
                        var drawingObject = drawing_private.drawingObject;
                        if ( drawingObject.content.id() === eventData[0] ) {
                            drawingObject.content.text( eventData[1] );
                            drawObject( drawingObject, true );
                            propagateNodeToModel();
                        }
                    }                    
                    break;

                default:
                    break;                    
            }

        },

        // firedEvent: function( nodeID, eventName ) {
        // },

        ticked: function( vwfTime ) {
            update( vwfTime );
        }
    
    
    } );

    function update( vwfTime ) {
        
        // switch to update, when the tickless branch is merged to development
        var nodeIDs = Object.keys( viewDriver.state.draggingNodes );
        
        for ( var i = 0; i < nodeIDs.length; i++ ) {
        
            var nodeID = nodeIDs[ i ];
            var node = viewDriver.state.draggingNodes[ nodeID ];

            // If users can drag this node and all clients should stay synchronized, we must 
            // pull the new node position out of kinetic and update the model with it
            if ( node.kineticObj ) {
                //console.info( "update( Node: "+nodeID+" )" );
                if ( node.kineticObj.draggable() && node.model && node.model.position && !node.model.position.isStatic )  { 
                    //( ( node.model.y !== undefined ) && !( node.model.y.isStatic ) ) )  {
                    var kineticX = node.kineticObj.x();
                    var kineticY = node.kineticObj.y();

                    // If the position of this node has changed since its last model value, set the
                    // model property with the new value
                    if ( ( node.model.position.value[0] !== kineticX ) || 
                         ( node.model.position.value[1] !== kineticY ) ) {
                        //console.info( "- "+nodeID+", model position: "+node.model.position.value.x+", "+node.model.position.value.y+", kinetic position: "+kineticX+", "+kineticY );

                        // Fire this event to notify the model that kinetic has already updated the
                        // view and it doesn't need to (if the model set the value, it would risk 
                        // having the model set the view back to an old value, which results in 
                        // jitter while the user is dragging the node)
                        viewDriver.kernel.fireEvent( nodeID, "draggingFromView" );
                        viewDriver.kernel.setProperty( nodeID, "position", [ kineticX, kineticY ] );
                        //viewDriver.kernel.setProperty( nodeID, "position", [ kineticX, kineticY ] );
                        //console.info( "setProperty( "+nodeID+", position: kineticX: "+kineticX+", kineticY: "+kineticY+" )" );

                        // Tell the model not to update the view on the next position update because 
                        // kinetic has already done so
                        // (this event is fired right before this driver sets the model property, so we 
                        // can be sure that the very next set of the position property is from us) 
                        //if ( viewDriver.kernel.client() === viewDriver.kernel.moniker() ) {
                        //    node.model.position.ignoreNextPositionUpdate = true;
                        //}
                    }
                }
            }

        }

        for ( var id in viewDriver.state.stages ){
            renderScene( viewDriver.state.stages[ id ] );                
        } 
    }

    function renderScene( stage, force ) {
        //window.requestAnimationFrame( renderScene( stage ) );
        if ( stage && !activelyDrawing ) {
            //stage.batchDraw();
            render( stage, force );
        }
    }

    function render( kineticObj, force ) {
        var now = Date.now();
        if ( kineticObj && ( ( ( now - lastRenderTime ) > renderTimeout ) || force ) ) {
            kineticObj.draw();
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

            if ( viewDriver && viewDriver.state.nodes[ pointerPickID ] ) {
                var childID = pointerPickID;
                var child = viewDriver.state.nodes[ childID ];
                var parentID = child.parentID;
                var parent = viewDriver.state.nodes[ child.parentID ];
                while ( child ) {

                    returnData.eventNodeData[ childID ] = [ {
                        pickID: pointerPickID,
                    } ];

                    childID = parentID;
                    child = viewDriver.state.nodes[ childID ];
                    parentID = child ? child.parentID : undefined;
                    parent = parentID ? viewDriver.state.nodes[ child.parentID ] : undefined;

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

    function setViewProperty( id, propertyName, propertyValue, isStatic ) {
        //console.info( "setViewProperty( "+id+", "+propertyName+", "+propertyValue+", "+isStatic+" )" );
        var node = viewDriver.state.nodes[ id ];
        if ( node && node.kineticObj ) {
            if ( utility.validObject( propertyValue ) ) {
                if ( node.model[ propertyName ] === undefined ) {
                    //console.info( "- store property "+propertyName+" model value: "+viewDriver.state.getProperty( node.kineticObj, propertyName )+", isStatic: "+isStatic );
                    node.model[ propertyName ] = {
                        "value":    viewDriver.state.getProperty( node.kineticObj, propertyName ),
                        "isStatic": ( ( isStatic === undefined ) ? false : isStatic ) 
                    };
                } else if ( node.model[propertyName].isStatic ) {
                    node.model[ propertyName ].value = propertyValue;
                }
                viewDriver.state.setProperty( node.kineticObj, propertyName, propertyValue );
                //console.info( "- set kineticObject property: "+propertyName+" to: "+propertyValue );
            } else {
                var modelValue = node.model[ propertyName ].value;
                if ( modelValue !== undefined ) {
                    //delete node.model[ propertyName ]; 
                    viewDriver.state.setProperty( node.kineticObj, propertyName, modelValue );   
                    console.info( "- deletes node.model and set kineticObject property: "+propertyName+" to: "+modelValue );
                }
            }
        }
    }

    setUpPrivate = function() {
        
        //if ( drawing_private === undefined ) {
        //    drawing_private = {};
        //}
        if ( drawing_private === undefined ) {
            drawing_private = {
                "drawingObject": null,
                "initialDownPoint": [ -1, -1 ],
                "previousPoint": [ -1, -1 ],
                "mouseDown": false
            };  
        }

    };

    function drawDown( nodeID, eventData, nodeData, touch ) {

        var node = viewDriver.state.nodes[ nodeID ];

        //if ( !isValid( node.drawing_clients ) || 
        //     !isValid( node.drawing_clients[ node.client ] ) ) {
        //    node.clientJoin( node.client );
        //} 
        if ( !isValid( drawing_private ) ) {
            setUpPrivate();
        }

        var userState = drawing_client;
        var privateState = drawing_private;
        var drawingMode = userState.drawing_mode;

        if ( privateState.drawingObject || drawingMode === 'none' ) {
            return;
        }

        var compExtends = undefined;
        var groupExtends = undefined;
        var section = "shapes";

        if ( drawingMode === "freeDraw" ) {
            section = "lines";        
        }

        switch ( drawingMode ) {
            
            case "arc":
            case "circle":
            case "ellipse":
            case "regularPolygon":
            case "rect":
            case "ring":
            case "star":
            case "wedge":
                compExtends = [ "http://vwf.example.com/kinetic/", drawingMode, ".vwf" ].join(''); 
                break;

            case "sprite":            
            case "image":
                /*
                groupExtends = "http://vwf.example.com/kinetic/drawingGroup.vwf";
                compExtends = { 
                    "border": "http://vwf.example.com/kinetic/line.vwf", 
                    "content": [ "http://vwf.example.com/kinetic/", drawingMode, ".vwf" ].join('')
                };*/
                compExtends = [ "http://vwf.example.com/kinetic/", drawingMode, ".vwf" ].join('') 
                break;

            case "text":
                groupExtends = "http://vwf.example.com/kinetic/drawingGroup.vwf";
                compExtends = { 
                    "border": "http://vwf.example.com/kinetic/rect.vwf", 
                    "content": [ "http://vwf.example.com/kinetic/", drawingMode, ".vwf" ].join('') 
                };
                break;

            case "freeDraw":
            case "polygon":
            case "line":
            case "borderRect":
            case "arrow":
            case "thickArrow":
                compExtends = "http://vwf.example.com/kinetic/line.vwf";
                break;

            case 'none':
            default:
                break;

        }

        var getDefaultProperties = function( drawingMode, groupParent, eventPoint ) {
            var retObj = {
                "visible": 'inherit',
                "listening": 'inherit',
                "opacity": userState.drawing_opacity,
                "index": 4
            };

            switch( drawingMode ) {
                case "sprite":
                case "text":
                case "image":
                    retObj.opacity = 1.0;
                    retObj.scaleOnLoad = true;
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
        };

        var eventPointDown = eventData.stageRelative;
        if ( groupExtends !== undefined ) {

            privateState.initialDownPoint = eventPointDown;
            //var parentPath = userState.drawing_parentPath + section ;
            var parentPath = userState.drawing_parentID;
            //var parentNode = viewDriver.state.nodes[ parentPath ];
            var section = findSection( parentPath, section );
            var parent = section ? section : node;
            //var parents = this.find( parentPath );

            // find was failing 9/2/14, and the code below 
            // was a backup, going to leave this in until we feel good
            // about the issues we saw are no longer a problem        
            //if ( parents === undefined ) {
            //    parents = [ node.findChild( this, parentPath.split( '/' ) ) ];
            //}

            //var parent = viewDriver.state.nodes[ parentPath ] ? viewDriver.state.nodes[ parentPath ] : node;

            //var parent = parents.length > 0 ? parents[ 0 ] : this;
            var groupDef = {
                "extends": groupExtends,
                "properties": {
                    "visible": "inherit",
                    "listening": "inherit",
                    "position": eventPointDown                
                },
                "children": {}
            };

            var self = this;
            var selfMoniker = node.client;
            var name = drawingMode + drawing_index;
            drawing_index = drawing_index + 1;
            var childID = section.ID + ":" + name;

            private_node = createLocalKineticNode( section.ID, childID, groupDef, [], undefined, undefined, name );
            drawing_private.drawingObject = private_node.kineticObj;

            // Define the component objects of this group object
            for ( var def in compExtends ) {
                groupDef.children[ def ] = {
                    "extends": compExtends[ def ],
                    "properties": getDefaultProperties( drawingMode, false, eventPointDown )
                }
                var compID    = childID + ":" + def;
                var compChild =  createLocalKineticNode( childID, compID, groupDef.children[ def ], [], undefined, undefined, def );
                drawing_private.drawingObject[ def ] = compChild.kineticObj;
                drawing_private.drawingObject.children.push( drawing_private.drawingObject[ def ] );
                //drawing_private.children.push( compID );
            }

            //var self = this;
            //var selfMoniker = node.client;
            //var name = drawingMode + drawing_index;
            //drawing_index = drawing_index + 1;
            //var childID = section.ID + ":" + name;

            //parent.children.create( name, groupDef, function( child ) {
            //    drawing_private.drawingObject = child;
            //} );
            //private_node = createLocalKineticNode( section.ID, childID, groupDef, [], undefined, undefined, name );
            //drawing_private.drawingObject = private_node.kineticObj;
            drawUpdate( drawing_private.drawingObject.ID, eventData, nodeData, false );


        } else if ( compExtends !== undefined ) {

            privateState.initialDownPoint = eventPointDown;
            var parentPath = userState.drawing_parentID;
            //var parentNode = viewDriver.state.nodes[ parentPath ];
            var section = findSection( parentPath, section );
            var parent = section ? section : node;

            var shapeDef = {
                "extends": compExtends,
                "properties": getDefaultProperties( drawingMode, false, eventPointDown )
            };

            var self = this;
            var selfMoniker = node.client;
            var name = drawingMode + drawing_index;
            drawing_index = drawing_index + 1;
            var childID = section.ID + ":" + name;
            private_node = createLocalKineticNode( section.ID, childID, shapeDef, [], undefined, undefined, name );
            drawing_private.drawingObject = private_node.kineticObj;
            drawUpdate( drawing_private.drawingObject.ID, eventData, nodeData, false );

        }
    };

    function addNodeToHierarchy( node ) {
        
        console.info( "addNodeToHierarchy ID: " + node.ID + "    parentID: " + node.parentID );

        if ( node.kineticObj ) {
            
            //debugger;

            if ( viewDriver.state.nodes[ node.parentID ] !== undefined ) {
                var parent = viewDriver.state.nodes[ node.parentID ];
                if ( parent.kineticObj && isContainerDefinition( parent.prototypes ) ) {
                    
                    if ( parent.children === undefined ) {
                        parent.children = [];    
                    }
                    parent.children.push( node.ID );
                    //console.info( "Adding child: " + childID + " to " + nodeID );
                    parent.kineticObj.add( node.kineticObj );    
                }
            }
            node.kineticObj.setId( node.ID ); 
            node.kineticObj.name( node.name ); 

            node.stage = findStage( node.kineticObj );
        }

    } 


    function drawMove( nodeID, eventData, nodeData, touch ) {

        var node = viewDriver.state.nodes[ nodeID ];

        //if ( !isValid( node.drawing_clients ) || 
        //     !isValid( node.drawing_clients[ node.client ] ) ) {
        //    node.clientJoin( node.client );
        //} 
        if ( drawing_private === undefined ) {
            setUpPrivate( );
        }

        var userState = drawing_client;
        if ( userState.drawing_mode === 'none' ) {
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
        var debugOn = true;

        if ( debugOn ) {
            console.info( ' ' );
            console.info( ' === Nodes listening and visibility states ===' );
            for(var key in viewDriver.state.nodes) {
                var kNode = viewDriver.state.nodes[ key ];
                var listening = ( kNode.kineticObj.listening instanceof Function ? kNode.kineticObj.listening() : undefined );
                var visible = ( kNode.kineticObj.visible instanceof Function ? kNode.kineticObj.visible() : undefined );
                console.info( '     Node: ' + kNode.kineticObj.id() + ', listening: ' + listening + ', visibility: ' + visible );
            }
            console.info( ' === End ===' );
            console.info( ' ' );
        }

        if ( drawing_private !== undefined && 
             drawing_private.drawingObject ) {
            var drawingObject = drawing_private.drawingObject;
            drawUpdate( drawingObject.ID, eventData, nodeData, true );
            
            //node.drawingObjectCreated( drawingObject.id );
            viewDriver.kernel.fireEvent( appID, 'drawingObjectCreated', [ drawingObject.id() ] );

            var userState = drawing_client;
            drawingObject.setZIndex( userState.zIndex );

            switch( userState.drawing_mode ) {
                
                case "text":
                    drawingObject.border.visible( false );
                    viewDriver.kernel.fireEvent( appID, 'textCreated', [ drawingObject.content.id() ] );
                    break;

                case "sprite":
                case "image":
                    //drawingObject.border.visible( false );
                    drawingObject.stroke( null );
                    viewDriver.kernel.fireEvent( appID, 'imageCreated', [ drawingObject.id() ] );
                    drawAndPropagate = true;
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
                            var colorRGB = Kinetic.Util.getRGB( userState.drawing_color );
                            var alpha = ( userState.fillStyle === 'transparentFill' ? 0.5 : 1.0 );
                            drawingObject.fillRed( colorRGB.r );
                            drawingObject.fillGreen( colorRGB.g );
                            drawingObject.fillBlue( colorRGB.b );
                            drawingObject.fillAlpha( alpha );
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
                propagateNodeToModel();
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

                    if ( drawingObject.points() === undefined ) {
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
                    points.push( posX );
                    points.push( posY );
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
                    /*
                    drawingObject.border.stroke( userState.drawing_color );
                    drawingObject.border.strokeWidth( 2 );
                    drawingObject.border.points( [ 0, 0, width, 0, width, height, 0, height, 0, 0 ] );
                    drawingObject.border.lineCap( userState.lineCap );
                    drawingObject.border.lineJoin( userState.lineJoin );
                    drawingObject.border.dash( [ 2, 5 ] );
                    drawingObject.content.width( width );
                    drawingObject.content.height( height );
                    */
                    drawingObject.x( pos[ 0 ] );
                    drawingObject.y( pos[ 1 ] ); 
                    drawingObject.stroke( userState.drawing_color );
                    drawingObject.strokeWidth( 2 );
                    //drawingObject.points( [ 0, 0, width, 0, width, height, 0, height, 0, 0 ] );
                    drawingObject.lineCap( userState.lineCap );
                    drawingObject.lineJoin( userState.lineJoin );
                    drawingObject.dash( [ 2, 5 ] );
                    drawingObject.width( width );
                    drawingObject.height( height );
                    clearBeforeDraw = true;
                    break;

                case "text":
                    drawingObject.border.stroke( userState.drawing_color );
                    drawingObject.border.strokeWidth( 2 );
                    drawingObject.border.width( width );
                    drawingObject.border.height( height );
                    drawingObject.border.lineCap( userState.lineCap );
                    drawingObject.border.lineJoin( userState.lineJoin );
                    drawingObject.border.dash( [ 2, 5 ] );
                    drawingObject.border.fill( null );
                    drawingObject.content.fontSize( userState.fontSize ? userState.fontSize : 16 );
                    drawingObject.content.fontStyle( 'bold' );
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
                //privateState.previousPoint = eventPoint;
                // Update the view to keep pace with user input
                //console.info( drawingObject.id + " updated, sending update event." );
                //node.privateDrawingUpdated( drawingObject.id );
                if ( drawingObject && activelyDrawing ) {
                    //console.info( "VIEW: draw object " );
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

    function setClientUIState( stateObj ) {

        //console.info( "setClientUIState " + JSON.stringify( stateObj ) );
        if ( stateObj !== undefined ) {
            //if ( !isValid( drawing_client ) ) {
            //    clientJoin( this.client );
            //} 
            //var clients = drawing_client;
            var userState = drawing_client;
            for ( var property in stateObj ) {
                userState[ property ] = stateObj[ property ];       
            }
            //drawing_client = clients;
        }
    };

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

        var extendsID = objDef[ "extends" ];
        //var protos = getPrototypes( viewDriver.kernel, extendsID );

        console.info( "createLocalKineticNode" );

        var node = viewDriver.state.createLocalNode( parentID, drawingID, extendsID, implementsID, source, type, drawing_index, name );
        node.prototypes = [];
        node.prototypes.push( extendsID );

        var kineticObj = createKineticObject( node, objDef.properties );
        node.kineticObj = kineticObj;

        addNodeToHierarchy( node );

        return node;
    }

    function createKineticObject( node, config ) {
        var protos = node.prototypes;
        var kineticObj = undefined;

        if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/arc.vwf" ) ) {
            kineticObj = new Kinetic.Arc( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/baseLayer.vwf" ) ) {
            kineticObj = new Kinetic.BaseLayer( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/canvas.vwf" ) ) {
            kineticObj = new Kinetic.Canvas( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/circle.vwf" ) ) {
            kineticObj = new Kinetic.Circle( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/ellipse.vwf" ) ) {
            kineticObj = new Kinetic.Ellipse( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/fastLayer.vwf" ) ) {
            kineticObj = new Kinetic.FastLayer( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/group.vwf" ) ) {
            kineticObj = new Kinetic.Group( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/drawingGroup.vwf" ) ) {
            kineticObj = new Kinetic.Group( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/image.vwf" ) ) {
            var imageObj = new Image();
            node.scaleOnLoad = false;
            kineticObj = new Kinetic.Image( {
                image: imageObj
            } );
            if ( node.source !== undefined ) {
                imageObj.src = node.source;    
            }
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/layer.vwf" ) ) {
            kineticObj = new Kinetic.Layer( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/line.vwf" ) ) {
            kineticObj = new Kinetic.Line( config || { "points": [] } );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/path.vwf" ) ) {
            kineticObj = new Kinetic.Path( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/rect.vwf" ) ) {
            kineticObj = new Kinetic.Rect( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/regularPolygon.vwf" ) ) {
            kineticObj = new Kinetic.RegularPolygon( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/ring.vwf" ) ) {
            kineticObj = new Kinetic.Ring( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/sprite.vwf" ) ) {
            var imageObj = new Image();
            node.scaleOnLoad = false;
            kineticObj = new Kinetic.Sprite( {
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
            kineticObj = new Kinetic.Stage( stageDef );
            viewDriver.state.stages[ node.ID ] = kineticObj;
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/star.vwf" ) ) {
            kineticObj = new Kinetic.Star( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/text.vwf" ) ) {
            kineticObj = new Kinetic.Text( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/textPath.vwf" ) ) {
            kineticObj = new Kinetic.TextPath( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/wedge.vwf" ) ) {
            kineticObj = new Kinetic.Wedge( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/shape.vwf" ) ) {
            kineticObj = new Kinetic.Shape( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/container.vwf" ) ) {
            kineticObj = new Kinetic.Container( config || {} );
        } else if ( viewDriver.state.isKineticClass( protos, "http://vwf.example.com/kinetic/node.vwf" ) ) {
            kineticObj = new Kinetic.Node( config || {} );
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

    function findStage( kineticObj ) {

        var stage = undefined;
        var parent = kineticObj;
        while ( parent !== undefined && stage === undefined ) {
            if ( parent.nodeType === "Stage" ) {
                stage = parent;
            }
            parent = parent.parent;
        }
        return stage;
        
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

    function propagateNodeToModel() {

        // Send data about this node so the global node can be created and propagated
        //viewDriver.kernel.callMethod( private_node.parentID, "propagateKineticNode", [ appID, private_node ] );
        var appID = viewDriver.kernel.kernel.application();

        viewDriver.kernel.kernel.callMethod( appID, "propagateKineticNode", [ private_node ] );

        viewDriver.kernel.kernel.createNode( private_node.extendsID, undefined, private_node.ID, null );


        // Delete the private node - we no longer need it
        // Remove the kinetic object from the tree and destroy the object
        var nodeID = drawing_private.drawingObject.id();
        drawing_private.drawingObject.destroy();
        drawing_private.drawingObject = null;
        drawing_private = {};
        private_node = undefined;
        if ( viewDriver.state.nodes[ nodeID ] ) {
            delete viewDriver.state.nodes[ nodeID ];
        }

    }

    function drawObject( kineticObject, clearBefore ) {

        if ( clearBefore ) {
            // Draw the full layer
            var layer = findLayer( kineticObject );
            if ( layer ) { 
                layer.draw();
            } else {
                // Should never happen - object should always be a descendent of a layer
                kineticObject.draw();
            }
        } else {
            kineticObject.draw();
        }
    }

    function setKineticProperty( kineticObj, propertyName, propertyValue ) {

        var userState = drawing_client;

        switch ( propertyName ) {

            case "text":
                kineticObj.content.text( propertyValue );
                //kineticObj.content.stroke( userState.drawing_color );
                kineticObj.content.fill( userState.drawing_color );
                drawObject( kineticObj, true );
                propagateNodeToModel();
                 break;

            case "image":
                kineticObj.image( propertyValue );
                break;

            default:
                break;

        }

    }



});