define(["doh/runner", "dojo/has", "dojo/data/util/NumericShaperUtility", "dijit/_Widget"], function(doh, has, NumericShaper, _widget){

	has.add("dojo-bidi", true);
	
	var testCases = [{"shape":"Nominal", "textDir":"ltr", "value":"abc 123", "expected":"abc 123"},
					 {"shape":"Nominal", "textDir":"ltr", "value":"اول 123", "expected":"اول 123"},
					 {"shape":"Nominal", "textDir":"rtl", "value":"اول 123", "expected":"اول 123"},
					 {"shape":"Nominal", "textDir":"ltr", "value":"اول 123 abc 123", "expected":"اول 123 abc 123"},
					 {"shape":"Nominal", "textDir":"ltr", "value":"123", "expected":"123"},
					 {"shape":"Nominal", "textDir":"rtl", "value":"123", "expected":"123"},
					 
					 {"shape":"National", "textDir":"ltr", "value":"abc 123", "expected":"abc ١٢٣"},
					 {"shape":"National", "textDir":"ltr", "value":"اول 123", "expected":"اول ١٢٣"},
					 {"shape":"National", "textDir":"rtl", "value":"اول 123", "expected":"اول ١٢٣"},
					 {"shape":"National", "textDir":"ltr", "value":"اول 123 abc 123", "expected":"اول ١٢٣ abc ١٢٣"},
					 {"shape":"National", "textDir":"ltr", "value":"123", "expected":"١٢٣" },
					 {"shape":"National", "textDir":"rtl", "value":"123", "expected":"١٢٣" },
					 
					 {"shape":"Contextual", "textDir":"", "value":"abc 123", "expected": "abc 123"},
					 {"shape":"Contextual", "textDir":"", "value":"اول 123", "expected": "اول ١٢٣"},
					 {"shape":"Contextual", "textDir":"", "value":"اول 123 abc 123", "expected": "اول ١٢٣ abc 123"},
					 {"shape":"Contextual", "textDir":"", "value":"123", "expected": "123"},
					 
					 {"shape":"Contextual", "textDir":"ltr", "value":"abc 123", "expected": "abc 123"},
					 {"shape":"Contextual", "textDir":"ltr", "value":"اول 123", "expected": "اول ١٢٣"},
					 {"shape":"Contextual", "textDir":"ltr", "value":"اول 123 abc 123", "expected": "اول ١٢٣ abc 123"},
					 {"shape":"Contextual", "textDir":"ltr", "value":"123", "expected": "123"},
					 
					 {"shape":"Contextual", "textDir":"rtl", "value":"abc 123", "expected":"abc 123" },
					 {"shape":"Contextual", "textDir":"rtl", "value":"اول 123", "expected": "اول ١٢٣"},
					 {"shape":"Contextual", "textDir":"rtl", "value":"اول 123 abc 123", "expected": "اول ١٢٣ abc 123"},
					 {"shape":"Contextual", "textDir":"rtl", "value":"123", "expected":"١٢٣"},
					 
					 // Arabic Inputs
					 
					 {"shape":"Nominal", "textDir":"ltr", "value":"abc ١٢٣", "expected":"abc 123"},
					 {"shape":"Nominal", "textDir":"ltr", "value":"اول ١٢٣", "expected":"اول 123"},
					 {"shape":"Nominal", "textDir":"rtl", "value":"اول ١٢٣", "expected":"اول 123"},
					 {"shape":"Nominal", "textDir":"ltr", "value":"اول ١٢٣ abc ١٢٣", "expected":"اول 123 abc 123"},
					 {"shape":"Nominal", "textDir":"ltr", "value":"١٢٣", "expected":"123"},
					 {"shape":"Nominal", "textDir":"rtl", "value":"١٢٣", "expected":"123"},
					 
					 {"shape":"National", "textDir":"ltr", "value":"abc ١٢٣", "expected":"abc ١٢٣"},
					 {"shape":"National", "textDir":"ltr", "value":"اول ١٢٣", "expected":"اول ١٢٣"},
					 {"shape":"National", "textDir":"rtl", "value":"اول ١٢٣", "expected":"اول ١٢٣"},
					 {"shape":"National", "textDir":"ltr", "value":"اول ١٢٣ abc ١٢٣", "expected":"اول ١٢٣ abc ١٢٣"},
					 {"shape":"National", "textDir":"ltr", "value":"١٢٣", "expected":"١٢٣" },
					 {"shape":"National", "textDir":"rtl", "value":"١٢٣", "expected":"١٢٣" },
					 
					 {"shape":"Contextual", "textDir":"", "value":"abc ١٢٣", "expected": "abc 123"},
					 {"shape":"Contextual", "textDir":"", "value":"اول ١٢٣", "expected": "اول ١٢٣"},
					 {"shape":"Contextual", "textDir":"", "value":"اول ١٢٣ abc ١٢٣", "expected": "اول ١٢٣ abc 123"},
					 {"shape":"Contextual", "textDir":"", "value":"١٢٣", "expected": "123"},
					 
					 {"shape":"Contextual", "textDir":"ltr", "value":"abc ١٢٣", "expected": "abc 123"},
					 {"shape":"Contextual", "textDir":"ltr", "value":"اول ١٢٣", "expected": "اول ١٢٣"},
					 {"shape":"Contextual", "textDir":"ltr", "value":"اول ١٢٣ abc ١٢٣", "expected": "اول ١٢٣ abc 123"},
					 {"shape":"Contextual", "textDir":"ltr", "value":"١٢٣", "expected": "123"},
					 
					 {"shape":"Contextual", "textDir":"rtl", "value":"abc ١٢٣", "expected":"abc 123" },
					 {"shape":"Contextual", "textDir":"rtl", "value":"اول ١٢٣", "expected": "اول ١٢٣"},
					 {"shape":"Contextual", "textDir":"rtl", "value":"اول ١٢٣ abc ١٢٣", "expected": "اول ١٢٣ abc 123"},
					 {"shape":"Contextual", "textDir":"rtl", "value":"١٢٣", "expected":"١٢٣"},
					
					];

	doh.register("dijit.tests._BidiSupport.numericShaping.NumericShapingTest", [
	     {
	    	 name: "Numeric Shaping Support Test" ,
		       runTest:function(){
		    	   testCases.forEach(function(testCase){
	    			   doh.assertEqual(testCase.expected, NumericShaper.shape(testCase.value, testCase.shape, testCase.textDir), testCase.shape + "-" +testCase.textDir);
	    		   });
		       }
	     },
	     {
	    	 name: "Numeric Shaping Inheritance Test" ,
		       runTest:function(){
		    	   var i =0;
		    	   testCases.forEach(function(testCase){
		    		   var pDiv = document.createElement("div");
		    		   pDiv.numericShaperType = testCase.shape;
		    		   var childWidget = new _widget(pDiv);
	    			   doh.assertEqual(pDiv.numericShaperType, childWidget.numericShaperType, testCase.shape + "-" +testCase.textDir);
	    		   });
		       }
	     }
	 ]);
	
});
