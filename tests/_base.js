if(this["dojo"]){
	dojo.provide("tests._base");
}

// the test suite for the bootstrap. Requires hostenv and other base tests at
// the end

var testGlobal = this;

tests.add("tests.smokeTest", 
	[
		function(t){
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
		function(t){
			// should throw an error
			t.isTrue(false);
		},
		function(t){
			// should throw an error
			t.isFalse(true);
		},
		function(t){
			// should throw an error
			t.isEq("foo", "bar");
		},
		*/
		{
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

tests.add("tests._base", 
	[
		function(t){
			t.isTrue(testGlobal["dojo"]);
		},
	]
);
