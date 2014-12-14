define(["doh/main", "require"], function(doh, require){
	doh.register("testsDOH.dom-prop", require.toUrl("./dom-prop.html"), 30000);
});
