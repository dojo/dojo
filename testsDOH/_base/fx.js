define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH._base.fx", require.toUrl("./fx.html"), 15000);
	}
});
