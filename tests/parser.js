define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("parser", require.toUrl("tests/parser/parser.html"), 30000);
		doh.register("parseOnLoad-auto-require", require.toUrl("tests/parser/parseOnLoadAutoRequire.html"), 30000);
		doh.register("parseOnLoad-declarative-require", require.toUrl("tests/parser/parseOnLoadDeclarativeRequire.html"), 30000);
		doh.register("parser-args", require.toUrl("tests/parser/parser-args.html"), 30000);
	}
});
