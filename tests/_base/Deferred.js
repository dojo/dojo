dojo.provide("tests._base.Deferred");

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
		}
	]
);
