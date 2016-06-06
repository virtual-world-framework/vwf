// vwf.js
// This file contains the functions that handle the top level parsing and responses to
// requests for the VWF nodeJS server.

var parseurl = require( './parse-url' ),
    serve = require( './serve' ),
    servehandler = require( './serve-handler' ),
    helpers = require( './helpers' ),
    application = require( './application' ),
    url = require( 'url' ),
    lobby = require( './lobby' ),
    finalhandler = require( 'finalhandler' ),
    execFile = require( 'child_process' ).execFile,
    fs = require( 'fs' );

// HandleParsableRequest takes the incoming request, and uses the helper library functions to parse the
// URL into its 'public_path, application, instance and private_path' components, and then attempts to redirect
// or serve that request as appropriate. If it succesfully completes the request, it returns true, otherwise it
// returns false.
function HandleParsableRequest( request, response ) {
    var parsedRequest = parseurl.Process( url.parse(request.url).pathname );

    if ( ! parsedRequest ) {
        return false;
    }

    // Used to check if the URL referer was an application instance. Components added by the "includes" keyword 
    // in yaml are loaded using jQuery which appends a query parameter to handle the callback. Checking the referer
    // allows those URLs to be handled correctly, instead of treating them as a new application that needs an instance ID.
    var parsedReferer = request.headers.referer ? parseurl.Process( url.parse(request.headers.referer).pathname ) : undefined;

    if ( ( request.url[ request.url.length - 1 ] != "/" ) && ( parsedRequest[ 'private_path' ] == undefined ) && ( url.parse( request.url ).search == undefined || 
        ( parsedReferer && parsedReferer[ 'instance' ] != undefined ) ) ) { // If the referer was an application, allow it even if it has query parameters
        
        var browserIsIE8 = ( request.headers['user-agent'] ) && ( request.headers['user-agent'].indexOf("MSIE 8.0" ) > -1 );
        var urlIsUnsupportedPage = ( request.url.indexOf("/web/unsupported.html") !== -1 );
        var refererIsUnsupportedPage = ( request.headers.referer && ( request.headers.referer.indexOf( "/web/unsupported.html" ) !== -1 ) );
        if ( browserIsIE8 && !( urlIsUnsupportedPage || refererIsUnsupportedPage ) ) {
            serve.Redirect( "/web/unsupported.html", response ); // Redirect unsupported browsers to web/docs/unsupported.html
            return true;
        }
        else if ( ( parsedRequest[ 'instance' ] == undefined ) && ( request.headers['accept'].indexOf( "text/html" ) == -1 ) ) {
            return servehandler.Component( request, response, helpers.JoinPath( global.applicationRoot, parsedRequest[ 'public_path' ], parsedRequest[ 'application' ] ) );
        }
        else if ( parsedRequest[ 'instance' ] == undefined && request.headers['accept'].indexOf( "text/html" ) != -1 && helpers.IsFile( helpers.JoinPath( global.applicationRoot, request.url ) ) ) {
            return servehandler.File( request, response, helpers.JoinPath( global.applicationRoot, request.url ) );
        }
        else {
            serve.Redirect( request.url + "/", response );
            return true;
        }
    }
    else if ( ( parsedRequest[ 'instance' ] == undefined ) && ( parsedRequest[ 'private_path' ] == undefined ) ) {

        if ( request.url != "/" ) {


            // Redirect if the requested url is either a specified directory or application 
            if ( helpers.IsDirectory( helpers.JoinPath( global.applicationRoot + request.url )) || parsedRequest['application'] != undefined ) {
                
                // Get the driver specific url parameters if applicable
                var queryString = url.parse( request.url ).search;
                if ( queryString == undefined ) {
                   serve.Redirect( request.url + helpers.GenerateInstanceID( ), response );
                   return true;
               }
               else {

                   // Tack on the driver specific configuration parameters 
                   serve.Redirect( helpers.JoinPath( url.parse( request.url ).pathname, helpers.GenerateInstanceID( ), queryString.replace( /\/$/, '' ) ), response );
                   return true;

               }
            }
        }
        else if ( isDefaultApp( request.url ) ) {

            // Redirect if the url request does not include an application/file && a default 'index.vwf.yaml' exists
            serve.Redirect( request.url + helpers.GenerateInstanceID( ), response );
            return true;
        } else {
            return false;
        }
          
    }
    else {
        return application.Serve( request, response, parsedRequest );
    }
}

// Assuming no application or file was specified in the url request, check for the existance of 
// the default 'index.vwf.yaml' in either applicationRoot or cwd.
function isDefaultApp ( requestURL ) {

    if ( helpers.IsFile( helpers.JoinPath( global.applicationRoot, "/index.vwf.yaml" ) )  
        || helpers.IsFile( helpers.JoinPath( process.cwd(), "/index.vwf.yaml" ) ) ) {
        return true;
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
        if ( servehandler.File( request, response, helpers.JoinPath( global.vwfRoot + "/support/", updatedURL ) ) ) {
            return true;
        }
        if ( servehandler.Component( request, response, helpers.JoinPath( global.vwfRoot + "/support/", updatedURL ) ) ) {
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
    return servehandler.File( request, response, helpers.JoinPath( global.applicationRoot, updatedURL ) );
}

// Serve is the top level function for serving requests. It first attempts to 
// serve the request using the the lobby, which is an Express application.
// Lobby errors are handled using finalhandler in the same way that Express would.
// Otherwise, it attempts to serve the request based on parsing the incoming URL.
// If that fails, it continues to attempt to serve the request as a 'proxy' request,
// if that also does not serve anything to the request, then an attempt is made
// to handle the request as a simple direct request for a file within the public
// directory structure.
// If all that fails, serve up a 404 response since the request was not handled.
function Serve( request, response ) {
    lobby.post( "/txs", function( req, res ) {
        var filePath = "txs/txs_Data/StreamingAssets/Config/ITDG/itdg-sim-data.json";
        
        // TODO: Get the data from the request properly (req.body.simData is not doing it)

        fs.writeFile( filePath, req.body.simData, function( err ) {
            if ( err ) {
                return console.log( err );
            }
            execFile( "txs/txs.exe -itdgMission " + filePath );
        } );
    } );
    lobby( request, response, function( err ) {
        if ( err ) {
            finalhandler( request, response, {
                env: lobby.get('env')
            } )( err );
        } else {
            var handledRequest =
                HandleParsableRequest( request, response ) ||
                HandleProxyRequest( request, response ) ||
                HandleFileRequest( request, response );
            if ( ! ( handledRequest ) ) {
                global.log("404 : " + url.parse( request.url ).pathname )
                serve._404( response, "404.html" );
            }
        }
    } );
}

exports.Serve = Serve;
