dojo.provide("tests._base.window");

tests.register("tests._base.window", 
	[
		function withGlobal(t){
			var arg1, arg2, innerThis, innerGlobal, innerDoc, finished,
				globalObj = {test: "myGlobal", document: {test: "myDoc"}},
				thisObj = {test: "myThis"};

			try {
				dojo.withGlobal(globalObj, function(a1, a2){
					arg1 = a1;
					arg2 = a2;
					innerThis = this.test;
					innerGlobal = dojo.global.test;
					innerDoc = dojo.doc.test
					finished = true;
				}, thisObj, [1, 2])
			}catch(e){}

			t.assertTrue(finished);
			t.assertEqual(1, arg1);
			t.assertEqual(2, arg2);
			t.assertEqual("myThis", innerThis);
			t.assertEqual("myGlobal", innerGlobal);
			t.assertEqual("myDoc", innerDoc);
		},

		function withDoc(t){
			var arg1, arg2, innerThis, innerGlobal, innerDoc, finished,
				docObj = {test: "myDoc"},
				thisObj = {test: "myThis"};

			try {
				dojo.withDoc(docObj, function(a1, a2){
					arg1 = a1;
					arg2 = a2;
					innerThis = this.test;
					innerDoc = dojo.doc.test
					finished = true;
				}, thisObj, [1, 2])
			}catch(e){}

			t.assertTrue(finished);
			t.assertEqual(1, arg1);
			t.assertEqual(2, arg2);
			t.assertEqual("myThis", innerThis);
			t.assertEqual("myDoc", innerDoc);
		}
	]
);

