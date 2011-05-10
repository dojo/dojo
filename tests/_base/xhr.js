define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests._base.xhr", require.nameToUrl("./xhr.html"), 60000);
	}
});
