dojo.provide("tests._base.array");

tests.register("tests._base.array", 
	[
		function testIndexOf(t){
			var foo = new Array(128, 256, 512);
			var bar = new Array("aaa", "bbb", "ccc");
			
			t.assertTrue(dojo.indexOf([45, 56, 85], 56) == 1);
			t.assertTrue(dojo.indexOf([Number, String, Date], String) == 1);
			t.assertTrue(dojo.indexOf(foo, foo[1]) == 1);
			t.assertTrue(dojo.indexOf(foo, foo[2]) == 2);
			t.assertTrue(dojo.indexOf(bar, bar[1]) == 1);
			t.assertTrue(dojo.indexOf(bar, bar[2]) == 2);
			
			foo.push(bar);
			t.assertTrue(dojo.indexOf(foo, bar) == 3);
		},

		function testForEach(t){
			var foo = new Array(128, "bbb", 512);
			var ok = true;
			dojo.forEach(foo, function(elt, idx, array){
				switch (idx) {
					case 0: ok = (elt==128); break;
					case 1: ok = (elt=="bbb"); break;
					case 2: ok = (elt==512); break;
					default: ok = false;
				}
				t.assertTrue(ok);
			});
			// FIXME: test NodeList?
			var bar = 'abc';
			dojo.forEach(bar, function(elt, idx, array){
				switch (idx) {
					case 0: ok = (elt=='a'); break;
					case 1: ok = (elt=='b'); break;
					case 2: ok = (elt=='c'); break;
					default: ok = false;
				}
				t.assertTrue(ok);
			});
		},

		function testEvery(t){
			var foo = new Array(128, "bbb", 512);
			var ok = true;
			var result = true;
			dojo.every(foo, function(elt, idx, array){
				switch (idx) {
					case 0: ok = (elt==128); result = true; break;
					case 1: ok = (elt=="bbb"); result = false; break;
					case 2: ok = false; break;
					default: ok = false;
				}
				t.assertTrue(ok);
				return result;
			});
			// FIXME: test NodeList?
			var bar = 'abc';
			dojo.every(bar, function(elt, idx, array){
				switch (idx) {
					case 0: ok = (elt=='a'); result = true; break;
					case 1: ok = (elt=='b'); result = false; break;
					case 2: ok = false; break;
					default: ok = false;
				}
				t.assertTrue(ok);
				return result;
			});
		},

		function testSome(t){
			var foo = new Array(128, "bbb", 512);
			var ok = true;
			var result = false;
			dojo.some(foo, function(elt, idx, array){
				switch (idx) {
					case 0: ok = (elt==128); break;
					case 1: ok = (elt=="bbb"); return true; break;
					case 2: ok = false; break;
					default: ok = false;
				}
				t.assertTrue(ok);
			});
			// FIXME: test NodeList?
			var bar = 'abc';
			dojo.some(bar, function(elt, idx, array){
				switch (idx) {
					case 0: ok = (elt=='a'); break;
					case 1: ok = (elt=='b'); return true; break;
					case 2: ok = false; break;
					default: ok = false;
				}
				t.assertTrue(ok);
			});
		}
	]
);

