define(["doh", "require"], function(doh, require){
	if(doh.isBrowser){
		doh.register("tests._base.html", require.nameToUrl("./html.html"), 15000);
		doh.register("tests._base.html_id", require.nameToUrl("./html_id.html"), 15000);
		doh.register("tests._base.html_element", require.nameToUrl("./html_element.html"), 15000);
		doh.register("tests._base.html_rtl", require.nameToUrl("./html_rtl.html"), 15000);
		doh.register("tests._base.html_quirks", require.nameToUrl("./html_quirks.html"), 15000);
		doh.register("tests._base.html_box", require.nameToUrl("./html_box.html"), 35000);
		doh.register("tests._base.html_box_quirks", require.nameToUrl("./html_box_quirks.html"), 35000);
		doh.register("tests._base.html_isBoyLtr", require.nameToUrl("./html_isBodyLtr.html"), 35000);
		doh.register("tests._base.html_docScroll", require.nameToUrl("./html_docScroll.html"), 35000);
	}
});
