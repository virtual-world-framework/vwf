/*
 * WebRTC.js : Behaves as a wrapper for vwf/view/rtcObject
 * Maps simple 1:1 signal model to a broadcast model using target and sender ids
 */

define( [ "module", "vwf/view", "vwf/view/rtcObject" ], function( module, view, RTCObject ) {

	return view.load( module, {

		initialize : function()
		{
			var html = 
'<div id="vidFrame">'+
'	<div id="vidPanel" style="">'+
'		<video id="remote" width="320" height="240" '+
'			style="position: absolute; border: solid black 1px;" '+
'			poster="/adl/sandbox/vwf/view/webrtc/avatar.png"/>'+
'		<video id="self" width="80" height="60" '+
'			style="position: absolute; border: solid black 1px;" '+
'			poster="/adl/sandbox/vwf/view/webrtc/avatar.png" muted/>'+
'	</div>'+
'	<div id="messagePanel" style="position: absolute; width=322px; height=242px; background-color: #fff">'+
'		<p id="message">'+
'			Incoming message from Herp Derp'+
'		</p>'+
'		<input id="accept" type="button" value="Accept"/>'+
'		<input id="reject" type="button" value="Reject"/>'+
'	</div>'+
'	<img id="permission-reminder" src="/adl/sandbox/images/up-arrow.png"'+
'		style="width: 60px; height: 180px; position: fixed; top: 0px; left: 150px; display: none;"/>'+
'</div>'
			;
			$(document.body).prepend(html);

			// create the dialog box
			$('#vidFrame').dialog({width: 360, height: 280, autoOpen: false, resizable: true, dialogClass: 'visible-overflow'});
			$('.visible-overflow').css('overflow', 'visible');

			// create a new rtc object on view initialization
			this.rtc = new RTCObject(
				$('#vidFrame video#self')[0],
				$('#vidFrame video#remote')[0],
				this.send.bind(this),null
			);

			// hook the close to rtc.disconnect
			$('#vidFrame').on('dialogclose', function(event,ui){
				this.rtc.disconnect();
				$('#vidFrame video').attr('src', '/adl/sandbox/vwf/view/webrtc/avatar.png');
				var payload = {target: this.rtcTarget, sender: _UserManager.GetCurrentUserName()};
				vwf_view.kernel.callMethod('index-vwf', 'rtcDisconnect', payload);
				this.rtcTarget = null;
				console.log('Panel closed, initialized =', this.rtc.initialized);
			}.bind(this));

			// hook up the accept and reject buttons
			$('#vidFrame #messagePanel input#accept').button().click(function(evt){
				console.log('Call accepted');
				$('#vidFrame').find('#messagePanel').css('z-index', -1);
				this.rtc.initialize(this.mode);
			}.bind(this));

			$('#vidFrame #messagePanel input#reject' ).button().click(function(evt){
				console.log('Call rejected');
				$('#vidFrame').dialog('close');
			}.bind(this));

			// hook up the resize handler
			$('#vidFrame').on( 'dialogresize', function(evt){
				console.log('Resized to', evt);
			});
		},


		/*
		 * Receives incoming messages
		 */
		calledMethod : function(id,name,params)
		{
			if( id != 'index-vwf' )
				return;

			if( name == 'rtcCall' || name == 'rtcVideoCall' )
			{
				this.rtcTarget = params.target;
				this.mode = {'audio':true, 'video':name=='rtcVideoCall'};
				var typeWord = this.mode.video ? 'Video' : 'Voice';
				$('#vidFrame').dialog('option', 'title', typeWord+' chat with '+this.rtcTarget);
				$('#vidFrame #messagePanel').css('z-index', -1);
				$('#vidFrame').dialog('open');
				this.rtc.initialize(this.mode);
			}

			else if( name == 'rtcData' )
			{
				if(_UserManager.GetCurrentUserName() == params.target)
				{
					if(this.rtcTarget == null)
						this.rtcTarget = params.sender;

					if( !this.rtc.initialized )
					{
						console.log('Unexpected RTC call, prompting to accept');
						this.mode = params.rtcData.mediaDescription;
						var typeWord = params.rtcData.mediaDescription.video ? 'Video' : 'Voice';
						$('#vidFrame').dialog('option', 'title', typeWord+' chat with '+this.rtcTarget);
						$('#vidFrame #messagePanel').css('z-index', 1);
						$('#vidFrame #message').html('Incoming '+typeWord.toLowerCase()+' call from '+this.rtcTarget);
						$('#vidFrame').dialog('open');
						//this.rtc.initialize( params.rtcData.mediaDescription );
					}
					else {
						this.rtc.receiveMessage(params.rtcData);
					}
				}
			}
			else if( name == 'rtcDisconnect' )
			{
				if( _UserManager.GetCurrentUserName() == params.target )
				{
					console.log('Remote disconnect, clean up');
					$('#vidFrame').dialog("close");
					$('#vidFrame video').attr('src', '/adl/sandbox/vwf/view/webrtc/avatar.png');
				}
			}
		},
		

		// send a signal to the other clients
		send : function(data) 
		{
			var payload = {};
			payload.rtcData = data;
			payload.target = this.rtcTarget;
			payload.sender = _UserManager.GetCurrentUserName();
			vwf_view.kernel.callMethod('index-vwf', 'rtcData', payload); //send
		}
	
	})
});
