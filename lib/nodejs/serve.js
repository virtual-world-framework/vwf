//   serve.js
//   This file contains the low level helper functions that the VWF nodeJS server uses to
//   actually serve content.


var filecache = require( './file-cache' ),
    yamlcache = require( './yaml-cache' ),
    fs = require( 'fs' ),
    helpers = require( './helpers' );

// First, if the FileCache and YamlCache have not been instantiated, do so.
if ( global.FileCache == undefined ) {
    var FileCache = new filecache._FileCache( );
    global.FileCache = FileCache;
}
if ( global.YamlCache == undefined ) {
    var YamlCache = new yamlcache._YamlCache( );
    global.YamlCache = YamlCache;
}

//  Basic helper function to redirect a request.
function ServeRedirect( url, response ) {
    response.writeHead( 302, { 'Location': url } );
    response.end();
}

//Just serve a simple file, using the FileCache implementation.
function ServeFile( request, filename, response, URL ) {
    FileCache.ServeFile( request, filename, response, URL );
}

//Return a 404 file and not found code
function _404 ( response, file404 ) {
    var url404 = helpers.JoinPath( global.applicationRoot, file404 );
    if ( helpers.IsFile( url404 ) ) {
        fs.readFile( url404, function( error, data ) {
            response.writeHead( 404, {'content-type': 'text/html'} );
            response.end( data );
        });
    } else {
        response.writeHead( 404, {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*"
        } );
        response.write( "404 Not Found\n" );
        response.end();        
    }
}

// Parse and serve a JSON file
// Note: If we receive a 'callback' query, we need to
//       serve the file as application/javascript and
//       adjust slightly.
function ServeJSONFile( filename, response, URL ) {
    fs.readFile( filename, "utf8", function ( err, data ) {
        if ( err ) {
            response.writeHead( 500, {
                "Content-Type": "text/plain"
            } );
            response.write( err + "\n" );
            response.end();
            return;
        }

        var type = "application/json";

        var jsonString = data;

        var callback = URL.query.callback;
        if ( callback ) {
            jsonString = callback + "(" + data + ")";
            type = "application/javascript";
        }
        
        response.writeHead( 200, {
            "Content-Type": type
        } );
        
        response.write( jsonString, "utf-8" );
        
        response.end();
    } );
}

// Serve YAML, using the YamlCache implementation.
function ServeYAML( request, filename, response, URL ) {
    YamlCache.ServeYAML( request, filename, response, URL );
}


//Serve a JSON object
function ServeJSON( jsonobject, response, URL ) {
    response.writeHead( 200, {
        "Content-Type": "application/json"
    } );
    response.write( JSON.stringify( jsonobject ), "utf8" );
    response.end();	
}

exports.Redirect = ServeRedirect;
exports.File = ServeFile;
exports._404 = _404;
exports.JSONFile = ServeJSONFile;
exports.YAML = ServeYAML;
exports.JSON = ServeJSON;