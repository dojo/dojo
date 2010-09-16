dojo.provide("dojo.store.Observable");

dojo.store.Observable = function(store){
	//	summary: 
	//		The Observable store wrapper takes a store and sets an observe method on query()
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
			results.observe = function(listener, includeObjectUpdates){
				if(listeners.push(listener) == 1){
					// first listener was added, create the query checker and updater
					queryUpdaters.push(queryUpdater = function(changed, existingId){
						if(++queryRevision != revision){
							throw new Error("Query is out of date, you must watch() the query prior to any data modifications");
						}
						var removedObject, removedFrom, insertedInto;
						if(existingId){
							// remove the old one
							results.forEach(function(object, i){
								if(store.getIdentity(object) == existingId){
									removedObject = object;
									removedFrom = i;
									results.splice(i, 1);
								}
							});
						}
						if(queryExecutor){
							// add the new one
							if(changed && 
									// if a matches function exists, use that (probably more efficient)
									(queryExecutor.matches ? queryExecutor.matches(changed) : queryExecutor([changed]).length)){ 
								// TODO: handle paging correctly
								results.push(changed);
								insertedInto = queryExecutor(results).indexOf(changed);
							}
						}else if(changed){
							// we don't have a queryEngine, so we can't provide any information 
							// about where it was inserted, but we can at least indicate a new object  
							insertedInto = removedFrom || -1;
						}
						if((removedFrom > -1 || insertedInto > -2) && 
								(includeObjectUpdates || (removedFrom != insertedInto))){
							for(var i = 0;listener = listeners[i]; i++){
								listener(changed || removedObject, removedFrom, insertedInto);
							}
						}
					});
				}
				return {
					dismiss: function(){
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
