var testGlobal = this;
try{
	dojo.provide("tests._base");
	testGlobal = window;
}catch(e){}

// the test suite for the bootstrap. Requires hostenv and other base tests at
// the end

if(tests.selfTest){

	tests.register("tests.smokeTest", 
		[
			function sanityCheckHarness(t){
				// sanity checks
				t.assertTrue(true);
				t.assertFalse(false);
				t.assertFalse(0);
				t.assertFalse(null);
				var tObj = { w00t: false, blarg: true };
				t.assertEqual(
					["thinger", "blah", tObj], 
					["thinger", "blah", tObj]
				);
				t.assertEqual(tObj, tObj);
			},
			/*
			// uncomment to tests exception handling
			function sanityCheckassertTrue(t){
				// should throw an error
				t.assertTrue(false);
			},
			function sanityCheckassertFalse(t){
				// should throw an error
				t.assertFalse(true);
			},
			function sanityCheckassertEqual(t){
				// should throw an error
				t.assertEqual("foo", "bar");
			},
			*/
			{
				name: "eqTest",
				// smoke test the fixture system
				setUp: function(t){
					this.foo = "blah";
				},
				runTest: function(t){
					t.assertEqual("blah", this.foo);
				},
				tearDown: function(t){
				}
			}
		]
	);

	if(testGlobal["dojo"]){
		tests.register("tests._base", 
			[
				function dojoIsAvailable(t){
					t.assertTrue(testGlobal["dojo"]);
				}
			]
		);
	}

	if(testGlobal["setTimeout"]){
		// a stone-stupid async test
		tests.register("tests.async", 
			[
				{
					name: "deferredSuccess",
					runTest: function(t){
						var d = new tests.Deferred();
						setTimeout(d.getTestCallback(function(){
							t.assertTrue(true);
							t.assertFalse(false);
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
}

try{
	// go grab the others
	dojo.require("tests._base._loader.bootstrap");
	dojo.require("tests._base.array");
	// FIXME: add test includes for the rest of the Dojo Base groups here
}catch(e){
	tests.debug(e);
}

