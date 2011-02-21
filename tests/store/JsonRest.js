dojo.provide("dojo.tests.store.JsonRest");
dojo.require("dojo.store.JsonRest");
(function(){
	var store = new dojo.store.JsonRest({target: dojo.moduleUrl("dojo.tests.store", "")});
	tests.register("tests.store.JsonRest",
		[
			function testGet(t){
				var d = new doh.Deferred();
				store.get("node1.1").then(function(object){
					t.is(object.name, "node1.1");
					t.is(object.someProperty, "somePropertyA1");
					d.callback(true);
				});
				return d;
			},
			function testQuery(t){
				var d = new doh.Deferred();
				store.query("treeTestRoot").then(function(results){
					var object = results[0];
					t.is(object.name, "node1");
					t.is(object.someProperty, "somePropertyA");
					d.callback(true);
				});
				return d;
			},
			function testQueryIterative(t){
				var d = new doh.Deferred();
				var i = 0;
				store.query("treeTestRoot").forEach(function(object){
					i++;
					console.log(i);
					t.is(object.name, "node" + i);
				}).then(function(){
					d.callback(true);
				});
				return d;
			}
		]
	);
})();
