/*
 * WebRTC.js : Behaves as a wrapper for vwf/rtcObject
 * Maps simple 1:1 signal model to a broadcast model using target and sender ids
 */

define( [ "module", "vwf/view", "vwf/rtcObject" ], function( module, view, RTCObject ) {

	return view.load( module, {

		initialize : function()
		{
			// create a new rtc object on view initialization
			this.rtc = new RTCObject(null,null,this.send.bind(this),null);
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
				this.rtc.localPlayer = document.createElement('video');
				$(this.rtc.localPlayer).dialog({width: 320, height: 240,
					close: function(event,ui){
						this.rtc.disconnect();
						var payload = {target: this.rtcTarget, sender: _UserManager.GetCurrentUserName()};
						vwf_view.kernel.callMethod('index-vwf', 'rtcDisconnect', payload);
						this.rtcTarget = null;
					}.bind(this)
				});

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
						this.rtc.remotePlayer = document.createElement('video');
						$(this.rtc.remotePlayer).dialog({width: 320, height: 240});

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
					$(this.rtc.remotePlayer).dialog("close");
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
