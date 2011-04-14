define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register(require.nameToUrl("./query.html"), 60000);
		doh.register(require.nameToUrl("./NodeList.html"), 60000);
	}
});
