dojo.provide("tests._base.Color");

doh.register("tests._base.Color", 
	[
		function testExtractRgb(t){
			var white = [255,255,255];
			function verifyColor(str, expected){
				var rgb = dojo.extractRgb(str);
				t.is(expected, rgb);
				dojo.forEach(rgb, function(n){ t.is("number", typeof(n)); });
			}
			verifyColor("white", white);
			verifyColor("#fff", white);
			verifyColor("#ffffff", white);
			verifyColor("rgb(255,255,255)", white);
		}
	]
);
