(function() {
  var CLIENT_ID, GR, REDIRECT_URI, recordingDuration, setRecorded, setTimer;
  CLIENT_ID = "1ba7ea8a06c6bb7454a52fb018449792";
  REDIRECT_URI = "http://localhost:9999/callback.html";
  CLIENT_ID = "7b3dc769ad5c179d5280de288dba52a9";
  REDIRECT_URI = "http://grouprecorder.soundcloudlabs.com/callback.html";
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
      return $("#title").val(group.name);
    });
    return SC.get(GR.groupUrl + "/tracks", {
      limit: 5
    }, function(tracks) {
      var track, trackLi, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = tracks.length; _i < _len; _i++) {
        track = tracks[_i];
        _results.push(trackLi = $("#trackTmpl").tmpl(track).appendTo("ol#groupTracks"));
      }
      return _results;
    });
  });
  $(".select-all").live("click", function(e) {
    this.select();
    return false;
  });
  $(".trackLink").live("click", function(e) {
    var $a, $li;
    $a = $(this);
    $li = $a.closest("li");
    SC.streamStopAll();
    if ($li.hasClass("playing")) {
      $li.removeClass("playing");
      $a.attr('title', 'Play');
    } else {
      $li.addClass("playing").siblings().removeClass("playing");
      $a.attr('title', 'Stop');
      $a.find(".wave-progress").width("0%");
      SC.stream($a.attr("data-trackId"), {
        autoPlay: true,
        whileplaying: function() {
          return $a.find(".wave-progress").width((this.position / this.durationEstimate * 100) + "%");
        },
        onfinish: function() {}
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
  recordingDuration = 0;
  $(".stop-control").live("click", function(e) {
    SCWaveform.finishedDraw();
    $(".reset").show();
    recordingDuration = SC.recordStop();
    return setRecorded();
  });
  $(".play-control").live("click", function(e) {
    setTimer(0);
    SC.recordPlay({
      finished: setRecorded
    });
    return $(".stop-control").show().siblings().hide();
  });
  $("a.reset").live("click", function(e) {
    SC.recordStop();
    $('.share').addClass('disabled');
    $(".record-control").show().siblings().hide();
    $(".rec-wave-container").hide();
    $(".widget-title").show();
    $(this).hide();
    $(".timer").html('<a href="#" class="recordLink">Record and share!</a>');
    return e.preventDefault();
  });
  $("a.share").live("click", function(e) {
    if ($(this).hasClass("disabled")) {
      return false;
    }
    SC.connect({
      redirect_uri: REDIRECT_URI,
      connected: function() {
        var $track, track, trackParams;
        track = {
          title: $("#title").val(),
          sharing: "public"
        };
        trackParams = {
          track: track
        };
        $.extend(track, {
          state: "uploading",
          user: {
            username: ""
          },
          duration: 0,
          permalink_url: ""
        });
        $("ol#groupTracks li").last().remove();
        $track = $("#trackTmpl").tmpl(track).prependTo("ol#groupTracks").addClass("unfinished");
        $track.find(".status").text("Uploading...");
        return SC.recordUpload(trackParams, function(track) {
          var checkState;
          $track.find(".status").text("Processing...");
          $track = $("#trackTmpl").tmpl(track).replaceAll($track).addClass("unfinished");
          checkState = function() {
            return SC.get(track.uri, function(track) {
              if (track.state === "finished") {
                $track.find(".status").text("Pending for moderation...");
                return SC.get(GR.groupUrl + "/tracks", {
                  limit: 1
                }, function(tracks) {
                  if (tracks[0] && tracks[0].id === track.id) {
                    return $track.removeClass("unfinished");
                  }
                });
              } else {
                return window.setTimeout(checkState, 3000);
              }
            });
          };
          window.setTimeout(checkState, 3000);
          $("#widget").addClass("recorded-track");
          return SC.put(GR.groupUrl + "/contributions/" + track.id, function() {});
        });
      }
    });
    return e.preventDefault();
  });
}).call(this);
