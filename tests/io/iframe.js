define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.io.iframe", require.nameToUrl("./iframe.html"));
	}
});
