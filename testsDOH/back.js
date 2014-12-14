define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH.back", require.toUrl("./back.html"), 30000);
	}
});
