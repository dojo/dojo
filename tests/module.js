dojo.provide("dojo.tests.module");

try{
	dojo.require("tests._base");
	dojo.require("tests.i18n");
	dojo.requireIf(dojo.isBrowser, "tests.back-hash");
	dojo.requireIf(dojo.isBrowser, "tests.hash");
	dojo.require("tests.cldr");
	dojo.require("dojo.tests.store");
	dojo.require("tests.data");
	dojo.require("tests.date");
	dojo.require("tests.number");
	dojo.require("tests.currency");
	dojo.require("tests.AdapterRegistry");
	dojo.require("tests.io.script");
	dojo.require("tests.io.iframe");
	dojo.requireIf(dojo.isBrowser, "tests.rpc");
	dojo.require("tests.regexp");
	dojo.require("tests.string");
	dojo.require("tests.behavior");
	dojo.require("tests.parser");
	dojo.require("tests.colors");
	dojo.requireIf(dojo.isBrowser,"tests.cookie");
	dojo.require("tests.fx");
	dojo.require("tests.DeferredList");
	dojo.require("tests.Stateful");
	dojo.require("tests.html");
	dojo.requireIf(dojo.isBrowser,"tests.NodeList-traverse");
	dojo.requireIf(dojo.isBrowser,"tests.NodeList-manipulate");
	dojo.requireIf(dojo.isBrowser,"tests.NodeList-data");
	dojo.require("tests.cache");
	dojo.requireIf(dojo.isBrowser, "tests.uacss");
	dojo.requireIf(dojo.isBrowser, "tests.window");
}catch(e){
	doh.debug(e);
}
