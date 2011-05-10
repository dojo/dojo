define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests._base.fx", require.nameToUrl("./fx.html"), 15000);
	}
});
