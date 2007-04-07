dojo.provide("tests._base._loader.loader");

tests.register("tests._base._loader.loader", 
	[
		function baseUrl(t){
			var originalBaseUrl = djConfig["baseUrl"] || "./";

			t.assertEqual(originalBaseUrl, dojo.baseUrl);
		},
		
		function modulePaths(t){
			dojo.registerModulePath("mycoolmod", "../some/path/mycoolpath");
			dojo.registerModulePath("mycoolmod.widget", "http://some.domain.com/another/path/mycoolpath/widget");

			t.assertEqual("../some/path/mycoolpath/util", dojo._getModuleSymbols("mycoolmod.util").join("/"));
			t.assertEqual("http://some.domain.com/another/path/mycoolpath/widget", dojo._getModuleSymbols("mycoolmod.widget").join("/"));
			t.assertEqual("http://some.domain.com/another/path/mycoolpath/widget/thingy", dojo._getModuleSymbols("mycoolmod.widget.thingy").join("/"));
		},
		
		function moduleUrls(t){
			dojo.registerModulePath("mycoolmod", "some/path/mycoolpath");
			dojo.registerModulePath("mycoolmod2", "/some/path/mycoolpath2");
			dojo.registerModulePath("mycoolmod.widget", "http://some.domain.com/another/path/mycoolpath/widget");

			t.assertEqual(dojo.baseUrl + "some/path/mycoolpath/my/favorite.html",
				dojo.moduleUrl("mycoolmod", "my/favorite.html").toString());
			t.assertEqual(dojo.baseUrl + "some/path/mycoolpath/my/favorite.html",
				dojo.moduleUrl("mycoolmod.my", "favorite.html").toString());

			t.assertEqual("/some/path/mycoolpath2/my/favorite.html",
				dojo.moduleUrl("mycoolmod2", "my/favorite.html").toString());
			t.assertEqual("/some/path/mycoolpath2/my/favorite.html",
				dojo.moduleUrl("mycoolmod2.my", "favorite.html").toString());

			t.assertEqual("http://some.domain.com/another/path/mycoolpath/widget/my/favorite.html",
				dojo.moduleUrl("mycoolmod.widget", "my/favorite.html").toString());
			t.assertEqual("http://some.domain.com/another/path/mycoolpath/widget/my/favorite.html",
				dojo.moduleUrl("mycoolmod.widget.my", "favorite.html").toString());
		}
	]
);
