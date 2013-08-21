/*
 * WebRTC.js : Behaves as a wrapper for vwf/view/rtcObject
 * Maps simple 1:1 signal model to a broadcast model using target and sender ids
 */

define( [ "module", "vwf/view", "vwf/view/buzz/buzz.min"], function( module, view, buzz ) {

	
	return view.load( module, {

		initialize : function()
		{
			this.buzz = require("buzz");
			this.sounds = {};
		},
		calledMethod : function(id,name,params)
		{
			if(name == 'playSound')
			{
				
				var url = params[0];
				var loop = params[1] || false;
				
				if(this.sounds[url])
				{
					this.sounds[url].play();
					if(loop)
					this.sounds[url].loop();
					else
					this.sounds[url].unloop();
				}
				else
				{
					var mySound = new this.buzz.sound(url,{
						autoplay: true,
						loop: loop
					});
					this.sounds[url] = mySound;
				}
			}
		}
	})
});
