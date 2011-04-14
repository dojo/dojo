define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register(require.nameToUrl("./NodeList-traverse.html"), 30000);
	}
});
