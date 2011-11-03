CLIENT_ID = "1ba7ea8a06c6bb7454a52fb018449792"

GR =
  groupId: null
  groupUrl: null
  
$ ->
  SC.initialize
    client_id: CLIENT_ID

  params = new SC.URI(window.location.toString(), {decodeQuery: true}).query
  GR.groupUrl = params.url
  
  SC.get GR.groupUrl + "/tracks", {limit: 5}, (groups) ->
    $( "#trackTmpl" ).tmpl(groups).appendTo(".track-list ol");
