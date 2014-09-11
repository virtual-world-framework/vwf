

this.initialize = function() {
    this.editMode = "createUnit";
    this.future(0).clientsChanged();
}

this.clientsChanged = function() {
    
    var clients = this.find( "doc('http://vwf.example.com/clients.vwf')" )[0];

    if ( clients !== undefined ) {
        
        clients.children.added = clients.events.add( function( index, child ) {
            //this.clientJoin( this.moniker );
        }, this );

        clients.children.removed = clients.events.add( function( index, child ) {
            //this.clientLeave( this.moniker );   
        }, this );

    }

};

this.addStudent = function( name ) {

    var studentDef = {  
        "extends": "http://vwf.example.com/kinetic/layer.vwf",
        "children": {
            "baseLayer": {
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
                    "shapes": {
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
            }
        }
    }
}


this.createUnit = function( layer, name, unit, location, affiliation, echelon, unitModifiers ) {

    //console.info( "createUnit( "+layer+", "+name+", unit, "+location+", "+affiliation+" )" );

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

    var img;
    if ( unit.image.length > 0 ) {
        img = unit.image[ affiliation ];
    } else {
        img = unit.image;
    }

    // location is with respect to the window, not the stage (this), so we must
    // subtract the stage position from location to get the proper relative location
    // Also, the unit's (0,0) point is at the upper left-hand corner of the icon, so to
    // get the center of the icon to appaer where the user clicks, we must subtract
    // half of the unit's size from both x and y
    var x = location[ 0 ] - this.x - ( 0.5 * this.unitSize );
    var y = location[ 1 ] - this.y - ( 0.5 * this.unitSize );
    
    var mods = {
        "extends": "modifier.vwf",
        "properties": {
            "pixelSize": 60,
            "icon": false
        }
    };

    var groupDef = {
        "extends": "unitGroup.vwf",
        "properties": {
            "x": x,
            "y": y,
            "visible": 'inherit',
            "draggable": true,
            "threatShape": 'circle',
        },
        "children": {
            "icon": {
                "extends": "unitIcon.vwf", 
                "properties": {
                    "fillPatternImage": unit.image[ affiliation ],
                    "visible": 'inherit',
                    "draggable": false,
                    "x": 0,
                    "y": 0,
                    "width": 32,
                    "height": 32,
                    "zIndex": 4
                },
                "children": {
                    "imageGenerator": {
                        "extends": "unit.vwf",
                        "properties": {
                            "location": location,
                            "affiliation": affiliation,
                            "echelon": echelon,
                            "image": img,
                            "symbolID": unit.symbolID,
                            "description": unit.description,
                            "tagName": unit.tag
                        },
                        "children": {
                            "modifier": mods
                        }
                    }
                }
            },
            "threatArea": {
                "extends": "http://vwf.example.com/kinetic/circle.vwf",
                "properties": {
                    "x": 16,
                    "y": 16,
                    "visible": false,
                    "radius": 32,
                    "opacity": 0.3,
                    "fill": color,
                    "fillEnabled": true, 
                    "draggable": false,
                    "zIndex": 2
                }
            }
        }    
    };   
    
    for ( var prop in unitModifiers ) {
        if ( unitModifiers[ prop ] != undefined ) {
            mods.properties[ prop ] = unitModifiers[ prop ];
        }
    }
    
    this.instructor[ layer ].units.children.create( name, groupDef, function( child ) {
        
        // wouldn't it be great if you could call method here??
        //child.icon.imageGenerator.render();
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
            "shapes": {
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

this.deleteLayer = function( layerName ) {

    var layer = this.find( "//instructor//" + layerName )[ 0 ]; 
    if ( layer ) {
        this.instructor.children.delete( layer );
    }

}

this.deleteUnit = function( nodeID, layerName, unitName ) {

    var parents = this.find( "//instructor//" + layerName );
    if ( parents.length > 0 ) {
        var units = this.find( "//instructor//" + layerName + "//units//" + unitName );    
        if ( units.length > 0 ) {
            parents[ 0 ].units.children.delete( units[ 0 ] );
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

this.deleteChildren = function( node ) {
    for ( var i = node.children.length - 1; i >= 0; i-- ) {
        node.children.delete( node.children[ i ] );
    }     
}

this.clearObjects = function( user, layerName, type ) {

    if ( this[ user ] !== undefined ) {
        var user = this[ user ];
        if ( layerName === undefined ) {
            deleteChildren( user[ layerName ] );
        } else {
            if ( user[ layerName ] !== undefined ) {
                deleteChildren( user[ layerName ][ type ] );
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