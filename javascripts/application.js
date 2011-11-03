var CLIENT_ID, GR;
CLIENT_ID = "7b3dc769ad5c179d5280de288dba52a9";
GR = {
  groupId: null,
  groupUrl: null,
  drawWaveform: function(canvas, waveformUrl) {
    var color, waveImg;
    color = [255, 0, 0];
    waveImg = new Image();
    waveImg.src = "canvas/wave.png";
    return waveImg.onload = function() {
      return GR.drawOverlay(this, canvas, color);
    };
  },
  drawOverlay: function(imageObj, canvas, color) {
    var context, data, i, imageData, parent;
    parent = canvas.parentNode;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    context = canvas.getContext("2d");
    context.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    data = imageData.data;
    i = 0;
    while (i < data.length) {
      if (data[i + 3]) {
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
      }
      i += 4;
    }
    return context.putImageData(imageData, 0, 0);
  }
};
$(function() {
  var params;
  SC.initialize({
    client_id: CLIENT_ID
  });
  params = new SC.URI(window.location.toString(), {
    decodeQuery: true
  }).query;
  GR.groupUrl = params.url;
  SC.get(GR.groupUrl, function(group) {
    return $(".groupLink").text(group.name).attr("href", group.permalink_url);
  });
  return SC.get(GR.groupUrl + "/tracks", {
    limit: 5
  }, function(tracks) {
    var track, trackLi, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = tracks.length; _i < _len; _i++) {
      track = tracks[_i];
      trackLi = $("#trackTmpl").tmpl(track).appendTo(".track-list ol");
      _results.push(GR.drawWaveform(trackLi.find("canvas")[0], track.waveform_url));
    }
    return _results;
  });
});
$(".trackLink").live("click", function(e) {
  var $a, $li;
  $a = $(this);
  $li = $a.closest("li");
  if ($li.hasClass("playing")) {
    $li.removeClass("playing");
  } else {
    $li.addClass("playing").siblings().removeClass("playing");
    SC.stream($a.attr("href"), {
      auto_play: true
    });
  }
  return e.preventDefault();
});