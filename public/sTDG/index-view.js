var stage;
var startCanvasWidth;
var canvasWidth;
var canvasHeight;
var canvasScale = 1.00;
var eraserWidth = 20;
var horizontalPosition = 0;
var verticalPosition = 0;
var mapIncrement = 200;
var ios = navigator.userAgent.match(/(iPhone)|(iPod)|(iPad)/); // is iOS
var inputMode;
var appID = vwf_view.kernel.application();
var mapURL;
var viewInitialized = false;
var linesSynchronized = false;
var erasersSynchronized = false;
var lineColor = "#000000";
var selectedPenColor;
var penColor;
var lineWidth = 5;
var currentUserAction;
var userActionIndex;
var lastSaveIndex;

var unitIcons = {};
var unitWidth = 32;
var unitsAvailable = {};
var unitTypesAdded = {};
var unitIndex = 1;
var activeUnit = undefined;
var battleDim = "ground";
var defaultUnitType = "UNT.CBT.INF";
var activeUnitId = defaultUnitType;
var pendingUnitType = defaultUnitType;
var unitsInitialized = false;
var unitAffiliation = "unknown";
var _unitSymbolsPending = {};

var kineticComponents = {};
var currentLayer = undefined;

console.info( "==================================================" );
var appRoot = vwf_view.kernel.find( "", "/" )[0];
vwf_view.kernel.callMethod( appRoot, "createClient", [ vwf_view.kernel.moniker() ] );
console.info( "==================================================" );

vwf_view.ticked = function() {
    if ( !viewInitialized && vwf_view.kernel.application( true ) ) {
        viewInitialized = true;

        // // Retrieve the canvas drawing that was done before this client joined
        // var canvasLinesID = vwf_view.kernel.find( undefined, "/canvasLines" )[ 0 ];
        // vwf_view.kernel.getProperty( canvasLinesID, "lineSegments" );

        // // Retrieve the canvas map that was loaded before this client joined
        // var canvasMapID = vwf_view.kernel.find( undefined, "/canvasMap" )[ 0 ];
        // vwf_view.kernel.getProperty( canvasMapID, "mapImageURL" );

        // // Move canvas map to be centered on device (so dot and uav show up by default without scrolling)
        // // Take half the difference between the canvas size and the document size and negate
        // horizontalPosition = ( canvasWidth - $( document ).width() ) / -2;
        // verticalPosition = ( canvasHeight - $( document ).height() ) / -2;
        // // Move container appropriately and update scroll arrow visibility
        // $('#container').css("left", horizontalPosition);
        // $('#container').css("top", verticalPosition);
        //checkArrowVisibility(horizontalPosition, verticalPosition);
        
        // Print out the dimensions of the image
        //alert("Image height: " + canvas.height() + ", width: " + canvas.width());
        //alert("Image natural height: " + canvas.naturalHeight() + ", natural width: " + canvas.naturalWidth());
        //alert("Image jquery height: " + canvasHeight + ", jquery width: " + canvasWidth);
    }

    // Initialize the unit symbols with a default set
    if ( !unitsInitialized) {
        filterUnitTypes( 'ground', defaultUnitType );
    }
}

vwf_view.createdNode = function( nodeID, childID, childPrototypeID, childBehaviorIDs, 
    childSource, childType, childIndex, childName ) {
    
    if ( childPrototypeID === "unitGroup.vwf" ) {

        unitIcons[ childID ] = {
            "ID": childID,
            "name": childName,
            "parentID": nodeID   
        };
        
        if (!unitsInitialized) {
            _unitSymbolsPending[ childID ] = {
                "location": undefined,
                "imageSrc": undefined
            };
        }
    
    } else {
        
        var prototypes = getPrototypes( vwf_view.kernel, childPrototypeID );
        var kineticClass = isKineticComponent( prototypes );
        
        if ( kineticClass !== undefined ) {
              
            var createLocalNode = function() {
                
                var node = kineticComponents[ childID ] = {
                    "ID": childID,
                    "parentID": nodeID,
                    "name": childName,
                    "type": kineticClass
                }
                return node;
            }
            
            var kineticNode;
            switch ( kineticClass ) {
                
                case "group":
                    kineticNode = createLocalNode();
                    if ( childPrototypeID === "tdgLayer.vwf" ) {
                        currentLayer = childName;
                        addLayerDropDown( kineticNode );
                    }
                    break;

                default:
                    kineticNode = createLocalNode();
                    break;
            }

        }

    }
}

vwf_view.initializedNode = function( nodeID, childID ) {
    if ( childID === vwf_view.kernel.application() ) {
        stage = findKinenticView().state.stage;

        canvasWidth = stage.width();
        canvasHeight = stage.height();
        startCanvasWidth = canvasWidth;

        stage.on( 'contentMousedown', ev_mousedown );
        stage.on( 'contentMouseup', ev_mouseup );
        stage.on( 'contentMousemove', ev_mousemove );
        stage.on( 'contentClick', ev_click );
    }
}

vwf_view.deletedNode = function( nodeID ) {

    if ( unitIcons[ nodeID ] ) {
        delete unitIcons[ nodeID ];
    }
    if ( kineticComponents[ nodeID ] ) {
        delete kineticComponents[ nodeID ];
    }
}

vwf_view.gotProperty = function( nodeID, propertyName, propertyValue ) {
    var clientThatGotProperty = vwf_view.kernel.client();
    var me = vwf_view.kernel.moniker();
    switch ( propertyName ) {
        case "location":
            if ( clientThatGotProperty == me ) {
                updateUnitLocation( nodeID, propertyValue );
            }
            break;
        case "lineSegments":
            if(!linesSynchronized) {
                linesSynchronized= true;
                var lineSegments = propertyValue;
                for ( var i = 0; i < lineSegments.length; i++ ) {
                    draw( lineSegments[ i ] );
                }
            }
            break;
        case "lineColor":
            lineColor = propertyValue;
            break;
        case "inputMode":
            inputMode = propertyValue;
            highlightMode( inputMode );
            break;
    }
}

var nearEnemy = false;

vwf_view.createdProperty = function( nodeID, propertyName, propertyValue ) {
    this.satProperty( nodeID, propertyName, propertyValue );
}

vwf_view.initializedProperty = function( nodeID, propertyName, propertyValue ) {
    this.satProperty( nodeID, propertyName, propertyValue );
}
      
vwf_view.satProperty = function( nodeID, propertyName, propertyValue ) {
    var unit = unitIcons[ nodeID ];
    
    if ( !validPropertyValue( propertyValue ) ) {
        return;
    }

    switch ( propertyName ) {
        
        case "location":
            if (unit) {
                if ( unitsInitialized ) {
                    updateUnitLocation( nodeID, propertyValue );
                }
                else {
                    _unitSymbolsPending[ nodeID ].location = propertyValue;
                }
            }   
            break;

        // We shouldn't need this anymore because kinetic will now update the image for us
        // case "image":
        //    if (unit)
        //    {
        //         if (unit.imageElement === undefined)
        //         {
        //             if ( unitsInitialized ) {
        //                 // Create the unit icon so it appears on the screen
        //                 createUnitIcon ( nodeID, propertyValue );
        //             }
        //             else {
        //                 // Put the image in the pending list to be updated once initialization is complete
        //                 _unitSymbolsPending[ nodeID ].imageSrc = propertyValue;
        //             }
        //         }
        //         else
        //         {
        //             $( unit.imageElement ).attr( 'src', propertyValue );
        //         }
        //     }
        //     break;

        case "fullName":
            // console.info("Fullname: " + propertyValue );
            if ( unit ) {
                $( unit.imageElement ).attr( 'name', propertyValue );
            }
            break;

        case "symbolID":
        /* Keep to try setting MIL-STD 2525C symbol identifiers with modifiers
            var iconImage;
            if ( unit && ( unit.imageElement === undefined ) ) {
                console.info( " unit symbol: " + propertyValue );
                
                if ( armyc2.c2sd.renderer.utilities.RendererUtilities.fontsLoaded() ) {
                    vwf_view.kernel.callMethod( vwf_view.kernel.application(), "getUnitImage", [ propertyValue ] ); 
                }            
            }
         */
            break;
            
        case "description":
            if ( unit && unit.imageElement ) {
                 $( unit.imageElement ).attr( 'title', propertyValue );
            }
            // console.info( " description: " + propertyValue );
            break;

        case "tagName":
            if ( unit && unit.imageElement ) {
                $( unit.imageElement ).attr( 'title', propertyValue );
            }
            break;

        case "lineColor":
            lineColor = propertyValue;
            break;
        
        case "inputMode":
            inputMode = propertyValue;
            highlightMode( inputMode );
            break;
        
        // case "mapImageURL":
        //     if ( propertyValue !== mapURL ) {
        //         mapURL = propertyValue;
        //         loadMap( mapURL );
        //     }
        //     break;
        
        case "userActionIndex":
            userActionIndex = propertyValue;
            break;
        
        case "lastSaveIndex":
            lastSaveIndex = propertyValue;
            break;

        case "unitSize":
            unitWidth = Number( propertyValue );
            for ( var id in unitIcons ) {
                if ( unitIcons[ id ] && unitIcons[ id ].imageElement ) {
                    $( unitIcons[ id ].imageElement ).css( 'width', unitWidth );
                }
            }
            break;
    }
}

vwf_view.calledMethod = function ( nodeID, methodName, methodParameters, methodValue ) {
    switch ( methodName ) {
        
        case "startNewLine":
            draw( methodParameters );
            break;
        
        case "clearLines":
            //context.clearRect( 0, 0, canvas.width, canvas.height );
            break;
        
        case "clearUnits":
            if ( methodParameters && methodParameters.length > 0 ) {
                removeUnitsFromLayer( methodParameters[ 0 ] );
            } else {
                // for ( var id in kineticComponents[ "layer" ] ) {
                //     var layerNode = kineticComponents[ "layer" ][ id ];
                //     removeUnitsFromLayer( layerNode.name );                    
                // }
            }
            break;
        
    }
}

vwf_view.firedEvent = function ( nodeID, eventName, eventParameters ) {
    var unit = kineticComponents[ nodeID ];
    var appID = vwf_view.kernel.application();

    if ( unit ) {
        
        switch ( eventName ) {
            case "pointerClick":
                var parent = kineticComponents[ unit.parentID ];
                if ( parent && vwf_view.kernel.client() === vwf_view.kernel.moniker() ){
                    if ( inputMode === "delete_unit" ) {
                        vwf_view.kernel.callMethod( appID, "deleteUnit", [ parent.name, unit.name ] );
                    }
                }
                break;

        }

    } else if ( nodeID === appID ) {
        switch ( eventName ) {
            case "insertableUnitAdded":
                var clientThatFiredEvent = this.kernel.client();
                var me = this.kernel.moniker();
                if ( clientThatFiredEvent === me ) {
                    addUnitToMenu( eventParameters[ 0 ] );
                }
                break;

            case "unitLoadingComplete":
                if ( unitTypesAdded[ pendingUnitId ].length > 0 )
                {
                    activeUnitId = pendingUnitId;
                    setActiveUnitType( activeUnitId );
                }
                else
                {
                    alert("No units available for filter: " + pendingUnitId);
                }
                break;
        }        
    }
}



function updateUnitLocation( nodeID, location ) {
    // var unit = unitIcons[ nodeID ];
    // if ( unit && unit.imageElement ) {
    //     $( unit.imageElement ).css( 'left', location[ 0 ] * canvasWidth - ( unitWidth * 0.5 ) );
    //     $( unit.imageElement ).css( 'top', location[ 1 ] * canvasHeight - ( unitWidth * 0.5 ) );
    // }
} 

// Implement drawing
//var context = canvas.getContext( "2d" );
var mousedown;
var isFirstMoveAfterMousedown;
var touchdown;
var startX;
var startY;

( function init () {


    // canvas.addEventListener( 'mousemove', ev_mousemove, false );
    // canvas.addEventListener( 'mousedown', ev_mousedown, false );
    // canvas.addEventListener( 'mouseup', ev_mouseup, false );
    // $( canvas ).hammer( { drag_lock_to_axis: false } ).on( "dragstart", onDragStart );
    // $( canvas ).hammer( { drag_lock_to_axis: false } ).on( "drag", onDraggy );
    // $( canvas ).hammer( { drag_lock_to_axis: false } ).on( "dragend", onDragEnd );
    // $( canvas ).hammer( { drag_lock_to_axis: false } ).on( "pinchin", onPinchIn );
    // $( canvas ).hammer( { drag_lock_to_axis: false } ).on( "pinchout", onPinchOut );

    selectedPenColor = "black";
    setMode( "draw" );
    $( '.selected-color i' ).css( 'background-color', "#000000" );
    setPenColor( "#000000" );
    //highlightColor( selectedPenColor );
    //context.lineWidth = lineWidth;

    // Disable the Save (for regular save dialog) button until the user enters a valid filename
    $( '#saveScenario' ).prop( 'disabled', true );
    $( '#saveScenarioName' ).on( 'input', function() {
        if ( $( this ).val() === '' ) {
            $( '#saveScenario' ).prop( 'disabled', true );
        } else {
            $( '#saveScenario' ).prop( 'disabled', false );
        }
    } );

    // Prepare "save before load" dialog with proper onclick functions
    $( "#SaveOnMapLoadDialog .close" ).click( function() {
        $( "#SaveOnMapLoadDialog" ).dialog('close');
    } );
    $( "#SaveOnMapLoadDialog #saveBeforeLoad" ).click( function() {
        var scenarioFilename = $( '#SaveOnMapLoadDialog #scenarioName' ).val();
        if ( scenarioFilename ) {
            saveStateAsFile( scenarioFilename );
        }
        $( "#SaveOnMapLoadDialog" ).dialog('close');
        setMap( $( '#mapSelection' ).val() );
    } );
    $( "#SaveOnMapLoadDialog #noThanks" ).click( function() {
        $( "#SaveOnMapLoadDialog" ).dialog('close');
        setMap( $( '#mapSelection' ).val() );
    } );
    $( "#SaveOnMapLoadDialog #cancelSaveAndLoad" ).click( function() {
        $( "#SaveOnMapLoadDialog" ).dialog('close');
    } );

    // Disable the Save (for "save before load" dialog) button until the user enters a valid 
    // filename
    $( '#saveBeforeLoad' ).prop( 'disabled', true );
    $( '#scenarioName' ).on( 'input', function() {
        if ( $( this ).val() === '') {
            $( '#saveBeforeLoad' ).prop( 'disabled', true );
        } else {
            $( '#saveBeforeLoad' ).prop( 'disabled', false );
        }
    } );
    
} )();

// function onDragStart( ev ) {
//     if ( !mousedown ) {
//         touchdown = true;
//         // ios devices seem to need a different calculation for determining where to draw after
//         // the implementation of starting the map in the center (setting left and top css properties)
//         // lines ~70. Still being investigated as to why
//         if ( ios ) {
//             startX = ( ev.gesture.center.pageX - parseInt( $( '#container' ).css( 'left' ) ) ) / canvasScale;
//             startY = ( ev.gesture.center.pageY - parseInt( $( '#container' ).css( 'top' ) ) ) / canvasScale;
//         } else {
//             startX = ( ev.gesture.center.pageX / canvasScale ) - parseInt( $( '#container' ).css( 'left' ) );
//             startY = ( ev.gesture.center.pageY / canvasScale ) - parseInt( $( '#container' ).css( 'top' ) );
//         }
//     }
// }

// function onDraggy( ev ) {
//     if ( touchdown && !mousedown )
//     {
//         switch( inputMode)
//         {
//         case "draw":
//         case "erase":
//             var x, y;
//             var canvasLinesID = vwf_view.kernel.find( undefined, "/canvasLines" )[ 0 ];
        
//             // ios devices seem to need a different calculation for determining where to draw after
//             // the implementation of starting the map in the center (setting left and top css properties)
//             // lines ~70. Still being investigated as to why
//             if ( ios ) {
//                 x = ( ev.gesture.center.pageX - parseInt( $('#container').css('left') ) ) / canvasScale;
//                 y = ( ev.gesture.center.pageY - parseInt( $('#container').css('top') ) ) / canvasScale;
//             }
//             else {
//                 x = ( ev.gesture.center.pageX / canvasScale ) - parseInt( $('#container').css('left') );
//                 y = ( ev.gesture.center.pageY / canvasScale ) - parseInt( $('#container').css('top') );
//             }

//             var pointWidth;
//             switch (inputMode)
//             {
//             case "draw":
//                 pointWidth = lineWidth;
//                 break;
//             case "erase":
//                 pointWidth = eraserWidth;
//                 break;          
//             }
        
//             vwf_view.kernel.callMethod( canvasLinesID, "startNewLine", [ [ startX, startY ], [ x, y ], inputMode, pointWidth, penColor ] );

//             startX = x;
//             startY = y;

//             currentUserAction = inputMode;

//             break;
//         case "move":
//             if ( ios ) {
//                 x = ( ev.gesture.center.pageX - parseInt( $('#container').css('left') ) ) / canvasScale;
//                 y = ( ev.gesture.center.pageY - parseInt( $('#container').css('top') ) ) / canvasScale;
//             }
//             else {
//                 x = ( ev.gesture.center.pageX / canvasScale ) - parseInt( $('#container').css('left') );
//                 y = ( ev.gesture.center.pageY / canvasScale ) - parseInt( $('#container').css('top') );
//             }
            
//             moveMap( startX, startY, x, y );

//             startX = x;
//             startY = y;
            
//             break;
//         }
//     }
// }

// function onDragEnd( ev ) {
//     touchdown = false;
//     if ( currentUserAction ) {
//         vwf_view.kernel.callMethod( vwf_view.kernel.application(), "recordUserAction", 
//             [ currentUserAction ] );
//         currentUserAction = null;
//     }
// }

function ev_mousedown( event ) {
    mousedown = true;
    isFirstMoveAfterMousedown = true;
    var ev = event.evt;
    var canvas = stage.children[ 0 ].canvas._canvas;
    startX = ( ev.layerX - canvas.offsetLeft ) / canvasScale;
    startY = ( ev.layerY - canvas.offsetTop ) / canvasScale; 

}

function ev_mouseup( event ) {
    mousedown = false;

    var ev = event.evt;
    var appID = vwf_view.kernel.application();

    if ( ev.button === 0 ) {
        var canvas = stage.children[ 0 ].canvas._canvas;
        switch( inputMode ) {
            default:
                if ( currentUserAction ) {
                    vwf_view.kernel.callMethod( appID, "recordUserAction", [ currentUserAction ] );
                    currentUserAction = null;
                } 
                break;   
        } 
    } else if ( ev.button === 1 ) {

    }
}

function ev_mousemove ( event ) {
    if ( mousedown ) {
        var ev = event.evt;
        var canvas = stage.children[ 0 ].canvas._canvas;
        switch ( inputMode ) {
            
            case "draw":
            case "erase":
                var x = ( ev.layerX - canvas.offsetLeft ) / canvasScale;
                var y = ( ev.layerY - canvas.offsetTop ) / canvasScale;
                var canvasLinesID = vwf_view.kernel.find( undefined, "/instructor/baseLayer/lines" )[ 0 ];

                var pointWidth;
                switch (inputMode)
                {
                    case "draw":
                        pointWidth = lineWidth;
                        break;
                    case "erase":
                        pointWidth = eraserWidth;
                        break;          
                }
        
                if ( isFirstMoveAfterMousedown ) {
                    vwf_view.kernel.callMethod( canvasLinesID, "startNewLine", [ [ startX, startY ], [ x, y ], inputMode, pointWidth, penColor ] );
                } else {
                    vwf_view.kernel.callMethod( canvasLinesID, "continueLine", [ [ x, y ] ] );
                }
                startX = x;
                startY = y;

                currentUserAction = inputMode;

                break;

            case "move":
                var x = ( ev.layerX - canvas.offsetLeft ) / canvasScale;
                var y = ( ev.layerY - canvas.offsetTop ) / canvasScale;
                
                moveMap( startX, startY, x, y );
                
                startX = x;
                startY = y;

                break;
        }
        isFirstMoveAfterMousedown = false;
    }
}

function ev_click( event ) {
    var ev = event.evt;
    var appID = vwf_view.kernel.application();

    if ( ev.button === 0 ) {
        var canvas = stage.children[ 0 ].canvas._canvas;
        switch( inputMode ) {    
            case "add_unit":
                if ( activeUnit !== undefined ) {
                    var x = ( ev.layerX - canvas.offsetLeft ) / canvasScale / canvasWidth;
                    var y = ( ev.layerY - canvas.offsetTop ) / canvasScale / canvasHeight; 
                    var name = activeUnit.tag + unitIndex;
                    unitIndex++;
                    vwf_view.kernel.callMethod( appID, "createUnit", [ currentLayer, name, activeUnit, [ x, y ], unitAffiliation ] );    
                }
                break;

        }
    }
}

// depricated, but leaving until the full transition
// to KineticJS is complete
// function createUnitIcon( unitId, imgSrc ) {

//     var img = unitIcons[ unitId ].imageElement = $( "<div id='"+unitId+"' class='unit'><img src='"+imgSrc+"'/></div>" );

//     $( "#container" ).append( img );

//     $( img ).css( 'width', unitWidth );
        
//     // Add event handlers for selecting the unit
//     img.on( "click", unitClick );
        
//     // Add event handlers for drag and drop
//     img.on( "dragstart", unitDragStart );
//     img.on( "touchmove", function( ev ) { 
//             ev.preventDefault();
//     } );
//     img.hammer( { drag_lock_to_axis: false } ).on( "dragstart", touchDragStart );
//     img.hammer( { drag_lock_to_axis: false } ).on( "drag", touchDrag );
//     img.hammer( { drag_lock_to_axis: false } ).on( "dragend", touchDragEnd );
// }

function draw( endpoints ) {
    // Set the line segments
    var startX = endpoints[ 0 ][ 0 ];
    var startY = endpoints[ 0 ][ 1 ];
    var endX = endpoints[ 1 ][ 0 ];
    var endY = endpoints[ 1 ][ 1 ];
    var mode = endpoints[ 2 ];
    var penSize = endpoints[ 3 ];
    var color = endpoints[ 4 ];
    
    switch ( mode ) {

        case "draw":
   //          // Set the color
   //       context.strokeStyle = color;
		 // context.lineWidth = penSize;
		
   //       // Draw the line segment
   //       context.beginPath();
   //       context.moveTo( startX, startY );
   //       context.lineTo( endX, endY );
   //       context.stroke();
         break;

     case "erase":
         erase( startX, startY, penSize );
         break;
    }
}

function erase( erasePtX, erasePtY, eraserSize ) {
    // Define the eraser area
    var x0 = erasePtX - ( 0.5 * eraserSize );
    var y0 = erasePtY - ( 0.5 * eraserSize );
    var x1 = erasePtX + ( 0.5 * eraserSize );
    var y1 = erasePtY + ( 0.5 * eraserSize );
    
    if ( x0 < 0 ) {
         x0 = 0;
    }
    if ( y0 < 0 ) {
         y0 = 0;
    }
    // if ( x1 > canvasWidth ) {
    //      x1 = canvasWidth;
    // }
    // if ( y1 > canvasHeight ) {
    //      y1 = canvasHeight;
    // }
         
    // Erase the drawing within the eraser area   
    //context.clearRect( x0, y0, eraserSize, eraserSize );
}

// Event handlers for dragging units (w/ mouse)
//$( ".unit" ).on( "click", unitClick );
$( ".unit" ).on( "dragstart", unitDragStart );
$( "#container" ).on( "dragover", unitDragOver );
$( "#container" ).on( "drop", unitDrop );

var draggedUnit = undefined;
$.event.props.push("dataTransfer");


function unitDragStart( ev ) {
    
    // If the event has a "gesture" object on it, it originated from a touch event and will be
    // handled by touchDragStart, so we should ignore it here
    // TODO: Create one event handler for the "dragstart" event which reacts appropriately 
    //       whether the event originates from a mouse movement or a touch movement
    if ( ev.gesture ) {
        return;
    }

    var itemDownOn = $( this )[ 0 ];
    if ( unitIcons && unitIcons[ itemDownOn.id ] ) {
        draggedUnit = itemDownOn;
                
        var left = parseFloat( draggedUnit.style.left );
        var top = parseFloat( draggedUnit.style.top );
        var mouseDownLocation = [ originalX( ev ), originalY( ev ) ];
        ev.dataTransfer.setData( "text/plain", mouseDownLocation[ 0 ] + "," + mouseDownLocation[ 1 ] );
    }  
}

function unitDragOver( ev ) {
    ev.preventDefault();
    return false;
}

var count = 0;

function originalX( ev ) {
    return ev.originalEvent.clientX / canvasScale;
}
function originalY( ev ) {
    return ev.originalEvent.clientY / canvasScale;
}

function unitDrop( ev ) {

    // if ( !draggedUnit ) {
    //     self.logger.errorx( "unitDrop", "draggedUnit is not valid: '", draggedUnit ,"'" );
    //     return;
    // }

    // // Update the unit's location in the model
    // var mouseDownLocation = ev.dataTransfer.getData( "text/plain" ).split( "," );
    // var offset = [ ( originalX( ev ) - mouseDownLocation[ 0 ] ) / canvasWidth, 
    //                ( originalY( ev ) - mouseDownLocation[ 1 ] ) / canvasHeight ];
    // vwf_view.kernel.callMethod( draggedUnit.id, "addLocationOffset", [ offset ] );

    // // Record the unit movement in the user action stack
    // vwf_view.kernel.callMethod( vwf_view.kernel.application(), "recordUserAction", 
    //     [ "moveUnit" ] );

    // // Reset the dragged unit since this drag is done
    // draggedUnit = undefined;

    // ev.preventDefault();
    // return false;
}

// Event handlers for dragging units (w/ touch)
$( ".unit" ).hammer( { drag_lock_to_axis: false } ).on( "dragstart", touchDragStart );
$( ".unit" ).hammer( { drag_lock_to_axis: false } ).on( "drag", touchDrag );
$( ".unit" ).hammer( { drag_lock_to_axis: false } ).on( "dragend", touchDragEnd );
$( ".unit" ).on( "touchmove", function( ev ) { 
    ev.preventDefault();
} );


var touchOffset = undefined;
function touchDragStart(ev) {
    if ( ev.gesture && ev.gesture.pointerType == "touch" ) {
        if( !draggedUnit ) {
            var draggedObject = $( this );
            if ( draggedObject.hasClass( "unit" ) ) {
                draggedUnit = draggedObject;
                var dotPosition = [draggedUnit.position().left, draggedUnit.position().top];
                var touchPosition = [ev.gesture.center.pageX, ev.gesture.center.pageY];
                touchOffset = [ (dotPosition[0]-touchPosition[0]/canvasScale), (dotPosition[1]-touchPosition[1]/canvasScale) ];
                currentUserAction = "moveUnit";
            }
        }
    }
}

function touchDrag(ev) {
    if ( ev.gesture && ev.gesture.pointerType == "touch" ) {
        if ( draggedUnit ) {

            if ( touchOffset == undefined ) {
                var dotPosition = [ draggedUnit.position().left, draggedUnit.position().top ];
                var touchPosition = [ ev.gesture.center.pageX, ev.gesture.center.pageY ];
                var x = ( dotPosition[ 0 ] - touchPosition[ 0 ] / canvasScale );
                var y = ( dotPosition[ 1 ] - touchPosition[ 1 ] / canvasScale )
                touchOffset = [ x, y ];
            }
            
            var left = ( ev.gesture.center.pageX / canvasScale + touchOffset[ 0 ] ) / ( canvasWidth );
            var top = ( ev.gesture.center.pageY / canvasScale + touchOffset[ 1 ] ) / ( canvasHeight );
            setDraggedUnitLocation( left, top );
        }
    }
}

function touchDragEnd(ev) {
    touchDrag(ev);
    if ( ev.gesture && ev.gesture.pointerType == "touch" ) {
        draggedUnit = undefined;
    }
    if ( currentUserAction ) {
        vwf_view.kernel.callMethod( vwf_view.kernel.application(), "recordUserAction", 
            [ currentUserAction ] );
        currentUserAction = null;
    }

    //switch ( inputMode ) {
    //    case "":
    //        break;
    //}
}

function setDraggedUnitLocation( left, top ) {

    // console.info( "draggedUnit = " + draggedUnit );
    vwf_view.kernel.setProperty( draggedUnit.id, "location", [ left, top ] );

}

// Disable touch move event to disable elastic scrolling on mobile devices
// $(canvas).on("touchmove", function(ev) {
//     ev.preventDefault();
// });
/*
$("#right-arrow").on("touchmove", function(ev) { 
    ev.preventDefault();
});
$("#left-arrow").on("touchmove", function(ev) { 
    ev.preventDefault();
});
$("#down-arrow").on("touchmove", function(ev) { 
    ev.preventDefault();
});
$("#up-arrow").on("touchmove", function(ev) { 
    ev.preventDefault();
});
*/
// Disable mousewheel scroll
if(window.addEventListener){
    window.addEventListener('DOMMouseScroll',wheel,false);
}

function wheel(event)
{
        event.preventDefault();
        event.returnValue=false;
}
window.onmousewheel=document.onmousewheel=wheel;
$('body').css('overflow', 'hidden');

if ( ios ) {
    $('#scroll-arrows').css('height', '92%');
}

var minCanvasScale = 0.6;
var scaleDelta = 0.01;
// If small device, lower minimum canvas scale
if ( navigator.userAgent.match(/(iPhone)|(iPod)/) ) {
    minCanvasScale = 0.4;
    // Lower initial scale
    canvasScale = 0.75;
    onPinchOut();
} else if ( navigator.userAgent.match(/(Nexus)/) ) {
    // Increase how much a pinch scales the container on a Nexus
    scaleDelta = 0.05;
}

// Determine the difference between window size and image size to see how far we can move
// both horizontally and vertically
// var maxHorizontalMove = (-canvasWidth * canvasScale) + parseInt( window.innerWidth);
// var maxVerticalMove = (-canvasHeight * canvasScale) + parseInt( window.innerHeight);

function onPinchIn(ev) {
    // Zoom out
    // if ( canvasScale > minCanvasScale ) {
    //     canvasScale -= scaleDelta;
    //     $('#container').css('zoom', canvasScale);
    //     // Show correct movable arrows
    //     maxHorizontalMove = (-canvasWidth * canvasScale) + parseInt( window.innerWidth);
    //     maxVerticalMove = (-canvasHeight * canvasScale) + parseInt( window.innerHeight);
    //     var currentHorizontalPosition = parseInt( $('#container').css('left') );
    //     var currentVerticalPosition = parseInt( $('#container').css('top') );
    //     //checkArrowVisibility(currentHorizontalPosition, currentVerticalPosition);
    // }
}

function onPinchOut(ev) {
    // Zoom in
    // if ( canvasScale < 1.2 ) {
    //     canvasScale += scaleDelta;
    //     $('#container').css('zoom', canvasScale);
    //     // Show correct movable arrows
    //     maxHorizontalMove = (-canvasWidth * canvasScale) + parseInt( window.innerWidth);
    //     maxVerticalMove = (-canvasHeight * canvasScale) + parseInt( window.innerHeight);
    //     var currentHorizontalPosition = parseInt( $('#container').css('left') );
    //     var currentVerticalPosition = parseInt( $('#container').css('top') );
    //     //checkArrowVisibility(currentHorizontalPosition, currentVerticalPosition);
    // }
}

function moveMap( origX, origY, newX, newY ) {
    /* Solution from http://muaz-khan.blogspot.com/2012/02/draggingmoving-shapes-smoothly-using_12.html */
    
    /* Determine drag direction */
    // var positiveX = newX > origX;
    // var positiveY = newY > origY;

    // /* Determine drag distance and sign */
    // var dragValue;

    // /* Horizontal */
    // dragValue = positiveX ? (newX - origX) : (origX - newX);
    // if (positiveX) 
    //     horizontalPosition += dragValue;
    // else 
    //     horizontalPosition -= dragValue;
    
    // /* Vertical */
    // dragValue = positiveY ? (newY - origY) : (origY - newY);
    // if (positiveY) 
    //     verticalPosition += dragValue;
    // else 
    //     verticalPosition -= dragValue;
        
    // //horizontalPosition = horizontalPosition + pixelsLeft;
    // if ( horizontalPosition > maxHorizontalMove ) {
    //     horizontalPosition = maxHorizontalMove;
    // }
    // else if ( horizontalPosition < 0 ) {
    //     horizontalPosition = 0;
    // }
    
    // //verticalPosition = verticalPosition + pixelsTop;
    // if ( verticalPosition > maxVerticalMove ) {
    //     verticalPosition = maxVerticalMove;
    // }
    // else if ( verticalPosition < 0 ) {
    //     verticalPosition = 0;
    // }
    // //$('#container').animate({left: horizontalPosition});
    // //$('#container').animate({top: verticalPosition});

    // $('#container').css("left", horizontalPosition);
    // $('#container').css("top", verticalPosition);
} 

function moveCanvas( direction ) {
    // TODO: Add support for partial moves (ie if the difference is less than 200
    // but still has room to move, move to last pixel)
    switch ( direction ) {
        case 'right':
            horizontalPosition = horizontalPosition - mapIncrement;
            if ( horizontalPosition > maxHorizontalMove ) {
                $('#container').animate({left: horizontalPosition});
                checkArrowVisibility(horizontalPosition, undefined);
            }
            break;
        case 'left':            
            horizontalPosition = horizontalPosition + mapIncrement;
            if ( horizontalPosition < 0 ) {
                $('#container').animate({left: horizontalPosition});
                checkArrowVisibility(horizontalPosition, undefined);
            } 
            break;
        case 'down':
            verticalPosition = verticalPosition - mapIncrement;
            if ( verticalPosition > maxVerticalMove ) {
                $('#container').animate({top: verticalPosition});
                checkArrowVisibility(undefined, verticalPosition);
            }
            break;
        case 'up':
            verticalPosition = verticalPosition + mapIncrement;
            if ( verticalPosition < 0 ) {
                $('#container').animate({top: verticalPosition});
                checkArrowVisibility(undefined, verticalPosition);
            }
            break;
    }
} 
function checkArrowVisibility( currentHorizontalPosition, currentVerticalPosition) {
/*    if ( currentHorizontalPosition ) {
        // Max horizontal move is actually a negative number, 
        // as the right arrow shifts the canvas to the left.
        // Thus the new position would be greater than the max.
        if ( currentHorizontalPosition - mapIncrement > maxHorizontalMove ) {
            $('#right-arrow').css('visibility', 'visible');
        } else {
            $('#right-arrow').css('visibility', 'hidden');
        }

        if ( currentHorizontalPosition + mapIncrement < 0 ) {
            $('#left-arrow').css('visibility', 'visible');
        } else {
            $('#left-arrow').css('visibility', 'hidden');
        }
    }

    if ( currentVerticalPosition ) {
        // Same rationale. The down arrow shifts the canvas up.
        if ( currentVerticalPosition - mapIncrement > maxVerticalMove ) {
            $('#down-arrow').css('visibility', 'visible');
        } else {
            $('#down-arrow').css('visibility', 'hidden');
        }

        if ( currentVerticalPosition + mapIncrement < 0 ) {
            $('#up-arrow').css('visibility', 'visible');
        } else {
            $('#up-arrow').css('visibility', 'hidden');
        }
    } */
} 

function userClearLines() {
    clearOverlay();
    vwf_view.kernel.callMethod( vwf_view.kernel.application(), "recordUserAction", [ "clear" ] );
}

function clearOverlay() {
    vwf_view.kernel.callMethod( vwf_view.kernel.application(), "clearLines" );
}

function clearUnits() {
    vwf_view.kernel.callMethod( vwf_view.kernel.application(), "clearUnits" );
}

function clearUserActions() {
    vwf_view.kernel.callMethod( vwf_view.kernel.application(), "clearUserActions" );
}

function clearAll() {
    clearOverlay();
    clearUnits();
}
    
function setColor( color ) {
    highlightColor(color);
}

function highlightColor(color) {
    document.getElementById('black').style.border = "2px solid black";
    document.getElementById('white').style.border = "2px solid black";
    document.getElementById('gray').style.border = "2px solid black";
    document.getElementById('red').style.border = "2px solid black";
    document.getElementById('orange').style.border = "2px solid black";
    document.getElementById('yellow').style.border = "2px solid black";
    document.getElementById('green').style.border = "2px solid black";
    document.getElementById('blue').style.border = "2px solid black";
    document.getElementById('cyan').style.border = "2px solid black";
    document.getElementById('pink').style.border = "2px solid black";
    document.getElementById('violet').style.border = "2px solid black";
    document.getElementById(color).style.border = "3px solid orange";
    var vColor;
    switch( color ) {
        case "black":
            vColor = "#000000"; // [255, 0, 0];
            break;
        case "white":
            vColor = "#ffffff"; // [255, 255, 255];
            break;
        case "gray":
            vColor = "#808080"; // [128, 128, 128];
            break;
        case "red":
            vColor = "#ff0000"; // [255, 0, 0];
            break;
        case "orange":
            vColor = "#ff6a00"; // [255, 106, 0];
            break;
        case "yellow":
            vColor = "#ffff00"; // [255, 255, 0];
            break;
        case "green":
            vColor = "#00ff00"; // [0, 255, 0];
            break;
        case "blue":
                vColor = "#0000ff"; // [0, 0, 255];
            break;
        case "cyan":
                vColor = "#00ffff"; // [0, 255, 255];
            break;
        case "pink":
                vColor = "#ff00dc"; // [255, 0, 220];
            break;
        case "violet":
                vColor = "#b200ff"; // [178, 0, 255];
            break;
        default:
            vColor = "#000000"; // [0, 0, 0];
            break;
    }
    vwf_view.kernel.setProperty( appID, "lineColor", vColor);
    penColor = vColor;
}

function setPenColor(vColor) {
    vwf_view.kernel.setProperty( appID, "lineColor", vColor);
    penColor = vColor;
}

function setPenWidth(penWidth) {
    lineWidth = penWidth;
}

function setEraserWidth(eraserSize) {
    eraserWidth = eraserSize;
}

function setMode(mode) {
    inputMode = mode;
    highlightMode(mode);
}

function highlightMode(mode) {
    // Pop all the other buttons back out
    var modes = ["move", "draw", "add_unit", "delete_unit", "erase", "create_layer","new_scenario", "save_scenario", "open_scenario"];

    modes.forEach ( function(thisMode) {
                        var buttonRef = "#" + thisMode;
                        if ($(buttonRef).hasClass('active')) {
                            $(buttonRef).removeClass('active');
                        }
                    });
    
    // Show the active button as depressed
    var activeElement = "#" + mode;
    $(activeElement).addClass('active');
}
   
// Get the initial values for inputMode and selectedColor (the logic for changing the view is in gotProperty)
vwf_view.kernel.getProperty( appID, "lineColor" );

/* Start a new scenario */
function newScenario() {
     // Clear the drawings
     clearOverlay();

     // Remove the units
     clearUnits();

     // Load the blank canvas
     loadMap('maps/BlankCanvas.png');

     // Do some other stuff
     // TBD
}

function openMapRequestor() {
    highlightMode('new_scenario');
    $('#MapLoadDialog').dialog({
       dialogClass: "no-close",
       autoOpen: true,
       width: "400",
       height: "auto",
       modal: true,
       opacity: "0.5",
       draggable: true,
       resizeable: true,
       closeOnEscape: false
    });
}

function openSaveOnMapLoadRequestor() {
    $( '#SaveOnMapLoadDialog' ).dialog( {
       dialogClass: "no-close",
       autoOpen: true,
       width: "400",
       height: "auto",
       modal: true,
       opacity: "0.5",
       draggable: true,
       resizeable: true,
       closeOnEscape: false
    } );
}

function setMapFromDialog() {
    
    // Get the map image url
    var mapURL = document.getElementById("mapSelection").value;
    closeMapRequestor();

    var unsavedChangesExist = ( userActionIndex !== lastSaveIndex );
    if ( unsavedChangesExist ) {
        // Prompt user to see if they would like to save before closing their previous map
        // The map is then set when the user makes his selection from this dialog
        openSaveOnMapLoadRequestor();
    } else {
        setMap( $( '#mapSelection' ).val() );
    }
}

function setMap( mapURL ) {
    if ( !mapURL ) {
        return;
    }

    // Clear old map's drawings and units and "undo" stack
    clearOverlay();
    clearUnits();
    clearUserActions();

    loadMap( mapURL );

    // Reset the "save" names so user doesn't accidentally save new scenario over old
    $( '#saveScenarioName' ).val( "" );
    $( '#saveScenario' ).prop( 'disabled', true );
    $( '#scenarioName' ).val( "" );
    $( '#saveBeforeLoad' ).prop( 'disabled', true );
}

/* Close the load map dialog */
function closeMapRequestor() {
    $('#MapLoadDialog').dialog('close');
    //document.getElementById('load_map').style.border = "2px solid black";
    highlightMode(inputMode);
}

/* Load a map function */
function loadMap( urlPath ) {
    if ( validPropertyValue( urlPath ) ) {
        var mapID = vwf_view.kernel.find( undefined, "/background/map" )[ 0 ]; 
        if ( mapID !== undefined ) {
            vwf_view.kernel.setProperty( mapID, "image", urlPath );
        }      
    }

}

$(document).ready(function() {
    $("a.dropdown-toggle").click(function(ev) {
        $("a.dropdown-toggle").dropdown("toggle");
        return false;
    });
    $("ul.dropdown-menu a").click(function(ev) {
        $("ul.dropdown-toggle").dropdown("toggle");
        return false;
    });
});

$('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });

$('.dropdown-toggle').click(function(e) {
  e.preventDefault();
  setTimeout($.proxy(function() {
    if ('ontouchstart' in document.documentElement) {
      $(this).siblings('.dropdown-backdrop').off().remove();
    }
  }, this), 0);
});

$('.colorpalette').colorPalette()
  .on('selectColor', function(e) {
    $('.selected-color i').css('background-color', e.color);
    setPenColor(e.color);
});

/* Load scenario file */

/* Open the load scenario dialog  */
function openLoadScenarioRequestor() {
    highlightMode('open_scenario');

    var self = this;
    var app = window.location.pathname;
    var pathSplit = app.split('/');
    if ( pathSplit[0] == "" ) {          
        pathSplit.shift();
    }
    if ( pathSplit[ pathSplit.length - 1 ] == "" ) {
        pathSplit.pop();
    }            
    var instIndex = pathSplit.length - 1;
    if ( pathSplit.length > 2 ) {
        if ( pathSplit[ pathSplit.length - 2 ] == "load" ) {
            instIndex = pathSplit.length - 3;
        }
    }
    if ( pathSplit.length > 3 ) {
        if ( pathSplit[ pathSplit.length - 3 ] == "load" ) {
            instIndex = pathSplit.length - 4;
        }
    }
    var root = pathSplit[ 0 ];
    for ( var createRootIndex = 1; createRootIndex < instIndex - 1; createRootIndex++ ) {
      root = root + "/" + pathSplit[ createRootIndex ];
    }

    if(root.indexOf('.vwf') != -1) root = root.substring(0, root.lastIndexOf('/'));

    $.getJSON( "/" + root + "/listallsaves", function( data ) {
        $.each( data, function( key, value ) {
            var applicationName = value[ 'applicationpath' ].split( "/" );
            if ( applicationName.length > 0 ) {
                applicationName = applicationName[ applicationName.length - 1 ];
            }
            if ( applicationName.length > 0 ) {
                applicationName = applicationName.charAt(0).toUpperCase() + applicationName.slice(1);
            }
            if ( value['latestsave'] ) {
                $('#scenarioSelection').append("<option value='"+value['savename']+"' applicationpath='"+value['applicationpath']+"'>"+applicationName+": "+value['savename']+"</option>");
            }
            else {
                $('#scenarioSelection').append("<option value='"+value['savename']+"' applicationpath='"+value['applicationpath']+"' revision='"+value['revision']+"'>"+applicationName+": "+value['savename']+" Rev(" + value['revision'] + ")</option>");
            }
        } );
    } );
    
    $('#ScenarioLoadDialog').dialog({
       dialogClass: "no-close",
       autoOpen: true,
       width: "400",
       height: "auto",
       modal: true,
       opacity: "0.5",
       draggable: true,
       resizeable: true,
       closeOnEscape: false
    });
}

function loadScenario() {

    var scenarioFilename = $('#scenarioSelection').val();
    
    if ( ( scenarioFilename != 'undefined') && ( scenarioFilename != null ) )
    {
        loadSavedState($('#scenarioSelection').val(), $('#scenarioSelection').find(':selected').attr('applicationpath'), $('#scenarioSelection').find(':selected').attr('revision'));
    }

    closeLoadScenarioRequestor();
}

/* Close the load scenario dialog */
function closeLoadScenarioRequestor() {
    $('#ScenarioLoadDialog').dialog('close');
    //document.getElementById('open_scenario').style.border = "2px solid black";
    highlightMode(inputMode);
}

/* Save scenario file */

/* Open the save scenario dialog  */
function openSaveScenarioRequestor() {
    highlightMode('save_scenario');
    $('#ScenarioSaveDialog').dialog({
       dialogClass: "no-close",
       autoOpen: true,
       width: "400",
       height: "auto",
       modal: true,
       opacity: "0.5",
       draggable: true,
       resizeable: true,
       closeOnEscape: false
    });
}

function saveScenarioFromRequestor() {
    var scenarioFilename = $( '#saveScenarioName' ).val();
    if ( scenarioFilename ) {
        saveStateAsFile( scenarioFilename );

        // Set the value of the other save dialog to match this one
        $( '#scenarioName' ).val( scenarioFilename );
        $( '#saveBeforeLoad' ).prop( 'disabled', false );
    }
    closeSaveScenarioRequestor();
}

/* Close the save scenario dialog */
function closeCreateNewLayer() {
    
    $('#CreateNewLayer').dialog('close');
    highlightMode( inputMode );

}

function showNewLayerDialog() {
    highlightMode( 'create_layer' );
    $('#CreateNewLayer').dialog({
       dialogClass: "no-close",
       autoOpen: true,
       width: "400",
       height: "auto",
       modal: true,
       opacity: "0.5",
       draggable: true,
       resizeable: true,
       closeOnEscape: false
    });
}

function createNewLayerFromRequestor() {

    var layerName = $( '#newLayerName' ).val();
    vwf_view.kernel.callMethod( vwf_view.kernel.application(), "createLayer", [ layerName ] );
    closeCreateNewLayer()
}


// -- SaveStateAsFile --------------------------------------------------------------------------
function saveStateAsFile(filename)
{
    if(supportAjaxUploadWithProgress.call(this))
    {
        var xhr = new XMLHttpRequest();

        // Save State Information
        var state = vwf.getState();

        var timestamp = state["queue"].time;
        timestamp = Math.round(timestamp * 1000);

        var objectIsTypedArray = function( candidate ) {
            var typedArrayTypes = [
                Int8Array,
                Uint8Array,
                // Uint8ClampedArray,
                Int16Array,
                Uint16Array,
                Int32Array,
                Uint32Array,
                Float32Array,
                Float64Array
            ];

            var isTypedArray = false;

            if ( typeof candidate == "object" && candidate != null ) {
                typedArrayTypes.forEach( function( typedArrayType ) {
                    isTypedArray = isTypedArray || candidate instanceof typedArrayType;
                } );
            }

            return isTypedArray;
        };

        var transitTransformation = function( object ) {
            return objectIsTypedArray( object ) ?
                Array.prototype.slice.call( object ) : object;
        };

        var json = JSON.stringify(
            require("vwf/utility").transform(
                state, transitTransformation
            )
        );

        json = $.encoder.encodeForURL(json);

        var path = window.location.pathname;
        var pathSplit = path.split('/');
        if ( pathSplit[0] == "" ) {          
            pathSplit.shift();
        }
        if ( pathSplit[ pathSplit.length - 1 ] == "" ) {
            pathSplit.pop();
        }            
        var inst = undefined;
        var instIndex = pathSplit.length - 1;
        if ( pathSplit.length > 2 ) {
            if ( pathSplit[ pathSplit.length - 2 ] == "load" ) {
                instIndex = pathSplit.length - 3;
            }
        }
        if ( pathSplit.length > 3 ) {
            if ( pathSplit[ pathSplit.length - 3 ] == "load" ) {
                instIndex = pathSplit.length - 4;
            }
        }
        inst = pathSplit[ instIndex ];
        var root = pathSplit[ 0 ];
        for ( var createRootIndex = 1; createRootIndex < instIndex - 1; createRootIndex++ ) {
            root = root + "/" + pathSplit[ createRootIndex ];
        }

        if(filename == '') filename = inst;

        if(root.indexOf('.vwf') != -1) root = root.substring(0, root.lastIndexOf('/'));

        xhr.open("POST", "/"+root+"/save/"+filename, true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send("root="+root+"/"+filename+"&filename=saveState&inst="+inst+"&timestamp="+timestamp+"&extension=.vwf.json"+"&jsonState="+json);

        // Save Config Information
        var config = {"info":{}, "model":{}, "view":{} };

        // Save browser title
        config["info"]["title"] = $('title').html();

        // Save model drivers
        Object.keys(vwf_view.kernel.kernel.models).forEach(function(modelDriver) {
            if(modelDriver.indexOf('vwf/model/') != -1) config["model"][modelDriver] = "";
        });

        // If neither glge or threejs model drivers are defined, specify nodriver
        if(config["model"]["vwf/model/glge"] === undefined && config["model"]["vwf/model/threejs"] === undefined) config["model"]["nodriver"] = "";

        // Save view drivers and associated parameters, if any
        Object.keys(vwf_view.kernel.kernel.views).forEach(function(viewDriver) {
            if(viewDriver.indexOf('vwf/view/') != -1)
            {
                if( vwf_view.kernel.kernel.views[viewDriver].parameters )
                {
                    config["view"][viewDriver] = vwf_view.kernel.kernel.views[viewDriver].parameters;
                }
                else config["view"][viewDriver] = "";
            }
        });

        var jsonConfig = $.encoder.encodeForURL( JSON.stringify( config ) );

        // Save config file to server
        var xhrConfig = new XMLHttpRequest();
        xhrConfig.open("POST", "/"+root+"/save/"+filename, true);
        xhrConfig.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhrConfig.send("root="+root+"/"+filename+"&filename=saveState&inst="+inst+"&timestamp="+timestamp+"&extension=.vwf.config.json"+"&jsonState="+jsonConfig);

        // Record the save point for use in determining if there are unsaved changes
        vwf_view.kernel.callMethod( vwf_view.kernel.application(), "recordSave" );
    }
    else
    {
        console.error("Unable to save state.");
    }
}

// -- LoadSavedState --------------------------------------------------------------------------
function loadSavedState(filename, applicationpath, revision) 
{
    // Redirect until setState ID conflict is resolved
    var path = window.location.pathname;
    var inst = path.substring(path.length-17, path.length-1);
        
    var pathSplit = path.split('/');
    if ( pathSplit[0] == "" ) {          
        pathSplit.shift();
    }
    if ( pathSplit[ pathSplit.length - 1 ] == "" ) {
        pathSplit.pop();
    }            
    var inst = undefined;
    var instIndex = pathSplit.length - 1;
    if ( pathSplit.length > 2 ) {
        if ( pathSplit[ pathSplit.length - 2 ] == "load" ) {
            instIndex = pathSplit.length - 3;
        }
    }
    if ( pathSplit.length > 3 ) {
        if ( pathSplit[ pathSplit.length - 3 ] == "load" ) {
            instIndex = pathSplit.length - 4;
        }
    }
    inst = pathSplit[ instIndex ];
    if ( revision ) {
        window.location.pathname = applicationpath + "/" + inst + '/load/' + filename + '/' + revision + '/';
    }
    else {
        window.location.pathname = applicationpath + "/" + inst + '/load/' + filename + '/';
    }
}

// -- SupportAjax -----------------------------------------------------------------------------
function supportAjaxUploadWithProgress()
{
    return supportAjaxUploadProgressEvents();
    function supportAjaxUploadProgressEvents() 
    {
        var xhr = new XMLHttpRequest();
        return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
    }
}

$('.dropdown-menu input, .dropdown-menu label').click(function(e) {
    e.stopPropagation();
});

$('.dropdown-menu .dropdown-submenu a[data-toggle="dropdown-submenu"]').click(function (e)
{                   
    e.stopPropagation();
});

function addUnitToMenu( unitDef ) {          

    if ( unitsAvailable[ unitDef.fullName ] === undefined ) {
        unitsAvailable[ unitDef.fullName ] = unitDef;
        unitTypesAdded[ unitDef.searchAcronym ].push( unitDef );
    }
}

function setActiveUnit( id ) {
    activeUnit = unitsAvailable[ id ];
    if ( activeUnit ) {
        var unitButton = $( "#add_unit_icon" );
        if ( unitButton ) {
            unitButton.attr( "src", activeUnit.image[ unitAffiliation ] );
        }
    }
}

function setActiveUnitType( id ) {
    var unit;
    var unitTagLength;
    var unitTag = id;
    var unitSelectorMenu = $( '#unit-drop-down' );
    
    // Clear unit selector menu
    unitSelectorMenu.html( "" );

    var defaultUnitSelected = unitTypesAdded[ unitTag ][ 0 ].fullName;
    unitTagLength = unitTypesAdded[ unitTag ].length;
    for ( var i = 0; i < unitTagLength; i++ ) {
        unit = unitTypesAdded[ unitTag ][ i ];
        unitSelectorMenu.append( '<li><a href="#" id="'+unit.fullName+'" onclick="setActiveUnit(this.id)" ><img src="'+unit.image[ unitAffiliation ]+'" />' +unit.actualName+'</a></li>' );
    }
    setActiveUnit( defaultUnitSelected );
}

function setUnitAffiliation( affiliation ) {

    var unitSelectorMenu = $( '#unit-drop-down' );
    var unitTag = activeUnitId;

    // Change "unit type" text to unitTag
    unitAffiliation = affiliation;

    // Clear unit selector menu
    unitSelectorMenu.html( "" );

    if ( activeUnit !== undefined ) {
        var unitButton = $( "#add_unit_icon" );
        if ( unitButton ) {
            unitButton.attr( "src", activeUnit.image[ unitAffiliation ] );
        }
    }

    unitTagLength = unitTypesAdded[ unitTag ].length;
    for ( var i = 0; i < unitTagLength; i++ ) {
        unit = unitTypesAdded[ unitTag ][ i ];
        unitSelectorMenu.append( '<li><a href="#" id="'+unit.fullName+'" onclick="setActiveUnit(this.id)" ><img src="'+unit.image[ unitAffiliation ]+'" />' +unit.actualName+'</a></li>' );
    }

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

function isKineticComponent( prototypes ) {
    var className = undefined;
    if ( prototypes ) {
        var kIndex;
        for ( var i = 0; i < prototypes.length && className === undefined ; i++ ) {
            kIndex = prototypes[ i ].indexOf( "http-vwf-example-com-kinetic-" ); 
            if ( kIndex != -1 ) {
                var nameList = prototypes[ i ].split( '-' );
                className = nameList[ nameList.length - 2 ]
            }    
        }
    }
    return className;
}

function validPropertyValue( obj ) {
    var objType = ( {} ).toString.call( obj ).match( /\s([a-zA-Z]+)/ )[ 1 ].toLowerCase();
    return ( objType != 'null' && objType != 'undefined' );
}

function filterUnitTypes ( battleDim, unitFunction ) {

    if ( armyc2.c2sd.renderer.utilities.RendererUtilities.fontsLoaded() ) {
        if ( unitTypesAdded[unitFunction] === undefined )
        {
            pendingUnitId = unitFunction;
        
            unitTypesAdded[pendingUnitId] = [];
            
            var units = {};
            units[battleDim] = unitFunction;

            vwf_view.kernel.callMethod( vwf_view.kernel.application(), "insertUnits", [ units ] ); 
            
            if ( !unitsInitialized ) {
                unitInitializationComplete();
            }
        }
        else {
            if ( unitTypesAdded[ unitFunction ].length > 0 ) {
                activeUnitId = unitFunction;
                setActiveUnitType(activeUnitId);
            }
            else {
                alert("No units available for filter: " + unitFunction);
            }
        }
    }
}

function unitInitializationComplete () {

    // Create each of the pending icons
    for ( var id in _unitSymbolsPending ) {
        createUnitIcon ( id, _unitSymbolsPending[ id ].imageSrc );
        updateUnitLocation( id, _unitSymbolsPending[ id ].location );
    }
    
    // Clear out the units pending list
    _unitSymbolsPending = {};
    
    // Confirm units are initialized
    unitsInitialized = true;
}

function addLayerDropDown( kineticNode ) {
    var layerDropDown = $( '#layer-drop-down' );

    if ( layerDropDown ) {
        layerDropDown.append( '<li><a href="#" id="'+kineticNode.ID+'" onclick="setActiveLayer(this.id)"><img id="'+kineticNode.ID+'-image" onclick="toggleLayerVisibilty(this.id)" src="images/visible.png" />'+kineticNode.name+'</a></li>' );
    }
}

function setActiveLayer( layerId ) {
    if ( kineticComponents[ layerId ] ) {
        currentLayer = kineticComponents[ layerId ].name;
    }    
} 

function toggleLayerVisibilty( layerImageId ) {
    var layerImage = $( '#'+layerImageId );
    var layerId = layerImageId.substr( 0, layerImageId.length-6 );
    vwf_view.kernel.callMethod( layerId, "toggleVisibilty", [] );
    debugger;
}
  
function removeUnitsFromLayer( layerName ) {
    // TODO - Kinetic
}

function findKinenticView() {
    var lastKernel = vwf_view;
    while ( lastKernel.kernel ) {
        lastKernel = lastKernel.kernel;
    }
    return lastKernel.views[ "vwf/view/kineticjs" ];
}

//@ sourceURL=index-view.js