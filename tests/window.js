dojo.provide("tests.window");

// Run viewport related functions test

try{
	doh.registerUrl("tests.window.viewport", dojo.moduleUrl("dojo", "tests/window/viewport.html"));
	doh.registerUrl("tests.window.viewportQuirks", dojo.moduleUrl("dojo", "tests/window/viewportQuirks.html"));
	doh.registerUrl("tests.window.scroll", dojo.moduleUrl("dojo", "tests/window/test_scroll.html"), 99999999);
}catch(e){
	doh.debug(e);
}
