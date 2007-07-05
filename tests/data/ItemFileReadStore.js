dojo.provide("tests.data.ItemFileReadStore");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojo.data.api.Read");
dojo.require("dojo.data.api.Identity");

tests.data.ItemFileReadStore.getCountriesStore = function(){
	if(dojo.isBrowser){
		return new dojo.data.ItemFileReadStore({url: dojo.moduleUrl("tests", "data/countries.json").toString() } );
	}else{
		var jsonData = {};
		jsonData.identifier="abbr";
		jsonData.label="name";
		jsonData.items= [];
		jsonData.items.push({abbr:"ec",name:"Ecuador",capital:"Quito"});
		jsonData.items.push({abbr:'eg',name:'Egypt',capital:'Cairo'});
		jsonData.items.push({abbr:'sv',name:'El Salvador',capital:'San Salvador'});
		jsonData.items.push({abbr:'gq',name:'Equatorial Guinea',capital:'Malabo'});
		jsonData.items.push({abbr:'er',name:'Eritrea',capital:'Asmara'});
		jsonData.items.push({abbr:'ee',name:'Estonia',capital:'Tallinn' });
		jsonData.items.push({abbr:'et',name:'Ethiopia',capital:'Addis Ababa'});
		return new dojo.data.ItemFileReadStore({data: jsonData});
	}
};

tests.data.ItemFileReadStore.getCountriesStoreWithNull = function(){
	if(dojo.isBrowser){
		return new dojo.data.ItemFileReadStore({url: dojo.moduleUrl("tests", "data/countries_withNull.json").toString() } );
	}else{
		var jsonData = {};
		jsonData.identifier="abbr";
		jsonData.items= [];
		jsonData.items.push({abbr:"ec",name:null,capital:"Quito"});
		jsonData.items.push({abbr:'eg',name:null,capital:'Cairo'});
		jsonData.items.push({abbr:'sv',name:'El Salvador',capital:'San Salvador'});
		jsonData.items.push({abbr:'gq',name:'Equatorial Guinea',capital:'Malabo'});
		jsonData.items.push({abbr:'er',name:'Eritrea',capital:'Asmara'});
		jsonData.items.push({abbr:'ee',name:null,capital:'Tallinn' });
		jsonData.items.push({abbr:'et',name:'Ethiopia',capital:'Addis Ababa'});
		return new dojo.data.ItemFileReadStore({data: jsonData});
	}
};

tests.data.ItemFileReadStore.getCountriesStoreWithBoolean = function(){
	if(dojo.isBrowser){
		return new dojo.data.ItemFileReadStore({url: dojo.moduleUrl("tests", "data/countries_withBoolean.json").toString() } );
	}else{
		var jsonData = {};
		jsonData.identifier="abbr";
		jsonData.items= [];
		jsonData.items.push({abbr:"ec",name:"Ecuador",capital:"Quito",real:true});
		jsonData.items.push({abbr:'eg',name:'Egypt',capital:'Cairo',real:true});
		jsonData.items.push({abbr:'sv',name:'El Salvador',capital:'San Salvador',real:true});
		jsonData.items.push({abbr:'gq',name:'Equatorial Guinea',capital:'Malabo',real:true});
		jsonData.items.push({abbr:'er',name:'Eritrea',capital:'Asmara',real:true});
		jsonData.items.push({abbr:'ee',name:'Estonia',capital:'Tallinn',real:true});
		jsonData.items.push({abbr:'et',name:'Ethiopia',capital:'Addis Ababa',real:true});
		jsonData.items.push({abbr:'ut',name:'Utopia',capital:'Paradise',real:false});
		return new dojo.data.ItemFileReadStore({data: jsonData});
	}
};

tests.data.ItemFileReadStore.getCountriesStoreWithDates = function(){
	if(dojo.isBrowser){
		return new dojo.data.ItemFileReadStore({url: dojo.moduleUrl("tests", "data/countries_withDates.json").toString() } );
	}else{
		var jsonData = {};
		jsonData.identifier="abbr";
		jsonData.items= [];
		jsonData.items.push({abbr:"ec",name:"Ecuador",capital:"Quito"});
		jsonData.items.push({abbr:'eg',name:'Egypt',capital:'Cairo'});
		jsonData.items.push({abbr:'sv',name:'El Salvador',capital:'San Salvador'});
		jsonData.items.push({abbr:'gq',name:'Equatorial Guinea',capital:'Malabo'});
		jsonData.items.push({abbr:'er',name:'Eritrea',capital:'Asmara',independence:{_type:'Date', _value:738226800000}}); // May 24, 1993
		jsonData.items.push({abbr:'ee',name:'Estonia',capital:'Tallinn',independence:{_type:'Date', _value:682671600000}}); // August 20, 1991
		jsonData.items.push({abbr:'et',name:'Ethiopia',capital:'Addis Ababa'});
		return new dojo.data.ItemFileReadStore({data: jsonData});
	}
};

tests.data.ItemFileReadStore.getGeographyHierarchy = function(){
	if(dojo.isBrowser){
		return new dojo.data.ItemFileReadStore({url: dojo.moduleUrl("tests", "data/geography_hierarchy_small.json").toString() } );
	}else{
		var jsonData = { 
			items:[
				{ name:'Africa', countries:[
					{ name:'Egypt', capital:'Cairo' },
					{ name:'Kenya', capital:'Nairobi' },
					{ name:'Sudan', capital:'Khartoum' }]},
				{ name:'Australia', capital:'Canberra' },
				{ name:'North America', countries:[
					{ name:'Canada', population:'33 million', cities:[
						{ name:'Toronto', population:'2.5 million' }]}]}
			]};
		return new dojo.data.ItemFileReadStore({data: jsonData});
	}
};

doh.register("tests.data.ItemFileReadStore", 
	[
		function testIdentityAPI_fetchItemByIdentity(t){
			//	summary: 
			//		Simple test of the fetchItemByIdentity function of the store.
			//	description:
			//		Simple test of the fetchItemByIdentity function of the store.
			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testIdentityAPI_fetchItemByIdentity_notFound(t){
			//	summary: 
			//		Simple test of the fetchItemByIdentity function of the store.
			//	description:
			//		Simple test of the fetchItemByIdentity function of the store.
			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testIdentityAPI_getIdentityAttributes(t){
			//	summary: 
			//		Simple test of the getIdentityAttributes function.
			//	description:
			//		Simple test of the getIdentityAttributes function.
			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testIdentityAPI_fetchItemByIdentity_commentFilteredJson(t){
			//	summary: 
			//		Simple test of the fetchItemByIdentity function of the store.
			//	description:
			//		Simple test of the fetchItemByIdentity function of the store.
			//		This tests loading a comment-filtered json file so that people using secure
			//		data with this store can bypass the JavaSceipt hijack noted in Fortify's
			//		paper.

			if(dojo.isBrowser){
				var store = new dojo.data.ItemFileReadStore({url: dojo.moduleUrl("tests", "data/countries_commentFiltered.json").toString()});

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
				return d // Deferred
			}
		},
		function testIdentityAPI_fetchItemByIdentity_nullValue(t){
			//	summary: 
			//		Simple test of the fetchItemByIdentity function of the store, checling a null value.
			//	description:
			//		Simple test of the fetchItemByIdentity function of the store, checking a null value.
			//		This tests handling attributes in json that were defined as null properly.
			//		Introduced because of tracker: #3153

			var store = tests.data.ItemFileReadStore.getCountriesStoreWithNull();

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
			return d // Deferred
		},
		function testIdentityAPI_fetchItemByIdentity_booleanValue(t){
			//	summary: 
			//		Simple test of the fetchItemByIdentity function of the store, checking a boolean value.
			//	description:
			//		Simple test of the fetchItemByIdentity function of the store, checking a boolean value.

			var store = tests.data.ItemFileReadStore.getCountriesStoreWithBoolean();

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
			return d // Deferred
		},
		function testIdentityAPI_getIdentity(t){
			//	summary: 
			//		Simple test of the getIdentity function of the store.
			//	description:
			//		Simple test of the getIdentity function of the store.

			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testReadAPI_fetch_all(t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore.
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore.
			
			var store = tests.data.ItemFileReadStore.getCountriesStore();
			
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
		},
		function testReadAPI_fetch_one(t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore of a single item.
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore of a single item.

			var store = tests.data.ItemFileReadStore.getCountriesStore();
			
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
		},
		function testReadAPI_fetch_one_commentFilteredJson(t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore of a single item.
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore of a single item.
			//		This tests loading a comment-filtered json file so that people using secure
			//		data with this store can bypass the JavaSceipt hijack noted in Fortify's
			//		paper.

			if(dojo.isBrowser){
				var store = new dojo.data.ItemFileReadStore({url: dojo.moduleUrl("tests", "data/countries_commentFiltered.json").toString()});

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
		function testReadAPI_fetch_withNull(t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore of a single item where some attributes are null.
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore of a single item where some attributes are null.
			//		Introduced because of tracker: #3153

			var store = tests.data.ItemFileReadStore.getCountriesStoreWithNull();
			
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
		},
		function testReadAPI_fetch_all_streaming(t){
			//	summary: 
			//		Simple test of a basic fetch on ItemFileReadStore.
			//	description:
			//		Simple test of a basic fetch on ItemFileReadStore.

			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
		},
		function testReadAPI_fetch_paging(t){
			 //	summary: 
			 //		Test of multiple fetches on a single result.  Paging, if you will.
			 //	description:
			 //		Test of multiple fetches on a single result.  Paging, if you will.

			var store = tests.data.ItemFileReadStore.getCountriesStore();
			
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

		},
		function testReadAPI_getLabel(t){
			//	summary: 
			//		Simple test of the getLabel function against a store set that has a label defined.
			//	description:
			//		Simple test of the getLabel function against a store set that has a label defined.

			var store = tests.data.ItemFileReadStore.getCountriesStore();
			
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
		},
		function testReadAPI_getLabelAttributes(t){
			//	summary: 
			//		Simple test of the getLabelAttributes function against a store set that has a label defined.
			//	description:
			//		Simple test of the getLabelAttributes function against a store set that has a label defined.

			var store = tests.data.ItemFileReadStore.getCountriesStore();
			
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
		},
		function testReadAPI_getValue(t){
			//	summary: 
			//		Simple test of the getValue function of the store.
			//	description:
			//		Simple test of the getValue function of the store.

			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testReadAPI_getValues(t){
			//	summary: 
			//		Simple test of the getValues function of the store.
			//	description:
			//		Simple test of the getValues function of the store.

			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testReadAPI_isItem(t){
			//	summary: 
			//		Simple test of the isItem function of the store
			//	description:
			//		Simple test of the isItem function of the store

			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testReadAPI_isItem_multistore(t){
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
			var store1 = tests.data.ItemFileReadStore.getCountriesStore();
			var store2 = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testReadAPI_hasAttribute(t){
			//	summary: 
			//		Simple test of the hasAttribute function of the store
			//	description:
			//		Simple test of the hasAttribute function of the store

			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testReadAPI_containsValue(t){
			//	summary: 
			//		Simple test of the containsValue function of the store
			//	description:
			//		Simple test of the containsValue function of the store

			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testReadAPI_getAttributes(t){
			//	summary: 
			//		Simple test of the getAttributes function of the store
			//	description:
			//		Simple test of the getAttributes function of the store

			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
			return d // Deferred
		},
		function testReadAPI_getFeatures(t){
			//	summary: 
			//		Simple test of the getFeatures function of the store
			//	description:
			//		Simple test of the getFeatures function of the store

			var store = tests.data.ItemFileReadStore.getCountriesStore();

			var features = store.getFeatures(); 
			var count = 0;
			for(i in features){
				t.assertTrue((i === "dojo.data.api.Read" || i === "dojo.data.api.Identity"));
				count++;
			}
			t.assertEqual(count, 2);
		},
		function testReadAPI_fetch_patternMatch0(t){
			//	summary: 
			//		Function to test pattern matching of everything starting with lowercase e
			//	description:
			//		Function to test pattern matching of everything starting with lowercase e

			var store = tests.data.ItemFileReadStore.getCountriesStore();

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
		},
		function testReadAPI_fetch_patternMatch1(t){
			//	summary: 
			//		Function to test pattern matching of everything with $ in it.
			//	description:
			//		Function to test pattern matching of everything with $ in it.

			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_patternMatch2(t){
			//	summary: 
			//		Function to test exact pattern match
			//	description:
			//		Function to test exact pattern match

			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_patternMatch_caseSensitive(t){
			//	summary: 
			//		Function to test pattern matching of a pattern case-sensitively
			//	description:
			//		Function to test pattern matching of a pattern case-sensitively

			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_patternMatch_caseInsensitive(t){
			//	summary: 
			//		Function to test pattern matching of a pattern case-insensitively
			//	description:
			//		Function to test pattern matching of a pattern case-insensitively

			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_sortNumeric(t){
			//	summary: 
			//		Function to test sorting numerically.
			//	description:
			//		Function to test sorting numerically.
			
			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_sortNumericDescending(t){
			//	summary: 
			//		Function to test sorting numerically.
			//	description:
			//		Function to test sorting numerically.

			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_sortNumericWithCount(t){
			//	summary: 
			//		Function to test sorting numerically in descending order, returning only a specified number of them.
			//	description:
			//		Function to test sorting numerically in descending order, returning only a specified number of them.
		
			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_sortAlphabetic(t){
			//	summary: 
			//		Function to test sorting alphabetic ordering.
			//	description:
			//		Function to test sorting alphabetic ordering.
		
			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_sortAlphabeticDescending(t){
			//	summary: 
			//		Function to test sorting alphabetic ordering in descending mode.
			//	description:
			//		Function to test sorting alphabetic ordering in descending mode.
		
			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_sortDate(t){
			//	summary: 
			//		Function to test sorting date.
			//	description:
			//		Function to test sorting date.
		
			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_sortDateDescending(t){
			//	summary: 
			//		Function to test sorting date in descending order.
			//	description:
			//		Function to test sorting date in descending order.
		
			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_sortMultiple(t){
			//	summary: 
			//		Function to test sorting on multiple attributes.
			//	description:
			//		Function to test sorting on multiple attributes.
			
			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_sortMultipleSpecialComparator(t){
			//	summary: 
			//		Function to test sorting on multiple attributes with a custom comparator.
			//	description:
			//		Function to test sorting on multiple attributes with a custom comparator.

			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_fetch_sortAlphabeticWithUndefined(t){
			//	summary: 
			//		Function to test sorting alphabetic ordering.
			//	description:
			//		Function to test sorting alphabetic ordering.
		
			var store = new dojo.data.ItemFileReadStore({data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_errorCondition_idCollision_inMemory(t){
			//	summary: 
			//		Simple test of the errors thrown when there is an id collision in the data.
			//		Added because of tracker: #2546
			//	description:
			//		Simple test of the errors thrown when there is an id collision in the data.
			//		Added because of tracker: #2546

			var store = new dojo.data.ItemFileReadStore({	data: { identifier: "uniqueId", 
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
		},
		function testReadAPI_errorCondition_idCollision_xhr(t){
			//	summary: 
			//		Simple test of the errors thrown when there is an id collision in the data.
			//		Added because of tracker: #2546
			//	description:
			//		Simple test of the errors thrown when there is an id collision in the data.
			//		Added because of tracker: #2546

			if(dojo.isBrowser){
				var store = new dojo.data.ItemFileReadStore({url: dojo.moduleUrl("tests", "data/countries_idcollision.json").toString() });
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
		function testReadAPI_Date_datatype(t){
			var store = tests.data.ItemFileReadStore.getCountriesStoreWithDates();
			
			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				var independenceDate = store.getValue(item, "independence");
				t.assertTrue(independenceDate instanceof Date);
				t.assertTrue(independenceDate.valueOf() == 738226800000);
				t.assertTrue((new Date('May 24, 1993')).valueOf() == independenceDate.valueOf());
				d.callback(true);
			}
			function onError(errData){
				t.assertTrue(false);
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity:"er", onItem:onItem, onError:onError});
			return d // Deferred
		},
		function testReadAPI_custom_datatype_Color(t){
			//	summary: 
			//		Function to test using literal values with custom datatypes
			var dataset = {
				identifier:'name',
				items: [
					{ name:'Kermit', species:'frog', color:{_type:'Color', _value:'green'} },
					{ name:'Beaker', hairColor:{_type:'Color', _value:'red'} }
				]
			};
			var store = new dojo.data.ItemFileReadStore({
				data:dataset,
				typeMap:{'Color':dojo.Color}
			});
			var d = new doh.Deferred();
			function onItem(item){
				t.assertTrue(item !== null);
				var beaker = item;
				var hairColor = store.getValue(beaker, "hairColor");
				t.assertTrue(hairColor instanceof dojo.Color);
				t.assertTrue(hairColor.toHex() == "#ff0000")
				d.callback(true);
			}
			function onError(errData){
				d.errback(errData);
			}
			store.fetchItemByIdentity({identity:"Beaker", onItem:onItem, onError:onError});
			return d // Deferred
		},
		function testReadAPI_hierarchical_data(t){
			var store = tests.data.ItemFileReadStore.getGeographyHierarchy();
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
			
			return d // Deferred
		},
		function testReadAPI_functionConformance(t){
			//	summary: 
			//		Simple test read API conformance.  Checks to see all declared functions are actual functions on the instances.
			//	description:
			//		Simple test read API conformance.  Checks to see all declared functions are actual functions on the instances.

			var testStore = tests.data.ItemFileReadStore.getCountriesStore();
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
		},
		function testIdentityAPI_functionConformance(t){
			//	summary: 
			//		Simple test identity API conformance.  Checks to see all declared functions are actual functions on the instances.
			//	description:
			//		Simple test identity API conformance.  Checks to see all declared functions are actual functions on the instances.

			var testStore = tests.data.ItemFileReadStore.getCountriesStore();
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
	]
);

