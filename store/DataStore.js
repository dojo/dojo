define("dojo/store/DataStore", ["dojo", "dojo/store/util/QueryResults"], function(dojo) {

dojo.declare("dojo.store.DataStore", null, {
	target: "",
	constructor: function(options){
		// summary:
		//		This is an adapter for using Dojo Data stores with an object store consumer.
		//		You can provide a Dojo data store and use this adapter to interact with it through
		//		the Dojo object store API
		// options: Object?
		//		This provides any configuration information that will be mixed into the store,
		//		including a reference to the Dojo data store under the property "store".
		dojo.mixin(this, options);
	},
	_objectConverter: function(callback){
		var store = this.store;
		return function(item){
			var object = {};
			var attributes = store.getAttributes(item);
			for(var i = 0; i < attributes.length; i++){
				object[attributes[i]] = store.getValue(item, attributes[i]);
			}
			return callback(object);
		};
	},
	get: function(id, options){
		// summary:
		//		Retrieves an object by it's identity. This will trigger a fetchItemByIdentity
		// id: Object?
		//		The identity to use to lookup the object
		var returnedObject, returnedError;
		var deferred = new dojo.Deferred();
		this.store.fetchItemByIdentity({
			identity: id,
			onItem: this._objectConverter(function(object){
				deferred.resolve(returnedObject = object);
			}),
			onError: function(error){
				deferred.reject(returnedError = error);
			}
		});
		if(returnedObject){
			// if it was returned synchronously
			return returnedObject;
		}
		if(returnedError){
			throw returnedError;
		}
		return deferred.promise;
	},
	put: function(object, options){
		// summary:
		//		Stores an object by its identity.
		// object: Object
		//		The object to store.
		// options: Object?
		//		Additional metadata for storing the data.  Includes a reference to an id
		//		that the object may be stored with (i.e. { id: "foo" }).
		var id = options && typeof options.id != "undefined" || this.getIdentity(object);
		var store = this.store;
		if(typeof id == "undefined"){
			store.newItem(object);
		}else{
			store.fetchItemByIdentity({
				identity: id,
				onItem: function(item){
					if(item){
						for(var i in object){
							if(store.getValue(item, i) != object[i]){
								store.setValue(item, i, object[i]);
							}
						}
					}else{
						store.newItem(object);
					}
				}
			});
		}
	},
	remove: function(id){
		// summary:
		//		Deletes an object by its identity.
		// id: Object
		//		The identity to use to delete the object
		var store = this.store;
		this.store.fetchItemByIdentity({
			identity: id,
			onItem: function(item){
				store.deleteItem(item);
			}
		});
	},
	query: function(query, options){
		// summary:
		//		Queries the store for objects.
		// query: Object
		//		The query to use for retrieving objects from the store
		// options: Object?
		//		Optional options object as used by the underlying dojo.data Store.
		// returns: dojo.store.util.QueryResults
		//		A query results object that can be used to iterate over results.
		var returnedObject, returnedError;
		var deferred = new dojo.Deferred();
		deferred.total = new dojo.Deferred();
		var converter = this._objectConverter(function(object){return object;});
		this.store.fetch(dojo.mixin({
			query: query,
			onBegin: function(count){
				deferred.total.resolve(count);
			},
			onComplete: function(results){
				deferred.resolve(dojo.map(results, converter));
			},
			onError: function(error){
				deferred.reject(error);
			}
		}, options));
		return dojo.store.util.QueryResults(deferred);
	},
	getIdentity: function(object){
		// summary:
		//		Fetch the identity for the given object.
		// object: Object
		//		The data object to get the identity from.
		// returns: Number
		//		The id of the given object.
		return object[this.idProperty || this.store.getIdentityAttributes()[0]];
	}
});

return dojo.store.DataStore;
});
