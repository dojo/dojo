var
	addOnLoadResults = [],
	writeToAddOnLoadResults = function(c, context){
		return function() {
			addOnLoadResults.push(c);
			this===context && addOnLoadResults.push("OK");
		};
	};

// here's a djConfig for dojo to consume during its bootstrap
djConfig = {
	addOnLoad:writeToAddOnLoadResults("A", this),
	someRandomProperty:"someRandomValue"
};

define(
	["dojo", "doh", "i18n!dojo/nls/colors", "text!./text.html", "text!./text.html!strip"],
	function(dojo, doh, dojoColors, text, strippedText) {
		doh.register("test.amd.backCompat", [
			function djConfig(t){
				t.assertEqual(dojo.config.someRandomProperty, "someRandomValue");
			},
	
			function addOnLoad(t){
				var d = new doh.Deferred();
				dojo.addOnLoad(function() {
					dojo.addOnLoad(writeToAddOnLoadResults("B", this));
					dojo.addOnLoad(window, writeToAddOnLoadResults("C", window));
					var someObject = {};
					someObject.someMethod= writeToAddOnLoadResults("D", someObject);
					dojo.addOnLoad(someObject, "someMethod");
					someObject.someOtherMethod= writeToAddOnLoadResults("E", someObject);
					dojo.addOnLoad(someObject, someObject.someOtherMethod);
					dojo._loaders.unshift(writeToAddOnLoadResults("F", this));
					dojo._loaders.unshift(writeToAddOnLoadResults("G", this));
					dojo._loaders.splice(1, 0, writeToAddOnLoadResults("H", this));
				});
				dojo.addOnLoad(function(){
					var expect;
					if(require.vendor=="altoviso.com"){
						expect= ["A", "OK", "B", "OK", "C", "OK", "D", "OK", "E", "OK", "G", "OK", "H", "OK", "F", "OK"];
					}else{
						expect= ["A", "OK", "B", "OK", "C", "OK", "D", "OK", "E", "OK", "F", "OK", "G", "OK", "H", "OK"];
					}
					t.assertEqual(expect, addOnLoadResults);
					d.callback(true);
				});
	
				return d;
			},
	
			function addOnUnload(t){
				addOnLoadResults= [];
				dojo.addOnUnload(writeToAddOnLoadResults("A", dojo.global));
				dojo.addOnUnload(window, writeToAddOnLoadResults("B", window));
				var someOtherObject= {};
				someOtherObject.someMethod= writeToAddOnLoadResults("C", someOtherObject);
				dojo.addOnUnload(someOtherObject, "someMethod");
				someOtherObject.someOtherMethod= writeToAddOnLoadResults("D", someOtherObject);
				dojo.addOnUnload(someOtherObject, someOtherObject.someOtherMethod);
				dojo.unloaded();
				t.assertEqual(["D", "OK", "C", "OK", "B", "OK", "A", "OK"], addOnLoadResults);
			},
	
			function l10nNames(t){
				t.assertEqual("i18n!dojo/cldr/nls/en-us/gregorian", dojo.getL10nName("dojo.cldr", "gregorian"));
				t.assertEqual("i18n!dojo/cldr/nls/en-us/gregorian", dojo.getL10nName("dojo.cldr", "gregorian", "en-us"));
				t.assertEqual("i18n!dojo/cldr/nls/gregorian", dojo.getL10nName("dojo.cldr", "gregorian", "root"));
				t.assertEqual("i18n!dojo/cldr/nls/gregorian", dojo.getL10nName("dojo.cldr", "gregorian", "ROOT"));
				t.assertEqual("i18n!dojo/cldr/nls/gregorian", dojo.getL10nName("dojo.cldr", "gregorian", "Root"));
	
				t.assertEqual("i18n!dojo/cldr/nls/en-us/gregorian", dojo.getL10nName("dojo/cldr", "gregorian"));
				t.assertEqual("i18n!dojo/cldr/nls/en-us/gregorian", dojo.getL10nName("dojo/cldr", "gregorian", "en-us"));
				t.assertEqual("i18n!dojo/cldr/nls/gregorian", dojo.getL10nName("dojo/cldr", "gregorian", "root"));
				t.assertEqual("i18n!dojo/cldr/nls/gregorian", dojo.getL10nName("dojo/cldr", "gregorian", "ROOT"));
				t.assertEqual("i18n!dojo/cldr/nls/gregorian", dojo.getL10nName("dojo/cldr", "gregorian", "Root"));
			},
	
			function i18nPlugin(t){
				t.assertEqual(dojoColors, dojo.requireLocalization("dojo", "colors"));
			},
	
			function moduleUrl(t){
				var
					compact= function(path){
						var
							parts= path.split("/"),
							result= [],
							segment;
						while(parts.length){
							segment= parts.shift();
							if(segment==".."){
								if(result.length && result[result.length-1].charAt(0)!="."){
									result.pop();
								}else{
									result.push("..");
								}
							}else if (segment!="."){
								result.push(segment);
							}
						}
						return result.join("/");
					},
					result1= compact(location.pathname + "/../" + dojo.moduleUrl("dojo.my", "module.js")),
					result2= compact(location.pathname + "/../" + dojo.moduleUrl("dojo", "resources/blank.gif"));
				t.assertTrue(/dojo\/my\/module\.js$/.test(result1));
				t.assertTrue(/dojo\/resources\/blank\.gif$/.test(result2));
			},
	
			function textPlugin(t){
				// TODO: the text plugin seems to return a single extra newline; OK for now
				t.assertTrue(text.indexOf("<html><head><title>some text</title></head><body><h1>some text</h1></body></html>")==0);
				t.assertEqual("<h1>some text</h1>", strippedText);
			}
		]);
	}
);

