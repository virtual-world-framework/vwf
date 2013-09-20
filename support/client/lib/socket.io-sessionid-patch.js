// Copyright 2013 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

( function () { 

    // Only patch if running older Socket.io version i.e. 0.6.3, Ruby server

	if ( parseFloat( io.version ) >= 0.7 ) {
	    return;
    }


	var transport = io.Transport;
	var transports = [ transport, transport.websocket, transport.flashsocket ];

	// This overrides socket.io's Transport.onDisconnect that resets the sessionid on disconnect
	// We would like to keep it around so it can be reused on reconnect so the application understands that this 
	// is an existing client reconnecting, instead of a new client
	transports.map( function( trans ) {
		if ( !trans ) {
			return;
		}
		trans.prototype.onDisconnect = function( message ){
			this.connecting = false;
			this.connected = false;
			this.base.onDisconnect();
		}
	} );

	// This overrides socket.io's onMessage functions to have it register that a connection has been made, even 
	// when the sessionid is not null
	var xhrTransports = [ transport.XHR, transport.htmlfile, transport['xhr-multipart'], 
	                      transport['xhr-polling'], transport['jsonp-polling'] ];
	transports = transports.concat( xhrTransports );
	transports.map( function( trans ) {
		if ( !trans ) {
			return;
		}
	  	var oldOnMessage = trans.prototype.onMessage;
		trans.prototype.onMessage = function( message ){
			oldOnMessage.call( this, message );
			if ( !this.connected ) {
				this.onConnect();
			}
		}
	} );
} )();