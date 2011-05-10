define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.is.iframe", require.nameToUrl("./iframe.html"));
	}
});
