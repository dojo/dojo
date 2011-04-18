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

	// the preferred way to load the dojo firebug console is by setting has("dojo-firebug") true before boot
	// the isDebug config switch is for backcompat and will work fine in sync loading mode; it works in
	// async mode too, but there's no guarantee when the module is loaded; therefore, if you need a firebug
	// console guarnanteed at a particular spot in an app, either set config.has["dojo-firebug"] true before
	// loading dojo.js or explicitly include dojo/_firebug/firebug in a dependency list.
	if(dojo.config.isDebug){
		require(["dojo/_firebug/firebug"]);
	}

	has.add("dojo-load-firebug-console",
		// the firebug 2.0 console
		!!this["loadFirebugConsole"]
	);
	if(has("dojo-load-firebug-console")){
		loadFirebugConsole();
	}

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
