define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register(require.nameToUrl("./html.html"), 15000);
		doh.register(require.nameToUrl("./html_id.html"), 15000);
		doh.register(require.nameToUrl("./html_element.html"), 15000);
		doh.register(require.nameToUrl("./html_rtl.html"), 15000);
		doh.register(require.nameToUrl("./html_quirks.html"), 15000);
		doh.register(require.nameToUrl("./html_box.html"), 35000);
		doh.register(require.nameToUrl("./html_box_quirks.html"), 35000);
		doh.register(require.nameToUrl("./html_isBodyLtr.html"), 35000);
		doh.register(require.nameToUrl("./html_docScroll.html"), 35000);
	}
});
