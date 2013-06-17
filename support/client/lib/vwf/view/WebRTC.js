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
				this.rtcTarget = params.target;
				this.rtc.initialize({'video':true, 'audio':true});
			}

			else if( name == 'rtcData' )
			{
				if(_UserManager.GetCurrentUserName() == params.target)
				{
					if(this.rtcTraget == null)
						this.rtcTraget = params.sender;

					if( this.rtc.peerConn == null )
						this.rtc.initialize({'video':true, 'audio':true});
					else
						this.rtc.receiveCallback(params.rtcData);
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
