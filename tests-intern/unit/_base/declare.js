define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/aspect',
	'intern/dojo/_base/lang',
	'intern/dojo/_base/kernel',
	'dojo/_base/declare'
], function (
	registerSuite,
	assert,
	aspect,
	lang,
	kernel,
	declare
) {

	registerSuite({
		name: 'dojo/_base/declare',

		/*
		* There is a bug in lang.setObject() which prevents declare from extending a
		* global which has been set to undefined. To work around this problem we
		* are setting window.tests to an empty object before each test and once all
		* the tests have completed we set it to undefined.
		*/
		beforeEach: function () {
			window.tests = {};
		},

		after: function () {
			window.tests = undefined;
		},

		afterEach: function () {
			window.testsFoo = undefined;
		},

		'smoke test 1': function () {
			declare('tests._base.declare.tmp', null);
			declare('testsFoo', null);
			assert.isFunction(window.tests._base.declare.tmp);
			assert.isFunction(window.testsFoo);
		},

		'smoke test 2': function () {
			var test;

			declare('tests._base.declare.foo', null, {
				foo: 'thonk'
			});

			test = new window.tests._base.declare.foo();
			assert.equal(test.foo, 'thonk');

			declare('testsFoo', null, {
				foo: 'thonk'
			});

			test = new window.testsFoo();
			assert.equal(test.foo, 'thonk');
		},

		'smoke test with Ctor': function () {
			var test;

			declare('tests._base.declare.fooBar', null, {
				constructor: function () {
					this.foo = 'blah';
				},
				foo: 'thonk'
			});
			test = new window.tests._base.declare.fooBar();
			assert.equal(test.foo, 'blah');
		},

		'smoke test compact args': function () {
			var test;
			declare('tests._base.declare.fooBar2', null, {
				foo: 'thonk'
			});
			test = new window.tests._base.declare.fooBar2();
			assert.equal(test.foo, 'thonk');
		},

		'subclass': function () {
			var test;
			declare('tests._base.declare.tmp3', null, {
				foo: 'thonk'
			});
			declare('tests._base.declare.tmp4', window.tests._base.declare.tmp3);
			test = new window.tests._base.declare.tmp4();
			assert.equal(test.foo, 'thonk');
		},

		'subclass with Ctor': function () {
			var test;
			declare('tests._base.declare.tmp5', null, {
				constructor: function () {
					this.foo = 'blah';
				},
				foo: 'thonk'
			});
			declare('tests._base.declare.tmp6', window.tests._base.declare.tmp5);
			test = new window.tests._base.declare.tmp6();
			assert.instanceOf(test, window.tests._base.declare.tmp5);
		},

		'mixin subclass': function () {
			var test;
			declare('tests._base.declare.tmp7', null, {
				foo: 'thonk'
			});
			declare('tests._base.declare.tmp8', null, {
				constructor: function () {
					this.foo = 'blah';
				}
			});
			test = new window.tests._base.declare.tmp8();
			assert.equal(test.foo, 'blah');
			declare('tests._base.declare.tmp9',
				[
					window.tests._base.declare.tmp7, // prototypal
					window.tests._base.declare.tmp8  // mixin
				]);
			test = new window.tests._base.declare.tmp9();
			assert.equal(test.foo, 'blah');
			assert.instanceOf(test, window.tests._base.declare.tmp7);
		},

		'super class ref': function () {
			var test;
			declare('tests._base.declare.tmp10', null, {
				foo: 'thonk'
			});
			declare('tests._base.declare.tmp11', window.tests._base.declare.tmp10, {
				constructor: function () {
					this.foo = 'blah';
				}
			});
			test = new window.tests._base.declare.tmp11();
			assert.equal(test.foo, 'blah');
			assert.equal(window.tests._base.declare.tmp11.superclass.foo, 'thonk');
		},

		'inherited call': function () {
			var foo = 'xyzzy';
			var test;
			declare('tests._base.declare.tmp12', null, {
				foo: 'thonk',
				bar: function (arg1, arg2) {
					if (arg1) {
						this.foo = arg1;
					}
					if (arg2) {
						foo = arg2;
					}
				}
			});
			declare('tests._base.declare.tmp13', window.tests._base.declare.tmp12, {
				constructor: function () {
					this.foo = 'blah';
				}
			});
			test = new window.tests._base.declare.tmp13();
			assert.equal(test.foo, 'blah');
			assert.equal(foo, 'xyzzy');
			test.bar('zot');
			assert.equal(test.foo, 'zot');
			assert.equal(foo, 'xyzzy');
			test.bar('trousers', 'squiggle');
			assert.equal(test.foo, 'trousers');
			assert.equal(foo, 'squiggle');
		},

		'inherited explicit call': function () {
			var foo = 'xyzzy';
			var test;
			declare('tests._base.declare.tmp14', null, {
				foo: 'thonk',
				bar: function (arg1, arg2) {
					if (arg1) {
						this.foo = arg1;
					}
					if (arg2) {
						foo = arg2;
					}
				}
			});
			declare('tests._base.declare.tmp15', window.tests._base.declare.tmp14, {
				constructor: function () {
					this.foo = 'blah';
				},
				bar: function (arg1, arg2) {
					this.inherited('bar', arguments, [arg2, arg1]);
				},
				baz: function () {
					window.tests._base.declare.tmp15.superclass.bar.apply(this, arguments);
				}
			});
			test = new window.tests._base.declare.tmp15();
			assert.equal(test.foo, 'blah');
			assert.equal(foo, 'xyzzy');
			test.baz('zot');
			assert.equal(test.foo, 'zot');
			assert.equal(foo, 'xyzzy');
			test.bar('trousers', 'squiggle');
			assert.equal(test.foo, 'squiggle');
			assert.equal(foo, 'trousers');
		},

		'inherited with mixin calls': function () {
			var test;
			declare('tests._base.declare.tmp16', null, {
				foo: '',
				bar: function () {
					this.foo += 'tmp16';
				}
			});
			declare('tests._base.declare.mixin16', null, {
				bar: function () {
					this.inherited(arguments);
					this.foo += '.mixin16';
				}
			});
			declare('tests._base.declare.mixin17', window.tests._base.declare.mixin16, {
				bar: function () {
					this.inherited(arguments);
					this.foo += '.mixin17';
				}
			});
			declare('tests._base.declare.tmp17', [
				window.tests._base.declare.tmp16,
				window.tests._base.declare.mixin17
			], {
				bar: function () {
					this.inherited(arguments);
					this.foo += '.tmp17';
				}
			});
			test = new window.tests._base.declare.tmp17();
			test.bar();
			assert.equal(test.foo, 'tmp16.mixin16.mixin17.tmp17');
		},

		'mixin preamble': function () {
			var passed = false;
			var test;
			declare('tests._base.declare.tmp16', null);
			test = new window.tests._base.declare.tmp16({
				preamble: function () {
					passed = true;
				}
			});
			assert.isTrue(passed);
		},

		'basic mixin': function () {
			// testing if a plain Class-like object can be inherited
			// by declare
			var test;
			var wasCalled = false;

			function Thing() { }

			Thing.prototype.method = function () {
				wasCalled = true;
			};

			declare('tests.Thinger', Thing, {
				method: function () {
					this.inherited(arguments);
				}
			});

			test = new window.tests.Thinger();
			test.method();
			assert.isTrue(wasCalled, 'expected method to be called');
		},

		'mutated methods': function () {
			// testing if methods can be mutated (within a reason)
			declare('tests._base.declare.tmp18', null, {
				constructor: function () { this.clear(); },
				clear: function () { this.flag = 0; },
				foo: function () { ++this.flag; },
				bar: function () { ++this.flag; },
				baz: function () { ++this.flag; }
			});
			declare('tests._base.declare.tmp19', window.tests._base.declare.tmp18, {
				foo: function () { ++this.flag; this.inherited(arguments); },
				bar: function () { ++this.flag; this.inherited(arguments); },
				baz: function () { ++this.flag; this.inherited(arguments); }
			});
			var x = new window.tests._base.declare.tmp19();
			// smoke tests
			assert.equal(x.flag, 0);
			x.foo();
			assert.equal(x.flag, 2);
			x.clear();
			assert.equal(x.flag, 0);
			var a = 0;
			// aspect.after() on a prototype method
			aspect.after(window.tests._base.declare.tmp19.prototype, 'foo', function () { a = 1; });
			x.foo();
			assert.equal(x.flag, 2);
			assert.equal(a, 1);
			x.clear();
			a = 0;
			// extra chaining
			var old = window.tests._base.declare.tmp19.prototype.bar;
			window.tests._base.declare.tmp19.prototype.bar = function () {
				a = 1;
				++this.flag;
				old.call(this);
			};
			x.bar();
			assert.equal(x.flag, 3);
			assert.equal(a, 1);
			x.clear();
			a = 0;
			// replacement
			window.tests._base.declare.tmp19.prototype.baz = function () {
				a = 1;
				++this.flag;
				this.inherited('baz', arguments);
			};
			x.baz();
			assert.equal(x.flag, 2);
			assert.equal(a, 1);
		},

		'modified instance': function () {
			var stack;
			declare('tests._base.declare.tmp20', null, {
				foo: function () { stack.push(20); }
			});
			declare('tests._base.declare.tmp21', null, {
				foo: function () {
					this.inherited(arguments);
					stack.push(21);
				}
			});
			declare('tests._base.declare.tmp22', window.tests._base.declare.tmp20, {
				foo: function () {
					this.inherited(arguments);
					stack.push(22);
				}
			});
			declare('tests._base.declare.tmp23', [
				window.tests._base.declare.tmp20,
				window.tests._base.declare.tmp21
			], {
				foo: function () {
					this.inherited(arguments);
					stack.push(22);
				}
			});
			var a = new window.tests._base.declare.tmp22();
			var b = new window.tests._base.declare.tmp23();
			var c = {
				foo: function () {
					this.inherited('foo', arguments);
					stack.push('INSIDE C');
				}
			};
			stack = [];
			a.foo();
			assert.deepEqual(stack, [20, 22]);

			stack = [];
			b.foo();
			assert.deepEqual(stack, [20, 21, 22]);

			lang.mixin(a, c);
			lang.mixin(b, c);

			stack = [];
			a.foo();
			assert.deepEqual(stack, [20, 22, 'INSIDE C']);

			stack = [];
			b.foo();
			assert.deepEqual(stack, [20, 21, 22, 'INSIDE C']);
		},

		'duplicated base': function () {
			var stack;
			var tmp;
			var A = declare(null, {
				constructor: function () {
					stack.push(1);
				}
			});
			var B = declare([A, A, A], {
				constructor: function () {
					stack.push(2);
				}
			});
			stack = [];
			tmp = new A();
			assert.deepEqual(stack, [1]);
			stack = [];
			tmp = new B();
			assert.deepEqual(stack, [1, 2]);
		},

		'indirectly duplicated base': function () {
			var stack;
			var tmp;
			var A = declare(null, {
				constructor: function () {
					stack.push(1);
				}
			});
			var B = declare(A, {
				constructor: function () {
					stack.push(2);
				}
			});
			var C = declare([A, B], {
				constructor: function () {
					stack.push(3);
				}
			});
			var D = declare([B, A], {
				constructor: function () {
					stack.push(4);
				}
			});
			stack = [];
			tmp = new C();
			assert.deepEqual(stack, [1, 2, 3]);
			stack = [];
			tmp = new D();
			assert.deepEqual(stack, [1, 2, 4]);
		},

		'wrong multiple inheritance': function () {
			var stack;
			var tmp;
			var A = declare([], {
				constructor: function () {
					stack.push(1);
				}
			});
			var B = declare([A], {
				constructor: function () {
					stack.push(2);
				}
			});
			stack = [];
			tmp = new A();
			assert.deepEqual(stack, [1]);
			stack = [];
			tmp = new B();
			assert.deepEqual(stack, [1, 2]);
		},

		'impossible bases': function () {
			var A = declare(null);
			var B = declare(null);
			var C = declare([A, B]);
			var D = declare([B, A]);
			var E;

			var flag = false;
			try {
				E = declare([C, D]);
			} catch (e) {
				flag = true;
			}
			assert.isTrue(flag);
		},

		'no new': function () {
			/*jshint camelcase: false */
			// all of the classes I create will use this as their
			// pseudo-constructor function
			function noNewConstructor() {
				this.noNew_Value = 'instance value';
			}

			var g = kernel.global;
			// this value will remain unchanged if the code for
			// calling a constructor without 'new' works correctly.
			g.noNew_Value = 'global value';

			// perform the actual test
			function noNewTest(cls) {
				// call class function without new
				var obj = cls('instance value');
				assert.equal(obj.noNew_Value, 'instance value');
				assert.equal(g.noNew_Value, 'global value');
			}

			// There are three different functions that might be
			// created by declare(), so I need to test all
			// three.

			// 1. Class with manual-chained constructor
			noNewTest(
				declare(null, {
					constructor: noNewConstructor,
					'-chains-': {constructor: 'manual'}
				})
			);

			// 2. Class with no superclasses
			var A = declare(null, {
				constructor: noNewConstructor
			});
			noNewTest(A);

			// 3. Class with at least one superclass
			noNewTest(declare(A));

			// Make sure multiple inheritance call works
			var B = declare(A);
			var C = declare(null, { ctest: function () { return true; } });
			var D = declare([A, B, C], { dtest: function () { return true; } });
			noNewTest(D);
			// make sure I get the test functions from
			// all superclasses
			var d = D();
			assert.isTrue(d.ctest());
			assert.isTrue(d.dtest());

			// Make sure call through an object works
			var noNewClasses = {
				D: D,
				noNew_Value: 'unchanged'
			};
			var obj = noNewClasses.D();
			assert.equal(obj.noNew_Value, 'instance value');
			assert.equal(noNewClasses.noNew_Value, 'unchanged');
		},

		'create subclass': function () {
			var A = declare(null, {
				foo: 'thonk'
			});
			var B = declare(null, {
			});
			var C = declare(null, {
				bar: 'thonk'
			});
			var D1 = A.createSubclass([B, C], {
				constructor: function () {
					this.foo = 'blah';
				}
			});
			var D2 = A.createSubclass([B, C]);
			var d1 = new D1();
			var d2 = new D2();
			assert.equal(d1.foo, 'blah');
			assert.equal(d2.foo, 'thonk');
			assert.equal(d1.bar, 'thonk');
			assert.equal(d2.bar, 'thonk');
		}
		// TODO: there are still some permutations to test like:
		//	- ctor arguments
		//	- multi-level inheritance + L/R conflict checks
	});
});
