define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.NodeList-traverse", require.nameToUrl("./NodeList-traverse.html"), 30000);
	}
});
