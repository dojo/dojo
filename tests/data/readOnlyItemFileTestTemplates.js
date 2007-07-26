dojo.provide("tests.data.readOnlyItemFileTestTemplates");
dojo.require("dojo.data.api.Read");
dojo.require("dojo.data.api.Identity");
dojo.require("dojo.date");
dojo.require("dojo.date.stamp");


tests.data.readOnlyItemFileTestTemplates.registerTestsForDatastore = function(/* String */ datastoreClassName){
	// summary:
	//		Given the name of a datastore class to use, this function creates
	//		a set of unit tests for that datastore, and registers the new test
	//		group with the doh test framework.  The new unit tests are based
	//		on a set of "template" unit tests.
	var datastoreClass = dojo.getObject(datastoreClassName);
	var testTemplates = tests.data.readOnlyItemFileTestTemplates.testTemplates;
	var testsForDatastore = [];
	var makeNewTestFunction = function(template){
		return function(t){return template.runTest(datastoreClass, t);};
	};
	for(var i = 0; i < testTemplates.length; ++i) {
		var testTemplate = testTemplates[i];
		var test = {};
		test.name = testTemplate.name;
		test.runTest = makeNewTestFunction(testTemplate);
		testsForDatastore.push(test);
	}
	var testGroupName = "tests.data.readOnlyItemFileTestTemplates, with datastore " + datastoreClassName;
	doh.register(testGroupName, testsForDatastore);
};


//-----------------------------------------------------
// testFile data-sets
tests.data.readOnlyItemFileTestTemplates.getTestData = function(name){
	var data = null;
	if (name === "countries") {
		if(dojo.isBrowser){
			data = {url: dojo.moduleUrl("tests", "data/countries.json").toString() };
		}else{
			data = {data: { 
				identifier:"abbr",
				label:"name",
				items:[
					{abbr:"ec", name:"Ecuador", capital:"Quito"},
					{abbr:'eg', name:'Egypt', capital:'Cairo'},
					{abbr:'sv', name:'El Salvador', capital:'San Salvador'},
					{abbr:'gq', name:'Equatorial Guinea', capital:'Malabo'},
					{abbr:'er', name:'Eritrea', capital:'Asmara'},
					{abbr:'ee', name:'Estonia', capital:'Tallinn'},
					{abbr:'et', name:'Ethiopia', capital:'Addis Ababa'}
				]
			} };
		}	
	}else if(name === "countries_withNull"){
		if(dojo.isBrowser){
			data = {url: dojo.moduleUrl("tests", "data/countries_withNull.json").toString() };
		}else{
			data = {data: { 
				identifier:"abbr",
				items:[
					{abbr:"ec", name:null, capital:"Quito"},
					{abbr:'eg', name:null, capital:'Cairo'},
					{abbr:'sv', name:'El Salvador', capital:'San Salvador'},
					{abbr:'gq', name:'Equatorial Guinea', capital:'Malabo'},
					{abbr:'er', name:'Eritrea', capital:'Asmara'},
					{abbr:'ee', name:null, capital:'Tallinn'},
					{abbr:'et', name:'Ethiopia', capital:'Addis Ababa'}
				]
			} };
		}
	}else if (name === "countries_withBoolean"){
		if(dojo.isBrowser){
			data = {url: dojo.moduleUrl("tests", "data/countries_withBoolean.json").toString() };
		}else{
			data = {data: { 
				identifier:"abbr",
				items:[
					{abbr:"ec", name:"Ecuador", capital:"Quito", real:true},
					{abbr:'eg', name:'Egypt', capital:'Cairo', real:true},
					{abbr:'sv', name:'El Salvador', capital:'San Salvador', real:true},
					{abbr:'gq', name:'Equatorial Guinea', capital:'Malabo', real:true},
					{abbr:'er', name:'Eritrea', capital:'Asmara', real:true},
					{abbr:'ee', name:'Estonia', capital:'Tallinn', real:true},
					{abbr:'et', name:'Ethiopia', capital:'Addis Ababa', real:true},
					{abbr:'ut', name:'Utopia', capital:'Paradise', real:false}
				]
			} };
		}
	}else if (name === "countries_withDates") {
		if(dojo.isBrowser){
			data = {url: dojo.moduleUrl("tests", "data/countries_withDates.json").toString() };
		}else{
			data = {data: { 
				identifier:"abbr",
				items:[
					{abbr:"ec", name:"Ecuador", capital:"Quito"},
					{abbr:'eg', name:'Egypt', capital:'Cairo'},
					{abbr:'sv', name:'El Salvador', capital:'San Salvador'},
					{abbr:'gq', name:'Equatorial Guinea', capital:'Malabo'},
					{abbr:'er', name:'Eritrea', capital:'Asmara', independence:{_type:'Date', _value:"1993-05-24T00:00:00Z"}}, // May 24, 1993,
					{abbr:'ee', name:'Estonia', capital:'Tallinn', independence:{_type:'Date', _value:"1991-08-20T00:00:00Z"}}, // August 20, 1991
					{abbr:'et', name:'Ethiopia', capital:'Addis Ababa'}
				]
			} };
		}
	}else if (name === "geography_hierarchy_small") {
		if(dojo.isBrowser){
			data = {url: dojo.moduleUrl("tests", "data/geography_hierarchy_small.json").toString() };
		}else{
			data = {data: { 
				items:[
					{ name:'Africa', countries:[
						{ name:'Egypt', capital:'Cairo' },
						{ name:'Kenya', capital:'Nairobi' },
						{ name:'Sudan', capital:'Khartoum' }]},
					{ name:'Australia', capital:'Canberra' },
					{ name:'North America', countries:[
						{ name:'Canada', population:'33 million', cities:[
							{ name:'Toronto', population:'2.5 million' },
							{ name:'Alberta', population:'1 million' }
							]},
						{ name: 'United States of America', capital: 'Washington DC', states:[
							{ name: 'Missouri'},
							{ name: 'Arkansas'}
							]}
						]}
				]
			}};
		}
	}
	return data;
};

//-----------------------------------------------------
// testTemplates
tests.data.readOnlyItemFileTestTemplates.testTemplates = [
	{
		name: "Identity API: fetchItemByIdentity()",
		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the fetchItemByIdentity function of the store.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				if(item !== null){
					var name = store.getValue(item,"name");
					t.assertEqual(name, "El Salvador");
				}
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "sv", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Identity API: fetchItemByIdentity() notFound",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the fetchItemByIdentity function of the store.
			//	description:
			//		Simple test of the fetchItemByIdentity function of the store.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item === null);
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "sv_not", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Identity API: getIdentityAttributes()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the getIdentityAttributes function.
			//	description:
			//		Simple test of the getIdentityAttributes function.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null)
				var identifiers = store.getIdentityAttributes(item);
				t.assertTrue(dojo.isArray(identifiers));
				t.assertEqual(1, identifiers.length);
				t.assertEqual("abbr", identifiers[0]);
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "sv", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Identity API: fetchItemByIdentity() commentFilteredJson",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the fetchItemByIdentity function of the store.
			//	description:
			//		Simple test of the fetchItemByIdentity function of the store.
			//		This tests loading a comment-filtered json file so that people using secure
			//		data with this store can bypass the JavaSceipt hijack noted in Fortify's
			//		paper.

			if(dojo.isBrowser){
                var store = new datastore({url: dojo.moduleUrl("tests", "data/countries_commentFiltered.json").toString()});

				var d = new doh.Deferred();
				function onItem(item){
					t.assertTrue(item !== null);
					var name = store.getValue(item,"name");
					t.assertEqual(name, "El Salvador");
					d.callback(true);
				}
				function onError(errData){
					t.assertTrue(false);
					d.errback(errData);
				}
				store.fetchItemByIdentity({identity: "sv", onItem: onItem, onError: onError});
				return d; // Deferred
			}
		}
	},
	{
		name: "Identity API: fetchItemByIdentity() nullValue",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the fetchItemByIdentity function of the store, checling a null value.
			//	description:
			//		Simple test of the fetchItemByIdentity function of the store, checking a null value.
			//		This tests handling attributes in json that were defined as null properly.
			//		Introduced because of tracker: #3153
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries_withNull"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				var name = store.getValue(item,"name");
				t.assertEqual(name, null);
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "ec", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Identity API: fetchItemByIdentity() booleanValue",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the fetchItemByIdentity function of the store, checking a boolean value.
			//	description:
			//		Simple test of the fetchItemByIdentity function of the store, checking a boolean value.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries_withBoolean"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				var name = store.getValue(item,"name");
				t.assertEqual(name, "Utopia");
				var real = store.getValue(item,"real");
				t.assertEqual(real, false);
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "ut", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Identity API: getIdentity()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the getIdentity function of the store.
			//	description:
			//		Simple test of the getIdentity function of the store.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				t.assertTrue(store.getIdentity(item) === "sv");
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "sv", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: fetch() all",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore.
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));
			
			var d = new doh.Deferred();
			function completedAll(items, request){
				t.is(7, items.length);
				d.callback(true);
			}
			function error(errData, request){
				t.assertTrue(false);
				d.errback(errData);
			}

			//Get everything...
			store.fetch({ onComplete: completedAll, onError: error});
			return d;
		}
	},
	{
		name: "Read API: fetch() one",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore of a single item.
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore of a single item.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				t.assertEqual(items.length, 1);
				d.callback(true);
			}
			function onError(errData, request){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetch({ 	query: {abbr: "ec"}, 
									onComplete: onComplete, 
									onError: onError
								});
			return d;
		}
	},
	{
		name: "Read API: fetch() shallow",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore of only toplevel items
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore of only toplevel items.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("geography_hierarchy_small"));
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				t.assertEqual(items.length, 2);
				d.callback(true);
			}
			function onError(errData, request){
				t.assertTrue(false);
				d.errback(errData);
			}
			//Find all items starting with A, only toplevel (root) items.
			store.fetch({ 	query: {name: "A*"}, 
									onComplete: onComplete, 
									onError: onError
								});
			return d;
		}
	},
	{
		name: "Read API: fetch() deep",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore of all items (including children (nested))
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore of all items (including children (nested))
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("geography_hierarchy_small"));
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				t.assertEqual(items.length, 4);
				d.callback(true);
			}
			function onError(errData, request){
				t.assertTrue(false);
				d.errback(errData);
			}
			//Find all items starting with A, including child (nested) items.
			store.fetch({ 	query: {name: "A*"}, 
									onComplete: onComplete, 
									onError: onError,
									queryOptions: {deep:true}
								});
			return d;
		}
	},
	{
		name: "Read API: fetch() one_commentFilteredJson",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore of a single item.
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore of a single item.
			//		This tests loading a comment-filtered json file so that people using secure
			//		data with this store can bypass the JavaSceipt hijack noted in Fortify's
			//		paper.
			if(dojo.isBrowser){
                var store = new datastore({url: dojo.moduleUrl("tests", "data/countries_commentFiltered.json").toString()});

				var d = new doh.Deferred();
				function onComplete(items, request){
					t.assertEqual(items.length, 1);
					d.callback(true);
				}
				function onError(errData, request){
					t.assertTrue(false);
					d.errback(errData);
				}
				store.fetch({ 	query: {abbr: "ec"}, 
										onComplete: onComplete, 
										onError: onError
									});
				return d;
			}
		}
	},
	{
		name: "Read API: fetch() withNull",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore of a single item where some attributes are null.
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore of a single item where some attributes are null.
			//		Introduced because of tracker: #3153
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries_withNull"));
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				t.assertEqual(4, items.length);
				d.callback(true);
			}
			function onError(errData, request){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetch({ 	query: {name: "E*"}, 
									onComplete: onComplete, 
									onError: onError
								});
			return d;
		}
	},
	{
		name: "Read API: fetch() all_streaming",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore.
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			count = 0;

			function onBegin(size, requestObj){
				t.assertEqual(size, 7);
			}
			function onItem(item, requestObj){
				t.assertTrue(store.isItem(item));
				count++;
			}
			function onComplete(items, request){
				t.assertEqual(count, 7);
				t.assertTrue(items === null);
				d.callback(true);
			}
			function onError(errData, request){
				t.assertTrue(false);
				d.errback(errData);
			}

			//Get everything...
			store.fetch({	onBegin: onBegin,
									onItem: onItem, 
									onComplete: onComplete,
									onError: onError
								});
			return d;
		}
	},
	{
		name: "Read API: fetch() paging",
 		runTest: function(datastore, t){
			//	summary: 
			//		Test of multiple fetches on a single result.  Paging, if you will.
			//	description:
			//		Test of multiple fetches on a single result.  Paging, if you will.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));
			
			var d = new doh.Deferred();
			function dumpFirstFetch(items, request){
				t.assertEqual(items.length, 5);
				request.start = 3;
				request.count = 1;
				request.onComplete = dumpSecondFetch;
				store.fetch(request);
			}

			function dumpSecondFetch(items, request){
				t.assertEqual(items.length, 1);
				request.start = 0;
				request.count = 5;
				request.onComplete = dumpThirdFetch;
				store.fetch(request);
			}

			function dumpThirdFetch(items, request){
				t.assertEqual(items.length, 5);
				request.start = 2;
				request.count = 20;
				request.onComplete = dumpFourthFetch;
				store.fetch(request);
			}

			function dumpFourthFetch(items, request){
				t.assertEqual(items.length, 5);
				request.start = 9;
				request.count = 100;
				request.onComplete = dumpFifthFetch;
				store.fetch(request);
			}

			function dumpFifthFetch(items, request){
				t.assertEqual(items.length, 0);
				request.start = 2;
				request.count = 20;
				request.onComplete = dumpSixthFetch;
				store.fetch(request);
			}

			function dumpSixthFetch(items, request){
				t.assertEqual(items.length, 5);
				d.callback(true);
			}

			function completed(items, request){
				t.assertEqual(items.length, 7);
				request.start = 1;
				request.count = 5;
				request.onComplete = dumpFirstFetch;
				store.fetch(request);
			}

			function error(errData, request){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetch({onComplete: completed, onError: error});
			return d;
		}
	},
	{
		name: "Read API: getLabel()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the getLabel function against a store set that has a label defined.
			//	description:
			//		Simple test of the getLabel function against a store set that has a label defined.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				t.assertEqual(items.length, 1);
				var label = store.getLabel(items[0]);
				t.assertTrue(label !== null);
				t.assertEqual("Ecuador", label);
				d.callback(true);
			}
			function onError(errData, request){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetch({ 	query: {abbr: "ec"}, 
									onComplete: onComplete, 
									onError: onError
								});
			return d;
		}
	},
	{
		name: "Read API: getLabelAttributes()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the getLabelAttributes function against a store set that has a label defined.
			//	description:
			//		Simple test of the getLabelAttributes function against a store set that has a label defined.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				t.assertEqual(items.length, 1);
				var labelList = store.getLabelAttributes(items[0]);
				t.assertTrue(dojo.isArray(labelList));
				t.assertEqual("name", labelList[0]);
				d.callback(true);
			}
			function onError(errData, request){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetch({ 	query: {abbr: "ec"}, 
									onComplete: onComplete, 
									onError: onError
								});
			return d;
		}
	},
	{
		name: "Read API: getValue()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the getValue function of the store.
			//	description:
			//		Simple test of the getValue function of the store.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				var name = store.getValue(item,"name");
				t.assertTrue(name === "El Salvador");
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "sv", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: getValues()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the getValues function of the store.
			//	description:
			//		Simple test of the getValues function of the store.
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				var names = store.getValues(item,"name");
				t.assertTrue(dojo.isArray(names));
				t.assertEqual(names.length, 1);
				t.assertEqual(names[0], "El Salvador");
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "sv", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: isItem()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the isItem function of the store
			//	description:
			//		Simple test of the isItem function of the store
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				t.assertTrue(store.isItem(item));
				t.assertTrue(!store.isItem({}));
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "sv", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: isItem() multistore",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the isItem function of the store
			//		to verify two different store instances do not accept
			//		items from each other.
			//	description:
			//		Simple test of the isItem function of the store
			//		to verify two different store instances do not accept
			//		items from each other.

			// Two different instances, even  if they read from the same URL 
			// should not accept items between each other!
			var store1 = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));
			var store2 = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem1(item1){
				t.assertTrue(item1 !== null);
				
				function onItem2(item2){
					t.assertTrue(item1 !== null);
					t.assertTrue(item2 !== null);
					t.assertTrue(store1.isItem(item1));
					t.assertTrue(store2.isItem(item2));
					t.assertTrue(!store1.isItem(item2));
					t.assertTrue(!store2.isItem(item1));
					d.callback(true);
				}
				store2.fetchItemByIdentity({identity: "sv", onItem: onItem2, onError: onError});

			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store1.fetchItemByIdentity({identity: "sv", onItem: onItem1, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: hasAttribute()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the hasAttribute function of the store
			//	description:
			//		Simple test of the hasAttribute function of the store
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				t.assertTrue(store.hasAttribute(item, "abbr"));
				t.assertTrue(!store.hasAttribute(item, "abbr_not"));

				//Test that null attributes throw an exception
				var passed = false;
				try{
					store.hasAttribute(item, null);
				}catch (e){
					passed = true;
				}
				t.assertTrue(passed);
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "sv", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: containsValue()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the containsValue function of the store
			//	description:
			//		Simple test of the containsValue function of the store
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				t.assertTrue(store.containsValue(item, "abbr", "sv"));
				t.assertTrue(!store.containsValue(item, "abbr", "sv1"));
				t.assertTrue(!store.containsValue(item, "abbr", null));

				//Test that null attributes throw an exception
				var passed = false;
				try{
					store.containsValue(item, null, "foo");
				}catch (e){
					passed = true;
				}
				t.assertTrue(passed);
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "sv", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: getAttributes()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the getAttributes function of the store
			//	description:
			//		Simple test of the getAttributes function of the store
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				t.assertTrue(store.isItem(item));

				var attributes = store.getAttributes(item);
				t.assertEqual(attributes.length, 3);
				for(var i = 0; i < attributes.length; i++){
					t.assertTrue((attributes[i] === "name" || attributes[i] === "abbr" || attributes[i] === "capital"));
				}
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity: "sv", onItem: onItem, onError: onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: getFeatures()",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the getFeatures function of the store
			//	description:
			//		Simple test of the getFeatures function of the store
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var features = store.getFeatures();
			t.assertTrue(features["dojo.data.api.Read"] != null);
			t.assertTrue(features["dojo.data.api.Identity"] != null);
		}
	},
	{
		name: "Read API: fetch() patternMatch0",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test pattern matching of everything starting with lowercase e
			//	description:
			//		Function to test pattern matching of everything starting with lowercase e
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));

			var d = new doh.Deferred();
			function completed(items, request) {
				t.assertEqual(items.length, 5);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "abbr");
					if(!(value === "ec" || value === "eg" || value === "er" || value === "ee" || value === "et")){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected abbreviation found, match failure."));
				}
			}
			function error(error, request) {
				t.assertTrue(false);
				d.errback(error);
			}
			store.fetch({query: {abbr: "e*"}, onComplete: completed, onError: error});
			return d;
		}
	},
	{
		name: "Read API: fetch() patternMatch1",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test pattern matching of everything with $ in it.
			//	description:
			//		Function to test pattern matching of everything with $ in it.

			var store = new datastore({data: { identifier: "uniqueId", 
											  items: [ {uniqueId: 1, value:"foo*bar"},
												   {uniqueId: 2, value:"bar*foo"}, 
												   {uniqueId: 3, value:"boomBam"},
												   {uniqueId: 4, value:"bit$Bite"},
												   {uniqueId: 5, value:"ouagadogou"},
												   {uniqueId: 6, value:"BaBaMaSaRa***Foo"},
												   {uniqueId: 7, value:"squawl"},
												   {uniqueId: 8, value:"seaweed"},
												   {uniqueId: 9, value:"jfq4@#!$!@Rf14r14i5u"}
												 ]
										}
								 });
			
			var d = new doh.Deferred();
			function completed(items, request){
				t.assertEqual(items.length, 2);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(value === "bit$Bite" || value === "jfq4@#!$!@Rf14r14i5u")){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected pattern matched.  Filter failure."));
				}
			}
			function error(error, request){
				t.assertTrue(false);
				d.errback(error);
			}
			store.fetch({query: {value: "*$*"}, onComplete: completed, onError: error});
			return d;
		}
	},
	{
		name: "Read API: fetch() patternMatch2",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test exact pattern match
			//	description:
			//		Function to test exact pattern match

			var store = new datastore({data: { identifier: "uniqueId", 
											  items: [ {uniqueId: 1, value:"foo*bar"},
												   {uniqueId: 2, value:"bar*foo"}, 
												   {uniqueId: 3, value:"boomBam"},
												   {uniqueId: 4, value:"bit$Bite"},
												   {uniqueId: 5, value:"ouagadogou"},
												   {uniqueId: 6, value:"BaBaMaSaRa***Foo"},
												   {uniqueId: 7, value:"squawl"},
												   {uniqueId: 8, value:"seaweed"},
												   {uniqueId: 9, value:"jfq4@#!$!@Rf14r14i5u"}
												 ]
										}
								 });

			var d = new doh.Deferred();
			function completed(items, request){
				t.assertEqual(items.length, 1);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(value === "bar*foo")){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected abbreviation found, match failure."));
				}
			}
			function error(error, request){
				t.assertTrue(false);
				d.errback(error);
			}
			store.fetch({query: {value: "bar\*foo"}, onComplete: completed, onError: error});
			return d;
		}
	},
	{
		name: "Read API: fetch() patternMatch_caseSensitive",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test pattern matching of a pattern case-sensitively
			//	description:
			//		Function to test pattern matching of a pattern case-sensitively

			var store = new datastore({data: { identifier: "uniqueId", 
											  items: [ {uniqueId: 1, value:"foo*bar"},
												   {uniqueId: 2, value:"bar*foo"}, 
												   {uniqueId: 3, value:"BAR*foo"},
												   {uniqueId: 4, value:"BARBananafoo"}
												 ]
										}
								 });
			
			var d = new doh.Deferred();
			function completed(items, request){
				t.assertEqual(1, items.length);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(value === "bar*foo")){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected pattern matched.  Filter failure."));
				}
			}
			function error(error, request){
				t.assertTrue(false);
				d.errback(error);
			}
			store.fetch({query: {value: "bar\\*foo"}, queryOptions: {ignoreCase: false} , onComplete: completed, onError: error});
			return d;
		}
	},
	{
		name: "Read API: fetch() patternMatch_caseInsensitive",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test pattern matching of a pattern case-insensitively
			//	description:
			//		Function to test pattern matching of a pattern case-insensitively

			var store = new datastore({data: { identifier: "uniqueId", 
											  items: [ {uniqueId: 1, value:"foo*bar"},
												   {uniqueId: 2, value:"bar*foo"}, 
												   {uniqueId: 3, value:"BAR*foo"},
												   {uniqueId: 4, value:"BARBananafoo"}
												 ]
										}
								 });
			
			var d = new doh.Deferred();
			function completed(items, request){
				t.assertEqual(items.length, 2);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(value === "BAR*foo" || value === "bar*foo")){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected pattern matched.  Filter failure."));
				}
			}
			function error(error, request){
				t.assertTrue(false);
				d.errback(error);
			}
			store.fetch({query: {value: "bar\\*foo"}, queryOptions: {ignoreCase: true}, onComplete: completed, onError: error});
			return d;
		}
	},
	{
		name: "Read API: fetch() sortNumeric",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test sorting numerically.
			//	description:
			//		Function to test sorting numerically.
			
			var store = new datastore({data: { identifier: "uniqueId", 
											  items: [ {uniqueId: 0, value:"fo|o*b.ar"},
												   {uniqueId: 1, value:"ba|r*foo"}, 
												   {uniqueId: 2, value:"boomBam"},
												   {uniqueId: 3, value:"bit$Bite"},
												   {uniqueId: 4, value:"ouagadogou"},
												   {uniqueId: 5, value:"jfq4@#!$!@|f1.$4r14i5u"},
												   {uniqueId: 6, value:"BaB{aMa|SaRa***F}oo"},
												   {uniqueId: 7, value:"squawl"},
												   {uniqueId: 9, value:"seaweed"},
												   {uniqueId: 10, value:"zulu"},
												   {uniqueId: 8, value:"seaweed"}
												 ]
										}
								 });

			var d = new doh.Deferred();
			function completed(items, request){
				t.assertEqual(items.length, 11);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(store.getValue(items[i], "uniqueId") === i)){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected sorting order found, sort failure."));
				}
			}

			function error(error, request){
				t.assertTrue(false);
				d.errback(error);
			}

			var sortAttributes = [{attribute: "uniqueId"}];
			store.fetch({onComplete: completed, onError: error, sort: sortAttributes});
			return d;
		}
	},
	{
		name: "Read API: fetch() sortNumericDescending",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test sorting numerically.
			//	description:
			//		Function to test sorting numerically.

			var store = new datastore({data: { identifier: "uniqueId", 
											  items: [ {uniqueId: 0, value:"fo|o*b.ar"},
												   {uniqueId: 1, value:"ba|r*foo"}, 
												   {uniqueId: 2, value:"boomBam"},
												   {uniqueId: 3, value:"bit$Bite"},
												   {uniqueId: 4, value:"ouagadogou"},
												   {uniqueId: 5, value:"jfq4@#!$!@|f1.$4r14i5u"},
												   {uniqueId: 6, value:"BaB{aMa|SaRa***F}oo"},
												   {uniqueId: 7, value:"squawl"},
												   {uniqueId: 9, value:"seaweed"},
												   {uniqueId: 10, value:"zulu"},
												   {uniqueId: 8, value:"seaweed"}
												 ]
										}
								 });
			var d = new doh.Deferred();
			function completed(items, request){
				t.assertEqual(items.length, 11);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!((items.length - (store.getValue(items[i], "uniqueId") + 1)) === i)){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected sorting order found, sort failure."));
				}
			}

			function error(error, request){
				t.assertTrue(false);
				d.errback(error);
			}

			var sortAttributes = [{attribute: "uniqueId", descending: true}];
			store.fetch({onComplete: completed, onError: error, sort: sortAttributes});
			return d;
		}
	},
	{
		name: "Read API: fetch() sortNumericWithCount",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test sorting numerically in descending order, returning only a specified number of them.
			//	description:
			//		Function to test sorting numerically in descending order, returning only a specified number of them.
		
			var store = new datastore({data: { identifier: "uniqueId", 
											 items: [ {uniqueId: 0, value:"fo|o*b.ar"},
												  {uniqueId: 1, value:"ba|r*foo"}, 
												  {uniqueId: 2, value:"boomBam"},
												  {uniqueId: 3, value:"bit$Bite"},
												  {uniqueId: 4, value:"ouagadogou"},
												  {uniqueId: 5, value:"jfq4@#!$!@|f1.$4r14i5u"},
												  {uniqueId: 6, value:"BaB{aMa|SaRa***F}oo"},
												  {uniqueId: 7, value:"squawl"},
												  {uniqueId: 9, value:"seaweed"},
												  {uniqueId: 10, value:"zulu"},
												  {uniqueId: 8, value:"seaweed"}
												]
									   }
								});
			
			var d = new doh.Deferred();
			function completed(items, request){
				t.assertEqual(items.length, 5);
				var itemId = 10;
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(store.getValue(items[i], "uniqueId") === itemId)){
						passed=false;
						break;
					}
					itemId--; // Decrement the item id.  We are descending sorted, so it should go 10, 9, 8, etc.
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected sorting order found, sort failure."));
				}
			}
		
			function error(error, request){
				t.assertTrue(false);
				d.errback(error);
			}
		
			var sortAttributes = [{attribute: "uniqueId", descending: true}];
			store.fetch({onComplete: completed, onError: error, sort: sortAttributes, count: 5});
			return d;
		}
	},
	{
		name: "Read API: fetch() sortAlphabetic",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test sorting alphabetic ordering.
			//	description:
			//		Function to test sorting alphabetic ordering.
		
			var store = new datastore({data: { identifier: "uniqueId", 
											 items: [ {uniqueId: 0, value:"abc"},
												  {uniqueId: 1, value:"bca"}, 
												  {uniqueId: 2, value:"abcd"},
												  {uniqueId: 3, value:"abcdefg"},
												  {uniqueId: 4, value:"lmnop"},
												  {uniqueId: 5, value:"foghorn"},
												  {uniqueId: 6, value:"qberty"},
												  {uniqueId: 7, value:"qwerty"},
												  {uniqueId: 8, value:""},
												  {uniqueId: 9, value:"seaweed"},
												  {uniqueId: 10, value:"123abc"}
		
												]
									   }
								});
			
			var d = new doh.Deferred();
			function completed(items, request){
				//Output should be in this order...
				var orderedArray = [ 	"",
										"123abc",
										"abc",
										"abcd",
										"abcdefg",
										"bca",
										"foghorn",
										"lmnop",
										"qberty",
										"qwerty",
										"seaweed"
					];
				t.assertEqual(items.length, 11);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(store.getValue(items[i], "value") === orderedArray[i])){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected sorting order found, sort failure."));
				}
			}
		
			function error(error, request) {
				t.assertTrue(false);
				d.errback(error);
			}
		
			var sortAttributes = [{attribute: "value"}];
			store.fetch({onComplete: completed, onError: error, sort: sortAttributes});
			return d;
		}
	},
	{
		name: "Read API: fetch() sortAlphabeticDescending",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test sorting alphabetic ordering in descending mode.
			//	description:
			//		Function to test sorting alphabetic ordering in descending mode.
		
			var store = new datastore({data: { identifier: "uniqueId", 
											 items: [ {uniqueId: 0, value:"abc"},
												  {uniqueId: 1, value:"bca"}, 
												  {uniqueId: 2, value:"abcd"},
												  {uniqueId: 3, value:"abcdefg"},
												  {uniqueId: 4, value:"lmnop"},
												  {uniqueId: 5, value:"foghorn"},
												  {uniqueId: 6, value:"qberty"},
												  {uniqueId: 7, value:"qwerty"},
												  {uniqueId: 8, value:""},
												  {uniqueId: 9, value:"seaweed"},
												  {uniqueId: 10, value:"123abc"}
		
												]
									   }
								});
			var d = new doh.Deferred();
			function completed(items, request){
				//Output should be in this order...
				var orderedArray = [ 	"",
										"123abc",
										"abc",
										"abcd",
										"abcdefg",
										"bca",
										"foghorn",
										"lmnop",
										"qberty",
										"qwerty",
										"seaweed"
					];
				orderedArray = orderedArray.reverse();
				t.assertEqual(items.length, 11);

				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(store.getValue(items[i], "value") === orderedArray[i])){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected sorting order found, sort failure."));
				}
			}
		
			function error(error, request) {
				t.assertTrue(false);
				d.errback(error);
			}
		
			var sortAttributes = [{attribute: "value", descending: true}];
			store.fetch({onComplete: completed, onError: error, sort: sortAttributes});
			return d;
		}
	},
	{
		name: "Read API: fetch() sortDate",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test sorting date.
			//	description:
			//		Function to test sorting date.
		
			var store = new datastore({data: { identifier: "uniqueId", 
											 items: [ {uniqueId: 0, value: new Date(0)},
												  {uniqueId: 1, value: new Date(100)}, 
												  {uniqueId: 2, value:new Date(1000)},
												  {uniqueId: 3, value:new Date(2000)},
												  {uniqueId: 4, value:new Date(3000)},
												  {uniqueId: 5, value:new Date(4000)},
												  {uniqueId: 6, value:new Date(5000)},
												  {uniqueId: 7, value:new Date(6000)},
												  {uniqueId: 8, value:new Date(7000)},
												  {uniqueId: 9, value:new Date(8000)},
												  {uniqueId: 10, value:new Date(9000)}
		
												]
									   }
								});
			
			var d = new doh.Deferred();
			function completed(items,request){
				var orderedArray =	[0,100,1000,2000,3000,4000,5000,6000,7000,8000,9000];
				t.assertEqual(items.length, 11);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(store.getValue(items[i], "value").getTime() === orderedArray[i])){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected sorting order found, sort failure."));
				}
			}
		
			function error(error, request){
				t.assertTrue(false);
				d.errback(error);
			}
		
			var sortAttributes = [{attribute: "value"}];
			store.fetch({onComplete: completed, onError: error, sort: sortAttributes});
			return d;
		}
	},
	{
		name: "Read API: fetch() sortDateDescending",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test sorting date in descending order.
			//	description:
			//		Function to test sorting date in descending order.
		
			var store = new datastore({data: { identifier: "uniqueId", 
											 items: [ {uniqueId: 0, value: new Date(0)},
												  {uniqueId: 1, value: new Date(100)}, 
												  {uniqueId: 2, value:new Date(1000)},
												  {uniqueId: 3, value:new Date(2000)},
												  {uniqueId: 4, value:new Date(3000)},
												  {uniqueId: 5, value:new Date(4000)},
												  {uniqueId: 6, value:new Date(5000)},
												  {uniqueId: 7, value:new Date(6000)},
												  {uniqueId: 8, value:new Date(7000)},
												  {uniqueId: 9, value:new Date(8000)},
												  {uniqueId: 10, value:new Date(9000)}
		
												]
									   }
								});
		
			var d = new doh.Deferred();
			function completed(items,request){
				var orderedArray =	[0,100,1000,2000,3000,4000,5000,6000,7000,8000,9000];
				orderedArray = orderedArray.reverse();
				t.assertEqual(items.length, 11);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(store.getValue(items[i], "value").getTime() === orderedArray[i])){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected sorting order found, sort failure."));
				}
			}
		
			function error(error, request){
				t.assertTrue(false);
				d.errback(error);
			}
		
			var sortAttributes = [{attribute: "value", descending: true}];
			store.fetch({onComplete: completed, onError: error, sort: sortAttributes});
			return d;
		}
	},
	{
		name: "Read API: fetch() sortMultiple",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test sorting on multiple attributes.
			//	description:
			//		Function to test sorting on multiple attributes.
			
			var store = new datastore({data: { identifier: "uniqueId", 
											 items: [ {uniqueId: 1, value:"fo|o*b.ar"},
												  {uniqueId: 2, value:"ba|r*foo"}, 
												  {uniqueId: 3, value:"boomBam"},
												  {uniqueId: 4, value:"bit$Bite"},
												  {uniqueId: 5, value:"ouagadogou"},
												  {uniqueId: 6, value:"jfq4@#!$!@|f1.$4r14i5u"},
												  {uniqueId: 7, value:"BaB{aMa|SaRa***F}oo"},
												  {uniqueId: 8, value:"squawl"},
												  {uniqueId: 10, value:"seaweed"},
												  {uniqueId: 12, value:"seaweed"},
												  {uniqueId: 11, value:"zulu"},
												  {uniqueId: 9, value:"seaweed"}
												]
									   }
								});
		
			var d = new doh.Deferred();
			function completed(items, request){
				var orderedArray0 = [7,2,4,3,1,6,5,12,10,9,8,11];
				var orderedArray1 = [	"BaB{aMa|SaRa***F}oo",
										"ba|r*foo",
										"bit$Bite",
										"boomBam",
										"fo|o*b.ar",
										"jfq4@#!$!@|f1.$4r14i5u",
										"ouagadogou",
										"seaweed",
										"seaweed",
										"seaweed",
										"squawl",
										"zulu"
									];
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(	(store.getValue(items[i], "uniqueId") === orderedArray0[i])&&
							(store.getValue(items[i], "value") === orderedArray1[i]))
						){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected sorting order found, sort failure."));
				}
			}
		
			function error(error, request){
				t.assertTrue(false);
				d.errback(error);
			}
		
			var sortAttributes = [{ attribute: "value"}, { attribute: "uniqueId", descending: true}];
			store.fetch({onComplete: completed, onError: error, sort: sortAttributes});
			return d;
		}
	},
	{
		name: "Read API: fetch() sortMultipleSpecialComparator",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test sorting on multiple attributes with a custom comparator.
			//	description:
			//		Function to test sorting on multiple attributes with a custom comparator.

			var store = new datastore({data: { identifier: "uniqueId", 
											 items: [ {uniqueId: 1, status:"CLOSED"},
												  {uniqueId: 2,  status:"OPEN"}, 
												  {uniqueId: 3,  status:"PENDING"},
												  {uniqueId: 4,  status:"BLOCKED"},
												  {uniqueId: 5,  status:"CLOSED"},
												  {uniqueId: 6,  status:"OPEN"},
												  {uniqueId: 7,  status:"PENDING"},
												  {uniqueId: 8,  status:"PENDING"},
												  {uniqueId: 10, status:"BLOCKED"},
												  {uniqueId: 12, status:"BLOCKED"},
												  {uniqueId: 11, status:"OPEN"},
												  {uniqueId: 9,  status:"CLOSED"}
												]
									   }
								});
		
		
			store.comparatorMap = {};
			store.comparatorMap["status"] = function(a,b) { 
				var ret = 0;
				// We want to map these by what the priority of these items are, not by alphabetical.
				// So, custom comparator.
				var enumMap = { OPEN: 3, BLOCKED: 2, PENDING: 1, CLOSED: 0};
				if (enumMap[a] > enumMap[b]) {
					ret = 1;
				}
				if (enumMap[a] < enumMap[b]) {
					ret = -1;
				}
				return ret;
			};
		
			var sortAttributes = [{attribute: "status", descending: true}, { attribute: "uniqueId", descending: true}];
		
			var d = new doh.Deferred();
			function completed(items, findResult){
				var orderedArray = [11,6,2,12,10,4,8,7,3,9,5,1];
				var passed = true;
				for(var i = 0; i < items.length; i++){
					var value = store.getValue(items[i], "value");
					if(!(store.getValue(items[i], "uniqueId") === orderedArray[i])){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected sorting order found, sort failure."));
				}
			}
		
			function error(errData, request){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetch({onComplete: completed, onError: error, sort: sortAttributes});
			return d;
		}
	},
	{
		name: "Read API: fetch() sortAlphabeticWithUndefined",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test sorting alphabetic ordering.
			//	description:
			//		Function to test sorting alphabetic ordering.
		
			var store = new datastore({data: { identifier: "uniqueId", 
											 items: [ {uniqueId: 0, value:"abc"},
												  {uniqueId: 1, value:"bca"}, 
												  {uniqueId: 2, value:"abcd"},
												  {uniqueId: 3, value:"abcdefg"},
												  {uniqueId: 4, value:"lmnop"},
												  {uniqueId: 5, value:"foghorn"},
												  {uniqueId: 6, value:"qberty"},
												  {uniqueId: 7, value:"qwerty"},
												  {uniqueId: 8 },  //Deliberate undefined value
												  {uniqueId: 9, value:"seaweed"},
												  {uniqueId: 10, value:"123abc"}
		
												]
									   }
								});
			
			var d = new doh.Deferred();
			function completed(items, request){
				//Output should be in this order...
				var orderedArray = [10,0,2,3,1,5,4,6,7,9,8];
				t.assertEqual(items.length, 11);
				var passed = true;
				for(var i = 0; i < items.length; i++){
					if(!(store.getValue(items[i], "uniqueId") === orderedArray[i])){
						passed=false;
						break;
					}
				}
				t.assertTrue(passed);
				if (passed){
					d.callback(true);
				}else{
					d.errback(new Error("Unexpected sorting order found, sort failure."));
				}
			}
		
			function error(error, request) {
				t.assertTrue(false);
				d.errback(error);
			}
		
			var sortAttributes = [{attribute: "value"}];
			store.fetch({onComplete: completed, onError: error, sort: sortAttributes});
			return d;
		}
	},
	{
		name: "Read API: errorCondition_idCollision_inMemory",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the errors thrown when there is an id collision in the data.
			//		Added because of tracker: #2546
			//	description:
			//		Simple test of the errors thrown when there is an id collision in the data.
			//		Added because of tracker: #2546

			var store = new datastore({	data: { identifier: "uniqueId", 
																items: [{uniqueId: 12345, value:"foo"},
																		{uniqueId: 123456, value:"bar"}, 
																		{uniqueId: 12345, value:"boom"},
																		{uniqueId: 123457, value:"bit"}
																	]
																}
															});
			var d = new doh.Deferred();
			function onComplete(items, request){
				//This is bad if this fires, this case should fail and not call onComplete.
				t.assertTrue(false);
				d.callback(false);
			}
		
			function reportError(errData, request){
				//This is good if this fires, it is expected.
				t.assertTrue(true);
				d.callback(true);
			}
			store.fetch({onComplete: onComplete, onError: reportError});
			return d;
		}
	},
	{
		name: "Read API: errorCondition_idCollision_xhr",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test of the errors thrown when there is an id collision in the data.
			//		Added because of tracker: #2546
			//	description:
			//		Simple test of the errors thrown when there is an id collision in the data.
			//		Added because of tracker: #2546

			if(dojo.isBrowser){
				var store = new datastore({url: dojo.moduleUrl("tests", "data/countries_idcollision.json").toString() });
				var d = new doh.Deferred();
				function onComplete(items, request){
					//This is bad if this fires, this case should fail and not call onComplete.
					t.assertTrue(false);
					d.callback(false);
				}

				function reportError(errData, request){
					//This is good if this fires, it is expected.
					t.assertTrue(true);
					d.callback(true);
				}
				store.fetch({onComplete: onComplete, onError: reportError});
				return d;
			}
		}
	},
	{
		name: "Read API: Date_datatype",
 		runTest: function(datastore, t){
			//var store = new datastore(tests.data.readOnlyItemFileTestTemplates.testFile["countries_withDates"]);
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries_withDates"));
			
			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				var independenceDate = store.getValue(item, "independence");
				t.assertTrue(independenceDate instanceof Date);
				//Check to see if the value was deserialized properly.  Since the store stores in UTC/GMT, it 
				//should also be compared in the UTC/GMT mode
				t.assertTrue(dojo.date.stamp.toISOString(independenceDate, {zulu:true}) === "1993-05-24T00:00:00Z");
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity:"er", onItem:onItem, onError:onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: custom_datatype_Color_SimpleMapping",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test using literal values with custom datatypes
			var dataset = {
				identifier:'name',
				items: [
					{ name:'Kermit', species:'frog', color:{_type:'Color', _value:'green'} },
					{ name:'Beaker', hairColor:{_type:'Color', _value:'red'} }
				]
			};
			var store = new datastore({
					data:dataset,
					typeMap:{'Color': dojo.Color}
			});
			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				var beaker = item;
				var hairColor = store.getValue(beaker, "hairColor");
				t.assertTrue(hairColor instanceof dojo.Color);
				t.assertTrue(hairColor.toHex() == "#ff0000");
				d.callback(true);
			}
			function onError(errData){
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity:"Beaker", onItem:onItem, onError:onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: custom_datatype_Color_GeneralMapping",
 		runTest: function(datastore, t){
			//	summary: 
			//		Function to test using literal values with custom datatypes
			var dataset = {
				identifier:'name',
				items: [
					{ name:'Kermit', species:'frog', color:{_type:'Color', _value:'green'} },
					{ name:'Beaker', hairColor:{_type:'Color', _value:'red'} }
				]
			};
			var store = new datastore({
					data:dataset,
					typeMap:{'Color': 	{	
											type: dojo.Color,
											deserialize: function(value){
												return new dojo.Color(value);
											}
										}
							}
			});
			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				var beaker = item;
				var hairColor = store.getValue(beaker, "hairColor");
				t.assertTrue(hairColor instanceof dojo.Color);
				t.assertTrue(hairColor.toHex() == "#ff0000");
				d.callback(true);
			}
			function onError(errData){
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity:"Beaker", onItem:onItem, onError:onError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: hierarchical_data",
 		runTest: function(datastore, t){
			//var store = new datastore(tests.data.readOnlyItemFileTestTemplates.testFile["geography_hierarchy_small"]);
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("geography_hierarchy_small"));
			var d = new doh.Deferred();
			function onComplete(items, request){
				t.assertEqual(items.length, 1);
				var northAmerica = items[0];
				var canada = store.getValue(northAmerica, "countries");
				var toronto = store.getValue(canada, "cities");
				t.assertEqual(store.getValue(canada, "name"), "Canada");
				t.assertEqual(store.getValue(toronto, "name"), "Toronto");
				d.callback(true);
			}
			function onError(errData){
				d.errback(errData);
			}
			store.fetch({
				query: {name: "North America"},
				onComplete: onComplete,
				onError: onError
			});
			
			return d; // Deferred
		}
	},
	{
		name: "Identity API: no_identifier_specified",
 		runTest: function(datastore, t){
			var arrayOfItems = [
				{name:"Kermit", color:"green"},
				{name:"Miss Piggy", likes:"Kermit"}, 
				{name:"Beaker", hairColor:"red"}
			];
			var store = new datastore({data:{items:arrayOfItems}});
			var d = new doh.Deferred();
			function onComplete(items, request){
				var features = store.getFeatures();
				var hasIdentityFeature = Boolean(features['dojo.data.api.Identity']);
				t.assertTrue(hasIdentityFeature);
				for(var i = 0; i < items.length; ++i){
					var item = items[i];
					var identifier = store.getIdentityAttributes(item);
					t.assertTrue(identifier === null);
					var identity = store.getIdentity(item);
					t.assertTrue(typeof identity == "number");
				}
				d.callback(true);
			}
			function reportError(errData, request){
				d.errback(true);
			}
			store.fetch({onComplete: onComplete, onError: reportError});
			return d; // Deferred
		}
	},
	{
		name: "Identity API: hierarchical_data",
 		runTest: function(datastore, t){
			var store = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("geography_hierarchy_small"));
			var d = new doh.Deferred();
			function onComplete(items, request){
				var features = store.getFeatures();
				var hasIdentityFeature = Boolean(features['dojo.data.api.Identity']);
				t.assertTrue(hasIdentityFeature);
				for(var i = 0; i < items.length; ++i){
					var item = items[i];
					var identifier = store.getIdentityAttributes(item);
					t.assertTrue(identifier === null);
					var identity = store.getIdentity(item);
					t.assertTrue(typeof identity == "number");
				}
				d.callback(true);
			}
			function reportError(errData, request){
				d.errback(true);
			}
			store.fetch({onComplete: onComplete, onError: reportError});
			return d; // Deferred
		}
	},
	{
		name: "Read API: functionConformance",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test read API conformance.  Checks to see all declared functions are actual functions on the instances.
			//	description:
			//		Simple test read API conformance.  Checks to see all declared functions are actual functions on the instances.
			var testStore = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));
			var readApi = new dojo.data.api.Read();
			var passed = true;

			for(i in readApi){
				if(i.toString().charAt(0) !== '_')
				{
					var member = readApi[i];
					//Check that all the 'Read' defined functions exist on the test store.
					if(typeof member === "function"){
						var testStoreMember = testStore[i];
						if(!(typeof testStoreMember === "function")){
							passed = false;
							break;
						}
					}
				}
			}
			t.assertTrue(passed);
		}
	},
	{
		name: "Identity API: functionConformance",
 		runTest: function(datastore, t){
			//	summary: 
			//		Simple test identity API conformance.  Checks to see all declared functions are actual functions on the instances.
			//	description:
			//		Simple test identity API conformance.  Checks to see all declared functions are actual functions on the instances.
			var testStore = new datastore(tests.data.readOnlyItemFileTestTemplates.getTestData("countries"));
			var identityApi = new dojo.data.api.Identity();
			var passed = true;

			for(i in identityApi){

				if(i.toString().charAt(0) !== '_')
				{
					var member = identityApi[i];
					//Check that all the 'Read' defined functions exist on the test store.
					if(typeof member === "function"){
						var testStoreMember = testStore[i];
						if(!(typeof testStoreMember === "function")){
							passed = false;
							break;
						}
					}
				}
			}
			t.assertTrue(passed);
		}
	}
];

