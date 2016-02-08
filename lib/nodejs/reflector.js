// reflector.js
// 

var parseurl = require( './parse-url' ),
    persistence = require( './persistence' ),
    helpers = require( './helpers' ),
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
	   
    //if it's a new instance, setup record 
    if( !global.instances[ namespace ] ) {
        global.instances[ namespace ] = { };
        global.instances[ namespace ].clients = { };
        global.instances[ namespace ].pendingList = [ ];
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
        global.instances[ namespace ].setTime( 0.0 );
        if ( saveObject ) {
            if ( saveObject[ "queue" ] ) {
                if ( saveObject[ "queue" ][ "time" ] ) {
                    global.instances[ namespace ].setTime( saveObject[ "queue" ][ "time" ] );
                }
             }
        }
        

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


        //keep track of the timer for this instance
        global.instances[ namespace ].timerID = setInterval( function ( ) {
            var message = { parameters: [ ], time: global.instances[ namespace ].getTime( ) };
            for ( var i in global.instances[ namespace ].clients ) {
                var client = global.instances[ namespace ].clients[ i ];
                if ( ! client.pending ) {
                    client.emit( 'message', message );
                }
            }
            if ( global.instances[ namespace ].pendingList.pending ) {
                global.instances[ namespace ].pendingList.push( message );
            }
        }, 100 );

    }

    //add the new client to the instance data
    global.instances[ namespace ].clients[ socket.id ] = socket;	 

    socket.pending = true;

    //Create a child in the application's 'clients.vwf' global to represent this client.
    var clientMessage = { action: "createChild", parameters: [ "http://vwf.example.com/clients.vwf", socket.id, {} ], time: global.instances[ namespace ].getTime( ) };

    // The time for the setState message should be the time the new client joins, so save that time
    var setStateTime = global.instances[ namespace ].getTime( );

    //The client is the first, is can just load the application, and mark it not pending
    if ( Object.keys( global.instances[ namespace ].clients ).length === 1 ) {

        if ( saveObject ) {
            socket.emit( 'message', { action: "setState", parameters: [saveObject], time: global.instances[ namespace ].getTime( ) } );
        }
        else {
            var instance = namespace;
            //Get the state and load it.
            //Now the server has a rough idea of what the simulation is

            socket.emit( 'message', { 
                action: "createNode", 
                parameters: [ "http://vwf.example.com/clients.vwf" ], 
                time: global.instances[ namespace ].getTime( ) 
            } );

            socket.emit( 'message', { 
                action: "createNode", 
                parameters: [
                    ( processedURL.public_path === "/" ? "" : processedURL.public_path ) + "/" + processedURL.application,
                    "application"
                ],
                time: global.instances[ namespace ].getTime( )
            } );

            socket.emit( 'message',  clientMessage );

        }
        socket.pending = false;
    }
    else {  //this client is not the first, we need to get the state and mark it pending
        if ( ! global.instances[ namespace ].pendingList.pending ) {
            var firstclient = Object.keys( global.instances[ namespace ].clients )[ 0 ];
            firstclient = global.instances[ namespace ].clients[ firstclient ];
            firstclient.emit( 'message', { action: "getState", respond: true, time: global.instances[ namespace ].getTime( ) } );
            global.instances[ namespace ].Log( 'GetState from Client', 2 );
            global.instances[ namespace ].pendingList.pending = true;
        }
        socket.pending = true;
        for ( var i in global.instances[ namespace ].clients ) {
            var client = global.instances[ namespace ].clients[ i ];
            if ( ! client.pending === true ) {
                client.emit ( 'message',  clientMessage );
            }
        }
        if ( global.instances[ namespace ].pendingList.pending ) {
            global.instances[ namespace ].pendingList.push( clientMessage );
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
                if ( client.pending ) {
                    global.instances[ namespace ].Log( 'Got State', 2 );
                    var state = message.result;
                    global.instances[ namespace ].Log( state, 2 );
                    client.emit( 'message', { action: "setState", parameters: [ state ], time: setStateTime } );
                    client.pending = false;
                    for ( var j = 0; j < global.instances[ namespace ].pendingList.length; j++ ) {
                        client.emit( 'message', global.instances[ namespace ].pendingList[ j ] );
                    }
                }
            }
            else {
                //just a regular message, so push if the client is pending a load, otherwise just send it.
                if ( ! client.pending ) {
                    client.emit( 'message', message );
                }
            }
        }
        if ( message.action == "getState" ) {
            global.instances[ namespace ].pendingList = [ ];
        } else if ( global.instances[ namespace ].pendingList.pending ) {
            global.instances[ namespace ].pendingList.push( message );
        }
    } );

    // When a client disconnects, go ahead and remove the instance data
    socket.on( 'disconnect', function ( ) {
        
        // Remove the disconnecting client
        global.instances[ namespace ].clients[ socket.id ] = null;  
        delete global.instances[ namespace ].clients[ socket.id ];
        
        // Notify others of the disconnecting client.  Delete the child representing this client in the application's `clients.vwf` global.
        var clientMessage = { action: "deleteChild", parameters: [ "http://vwf.example.com/clients.vwf", socket.id ], time: global.instances[ namespace ].getTime( ) };
        for ( var i in global.instances[ namespace ].clients ) {
            var client = global.instances[ namespace ].clients[ i ];
            if ( ! client.pending ) {
                client.emit ( 'message', clientMessage );
            }
        }
        if ( global.instances[ namespace ].pendingList.pending ) {
            global.instances[ namespace ].pendingList.push( clientMessage );
        }
        
        // If it's the last client, delete the data and the timer
        if ( Object.keys( global.instances[ namespace ].clients ).length == 0 ) {
            clearInterval( global.instances[ namespace ].timerID );
            delete global.instances[ namespace ];
        }
    } );
}

exports.OnConnection = OnConnection;