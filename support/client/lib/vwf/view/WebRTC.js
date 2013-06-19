/*
 * WebRTC.js : Behaves as a wrapper for vwf/rtcObject
 * Maps simple 1:1 signal model to a broadcast model using target and sender ids
 */

define( [ "module", "vwf/view", "vwf/rtcObject" ], function( module, view, RTCObject ) {

	return view.load( module, {

		initialize : function()
		{
			// create the video window
			var width = 320, height = 240;
			this.vidFrame = document.createElement('div');
			$(this.vidFrame).attr('id', 'vidFrame');
			$(this.vidFrame).append( '<video id="remote"/>' );
			$(this.vidFrame).append( '<video id="self" muted/>' );
			$(this.vidFrame).dialog({width: 'auto', height: 'auto', autoOpen: false});

			// create a new rtc object on view initialization
			this.rtc = new RTCObject(
				$(this.vidFrame).find('#self')[0],
				$(this.vidFrame).find('#remote')[0],
				this.send.bind(this),null
			);

			// hook the close to rtc.disconnect
			$(this.vidFrame).on('dialogclose', function(event,ui){
				this.rtc.disconnect();
				var payload = {target: this.rtcTarget, sender: _UserManager.GetCurrentUserName()};
				vwf_view.kernel.callMethod('index-vwf', 'rtcDisconnect', payload);
				this.rtcTarget = null;
			}.bind(this));
		},


		/*
		 * Receives incoming messages
		 */
		calledMethod : function(id,name,params)
		{
			if( id != 'index-vwf' )
				return;

			if( name == 'rtcCall' )
			{
				$(this.vidFrame).dialog('open');
				this.rtcTarget = params.target;
				this.rtc.initialize({'video':true, 'audio':true});
			}

			else if( name == 'rtcData' )
			{
				if(_UserManager.GetCurrentUserName() == params.target)
				{
					if(this.rtcTarget == null)
						this.rtcTarget = params.sender;

					if( !this.rtc.initialized )
					{
						$(this.vidFrame).dialog('open');
						this.rtc.initialize({'video':true, 'audio':true});
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
					this.rtc.disconnect();
					$(this.vidFrame).dialog("close");
					this.rtcTarget = null;
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
