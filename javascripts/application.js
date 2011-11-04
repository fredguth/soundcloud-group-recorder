var CLIENT_ID, GR, REDIRECT_URI, setRecorded, setTimer;
CLIENT_ID = "1ba7ea8a06c6bb7454a52fb018449792";
REDIRECT_URI = "http://localhost:9999/callback.html";
GR = {
  groupId: null,
  groupUrl: null,
  drawWaveform: function(canvas, waveformUrl) {
    var color, waveImg;
    color = [255, 76, 0];
    waveImg = new Image();
    waveImg.src = "canvas/wave.png";
    return waveImg.onload = function() {
      return GR.drawOverlay(this, canvas, color);
    };
  },
  drawOverlay: function(imageObj, canvas, color) {
    var context, data, i, imageData, parent;
    parent = $(canvas).parent();
    canvas.width = parent.width();
    canvas.height = parent.height();
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
setRecorded = function() {
  $(".play-control").show().siblings().hide();
  $('.title label, .share').removeClass('disabled');
  return $('.title input').attr('disabled', false);
};
setTimer = function(ms) {
  return $(".timer").text(SC.Helper.millisecondsToHMS(ms));
};
$(".record-control, .recordLink").live("click", function(e) {
  setTimer(0);
  $(".widget-title").hide();
  return SC.record({
    start: function() {
      SCWaveform.reset();
      $(".rec-wave-container").show();
      return $(".pause-control").show().siblings().hide();
    },
    progress: function(ms, level) {
      setTimer(ms);
      return SCWaveform.draw(ms / 1000, level);
    }
  });
});
$(".pause-control").live("click", function(e) {
  $(".reset").show();
  SC.recordStop();
  return setRecorded();
});
$(".play-control").live("click", function(e) {
  setTimer(0);
  SC.recordPlay({
    progress: function(ms) {
      var canvas, counterX, ctx, ctxHeight, ctxWidth, density, duration, rel, wfWidth;
      setTimer(ms);
      density = 500;
      canvas = SCgetCanvas($('canvas.scrubber'));
      ctx = canvas.getContext("2d");
      ctxHeight = parseInt(ctx.canvas.height, 10) * 0.5;
      ctxWidth = parseInt(ctx.canvas.width, 10);
      wfWidth = ctxWidth;
      counterX = wfWidth;
      duration = 0;
      if (recordingDuration) {
        rel = Math.round((ms / recordingDuration) * wfWidth);
      } else {
        rel = 0;
      }
      ctx.clearRect(0, 0, ctxWidth, ctxHeight);
      ctx.canvas.width = ctxWidth;
      if (rel > 0) {
        ctx.fillStyle = 'rgba(255, 102, 0, 0.3)';
        ctx.fillRect(0, 10, rel, ctxHeight);
        ctx.fillStyle = 'rgba(255, 102, 0, 1)';
        return ctx.fillRect(rel, 0, 1, ctxHeight);
      }
    },
    finished: setRecorded
  });
  return $(".pause-control").show().siblings().hide();
});
$("a.reset").live("click", function(e) {
  SC.recordStop();
  $(".record-control").show().siblings().hide();
  $(".rec-wave-container").hide();
  $(".widget-title").show();
  $(this).hide();
  $(".timer").html('<a href="#" class="recordLink">Join the discussion</a>');
  return e.preventDefault();
});
$("a.share").live("click", function(e) {
  SC.connect({
    redirect_uri: REDIRECT_URI,
    connected: function() {
      var trackParams;
      trackParams = {
        track: {
          title: $("#title").val(),
          sharing: "public"
        }
      };
      return SC.recordUpload(trackParams, function(track) {
        console.log(track);
        console.log("contribute to group");
        $("#trackTmpl").tmpl(track).appendTo(".uploaded-track .list").addClass("uploading");
        $("#widget").addClass("recorded-track");
        return SC.put(GR.groupUrl + "/contributions/" + track.id, function(track) {
          console.log('contributed');
          return console.log(arguments);
        });
      });
    }
  });
  return e.preventDefault();
});