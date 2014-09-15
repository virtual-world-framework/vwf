'use strict';

define(function(){

// necessary to maintain context across callbacks
function bind_safetydance(context, fn){
	return function(){
		fn.apply(context, arguments);
	}
}

/*
 * MyRTC object constructor
 */
function MyRTC(localPlayer, remotePlayer, channelSendCallback, channelReceiveCallback)
{
	// set status text constants
	this.statusText = {
		initializing: {text:'\uE183', color: '#c58000'},
		calling: {text:'\uE182\uE092', color: '#c58000'},
		connecting: {text:'\uE182\uE178', color: '#c58000'},
		connected: {text:'\uE182\uE120', color: 'green'},
		nolocal: {text:'\uE036', color: 'red', sticky: true},
		error: {text:'\uE183', color: 'red', sticky: true}
	};

	// set flags and session variables
	this.peerConn = null;
	this.localStream = null;
	this.initialized = false;
	this.isMediaSet = false;
	this.isRemoteStreamStarted = false;
	this.readyToOffer = false;
	this.readyToAnswer = false;
	this.readyForIce = false;
	
	// register callbacks
	this.sendMessage = channelSendCallback;
	this.registerReceiveCallback = channelReceiveCallback;
	this.localPlayer = localPlayer;
	this.remotePlayer = remotePlayer;
	
	this.localCandidateCache = [];
}

MyRTC.prototype.setStatus = function( params )
{
	if( this.statusLocked ) return;

	$('#vidFrame #connectionStatus').text( params.text );
	$('#vidFrame #connectionStatus').css( 'color', params.color );
	if( params.sticky )
		this.statusLocked = true;
}

/*
 * MyRTC initialization function
 * Bind the webcam and start up the socket
 */
MyRTC.prototype.initialize = function( params )
{
	this.initialized = true;
	this.setStatus( this.statusText.initializing );

	// register socket message callback
	if( this.registerReceiveCallback ){
		this.registerReceiveCallback( bind_safetydance(this, this.receiveMessage) );
		this.registerReceiveCallback = undefined;
	}
	
	// set which media to stream
	var mediaDescription = {};
	if( params.video == true )
		mediaDescription.video = true;
	if( params.audio == true )
		mediaDescription.audio = true;
			
	// initialize webcam if available
	if( this.getUserMedia )
	{
		if( this.localStream == null ){

			// remind user to click 'allow'
			var reminderTimeout;
			if( this.detectedBrowser == 'chrome' ){
				reminderTimeout = setTimeout( function(){
					$('#permission-reminder').show( 'bounce', {'direction': 'down', 'distance': 80}, 'slow' );
				}, 5000 );
			}

			// try to bind to camera and microphone
			this.getUserMedia(
				mediaDescription,
				
				// on success, bind webcam to local vid feed
				bind_safetydance( this, function(stream)
				{
					// get rid of reminder
					if( this.detectedBrowser == 'chrome' ){
						clearTimeout(reminderTimeout);
						$('#permission-reminder').hide( 'fade', 'fast' );
					}

					console.log('Binding local camera');

					this.attachStreamToFrame(stream, this.localPlayer);
					this.localStream = stream;

					this.setStatus( this.statusText.calling );

					if( this.trySetLocalMedia() ){
						if( this.readyToOffer ){
							this.readyToOffer = false;
							this.makeOffer();
						}
						else if( this.readyToAnswer ){
							this.readyToAnswer = false;
							this.makeAnswer();
							this.readyForIce = true;
							this.onIceCreation();
						}
					}
				}),
					
				// otherwise just print an error
				bind_safetydance( this, function(error)
				{
					// get rid of reminder
					clearTimeout(reminderTimeout);
					$('#permission-reminder').hide( 'fade', 'fast' );
					console.error('An error occurred while binding webcam: ', error);
					this.setStatus( this.statusText.nolocal );

					this.isMediaSet = true;
					if( this.readyToOffer ){
						this.readyToOffer = false;
						this.makeOffer();
					}
					else if( this.readyToAnswer ){
						this.readyToAnswer = false;
						this.makeAnswer();
						this.readyForIce = true;
						this.onIceCreation();
					}
				})
			);
		}
	}
	else {
		console.error('getUserMedia not supported by this browser');
		this.setStatus( this.statusText.error );
		this.isMediaSet = true;
	}
	
	// inform peers of availability
	console.log('Sending syn');
	this.sendMessage({'type': 'syn', 'mediaDescription': mediaDescription});
}


MyRTC.prototype.disconnect = function()
{
	if( !this.initialized )
		return;

	// reset all state variables to pristine state
	if( this.peerConn ){
		this.peerConn.close();
		this.peerConn = null;
	}
	if( this.localStream ){
		this.localStream.stop();
		this.localStream = null;
	}
	this.initialized = false;
	this.isMediaSet = false;
	this.isRemoteStreamStarted = false;
	this.readyToOffer = false;
	this.readyToAnswer = false;
	this.readyForIce = false;
	
	console.log('Peer connection disconnected');
	
}


MyRTC.prototype.receiveMessage = function( msg )
{
	if( msg.type == 'syn' ){
		// initialize peer connection
		this.createPeerConnection();
		console.log('Sending ack');
		this.sendMessage({'type': 'ack'});
	}
	
	else if( msg.type == 'ack' ){
		// initialize peer connection
		this.createPeerConnection();
		console.log('Sending synack');
		this.sendMessage({'type': 'synack'});
	}
	
	else if( msg.type == 'synack' )
	{
		this.readyToOffer = true;
		if( this.trySetLocalMedia() ){
			this.readyToOffer = false;
			this.makeOffer();
		}
	}
	else if( msg.type == 'offer' )
	{
		// set remote description
		this.peerConn.setRemoteDescription(
			new this.RTCSessionDescription(msg), 
			
			// if successful
			bind_safetydance(this, function(){
				this.readyToAnswer = true;
				
				// if webcam is initialized, send answer and ice
				if( this.trySetLocalMedia() ){
					this.readyToAnswer = false;
					this.makeAnswer();
					this.readyForIce = true;
					this.onIceCreation();
				}
			}),
			
			// if failed
			function(error){
				console.error('Failed to set remote description from offer', error);
				this.setStatus( this.statusText.error );
			}
		);
	}
	else if( msg.type == 'answer' )
	{
		// set remote description
		this.peerConn.setRemoteDescription(
			new this.RTCSessionDescription(msg), 
			
			// if successful
			bind_safetydance(this, function(){
				this.readyForIce = true;
				this.onIceCreation();
			}),
			
			// if failed
			function(error){
				console.error('Failed to set remote description from answer', error);
				this.setStatus( this.statusText.error );
			}
		);
	}
	else if( msg.type == 'candidate' ){
		if( !this.isRemoteStreamStarted && msg.candidate != null ){
			this.peerConn.addIceCandidate( new this.RTCIceCandidate(msg.candidate) );
		}
	}
}


// try to bind local media feed to the peer connection
MyRTC.prototype.trySetLocalMedia = function()
{
	if( !this.isMediaSet && this.peerConn != null && this.localStream != null )
	{
		console.log('Streaming local media');
		this.peerConn.addStream(this.localStream);
		this.isMediaSet = true;
		return true;
	}
	
	return this.isMediaSet;
}


MyRTC.prototype.createPeerConnection = function()
{
	// create a new blank peer connection
	var peerConfig = {'iceServers': [
		{'url': 'stun:stun.l.google.com:19302'},
		{'url': 'stun:stun1.l.google.com:19302'}
	]};
	var peerConstraints = {};
	if( this.detectedBrowser == 'chrome' )
		peerConstraints['optional'] = [{'DtlsSrtpKeyAgreement': 'true'}];
	this.peerConn = new this.RTCPeerConnection(peerConfig, peerConstraints);
	
	// add the remote video once it's available
	this.peerConn.onaddstream = bind_safetydance( this, function(evt){
		console.log('Adding remote stream');
		this.attachStreamToFrame(evt.stream, this.remotePlayer);
	});
	
	// log ice state changes
	this.peerConn.oniceconnectionstatechange = bind_safetydance(this, function(evt)
	{
		console.log('Ice change:', evt.currentTarget.iceConnectionState);
		if( evt.currentTarget.iceConnectionState == 'connected' ){
			this.isRemoteStreamStarted = true;
			this.setStatus( this.statusText.connected );
		}
		// if disconnected, reset and wait for connection
		else if( evt.currentTarget.iceConnectionState == 'disconnected' )
		{
			this.disconnect();

			// reinitialize
			//console.log('Peer connection lost, resetting');
			//this.initialize();
		}
	});
	
	this.peerConn.onicecandidate = bind_safetydance( this, this.onIceCreation );
}

MyRTC.prototype.makeOffer = function()
{
	this.setStatus( this.statusText.connecting );

	var mediaConstraints = {
		'mandatory': {
			'OfferToReceiveAudio': true,
			'OfferToReceiveVideo': true
		}
	};
	if( this.detectedBrowser == 'firefox' )
		mediaConstraints['mandatory']['MozDontOfferDataChannel'] = true;
	
	//console.log('Making an offer');
	
	this.peerConn.createOffer(
		bind_safetydance( this, function(desc){
			// firefox doesn't like using crypto; force it
			if( desc.sdp.indexOf('a=crypto') == -1 ){
				var inline = 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890abc\r\nc=IN';
				desc.sdp = desc.sdp.replace(/c=IN/g, inline);
			}
			console.log('Making an offer:', desc);
			this.peerConn.setLocalDescription(desc);
			this.sendMessage(desc);
		}),
		function(error){
			console.error('An error occurred during peer invitation: ', error);
			this.setStatus( this.statusText.error );
		},
		mediaConstraints
	);
}


MyRTC.prototype.makeAnswer = function()
{
	this.setStatus( this.statusText.connecting );

	var mediaConstraints = {
		'mandatory': {
			'OfferToReceiveAudio': true,
			'OfferToReceiveVideo': true
		}
	};
	
	// initialize a new session and reply
	this.peerConn.createAnswer(
		bind_safetydance( this, function(desc){
			console.log('Sending answer to offeror:', desc);
			this.peerConn.setLocalDescription(desc);
			this.sendMessage(desc);
		}),
		function(error){
			console.error('An error occurred during peer reply: ', error);
			this.setStatus( this.statusText.error );
		},
		mediaConstraints
	);
}

MyRTC.prototype.onIceCreation = function(evt)
{
	if( !this.readyForIce ){
		// add entry to cache for delivery later
		this.localCandidateCache.push(evt.candidate);
	}
	else {
		// send contents of cache
		console.log('Sending candidates');
		while( this.localCandidateCache.length > 0 ){
			var candidate = this.localCandidateCache.shift();
			this.sendMessage({'type': 'candidate', 'candidate': candidate});
		}
		if( evt ){
			this.sendMessage({'type': 'candidate', 'candidate': evt.candidate});
		}
	}
}

// bind STREAM to the element specified by the DOM element FRAME
// but in a cross-browser way
MyRTC.prototype.attachStreamToFrame = function(stream, frame)
{
	if( frame == undefined ){
		return;
	}
	
	if( frame.mozSrcObject !== undefined ){
		frame.mozSrcObject = stream;
	}
	else {
		frame.src = (this.URL && this.URL.createObjectURL(stream)) || stream;
	}
	frame.play();
}

/*
 * Consolidate the various prefixed implementations
 */
if( typeof mozRTCPeerConnection != 'undefined' )
{
	console.log('Firefox detected');
	MyRTC.prototype.detectedBrowser = 'firefox';
	
	MyRTC.prototype.getUserMedia = bind_safetydance(navigator, navigator.mozGetUserMedia);
	MyRTC.prototype.RTCPeerConnection = mozRTCPeerConnection;
	MyRTC.prototype.RTCSessionDescription = mozRTCSessionDescription;
	MyRTC.prototype.RTCIceCandidate = mozRTCIceCandidate;
	MyRTC.prototype.URL = window.mozURL;
}
else if( typeof webkitRTCPeerConnection != 'undefined' )
{
	console.log('Webkit detected');
	MyRTC.prototype.detectedBrowser = 'chrome';
	
	MyRTC.prototype.getUserMedia = bind_safetydance(navigator, navigator.webkitGetUserMedia);
	MyRTC.prototype.RTCPeerConnection = webkitRTCPeerConnection;
	MyRTC.prototype.RTCSessionDescription = RTCSessionDescription;
	MyRTC.prototype.RTCIceCandidate = RTCIceCandidate;
	MyRTC.prototype.URL = window.webkitURL;
}
else
{
	console.log('Generic browser detected');
	MyRTC.prototype.detectedBrowser = 'generic';
	
	MyRTC.prototype.getUserMedia = bind_safetydance(navigator, navigator.GetUserMedia);
	if( typeof RTCPeerConnection != 'undefined' )
		MyRTC.prototype.RTCPeerConnection = RTCPeerConnection;
	if( typeof RTCSessionDescription != 'undefined' )
		MyRTC.prototype.RTCSessionDescription = RTCSessionDescription;
	if( typeof RTCIceCandidate != 'undefined' )
		MyRTC.prototype.RTCIceCandidate = RTCIceCandidate;
	MyRTC.prototype.URL = window.URL;
}

return MyRTC;
});
