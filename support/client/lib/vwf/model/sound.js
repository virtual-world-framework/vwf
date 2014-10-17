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
    var soundGroups = {};
    var masterVolume = 1.0;
    var logger;
    var soundDriver;
    var startTime = Date.now();
    var driver = model.load( module, {

        initialize: function() {
            // In case somebody tries to reference it before we get a chance to create it.
            // (it's created in the view)
            this.state.soundManager = {};
            soundDriver = this;
            logger = this.logger;

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
                logger.warnx( "initialize", "Web Audio API is not supported in this browser." );
            }
        },

        callingMethod: function( nodeID, methodName, params ) { 
            if ( nodeID !== this.state.soundManager.nodeID ) {
                return undefined;
            }

            if ( !context ) {
                return undefined;
            }

            // variables that we'll need in the switch statement below.  These all have function
            // scope, might as well declare them here.
            var soundDefinition, successCallback, failureCallback, exitCallback;
            var soundName, soundNames, soundDatum, soundDefinition, soundInstance;
            var instanceIDs, instanceID, i, volume, fadeTime, fadeMethod, instanceHandle;
            var soundGroup, groupName;

            switch( methodName ) {
                // arguments: soundDefinition, successCallback, failureCallback
                case "loadSound":
                    soundDefinition = params[ 0 ];
                    successCallback = params[ 1 ];
                    failureCallback = params[ 2 ];

                    if ( soundDefinition === undefined ) {
                        logger.errorx( "loadSound", "The 'loadSound' method requires " +
                                       "a definition for the sound." );
                        return undefined;
                    }

                    soundName = soundDefinition.soundName;
                    if ( soundName === undefined ) {
                        logger.errorx( "loadSound", "The sound definition must contain soundName." );
                        return undefined;
                    }

                    if ( soundData[ soundName ] !== undefined ) {
                        logger.errorx( "loadSound", "Duplicate sound named '" + soundName + "'." );
                        return undefined;
                    }

                    soundData[ soundName ] = new SoundDatum( soundDefinition, 
                                                             successCallback, 
                                                             failureCallback );

                    return;

                // arguments: soundName 
                // returns: true if sound is done loading and is playable
                case "isReady":
                    soundDatum = getSoundDatum( params[ 0 ] );
                    return soundDatum !== undefined ? !!soundDatum.buffer : false;

                // arguments: soundName, exitCallback (which is called when the sound stops) 
                // returns: an instance handle, which is an object: 
                //   { soundName: value, instanceID: value }
                //   instanceID is -1 on failure  
                case "playSound":
                    soundName = params[ 0 ];
                    soundDatum = getSoundDatum( soundName );
                    exitCallback = params[ 1 ];
                    return soundDatum ? soundDatum.playSound( exitCallback ) 
                                      : { soundName: soundName, instanceID: -1 };

                case "playSequence":
                    soundNames = params;
                    soundDatum = getSoundDatum( soundNames[ 0 ] );

                    var playNext = function ( soundNames, current ){

                        if (current !== soundNames.length){
                        soundDatum = getSoundDatum( soundNames[ current ] );
                        soundDatum.playSound( playNext ( soundNames, current + 1 ) );
                        }

                    }
                    return soundDatum ? soundDatum.playSound( playNext ( soundNames, 0 ) ) 
                                      : { soundName: soundName, instanceID: - 1 };

                // arguments: soundName
                // returns: true if sound is currently playing
                case "isSoundPlaying":
                    soundDatum = getSoundDatum( params[ 0 ] );
                    return soundDatum ? soundDatum.isPlaying() : false;

                // arguments: instanceHandle
                // returns: true if sound is currently playing
                case "isInstancePlaying":
                    return getSoundInstance( params[ 0 ] ) !== undefined;

                // // arguments: instanceHandle, volume, fadeTime, fadeMethod
                case "setVolume":
                    instanceHandle = params [ 0 ];
                    soundDatum = getSoundDatum( instanceHandle.soundName );

                    if ( soundDatum ){
                        soundDatum.setVolume ( params [ 0 ], params [ 1 ], params [ 2 ], params [ 3 ] );
                    }
                
                // // arguments: volume (0.0-1.0)
                case "setMasterVolume":
                    masterVolume = params [ 0 ];

                    for ( soundName in soundData ){
                        soundDatum = soundData[ soundName ];
                        if ( soundDatum ) {
                            soundDatum.resetOnMasterVolumeChange();
                        }
                    }

                // // arguments: instanceHandle
                case "hasSubtitle":
                    instanceHandle = params [ 0 ];
                    soundDatum = getSoundDatum( instanceHandle.soundName );

                    return soundDatum ? !!soundDatum.subtitle : undefined;

                // // arguments: instanceHandle
                case "getSubtitle":
                    instanceHandle = params [ 0 ];
                    soundDatum = getSoundDatum( instanceHandle.soundName );

                    return soundDatum ? soundDatum.subtitle : undefined;

                // arguments: instanceHandle
                // returns: the duration of the sound
                case "getDuration":
                    instanceHandle = params[ 0 ];
                    soundDatum = getSoundDatum( instanceHandle.soundName );

                    return soundDatum && soundDatum.buffer ? soundDatum.buffer.duration : undefined;

                // arguments: instanceHandle
                case "stopSoundInstance":
                    instanceHandle = params[ 0 ];

                    //If a user chooses to pass just a soundName, stop all instances with that name.
                    if ( !instanceHandle.soundName ){
                        soundName = params[ 0 ];
                        soundDatum = getSoundDatum( soundName );
                        soundDatum && soundDatum.stopDatumSoundInstances();
                    } else {
                    //Otherwise stop the specific instance.
                        soundDatum = getSoundDatum( instanceHandle.soundName );
                        soundDatum && soundDatum.stopInstance( instanceHandle );
                    }
                    return;

                // arguments: groupName
                case "stopSoundGroup":
                    groupName = params[ 0 ];
                    soundGroup = soundGroups[ groupName ];

                    soundGroup && soundGroup.clearQueue();
                    soundGroup && soundGroup.stopPlayingSound();

                    return;

                // arguments: none
                case "stopAllSoundInstances":
                    for ( groupName in soundGroups ) {
                        soundGroup = soundGroups[ groupName ];
                        soundGroup && soundGroup.clearQueue();
                    }

                    for ( soundName in soundData ) {
                        soundDatum = soundData[ soundName ];
                        soundDatum && soundDatum.stopDatumSoundInstances();
                    }
                    return undefined;

                // arguments: soundName
                case "getSoundDefinition":
                    soundDatum = getSoundDatum( params[ 0 ] );
                    return soundDatum ? soundDatum.soundDefinition : undefined;
                    
            }

            return undefined;
        }

    } );

    function SoundDatum( soundDefinition, successCallback, failureCallback ) {
        this.initialize( soundDefinition, successCallback, failureCallback );
        return this;
    }

    SoundDatum.prototype = {
        constructor: SoundDatum,

        // the name
        name: "",

        // the actual sound
        buffer: null,

        // a hashtable of sound instances
        playingInstances: null,

        // control parameters
        initialVolume: 1.0,
        isLooping: false,
        allowMultiplay: false,
        soundDefinition: null,
        playOnLoad: false,

        subtitle: undefined,

        soundGroup: undefined,
        groupReplacementMethod: undefined,
        queueDelayTime: undefined,  // in seconds

        // a counter for creating instance IDs
        instanceIDCounter: 0,

        initialize: function( soundDefinition, successCallback, failureCallback ) {

            this.name = soundDefinition.soundName;
            this.playingInstances = {};
            this.soundDefinition = soundDefinition;

            if ( this.soundDefinition.isLooping !== undefined ) {
                this.isLooping = soundDefinition.isLooping;
            }

            if ( this.soundDefinition.allowMultiplay !== undefined ) {
                this.allowMultiplay = soundDefinition.allowMultiplay;
            }

            if (this.soundDefinition.initialVolume !== undefined ) {
                this.initialVolume = soundDefinition.initialVolume;
            }

            if ( this.soundDefinition.playOnLoad !== undefined ) {
                this.playOnLoad = soundDefinition.playOnLoad;
            }

            this.subtitle = this.soundDefinition.subtitle;

            var soundGroupName = this.soundDefinition.soundGroup;
            if ( soundGroupName ) {
                if ( !soundGroups[ soundGroupName ] ) {
                    soundGroups[ soundGroupName ] = 
                        new SoundGroup( soundGroupName );
                }

                this.soundGroup = soundGroups[ soundGroupName ];
            }

            this.groupReplacementMethod = this.soundDefinition.groupReplacementMethod;
            if ( this.groupReplacementMethod && !this.soundGroup ) {
                logger.warnx( "SoundDatum.initialize", 
                              "You defined a replacement method but not a sound " +
                              "group.  Replacement is only done when you replace " +
                              "another sound in the same group!" );
            }

            if ( this.soundDefinition.queueDelayTime !== undefined ) {
                this.queueDelayTime = this.soundDefinition.queueDelayTime;
                if ( this.groupReplacementMethod !== "queue" ) {
                    logger.warnx( "SoundDatum.initialize", 
                                  "You defined a queue delay time, but " +
                                  "the replacement method is not 'queue'.");
                }
            } else {
                this.queueDelayTime = 
                    this.groupReplacementMethod === "queue" ? 0.8 : 0;

            }

            // Create & send the request to load the sound asynchronously
            var request = new XMLHttpRequest();
            request.open( 'GET', soundDefinition.soundURL, true );
            request.responseType = 'arraybuffer';

            var thisSoundDatum = this;
            request.onload = function() {
                context.decodeAudioData(
                    request.response, 
                    function( buffer ) {
                        thisSoundDatum.buffer = buffer;

                        if ( thisSoundDatum.playOnLoad === true ) {
                            thisSoundDatum.playSound( null, true );
                        }

                        successCallback && successCallback();
                    }, 
                    function() {
                        logger.warnx( "SoundDatum.initialize", "Failed to load sound: '" + 
                                      thisSoundDatum.name + "'." );

                        delete soundData[ thisSoundDatum.name ];

                        failureCallback && failureCallback();
                    }
                );
            }
            request.send();
        },

        playSound: function( exitCallback ) {

            if ( !this.buffer ) {
                logger.errorx( "SoundDatum.playSound", "Sound '" + this.name + "' hasn't finished " +
                               "loading, or loaded improperly." );
                return { soundName: this.name, instanceID: -1 };
            }

            if ( !this.allowMultiplay && this.isPlaying() ) {
                return { soundName: this.name, 
                         instanceID: this.playingInstances[ 0 ] };
            }

            var id = this.instanceIDCounter;
            ++this.instanceIDCounter;

            this.playingInstances[ id ] = new PlayingInstance( this, id, exitCallback );
            return { soundName: this.name, instanceID: id };
        },

        stopInstance: function( instanceHandle ) {
            var soundInstance = this.playingInstances[ instanceHandle.instanceID ];
            soundInstance && soundInstance.stop();
        },

        stopDatumSoundInstances: function () {
            for ( var instanceID in this.playingInstances ) {
                var soundInstance = this.playingInstances[ instanceID ];
                soundInstance && soundInstance.stop();
            }

            // I have no freaking idea why uncommenting this breaks absolutely 
            //  everything, but it does!
            // this.playingInstances = {};
        },

        resetOnMasterVolumeChange: function () {
            for ( var instanceID in this.playingInstances ) {
                var soundInstance = this.playingInstances[ instanceID ];
                if ( soundInstance ) {
                    soundInstance.resetVolume();
                }
            }
        },

        setVolume: function ( instanceHandle, volume, fadeTime, fadeMethod ) {
           // arguments: instanceHandle, volume, fadeTime, fadeMethod
            var soundInstance = getSoundInstance( instanceHandle );
            soundInstance && soundInstance.setVolume( volume, fadeTime, fadeMethod );
        },

        isPlaying: function() {
            var instanceIDs = Object.keys( this.playingInstances );
            return instanceIDs.length > 0;
        },
    }

    function PlayingInstance( soundDatum, id, exitCallback, successCallback ) {
        this.initialize( soundDatum, id, exitCallback, successCallback );
        return this;
    }

    PlayingInstance.prototype = {
        constructor: PlayingInstance,

        // our id, for future reference
        id: undefined,

        // a reference back to the soundDatum
        soundDatum: null,

        // the control nodes for the flowgraph
        sourceNode: undefined,
        gainNode: undefined,

        // we need to know the volume for this node *before* the master volume
        //  adjustment is applied.  This is that value.
        localVolume$: undefined,

        // stopped, delayed, playing, stopping, delayCancelled
        playStatus: undefined, 

        initialize: function( soundDatum, id, exitCallback, successCallback ) {
            // NOTE: from http://www.html5rocks.com/en/tutorials/webaudio/intro/:
            //
            // An important point to note is that on iOS, Apple currently mutes all sound 
            // output until the first time a sound is played during a user interaction 
            // event - for example, calling playSound() inside a touch event handler. 
            // You may struggle with Web Audio on iOS "not working" unless you circumvent 
            // this - in order to avoid problems like this, just play a sound (it can even
            // be muted by connecting to a Gain Node with zero gain) inside an early UI
            // event - e.g. "touch here to play".
            this.id = id;
            this.soundDatum = soundDatum;

            this.playStatus = "stopped";

            this.sourceNode = context.createBufferSource();
            this.sourceNode.buffer = this.soundDatum.buffer;
            this.sourceNode.loop = this.soundDatum.isLooping;

            this.localVolume$ = this.soundDatum.initialVolume;
            this.gainNode = context.createGain();
            this.sourceNode.connect( this.gainNode );
            this.gainNode.connect( context.destination );
            this.resetVolume();

            var group = soundDatum.soundGroup;

            // Browsers will handle onended differently depending on audio 
            //   filetype - needs support.
            var thisInstance = this;
            this.sourceNode.onended =  function() {
                thisInstance.playStatus = "stopped";
                fireSoundEvent( "soundFinished", thisInstance );

                // logger.logx( "PlayingInstance.onended",
                //              "Sound ended: '" + thisInstance.soundDatum.name +
                //              "', Timestamp: " + timestamp() );

                if ( group ) {
                    group.soundFinished( thisInstance );

                    var nextInstance = group.unQueueSound();
                    if ( nextInstance ) {
                        var delaySeconds = nextInstance.soundDatum.queueDelayTime;

                        // logger.logx( "PlayingInstance.onended", 
                        //              "Popped from the queue: '" + 
                        //              nextInstance.soundDatum.name +
                        //              ", Timeout: " + delaySeconds +
                        //              ", Timestamp: " + timestamp() );

                        if ( delaySeconds > 0 ) {
                            nextInstance.startDelayed( delaySeconds );
                        } else {
                            nextInstance.start();
                        }
                    }
                }

                delete soundDatum.playingInstances[ id ];
                exitCallback && exitCallback();
            }

            if ( group ) {
                switch ( soundDatum.groupReplacementMethod ) {
                    case "queue":
                        // We're only going to play the sound if there isn't 
                        //   already a sound from this group playing.  
                        //   Otherwise, add it to a queue to play later.
                        if ( group.getPlayingSound() )  {
                            group.queueSound( this );
                        } else {
                            this.start();
                        }

                        break;

                    case "replace":
                        group.clearQueue();
                        group.stopPlayingSound();
                        this.start();
                        break;

                    default:
                        logger.errorx( "PlayingInstance.initialize",
                                       "This sound ('" + 
                                       thisInstance.soundDatum.name + 
                                       "') is in a group, but doesn't " +
                                       "have a valid replacement method!" );

                        group.clearQueue();
                        group.stopPlayingSound();
                        this.start();
                }
            } else {
                this.start();
            }
        },

        getVolume: function() {
            return this.localVolume$ * ( masterVolume !== undefined ? masterVolume : 1.0 );
        },

        setVolume: function( volume, fadeTime, fadeMethod ) {
            if ( !volume ) {
                logger.errorx( "PlayingInstance.setVolume", "The 'setVolume' " +
                               "method requires a volume." );
                return;
            }

            this.localVolume$ = volume;

            if ( !fadeTime || ( fadeTime <= 0 ) ) {
                fadeMethod = "immediate";
            } 

            var now = context.currentTime;
            this.gainNode.gain.cancelScheduledValues( now );

            switch( fadeMethod ) {
                case "linear":
                    var endTime = now + fadeTime;
                    this.gainNode.gain.linearRampToValueAtTime( this.getVolume(), 
                                                                endTime );
                    break;
                case "exponential":
                case undefined:
                    this.gainNode.gain.setTargetValueAtTime( this.getVolume(), 
                                                             now, fadeTime );
                    break;
                case "immediate":
                    this.gainNode.gain.value = this.getVolume();
                    break;
                default:
                    logger.errorx( "PlayingInstance.setVolume", "Unknown fade method: '" +
                                   fadeMethod + "'.  Using an exponential " +
                                   "fade." );
                    this.gainNode.gain.setTargetValueAtTime( this.getVolume(), 
                                                             now, fadeTime );
            }
        },

        resetVolume: function() {
            this.setVolume(this.localVolume$);
        },

        start: function() {
            switch ( this.playStatus ) {
                case "playing":
                    logger.warnx( "PlayingInstance.start", 
                                  "Duplicate call to start. Sound: '" +
                                  this.soundDatum.name + "'." );
                    break;

                case "stopping":
                    logger.warnx( "PlayingInstance.start", "Start is being " +
                                  "called, but we're not done stopping yet. " +
                                  "Is that bad?" );
                    // deliberately drop through - we can restart it.
                case "delayed":
                case "stopped":
                    var group = this.soundDatum.soundGroup;
                    var playingSound = group ? group.getPlayingSound() 
                                             : undefined;
                    if ( !group ||
                         !playingSound ||
                         ( ( playingSound === this ) &&
                           ( this.playStatus !== "stopping" ) ) ) {

                        this.playStatus = "playing";
                        group && group.setPlayingSound( this );
                        this.sourceNode.start( 0 ); 

                        // logger.logx( "startSoundInstance",
                        //              "Sound started: '" + this.soundDatum.name + 
                        //              "', Timestamp: " + timestamp() );

                        fireSoundEvent( "soundStarted", this );
                    } else {
                        if ( ( playingSound !== this ) && 
                             ( playingSound.playStatus != "stopping" ) ) {

                            logger.errorx( "PlayingInstance.start", 
                                          "We are trying to start a sound " + 
                                          "('" + this.soundDatum.name + 
                                          "') that is in a sound group, " + 
                                          "but the currently playing sound " +
                                          "in that group ('" + 
                                          playingSound.soundDatum.name + 
                                          "') isn't in the process of " +
                                          "stopping. This is probably bad." );
                        }

                        // Because the sound API is asynchronous, this happens
                        //  fairly often. The trick is to just stuff this 
                        //  sound onto the front of the queue, and let it run
                        //  whenever whatever is playing right now finishes.
                        group.jumpQueue( this );
                    }
                    break;

                case "delayCancelled":
                    // don't start - we've been trumped.
                    // NOTE: it's theoretically possible to re-queue the sound
                    //  in between when the delay is cancelled and when it 
                    //  finishes the delay and calls start.  In this case the
                    //  sound might be delayed more than desired, but should 
                    //  still eventually play (I think).  If you're restarting
                    //  sounds alot, consider looking into this.  
                    this.playStatus = "stopped";
                    break;

                default:
                    logger.errorx( "PlayingInstance.start", "Invalid " +
                                   "playStatus: '" + this.playStatus + "'!" );
            }
        },

        startDelayed: function( delaySeconds ) {
            var group = this.soundDatum.soundGroup;
            if ( group ) {
                if ( group.getPlayingSound() ) {
                    logger.errorx( "PlayingInstance.startDelayed", 
                                   "How is there already a sound playing " +
                                   "when startDelayed() is called?" );
                    return;
                }

                group.setPlayingSound( this );
            }

            this.playStatus = "delayed";
            setTimeout( this.start.bind(this), delaySeconds * 1000 );
        },

        stop: function() {
            switch ( this.playStatus ) {
                case "playing":
                    this.playStatus = "stopping";
                    this.sourceNode.stop();
                    break;
                case "delayed":
                    this.playStatus = "delayCancelled";
                    var group = this.soundDatum.soundGroup;
                    if ( group ) {
                        group.soundFinished( this );
                    }
                    break;
                case "delayCancelled":
                case "stopping":
                case "stopped":
                    logger.warnx( "PlayingInstance.stop", "Duplicate call " +
                                  "to stop (or it was never started). " +
                                  "Sound: '" + this.soundDatum.name + "'." );
                    break;
                default:
                    logger.errorx( "PlayingInstance.stop", "Invalid " +
                                   "playStatus: '" + this.playStatus + "'!" );
            }
        },
    }

    function SoundGroup( groupName ) {
        this.initialize( groupName );
        return this;
    }

    SoundGroup.prototype = {
        constructor: SoundGroup,

        // Trying out a new convention - make the values in the prototype be
        //  something obvious, so I can tell if they don't get reset.
        name$: "PROTOTYPE",             // the name of the group, for debugging
        queue$: "PROTOTYPE",            // for storing queued sounds while they wait
        playingSound$: "PROTOTYPE",     // the sound that is currently playing

        initialize: function( groupName ) {
            this.name$ = groupName;
            this.queue$ = [];
            this.playingSound$ = undefined;
        },

        getPlayingSound: function() {
            return this.playingSound$;
        },

        setPlayingSound: function( playingInstance ) {
            if ( this.playingSound$ ) {
                if ( this.playingSound$ !== playingInstance ) {
                    logger.errorx( "SoundGroup.setPlayingSound", 
                                   "Trying to set playingSound to '" + 
                                   playingInstance.soundDatum.name +
                                   "', but it is already set to '" +
                                   this.playingSound$.soundDatum.name + "'!");
                } else if ( !this.playingSound$.playStatus !== "delayed" ) {
                    logger.errorx("SoundGroup.setPlayingSound", 
                                   "How are we re-setting the playing sound " +
                                   "when we're not in a delay? Sound: '" +
                                   this.playingSound$.soundDatum.name + "'." );
                } 
            } else {
                this.playingSound$ = playingInstance;
            }
        },

        soundFinished: function( playingInstance ) {
            if ( playingInstance !== this.playingSound$ ) {
                logger.errorx( "SoundGroup.soundFinished", "'" + 
                               playingInstance.soundDatum.name + "' just " +
                               "repored that it is finished, but we thought " +
                               "that '" + this.playingSound$.soundDatum.name + 
                               "' was playing!");

                return;
            }

            this.playingSound$ = undefined;
        },

        stopPlayingSound: function() {
            this.playingSound$ && this.playingSound$.stop();
        },

        // get in the back of the queue of sounds to play
        queueSound: function( playingInstance ) {
            this.queue$.unshift( playingInstance );
        },

        // jump to the front of the queue of sounds to play
        jumpQueue: function( playingInstance ) {
            this.queue$.push( playingInstance );
        },

        unQueueSound: function() {
            return this.queue$.pop();
        },

        clearQueue: function() {
            this.queue$.length = 0;
        },

        hasQueuedSounds: function() {
            return queue$.length > 0;
        },
    }

    function getSoundDatum( soundName ) {
        if ( soundName === undefined ) {
            logger.errorx( "getSoundDatum", "The 'getSoundDatum' method " +
                           "requires the sound name." );
            return undefined;
        }

        var soundDatum = soundData[ soundName ];
        if ( soundDatum === undefined ) {
            logger.errorx( "getSoundDatum", "Sound '" + soundName + 
                           "' not found." );
            return undefined;
        }

        return soundDatum;
    }

    function getSoundInstance( instanceHandle ) {
        if ( instanceHandle === undefined ) {
            logger.errorx( "getSoundInstance", "The 'GetSoundInstance' " +
                           "method requires the instance ID." );
            return undefined;
        }

        if ( ( instanceHandle.soundName === undefined ) || 
             ( instanceHandle.instanceID === undefined ) ) {
            logger.errorx( "getSoundInstance", "The instance handle must " +
                           "contain soundName and instanceID values");
            return undefined;
        }

        var soundDatum = getSoundDatum( instanceHandle.soundName );

        if ( soundDatum.isLayered === true ) {
            return soundDatum;
        } else {
            return soundDatum ? soundDatum.playingInstances[ instanceHandle.instanceID ] 
                              : undefined;
        }
    }

    function fireSoundEvent( eventString, instance ) {
        vwf_view.kernel.fireEvent( soundDriver.state.soundManager.nodeID, 
                                   eventString,
                                   [ { soundName: instance.soundDatum.name, 
                                       instanceID: instance.id } ] );
    }

    function timestamp() {
        var delta = Date.now() - startTime;
        var minutes = Math.floor( delta / 60000 );
        var seconds = ( delta % 60000 ) / 1000;

        return "" + minutes + ":" + seconds;
    }

    return driver;
} );


