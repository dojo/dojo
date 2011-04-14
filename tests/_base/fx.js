define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register(require.nameToUrl("./fx.html"), 15000);
	}
});
