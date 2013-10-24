define(["../../../_base/declare", "../../api/Store", "../../../Evented"],
function(declare, _Store, Evented){

// module:
//		dojo/api/observable/Store

var Store = declare([_Store], {
	// summary:
	//		This is an abstract API that data provider implementations conform to.
	//		This file defines methods signatures and intentionally leaves all the
	//		methods unimplemented.

	materialize: function(query, options){
		// summary:
		//		Materialize the given query in the store. A materialized query
		//		should be automatically updated with calls to add(), put() and
		//		remove(). If the query has already been materialized, the existing
		//		instance should be used.
		// query: String|Object|Function
		//		The query to use for retrieving objects from the store.
		// options: dojo/store/api/Store.QueryOptions
		//		The optional arguments to apply to the resultset.
		// returns:	dojo/store/observable/api/Store.MaterializedQuery
		//		The materialized query handler.
	}
});

Store.MaterializedQuery = declare(null, {
	// summary:
	//		A materialized query handler. This handler represents a query in the
	//		store and can be used to materialized individual pages of data.

	// total: Integer
	//		The total number of items in the query. This number should be updated
	//		as updates are applied from the store.
	total: 0,

	page: function(start, count){
		// summary:
		//		Materialize a paged result set in the store. A materialized page
		//		should be automatically updated when the parent query changes. If
		//		the page has already been materialized, the existing instance
		//		should be used.
		// start: Integer
		//		The starting index of the page
		// count: Integer
		//		The number of items to request
		// returns: dojo/store/observable/api/Store.MaterializedPage
		//		The materialized page handler.
	},

	unsubscribe: function(){
		// summary:
		//		Unsubscribe from the materialized query. Once all users have unsubscribed
		//		from the query, it should be destroyed. Calling multiple times is a no-op.
	}
});

Store.MaterializedPage = declare([_Store.QueryResults, Evented], {
	// summary:
	//		A materialized page handler. This handler represents a page of data
	//		for the parent query, and will be updated as the query changes.
	//		Each update to the page should fire an "update" event.

	// start: Integer
	//		The starting index of the page relative to the parent query.
	start: 0,

	// count: Integer
	//		The number of items requested in the page.
	count: null,

	refresh: function(){
		// summary:
		//		Refresh the contents of this page and fire a "refresh" event.
	},

	unsubscribe: function(){
		// summary:
		//		Unsubscribe from the materialized page. Once all users have unsubscribed
		//		from the page, it should be destroyed. Calling multiple times is a no-op.
	}
});

return Store;
});
