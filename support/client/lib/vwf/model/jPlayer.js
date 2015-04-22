/// vwf/model/jPlayer.js is a sound/video driver
/// 
/// @module vwf/model/jPlayer
/// @requires vwf/model

define( [   
        "module", 
        "vwf/model", 
        "vwf/utility",
        "jquery"
    ], function( module, model, utility, $ ) {

    var modelDriver;
    var jPlayerInstanceCreated = false;
    // NXM: For some reason, using the format below breaks video!
    // var audioManagerProtoId = "http-vwf-example-com-jplayer-audioManager-vwf";
    // var videoManagerProtoId = "http-vwf-example-com-jplayer-videoManager-vwf";

    var audioManagerProtoId = "http://vwf.example.com/jplayer/audioManager.vwf";
    var videoManagerProtoId = "http://vwf.example.com/jplayer/videoManager.vwf";

    var jplayerContainerId = "jp_container_1";

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {

            var containerDiv = document.createElement( 'div' );
            containerDiv.id = jplayerContainerId;
            containerDiv.className = "jp-video jp-video-360p";
            var playerDiv = document.createElement( 'div' );
            playerDiv.id = "jquery_jplayer_1";
            playerDiv.className = "jp-jplayer";
            containerDiv.appendChild( playerDiv );
            $( "body" ).append(containerDiv);
            
        	modelDriver = this;

            this.arguments = Array.prototype.slice.call( arguments );

            this.options = options || {};

            this.state = {
                "nodes": {},
                "stages": {},
                "prototypes": {},
                "createLocalNode": function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {
                    return {
                        "parentID": nodeID,
                        "ID": childID,
                        "extendsID": childExtendsID,
                        "implementsIDs": childImplementsIDs,
                        "source": childSource,
                        "type": childType,
                        "name": childName,
                        "prototypes": undefined,
                        "delayedProperties": undefined,
                        "soundObj": undefined,
                        "playState": "unloaded",
                        "playOnReady": false
                    };
                },
                "isAudioManager": function( prototypes ) {
                    var found = false;
                    if ( prototypes ) {
                        for ( var i = 0; i < prototypes.length && !found; i++ ) {
                            found = ( prototypes[ i ].indexOf( audioManagerProtoId ) !== -1 );    
                        }
                    }
                    return found;
                },
                "isVideoManager": function( prototypes ) {
                    var found = false;
                    if ( prototypes ) {
                        for ( var i = 0; i < prototypes.length && !found; i++ ) {
                            found = ( prototypes[ i ].indexOf( videoManagerProtoId ) !== -1 );    
                        }
                    }
                    return found;
                },
                "videoEndedCallback" : function() {
                    var mediaManagerID = modelDriver.kernel.find( undefined, "/mediaManager" )[ 0 ];
                    var videoManagerID = modelDriver.kernel.find( mediaManagerID, "videoManager" ) [ 0 ];
                    console.log("Video ended callback in driver fired!");
                    modelDriver.kernel.fireEvent(videoManagerID, "videoEnded");
                },
            };

            // turns on logger debugger console messages 
            this.debug = {
                "creation": false,
                "initializing": false,
                "parenting": false,
                "deleting": false,
                "properties": false,
                "setting": false,
                "getting": false,
                "method": false,
                "prototypes": false
            };
        },

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            // If the node being created is a prototype, construct it and add it to the array of prototypes,
            // and then return
            var prototypeID = utility.ifPrototypeGetId.call( this, this.kernel.application(), 
                this.state.prototypes, nodeID, childID );
            if ( prototypeID !== undefined ) {
                
                if ( this.debug.prototypes ) {
                    this.logger.infox( "prototype: ", prototypeID );
                }

                this.state.prototypes[ prototypeID ] = {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsID: childImplementsIDs,
                    source: childSource, 
                    type: childType,
                    name: childName
                };

                if ( prototypeID.indexOf( audioManagerProtoId ) !== -1 ) {
                    this.state.audioManagerProto = this.state.prototypes[ prototypeID ];
                } else if ( prototypeID.indexOf( videoManagerProtoId ) !== -1 ) {
                    this.state.videoManagerProto = this.state.prototypes[ prototypeID ];
                }

                return;                
            }

            var protos = getPrototypes( this.kernel, childExtendsID );

            var isAudioManager = this.state.isAudioManager( protos );
            var isVideoManager = this.state.isVideoManager( protos );
            if ( isAudioManager || isVideoManager ) {

                // Create the local copy of the node properties
                if ( this.state.nodes[ childID ] === undefined ){
                    this.state.nodes[ childID ] = this.state.createLocalNode( nodeID, childID, 
                        childExtendsID, childImplementsIDs, childSource, 
                        childType, childIndex, childName, callback );
                }

                node = this.state.nodes[ childID ];
                
                node.prototypes = protos;

                if ( isAudioManager ) {
                    node.managerType = "audio";
                    setWithPrototypeProperties( this.state.audioManagerProto );
                } else {
                    node.managerType = "video";
                    setWithPrototypeProperties( this.state.videoManagerProto );
                }
            }
        },

        deletingNode: function( nodeID ) {
            
            if ( this.debug.deleting ) {
                this.logger.infox( "deletingNode", nodeID );
            }

            if ( this.state.nodes[ nodeID ] ) {
                delete this.state.nodes[ nodeID ];
            }

        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            if ( this.debug.properties ) {
                this.logger.infox( "C === creatingProperty ", nodeID, propertyName, propertyValue );
            }
            return this.settingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debug.properties ) {
                this.logger.infox( "  I === initializingProperty ", nodeID, propertyName, propertyValue );
            }

            return this.settingProperty( nodeID, propertyName, propertyValue );
            
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debug.properties || this.debug.setting ) {
                this.logger.infox( "    S === settingProperty ", nodeID, propertyName, propertyValue );
            }

            // Prepare return value
            var value = undefined;

            var node = this.state.nodes[ nodeID ];
 
            if ( node !== undefined ) {
                switch ( propertyName ) {
                    case "url":
                        setUrl( node, propertyValue );
                        value = node.url;
                        break;

                    case "preload":
                        setPreload( node, propertyValue );
                        value = node.preload;
                        break;

                    case "loop":
                        setLoop( node, propertyValue );
                        value = node.loop;
                        break;

                    case "playerDivId":
                        if ( propertyValue === node.playerDivId ) {
                            break;
                        }
                        if ( node.playerDivId ) {
                            $( "#" + node.playerDivId ).remove();
                        }
                        node.playerDivId = propertyValue;
                        var $existingElement = $( "#" + node.playerDivId );
                        if ( $existingElement.length ) {
                            node.jPlayerElement = $existingElement;
                        } else {
                            //Change the existing element to match the new name
                            var playerDiv = document.createElement( 'div' );
                            playerDiv.id = node.playerDivId;
                            if( node.containerDivId ){
                                $( "#" + node.containerDivId ).append( playerDiv );
                            } else {
                                $("#jp_container_1").append( playerDiv );
                            }
                            node.jPlayerElement = $( "#" + node.playerDivId );
                        }
                        var fileTypes = ( node.managerType === "audio" ) ? "mp3,wav" : "m4v,webmv";
                        node.jPlayerElement.jPlayer( {
                            ready: function() {
                                if ( node.url !== undefined ) {
                                    setUrl( node, node.url );
                                }
                                if ( node.loop !== undefined ) {
                                    setLoop( node, node.loop );
                                }
                                if ( node.preload !== undefined ) {
                                    setPreload( node, node.preload );
                                }
                                if ( node.containerDivId !== undefined ) {
                                    setControlDivId( node, node.containerDivId );
                                }
                            },
                            supplied: fileTypes,
                        } );

                        if ( node.playerDivId ) {
                            $( "#" + node.playerDivId ).bind( $.jPlayer.event.ended, this.state.videoEndedCallback );
                        }
                        
                        value = node.playerDivId;
                        break;
                    case "containerDivId":
                        setControlDivId( node, propertyValue );
                        value = node.containerDivId;
                        break;
                    case "posterImageUrl":
                        setPosterImageUrl( node, propertyValue );
                        value = node.posterImageUrl;
                        break;
                    case "playerSize":
                        setPlayerSize( node, propertyValue );
                        value = node.playerSize;
                        break;
                    case "containerSize":
                        setContainerSize( node, propertyValue );
                        value = node.containerSize;
                        break;
                    default:
                        break;
                }
            } else {
                var proto;
                var audioManagerProto = this.state.audioManagerProto;
                var videoManagerProto = this.state.videoManagerProto;
                if ( audioManagerProto && ( nodeID === audioManagerProto.ID ) ) {
                    proto = this.state.audioManagerProto;
                } else if ( videoManagerProto && ( nodeID === videoManagerProto.ID ) ) {
                    proto = this.state.videoManagerProto;
                }
                if ( proto ) {
                    switch ( propertyName ) {
                        case "url":
                            proto.url = propertyValue;
                            value = proto.url;
                            break;
                        case "loop":
                            proto.loop = propertyValue;
                            value = proto.loop;
                            break;
                        case "playerDivId":
                            proto.playerDivId = propertyValue;
                            value = proto.playerDivId;
                            break;
                        case "containerDivId":
                            proto.containerDivId = propertyValue;
                            value = proto.containerDivId;
                            break;
                        case "posterImageUrl":
                            proto.posterImageUrl = propertyValue;
                            value = proto.posterImageUrl;
                            break;
                        default:
                            break;
                    }
                }
            }

            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName ) {

            if ( this.debug.properties || this.debug.getting ) {
                this.logger.infox( "   G === gettingProperty ", nodeID, propertyName );
            }

            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }

            return node && node[ propertyName ];
        },

        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters ) { 

            if ( this.debug.method ) {
                this.logger.infox( "   G === gettingProperty ", nodeID, propertyName );
            }

            var node = this.state.nodes[ nodeID ];   

            if ( !node ) {
                return;
            }
            
            if ( node.jPlayerElement ) {

                switch( methodName ) {
                    
                    //case "load":
                        //if( node.url ) {
                            //if( !node.loadedUrl || node.url !== node.loadedUrl ){
                                //node.jPlayerElement.jPlayer( "load" ); 
                                //node.loadedUrl = node.url;  
                                //console.log("Loading!");
                            //} else {
                            //console.log("Not loading, becuase node.url matches node.loadedURL");
                            //}
                        //} else {
                            //this.logger.errorx( "No URL given!" ); 
                        //}
                        //break;

                    case "play":
                        if( node.url ) {
                            node.jPlayerElement.jPlayer( "play" ); 
                        } else {
                            this.logger.errorx( "No URL given!" ); 
                        }
                        break;

                    case "pause":
                        node.jPlayerElement.jPlayer( "pause" );
                        break;

                    case "stop":
                        node.jPlayerElement.jPlayer( "stop" );
                        break;

                    case "clearMedia":
                        node.jPlayerElement.jPlayer( "clearMedia" );
                        break;
                }  

            }
       
        },

    } );

    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }

    function setWithPrototypeProperties( proto ) {
        if ( proto.url !== null ) {
            vwf.setProperty( node.ID, "url", proto.url );
        }
        if ( proto.loop !== null ) {
            vwf.setProperty( node.ID, "loop", proto.loop );
        }
        if ( proto.playerDivId !== null ) {
            vwf.setProperty( node.ID, "playerDivId", proto.playerDivId );
        }
        if ( proto.containerDivId !== null ) {
            vwf.setProperty( node.ID, "containerDivId", proto.containerDivId );
        }
        if ( proto.posterImageUrl !== null ) {
            vwf.setProperty( node.ID, "posterImageUrl", proto.posterImageUrl );
        }
    }

    function setVideoURL( mediaObj, url ) {
        if ( url.search( "data:video/mp4" ) === 0 || url.search( ".mp4$" ) > -1 ) {
            mediaObj.m4v = url;
        } else if( url.search( ".webm$" ) > -1 ){
            mediaObj.webmv = url; 
        } else {
            modelDriver.logger.errorx( "setUrl", 
                "Unsupported video type for '", url, "'" );
        }
    }

    Array.prototype.equals = function (array) {
        // if the other array is a falsy value, return
        if (!array)
            return false;

        // compare lengths - can save a lot of time 
        if (this.length != array.length)
            return false;

        for (var i = 0, l=this.length; i < l; i++) {
            // Check if we have nested arrays
            if (this[i] instanceof Array && array[i] instanceof Array) {
                // recurse into the nested arrays
                if (!this[i].equals(array[i]))
                    return false;       
            }           
            else if (this[i] != array[i]) { 
                // Warning - two different object instances will never be equal: {x:20} != {x:20}
                return false;   
            }           
        }       
        return true;
    }   

    function setUrl( node, inputUrl ) {

        var usingMultiUrls;
        var url;
        if( inputUrl && ( inputUrl.constructor === Array ) ){
            usingMultiUrls = true; 
            url = inputUrl[ 0 ];
        } else {
            usingMultiUrls = false;
            url = inputUrl;
        }          
        if( node.url && url && (node.url).equals( url ) ){
            console.log("Setting redudant URL! Quitting!");
            return;
        }
        node.url = url;

        // If there is no jPlayerElement, there is nothing to do yet so we return.
        // Once the jPlayerElement is created, setUrl will run again using the saved value
        if ( !node.jPlayerElement ) {
            return;
        }

        // If there is a url, set the media for the jPlayer object appropriately
        // Otherwise, clear the media
        if ( url ) {

            // Construct the media object based on the type of file being passed in
            var mediaObject = {};

            switch ( node.managerType ) {
                case "audio":
                    //TODO: Support multiple URLs for audio.
                    if ( url.search( "data:audio/mp3" ) === 0 ) {
                        medaObject.mp3 = url;
                    } else if ( url.search( "data:audio/wav" ) === 0 ) {
                        mediaObject.wav = url;
                    } else {
                        modelDriver.logger.errorx( "setUrl", 
                            "Unsupported sound type for '", url, "'" );
                    }
                    break;
                case "video":
                    mediaObject.poster = node.posterImageUrl;
                    if( usingMultiUrls ) {
                        for( var i = 0; i < inputUrl.length; i++ ) {
                            setVideoURL( mediaObject, inputUrl[ i ] );
                        }
                    } else {
                        setVideoURL( mediaObject, url );
                    }
                    break;
                default:
                    modelDriver.logger.errorx( "setUrl",
                            "Unsupported manager type '", node.managerType, "'" );
                    break;
            }

            // If we succeeded in creating a media object, set it on the jPlayer object
            // Otherwise, clear the current media
            if ( mediaObject ) {
                node.jPlayerElement.jPlayer( "setMedia", mediaObject );
                node.jPlayerElement.jPlayer( "load" ); 
            }  else {
                node.jPlayerElement.jPlayer( "clearMedia" );
            }
        } else {
            node.jPlayerElement.jPlayer( "clearMedia" );
        }
    }

    function setPreload( node, preload ) {
        node.preload = preload;
        if ( node.jPlayerElement ) {
            node.jPlayerElement.jPlayer( "option", { preload: preload } );
            console.log("Setting preload to: " + preload);
        }
    }

    function setLoop( node, loop ) {
        node.loop = loop;
        if ( node.jPlayerElement ) {
            node.jPlayerElement.jPlayer( "option", { loop: loop } );
        }
    }

    function setControlDivId( node, containerDivId ) {
        node.containerDivId = containerDivId;
    }

    function setPosterImageUrl( node, posterImageUrl ) {
        node.posterImageUrl = posterImageUrl;
        if ( node.jPlayerElement ) {
            node.jPlayerElement.jPlayer( "setMedia", {
                m4v: node.url,
                poster: posterImageUrl
            } );
        }
    }

    function setPlayerSize( node, playerSize ){
        node.playerSize = playerSize;
        node.jPlayerElement.jPlayer( "option", "size", {width: playerSize[0], height: playerSize[1]});
    }

    function setContainerSize( node, containerSize ){
        node.containerSize = containerSize;
    }

} );
