CLIENT_ID = "1ba7ea8a06c6bb7454a52fb018449792"

$ ->
  SC.initialize
    client_id: CLIENT_ID

  params = new SC.URI(window.location.toString(), {decodeQuery: true}).query
  