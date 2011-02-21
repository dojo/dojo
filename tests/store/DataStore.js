dojo.provide("dojo.tests.store.DataStore");
dojo.require("dojo.store.DataStore");
dojo.require("dojo.data.ItemFileWriteStore")
var temp = function(){
	var two, four;
	var dataStore = new dojo.data.ItemFileWriteStore({data:{
		items: [
			{id: 1, name: "one", prime: false},
			two = {id: 2, name: "two", even: true, prime: true},
			{id: 3, name: "three", prime: true},
			four = {id: 4, name: "four", even: true, prime: false},
			{id: 5, name: "five", prime: true}
		],
		identifier:"id"
	}});
	dataStore.fetchItemByIdentity({identity:null});
	var store = new dojo.store.DataStore({store:dataStore});
	tests.register("dojo.tests.store.DataStore",
		[
			function testGet(t){
				t.is(store.get(1).name, "one");
				t.is(store.get(4).name, "four");
				t.t(store.get(5).prime);
			},
			function testQuery(t){
				store.query({prime: true}).then(function(results){
					t.is(results.length, 3);
				});
				store.query({even: true}).map(function(object){
					for(var i in object){
						t.is(object[i], (object.id == 2 ? two : four)[i]);
					}
				}).then(function(results){
					t.is(results[1].name, "four");
				});
			},
			function testPutUpdate(t){
				var four = store.get(4);
				four.square = true;
				store.put(four);
				four = store.get(4);
				t.t(four.square);
			},
			function testPutNew(t){
				store.put({
					id: 6,
					perfect: true
				});
				t.t(store.get(6).perfect);
			}
		]
	);
};
temp();
