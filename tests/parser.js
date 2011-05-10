define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.parser", require.nameToUrl("./parser.html"), 30000);
	}
});
