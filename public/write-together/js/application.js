function setContentOrTitle(nodeId, propertyName, propertyValue) {
  var editorNodeId = vwf_view.kernel.find('', '/editor');

  if ( nodeId == editorNodeId[0] ) {
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
    console.log("Another changed content to: " + propertyValue);
    setContentOrTitle(nodeId, propertyName, propertyValue);
  }

  vwf_view.gotProperty = function (nodeId, propertyName, propertyValue) {
    console.log("Got property " + propertyName + "  with value: " + propertyValue);
    setContentOrTitle(nodeId, propertyName, propertyValue);

    setSaveButtonToNotNeedSaving();
  }

  vwf_view.kernel.getProperty(vwf_view.kernel.find('', '/editor'), 'content');
  vwf_view.kernel.getProperty(vwf_view.kernel.find('', '/editor'), 'title');
  vwf_view.kernel.getProperty(vwf_view.kernel.find('', '/editor'), 'savename');

  $('#doc-content').on('input propertychange', function() {
    console.log("I changed content to: " + $(this).val());
    setSaveButtonToNeedsSaving();
    var editorNodeId = vwf_view.kernel.find('', '/editor');
    vwf_view.kernel.setProperty( editorNodeId[0], "content", $(this).val());
  });

  $('#doc-title').on('input propertychange', function() {
    console.log("I changed title to: " + $(this).val());
    setSaveButtonToNeedsSaving();
    var editorNodeId = vwf_view.kernel.find('', '/editor');
    vwf_view.kernel.setProperty( editorNodeId[0], "title", $(this).val());
  });

  $('#doc-save').click(function() {
    console.log("I saved the doc");
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
