//   helpers.js
//   This file contains some low level helper functions for the VWF nodeJS server.

var libpath = require( 'path' ),
    fs = require( 'fs' );

    
// List of valid ID characters for use in an instance.
var ValidIDChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// IsInstanceID tests if the passed in potential Instance ID 
// is a valid instance id.
function IsInstanceID( potentialInstanceID ) {
    if ( potentialInstanceID.match(/^[0-9A-Za-z]{16}$/) ) {
        return true;
    }
    return false;
}

// GenerateInstanceID function creates a randomly generated instance ID.
function GenerateInstanceID( ) {
    var text = "";
    
    for( var i=0; i < 16; i++ )
        text += ValidIDChars.charAt( Math.floor( Math.random( ) * ValidIDChars.length ) );

    return text;
}

// JoinPath
// Takes multiple arguments, joins them together into one path.
function JoinPath( /* arguments */ ) {
    var result = "";
    if ( arguments.length > 0 ) {
        if ( arguments[ 0 ] ) {
            result = arguments[ 0 ];
        }
        for ( var index = 1; index < arguments.length; index++ ) {
            var newSegment = arguments[ index ];
            if ( newSegment == undefined ) {
                newSegment = "";
            }

            if ( ( newSegment[ 0 ] == "/" ) && ( result[ result.length - 1 ] == "/" ) ) {
                result = result + newSegment.slice( 1 );
            } else if ( ( newSegment[ 0 ] == "/" ) || ( result[ result.length - 1 ] == "/" ) ) {
                result = result + newSegment;
            } else {
                result = result + "/" + newSegment;
            }
            //result = libpath.join( result, newSegment );
        }
    }
    return result;
}

// IsDirectory tests if the passed in path exists, and if it is a directory.
function IsDirectory( path ) {
    var seperatorFixedPath = path.replace( /\//g, libpath.sep );
    if ( ! fs.existsSync( seperatorFixedPath ) ) {
        return false;
    }
    return fs.statSync( seperatorFixedPath ).isDirectory();
}


// IsFile tests if the passed in path exists, and if it is a file.
function IsFile( path ) {
    var seperatorFixedPath = path.replace( /\//g, libpath.sep );
    if ( ! fs.existsSync( seperatorFixedPath ) ) {
        return false;
    }
    return fs.statSync( seperatorFixedPath ).isFile();
}


// GenerateSegments takes a string, breaks it into
// '/' separated segments, and removes potential
// blank first and last segments. 
function GenerateSegments( argument ) {
    var result = argument.split("/");
    if ( result.length > 0 ) {
        if ( result[ 0 ] == "" ) {
            result.shift();
        }
    }
    if ( result.length > 0 ) {
        if ( result[ result.length - 1 ] == "" ) {
            result.pop();
        }
    }
    return result;
}



exports.JoinPath = JoinPath;
exports.IsDirectory = IsDirectory;
exports.IsFile = IsFile;
exports.IsInstanceID = IsInstanceID;
exports.GenerateSegments = GenerateSegments;
exports.GenerateInstanceID = GenerateInstanceID;