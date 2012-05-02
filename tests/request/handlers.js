define(["doh/main", "dojo/request/handlers", "dojo/_base/kernel", "dojo/json"], function(doh, handlers, kernel, JSON){
	doh.register("tests.request.handlers", [
		function textContentHandler(t){
			var response = handlers({
				text: "foo bar baz ",
				options: {}
			});

			t.is("foo bar baz ", response.data);
		},
		function jsonContentHandler(t){
			var jsonObj = {
				foo: "bar",
				baz: [
					{ thonk: "blarg" },
					"xyzzy!"
				]
			};
			var responseData = handlers({
				text: JSON.stringify(jsonObj),
				options: {
					handleAs: "json"
				}
			});
			t.is(jsonObj, responseData.data);
		},
		function jsContentHandler(t){
			var jsonObj = {
				foo: "bar",
				baz: [
					{ thonk: "blarg" },
					"xyzzy!"
				]
			};
			var responseData = handlers({
				text: "("+JSON.stringify(jsonObj)+")",
				options: {
					handleAs: "javascript"
				}
			});
			t.is(jsonObj, responseData.data);

			responseData = handlers({
				text: "true;",
				options: {
					handleAs: "javascript"
				}
			});
			t.t(responseData.data);

			responseData = handlers({
				text: "false;",
				options: {
					handleAs: "javascript"
				}
			});
			t.f(responseData.data);
		},
		function xmlContentHandler(t){
			var responseData = {
				text: "<foo><bar baz='thonk'>blarg</bar></foo>",
				options: {
					handleAs: "xml"
				}
			};
			if("DOMParser" in kernel.global){
				var parser = new DOMParser();
				responseData.data = parser.parseFromString(responseData.text, "text/xml");
			}

			responseData = handlers(responseData);
			t.is("foo", responseData.data.documentElement.tagName);
		}
	]);
});
