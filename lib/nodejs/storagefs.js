// storagefs.js
// This file contains the functions that handle filesystem based storage.

var helpers = require( './helpers' ),
    fs = require( 'fs' ),
    url = require( 'url' ),
    libpath = require( 'path' );


var storage_root = "./documents";

function list_application_instances( public_path, application ) {
    var result = [ ];
    var potential_app_dir = helpers.JoinPath( storage_root, public_path, application );
    if ( helpers.IsDirectory( potential_app_dir ) ) {
        var potential_instances = fs.readdirSync( potential_app_dir.replace( /\//g, libpath.sep ) );
        for ( var index = 0; index < potential_instances; index++ ) {
            if ( ( helpers.IsDirectory( helpers.JoinPath( potential_app_dir, potential_instances[ index ] ) ) ) && ( potential_instances[ index ].match( /^instance_*/ ) ) ) {
                var potential_instance_id = potential_instances[ index ].slice( 9 );
                if ( ( get_instance_metadata( public_path, application, potential_instance_id ) != undefined ) && ( get_persistence_state( public_path, application, potential_instance_id ) != undefined ) && ( list_instance_save_states( public_path, application, potential_instance_id ).length == 0 ) ) {
                    result.push( potential_instance_id );
                }
            }
        }
    }
    return result.sort();
}

function get_instance_metadata( public_path, application, instance ) {
    result = undefined;
    potential_filename = helpers.JoinPath( storage_root, public_path, application, "instance_" + instance, "metadata.json" );
    if ( helpers.IsFile( potential_filename ) ) {
        var file_contents = fs.readFileSync( potential_filename, "utf8" );
        result = JSON.parse( file_contents );
    }
    return result;
}

function set_instance_metadata( public_path, application, instance, metadata ) {
    var segments = helpers.GenerateSegments( public_path );
    segments.push( application );
    segments.push( "instance_" + instance );
    var current_path = storage_root;
    for ( var index = 0; index < segments.length; index++ ) {
        current_path = helpers.JoinPath( current_path, segments[ index ] );
        if ( !( helpers.IsDirectory( current_path ) ) ) {
            fs.mkdirSync( current_path );
        }
    }
    fs.writeFileSync( helpers.JoinPath( storage_root, public_path, application, "instance_" + instance, "metadata.json" ), JSON.stringify( metadata ) );    
}


function get_persistence_state( public_path, application, instance ) {
    result = undefined;
    potential_filename = helpers.JoinPath( storage_root, public_path, application, "instance_" + instance, "persistenceState.vwf.json" );
    if ( helpers.IsFile( potential_filename ) ) {
        var file_contents = fs.readFileSync( potential_filename, "utf8" );
        result = JSON.parse( file_contents );
    }
    return result;
}

// WARNING: Take note, if an instance already has metadata, but you provide undefined metadata, the
//          old metadata will persist.
function set_persistence_state( public_path, application, instance, state, metadata ) {
    var segments = helpers.GenerateSegments( public_path );
    segments.push( application );
    segments.push( "instance_" + instance );
    var current_path = storage_root;
    for ( var index = 0; index < segments.length; index++ ) {
        current_path = helpers.JoinPath( current_path, segments[ index ] );
        if ( !( helpers.IsDirectory( current_path ) ) ) {
            fs.mkdirSync( current_path );
        }
    }
    fs.writeFileSync( helpers.JoinPath( storage_root, public_path, application, "instance_" + instance, "persistenceState.vwf.json" ), JSON.stringify( state ) );
    if ( metadata ) {
        fs.writeFileSync( helpers.JoinPath( storage_root, public_path, application, "instance_" + instance, "metadata.json" ), JSON.stringify( metadata ) ); 
    }
}

function list_instance_save_states( public_path, application, instance ) {
    var result = [ ];
    var potential_dir_name = helpers.JoinPath( storage_root, public_path, application, "instance_" + instance );
    if ( helpers.IsDirectory( potential_dir_name ) ) {
        var potential_save_names = fs.readdirSync( potential_dir_name.replace( /\//g, libpath.sep ) );
        for ( var index = 0; index < potential_save_names.length; index++ ) {
            if ( ( potential_save_names[ index ].match( /^save_*/ ) ) && ( helpers.IsDirectory( helpers.JoinPath( potential_dir_name, potential_save_names[ index ] ) ) ) ) {
                if ( helpers.IsFile( helpers.JoinPath( potential_dir_name, potential_save_names[ index ], "saveState.vwf.json" ) ) ) {
                    result.push( potential_save_names[ index ].slice( 5 ) );
                }
            }
        }
    }
    return result.sort();
}

function list_application_save_states( public_path, application ) {
    result = {};
    var application_dir_name = helpers.JoinPath( storage_root, public_path, application );
    if ( helpers.IsDirectory( application_dir_name ) ) {
        var potential_instances = fs.readdirSync( application_dir_name.replace( /\//g, libpath.sep ) );
        for ( var index = 0; index < potential_instances.length; index++ ) {
            if ( potential_instances[ index ].match( /^instance_*/ ) ) {
                var instance_id = potential_instances[ index ].slice( 9 );
                var instance_saves = list_instance_save_states( public_path, application, instance_id );
                if ( instance_saves.length > 0 ) {
                    result[ instance_id ] = instance_saves;
                }
            }
        }
    }
    return result;
}

function get_save_metadata( public_path, application, instance, save_name ) {
    result = undefined;
    potential_filename = helpers.JoinPath( storage_root, public_path, application, "instance_" + instance, "save_" + save_name, "metadata.json" );
    if ( helpers.IsFile( potential_filename ) ) {
        var file_contents = fs.readFileSync( potential_filename, "utf8" );
        result = JSON.parse( file_contents );
    } else {
        potential_filename = helpers.JoinPath( storage_root, public_path, application, "instance_" + instance, "metadata.json" );
        if ( helpers.IsFile( potential_filename ) ) {
            var file_contents = fs.readFileSync( potential_filename, "utf8" );
            result = JSON.parse( file_contents );
        }
    }
    return result;
}

function get_save_state( public_path, application, instance, save_name ) {
    result = undefined;
    potential_filename = helpers.JoinPath( storage_root, public_path, application, "instance_" + instance, "save_" + save_name, "saveState.vwf.json" );
    if ( helpers.IsFile( potential_filename ) ) {
        var file_contents = fs.readFileSync( potential_filename, "utf8" );
        result = JSON.parse( file_contents );
    }
    return result;
}

function set_save_state( public_path, application, instance, save_name, save_state, metadata ) {
    var segments = helpers.GenerateSegments( public_path );
    segments.push( application );
    segments.push( "instance_" + instance );
    segments.push( "save_" + save_name );
    var current_path = storage_root;
    for ( var index = 0; index < segments.length; index++ ) {
        current_path = helpers.JoinPath( current_path, segments[ index ] );
        if ( !( helpers.IsDirectory( current_path ) ) ) {
            fs.mkdirSync( current_path );
        }
    }
    fs.writeFileSync( helpers.JoinPath( storage_root, public_path, application, "instance_" + instance, "save_" + save_name, "saveState.vwf.json" ), JSON.stringify( save_state ) );
    if ( metadata ) {
        fs.writeFileSync( helpers.JoinPath( storage_root, public_path, application, "instance_" + instance, "save_" + save_name, "metadata.json" ), JSON.stringify( metadata ) ); 
    }
}

exports.ListApplicationInstances = list_application_instances;
exports.GetInstanceMetadata = get_instance_metadata;
exports.SetInstanceMetadata = set_instance_metadata;
exports.GetPersistenceState = get_persistence_state;
exports.SetPersistenceState = set_persistence_state;
exports.ListInstanceSaveStates = list_instance_save_states;
exports.ListApplicationSaveStates = list_application_save_states;
exports.GetSaveMetadata = get_save_metadata;
exports.GetSaveState = get_save_state;
exports.SetSaveState = set_save_state;