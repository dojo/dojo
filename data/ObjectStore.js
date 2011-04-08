define("dojo/data/ObjectStore", ["dojo", "dojo/regexp"], function(dojo) {


dojo.declare("dojo.data.ObjectStore", null,{
		objectStore: null,
		constructor: function(options){
			// summary:
			//		A Dojo Data implementation that wraps Dojo object stores for backwards
			//		compatibility.
			//	options:
			//		The configuration information to pass into the data store.
			//	options.objectStore:
			//		The object store to use as the source provider for this data store
			dojo.mixin(this, options);
		},
		labelProperty: "label",

		getValue: function(/*Object*/ item, /*String*/property, /*value?*/defaultValue){
			// summary:
			//	Gets the value of an item's 'property'
			//
			//	item:
			//		The item to get the value from
			//	property:
			//		property to look up value for
			//	defaultValue:
			//		the default value
			
			return typeof item.get === "function" ? item.get(property) :
				property in item ?
					item[property] : defaultValue;
		},
		getValues: function(item, property){
			// summary:
			//		Gets the value of an item's 'property' and returns
			//		it.	If this value is an array it is just returned,
			//		if not, the value is added to an array and that is returned.
			//
			//	item: /* object */
			//	property: /* string */
			//		property to look up value for

			var val = this.getValue(item,property);
			return val instanceof Array ? val : val === undefined ? [] : [val];
		},

		getAttributes: function(item){
			// summary:
			//	Gets the available attributes of an item's 'property' and returns
			//	it as an array.
			//
			//	item: /* object */

			var res = [];
			for(var i in item){
				if(item.hasOwnProperty(i) && !(i.charAt(0) == '_' && i.charAt(1) == '_')){
					res.push(i);
				}
			}
			return res;
		},

		hasAttribute: function(item,attribute){
			// summary:
			//		Checks to see if item has attribute
			//
			//	item: /* object */
			//	attribute: /* string */
			return attribute in item;
		},

		containsValue: function(item, attribute, value){
			// summary:
			//		Checks to see if 'item' has 'value' at 'attribute'
			//
			//	item: /* object */
			//	attribute: /* string */
			//	value: /* anything */
			return dojo.indexOf(this.getValues(item,attribute),value) > -1;
		},


		isItem: function(item){
			// summary:
			//		Checks to see if the argument is an item
			//
			//	item: /* object */
			//	attribute: /* string */

			// we have no way of determining if it belongs, we just have object returned from
			// 	service queries
			return (typeof item == 'object') && item && !(item instanceof Date);
		},

		isItemLoaded: function(item){
			// summary:
			//		Checks to see if the item is loaded.
			//
			//		item: /* object */

			return item && typeof item.load !== "function";
		},

		loadItem: function(args){
			// summary:
			// 		Loads an item and calls the callback handler. Note, that this will call the callback
			// 		handler even if the item is loaded. Consequently, you can use loadItem to ensure
			// 		that an item is loaded is situations when the item may or may not be loaded yet.
			// 		If you access a value directly through property access, you can use this to load
			// 		a lazy value as well (doesn't need to be an item).
			//
			//	example:
			//		store.loadItem({
			//			item: item, // this item may or may not be loaded
			//			onItem: function(item){
			// 				// do something with the item
			//			}
			//		});

			var item;
			if(typeof args.item.load === "function"){
				dojo.when(args.item.load(), function(result){
					item = result; // in synchronous mode this can allow loadItem to return the value
					var func = result instanceof Error ? args.onError : args.onItem;
					if(func){
						func.call(args.scope, result);
					}
				});
			}else if(args.onItem){
				// even if it is already loaded, we will use call the callback, this makes it easier to
				// use when it is not known if the item is loaded (you can always safely call loadItem).
				args.onItem.call(args.scope, args.item);
			}
			return item;
		},
		close: function(request){
			return request && request.abort && request.abort();
		},
		fetch: function(args){
			// summary:
			//		See dojo.data.api.Read.fetch
			//
			
			args = args || {};
			var self = this;
			var scope = args.scope || self;
			var query = args.query;
			if(typeof query == "object"){ // can be null, but that is ignore by for-in
				query = dojo.delegate(query); // don't modify the original
				for(var i in query){
					// find any strings and convert them to regular expressions for wildcard support
					var required = query[i];
					if(typeof required == "string"){
						query[i] = RegExp("^" + dojo.regexp.escapeString(required, "*?").replace(/\*/g, '.*').replace(/\?/g, '.') + "$", args.queryOptions && args.queryOptions.ignoreCase ? "mi" : "m");
						query[i].toString = (function(original){
							return function(){
								return original;
							}
						})(required);
					}
				}
			}
			
			var results = this.objectStore.query(query, args);
			dojo.when(results.total, function(totalCount){
				dojo.when(results, function(results){
					if(args.onBegin){
						args.onBegin.call(scope, totalCount || results.length, args);
					}
					if(args.onItem){
						for(var i=0; i<results.length;i++){
							args.onItem.call(scope, results[i], args);
						}
					}
					if(args.onComplete){
						args.onComplete.call(scope, args.onItem ? null : results, args);
					}
					return results;
				}, errorHandler);
			}, errorHandler);
			function errorHandler(error){
				if(args.onError){
					args.onError.call(scope, error, args);
				}
			}
			args.abort = function(){
				// abort the request
				if(results.cancel){
					results.cancel();
				}
			};
			args.store = this;
			return args;
		},
		getFeatures: function(){
			// summary:
			// 		return the store feature set

			return {
				"dojo.data.api.Read": !!this.objectStore.get,
				"dojo.data.api.Identity": true,
				"dojo.data.api.Write": !!this.objectStore.put,
				"dojo.data.api.Notification": true
			};
		},

		getLabel: function(/* item */ item){
			//	summary:
			//		See dojo.data.api.Read.getLabel()
			if(this.isItem(item)){
				return this.getValue(item,this.labelProperty); //String
			}
			return undefined; //undefined
		},

		getLabelAttributes: function(/* item */ item){
			//	summary:
			//		See dojo.data.api.Read.getLabelAttributes()
			return [this.labelProperty]; //array
		},

		//Identity API Support


		getIdentity: function(item){
			return item.getId ? item.getId() : item[this.objectStore.idProperty || "id"];
		},

		getIdentityAttributes: function(item){
			// summary:
			//		returns the attributes which are used to make up the
			//		identity of an item.	Basically returns this.objectStore.idProperty

			return [this.objectStore.idProperty];
		},

		fetchItemByIdentity: function(args){
			// summary:
			//		fetch an item by its identity, by looking in our index of what we have loaded
			var item;
			dojo.when(this.objectStore.get(args.identity),
				function(result){
					item = result;
					args.onItem.call(args.scope, result);
				},
				function(error){
					args.onError.call(args.scope, error);
				}
			);
			return item;
		},
		
		newItem: function(data, parentInfo){
			// summary:
			//		adds a new item to the store at the specified point.
			//		Takes two parameters, data, and options.
			//
			//	data: /* object */
			//		The data to be added in as an item.
			if(parentInfo){
				// get the previous value or any empty array
				var values = this.getValue(parentInfo.parent,parentInfo.attribute,[]);
				// set the new value
				values = values.concat([data]);
				data.__parent = values;
				this.setValue(parentInfo.parent, parentInfo.attribute, values);
			}
			this._dirtyObjects.push({object:data, save: true});
			this.onNew(data);
			return data;
		},
		deleteItem: function(item){
			// summary:
			//		deletes item and any references to that item from the store.
			//
			//	item:
			//		item to delete
			//

			//	If the desire is to delete only one reference, unsetAttribute or
			//	setValue is the way to go.
			this.changing(item, true);

			this.onDelete(item);
		},
		setValue: function(item, attribute, value){
			// summary:
			//		sets 'attribute' on 'item' to 'value'

			var old = item[attribute];
			this.changing(item);
			item[attribute]=value;
			this.onSet(item,attribute,old,value);
		},
		setValues: function(item, attribute, values){
			// summary:
			//	sets 'attribute' on 'item' to 'value' value
			//	must be an array.


			if(!dojo.isArray(values)){
				throw new Error("setValues expects to be passed an Array object as its value");
			}
			this.setValue(item,attribute,values);
		},

		unsetAttribute: function(item, attribute){
			// summary:
			//		unsets 'attribute' on 'item'

			this.changing(item);
			var old = item[attribute];
			delete item[attribute];
			this.onSet(item,attribute,old,undefined);
		},
		
		_dirtyObjects: [],
		
		changing: function(object,_deleting){
			// summary:
			//		adds an object to the list of dirty objects.  This object
			//		contains a reference to the object itself as well as a
			//		cloned and trimmed version of old object for use with
			//		revert.
			object.__isDirty = true;
			//if an object is already in the list of dirty objects, don't add it again
			//or it will overwrite the premodification data set.
			for(var i=0; i<this._dirtyObjects.length; i++){
				var dirty = this._dirtyObjects[i];
				if(object==dirty.object){
					if(_deleting){
						// we are deleting, no object is an indicator of deletiong
						dirty.object = false;
						if(!this._saveNotNeeded){
							dirty.save = true;
						}
					}
					return;
				}
			}
			var old = object instanceof Array ? [] : {};
			for(i in object){
				if(object.hasOwnProperty(i)){
					old[i] = object[i];
				}
			}
			this._dirtyObjects.push({object: !_deleting && object, old: old, save: !this._saveNotNeeded});
		},
		
		save: function(kwArgs){
			// summary:
			//		Saves the dirty data using object store provider. See dojo.data.api.Write for API.
			//
			//	kwArgs.global:
			//		This will cause the save to commit the dirty data for all
			// 		ObjectStores as a single transaction.
			//
			//	kwArgs.revertOnError
			//		This will cause the changes to be reverted if there is an
			//		error on the save. By default a revert is executed unless
			//		a value of false is provide for this parameter.

			kwArgs = kwArgs || {};
			var result, actions = [];
			var alreadyRecorded = {};
			var savingObjects = [];
			var self;
			var dirtyObjects = this._dirtyObjects;
			var left = dirtyObjects.length;// this is how many changes are remaining to be received from the server
			try{
				dojo.connect(kwArgs,"onError",function(){
					if(kwArgs.revertOnError !== false){
						var postCommitDirtyObjects = dirtyObjects;
						dirtyObjects = savingObjects;
						var numDirty = 0; // make sure this does't do anything if it is called again
						jr.revert(); // revert if there was an error
						self._dirtyObjects = postCommitDirtyObjects;
					}
					else{
						self._dirtyObjects = dirtyObject.concat(savingObjects);
					}
				});
				if(this.objectStore.transaction){
					var transaction = this.objectStore.transaction();
				}
				for(var i = 0; i < dirtyObjects.length; i++){
					var dirty = dirtyObjects[i];
					var object = dirty.object;
					var old = dirty.old;
					delete object.__isDirty;
					if(object){
						result = this.objectStore.put(object, {overwrite: !!old});
					}
					else{
						result = this.objectStore.remove(this.getIdentity(old));
					}
					savingObjects.push(dirty);
					dirtyObjects.splice(i--,1);
					dojo.when(result, function(value){
						if(!(--left)){
							if(kwArgs.onComplete){
								kwArgs.onComplete.call(kwArgs.scope, actions);
							}
						}
					},function(value){
						
						// on an error we want to revert, first we want to separate any changes that were made since the commit
						left = -1; // first make sure that success isn't called
						kwArgs.onError.call(kwArgs.scope, value);
					});
					
				}
				if(transaction){
					transaction.commit();
				}
			}catch(e){
				kwArgs.onError.call(kwArgs.scope, value);
			}
			
			
		},

		revert: function(kwArgs){
			// summary
			//		returns any modified data to its original state prior to a save();
			//
			var dirtyObjects = this._dirtyObjects;
			for(var i = dirtyObjects.length; i > 0;){
				i--;
				var dirty = dirtyObjects[i];
				var object = dirty.object;
				var old = dirty.old;
				if(object && old){
					// changed
					for(var j in old){
						if(old.hasOwnProperty(j) && object[j] !== old[j]){
							this.onSet(object, j, object[j], old[j]);
							object[j] = old[j];
						}
					}
					for(j in object){
						if(!old.hasOwnProperty(j)){
							this.onSet(object, j, object[j]);
							delete object[j];
						}
					}
				}else if(!old){
					// was an addition, remove it
					this.onDelete(object);
				}else{
					// was a deletion, we will add it back
					this.onNew(old);
				}
				delete (object || old).__isDirty;
				dirtyObjects.splice(i, 1);
			}
			
			
		},
		isDirty: function(item){
			// summary
			//		returns true if the item is marked as dirty or true if there are any dirty items
			if(!item){
				return !!this._dirtyObjects.length;
			}
			return item.__isDirty;
		},
		//Notifcation Support

		onSet: function(){},
		onNew: function(){},
		onDelete: 	function(){}
	}
);

return dojo.data.ObjectStore;
});
