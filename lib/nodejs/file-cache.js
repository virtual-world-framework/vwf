//   file-cache.js
//   This file contains the implementation of the file cache system used by the VWF nodeJS server.


var fs = require( 'fs' ),
    mime = require( 'mime' ),
    zlib = require( 'zlib' );


// Helper function to generate a hash for a string.
function hash( str ) {
    return require( 'crypto' ).createHash( 'md5' ).update( str ).digest( "hex" );
}

function _FileCache( ) {
    this.files = [ ];
    this.enabled = true;
    this.clear = function ( ) {
        this.files.length = 0;
    };
    
    // Function for determining whether to treat file as binary or text
    // based on file extentsion.
    this.getDataType = function ( fileextension ) {
        if ( fileextension === 'js' || fileextension === 'html' ||
            fileextension === 'xml' || fileextension === 'txt' || 
            fileextension === 'xhtml' || fileextension === 'css' ) {
            return "utf8";
        }
        else return "binary";
    };

    this.getLastModifiedTime =  function ( path ) {
        try {
          var stats = fs.statSync(path);
          return stats.mtime;
        }
        catch(err) {
            return null;
        }
    }

    // Function for getting a file from the file cache.
    // Asynchronous, returns file to the callback function.
    // Passes null to the callback function if there is no such file.
    this.getFile = function ( path, callback ) {
        //First, check if we have already served this file
        // and have it already cached, if so, return the
        // already cached file.
        for ( var i = 0; i < this.files.length; i++ ) {
            if( this.files[ i ].path == path ) {
                global.log( 'serving from cache: ' + path, 2 );
                callback( this.files[ i ] );
                return;
            }
        }

        // if got here, have no record of this file yet.
        var ext = path.substr( path.lastIndexOf( '.' ) + 1 ).toLowerCase();
        var datatype = this.getDataType( ext );
        var file = ext !== 'html' ? fs.readFileSync( path) : fs.readFileSync( path, datatype );
        var stats = fs.statSync( path );

        if ( file ) {
            //  if the file is html replace all autoversion entries with
            //    path appended by mtime parameter before adding to cache
            if ( ext === 'html' ) {
                var dirPath = path.substring( 0, path.lastIndexOf( '\\' ) + 1 );
                var fileStr = file.replace(/\[autoversion\((.*?)\)\]/g, function(match) {
                        var autoStr = '[autoversion(';
                        match = match.substring(autoStr.length, match.length - 2);
                        var mtime = FileCache.getLastModifiedTime(dirPath+match);
                        return match + (mtime ? '?m=' + mtime.getTime() : '');
                    });
                // convert to buffer to keep socket messages small
                file = new Buffer(fileStr);
            }
            // The file was not already in the cache, but does exist.
            // Gzip the file, which is an async process, and callback
            // with the gzipped file entry when finished.
            var self = this;
            zlib.gzip( file, function ( _, zippeddata ) {
                
                var newentry = { };
                newentry.path = path;
                newentry.data = file;
                newentry.stats = stats;
                newentry.zippeddata = zippeddata;
                newentry.contentlength = file.length;
                newentry.datatype = datatype;
                newentry.hash = hash( file );
                
                global.log( newentry.hash, 2 );
                global.log( 'loading into cache: ' + path, 2 );
                if ( self.enabled == true ) {
                    self.files.push( newentry );
                    var watcher = fs.watchFile( path, { }, function ( event, filename ) {
                        global.log( this.entry.path + ' has changed on disk', 2 );
                        self.files.splice( self.files.indexOf( this.entry ), 1 );
                        fs.unwatchFile(path); //make sure not to create new watchers at every reload
                    } );
                    watcher.entry = newentry;
                }
                callback( newentry );
                return;
            } );

            // Just returning since we're waiting on the async gzip process.
            return;
        }
        // File was not in cache, and did not exists, return null.
        callback( null );
    };
    
    // Function to serve a file out of the filecache.
    this.ServeFile = function ( request, filename, response, URL ) {
        FileCache.getFile( filename, function ( file ) {
            if ( !file ) {
                response.writeHead( 500, {
                    "Content-Type": "text/plain"
                } );
                response.write( 'file load error' + '\n');
                response.end( );
                return;
            }

            var type = mime.lookup( filename );

            if ( request.headers[ 'if-none-match' ] === file.hash ) {
                response.writeHead( 304, {
                    "Content-Type": type,
                    "Last-Modified": file.stats.mtime,
                    "ETag": file.hash,
                    "Cache-Control":"public; max-age=31536000" ,
                } );
                response.end( );
                return;
            }

            if ( request.headers[ 'accept-encoding' ] && request.headers[ 'accept-encoding' ].indexOf( 'gzip' ) >= 0 ) {
                response.writeHead( 200, {
                    "Content-Type": type,
                    "Last-Modified": file.stats.mtime,
                    "ETag": file.hash,
                    "Cache-Control":"public; max-age=31536000" ,
                    'Content-Encoding': 'gzip'
                } );
                response.write(file.zippeddata, file.datatype);
            }
            else if ( request.headers['range'] ) {
                // To support the HTML 5 audio tag, the server needs to respond with the Content-Range in the header
                    var range = request.headers['range'];
                    range = range.split('=')[1];
                    var ranges = range.split('-');
                    var start = parseInt(ranges[0]);
                    var end = parseInt(ranges[1]) || (file.contentlength - 1);


                    var bytesheader = 'bytes ' + start + '-' + end + '/' + file.contentlength;

                    response.writeHead(206, {
                        "Content-Type": type,
                        "Content-Length": (end - start) + 1,
                        "Last-Modified": file.stats.mtime,
                        "ETag": file.hash,
                        "Cache-Control": "public; max-age=31536000",
                        "Accept-Ranges": "bytes",
                        "Content-Range": bytesheader
                    });
                    var newdata = file.data.slice(start, end + 1);
                    response.write(newdata, file.datatype);
            }
            else {
                response.writeHead( 200, {
                    "Content-Type": type,
                    "Last-Modified": file.stats.mtime,
                    "ETag": file.hash,
                    "Cache-Control":"public; max-age=31536000"
                } );
                response.write( file.data, file.datatype );
            }
            response.end( );
        } );    
    };
}


exports._FileCache = _FileCache;