define({
    initialize: function() {
        var sizeTimeoutHandle;
        $(document.body).append('<div id="sidepanel" style=""> </div>');

        function sizeWindowTimer() {
            if (!_Editor.findcamera()) return;
            _Editor.findcamera().aspect = ($('#index-vwf').width() / $('#index-vwf').height());

            _Editor.findcamera().updateProjectionMatrix();

            _ScriptEditor.resize();
        }

        function createPanelShowHide() {
            var iconname = "togglesidepanelicon";
            $('#toolbar').append('<div id="togglesidepanelicon" class="icon left" />');
            $('#togglesidepanelicon').css('float', 'right');
            $('#' + iconname).click(function() {
                if ($('#sidepanel').offset().left < $(window).width()) hideSidePanel();
                else showSidePanel();
            });
        }

        function hideSidePanel() {
            window.clearInterval(window.sizeTimeoutHandle);
            window.sizeTimeoutHandle = window.setInterval(sizeWindowTimer, 33);
            $('#togglesidepanelicon').removeClass('right');
            $('#togglesidepanelicon').addClass('left');
            $('#sidepanel').animate({
                'left': $(window).width()
            });
            $('#ScriptEditor').animate({
                'width': $(window).width() - (parseInt($('#EntityLibrary').css('left')) + $('#EntityLibrary').width())
            });
            $('#index-vwf').animate({
                'width': $(window).width() - (parseInt($('#EntityLibrary').css('left')) + $('#EntityLibrary').width())
            }, function() {
                window.clearInterval(window.sizeTimeoutHandle);
                sizeWindowTimer();
                window.sizeTimeoutHandle = null;
                var resolutionScale = _SettingsManager.getKey('resolutionScale');
                $('#index-vwf')[0].height = $('#index-vwf').height() / resolutionScale;
                $('#index-vwf')[0].width = $(window).width() / resolutionScale;
                _dRenderer.setSize($('#index-vwf').width() / resolutionScale, $('#index-vwf').height() / resolutionScale, false)
                if (_Editor.findcamera()) {
                    _Editor.findcamera().aspect = ($('#index-vwf').width() / $('#index-vwf').height());
                    _Editor.findcamera().updateProjectionMatrix();
                }
            });
            $(document).trigger('sidePanelClosed');
            $('#index-vwf').focus();
        }

        function showSidePanel() {
            window.clearInterval(window.sizeTimeoutHandle);
            window.sizeTimeoutHandle = window.setInterval(sizeWindowTimer, 33);
            $('#togglesidepanelicon').addClass('right');
            $('#togglesidepanelicon').removeClass('left');
            $('#sidepanel .jspContainer .jspPane').css('left', 0);
            $('#sidepanel').animate({
                'left': $(window).width() - $('#sidepanel').width()
            });
            $('#ScriptEditor').animate({
                'width': $(window).width() - $('#sidepanel').width() - (parseInt($('#EntityLibrary').css('left')) + $('#EntityLibrary').width())
            });
            $('#index-vwf').animate({
                'width': $(window).width() - $('#sidepanel').width() - (parseInt($('#EntityLibrary').css('left')) + $('#EntityLibrary').width())
            }, function() {
                window.clearInterval(window.sizeTimeoutHandle);
                window.sizeTimeoutHandle = null;
                var resolutionScale = _SettingsManager.getKey('resolutionScale');
                $('#index-vwf')[0].height = $('#index-vwf').height() / resolutionScale;
                $('#index-vwf')[0].width = $('#index-vwf').width() / resolutionScale;
                _dRenderer.setSize($('#index-vwf').width() / resolutionScale, $('#index-vwf').height() / resolutionScale, false);
                if (_Editor.findcamera()) {
                    _Editor.findcamera().aspect = ($('#index-vwf').width() / $('#index-vwf').height());
                    _Editor.findcamera().updateProjectionMatrix();
                }
            });
        }

        function updateScrollBars() {
            if ($('#sidepanel').data('jsp'))
                $('#sidepanel').data('jsp').reinitialise()
        }
        window.updateSidepanelScrollbars = updateScrollBars;
        window.showSidePanel = showSidePanel;
        window.hideSidePanel = hideSidePanel;
        createPanelShowHide();
    }
});