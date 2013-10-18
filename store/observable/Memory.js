define(["../../_base/declare", "../../_base/array", "../../_base/lang", "../Memory", "../util/QueryResults" /*=====, "./api/Store" =====*/],
function(declare, array, lang, _Memory, QueryResults /*=====, Store =====*/){

// module:
//		dojo/store/observable/Memory

var inAdd = false;

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

return declare("dojo.store.observable.Memory", [_Memory], {
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
					self._notifyPage(page, object || removedObject, removedFrom, insertedInto);
				});
			});
		}
	},

	_notifyPage: function(page, object, removedFrom, insertedInto){
		var self = this,
			events = [],
			mResults = page.query.results;

		if(removedFrom === insertedInto){
			//updated
			if(insertedInto >= page.start && (page.count === null || insertedInto < page.start + page.count)){
				//in our page
				events.push([object, removedFrom - page.start, insertedInto - page.start]);
			}else{
				//before or after our page, do nothing
			}
		}else if(removedFrom === -1 || (page.count !== null && removedFrom >= page.start + page.count && insertedInto !== -1)){
			//added (from our perspective)
			if(insertedInto < page.start){
				//before our page, shift in new top element
				if(mResults.length > page.start){
					page.results.unshift(mResults[page.start]);
					events.push([page.results[0], -1, 0]);
				}
			}else if(page.count === null || insertedInto < page.start + page.count){
				//in our page, insert object
				page.results.splice(insertedInto - page.start, 0, object);
				events.push([object, -1, insertedInto - page.start]);
			}else{
				//after our page, do nothing
			}
			if(page.count !== null && page.results.length > page.count){
				//page count set, shift out bottom element
				events.push([page.results.pop(), page.count, -1]);
			}
		}else if(insertedInto === -1 || (page.count !== null && insertedInto >= page.start + page.count)){
			//removed (from our perspective)
			if(removedFrom < page.start){
				//before our page, shift out top element
				if(page.results.length){
					events.push([page.results.shift(), 0, -1]);
				}
			}else if(page.count === null || removedFrom < page.start + page.count){
				//in our page, remove object
				events.push([object, removedFrom - page.start, -1]);
				page.results.splice(removedFrom - page.start, 1);
			}else{
				//after our page, do nothing
			}
			if(page.count !== null && page.results.length < page.count && mResults.length > page.start + page.count - 1){
				//page count set, shift in new bottom element
				page.results.push(mResults[page.start + page.count - 1]);
				events.push([page.results[page.count - 1], -1, page.count - 1]);
			}
		}else{
			//moved
			if(removedFrom < page.start && insertedInto >= page.start){
				//into our page from before our page
				events.push([page.results.shift(), 0, -1])
				page.results.splice(insertedInto - page.start, 0, object);
				events.push([object, -1, insertedInto - page.start])
			}else if(removedFrom >= page.start && insertedInto < page.start){
				//before our page from in our page
				page.results.splice(removedFrom - page.start, 1);
				events.push([object, removedFrom - page.start, -1]);
				page.results.unshift(mResults[page.start]);
				events.push([page.results[0], -1, 0]);
			}else if(removedFrom >= page.start && insertedInto >= page.start){
				//within our page
				page.results.splice(removedFrom - page.start, 1);
				page.results.splice(insertedInto - page.start, 0, object);
				events.push([object, removedFrom - page.start, insertedInto - page.start])
			}else{
				//from before our page to before our page, do nothing
			}
		}

		if(!events.length){return;}
		array.forEach(page.listeners, function(listener){
			array.forEach(events, function(ev){
				self._notifyListener(listener, ev[0], ev[1], ev[2]);
			});
		});
	},

	_notifyListener: function(listener, obj, from, to){
		var listenerFn = listener[1],
			includeObjectUpdates = listener[2];
		if(from === to && !includeObjectUpdates){return;}
		try{
			listenerFn(obj, from, to);
		}catch(e){
			console.error("page listener error:", e);
		}
	},

	put: function(object, options){
		this.inherited(arguments);
		if(!inAdd){
			this._notify(object, this.getIdentity(object));
		}
	},

	add: function(object, options){
		inAdd = true;
		this.inherited(arguments);
		this._notify(object);
		inAdd = false;
	},

	remove: function(id){
		this.inherited(arguments);
		this._notify(undefined, id);
	}
});

});
