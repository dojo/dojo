dojo.provide("tests._base.json");

tests.register("tests._base.json", 
	[
		//Not testing dojo.toJson() on its own since Rhino will output the object properties in a different order.
		//Still valid json, but just in a different order than the source string.

		// take a json-compatible object, convert it to a json string, then put it back into json.
		function toAndFromJson(t){
			var testObj = {a:"a", b:1, c:"c", d:"d", e:{e1:"e1", e2:2}, f:[1,2,3], g:"g",h:{h1:{h2:{h3:"h3"}}}};

			var mirrorObj = dojo.fromJson(dojo.toJson(testObj));
			t.assertEqual("a", mirrorObj.a);
			t.assertEqual(1, mirrorObj.b);
			t.assertEqual("c", mirrorObj.c);
			t.assertEqual("d", mirrorObj.d);
			t.assertEqual("e1", mirrorObj.e.e1);
			t.assertEqual(2, mirrorObj.e.e2);
			t.assertEqual(1, mirrorObj.f[0]);
			t.assertEqual(2, mirrorObj.f[1]);
			t.assertEqual(3, mirrorObj.f[2]);
			t.assertEqual("g", mirrorObj.g);
			t.assertEqual("h3", mirrorObj.h.h1.h2.h3);
			var badJson;
			try{
				badJson = dojo.fromJson("bad json"); // this should throw an exception, and not set badJson
			}catch(e){
			}
			t.assertEqual(undefined,badJson);
		}
	]
);

