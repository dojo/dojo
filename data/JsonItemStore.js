dojo.provide("dojo.data.JsonItemStore");

dojo.require("dojo.data.util.filter");
dojo.require("dojo.data.util.simpleFetch");

dojo.declare("dojo.data.JsonItemStore",
	null,
	function(/* Object */ keywordParameters){
		// summary: initializer
		// keywordParameters: {url: String}
		// keywordParameters: {data: jsonObject}
		this._arrayOfAllItems = [];
		this._loadFinished = false;
		this._jsonFileUrl = keywordParameters.url;
		this._jsonData = keywordParameters.data;
		this._features = { 'dojo.data.api.Read': true};
		this._itemsByIdentity = null;
		this._itemMap = {}; // Simple associative map for making an O(1) isItem.
		this._storeRef = "_S";  //Default name for the store reference to attach to every item.
		this._itemId = "_0"; //Default Item Id for isItem to attach to every item.
	},{
	//	summary:
	//		The JsonItemStore implements the dojo.data.api.Read API and reads
	//		data from JSON files that have contents in this format --
	//		{ items: [
	//			{ name:'Kermit', color:'green', age:12, friends:['Gonzo', {reference:{name:'Fozzie Bear'}}]},
	//			{ name:'Fozzie Bear', wears:['hat', 'tie']},
	//			{ name:'Miss Piggy', pets:'Foo-Foo'}
	//		]}
	//		Note that it can also contain an 'identifer' property that specified which attribute on the items 
	//		in the array of items that acts as the unique identifier for that item.
	//

	url: undefined,

	_assertIsItem: function(/* item */ item){
		//	summary:
		//      This function tests whether the item passed in is indeed an item in the store.
		//	item: 
		//		The item to test for being contained by the store.
		if(!this.isItem(item)){ 
			throw new Error("dojo.data.JsonItemStore: a function was passed an item argument that was not an item");
		}
	},

	_assertIsAttribute: function(/* item || String */ attribute){
		//	summary:
		//      This function tests whether the item passed in is indeed a valid 'attribute' like type for the store.
		//	attribute: 
		//		The attribute to test for being contained by the store.
		if(typeof attribute !== "string"){ 
			throw new Error("dojo.data.JsonItemStore: a function was passed an attribute argument that was not an attribute name string");
		}
	},

	getValue: function(	/* item */ item, 
						/* attribute || attribute-name-string */ attribute, 
						/* value? */ defaultValue){
		//	summary: 
		//      See dojo.data.api.Read.getValue()
		var values = this.getValues(item, attribute);
		return (values.length > 0)?values[0]:defaultValue; //Object || int || Boolean
	},

	getValues: function(/* item */ item, 
						/* attribute || attribute-name-string */ attribute){
		//	summary: 
		//		See dojo.data.api.Read.getValues()

		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		return item[attribute] || []; //Array
	},

	getAttributes: function(/* item */ item){
		//	summary: 
		//		See dojo.data.api.Read.getAttributes()
		this._assertIsItem(item);
		var attributes = [];
		for(var key in item){
			//Save off only the real item attributes, not the special id marks for O(1) isItem.
			if((key !== this._storeRef) && (key !== this._itemId)){
				attributes.push(key);
			}
		}
		return attributes; //Array
	},

	hasAttribute: function(	/* item */ item,
							/* attribute || attribute-name-string */ attribute) {
		//	summary: 
		//		See dojo.data.api.Read.hasAttribute()
		return this.getValues(item, attribute).length > 0;
	},

	containsValue: function(/* item */ item, 
							/* attribute || attribute-name-string */ attribute, 
							/* anything */ value){
		//	summary: 
		//		See dojo.data.api.Read.containsValue()
		var regexp = undefined;
		if(typeof value === "string"){
		   regexp = dojo.data.util.filter.patternToRegExp(value, false);
		}
		return this._containsValue(item, attribute, value, regexp); //boolean.
	},

	_containsValue: function(	/* item */ item, 
								/* attribute || attribute-name-string */ attribute, 
								/* anything */ value,
								/* RegExp?*/ regexp){
		//	summary: 
		//		Internal function for looking at the values contained by the item.
		//	description: 
		//		Internal function for looking at the values contained by the item.  This 
		//		function allows for denoting if the comparison should be case sensitive for
		//		strings or not (for handling filtering cases where string case should not matter)
		//	
		//	item:
		//		The data item to examine for attribute values.
		//	attribute:
		//		The attribute to inspect.
		//	value:	
		//		The value to match.
		//	regexp:
		//		Optional regular expression generated off value if value was of string type to handle wildcarding.
		//		If present and attribute values are string, then it can be used for comparison instead of 'value'
		var values = this.getValues(item, attribute);
		for(var i = 0; i < values.length; ++i){
			var possibleValue = values[i];
			if(typeof possibleValue === "string" && regexp){
				return (possibleValue.match(regexp) !== null);
			}else{
				//Non-string matching.
				if(value === possibleValue){
					return true; // Boolean
				}
			}
		}
		return false; // Boolean
	},

	isItem: function(/* anything */ something){
		//	summary: 
		//		See dojo.data.api.Read.isItem()
		if(something && something[this._storeRef] === this){
			if(this._itemMap[something[this._itemId]] === something){
				return true;
			}
		}
		return false; // Boolean
	},

	isItemLoaded: function(/* anything */ something){
		//	summary: 
		//		See dojo.data.api.Read.isItemLoaded()
		return this.isItem(something); //boolean
	},

	loadItem: function(/* object */ keywordArgs){
		//	summary: 
		//		See dojo.data.api.Read.loadItem()
		this._assertIsItem(keywordArgs.item);
	},

	getFeatures: function(){
		//	summary: 
		//		See dojo.data.api.Read.getFeatures()
		if (!this._loadFinished){
			// This has to happen to meet the property that the identity functions are
			// denoted to work only if the store has been loaded and it had an identifier 
			// property in the JSON.  So, for the feature to be found, the load had to have 
			// happened.
			this._forceLoad();
		}
		return this._features; //Object
	},

	_fetchItems: function(	/* Object */ keywordArgs, 
							/* Function */ findCallback, 
							/* Function */ errorCallback){
		//	summary: 
		//		See dojo.data.util.simpleFetch.fetch()
		var self = this;
		var filter = function(requestArgs, arrayOfAllItems){
			var items = null;
			if(requestArgs.query){
				var ignoreCase = requestArgs.queryOptions ? requestArgs.queryOptions.ignoreCase : false; 
				items = [];

				//See if there are any string values that can be regexp parsed first to avoid multiple regexp gens on the
				//same value for each item examined.  Much more efficient.
				var regexpList = {};
				for(var key in requestArgs.query){
					var value = requestArgs.query[key];
					if(typeof value === "string"){
						regexpList[key] = dojo.data.util.filter.patternToRegExp(value, ignoreCase);
					}
				}

				for(var i = 0; i < arrayOfAllItems.length; ++i){
					var match = true;
					var candidateItem = arrayOfAllItems[i];
					for(var key in requestArgs.query) {
						var value = requestArgs.query[key];
						if (!self._containsValue(candidateItem, key, value, regexpList[key])){
							match = false;
						}
					}
					if(match){
						items.push(candidateItem);
					}
				}
				findCallback(items, requestArgs);
			}else{
				// We want a copy to pass back in case the parent wishes to sort the array.  We shouldn't allow resort 
				// of the internal list so that multiple callers can get listsand sort without affecting each other.
				if(self._arrayOfAllItems.length> 0){
					items = self._arrayOfAllItems.slice(0,self._arrayOfAllItems.length); 
				}
				findCallback(items, requestArgs);
			}
		};

		if(this._loadFinished){
			filter(keywordArgs, this._arrayOfAllItems);
		}else{
			if(this._jsonFileUrl){
				var getArgs = {
						url: self._jsonFileUrl, 
						handleAs: "json-comment-optional"
					};
				var getHandler = dojo.xhrGet(getArgs);
				getHandler.addCallback(function(data){
					// console.debug(dojo.toJson(data));
					self._loadFinished = true;
					try{
						self._arrayOfAllItems = self._getItemsFromLoadedData(data);
						filter(keywordArgs, self._arrayOfAllItems);
					}catch(e){
						errorCallback(e, keywordArgs);
					}

				});
				getHandler.addErrback(function(error){
					errorCallback(error, keywordArgs);
				});
			}else if(this._jsonData){
				try{
					this._loadFinished = true;
					this._arrayOfAllItems = this._getItemsFromLoadedData(this._jsonData);
					this._jsonData = null;
					filter(keywordArgs, this._arrayOfAllItems);
				}catch(e){
					errorCallback(e, keywordArgs);
				}
			}else{
				errorCallback(new Error("dojo.data.JsonItemStore: No JSON source data was provided as either URL or a nested Javascript object."), keywordArgs);
			}
		}
	},

	close: function(/*dojo.data.api.Request || keywordArgs || null */ request){
		 //	summary: 
		 //		See dojo.data.api.Read.close()
	},

	_getItemsFromLoadedData: function(/* Object */ dataObject){
		//	summary:
		//		Function to parse the loaded data into item format and build the internal items array.
		//	description:
		//		Function to parse the loaded data into item format and build the internal items array.
		//
		//	dataObject:
		//		The JS data object containing the raw data to convery into item format.
		//
		// 	returns: array
		//		Array of items in store item format.

		var arrayOfItems = dataObject.items;
		var i;
		var item;
		var attrNames = {};

		// We need to do some transformations to convert the data structure
		// that we read from the file into a format that will be convenient
		// to work with in memory.

		// Step 1: We walk through all the attribute values of all the items, 
		// and replace single values with arrays.  For example, we change this:
		//		{ name:'Miss Piggy', pets:'Foo-Foo'}
		// into this:
		//		{ name:['Miss Piggy'], pets:['Foo-Foo']}
		// Also store off the keys so we can validate our store reference and item 
		// id special properties for the O(1) isItem
		for(i = 0; i < arrayOfItems.length; ++i){
			item = arrayOfItems[i];
            for(var key in item){
				var value = item[key];

				if(value !== null){
					if(!dojo.isArray(value)){
						item[key] = [value];
					}
				}else{
					item[key] = [null];
				}
				attrNames[key]=key;
			}
		}

		//Build unique keys for id and store ref.
		//This should go really fast, it will generally
		// never even run the loop..
		while(attrNames[this._storeRef]){
			this._storeRef += "_";
		}
		while(attrNames[this._itemId]){
			this._itemId += "_";
		}

		// Step 2: Some data files specify an optional 'identifier', which is 
		// the name of an attribute that holds the identity of each item.  If 
		// this data file specified an identifier attribute, then build an 
		// hash table of items keyed by the identity of the items.
		var identifier = dataObject.identifier;
		var arrayOfValues = null;
		if(identifier){
			this._features['dojo.data.api.Identity'] = identifier;
			this._itemsByIdentity = {};
			for(var i = 0; i < arrayOfItems.length; ++i){
				item = arrayOfItems[i];
				arrayOfValues = item[identifier];
				identity = arrayOfValues[0];
				if(!this._itemsByIdentity[identity]){
					this._itemsByIdentity[identity] = item;
				}else{
					if(this._jsonFileUrl){
						throw new Error("dojo.data.JsonItemStore:  The json data as specified by: [" + this._jsonFileUrl + "] is malformed.  Items within the list have identifier: [" + identifier + "].  Value collided: [" + identity + "]");
					}else if(this._jsonData){
						throw new Error("dojo.data.JsonItemStore:  The json data provided by the creation arguments is malformed.  Items within the list have identifier: [" + identifier + "].  Value collided: [" + identity + "]");
					}
				}

			}
		}

		// Step 3: We walk through all the attribute values of all the items,
		// and replace references with pointers to items.  For example, we change:
		//		{ name:['Kermit'], friends:[{reference:{name:'Miss Piggy'}}] }
		// into this:
		//		{ name:['Kermit'], friends:[miss_piggy] } 
		// (where miss_piggy is the object representing the 'Miss Piggy' item).
		// Also generate the associate map for all items for the O(1) isItem function.
		for(i = 0; i < arrayOfItems.length; ++i){
            item = arrayOfItems[i]; // example: { name:['Kermit'], friends:[{reference:{name:'Miss Piggy'}}] }
			item[this._storeRef] = this;
			item[this._itemId] = i;
			this._itemMap[i] = item;
			this._itemMap.lastItem = i;
			for(key in item){
				arrayOfValues = item[key]; // example: [{reference:{name:'Miss Piggy'}}]
				for(var j = 0; j < arrayOfValues.length; ++j) {
					value = arrayOfValues[j]; // example: {reference:{name:'Miss Piggy'}}
					if(value !== null && typeof value == "object" && value.reference){
						var referenceDescription = value.reference; // example: {name:'Miss Piggy'}
						if(dojo.isString(referenceDescription)){
							// example: 'Miss Piggy'
							// from an item like: { name:['Kermit'], friends:[{reference:'Miss Piggy'}]}
							arrayOfValues[j] = this._itemsByIdentity[referenceDescription];
						}else{
							// example: {name:'Miss Piggy'}
							// from an item like: { name:['Kermit'], friends:[{reference:{name:'Miss Piggy'}}] }
							for(var k = 0; k < arrayOfItems.length; ++k){
								var candidateItem = arrayOfItems[k];
								var found = true;
								for(var refKey in referenceDescription){
									if(candidateItem[refKey] != referenceDescription[refKey]){ 
										found = false; 
									}
								}
								if(found){ 
									arrayOfValues[j] = candidateItem; 
								}
							}
						}
					}
				}
			}
		}
		return arrayOfItems; //Array
	},

	getIdentity: function(/* item */ item){
		//	summary: 
		//		See dojo.data.api.Identity.getIdentity()
		var identifier = this._features['dojo.data.api.Identity'];
		var arrayOfValues = item[identifier];
		if(arrayOfValues){
			return arrayOfValues[0]; //Object || String
		}
		return null; //null
	},

	getItemByIdentity: function(/* String */ identity){
		//	summary: 
		//		See dojo.data.api.Identity.getItemByIdentity()

		// Force a sync'ed load if it hasn't occurred yet
		if(!this._loadFinished){
			this._forceLoad();
		}
		if(this._itemsByIdentity){
			var item = this._itemsByIdentity[identity];
			if(item !== undefined){
				return item; //Object
			}
		}
		return null; //null
	},

	_forceLoad: function(){
		//	summary: 
		//		Internal function to force a load of the store if it hasn't occurred yet.  This is required
		//		for specific functions to work properly.  See dojo.data.api.Identity.getItemByIdentity()
		var self = this;
		if(this._jsonFileUrl){
			var getArgs = {
					url: self._jsonFileUrl, 
					handleAs: "json-comment-optional",
					sync: true
				};
			var getHandler = dojo.xhrGet(getArgs);
			getHandler.addCallback(function(data){
				try{
					self._arrayOfAllItems = self._getItemsFromLoadedData(data);
					self._loadFinished = true;
				}catch(e){
					console.log(e);
					throw e;
				}
			});
			getHandler.addErrback(function(error){
				throw error;
			});
		}else if(this._jsonData){
			self._arrayOfAllItems = self._getItemsFromLoadedData(self._jsonData);
			self._jsonData = null;
			self._loadFinished = true;
		} 
	}
});
//Mix in the simple fetch implementation to this class.
dojo.extend(dojo.data.JsonItemStore,dojo.data.util.simpleFetch);
