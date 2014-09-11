define({
	initialize:function()
	{
		
		
		//don't even start the timer for published worlds
		if(!_DataManager.getInstanceData().publishSettings)
			window.setTimeout(function(){_DataManager.saveTimer();},60000);	

		if(!_DataManager.getInstanceData().publishSettings)
		{
		 $(window).bind('onbeforeunload',function(){
			//user must exist
			if(_UserManager.GetCurrentUserName() && !_DataManager.getInstanceData().publishSettings)
			{
				_DataManager.saveToServer(true);
				return "Are you sure you want to leave this Sandbox world?";
			}		
		});
		}
		$(window).unload(function ()
		{
			vwf.close();
		});
	}
});