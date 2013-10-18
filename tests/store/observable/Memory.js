define(["doh", "dojo/_base/array", "dojo/_base/lang", "dojo/store/observable/Memory"],
function(doh, array, lang, Memory){
	var smallData = [
		{id: 1, name: "one", prime: false, mappedTo: "E"}, 
		{id: 2, name: "two", even: true, prime: true, mappedTo: "D"}, 
		{id: 3, name: "three", prime: true, mappedTo: "C"}, 
		{id: 4, name: "four", even: true, prime: false, mappedTo: null}, 
		{id: 5, name: "five", prime: true, mappedTo: "A"} 		
	];

	var scenarioData = [];
	for(var i = 0; i < 20; i++){
		scenarioData.push({id: i, value: i});
	}
	var store = new Memory();

	function runPageScenarios(scenarios, start, count){
		array.forEach(scenarios, function(scenario){
			store.setData(lang.clone(scenarioData));
			store.queries = {};
			var events = [],
				q = store.materialize(null, {sort: [{attribute: "value"}]}),
				p = q.page(start, count),
				l = p.observe(function(){
					// Convert it to an actual array so that the assertion
					// code can properly display its contents on a failure
					events.push(Array.prototype.slice.call(arguments));
				}, true);
			scenario(p, events);
		});
	};

	doh.register("dojo.tests.store.observable.Memory",
		[
			function testMaterialize(t){
				store.setData(lang.clone(smallData));
				store.queries = {};
				var q1 = store.materialize({name: /o/}),
					q2 = store.materialize({name: /o/}),
					q3 = store.materialize({name: /t/}),
					p1 = q1.page(),
					p2 = q2.page(),
					p3 = q3.page();

				t.assertTrue(p1 !== p2);
				t.assertEqual(p1, p2);
				t.assertEqual(3, p1.length);
				t.assertEqual(2, p3.length);
			},
			function testQueryUnsubscribe(t){
				store.setData(lang.clone(smallData));
				store.queries = {};
				var q1 = store.materialize({name: /o/}),
					q2 = store.materialize({name: /o/}),
					p1 = q1.page(),
					p2 = q2.page(),
					e1 = [],
					e2 = [],
					l1 = p1.observe(function(){e1.push(arguments);}, true),
					l2 = p2.observe(function(){e2.push(arguments);}, true),
					obj = store.get(1);

				// Should have an active query
				t.assertNotEqual(store.queries, {});

				store.put(obj);
				t.assertEqual(1, e1.length);
				t.assertEqual(1, e2.length);

				q1.unsubscribe();
				store.put(obj);
				t.assertEqual(1, e1.length);
				t.assertEqual(2, e2.length);

				q2.unsubscribe();
				store.put(obj);
				t.assertEqual(1, e1.length);
				t.assertEqual(2, e2.length);

				// Should have no active queries
				t.assertEqual(store.queries, {});
			},
			function testPageUnsubscribe(t){
				store.setData(lang.clone(smallData));
				store.queries = {};
				var q1 = store.materialize({name: /o/}),
					p1 = q1.page(),
					p2 = q1.page(),
					e1 = [],
					e2 = [],
					l1 = p1.observe(function(){e1.push(arguments);}, true),
					l2 = p2.observe(function(){e2.push(arguments);}, true),
					obj = store.get(1);

				// Should have an active query
				t.assertNotEqual(store.queries, {});

				store.put(obj);
				t.assertEqual(1, e1.length);
				t.assertEqual(1, e2.length);

				p1.unsubscribe();
				store.put(obj);
				t.assertEqual(1, e1.length);
				t.assertEqual(2, e2.length);

				p2.unsubscribe();
				store.put(obj);
				t.assertEqual(1, e1.length);
				t.assertEqual(2, e2.length);

				// Should have an active query
				t.assertNotEqual(store.queries, {});
			},
			function testListenerRemove(t){
				store.setData(lang.clone(smallData));
				store.queries = {};
				var q1 = store.materialize({name: /o/}),
					p1 = q1.page(),
					e1 = [],
					e2 = [],
					l1 = p1.observe(function(){e1.push(arguments);}, true),
					l2 = p1.observe(function(){e2.push(arguments);}, true),
					obj = store.get(1);

				// Should have an active query
				t.assertNotEqual(store.queries, {});

				store.put(obj);
				t.assertEqual(1, e1.length);
				t.assertEqual(1, e2.length);

				l1.remove();
				store.put(obj);
				t.assertEqual(1, e1.length);
				t.assertEqual(2, e2.length);

				l2.remove();
				store.put(obj);
				t.assertEqual(1, e1.length);
				t.assertEqual(2, e2.length);

				// Should have an active query
				t.assertNotEqual(store.queries, {});
			},
			function testUnboundPage(t){
				// Scenarios concerning a page that has no start or count
				runPageScenarios([
					function(page, events){
						// insert at top
						var obj = {id: -1, value: "-1"};
						store.add(obj);
						t.assertEqual([[obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(19), page[20]);
						t.assertEqual(21, page.length);
					},
					function(page, events){
						// insert at bottom
						var obj = {id: 20, value: "20"};
						store.add(obj);
						t.assertEqual([[obj, -1, 20]], events);
						t.assertEqual(obj, page[20]);
						t.assertEqual(21, page.length);
					},
					function(page, events){
						// insert in middle
						var obj = {id: 10.5, value: "10.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 11]], events);
						t.assertEqual(obj, page[11]);
						t.assertEqual(store.get(19), page[20]);
						t.assertEqual(21, page.length);
					},
					function(page, events){
						// remove from top
						var obj = store.get(0);
						store.remove(0);
						t.assertEqual([[obj, 0, -1]], events);
						t.assertEqual(store.get(1), page[0]);
						t.assertEqual(19, page.length);
					},
					function(page, events){
						// remove from bottom
						var obj = store.get(19);
						store.remove(19);
						t.assertEqual([[obj, 19, -1]], events);
						t.assertEqual(19, page.length);
					},
					function(page, events){
						// remove from middle
						var obj = store.get(12);
						store.remove(12);
						t.assertEqual([[obj, 12, -1]], events);
						t.assertEqual(store.get(13), page[12]);
						t.assertEqual(19, page.length);
					},
					function(page, events){
						// move up
						var obj = store.get(8);
						obj.value = 5.5;
						store.put(obj);
						t.assertEqual([[obj, 8, 6]], events);
						t.assertEqual(obj, page[6]);
						t.assertEqual(store.get(7), page[8]);
						t.assertEqual(20, page.length);
					},
					function(page, events){
						// move down
						var obj = store.get(10);
						obj.value = 17.5;
						store.put(obj);
						t.assertEqual([[obj, 10, 17]], events);
						t.assertEqual(obj, page[17]);
						t.assertEqual(store.get(11), page[10]);
						t.assertEqual(20, page.length);
					},
					function(page, events){
						// move to top
						var obj = store.get(11);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 11, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(10), page[11]);
						t.assertEqual(20, page.length);
					},
					function(page, events){
						// move to bottom
						var obj = store.get(3);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 3, 19]], events);
						t.assertEqual(obj, page[19]);
						t.assertEqual(store.get(4), page[3]);
						t.assertEqual(20, page.length);
					},
					function(page, events){
						// in place update
						var obj = store.get(16);
						store.put(obj);
						t.assertEqual([[obj, 16, 16]], events);
						t.assertEqual(obj, page[16]);
						t.assertEqual(20, page.length);
					}
				]);
			},
			function testOffsetUnboundPage(t){
				// Scenarios concerning a page that has a start offset but no count
				runPageScenarios([
					function(page, events){
						// insert before page
						var obj = {id: -1, value: "-1"};
						store.add(obj);
						t.assertEqual([[store.get(9), -1, 0]], events);
						t.assertEqual(store.get(9), page[0]);
						t.assertEqual(store.get(19), page[10]);
						t.assertEqual(11, page.length);
					},
					function(page, events){
						// insert at top-1 of page
						var obj = {id: 8.5, value: "8.5"};
						store.add(obj);
						t.assertEqual([[store.get(9), -1, 0]], events);
						t.assertEqual(store.get(9), page[0]);
						t.assertEqual(store.get(19), page[10]);
						t.assertEqual(11, page.length);
					},
					function(page, events){
						// insert at top of page
						var obj = {id: 9.5, value: "9.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(19), page[10]);
						t.assertEqual(11, page.length);
					},
					function(page, events){
						// insert in middle of page
						var obj = {id: 15.5, value: "15.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 6]], events);
						t.assertEqual(obj, page[6]);
						t.assertEqual(store.get(19), page[10]);
						t.assertEqual(11, page.length);
					},
					function(page, events){
						// insert at bottom of page
						var obj = {id: 20, value: "20"};
						store.add(obj);
						t.assertEqual([[obj, -1, 10]], events);
						t.assertEqual(obj, page[10]);
						t.assertEqual(11, page.length);
					},
					function(page, events){
						// remove from before page
						store.remove(0);
						t.assertEqual([[store.get(10), 0, -1]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// remove from top of page
						var obj = store.get(10);
						store.remove(10);
						t.assertEqual([[obj, 0, -1]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// remove from middle of page
						var obj = store.get(15);
						store.remove(15);
						t.assertEqual([[obj, 5, -1]], events);
						t.assertEqual(store.get(16), page[5]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// remove from bottom of page
						var obj = store.get(19);
						store.remove(19);
						t.assertEqual([[obj, 9, -1]], events);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move up from before page to before page
						var obj = store.get(6);
						obj.value = 3.4;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move down from before page to before page
						var obj = store.get(3);
						obj.value = 7.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from before page into top of page
						var obj = store.get(3);
						obj.value = 10.5;
						store.put(obj);
						t.assertEqual([[store.get(10), 0, -1], [obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from before page into middle of page
						var obj = store.get(3);
						obj.value = 15.5;
						store.put(obj);
						t.assertEqual([[store.get(10), 0, -1], [obj, -1, 5]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(obj, page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from before page into bottom of page
						var obj = store.get(3);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[store.get(10), 0, -1], [obj, -1, 9]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from top of page to before page
						var obj = store.get(10);
						obj.value = 4.2;
						store.put(obj);
						t.assertEqual([[obj, 0, -1], [store.get(9), -1, 0]], events);
						t.assertEqual(store.get(9), page[0]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from middle of page to before page
						var obj = store.get(15);
						obj.value = 4.2;
						store.put(obj);
						t.assertEqual([[obj, 5, -1], [store.get(9), -1, 0]], events);
						t.assertEqual(store.get(9), page[0]);
						t.assertEqual(store.get(14), page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from bottom of page to before page
						var obj = store.get(19);
						obj.value = 4.2;
						store.put(obj);
						t.assertEqual([[obj, 9, -1], [store.get(9), -1, 0]], events);
						t.assertEqual(store.get(9), page[0]);
						t.assertEqual(store.get(18), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move up within page
						var obj = store.get(17);
						obj.value = 13.5;
						store.put(obj);
						t.assertEqual([[obj, 7, 4]], events);
						t.assertEqual(obj, page[4]);
						t.assertEqual(store.get(16), page[7]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move down within page
						var obj = store.get(13);
						obj.value = 17.5;
						store.put(obj);
						t.assertEqual([[obj, 3, 7]], events);
						t.assertEqual(store.get(14), page[3]);
						t.assertEqual(obj, page[7]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to top of page from middle of page
						var obj = store.get(15);
						obj.value = 9.5;
						store.put(obj);
						t.assertEqual([[obj, 5, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(14), page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to bottom of page from middle of page
						var obj = store.get(15);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 5, 9]], events);
						t.assertEqual(store.get(16), page[5]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to top of page from bottom of page
						var obj = store.get(19);
						obj.value = 9.5;
						store.put(obj);
						t.assertEqual([[obj, 9, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(18), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to bottom of page from top of page
						var obj = store.get(10);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 0, 9]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// in place update before page
						var obj = store.get(5);
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// in place update in page
						var obj = store.get(15);
						store.put(obj);
						t.assertEqual([[obj, 5, 5]], events);
						t.assertEqual(obj, page[5]);
						t.assertEqual(10, page.length);
					}
				], 10);
			},
			function testFirstPage(t){
				// Scenarios concerning the first page
				runPageScenarios([
					function(page, events){
						// insert at top of page
						var obj = {id: -1, value: "-1"};
						store.add(obj);
						t.assertEqual([[obj, -1, 0], [store.get(9), 10, -1]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(8), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert in middle of page
						var obj = {id: 5.5, value: "5.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 6], [store.get(9), 10, -1]], events);
						t.assertEqual(obj, page[6]);
						t.assertEqual(store.get(8), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at bottom of page
						var obj = {id: 8.5, value: "8.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 9], [store.get(9), 10, -1]], events);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at bottom+1 of page
						var obj = {id: 9.5, value: "9.5"};
						store.add(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert after page
						var obj = {id: 15.5, value: "15.5"};
						store.add(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from top of page
						var obj = store.get(0);
						store.remove(0);
						t.assertEqual([[obj, 0, -1], [store.get(10), -1, 9]], events);
						t.assertEqual(store.get(1), page[0]);
						t.assertEqual(store.get(10), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from middle of page
						var obj = store.get(5);
						store.remove(5);
						t.assertEqual([[obj, 5, -1], [store.get(10), -1, 9]], events);
						t.assertEqual(store.get(6), page[5]);
						t.assertEqual(store.get(10), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from bottom of page
						var obj = store.get(9);
						store.remove(9);
						t.assertEqual([[obj, 9, -1], [store.get(10), -1, 9]], events);
						t.assertEqual(store.get(10), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from after page
						store.remove(15);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move up from after page to after page
						var obj = store.get(16);
						obj.value = 13.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move down from after page to after page
						var obj = store.get(12);
						obj.value = 17.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from after page into top of page
						var obj = store.get(15);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, -1, 0], [store.get(9), 10, -1]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(8), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from after page into middle of page
						var obj = store.get(15);
						obj.value = 5.5;
						store.put(obj);
						t.assertEqual([[obj, -1, 6], [store.get(9), 10, -1]], events);
						t.assertEqual(obj, page[6]);
						t.assertEqual(store.get(8), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from after page into bottom of page
						var obj = store.get(15);
						obj.value = 8.5;
						store.put(obj);
						t.assertEqual([[obj, -1, 9], [store.get(9), 10, -1]], events);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from top of page to after page
						var obj = store.get(0);
						obj.value = 15.5;
						store.put(obj);
						t.assertEqual([[obj, 0, -1], [store.get(10), -1, 9]], events);
						t.assertEqual(store.get(1), page[0]);
						t.assertEqual(store.get(10), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from middle of page to after page
						var obj = store.get(5);
						obj.value = 15.5;
						store.put(obj);
						t.assertEqual([[obj, 5, -1], [store.get(10), -1, 9]], events);
						t.assertEqual(store.get(6), page[5]);
						t.assertEqual(store.get(10), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from bottom of page to after page
						var obj = store.get(9);
						obj.value = 15.5;
						store.put(obj);
						t.assertEqual([[obj, 9, -1], [store.get(10), -1, 9]], events);
						t.assertEqual(store.get(10), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move up within page
						var obj = store.get(8);
						obj.value = 2.5;
						store.put(obj);
						t.assertEqual([[obj, 8, 3]], events);
						t.assertEqual(obj, page[3]);
						t.assertEqual(store.get(7), page[8]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move down within page
						var obj = store.get(2);
						obj.value = 7.5;
						store.put(obj);
						t.assertEqual([[obj, 2, 7]], events);
						t.assertEqual(store.get(3), page[2]);
						t.assertEqual(obj, page[7]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to top of page from middle of page
						var obj = store.get(5);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 5, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(4), page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to bottom of page from middle of page
						var obj = store.get(5);
						obj.value = 9.5;
						store.put(obj);
						t.assertEqual([[obj, 5, 9]], events);
						t.assertEqual(store.get(6), page[5]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to top of page from bottom of page
						var obj = store.get(9);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 9, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(8), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to bottom of page from top of page
						var obj = store.get(0);
						obj.value = 9.5;
						store.put(obj);
						t.assertEqual([[obj, 0, 9]], events);
						t.assertEqual(store.get(1), page[0]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// in place update in page
						var obj = store.get(5);
						store.put(obj);
						t.assertEqual([[obj, 5, 5]], events);
						t.assertEqual(obj, page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// in place update after page
						var obj = store.get(15);
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					}
				], 0, 10);
			},
			function testMiddlePage(t){
				// Scenarios concerning a middle page
				runPageScenarios([
					function(page, events){
						// insert before page
						var obj = {id: -1, value: "-1"};
						store.add(obj);
						t.assertEqual([[store.get(4), -1, 0], [store.get(14), 10, -1]], events);
						t.assertEqual(store.get(4), page[0]);
						t.assertEqual(store.get(13), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at top-1 of page
						var obj = {id: 3.5, value: "3.5"};
						store.add(obj);
						t.assertEqual([[store.get(4), -1, 0], [store.get(14), 10, -1]], events);
						t.assertEqual(store.get(4), page[0]);
						t.assertEqual(store.get(13), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at top of page
						var obj = {id: 4.5, value: "4.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 0], [store.get(14), 10, -1]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(13), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert in middle of page
						var obj = {id: 9.5, value: "9.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 5], [store.get(14), 10, -1]], events);
						t.assertEqual(obj, page[5]);
						t.assertEqual(store.get(13), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at bottom of page
						var obj = {id: 13.5, value: "13.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 9], [store.get(14), 10, -1]], events);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at bottom+1 of page
						var obj = {id: 14.5, value: "14.5"};
						store.add(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from before page
						store.remove(0);
						t.assertEqual([[store.get(5), 0, -1], [store.get(15), -1, 9]], events);
						t.assertEqual(store.get(6), page[0]);
						t.assertEqual(store.get(15), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from top-1 of page
						store.remove(4)
						t.assertEqual([[store.get(5), 0, -1], [store.get(15), -1, 9]], events);
						t.assertEqual(store.get(6), page[0]);
						t.assertEqual(store.get(15), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from top of page
						var obj = store.get(5);
						store.remove(5)
						t.assertEqual([[obj, 0, -1], [store.get(15), -1, 9]], events);
						t.assertEqual(store.get(6), page[0]);
						t.assertEqual(store.get(15), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from middle of page
						var obj = store.get(10);
						store.remove(10);
						t.assertEqual([[obj, 5, -1], [store.get(15), -1, 9]], events);
						t.assertEqual(store.get(11), page[5]);
						t.assertEqual(store.get(15), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from bottom of page
						var obj = store.get(14);
						store.remove(14);
						t.assertEqual([[obj, 9, -1], [store.get(15), -1, 9]], events);
						t.assertEqual(store.get(15), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from bottom+1 of page
						store.remove(15);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move up from before page to before page
						var obj = store.get(3);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move down from before page to before page
						var obj = store.get(0);
						obj.value = 2.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move up from after page to after page
						var obj = store.get(19);
						obj.value = 16.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move down from after page to after page
						var obj = store.get(16);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move up to before page from after page
						var obj = store.get(19);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[store.get(4), -1, 0], [store.get(14), 10, -1]], events);
						t.assertEqual(store.get(4), page[0]);
						t.assertEqual(store.get(13), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move down to after page from before page
						var obj = store.get(0);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[store.get(5), 0, -1], [store.get(15), -1, 9]], events);
						t.assertEqual(store.get(6), page[0]);
						t.assertEqual(store.get(15), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from before page into top of page
						var obj = store.get(1);
						obj.value = 5.5;
						store.put(obj);
						t.assertEqual([[store.get(5), 0, -1], [obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from before page into middle of page
						var obj = store.get(1);
						obj.value = 9.5;
						store.put(obj);
						t.assertEqual([[store.get(5), 0, -1], [obj, -1, 4]], events);
						t.assertEqual(store.get(6), page[0]);
						t.assertEqual(obj, page[4]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from before page into bottom of page
						var obj = store.get(1);
						obj.value = 14.5;
						store.put(obj);
						t.assertEqual([[store.get(5), 0, -1], [obj, -1, 9]], events);
						t.assertEqual(store.get(6), page[0]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from top of page to before page
						var obj = store.get(5);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 0, -1], [store.get(4), -1, 0]], events);
						t.assertEqual(store.get(4), page[0]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from middle of page to before page
						var obj = store.get(10);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 5, -1], [store.get(4), -1, 0]], events);
						t.assertEqual(store.get(4), page[0]);
						t.assertEqual(store.get(9), page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from bottom of page to before page
						var obj = store.get(14);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 9, -1], [store.get(4), -1, 0]], events);
						t.assertEqual(store.get(4), page[0]);
						t.assertEqual(store.get(13), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from after page into top of page
						var obj = store.get(19);
						obj.value = 4.5;
						store.put(obj);
						t.assertEqual([[obj, -1, 0], [store.get(14), 10, -1]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(13), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from after page into middle of page
						var obj = store.get(19);
						obj.value = 9.5;
						store.put(obj);
						t.assertEqual([[obj, -1, 5], [store.get(14), 10, -1]], events);
						t.assertEqual(obj, page[5]);
						t.assertEqual(store.get(13), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from after page into bottom of page
						var obj = store.get(19);
						obj.value = 13.5;
						store.put(obj);
						t.assertEqual([[obj, -1, 9], [store.get(14), 10, -1]], events);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from top of page to after page
						var obj = store.get(5);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 0, -1], [store.get(15), -1, 9]], events);
						t.assertEqual(store.get(6), page[0]);
						t.assertEqual(store.get(15), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from middle of page to after page
						var obj = store.get(10);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 5, -1], [store.get(15), -1, 9]], events);
						t.assertEqual(store.get(11), page[5]);
						t.assertEqual(store.get(15), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from bottom of page to after page
						var obj = store.get(14);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 9, -1], [store.get(15), -1, 9]], events);
						t.assertEqual(store.get(15), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move up within page
						var obj = store.get(12);
						obj.value = 7.5;
						store.put(obj);
						t.assertEqual([[obj, 7, 3]], events);
						t.assertEqual(obj, page[3]);
						t.assertEqual(store.get(11), page[7]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move down within page
						var obj = store.get(7);
						obj.value = 12.5;
						store.put(obj);
						t.assertEqual([[obj, 2, 7]], events);
						t.assertEqual(store.get(8), page[2]);
						t.assertEqual(obj, page[7]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to top of page from middle of page
						var obj = store.get(10);
						obj.value = 4.5;
						store.put(obj);
						t.assertEqual([[obj, 5, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(9), page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to bottom of page from middle of page
						var obj = store.get(10);
						obj.value = 14.5;
						store.put(obj);
						t.assertEqual([[obj, 5, 9]], events);
						t.assertEqual(store.get(11), page[5]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to top of page from bottom of page
						var obj = store.get(14);
						obj.value = 4.5;
						store.put(obj);
						t.assertEqual([[obj, 9, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(13), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to bottom of page from top of page
						var obj = store.get(5);
						obj.value = 14.5;
						store.put(obj);
						t.assertEqual([[obj, 0, 9]], events);
						t.assertEqual(store.get(6), page[0]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// in place update before page
						var obj = store.get(3);
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// in place update in page
						var obj = store.get(11);
						store.put(obj);
						t.assertEqual([[obj, 6, 6]], events);
						t.assertEqual(obj, page[6]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// in place update after page
						var obj = store.get(18);
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					}
				], 5, 10);
			},
			function testLastPage(t){
				// Scenarios concerning a full last page
				runPageScenarios([
					function(page, events){
						// insert before page
						var obj = {id: 4.3, value: "4.3"};
						store.add(obj);
						t.assertEqual([[store.get(9), -1, 0], [store.get(19), 10, -1]], events);
						t.assertEqual(store.get(9), page[0]);
						t.assertEqual(store.get(18), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at top-1 of page
						var obj = {id: 8.5, value: "8.5"};
						store.add(obj);
						t.assertEqual([[store.get(9), -1, 0], [store.get(19), 10, -1]], events);
						t.assertEqual(store.get(9), page[0]);
						t.assertEqual(store.get(18), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at top of page
						var obj = {id: 9.5, value: "9.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 0], [store.get(19), 10, -1]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(18), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert in middle of page
						var obj = {id: 14.5, value: "14.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 5], [store.get(19), 10, -1]], events);
						t.assertEqual(obj, page[5]);
						t.assertEqual(store.get(18), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at bottom of page
						var obj = {id: 18.5, value: "18.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 9], [store.get(19), 10, -1]], events);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from before page
						store.remove(5);
						t.assertEqual([[store.get(10), 0, -1]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// remove from top-1 of page
						store.remove(9);
						t.assertEqual([[store.get(10), 0, -1]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// remove from top of page
						var obj = store.get(10);
						store.remove(10);
						t.assertEqual([[obj, 0, -1]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// remove from middle of page
						var obj = store.get(15);
						store.remove(15);
						t.assertEqual([[obj, 5, -1]], events);
						t.assertEqual(store.get(16), page[5]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// remove from bottom of page
						var obj = store.get(19);
						store.remove(19);
						t.assertEqual([[obj, 9, -1]], events);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move up from before page to before page
						var obj = store.get(6);
						obj.value = 0;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move down from before page to before page
						var obj = store.get(1);
						obj.value = 7.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from before page into top of page
						var obj = store.get(1);
						obj.value = 10.5;
						store.put(obj);
						t.assertEqual([[store.get(10), 0, -1], [obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from before page into middle of page
						var obj = store.get(1);
						obj.value = 15.5;
						store.put(obj);
						t.assertEqual([[store.get(10), 0, -1], [obj, -1, 5]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(obj, page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from before page into bottom of page
						var obj = store.get(1);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[store.get(10), 0, -1], [obj, -1, 9]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from top of page to before page
						var obj = store.get(10);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 0, -1], [store.get(9), -1, 0]], events);
						t.assertEqual(store.get(9), page[0]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from middle of page to before page
						var obj = store.get(15);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 5, -1], [store.get(9), -1, 0]], events);
						t.assertEqual(store.get(9), page[0]);
						t.assertEqual(store.get(14), page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move from bottom of page to before page
						var obj = store.get(19);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 9, -1], [store.get(9), -1, 0]], events);
						t.assertEqual(store.get(9), page[0]);
						t.assertEqual(store.get(18), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move up within page
						var obj = store.get(16);
						obj.value = 12.5;
						store.put(obj);
						t.assertEqual([[obj, 6, 3]], events);
						t.assertEqual(obj, page[3]);
						t.assertEqual(store.get(15), page[6]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move down within page
						var obj = store.get(12);
						obj.value = 16.5;
						store.put(obj);
						t.assertEqual([[obj, 2, 6]], events);
						t.assertEqual(store.get(13), page[2]);
						t.assertEqual(obj, page[6]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to top of page from middle of page
						var obj = store.get(15);
						obj.value = 9.5;
						store.put(obj);
						t.assertEqual([[obj, 5, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(14), page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to bottom of page from middle of page
						var obj = store.get(15);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 5, 9]], events);
						t.assertEqual(store.get(16), page[5]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to top of page from bottom of page
						var obj = store.get(19);
						obj.value = 9.5;
						store.put(obj);
						t.assertEqual([[obj, 9, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(18), page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// move to bottom of page from top of page
						var obj = store.get(10);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 0, 9]], events);
						t.assertEqual(store.get(11), page[0]);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// in place update before page
						var obj = store.get(5);
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// in place update in page
						var obj = store.get(15);
						store.put(obj);
						t.assertEqual([[obj, 5, 5]], events);
						t.assertEqual(obj, page[5]);
						t.assertEqual(10, page.length);
					}
				], 10, 10);
			},
			function testNearlyFullPage(t){
				// Scenarios concerning a last page with one free space
				runPageScenarios([
					function(page, events){
						// insert before page
						var obj = {id: -1, value: "-1"};
						store.add(obj);
						t.assertEqual([[store.get(10), -1, 0]], events);
						t.assertEqual(store.get(10), page[0]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at top-1 of page
						var obj = {id: 9.5, value: "9.5"};
						store.add(obj);
						t.assertEqual([[store.get(10), -1, 0]], events);
						t.assertEqual(store.get(10), page[0]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at top of page
						var obj = {id: 10.5, value: "10.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert in middle of page
						var obj = {id: 15.5, value: "15.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 5]], events);
						t.assertEqual(obj, page[5]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// insert at bottom of page
						var obj = {id: 20, value: "20"};
						store.add(obj);
						t.assertEqual([[obj, -1, 9]], events);
						t.assertEqual(obj, page[9]);
						t.assertEqual(10, page.length);
					},
					function(page, events){
						// remove from before page
						store.remove(0);
						t.assertEqual([[store.get(11), 0, -1]], events);
						t.assertEqual(store.get(12), page[0]);
						t.assertEqual(8, page.length);
					},
					function(page, events){
						// remove from top-1 of page
						store.remove(10);
						t.assertEqual([[store.get(11), 0, -1]], events);
						t.assertEqual(store.get(12), page[0]);
						t.assertEqual(8, page.length);
					},
					function(page, events){
						// remove from top of page
						var obj = store.get(11);
						store.remove(11);
						t.assertEqual([[obj, 0, -1]], events);
						t.assertEqual(store.get(12), page[0]);
						t.assertEqual(8, page.length);
					},
					function(page, events){
						// remove from middle of page
						var obj = store.get(16);
						store.remove(16);
						t.assertEqual([[obj, 5, -1]], events);
						t.assertEqual(store.get(17), page[5]);
						t.assertEqual(8, page.length);
					},
					function(page, events){
						// remove from bottom of page
						var obj = store.get(19);
						store.remove(19);
						t.assertEqual([[obj, 8, -1]], events);
						t.assertEqual(8, page.length);
					},
					function(page, events){
						// move up from before page to before page
						var obj = store.get(7);
						obj.value = 2.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move down from before page to before page
						var obj = store.get(2);
						obj.value = 7.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move from before page into top of page
						var obj = store.get(5);
						obj.value = 11.5;
						store.put(obj);
						t.assertEqual([[store.get(11), 0, -1], [obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move from before page into middle of page
						var obj = store.get(5);
						obj.value = 16.5;
						store.put(obj);
						t.assertEqual([[store.get(11), 0, -1], [obj, -1, 5]], events);
						t.assertEqual(store.get(12), page[0]);
						t.assertEqual(obj, page[5]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move from before page into bottom of page
						var obj = store.get(5);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[store.get(11), 0, -1], [obj, -1, 8]], events);
						t.assertEqual(store.get(12), page[0]);
						t.assertEqual(obj, page[8]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move from top of page to before page
						var obj = store.get(11);
						obj.value = 5.5;
						store.put(obj);
						t.assertEqual([[obj, 0, -1], [store.get(10), -1, 0]], events);
						t.assertEqual(store.get(10), page[0]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move from middle of page to before page
						var obj = store.get(16);
						obj.value = 5.5;
						store.put(obj);
						t.assertEqual([[obj, 5, -1], [store.get(10), -1, 0]], events);
						t.assertEqual(store.get(10), page[0]);
						t.assertEqual(store.get(15), page[5]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move from bottom of page to before page
						var obj = store.get(19);
						obj.value = 5.5;
						store.put(obj);
						t.assertEqual([[obj, 8, -1], [store.get(10), -1, 0]], events);
						t.assertEqual(store.get(10), page[0]);
						t.assertEqual(store.get(18), page[8]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move up within page
						var obj = store.get(17);
						obj.value = 13.5;
						store.put(obj);
						t.assertEqual([[obj, 6, 3]], events);
						t.assertEqual(obj, page[3]);
						t.assertEqual(store.get(16), page[6]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move down within page
						var obj = store.get(13);
						obj.value = 16.5;
						store.put(obj);
						t.assertEqual([[obj, 2, 5]], events);
						t.assertEqual(store.get(14), page[2]);
						t.assertEqual(obj, page[5]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move to top of page from middle of page
						var obj = store.get(16);
						obj.value = 10.5;
						store.put(obj);
						t.assertEqual([[obj, 5, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(15), page[5]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move to bottom of page from middle of page
						var obj = store.get(16);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 5, 8]], events);
						t.assertEqual(store.get(17), page[5]);
						t.assertEqual(obj, page[8]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move to top of page from bottom of page
						var obj = store.get(19);
						obj.value = 10.5;
						store.put(obj);
						t.assertEqual([[obj, 8, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(18), page[8]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// move to bottom of page from top of page
						var obj = store.get(11);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 0, 8]], events);
						t.assertEqual(store.get(12), page[0]);
						t.assertEqual(obj, page[8]);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// in place update before page
						var obj = store.get(5);
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(9, page.length);
					},
					function(page, events){
						// in place update in page
						var obj = store.get(16);
						store.put(obj);
						t.assertEqual([[obj, 5, 5]], events);
						t.assertEqual(obj, page[5]);
						t.assertEqual(9, page.length);
					}
				], 11, 10);
			},
			function testPartialPage(t){
				// Scenarios concerning a partial last page
				runPageScenarios([
					function(page, events){
						// insert before page
						var obj = {id: -1, value: "-1"};
						store.add(obj);
						t.assertEqual([[store.get(14), -1, 0]], events);
						t.assertEqual(store.get(14), page[0]);
						t.assertEqual(6, page.length);
					},
					function(page, events){
						// insert at top of page
						var obj = {id: 14.5, value: "14.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(6, page.length);
					},
					function(page, events){
						// insert at bottom of page
						var obj = {id: 20, value: "20"};
						store.add(obj);
						t.assertEqual([[obj, -1, 5]], events);
						t.assertEqual(obj, page[5]);
						t.assertEqual(6, page.length);
					},
					function(page, events){
						// remove before page
						store.remove(0);
						t.assertEqual([[store.get(15), 0, -1]], events);
						t.assertEqual(store.get(16), page[0]);
						t.assertEqual(4, page.length);
					},
					function(page, events){
						// remove from top of page
						var obj = store.get(15);
						store.remove(15);
						t.assertEqual([[obj, 0, -1]], events);
						t.assertEqual(store.get(16), page[0]);
						t.assertEqual(4, page.length);
					},
					function(page, events){
						// remove from bottom of page
						var obj = store.get(19);
						store.remove(19);
						t.assertEqual([[obj, 4, -1]], events);
						t.assertEqual(4, page.length);
					},
					function(page, events){
						// move up from before page to before page
						var obj = store.get(10);
						obj.value = 5.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// move down from before page to before page
						var obj = store.get(5);
						obj.value = 10.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// move from before page into top of page
						var obj = store.get(5);
						obj.value = 15.5;
						store.put(obj);
						t.assertEqual([[store.get(15), 0, -1], [obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// move from before page into bottom of page
						var obj = store.get(5);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[store.get(15), 0, -1], [obj, -1, 4]], events);
						t.assertEqual(store.get(16), page[0]);
						t.assertEqual(obj, page[4]);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// move from top of page to before page
						var obj = store.get(15);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 0, -1], [store.get(14), -1, 0]], events);
						t.assertEqual(store.get(14), page[0]);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// move from bottom of page to before page
						var obj = store.get(19);
						obj.value = -1;
						store.put(obj);
						t.assertEqual([[obj, 4, -1], [store.get(14), -1, 0]], events);
						t.assertEqual(store.get(14), page[0]);
						t.assertEqual(store.get(18), page[4]);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// move up within page
						var obj = store.get(18);
						obj.value = 15.5;
						store.put(obj);
						t.assertEqual([[obj, 3, 1]], events);
						t.assertEqual(obj, page[1]);
						t.assertEqual(store.get(17), page[3]);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// move down within page
						var obj = store.get(16);
						obj.value = 18.5;
						store.put(obj);
						t.assertEqual([[obj, 1, 3]], events);
						t.assertEqual(store.get(17), page[1]);
						t.assertEqual(obj, page[3]);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// move to top of page from bottom of page
						var obj = store.get(19);
						obj.value = 14.5;
						store.put(obj);
						t.assertEqual([[obj, 4, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(store.get(18), page[4]);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// move to bottom of page from top of page
						var obj = store.get(15);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[obj, 0, 4]], events);
						t.assertEqual(store.get(16), page[0]);
						t.assertEqual(obj, page[4]);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// in place update before page
						var obj = store.get(10);
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(5, page.length);
					},
					function(page, events){
						// in place update in page
						var obj = store.get(17);
						store.put(obj);
						t.assertEqual([[obj, 2, 2]], events);
						t.assertEqual(obj, page[2]);
						t.assertEqual(5, page.length);
					}
				], 15, 10);
			},
			function testNearlyEmptyPage(t){
				// Scenarios concerning a last page with one element
				runPageScenarios([
					function(page, events){
						// insert before page
						var obj = {id: -1, value: "-1"};
						store.add(obj);
						t.assertEqual([[store.get(18), -1, 0]], events);
						t.assertEqual(store.get(18), page[0]);
						t.assertEqual(2, page.length);
					},
					function(page, events){
						// insert at top of page
						var obj = {id: 18.5, value: "18.5"};
						store.add(obj);
						t.assertEqual([[obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(2, page.length);
					},
					function(page, events){
						// insert at bottom of page
						var obj = {id: 20, value: "20"};
						store.add(obj);
						t.assertEqual([[obj, -1, 1]], events);
						t.assertEqual(obj, page[1]);
						t.assertEqual(2, page.length);
					},
					function(page, events){
						// remove before page
						store.remove(0);
						t.assertEqual([[store.get(19), 0, -1]], events);
						t.assertEqual(0, page.length);
					},
					function(page, events){
						// remove from top of page
						var obj = store.get(19);
						store.remove(19);
						t.assertEqual([[obj, 0, -1]], events);
						t.assertEqual(0, page.length);
					},
					function(page, events){
						// move up from before page to before page
						var obj = store.get(12);
						obj.value = 6.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(1, page.length);
					},
					function(page, events){
						// move down from before page to before page
						var obj = store.get(3);
						obj.value = 14.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(1, page.length);
					},
					function(page, events){
						// move from before page into page
						var obj = store.get(5);
						obj.value = 20;
						store.put(obj);
						t.assertEqual([[store.get(19), 0, -1], [obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(1, page.length);
					},
					function(page, events){
						// move from page to before page
						var obj = store.get(19);
						obj.value = 5.5;
						store.put(obj);
						t.assertEqual([[obj, 0, -1], [store.get(18), -1, 0]], events);
						t.assertEqual(store.get(18), page[0]);
						t.assertEqual(1, page.length);
					},
					function(page, events){
						// in place update before page
						var obj = store.get(10);
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(1, page.length);
					},
					function(page, events){
						// in place update in page
						var obj = store.get(19);
						store.put(obj);
						t.assertEqual([[obj, 0, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(1, page.length);
					}
				], 19, 10);
			},
			function testEmptyPage(t){
				// Scenarios concerning an empty last page
				runPageScenarios([
					function(page, events){
						// insert before page
						var obj = {id: -1, value: "-1"};
						store.add(obj);
						t.assertEqual([[store.get(19), -1, 0]], events);
						t.assertEqual(store.get(19), page[0]);
						t.assertEqual(1, page.length);
					},
					function(page, events){
						// insert at top-1 of page
						var obj = {id: 18.5, value: "18.5"};
						store.add(obj);
						t.assertEqual([[store.get(19), -1, 0]], events);
						t.assertEqual(store.get(19), page[0]);
						t.assertEqual(1, page.length);
					},
					function(page, events){
						// insert at top of page
						var obj = {id: 20, value: "20"};
						store.add(obj);
						t.assertEqual([[obj, -1, 0]], events);
						t.assertEqual(obj, page[0]);
						t.assertEqual(1, page.length);
					},
					function(page, events){
						// remove from before page
						store.remove(0);
						t.assertEqual([], events);
						t.assertEqual(0, page.length);
					},
					function(page, events){
						// remove from top-1 of page
						store.remove(19);
						t.assertEqual([], events);
						t.assertEqual(0, page.length);
					},
					function(page, events){
						// move up from before page to before page
						var obj = store.get(15);
						obj.value = 5.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(0, page.length);
					},
					function(page, events){
						// move down from before page to before page
						var obj = store.get(5);
						obj.value = 15.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(0, page.length);
					},
					function(page, events){
						// in place update before page
						var obj = store.get(10);
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(0, page.length);
					}
				], 20, 10);
			},
			function testFarOffPage(t){
				// Scenarios concerning a page that is out of reach
				runPageScenarios([
					function(page, events){
						// insert before page
						var obj = {id: -1, value: "-1"};
						store.add(obj);
						t.assertEqual([], events);
						t.assertEqual(0, page.length);
					},
					function(page, events){
						// remove from before page
						store.remove(0);
						t.assertEqual([], events);
						t.assertEqual(0, page.length);
					},
					function(page, events){
						// move up from before page to before page
						var obj = store.get(15);
						obj.value = 5.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(0, page.length);
					},
					function(page, events){
						// move down from before page to before page
						var obj = store.get(5);
						obj.value = 15.5;
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(0, page.length);
					},
					function(page, events){
						// in place update before page
						var obj = store.get(10);
						store.put(obj);
						t.assertEqual([], events);
						t.assertEqual(0, page.length);
					}
				], 30, 10);
			},
			function testPagesExhaustive(t){
				// For all page sizes 1->10, for all offsets (-1,0,1), for
				// all positions:
				//	1) update in place
				//  2) insert new
				//  3) remove
				//  4) move to every other position
				// In each case, verify that the page contents match the
				// corresponding slice in the master results array. Note
				// that this does not verify that the generated events are
				// accurate, only that the page data is updated accurately
				// in all cases. Events are assumed to be accurate based on
				// the scenarios tested above.

				var data = scenarioData.slice(0, 10),
					count, offset, position, moveTo, runTest,
					updateTest, insertTest, removeTest, moveTest;

				runTest = function(test, count, offset, position, moveTo){
					var start = 0,
						pages = [],
						lastPage = null,
						query;
					store.setData(lang.clone(data));
					store.queries = {};
					query = store.materialize(null, {sort: [{attribute: "value"}]});
					while(lastPage === null){
						pages.push(query.page(start, count));
						if(start >= data.length){
							lastPage = pages[pages.length - 1];
						}else{
							start = start + count + offset;
						}
					}
					test(position, moveTo);
					array.forEach(pages, function(page){
						var end = (page.count === null) ? undefined : page.start + page.count,
							slice = query._results.slice(page.start, end);
						t.assertEqual(slice, page); // ensure the page is still accurate
					});
				};

				insertTest = function(position){
					var obj = {id: position - 0.5, value: position - 0.5};
					store.add(obj);
				};

				removeTest = function(position){
					store.remove(position);
				};

				moveTest = function(position, moveTo){
					var obj = store.get(position);
					obj.value = (moveTo <= position) ? moveTo - 0.5 : moveTo + 0.5;
					store.put(obj);
				};

				for(count = 1; count <= data.length; count++){
					for(offset = -1; offset <= 1; offset++){
						if(count === 1 && offset === -1){continue;}
						for(position = 0; position <= data.length; position++){
							runTest(insertTest, count, offset, position);
							if(position === data.length){continue;}
							runTest(removeTest, count, offset, position);
							for(moveTo = 0; moveTo < data.length; moveTo++){
								runTest(moveTest, count, offset, position, moveTo);
							}
						}
					}
				}
			}
		]
	);
});
