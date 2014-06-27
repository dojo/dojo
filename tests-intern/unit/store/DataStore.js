define([
	'intern!object',
	'intern/chai!assert',
	'dojo/store/DataStore',
	'dojo/data/ItemFileReadStore',
	'dojo/data/ItemFileWriteStore'
], function (registerSuite, assert, DataStore, ItemFileReadStore, ItemFileWriteStore) {
	var two,
		four,
		items,
		dataStore,
		store,
		readOnlyStore;

	registerSuite({
		name: 'dojo/store/DataStore',

		setup: function () {
			two = { id: 2, name: 'two', even: true, prime: true };
			four = { id: 4, name: 'four', even: true, prime: false };
		},

		beforeEach: function () {
			items = [
				{ id: 1, name: 'one', prime: false },
				{ id: 2, name: 'two', even: true, prime: true },
				{ id: 3, name: 'three', prime: true },
				{ id: 4, name: 'four', even: true, prime: false },
				{ id: 5, name: 'five', prime: true, children: [
					{ _reference: 1 },
					{ _reference: 2 },
					{ _reference: 3 }
				]}
			];

			dataStore = new ItemFileWriteStore({
				data: {
					items: items,
					identifier: 'id'
				}
			});

			dataStore.fetchItemByIdentity({ identity: null });
			store = new DataStore({ store: dataStore });

			readOnlyStore = new DataStore({
				store: new ItemFileReadStore({})
			});
		},

		'.get': [
			function () {
				assert.strictEqual(store.get(1).name, 'one');
				assert.strictEqual(store.get(4).name, 'four');
				assert.ok(store.get(5).prime);
				assert.strictEqual(store.get(5).children[1].name, 'two');
			}
		],
		'.remove (async)': [
			function () {
				store.remove(4);
				return store.query({ even: true }).then(function (results) {
					assert.strictEqual(results.length, 1);
				});
			}
		],
		'.query (async)': [
			function () {
				return store.query({ prime: true }).then(function (results) {
					assert.strictEqual(results.length, 3);
					assert.strictEqual(results[2].children[2].name, 'three');
				});
			},
			function () {
				return store.query({ even: true }).then(function (results) {
					assert.deepEqual(results[0], two);
					assert.deepEqual(results[1], four);
					assert.strictEqual('four', results[1].name);
				});
			}
		],
		'.put': {
			'new': function () {
				store.put({
					id: 6,
					perfect: true
				});
				assert.isTrue(store.get(6).perfect);
			},
			'update': function () {
				var four = store.get(4);
				four.square = true;
				store.put(four);
				four = store.get(4);
				assert.isTrue(four.square);
			},
			'read only': function () {
				assert.notOk(readOnlyStore.put);
			}
		}
	});
});
