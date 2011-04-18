define([
	"./_base/kernel",
	"./has",
	"./_base/load",
	"./_base/loader",
	"./_base/lang",
	"./_base/array",
	"./_base/declare",
	"./_base/connect",
	"./_base/Deferred",
	"./_base/json",
	"./_base/Color",
	"./has!dojo-firebug?./_firebug/firebug",
	"./has!host-browser?./_base/browser"], function(dojo, has){
	// module:
	//		dojo/main
	// summary:
	//		This is the package main module for the dojo package; it loads dojo base appropriate for the execution environment.

	has.add("dojo-config-require", 1);
	if(has("dojo-config-require")){
		var deps= dojo.config.require;
		if(deps){
			deps= dojo.isArray(deps) ? deps : [deps];
			// dojo.config.require may be dot notation
			require(dojo.map(deps, function(item){ return item.replace(/\./g, "/"); }));
		}
	}

	has.add("dojo-config-addOnLoad", 1);
	if(has("dojo-config-addOnLoad")){
		var addOnLoad= dojo.config.addOnLoad;
		if(addOnLoad){
			require.ready(dojo.isArray(addOnLoad) ? dojo.hitch.apply(dojo, addOnLoad) : addOnLoad);
		}
	}

	return dojo;
});
