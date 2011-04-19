define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register(require.nameToUrl("./loader/config.html")+"?dojoConfig-djConfig-require");
		doh.register(require.nameToUrl("./loader/config.html")+"?dojoConfig-require");
		doh.register(require.nameToUrl("./loader/config.html")+"?dojoConfig-djConfig");
		doh.register(require.nameToUrl("./loader/config.html")+"?dojoConfig");
		doh.register(require.nameToUrl("./loader/config.html")+"?djConfig-require");
		doh.register(require.nameToUrl("./loader/config.html")+"?djConfig");
		doh.register(require.nameToUrl("./loader/config.html")+"?require");
		doh.register(require.nameToUrl("./loader/config-sniff.html"));
	}
});
