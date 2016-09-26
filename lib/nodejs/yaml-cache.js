//   yaml-cache.js
//   This file contains the implementation of the yaml cache system used by the VWF nodeJS server.


var fs = require( 'fs' ),
    YAML = require( 'js-yaml' ),
    url = require( 'url' ),
    helpers = require( './helpers' );


// Helper function to generate a hash for a string.
function hash( str ) {
    return require( 'crypto' ).createHash( 'md5' ).update( str ).digest( "hex" );
}

function _YamlCache( ) {
    this.filesMap = { };
    this.enabled = true;
    this.clear = function ( ) {
        this.filesMap = { };
    };

    // Function for getting a file from the file cache.
    // Asynchronous, returns file to the callback function.
    // Passes null to the callback function if there is no such file.
    this.getJsonStr = function ( path, callback ) {

        function getLastModifiedTime ( path ) {
            try {
              var stats = fs.statSync(path);
              return stats.mtime;
            }
            catch(err) {
                return null;
            }
        }

        function updateSources(obj, key, dirPath) {
            if (obj instanceof Array) {
                for(var i = 0; i < obj.length; i++) {
                    updateSources(obj[i], key, dirPath);
                }
            } else {
                for(var prop in obj) {
                    if(prop === key) {
                        console.log(prop + ': ' + obj[prop]);
                        obj[prop] = getPathWithMTime(obj[prop], dirPath);
                        console.log('found: ' + obj[prop]);
                        return;
                    }
                    if(obj[prop] instanceof Object || obj[prop] instanceof Array) {
                        updateSources(obj[prop], key, dirPath);
                    } 
                }
            }
        }
        if ( this.filesMap[ path ] ) {
            callback( this.filesMap[ path ] );
            return;
        }

        function getPathWithMTime( file, dirPath ){
            var tempFile = file;
            var updatedURL = url.parse( tempFile ).pathname;
            //console.log('SEGMENTS: ' + segments);
            if ( file.indexOf('vwf.example.com') >= 0 ) {
                tempFile = helpers.JoinPath( global.vwfRoot, "support/proxy/vwf.example.com/", updatedURL );
            } else if (dirPath) {
                tempFile = dirPath + tempFile;
            }
            console.log(tempFile);
            var mtime = getLastModifiedTime(tempFile);
            return file + (mtime ? '?m=' + mtime.getTime() : '');
        }


        // if got here, have no record of this file yet.
        var datatype = 'utf8';
        var data = fs.readFileSync( path, datatype );
        var stats = fs.statSync( path );

        if ( data ) {
            // Remove the Byte Order Mark (BOM) if one exists
            var file = data.replace( /^\uFEFF/, '' );

            //global.log(tf);
            try {
                // this check is done to avoid traversing entire json tree for every file
                var containsSourceKey = file.indexOf('source') >= 0;
                var yamlObj = YAML.load( file );
                if ( containsSourceKey ) {
                   // console.log('containsSourceKey');
                   // console.log(path);
                    var dirPath = path.substring( 0, path.lastIndexOf( '\\' ) + 1 );
                   // console.log(dirPath);
                    //var arr = [];
                    updateSources(yamlObj, 'source', dirPath);
                }
                var deYAML = JSON.stringify( yamlObj );
                console.log(deYAML);
                this.filesMap[ path ] = deYAML;
                callback(deYAML);
                return;
            } catch ( e ) {
                global.log( "error parsing YAML " + filename );
                _404( response );
                callback(null);
                return;
            }
        }
        // File was not in cache, and did not exists, return null.
        console.log('here');
        callback( null );
    };
    //Parse and serve a YAML file
    //move this stuff to yaml-cache
    this.ServeYAML = function ( request, filename, response, URL ) {

        YamlCache.getJsonStr( filename, function ( data ) {
                console.log('herererereerererererer');
            if ( !data ) {
                console.log('error');
                response.writeHead( 500, {
                    "Content-Type": "text/plain"
                } );
                response.write( 'file load error' + '\n' );
                response.end( );
                return;
            }

            var type = "application/json";

            var callback = URL.query.callback;

            if ( callback ) {
                data = callback + "(" + data + ")";
                type = "application/javascript";
            }

            response.writeHead( 200, {
                "Content-Type": type
            } );
            response.write( data, "utf8" );
            response.end();  
            console.log('finished');       
        } );
    };
}


exports._YamlCache = _YamlCache;