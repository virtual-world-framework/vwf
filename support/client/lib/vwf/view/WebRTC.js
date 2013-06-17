define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/model/object.js is a backstop property store.

    return view.load( module, {
	
		calledMethod : function(id,name,params){
			
			

			if(id == 'index-vwf' && name == 'createRTCCall')
			{
				debugger;
				if(!this.rtc)
					this.createRTCclient(params);
			}  
			//which will end up here
			if(id == 'index-vwf' && name == 'rtcAnswer')
			{
				
				if(_UserManager.getCurrentUserName() == params.target)
				{
					if(this.rtcTraget == null) this.rtcTraget = params.sender;
					if(!this.rtc)
					   this.createRTCclient(params);
					else
						rtc.receiveCallback(params.rtcData);        
				}
			}
		},
		
		initialize : function(id)
		{
			this.rtc = null;
			if(id == 'index-vwf')
			{
				alert('goit here');
			}
		},

		createRTCclient : function(params)
		{
		   this.rtcTarget = params;
		   var name = params;
		   if(this.rtc)
			   this.rtc.disconnect();
		   this.rtc = new rtc(null,null,
			   this.send.bind(this),    
			   null);
		   this.rtc.initialize({video: true, audio: true});    
		},
		send : function(data) 
		{
			var payload = [];
			payload.rtcData= data;
			payload.target = this.rtcTarget;
			payload.sender = _UserManager.getCurrentUserName();
			//this actuall sends a packtet
			vwf_view.callMethod('index-vwf', 'rtcAnswer', payload); //send

		}
	
	})
});