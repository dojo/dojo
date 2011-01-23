define("dojo/store/Memory", ["dojo", "dojo/store/util/QueryResults", "dojo/store/util/SimpleQueryEngine"], function(dojo) {

dojo.store.Memory = function(options){
	// summary:
	//		This is a basic in-memory object store.
	// options:
	//		This provides any configuration information that will be mixed into the store
	// options.data:
	//		An array of data to use as the source of all the objects
	var store = {
		// data: Array
		//		The array of all the objects in the memory store
		data:[],
		// idProperty: String
		//		Indicates the property to use as the identity property. The values of this
		//		property should be unique.
		idProperty: "id",
		// index: Object
		//		An index of data by id
		index:{},
		// queryEngine: Function
		//		Defines the query engine to use for querying the data store
		queryEngine: dojo.store.util.SimpleQueryEngine,
		get: function(id){
			// summary:
			//		Retrieves an object by it's identity
			// id:
			//		The identity to use to lookup the object
			return this.index[id];
		},
		getIdentity: function(object){
			// summary:
			//		Returns an object's identity
			// object:
			//		The object to get the identity from
			return object[this.idProperty];
		},
		put: function(object, options){
			// summary:
			//		Stores an object
			// object:
			//		The object to store.
			// options:
			//		Additional metadata for storing the data
			// options.id:
			//		The identity to use for storing the data
			var id = options && options.id || object[this.idProperty] || Math.random();
			this.index[id] = object;
			var data = this.data,
				idProperty = this.idProperty;
			for(var i = 0, l = data.length; i < l; i++){
				if(data[i][idProperty] == id){
					data[i] = object;
					return;
				}
			}
			this.data.push(object);
			return id;
		},
		add: function(object, options){
			// summary:
			//		Creates an object, throws an error if the object already exists
			// object:
			//		The object to store.
			// options:
			//		Additional metadata for storing the data
			// options.id:
			//		The identity to use for storing the data
			if(this.index[options && options.id || object[this.idProperty]]){
				throw new Error("Object already exists");
			}
			return this.put(object, options);
		},
		remove: function(id){
			// summary:
			//		Deletes an object by it's identity
			// id:
			//		The identity to use to delete the object
			delete this.index[id];
			var data = this.data,
				idProperty = this.idProperty;
			for(var i = 0, l = data.length; i < l; i++){
				if(data[i][idProperty] == id){
					data.splice(i, 1);
					return;
				}
			}
		},
		query: function(query, options){
			// summary:
			//		Queries the store for objects.
			// query:
			//		The query to use for retrieving objects from the store
			return dojo.store.util.QueryResults(this.queryEngine(query, options)(this.data));
		},
		setData: function(data){
			// summary:
			//		Sets the given data as the source for this store, and indexes it
			//	data:
			//		An array of objects to use as the source of data.
			if(data.items){
				// just for convenience with the data format IFRS expects
				this.idProperty = data.identifier;
				data = this.data = data.items;
			}else{
				this.data = data;
			}

			for(var i = 0, l = data.length; i < l; i++){
				var object = data[i];
				this.index[object[this.idProperty]] = object;
			}
		}
	};
	dojo.mixin(store, options);
	store.setData(store.data);
	return store;
};

return dojo.store.Memory;
});