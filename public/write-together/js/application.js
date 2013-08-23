$(function(){
  $.getJSON('listallsaves', function(data) {
    $.each(data, function(key, value) {
      if (value['latestsave']) {
        $('#documents').append("<li><a href='/write-together/load/" + value['savename'] + "/" + value['revision'] + "'>" + value['savename'] + "</a></li>");
      }
    });
  });
 
});
