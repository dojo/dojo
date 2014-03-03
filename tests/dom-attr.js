define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests.dom-attr", require.toUrl("./dom-attr.html"), 30000);
	}
});
