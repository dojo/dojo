define(["doh", "require"], function(doh, require){

	doh.register("tests.uacss.sniffQuirks", require.nameToUrl("./uacss/sniffQuirks.html"));
	doh.register("tests.uacss.sniffStandards", require.nameToUrl("./uacss/sniffStandards.html"));

});

