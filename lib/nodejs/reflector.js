// reflector.js
// 

var parseurl = require( './parse-url' ),
    persistence = require( './persistence' ),
    helpers = require( './helpers' ),
    storage = require( './storagefs' ),
    fs = require( 'fs' );

function parseSocketUrl( socket ) {
    var application = socket.handshake.url.substring(0, socket.handshake.url.indexOf("/1/?t="));
    return parseurl.Process( application );
}

function GetLoadForSocket( processedURL ) {
    if ( processedURL[ 'private_path' ] ) {
        return persistence.GetLoadInformation( processedURL );
    }
    return { 'save_name': undefined, 'save_revision': undefined, 'explicit_revision': undefined, 'application_path': undefined };
}

//Get the instance ID from the handshake headers for a socket
function GetNamespace( processedURL ) {
    if ( ( processedURL[ 'instance' ] ) && ( processedURL[ 'public_path' ] ) ) {
        return helpers.JoinPath( processedURL[ 'public_path' ], processedURL[ 'application' ], processedURL[ 'instance' ] );
    }
    return undefined;
}

function GetNow( ) {
    return new Date( ).getTime( ) / 1000.0;
}

function CreateInstance( namespace ) {
    if ( !global.instances ) {
        global.instances = { };
    }
    if ( !global.instances[ namespace ] ) {
        global.instances[ namespace ] = { };
        global.instances[ namespace ].clients = { };
        global.instances[ namespace ].start_time = undefined;
        global.instances[ namespace ].pause_time = undefined;
        global.instances[ namespace ].rate = 1.0;
        global.instances[ namespace ].setTime = function( time ) {
            this.start_time = GetNow( ) - time;
            this.pause_time = undefined;
            this.rate = 1.0;
        };
        global.instances[ namespace ].isPlaying = function( ) {
            if ( ( this.start_time != undefined ) && ( this.pause_time == undefined ) ) {
                return true;
            }
            return false
        };
        global.instances[ namespace ].isPaused = function( ) {
            if ( ( this.start_time != undefined ) && ( this.pause_time != undefined ) ) {
                return true;
            }
            return false
        };
        global.instances[ namespace ].isStopped = function( ) {
            if ( this.start_time == undefined ) {
                return true;
            }
            return false;
        };
        global.instances[ namespace ].getTime = function( ) {
            if ( this.isPlaying( ) ) {
                return ( GetNow( ) - this.start_time ) * this.rate;
            } else if ( this.isPaused( ) ) {
                return ( this.pause_time - this.start_time ) * this.rate;
            }
            else {
                return 0.0;
            }
        };
        global.instances[ namespace ].play = function( ) {
            if ( this.isStopped( ) ) {
                this.start_time = GetNow( );
                this.pause_time = undefined;
            } else if ( this.isPaused( ) ) {
                this.start_time = this.start_time + ( GetNow( ) - this.pause_time );
                this.pause_time = undefined;
            }
        };
        global.instances[ namespace ].pause = function( ) {
            if ( this.isPlaying( ) ) {
                this.pause_time = GetNow( );
            }
        };
        global.instances[ namespace ].stop = function( ) {
            if ( ( this.isPlaying( ) ) || ( this.isPaused( ) ) ) {
                this.start_time = undefined;
                this.pause_time = undefined;
            }
        };
        
        global.instances[ namespace ].state = { };

        var log;
        function generateLogFile() {
            try {
                if ( !fs.existsSync( './/log/' ) ) {
                    fs.mkdir( './/log/', function ( err ) {
                        if ( err ) {
                            console.log ( err );
                        } 
                    })
                }
                log = fs.createWriteStream( './/log/' + namespace.replace( /[\\\/]/g, '_' ), { 'flags': 'a' } );
            } catch( err ) {
                console.log( 'Error generating Node Server Log File\n');
            }
        }

        global.instances[ namespace ].Log = function ( message, level ) {
            if( global.logLevel >= level ) {
                if ( !log ) {
                    generateLogFile();
                }
                log.write( message + '\n' );
                global.log( message + '\n' );
            }
        };
        
        global.instances[ namespace ].Error = function ( message, level ) {
            var red, brown, reset;
            red   = '\u001b[31m';
            brown  = '\u001b[33m';
            reset = '\u001b[0m';
            if ( global.logLevel >= level ) {
                if ( !log ) {
                    generateLogFile();
                }
                log.write( message + '\n' );
                global.log( red + message + reset + '\n' );
            }
        };

        // FAKEAUTHORTIATIVESTATE
        global.instances[ namespace ].AuthoritativeState = undefined;
        global.instances[ namespace ].AuthoritativeStateTimestamp = undefined;
        global.instances[ namespace ].AuthoritativeStateRequestPending = false;
        // END OF FAKEAUTHORTIATIVESTATE
    }
}

function InstanceExists( namespace ) {
    if ( global.instances ) {
        if ( global.instances[ namespace ] ) {
            return true;
        }
    }
    return false;
}

function GetInstancePersistenceState( namespace ) {
    var result = undefined;
    if ( InstanceExists( namespace ) ) {
        if ( global.instances[ namespace ][ "persistence" ] != undefined ) {
            result = global.instances[ namespace ][ "persistence" ][ "state" ];
        }
    }
    return result;
}

function SetInstancePersistenceState( namespace, state ) {
    if ( ! InstanceExists( namespace ) ) {
        CreateInstance( namespace );
    }
    if ( global.instances[ namespace ][ "persistence" ] == undefined ) {
        global.instances[ namespace ][ "persistence" ] = { };
    }
    global.instances[ namespace ][ "persistence" ][ "state" ] = state;
}

function GetInstancePersistenceEnabled( namespace ) {
    var result = false;
    if ( InstanceExists( namespace ) ) {
        if ( global.instances[ namespace ][ "persistence" ] != undefined ) {
            if ( global.instances[ namespace ][ "persistence" ][ "enabled" ] != undefined ) {
                result = global.instances[ namespace ][ "persistence" ][ "enabled" ];
            }
        }
    }
    return result;
}

function SetInstancePersistenceEnabled( namespace, enabled ) {
    if ( ! InstanceExists( namespace ) ) {
        CreateInstance( namespace );
    }
    if ( global.instances[ namespace ][ "persistence" ] == undefined ) {
        global.instances[ namespace ][ "persistence" ] = { };
    }
    global.instances[ namespace ][ "persistence" ][ "enabled" ] = enabled;
}

function OnConnection( socket ) {

    var processedURL = parseSocketUrl( socket );

    //get instance for new connection
    var namespace = GetNamespace( processedURL );
    if ( namespace == undefined ) {
        return;
    }

    //prepare for persistence request in case that's what this is
    var loadInfo = GetLoadForSocket( processedURL );
    var saveObject = persistence.LoadSaveObject( loadInfo );

    //create or setup instance data
    //if it's a new instance, setup record 
    if ( !InstanceExists( namespace ) ) {
        CreateInstance( namespace );
    }
    if ( Object.keys( global.instances[ namespace ].clients ).length == 0 ) {
        if ( persistence.EnabledForApplication( processedURL ) ) {
            SetInstancePersistenceEnabled( namespace, true )
            var persistence_state = storage.GetPersistenceState( processedURL[ "public_path" ], processedURL[ "application" ], processedURL[ "instance" ] );
            if ( persistence_state ) {
                SetInstancePersistenceState( namespace, persistence_state );
            }
        }

    
        //create or open the log for this instance
        if(global.logLevel >= 2) {
            var log = fs.createWriteStream( './/Logs/' + namespace.replace( /[\\\/]/g, '_' ), { 'flags': 'a' } );
        }

        //keep track of the timer for this instance
        global.instances[ namespace ].setTime( 0.0 );

        if ( saveObject ) {
            if ( saveObject[ "queue" ] ) {
                if ( saveObject[ "queue" ][ "time" ] ) {
                    global.instances[ namespace ].setTime( saveObject[ "queue" ][ "time" ] );
                }
             }
        }
        else if ( GetInstancePersistenceState( namespace ) ) {
            var persistence_state = GetInstancePersistenceState( namespace );
            if ( persistence_state[ "queue" ] ) {
                if ( persistence_state[ "queue" ][ "time" ] ) {
                    global.instances[ namespace ].setTime( persistence_state[ "queue" ][ "time" ] );
                }
            }
        }
        global.instances[ namespace ].timerID = setInterval( function ( ) {
            for ( var i in global.instances[ namespace ].clients ) {
                var client = global.instances[ namespace ].clients[ i ];
                client.emit( 'message', { action: "tick", parameters: [ ], time: global.instances[ namespace ].getTime( ) } );
            }
            // FAKEAUTHORTIATIVESTATE
            if ( ( ( global.instances[ namespace ].AuthoritativeStateTimestamp == undefined ) || ( ( new Date ) - global.instances[ namespace ].AuthoritativeStateTimestamp > 10000 ) ) && ( global.instances[ namespace ].AuthoritativeStateRequestPending == false ) && ( Object.keys( global.instances[ namespace ].clients ).length > 0  ) ) {
                var firstclient = Object.keys( global.instances[ namespace ].clients )[ 0 ];
                firstclient = global.instances[ namespace ].clients[ firstclient ];
                firstclient.emit( 'message', { action: "getState", respond: true, time: global.instances[ namespace ].getTime( ) } );
                global.instances[ namespace ].AuthoritativeStateRequestPending = true;
            }
            // END OF FAKEAUTHORTIATIVESTATE
        }, 50 );

    }

    //add the new client to the instance data
    global.instances[ namespace ].clients[ socket.id ] = socket;	 

    socket.pending = true;
    socket.pendingList = [ ];

    //Create a child in the application's 'clients.vwf' global to represent this client.
    var clientMessage = { action: "createChild", parameters: [ "http-vwf-example-com-clients-vwf", socket.id, {} ], time: global.instances[ namespace ].getTime( ) };

    //The client is the first, is can just load the index.vwf, and mark it not pending
    if ( Object.keys( global.instances[ namespace ].clients ).length == 1 ) {

        if ( saveObject ) {
            socket.emit( 'message', { action: "setState", parameters: [ saveObject ], time: global.instances[ namespace ].getTime( ) } );
        }
        else if ( GetInstancePersistenceState( namespace ) ) {
            socket.emit( 'message', { action: "setState", parameters: [ GetInstancePersistenceState( namespace ) ], time: global.instances[ namespace ].getTime( ) } );
        }
        else {
            var instance = namespace;
            //Get the state and load it.
            //Now the server has a rough idea of what the simulation is

            socket.emit( 'message', { action: "createNode", parameters: [ "http://vwf.example.com/clients.vwf" ], time: global.instances[ namespace ].getTime( ) } );

            socket.emit( 'message', { action: "createNode", parameters: [ "index.vwf", "application" ], time: global.instances[ namespace ].getTime( ) } );

            socket.emit( 'message',  clientMessage );

        }
        socket.pending = false;
    }
    else {  //this client is not the first, we need to get the state and mark it pending
        var firstclient = Object.keys( global.instances[ namespace ].clients )[ 0 ];
        firstclient = global.instances[ namespace ].clients[ firstclient ];
        firstclient.emit( 'message', { action: "getState", respond: true, time: global.instances[ namespace ].getTime( ) } );
        global.instances[ namespace ].Log( 'GetState from Client', 2 );
        socket.pending = true;
        socket.pendingList.push( clientMessage );
        for ( var i in global.instances[ namespace ].clients ) {
            var client = global.instances[ namespace ].clients[ i ];
            if( client.id != socket.id ) {
                client.emit ( 'message',  clientMessage );
            }
        }
    }

    socket.on( 'message', function ( msg ) {

        //need to add the client identifier to all outgoing messages
        try {
            var message = JSON.parse( msg );
        }
        catch ( e ) {
            return;
        }
        message.client = socket.id;
        message.time = global.instances[ namespace ].getTime( );

        //distribute message to all clients on given instance
        for ( var i in global.instances[ namespace ].clients ) {
            var client = global.instances[ namespace ].clients[ i ];

            //if the message was get state, then fire all the pending messages after firing the setState
            if ( message.action == "getState" ) {
                global.instances[ namespace ].Log( 'Got State', 2 );
                var state = message.result;
                
                // FAKEAUTHORTIATIVESTATE
                if ( state ) {
                    global.instances[ namespace ].AuthoritativeState = state;
                    global.instances[ namespace ].AuthoritativeStateTimestamp = new Date;
                    global.instances[ namespace ].AuthoritativeStateRequestPending = false;
                }
                // END OF FAKEAUTHORTIATIVESTATE

                global.instances[ namespace ].Log( state, 2 );
                client.emit( 'message', { action: "setState", parameters: [ state ], time: global.instances[ namespace ].getTime( ) } );
                client.pending = false;
                for ( var j = 0; j < client.pendingList.length; j++ ) {
                    client.emit( 'message', client.pendingList[ j ] );
                }
                client.pendingList = [ ];
            }
            else {
                //just a regular message, so push if the client is pending a load, otherwise just send it.
                if ( client.pending === true ) {
                    client.pendingList.push( message );
                }
                else {
                    client.emit( 'message', message );
                }
            }
        }
    } );

    //When a client disconnects, go ahead and remove the instance data
    socket.on( 'disconnect', function ( ) {
        global.instances[ namespace ].clients[ socket.id ] = null;	
        delete global.instances[ namespace ].clients[ socket.id ];
        //if it's the last client, delete the data and the timer

        if ( Object.keys( global.instances[ namespace ].clients ).length == 0 ) {
            if ( ( GetInstancePersistenceEnabled( namespace ) ) && ( global.instances[ namespace ].AuthoritativeState ) ) {
                storage.SetPersistenceState( processedURL[ 'public_path' ], processedURL[ 'application' ], processedURL[ 'instance' ], global.instances[ namespace ].AuthoritativeState, undefined );
            }
            clearInterval( global.instances[ namespace ].timerID );
            delete global.instances[ namespace ];
        }
    } );
}

exports.OnConnection = OnConnection;
exports.CreateInstance = CreateInstance;
exports.InstanceExists = InstanceExists;
