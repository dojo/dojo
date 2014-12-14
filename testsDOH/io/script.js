define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH.io.script", require.toUrl("./script.html"));
	}
});
