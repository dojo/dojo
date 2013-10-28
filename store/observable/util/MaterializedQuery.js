define(["../../../_base/declare", "../../../_base/array", "../../../_base/lang", "../../../when", "./MaterializedPage"],
function(declare, array, lang, when, MaterializedPage){

// module:
//		dojo/store/observable/util/MaterializedQuery

return declare("dojo.store.observable.util.MaterializedQuery", null, {
	// summary:
	//		A materialized query, providing the user with an interface for
	//		subscribing to individual pages.

	// store: Object
	//		An observable object store
	store: null,

	// id: Integer|String|Object
	//		A query subscription id
	id: null,

	// total: Integer
	//		The total number of items in the query
	total: 0,

	// results: Array|Object
	//		A results array or interface supporting slice()
	results: null,

	// pages: Array
	//		Active page subscriptions for this query
	pages: null,

	// nextPageId: Integer
	//		The id to use for the next page subscription
	nextPageId: 0,

	constructor: function(config){
		lang.mixin(this, config);
		this.pages = [];
	},

	page: function(start, count){
		// summary:
		//		Construct a new page subscription for this query and return
		//		the resulting array.
		// start: Integer
		//		The starting index of the page
		// count: Integer?
		//		The size of the page (optional)
		// returns: dojo/store/observable/api/Store.MaterializedPage
		//		The page results
		start = start || 0;
		count = count || null;
		var self = this;
		return when(self.store._slice(self, start, count, true), function(results){
			var page = MaterializedPage(results, {
				query: self,
				id: results.id || self.nextPageId++,
				start: start,
				count: count
			});
			self.pages.push(page);
			return page;
		});
	},

	unsubscribe: function(){
		// summary:
		//		Unsubscribe this query, halting further updates to all
		//		underlying subscribed pages.
		// returns: undefined|Promise
		//		Returns a promise for remote stores.
		return this.store._unsubscribe(this);
	},

	_notify: function(object, removedFrom, insertedInto, supplementaryData, revision){
		this.total = supplementaryData.length; // Keep the total updated
		array.forEach(this.pages, function(page){
			// Support revisioned stores
			if(revision !== undefined){
				if(page.revision >= revision){
					// Ignore changes that the page already has
					return;
				}else if(page.revision + 1 !== revision){
					throw "Invalid update, expecting revision: " + (page.revision + 1) + ", got revision: " + revision;
				}
			}
			page._notify(object, removedFrom, insertedInto, supplementaryData);
			if(revision !== undefined){
				page.revision = revision;
			}
		});
	}
});

});
