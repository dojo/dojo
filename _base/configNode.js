exports.config= function(config) {
	//	summary:
	//		This module provides bootstrap configuration for running dojo in node.js

	// any command line arguments with the load flag are pushed into deps
	for (var deps= [], args= [], i= 0; i<process.argv.length; i++) {
		var arg= (process.argv[i]+"").split("=");
		if (arg[0]=="load") {
			deps.push(arg[1]);
		} else {
			args.push(arg);
		}
	}

	var fs= require("fs");

	// make sure global require exists
	//if (typeof global.require=="undefined") {
	//	global.require= {};
	//}

	// reset the has cache with node-appropriate values; 
	var hasCache= {
		"host-node":1,
		"host-browser":0,
		"dom":0,
		"loader-hasApi":1,
		"loader-provides-xhr":0,
		"loader-injectApi":1,
		"loader-timeoutApi":0,
		"loader-traceApi":1,
		"loader-catchApi":1,
		"loader-pageLoadApi":0,
		"loader-priority-readyApi":1,
		"loader-errorApi":1,
		"loader-publish-privates":1,
		"loader-getTextApi":1,
		"dojo-sniff":0,
		"dojo-loader":1,
		"dojo-boot":1,
		"dojo-test-xd":0,
		"dojo-test-sniff":0
	};
	for (var p in hasCache) {
		config.hasCache[p]= hasCache[p];
	}


	// reset some configuration switches with node-appropriate values
	var nodeConfig= {
		baseUrl: __dirname.match(/(.+)\/_base$/)[1],
		isBrowser:0,
		commandLineArgs:args,
		deps:deps,
	
		// TODO: really get the locale
		locale:"us-en",

		debug: function(item) {
			// define debug for console messages during dev instead of console.log
			// (node's heavy async makes console.log confusing sometimes)
			require("util").debug(item);
		},

		eval: function(__text, __urlHint) {
			return process.compile(__text, __urlHint);
		},

		injectUrl: function(url, callback) {
			try {
				process.compile(fs.readFileSync(url, "utf8"), url);
				callback();
			} catch(e) {
				console.log("failed to load resource (" + url + ")");
				console.log(e);
			}
		},

		getXhr: 0,

		getText: function(url, sync, onLoad){
			// TODO: implement async and http/https handling
			onLoad(fs.readFileSync(url, "utf8"));
		}
	};
	for (p in nodeConfig) {
		config[p]= nodeConfig[p];
	}
};
