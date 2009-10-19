dojo.provide("tests.hash");

dojo.require("dojo.hash");

(function(){
	var title = document.title;
	var titleSyncer = dojo.subscribe("/dojo/hashchange", null, function(){
		document.title = dojo.hash() + " - " + title;
	});
	doh.register("tests.hash",
		dojo.map(
			[
				// [ input, expected_output ]
				[ "test", "test" ],
				[ "test with spaces", "test with spaces" ],
				[ "test%20with%20encoded", "test with encoded" ],
				[ "test+with+pluses", "test+with+pluses" ],
				[ " leading", " leading" ],
				[ "trailing ", "trailing" ],
				[ "under_score", "under_score" ],
				[ "extra&instring", "extra&instring" ],
				[ "#leadinghash", "leadinghash" ],
				[ "foo=bar&bar=foo", "foo=bar&bar=foo" ],
				[ "extra?instring", "extra?instring" ]
			],
			function(elem){
				var test = elem[0], expected = elem[1];
				return {
					name: "getAndSetWithOnHashChange: " + test,
					timeout: 5000,
					runTest: function(t){
						var d = new doh.Deferred();
						var sub = dojo.subscribe("/dojo/hashchange", null, d.getTestCallback(function(){
							dojo.unsubscribe(sub);
							document.title = title;
							doh.is(dojo.hash(), expected);
						}));
						dojo.hash(test);
						return d;
					}
				};
			})
		);
})();