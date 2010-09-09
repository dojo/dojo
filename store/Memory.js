dojo.provide("dojo.store.Memory");

dojo.require("dojo.store.util.QueryResults");

dojo.declare("dojo.store.Memory", null, {
	constructor: function(options){
		// summary:
		// 		This is a basic in-memory object store.
		//	options:
		//		This provides any configuration information that will be mixed into the store
		// options.data:
		// 		An array of data to use as the source of all the objects
		this.index = {};
		dojo.mixin(this, options);
		this.setData(this.data);
	},
	// summary:
	// 		The array of all the objects in the memory store	
	data:[],
	// summary:
	// 		The indicates the property to use as the identity property. The values of this
	// 		property should be unique.	
	idProperty: "id",
	//	summary:
	//		An index of data by id
	index:null,
	// summary:
	//		Defines the query engine to use for querying the data store
	queryEngine: {
		execute: function(query, array){
			// summary:
			//		Simple query engine that matches using filter functions, named filter
			// 		functions or objects by name-value on a query object hash
			var results = [];
			if(typeof query == "string"){
				// named query
				query = this[query];
			}else if(typeof query == "object"){
				var queryObject = query;
				query = function(object){
					for(var key in queryObject){
						if(queryObject[key] != object[key]){
							return false;
						}
					}
					return true;
				};
			}
			for(var i = 0,l = array.length; i < l; i++){
				var object = array[i];
				if(query(object)){
					results.push(object);
				}
			}
			return results;
		}
	},
	get: function(id){
		//	summary:
		// 		Retrieves an object by it's identity
		// id:
		// 		The identity to use to lookup the object		
		return this.index[id]; 
	},
	put: function(object, options){
		//	summary:
		// 		Stores an object		
		// object:
		// 		The object to store.
		// options:
		// 		Additional metadata for storing the data		
		// options.id:
		// 		The identity to use for storing the data		
		id = options && options.id || object[this.idProperty] || Math.random();
		this.index[id] = object;
	},
	add: function(object, options){
		//	summary:
		// 		Creates an object, throws an error if the object already exists	
		// object:
		// 		The object to store.
		// options:
		// 		Additional metadata for storing the data		
		// options.id:
		// 		The identity to use for storing the data		
		if(this.index[options && options.id || object[this.idProperty]]){
			throw new Error("Object already exists");
		}
		return this.put(object, options);
	},
	"delete": function(id){
		//	summary:
		// 		Deletes an object by it's identity
		// id:
		// 		The identity to use to delete the object		
		delete this.index[id];
	},
	query: function(query, options){
		//	summary:
		// 		Queries the store for objects.
		// query:
		// 		The query to use for retrieving objects from the store		
		return dojo.store.util.QueryResults(this.queryEngine.execute(query, this.data));
	},
	setData: function(data){
		//	summary:
		// 		Sets the given data as the source for this store, and indexes it
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
});