define(["doh", "require"], function(doh, require){

	doh.register("tests.uacss", require.nameToUrl("./uacss/sniffQuirks.html"));
	doh.register("tests.uacss", require.nameToUrl("./uacss/sniffStandards.html"));

});

