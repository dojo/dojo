define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.NodeList", require.nameToUrl("./NodeList-data.html"), 30000);
	}
});
