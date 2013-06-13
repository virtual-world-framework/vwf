"use strict";

// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
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

/// @module vwf/view/webrtc
/// @requires vwf/view

define( [ "module", "vwf/view" ], function( module, view ) {

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function( options ) {

            if ( !this.state ) {   
                this.state = {};
            }
            
            this.state.clients = {};
            this.local = {
                "ID": undefined,
                "url": undefined,
                "stream": undefined, 
            };

            if ( options === undefined ) { options = {}; }

            this.captureVideo = options.video !== undefined  ? options.video : true;
            this.captureAudio = options.audio !== undefined  ? options.audio : true;
            this.debug = options.debug !== undefined  ? options.debug : false;
            this.videoElementsDiv = options.videoElementsDiv !== undefined  ? options.videoElementsDiv : 'videoSurfaces';
            this.createVideoElements = options.createVideoElements !== undefined  ? options.createVideoElements : true;


            this.videosAdded = 0;

        },
  
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            if ( childExtendsID === undefined )
                return;

            //console.info( "webrtc.createdNode(  "+nodeID+", "+childID+", "+childExtendsID+", "+childImplementsIDs+", "+childSource+", "+childType+", "+childIndex+", "+childName+" )" );
            var self = this, node;
            
            var protos = getPrototypes.call( self, childExtendsID )
   
            if ( isClientDefinition.call( this, protos ) && childName ) {

                //console.info( "local moniker: " + this.kernel.moniker() );
                // check if this instance of client and if this client is for this instance
                // create a login for this 
                var node = {
                    "parentID": nodeID,
                    "ID": childID,
                    "moniker": undefined,
                    "extendsID": childExtendsID,
                    "implementsIDs": childImplementsIDs,
                    "source": childSource,
                    "type": childType,
                    "name": childName,
                    "prototypes": protos,
                    "displayName": "",
                    "connection": undefined,
                    "localUrl": undefined, 
                    "remoteUrl": undefined,
                    "createProperty": true                    
                };

                this.state.clients[ childID ] = node;
                
                // add the client specific locals
                node.moniker = appMoniker.call( this, childName );
                //console.info( "new client moniker: " + node.moniker );
                node.displayName = undefined;
                node.prototypes = protos;

                if ( this.kernel.moniker() == node.moniker ) { 
                    this.local.ID = childID;
                    
                    if ( this.videoElementsDiv ) {
                        jQuery('body').append(
                            "<div id='"+this.videoElementsDiv+"'></div>"
                        );                   
                    }
                } 
            }

        }, 

        initializedNode: function( nodeID, childID, childExtendsID, childImplementsIDs, 
            childSource, childType, childIndex, childName ) {

            if ( childExtendsID === undefined )
                return;

            //console.info( "  initializedNode(  "+nodeID+", "+childID+", "+childExtendsID+", "+childName+" )" );
            var client = this.state.clients[ childID ];

            if ( client ) {
                if ( this.local.ID == childID ){
                    
                    // local client object
                    // grab access to the webcam 
                    capture.call( this, childID );
                    
                    var remoteClient = undefined;
                    // existing clients
                    for ( var clientID in this.state.clients ) {
                        
                        if ( clientID != this.local.ID ) {
                            // create property for this client on each existing client
                            remoteClient = this.state.clients[ clientID ];

                            if ( remoteClient.createProperty ) {
                                //console.info( "++ 1 ++    createProperty( "+clientID+", "+this.kernel.moniker()+" )" );  
                                remoteClient.createProperty = false;
                                this.kernel.createProperty( clientID, this.kernel.moniker() );                                
                            }                          
                        }
                    }
                } else {
                    // not the local client, but if the local client has logged
                    // in create the property for this on the new client
                    if ( this.local.ID )   {
                        if ( client.createProperty ) {
                            client.createProperty = false;
                            //console.info( "++ 2 ++    createProperty( "+childID+", "+this.kernel.moniker()+" )" );
                            this.kernel.createProperty( childID, this.kernel.moniker() );
                        }
                    }
                }
            }            
        },

        //deletedNode: function( nodeID ) {
        //},
  
        createdProperty: function( nodeID, propertyName, propertyValue ) {
            //console.info( "webrtc.createdProperty( "+nodeID+", "+propertyName+", "+propertyValue+" )" );
            this.satProperty( nodeID, propertyName, propertyValue );
        },        

        initializedProperty: function( nodeID, propertyName, propertyValue ) {
            //console.info( "webrtc.initializedProperty( "+nodeID+", "+propertyName+", "+propertyValue+" )" );
            this.satProperty( nodeID, propertyName, propertyValue );
        },        

        satProperty: function( nodeID, propertyName, propertyValue ) {
            
            //if ( !propertyValue ) return;
            var client = this.state.clients[ nodeID ];

            //console.info( "webrtc.satProperty( "+nodeID+", "+propertyName+", "+propertyValue+" )" );

            if ( client ) {
                //console.info( "webrtc.satProperty( "+nodeID+", "+propertyName+", "+propertyValue+" )" );
                switch( propertyName ) {
                    case "localUrl":
                        if ( propertyValue ) {
                            if ( nodeID != this.local.ID ) {
                                client.localUrl = propertyValue;
                            }
                        }
                        break;

                    case "remoteUrl":
                        if ( propertyValue ) {
                            client.remoteUrl = propertyValue;
                         }
                        break;

                    case "displayName":
                        if ( propertyValue ) {
                            client.displayName = propertyValue;
                        }
                        break; 



                    default:  
                        // propertyName is the moniker of the client that 
                        // this connection supports
                        if ( nodeID == this.local.ID ) {
                            if ( propertyValue ) {
                                // propertyName - moniker of the client
                                // propertyValue - peerConnection message
                                handlePeerMessage.call( this, propertyName, propertyValue );
                            }
                        }
                        break;
                }
            }
        },

        //gotProperty: function( nodeID, propertyName, propertyValue ) {
            // console.info( "GP webrtc.gotProperty( "+nodeID+", "+propertyName+", "+propertyValue+" )" );
            // var value = undefined;

            // return value;
        //},

        //calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {
        //},       

        //firedEvent: function( nodeID, eventName, eventParameters ) {
        //},

    } );
 
    function getPrototypes( extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = this.kernel.prototype( id );
        }
                
        return prototypes;
    }

    function getPeer( moniker ) {
        var clientNode;
        for ( var id in this.state.clients ) {
            if ( this.state.clients[id].moniker == moniker ) {
                clientNode = this.state.clients[id];
                break;
            }
        }
        return clientNode;
    }

    function displayLocal( name ) {
        displayVideo.call( this, this.local.url, name, true );
    }

    function displayVideo( url, name, muted ) {
        
        if ( this.createVideoElements ) {
            //debugger;
            this.videosAdded++
            var $container;
            var divId = name + this.videosAdded;
            var videoId = "video-" + divId;

            $container = $( "#" + this.videoElementsDiv );
            if ( muted ) {
                $container.append(
                    "<div id='"+ divId + "'>" +
                        "<video class='vwf-webrtc-video' id='" + videoId +
                            "' width='320' height='240' src='" + url + 
                            "' loop='loop' autoplay = true muted" +
                            " style='position: absolute; left: 0; top: 0; z-index: 40;'>" +
                        "</video>" +
                    "</div>"
                );                
            } else {
                $container.append(
                    "<div id='"+ divId + "'>" +
                        "<video class='vwf-webrtc-video' id='" + videoId +
                            "' width='320' height='240' src='" + url + 
                            "' loop='loop' autoplay = true" +
                            " style='position: absolute; left: 0; top: 0; z-index: 40;'>" +
                        "</video>" +
                    "</div>"
                );
            }
            $('#'+divId).draggable();
        }
        

        // notify the view 
        // used to customize the video elements
        //if ( addVideoElement ) {
        //    addVideoElement( url, name );
        //}
    }

    function displayRemote( url, name ) {
        displayVideo.call( this, url, name, false );
    }

    function capture() {

        if ( this.local.stream === undefined && ( this.captureVideo || this.captureAudio ) ) {
            var self = this;
            var constraints = { 
                "audio": this.captureAudio, 
                "video": this.captureVideo ? { "mandatory": {}, "optional": [] } : false, 
            };
            
            var successCallback = function( stream ) {
                self.local.url = URL.createObjectURL( stream );
                self.local.stream = stream;

                self.kernel.setProperty( self.local.ID, "localUrl", self.local.url );

                displayLocal.call( self, self.state.clients[ self.local.ID ].displayName );
                sendOffers.call( self );
            };

            var errorCallback = function( error ) { 
                console.log("failed to get video stream error: " + error); 
            };

            try { 
                getUserMedia( constraints, successCallback, errorCallback );
            } catch (e) { 
                console.log("getUserMedia: error " + e ); 
            };
        }
    }  

    function appMoniker( name ) {
        return name.substr( 6, name.length-1 );
    }

    function sendOffers() {
        var peerNode;
        for ( var id in this.state.clients ) {
            if ( id != this.local.ID ) {
                peerNode = this.state.clients[ id ];
                
                // if there's a url then connect                     
                if ( peerNode.localUrl && peerNode.localUrl != "" && peerNode.connection === undefined ) {
                    createPeerConnection.call( this, peerNode, true );   
                }                
            }
        }
        

    }

    function setMute( mute ) {
        if ( this.local.stream && this.local.stream.audioTracks && this.local.stream.audioTracks.length > 0 ) {
          if ( mute !== undefined ) {
            this.local.stream.audioTracks[0].enabled = !mute;
          }
        }
    };

    function setPause( pause ) {
        if ( this.local.stream && this.local.stream.videoTracks && this.local.stream.videoTracks.length > 0 ) {
            if ( pause !== undefined ) {
                this.local.stream.videoTracks[0].enabled = !pause;
            }
        }
    }

    function release() {
      for ( id in this.connections ) {
          this.connections[id].disconnect();
      } 
      this.connections = {};
    }  

    function hasStream() {
        return ( this.stream !== undefined );
    }

    function createPeerConnection( peerNode, sendOffer ) {
        if ( peerNode ) {
            if ( peerNode.connection === undefined ) {
                peerNode.connection = new mediaConnection( this, peerNode );
                peerNode.connection.connect( this.local.stream, sendOffer );
            }
        }
    }

    function handlePeerMessage( propertyName, msg ) {
        var peerNode = getPeer.call( this, propertyName )
        if ( peerNode ) {
            if ( peerNode.connection === undefined ) {
                peerNode.connection = new mediaConnection( this, peerNode );
                peerNode.connection.connect( this.local.stream, false );
            }

            peerNode.connection.processMessage( msg );
        }     
    }

    function deletePeerConnection( peerID ) {
        var peerNode = this.state.clients[ peerID ];
        if ( peerNode ) {
            peerNode.connection.disconnect();
            peerNode.connection = undefined;
        }
    } 

    function getConnectionStats() {
        var peerNode = undefined;
        for ( var id in this.state.clients ) {
            peerNode = this.state.clients[ id ];
            if ( peerNode && peerNode.connection ) {
                peerNode.connection.getStats();
            }
        } 
    }

    function isClientDefinition( prototypes ) {
        var foundClient = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundClient; i++ ) {
                foundClient = ( prototypes[i] == "http-vwf-example-com-client-vwf" );    
            }
        }

        return foundClient;
    }

    function mediaConnection( view, peerNode ) {
        this.view = view;
        this.peerNode = peerNode;        
        
        // 
        this.stream = undefined;
        this.url = undefined;
        this.pc = undefined;
        this.connected = false;
        this.streamAdded = false;
        this.state = "created";

        // webrtc peerConnection parameters
        this.pc_config = { "iceServers": [ { "url": "stun:stun.l.google.com:19302" } ] };
        this.pc_constraints = { "optional": [ { "DtlsSrtpKeyAgreement": true } ] };
        // Set up audio and video regardless of what devices are present.
        this.sdpConstraints = { 'mandatory': {
                                'OfferToReceiveAudio':true, 
                                'OfferToReceiveVideo':true }};

        this.connect = function( stream, sendOffer ) {
            var self = this;
            if ( this.pc === undefined ) {
                if ( this.view.debug ) console.log("Creating PeerConnection.");
                
                var iceCallback = function( event ) {
                    //console.log( "------------------------ iceCallback ------------------------" );
                    if ( event.candidate ) {
                        var sMsg = { 
                            "type": 'candidate',
                            "label": event.candidate.sdpMLineIndex,
                            "id": event.candidate.sdpMid,
                            "candidate": event.candidate.candidate
                        };

                        // each client creates a property for each other
                        // the message value is broadcast via the property
                        self.view.kernel.setProperty( self.peerNode.ID, self.view.kernel.moniker(), sMsg );
                    } else {
                        if ( self.view.debug ) console.log("End of candidates.");
                    }
                }; 

                if ( webrtcDetectedBrowser == "firefox" ) {
                    this.pc_config = {"iceServers":[{"url":"stun:23.21.150.121"}]};
                }

                try {
                    this.pc = new RTCPeerConnection( this.pc_config, this.pc_constraints );
                    this.pc.onicecandidate = iceCallback;

                    if ( self.view.debug ) console.log("Created RTCPeerConnnection with config \"" + JSON.stringify( this.pc_config ) + "\".");
                } catch (e) {
                    console.log("Failed to create PeerConnection, exception: " + e.message);
                    alert("Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.");
                    return;
                } 

                this.pc.onnegotiationeeded = function( event ) {
                    //debugger;
                    //console.info( "onnegotiationeeded." );
                }

                this.pc.onaddstream = function( event ) {
                    if ( self.view.debug ) console.log("Remote stream added.");
                    
                    self.stream = event.stream;
                    self.url = URL.createObjectURL( event.stream );
                    
                    if ( self.view.debug ) console.log("Remote stream added.  url: " + self.url );

                    displayRemote.call( self.view, self.url, self.peerNode.displayName );
                };

                this.pc.onremovestream = function( event ) {
                    if ( self.view.debug ) console.log("Remote stream removed.");
                };

                this.pc.onsignalingstatechange = function() {
                    //console.info( "onsignalingstatechange state change." );
                }

                this.pc.oniceconnectionstatechange = function( ) {
                    var state = self.pc.signalingState || self.pc.readyState;
                    //console.info( "peerConnection state change: " + state ); 
                }

                if ( stream ) {
                    if ( this.view.debug ) console.log("Adding local stream.");

                    this.pc.addStream( stream );
                    this.streamAdded = true;
                }

                if ( sendOffer ){
                    this.call();
                }
            }
            this.connected = ( this.pc !== undefined );
        };

        this.setMute = function( mute ) {
            if ( this.stream && this.stream.audioTracks && this.stream.audioTracks.length > 0 ) {
                if ( mute !== undefined ) {
                    this.stream.audioTracks[0].enabled = !mute;
                }
            }
        }

        this.setPause = function( pause ) {
            if ( this.stream && this.stream.videoTracks && this.stream.videoTracks.length > 0 ) {
                if ( pause !== undefined ) {
                    this.stream.videoTracks[0].enabled = !pause;
                }
            }
        }

        this.disconnect = function() {
            if ( this.view.debug ) console.log( "PC.disconnect  " + this.peerID );
            
            if ( this.pc ) {
                this.pc.close();
                this.pc = undefined;
            }
        };

        this.processMessage = function( msg ) {
            //var msg = JSON.parse(message); 
            if ( this.view.debug ) console.log('S->C: ' +  JSON.stringify(msg) );
            if ( this.pc ) {
                if ( msg.type === 'offer') {
                    this.pc.setRemoteDescription( new RTCSessionDescription( msg ) );
                    this.answer();
                } else if ( msg.type === 'answer' && this.streamAdded ) {
                    this.pc.setRemoteDescription( new RTCSessionDescription( msg ) );
                } else if ( msg.type === 'candidate' && this.streamAdded ) {
                    var candidate = new RTCIceCandidate( { 
                        "sdpMLineIndex": msg.label,
                        "candidate": msg.candidate 
                    } );
                    this.pc.addIceCandidate( candidate );
                } else if ( msg.type === 'bye' && this.streamAdded ) {
                    this.hangup();
                }
            } 
        };

        this.answer = function() {
            if ( this.view.debug ) console.log( "Send answer to peer" );
            
            var self = this;
            var answerer = function( sessionDescription ) {
                // Set Opus as the preferred codec in SDP if Opus is present.
                sessionDescription.sdp = self.preferOpus( sessionDescription.sdp );
                self.pc.setLocalDescription( sessionDescription );

                self.view.kernel.setProperty( self.peerNode.ID, self.view.kernel.moniker(), sessionDescription );
            };

            this.pc.createAnswer( answerer, null, this.sdpConstraints);
        };

        this.call = function() {
            var self = this;
            var constraints = {
                "optional": [], 
                "mandatory": {"MozDontOfferDataChannel": true }
            };

            // temporary measure to remove Moz* constraints in Chrome
            if ( webrtcDetectedBrowser === "chrome" ) {
                for ( var prop in constraints.mandatory ) {
                    if ( prop.indexOf("Moz") != -1 ) {
                        delete constraints.mandatory[ prop ];
                    }
                }
            }   
            constraints = this.mergeConstraints( constraints, this.sdpConstraints );

            if ( this.view.debug ) console.log("Sending offer to peer, with constraints: \n" +  "  \"" + JSON.stringify(constraints) + "\".")
          
            var offerer = function( sessionDescription ) {
                // Set Opus as the preferred codec in SDP if Opus is present.
                sessionDescription.sdp = self.preferOpus( sessionDescription.sdp );
                self.pc.setLocalDescription( sessionDescription );
                
                //sendSignalMessage.call( sessionDescription, self.peerID );
                self.view.kernel.setProperty( self.peerNode.ID, self.view.kernel.moniker(), sessionDescription );
            };

            this.pc.createOffer( offerer, null, constraints );
        };

        this.getStats = function(){
          if ( this.pc && this.pc.getStats ) {
            console.info( "pc.iceConnectionState = " + this.pc.iceConnectionState );
            console.info( " pc.iceGatheringState = " + this.pc.iceGatheringState );
            console.info( "        pc.readyState = " + this.pc.readyState );
            console.info( "    pc.signalingState = " + this.pc.signalingState );

            var consoleStats = function( obj ) {
                console.info( '   Timestamp:' + obj.timestamp );
                if ( obj.id ) {
                    console.info( '        id: ' + obj.id );
                }
                if ( obj.type ) {
                    console.info( '        type: ' + obj.type );
                }
                if ( obj.names ) {
                    var names = obj.names();
                    for ( var i = 0; i < names.length; ++i ) {
                        console.info( "         "+names[ i ]+": " + obj.stat( names[ i ] ) );
                    }
                } else {
                    if ( obj.stat && obj.stat( 'audioOutputLevel' ) ) {
                        console.info( "         audioOutputLevel: " + obj.stat( 'audioOutputLevel' ) );
                    }
                }
            };

            // local function
            var readStats = function( stats ) {
                var results = stats.result();
                var bitrateText = 'No bitrate stats';

                for ( var i = 0; i < results.length; ++i ) {
                    var res = results[ i ];
                    console.info( 'Report ' + i );
                    if ( !res.local || res.local === res ) {
                        
                        consoleStats( res );
                        // The bandwidth info for video is in a type ssrc stats record
                        // with googFrameHeightReceived defined.
                        // Should check for mediatype = video, but this is not
                        // implemented yet.
                        if ( res.type == 'ssrc' && res.stat( 'googFrameHeightReceived' ) ) {
                            var bytesNow = res.stat( 'bytesReceived' );
                            if ( timestampPrev > 0) {
                                var bitRate = Math.round( ( bytesNow - bytesPrev ) * 8 / ( res.timestamp - timestampPrev ) );
                                bitrateText = bitRate + ' kbits/sec';
                            }
                            timestampPrev = res.timestamp;
                            bytesPrev = bytesNow;
                        }
                    } else {
                        // Pre-227.0.1445 (188719) browser
                        if ( res.local ) {
                            console.info( "  Local: " );
                            consoleStats( res.local );
                        }
                        if ( res.remote ) {
                            console.info( "  Remote: " );
                            consoleStats( res.remote );
                        }
                    }
                }
                console.info( "    bitrate: " + bitrateText )
            } 

            this.pc.getStats( readStats );        
          }
        }

        this.hangup = function() {
            if ( this.view.debug ) console.log( "PC.hangup  " + this.id );
            
            if ( this.pc ) {
                this.pc.close();
                this.pc = undefined;
            }
        };

        this.mergeConstraints = function( cons1, cons2 ) {
            var merged = cons1;
            for (var name in cons2.mandatory) {
                merged.mandatory[ name ] = cons2.mandatory[ name ];
            }
            merged.optional.concat( cons2.optional );
            return merged;
        }

        // Set Opus as the default audio codec if it's present.
        this.preferOpus = function( sdp ) {
            var sdpLines = sdp.split( '\r\n' );

            // Search for m line.
            for ( var i = 0; i < sdpLines.length; i++ ) {
                if ( sdpLines[i].search( 'm=audio' ) !== -1 ) {
                    var mLineIndex = i;
                    break;
                } 
            }

            if ( mLineIndex === null ) {
                return sdp;
            }

            // for ( var i = 0; i < sdpLines.length; i++ ) {
            //     if ( i == 0 ) console.info( "=============================================" );
                
            //     console.info( "sdpLines["+i+"] = " + sdpLines[i] );
            // }

            // If Opus is available, set it as the default in m line.
            for ( var i = 0; i < sdpLines.length; i++ ) {

                if ( sdpLines[i].search( 'opus/48000' ) !== -1 ) {        
                    var opusPayload = this.extractSdp( sdpLines[i], /:(\d+) opus\/48000/i );
                    if ( opusPayload) {
                        sdpLines[ mLineIndex ] = this.setDefaultCodec( sdpLines[ mLineIndex ], opusPayload );
                    }
                    break;
                }
            }

            // Remove CN in m line and sdp.
            sdpLines = this.removeCN( sdpLines, mLineIndex );

            sdp = sdpLines.join('\r\n');
            return sdp;
        }

        // Strip CN from sdp before CN constraints is ready.
        this.removeCN = function( sdpLines, mLineIndex ) {
            var mLineElements = sdpLines[mLineIndex].split( ' ' );
            // Scan from end for the convenience of removing an item.
            for ( var i = sdpLines.length-1; i >= 0; i-- ) {
                var payload = this.extractSdp( sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i );
                if ( payload ) {
                    var cnPos = mLineElements.indexOf( payload );
                    if ( cnPos !== -1 ) {
                        // Remove CN payload from m line.
                        mLineElements.splice( cnPos, 1 );
                    }
                    // Remove CN line in sdp
                    sdpLines.splice( i, 1 );
                }
            }

            sdpLines[ mLineIndex ] = mLineElements.join( ' ' );
            return sdpLines;
        }

        this.extractSdp = function( sdpLine, pattern ) {
            var result = sdpLine.match( pattern );
            return ( result && result.length == 2 ) ? result[ 1 ] : null;
        }    

        // Set the selected codec to the first in m line.
        this.setDefaultCodec = function( mLine, payload ) {
            var elements = mLine.split( ' ' );
            var newLine = new Array();
            var index = 0;
            for ( var i = 0; i < elements.length; i++ ) {
                if ( index === 3 ) // Format of media starts from the fourth.
                    newLine[ index++ ] = payload; // Put target payload to the first.
                if ( elements[ i ] !== payload )
                    newLine[ index++ ] = elements[ i ];
            }
            return newLine.join( ' ' );
        }

    } 



} );
