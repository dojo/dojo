define(["../../_base/declare", "../../_base/array", "../Memory", "./_Observable", "../util/QueryResults" /*=====, "./api/Store" =====*/],
function(declare, array, _Memory, _Observable, QueryResults /*=====, Store =====*/){

// module:
//		dojo/store/observable/Memory

// XXX: There may be a better way to do this. Essentially we just want to
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
		for(var i in item){
			attrs.push(i + "=" + toStr(item[i]));
		}
		return "{" + attrs.join(",") + "}";
	}
	return String(item);
};

return declare("dojo.store.observable.Memory", [_Memory, _Observable], {
	// summary:
	//		This is an observable in-memory object store. It implements
	//		dojo/store/observable/api/Store.

	queries: {},

	materialize: function(query, options){
		var qHash = toStr(query) + toStr(options),
			self = this,
			mQuery = self.queries[qHash], // materializedQuery
			qsub, sId;

		if(mQuery === undefined){
			mQuery = self.queries[qHash] = {
				queryExecutor: self.queryEngine(query, options),
				results: self.query(query, options),
				subscriptions: [],
				nextSubscriptionId: 0
			};
		}

		sId = mQuery.nextSubscriptionId++;
		qsub = {
			id: sId,
			pages: [],
			nextPageId: 0
		};
		mQuery.subscriptions.push(qsub);

		return {
			total: mQuery.results.length,

			unsubscribe: function(){
				mQuery.subscriptions = array.filter(mQuery.subscriptions, function(s){
					return s.id !== sId;
				});
				if(mQuery.subscriptions.length === 0){
					delete self.queries[qHash];
				}
			},

			page: function(start, count){
				start = start || 0;
				count = count || null;
				var pId = qsub.nextPageId++,
					end = (count === null) ? undefined : start + count,
					results = QueryResults(mQuery.results.slice(start, end)),
					page = {
						id: pId,
						query: mQuery,
						start: start,
						count: count,
						results: results,
						listeners: [],
						nextListenerId: 0
					};

				qsub.pages.push(page);
				results.start = start;
				results.count = count;
				results.unsubscribe = function(){
					qsub.pages = array.filter(qsub.pages, function(p){
						return p.id !== pId;
					});
				};
				results.observe = function(listener, includeObjectUpdates){
					var lId = page.nextListenerId++;
					page.listeners.push([lId, listener, includeObjectUpdates]);
					return {
						remove: function (){
							page.listeners = array.filter(page.listeners, function(l){
								return l[0] !== lId;
							});
						}
					};
				};
				return results;
			}
		};
	},

	_notify: function(object, existingId){
		for(qHash in this.queries){
			if(!this.queries.hasOwnProperty(qHash)){continue;}
			this._notifyQuery(this.queries[qHash], object, existingId);
		}
	},

	_notifyQuery: function(mQuery, object, existingId){
		var i, self = this,
			queryExecutor = mQuery.queryExecutor,
			queryMatches = queryExecutor.matches,
			removedObject,
			removedFrom = -1,
			insertedInto = -1;

		// Remove it, if it exists in the results
		if(existingId !== undefined){
			for(i = 0; i < mQuery.results.length; i++){
				if(self.getIdentity(mQuery.results[i]) === existingId){
					removedObject = mQuery.results[i];
					removedFrom = i;
					mQuery.results.splice(i, 1);
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
				i = removedFrom > -1 ? removedFrom : mQuery.results.length;
				mQuery.results.splice(i, 0, object);
				insertedInto = array.indexOf(queryExecutor(mQuery.results), object);
				if(i !== insertedInto){
					mQuery.results.splice(i, 1);
					mQuery.results.splice(insertedInto, 0, object);
				}
			}
		}

		if(removedFrom > -1 || insertedInto > -1){
			array.forEach(mQuery.subscriptions, function(sub){
				array.forEach(sub.pages, function(page){
					self._notifyPage(page, page.query.results, object || removedObject, removedFrom, insertedInto);
				});
			});
		}
	}
});

});
