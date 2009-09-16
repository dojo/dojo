dojo.provide("tests.hash");

dojo.require("dojo.hash");

(function(){
	tests.register("tests.hash", [
		function getAndSet(t) {
			var testCases = {
				"cases" : [
								"test",
								"test with spaces",
								"test%20with%20encoded",
								"test+with+pluses",
								" leading",
								"trailing ",
								"under_score",
								"extra#mark",
								"extra&instring",
								"#leadinghash",
								"foo=bar&bar=foo",
								"extra?instring"
							],
				"expected" : [
								"test",
								"test with spaces",
								"test with encoded",
								"test+with+pluses",
								" leading",
								"trailing",
								"under_score",
								"extra#mark",
								"extra&instring",
								"leadinghash",
								"foo=bar&bar=foo",
								"extra?instring"
							]
			}
			
			var caseLength = testCases.cases.length;
				
			for (var i=0; i < caseLength; i++){
				dojo.hash(testCases.cases[i]);
				t.is(testCases.expected[i], dojo.hash());
			}
		},
		function testOnHashChangeWindow(t) {
			var windowHash = dojo.connect(window, "onhashchange", function(){
				doh.is(dojo.hash(), "changeWindowHash");
				dojo.disconnect(windowHash);
			});
			dojo.hash("changeWindowHash");
		},
		function testOnHashChangeBody(t) {
			var bodyHash = dojo.connect(document.body, "onhashchange", function(){
				doh.is(dojo.hash(), "changeBodyHash");
				dojo.disconnect(bodyHash);
			});
			dojo.hash("changeBodyHash");
		}
	]);
})();

