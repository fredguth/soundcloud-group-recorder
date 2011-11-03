var CLIENT_ID, GR;
CLIENT_ID = "1ba7ea8a06c6bb7454a52fb018449792";
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
    return $(".groupLink").text(group.name).attr("href", group.permalink_url);
  });
  return SC.get(GR.groupUrl + "/tracks", {
    limit: 5
  }, function(groups) {
    return $("#trackTmpl").tmpl(groups).appendTo(".track-list ol");
  });
});