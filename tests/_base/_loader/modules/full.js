// this module should not be transformed by the build inverse AMD-transform;
// keeping define from the first line of the file and not providing an AMD-ID pragma prevents this module from being transformed
define("dojo/tests/_base/_loader/modules/full", ["./anon", "../a", "./wrapped", "require"], function (anon, a, wrapped, require) {
	return {
		twiceTheAnswer: a.number + require("../a").number
	};
});