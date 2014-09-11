var appID = vwf_view.kernel.application();
var stage;
var inputMode;
var _drawingMode = "freeDraw";
var mapURL;
var _editingNodeID = undefined;

//var ios = navigator.userAgent.match(/(iPhone)|(iPod)|(iPad)/); // is iOS
var eraserWidth = 20;

// undo
var currentUserAction;
var userActionIndex;
var lastSaveIndex;
//undo

var unitsAvailable = {};
var unitTypesAdded = {};
var unitIndex = 1;
var activeUnit = undefined;
var battleDim = "ground";
var defaultUnitType = "UNT.CBT.INF";
var activeUnitId = defaultUnitType;
var pendingUnitType = defaultUnitType;
var unitsInitialized = false;
var _unitAffiliation = "unknown";
var _unitModifiers = {};
var _unitEchelon = "none";
var _unitSymbolsPending = {};
var _quickUnits = {};
var _quickUnitsToolbar = {};
var _selectedUnit = { "unit":           undefined,
                      "affiliation":    "unknown",
                      "echelon":        "none"
                    };

// Set Defaults
_unitModifiers.pixelSize = "40";

var kineticComponents = {};
var currentLayer = undefined;
var layerCheckboxes = {};

console.info( "==================================================" );
vwf_view.kernel.callMethod( appID, "createClient", [ vwf_view.kernel.moniker() ] );
console.info( "==================================================" );

vwf_view.ticked = function() {
    // Initialize the unit symbols with a default set
    if ( !unitsInitialized) {
        filterUnitTypes( 'ground', defaultUnitType );
    }
}

vwf_view.createdNode = function( nodeID, childID, childPrototypeID, childBehaviorIDs, 
    childSource, childType, childIndex, childName ) {
    
    var prototypes = getPrototypes( vwf_view.kernel, childPrototypeID );
    var kineticClass = isKineticComponent( prototypes );
    
    if ( kineticClass !== undefined ) {
        
        var kineticNode = kineticComponents[ childID ] = {
            "ID": childID,
            "parentID": nodeID,
            "name": childName,
            "type": kineticClass,
            "prototypeID": childPrototypeID,
            "prototypes": prototypes,
            "class": kineticClass
        };

        switch ( childPrototypeID ) {
            
            case "unitGroup.vwf":
                if (!unitsInitialized) {
                    _unitSymbolsPending[ childID ] = {
                        "location": undefined,
                        "imageSrc": undefined
                    };
                }                
                break;

            case "tdgLayer.vwf":
                setActiveLayer( childName );
                addLayerDropDown( kineticNode );
                break;
        }
         
    }
}

vwf_view.initializedNode = function( nodeID, childID ) {
    if ( childID === appID ) {
        stage = findKinenticView().state.stage;

        stage.on( 'contentMousedown', ev_mousedown );
        stage.on( 'contentMouseup', ev_mouseup );
    }
}

vwf_view.deletedNode = function( nodeID ) {

    if ( kineticComponents[ nodeID ] ) {
        delete kineticComponents[ nodeID ];
    }
}

// vwf_view.gotProperty = function( nodeID, propertyName, propertyValue ) {
//     switch ( propertyName ) {
//         case "inputMode":
//             inputMode = propertyValue;
//             highlightMode( inputMode );
//             break;
//     }
// }


vwf_view.createdProperty = function( nodeID, propertyName, propertyValue ) {
    this.satProperty( nodeID, propertyName, propertyValue );
}

vwf_view.initializedProperty = function( nodeID, propertyName, propertyValue ) {
    this.satProperty( nodeID, propertyName, propertyValue );
}
      
vwf_view.satProperty = function( nodeID, propertyName, propertyValue ) {
    
    if ( !validPropertyValue( propertyValue ) ) {
        return;
    }

    switch ( propertyName ) {
        
     
        case "userActionIndex":
            userActionIndex = propertyValue;
            break;
        
        case "lastSaveIndex":
            lastSaveIndex = propertyValue;
            break;
       
        case "scenarioGeneralDescription":
            $("#textGeneralSituation").val( propertyValue );
            break;

        case "scenarioEnemyDescription":
            $("#textEnemySituation").val( propertyValue );
            break;

        case "scenarioFriendlyDescription":
            $("#textFriendlySituation").val( propertyValue );
            break;

        case "visible":
            var checkbox = layerCheckboxes[ nodeID ];
            if ( checkbox ) {
                var visible = propertyValue;
                if ( checkbox.prop( "checked" ) ) {
                    if ( !visible ) {
                        checkbox.prop( "checked", false );
                    }
                } else {
                    if ( visible ) {
                        checkbox.prop( "checked", true );
                    }
                }
            }
            break;
    }
}

vwf_view.calledMethod = function ( nodeID, methodName, methodParameters, methodValue ) {
    switch ( methodName ) {
        
        case "clearUnits":
            break;

        case "clearShapes":
            break;

        case "clearLines":
            break;
            
        case "addQuickUnit": 
            // Set the request and unit id options
            var options = { request: methodName,
                            unitID:  methodParameters[0]
                          };
                          
            // Get the unit and modifiers from the method
            var unit = methodParameters[1];
            var modifiers = methodParameters[2];         
            
            // Request the icon for this unit (creating the button is handled on the callback event)
            vwf_view.kernel.callMethod( appID, "getUnitSymbol", [ unit.unit.symbolID, unit.affiliation, unit.echelon, modifiers, unit, options ] ); 
                       
            break;
            
        case "deleteQuickUnit":
            // Delete the unit from the quickUnits list and 
            // redraw the quickUnit buttons
            
            break;
            
        default:
            break;
    }
}

vwf_view.firedEvent = function( nodeID, eventName, eventParameters ) {
    
    var kineticNode = kineticComponents[ nodeID ];

    var eventHandled = false;

    if ( kineticNode && kineticNode.prototypeID === "unitGroup.vwf" ) {

        switch ( eventName ) {
            case "tap":
            case "pointerClick":
                //console.info( "firedEvent( "+nodeID+", "+eventName+", eventParameters )" );
                if ( inputMode === "delete_unit" ) { 
                    var parent = kineticComponents[ kineticNode.parentID ];
                    if ( parent ) {
                        var layerParent = kineticComponents[ parent.parentID ];
                        if ( layerParent && vwf_view.kernel.client() === vwf_view.kernel.moniker() ){
                            vwf_view.kernel.callMethod( appID, "deleteUnit", [ nodeID, layerParent.name, kineticNode.name ] );
                        }
                    }
                }
                eventHandled = true;
                break;

        }

    } 

    if ( nodeID === appID ) {
            
        // application level event
        var clientThatFiredEvent = this.kernel.client();
        var me = this.kernel.moniker();
        
        switch ( eventName ) {

            case "tap":
            case "pointerClick":
                var eventData = eventParameters[0];

                if ( clientThatFiredEvent === me ) {

                    switch( inputMode ) { 

                        case "add_unit":
                            if ( _selectedUnit.unit !== undefined ) {
                                var name = _selectedUnit.unit.tag + unitIndex;
                                unitIndex++;

                                // Build the list of modifiers
                                _unitModifiers.uniqueDesignation1 = $( "#uniqueIdentifier" )[0].value;
                                _unitModifiers.higherFormation = $( "#higherUnit" )[0].value;
                                _unitModifiers.pixelSize = "40";
                                _unitModifiers.icon = false;

                            vwf_view.kernel.callMethod( appID, "createUnit", [ 
                                currentLayer, name, _selectedUnit.unit, eventData.page, 
                                _selectedUnit.affiliation, _selectedUnit.echelon, 
                                _unitModifiers 
                            ] );    
                            } 
                            break;
                    }
                    eventHandled = true;
                }
                break;
                
            case "insertableUnitAdded":
                if ( clientThatFiredEvent === me ) {
                    addUnitToMenu( eventParameters[ 0 ] );
                }
                break;

            case "unitLoadingComplete":
                if ( unitTypesAdded[ pendingUnitId ].length > 0 )
                {
                    activeUnitId = pendingUnitId;
                    setActiveUnitType(activeUnitId);
                }
                else
                {
                    alert("No units available for filter: " + pendingUnitId);
                }
                break;
            
            case "imageChanged":
                break;

            case "selectedUnitSymbolRendered":
                if ( clientThatFiredEvent === me ) {
                    // Update the active unit
                    _selectedUnit.unit = eventParameters[ 0 ];
                    _selectedUnit.image = _selectedUnit.unit.image["selected"];

                    // Update the selected unit button
                    updateSelectedUnitButton();
                }
                break;

            case "quickUnitAdded":
                // Get the reference to the quick units toolbar
                _quickUnitsToolbar = $( "#unitQuicklinks" );
    
                // Get the id for this unit type
                var unit_id = eventParameters[0];
    
                // Check to make sure there isn't already an icon matching this id
                if (!_quickUnits[unit_id]) {
                    // Copy the selected unit object to the list of quickUnits
                    // jQuery method of deep copy from:
                    // (http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object)
                    _quickUnits[unit_id] = jQuery.extend(true, {}, eventParameters[1]);
    
                    // Create the vertical button group including the unit button and the delete button
                    // TODO
    
                    // Create the unit button html and add to the toolbar
                    _quickUnitsToolbar.append( '<button class="btn btn-xs btn-default" href="#" id="'+unit_id+'" onclick="selectUnitFromToolbar(this.id)" ><img src="'+_quickUnits[unit_id].image.url+'" width="'+_quickUnits[unit_id].image.width+'" height="'+_quickUnits[unit_id].image.height+'" /></button>' );
                }
                                
                break;
            
            case "favoriteUnitAdded":
                break;
                
            case "recentUnitAdded":
                break;
                
            case "textCreated":
                _editingNodeID = eventParameters[ 0 ];
                showTextEntryDialog();
                break;

            case "imageCreated":
                _editingNodeID = eventParameters[ 0 ];
                showFileBrowser();
                break;
        }        
    }
    return eventHandled;
}


var mousedown;

( function init () {

    setMode( "draw" );
    $( '.selected-color i' ).css( 'background-color', "#000000" );

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


function ev_mousedown( event ) {
    mousedown = true;
}

function ev_mouseup( event ) {
    mousedown = false;

    var ev = event.evt;

    if ( ev.button === 0 ) {
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


function userClearLines() {
    clearOverlay();
    vwf_view.kernel.callMethod( appID, "recordUserAction", [ "clear" ] );
}

function clearOverlay() {
    vwf_view.kernel.callMethod( appID, "clearLines" );
}

function clearUnits() {
    vwf_view.kernel.callMethod( appID, "clearUnits", [ currentLayer, "units" ] );
}

function clearUserActions() {
    vwf_view.kernel.callMethod( appID, "clearUserActions" );
}

function clearAll() {
    clearOverlay();
    clearUnits();
}

function clearAllUserShapes(){
    vwf_view.kernel.callMethod( appID, "clearUnits", [ vwf_view.kernel.moniker(), undefined, "shapes" ] );    
}

function clearUserLayerShapes( layer ){
    vwf_view.kernel.callMethod( appID, "clearUnits", [ vwf_view.kernel.moniker(), layer, "shapes" ] );    
}

function clearAllUserLines(){
    vwf_view.kernel.callMethod( appID, "clearUnits", [ currentLayer, "units" ] );    
}

function clearUserLayerLines(){
    vwf_view.kernel.callMethod( appID, "clearUnits", [ currentLayer, "units" ] );    
}

function clearAllUserUnits(){
    vwf_view.kernel.callMethod( appID, "clearUnits", [ currentLayer, "units" ] );    
}

function clearUserLayerUnits(){
    vwf_view.kernel.callMethod( appID, "clearUnits", [ currentLayer, "units" ] );    
}

function setPenColor( vColor ) {
    vwf_view.kernel.callMethod( appID, "setClientUIState", [ { "drawing_color": vColor } ] );
}

function setPenWidth( penWidth ) {
    vwf_view.kernel.callMethod( appID, "setClientUIState", [ { "drawing_width": penWidth } ] ); 
}

function setEraserWidth( eraserSize ) {
    eraserWidth = eraserSize;
}

function setDrawingShape( shape ) {
    _drawingMode = shape;    
    setMode( 'draw' );
}


function setMode( mode ) {
    inputMode = mode;
    if ( mode === "move" ) {
        // Set the user's local stage to be draggable
        stage && stage.draggable( true );
    } else {
        // Set the user's local stage to not be draggable
        stage && stage.draggable( false );
    }
    if ( mode !== "draw" ) {
        vwf_view.kernel.callMethod( appID, "setClientUIState", [ { "drawing_mode": 'none' } ] );
    } else {
        vwf_view.kernel.callMethod( appID, "setClientUIState", [ { "drawing_mode": _drawingMode } ] );
    }

    highlightMode( mode );
}

function highlightMode(mode) {

    // Pop all the other buttons back out
    var modes = [ 
        "move", "draw", "erase", "draw_shape",
        "add_unit", "delete_unit", 
        "create_layer", // should probably only be set while the dialog is open
        "new_scenario", "save_scenario", "open_scenario",
        "scenario_description"
    ];
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

function toggleCollapse(collapsibleObject) {

    if ( $(collapsibleObject).hasClass('in')) {
        $(collapsibleObject).removeClass('in');
    }
    else {
        $(collapsibleObject).addClass('in');
    }

}

function collapseAllToolbars() {
    
    var toolbarTags = [ "#drawingToolbar", "#scenarioDescription", "#unitQuicklinksToolbar", "#unitToolbar" ];

    toolbarTags.forEach ( function (thisToolbar) {
                            if ($(thisToolbar).hasClass('in')) {
                                $(thisToolbar).removeClass('in');
                            }
                          });
}
 
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
    closeDialog('#MapLoadDialog');

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
    clearLines();
    clearShapes();
    clearUserActions();
    loadMap( mapURL );

    // Reset the "save" names so user doesn't accidentally save new scenario over old
    $( '#saveScenarioName' ).val( "" );
    $( '#saveScenario' ).prop( 'disabled', true );
    $( '#scenarioName' ).val( "" );
    $( '#saveBeforeLoad' ).prop( 'disabled', true );
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

/* Open the scenario description dialog */
function openScenarioDescription() {
    highlightMode('scenario_description');
    $('#ScenarioDescriptionDialog').dialog({
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

/* Close the scenario description dialog */
function closeScenarioDescription() {
    $('#ScenarioDescriptionDialog').dialog('close');
    highlightMode(inputMode);
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
    $("button.dropdown-toggle").click(function(ev) {
        $("button.dropdown-toggle").dropdown("toggle");
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

    closeDialog('#ScenarioLoadDialog');
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
    closeDialog('#ScenarioSaveDialog');
}

/* Close a dialog */
function closeDialog(id) {
    $(id).dialog('close');
    highlightMode(inputMode);
}

/* Layers */

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
    vwf_view.kernel.callMethod( appID, "createLayer", [ layerName ] );
    closeDialog('#CreateNewLayer');
}


function closeAddText() {
    $('#EnterText').dialog('close');
    //highlightMode( inputMode );
    _editingNodeID = undefined;
}

function showTextEntryDialog() {
    //highlightMode( 'create_layer' );
    $('#EnterText').dialog({
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

function addTextComplete(){
    var text = $( '#addTextControl' ).val();
    vwf_view.kernel.setProperty( _editingNodeID, "text", text );
    closeAddText();
}

function showFileBrowser() {
    //highlightMode( 'create_layer' );
    $('#OpenFileBrowser').dialog({
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

function closeFileBrowser() {
    $('#OpenFileBrowser').dialog('close');
    //highlightMode( inputMode );
    _editingNodeID = undefined;
}

function openFileSelected(){
    var url = $( '#openFileUrl' ).val();
    vwf_view.kernel.setProperty( _editingNodeID, "image", url );
    closeFileBrowser();
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
        vwf_view.kernel.callMethod( appID, "recordSave" );
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

// -- Update Scenario Description -------------------------------------------------------------
function updateScenarioDescription( descriptionType ) {
    switch (descriptionType) {
        case "general":
            vwf_view.kernel.setProperty( appID, "scenarioGeneralDescription", $("#textGeneralSituation").val() );
            break;
        case "enemy":
            vwf_view.kernel.setProperty( appID, "scenarioEnemyDescription", $("#textEnemySituation").val() );        
            break;
        case "friendly":
            vwf_view.kernel.setProperty( appID, "scenarioFriendlyDescription", $("#textFriendlySituation").val() );            
            break;
        default:
            break;
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

$(".submenu-item a").click(function() {
    $("#unitTypeFilter").dropdown("toggle");
});

$(".clear-option a").click(function() {
    $("#toggleClearOptions").dropdown("toggle");
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
        var unitButton = $( "#active_unit_type_icon" );
        if ( unitButton ) {
            unitButton.attr( "src", activeUnit.image[ _unitAffiliation ] );
            updateActiveUnitEchelon();
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
        unitSelectorMenu.append( '<li><a href="#" id="'+unit.fullName+'" onclick="setActiveUnit(this.id)" ><img src="'+unit.image[ _unitAffiliation ]+'" />' +unit.actualName+'</a></li>' );
    }
    setActiveUnit( defaultUnitSelected );
}

function setUnitAffiliation( affiliation ) {

    var unitSelectorMenu = $( '#unit-drop-down' );
    var unitTag = activeUnitId;
    var unitButton = undefined;

    // Change "unit type" text to unitTag
    _unitAffiliation = affiliation;
    _selectedUnit.affiliation = affiliation;

    // Clear unit selector menu
    unitSelectorMenu.html( "" );

    if ( activeUnit !== undefined ) {
        unitButton = $( "#active_unit_type_icon" );
        if ( unitButton ) {
            unitButton.attr( "src", activeUnit.image[ _unitAffiliation ] );
        }
    }

    unitTagLength = unitTypesAdded[ unitTag ].length;
    for ( var i = 0; i < unitTagLength; i++ ) {
        unit = unitTypesAdded[ unitTag ][ i ];
        unitSelectorMenu.append( '<li><a href="#" id="'+unit.fullName+'" onclick="setActiveUnit(this.id)" ><img src="'+unit.image[ _unitAffiliation ]+'" />' +unit.actualName+'</a></li>' );
    }

    _unitModifiers.icon = true;
    vwf_view.kernel.callMethod( appID, "getUnitSymbol", [ activeUnit.symbolID, _unitAffiliation, _unitEchelon, _unitModifiers, activeUnit, { request: "renderSelectedUnit" } ] ); 
    
    // Set the help block
    $( "#selectedAffiliation" ).text("   " + affiliation);
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

function setEchelon( echelonID ) {
    _unitEchelon = echelonID;
    _selectedUnit.echelon = echelonID;
    updateActiveUnitEchelon();
    $("#Echelon").dropdown("toggle");
}

function updateActiveUnitEchelon( ) {
    _unitModifiers.icon = true;
    vwf_view.kernel.callMethod( appID, "getUnitSymbol", [ activeUnit.symbolID, _unitAffiliation, _unitEchelon, _unitModifiers, activeUnit, { request: "renderSelectedUnit" } ] ); 
    
    // Set the help block
    $( "#selectedEchelon" ).text("   " + _unitEchelon);
}

function setReinforce(reinforceState) {
      
    // Replace fields 11 and 12 with the id passed in
    switch( reinforceState ) {          
      case "reinforced":
        _unitModifiers.reinforcedReduced = "R";
        break;
      case "reduced":
        _unitModifiers.reinforcedReduced = "D";
        break;
      case "both":
        _unitModifiers.reinforcedReduced = "RD";
        break;                
      case "none":
      default:
        _unitModifiers.reinforcedReduced = undefined;
        break;
    }  
     
    // Set the help block
    $( "#selectedReinforced" ).text("   " + reinforceState);
    
    // Force the dropdown to close
    $("#reinforcedUnit").dropdown("toggle");
}

function filterUnitTypes ( battleDim, unitFunction ) {

    if ( armyc2.c2sd.renderer.utilities.RendererUtilities.fontsLoaded() ) {
        
        if ( unitTypesAdded[ unitFunction ] === undefined )
        {
            pendingUnitId = unitFunction;
        
            unitTypesAdded[ pendingUnitId ] = [];
            
            var units = {};
            units[ battleDim ] = unitFunction;

            vwf_view.kernel.callMethod( appID, "insertUnits", [ units ] ); 
            
            if ( !unitsInitialized ) {
                unitInitializationComplete();
            }
        }
        else {
            if ( unitTypesAdded[ unitFunction ].length > 0 ) {
                activeUnitId = unitFunction;
                setActiveUnitType(activeUnitId);
            } else {
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

function addSelectedUnitToToolbar() {
       
    // Get the reference to the quick units toolbar
    _quickUnitsToolbar = $( "#unitQuicklinks" );
    
    // Create an id for this unit type
    var unit_id = _selectedUnit.unit.fullName + "." + _unitAffiliation + "." + _unitEchelon;
    
    // Check to make sure there isn't already an icon matching this id
    if (!_quickUnits[unit_id]) {   
        // Update the network state 
        _unitModifiers.icon = true;
        vwf_view.kernel.callMethod( appID, "addQuickUnit", [ unit_id, _selectedUnit, _unitModifiers ] );
    }
}

function deleteUnitFromToolbar( unit_id ) {

    // Delete the Unit button

    // Delete the Delete button
    
    // Delete Unit from Toolbar List


}

function selectUnitFromToolbar( unit_id ) {

    // Set the _selectedUnit
    if (_quickUnits[unit_id]) {
        
        // Do a deep copy of the toolbar unit icon so we don't accidentally overwrite what's there
        _selectedUnit = jQuery.extend(true, {}, _quickUnits[unit_id]);
    
        // Update the selected unit button
        updateSelectedUnitButton();
    }
}

function updateSelectedUnitButton () {

    var unitButton = $( "#selectedUnitIcon" );
    if ( unitButton && _selectedUnit.image ) {
        unitButton.attr( "src", _selectedUnit.image.url );
        unitButton.attr( "width", _selectedUnit.image.width );
        unitButton.attr( "height", _selectedUnit.image.height );
    }

}

// function from example (http://codepen.io/yukulele/pen/xtEpb)
// grab the text from a text input box
$(function() {
    var inp = $('.inp');
    inp.on('input', function() {
        var ref = $(this).data('ref');
        ref = this.value;
    });
});

// Change changes the value when the input loses focus and the value has changed
$( "#uniqueIdentifier" ).change(function() {
    _unitModifiers.uniqueDesignation1 = this.value;
});

$( "#higherUnit" ).change(function() {
    _unitModifiers.higherFormation = this.value;
});


function addLayerDropDown( kineticNode ) {
    var layerDropDown = $( '#layer-drop-down' );

    if ( layerDropDown ) {
        var listitem = $( '<li></li>' ).appendTo( layerDropDown );
        layerCheckboxes[ kineticNode.ID ] = $( 
            '  <input type="checkbox" id="'+kineticNode.ID+'-checkbox" checked="checked" onchange="toggleLayerVisibilty(this.id)"/>\n'
        ).appendTo( listitem );
        listitem.append( 
            '  <span class="layer-listitem" id="'+kineticNode.ID+'" onclick="setActiveLayer(this.id)">' +
                 kineticNode.name +
            '  </span>\n'
        );
    }
}

function setActiveLayer( layer ) {
    currentLayer = ( kineticComponents[ layer ] !== undefined ) ? kineticComponents[ layer ].name : layer;
    var path = "//instructor//" + currentLayer;
    vwf_view.kernel.callMethod( appID, "setClientUIState", [ { "drawing_parentPath": path } ] );
} 

function toggleLayerVisibilty( layerImageId ) {
    var layerId = layerImageId.substr( 0, layerImageId.length-9 );
    vwf_view.kernel.callMethod( layerId, "toggleVisibilty", [] );
}


function findKinenticView() {
    var lastKernel = vwf_view;
    while ( lastKernel.kernel ) {
        lastKernel = lastKernel.kernel;
    }
    return lastKernel.views[ "vwf/view/kineticjs" ];
}

String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
}

//@ sourceURL=index-view.js