var libpath = require( 'path' ),
    http = require( 'http' ),
    fs = require( 'fs' ),
    url = require( 'url' ),
    sio = require( 'socket.io' ),
    reflector = require( './lib/nodejs/reflector' ),
    vwf = require( './lib/nodejs/vwf' );

// Basic error handler.
global.error = function () {
    var red, brown, reset;
		red   = '\u001b[31m';
		brown = '\u001b[33m';
		reset = '\u001b[0m';

    var args = Array.prototype.slice.call( arguments );
    args[ 0 ] = red + args[ 0 ] + reset;
    var level = args.splice( args.length - 1 )[ 0 ];
	
    if ( !isNaN( parseInt( level ) ) ) {
        level = parseInt( level );
    } else {
        args.push( level )
        level = 1;
    };

    if ( level <= global.logLevel ) {
        console.log.apply( this, args );
    }
};

// Basic logging function.
global.log = function () {
    var args = Array.prototype.slice.call( arguments );
    var level = args.splice( args.length - 1 )[ 0 ];

    if ( !isNaN( parseInt( level ) ) ) {
        level = parseInt( level );
    } else {
        args.push( level )
        level = 1;
    };

    if ( level <= global.logLevel ) {
        console.log.apply( this, args );
    }
};

//Start the VWF server
function startVWF() {
    global.activeinstances = [];
    global.vwfRoot = process.env.HOME + "/.vwf/";

    function OnRequest( request, response ) {
        try {
            vwf.Serve( request, response );
        } catch ( e ) {
            response.writeHead( 500, {
                "Content-Type": "text/plain"
            } );
            response.write( e.toString(), "utf8" );
            response.end();
        }
    } // close onRequest

    //create the server
    var red, brown, reset;
    red   = '\u001b[31m';
    brown = '\u001b[33m';
    reset = '\u001b[0m';

    //start the DAL
    var pIndex = process.argv.indexOf( '-p' );
    var port = ( pIndex >= 0 ? parseInt( process.argv[ pIndex + 1 ] ) : 3000 );
		
    var lIndex = process.argv.indexOf( '-l' );
    global.logLevel = ( lIndex >= 0 ? process.argv[ lIndex + 1 ] : 1 );
    global.log( brown + 'LogLevel = ' +  global.logLevel + reset, 0 );	

    p = process.argv.indexOf( '-nocache' );
    if ( p >= 0 ) {
        FileCache.enabled = false;
        console.log( 'server cache disabled' );
    }

    // Set the root directory where applications will be served from. Default
    // to the current directory if none is specified.
    // Use --applicationPath or -a to specify an alternative path.
    var argv = require('optimist').argv;
    if ( argv.applicationPath || argv.a ) {
        var applicationPath = argv.applicationPath || argv.a;

        if ( fs.existsSync( applicationPath ) && fs.statSync( applicationPath ).isDirectory() ) {
            console.log( brown + applicationPath + " is a directory!" + reset );
            global.applicationRoot = applicationPath;
        } else {
            console.log( red + applicationPath + " is NOT a directory!" + reset );
        }
    }

    var srv = http.createServer( OnRequest ).listen( port );
    global.log( brown + 'Serving on port ' + port + reset, 0 );

    //create socket server
    var socketManager = sio.listen( srv, { log: false } );
    socketManager.set( 'transports', [ 'websocket' ] );
    socketManager.sockets.on( 'connection', reflector.OnConnection );
}

exports.startVWF = startVWF;