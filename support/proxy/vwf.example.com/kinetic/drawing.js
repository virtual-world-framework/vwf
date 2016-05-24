this.initialize = function() {
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
            "drawing_opacity": 1.0,
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
};

