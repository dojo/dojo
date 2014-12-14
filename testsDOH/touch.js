define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH.touch", require.toUrl("./test_touch.html"));
	}
});

