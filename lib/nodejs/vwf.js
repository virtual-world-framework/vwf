// vwf.js
// This file contains the functions that handle the top level parsing and responses to
// requests for the VWF nodeJS server.

var parseurl = require( './parse-url' ),
    serve = require( './serve' ),
    servehandler = require( './serve-handler' ),
    helpers = require( './helpers' ),
    application = require( './application' ),
    storage = require( './storagefs' ),
    url = require( 'url' );

// HandleParsableRequest takes the incoming request, and uses the helper library functions to parse the
// URL into its 'public_path, application, instance and private_path' components, and then attempts to redirect
// or serve that request as appropriate. If it succesfully completes the request, it returns true, otherwise it
// returns false.
function HandleParsableRequest( request, response ) {
    var parsedRequest = parseurl.Process( url.parse(request.url).pathname );
    if ( parsedRequest[ 'valid' ] ) {
        if ( ( request.url[ request.url.length - 1 ] != "/" ) && ( parsedRequest[ 'private_path' ] == undefined ) ) {
            if ( ( request.headers['user-agent'] ) && ( request.headers['user-agent'].indexOf("MSIE 8.0" ) > -1 ) ) {
                serve.Redirect( "/web/docs/unsupported.html", response ); // Redirect unsupported browsers to web/docs/unsupported.html
                return true;
            }
            else if ( ( parsedRequest[ 'instance' ] == undefined ) && ( request.headers['accept'].indexOf( "text/html" ) == -1 ) ) {
                return servehandler.Component( request, response, helpers.JoinPath( "./public/", parsedRequest[ 'public_path' ], parsedRequest[ 'application' ] ) );
            }
            else {
                serve.Redirect( request.url + "/", response );
                return true;
            }
        }
        else if ( ( parsedRequest[ 'instance' ] == undefined ) && ( parsedRequest[ 'private_path' ] == undefined ) ) {

            var newInstanceID;
            var currentInstances = storage.ListApplicationInstances( parsedRequest[ 'public_path' ], parsedRequest[ 'application' ] );
            if ( global.instances != undefined ) {
                for ( namespace in global.instances ) {
                    var namespaceSegments = helpers.GenerateSegments( namespace );
                    var namespaceInstance = namespaceSegments.pop( );
                    var namespaceApplication = namespaceSegments.pop( );
                    var namespacePublicPath = "/" + namespaceSegments.join( "/" );
                    if ( ( parsedRequest[ 'public_path' ] == namespacePublicPath ) && ( parsedRequest[ 'application' ] == namespaceApplication ) && ( currentInstances.indexOf( namespaceInstance ) < 0 ) ) {
                        currentInstances.push( namespaceInstance );
                    }
                }
            }
            do {
                newInstanceID = helpers.GenerateInstanceID( );
            } while ( currentInstances.indexOf( newInstanceID ) > -1 );

            serve.Redirect( request.url + helpers.GenerateInstanceID( ) + "/", response );
            return true;
        }
        else {
            return application.Serve( request, response, parsedRequest );
        }
    }
    return false;
}

// HandleProxyRequest attempts to identify any of the 'proxy' based URL paths and serves then attempts to
// serve them out of the the support/proxy subdirectories.
// If the request is identified as being a proxy request and succesfully served, this returns true,
// if it is not a proxy request (or it is a proxy request, but fails due to the file not being present),
// then this will return false.
function HandleProxyRequest( request, response ) {
    var updatedURL = url.parse( request.url ).pathname;
    var segments = helpers.GenerateSegments( updatedURL );
    if ( ( segments.length > 0 ) && ( segments[ 0 ] == "proxy" ) ) {
        if ( servehandler.File( request, response, helpers.JoinPath( "./support/", updatedURL ) ) ) {
            return true;
        }
        if ( servehandler.Component( request, response, helpers.JoinPath( "./support/", updatedURL ) ) ) {
            return true;
        }
    }
    return false;
}

// HandleFileRequest simply attempts to handle the incoming URL as if it is a direct request for a file within the public directory
// structure.
// The function returns true if a file is succesfully served, false if it is not.
function HandleFileRequest( request, response ) {
    var updatedURL = url.parse( request.url ).pathname;
    var segments = helpers.GenerateSegments( updatedURL );
    if ( segments.length == 0 ) {
        updatedURL = "/index.html";
    }
    return servehandler.File( request, response, helpers.JoinPath( "./public/", updatedURL ) );
}

// Serve is the top level function for serving requests. It first attempts to 
// serve the request based on parsing the incoming URL.
// If that fails, it continues to attempt to serve the request as a 'proxy' request,
// if that also does not serve anything to the request, then an attempt is made
// to handle the request as a simple direct request for a file within the public
// directory structure.
// If all that fails, serve up a 404 response since the request was not handled.
function Serve( request, response ) {
    var handledRequest = HandleParsableRequest( request, response );
    if ( ! ( handledRequest ) ) {
        handledRequest = HandleProxyRequest( request, response );
    }
    if ( ! ( handledRequest ) ) {
        handledRequest = HandleFileRequest( request, response );
    }
    if ( ! ( handledRequest ) ) {
        global.log("404 : " + url.parse( request.url ).pathname )
        serve._404( response );
    }
}

exports.Serve = Serve;