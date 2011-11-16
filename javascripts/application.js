(function() {
  var CLIENT_ID, GR, REDIRECT_URI, setRecorded, setTimer;
  CLIENT_ID = "1ba7ea8a06c6bb7454a52fb018449792";
  REDIRECT_URI = "http://localhost:9999/callback.html";
  GR = {
    groupId: null,
    groupUrl: null
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
      $(".groupLink").text(group.name).attr("href", group.permalink_url);
      return $("#title").val("Thoughts on " + group.name);
    });
    return SC.get(GR.groupUrl + "/tracks", {
      limit: 5
    }, function(tracks) {
      var track, trackLi, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = tracks.length; _i < _len; _i++) {
        track = tracks[_i];
        _results.push(trackLi = $("#trackTmpl").tmpl(track).appendTo(".track-list ol"));
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
        SCWaveform.initCanvas();
        return $(".stop-control").show().siblings().hide();
      },
      progress: function(ms, level) {
        setTimer(ms);
        return SCWaveform.draw(ms / 1000, level);
      }
    });
  });
  $(".stop-control").live("click", function(e) {
    SCWaveform.finishedDraw();
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
    $('.share').addClass('disabled');
    $(".record-control").show().siblings().hide();
    $(".rec-wave-container").hide();
    $(".widget-title").show();
    $(this).hide();
    $(".timer").html('<a href="#" class="recordLink">Join the discussion</a>');
    return e.preventDefault();
  });
  $("a.share").live("click", function(e) {
    if ($(this).hasClass("disabled")) {
      return false;
    }
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
          $(".list .track").last().remove();
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
}).call(this);
