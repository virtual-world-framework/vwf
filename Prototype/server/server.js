var http = require( "http" ),
    path = require( "path" ),
    io = require( "./modules/socket.io" ),
    paperboy = require( "./modules/node-paperboy/lib/paperboy" );

var server = http.createServer( function( request, response ) {

    paperboy.

        deliver( path.join( path.dirname( __filename ), "../client" ), request, response ).

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

server.listen( 8003 );

var socket = io.listen( server, { flashPolicyServer: false, log: null } ); 

socket.on( "connection", function( client ) {
    client.on( "connect", function() { console.log( "(server) Connection from " + client.sessionId ) } );
    client.on( "message", function( message ) { console.log( "(server) Message from " +  + client.sessionId + " : " + message ); socket.broadcast( message ); } );
    client.on( "disconnect", function() { console.log( "(server) Disconnection by " + client.sessionId ) } );
} );




// 
// var server = require('./lib/node-router').getServer();
// 
// server.get("/json", function (req, res, match) {
//   return {hello: "World"};
// });
// 
// server.get(new RegExp("^/(.*)$"), function hello(req, res, match) {
//   return "Hello " + (match || "World") + "!";
// });
// 
// 
// server.listen(8080);
