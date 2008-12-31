dojo.provide("tests._base.lang");

tests.register("tests._base.lang", 
	[
		function mixin(t){
			t.assertEqual("object", typeof dojo.mixin());
			t.assertEqual("object", typeof dojo.mixin(undefined));
			t.assertEqual("object", typeof dojo.mixin(null));
			var src = {
				foo: function(){
					t.debug("foo");
				},
				bar: "bar"
			};
			var dest = {};
			dojo.mixin(dest, src);
			t.assertEqual("function", typeof dest["foo"]);
			t.assertEqual("string", typeof dest["bar"]);
		},

		function extend(t){
			var src = {
				foo: function(){
					t.debug("foo");
				},
				bar: "bar"
			};
			function dest(){}
			dojo.extend(dest, src);
			var test = new dest();
			t.assertEqual("function", typeof test["foo"]);
			t.assertEqual("string", typeof test["bar"]);
		},

		function isFunction(t){
			t.assertTrue(dojo.isFunction(new Function()));
			t.assertTrue(dojo.isFunction(isFunction));
			if(dojo.isBrowser){ // test the Safari workaround for NodeList
				t.assertFalse(dojo.isFunction(dojo.doc.getElementsByName("html")));
			}
		},

		function isObject(t){
			t.assertFalse(dojo.isObject(true));
			t.assertFalse(dojo.isObject(false));
			t.assertFalse(dojo.isObject("foo"));
			t.assertTrue(dojo.isObject(new String("foo")));
			t.assertTrue(dojo.isObject(null));
			t.assertTrue(dojo.isObject({}));
			t.assertTrue(dojo.isObject([]));
			t.assertTrue(dojo.isObject(new Array()));
		},

		function isArray(t){
			t.assertTrue(dojo.isArray([]));
			t.assertTrue(dojo.isArray(new Array()));
			t.assertFalse(dojo.isArray({}));
		},

		function isArrayLike(t){
			t.assertFalse(dojo.isArrayLike("thinger"));
			t.assertTrue(dojo.isArrayLike(new Array()));
			t.assertFalse(dojo.isArrayLike({}));
			t.assertTrue(dojo.isArrayLike(arguments));
		},

		function isString(t){
			t.assertFalse(dojo.isString(true));
			t.assertFalse(dojo.isString(false));
			t.assertTrue(dojo.isString("foo"));
			t.assertTrue(dojo.isString(new String("foo")));
			t.assertFalse(dojo.isString(null));
			t.assertFalse(dojo.isString({}));
			t.assertFalse(dojo.isString([]));
		},

		function partial(t){
			var scope = { foo: "bar" };
			var scope2 = { foo: "baz" };
			function thinger(arg1, arg2){
				return [this.foo, arg1, arg2];
			}
			
			var st1 = dojo.partial(thinger);
			t.assertEqual("bar", st1.call(scope)[0]);
			t.assertEqual(undefined, st1()[0]);
			var st2 = dojo.partial(thinger, "foo", "bar");
			t.assertEqual("bar", st2()[2]);
			var st3 = dojo.partial(thinger, "foo", "bar");
		},

		function nestedPartial(t){
			function thinger(arg1, arg2){
				return [arg1, arg2];
			}
			
			var st1 = dojo.partial(thinger, "foo");
			t.assertEqual(undefined, st1()[1]);
			t.assertEqual("bar", st1("bar")[1]);

			// partials can accumulate
			var st2 = dojo.partial(st1, "thud");
			t.assertEqual("foo", st2()[0]);
			t.assertEqual("thud", st2()[1]);
		},

		function hitch(t){
			var scope = { foo: "bar" };
			var scope2 = { foo: "baz" };
			function thinger(){
				return [this.foo, arguments.length];
			}
			
			var st1 = dojo.hitch(scope, thinger);
			t.assertEqual("bar", st1()[0]);
			t.assertEqual(0, st1()[1]);

			var st2 = dojo.hitch(scope2, thinger);
			t.assertEqual("baz", st2()[0]);
			t.assertEqual(0, st1()[1]);
			t.assertEqual(1, st1("blah")[1]);

			// st2 should be "scope proof"
			t.assertEqual("baz", st2.call(scope)[0]);
		},

		function hitchWithArgs(t){
			var scope = { foo: "bar" };
			var scope2 = { foo: "baz" };
			function thinger(){
				return [this.foo, arguments.length];
			}
			
			var st1 = dojo.hitch(scope, thinger, "foo", "bar");
			t.assertEqual("bar", st1()[0]);
			t.assertEqual(2, st1()[1]);
			var st2 = dojo.hitch(scope2, thinger, "foo", "bar");
			t.assertEqual("baz", st2()[0]);
			t.assertEqual(2, st2()[1]);
		},

		function hitchAsPartial(t){
			var scope = { foo: "bar" };
			var scope2 = { foo: "baz" };
			function thinger(arg1, arg2){
				return [this.foo, arg1, arg2];
			}
			
			var st1 = dojo.hitch(null, thinger);
			t.assertEqual("bar", st1.call(scope)[0]);
			t.assertEqual(undefined, st1()[0]);
			var st2 = dojo.hitch(null, thinger, "foo", "bar");
			t.assertEqual("bar", st2()[2]);
			var st3 = dojo.hitch(null, thinger, "foo", "bar");
		},

		function _toArray(t){
			var obj1 = [ 'foo', 'bar', 'spam', 'ham' ];

			function thinger(){
				return dojo._toArray(arguments);
			}
			var obj2 = thinger.apply(this, obj1);
			t.assertEqual(obj1[0], obj2[0]);

			if(dojo.isBrowser){
				//test DomCollection
				var div = document.createElement('div');
				div.innerHTML="<a href='#'>link</a>text";
				var r=dojo._toArray(div.childNodes);
				t.is(2,r.length);
			}
		},
		
		function clone(t) { 
			var obj1 = {foo: 'bar', answer: 42, jan102007: new Date(2007, 0, 10), 
				baz: {
					a: null, 
					b: [
						1, "b", 2.3, true, false
						//, function(){ return 4; }, /\d+/gm
					]
				}
			}; 
			var obj2 = dojo.clone(obj1);
			t.assertEqual(obj1.foo, obj2.foo);
			t.assertEqual(obj1.answer, obj2.answer);
			t.assertEqual(obj1.jan102007, obj2.jan102007);
			t.assertEqual(obj1.baz.a, obj2.baz.a);
			for(var i = 0; i < obj1.baz.b.length; ++i){
				t.assertEqual(obj1.baz.b[i], obj2.baz.b[i]);
			}
		} 
	]
);
