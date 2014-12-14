define(["doh/main", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("testsDOH._base.xhr", require.toUrl("./xhr.html"), 60000);
	}
});
