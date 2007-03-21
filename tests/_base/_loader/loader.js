dojo.provide("tests._base._loader.loader");

tests.register("tests._base._loader.loader", 
	[
		function modulePaths(t){
			dojo.registerModulePath("mycoolmod", "../some/path/mycoolpath");
			dojo.registerModulePath("mycoolmod.widget", "http://some.domain.com/another/path/mycoolpath/widget");

			t.assertEqual("../some/path/mycoolpath/util", dojo._getModuleSymbols("mycoolmod.util").join("/"));
			t.assertEqual("http://some.domain.com/another/path/mycoolpath/widget", dojo._getModuleSymbols("mycoolmod.widget").join("/"));
			t.assertEqual("http://some.domain.com/another/path/mycoolpath/widget/thingy", dojo._getModuleSymbols("mycoolmod.widget.thingy").join("/"));
		}
	]
);
