dojo.provide("tests._base.Color");

doh.register("tests._base.Color", 
	[
		function testExtractRgb(t){
			var white = [255, 255, 255];
			var maroon = [128, 0, 0];
			function verifyColor(str, expected){
				var rgb = dojo.extractRgb(str);
				t.is(expected, rgb);
				dojo.forEach(rgb, function(n){ t.is("number", typeof(n)); });
			}
			verifyColor("maroon", maroon);
			verifyColor("white", white);
			verifyColor("#fff", white);
			verifyColor("#ffffff", white);
			verifyColor("rgb(255,255,255)", white);
			verifyColor("#800000", maroon);
			verifyColor("rgb(128, 0, 0)", maroon);
		}
	]
);
