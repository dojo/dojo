dojo.provide("tests.hash");

dojo.require("dojo.hash");

(function(){
	var title = document.title;
	var titleSyncer = dojo.subscribe("/dojo/hashchange", null, function(){
		document.title = dojo.hash() + " - " + title;
	});
	doh.register("tests.hash", [
		{
			name: "getAndSetWithOnHashChange",
			timeout: 5000,
			runTest: function(t){
				var testCases = {
					"cases" : [
									"test",
									"test with spaces",
									"test%20with%20encoded",
									"test+with+pluses",
									" leading",
									"trailing ",
									"under_score",
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
									"extra&instring",
									"leadinghash",
									"foo=bar&bar=foo",
									"extra?instring"
								]
				}
				
				var caseLength = testCases.cases.length;
				var d = new doh.Deferred;
				var count = 0;
				var hash = dojo.subscribe("/dojo/hashchange", null, function(){
					doh.is(dojo.hash(), testCases.expected[count]);
					count++;
					if (count < caseLength){
						dojo.hash(testCases.cases[count]);
					} else {
						d.callback(true);
						dojo.unsubscribe(hash);
						document.title = title;
					}
				});
				dojo.hash(testCases.cases[0]);
				return d;
			}
		}
	]);
})();