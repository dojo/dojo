define([
	'intern!object',
	'intern/chai!assert',
	'dojo/has',
	'../../../_base/json',
	// dojo/_base/json loads dojo/json5 only when the flag is set at load time
	'../../../json5'
], function (registerSuite, assert, has, json) {
	var hasCspRestrictions = has('csp-restrictions');
	var globalEval;

	registerSuite({
		name: 'dojo/_base/json',
		'toJson and fromJson': function () {
			// Not testing dojo.toJson() on its own since Rhino will output the object properties in a different order.
			// Still valid json, but just in a different order than the source string.

			// take a json-compatible object, convert it to a json string, then put it back into json.
			var testObj = {
				a: 'a',
				b: 1,
				c: 'c',
				d: 'd',
				e: {
					e1: 'e1',
					e2: 2
				},
				f: [1, 2, 3],
				g: 'g',
				h: {
					h1: { h2: { h3: 'h3' }}
				},
				i: [[0, 1, 2], [3], [4]]
			},
			obj = json.fromJson(json.toJson(testObj));

			assert.deepEqual(obj, testObj);

			var badJson;
			assert.throws(function () {
				badJson = json.fromJson('bad json'); // should throw an exception, and not set badJson
			});

			assert.isUndefined(badJson);
		},

		'dojo extended json': function () {
			var testObj = {
				ex1: {
					b: 3,
					json: function () {
						return 'json' + this.b;
					}
				},
				ex2: {
					b: 4,
					__json__: function () {
						return '__json__' + this.b;
					}
				}
			},
			testStr = json.toJson(testObj);
			assert.equal('{"ex1":"json3","ex2":"__json__4"}', testStr);
		},

		'pretty print json': function () {
			if (typeof JSON === 'undefined') { // only test our JSON stringifier
				var testObj = {array: [1, 2, { a: 4, b: 4 }]};
				var testStr = json.toJson(testObj, true);
				assert.equal('{\n\t\"array\": [\n\t\t1,\n\t\t2,\n\t\t{\n\t\t\t\"a\": 4,\n\t\t\t\"b\": 4\n\t\t}\n\t]\n}', testStr);
			}
		},

		'eval json': function () {
			var testStr = '{func: function(){}, number: Infinity}';
			var testObj = json.fromJson(testStr);

			assert.isFunction(testObj.func);
			assert.isNumber(testObj.number);
			assert.deepEqual(json.fromJson('{x: 1 + 1}'), { x: 2 });
		},

		'csp-restrictions': {
			setup: function () {
				has.add('csp-restrictions', true, false, true);
				// what a Content Security Policy without 'unsafe-eval' does
				globalEval = json.global.eval;
				json.global.eval = function () {
					throw new EvalError('eval is not allowed');
				};
			},

			teardown: function () {
				json.global.eval = globalEval;
				has.add('csp-restrictions', hasCspRestrictions, false, true);
			},

			'fromJson parses JSON5': function () {
				assert.deepEqual(
					json.fromJson('{a: 1, \'b\': [2, 3,], /* c */ "d": null}'),
					{ a: 1, b: [2, 3], d: null }
				);
				assert.isNull(json.fromJson(null));
			},

			'fromJson rejects expressions': function () {
				assert.throws(function () {
					json.fromJson('{x: 1 + 1}');
				}, SyntaxError);
			}
		},

		'toJson called on string': function () {
			assert.equal('"hello"', json.toJson('hello'));
		}
	});
});
