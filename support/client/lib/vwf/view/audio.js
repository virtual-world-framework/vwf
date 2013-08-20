/*
 * WebRTC.js : Behaves as a wrapper for vwf/view/rtcObject
 * Maps simple 1:1 signal model to a broadcast model using target and sender ids
 */

define( [ "module", "vwf/view", "vwf/view/buzz/buzz.min"], function( module, view, buzz ) {

	
	return view.load( module, {

		initialize : function()
		{
			this.buzz = require("buzz");
			debugger;
		},

		calledMethod : function(id,name,params)
		{
			
		}
	
	})
});
