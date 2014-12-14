define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH.cookie", require.toUrl("./cookie.html"), 30000);
	}
});
