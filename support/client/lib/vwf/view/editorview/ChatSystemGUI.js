define(
{
	initialize: function ()
	{
		$(document.body).append('<div id="ChatWindow" style="width: 100%;margin:0px;padding:0px">' + '<div class="text ui-widget-content ui-corner-all" style="background-image: -webkit-linear-gradient(top, white 0%, #D9EEEF 100%);width: 99%;top: 0%; height:90%;padding:0px;margin:0px;position: absolute;overflow-y:auto">' + '	<table id="ChatLog" style="width:100%;background-color: transparent;">' + '	</table>' + '</div>' + '<input type="text" name="ChatInput" id="ChatInput" class="text ui-widget-content ui-corner-all" style="width: 99%;top: 92%;position: absolute;padding: 0px;font-size: 1.2em;"/>		' + '</div>');

		function SendChatMessage()
		{
			if (document.PlayerNumber == null)
			{
				_Notifier.notify('You must log in to participate');
				return;
			}
			var parms = new Array();
			parms.push(JSON.stringify(
			{
				sender: document.PlayerNumber,
				text: $('#ChatInput').val()
			}));
			vwf_view.kernel.callMethod('index-vwf', 'receiveChat', parms);
			$('#ChatInput').val('');
		}

		function SendPM(text, receiver)
		{
			if (document.PlayerNumber == null)
			{
				_Notifier.notify('You must log in to participate');
				return;
			}
			var parms = new Array();
			parms.push(JSON.stringify(
			{
				sender: document.PlayerNumber,
				text: text,
				receiver: receiver
			}));
			vwf_view.kernel.callMethod('index-vwf', 'PM', parms);
		}

		function ToSafeID(value)
		{
			return value.replace(/[^A-Za-z0-9]/g, "");
		}

		function setupPmWindow(e)
		{
			var s = e;
			e = ToSafeID(e);
			if ($('#PM' + e).length == 1)
			{
				$('#PM' + e).dialog("open");
			}
			else
			{
				$(document.body).prepend("<div id='" + 'PM' + e + "' style='width: 100%;margin:0px;padding:0px;overflow:hidden'/>");
				$('#PM' + e).dialog(
				{
					title: "Chat with " + s,
					autoOpen: true
				});
				$('#PM' + e).attr('receiver', s);
				var setup = '<div class="text ui-widget-content ui-corner-all" style="background-image: -webkit-linear-gradient(top, white 0%, #D9EEEF 100%);width: 99%;top: 0%; height:80%;padding:0px;margin:0px;position: absolute;overflow-y:auto">' + '<table id="ChatLog' + e + '" style="width:100%;background-color: transparent;">' + '</table>' + '</div>' + '<input type="text" name="ChatInput" id="ChatInput' + e + '" class="text ui-widget-content ui-corner-all" style="width: 99%;top: 82%;position: absolute;padding: 0px;font-size: 1.2em;"/>';
				$('#PM' + e).append(setup);
				$('#ChatInput' + e).attr('receiver', s);
				$('#ChatInput' + e).keypress(function (e)
				{
					var text = $(this).val();
					var rec = $(this).attr('receiver');
					var key;
					if (window.event) key = window.event.keyCode; //IE
					else key = e.which; //firefox
					if (key == 13)
					{
						SendPM(text, rec);
						$(this).val('');
					}
					//e.preventDefault();
					e.stopImmediatePropagation();
				});
				$('#ChatInput' + e).keydown(function (e)
				{
					e.stopImmediatePropagation();
				});
				$('#ChatInput' + e).keyup(function (e)
				{
					e.stopImmediatePropagation();
				});
				$('#ChatInput' + e).change(function (e)
				{
					e.stopImmediatePropagation();
				});
			}
		}

		function PMReceived(e)
		{
			e = JSON.parse(e);
			if (e.sender != document.PlayerNumber && e.receiver != document.PlayerNumber) return;
			if (e.sender != document.PlayerNumber && e.receiver == document.PlayerNumber) setupPmWindow(e.sender);
			var color = 'darkred';
			if (e.sender == document.PlayerNumber) color = 'darkblue';
			if (e.sender != document.PlayerNumber) $('#ChatLog' + ToSafeID(e.sender)).append('<tr><td style="vertical-align: top;width: 25%;min-width: 25%;margin-right: 1em;color:' + color + ';display: table-cell;">' + e.sender + '</td><td style="color:' + color + ';width: 75%;max-width: 75%;">' + e.text + '</td></tr>');
			else $('#ChatLog' + ToSafeID(e.receiver)).append('<tr><td style="vertical-align: top;width: 25%;min-width: 25%;margin-right: 1em;color:' + color + ';display: table-cell;">' + e.sender + '</td><td style="color:' + color + ';width: 75%;max-width: 75%;">' + e.text + '</td></tr>');
		}

		function ChatMessageReceived(e)
		{
			var message = JSON.parse(e);
			var color = 'darkred';
			if (message.sender == document.PlayerNumber) color = 'darkblue';
			$('#ChatLog').append('<tr><td style="vertical-align: top;width: 25%;min-width: 25%;margin-right: 1em;color:' + color + ';display: table-cell;">' + message.sender + '</td><td style="color:' + color + ';width: 75%;max-width: 75%;">' + message.text + '</td></tr>');
		}

		function disableEnterKey(e)
		{
			var key;
			if (window.event) key = window.event.keyCode; //IE
			else key = e.which; //firefox
			if (key == 13) return false;
			else return true;
		}

		function ChatKeypress(e)
		{
			var key;
			if (window.event) key = window.event.keyCode; //IE
			else key = e.which; //firefox
			if (key == 13)
			{
				SendChatMessage();
				return false;
			}
			return true;
		}

		function PMKeypress(event, to)
		{
			var key;
			if (window.event) key = window.event.keyCode; //IE
			else key = e.which; //firefox
			if (key == 13)
			{
				SendPMMessage('test', to);
				return false;
			}
			return true;
		}
		$('#ChatWindow').dialog(
		{
			position: ['left', 'top'],
			width: 300,
			height: 400,
			title: "Chat Window",
			buttons: {
				"Close": function ()
				{
					$(this).dialog("close");
				},
				"Send": function ()
				{
					SendChatMessage();
				}
			},
			autoOpen: false
		});
		window.SendChatMessage = SendChatMessage;
		window.ChatMessageReceived = ChatMessageReceived;
		window.PMReceived = PMReceived;
		window.SendPM = SendPM;
		window.ToSafeID = ToSafeID;
	}
});