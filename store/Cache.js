define("dojo/store/Cache", ["dojo"], function(dojo) {

dojo.store.Cache = function(masterStore, cachingStore, options){
	//	summary: 
	//		The Cache store wrapper takes a master store and a caching store,
	// 		caches data from the master into the caching store for faster
	//		lookup. Normally one would use a memory store for the caching
	// 		store and a server store like JsonRest for the master store.
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
			cachingStore.add(object, directives);
			return masterStore.add(object, directives);
		},
		put: function(object, directives){
			cachingStore.put(object, directives);
			return masterStore.put(object, directives);
		},
		remove: function(id, directives){
			cachingStore.remove(id, directives);
			return masterStore.remove(id, directives);
		},
		evict: function(id){
			cachingStore.remove(id);
		}
	});
};
return dojo.store.Cache;
});