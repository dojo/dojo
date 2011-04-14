define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register(require.nameToUrl("./html/test_set.html"), 30000);
	}
});
