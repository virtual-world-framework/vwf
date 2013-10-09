var libpath = require( 'path' ),
    http = require( 'http' ),
    fs = require( 'fs' ),
    url = require( 'url' ),
    sio = require( 'socket.io' ),
    reflector = require( './lib/nodejs/reflector' ),
    vwf = require( './lib/nodejs/vwf' );

    


// Basic error handler.
global.error = function ( ) {
    var red, brown, reset;
		red   = '\u001b[31m';
		brown  = '\u001b[33m';
		reset = '\u001b[0m';

    var args = Array.prototype.slice.call( arguments );
    args[ 0 ] = red + args[ 0 ] + reset;
    var level = args.splice( args.length - 1 )[ 0 ];
	
    if ( !isNaN( parseInt( level ) ) ) {
        level = parseInt( level );
    }
    else {
        args.push( level )
        level = 1;
    };

    if ( level <= global.logLevel ) {
        console.log.apply( this, args );
    }
};

// Basic logging function.
global.log = function ( ) {
    var args = Array.prototype.slice.call( arguments );
    var level = args.splice( args.length - 1 )[ 0 ];

    if ( !isNaN( parseInt( level ) ) ) {
        level = parseInt( level );
    }
    else {
        args.push( level )
        level = 1;
    };

    if ( level <= global.logLevel ) {
        console.log.apply( this, args );
    }
};






//Start the VWF server
function startVWF( ) {
    global.activeinstances = [ ];
    function OnRequest( request, response ) {
        try{
            vwf.Serve( request, response );
        }
        catch ( e ) {
            response.writeHead( 500, {
                "Content-Type": "text/plain"
            } );
            response.write( e.toString( ), "utf8" );
            response.end( );
        }
    } // close onRequest



    //create the server

    var red, brown, reset;
    red   = '\u001b[31m';
    brown  = '\u001b[33m';
    reset = '\u001b[0m';

    //start the DAL
    var p = process.argv.indexOf( '-p' );
    var port = p >= 0 ? parseInt( process.argv[ p + 1 ] ) : 3000;
		
    p = process.argv.indexOf( '-d' );
    var datapath = p >= 0 ? process.argv[ p + 1 ] : "C:\\VWFData";
		
    p = process.argv.indexOf( '-l' );
    global.logLevel = p >= 0 ? process.argv[ p + 1 ] : 1;
    global.log( brown + 'LogLevel = ' +  global.logLevel + reset, 0 );	


    p = process.argv.indexOf( '-nocache' );
    if ( p >= 0 ) {
        FileCache.enabled = false;
        console.log('server cache disabled');
    }

    var srv = http.createServer( OnRequest ).listen( port );
    global.log( brown + 'Serving on port ' + port + reset, 0 );


    //create socket server
    var socketManager = sio.listen( srv, { log: false } );
    socketManager.set( 'transports', [ 'websocket' ] );
    socketManager.sockets.on( 'connection', reflector.OnConnection );
}

exports.startVWF = startVWF;