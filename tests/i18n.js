dojo.provide("tests.i18n");

dojo.require("dojo.i18n");

(function(){
	var setUp = function(locale){
		return function(){
			dojo.requireLocalization("tests","salutations",locale);
		}
	}

	var getTest = function(value, locale){
		return function(){
			doh.assertEqual(value, dojo.i18n.getLocalization("tests", "salutations", locale).hello);
		}
	}

	var getFixture = function(locale, value){
		return {
			name: "salutations-"+locale,
			setUp: setUp(locale),
			runTest: getTest(value, locale)
		};
	}

	var testSet = [
	/* needs dojo.string,
		// This doesn't actually test anything, it just gives an impressive list of translated output to the console
		// See the 'salutations' test for something verifyable
		function fun(t){
			var salutations_default = dojo.i18n.getLocalization("tests", "salutations");
			console.debug("In the local language: "+salutations_default.hello);

			var salutations_en = dojo.i18n.getLocalization("tests", "salutations", "en");

			for (i in tests.nls.salutations) {
				var loc = i.replace('_', '-');
				var salutations = dojo.i18n.getLocalization("tests", "salutations", loc);
				var language_as_english = salutations_en[loc];
				var language_as_native = salutations[loc];
				var hello_dojo = dojo.string.substitute(salutations.hello_dojo, salutations);
				if (!dojo.i18n.isLeftToRight(loc)) {
					var RLE = "\u202b";
					var PDF = "\u202c";
					hello_dojo = RLE + hello_dojo + PDF;					
				}
				hello_dojo += "\t[" + loc + "]";
				if(language_as_english){hello_dojo += " " + language_as_english;}
				if(language_as_native){hello_dojo += " (" + language_as_native + ")";}
				console.debug(hello_dojo);
			}

			t.assertTrue(true);
		},
	*/

		// Test on-the-fly loading of localized string bundles from different locales, and
		// the expected inheritance behavior

		// Locale which overrides root translation
		getFixture("de", "Hallo"),
		// Locale which does not override root translation
		getFixture("en", "Hello"),
		// Locale which overrides its parent
		getFixture("en-au", "G'day"),
		// Locale which does not override its parent
		getFixture("en-us", "Hello"),
		// Locale which overrides its parent
		getFixture("en-us-texas", "Howdy"),
		// 3rd level variant which overrides its parent
		getFixture("en-us-new_york", "Hello"),
		// Locale which overrides its grandparent
		getFixture("en-us-new_york-brooklyn", "Yo"),
		// Locale which does not have any translation available
		getFixture("xx", "Hello"),
		// A double-byte string.  Everything should be read in as UTF-8 and treated as unicode within Javascript.
		getFixture("zh-cn", "\u4f60\u597d")
	];
	testSet[testSet.length-1].tearDown = function(){
		// Clean up bundles that should not exist if the test is re-run.
		delete tests.nls.salutations;
	};
	tests.register("tests.i18n", testSet);
})();
