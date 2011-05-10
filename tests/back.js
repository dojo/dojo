define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.back", require.nameToUrl("./back.html"), 30000);
	}
});
