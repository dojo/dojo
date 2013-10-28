define(["../../_base/declare", "../../_base/array", "../Memory", "./_Observable", "./util/MaterializedQuery"],
function(declare, array, _Memory, _Observable, MaterializedQuery){

// module:
//		dojo/store/observable/Memory

// NOTE: There may be a better way to do this. Essentially we just want to
// be able to key off a dictionary using the combination of a query object and
// query options. This requires us to convert them into a unique string.
var toStr = function(item){
	var type = toString.call(item);
	if(type === "[object Array]"){
		var vals = [];
		for(var i in item){
			vals.push(toStr(item[i]));
		}
		return "[" + vals.join(",") + "]";
	}
	if(type === "[object Object]"){
		var attrs = [];
		var keys = [];
		for(var i in item){
			keys.push(i);
		}
		keys.sort(); // Keep it consistent
		for(var i in keys){
			attrs.push(keys[i] + "=" + toStr(item[keys[i]]));
		}
		return "{" + attrs.join(",") + "}";
	}
	return String(item);
};

return declare("dojo.store.observable.Memory", [_Memory, _Observable], {
	// summary:
	//		This is an observable in-memory object store. It implements
	//		dojo/store/observable/api/Store.

	// queries: Object
	//		Internal record of all active queries in the store
	queries: {},

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
		var self = this, sub,
			qHash = toStr(query) + ":" + toStr(options),
			master = self.queries[qHash];

		if(master === undefined){
			master = self.queries[qHash] = {
				queryExecutor: self.queryEngine(query, options),
				results: self.query(query, options),
				subscriptions: [],
				nextSubscriptionId: 0
			};
		}

		sub = new MaterializedQuery({
			store: self,
			id: { queryHash: qHash, queryId: master.nextSubscriptionId++ },
			total: master.results.length
		});

		master.subscriptions.push(sub);
		return sub;
	},

	_notify: function(object, existingId){
		var self = this, i,
			queryExecutor, queryMatches,
			removedObject, removedFrom, insertedInto; 

		for(qHash in self.queries){
			if(!self.queries.hasOwnProperty(qHash)){continue;}
			master = self.queries[qHash];
			queryExecutor = master.queryExecutor;
			queryMatches = queryExecutor.matches;
			removedObject = undefined;
			removedFrom = insertedInto = -1;

			// Remove it, if it exists in the results
			if(existingId !== undefined){
				for(i = 0; i < master.results.length; i++){
					if(self.getIdentity(master.results[i]) === existingId){
						removedObject = master.results[i];
						removedFrom = i;
						master.results.splice(i, 1);
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
					i = removedFrom > -1 ? removedFrom : master.results.length;
					master.results.splice(i, 0, object);
					insertedInto = array.indexOf(queryExecutor(master.results), object);
					if(i !== insertedInto){
						master.results.splice(i, 1);
						master.results.splice(insertedInto, 0, object);
					}
				}
			}

			if(removedFrom > -1 || insertedInto > -1){
				array.forEach(master.subscriptions, function(sub){
					sub._notify(object || removedObject, removedFrom, insertedInto, master.results);
				});
			}
		}
	},

	_slice: function(sub, start, count){
		var end = (count === null) ? undefined : start + count,
			master = this.queries[sub.id.queryHash];
		return master.results.slice(start, end);
	},

	_unsubscribe: function(sub, page){
		var self = this, master;
		if(sub !== undefined && page !== undefined){
			// We don't need to do anything here for pages
		}else if(sub !== undefined){
			master = self.queries[sub.id.queryHash];
			master.subscriptions = array.filter(master.subscriptions, function(s){
				return s.id.queryId !== sub.id.queryId;
			});
			if(master.subscriptions.length === 0){
				delete self.queries[sub.id.queryHash];
			}
		}
	}
});

});
