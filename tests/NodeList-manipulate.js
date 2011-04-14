define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register(require.nameToUrl("./NodeList-manipulate.html"), 30000);
	}
});
