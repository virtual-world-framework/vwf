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
    var logger;
    var soundDriver;
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
            var isLayered;

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

                    if ( !soundDefinition.isLayered && 
                         ( soundDefinition.soundURL === undefined ) ) {
                        logger.errorx( "loadSound", "The sound definition for '" + soundName +
                                       "' must contain soundURL." );
                        return undefined;
                    }
                    // if ( soundDefinition.initialVolume && 
                    //      ( soundDefinition.initialVolume === 0 ) ) {
                    //     logger.warnx( "loadSound", "Your initial volume for '" + soundName +
                    //                   "' is 0." );
                    // }
                    // Create the sound.
                    // NOTE: the sound file is loaded into a buffer asynchronously, so the
                    // sound will not be ready to play immediately.  That's why we have the
                    // callbacks.

                    if ( !soundDefinition.isLayered ) {

                        soundData[ soundName ] = new SoundDatum( soundDefinition, 
                                                                 successCallback, 
                                                                 failureCallback );

                    } else {

                        soundData[ soundName ] = new LayeredSoundDatum( soundDefinition, 
                                                                        successCallback, 
                                                                        failureCallback );

                    }

                    return;

                // arguments: <none>
                // case "clearAllSounds":
                //     soundNames = Object.keys( soundData );
                //     for ( i = 0; i < soundNames.length; ++i ) {
                //         soundName = soundNames[ i ];
                //         this.state.soundManager.stopAllSoundInstances( soundName );
                //         delete soundData[ soundName ];
                //     }
                //     return;

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
                    var soundNames = params;
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
                    return soundDatum ? soundDatum.playingInstances.length > 0 : false;

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
                case "stopSoundInstance":

                    instanceHandle = params [ 0 ];

                    //If a user chooses to pass just a soundName, stop all instances with that name.
                    if ( !instanceHandle.soundName ){
                        soundName = params [ 0 ];
                        soundDatum = getSoundDatum( soundName );
                        if ( soundDatum ){
                            soundDatum.stopAllSoundInstances();
                        }
                    } else {
                    //Otherwise stop the specific instance.
                        soundDatum = getSoundDatum( instanceHandle.soundName );
                        if ( soundDatum ){
                            soundDatum.stopInstance( instanceHandle );
                        }
                    }
                    return;

                // arguments: none
                case "stopAllSoundInstances":
                    for ( var soundDatum in soundData ){
                        if ( soundDatum ) {
                            soundDatum.stopAllSoundInstances();
                        }
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

    function LayeredSoundDatum( layeredSoundDefinition, successCallback, failureCallback ) {
        this.initialize( layeredSoundDefinition, successCallback, failureCallback );
        return this;
    }

    LayeredSoundDatum.prototype = {
        constructor: LayeredSoundDatum,

        name:"",
        soundDefinitions:[ 0 ],

        instanceIDCounter: 0,
        playingInstances: null,

        startingLayers: [ 0 ],
        randomizeLayers:false,
        playOnLoad:false,

        layers:[ 0 ],
        loadedCount: 0,
        layerCount: 0,

        instanceHandles: null,

        initialize: function ( layeredSoundDefinition, successCallback, failureCallback ) {

            this.name = layeredSoundDefinition.soundName;
            this.soundDefinitions = layeredSoundDefinition.soundDefinitions;
            this.layers = [];
            this.loadedCount = 0;
            this.playOnLoad = layeredSoundDefinition.playOnLoad;
            this.layerCount = layeredSoundDefinition.soundDefinitions.length;
            this.playingInstances = {};
            this.instanceHandles = {};

            var soundDefinitionObjects = Object.keys( layeredSoundDefinition.soundDefinitions );

            for ( var k = 0; k < soundDefinitionObjects.length; ++k ) {

                var doneLoading = function() {
                    successCallback && successCallback();
                }
                var failureToLoad = function() {
                    failureCallback && failureCallback();
                }
                    // If parent LayeredSoundDatum is set to playOnLoad, play children on load.
                    if ( this.playOnLoad === true ) {
                        layeredSoundDefinition.soundDefinitions[k].playOnLoad = true;
                    }

                    var subName = layeredSoundDefinition.soundDefinitions[k].soundName;
                    this.layers[ subName ] = subName;
                    soundData[ subName ] = new SoundDatum( layeredSoundDefinition.soundDefinitions[k], doneLoading , failureToLoad );
            }

            successCallback && successCallback();

        },
        playSound: function ( exitCallback ) {
            for ( var x in this.layers ) {
                this.startLayer( x );
            }

            var id = this.instanceIDCounter;
            ++this.instanceIDCounter;

            this.playingInstances[ id ] = id;

            return { soundName: this.name, instanceID: id };
        },
        stopInstance: function () {
            for ( var x in this.layers ){
                soundData[ x ].stopInstance( this.instanceHandles[ x ] );
                this.instanceHandles[ x ] = undefined;
            }
            
        },
        stopAllSoundInstances: function (){
            var instanceIDs = Object.keys( this.playingInstances );
            for ( var i = 0; i < instanceIDs.length; ++i ) {
                var handle = { soundName: this.name, instanceID: instanceIDs[ i ]};
                this.stopInstance( handle );
            }
        },
        startLayer: function ( id ) {

            if ( id === undefined ) {
                logger.errorx( "startLayer", "The 'startLayer' method requires " +
                                       "an ID for the layer" );
                return undefined;
            }

            if ( this.instanceHandles [ id ] !== undefined ) {
                logger.errorx( "startLayer", "The 'startLayer' indicates that layer " + id +
                                       " is already playing" );
                return undefined;
            }

            this.layers[ id ] = id;
            this.instanceHandles[ id ] = soundData[ id ].playSound();


        },
        stopLayer: function ( id ) {

            if ( id === undefined ) {
                logger.errorx( "stopLayer", "The 'stopLayer' method requires " +
                                       "an ID for the layer" );
                return undefined;
            }

            if (this.instanceHandles [ id ] === undefined) {
                logger.errorx( "startLayer", "The 'startLayer' indicates that layer " + id +
                                       "is already stopped" );
                return undefined;
            }

            this.layers[ id ] = undefined;
            this.instanceHandles[ id ] = undefined;

            soundData[ id ].stopInstance( this.instanceHandles[id].instanceID );
        },

        setVolume: function( id, volume, duration, type ) {

            for ( var x in this.layers ) {
                soundData[ x ].setVolume( this.instanceHandles[ x ] , volume , duration ,type);
            }
        }
    }

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
        volumeAdjustment: 1.0,
        soundDefinition: null,
        playOnLoad: false,

        subtitle: undefined,

        soundGroup: undefined,
        groupReplacementMethod: undefined,

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

            if ( this.soundDefinition.volumeAdjustment !== undefined ) {
                this.volumeAdjustment = soundDefinition.volumeAdjustment;
            }

            if (this.soundDefinition.initialVolume !== undefined ) {
                this.initialVolume = soundDefinition.initialVolume;
            }

            if ( this.soundDefinition.playOnLoad !== undefined ) {
                this.playOnLoad = soundDefinition.playOnLoad;
            }

            this.subtitle = this.soundDefinition.subtitle;

            this.soundGroup = this.soundDefinition.soundGroup;
            if ( this.soundGroup ) {
                if ( !soundGroups[ this.soundGroup ] ) {
                    soundGroups[ this.soundGroup ] = { soundData: [] };
                }

                soundGroups[ this.soundGroup ].soundData[ this.soundName ] = this;
            }

            this.groupReplacementMethod = this.soundDefinition.groupReplacementMethod;

            if ( !!this.groupReplacementMethod && !this.soundGroup ) {
                logger.warnx( "soundDatum.initialize", 
                              "You defined a replacement method but not a sound " +
                              "group.  Replacement is only done when you replace " +
                              "another sound in the same group!" );
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
                        logger.warnx( "initialize", "Failed to load sound: '" + 
                                      name + "." );

                        delete soundData[ thisSoundDatum.name ];

                        failureCallback && failureCallback();
                    }
                );
            }
            request.send();
        },

        playSound: function( exitCallback ) {

            if ( !this.buffer ) {
                logger.errorx( "playSound", "Sound '" + this.name + "' hasn't finished " +
                               "loading, or loaded improperly." );
                return { soundName: this.name, instanceID: -1 };
            }

            if ( !this.allowMultiplay && ( this.playingInstances.length > 0 ) ) {
                logger.warnx( "playSound", "Sound '" + this.name + "'is already " +
                              "playing, and doesn't allow multiplay." );
                return { soundName: this.name, instanceID: -1 };
            }

            var id = this.instanceIDCounter;
            ++this.instanceIDCounter;

            this.playingInstances[ id ] = new PlayingInstance( this, id, exitCallback );
            return { soundName: this.name, instanceID: id };
        },

        stopInstance: function( instanceHandle ) {
            var soundInstance = this.playingInstances[ instanceHandle.instanceID ];
            if ( soundInstance ) {
                soundInstance.sourceNode.stop();
            }
        },

        stopAllSoundInstances: function (){
            var instanceIDs = Object.keys( this.playingInstances );
            for ( var i = 0; i < instanceIDs.length; ++i ) {
                var handle = { soundName: this.name, instanceID: instanceIDs[ i ]};
                this.stopInstance( handle );
            }
        },

        setVolume: function ( instanceHandle, volume, fadeTime, fadeMethod ) {
           // arguments: instanceHandle, volume, fadeTime, fadeMethod
                
            var soundInstance = getSoundInstance( instanceHandle );

            if ( soundInstance ) {
                soundInstance.setVolume( volume, fadeTime, fadeMethod );
            }
   
        }
        
    }

    function PlayingInstance( soundDatum, id, exitCallback, successCallback ) {
        this.initialize( soundDatum, id, exitCallback, successCallback );
        return this;
    }

    PlayingInstance.prototype = {
        constructor: PlayingInstance,

        // a reference back to the soundDatum
        soundDatum: null,

        // the control nodes for the flowgraph
        sourceNode: undefined,
        gainNode: undefined,


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

            this.soundDatum = soundDatum;

            this.sourceNode = context.createBufferSource();
            this.sourceNode.buffer = this.soundDatum.buffer;
            this.sourceNode.loop = this.soundDatum.isLooping;

            this.gainNode = context.createGain();

            this.gainNode.gain.value = this.soundDatum.initialVolume;
            this.sourceNode.connect( this.gainNode );
            this.gainNode.connect( context.destination );

            //Browsers will handle onended differently depending on audio filetype - needs support.

            this.sourceNode.onended =  function() {

                vwf_view.kernel.fireEvent( soundDriver.state.soundManager.nodeID,
                                       "soundFinished",
                                       [ { soundName: soundDatum.name, 
                                              instanceID: id } ] );
                
                if ( soundDatum.soundGroup && soundDatum.groupReplacementMethod === "queue" ) {

                    var currentPlayingInstance = soundGroups[ soundDatum.soundGroup ].queue.pop();
                    var nextPlayingInstance = soundGroups[ soundDatum.soundGroup ].queue.pop();

                    //If there's anything left in the queue, play it!
                    if ( nextPlayingInstance !== undefined ){
                        soundGroups[ soundDatum.soundGroup ].queue.push( nextPlayingInstance );
                        nextPlayingInstance.sourceNode.start( 0 );
                        if ( !!nextPlayingInstance.soundDatum.subtitle ) {
                            vwf_view.kernel.fireEvent( soundDriver.state.soundManager.nodeID,
                                                   "soundStarted",
                                                   [ { soundName: nextPlayingInstance.soundDatum.name, 
                                              instanceID: id } ] );
                        }
                    }
                    
                }

                if ( soundDatum.soundGroup && soundDatum.groupReplacementMethod === "duck" ) {

                    //TODO: raise volume of all other instances in this soundGroup
                    
                }

                delete soundDatum.playingInstances[ id ];
                exitCallback && exitCallback();
            }

            if ( !!soundDatum.soundGroup ) {
                switch ( soundDatum.groupReplacementMethod ) {
                    case "queue":
                        if ( !soundGroups[ soundDatum.soundGroup ].queue ) {
                            soundGroups[ soundDatum.soundGroup ].queue = [];
                        }
                        if ( soundGroups[ soundDatum.soundGroup ].queue.length === 0 ){
                            soundGroups[ soundDatum.soundGroup ].queue.unshift( this );
                            this.sourceNode.start( 0 );
                            if ( !!this.soundDatum.subtitle ) {
                                vwf_view.kernel.fireEvent( soundDriver.state.soundManager.nodeID,
                                                   "soundStarted",
                                                   [ { soundName: soundDatum.name, 
                                              instanceID: id } ] );
                            }
                        } else {
                            soundGroups[ soundDatum.soundGroup ].queue.unshift( this );
                        }
                    case "duck":
                        //TODO: lower volume of all other instances in this soundGroup
                        
                }
            } else {
                this.sourceNode.start( 0 ); 
                vwf_view.kernel.fireEvent( soundDriver.state.soundManager.nodeID,
                                                   "soundStarted",
                                                   [ { soundName: soundDatum.name, 
                                              instanceID: id } ] );
            }
        },

        setVolume: function( volume, fadeTime, fadeMethod ) {
            if ( !volume ) {
                logger.errorx( "setVolume", "The 'setVolume' method " +
                               "requires a volume." );
                return;
            }

            var thisPlayingInstance = this;

            var targetVolume = volume;
             fadeTime = fadeTime ? fadeTime : 0;
             fadeMethod = fadeMethod ? fadeMethod : "linear";

            if ( fadeTime <= 0 ) {
                this.sourceNode.gain.value = targetVolume;
            } else {
                var endTime = context.currentTime + fadeTime;
                var now = context.currentTime;
                this.gainNode.gain.cancelScheduledValues( now );

                switch( fadeMethod ) {
                    case "linear":
                        this.gainNode.gain.linearRampToValueAtTime( volume, endTime );
                        break;
                    case "exponential":
                        this.gainNode.gain.setTargetValueAtTime( volume, now, fadeTime );
                        break;
                    default:
                        logger.errorx( "setVolume", "Unknonwn fade method: '" +
                                       fadeMethod + "'.  Using a linear fade." );
                        this.sourceNode.gain.linearRampToValueAtTime( volume, endTime );
                }
            }
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
            logger.errorx( "getSoundDatum", "Sound '" + soundName + "' not found." );
            return undefined;
        }

        return soundDatum;
    }

    function getSoundInstance( instanceHandle ) {
        if ( instanceHandle === undefined ) {
            logger.errorx( "getSoundInstance", "The 'GetSoundInstance' method " +
                           "requires the instance ID." );
            return undefined;
        }

        if ( ( instanceHandle.soundName === undefined ) || 
             ( instanceHandle.instanceID === undefined ) ) {
            logger.errorx( "getSoundInstance", "The instance handle must contain " +
                           "soundName and the instanceID values");
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

    return driver;
} );


