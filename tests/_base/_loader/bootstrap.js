dojo.provide("tests._base._loader.bootstrap");

tests.register("tests._base._loader.bootstrap", 
	[

		function hasConsole(t){
			t.assertTrue("console" in dojo.global);
			t.assertTrue("assert" in console);
			t.assertEqual("function", typeof console.assert);
		},

		{
			name: "getObject",
			setUp: function(){
				//Set an object in global scope.
				dojo.global.globalValue = {
					color: "blue",
					size: 20
				};
				
				//Set up an object in a specific scope.
				this.foo = {
					bar: {
						color: "red",
						size: 100
					}
				};
			},
			runTest: function(t){
				//Test for existing object using global as root path.
				var globalVar = dojo.getObject("globalValue");
				t.is("object", (typeof globalVar));
				t.assertEqual("blue", globalVar.color);
				t.assertEqual(20, globalVar.size);
				t.assertEqual("blue", dojo.getObject("globalValue.color"));
				
				//Test for non-existent object using global as root path.
				//Then create it.
				t.assertFalse(dojo.getObject("something.thatisNew"));
				t.assertTrue(typeof(dojo.getObject("something.thatisNew", true)) == "object");
				
				//Test for existing object using another object as root path.
				var scopedVar = dojo.getObject("foo.bar", false, this);
				t.assertTrue(typeof(scopedVar) == "object");
				t.assertEqual("red", scopedVar.color);
				t.assertEqual(100, scopedVar.size);
				t.assertEqual("red", dojo.getObject("foo.bar.color", true, this));
				
				//Test for existing object using another object as root path.
				//Then create it.
				t.assertFalse(dojo.getObject("something.thatisNew", false, this));
				t.assertTrue(typeof(dojo.getObject("something.thatisNew", true, this)) == "object");
			},
			tearDown: function(){
				//Clean up global object that should not exist if
				//the test is re-run.
				try{
					delete dojo.global.something;
					delete this.something;
				}catch(e){}
			}
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
