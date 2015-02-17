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
    var audioManagerProtoId = "http-vwf-example-com-jplayer-audioManager-vwf";
    var videoManagerProtoId = "http-vwf-example-com-jplayer-videoManager-vwf";

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
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
                }
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
                            node.jPlayerElement = $( "<div/>", {
                                id: node.playerDivId
                            } );
                            $( "body" ).append( node.jPlayerElement );
                        }
                        var fileTypes = ( node.managerType === "audio" ) ? "mp3,wav" : "m4v";
                        node.jPlayerElement.jPlayer( {
                            ready: function() {
                                if ( node.url !== undefined ) {
                                    setUrl( node, node.url );
                                }
                                if ( node.loop !== undefined ) {
                                    setLoop( node, node.loop );
                                }
                                if ( node.containerDivId !== undefined ) {
                                    setControlDivId( node, node.containerDivId );
                                }
                            },
                            supplied: fileTypes,
                            // size: { width: node.playmoderDivSize[0], height: node.playerDivSize[1] }
                        } );

                        if ( node.playerDivId ) {
                            $( "#" + node.playerDivId ).bind($.jPlayer.event.ended, videoEndedCallback );
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
                    
                    case "play":

                        if( methodParameters ){
                            vwf.setProperty( node.ID, "url", methodParameters );
                        }
                        node.jPlayerElement.jPlayer( "play" ); 
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

    function videoEndedCallback(){
        var mediaManagerID = vwf.find( undefined, "/mediaManager" )[ 0 ];
        var videoManagerID = vwf.find( mediaManagerID, "videoManager" ) [ 0 ];
        console.log("Video ended callback in driver fired!");
        vwf.fireEvent(videoManagerID, "videoEnded");
    }

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

    function setUrl( node, url ) {
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
            var mediaObject;
            switch ( node.managerType ) {
                case "audio":
                    if ( url.search( "data:audio/mp3" ) === 0 ) {
                        mediaObject = {
                            mp3: url
                        };
                    } else if ( url.search( "data:audio/wav" ) === 0 ) {
                        mediaObject = {
                            wav: url
                        };
                    } else {
                        modelDriver.logger.errorx( "setUrl", 
                            "Unsupported sound type for '", url, "'" );
                    }
                    break;
                case "video":
                    if ( url.search( "data:video/mp4" ) === 0 || url.search( ".mp4$" ) > -1 ) {
                        mediaObject = {
                            m4v: url,
                            poster: node.posterImageUrl
                        };
                    } else {
                        modelDriver.logger.errorx( "setUrl", 
                            "Unsupported video type for '", url, "'" );
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
            }  else {
                node.jPlayerElement.jPlayer( "clearMedia" );
            }
        } else {
            node.jPlayerElement.jPlayer( "clearMedia" );
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
        if ( node.jPlayerElement ) {
            node.jPlayerElement.jPlayer( "option", { cssSelectorAncestor: "#" + containerDivId } );
        }
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
