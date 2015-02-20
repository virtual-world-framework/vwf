//   parse-url.js
//   This file defines a helper function for parsing an incoming URL into
//   the  Public Path, Application, Instance and Private Path components.


//   incoming path                                       public_path             application     instance        private_path            

//   /path/to/component                                       "/path/to/component"    "index.vwf"     nil             nil                     
//   /path/to/component/                                      "/path/to/component"    "index.vwf"     nil             nil                     
//   /path/to/component/path/to/client/file                   "/path/to/component"    "index.vwf"     nil             "path/to/client/file"   
//   /path/to/component/path/to/component/file                "/path/to/component"    "index.vwf"     nil             "path/to/component/file"
//   /path/to/component/socket/path                           "/path/to/component"    "index.vwf"     nil             "socket/path"           

//   /path/to/component.vwf                                   "/path/to"              "component.vwf" nil             nil                     
//   /path/to/component.vwf/                                  "/path/to"              "component.vwf" nil             nil                     
//   /path/to/component.vwf/path/to/client/file               "/path/to"              "component.vwf" nil             "path/to/client/file"   
//   /path/to/component.vwf/path/to/component/file            "/path/to"              "component.vwf" nil             "path/to/component/file"
//   /path/to/component.vwf/socket/path                       "/path/to"              "component.vwf" nil             "socket/path"           

//   /path/to/component/instance                              "/path/to/component"    "index.vwf"     "instance"      nil                     
//   /path/to/component/instance/                             "/path/to/component"    "index.vwf"     "instance"      nil                     
//   /path/to/component/instance/path/to/client/file          "/path/to/component"    "index.vwf"     "instance"      "path/to/client/file"   
//   /path/to/component/instance/path/to/component/file       "/path/to/component"    "index.vwf"     "instance"      "path/to/component/file"
//   /path/to/component/instance/socket/path                  "/path/to/component"    "index.vwf"     "instance"      "socket/path"           

//   /path/to/component.vwf/instance                          "/path/to"              "component.vwf" "instance"      nil                     
//   /path/to/component.vwf/instance/                         "/path/to"              "component.vwf" "instance"      nil                     
//   /path/to/component.vwf/instance/path/to/client/file      "/path/to"              "component.vwf" "instance"      "path/to/client/file"   
//   /path/to/component.vwf/instance/path/to/component/file   "/path/to"              "component.vwf" "instance"      "path/to/component/file"
//   /path/to/component.vwf/instance/socket/path              "/path/to"              "component.vwf" "instance"      "socket/path"     


var helpers = require( './helpers' );

// List of valid extensions for VWF components.
var template_extensions = [ "", ".yaml", ".json" ];


function GetExtension( path ) {
    if ( path.match( /\.vwf$/ ) ) {
        for ( var index = 0; index < template_extensions.length; index++ ) {
            if ( helpers.IsFile( helpers.JoinPath( global.applicationRoot, path + template_extensions[ index ] ) ) ) {
                return template_extensions[ index ];
            }
        }
    }
    // else if ( path.match( /\.(dae|unity3d)$/ ) ) {
    //     if ( helpers.IsFile( helpers.JoinPath( global.applicationRoot, path ) ) ) {
    //         return "";
    //     }
    // }
    return undefined;
}

function Process( updatedURL ) {
    var result = { 'public_path': "/", 'application': undefined, 'instance': undefined, 'private_path': undefined };
    var segments = helpers.GenerateSegments( updatedURL );
    var extension = undefined;

    while ( ( segments.length > 0 ) && ( helpers.IsDirectory( helpers.JoinPath( global.applicationRoot + result[ 'public_path' ], segments[ 0 ] ) ) ) ) {
        result[ 'public_path' ] = helpers.JoinPath( result[ 'public_path' ], segments.shift( ) );
    }

    if ( ( segments.length > 0 ) && ( extension = GetExtension( helpers.JoinPath( result[ 'public_path' ], segments[ 0 ] ) ) ) ) {
        result[ 'application' ] = segments.shift( );
    } else if ( extension = GetExtension( helpers.JoinPath( result[ 'public_path' ], "index.vwf" ) ) ) {
        result[ 'application' ] = "index.vwf";
    } else if ( extension = GetExtension( helpers.JoinPath( result[ 'public_path' ], "index.dae" ) ) ) {
        result[ 'application' ] = "index.dae";
    } else if ( extension = GetExtension( helpers.JoinPath( result[ 'public_path' ], "index.unity3d" ) ) ) {
        result[ 'application' ] = "index.unity3d";
    }

    if ( extension ) {
        if ( ( segments.length > 0 ) && ( helpers.IsInstanceID( segments[ 0 ] ) ) ) {
            result[ 'instance' ] = segments.shift();
        }
        if ( segments.length > 0 ) {
            result[ 'private_path' ] = segments.join("/");
        }
    }
    
    return result;
}

exports.Process = Process;