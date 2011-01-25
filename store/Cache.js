define("dojo/store/Cache", ["dojo"], function(dojo) {

/*=====
dojo.declare("dojo.store.Cache.Args", null, {
	constructor: function(){
		//	summary:
		//		These are additional options for how caching is handled.
		//	isLoaded: Function?
		//		This is a function that will be called for each item in a query response to determine
		//		if it is cacheable. If isLoaded returns true, the item will be cached, otherwise it 
		//		will not be cached. If isLoaded is not provided, all items will be cached. 
		this.isLoaded = isLoaded;
	}
});
=====*/
dojo.store.Cache = function(masterStore, cachingStore, /*dojo.store.Cache.Args*/ options){
	// summary:
	//		The Cache store wrapper takes a master store and a caching store,
	//		caches data from the master into the caching store for faster
	//		lookup. Normally one would use a memory store for the caching
	//		store and a server store like JsonRest for the master store.
	//	masterStore:
	//		This is the authoritative store, all uncached requests or non-safe requests will
	// 		be made against this store.
	//	cachingStore: 
	//		This is the caching store that will be used to store responses for quick access.
	//		Typically this should be a local store.
	//	options:
	//		These are additional options for how caching is handled.
	options = options || {};
	return dojo.delegate(masterStore, {
		query: function(query, directives){
			var results = masterStore.query(query, directives);
			results.forEach(function(object){
				if(!options.isLoaded || options.isLoaded(object)){
					cachingStore.put(object);
				}
			});
			return results;
		},
		get: function(id, directives){
			return dojo.when(cachingStore.get(id), function(result){
				return result || dojo.when(masterStore.get(id, directives), function(result){
					if(result){
						cachingStore.put(result, {id: id});
					}
					return result;
				});
			});
		},
		add: function(object, directives){
            return dojo.when(masterStore.add(object, directives), function(result){
            	// now put result in cache
                return cachingStore.add(typeof result == "object" ? result : object, directives);
            });
        },
		put: function(object, directives){
			// first remove from the cache, so it is empty until we get a response from the master store
            cachingStore.remove((directives && directives.id) || this.getIdentity(object));
            return dojo.when(masterStore.put(object, directives), function(result){
            	// now put result in cache
                return cachingStore.put(typeof result == "object" ? result : object, directives);
            });
        },
		remove: function(id, directives){
            return dojo.when(masterStore.remove(id, directives), function(result){
                return cachingStore.remove(id, directives);
            });
        },
		evict: function(id){
			return cachingStore.remove(id);
		}
	});
};
return dojo.store.Cache;
});