define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH.NodeList-traverse", require.toUrl("./NodeList-traverse.html"), 30000);
	}
});
