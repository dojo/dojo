define(["doh", "dojo/sniff", "require"], function(doh, has, require){
	if(doh.isBrowser){
		// TODO: refactor tests/_base/query.html, and use it to test every query engine/setting (like, css2, acme, etc.)

		// Test loading XHTML document.   Commented out on IE since it causes a warning dialog
		if(!has("ie")){
			doh.register("tests.query-xml", require.toUrl("tests/query/xml.xhtml"), 30000);
		}
	}
});
