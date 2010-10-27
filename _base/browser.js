define("dojo/_base/browser",[

"dojo/_base/window",
"dojo/_base/connect",
"dojo/_base/event",
"dojo/_base/html",
"dojo/_base/NodeList",
"dojo/_base/query",
"dojo/_base/xhr",
"dojo/_base/fx"
], function(){
	//Need this to be the last code segment in base, so do not place any
	//dojo/requireIf calls in this file/ Otherwise, due to how the build system
	//puts all requireIf dependencies after the current file, the require calls
	//could be called before all of base is defined/
	dojo.forEach(dojo.config.require, function(i){
		dojo["require"](i);
	});
	return dojo;
});
