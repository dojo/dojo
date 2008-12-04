dojo.provide("dojo.tests.manualTests");

try{
if(dojo.isBrowser){
	var userArgs = window.location.search.replace(/[\?&](dojoUrl|testUrl|testModule)=[^&]*/g,"").replace(/^&/,"?");
	doh.registerUrl("dojo/tests/back-bookmark.html", dojo.moduleUrl("dojo","tests/back-bookmark.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/back.html", dojo.moduleUrl("dojo","tests/back.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/test_FirebugLite.html", dojo.moduleUrl("dojo","tests/test_FirebugLite.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/test_fx.html", dojo.moduleUrl("dojo","tests/test_fx.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/flickr_viewer.html", dojo.moduleUrl("dojo","tests/dnd/flickr_viewer.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_box_constraints.html", dojo.moduleUrl("dojo","tests/dnd/test_box_constraints.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_container.html", dojo.moduleUrl("dojo","tests/dnd/test_container.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_container_markup.html", dojo.moduleUrl("dojo","tests/dnd/test_container_markup.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_custom_constraints.html", dojo.moduleUrl("dojo","tests/dnd/test_custom_constraints.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_dnd.html", dojo.moduleUrl("dojo","tests/dnd/test_dnd.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_dnd_handles.html", dojo.moduleUrl("dojo","tests/dnd/test_dnd_handles.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_form.html", dojo.moduleUrl("dojo","tests/dnd/test_form.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_moveable.html", dojo.moduleUrl("dojo","tests/dnd/test_moveable.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_moveable_markup.html", dojo.moduleUrl("dojo","tests/dnd/test_moveable_markup.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_params.html", dojo.moduleUrl("dojo","tests/dnd/test_params.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_parent_constraints.html", dojo.moduleUrl("dojo","tests/dnd/test_parent_constraints.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_parent_constraints_margins.html", dojo.moduleUrl("dojo","tests/dnd/test_parent_constraints_margins.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_selector.html", dojo.moduleUrl("dojo","tests/dnd/test_selector.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_selector_markup.html", dojo.moduleUrl("dojo","tests/dnd/test_selector_markup.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/dnd/test_timed_moveable.html", dojo.moduleUrl("dojo","tests/dnd/test_timed_moveable.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/io/iframeUploadTest.html", dojo.moduleUrl("dojo","tests/io/iframeUploadTest.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/io/scriptTimeout.html", dojo.moduleUrl("dojo","tests/io/scriptTimeout.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/_base/fx_delay.html", dojo.moduleUrl("dojo","tests/_base/fx_delay.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/_base/_loader/addLoadEvents.html", dojo.moduleUrl("dojo","tests/_base/_loader/addLoadEvents.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/_base/_loader/afterOnLoad.html", dojo.moduleUrl("dojo","tests/_base/_loader/afterOnLoad.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/_base/_loader/744/testEval.html", dojo.moduleUrl("dojo","tests/_base/_loader/744/testEval.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/_base/_loader/scope/scope04.html", dojo.moduleUrl("dojo","tests/_base/_loader/scope/scope04.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/_base/_loader/scope/scopeContained.html", dojo.moduleUrl("dojo","tests/_base/_loader/scope/scopeContained.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/_base/_loader/scope/scopeContainedXd.html", dojo.moduleUrl("dojo","tests/_base/_loader/scope/scopeContainedXd.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/_base/_loader/scope/scopeDjConfig.html", dojo.moduleUrl("dojo","tests/_base/_loader/scope/scopeDjConfig.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/_base/_loader/scope/scopeSingle.html", dojo.moduleUrl("dojo","tests/_base/_loader/scope/scopeSingle.html"+userArgs), 99999999);
	doh.registerUrl("dojo/tests/_base/_loader/scope/scopeSingleDaac.html", dojo.moduleUrl("dojo","tests/_base/_loader/scope/scopeSingleDaac.html"+userArgs), 99999999);
}
}catch(e){
	doh.debug(e);
}
