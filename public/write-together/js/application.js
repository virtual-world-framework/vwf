function setContentOrTitle(nodeId, propertyName, propertyValue) {
  var applicationNodeId = vwf_view.kernel.application();

  if (nodeId == applicationNodeId) {
    switch ( propertyName ) {
      case "content":
        $("#doc-content").val(propertyValue);
        setSaveButtonToNeedsSaving();
        break;
      case "title":
        $("#doc-title").val(propertyValue);
        setSaveButtonToNeedsSaving();
        break;
      case "savename":
        $("#doc-savename").text(propertyValue);
        break;
    }
  }
}

function setSaveButtonToNeedsSaving() {
  $('#doc-save').addClass('btn-primary');
  $('#doc-save').text('Save');
}

function setSaveButtonToNotNeedSaving() {
  $('#doc-save').removeClass('btn-primary');
  $('#doc-save').text('Saved');
}

$(function(){
  // Horrible hack to set the page to be white
  $('html').css('backgroundColor', '#f1f1f1');
  $('.full-screen').parent().css('backgroundColor', '#f1f1f1');

  vwf_view.satProperty = function (nodeId, propertyName, propertyValue) {
    var clientThatSatProperty = this.kernel.client();
    var me = this.kernel.moniker();

    if (clientThatSatProperty != me) {
      vwf_view.logger.info("Another changed content to: " + propertyValue);
      setContentOrTitle(nodeId, propertyName, propertyValue);
    }
  }

  vwf_view.gotProperty = function (nodeId, propertyName, propertyValue) {
    vwf_view.logger.info("Got property " + propertyName + "  with value: " + propertyValue);
    setContentOrTitle(nodeId, propertyName, propertyValue);

    setSaveButtonToNotNeedSaving();
  }

  vwf_view.kernel.getProperty(vwf_view.kernel.application(), 'content');
  vwf_view.kernel.getProperty(vwf_view.kernel.application(), 'title');
  vwf_view.kernel.getProperty(vwf_view.kernel.application(), 'savename');

  $('#doc-content').on('input propertychange', function() {
    vwf_view.logger.info("I changed content to: " + $(this).val());
    setSaveButtonToNeedsSaving();
    var applicationNodeId = vwf_view.kernel.application();
    vwf_view.kernel.setProperty(applicationNodeId, "content", $(this).val());
  });

  $('#doc-title').on('input propertychange', function() {
    vwf_view.logger.info("I changed title to: " + $(this).val());
    setSaveButtonToNeedsSaving();
    var applicationNodeId = vwf_view.kernel.application();
    vwf_view.kernel.setProperty(applicationNodeId, "title", $(this).val());
  });

  $('#doc-save').click(function() {
    vwf_view.logger.info("I saved the doc");
    var saveName = $("#doc-savename").text();

    // Show and hide the list user list in order to kick off the dynamic build of the save / load controls
    $.fx.off = true; // Turn off FX so we don't get any animations
    $('#userlist').click();
    $('#x').click();
    $.fx.on = false; // Turn back on FX

    // Stuff the filename in the box and force a click to submit the save
    $('#fileName').val(saveName);
    $('#save').click();

    setSaveButtonToNotNeedSaving();
  });
});
