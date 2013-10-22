// storagefs.js
// This file contains the functions that handle filesystem based storage.

var helpers = require( './helpers' ),
    fs = require( 'fs' ),
    url = require( 'url' ),
    libpath = require( 'path' );


var storageRoot = "./documents";

function listApplicationInstances( publicPath, application ) {
    var result = [ ];
    var potentialAppDir = helpers.JoinPath( storageRoot, publicPath, application );
    if ( helpers.IsDirectory( potentialAppDir ) ) {
        var potentialInstances = fs.readdirSync( potentialAppDir.replace( /\//g, libpath.sep ) );
        for ( var index = 0; index < potentialInstances.length; index++ ) {
            if ( ( helpers.IsDirectory( helpers.JoinPath( potentialAppDir, potentialInstances[ index ] ) ) ) && ( potentialInstances[ index ].match( /^instance_*/ ) ) ) {
                var potentialInstanceId = potentialInstances[ index ].slice( 9 );
                if ( ( getInstanceMetadata( publicPath, application, potentialInstanceId ) != undefined ) || ( getPersistenceState( publicPath, application, potentialInstanceId ) != undefined ) || ( listInstanceSaveStates( publicPath, application, potentialInstanceId ).length != 0 ) ) {
                    result.push( potentialInstanceId );
                }
            }
        }
    }
    return result.sort();
}

function getInstanceMetadata( publicPath, application, instance ) {
    result = undefined;
    potentialFilename = helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance, "metadata.json" );
    if ( helpers.IsFile( potentialFilename ) ) {
        var fileContents = fs.readFileSync( potentialFilename, "utf8" );
        result = JSON.parse( fileContents );
    }
    return result;
}

function setInstanceMetadata( publicPath, application, instance, metadata ) {
    var segments = helpers.generateSegments( publicPath );
    segments.push( application );
    segments.push( "instance_" + instance );
    var currentPath = storageRoot;
    for ( var index = 0; index < segments.length; index++ ) {
        currentPath = helpers.JoinPath( currentPath, segments[ index ] );
        if ( !( helpers.IsDirectory( currentPath ) ) ) {
            fs.mkdirSync( currentPath );
        }
    }
    fs.writeFileSync( helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance, "metadata.json" ), JSON.stringify( metadata ) );    
}


function getPersistenceState( publicPath, application, instance ) {
    result = undefined;
    potentialFilename = helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance, "persistenceState.vwf.json" );
    if ( helpers.IsFile( potentialFilename ) ) {
        var fileContents = fs.readFileSync( potentialFilename, "utf8" );
        result = JSON.parse( fileContents );
    }
    return result;
}

// WARNING: Take note, if an instance already has metadata, but you provide undefined metadata, the
//          old metadata will persist.
function setPersistenceState( publicPath, application, instance, state, metadata ) {
    var segments = helpers.generateSegments( publicPath );
    segments.push( application );
    segments.push( "instance_" + instance );
    var currentPath = storageRoot;
    for ( var index = 0; index < segments.length; index++ ) {
        currentPath = helpers.JoinPath( currentPath, segments[ index ] );
        if ( !( helpers.IsDirectory( currentPath ) ) ) {
            fs.mkdirSync( currentPath );
        }
    }
    fs.writeFileSync( helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance, "persistenceState.vwf.json" ), JSON.stringify( state ) );
    if ( metadata ) {
        fs.writeFileSync( helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance, "metadata.json" ), JSON.stringify( metadata ) ); 
    }
}

function listInstanceSaveStates( publicPath, application, instance ) {
    var result = [ ];
    var potentialDirName = helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance );
    if ( helpers.IsDirectory( potentialDirName ) ) {
        var potentialSaveNames = fs.readdirSync( potentialDirName.replace( /\//g, libpath.sep ) );
        for ( var index = 0; index < potentialSaveNames.length; index++ ) {
            if ( ( potentialSaveNames[ index ].match( /^save_*/ ) ) && ( helpers.IsDirectory( helpers.JoinPath( potentialDirName, potentialSaveNames[ index ] ) ) ) ) {
                if ( helpers.IsFile( helpers.JoinPath( potentialDirName, potentialSaveNames[ index ], "saveState.vwf.json" ) ) ) {
                    result.push( potentialSaveNames[ index ].slice( 5 ) );
                }
            }
        }
    }
    return result.sort();
}

function listApplicationSaveStates( publicPath, application ) {
    result = {};
    var applicationDirName = helpers.JoinPath( storageRoot, publicPath, application );
    if ( helpers.IsDirectory( applicationDirName ) ) {
        var potentialInstances = fs.readdirSync( applicationDirName.replace( /\//g, libpath.sep ) );
        for ( var index = 0; index < potentialInstances.length; index++ ) {
            if ( potentialInstances[ index ].match( /^instance_*/ ) ) {
                var instanceId = potentialInstances[ index ].slice( 9 );
                var instanceSaves = listInstanceSaveStates( publicPath, application, instanceId );
                if ( instanceSaves.length > 0 ) {
                    result[ instanceId ] = instanceSaves;
                }
            }
        }
    }
    return result;
}

function getSaveMetadata( publicPath, application, instance, saveName ) {
    result = undefined;
    potentialFilename = helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance, "save_" + saveName, "metadata.json" );
    if ( helpers.IsFile( potentialFilename ) ) {
        var fileContents = fs.readFileSync( potentialFilename, "utf8" );
        result = JSON.parse( fileContents );
    } else {
        potentialFilename = helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance, "metadata.json" );
        if ( helpers.IsFile( potentialFilename ) ) {
            var fileContents = fs.readFileSync( potentialFilename, "utf8" );
            result = JSON.parse( fileContents );
        }
    }
    return result;
}

function getSaveState( publicPath, application, instance, saveName ) {
    result = undefined;
    potentialFilename = helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance, "save_" + saveName, "saveState.vwf.json" );
    if ( helpers.IsFile( potentialFilename ) ) {
        var fileContents = fs.readFileSync( potentialFilename, "utf8" );
        result = JSON.parse( fileContents );
    }
    return result;
}

function setSaveState( publicPath, application, instance, saveName, saveState, metadata ) {
    var segments = helpers.generateSegments( publicPath );
    segments.push( application );
    segments.push( "instance_" + instance );
    segments.push( "save_" + saveName );
    var currentPath = storageRoot;
    for ( var index = 0; index < segments.length; index++ ) {
        currentPath = helpers.JoinPath( currentPath, segments[ index ] );
        if ( !( helpers.IsDirectory( currentPath ) ) ) {
            fs.mkdirSync( currentPath );
        }
    }
    fs.writeFileSync( helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance, "save_" + saveName, "saveState.vwf.json" ), JSON.stringify( saveState ) );
    if ( metadata ) {
        fs.writeFileSync( helpers.JoinPath( storageRoot, publicPath, application, "instance_" + instance, "save_" + saveName, "metadata.json" ), JSON.stringify( metadata ) ); 
    }
}

exports.ListApplicationInstances = listApplicationInstances;
exports.GetInstanceMetadata = getInstanceMetadata;
exports.SetInstanceMetadata = setInstanceMetadata;
exports.GetPersistenceState = getPersistenceState;
exports.SetPersistenceState = setPersistenceState;
exports.ListInstanceSaveStates = listInstanceSaveStates;
exports.ListApplicationSaveStates = listApplicationSaveStates;
exports.GetSaveMetadata = getSaveMetadata;
exports.GetSaveState = getSaveState;
exports.SetSaveState = setSaveState;