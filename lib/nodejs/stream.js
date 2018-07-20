var path = require( 'path' ),
    mime = require( 'mime' ),
    fs = require( 'fs' ),
    helpers = require( './helpers' ),
    util = require('util'),
    formidable = require('formidable'),
    os = require('os'),
    parseurl = require( './parse-url' ),
    AdmZip = require( 'adm-zip' );
var streamStr = 'stream', uploadStr = 'upload';

function OnStreamRequest( request, response, parsedRequest, segments ) {
    if ( request.url !== '' && segments.length > 1 ) {
        var file = path.join(__dirname, '../..');
        for (var i = 1; i < segments.length; i++) {
            file = path.join( file, segments[i] );
        }
        var m = mime.lookup( file );
        if ( m.substring( 0, 5 ) ===  "image" ) {
            fs.readFile( file, ( err, img ) => {
                if ( err ) {
                    if ( err.code === "ENOENT" ) {
                        response.status( 404 ).send( file + " not found" );
                    } else {
                        throw err;
                    }
                } else {
                    response.writeHead( 200, { 'Content-Type': m } );
                    response.end( img, 'binary' );
                }
            } );
        } else {
            fs.stat( file, ( err, stats ) => {
                if ( err ) {
                    response.sendStatus( 404 );
                    return;
                }

                const total = stats.size;
                if ( total > 0 ) {
                    const range = request.headers.range || "bytes=0-";
                    const positions = range.replace( /bytes=/, "" ).split( "-" );
                    const start = parseInt( positions[ 0 ], 10 );
                    const end = positions[1] ? parseInt( positions[1], 10 ) : total - 1;
                    response.writeHead( 206, {
                        "Content-Range": "bytes " + start + "-" + end + "/" + total,
                        "Accept-Ranges": "bytes",
                        "Content-Length": end - start + 1,
                        "Content-Type": m
                    } );
                    const stream =
                        fs.createReadStream( file, { start: start, end: end } ).
                            on( "open", () => stream.pipe( response ) ).
                            on( "error", error => response.end( error ) );
                } else {
                    response.writeHead( 206, {
                        "Content-Range": "bytes */0",
                        "Accept-Ranges": "bytes",
                        "Content-Length": 0,
                        "Content-Type": m
                    } );
                    response.end();
                }
            } );
        }
    } else {
        response.end('');
    }
} //close OnStreamRequest


function HandlePersistenceUpload( request, response, parsedRequest, segments ) {
    if ( segments.length >= 2 ) {
        var streamPath;
        var form = new formidable.IncomingForm();
        form.keepExtensions = true;
        // create the path in file system if not there
        var relPath = parsedRequest[ 'public_path' ];
        for (var i = 1; i < segments.length; i++) {
            var relPath = helpers.JoinPath( relPath, segments[i] );
        }
        CreateDirectory( relPath );
        form.on('fileBegin', function(name, file) {
            // redirect file to the specified path
            var filename = file.name.replace(/\s+/g, '_');
            file.path = helpers.JoinPath( './documents', relPath, filename);
            streamPath = helpers.JoinPath(streamStr, 'documents', relPath, filename);
        });
        // parse the file and then send response
        form.parse(request, function(err, fields, files) {
            if ( ! err ) {

                // If this is a .zip file, unzip it first
                if ( streamPath.endsWith( ".zip" ) ) {
                    var zip = new AdmZip( files.file.path );
                    zip.extractAllTo( helpers.JoinPath( './documents', relPath ) );
                    streamPath = streamPath.substring( 0, streamPath.indexOf( ".zip" ) );
                }
                response.writeHead(200, {'content-type': 'text/plain'});
                response.end(streamPath);
            } else {
                console.log("Error parsing file: " + err);
                response.writeHead(500);
                response.end();
            }
        });
        return true;
    }
    return false;
} // close HandlePersistenceUpload

function CreateDirectory( relPath ) {
    var application_segments = helpers.GenerateSegments( relPath );
    var current_directory = "./documents";
    while ( application_segments.length > 0 ) {
        current_directory = helpers.JoinPath( current_directory, application_segments.shift() );
        if ( ! helpers.IsDirectory( current_directory ) ) {
            fs.mkdirSync( current_directory );
        }
    }
}


// The Serve function takes the nodeJS request, nodeJS response and the parsedRequest, and
// attempts to see if it is a properly formed stream related request.
function Serve( request, response, parsedRequest ) {
    if ( parsedRequest[ 'private_path' ] ) {
        var segments = helpers.GenerateSegments( parsedRequest[ 'private_path' ] );
        if ( segments.length > 0 ) {
            switch ( segments[ 0 ] ) {
                case uploadStr:
                    if ( request.method == "POST" ) {
                        var result = HandlePersistenceUpload( request, response, parsedRequest, segments );
                        return result;
                     }
                     return false;
                case streamStr:
                    if ( request.method == "GET" ) {
                        OnStreamRequest( request, response, parsedRequest, segments );
                        return true;
                    }
                    return false;
            }
        }
    }
    return false;
}
exports.Serve = Serve;