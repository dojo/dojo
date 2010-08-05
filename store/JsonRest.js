dojo.provide("dojo.store.JsonRest");

dojo.declare("dojo.store.JsonRest", null, {
	target: "",
	constructor: function(options){
		// summary:
		// 		This is a basic store for RESTful communicating with a server through JSON 
		// 		formatted data.
		//	options:
		//		This provides any configuration information that will be mixed into the store
		// options.target:
		// 		The target base URL to use for all requests to the server 
		dojo.mixin(this, options);
	},
	get: function(id, options){
		//	summary:
		// 		Retrieves an object by it's identity. This will trigger a GET request to the server
		// id:
		// 		The identity to use to lookup the object		
		
		var headers = options || {};
		headers.Accept = "application/javascript, application/json";
		return dojo.xhrGet({
			url:this.target + id,
			handleAs: "json",
			headers: headers
		});
	},
	put: function(object, id, options){
		//	summary:
		// 		Stores an object by it's identity. This will trigger a PUT request to the server 
		// 		if the object has an id, otherwise it will trigger a POST request	
		// object:
		// 		The object to store.
		// options:
		// 		Additional metadata for storing the data		
		// options.id:
		// 		The identity to use for storing the data		
		return typeof id === "undefined" ?
			dojo.xhrPost({
				url:this.target,
				postData: dojo.toJson(object),
				handleAs: "json",
				headers:{"Content-Type": "application/json"}
			}) :
			dojo.xhrPut({
				url:this.target + id,
				postData: dojo.toJson(object),
				handleAs: "json",
				headers:{"Content-Type": "application/json"}
			});
	},
	"delete": function(id){
		//	summary:
		// 		Deletes an object by it's identity. This will trigger a DELETE request to the server
		// id:
		// 		The identity to use to delete the object		
		return dojo.xhrDelete({
			url:this.target + id
		});
	},
	query: function(query, options){
		//	summary:
		// 		Queries the store for objects. This will trigger a GET request to the server, with the query added as a query string
		// query:
		// 		The query to use for retrieving objects from the store		
		var headers = {Accept: "application/javascript, application/json"};
		options = options || {};
		
		if(options.start || options.count){
			headers.Range = "items=" + (options.start || '0') + '-' + ((options.count && options.count != Infinity && (options.count + (options.start || 0) - 1)) || '');
		}
		if(dojo.isObject(query)){
			query = dojo.objectToQuery(query);
			query = query ? "?" + query: "";
		}
		if(options && options.sort && !options.queryStr){
			query += (query ? "&" : "?") + "sort("
			for(var i = 0; i<options.sort.length; i++){
				var sort = options.sort[i];
				query += (i > 0 ? "," : "") + (sort.descending ? '-' : '+') + encodeURIComponent(sort.attribute); 
			}
			query += ")";
		}
		return dojo.xhrGet({
			url: this.target + query,
			handleAs: "json",
			headers: headers
		});
	}
});