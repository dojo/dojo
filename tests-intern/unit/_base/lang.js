define([
	'intern!object',
	'intern/chai!assert',
	'dojo/_base/array',
	'dojo-testing/_base/lang',
	'dojo/has',
	'dojo/has!host-browser?dojo/domReady!'
], function (registerSuite, assert, array, lang, has) {
	registerSuite({
		name: 'dojo/_base/lang',

		'.mixin': function () {
			var src = {
				foo: function () {
					console.debug('foo');
				},
				bar: 'bar'
			};
			var dest = {};
			lang.mixin(dest, src);

			assert.typeOf(lang.mixin(), 'object');
			assert.typeOf(lang.mixin(undefined), 'object');
			assert.typeOf(lang.mixin(null), 'object');
			assert.typeOf(dest.foo, 'function');
			assert.typeOf(dest.bar, 'string');
		},

		'.extend': function () {
			var src = {
				foo: function () {
					console.debug('foo');
				},
				bar: 'bar'
			};
			var test;
			function Dest() {}

			lang.extend(Dest, src);
			test = new Dest();

			assert.typeOf(test.foo, 'function');
			assert.typeOf(test.bar, 'string');
		},

		'.isFunction': function () {
			function test() {}

			assert.isTrue(lang.isFunction(new Function()));
			assert.isTrue(lang.isFunction(test));

			if (has('host-browser')) { // test the Safari workaround for NodeList
				assert.isFalse(lang.isFunction(document.getElementsByName('html')));
				assert.isFalse(lang.isFunction(document.createElement('object')));
			}
		},

		'.isObject': function () {
			assert.isFalse(lang.isObject(true));
			assert.isFalse(lang.isObject(false));
			assert.isFalse(lang.isObject('foo'));
			/*jshint -W053 */
			assert.isTrue(lang.isObject(new String('foo')));
			assert.isTrue(lang.isObject(null));
			assert.isTrue(lang.isObject({}));
			assert.isTrue(lang.isObject([]));
			/*jshint -W009 */
			assert.isTrue(lang.isObject(new Array()));
		},

		'.isArray': function () {
			/*jshint -W009 */
			assert.isTrue(lang.isArray([]));
			assert.isTrue(lang.isArray(new Array()));
			assert.isFalse(lang.isArray({}));
		},

		'.isArrayLike': function () {
			/*jshint -W009 */
			assert.isFalse(lang.isArrayLike('thinger'));
			assert.isTrue(lang.isArrayLike(new Array()));
			assert.isFalse(lang.isArrayLike({}));
			assert.isTrue(lang.isArrayLike(arguments));
		},

		'.isString': function () {
			/*jshint -W053 */
			assert.isFalse(lang.isString(true));
			assert.isFalse(lang.isString(false));
			assert.isTrue(lang.isString('foo'));
			assert.isTrue(lang.isString(new String('foo')));
			assert.isFalse(lang.isString(null));
			assert.isFalse(lang.isString({}));
			assert.isFalse(lang.isString([]));
		},

		'.partial': function () {
			var scope = { foo: 'bar' };
			var st1;
			var st2;
			var st3;

			function thinger(arg1, arg2) {
				return [this.foo, arg1, arg2];
			}

			st1 = lang.partial(thinger);
			assert.equal('bar', st1.call(scope)[0]);
			assert.equal(undefined, st1()[0]);

			st2 = lang.partial(thinger, 'foo', 'bar');
			assert.equal('bar', st2()[2]);
			st3 = lang.partial(thinger, 'foo', 'bar');
		},

		'.partial nested': function () {
			var st1;
			var st2;

			function thinger(arg1, arg2) {
				return [arg1, arg2];
			}

			st1 = lang.partial(thinger, 'foo');
			assert.equal(undefined, st1()[1]);
			assert.equal('bar', st1('bar')[1]);

			// partials can accumulate
			st2 = lang.partial(st1, 'thud');
			assert.equal('foo', st2()[0]);
			assert.equal('thud', st2()[1]);
		},

		'.hitch': function () {
			var scope = { foo: 'bar' };
			var scope2 = { foo: 'baz' };
			var st1;
			var st2;

			function thinger() {
				return [this.foo, arguments.length];
			}

			st1 = lang.hitch(scope, thinger);
			assert.equal('bar', st1()[0]);
			assert.equal(0, st1()[1]);

			st2 = lang.hitch(scope2, thinger);
			assert.equal('baz', st2()[0]);
			assert.equal(0, st1()[1]);
			assert.equal(1, st1('blah')[1]);

			// st2 should be "scope proof"
			assert.equal('baz', st2.call(scope)[0]);
		},

		'.hitch with args': function () {
			var scope = { foo: 'bar' };
			var scope2 = { foo: 'baz' };
			var st1;
			var st2;

			function thinger() {
				return [this.foo, arguments.length];
			}

			st1 = lang.hitch(scope, thinger, 'foo', 'bar');
			assert.equal('bar', st1()[0]);
			assert.equal(2, st1()[1]);

			st2 = lang.hitch(scope2, thinger, 'foo', 'bar');
			assert.equal('baz', st2()[0]);
			assert.equal(2, st2()[1]);
		},

		'.hitch as partial': function () {
			var scope = { foo: 'bar' };
			var st1;
			var st2;

			function thinger(arg1, arg2) {
				return [this.foo, arg1, arg2];
			}

			st1 = lang.hitch(null, thinger);
			assert.equal('bar', st1.call(scope)[0]);
			assert.equal(undefined, st1()[0]);

			st2 = lang.hitch(null, thinger, 'foo', 'bar');
			assert.equal('bar', st2()[2]);
		},

		'.toArray': function () {
			var obj1 = [ 'foo', 'bar', 'spam', 'ham' ];
			var obj2;
			var div;
			var result;

			function thinger() {
				return lang._toArray(arguments);
			}

			obj2 = thinger.apply(this, obj1);
			assert.equal(obj1[0], obj2[0]);

			if (has('host-browser')) {
				// test DomCollection
				div = document.createElement('div');
				div.innerHTML = '<a href="#"">link</a>text';
				result = lang._toArray(div.childNodes);
				assert.equal(2, result.length);
			}
		},

		'.clone': function () {
			var obj1 = {
				foo: 'bar',
				answer: 42,
				jan102007: new Date(2007, 0, 10),
				baz: {
					a: null,
					b: [1, 'b', 2.3, true, false],
					c: {
						d: undefined,
						e: 99,
						f: function () { console.log(42); return 42; },
						g: /\d+/gm
					}
				},
				toString: function () { return 'meow'; }
			};

			assert.deepEqual(obj1, lang.clone(obj1));
		},

		'.delegate': function () {
			var a = {
				x: 1,
				y: function () { return 2; },
				z1: 99
			};
			var b = {
				x: 11,
				y: function () { return 12; },
				z2: 33,
				toString: function () { return 'bark!'; },
				toLocaleString: function () { return 'le bark-s!'; }
			};
			var c;

			assert.strictEqual(1, a.x);
			assert.strictEqual(2, a.y());
			assert.strictEqual(99, a.z1);

			c = lang.delegate(a, b);

			assert.strictEqual(1, a.x);
			assert.strictEqual(2, a.y());
			assert.strictEqual(99, a.z1);
			assert.strictEqual(11, c.x);
			assert.strictEqual(12, c.y());
			assert.strictEqual('bark!', c.toString());
			assert.strictEqual('le bark-s!', c.toLocaleString());
			assert.strictEqual(99, c.z1);
			assert.strictEqual(33, c.z2);
		},

		'.replace with object': function () {
			var objectContext = {
					nick: 'Bob',
					name: {
						first:  'Robert',
						middle: 'X',
						last:   'Cringely'
					}
				};
			var s1 = lang.replace('Hello, {name.first} {name.last} AKA {nick}!', objectContext);
			assert.equal('Hello, Robert Cringely AKA Bob!', s1);
		},

		'.replace with array context': function () {
			var arrayContext = ['Robert', 'X', 'Cringely'];
			var s2 = lang.replace('Hello, {0} {2}!', arrayContext);
			assert.equal('Hello, Robert Cringely!', s2);
		},

		'.replace with function': function () {
			function sum(a) {
				var t = 0;
				array.forEach(a, function (x) { t += x; });
				return t;
			}

			var s1 = lang.replace(
				'{count} payments averaging {avg} USD per payment.',
				lang.hitch(
					{ payments: [11, 16, 12] },
					function (_, key) {
						switch (key) {
							case 'count':
								return this.payments.length;
							case 'avg':
								return sum(this.payments) / this.payments.length;
						}
						return '';
					}
				));
			assert.equal('3 payments averaging 13 USD per payment.', s1);
		},

		'.replace with regex': function () {
			var s4 = lang.replace('Hello, ${0} ${2}!', ['Robert', 'X', 'Cringely'], /\$\{([^\}]+)\}/g);
			assert.equal('Hello, Robert Cringely!', s4);
		}
	});
});
