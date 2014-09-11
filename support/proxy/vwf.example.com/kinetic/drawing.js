this.initialize = function() {
    this.drawing_private = {};
    this.future(0).clientWatch();
};

this.clientWatch = function() {
    
    var clients = this.find( "doc('http://vwf.example.com/clients.vwf')" )[0];

    if ( clients !== undefined ) {
        
        clients.children.added = clients.events.add( function( index, child ) {
            this.clientJoin( this.moniker );
        }, this );

        clients.children.removed = clients.events.add( function( index, child ) {
            this.clientLeave( this.moniker );   
        }, this );

    }

};

this.isValid = function( obj ) {
    var objType = ( {} ).toString.call( obj ).match( /\s([a-zA-Z]+)/ )[ 1 ].toLowerCase();
    return ( objType != 'null' && objType != 'undefined' );
}; 

this.clientJoin = function( moniker ) {

    // mirrors the initial state of the toolbar
    if ( !this.isValid( this.drawing_clients ) ) {
        this.drawing_clients = {};
    }
    if ( this.drawing_clients[ moniker ] === undefined ) {
        this.drawing_clients[ moniker ] = {  
            "drawing_mode": 'none',
            "drawing_visible": 'inherit',
            "drawing_color": 'black',
            "drawing_width": 4,
            "drawing_parentPath": '/',
            "drawing_opacity": 0.4,
            "nameIndex": 1,
            "fontSize": 16,
            "angle": 30
        };
    }
    this.drawing_clients = this.drawing_clients;

};

this.clientLeave = function( moniker ) {
    if ( this.drawing_clients[ moniker ] !== undefined ) {
        delete this.drawing_clients[ moniker ]; 
        this.drawing_clients = this.drawing_clients;
    }
    if ( this.drawing_private[ moniker ] !== undefined ) {
        delete this.drawing_private[ moniker ]; 
    }
};

this.setUpPrivate = function( moniker ) {
    
    if ( this.drawing_private === undefined ) {
        this.drawing_private = {};
    }
    if ( this.drawing_private[ moniker ] === undefined ) {
        this.drawing_private[ moniker ] = {
            "drawingObject": null,
            "initialDownPoint": [ -1, -1 ],
            "previousPoint": [ -1, -1 ],
            "mouseDown": false
        };  
    }

};

this.setClientUIState = function( stateObj ) {

    //console.info( "setClientUIState " + JSON.stringify( stateObj ) );
    if ( stateObj !== undefined ) {
        if ( !this.isValid( this.drawing_clients ) || !this.isValid( this.drawing_clients[ this.client ] ) ) {
            this.clientJoin( this.client );
        } 
        var clients = this.drawing_clients;
        var userState = clients[ this.client ];
        for ( var property in stateObj ) {
            userState[ property ] = stateObj[ property ];       
        }
        this.drawing_clients = clients;
    }
};

this.down = function( eventData, nodeData, touch ) {

    if ( !this.isValid( this.drawing_clients ) || !this.isValid( this.drawing_clients[ this.client ] ) ) {
        this.clientJoin( this.client );
    } 
    if ( !this.isValid( this.drawing_private ) || !this.isValid( this.drawing_private[ this.client ] ) ) {
        this.setUpPrivate( this.client );
    }

    var userState = this.drawing_clients[ this.client ];
    var privateState = this.drawing_private[ this.client ];
    var drawingMode = userState.drawing_mode;

    if ( privateState.drawingObject !== null ) {
        return;
    }

    var compExtends = undefined;
    var groupExtends = undefined;
    var section = "/shapes";

    if ( drawingMode === "freeDraw" ) {
        section = "/lines";        
    }

    switch ( drawingMode ) {
        
        case "arc":
        case "circle":
        case "ellipse":
        case "image":
        case "regularPolygon":
        case "rect":
        case "ring":
        case "sprite":
        case "star":
        case "text":
        case "wedge":
            compExtends = "http://vwf.example.com/kinetic/"+drawingMode+".vwf"; 
            break;

        case "arrow":
            groupExtends = "http://vwf.example.com/kinetic/group.vwf";
            compExtends = { "line": "http://vwf.example.com/kinetic/line.vwf", "head": "http://vwf.example.com/kinetic/regularPolygon.vwf" };
            break;

        case "thickArrow":
            groupExtends = "http://vwf.example.com/kinetic/group.vwf";
            compExtends = { "line": "http://vwf.example.com/kinetic/line.vwf", "head": "http://vwf.example.com/kinetic/regularPolygon.vwf" };
            break;

        case "borderRect":
        case "line":
        case "freeDraw":
            compExtends = "http://vwf.example.com/kinetic/line.vwf";
            break;

        case 'none':
        default:
            break;

    }

    var getDefaultProperties = function( groupParent, eventPoint ) {
        var retObj = {
            "visible": 'inherit',
            "fill": userState.drawing_color,
            "opacity": userState.drawing_opacity,
            "z-index": 4
        };

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
        var parentPath = userState.drawing_parentPath + section ;
        var parents = this.find( parentPath );

        // find was failing 9/2/14, and the code below 
        // was a backup, going to leave this in until we feel good
        // about the issues we saw are no longer a problem        
        if ( parents === undefined ) {
            parents = [ this.findChild( this, parentPath.split( '/' ) ) ];
        }

        var parent = parents.length > 0 ? parents[ 0 ] : this;
        var groupDef = {
            "extends": groupExtends,
            "properties": {
                "visible": false,
                "position": eventPointDown                
            },
            "children": {}
        };

        for ( var def in compExtends ) {
            groupDef.children[ def ] = {
                "extends": compExtends[ def ],
                "properties": getDefaultProperties( true, eventPointDown )
            } 
        }

        var self = this;
        var selfMoniker = this.client;
        var name = drawingMode + this.drawing_index;
        this.drawing_index = this.drawing_index + 1;
        parent.children.create( name, groupDef, function( child ) {
            self.drawing_private[ selfMoniker ].drawingObject = child;
        } ); 

    } else if ( compExtends !== undefined ) {

        privateState.initialDownPoint = eventPointDown;
        var parentPath = userState.drawing_parentPath + section;
        var parents = this.find( parentPath );

        // find was failing 9/2/14, and the code below 
        // was a backup, going to leave this in until we feel good
        // about the issues we saw are no longer a problem
        if ( parents === undefined ) {
            parents = [ this.findChild( this, parentPath.split( '/' ) ) ];
        }
        
        var parent = parents.length > 0 ? parents[ 0 ] : this;
        var shapeDef = {
            "extends": compExtends,
            "properties": getDefaultProperties( false, eventPointDown )
        };

        var self = this;
        var selfMoniker = this.client;
        var name = drawingMode + this.drawing_index;
        this.drawing_index = this.drawing_index + 1;
        parent.children.create( name, shapeDef, function( child ) {
            self.drawing_private[ selfMoniker ].drawingObject = child;
        } );

    }
};

this.move = function( eventData, nodeData, touch ) {

    if ( !this.isValid( this.drawing_clients ) || !this.isValid( this.drawing_clients[ this.client ] ) ) {
        this.clientJoin( this.client );
    } 
    if ( this.drawing_private === undefined || this.drawing_private[ this.client ] === undefined ) {
        this.setUpPrivate( this.client );
    }

    this.update( eventData, nodeData, false );
};

this.up = function( eventData, nodeData, touch ) {

    if ( this.drawing_private[ this.client ] !== undefined && this.drawing_private[ this.client ].drawingObject !== null  ) {
        var drawingObject = this.drawing_private[ this.client ].drawingObject;
        this.update( eventData, nodeData, true );
        
        this.drawingObjectCreated( drawingObject.id );

        if ( this.moniker === this.client ) {
            var userState = this.drawing_clients[ this.client ]; 
            switch( userState.drawing_mode ) {
                
                case "text":
                    this.textCreated( drawingObject.id );
                    break;
                
                case "image":
                    this.imageCreated( drawingObject.id );
                    break;

            } 
        }

        this.drawing_private[ this.client ].drawingObject = null;
    }    
};

this.update = function( eventData, nodeData, upEvent ) {
    
    if ( this.drawing_private === undefined || this.drawing_private[ this.client ] === undefined || !this.isValid( this.drawing_clients ) ) {
        return;
    }

    if ( this.drawing_private[ this.client ].drawingObject !== null ) {
        
        var eventPoint = eventData.stageRelative;
        var userState = this.drawing_clients[ this.client ];        
        var privateState = this.drawing_private[ this.client ];
        var drawingObject = privateState.drawingObject;
        var pointAccepted = true;

        if ( drawingObject.visible !== userState.drawing_visible ) {
            drawingObject.visible = userState.drawing_visible;
        }
        var diffX = eventPoint[ 0 ] - privateState.initialDownPoint[ 0 ];
        var diffY = eventPoint[ 1 ] - privateState.initialDownPoint[ 1 ];
        var pos = [ privateState.initialDownPoint[ 0 ], privateState.initialDownPoint[ 1 ] ];
        var width = diffX;  
        var height = diffY;
        var dist = Math.sqrt( ( diffX * diffX ) + ( diffY * diffY ) );

        //console.info( "== "+userState.drawing_mode +" ==" );
        //console.info( "== pos: " + pos + "   diffX: " + diffX + "   diffY: " + diffY );

        // this keeps the pos as the top left corner for the 
        // rectangular objects
        switch ( userState.drawing_mode ) {

            case "line":
            case "arrow":
            case "thickArrow":
            case "freeDraw":
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
                drawingObject.position = pos;
                drawingObject.width = width;
                drawingObject.height = height;  
                break;          
        }

        //console.info( "== pos: " + pos + "   diffX: " + diffX + "   diffY: " + diffY );

        switch ( userState.drawing_mode ) {
            
            case "arc":
                drawingObject.angle = userState.angle ? userState.angle : 30;
                if ( dist > this.drawing_width ) {
                    drawingObject.innerRadius = dist - this.drawing_width;
                    drawingObject.outerRadius = dist;
                }
                break;

            case "ellipse":         
                drawingObject.radius = { "x": width * 0.5, "y": height * 0.5 };
                break;

            case "circle":
                drawingObject.radius = dist;
                break;

            case "line":
                drawingObject.stroke = userState.drawing_color;
                drawingObject.strokeWidth = userState.drawing_width;
                drawingObject.points = [ 0, 0, diffX, diffY ];
                break;

            case "freeDraw":
                drawingObject.stroke = userState.drawing_color;
                drawingObject.strokeWidth = userState.drawing_width;

                var isFirstStrokeOfNewLine = ( drawingObject.points.length === 0 );
                var posX = eventPoint[ 0 ] - drawingObject.x;
                var posY = eventPoint[ 1 ] - drawingObject.y;
                
                if ( isFirstStrokeOfNewLine ) {
                    if ( Math.abs( posX ) + Math.abs( posY ) > 0 ) {
                        drawingObject.points = [ 0, 0, posX, posY ];
                    } else {
                        pointAccepted = false;   
                    }
                } else  {
                    var dragDiff = [ 
                        posX - privateState.previousPoint[ 0 ], 
                        posY - privateState.previousPoint[ 1 ] 
                    ];

                    if ( Math.abs( dragDiff[0] ) + Math.abs( dragDiff[1] ) > 0 ) {
                        drawingObject.points.push( posX );
                        drawingObject.points.push( posY );                        
                    } else {
                        pointAccepted = false;    
                    }
                }
                break;

            case "regularPolygon":
                 // needs defining
                 break;

            case "ring":
                if ( dist > userState.drawing_width ) {
                    drawingObject.innerRadius = dist - userState.drawing_width;
                    drawingObject.outerRadius = dist;
                }
                break;

            case "star":
                drawingObject.points = 5;
                drawingObject.innerRadius = dist * 80;
                drawingObject.outerRadius = dist;
                break;

            case "wedge":
                // needs defining
                drawingObject.angle = userState.angle ? userState.angle : 30;
                drawingObject.radius = dist;
                drawingObject.clockwise = false;
                break;

            case "text":
                drawingObject.fontSize = userState.fontSize ? userState.fontSize : 16;
                break;

            case "borderRect":
                drawingObject.stroke = userState.drawing_color;
                drawingObject.strokeWidth = userState.drawing_width;
                drawingObject.points = [ 0, 0, width, 0, width, height, 0, height, 0, 0 ];
                break;

            case "arrow":
                drawingObject.x = drawingObject.position[ 0 ];
                drawingObject.y = drawingObject.position[ 1 ]; 

                drawingObject.line.stroke = userState.drawing_color;
                drawingObject.line.strokeWidth = userState.drawing_width;
                drawingObject.line.position = [ 0, 0 ];
                
                drawingObject.head.sides = 3;
                drawingObject.head.radius = userState.drawing_width * 3;

                var endPoint = goog.vec.Vec2.createFloat32FromValues( 0, 0 );
                var relativeXDiff = eventPoint[ 0 ] - drawingObject.x;
                var relativeYDiff = eventPoint[ 1 ] - drawingObject.y;
                var headOffset = ( userState.drawing_width * 3 ) * Math.sin( Math.PI / 6 );
                var dir = goog.vec.Vec2.createFloat32FromValues( relativeXDiff, relativeYDiff );
                var len = goog.vec.Vec2.distance( goog.vec.Vec2.createFloat32FromValues( 0, 0 ), dir );
                goog.vec.Vec2.normalize( dir, dir );

                drawingObject.head.rotation = Math.atan2( dir[1], dir[0] ) * ( 180 / Math.PI ) - 30;
                goog.vec.Vec2.scale( dir, len - ( userState.drawing_width * 3 ), endPoint );
                drawingObject.head.position = [ endPoint[0], endPoint[1] ];
                goog.vec.Vec2.scale( dir, len - ( ( userState.drawing_width * 3 ) + headOffset ), endPoint );
                drawingObject.line.points = [ 0, 0, endPoint[0], endPoint[1] ];
                break;
            
            case "thickArrow":
                drawingObject.x = drawingObject.position[ 0 ];
                drawingObject.y = drawingObject.position[ 1 ]; 

                drawingObject.line.stroke = userState.drawing_color;
                drawingObject.line.strokeWidth = userState.drawing_width * 8;
                drawingObject.line.position = [ 0, 0 ];
                
                drawingObject.head.sides = 3;
                drawingObject.head.radius = userState.drawing_width * 8;

                var endPoint = goog.vec.Vec2.createFloat32FromValues( 0, 0 );
                var relativeXDiff = eventPoint[ 0 ] - drawingObject.x;
                var relativeYDiff = eventPoint[ 1 ] - drawingObject.y;
                var headOffset = ( userState.drawing_width * 8 ) * Math.sin( Math.PI / 6 );
                var dir = goog.vec.Vec2.createFloat32FromValues( relativeXDiff, relativeYDiff );
                var len = goog.vec.Vec2.distance( goog.vec.Vec2.createFloat32FromValues( 0, 0 ), dir );
                goog.vec.Vec2.normalize( dir, dir );

                drawingObject.head.rotation = Math.atan2( dir[1], dir[0] ) * ( 180 / Math.PI ) - 30;
                goog.vec.Vec2.scale( dir, len - ( userState.drawing_width * 8 ), endPoint );
                drawingObject.head.position = [ endPoint[0], endPoint[1] ];
                goog.vec.Vec2.scale( dir, len - ( ( userState.drawing_width * 8 ) + headOffset ), endPoint );
                drawingObject.line.points = [ 0, 0, endPoint[0], endPoint[1] ];
                break; 

            case "sprite":
            case "image":
            case "rect":
            default:
                break;

        }

        if ( pointAccepted ) {
            privateState.previousPoint = eventPoint;
        }

    }   
}; 

this.pointerDown = function( eventData, nodeData ) {
    this.down( eventData, nodeData, false );    
};

this.pointerMove = function( eventData, nodeData ) {
    this.move( eventData, nodeData, false );
};

this.pointerUp = function( eventData, nodeData ) {
    this.up( eventData, nodeData, false );
}; 

this.touchStart = function( eventData, nodeData ) {
    this.down( eventData, nodeData, true );    
};

this.touchMove = function( eventData, nodeData ) {
    this.move( eventData, nodeData, true );
};

this.touchEnd = function( eventData, nodeData ) {
    this.up( eventData, nodeData, true );
}; 

this.findChild = function( parent, names ) {
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

//@ sourceURL=kinetic_drawing.js
