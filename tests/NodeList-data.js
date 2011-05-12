define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.NodeList-data", require.nameToUrl("./NodeList-data.html"), 30000);
	}
});
