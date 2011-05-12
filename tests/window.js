define(["doh", "require"], function(doh, require){
	doh.register("tests.window.viewport", require.nameToUrl("./window/viewport.html"));
	doh.register("tests.window.viewportQuirks", require.nameToUrl("./window/viewportQuirks.html"));
	doh.register("tests.window.test_scroll", require.nameToUrl("./window/test_scroll.html"), 99999999);
});