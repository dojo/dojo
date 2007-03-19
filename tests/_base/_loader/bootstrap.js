dojo.provide("tests._base._loader.bootstrap");

tests.register("tests._base._loader.bootstrap", 
	[

		function hasConsole(t){
			t.assertTrue("console" in dojo.global());
			t.assertTrue("assert" in console);
			t.assertEqual("function", typeof console.assert);
		},

		function hasDjConfig(t){
			t.assertTrue("djConfig" in dojo.global());
		},

		{
			name: "exists",
			setUp: function(){
				this.foo = {
					bar: {}
				};
			},
			runTest: function(t){
				t.assertTrue(dojo.exists("foo.bar", this));
				t.assertFalse(dojo.exists("foo.bar"));
			}
		},

		function evalWorks(t){
			t.assertTrue(dojo.eval("(true)"));
			t.assertFalse(dojo.eval("(false)"));
		}
	]
);
