// application.js
// This file contains a function for serving the application specific requests.


var servehandler = require( './serve-handler' ),
    helpers = require( './helpers' ),
    persistence = require( './persistence' ),
    admin = require( './admin' );

// Requests are attempted to be served as if they pertain to a specific application.
// If any of these attempts succesfully serve the request, true is returned.
// If these attempts do not succesfully serve the request, false is returned.
function Serve( request, response, parsedRequest ) {
    // The first step is to attempt to serve the file out of the support/client/lib directory structure.
    // If there is no private path, and we have an application request, then we're the initial request and
    // thus we should be serving the default 'load the application' index page, which lives at
    // support/client/lib/index.html, hence the fileName logic.
    var fileName = parsedRequest[ 'private_path' ];
    if ( fileName == undefined ) {
        fileName = "index.html";
    }
    if ( servehandler.File( request, response, helpers.JoinPath( global.vwfRoot + "/support/client/lib/", fileName ) ) ) {
        return true;
    }
    // If the file was not served out of the support/client/lib path, the next attempt is to test if the file can be served out of
    // the actual application path in the public directory.
    if ( servehandler.File( request, response, helpers.JoinPath( global.applicationRoot, parsedRequest[ 'public_path' ], parsedRequest[ 'private_path' ] ) ) ) {
        return true;
    }
    // If the file was not found in the application path within the public directory, the next step is to see if it is a component within the
    // application path within the public directory.
    if ( servehandler.Component( request, response, helpers.JoinPath( global.applicationRoot, parsedRequest[ 'public_path' ], parsedRequest[ 'private_path' ] ) ) ) {
        return true;
    }
    // If the request was still not served, try and see if the persistence functionality will serve this request.
    if ( persistence.Serve( request, response, parsedRequest ) ) {
        return true;
    }
    // Finally, test if the admin functionality can serve this request.
    if ( admin.Serve( request, response, parsedRequest ) ) {
        return true;
    }
    //Nothing managed to serve this request, return false.
    return false;
}

// Make the application functionality available via global since
// persistence needs to be able to call this, and this cannot
// require persistence AND have persistence require this.
global.application = {};
global.application.Serve = Serve;

exports.Serve = Serve;