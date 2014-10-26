if(require.has){
	require.has.add("config-selectorEngine", "acme");
}
define([
	"../ready",
	"./kernel",
	"./connect", // until we decide if connect is going back into non-browser environments
	"./unload",
	"./window",
	"./event",
	"./html",
	"./NodeList",
	"../query",
	"./xhr",
	"./fx"], function(dojo){

	// module:
	//		dojo/_base/browser

	/*=====
	return {
		// summary:
		//		This module causes the browser-only base modules to be loaded.
		//		
		// description:
		// 		This module has no methods or properties of it's own. It only loads the following browser-only base modules:
		// 		- ready
		// 		- kernel
		// 		- connect
		// 		- unload
		// 		- window
		// 		- event
		// 		- html
		// 		- NodeList
		// 		- query
		// 		- xhr
		// 		- fx
	};
	=====*/

	return dojo;
});
