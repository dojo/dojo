define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH.fx", require.toUrl("./fx.html"), 30000);
		doh.register("testsDOH.NodeList-fx", require.toUrl("./NodeList-fx.html"), 30000);
	}
});

