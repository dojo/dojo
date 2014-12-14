define([
	"dojo/testsDOH/_base/loader",
	"dojo/testsDOH/_base/array",
	"dojo/testsDOH/_base/Color",
	"dojo/testsDOH/_base/lang",
	"dojo/testsDOH/_base/declare",
	"dojo/testsDOH/_base/connect",
	"dojo/testsDOH/_base/Deferred",
	"dojo/testsDOH/_base/json",
	"dojo/testsDOH/_base/object",
	"dojo/has!host-browser?dojo/testsDOH/_base/html",
	"dojo/has!host-browser?dojo/testsDOH/dom-style",
	"dojo/has!host-browser?dojo/testsDOH/_base/fx",
	"dojo/has!host-browser?dojo/testsDOH/_base/query",
	"dojo/has!host-browser?dojo/testsDOH/_base/xhr",
	"dojo/has!host-browser?dojo/testsDOH/_base/window"], 1);

	// TODO: platform boot tests
	//dojo.platformRequire({
	// browser: ["testsDOH._base._loader.hostenv_browser"],
	// rhino: ["testsDOH._base._loader.hostenv_rhino"],
	// spidermonkey: ["testsDOH._base._loader.hostenv_spidermonkey"]
	//});
