define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.cookie", require.nameToUrl("./cookie.html"), 30000);
	}
});
