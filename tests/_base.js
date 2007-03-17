if(this["dojo"]){
	dojo.provide("tests._base");
}

// the test suite for the bootstrap. Requires hostenv and other base tests at
// the end

var testGlobal = this;

tests.register("tests.smokeTest", 
	[
		function sanityCheckHarness(t){
			// sanity checks
			t.isTrue(true);
			t.isFalse(false);
			t.isFalse(0);
			t.isFalse(null);
			var tObj = { w00t: false, blarg: true };
			t.isEq(
				["thinger", "blah", tObj], 
				["thinger", "blah", tObj]
			);
			t.isEq(tObj, tObj);
		},
		/*
		// uncomment to tests exception handling
		function sanityCheckIsTrue(t){
			// should throw an error
			t.isTrue(false);
		},
		function sanityCheckIsFalse(t){
			// should throw an error
			t.isFalse(true);
		},
		function sanityCheckIsEq(t){
			// should throw an error
			t.isEq("foo", "bar");
		},
		*/
		{
			name: "eqTest",
			// smoke test the fixture system
			setUp: function(t){
				this.foo = "blah";
			},
			runTest: function(t){
				t.isEq("blah", this.foo);
			},
			tearDown: function(t){
			}
		}
	]
);

if(this["dojo"]){
	tests.register("tests._base", 
		[
			function dojoIsAvailable(t){
				t.isTrue(testGlobal["dojo"]);
			}
		]
	);
}

if(this["setTimeout"]){
	// a stone-stupid async test
	tests.register("tests.async", 
		[
			{
				name: "deferredSuccess",
				runTest: function(t){
					var d = new tests.Deferred();
					setTimeout(d.getTestCallback(function(){
						t.isTrue(true);
						t.isFalse(false);
					}), 50);
					return d;
				}
			},
			{
				name: "deferredFailure",
				runTest: function(t){
					var d = new tests.Deferred();
					setTimeout(function(){
						d.errback(new Error("hrm..."));
					}, 50);
					return d;
				}
			},
			{
				name: "timeoutFailure",
				timeout: 50,
				runTest: function(t){
					// timeout of 50
					var d = new tests.Deferred();
					setTimeout(function(){
						d.callback(true);
					}, 100);
					return d;
				}
			}
		]
	);
}
