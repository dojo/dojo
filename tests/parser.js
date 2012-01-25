define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.parser", require.toUrl("tests/parser/parser.html"), 30000);
		doh.register("tests.parser-args", require.toUrl("tests/parser/parser-args.html"), 30000);
	}
});
