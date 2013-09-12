define({
	initialize:function()
	{
		
		
		
	
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