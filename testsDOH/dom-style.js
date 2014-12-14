define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH.dom-style", require.toUrl("./dom-style.html"), 30000);
	}
});
