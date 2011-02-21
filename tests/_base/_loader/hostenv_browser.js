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

tests.registerUrl("tests._base._loader.data-config", dojo.moduleUrl("tests._base._loader", "config-data-global.html"));
tests.registerUrl("tests._base._loader.data-elem-config", dojo.moduleUrl("tests._base._loader", "config-data.html"));
tests.registerUrl("tests._base._loader.dj-config", dojo.moduleUrl("tests._base._loader", "config-dj-global.html"));
tests.registerUrl("tests._base._loader.dj-elem-config", dojo.moduleUrl("tests._base._loader", "config-dj-elemt.html"));

