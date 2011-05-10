var http = require( "http" ),
    path = require( "path" ),
    io = require( "./modules/socket.io" ),
    paperboy = require( "./modules/node-paperboy/lib/paperboy" );

var server = http.createServer( function( request, response ) {

    paperboy.

        deliver( path.join( path.dirname( __filename ), "../client2" ), request, response ).

        otherwise( function( error ) {
            response.writeHead( 200, { "Content-Type": "text/html" } );
            response.write( "<h1>Hello world</h1>" );
            response.end();
        } ).

        error( function( status, message ) {
            response.writeHead( status, { "Content-Type": "text/plain" } );
            response.end( "Error " + status );
            console.log( status + ' - ' + request.url + ' - ' + request.connection.remoteAddress + ( message ? ' - ' + message : "" ) );
        } );

} );

server.listen( 8001 );

var socket = io.listen( server, {

    flashPolicyServer: false,
    log: null,

    // Increase the timeout due to client starvation while loading the scene. The client timeout
    // must also be increased.

    transportOptions: {
        "websocket": { heartbeatInterval: 60000, timeout: 50000 },
        "flashsocket": { heartbeatInterval: 60000, timeout: 50000 },
        "htmlfile": { heartbeatInterval: 60000, timeout: 50000 },
        "xhr-multipart": { heartbeatInterval: 60000, timeout: 50000 },
        "xhr-polling": { heartbeatInterval: 60000, timeout: 50000 },
        "jsonp-polling": { heartbeatInterval: 60000, timeout: 50000 }
    }

} );

socket.on( "clientConnect", function( client ) {
    console.log( client.sessionId + " connected" );
} );

socket.on( "clientMessage", function( message, client ) {
    console.log( client.sessionId + " message: " + message );
    socket.broadcast( message );
} );

socket.on( "clientDisconnect", function( client ) {
    console.log( client.sessionId + " disconnected" );
} );


var currentTime = 0;

// setInterval( function() {
//     currentTime += 5000;
//     socket.broadcast( currentTime.toString() );
// }, 5000 );
