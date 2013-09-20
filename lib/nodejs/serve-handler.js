//   serve-handler.js
//   This file defines a helper function for parsing an incoming URL into
//   the  Public Path, Application, Instance and Private Path components.

var serve = require( './serve' ),
    helpers = require( './helpers' ),
    url = require( 'url' ),
    libpath = require( 'path' );

function File( request, response, filename ) {
    if ( ( helpers.IsFile( filename ) ) && ( request.method == "GET" ) ) {
        serve.File( request, filename.replace( /\//g, libpath.sep ), response, url.parse( request.url, true ) );
        return true;
    }
    return false;
}

function Component( request, response, filename ) {
    if ( request.method == "GET" ) {
        if ( helpers.IsFile( filename + ".yaml" ) ) {
            serve.YAML( filename.replace( /\//g, libpath.sep ) + ".yaml", response, url.parse( request.url, true ) );
            return true;
        }
        if ( helpers.IsFile ( filename + ".json" ) ) {
            serve.JSONFile( filename.replace( /\//g, libpath.sep ) + ".json", response, url.parse( request.url, true ) );
            return true;
        }
    }
    return false;
}


exports.File = File;
exports.Component = Component;