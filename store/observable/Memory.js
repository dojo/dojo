define(["../../_base/declare", "../../_base/array", "../Memory", "./_Observable", "./util/MaterializedQuery"],
function(declare, array, _Memory, _Observable, MaterializedQuery){

// module:
//		dojo/store/observable/Memory

return declare("dojo.store.observable.Memory", [_Memory, _Observable], {
	// summary:
	//		This is an observable in-memory object store. It implements
	//		dojo/store/observable/api/Store.

	// queries: Array
	//		Internal record of all active queries in the store
	queries: [],

	// nextQueryId: Integer
	//		The id to use for the next materialized query
	nextQueryId: 0,

	materialize: function(query, options){
		// summary:
		//		Materialize a new query in the store. The results are
		//		immediately computed and stored/updated.
		// query: String|Object|Function
		//		The query to use
		// options: dojo/store/api/Store.QueryOptions?
		//		The optional arguments to apply to the results
		// returns: dojo/store/observable/api/Store.MaterializedQuery
		//		A materialized query interface
		this.inherited(arguments);
		var queryExecutor = this.queryEngine(query, options),
			results = this.query(query, options);

		query = new MaterializedQuery({
			store: this,
			id: this.nextQueryId++,
			total: results.length
		});

		query.results = results;
		query.queryExecutor = queryExecutor;

		this.queries.push(query);
		return query;
	},

	_notify: function(object, existingId){
		var self = this, i,
			queryExecutor, queryMatches,
			removedObject, removedFrom, insertedInto; 

		array.forEach(self.queries, function(query){
			queryExecutor = query.queryExecutor;
			queryMatches = queryExecutor.matches;
			removedObject = undefined;
			removedFrom = insertedInto = -1;

			// Remove it, if it exists in the results
			if(existingId !== undefined){
				for(i = 0; i < query.results.length; i++){
					if(self.getIdentity(query.results[i]) === existingId){
						removedObject = query.results[i];
						removedFrom = i;
						query.results.splice(i, 1);
						break;
					}
				}
			}

			// If adding or updating, find a new position for it
			if(object !== undefined){
				if(queryMatches ? queryMatches(object) : queryExecutor([object]).length){
					// Insert the item at its old position or at the end of
					// the array, allowing a stable sort. If the sorted array
					// indicates a position change, move the object.
					i = removedFrom > -1 ? removedFrom : query.results.length;
					query.results.splice(i, 0, object);
					insertedInto = array.indexOf(queryExecutor(query.results), object);
					if(i !== insertedInto){
						query.results.splice(i, 1);
						query.results.splice(insertedInto, 0, object);
					}
				}
			}

			if(removedFrom > -1 || insertedInto > -1){
				query._notify(object || removedObject, removedFrom, insertedInto, query.results);
			}
		});
	},

	_slice: function(query, start, count){
		var end = (count === null) ? undefined : start + count;
		return query.results.slice(start, end);
	},

	_unsubscribe: function(query, page){
		if(query !== undefined && page !== undefined){
			// We don't need to do anything here for pages
		}else if(query !== undefined){
			this.queries = array.filter(this.queries, function(q){
				return q.id !== query.id;
			});
		}
	}
});

});
