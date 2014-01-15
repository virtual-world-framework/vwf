var path = require( 'path' ),
    http = require( 'http' ),
    https = require( 'https' ),
    fs = require( 'fs' ),
    url = require( 'url' ),
    sio = require( 'socket.io' ),
    reflector = require( './lib/nodejs/reflector' ),
    vwf = require( './lib/nodejs/vwf' ),
    argv = require('optimist').argv;

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

function consoleNotice( string ) {
    var brown = '\u001b[33m';
    var reset = '\u001b[0m';
    global.log( brown + string + reset );
}

function consoleError( string ) {
    var red   = '\u001b[31m';
    var reset = '\u001b[0m';
    global.log( red + string + reset );
}

// Set the root directory where applications will be served from. Default
// to the current directory if none is specified.
// Use --applicationPath or -a to specify an alternative path.
function parseApplicationPath () {

    if ( argv.applicationPath || argv.a ) {

        var applicationPath = argv.applicationPath || argv.a;

        if ( fs.existsSync( applicationPath ) && fs.statSync( applicationPath ).isDirectory() ) {
            consoleNotice( "Serving VWF applications from " + applicationPath );
            return applicationPath;
        } else {
            consoleError ( applicationPath + " is NOT a directory! Serving VWF applications from " + process.cwd() );
            return process.cwd();
        }

    } else {
        consoleNotice( "Serving VWF applications from " + process.cwd() );
        return process.cwd();
    }
}

//Start the VWF server
function startVWF() {
    global.instances = {};

    if ( !global.vwfRoot ) {
        // Should not hit this path since the VWF script checks for the existence
        // of the VWF support files before running this script.
        consoleError("Exiting.");
        process.exit();
    }

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
    brown = '\u001b[33m';
    red   = '\u001b[31m';
    reset = '\u001b[0m';

    //start the DAL
    var port = ( argv.p ? parseInt( argv.p ) : 3000 );
        
    global.logLevel = ( argv.l ? argv.l : 1 );
    global.log( brown + 'LogLevel = ' +  global.logLevel + reset, 0 );  

    if ( argv.nocache ) {
        FileCache.enabled = false;
        console.log( 'server cache disabled' );
    }

    global.applicationRoot = parseApplicationPath();

    var sslOptions = {
        key: argv.key ? fs.readFileSync( argv.key ) : undefined,
        cert: argv.cert ? fs.readFileSync( argv.cert ) : undefined
    };

    var srv = argv.ssl ? https.createServer( sslOptions, OnRequest ).listen( port ) : http.createServer( OnRequest ).listen( port );
    global.log( brown + 'Serving on port ' + port + reset, 0 );

    //create socket server
    var socketManager = sio.listen( srv, { 
        log: false,
        resource: {
            exec: function( url ) {
                var match = /\/1\/\?t=\d*/.exec( url ) || /\/1\/websocket/.exec( url );
                if (match) {
                    return [url.substring(0, url.indexOf(match[0]))];
                } else {
                    return null;
                }
            }
        } 
    } );
    socketManager.set( 'transports', [ 'websocket' ] );
    socketManager.sockets.on( 'connection', reflector.OnConnection );
}

exports.startVWF = startVWF;
