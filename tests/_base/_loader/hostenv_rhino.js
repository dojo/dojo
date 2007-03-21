dojo.provide("tests._base._loader.hostenv_rhino");

tests.register("tests._base._loader.hostenv_rhino", 
	[
		function getText(t){
			var symbols = dojo._getModuleSymbols("tests._base._loader");
			var filePath = symbols.slice(1, symbols.length).join("/") + "/getText.txt";
			var text = readText(filePath);
			t.assertEqual("dojo._getText() test data", text);
		}
	]
);
