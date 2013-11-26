//   serve.js
//   This file contains the low level helper functions that the VWF nodeJS server uses to
//   actually serve content.


var filecache = require( './file-cache' ),
    YAML = require( 'js-yaml' ),
    fs = require( 'fs' );

// First, if the FileCache has not been instantiated, do so.
if ( global.FileCache == undefined ) {
    var FileCache = new filecache._FileCache( );
    global.FileCache = FileCache;
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

//Return a 404 not found coude
function _404( response ) {
    response.writeHead( 404, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
    } );
    response.write( "404 Not Found\n" );
    response.end();
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

        var type = "text/json";

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

//Parse and serve a YAML file
function ServeYAML( filename, response, URL ) {
    var tf = filename;
    fs.readFile( filename, "utf8", function ( err, data ) {
        if (err) {
            response.writeHead( 500, {
                "Content-Type": "text/plain"
            } );
            response.write( err + "\n" );
            response.end();
            return;
        }

        // Remove the Byte Order Mark (BOM) if one exists
        var file = data.replace( /^\uFEFF/, '' );

        //global.log(tf);
        try {
            var deYAML = JSON.stringify( YAML.load( file ) );
        } catch ( e ) {
            global.log( "error parsing YAML " + filename );
            _404( response );
            return;
        }

        var type = "text/json";

        var callback = URL.query.callback;

        if ( callback ) {
            deYAML = callback + "(" + deYAML + ")";
            type = "application/javascript";
        }

        response.writeHead( 200, {
            "Content-Type": type
        } );
        response.write( deYAML, "utf8" );
        response.end();			
    } );
}


//Serve a JSON object
function ServeJSON( jsonobject, response, URL ) {
    response.writeHead( 200, {
        "Content-Type": "text/json"
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