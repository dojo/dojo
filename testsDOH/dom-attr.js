define(["doh/main", "require"], function(doh, require){
	doh.register("testsDOH.dom-attr", require.toUrl("./dom-attr.html"), 30000);
});
