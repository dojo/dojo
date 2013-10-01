define([
	"dojo/_base/lang", 
	"dojo/_base/array", 
	"dojo/_base/Deferred", 
	"dojo/store/util/QueryResults", 
	"dojo/store/util/SimpleQueryEngine" 
	/*=====, "./api/Store" =====*/
],function(lang, array, Deferred, QueryResults, SimpleQueryEngine /*=====, Store =====*/){

// module:
//		dojo/store/Map

// No base class, but for purposes of documentation, the base class is dojo/store/api/Store
/*===== base = Store; =====*/

var Map = function(store, kwArgs, value, idProperty){
	// summary:
	//		This is a read only object store which maps one dataset to another (n-n). It implements dojo/store/api/Store.
	// store: dojo/store/api/Store
	//		the underlying store
	// kwArgs: Object
	//		{query: {}, [options]} the query and options used when querying the underlying store
	// value: Object or function(item)
	//		defines the mapping.  
	//		When this argument is a function(item) this store's data will contain the results of applying this function 
	//		to each item in the underlying resultset.
	//		When this argument is an Object, this store's data will consist of objects with the same keys as this Object, and values
	//      derived from each item in the underlying resultset. 
	//		Values of this Objects properties can be a function(item), a string (resulting in a lookup against the underlying items) or
	//		something else, which will be taken as a literal value. (to copy a literal string, wrap in new String('string')).
	// idProperty: string
	//		Optional. The idProperty of the underlying store is always copied over, this property provides a means to translate its name.
	//
	// example:
	// 		var data = [
	// 			{id:1, value:-2, oe:"even"},
	// 			{id:2, value:-1, oe:"odd"},
	// 			{id:3, value: 0},
	// 			{id:4, value: 1, oe:"odd"},
	// 			{id:5, value: 2, oe:"even"},
	// 		];
	//		var store = new MemoryStore({data:{items:data}}),
	//			mappedstore1 = new Map(store, {},                  {sign: function(item){return item.value<0?'-':'+';}})
	//			mappedstore2 = new Map(store, {query:{oe:"even"}}, {sign: function(item){return item.value<0?'-':'+';}})
	//
	//		mappedstore1.query({sign: '+'});//results in: [{id:3, sign:'+'},{id:5, sign:'+'}]
	//		mappedstore2.query({sign: '-'});//results in: [{id:1, sign:'-'}]
	if (!store) throw new Error("Invalid argument: missing store");
	
	this.store = store;
	
	this.kwArgs = kwArgs || {};
	
	this.idProperty = idProperty || store.idProperty;

	this.queryEngine = SimpleQueryEngine;
	
	switch (typeof value){
		default:
		 	throw new Error("Invalid argument: missing value");
		case 'object':
			for (var k in value){
				var v=value[k];
				if (typeof v == 'string') {
					value[k] = new Function("item","return item."+v+";");
				}
			}
			var valueObj = value;
			value = function(item){
				var	obj = {};
				for (var k in valueObj) {
					var v=valueObj[k];
					obj[k] = typeof v == 'function'?v(item):v;
				}
				return obj;
			};
			break;
		case 'function':
			//fall through
	}
	
	function generate(item){
		var obj = value(item),
		 	id = store.getIdentity(item); 
		if (id) obj[this.idProperty]=id;
		return obj;
	}
	
	if (store.get) {
		this.get = function(id){
			return generate(store.get(id));
		};
	}
	
	if (this.idProperty){
		this.getIdentity =  function(object){
			return object[this.idProperty];
		};
	}
	
	if (store.remove){
		this.remove = function(id){
			store.remove(id);
		}
	}
	
	var listeners=[], 
		observeHandle;

	this.notify = function(/*object, removedFrom, insertedInto*/){
		array.forEach(listeners, function(listener){
			listener(/*object, removedFrom, insertedInto*/);
		});
	}
	function observe(listener, includeObjectUpdates){ //will be exposed on results when underlying store is observable.
		var i = listeners.push(listener);
		var handle = {};
		handle.remove = handle.cancel = function(){
			listeners.splice(i,1);
			if (!listeners.length){
				clearObserveHandle();
			}
		};
		return handle;
	};
	function clearObserveHandle(){
		if (observeHandle) {
			observeHandle.remove();
			observeHandle = null;
		}
	}
	
	this.destroy = function(){
		clearObserveHandle();
	}
	
	this.query = function(query, options){
		var self = this,
			storedata = this.store.query(this.kwArgs.query, this.kwArgs);

		return Deferred.when(storedata, function(data){
			var results = QueryResults([]);

			clearObserveHandle();
		
			if (data.observe) {//NOTE StoreSeries needs a fix so that it can start observing after this promise is resolved
				observeHandle = data.observe(fetch, true);//register interest
				results.observe = observe;//expose observe method
			}

			fetch();

			function fetch(){
				var cleandata = self.queryEngine(query, options)(data.map(generate));//mapped, filtered, sorted and paged
				var i=0;
				for (var j=cleandata.length; i<j; i++){
					results[i]=cleandata[i];
				}
				for(var j=results.length; i<j; i++){
					results.pop();
				}

				self.notify();
			}

			return results;
		});
	} 

	if (store.transaction){
		this.transaction = function(){
			return store.transaction();
		};
	}
	
	// this.getMetadata = function(object){} 
};

lang.setObject("dojo.store.Map", Map);

return Map;

});