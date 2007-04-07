dojo.provide("tests._base.connect");

hub = function() {
}

bad = function() {
	failures++;
	//logMe('BAD - I should have been disconnected');
}

good = function() {
	//logMe("good - I'm supposed to be here");
}

markAndSweepTest = function(iterations) {
	//console.group('markAndSweepTest(' + iterations + ');');
	var marked = [];
	// connections
	//var t = new Date().getTime();
	for (var i=0;i<iterations;i++) {
		if (Math.random() < 0.5) {
			marked.push(dojo.connect(null, 'hub', null, bad));
		} else {
			dojo.connect(null, 'hub', null, 'good');
		}
	}
	//t = new Date().getTime() - t;
	//logMe('made ' + i + ' connections with ' + marked.length + ' marked for disconnection in ' + t + 'ms.');
	// Randomizing markers (takes a long time if the count is too high)
	if (i < Math.pow(10, 4)) {
		//var t = new Date().getTime();
		var rm = [ ];
		while (marked.length) {
			var m = Math.floor(Math.random() * marked.length);
			rm.push(marked[m]);
			marked.splice(m, 1);
		}
		marked = rm;				
		//t = new Date().getTime() - t;
		//logMe('randomized markers in ' + t + 'ms.');
	} 
	//else logMe('skipping marker randomization due to large set.');
	// disconnections
	//var t = new Date().getTime();
	for (var m=0; m<marked.length; m++) {
		dojo.disconnect(null, 'hub', marked[m]);
	}
	//t = new Date().getTime() - t;
	//logMe('performed disconnects in ' + t + 'ms.');
	// test
	failures = 0;
	//var t = new Date().getTime();
	hub();
	//t = new Date().getTime() - t;
	//logMe('invoked hub in ' + t + 'ms with ' + failures + ' failed disconnects over ' + i + ' iterations.');
	// done
	//console.groupEnd();
	return failures;
}

tests.register("tests._base.connect",
	[
		function smokeTest(t){
			var ok = false, foo = { foo: function(){} };
			dojo.connect(foo, "foo", null, function(){ok=true});
			foo.foo();
			t.is(ok, true);
		},
		function smokeTest2(t){
			var ok = false, foo = { foo: function(){}, ok: function(){ok=true} };
			dojo.connect(foo, "foo", foo, "ok");
			foo.foo();
			t.is(ok, true);
		},
		function simpleTest(t) {
			var out = '';
			var obj = {
				foo: function() {
					out += 'foo';
				},
				bar: function() {
					out += 'bar';
				},
				baz: function() {
					out += 'baz';
				}
			};
			//
			var foobar = dojo.connect(obj, "foo", obj, "bar");
			dojo.connect(obj, "bar", obj, "baz");
			//
			out = '';
			obj.foo();
			t.is('foobarbaz', out);
			//
			out = '';
			obj.bar();
			t.is('barbaz', out);
			//
			out = '';
			obj.baz();
			t.is('baz', out);
			//
			dojo.connect(obj, "foo", obj, "baz");
			dojo.disconnect(obj, "foo", foobar);
			//
			out = '';
			obj.foo();
			t.is('foobaz', out);
			//
			out = '';
			obj.bar();
			t.is('barbaz', out);
			//
			out = '';
			obj.baz();
			t.is('baz', out);
		},
		function hubConnectDisconnect1000(t){
			t.is(markAndSweepTest(1000), 0);
		},
		function hubConnectDisconnect10000(t){
			t.is(markAndSweepTest(10000), 0);
		}
	]
);
