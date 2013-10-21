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
'   <style>@font-face {font-family: "Glyphicons"; src: url(/adl/sandbox/fonts/glyphicons-halflings-regular.ttf) format("truetype");}</style>'+
'	<div id="vidPanel" style="position: absolute; top: 10px; left: 10px; width: 320px; height: 240px;">'+
'		<video id="remote" width="320" height="240" '+
'			style="position: absolute;" '+
'			poster="/adl/sandbox/vwf/view/webrtc/avatar.png"/>'+
'		<video id="self" width="80" height="60" '+
'			style="position: absolute;" '+
'			poster="/adl/sandbox/vwf/view/webrtc/avatar.png" muted/>'+
'		<input id="chatButton" type="button" value="Send Message" '+
'			style="position: absolute; right: 0px;"/>'+
'		<span id="connectionStatus" style="font-family: \'Glyphicons\', arial; font-size: 18pt; position: absolute; right: 5px; bottom: 5px;">\uE182\uE091</span>'+
'	</div>'+
'	<div id="messagePanel" style="position: absolute; top: 10px; left: 10px; width: 320px; height: 240px; background-color: #fff">'+
'		<p id="message">'+
'			Incoming message from Herp Derp'+
'		</p>'+
'		<input id="accept" type="button" value="Accept"/>'+
'		<input id="reject" type="button" value="Reject"/>'+
'	</div>'+
//'	<div id="buttonPanel">'+
//'	</div>'+
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
				$('#vidFrame #messagePanel').css('z-index', -1);
				this.rtc.initialize(this.mode);
			}.bind(this));

			$('#vidFrame #messagePanel input#reject' ).button().click(function(evt){
				console.log('Call rejected');
				$('#vidFrame').dialog('close');
			}.bind(this));

			// hook up the PM button
			$('#vidFrame #chatButton').button().click(function(evt){
				setupPmWindow(this.rtcTarget);
			}.bind(this));

			// hook up the resize handler
			$('#vidFrame').on( 'dialogresize', function(evt,ui)
			{
				// calc new dimensions
				var ratio = 4/3;
				var ratioSize = {};
				if( (ui.size.width-40)*(1+1/ratio) < (ui.size.height-40)*(1+ratio) ){
					ratioSize.width = ui.size.width-40;
					ratioSize.height = (ui.size.width-40)*(1/ratio);
				}
				else {
					ratioSize.width = (ui.size.height-40)*ratio;
					ratioSize.height = ui.size.height-40;
				}

				// set the dimensions of window frames
				$('#vidFrame > div').css(ratioSize)
				$('#vidFrame > #vidPanel > video#remote').css(ratioSize);
				$('#vidFrame > #vidPanel > video#self').css({width: ratioSize.width/4, height: ratioSize.height/4});
				//$('#vidFrame > #vidPanel > input#chatButton').css({left: ratioSize.width - $('#vidFrame #chatButton').width() - 30});
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
