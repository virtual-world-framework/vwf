define(function ()
{
	var Notifier = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(Notifier);
				isInitialized = true;
			}
			return Notifier;
		}
	}

	function initialize()
	{
		var style = "z-index:99999;width: 71%;height: 14%;position: fixed;background: #454545;opacity: .8;border-radius: 50px;top: 75%;left: 15.5%;box-shadow: 10px 10px 20px,0px 0px 30px grey inset;text-align: center;vertical-align: middle;line-height: 4em;font-size: 4em;font-family: sans-serif;text-shadow: 0px 0px 5px white;color: #1F1F1F;"
		$(document.body).append("<div style='" + style + "' id='NotifierWindow'>This is a test of the multi </div>");
		$(document.body).append("<div id='WaitingWindow'><div style='text-align: center;margin-top: 50px;'><img src='images/loading.gif'><div style='font-size: 1.5em;' id='waittitle'/></div></div>");
		$(document.body).append("<div id='NotifierAlertMessage'></div>");
		
		$('#NotifierWindow').hide();
		this.state = 'hidden';
		this.alerts = [];
		$('#WaitingWindow').dialog(
		{
			modal: true,
			autoOpen: false,
			resizable: false
		});
		this.notify = function (text)
		{
			
			if(this.alerts.indexOf(text) == -1)
			{
				var i = this.alerts.length-1;
				var self = this;
				this.alerts.push(text);
				alertify.log(text);
				window.setTimeout(function()
				{
					self.alerts.splice(i,1);
				},3000);
			}
		}
		this.alert = function (text, callback)
		{
			
			if(this.alerts.indexOf(text) == -1)
			{
				var i = this.alerts.length-1;
				var self = this;
				this.alerts.push(text);
				alertify.alert(text,function()
				{
					self.alerts.splice(i,1);
					if(callback)
						callback();
				});
			}
		}
		$('#NotifierAlertMessage').dialog(
		{
			title: 'Message',
			autoOpen: false,
			height: 'auto',
			width: '200px',
			position: 'center',
			modal: true,
			buttons: {
				'Ok': function ()
				{
					$('#NotifierAlertMessage').dialog('close');
					if (_Notifier.alertcallback)
					{
						var c = _Notifier.alertcallback;
						_Notifier.alertcallback = null;
						c();
					}
				},
			}
		});
		this.startLoad = function (event,title,data)
		{
			
			this.startWait(title,data);
		}
		this.startWait = function (title,data)
		{
			
			
			
			$('#WaitingWindow').dialog('open');
			$('#WaitingWindow').parent().find(".ui-dialog-titlebar").hide();
			$('#WaitingWindow').parent().css('border-radius', '20px');
			$('#WaitingWindow').parent().css('width', '200px');
			$('#WaitingWindow').parent().css('height', '200px');
			$('#WaitingWindow').dialog('option', 'position', 'center');
			$('#waittitle').text(title);
			//alertify.log(data);
		}
		this.stopWait = function ()
		{
			$('#WaitingWindow').dialog('close');
		}
		$(document).bind('BeginParse', this.startLoad.bind(this));
		$(document).bind('EndParse', this.stopWait.bind(this));
	}
});