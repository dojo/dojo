dojo.provide("tests._base._loader.loader");

tests.register("tests._base._loader.loader",
	[
		function baseUrl(t){
			var originalBaseUrl = dojo.config["baseUrl"] || "./";

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
			dojo.registerModulePath("ipv4.widget", "http://ipv4user:ipv4passwd@some.domain.com:2357/another/path/ipv4/widget");
			dojo.registerModulePath("ipv6.widget", "ftp://ipv6user:ipv6passwd@[::2001:0db8:3c4d:0015:0:0:abcd:ef12]:1113/another/path/ipv6/widget");
			dojo.registerModulePath("ipv6.widget2", "https://[0:0:0:0:0:1]/another/path/ipv6/widget2");


			var basePrefix = dojo.baseUrl;
			//dojo._Uri will strip off "./" characters, so do the same here
			if(basePrefix == "./"){
				basePrefix = "";
			}
			
			t.assertEqual(basePrefix + "some/path/mycoolpath/my/favorite.html",
				dojo.moduleUrl("mycoolmod", "my/favorite.html").toString());
			t.assertEqual(basePrefix + "some/path/mycoolpath/my/favorite.html",
				dojo.moduleUrl("mycoolmod.my", "favorite.html").toString());

			t.assertEqual("/some/path/mycoolpath2/my/favorite.html",
				dojo.moduleUrl("mycoolmod2", "my/favorite.html").toString());
			t.assertEqual("/some/path/mycoolpath2/my/favorite.html",
				dojo.moduleUrl("mycoolmod2.my", "favorite.html").toString());

			t.assertEqual("http://some.domain.com/another/path/mycoolpath/widget/my/favorite.html",
				dojo.moduleUrl("mycoolmod.widget", "my/favorite.html").toString());
			t.assertEqual("http://some.domain.com/another/path/mycoolpath/widget/my/favorite.html",
				dojo.moduleUrl("mycoolmod.widget.my", "favorite.html").toString());

			// individual component testing
			t.assertEqual("http://ipv4user:ipv4passwd@some.domain.com:2357/another/path/ipv4/widget/components.html",
				dojo.moduleUrl("ipv4.widget", "components.html").uri);
			t.assertEqual("http",
				dojo.moduleUrl("ipv4.widget", "components.html").scheme);
			t.assertEqual("ipv4user:ipv4passwd@some.domain.com:2357",
				dojo.moduleUrl("ipv4.widget", "components.html").authority);
			t.assertEqual("ipv4user",
				dojo.moduleUrl("ipv4.widget", "components.html").user);
			t.assertEqual("ipv4passwd",
				dojo.moduleUrl("ipv4.widget", "components.html").password);
			t.assertEqual("some.domain.com",
				dojo.moduleUrl("ipv4.widget", "components.html").host);
			t.assertEqual("2357",
				dojo.moduleUrl("ipv4.widget", "components.html").port);
			t.assertEqual("/another/path/ipv4/widget/components.html",
				dojo.moduleUrl("ipv4.widget", "components.html?query").path);
			t.assertEqual("q=somequery",
				dojo.moduleUrl("ipv4.widget", "components.html?q=somequery").query);
			t.assertEqual("fragment",
				dojo.moduleUrl("ipv4.widget", "components.html#fragment").fragment);

			t.assertEqual("ftp://ipv6user:ipv6passwd@[::2001:0db8:3c4d:0015:0:0:abcd:ef12]:1113/another/path/ipv6/widget/components.html",
				dojo.moduleUrl("ipv6.widget", "components.html").uri);
			t.assertEqual("ftp",
				dojo.moduleUrl("ipv6.widget", "components.html").scheme);
			t.assertEqual("ipv6user:ipv6passwd@[::2001:0db8:3c4d:0015:0:0:abcd:ef12]:1113",
				dojo.moduleUrl("ipv6.widget", "components.html").authority);
			t.assertEqual("ipv6user",
				dojo.moduleUrl("ipv6.widget", "components.html").user);
			t.assertEqual("ipv6passwd",
				dojo.moduleUrl("ipv6.widget", "components.html").password);
			t.assertEqual("::2001:0db8:3c4d:0015:0:0:abcd:ef12",
				dojo.moduleUrl("ipv6.widget", "components.html").host);
			t.assertEqual("1113",
				dojo.moduleUrl("ipv6.widget", "components.html").port);
			t.assertEqual("/another/path/ipv6/widget/components.html",
				dojo.moduleUrl("ipv6.widget", "components.html?query").path);
			t.assertEqual("somequery",
				dojo.moduleUrl("ipv6.widget", "components.html?somequery").query);
			t.assertEqual("somefragment",
				dojo.moduleUrl("ipv6.widget", "components.html?somequery#somefragment").fragment);

			t.assertEqual("https://[0:0:0:0:0:1]/another/path/ipv6/widget2/components.html",
				dojo.moduleUrl("ipv6.widget2", "components.html").uri);
			t.assertEqual("https",
				dojo.moduleUrl("ipv6.widget2", "components.html").scheme);
			t.assertEqual("[0:0:0:0:0:1]",
				dojo.moduleUrl("ipv6.widget2", "components.html").authority);
			t.assertEqual(null,
				dojo.moduleUrl("ipv6.widget2", "components.html").user);
			t.assertEqual(null,
				dojo.moduleUrl("ipv6.widget2", "components.html").password);
			t.assertEqual("0:0:0:0:0:1",
				dojo.moduleUrl("ipv6.widget2", "components.html").host);
			t.assertEqual(null,
				dojo.moduleUrl("ipv6.widget2", "components.html").port);
			t.assertEqual("/another/path/ipv6/widget2/components.html",
				dojo.moduleUrl("ipv6.widget2", "components.html").path);
			t.assertEqual(null,
				dojo.moduleUrl("ipv6.widget2", "components.html").query);
			t.assertEqual(null,
				dojo.moduleUrl("ipv6.widget2", "components.html").fragment);
		}
	]
);
