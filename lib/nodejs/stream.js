var path = require( 'path' ),
    mime = require( 'mime' ),
    fs = require( 'fs' ),
	helpers = require( './helpers' ),
    util = require('util'),
    formidable = require('formidable'),
	os = require('os'),
    parseurl = require( './parse-url' );
var streamStr = 'stream', uploadStr = 'upload';

function OnStreamRequest( request, response, parsedRequest, segments ) {
	if ( request.url !== '' && segments.length > 1 ) {
        var file = path.join(__dirname, '../..');
        for (var i = 1; i < segments.length; i++) {
            file = path.join( file, segments[i] );
        }
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


function HandlePersistenceUpload( request, response, parsedRequest, segments ) {
    if ( segments.length >= 2 ) {
	    var streamUrl;
        var form = new formidable.IncomingForm();
        form.keepExtensions = true;
        // create the path in file system if not there
        var relPath = parsedRequest[ 'public_path' ];
        for (var i = 1; i < segments.length; i++) {
            var relPath = helpers.JoinPath( relPath, segments[i] );
        }
        CreateDirectory( relPath );
        form.on('error', function(err) {
            console.log("Error parsing file" + err);
			throw err
            return false;
        }).on('fileBegin', function(name, file) {
            // redirect file to the specified path
            var filename = file.name.replace(/\s+/g, '_');
            file.path = helpers.JoinPath( './documents', relPath, filename);
			streamPath = helpers.JoinPath(streamStr, 'documents', relPath, filename);
        });
        // parse the file and then send response
        form.parse(request, function(err, fields, files) {
            response.writeHead(200, {'content-type': 'text/plain'});
            response.end(streamPath);
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