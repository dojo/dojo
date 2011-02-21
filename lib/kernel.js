// AMD module id = dojo/lib/kernel
//
// This module ensures the dojo object is initialized by...
//
//	 * dojo/_base/_loader/bootstrap
//	 * dojo/lib/backCompat
//	 * dojo/_base/_loader/hostenv_browser
//
// This is roughly equivalent to the work that dojo.js does by injecting
// bootstrap, loader, and hostenv_browser.
//
// note: this module is relevant only when loading dojo with an AMD loader;
// it is never evaluated otherwise.

// for now, we publish dojo into the global namespace because so many tests and apps expect it.
define(["dojo/_base/_loader/hostenv_browser"], function(dojo_){
	dojo= dojo_;
	return dojo_;
});
