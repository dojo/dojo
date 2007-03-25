dojo.provide("tests.i18n");

dojo.require("dojo.i18n");

tests.register("tests.i18n", 
	[
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

		{
			// Test on-the-fly loading of localized string bundles from different locales, and
			// the expected inheritance behavior

			name: "salutations",
			setUp: function(){
				dojo.requireLocalization("tests","salutations","de");
				dojo.requireLocalization("tests","salutations","en-au");
				dojo.requireLocalization("tests","salutations","en-us-new_york-brooklyn");
				dojo.requireLocalization("tests","salutations","en-us-texas");
				dojo.requireLocalization("tests","salutations","xx");
				dojo.requireLocalization("tests","salutations","zh-cn");
			},
			runTest: function(t){
				var salutations;
				// Locale which overrides root translation
				salutations = dojo.i18n.getLocalization("tests", "salutations", "de");
				t.assertEqual("Hallo", salutations.hello);
				// Locale which does not override root translation
				salutations = dojo.i18n.getLocalization("tests", "salutations", "en");
				t.assertEqual("Hello", salutations.hello);
				// Locale which overrides its parent
				salutations = dojo.i18n.getLocalization("tests", "salutations", "en-au");
				t.assertEqual("G'day", salutations.hello);
				// Locale which does not override its parent
				salutations = dojo.i18n.getLocalization("tests", "salutations", "en-us");
				t.assertEqual("Hello", salutations.hello);
				// 3rd level variant which overrides its parent
				salutations = dojo.i18n.getLocalization("tests", "salutations", "en-us-texas");
				t.assertEqual("Howdy", salutations.hello);
				// 3rd level variant which does not override its parent
				salutations = dojo.i18n.getLocalization("tests", "salutations", "en-us-new_york");
				t.assertEqual("Hello", salutations.hello);
				// Locale which overrides its grandparent
				salutations = dojo.i18n.getLocalization("tests", "salutations", "en-us-new_york-brooklyn");
				t.assertEqual("Yo", salutations.hello);
				// Locale which does not have any translation available
				salutations = dojo.i18n.getLocalization("tests", "salutations", "xx");
				t.assertEqual("Hello", salutations.hello);
				// A double-byte string.  Everything should be read in as UTF-8 and treated as unicode within Javascript.
				salutations = dojo.i18n.getLocalization("tests", "salutations", "zh-cn");
				t.assertEqual("\u4f60\u597d", salutations.hello);
			},
			tearDown: function(){
				//Clean up bundles that should not exist if
				//the test is re-run.
				delete tests.nls.salutations;
			}
		}
	]
);
