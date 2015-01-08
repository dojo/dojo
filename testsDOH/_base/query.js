define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH._base.query", require.toUrl("./query.html"), 60000);	// tests dojo.query() back-compat shim
	}
});
