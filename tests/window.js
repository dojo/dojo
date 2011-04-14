define(["doh", "require"], function(doh, require){
	doh.register(require.nameToUrl("./window/viewport.html"));
	doh.register(require.nameToUrl("./window/viewportQuirks.html"));
	doh.register(require.nameToUrl("./window/test_scroll.html"), 99999999);
});