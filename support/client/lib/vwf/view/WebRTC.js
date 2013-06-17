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
				this.rtc.localPlayer.setAttribute('width', '640');
				this.rtc.localPlayer.setAttribute('height', '480');
				this.rtc.localPlayer.setAttribute('style', 'width:640;height:480;');
				$(this.rtc.localPlayer).dialog();

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
						this.rtc.remotePlayer.setAttribute('width', '640');
						this.rtc.remotePlayer.setAttribute('height', '480');
						this.rtc.remotePlayer.setAttribute('style', 'width:640;height:480;');
						$(this.rtc.remotePlayer).dialog();

						this.rtc.initialize({'video':true, 'audio':true});
						//debugger;
					}
					else {
						this.rtc.receiveMessage(params.rtcData);
						//debugger;
					}
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
