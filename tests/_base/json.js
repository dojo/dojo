dojo.provide("tests._base.json");

tests.register("tests._base.json", 
	[
		// convert a moderately complex object to json in both dense and pretty modes
		function toJson(t){
			var testObj = {a:"a", b:1, c:"c", d:"d", e:{e1:"e1", e2:2}, f:[1,2,3], g:"g",h:{h1:{h2:{h3:"h3"}}}};
			var denseOutput = '{"a":"a","b":1,"c":"c","d":"d","e":{"e1":"e1","e2":2},"f":[1,2,3],"g":"g","h":{"h1":{"h2":{"h3":"h3"}}}}';
			var prettyOutput = '{\n\t"a":"a",\n\t"b":1,\n\t"c":"c",\n\t"d":"d",\n\t"e":{\n\t\t"e1":"e1",\n\t\t"e2":2\n\t},\n\t"f":[\n\t\t1,\n\t\t2,\n\t\t3\n\t],\n\t"g":"g",\n\t"h":{\n\t\t"h1":{\n\t\t\t"h2":{\n\t\t\t\t"h3":"h3"\n\t\t\t}\n\t\t}\n\t}\n}';
			dojo.toJsonIndentStr = "\t";
			
			t.assertTrue(dojo.toJson(testObj) == denseOutput);
			t.assertTrue(dojo.toJson(testObj, true) == prettyOutput);
		},

		// take some json code, put convert it to objects, then put it back into json
		function toAndFromJson(t){
			var testObj = {a:"a", b:1, c:"c", d:"d", e:{e1:"e1", e2:2}, f:[1,2,3], g:"g",h:{h1:{h2:{h3:"h3"}}}};
			var denseOutput = '{"a":"a","b":1,"c":"c","d":"d","e":{"e1":"e1","e2":2},"f":[1,2,3],"g":"g","h":{"h1":{"h2":{"h3":"h3"}}}}';
			var prettyOutput = '{\n\t"a":"a",\n\t"b":1,\n\t"c":"c",\n\t"d":"d",\n\t"e":{\n\t\t"e1":"e1",\n\t\t"e2":2\n\t},\n\t"f":[\n\t\t1,\n\t\t2,\n\t\t3\n\t],\n\t"g":"g",\n\t"h":{\n\t\t"h1":{\n\t\t\t"h2":{\n\t\t\t\t"h3":"h3"\n\t\t\t}\n\t\t}\n\t}\n}';
			dojo.toJsonIndentStr = "\t";
			
			t.assertTrue(dojo.toJson(dojo.fromJson(denseOutput)) == denseOutput);
			t.assertTrue(dojo.toJson(dojo.fromJson(prettyOutput), true) == prettyOutput);
		}
	]
);

