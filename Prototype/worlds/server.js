var http = require( "http" ),
    path = require( "path" ),
    paperboy = require( "./modules/node-paperboy/lib/paperboy" );

var server = http.createServer( function( request, response ) {

    paperboy.

        deliver( path.join( path.dirname( __filename ), "public" ), request, response ).

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

server.listen( 8081 );
