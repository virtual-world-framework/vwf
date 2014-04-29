define({
	initialize:function()
	{
		
		
		//don't even start the timer for published worlds
		if(!_DataManager.instanceData.publishSettings)
			window.setTimeout(function(){_DataManager.saveTimer();},60000);		
		window.onbeforeunload = function(){
			//user must exist
			if(_UserManager.GetCurrentUserName())
			{
				_DataManager.saveToServer(true);
				return "Are you sure you want to leave this Sandbox world?";
			}		
		};
		$(window).unload(function ()
		{
			vwf.close();
		});
	}
});