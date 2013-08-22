$(function(){
  $.getJSON('listallsaves', function(data) {
    console.log(data);
    $.each(data, function(key, value) {
      $('#documents').append("<li><a href='/write-together/load/" + value['savename'] + "'>" + value['savename'] + "</a></li>");
    });
  });
 
});
