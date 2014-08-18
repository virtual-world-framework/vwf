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

    console.info( "clientJoin( "+moniker+" ) =====================" )

    // mirrors the initial state of the toolbar
    if ( !this.isValid( this.drawing_clients ) ) {
        this.drawing_clients = {};
    }
    if ( this.drawing_clients[ moniker ] === undefined ) {
        this.drawing_clients[ moniker ] = {  
            "drawing_mode": 'none',
            "drawing_visible": 'inherit',
            "drawing_color": 'red',
            "drawing_width": 4,
            "drawing_parentPath": '//',
            "drawing_opacity": 0.4,
            "nameIndex": 1
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


this.pointerDown = function( eventData, nodeData ) {
    
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
    var section = "//shapes";

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

        case "line":
        case "freeDraw":
            section = "//lines";
            compExtends = "http://vwf.example.com/kinetic/line.vwf";
            break;

        case 'none':
        default:
            break;

    }

    if ( compExtends !== undefined ) {
        privateState.initialDownPoint = eventData.layer;
        var parents = this.find( userState.drawing_parentPath + section );
        var parent = parents.length > 0 ? parents[ 0 ] : this;
        var shapeDef = {
            "extends": compExtends,
            "properties": {
                "visible": false,
                "position": eventData.layer,
                "fill": userState.drawing_color,
                "opacity": userState.drawing_opacity
            }
        };
        var self = this;
        var selfMoniker = this.client;
        var name = drawingMode + userState.nameIndex;
        userState.nameIndex++;
        parent.children.create( name, shapeDef, function( child ) {
            //console.info( "Child created name: " + child.name + "    " + child.id );
            self.drawing_private[ selfMoniker ].drawingObject = child;
        } ); 
    }

};

this.pointerMove = function( eventData, nodeData ) {

    if ( !this.isValid( this.drawing_clients ) || !this.isValid( this.drawing_clients[ this.client ] ) ) {
        this.clientJoin( this.client );
    } 
    if ( this.drawing_private === undefined || this.drawing_private[ this.client ] === undefined ) {
        this.setUpPrivate( this.client );
    }

    this.update( eventData, nodeData );

};

this.pointerUp = function( eventData, nodeData ) {

    if ( this.drawing_private[ this.client ] !== undefined && this.drawing_private[ this.client ].drawingObject !== null  ) {
        var drawingObject = this.drawing_private[ this.client ].drawingObject;
        this.update( eventData, nodeData );
        this.shapeCreated( drawingObject.id );
        this.drawing_private[ this.client ].drawingObject = null;
    }

}; 

this.update = function( eventData, nodeData ) {
    
    if ( this.drawing_private === undefined || this.drawing_private[ this.client ] === undefined || !this.isValid( this.drawing_clients ) ) {
        return;
    }

    if ( this.drawing_private[ this.client ].drawingObject !== null ) {
        
        var userState = this.drawing_clients[ this.client ];        
        var privateState = this.drawing_private[ this.client ];
        var drawingObject = privateState.drawingObject;

        if ( drawingObject.visible !== userState.drawing_visible ) {
            drawingObject.visible = userState.drawing_visible;
        }
        var diffX = eventData.layer[ 0 ] - privateState.initialDownPoint[ 0 ];
        var diffY = eventData.layer[ 1 ] - privateState.initialDownPoint[ 1 ];
        var pos = [ privateState.initialDownPoint[ 0 ], privateState.initialDownPoint[ 1 ] ];
        var width = diffX;  
        var height = diffY;
        var dist = Math.sqrt( ( diffX * diffX ) + ( diffY * diffY ) );

        switch ( userState.drawing_mode ) {

            case "line":
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

        switch ( userState.drawing_mode ) {
            
            case "arc":
                radius = dist;
                drawingObject.angle = 30;
                drawingObject.innerRadius = dist - this.drawing_width;
                drawingObject.outerRadius = dist;
                break;


            case "ellipse":         
            case "circle":
                drawingObject.radius = dist;
                break;

            case "line":
                drawingObject.stroke = userState.drawing_color;
                drawingObject.strokeWidth = userState.drawing_width;
                drawingObject.points = [ 0, 0, eventData.layer[ 0 ] - drawingObject.x, eventData.layer[ 1 ] - drawingObject.y ];
                break;

            case "freeDraw":
                drawingObject.stroke = userState.drawing_color;
                drawingObject.strokeWidth = userState.drawing_width;
                if ( drawingObject.points === undefined || drawingObject.points.length === 0 ) {
                    drawingObject.points = [ 0, 0, eventData.layer[ 0 ] - drawingObject.x, eventData.layer[ 1 ] - drawingObject.y ];
                } else  {
                    drawingObject.points.push( eventData.layer[ 0 ] - drawingObject.x );
                    drawingObject.points.push( eventData.layer[ 1 ] - drawingObject.y );
                }
                break;

            case "regularPolygon":
                // needs defining
                break;

            case "ring":
                drawingObject.innerRadius = dist - userState.drawing_width;
                drawingObject.outerRadius = dist;
                break;

            case "star":
                radius = dist
                drawingObject.points = 5;
                drawingObject.innerRadius = dist * 60;
                drawingObject.outerRadius = dist;
                break;

            case "wedge":
                // needs defining
                break;

            case "text":
            case "sprite":
            case "image":
            case "rect":
            default:
                break;

        }


    }   
}; //@ sourceURL=kinetic_drawing.js
