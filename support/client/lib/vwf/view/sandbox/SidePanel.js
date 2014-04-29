define(
{
	initialize: function ()
	{
		var sizeTimeoutHandle;
		$(document.body).append('<div id="sidepanel" style=""> </div>');

		function sizeWindowTimer()
		{
			if (!_Editor.findcamera()) return;
			_Editor.findcamera().aspect = ($('#index-vwf').width() / $('#index-vwf').height());
			_Editor.findcamera().updateProjectionMatrix();
			_ScriptEditor.resize();
		}

		function createPanelShowHide()
		{
			var iconname = "togglesidepanelicon";
			$('#toolbar').append('<div id="togglesidepanelicon" class="icon left" />');
			$('#togglesidepanelicon').css('float', 'right');
			$('#' + iconname).click(function ()
			{
				if ($('#sidepanel').offset().left < $(window).width()) hideSidePanel();
				else showSidePanel();
			});
		}

		function hideSidePanel()
		{
			window.clearInterval(window.sizeTimeoutHandle);
			window.sizeTimeoutHandle = window.setInterval(sizeWindowTimer, 33);
			$('#togglesidepanelicon').removeClass('right');
			$('#togglesidepanelicon').addClass('left');
			$('#sidepanel').transit(
			{
				'left': $(window).width()
			});
			$('#ScriptEditor').transit(
			{
				'width': $(window).width()
			});
			$('#index-vwf').transit(
			{
				'width': $(window).width()
			}, function ()
			{
				window.clearInterval(window.sizeTimeoutHandle);
				sizeWindowTimer();
				window.sizeTimeoutHandle = null;
			});
			$(document).trigger('sidePanelClosed');
			$('#index-vwf').focus();
		}

		function showSidePanel()
		{
			window.clearInterval(window.sizeTimeoutHandle);
			window.sizeTimeoutHandle = window.setInterval(sizeWindowTimer, 33);
			$('#togglesidepanelicon').addClass('right');
			$('#togglesidepanelicon').removeClass('left');
			$('#sidepanel .jspContainer .jspPane').css('left',0);
			$('#sidepanel').transit(
			{
				'left': $(window).width() - $('#sidepanel').width()
			});
			$('#ScriptEditor').transit(
			{
				'width': $(window).width() - $('#sidepanel').width()
			});
			$('#index-vwf').transit(
			{
				'width': $(window).width() - $('#sidepanel').width()
			}, function ()
			{
				window.clearInterval(window.sizeTimeoutHandle);
				window.sizeTimeoutHandle = null;
			});
		}
		function updateScrollBars()
		{
			if($('#sidepanel').data('jsp'))
				$('#sidepanel').data('jsp').reinitialise()
		}
		window.updateSidepanelScrollbars = updateScrollBars;
		window.showSidePanel = showSidePanel;
		window.hideSidePanel = hideSidePanel;
		createPanelShowHide();
	}
});