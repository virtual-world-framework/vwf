var http = require( "http" ),
    io = require( "./socket.io" ),
    path = require( "path" ),
    paperboy = require( "./node-paperboy/lib/paperboy" );

var server = http.createServer( function( request, response ) {

    paperboy.

        deliver( path.join( path.dirname(__filename), "public" ), request, response ).

        error(function(statCode, msg) {
          response.writeHead(statCode, {'Content-Type': 'text/plain'});
          response.end("Error " + statCode);
          console.log( statCode + ' - ' + request.url + ' - ' + request.connection.remoteAddress + ( msg ? ' - ' + msg : "" ) );
        }).

        otherwise( function( error ) {
            response.writeHead( 200, { "Content-Type": "text/html" } );
            response.write( "<h1>Hello world</h1>" );
            response.end();
        } );
} );

server.listen( 8080 );

var socket = io.listen( server, { flashPolicyServer: false, log: null } ); 

socket.on( "connection", function( client ) {
    client.on( "connect", function() { console.log( "(server) Connection from " + client.sessionId ) } );
    client.on( "message", function( message ) { console.log( "(server) Message from " +  + client.sessionId + " : " + message ); socket.broadcast( "0 " + message ); } );
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
