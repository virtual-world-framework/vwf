"use strict";

/// vwf/model/sound.js is a sound driver that wraps the capabilities of the 
/// HTML5 web audio API.
/// 
/// @module vwf/model/sound
/// @requires vwf/model

// References:
//  http://www.html5rocks.com/en/tutorials/webaudio/intro/
//  https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html
//  http://www.html5rocks.com/en/tutorials/webaudio/fieldrunners/

define( [ "module", "vwf/model" ], function( module, model ) {

    // TODO: should these be stored in this.state so that the view can access them?
    var context;
    var soundData = {};

    return model.load( module, {

        initialize: function() {
            try {
                // I quote: "For WebKit- and Blink-based browsers, you 
                // currently need to use the webkit prefix, i.e. 
                // webkitAudioContext."
                // http://www.html5rocks.com/en/tutorials/webaudio/intro/
                if ( !window.AudioContext ) {
                    window.AudioContext = window.webkitAudioContext;
                }
                context = new AudioContext();
            }
            catch( e ) {
                // alert( 'Web Audio API is not supported in this browser' );
                this.logger.warnx( "initialize", "Web Audio API is not supported in this browser." );
            }
        },

        callingMethod: function( nodeID, methodName, params ) { 
            if ( nodeID !== this.state.soundManager.nodeID ) {
                return undefined;
            }

            if ( !context ) {
                return undefined;
            }

            switch( methodName ) {
                // arguments: soundName, soundDefinition, successCallback, failureCallback
                case "loadSound":
                    if ( !params || ( params.length < 2 ) ) {
                        this.logger.errorx( "loadSound", "The 'loadSound' method requires " +
                                            "at least a name and definition for the sound." );
                        return undefined;
                    } else if ( !soundDefinition.soundURL ) {
                        this.logger.errorx( "loadSound", "The sound definition must have a " +
                                            "'soundURL' property." );
                        return undefined;
                    } else if ( params.length > 4 ) {
                        this.logger.warnx( "loadSound", "The 'loadSound' method takes at " +
                                           "most 4 arguments." );
                    }

                    var soundName = params[ 0 ];
                    var soundDefinition = params[ 1 ];
                    var successCallback = params[ 2 ];
                    var failureCallback = params[ 3 ];

                    // check if we already have a sound with this name
                    if ( soundData[ soundName ] != undefined ) {
                        this.logger.errorx( "loadSound", "Duplicate sound named '" + soundName + 
                                            "'." );
                        return undefined;
                    }

                    // Create the sound.
                    // NOTE: the sound file is loaded into a buffer asynchronously, so the
                    // sound will not be ready to play immediately.  That's why we have the
                    // callbacks.
                    soundData[ soundName ] = new SoundDatum( soundName, soundDefinition,
                                                             successCallback, failureCallback );

                    return;

                // arguments: <none>
                case "clearAllSounds":
                    var soundNames = Object.keys( soundData );
                    for (var i = 0; i < soundNames.length; ++i ) {
                        var soundName = soundNames[ i ];
                        this.state.soundManager.stopAllSoundInstances( soundName );
                        delete soundData[ soundName ];
                    }
                    return;

                // arguments: soundName 
                // returns: true if sound is done loading and is playable
                case "isReady":
                    var soundDatum = getSoundDatum( params );
                    return soundDatum !== undefined ? soundDatum.isReady : false;

                // arguments: soundName 
                // returns: soundInstanceID, or -1 on failure
                case "playSound":
                    var soundDatum = getSoundDatum( params );
                    return soundDatum ? soundDatum.playSound() 
                                      : { soundName: params[ 0 ], instanceID: -1 };

                // arguments: soundName
                // returns: true if sound is currently playing
                case "isSoundPlaying":
                    var soundDatum = getSoundDatum( params );
                    return soundDatum ? soundDatum.playingInstances.length > 0 : false;

                // arguments: soundInstanceID
                // returns: true if sound is currently playing
                case "isInstancePlaying":
                    return getSoundInstance( params ) !== undefined;

                // arguments: soundInstanceID, volume, fadeTime, fadeMethod
                case "setVolume":
                    var soundInstance = getSoundInstance( params );
                    if ( soundInstance ) {
                        volume = params[ 1 ];
                        fadeTime = params[ 2 ];
                        fadeMethod = params[ 3 ];

                        soundInstance.setVolume( volume, fadeTime, fadeMethod );
                    }
                    return;

                // arguments: soundInstanceID
                case "stopSoundInstance":
                    var soundInstance = getSoundInstance( params );
                    if (soundInstance) {
                        soundInstance.soundDatum.stopInstance( params[ 0 ].instanceID );
                    }
                    return;

                // arguments: soundName
                case "stopAllSoundInstances":
                    var soundDatum = getSoundDatum( params );
                    if ( soundDatum ) {
                        var instanceIDs = Object.keys( soundDatum.playingInstances );
                        for ( var i = 0; i < instanceIDs.length; ++i ) {
                            soundDatum.stopInstance( instanceIDs[ i ] );
                        }
                    }

                    return undefined;
            }

            return undefined;
        }

    } );

    SoundDatum = function( soundName, soundDefinition, successCallback, failureCallback ) {
        this.initialize( soundName, soundDefinition, successCallback, failureCallback );
        return this;
    }

    SoundDatum.prototype = {
        constructor: SoundDatum,

        // the name
        name: undefined,

        // the actual sound
        buffer: undefined,

        // a hashtable of sound instances
        playingInstances: null,

        // control parameters
        isLoaded: false,
        isLooping: false,
        allowMultiplay: false,
        volumeAdjustment: 1.0,

        // a counter for creating instance IDs
        instanceIDCounter: 0,

        initialize = function( soundName, soundDefinition, successCallback, failureCallback ) {
            this.name = soundName;
            this.playingInstances = {};

            // yeah, yeah, this is redundant.  So sue me.  I'm paranoid.
            this.isLoaded = false;

            if (soundDefinition.isLooping !== undefined) {
                this.isLooping = soundDefinition.isLooping;
            }

            if (soundDefinition.allowMultiplay !== undefined) {
                this.allowMultiplay = soundDefinition.allowMultiplay;
            }

            if (soundDefinition.volumeAdjustment !== undefined) {
                this.volumeAdjustment = soundDefinition.volumeAdjustment;
            }


            // Create & send the request to load the sound asynchronously
            var request = new XMLHttpRequest();
            request.open( 'GET', soundDefinition.soundURL, true );
            request.responseType = 'arraybuffer';
            request.onload = function() {
                context.decodeAudioData(
                    request.response, 
                    function( buffer ) {
                        soundData[ soundName ].buffer = buffer;
                        soundData[ soundName ].isLoaded = true;

                        successCallback && successCallback();
                    }, 
                    function() {
                        delete soundData[ soundName ];
                        failureCallback && failureCallback();
                    }
                );
            }
            request.send();
        },

        playSound = function() {
            if ( !allowMultiplay && ( playingInstances.length > 0 ) ) {
                this.logger.warnx( "playSound", "Sound '" + name "'is already " +
                                   "playing, and doesn't allow multiplay." );
                return { soundName: this.name, instanceID: -1 };
            }

            var id = this.instanceIDCounter;
            ++this.instanceIDCounter;

            this.playingInstances[ id ] = new PlayingInstance( this, function() {
                delete playingInstances[ instanceID ];
            } );

            return { soundName: this.name, instanceID: id };
        },

        stopInstance = function( instanceID ) {
            var soundInstance = this.playingInstances[ instanceID ];
            if ( soundInstance ) {
                soundInstance.sourceNode.stop();
                delete playingInstances[ instanceID ];
            }
        },
    }

    PlayingInstance = function( soundDatum, whenDoneCallback ) {
        this.initialize( soundDatum, whenDoneCallback );
        return this;
    }

    PlayingInstance.prototype = {
        constructor: PlayingInstance,

        // a reference back to the soundDatum
        soundDatum: null,

        // the control nodes for the flowgraph
        sourceNode: undefined,
        gainNode: undefined,

        initialize: function( soundDatum, whenDoneCallback ) {
            // NOTE: from http://www.html5rocks.com/en/tutorials/webaudio/intro/:
            //
            // An important point to note is that on iOS, Apple currently mutes all sound 
            // output until the first time a sound is played during a user interaction 
            // event - for example, calling playSound() inside a touch event handler. 
            // You may struggle with Web Audio on iOS "not working" unless you circumvent 
            // this - in order to avoid problems like this, just play a sound (it can even
            // be muted by connecting to a Gain Node with zero gain) inside an early UI
            // event - e.g. "touch here to play".

            this.soundDatum = soundDatum;

            this.sourceNode = context.createBufferSource();
            this.sourceNode.buffer = this.soundDatum.buffer;
            this.sourceNode.loop = this.soundDatum.isLooping;

            this.gainNode = context.createGain();
            this.gainNode.gain.value = this.soundDatum.volumeAdjustment;

            this.sourceNode.connect( gainNode );
            this.gainNode.connect( context.destination );

            this.sourceNode.start( 0 );

            // TODO: setup the callback for when we're done
            this.sourceNode.onended = function() {
                whenDoneCallback && whenDoneCallback();
            }
        },

        setVolume: function( volume, fadeTime, fadeMethod ) {
            if ( !volume ) {
                this.logger.errorx( "setVolume", "The 'setVolume' method " +
                                    "requires a volume." );
                return;
            }

            targetVolume = volume * this.soundDatum.volumeAdjustment;
            fadeTime = fadeTime ? fadeTime : 0;
            fadeMethod = fadeMethod ? fadeMethod : "linear";

            if ( fadeTime <= 0 ) {
                gainNode.gain.value = targetVolume;
            } else {
                var endTime = context.currentTime + fadeTime;

                switch( fadeMethod ) {
                    case "linear":
                        gainNode.linearRampToValueAtTime( targetVolume, endTime );
                        break;
                    case "exponential":
                        gainNode.gain.exponentialRampToValueAtTime( targetVolume, endTime );
                        break;
                    default:
                        this.logger.errorx( "setVolume", "Unknonwn fade method: '" +
                                            fadeMethod + "'.  Using a linear fade.");
                        gainNode.linearRampToValueAtTime( targetVolume, endTime );
                }
            }
        },
    }

    function getSoundDatum( params ) {
        if ( !params || params.length < 1 ) {
            this.logger.errorx( "getSoundDatum", "The 'getSoundDatum' method " +
                                "requires the sound name." );
            return undefined;
        }

        return soundData[ params[ 0 ] ];
    }

    function GetSoundInstance( params ) {
        if ( !params || params.length < 1 ) {
            this.logger.errorx( "GetSoundInstance", "The 'GetSoundInstance' method " +
                                "requires the instance ID." );
            return undefined;
        }

        var instanceID = params[ 0 ];

        if ( ( instanceID.soundName == undefined ) || 
             ( instanceID.instanceID == undefined ) ) {
            this.logger.errorx( "GetSoundInstance", "The instance id must contain " +
                                "soundName and the instanceID values");
            return undefined;
        }

        var soundDatum = soundData[ instanceID.soundName ];
        return soundDatum ? soundDatum.playingInstances[ instanceID.instanceID ] : undefined;
    }

} );


