define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register(require.nameToUrl("./fx.html"), 30000);
		doh.register(require.nameToUrl("./NodeList-fx.html"), 30000);
	}
});

