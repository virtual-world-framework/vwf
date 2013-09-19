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

define( [ "module", "vwf/view", "vwf/utility", "vwf/utility/color" ], function( module, view, utility, Color ) {

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function( options ) {

            var self = this;
            if ( !this.state ) {   
                this.state = {};
            }
            
            this.state.connections = {};
            this.state.streams = {};

            this.local = {
                "ID": undefined,
                "url": undefined,
                "stream": undefined,
                "sharing": { audio: true, video: true } 
            };

            // turns on logger debugger console messages 
            this.debugVwf = {
                "creation": false,
                "initializing": false,
                "parenting": false,
                "deleting": false,
                "properties": false,
                "setting": false,
                "getting": false,
                "calling": false
            };

            if ( options === undefined ) { options = {}; }

            this.session = options.session !== undefined  ? options.session : 'audio-video'; 
            this.direction = options.direction !== undefined  ? options.direction : 'many-to-many';

            this.stereo = options.stereo !== undefined  ? options.stereo : false;
            this.videoElementsDiv = options.videoElementsDiv !== undefined  ? options.videoElementsDiv : 'videoSurfaces';
            this.videoProperties = options.videoProperties !== undefined  ? options.videoProperties : {};
            this.debug = options.debug !== undefined ? options.debug : false;

            this.videosAdded = 0;
            this.msgQueue = [];

            this.sessionid = window.location.href;

            this.connection = new RTCMultiConnection();
            
            this.connection.userid = this.kernel.moniker();
            // what about admin mode, it's set through usertype
            this.connection.session = this.session;
            this.connection.direction = this.direction;

            this.connection.openSignalingChannel = function( config ) {
                debugger;
            };

            // must call join if this is overridden
            //this.connection.onNewMessage = function( config ) {
            //};            


            // onstream - e object
            // e.mediaElement: HTMLVideoElement or HTMLAudioElement
            // e.stream: MediaStream
            // e.steamid: id of stream
            // e.session: eg. { audio: true, video: true }
            // e.blobURL: the url of the stream
            // e.type: remote or local
            // e.extra: extra data passed by the user
            // e.userid: id of the user stream
            this.connection.onstream = function( e ) {
                console.info( " ======= this.connection.onstream ====== " )

                if ( e.type === 'local' ) {
                    // display local
                    //mainVideo.src = e.blobURL;
                } else if ( e.type === 'remote' ) { 
                    // display remote
                    //document.body.appendChild( e.mediaElement );
                }  

                self.state.streams[ e.steamid ] = {
                    mediaElement: e.mediaElement,
                    steamid: e.streamid,
                    session: e.session,
                    blobURL: e.blobURL,
                    type: e.type,
                    extra: e.extra,
                    userid: e.userid
                };  
            };     

            this.connection.onstreamended = function( event ) {

            };         

            // event object
            // event.userid
            // event.extra
            this.connection.onmessage = function( event ) {
     
            }; 
 
            // e object
            // event.userid
            // event.extra
            // event.data
            this.connection.onopen = function( event ) {
     
            }; 

            this.connection.onleave = function( event ) {
     
            }; 

            // file transfer
            //this.connection.onFileProgress = function( packets, uuid ) {};
            //this.connection.onFileSent = function( file, uuid ) {};
            //this.connection.onFileReceived = function( file, uuid ) {};
            //this.connection.onerror = function( event ) { };
            //this.connection.onclose = function( event ) { };

            // admin guest calling features
            //this.connection.onAdmin = function( admin ) { };
            //this.connection.onGuest = function( guest ) { };
            //this.connection.onRequest = function( userid, extra ) { };
            //this.connection.onstats = function( stats, userinfo ) { };

            this.connection.connect( this.sessionid );

            // still need to call open, will wait until the initializeNode to do that
        },
  
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            if ( this.debugVwf.creation ) {
                this.kernel.logger.infox( "createdNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            if ( childExtendsID === undefined )
                return;

            var self = this, node;
            
            var protos = getPrototypes.call( self, childExtendsID )
   
            if ( isConnectionDefinition.call( this, protos ) && childName ) {

                // check if this instance of client and if this client is for this instance
                // create a login for this 
                node = {
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
                    "color": "rgb(0,0,0)",
                    "createProperty": true, 
                    "sharing": { audio: true, video: true }                   
                };

                this.state.connections[ childID ] = node;
                
                // add the client specific locals
                node.moniker = appMoniker.call( this, childName );
                //console.info( "new client moniker: " + node.moniker );
                node.displayName = undefined;
                node.prototypes = protos;

                if ( this.kernel.moniker() == node.moniker ) { 
                    this.local.ID = childID;
                    
                    if ( this.videoElementsDiv ) {
                        jQuery('body').append(
                            "<div id='"+self.videoElementsDiv+"'></div>"
                        );                   
                    }
                } 
            }

        }, 

        initializedNode: function( nodeID, childID, childExtendsID, childImplementsIDs, 
            childSource, childType, childIndex, childName ) {

            if ( this.debugVwf.initializing ) {
                this.kernel.logger.infox( "initializedNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            } 

            if ( childExtendsID === undefined )
                return;

            var client = this.state.connections[ childID ];

            if ( client ) {
                if ( this.local.ID == childID ){
                    
                    // local client object
                    // grab access to the webcam 
                    this.connection.open( this.sessionid ); 
                   
                    var remoteClient = undefined;
                    // existing connections
                    for ( var clientID in this.state.connections ) {
                        
                        if ( clientID != this.local.ID ) {
                            // create property for this client on each existing client
                            remoteClient = this.state.connections[ clientID ];

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

        deletedNode: function( nodeID ) {
            
            if ( this.debugVwf.deleting ) {
                this.kernel.logger.infox( "deletedNode", nodeID );
            }
            debugger;

            if ( nodeID.indexOf( "-connection-vwf" ) != -1 ) {
                var moniker = nodeID.substr( nodeID.lastIndexOf('-')+1, 16 );
                var client = undefined;

                if ( moniker == this.kernel.moniker() ) {
                    
                    // this is the client that has left the converstaion
                    // go through the peerConnections and close the 
                    // all current connections
                    var peer, peerMoniker;
                    for ( var peerID in this.state.connections ) {
                        peer = this.state.connections[ peerID ];
                        peerMoniker = appMoniker.call( this, peer.name )
                        if ( peerMoniker != this.kernel.moniker ) {
                            peer.connection && peer.connection.disconnect();
                        }
                    }

                } else {

                    // this is a client who has has a peer leave the converstaion
                    // remove that client, and the 
                    client = findClientByMoniker.call( this, moniker );
                    if ( client ) {
                        client.connection && client.connection.disconnect();

                        removeClient.call( this, client );
                        delete this.state.connections[ client ]
                    }

                     
                }
            }         

        },
  
        createdProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debugVwf.properties ) {
                this.kernel.logger.infox( "C === createdProperty ", nodeID, propertyName, propertyValue );
            }

            return this.satProperty( nodeID, propertyName, propertyValue );
        },        

        initializedProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debugVwf.properties ) {
                this.kernel.logger.infox( "  I === initializedProperty ", nodeID, propertyName, propertyValue );
            }

            return this.satProperty( nodeID, propertyName, propertyValue );
        },        

        satProperty: function( nodeID, propertyName, propertyValue ) {
            
            
            if ( this.debugVwf.properties || this.debugVwf.setting ) {
                this.kernel.logger.infox( "    S === satProperty ", nodeID, propertyName, propertyValue );
            } 

            var client = this.state.connections[ nodeID ];

            if ( client && this.local.ID == nodeID ) {
                switch( propertyName ) {
                    
                    case "session":
                        if ( propertyValue ) {
                            this.connection.session = propertyValue;
                        }
                        break;

                    case "direction":
                        switch ( propertyValue ) {
                            case 'many-to-many':
                            case 'one-to-one':
                            case 'one-to-many':
                            case 'one-way':
                                this.connection.direction = propertyValue;
                                break;
                        }
                        break;                    

                    case "disableDtlsSrtp":
                        if ( propertyValue ) {
                            this.connection.disableDtlsSrtp = Boolean( propertyValue );
                        }
                        break;

                    case "autoCloseEntireSession":
                        if ( propertyValue ) {
                            this.connection.autoCloseEntireSession = Boolean( propertyValue );
                        }
                        break;

                    case "autoSaveToDisk":
                        if ( propertyValue ) {
                            this.connection.autoSaveToDisk = Boolean( propertyValue );
                        }
                        break;                   

                    case "interval":
                        if ( propertyValue ) {
                            this.connection.interval = Number( propertyValue );
                        }
                        break; 

                    case "maxParticipantsAllowed":
                        if ( propertyValue ) {
                            this.connection.maxParticipantsAllowed = Number( propertyValue );
                        }
                        break; 

                    case "mediaMaxHeight":
                        if ( propertyValue ) {
                            this.connection.media.maxHeight = Number( propertyValue );
                        }
                        break; 

                    case "mediaMinHeight":
                        if ( propertyValue ) {
                            this.connection.media.minHeight = Number( propertyValue );
                        }
                        break; 

                    case "mediaMaxWidth":
                        if ( propertyValue ) {
                            this.connection.media.maxWidth = Number( propertyValue );
                        }
                        break; 

                    case "mediaMinWidth":
                        if ( propertyValue ) {
                            this.connection.media.minWidth = Number( propertyValue );
                        }
                        break; 

                    case "mediaMinAspectRatio":
                        if ( propertyValue ) {
                            this.connection.media.minAspectRatio = parseFloat( propertyValue );
                        }
                        break;
                    case "hostCandidate":
                        if ( propertyValue ) {
                            this.connection.hostCandidate = Boolean( propertyValue );
                        }
                        break;                        
                    case "reflexiveCandidate":
                        if ( propertyValue ) {
                            this.connection.reflexiveCandidate = Boolean( propertyValue );
                        }
                        break;
                    case "relayCandidate":
                        if ( propertyValue ) {
                            this.connection.relayCandidate = Boolean( propertyValue );
                        }
                        break;

                    case "audioBandwidth":
                        if ( propertyValue ) {
                            this.connection.bandwidth.audio = Number( propertyValue );
                        }
                        break;

                    case "videoBandwidth":
                        if ( propertyValue ) {
                            this.connection.bandwidth.video = Number( propertyValue );
                        }
                        break;

                    case "dataBandwidth":
                        if ( propertyValue ) {
                            this.connection.bandwidth.data = Number( propertyValue );
                        }
                        break;

                    case "minFramerate":
                        if ( propertyValue ) {
                            this.connection.framerate.min = Number( propertyValue );
                        }
                        break;
                    case "maxFramerate":
                        if ( propertyValue ) {
                            this.connection.framerate.max = Number( propertyValue );
                        }
                        break;

                    case "username":
                        if ( propertyValue ) {
                            if ( this.connection.extra === undefined ) this.connection.extra = {};
                            this.connection.extra.username = propertyValue;
                        }
                        break;

                    case "fullname":
                        if ( propertyValue ) {
                            if ( this.connection.extra === undefined ) this.connection.extra = {};
                            this.connection.extra.fullname = propertyValue;
                        }
                        break;

                    case "email":
                        if ( propertyValue ) {
                            if ( this.connection.extra === undefined ) this.connection.extra = {};
                            this.connection.extra.email = propertyValue;
                        }
                        break;

                    case "color":
                        var clr = new utility.color( propertyValue );
                        if ( clr ) {
                            client.color = clr.toString();
                        }
                        break;    

                    default:  
                        // propertyName is the moniker of the client that 
                        // this connection supports
                        if ( propertyValue ) {
                            // propertyName - moniker of the client
                            // propertyValue - peerConnection message
                            handlePeerMessage.call( this, propertyName, propertyValue );
                        }

                        break;
                }
            }
        },

        gotProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debugVwf.properties || this.debugVwf.getting ) {
                this.kernel.logger.infox( "   G === gotProperty ", nodeID, propertyName, propertyValue );
            }
            var value = undefined;
            var client = this.state.connections[ nodeID ];

            if ( client && this.local.ID == nodeID ) {
                switch( propertyName ) {
                    case "userid":
                        value = this.kernel.moniker();
                        break;
                }
            }

            return value;
        },

        calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {
            
            if ( this.debugVwf.calling ) {
                this.kernel.logger.infox( "  CM === calledMethod ", nodeID, methodName, methodParameters );
            }

            switch ( methodName ) {
                case "setLocalMute":
                    if ( this.kernel.moniker() == this.kernel.client() ) {
                        methodValue = setMute.call( this, methodParameters );
                    }
                    break;
            }
        },       

        firedEvent: function( nodeID, eventName, eventParameters ) {
        },

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
        for ( var id in this.state.connections ) {
            if ( this.state.connections[id].moniker == moniker ) {
                clientNode = this.state.connections[id];
                break;
            }
        }
        return clientNode;
    }

    function displayLocal( stream, name, color ) {
        var id = this.kernel.moniker();
        return displayVideo.call( this, id, stream, this.local.url, name, id, true, color );
    }

    function displayVideo( id, stream, url, name, destMoniker, muted, color ) {
        
        var divId = undefined;

        if ( this.videoProperties.create ) {
            this.videosAdded++
            var $container;
            divId = name + this.videosAdded;
            var videoId = "video-" + divId;

            $container = $( "#" + this.videoElementsDiv );
            if ( muted ) {
                $container.append(
                    "<div id='"+ divId + "'>" +
                        "<video class='vwf-webrtc-video' id='" + videoId +
                            "' width='320' height='240' " +
                            "loop='loop' autoplay muted " +
                            "style='position: absolute; left: 0; top: 0; z-index: 40;'>" +
                        "</video>" +
                    "</div>"
                );

            } else {
                $container.append(
                    "<div id='"+ divId + "'>" +
                        "<video class='vwf-webrtc-video' id='" + videoId +
                            "' width='320' height='240'" +
                            " loop='loop' autoplay " +
                            "style='position: absolute; left: 0; top: 0; z-index: 40;'>" +
                        "</video>" +
                    "</div>"
                );
            }
            
            var videoE = $( '#'+ videoId )[0];
            if ( videoE && stream ) {
                attachMediaStream( videoE, stream );
                if ( muted ) {
                    videoE.muted = true;  // firefox isn't mapping the muted property correctly
                }
            }  

            $('#'+divId).draggable();
            
        } 

        var clr = new utility.color( color );
        if ( clr ) { 
            clr = clr.toArray(); 
        }

        this.kernel.callMethod( "index-vwf", "createVideo", [ { 
            "ID": id,
            "url": url, 
            "name": name, 
            "muted": muted, 
            "color": clr ? clr : color
        }, destMoniker ] );          

        return divId;
    }

    function removeVideo( client ) {
        
        if ( client.videoDivID ) {
            var $videoWin = $( "#" + client.videoDivID );
            if ( $videoWin ) {
                $videoWin.remove();
            }
            client.videoDivID = undefined;
        }

        this.kernel.callMethod( "index-vwf", "removeVideo", [ client.moniker ] ); 

    }

    function displayRemote( id, stream, url, name, destMoniker, color ) {
        return displayVideo.call( this, id, stream, url, name, destMoniker, false, color );
    }

    function capture( media ) {

        if ( this.local.stream === undefined && ( media.video || media.audio ) ) {
            var self = this;
            var constraints = { 
                "audio": media.audio, 
                "video": media.video ? { "mandatory": {}, "optional": [] } : false, 
            };
            
            var successCallback = function( stream ) {
                self.local.url = URL.createObjectURL( stream );
                self.local.stream = stream;

                self.kernel.setProperty( self.local.ID, "localUrl", self.local.url );

                var localNode = self.state.connections[ self.local.ID ];
                displayLocal.call( self, stream, localNode.displayName, localNode.color );
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
        // connection
        return name.substr( 10, name.length-1 );
    }
    
    function findClientByMoniker( moniker ) {
        var client = undefined;
        for ( var id in this.state.connections ) {
            if ( client === undefined && moniker == this.state.connections[ id ].moniker ) {
                client = this.state.connections[ id ];
            }
        }
        return client;
    }

    function removeClient( client ) {
        if ( client ) {
            removeVideo.call( this, client );
        }
    }

    function updateSharing( nodeID, sharing ) {
        setMute.call( this, !sharing.audio );
        setPause.call( this, !sharing.video );
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

    function isConnectionDefinition( prototypes ) {
        var foundClient = false;
        if ( prototypes ) {
            var len = prototypes.length;
            for ( var i = 0; i < len && !foundClient; i++ ) {
                foundClient = ( prototypes[i] == "http-vwf-example-com-rtcmulti-connection-vwf" );    
            }
        }

        return foundClient;
    }

    function isClientInstanceDef( nodeID ) {
        return ( nodeID == "http-vwf-example-com-clients-vwf" );
    }


} );
