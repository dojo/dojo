dojo.provide("tests.cache");

dojo.require("dojo.cache");

tests.register("tests.cache", 
	[
		{
			runTest: function(t){
				var expected = "<h1>Hello World</h1>";

				t.is(expected, dojo.trim(dojo.cache("dojo.tests.cache", "regular.html")));
				t.is(expected, dojo.trim(dojo.cache("dojo.tests.cache", "sanitized.html", {sanitize: true})));
				
				//Test object variant for module.
				var objPath = dojo.moduleUrl("dojo.tests.cache", "object.html").toString();
				t.is(expected, dojo.trim(dojo.cache(new dojo._Url(objPath), {sanitize: true})));

				//Just a couple of other passes just to make sure on manual inspection that the
				//files are loaded over the network only once.
				t.is(expected, dojo.trim(dojo.cache("dojo.tests.cache", "regular.html")));
				t.is(expected, dojo.trim(dojo.cache("dojo.tests.cache", "sanitized.html", {sanitize: true})));
				t.is(expected, dojo.trim(dojo.cache(new dojo._Url(objPath), {sanitize: true})));
			}
		}
	]
);
