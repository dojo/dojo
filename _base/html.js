define(["./kernel", "../dom", "../dom-style", "../dom-attr", "../dom-prop", "../dom-class", "../dom-construct", "../dom-geometry"], function(dojo, dom, style, prop, cls, construct, geometry){
	// module:
	//		dojo/dom
	// summary:
	//		This module is a stub fot the core dojo DOM API.

	// mix-in dojo.prop
	dojo.prop = prop;
	dojo.getProp = prop.get;
	dojo.setProp = prop.set;

	return dojo;
});
