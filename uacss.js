define(["./_base/kernel", "./dom-geometry", "./_base/lang", "./ready", "./_base/sniff", "./_base/window"], function(dojo, geometry){
	// module:
	//		dojo/uacss
	// summary:
	//		Applies pre-set CSS classes to the top-level HTML node, based on:
	//			- browser (ex: dj_ie)
	//			- browser version (ex: dj_ie6)
	//			- box model (ex: dj_contentBox)
	//			- text direction (ex: dijitRtl)
	//
	//		In addition, browser, browser version, and box model are
	//		combined with an RTL flag when browser text is RTL. ex: dj_ie-rtl.

	var
		html = dojo.doc.documentElement,
		ie = dojo.isIE,
		opera = dojo.isOpera,
		maj = Math.floor,
		ff = dojo.isFF,
		boxModel = geometry.boxModel.replace(/-/,''),

		classes = {
			"dj_ie": ie,
			"dj_ie6": maj(ie) == 6,
			"dj_ie7": maj(ie) == 7,
			"dj_ie8": maj(ie) == 8,
			"dj_ie9": maj(ie) == 9,
			"dj_quirks": dojo.isQuirks,
			"dj_iequirks": ie && dojo.isQuirks,

			// NOTE: Opera not supported by dijit
			"dj_opera": opera,

			"dj_khtml": dojo.isKhtml,

			"dj_webkit": dojo.isWebKit,
			"dj_safari": dojo.isSafari,
			"dj_chrome": dojo.isChrome,

			"dj_gecko": dojo.isMozilla,
			"dj_ff3": maj(ff) == 3
		}; // no dojo unsupported browsers

	classes["dj_" + boxModel] = true;

	// apply browser, browser version, and box model class names
	var classStr = "";
	for(var clz in classes){
		if(classes[clz]){
			classStr += clz + " ";
		}
	}
	html.className = dojo.trim(html.className + " " + classStr);

	// If RTL mode, then add dj_rtl flag plus repeat existing classes with -rtl extension.
	// We can't run the code below until the <body> tag has loaded (so we can check for dir=rtl).
	// priority is 90 to run ahead of parser priority of 100
	dojo.ready(90, function(){
		if(!dojo._isBodyLtr()){
			var rtlClassStr = "dj_rtl dijitRtl " + classStr.replace(/ /g, "-rtl ");
			html.className = dojo.trim(html.className + " " + rtlClassStr + "dj_rtl dijitRtl " + classStr.replace(/ /g, "-rtl "));
		}
	});
	return dojo;
});
