//  admin.js
//  Helper functions for VWF node server that handle all /admin related requests.

var helpers = require( './helpers'),
    servehandler = require( './serve-handler' ),
    fs = require( 'fs' ),
    libpath = require( 'path' ),
    url = require( 'url' ),
    querystring = require( 'querystring' ),
    serve = require( './serve' );



// ServeTimeStateJSON is a helper function for serving the current 'time' status of 
// an instance as a JSON object to the client.
function ServeTimeStateJSON( request, response, instanceHash ) {
    var instanceState = { "time": global.instances[ instanceHash ].getTime( ), "rate": global.instances[ instanceHash ].rate, "playing": global.instances[ instanceHash ].isPlaying( ), "paused": global.instances[ instanceHash ].isPaused( ), "stopped": global.instances[ instanceHash ].isStopped( ) };
    serve.JSON( instanceState, response, url.parse( request.url, true ) );
}
    
// HandleAdminState is a handler for dealing with the state GET requests
// of the admin interface.
// It returns the current time state of the instance as a JSON object.
// If a query string is included, and the query string includes a rate value
// the rate will be set first.
// Returns true if it properly handles a properly formed request, otherwise
// returns false.
function HandleAdminState( request, response, instanceHash, queries ) {
    if ( ( instanceHash ) && ( request.method == 'GET' ) ) {
        if ( queries ) {
            var floatRate = parseFloat( queries.rate );                            
            if ( ( floatRate ) && ( floatRate > 0.0 ) ) {
                global.instances[ instanceHash ].rate = floatRate;
                global.instances[ instanceHash ].play( );
            }
        }
        ServeTimeStateJSON( request, response, instanceHash );
        return true;
    }
    return false;
}

// HandleAdminRate is a handler for dealing with the rate POST requests
// of the admin interface.
// After verifying that the post is for a valid instance (by testing if
// instanceHash is set), and testing that this was an actual POST request,
// then deal with the post itself. Store the posted data (break after a limited
// amount of time to avoid malicious infinite POST type issues ). Once the
// post ends, attempt to parse the data as a float, use said float to set
// the rate.
// Returns true if it properly handles a properly formed request, otherwise
// returns false.
function HandleAdminRate( request, response, instanceHash ) {
    if ( instanceHash ) {
        if ( request.method == 'POST' ) {
            var rateData = "";
            request.on( 'data', function ( data ) {
                rateData += data;
                if ( rateData.length > 1000 ) {
                    rateData = "";
                    response.writeHead( 413, { 'Content-Type': 'text/plain' } ).end( );
                    request.connection.destroy();
                }
            } );
            request.on( 'end', function( ) {
                var parsedRate;
                parsedRate = parseFloat( rateData );
                if ( ( parsedRate ) && ( parsedRate > 0 ) ) {
                    global.instances[ instanceHash ].rate = parsedRate;
                    global.instances[ instanceHash ].play( );
                    ServeTimeStateJSON( request, response, instanceHash );
                }
            } );
            return true;
        }
    }
    return false;
}

// HandleAdminPlay is a handler for dealing with the play POST requests
// of the admin interface.
// Despite not actually needing any data posted, allow some to be sent
// but cap and destroy the connection after a brief period since this
// shouldn't need any posted data, and we want to avoid malicious
// endless POSTs.
// Update the appropriate instance's flags so that it is playing.
// Returns true if it properly handles a properly formed request, otherwise
// returns false.
function HandleAdminPlay( request, response, instanceHash ) {
    if ( instanceHash ) {
        if ( request.method == 'POST' ) {
            var rateData = "";
            request.on( 'data', function ( data ) {
                if ( rateData.length > 10 ) {
                    rateData = "";
                    response.writeHead( 413, { 'Content-Type': 'text/plain' } ).end( );
                    request.connection.destroy();
                }
            } );
            global.instances[ instanceHash ].play( );
            ServeTimeStateJSON( request, response, instanceHash );
            return true;
        }
    }
}

// HandleAdminPause is a handler for dealing with the pause POST requests
// of the admin interface.
// Despite not actually needing any data posted, allow some to be sent
// but cap and destroy the connection after a brief period since this
// shouldn't need any posted data, and we want to avoid malicious
// endless POSTs.
// Update the appropriate instance's flags so that it is paused.
// Returns true if it properly handles a properly formed request, otherwise
// returns false.
function HandleAdminPause( request, response, instanceHash ) {
    if ( instanceHash ) {
        if ( request.method == 'POST' ) {
            global.instances[ instanceHash ].pause( );
            ServeTimeStateJSON( request, response, instanceHash );
            return true;
        }
    }
}

// HandleAdminPlay is a handler for dealing with the stop POST requests
// of the admin interface.
// Despite not actually needing any data posted, allow some to be sent
// but cap and destroy the connection after a brief period since this
// shouldn't need any posted data, and we want to avoid malicious
// endless POSTs.
// Update the appropriate instance's flags and time so that it is stopped.
// Returns true if it properly handles a properly formed request, otherwise
// returns false.
function HandleAdminStop( request, response, instanceHash ) {
    if ( instanceHash ) {
        if ( request.method == 'POST' ) {
            global.instances[ instanceHash ].stop( );
            ServeTimeStateJSON( request, response, instanceHash );
            return true;
        }
    }
}

// HandleAdminInstances is a handler for dealing with the 'instances' GET requests
// of the admin interface.
// This request returns a JSON object containing a list of the current instances of the
// application it was invoked within the path of. (Each instance also contains a list of
// clients attached to that instance).
// Returns true if it properly handles a properly formed request, otherwise
// returns false.
function HandleAdminInstances( request, response, parsedRequest ) {
    if ( ( parsedRequest[ 'public_path' ] ) && ( parsedRequest[ 'application' ] ) && ( request.method == "GET" ) ) {
        var data = { };
        var applicationInstanceRegexp = new RegExp("^" + helpers.JoinPath( parsedRequest[ 'public_path' ], parsedRequest[ 'application' ] ) + "/[0-9A-Za-z]{16}$");
        for ( var i in global.instances ) {
            if ( i.match( applicationInstanceRegexp ) ) {
                data[ i ] = { "clients": { } };
                for ( var j in global.instances[ i ].clients ) {
                    data[ i ].clients[ j ] = null;
                }
            }
        }
        serve.JSON( data, response, url.parse( request.url, true ) );
        return true;
    }
    return false;
}

// HandleAdminModels is a handler for dealing with the 'models' GET requests
// of the admin interface.
// The models request returns a JSON object containing a list of files stored in the 'public/models' directory.
// Returns true if it properly handles a properly formed request, otherwise
// returns false.
function HandleAdminModels( request, response ) {
    if ( request.method == "GET" ) {
        var filenames = fs.readdirSync( "." + libpath.sep + "public" + libpath.sep + "models" + libpath.sep );
        var data = [];
        for ( var i in filenames ) {
            var filedata = {};
            var filedetails = fs.statSync( "." + libpath.sep + "public" + libpath.sep + "models" + libpath.sep + filenames[ i ] );
            if ( filedetails.helpers.IsFile( ) ) {
                filedata[ 'url' ] = "http://" + request.headers.host + "/models/" + filenames[ i ];
                filedata[ 'basename' ] = filenames[ i ];
                filedata[ 'size' ] = filedetails.size;
                filedata[ 'mtime' ] = filedetails.mtime.toGMTString( );
                data.push( filedata );
            }
        }
        serve.JSON( data, response, url.parse( request.url, true ) );
        return true;
    }
    return false;
}

// HandleAdminFiles is a handler for dealing with the 'files' GET requests
// of the admin interface.
// This request returns the list of json files found in the public_path directory of this
// request.
// Returns true if it properly handles a properly formed request, otherwise
// returns false.
function HandleAdminFiles( request, response, parsedRequest ) {
    if ( ( parsedRequest[ 'public_path' ] ) && ( request.method == "GET" ) ) {
        var filenames = fs.readdirSync( helpers.JoinPath( global.applicationRoot, parsedRequest[ 'public_path' ] ).replace( /\//g, libpath.sep ) );
        var data = [];
        for ( var i in filenames ) {
            if ( filenames[ i ].match( /\.[jJ][sS][oO][nN]$/ ) ) {
                var filedata = {};
                var filedetails = fs.statSync( helpers.JoinPath( global.applicationRoot, parsedRequest[ 'public_path' ], filenames[ i ] ).replace( /\//g, libpath.sep ) );
                if ( filedetails.helpers.IsFile( ) ) {
                    filedata[ 'url' ] = "http://" + request.headers.host + helpers.JoinPath( parsedRequest[ 'public_path' ], filenames[ i ] );
                    filedata[ 'basename' ] = filenames[ i ];
                    filedata[ 'size' ] = filedetails.size;
                    filedata[ 'mtime' ] = filedetails.mtime.toGMTString( );
                    data.push( filedata );
                }
            }
        }
        serve.JSON( data, response, url.parse( request.url, true ) );
        return true;
    }
    return false;
}

// HandleAdminConfig is a handler for dealing with the 'config' GET requests
// of the admin interface.
// This request returns contents of the config file for the application, whether it is
// YAML or JSON. 
// Returns true if it properly handles a properly formed request and the config file exists, otherwise
// returns false.
function HandleAdminConfig( request, response, parsedRequest ) {
    if ( ( parsedRequest[ 'public_path' ] ) && ( parsedRequest[ 'application' ] ) && ( request.method == "GET" ) ) {
        var filenameRoot = helpers.JoinPath( global.applicationRoot, parsedRequest[ 'public_path' ], parsedRequest[ 'application' ] );
        if ( helpers.IsFile(  filenameRoot + ".config.yaml" ) ) {
            serve.YAML( ( filenameRoot + ".config.yaml" ).replace( /\//g, libpath.sep ), response, url.parse( request.url, true ) );
            return true;
        }
        else if ( helpers.IsFile( filenameRoot + ".config.json" ) ) {
            serve.JSONFile( ( filenameRoot + ".config.json" ).replace( /\//g, libpath.sep ), response, url.parse( request.url, true ) );
            return true;
        }
        else {
            // If there is no config file, return an empty string to prevent 404 errors
            serve.JSON("", response);
        }
    }
    return false;
}

// HandleAdminChrome is a handler for dealing with the 'chrome' GET requests
// of the admin interface.
// This request returns the application's "chrome" HTML overlay or an empty string if non-existant.
// Returns true if it properly handles a properly formed request, otherwise returns false. 
function HandleAdminChrome( request, response, parsedRequest ) {
    var publicPath = parsedRequest[ 'public_path' ];
    var appName = parsedRequest[ 'application' ];
    if ( publicPath && appName && ( request.method == "GET" ) ) {
        var fileBasePath = helpers.JoinPath( global.applicationRoot, publicPath, appName );
        var filePath = fileBasePath + ".html";
        if ( helpers.IsFile( filePath ) ) {
            servehandler.File( request, response, filePath );
        } else {
            response.end( "" );
        }
        return true;
    }
    return false;
}

// The Serve function in admin takes in the nodeJS request and nnodeJS response as well as 
// the parsedRequest information.
// It tests if the request is actually an admin request, and if calls an appropriate handler
// to serve the appropriate response.
// If the request is succesfully served, it returns TRUE, if the request is not succesfully
// served (whether due to a file not being present, the request being malformed, or simply it
// not being an admin request), then the function will return FALSE.
function Serve( request, response, parsedRequest ) {
    if ( parsedRequest[ 'private_path' ] ) {
        var segments = helpers.GenerateSegments( parsedRequest[ 'private_path' ] );
        if ( ( segments.length > 0 ) && ( segments[ 0 ] == "admin" ) ) {
            if ( segments.length == 2 ) {
                var queries = url.parse( request.url ).query;
                if ( queries ) {
                    queries = querystring.parse( queries );
                }
                var instanceHash = undefined;
                if ( ( parsedRequest[ 'instance' ] ) && ( parsedRequest[ 'public_path' ] ) && ( parsedRequest[ 'application' ] ) ) {
                    instanceHash = helpers.JoinPath( parsedRequest[ 'public_path' ], parsedRequest[ 'application' ], parsedRequest[ 'instance' ] );
                }
                if ( instanceHash && ( global.instances[ instanceHash ] == undefined ) ) {
                    instanceHash = undefined;
                }
                switch ( segments[ 1 ] ) {
                    case "state":
                        return HandleAdminState( request, response, instanceHash, queries );
                    case "rate":
                        return HandleAdminRate( request, response, instanceHash );
                    case "play":
                        return HandleAdminPlay( request, response, instanceHash );
                    case "pause":
                        return HandleAdminPause( request, response, instanceHash );
                    case "stop":
                        return HandleAdminStop( request, response, instanceHash );
                    case "instances":
                        return HandleAdminInstances( request, response, parsedRequest );
                    case "models":
                        return HandleAdminModels( request, response );
                    case "files":
                        return HandleAdminFiles( request, response, parsedRequest );
                    case "config":
                        return HandleAdminConfig( request, response, parsedRequest );
                    case "chrome":
                        return HandleAdminChrome( request, response, parsedRequest );
                }
            }
        }
    }
    return false;
}

exports.Serve = Serve;