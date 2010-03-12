dojo.provide("tests._base.Deferred");

var delay = function(ms){
	var d = new dojo.Deferred();
	setTimeout(function(){
		d.progress(0.5);
	},ms/2);
	setTimeout(function(){
		d.resolve();
	},ms);
	return d.promise;
};
doh.register("tests._base.Deferred", 
	[

		function callback(t){
			var nd = new dojo.Deferred();
			var cnt = 0;
			nd.addCallback(function(res){
				doh.debug("debug from dojo.Deferred callback");
				return res;
			});
			nd.addCallback(function(res){
				// t.debug("val:", res);
				cnt+=res;
				return cnt;
			});
			nd.callback(5);
			// t.debug("cnt:", cnt);
			t.assertEqual(cnt, 5);
		},

		function callback_extra_args(t){
			var nd = new dojo.Deferred();
			var cnt = 0;
			nd.addCallback(dojo.global, function(base, res){ cnt+=base; cnt+=res; return cnt; }, 30);
			nd.callback(5);
			t.assertEqual(cnt, 35);
		},

		function errback(t){
			var nd = new dojo.Deferred();
			var cnt = 0;
			nd.addErrback(function(val){
				return ++cnt;
			});
			nd.errback();
			t.assertEqual(cnt, 1);
		},

		function callbackTwice(t){
			var nd = new dojo.Deferred();
			var cnt = 0;
			nd.addCallback(function(res){
				return ++cnt;
			});
			nd.callback();
			t.assertEqual(cnt, 1);
			var thrown = false;
			try{
				nd.callback();
			}catch(e){
				thrown = true;
			}
			t.assertTrue(thrown);
		},

		function addBoth(t){
			var nd = new dojo.Deferred();
			var cnt = 0;
			nd.addBoth(function(res){
				return ++cnt;
			});
			nd.callback();
			t.assertEqual(cnt, 1);

			// nd.callback();
			// t.debug(cnt);
			// t.assertEqual(cnt, 1);
		},

		function callbackNested(t){
			var nd = new dojo.Deferred();
			var nestedReturn = "yellow";
			nd.addCallback(function(res){
				nd.addCallback(function(res2){
					nestedReturn = res2;
				});
				return "blue";
			});
			nd.callback("red");
			t.assertEqual("blue", nestedReturn);
		},
		function simpleThen(t){
			var td = new doh.Deferred();
			delay().then(function(){
				td.callback(true);
			});
			return td;
		},
		function thenChaining(t){
			var td = new doh.Deferred();
			var p = delay();
			var p2 = p.then(function(){
				return 1;
			});
			p3 = p2.then(function(){
				return 2;
			});
			p3.then(function(){
				p2.then(function(v){
					t.assertEqual(v, 1);
					p3.then(function(v){
						t.assertEqual(v, 2);
						td.callback(true);
					});
				});
			});
			return td;
		},
		function simpleWhen(t){
			var td = new doh.Deferred();
			dojo.when(delay(), function(){
				td.callback(true);
			});
			return td;
		},
		function progress(t){
			var td = new doh.Deferred();
			var percentDone;
			dojo.when(delay(), function(){
				t.is(percentDone, 0.5);
				td.callback(true);
			},function(){},
			function(completed){
				percentDone = completed;
			});
			return td;
		},
		function errorHandler(t){
			var def = new dojo.Deferred();
			var handledError;
			dojo.config.deferredOnError = function(e){
				handledError = e;
			};
			def.reject(new Error("test"));
			t.t(handledError instanceof Error);
		}
	]
);
