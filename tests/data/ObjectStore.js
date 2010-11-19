dojo.provide("dojo.tests.data.ObjectStore");
dojo.require("dojo.data.ObjectStore");
dojo.require("dojo.store.JsonRest");

var objectStore = new dojo.store.JsonRest({target: dojo.moduleUrl("dojo.tests.store", "")});
var dataStore = new dojo.data.ObjectStore({objectProvider: objectStore});
tests.register("tests.data.ObjectStore", 
	[
		function testFetchByIdentity(t){
			var d = new doh.Deferred();
			dataStore.fetchItemByIdentity({identity: "node1.1", onItem: function(object){
				t.is(object.name, "node1.1");
				t.is(object.someProperty, "somePropertyA1");
				d.callback(true);
			}});
			return d;
		},
		function testQuery(t){
			var d = new doh.Deferred();
			dataStore.fetch({query:"treeTestRoot", onComplete: function(results){
				var object = results[0];
				t.is(object.name, "node1");
				t.is(object.someProperty, "somePropertyA");
				d.callback(true);
			}});
			return d;
		}
	]
);

