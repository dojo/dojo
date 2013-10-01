define([
	"dojo/_base/lang", 
	"dojo/_base/array", 
	"dojo/_base/Deferred",
	"dojo/promise/all",
	"dojo/store/util/QueryResults", 
	"dojo/store/util/SimpleQueryEngine" 
	/*=====, "./api/Store" =====*/
],function(lang, array, Deferred, DeferredList, QueryResults, SimpleQueryEngine /*=====, Store =====*/){

	// module:
	//		dojo/store/Join

	// No base class, but for purposes of documentation, the base class is dojo/store/api/Store
	/*===== base = Store; =====*/

var Join = function(definition){
	// summary:
	//		This is a virtual object store which maps two datasets to one (n,m-n*m, depending on conditions). It implements dojo/store/api/Store.
	//		Wrap in a dojo/store/Cache to 'materialize'.
	//		TODO: what happens if underlying store is a dojo/store/Observable?
	// parts: Array 
	//		Objects in the array must follow: {alias:.., store:.., [query:..], [options:..], [join:'[inner*|outer|left|right]'], [on:'args -> boolean expression']}
	//		alias(string):alias to use in resultset and on join clauses
	//		store/query/options: defines the underlying dataset for this part of the join
	//		join(string): type of join, determineds what to do when the on clause does not match
	//		on(string: args -> boolean expression): the join condition, e.g. "v,c -> v.catId==c.id", "true", "x -> x<100". 
	//
	// example:
	// 		var visits = new MemoryStore({data:[
	// 		    { id: 1, value: 20, site: 1 },
	// 	        { id: 2, value: 16, site: 1 },
	// 	        { id: 3, value: 11, site: 1 },
	// 	        { id: 4, value: 18, site: 1 },
	// 	        { id: 5, value: 26, site: 1 },
	// 	        { id: 6, value: 19, site: 2 },
	// 	        { id: 7, value: 20, site: 2 },
	// 	        { id: 8, value: 28, site: 2 },
	// 	        { id: 9, value: 12, site: 2 },
	// 		]});
	// 		var sites = new MemoryStore({data:[
	// 			{id: 1, name: "The Onion", url: "www.theonion.com"},
	// 			{id: 2, name: "Dojo", url: "dojotoolkit.org"}
	// 		]});
	// 		
	// 		var store = new Join([
	// 			{alias: 'v', store: visits, query: {}},
	// 			{alias: 's', store: sites, query: {}, on: "v,s -> v.site==s.id;"}
	// 		])
	// 		
	// 		store.query(); 	// results in all items from visits joined with the corrsponding sites item, e.g.
	// 						// {v:{ id: 1, value: 20, site: 1 }, s:{id: 1, name: "The Onion", url: "www.theonion.com"}}
	//						// subsequently use Map to normalize, e.g.
	//						// new Map(store, {}, {site:"s.name", url:"s.url", visits: "v.value"}).query()
	if (!definition instanceof Array || definition.length<2) throw new Error("Invalid argument: must be an array of at least 2 of {alias:.., store:.., [query:..], [options:..], [join:'[inner*|outer|left|right]'], [on:'args -> boolean expression']}");
	var parts = definition;
	
	//create a match(l,r) function from the parts' on expressions 
	for (var i=0; i<parts.length; i++){
	 	var part = parts[i];
	
		if (!part.alias) throw new Error("Invalid argument: missing alias");
		if (!part.store) throw new Error("Invalid argument: missing store");

		var	onStr = part.on || "true",//e.g. "v,c -> v.category==c.id", "v,c,dummy -> dummy={x:1}, v.blah==c.bleh && c.bloh<dummy.x"
			args = array.map(onStr.substr(0, onStr.indexOf('->')).split(','), function(arg){return arg.trim();}),
			clause = onStr.substr(onStr.indexOf('->')+2).trim(),
			fun = new Function(args.join(','), "return "+clause+";");
			
		part.match = function(l, r){ 
			var self=this, objs = array.map(args, function(arg){return (self.alias==arg)?r:l[arg];});
			return fun.apply(this, objs);
		}
	}
	
	this.queryEngine = SimpleQueryEngine;

	// get: function(id){},
	// getIdentity: function(object){},
	
	var listeners = [],
		observeHandle = [];//TODO rename
		
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
		if (observeHandle.length){
			observeHandle.forEach(function(handle){handle.remove();})//not sure why
			observeHandle = [];
		}
	}

	this.destroy = function(){
		clearObserveHandle();
	}
		
	this.query = function(query, options){
		var self = this,
			storedata = DeferredList(array.map(parts, function(part){
				return part.store.query(part.query, part.options);
			}));

		return Deferred.when(storedata, function(data){
			var results = QueryResults([]);

			clearObserveHandle();
			
			array.forEach(data, function(d){if (d.observe) observeHandle.push(d.observe(fetch, true));});
			if (observeHandle.length) results.observe = observe;
			
			fetch();
			
			function fetch(){
				var part = parts[0], 
					right = data[0],
					resultset = array.map(right, function(r){//initialize with first part //TODO rename
						var _ = {};
						_[part.alias] = r;
						return _;
					});
				
				for (var i=1, j=parts.length/*, part, right*/; part=parts[i], right=data[i], i<j; i++){
					var alias = part.alias,
						join = part.join,
						match = part.match,
						newResultset = [];
					
					//do a simple nested loop join
					//could be replaced with more memory efficient version that reuses resultset; needs more bookkeeping when inserting/removing
					for (var i=0; i<resultset.length; i++){
						for (var j=0; j<right.length; j++){
							var l = resultset[i], r = right[j];
	
							var matches = match.call(part, l, r);
							
							var _ = {};
							if (matches || join == 'outer' || join == 'left'){
								_ = lang.clone(l);
							}
							if (!matches && join == 'outer'){
								newResultset.push(_);
								_ = {};	
							}
							if (matches || join == 'outer' || join == 'right'){
								_[alias]=r;
							}
							if (!isEmptyObject(_)) newResultset.push(_);
						};
					};
					resultset = newResultset;
				}

				var resultset = self.queryEngine(query, options)(resultset);
				var i=0;
				for (var j=resultset.length; i<j; i++){
					results[i]=resultset[i];
				}
				for(var j=results.length; i<j; i++){
					results.pop();
				}
				
				self.notify();
			}
			
			return results;
		});
	}

	if (array.some(parts, function(part){return part.store.transaction;})){
		function Transaction(transactions){
			this.commit = function(){
				array.forEach(transactions, function(transaction){transaction.commit()})
			};
			this.abort = function(){
				array.forEach(transactions, function(transaction){transaction.abort()})
			};
		}
	
		this.transaction = function(){
			var transactions=[];
			for (var i=0, j=parts.length; i<j; i++) {
				if (part.store.transaction) transactions.push(part.store.transaction());
			}
			return new Transaction(transactions);
		};
	}

	// getMetadata: function(object){} 
};


function isEmptyObject(obj){
	if (Object.getOwnPropertyNames) return Object.getOwnPropertyNames(obj).length === 0;
	for (var p in obj){
		if (obj.hasOwnProperty(p)) return false;
	}
	return true;
}

lang.setObject("dojo.store.Join", Join);

return Join;

});