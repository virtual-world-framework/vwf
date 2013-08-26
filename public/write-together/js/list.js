$(function(){
  $.getJSON('listallsaves', function(data) {
    $.each(data, function(key, value) {
      if (value['latestsave']) {
        $('#documents tbody').append("<tr><td class='title'>" + value['savename'] + "</td><td class='last-saved'><span class='timeago' title='" + (new Date(parseInt(value['revision']) * 1000)).toISOString() + "'></span></td><td><a class='btn btn-primary' href='/write-together/load/" + value['savename'] + "/" + value['revision'] + "'>Edit</a></td></tr>");
      }
    });

    $("span.timeago").timeago();
  });

});
