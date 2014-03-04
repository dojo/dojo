define([
	"dojo/dom-construct",
	"doh"
], function(construct, doh){
	

	doh.register("tests.dom-construct", [
		{
			name: "Create element with textContent",
			runTest: function(t){
				var x = construct.create("div", {
					textContent: "<b>this is bold</b>"
				});
				t.is("&lt;b&gt;this is bold&lt;/b&gt;", x.innerHTML, "textContent was not properly set");
			}
		}
	]);
});
