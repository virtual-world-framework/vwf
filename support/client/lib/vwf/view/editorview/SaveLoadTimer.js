define({
	initialize:function()
	{
		
		
		//don't even start the timer for published worlds
		if(!_DataManager.instanceData.publishSettings)
			window.setTimeout(function(){_DataManager.saveTimer();},60000);		
		window.onbeforeunload = function(){
			if(_DataManager.getClientCount() == 1 && _UserManager.GetCurrentUserName())
			{
				_DataManager.saveToServer();
				return "Are you sure you want to leave this VWF world?";
			}		
		};
	}
});