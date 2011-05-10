define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests._base.query", require.nameToUrl("./query.html"), 60000);
		doh.register("tests._base.query", require.nameToUrl("./NodeList.html"), 60000);
	}
});
