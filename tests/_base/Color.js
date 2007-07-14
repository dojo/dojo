dojo.provide("tests._base.Color");

(function(){
	var white = [255, 255, 255, 1];
	var maroon = [128, 0, 0, 1];
	var verifyColor = function(t, source, expected){
		var color = new dojo.Color(source);
		t.is(expected, color.toRgba());
		dojo.forEach(color.toRgba(), function(n){ t.is("number", typeof(n)); });
	}

	doh.register("tests._base.Color", 
		[
			function testColor1(t){ verifyColor(t, "maroon", maroon); },
			function testColor2(t){ verifyColor(t, "white", white); },
			function testColor3(t){ verifyColor(t, "#fff", white); },
			function testColor4(t){ verifyColor(t, "#ffffff", white); },
			function testColor5(t){ verifyColor(t, "rgb(255,255,255)", white); },
			function testColor6(t){ verifyColor(t, "#800000", maroon); },
			function testColor7(t){ verifyColor(t, "rgb(128, 0, 0)", maroon); },
			function testColor8(t){ verifyColor(t, "rgba(128, 0, 0, 0.5)", [128, 0, 0, 0.5]); },
			function testColor9(t){ verifyColor(t, maroon, maroon); },
			function testColor10(t){ verifyColor(t, [1], [1, 1, 1, 1]); },
			function testColor11(t){ verifyColor(t, [1, 0.5], [1, 1, 1, 0.5]); },
			function testColor12(t){ verifyColor(t, [1, 2, 3], [1, 2, 3, 1]); },
			function testColor13(t){ verifyColor(t, [1, 2, 3, 4], [1, 2, 3, 1]); },
			function testColor14(t){ verifyColor(t, [1000, 2000, 3000, 4000], white); },
			function testColor15(t){ verifyColor(t, [-1, -2, -3, -4], [0, 0, 0, 0]); },
			function testColor16(t){ verifyColor(t, {r: 1, g: 2, b: 3, a: 4}, [1, 2, 3, 1]); }
		]
	);
})();
