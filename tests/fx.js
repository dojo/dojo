define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.fx", require.nameToUrl("./fx.html"), 30000);
		doh.register("tests.fx", require.nameToUrl("./NodeList-fx.html"), 30000);
	}
});

