dojo.provide("tests.Stateful");

dojo.require("dojo.Stateful");

doh.register("tests.Stateful", 
	[
		function getSetWatch(t){
			var s = new dojo.Stateful({
				foo: 3
			});
			doh.is(s.get("foo"), 3);
			var watching = s.watch("foo", function(name, oldValue, value){
				doh.is(name, "foo");
				doh.is(oldValue, 3);
				doh.is(value, 4);
				doh.is(s.get("foo"), 4);
			});
			s.set("foo", 4);
			doh.is(s.get("foo"), 4);
			watching.unwatch();
			s.set("foo", 5);
			doh.is(s.get("foo"), 5);
		},
		function setHash(t){
			var s = new dojo.Stateful();
			s.set({
				foo:3,
				bar: 5
			});
			doh.is(s.get("foo"), 3);
			doh.is(s.get("bar"), 5);
		}		


	]
);
