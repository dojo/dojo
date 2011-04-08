define("dojo/store/JsonRest", ["dojo", "dojo/store/util/QueryResults"], function(dojo) {

dojo.declare("dojo.store.JsonRest", null, {
	constructor: function(/*dojo.store.JsonRest*/ options){
		// summary:
		//		This is a basic store for RESTful communicating with a server through JSON
		//		formatted data.
		// options:
		//		This provides any configuration information that will be mixed into the store
		dojo.mixin(this, options);
	},
	// target: String
	//		The target base URL to use for all requests to the server. This string will be
	// 	prepended to the id to generate the URL (relative or absolute) for requests
	// 	sent to the server
	target: "",
	// idProperty: String
	//		Indicates the property to use as the identity property. The values of this
	//		property should be unique.
	idProperty: "id",

	get: function(id, options){
		//	summary:
		//		Retrieves an object by its identity. This will trigger a GET request to the server using
		//		the url `this.target + id`.
		//	id: Number
		//		The identity to use to lookup the object
		//	returns: Object
		//		The object in the store that matches the given id.
		var headers = options || {};
		headers.Accept = "application/javascript, application/json";
		return dojo.xhrGet({
			url:this.target + id,
			handleAs: "json",
			headers: headers
		});
	},
	getIdentity: function(object){
		// summary:
		//		Returns an object's identity
		// object: Object
		//		The object to get the identity from
		//	returns: Number
		return object[this.idProperty];
	},
	put: function(object, options){
		// summary:
		//		Stores an object. This will trigger a PUT request to the server
		//		if the object has an id, otherwise it will trigger a POST request.
		// object: Object
		//		The object to store.
		// options: dojo.store.api.Store.PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		//	returns: Number
		options = options || {};
		var id = ("id" in options) ? options.id : this.getIdentity(object);
		var hasId = typeof id != "undefined";
		return dojo.xhr(hasId && !options.incremental ? "PUT" : "POST", {
				url: hasId ? this.target + id : this.target,
				postData: dojo.toJson(object),
				handleAs: "json",
				headers:{
					"Content-Type": "application/json",
					"If-Match": options.overwrite === true ? "*" : null,
					"If-None-Match": options.overwrite === false ? "*" : null
				}
			});
	},
	add: function(object, options){
		// summary:
		//		Adds an object. This will trigger a PUT request to the server
		//		if the object has an id, otherwise it will trigger a POST request.
		// object: Object
		//		The object to store.
		// options: dojo.store.api.Store.PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		options = options || {};
		options.overwrite = false;
		return this.put(object, options);
	},
	remove: function(id){
		// summary:
		//		Deletes an object by its identity. This will trigger a DELETE request to the server.
		// id: Number
		//		The identity to use to delete the object
		return dojo.xhrDelete({
			url:this.target + id
		});
	},
	query: function(query, options){
		// summary:
		//		Queries the store for objects. This will trigger a GET request to the server, with the
		//		query added as a query string.
		// query: Object
		//		The query to use for retrieving objects from the store.
		// options: dojo.store.api.Store.QueryOptions?
		//		The optional arguments to apply to the resultset.
		//	returns: dojo.store.api.Store.QueryResults
		//		The results of the query, extended with iterative methods.
		var headers = {Accept: "application/javascript, application/json"};
		options = options || {};

		if(options.start >= 0 || options.count >= 0){
			headers.Range = "items=" + (options.start || '0') + '-' +
				(("count" in options && options.count != Infinity) ?
					(options.count + (options.start || 0) - 1) : '');
		}
		if(dojo.isObject(query)){
			query = dojo.objectToQuery(query);
			query = query ? "?" + query: "";
		}
		if(options && options.sort){
			query += (query ? "&" : "?") + "sort(";
			for(var i = 0; i<options.sort.length; i++){
				var sort = options.sort[i];
				query += (i > 0 ? "," : "") + (sort.descending ? '-' : '+') + encodeURIComponent(sort.attribute);
			}
			query += ")";
		}
		var results = dojo.xhrGet({
			url: this.target + (query || ""),
			handleAs: "json",
			headers: headers
		});
		results.total = results.then(function(){
			var range = results.ioArgs.xhr.getResponseHeader("Content-Range");
			return range && (range=range.match(/\/(.*)/)) && +range[1];
		});
		return dojo.store.util.QueryResults(results);
	}
});

return dojo.store.JsonRest;
});