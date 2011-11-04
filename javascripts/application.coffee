CLIENT_ID    = "1ba7ea8a06c6bb7454a52fb018449792"
REDIRECT_URI = "http://localhost:9999/callback.html"

GR =
  groupId: null
  groupUrl: null
  
  drawWaveform: (canvas, waveformUrl) -> 
    color = [255, 76, 0]
    waveImg = new Image()
    waveImg.src = "canvas/wave.png" #waveformUrl
    waveImg.onload = () ->
      GR.drawOverlay(this, canvas, color)
    
  drawOverlay: (imageObj, canvas, color) ->
    parent = $(canvas).parent()
    canvas.width = parent.width()
   	canvas.height = parent.height()
  
    context = canvas.getContext("2d");
  
    context.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    data = imageData.data;

    i =0 
    while i < data.length #for (i = 0; i < data.length; i += 4)
      if (data[i + 3]) # If solid 
        data[i]     = color[0]; # red
        data[i + 1] = color[1]; # green
        data[i + 2] = color[2]; # blue             
      i += 4

    # overwrite original image
    context.putImageData(imageData, 0, 0);
      
$ ->
  SC.initialize
    client_id: CLIENT_ID

  params = new SC.URI(window.location.toString(), {decodeQuery: true}).query
  GR.groupUrl = params.url
  
  SC.get GR.groupUrl, (group) ->
    $(".groupLink").text(group.name).attr("href", group.permalink_url)

  SC.get GR.groupUrl + "/tracks", {limit: 5}, (tracks) ->
    #$("#trackTmpl").tmpl(tracks).appendTo(".track-list ol")
    for track in tracks
      trackLi = $("#trackTmpl").tmpl(track).appendTo(".track-list ol")
      GR.drawWaveform trackLi.find("canvas")[0], track.waveform_url

$(".trackLink").live "click", (e) ->
  $a = $(this)
  $li = $a.closest("li")

  # stop any sound

  if $li.hasClass("playing")
    $li.removeClass("playing")
  else
    $li.addClass("playing").siblings().removeClass("playing")
    SC.stream($a.attr("href"), {auto_play: true})

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
      $(".pause-control").show().siblings().hide()
    progress: (ms, level) ->
      setTimer(ms)
      SCWaveform.draw(ms / 1000, level);

$(".pause-control").live "click", (e) ->
  $(".reset").show()
  SC.recordStop()
  setRecorded()

$(".play-control").live "click", (e) ->
  setTimer(0)
  SC.recordPlay
    progress: (ms) -> 
      setTimer(ms)
      density = 500
      canvas    = SCgetCanvas($('canvas.scrubber'))
      ctx       = canvas.getContext("2d")
      ctxHeight = parseInt(ctx.canvas.height, 10) * 0.5
      ctxWidth  = parseInt(ctx.canvas.width, 10)
      wfWidth   = ctxWidth
      counterX  = wfWidth
      duration  = 0
      if recordingDuration 
        rel = Math.round((ms/recordingDuration) * wfWidth) 
      else
        rel = 0
 
      ctx.clearRect(0, 0, ctxWidth, ctxHeight);
      ctx.canvas.width = ctxWidth;
      if(rel > 0)
        ctx.fillStyle = 'rgba(255, 102, 0, 0.3)';
        ctx.fillRect(0, 10, rel, ctxHeight);
        ctx.fillStyle = 'rgba(255, 102, 0, 1)';
        ctx.fillRect(rel, 0, 1, ctxHeight);


    finished: setRecorded
  $(".pause-control").show().siblings().hide()
  
  
$("a.reset").live "click", (e) ->
  SC.recordStop()
  $('.share').addClass('disabled');
  $(".record-control").show().siblings().hide()
  $(".rec-wave-container").hide()
  $(".widget-title").show()
  $(this).hide();
  $(".timer").html('<a href="#" class="recordLink">Join the discussion</a>')
  e.preventDefault();
  
$("a.share").live "click", (e) -> 
  return false if $(this).hasClass("disabled")  
  SC.connect
    redirect_uri: REDIRECT_URI
    connected: () ->
      trackParams = 
        track:
          title: $("#title").val()
          sharing: "public"
      
      SC.recordUpload trackParams, (track) ->
        console.log(track)
        console.log("contribute to group")
        $("#trackTmpl").tmpl(track).appendTo(".uploaded-track .list").addClass("uploading")
        $("#widget").addClass("recorded-track")
        SC.put GR.groupUrl + "/contributions/" + track.id, (track) ->
          console.log('contributed')
          console.log(arguments)
  e.preventDefault();
