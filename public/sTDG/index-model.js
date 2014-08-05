this.initialize = function() {
    this.editMode = "createUnit";
}

this.createUnit = function( layer, name, unit, location, affiliation ) {

    var color;

    switch ( affiliation ) {
        case "hostile":
            color = 'red';
            break;        
        case "neutral": 
            color = 'lime';
            break;
        case "friendly":
            color = 'lightblue';
            break; 
        default: 
            color = 'yellow';
            break;
    };

    var x = ( location[ 0 ] * this.width ) - 16;
    var y = ( location[ 1 ] * this.height ) - 16;
    var groupDef = {
        extends: "unitGroup.vwf",
        properties: {
            x: x,
            y: y,
            visible: 'inherit',
            draggable: true,
            threatShape: 'circle',
        },
        children: {
            icon: {
                extends: "http://vwf.example.com/kinetic/rect.vwf", 
                properties: {
                    fillPatternImage: unit.image[ affiliation ],
                    visible: 'inherit',
                    draggable: false,
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32,
                    zIndex: 4
                },
                "scripts": [ "this.imageGenerator.imageChanged = function(img) {this.fillPatternImage=img;}" ],
                "children": {
                    "imageGenerator": {
                        "extends": "unit.vwf",
                        "properties": {
                            "location": location,
                            "affiliation": affiliation, 
                            "image": unit.image[ affiliation ],
                            "symbolID": unit.symbolID,
                            "description": unit.description,
                            "tagName": unit.tag
                        },
                        "children": {
                            "modifier": {
                                "extends": "modifier.vwf",
                                "properties": {
                                    "pixelSize": 60,
                                    "icon": false
                                }
                            }
                        }
                    }
                }
            },
            threatArea: {
                extends: "http://vwf.example.com/kinetic/circle.vwf",
                properties: {
                    x: 16,
                    y: 16,
                    visible: 'inherit',
                    radius: 32,
                    opacity: 0.3,
                    fill: color,
                    fillEnabled: true, 
                    draggable: false,
                    zIndex: 2
                }
            }
        }    
    };

    this.instructor[ layer ].units.children.create( name, groupDef, function( child ) {
        // console.info( "unit " + name + " created: id = " + child.id );
        // console.info( "     location: " + child.location );
        // console.info( "     affiliation: " + child.affiliation );
        // console.info( "     symbolID: " + child.symbolID );
        // console.info( "     description: " + child.description );
        // console.info( "     tagName: " + child.tag );
    } );
    this.recordUserAction( "createUnit" );
}

this.createLayer = function( layer ) {

    var layerDef = {
        "extends": "tdgLayer.vwf",
        "properties": {
            "visible": true
        },
        "children": {
            "units": {
                "extends": "http://vwf.example.com/kinetic/group.vwf",
                "properties": {
                    "visible": 'inherit'
                }
            },
            "lines": {
                "extends": "http://vwf.example.com/kinetic/group.vwf",
                "properties": {
                    "visible": 'inherit'
                }
            }
        }    
    };  

    this.instructor.children.create( layer, layerDef, function( child ) {} );
}

this.deleteLayer = function( layer ) {

    if ( this.instructor[ layer ] !== undefined ) {
        this.instructor.children.delete( this.instructor[ layer ] );
    }
}

this.deleteUnit = function( layerName, unitName ) {

    var parent = this.find( "//instructor//" + layerName );
    if ( parent ) {
        var unit = this.find( "//instructor//" + layerName + "//units//" + unitName );    
        if ( unit ) {
            parent.children.delete( unit );
        }
    }

}

this.recordUserAction = function( action ) {
    
    // We are about to invalidate all user actions after the one that is being recorded now.
    // If the last save refers to one of those actions, we must invalidate it, too.
    if ( this.lastSaveIndex > this.userActionIndex ) {
        this.lastSaveIndex = null;
    }

    // Increment the userActionIndex and place the new action at that index in the user action 
    // array
    this.userActionIndex++;
    this.userActionStack[ this.userActionIndex ] = action;

    // Invalidate all user actions after the one that is being recorded now
    this.userActionStack = this.userActionStack.slice( 0, this.userActionIndex + 1 );
}

this.recordSave = function() {
    this.lastSaveIndex = this.userActionIndex;
}

this.clearLines = function( layer ) {
    
    if ( layer !== undefined ) {
        var lines = this.instructor[ layer ].lines;
        for ( var i = lines.children.length - 1; i >= 0; i-- ) {
            lines.children.delete( lines.children[ i ] );
        }
    } else {
        for ( var i = 0; i < this.instructor.children.length; i++ ) {
            if ( this.instructor.children[ i ].lines !== undefined ) {
                this.clearLines( this.instructor.children[ i ].name );
            }
        }
    }

}

this.clearUnits = function( layer ) {

    if ( layer !== undefined ) {
        var units = this.instructor[ layer ].units;
        for ( var i = units.children.length - 1; i >= 0; i-- ) {
            units.children.delete( units.children[ i ] );
        }        
    } else {
        for ( var i = 0; i < this.instructor.children.length; i++ ) {
            if ( this.instructor.children[ i ].units !== undefined ) {
                this.clearUnits( this.instructor.children[ i ].name );
            }
        }        
    }
}

this.clearUserActions = function() {
    this.userActionStack = [];
    this.userActionIndex = -1;
    this.lastSaveIndex = -1;
}

//@ sourceURL=index-model.js