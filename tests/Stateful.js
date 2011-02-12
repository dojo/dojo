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
		},		
		function wildcard(t){
			var s = new dojo.Stateful();
			s.set({
				foo:3,
				bar: 5
			});
			var wildcard = 0;
			var foo = 0;
			s.watch(function(){
				wildcard++;
			});
			s.watch("foo", function(){
				foo++;
			});
			s.set("foo", 4); 
			s.set("bar", 6);
			doh.is(wildcard, 2);
			doh.is(foo, 1);
		}		


	]
);
