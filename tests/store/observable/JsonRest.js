define(["doh/main", "require", "dojo/store/observable/JsonRest"],
function(doh, require, JsonRest){
	var store = new JsonRest({
		target: require.toUrl("dojo/tests/store/observable/x.y").match(/(.+)x\.y$/)[1] + "store.php/",
	});

	doh.register("dojo.tests.store.observable.JsonRest",
		[
			function testMaterialize(t){
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					t.assertEqual(10, query.total);
					t.assertTrue(query.unsubscribe);
					t.assertTrue(query.page);
					t.assertTrue(query.fetch);
				});
			},
			function testQueryUnsubscribe(t){
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.unsubscribe();
				});
			},
			function testQueryPage(t){
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(results){
						t.assertEqual([
							{id: "2", value: "baz"},
							{id: "3", value: "bat"},
							{id: "4", value: "fiz"},
							{id: "5", value: "foz"},
							{id: "6", value: "cat"}
						], results);
						t.assertEqual(2, results.start);
						t.assertEqual(5, results.count);
						t.assertTrue(results.unsubscribe);
						t.assertTrue(results.observe);
						t.assertTrue(results.refresh);
						t.assertTrue(results.onRefresh);
						t.assertTrue(results.map);
						t.assertTrue(results.forEach);
						t.assertTrue(results.filter);
					});
				});
			},
			function testQueryFetch(t){
				// The first fetch should bring in 3 separate updates
				// The second fetch should bring in 1 additional update
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(results){
						t.assertEqual([
							{id: "2", value: "baz"},
							{id: "3", value: "bat"},
							{id: "4", value: "fiz"},
							{id: "5", value: "foz"},
							{id: "6", value: "cat"}
						], results);
						return query.fetch().then(function(){
							// Inserted above page and removed 3,4
							t.assertEqual([
								{id: "1", value: "bar"},
								{id: "2", value: "baz"},
								{id: "5", value: "foz"},
								{id: "6", value: "cat"},
								{id: "7", value: "dil"}
							], results);
							return query.fetch().then(function(){
								// Re-inserted 4
								t.assertEqual([
									{id: "1", value: "bar"},
									{id: "2", value: "baz"},
									{id: "4", value: "fiz"},
									{id: "5", value: "foz"},
									{id: "6", value: "cat"}
								], results);
							});
						});
					});
				});
			},
			function testPageUnsubscribe(t){
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(results){
						return results.unsubscribe();
					});
				});
			},
			function testPageObserve(t){
				// The three updates from the first fetch should generate a
				// total of 6 events for observers
				// The second fetch should be silent after the observer has
				// been removed, but the page should still be updated as
				// unsubscribe() has not been called.
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(results){
						var events = [],
							calls = 0,
							listener = results.observe(function(){
								events.push(Array.prototype.slice.call(arguments));
								calls++;
							});
						return query.fetch().then(function(){
							t.assertEqual([
								[{id: "1", value: "bar"}, -1, 0],
								[{id: "6", value: "cat"}, 5, -1],
								[{id: "3", value: "bat"}, 2, -1],
								[{id: "6", value: "cat"}, -1, 4],
								[{id: "4", value: "fiz"}, 2, -1],
								[{id: "7", value: "dil"}, -1, 4]
							], events);
							t.assertEqual(6, calls);
							events.splice(0);
							listener.remove();
							return query.fetch().then(function(){
								// Should not be called after remove()
								t.assertEqual([], events);
								t.assertEqual(6, calls);
							});
						});
					});
				});
			},
			function testPageRefresh(t){
				// Refresh the contents of the page. Here the server pretends
				// that objects 0-2 have been removed.
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(results){
						return results.refresh().then(function(){
							t.assertEqual([
								{id: "5", value: "foz"},
								{id: "6", value: "cat"},
								{id: "7", value: "dil"},
								{id: "8", value: "daz"},
								{id: "9", value: "fet"}
							], results);
						});
					});
				});
			},
			function testPageOnRefresh(t){
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(results){
						var calls = [],
							callback = results.onRefresh(function(){
								calls.push(arguments);
							});
						return results.refresh().then(function(){
							t.assertEqual(1, calls.length);
							callback.remove();
							return results.refresh().then(function(){
								// Should not have been called after remove()
								t.assertEqual(1, calls.length);
							});
						});
					});
				});
			},
			function testPageRevisions(t){
				// Fetch a page at revision 20 and then later fetch another
				// page at revision 22. A single fetch() call should get
				// revisions 21-23 and update each page will only applicable
				// changes.
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(0, 5).then(function(results1){
						t.assertEqual([
							{id: "0", value: "foo"},
							{id: "1", value: "bar"},
							{id: "2", value: "baz"},
							{id: "3", value: "bat"},
							{id: "4", value: "fiz"}
						], results1)
						return query.page(5, 5).then(function(results2){
							t.assertEqual([
								{id: "3", value: "bat"},
								{id: "4", value: "fiz"},
								{id: "5", value: "foz"},
								{id: "6", value: "cat"},
								{id: "7", value: "dil"}
							], results2)
							return query.fetch().then(function(){
								// results1 received 3 changes (6 events)
								t.assertEqual([
									{id: "-3", value: "fot"},
									{id: "-2", value: "fil"},
									{id: "-1", value: "fit"},
									{id: "0", value: "foo"},
									{id: "1", value: "bar"}
								], results1)
								// results2 received 1 change (2 events)
								t.assertEqual([
									{id: "2", value: "baz"},
									{id: "3", value: "bat"},
									{id: "4", value: "fiz"},
									{id: "5", value: "foz"},
									{id: "6", value: "cat"}
								], results2)
							});
						});
					});
				});
			}
		]
	);
});
