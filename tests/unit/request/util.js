define([
	'intern!object',
	'intern/chai!assert',
	'../../../request/util',
	'../../../has',
	'../../../request/xhr'
], function(registerSuite, assert, util, has){
	registerSuite({
		name: 'dojo/request/util',

		'deepCopy': function(){
			var object1 = {
				apple: 0,
				banana: {
					weight: 52,
					price: 100,
					code: "B12345",
					purchased: new Date(2016, 0, 1)
				},
				cherry: 97
			};
			var object2 = {
				banana: {
					price: 200,
					code: "B98765",
					purchased: new Date(2017, 0, 1)
				},
				durian: 100
			};
			util.deepCopy(object1, object2);
			assert.strictEqual(object1.banana.weight, 52);
			assert.strictEqual(object1.banana.price, 200);
			assert.strictEqual(object1.banana.code, "B98765");
			assert.equal(object1.banana.purchased.getTime(), new Date(2017, 0, 1).getTime());
		},

		'deepCopy with FormData': function(){
			if (has('native-formdata')) {
				var formData = new FormData();
				var object1 = {
					apple: 0,
					banana: {
						weight: 52,
						price: 100,
						code: "B12345",
						purchased: new Date(2016, 0, 1)
					},
					cherry: 97
				};
				var object2 = {
					banana: {
						price: 200,
						code: "B98765",
						purchased: new Date(2017, 0, 1)
					},
					formData: formData,
					durian: 100
				};
				util.deepCopy(object1, object2);
				assert.strictEqual(object1.banana.weight, 52);
				assert.strictEqual(object1.banana.price, 200);
				assert.strictEqual(object1.banana.code, "B98765");
				assert.strictEqual(object1.formData, formData);
				assert.equal(object1.banana.purchased.getTime(), new Date(2017, 0, 1).getTime());
			} else {
				this.skip('Do not run test if FormData not available.');
			}
		},

		'deepCopy with Blob': function(){
			if (has('native-blob')) {
				var blob = new Blob([JSON.stringify({test: "data"})], {type: 'application/json'});
				var object1 = {
					apple: 0,
					banana: {
						weight: 52,
						price: 100,
						code: "B12345",
						purchased: new Date(2016, 0, 1)
					},
					cherry: 97
				};
				var object2 = {
					banana: {
						price: 200,
						code: "B98765",
						purchased: new Date(2017, 0, 1)
					},
					blob: blob,
					durian: 100
				};
				util.deepCopy(object1, object2);
				assert.strictEqual(object1.banana.weight, 52);
				assert.strictEqual(object1.banana.price, 200);
				assert.strictEqual(object1.banana.code, "B98765");
				assert.strictEqual(object1.blob, blob);
				assert.equal(object1.banana.purchased.getTime(), new Date(2017, 0, 1).getTime());
			} else {
				this.skip('Do not run test if Blob not available.');
			}
		}
	});
});
