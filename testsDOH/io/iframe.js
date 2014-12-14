define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH.io.iframe", require.toUrl("./iframe.html"));
	}
});
