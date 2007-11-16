dojo.provide("tests._base._loader.hostenv_browser");

tests.register("tests._base._loader.hostenv_browser", 
	[
		function getText(t){
			var filePath = dojo.moduleUrl("tests._base._loader", "getText.txt");
			var text = dojo._getText(filePath);
			t.assertEqual("dojo._getText() test data", text);
		}
	]
);
