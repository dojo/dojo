dojo.provide("dojo._base.browser");

dojo.require("dojo._base.window");
dojo.require("dojo._base.event");
dojo.require("dojo._base.html");
dojo.require("dojo._base.NodeList");
dojo.require("dojo._base.query");
dojo.require("dojo._base.xhr");
dojo.require("dojo._base.fx");

//Need this to be the last code segment in base, so do not place any
//dojo.requireIf calls in this file. Otherwise, due to how the build system
//puts all requireIf dependencies after the current file, the require calls
//could be called before all of base is defined.
if(dojo.config.require){
	dojo.forEach(dojo.config.require, "dojo['require'](item);");
}
