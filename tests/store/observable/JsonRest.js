define(["doh/main", "require", "dojo/store/observable/JsonRest"],
function(doh, require, JsonRest){
	var store = new JsonRest({ target: null });
	var baseURL = require.toUrl("dojo/tests/store/observable/x.y").match(/(.+)x\.y$/)[1] + "targets/";
	var setStore = function(target){
		store.target = baseURL + target + "/";
		store.subscriptions = [];
	};

	doh.register("dojo.tests.store.observable.JsonRest",
		[
			function testMaterialize(t){
				setStore("simple.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					t.assertEqual(10, query.total);
					t.assertTrue(query.unsubscribe);
					t.assertTrue(query.page);
					t.assertTrue(query.fetch);
				});
			},
			function testQueryUnsubscribe(t){
				setStore("simple.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.unsubscribe();
				});
			},
			function testQueryPage(t){
				setStore("simple.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(page){
						t.assertEqual([
							{id: "2", value: "baz"},
							{id: "3", value: "bat"},
							{id: "4", value: "fiz"},
							{id: "5", value: "foz"},
							{id: "6", value: "cat"}
						], page);
						t.assertEqual(2, page.start);
						t.assertEqual(5, page.count);
						t.assertTrue(page.unsubscribe);
						t.assertTrue(page.refresh);
						t.assertTrue(page.map);
						t.assertTrue(page.forEach);
						t.assertTrue(page.filter);
					});
				});
			},
			function testQueryFetch(t){
				// The first fetch should bring in 3 separate updates
				// The second fetch should bring in 1 additional update
				setStore("simple.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(page){
						t.assertEqual([
							{id: "2", value: "baz"},
							{id: "3", value: "bat"},
							{id: "4", value: "fiz"},
							{id: "5", value: "foz"},
							{id: "6", value: "cat"}
						], page);
						return query.fetch().then(function(){
							// Inserted above page and removed 3,4
							t.assertEqual([
								{id: "1", value: "bar"},
								{id: "2", value: "baz"},
								{id: "5", value: "foz"},
								{id: "6", value: "cat"},
								{id: "7", value: "dil"}
							], page);
							return query.fetch().then(function(){
								// Re-inserted 4
								t.assertEqual([
									{id: "1", value: "bar"},
									{id: "2", value: "baz"},
									{id: "4", value: "fiz"},
									{id: "5", value: "foz"},
									{id: "6", value: "cat"}
								], page);
							});
						});
					});
				});
			},
			function testQueryFetch410(t){
				setStore("errors.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(page){
						var refreshes = 0;
						t.assertEqual([
							{id: "2", value: "baz"},
							{id: "3", value: "bat"},
							{id: "4", value: "fiz"},
							{id: "5", value: "foz"},
							{id: "6", value: "cat"}
						], page);
						page.on("refresh", function(){ refreshes++; });

						// Cheat here and change `start` so that the server can
						// return different page when the fetch() causes the query
						// to rematerialize.
						page.start = 4;
						return query.fetch().then(function(){
							t.assertEqual([
								{id: "4", value: "fiz"},
								{id: "5", value: "foz"},
								{id: "6", value: "cat"},
								{id: "7", value: "dil"},
								{id: "8", value: "daz"}
							], page);
							t.assertEqual("page1", page.id);
							t.assertEqual(64, page.revision);
							t.assertEqual(1, refreshes);
						});
					});
				});
			},
			function testQueryFetch404(t){
				setStore("errors.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(5, 5).then(function(page){
						var refreshes = 0;
						page.on("refresh", function(){ refreshes++; });
						t.assertEqual("page0", page.id);
						t.assertEqual(35, page.revision);
						return query.fetch().then(function(){
							t.assertEqual("page0", page.id);
							t.assertEqual(38, page.revision);
							t.assertEqual(1, refreshes); // should have refreshed
						});
					});
				});
			},
			function testQueryFetch404NoChanges(t){
				setStore("errors.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(3, 5).then(function(page){
						var refreshes = 0;
						page.on("refresh", function(){ refreshes++; });
						t.assertEqual("page0", page.id);
						t.assertEqual(35, page.revision);
						return query.fetch().then(function(){
							t.assertEqual("page0", page.id);
							t.assertEqual(35, page.revision);
							t.assertEqual(0, refreshes); // should not have refreshed
						});
					});
				});
			},
			function testPageUnsubscribe(t){
				setStore("simple.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(page){
						return page.unsubscribe();
					});
				});
			},
			function testPageObserve(t){
				// The three updates from the first fetch should generate a
				// total of 6 events for observers
				// The second fetch should be silent after the observer has
				// been removed, but the page should still be updated as
				// unsubscribe() has not been called.
				setStore("simple.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(page){
						var events = [],
							calls = 0,
							listener = page.on("update", function(){
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
				setStore("simple.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(page){
						return page.refresh().then(function(){
							t.assertEqual([
								{id: "5", value: "foz"},
								{id: "6", value: "cat"},
								{id: "7", value: "dil"},
								{id: "8", value: "daz"},
								{id: "9", value: "fet"}
							], page);
						});
					});
				});
			},
			function testPageRefreshEvent(t){
				setStore("simple.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(2, 5).then(function(page){
						var calls = [],
							callback = page.on("refresh", function(){
								calls.push(arguments);
							});
						return page.refresh().then(function(){
							t.assertEqual(1, calls.length);
							callback.remove();
							return page.refresh().then(function(){
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
				setStore("revisions.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(0, 5).then(function(page1){
						t.assertEqual([
							{id: "0", value: "foo"},
							{id: "1", value: "bar"},
							{id: "2", value: "baz"},
							{id: "3", value: "bat"},
							{id: "4", value: "fiz"}
						], page1)
						return query.page(5, 5).then(function(page2){
							t.assertEqual([
								{id: "3", value: "bat"},
								{id: "4", value: "fiz"},
								{id: "5", value: "foz"},
								{id: "6", value: "cat"},
								{id: "7", value: "dil"}
							], page2)
							return query.fetch().then(function(){
								// page1 received 3 changes (6 events)
								t.assertEqual([
									{id: "-3", value: "fot"},
									{id: "-2", value: "fil"},
									{id: "-1", value: "fit"},
									{id: "0", value: "foo"},
									{id: "1", value: "bar"}
								], page1)
								// page2 received 1 change (2 events)
								t.assertEqual([
									{id: "2", value: "baz"},
									{id: "3", value: "bat"},
									{id: "4", value: "fiz"},
									{id: "5", value: "foz"},
									{id: "6", value: "cat"}
								], page2)
							});
						});
					});
				});
			},
			function testIncompleteSupplementaryData(t){
				setStore("incomplete.php");
				return store.materialize(null, {sort: [{attribute: "id"}]}).then(function(query){
					return query.page(1, 7).then(function(page){
						return query.fetch().then(function(){
							throw "Incomplete supplementary data was not caught";
						}, function(e){
							t.assertEqual("Supplementary data incomplete, required index: 7", e);
						});
					});
				});
			}
		]
	);
});
