dojo.provide("tests._base._loader.hostenv_browser");

tests.register("tests._base._loader.hostenv_browser", 
	[
		function getText(t){
			var symbols = dojo._getModuleSymbols("tests._base._loader");
			var filePath = symbols.slice(1, symbols.length).join("/") + "/getText.txt";
			var text = dojo._getText(filePath);
			t.assertEqual("dojo._getText() test data", text);
		}
	]
);
