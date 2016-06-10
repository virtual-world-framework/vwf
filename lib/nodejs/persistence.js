//  persistence.js
//  Helper functions for VWF node server that handles all persitence related requests

var helpers = require( './helpers' ),
    serve = require( './serve' ),
    storage = require( './storagefs' ),
    fs = require( 'fs' ),
    url = require( 'url' ),
    libpath = require( 'path' ),
    querystring = require( 'querystring' );



function CreateSaveDirectory( application_path, save_name, save_revision ) {
    var application_segments = helpers.GenerateSegments( application_path );
    var current_directory = "./documents";
    while ( application_segments.length > 0 ) {
        current_directory = helpers.JoinPath( current_directory, application_segments.shift() );
        if ( ! helpers.IsDirectory( current_directory ) ) {
            fs.mkdirSync( current_directory );
        }
    }
    current_directory = helpers.JoinPath( current_directory, save_name );
    if ( ! helpers.IsDirectory( current_directory ) ) {
        fs.mkdirSync( current_directory );
    }
}

// LoadSaveObject function is designed to take the load information provided by the
// GetLoadInformation function, load and parse the specified file, and return that object
// (or undefined, if there is no such file ).
function LoadSaveObject( loadInfo ) {
    if ( loadInfo[ 'save_name' ] ) {
        var fileName = helpers.JoinPath( "./documents", loadInfo[ 'application_path' ], loadInfo[ 'save_name' ], "saveState_" + loadInfo[ 'save_revision' ] + ".vwf.json" );
        if ( helpers.IsFile( fileName ) ) {
            var fileContents = fs.readFileSync( fileName, "utf8" );
            return JSON.parse( fileContents );
        }
    }
    return undefined;
}

// LookupSaveRevisions takes the public path and the name of a save, and provides
// an array of all revisions for that save. (If the save does not exist, this will be
// an empty array).
function LookupSaveRevisions( public_path, save_name ) {
    var result = [ ];
    var directoryName = helpers.JoinPath( "./documents/", public_path, save_name );
    if ( helpers.IsDirectory( directoryName ) ) {
        var potentialSaves = fs.readdirSync( directoryName.replace( /\//g, libpath.sep ) );
        for ( var index = 0; index < potentialSaves.length; index++ ) {
            if ( potentialSaves[ index ].match( /^saveState_\d+\.vwf\.json$/ ) ) {
                result.push( parseInt( potentialSaves[ index ].slice( 10, potentialSaves[ index ].length - 9 ) ) );
            }
        }
    }
    return result;
}

// GetLoadInformation receives a parsed request {private_path, public_path, instance, application} and returns the
// details of the save that is designated by the initial request. The details are returned in an object
// composed of: save_name (name of the save) save_revision (revision of the save), explicit_revision (boolean, true if the request
// explicitly specified the revision, false if it did not), and application_path (the public_path of the application this is a save for).
function GetLoadInformation( parsedRequest ) {
    var result = {'save_name': undefined, 'save_revision': undefined, 'explicit_revision': undefined, 'application_path': undefined };
    if ( parsedRequest[ 'private_path' ] ) {
        var segments = helpers.GenerateSegments( parsedRequest[ 'private_path' ] );
        if ( ( segments.length > 1 ) && ( segments[ 0 ] == "load" ) ) {
            var potentialRevisions = LookupSaveRevisions( parsedRequest[ 'public_path' ], segments[ 1 ] );
            if ( potentialRevisions.length > 0 ) {
                result[ 'save_name' ] = segments[ 1 ];
                
                if ( segments.length > 2 ) {
                    var requestedRevision = parseInt( segments[ 2 ] );
                    if ( requestedRevision ) {
                       if ( potentialRevisions.indexOf( requestedRevision ) > -1 ) {
                           result[ 'save_revision' ] = requestedRevision;
                           result[ 'explicit_revision' ] = true;
                           result[ 'application_path' ] = parsedRequest[ 'public_path' ];
                       }
                    }
                }
                if ( result[ 'explicit_revision' ] == undefined ) {
                    result[ 'explicit_revision' ] = false;
                    potentialRevisions.sort( );
                    result[ 'save_revision' ] = potentialRevisions.pop();
                    result[ 'application_path' ] = parsedRequest[ 'public_path' ];
                }
            }
        }
    }
    return result;
}

// GetSaveInformation is a helper function that takes a NodeJS request, a NodeJS response,
// and the application_path (/path/to/application). It returns an array of all saves found for that
// application (including separate entries for individual revisions of saves ).
function GetSaveInformation( request, response, application_path ) {
    var result = [ ];
    var potentialSaveNames = fs.readdirSync( helpers.JoinPath("./documents", application_path ) );
    for ( var index = 0; index < potentialSaveNames.length; index++ ) {
        if ( helpers.IsDirectory( helpers.JoinPath( "./documents", application_path, potentialSaveNames[ index ] ) ) ) {
            var revisionList = LookupSaveRevisions( application_path, potentialSaveNames[ index ] );
            var latestsave = true;
            revisionList.sort();
            while ( revisionList.length > 0 ) {
                var newEntry = {};
                newEntry[ 'applicationpath' ] = application_path;
                newEntry[ 'savename' ] = potentialSaveNames[ index ];
                newEntry[ 'revision' ] = revisionList.pop().toString();
                newEntry[ 'latestsave' ] = latestsave;
                if ( latestsave ) {
                    newEntry[ 'url' ] = helpers.JoinPath( "http://" + request.headers.host, application_path, "load", potentialSaveNames[ index ] + "/" );
                }
                else {
                    newEntry[ 'url' ] = helpers.JoinPath(  "http://" + request.headers.host, application_path, "load", potentialSaveNames[ index ] + "/", newEntry[ 'revision' ] + "/" );
                }
                latestsave = false;
                result.push( newEntry );
            }
        }
    }
    return result;
}

// GetSaveInformationRecursive is a helper function that recursively calls the
// GetSaveInformation function on a directory, and all directories within it (and within those, and so on).
function GetSaveInformationRecursive( request, response, application_path ) {
    var result = [];
    var subDirectories = fs.readdirSync( helpers.JoinPath("./documents", application_path ) );
    for ( var index = 0; index < subDirectories.length; index++ ) {
        if ( helpers.IsDirectory( helpers.JoinPath( "./documents", application_path, subDirectories[ index ] ) ) ) {
            result = result.concat( GetSaveInformationRecursive( request, response, helpers.JoinPath( application_path, subDirectories[ index ] ) ) );
        }
    }
    result = result.concat( GetSaveInformation( request, response, application_path ) );
    return result;
}

// HandlePersistenceLoad attempts to deal with a request which contains load arguments in the
// private_path.
// If the URL is properly formed, it will either (if the load portion of the URL is the last
// portion of the URL, and there is no trailing slash) redirect to the same URL with a trailing
// slash added, or if the URL is otherwise properly formed, it will remove the load specific
// portions of the private_path, and pass this updated parsedRequest on to the normal application
// level Serve function (effectively, load URL's are treated as if all load specific portions
// of the URL don't exist, except for the websocket connection, which uses it to load the initial
// state for the first client. ).
function HandlePersistenceLoad( request, response, parsedRequest, segments ) {
    var loadInformation = GetLoadInformation( parsedRequest );
    if ( loadInformation[ 'save_name' ] != undefined ) {
        segments.shift();
        segments.shift();
        if ( loadInformation[ 'explicit_revision' ] ) {
            segments.shift();
        }
        var subParsedRequest = { };
        subParsedRequest[ 'public_path' ] = parsedRequest[ 'public_path' ];
        subParsedRequest[ 'application' ] = parsedRequest[ 'application' ];
        if ( segments.length > 0 ) {
            subParsedRequest[ 'private_path' ] = segments.join("/");
        }
        else {
            subParsedRequest[ 'private_path' ] = undefined;
        }
        subParsedRequest[ 'instance' ] = parsedRequest[ 'instance' ];
        if ( subParsedRequest[ 'instance' ] ) {
            return global.application.Serve( request, response, subParsedRequest );
        }
        else if ( request.method == "GET" ) {
            var redirectPath = parsedRequest[ 'public_path' ];
            if ( parsedRequest[ 'application' ] ) {
                redirectPath = helpers.JoinPath( redirectPath, parsedRequest[ 'application' ] );
            }
            redirectPath = helpers.JoinPath( redirectPath, helpers.GenerateInstanceID( ), parsedRequest[ 'private_path' ] );
            if ( segments.length == 0 ) {
                redirectPath = helpers.JoinPath( redirectPath, "/");
            }
            serve.Redirect( redirectPath, response );
            return true;
        }
    }
    return false;
}

function GenerateSaveObject( request, public_path, application, instance, save_name ) {
    var result = {};
    result[ "name" ] = save_name;
    result[ "url" ] = helpers.JoinPath( "http://" + request.headers.host, public_path, application, instance, "saves", save_name );
    result[ "vwf_info" ] = {};
    result[ "vwf_info" ][ "public_path" ] = public_path;
    result[ "vwf_info" ][ "application" ] = application;
    result[ "vwf_info" ][ "path_to_application" ] = helpers.JoinPath( public_path, application );
    result[ "vwf_info" ][ "instance" ] = instance;
    var metadata = storage.GetSaveMetadata( public_path, application, instance, save_name );
    if ( metadata ) {
        result[ "metadata" ] = metadata;
    }
    else {
        result[ "metadata" ] = {}
    }
    return result;
    
}

function HandleSavesLoad( request, response, parsedRequest, segments ) {
    // Saves are listed/loaded via GET, and saved via POST
    if ( request.method == "GET" ) {
        //Dealing with either loading a save state, or listing save states,
        // or a malformed request.
        if ( segments.length == 1 ) {
            //No arguments beyond saves, must be listing save states.
            // If instance was set, listing saves for that instance,
            // otherwise listing saves for all instances of this application.
            if ( parsedRequest[ 'instance' ] ) {
                //Listing for specific instance.
                var save_name_list = storage.ListInstanceSaveStates( parsedRequest[ 'public_path' ], parsedRequest[ 'application' ], parsedRequest[ 'instance' ] );
                var save_objects = [ ];
                for ( var index = 0; index < save_name_list.length; index++ ) {
                    save_objects.push( GenerateSaveObject( request, parsedRequest[ 'public_path' ], parsedRequest[ 'application' ], parsedRequest[ 'instance' ], save_name_list[ index ] ) );
                }
                serve.JSON( save_objects, response, url.parse( request.url, true ) );
                return true;
            }
            else {
                var save_hash = storage.ListApplicationSaveStates( parsedRequest[ 'public_path' ], parsedRequest[ 'application' ] );
                var instance_hash = { };
                for ( instance_id in save_hash ) {
                    var save_objects = [ ];
                    for ( var index = 0; index < save_hash[ instance_id ].length; index++ ) {
                        save_objects.push( GenerateSaveObject( request, parsedRequest[ 'public_path' ], parsedRequest[ 'application' ], instance_id, save_hash[ instance_id ][ index ] ) );
                    }
                    instance_hash[ instance_id ] = save_objects;
                }
                serve.JSON( instance_hash, response, url.parse( request.url, true ) );
                return true;
            }
        } else  if ( segements.length == 2 ) {
        }
    } else if ( request.method == "POST" ) {
    }
    return false;
}

function HandlePersistenceSave( request, response, parsedRequest, segments ) {
    if ( segments.length == 2 ) {
        var saveName = segments[ 1 ];
        var saveRevision = new Date().valueOf();
        CreateSaveDirectory( parsedRequest[ 'public_path' ], saveName, saveRevision );
        var persistenceData = "";
        var persistenceLength = 0;
        if ( typeof request.body === "object" ) {
            fs.writeFileSync( helpers.JoinPath( './documents', parsedRequest[ 'public_path' ], saveName, 'saveState' + request.body[ "extension" ] ), request.body[ "jsonState" ] );
            fs.writeFileSync( helpers.JoinPath( './documents', parsedRequest[ 'public_path' ], saveName, 'saveState_' + saveRevision + request.body[ "extension" ] ), request.body[ "jsonState" ] );
            response.writeHead( 200 );
            response.end();
        } else {
            request.on( 'data', function ( data ) {
                persistenceData += data;
            } );
            request.on( 'end', function( ) {
                if ( persistenceData.length > 0 ) {
                    var processedPost = querystring.parse( persistenceData );
                    fs.writeFileSync( helpers.JoinPath( './documents', parsedRequest[ 'public_path' ], saveName, 'saveState' + processedPost[ "extension" ] ), processedPost[ "jsonState" ] );
                    fs.writeFileSync( helpers.JoinPath( './documents', parsedRequest[ 'public_path' ], saveName, 'saveState_' + saveRevision + processedPost[ "extension" ] ), processedPost[ "jsonState" ] );
                    response.writeHead( 200 );
                    response.end();
                }
            } );
        }
        return true;
    }
    return false;
}

// The Serve function takes the nodeJS request, nodeJS response and the parsedRequest, and
// attempts to see if it is a properly formed persistence related request.
// If so, it serves the request, and returns true.
// If it is an incorrectly formed persistence request, or not a persistence request
// at all, then false will be returned. 
function Serve( request, response, parsedRequest ) {
    if ( parsedRequest[ 'private_path' ] ) {
        var segments = helpers.GenerateSegments( parsedRequest[ 'private_path' ] );
        if ( segments.length > 0 ) {
            switch ( segments[ 0 ] ) {
                case "listallsaves":
                    if ( request.method == "GET" ) {
                        var saveInfo = GetSaveInformationRecursive( request, response, "/" );
                        serve.JSON( saveInfo, response, url.parse( request.url, true ) );
                        return true;
                     }
                     return false;
                case "listsaves":
                    if ( request.method == "GET" ) {
                        var saveInfo = GetSaveInformation( request, response, parsedRequest[ 'public_path' ] );
                        serve.JSON( saveInfo, response, url.parse( request.url, true ) );
                        return true;
                    }
                    return false;
                case "listdescendentsaves":
                    if ( request.method == "GET" ) {
                        var saveInfo = GetSaveInformationRecursive( request, response, parsedRequest[ 'public_path' ] );
                        serve.JSON( saveInfo, response, url.parse( request.url, true ) );
                        return true;
                    }
                    return false;
                case "load":
                    return HandlePersistenceLoad( request, response, parsedRequest, segments );
                case "saves":
                    return HandleSavesLoad( request, response, parsedRequest, segments );
                case "save":
                    if ( ( request.method == "POST" ) && ( segments.length > 1 ) ) {
                        return HandlePersistenceSave( request, response, parsedRequest, segments );
                    }
                    return false;
            }
        }
    }
    return false;
}

exports.GetLoadInformation = GetLoadInformation;
exports.Serve = Serve;
exports.LoadSaveObject = LoadSaveObject;