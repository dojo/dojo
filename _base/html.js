define(["./kernel", "../dom", "../dom-style", "../dom-attr", "../dom-prop", "../dom-class", "../dom-construct", "../dom-geometry"], function(dojo, dom, style, attr, prop, cls, construct, geometry){
	// module:
	//		dojo/dom
	// summary:
	//		This module is a stub fot the core dojo DOM API.

	// mix-in dom-prop
	dojo.prop = prop;
	dojo.getProp = prop.get;
	dojo.setProp = prop.set;

	// mix-in dom-class
	dojo.hasClass = cls.contains;
	dojo.addClass = cls.add;
	dojo.removeClass = cls.remove;
	dojo.toggleClass = cls.toggle;
	dojo.replaceClass = cls.replace;

	return dojo;
});
