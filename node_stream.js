var path = require( 'path' ),
    mime = require( 'mime' ),
    http = require( 'http' ),
    https = require( 'https' ),
    fs = require( 'fs' ),
    url = require( 'url' ),
    argv = require('optimist').argv,
    os = require("os");

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


//Start the streaming server
function startStreamingServer() {

    function OnStreamRequest( request, response ) {
        var streamingFilePath = request.url;
        if ( streamingFilePath && streamingFilePath !== '' ) {
            var file = path.join( __dirname, streamingFilePath );
            var m = mime.lookup( file );
            if ( m.substring( 0, 5 ) ===  "image" ) {
                var img = fs.readFileSync(file);
                response.writeHead(200, {'Content-Type': m });
                response.end(img, 'binary');
            } else {
                var range = request.headers.range;
                if ( range ) {
                    var positions = range.replace(/bytes=/, "").split("-");
                    var start = parseInt(positions[0], 10);

                    fs.stat( file, function( err, stats ) {
                        if ( stats ) {
                            var total = stats.size;
                            var end = positions[1] ? parseInt( positions[1], 10 ) : total - 1;
                            var chunksize = (end - start) + 1;

                            response.writeHead( 206, {
                                "Content-Range": "bytes " + start + "-" + end + "/" + total,
                                "Accept-Ranges": "bytes",
                                "Content-Length": chunksize,
                                "Content-Type": m
                            });

                            var stream = fs.createReadStream( file, { start: start, end: end } )
                            .on( "open", function() {
                                stream.pipe( response );
                            }).on( "error", function( error ) {
                                response.end( error );
                            });
                        }
                    });
                }
            }
        } else {
            response.end('');
        }
    } //close OnStreamRequest

    var domain = os.hostname();
    var ssl = ( argv.s  || argv.ssl );
    var sslOptions = {
        key: ( ( argv.k || argv.key ) ? fs.readFileSync( argv.k || argv.key ) : undefined ),
        cert: ( ( argv.c || argv.cert ) ? fs.readFileSync( argv.c || argv.cert ) : undefined )
    };

    //create the server
    var streamPort = 8088;
    var vSrv = ssl ? https.createServer( sslOptions, OnStreamRequest ).listen( streamPort ) : http.createServer( OnStreamRequest ).listen( streamPort );
    consoleNotice( 'Streaming on port ' + streamPort );
}



exports.startStreamingServer = startStreamingServer;