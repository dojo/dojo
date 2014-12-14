define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH.behavior", require.toUrl("./behavior.html"));
	}
});
