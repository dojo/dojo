dojo.provide("dojo.tests.module");

try{
	dojo.require("tests._base");
	dojo.require("tests.i18n"); 
	dojo.require("tests.cldr");
	dojo.require("tests.data");
	dojo.require("tests.date");
	dojo.require("tests.number");
	dojo.require("tests.currency");
	dojo.require("tests.AdapterRegistry");
	dojo.require("tests.io.script");
	dojo.require("tests.io.iframe");
	dojo.requireIf(dojo.isBrowser, "tests.rpc");
	dojo.require("tests.string");
	dojo.require("tests.behavior");
	dojo.require("tests.parser");
	dojo.require("tests.colors");
}catch(e){
	doh.debug(e);
}
