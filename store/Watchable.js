dojo.provide("dojo.store.Watchable");

dojo.store.Watchable = function(store){
	//	summary:
	//		The Watch store wrapper takes a store and sets a watch method on query()
	// 		results that can be used to monitor results for changes
	var queryUpdaters = [], revision = 0;
	// a Comet driven store could directly call notify to notify watchers when data has
	// changed on the backend
	var notifyAll = store.notify = function(object, existingId){
		revision++;
		for(var i = 0, l = queryUpdaters.length; i < l; i++){
			queryUpdaters[i](object, existingId);
		}
	}
	var originalQuery = store.query;
	store.query = function(query, options){
		var results = originalQuery.apply(this, arguments);
		if(results && results.forEach){
			var queryExecutor = store.queryEngine && store.queryEngine(query, options);
			var queryRevision = revision;
			var listeners = [], queryUpdater;
			results.watch = function(listener){
				if(listeners.push(listener) == 1){
					// first listener was added, create the query checker and updater
					queryUpdaters.push(queryUpdater = function(changed, existingId){
						if(++queryRevision != revision){
							throw new Error("Query is out of date, you must watch() the query prior to any data modifications");
						}
						if(queryExecutor){
							if(existingId){
								// remove the old one
								results.forEach(function(object, i){
									if(store.getIdentity(object) == existingId){
										results.splice(i, 1);
										listener(i, existingId);
									}
								});
							}
							// add the new one
							if(changed && 
									// if a matches function exists, use that (probably more efficient)
									(queryExecutor.matches ? queryExecutor.matches(changed) : queryExecutor([changed]).length)){ 
								// TODO: handle paging correctly
								results.push(changed);
								results = queryExecutor(results);
								listener(results.indexOf(changed), undefined, changed);
							}
						}else{
							// we don't have a queryEngine, so we don't provide any index information or updates to result sets 
							listener(undefined, existingId, changed); 
						}
					});
				}
				return {
					unwatch: function(){
						// remove this listener
						listeners.splice(dojo.indexOf(listeners, listener), 1);
						if(!listeners.length){
							// no more listeners, remove the query updater too
							queryUpdaters.splice(dojo.indexOf(queryUpdaters, queryUpdater), 1);
						}
					}
				}
			};
		}
		return results;
	};
	var inMethod;
	function whenFinished(method, action){
		var original = store[method];
		if(original){
			store[method] = function(value){
				if(inMethod){
					// if one method calls another (like add() calling put()) we don't want two events
					return original.apply(this, arguments);
				}
				inMethod = true;
				try{
					return dojo.when(original.apply(this, arguments), function(results){
						action(value);
						return results;
					});
				}finally{
					inMethod = false;
				}
			};
		}		
	}
	// monitor for updates by listening to these methods  
	whenFinished("put", function(object){
		notifyAll(object, store.getIdentity(object));
	});
	whenFinished("add", notifyAll);
	whenFinished("remove", function(id){
		notifyAll(undefined, id);
	});

	return store;
};
