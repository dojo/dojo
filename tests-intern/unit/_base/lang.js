define([
	'intern!object',
	'intern/chai!assert',
	"intern/dojo/_base/array",
	"dojo/_base/lang",
	"intern/dojo/has",
	'intern/dojo/has!host-browser?intern/dojo/domReady!:'
], function (registerSuite, assert, array, lang, has) {

	registerSuite({
		name: 'dojo/_base/lang',

		'.mixin': function () {
			assert.isObject(lang.mixin());
			assert.isObject(lang.mixin(undefined));
			assert.isObject(lang.mixin(null));
			var src = {
				foo: function(){
				},
				bar: "bar"
			};
			var dest = {};
			lang.mixin(dest, src);
			assert.isFunction(dest["foo"]);
			assert.isString(dest["bar"]);
		},
		'.extend': function () {
			var src = {
				foo: function(){
				},
				bar: "bar"
			};
			function dest(){}
			lang.extend(dest, src);
			var test = new dest();
			assert.isFunction(test["foo"]);
			assert.isString(test["bar"]);
		},
		'.isFunction': function () {
			assert.isTrue(lang.isFunction(new Function()));
			assert.isTrue(lang.isFunction(this.test));

			if (has('host-browser')) { // test the Safari workaround for NodeList
				assert.isFalse(lang.isFunction(document.getElementsByName("html")));
				assert.isFalse(lang.isFunction(document.createElement("object")));
			}
		},
		'.isObject': function () {
			assert.isFalse(lang.isObject(true));
			assert.isFalse(lang.isObject(false));
			assert.isFalse(lang.isObject("foo"));
			assert.isTrue(lang.isObject(new String("foo")));
			assert.isTrue(lang.isObject(null));
			assert.isTrue(lang.isObject({}));
			assert.isTrue(lang.isObject([]));
			assert.isTrue(lang.isObject(new Array()));
		},
		'.isArray': function () {
			assert.isTrue(lang.isArray([]));
			assert.isTrue(lang.isArray(new Array()));
			assert.isFalse(lang.isArray({}));
		},
		'.isArrayLike': function () {
			assert.isFalse(lang.isArrayLike("thinger"));
			assert.isTrue(lang.isArrayLike(new Array()));
			assert.isFalse(lang.isArrayLike({}));
			assert.isTrue(lang.isArrayLike(arguments));
		},
		'.isString': function () {
			assert.isFalse(lang.isString(true));
			assert.isFalse(lang.isString(false));
			assert.isTrue(lang.isString("foo"));
			assert.isTrue(lang.isString(new String("foo")));
			assert.isFalse(lang.isString(null));
			assert.isFalse(lang.isString({}));
			assert.isFalse(lang.isString([]));
		},
		'.partial' : {
			'partial': function () {
				var scope = { foo: "bar" };
				var scope2 = { foo: "baz" };
				function thinger(arg1, arg2){
					return [this.foo, arg1, arg2];
				}

				var st1 = lang.partial(thinger);
				assert.strictEqual(st1.call(scope)[0], "bar");
				assert.isUndefined(st1()[0]);
				var st2 = lang.partial(thinger, "foo", "bar");
				assert.strictEqual(st2()[2], "bar");

			},
			'nested partial': function () {
				function thinger(arg1, arg2){
					return [arg1, arg2];
				}

				var st1 = lang.partial(thinger, "foo");
				assert.isUndefined(st1()[1]);
				assert.strictEqual(st1("bar")[1], "bar");

				// partials can accumulate
				var st2 = lang.partial(st1, "thud");
				assert.strictEqual(st2()[0], "foo");
				assert.strictEqual(st2()[1], "thud");
			}
		},
		'.hitch' : {
			'hitch': function () {
				var scope = { foo: "bar" };
				var scope2 = { foo: "baz" };
				function thinger(){
					return [this.foo, arguments.length];
				}

				var st1 = lang.hitch(scope, thinger);
				assert.strictEqual(st1()[0], "bar");
				assert.strictEqual(st1()[1], 0);

				var st2 = lang.hitch(scope2, thinger);
				assert.strictEqual(st2()[0], "baz");
				assert.strictEqual(st1()[1], 0);
				assert.strictEqual(st1("blah")[1], 1);

				// st2 should be "scope proof"
				assert.strictEqual(st2.call(scope)[0], "baz");
			},
			'hitch with args': function () {
				var scope = { foo: "bar" };
				var scope2 = { foo: "baz" };
				function thinger(){
					return [this.foo, arguments.length];
				}

				var st1 = lang.hitch(scope, thinger, "foo", "bar");
				assert.strictEqual(st1()[0], "bar");
				assert.strictEqual(st1()[1], 2);
				var st2 = lang.hitch(scope2, thinger, "foo", "bar");
				assert.strictEqual(st2()[0], "baz");
				assert.strictEqual(st2()[1], 2);
			},
			'hitch as partial': function () {
				var scope = { foo: "bar" };
				var scope2 = { foo: "baz" };
				function thinger(arg1, arg2){
					return [this.foo, arg1, arg2];
				}

				var st1 = lang.hitch(null, thinger);
				assert.strictEqual(st1.call(scope)[0], "bar");
				assert.isUndefined(st1()[0]);
				var st2 = lang.hitch(null, thinger, "foo", "bar");
				assert.strictEqual(st2()[2], "bar");
			}
		},
		'._toArray': function () {
			var obj1 = [ 'foo', 'bar', 'spam', 'ham' ];

			function thinger(){
				return lang._toArray(arguments);
			}
			var obj2 = thinger.apply(this, obj1);
			assert.deepEqual(obj2[0], obj1[0]);

			if (has('host-browser')) {
				//test DomCollection
				var div = document.createElement('div');
				div.innerHTML="<a href='#'>link</a>text";
				var r=lang._toArray(div.childNodes);
				assert.strictEqual(r.length, 2);
			}
		},
		'.clone': function () {
			var obj1 = {
				foo: 'bar',
				answer: 42,
				jan102007: new Date(2007, 0, 10),
				baz: {
					a: null,
					b: [1, "b", 2.3, true, false],
					c: {
						d: undefined,
						e: 99,
						f: function(){ return 42; },
						g: /\d+/gm
					}
				},
				toString: function(){ return "meow"; }
			};
			var obj2 = lang.clone(obj1);
			assert.deepEqual(obj2, obj1);
		},
		'.delegate': function () {
			var a = {
				x: 1,
				y: function(){ return 2; },
				z1: 99
			};
			var b = {
				x: 11,
				y: function(){ return 12; },
				z2: 33,
				toString: function(){ return "bark!"; },
				toLocaleString: function(){ return "le bark-s!"; }
			};
			assert.strictEqual(a.x, 1);
			assert.strictEqual(a.y(), 2);
			assert.strictEqual(a.z1, 99);
			var c = lang.delegate(a, b);
			assert.strictEqual(a.x, 1);
			assert.strictEqual(a.y(), 2);
			assert.strictEqual(a.z1, 99);
			assert.strictEqual(c.x, 11);
			assert.strictEqual(c.y(), 12);
			assert.strictEqual(c.toString(), "bark!");
			assert.strictEqual(c.toLocaleString(), "le bark-s!");
			assert.strictEqual(c.z1, 99);
			assert.strictEqual(c.z2, 33);
		},
		'.replace': function () {
			var s1 = lang.replace("Hello, {name.first} {name.last} AKA {nick}!",
				{
					nick: "Bob",
					name: {
						first:  "Robert",
						middle: "X",
						last:   "Cringely"
					}
				});
			assert.strictEqual(s1, "Hello, Robert Cringely AKA Bob!");

			var s2 = lang.replace("Hello, {0} {2}!", ["Robert", "X", "Cringely"]);
			assert.strictEqual(s2, "Hello, Robert Cringely!");

			function sum(a){
				var t = 0;
				array.forEach(a, function(x){ t += x; });
				return t;
			}
			var s3 = lang.replace(
				"{count} payments averaging {avg} USD per payment.",
				lang.hitch(
					{ payments: [11, 16, 12] },
					function(_, key){
						switch(key){
							case "count": return this.payments.length;
							case "min":   return Math.min.apply(Math, this.payments);
							case "max":   return Math.max.apply(Math, this.payments);
							case "sum":   return sum(this.payments);
							case "avg":   return sum(this.payments) / this.payments.length;
						}
						return "";
					}
				));
			assert.strictEqual(s3, "3 payments averaging 13 USD per payment.");

			var s4 = lang.replace("Hello, ${0} ${2}!", ["Robert", "X", "Cringely"], /\$\{([^\}]+)\}/g);
			assert.strictEqual(s4, "Hello, Robert Cringely!");
		}
	});
});
