define([
	'intern!object',
	'intern/chai!assert',
	'../../../store/DataStore',
	'../../../data/ItemFileReadStore',
	'../../../data/ItemFileWriteStore',
	'dojo/_base/lang'
], function (registerSuite, assert, DataStore, ItemFileReadStore, ItemFileWriteStore, lang) {
	var data, dataStore, store;

	// dojo/data has no public getItemByIdentity; the identity lookup is
	// synchronous for in-memory data, so a callback is enough
	function fetchItemByIdentity(store, identity) {
		var item;
		store.fetchItemByIdentity({
			identity: identity,
			onItem: function (result) {
				item = result;
			}
		});
		return item;
	}

	registerSuite({
		name: 'dojo/store/DataStore',

		beforeEach: function () {
			data = {
				items: [
					{ id: 1, name: 'one', prime: false },
					{ id: 2, name: 'two', even: true, prime: true },
					{ id: 3, name: 'three', prime: true },
					{ id: 4, name: 'four', even: true, prime: false },
					{ id: 5, name: 'five', prime: true, children: [
						{ _reference: 1 },
						{ _reference: 2 },
						{ _reference: 3 }
					] }
				],
				identifier: 'id'
			};

			dataStore = new ItemFileWriteStore({ data: lang.clone(data) });
			dataStore.fetchItemByIdentity({ identity: null });
			store = new DataStore({ store: dataStore });
		},

		construction: {
			'when using a read-only store then write methods unavailable': function () {
				var readOnlyStore = new DataStore({ store: new ItemFileReadStore({}) });
				assert.isNotFunction(readOnlyStore.put);
				assert.isNotFunction(readOnlyStore.add);
			}
		},

		'.get': function () {
			assert.equal(store.get(1).name, 'one');
			assert.equal(store.get(4).name, 'four');
			assert.isTrue(store.get(5).prime);
			assert.equal(store.get(5).children[1].name, 'two');
			assert.ok(typeof store.get(10) === 'undefined');
		},

		'.query': {
			'basic query returns expected data': function () {
				var dfd = this.async(500);
				var query = { even: true };
				var result = store.query(query);

				result.map(dfd.callback(function (record) {
					var expected = data.items[record.id - 1];
					for (var key in record) {
						if (record.hasOwnProperty(key)) {
							assert.propertyVal(expected, key, record[key]);
						}
					}
				}), lang.hitch(dfd, 'reject'));
			},

			'provides children': function () {
				var dfd = this.async(500);
				var query = { prime: true };

				store.query(query).then(dfd.callback(
					function (results) {
						assert.lengthOf(results, 3);
						assert.equal(results[2].children[2].name, 'three');
					}
				), lang.hitch(dfd, 'reject'));
			}
		},

		'.put': {
			'update a record': function () {
				var record = store.get(4);

				assert.notOk(record.square);
				record.square = true;
				store.put(record);
				record = store.get(4);
				assert.isTrue(record.square);
			},

			'add a new record': function () {
				var data = { id: 6, perfect: true };

				store.put(data);
				assert.isTrue(store.get(6).perfect);
			},

			'overwrite new': function () {
				return store.put({
					id: 8,
					name: 'eight'
				}, {
					overwrite: true
				}).then(function () {
					assert.fail();
				}, function () {
					// do nothing... test passes
				});
			}
		},

		'.add': {
			'new record': function () {
				store.add({
					id: 7,
					name: 'seven'
				});
				assert.equal(store.get(7).name, 'seven');
			},

			'existing record': function () {
				return store.add({
					id: 1,
					name: 'one'
				}).then(function () {
					assert.fail();
				}, function () {
					// do nothing... test passes
				});
			}
		},

		'.remove': {
			'multiple calls': function () {
				return store.remove(5).then(function (result) {
					assert.ok(result);
				}).then(function () {
					return store.remove(7);
				}).then(function (result) {
					assert.ok(!result);
				});
			}
		},

		'prototype pollution through attribute names': {
			'__proto__ attribute does not replace the prototype of the returned object': function () {
				var json = '{"identifier":"id","items":[{"id":"1","name":"kermit","__proto__":{"polluted":"yes","id":"2"}}]}';
				var readStore = new ItemFileReadStore({ data: JSON.parse(json) });
				var adapter = new DataStore({ store: readStore, idProperty: 'id' });
				var record = adapter.get('1');

				assert.strictEqual(Object.getPrototypeOf(record), Object.prototype);
				assert.isUndefined(record.polluted);
				assert.deepEqual(Object.keys(record), ['id', 'name']);
			},

			'__proto__ keyword argument is not copied by newItem': function () {
				var writeStore = new ItemFileWriteStore({ data: { identifier: 'id', items: [{ id: '1' }] } });
				var item = writeStore.newItem(JSON.parse('{"id":"2","__proto__":{"polluted":"yes"}}'));

				assert.strictEqual(Object.getPrototypeOf(item), Object.prototype);
				assert.isUndefined(item.polluted);
				assert.equal(writeStore.getAttributes(item).indexOf('polluted'), -1);
			},

			'revert() does not turn the __proto__ attribute into item attributes': function () {
				var json = '{"identifier":"id","items":[{"id":"1","name":"kermit","__proto__":{"polluted":"yes","id":"2"}}]}';
				var writeStore = new ItemFileWriteStore({ data: JSON.parse(json) });
				var item = fetchItemByIdentity(writeStore, '1');

				writeStore.setValue(item, 'name', 'piggy');
				writeStore.revert();
				item = fetchItemByIdentity(writeStore, '1');

				assert.deepEqual(writeStore.getAttributes(item), ['id', 'name']);
				assert.isUndefined(item.polluted);
			},

			'an identity of __proto__ does not replace the identity lookup table': function () {
				var json = '{"identifier":"id","items":[{"id":"__proto__","name":"kermit"},{"id":"real","name":"piggy"}]}';
				var readStore = new ItemFileReadStore({ data: JSON.parse(json) });

				// fetching an item is what loads the data and builds the lookup table
				assert.equal(fetchItemByIdentity(readStore, 'real').name, 'piggy');

				// the lookup table itself must stay a plain object; a __proto__ identity
				// used to be assigned into it as a prototype
				assert.strictEqual(Object.getPrototypeOf(readStore._itemsByIdentity), Object.prototype);
				assert.isNull(fetchItemByIdentity(readStore, 'missing'));
			}
		}
	});
});
