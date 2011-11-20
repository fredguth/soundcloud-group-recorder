CLIENT_ID    = "1ba7ea8a06c6bb7454a52fb018449792"
REDIRECT_URI = "http://localhost:9999/callback.html"
CLIENT_ID    = "7b3dc769ad5c179d5280de288dba52a9"
REDIRECT_URI = "http://grouprecorder.soundcloudlabs.com/callback.html"

GR =
  groupId: null
  groupUrl: null
  
$ ->
  SC.initialize
    client_id: CLIENT_ID

  params = new SC.URI(window.location.toString(), {decodeQuery: true}).query
  GR.groupUrl = params.url
  
  SC.get GR.groupUrl, (group) ->
    $(".groupLink").text(group.name).attr("href", group.permalink_url)
    $("#title").val(group.name)
    
  SC.get GR.groupUrl + "/tracks", {limit: 5}, (tracks) ->
    #$("#trackTmpl").tmpl(tracks).appendTo(".track-list ol")
    for track in tracks
      trackLi = $("#trackTmpl").tmpl(track).appendTo("ol#groupTracks")

$(".select-all").live "click", (e) ->
  this.select()
  return false
  
$(".trackLink").live "click", (e) ->
  $a = $(this)
  $li = $a.closest("li")

  SC.streamStopAll()

  if $li.hasClass("playing")
    $li.removeClass("playing")
    $a.attr('title', 'Play')
  else
    $li.addClass("playing").siblings().removeClass("playing")
    $a.attr('title', 'Stop')
    $a.find(".wave-progress").width("0%")
    SC.stream($a.attr("data-trackId"), {
      autoPlay: true
      whileplaying: ->
        $a.find(".wave-progress").width((this.position / this.durationEstimate * 100) + "%")
      onfinish: ->
#        $li.removeClass("playing")
    })

  e.preventDefault()

# RECORDING


setRecorded = ->
  $(".play-control").show().siblings().hide()
  $('.title label, .share').removeClass('disabled');      
  $('.title input').attr('disabled', false);
 
setTimer = (ms) ->
  $(".timer").text(SC.Helper.millisecondsToHMS(ms))

$(".record-control, .recordLink").live "click", (e) ->
  setTimer(0)

  $(".widget-title").hide()
  SC.record
    start: () ->
      SCWaveform.reset() #TODO REMOVE ME
      $(".rec-wave-container").show()
      SCWaveform.initCanvas()
      $(".stop-control").show().siblings().hide()
    progress: (ms, level) ->
      setTimer(ms)
      SCWaveform.draw(ms / 1000, level);

recordingDuration = 0
$(".stop-control").live "click", (e) ->
  SCWaveform.finishedDraw()
  $(".reset").show()
  recordingDuration = SC.recordStop()
  setRecorded()

$(".play-control").live "click", (e) ->
  setTimer(0)
  SC.recordPlay
    finished: setRecorded
  $(".stop-control").show().siblings().hide()
  
$("a.reset").live "click", (e) ->
  SC.recordStop()
  $('.share').addClass('disabled');
  $(".record-control").show().siblings().hide()
  $(".rec-wave-container").hide()
  $(".widget-title").show()
  $(this).hide();
  $(".timer").html('<a href="#" class="recordLink">Record and share!</a>')
  e.preventDefault();
  
$("a.share").live "click", (e) -> 
  return false if $(this).hasClass("disabled")
  SC.connect
    redirect_uri: REDIRECT_URI
    connected: () ->
      track = 
        title: $("#title").val()
        sharing: "public"

      trackParams = 
        track: track
      $.extend(track, {
        state: "uploading"
        user: {username: ""}
        duration: 0
        permalink_url: ""
      })
      
      $("ol#groupTracks li").last().remove();
      
      $track = $("#trackTmpl").tmpl(track).prependTo("ol#groupTracks").addClass("unfinished")
      $track.find(".status").text("Uploading...")
      SC.recordUpload trackParams, (track) ->
        $track.find(".status").text("Processing...")
        $track = $("#trackTmpl").tmpl(track).replaceAll($track).addClass("unfinished")

        checkState = ->
          SC.get track.uri, (track) -> 
            if track.state == "finished"
              $track.find(".status").text("Pending for moderation...")
              SC.get GR.groupUrl + "/tracks", {limit: 1}, (tracks) ->
                if tracks[0] && tracks[0].id == track.id
                  $track.removeClass("unfinished")
            else
              window.setTimeout checkState, 3000
        window.setTimeout checkState, 3000

        $("#widget").addClass("recorded-track")
        SC.put GR.groupUrl + "/contributions/" + track.id, ->
          # do nothing
  e.preventDefault();
