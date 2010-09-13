dojo.provide("dojo.tests.store.Watchable");
dojo.require("dojo.store.Memory");
dojo.require("dojo.store.Watchable");

var store = dojo.store.Watchable(new dojo.store.Memory({
	data: [
		{id: 1, name: "one", prime: false},
		{id: 2, name: "two", even: true, prime: true},
		{id: 3, name: "three", prime: true},
		{id: 4, name: "four", even: true, prime: false},
		{id: 5, name: "five", prime: true}
	]
}));
tests.register("dojo.tests.store.Watchable", 
	[
		function testGet(t){
			t.is(store.get(1).name, "one");
			t.is(store.get(4).name, "four");
			t.t(store.get(5).prime);
		},
		function testQuery(t){
			var results = store.query({prime: true});
			t.is(results.length, 3);
			var changes = [];
			results.watch(function(index, previousId, object){
				changes.push({index:index, previousId:previousId, object:object});
			});
			var expectedChanges = [];
			var two = results[0];
			two.prime = false;
			store.put(two); // should remove it from the array
			expectedChanges.push({
					"index":0,
					"previousId":2
				});
			var one = store.get(1);
			one.prime = true;
			store.put(one); // should add it
			expectedChanges.push({
					"index":2,
					object:{
						id: 1, 
						name: "one", 
						prime: true
					}
				});
			store.add({// shouldn't be added
				id:6, name:"six"
			});
			store.add({// should be added
				id:7, name:"seven", prime:true
			});
			expectedChanges.push({
					"index":3,
					"object":{
						id:7, name:"seven", prime:true
					}
				});
			store.remove(3);
			expectedChanges.push({
					"index":0,
					"previousId":3
				});
			t.is(changes, expectedChanges);
		}
	]
);

