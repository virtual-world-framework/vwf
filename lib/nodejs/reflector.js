// reflector.js
// 

var parseurl = require( './parse-url' ),
    persistence = require( './persistence' ),
    helpers = require( './helpers' ),
    fs = require( 'fs' );

function GetLoadForSocket( socket ) {
    var referer = (socket.handshake.headers.referer);
    var host = (socket.handshake.headers.host);
    if ( referer.indexOf( host ) > -1 ) {
        var updatedURL = referer.substr( referer.indexOf( host ) + host.length );
        var processedURL = parseurl.Process( updatedURL );
        if ( processedURL[ 'private_path' ] ) {
            return persistence.GetLoadInformation( processedURL );
        }
    }
    return { 'save_name': undefined, 'save_revision': undefined, 'explicit_revision': undefined, 'application_path': undefined };
}

//Get the instance ID from the handshake headers for a socket
function GetNamespace( socket ) {
    var referer = (socket.handshake.headers.referer);
    var host = (socket.handshake.headers.host);
    if ( referer.indexOf( host ) > -1 ) {
        var updatedURL = referer.substr( referer.indexOf( host ) + host.length );
        var processedURL = parseurl.Process( updatedURL );
        if ( ( processedURL[ 'instance' ] ) && ( processedURL[ 'public_path' ] ) ) {
            return helpers.JoinPath( processedURL[ 'public_path' ], processedURL[ 'application' ], processedURL[ 'instance' ] );
        }
    }
    return undefined;
}

function OnConnection( socket ) {

    //get instance for new connection
    var namespace = GetNamespace( socket );
    if ( namespace == undefined ) {
        return;
    }

    var loadInfo = GetLoadForSocket( socket );
    var saveObject = persistence.LoadSaveObject( loadInfo );


    //create or setup instance data
    if ( !global.instances ) {
        global.instances = {};
    }
	   
    //if it's a new instance, setup record 
    if( !global.instances[ namespace ] ) {
        global.instances[ namespace ] = { };
        global.instances[ namespace ].clients = { };
        global.instances[ namespace ].time = 0.0;
        if ( saveObject ) {
            if ( saveObject[ "queue" ] ) {
                if ( saveObject[ "queue" ][ "time" ] ) {
                    global.instances[ namespace ].time = saveObject[ "queue" ][ "time" ];
                }
             }
        }
        global.instances[ namespace ].rate = 1.0;
        global.instances[ namespace ].playing = true;
        global.instances[ namespace ].paused = false;
        global.instances[ namespace ].stopped = false;
        global.instances[ namespace ].state = { };
    
        //create or open the log for this instance
        if(global.logLevel >= 2) {
            var log = fs.createWriteStream( './/Logs/' + namespace.replace( /[\\\/]/g, '_' ), { 'flags': 'a' } );
        }

        global.instances[ namespace ].Log = function ( message, level ) {
            if( global.logLevel >= level ) {
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
                log.write( message + '\n' );
                global.log( red + message + reset + '\n' );
            }
        };


        //keep track of the timer for this instance
        global.instances[ namespace ].timerID = setInterval( function ( ) {
            if ( global.instances[ namespace ].playing ) {
                global.instances[ namespace ].time += 0.05 * global.instances[ namespace ].rate;
            }
            for ( var i in global.instances[ namespace ].clients ) {
                var client = global.instances[ namespace ].clients[ i ];
                client.emit( 'message', { action: "tick", parameters: [ ], time: global.instances[ namespace ].time } );
            }
        }, 50 );

    }

    //add the new client to the instance data
    global.instances[ namespace ].clients[ socket.id ] = socket;	 

    socket.pending = true;
    socket.pendingList = [ ];


    //The client is the first, is can just load the index.vwf, and mark it not pending
    if ( Object.keys( global.instances[ namespace ].clients ).length == 1 ) {

        if ( saveObject ) {
            socket.emit( 'message', { action: "setState", parameters: [saveObject], time: global.instances[ namespace ].time } );
        }
        else {
            var instance = namespace;
            //Get the state and load it.
            //Now the server has a rough idea of what the simulation is

            socket.emit( 'message', { action: "createNode", parameters: [ "http://vwf.example.com/clients.vwf" ], time: global.instances[ namespace ].time } );

            socket.emit( 'message', { action: "createNode", parameters: [ "index.vwf", "application" ], time: global.instances[ namespace ].time } );

        }
        socket.pending = false;
    }
    else {  //this client is not the first, we need to get the state and mark it pending
        var firstclient = Object.keys( global.instances[ namespace ].clients )[ 0 ];
        firstclient = global.instances[ namespace ].clients[ firstclient ];
        firstclient.emit( 'message', { action: "getState", respond: true, time: global.instances[ namespace ].time } );
        global.instances[ namespace ].Log( 'GetState from Client', 2 );
        socket.pending = true;
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

        //distribute message to all clients on given instance
        for ( var i in global.instances[ namespace ].clients ) {
            var client = global.instances[ namespace ].clients[ i ];

            //if the message was get state, then fire all the pending messages after firing the setState
            if ( message.action == "getState" ) {
                global.instances[ namespace ].Log( 'Got State', 2 );
                var state = message.result;
                global.instances[ namespace ].Log( state, 2 );
                client.emit( 'message', { action: "setState", parameters: [ state ], time: global.instances[ namespace ].time } );
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
            clearInterval( global.instances[ namespace ].timerID );
            delete global.instances[ namespace ];
        }
    } );
}

exports.OnConnection = OnConnection;