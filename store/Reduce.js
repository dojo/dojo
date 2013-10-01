define([
	"dojo/_base/lang", 
	"dojo/_base/array",
	"dojo/_base/Deferred", 
	"dojo/json", 
	"dojo/store/util/QueryResults", 
	"dojo/store/util/SimpleQueryEngine" 
	/*=====, "./api/Store" =====*/
],function(lang, array, Deferred, json, QueryResults, SimpleQueryEngine /*=====, Store =====*/){

	// module:
	//		dojo/store/Reduce

	// No base class, but for purposes of documentation, the base class is dojo/store/api/Store
	/*===== base = Store; =====*/

var Reduce = function(store, kwArgs, groupby, value){
	// summary:
	//		This is a virtual object store which maps one dataset to another (m-n, n<m). It implements dojo/store/api/Store.
	//		Wrap in a dojo/store/Cache to 'materialize'.
	//		TODO: what happens if underlying store is a dojo/store/Observable?
	// store: dojo/store/api/Store
	//		the underlying store
	// kwArgs: Object
	//		{query: {}, [options]} the query and options used when querying the underlying store
	// groupby: Array | string
	//		an array or comma seperated list of property names to group on. properties of properties are also ok
	//		e.g. ["name"]; group by name, "location.country, location.city"; group by country and city values of the location property
	// value: Object ala ./ReduceUtils 
	//		aggregator: aggregation function(args) that will be applied to the aggregator object during aggregation
	//			mandatory
	//		seed: initial value for the aggregator object, or a primitive (equivalent to {value: <original seed>})
	//			optional, in which case the aggregaor and value functions need to handle an undefined aggregator
	//		value: a function() that converts the aggregator object into a single value for the final result
	//			optional, in which case the default aggregator object value will be returned
	//		args: the item property names to use as arguments to the aggregation function
	//			optional, but should define as many names as the aggregator function needs arguments
	//
	// example: 
	//		var visits = new MemoryStore({data:[
	//		    { id: 1, value: 20, site: 1 },
	//	        { id: 2, value: 16, site: 1 },
	//	        { id: 3, value: 11, site: 1 },
	//	        { id: 4, value: 18, site: 1 },
	//	        { id: 5, value: 26, site: 1 },
	//	        { id: 6, value: 19, site: 2 },
	//	        { id: 7, value: 20, site: 2 },
	//	        { id: 8, value: 28, site: 2 },
	//	        { id: 9, value: 12, site: 2 },
	//		]});
	//		
	//		var analysis = new Reduce(visits, {}, "site", 
	//			{
	//				count: Reduce.count(),//or count("*")
	//				total: Reduce.sum("value")
	//			}
	//		);
	//		
	//		analysis.query();//yields [{site:1, count:5, total:79},{site:2, count:4, total:81}]
	//
	if (!store) throw new Error("Invalid argument: missing store");

	this.store=store;

	this.kwArgs=kwArgs || {};
	
	this.queryEngine = SimpleQueryEngine;
	
	switch (lang.isArray(groupby)?'array':typeof groupby){
		default:
		 	throw new Error("invalid argument for 'groupby'");
		case 'string': 
			groupby = array.map(groupby.split(','),function(s){return s.trim();});
		case 'array':
			break;
		// case 'object'://TODO would provide for aliasing, but has implications on id related functions.
	}
	
	//turn into functions
	var groupbyObj = {};
	array.forEach(groupby, function(path){groupbyObj[path] = Function("return this."+path+";");});

	function groupof(item){
		var group = {};
		for (path in groupbyObj){
		 	var p = group, q, r;
			array.forEach(path.split('.'), function(s){q=p, p=p[r=s]={};});
			q[r]=groupbyObj[path].call(item);
		}
		return group;
	}

	value = value || {};//if undefined Reduce works as a 'select distinct'
	
	// aggregate.args(storeitem);
	for (name in value){
		var aggregate = value[name];
		
		switch (lang.isArray(aggregate.args)?'array':typeof aggregate.args){
			case 'string':
				aggregate.args = array.map(aggregate.args.split(','),function(s){return s.trim();});
			case 'array':
				if (aggregate.args.length){
					aggregate.args = new Function("item", "return [item."+aggregate.args.join(", item.")+"];")
					break;
				}
			case 'undefined':
				aggregate.args = function(item){return [];};
				break;
		}
	}
	
	this.get = function(id){
		// id being an Object with keys matching the Reduces groupBy with appropriate values.
		// e.g. {country: "france", city: "paris"}
		return this.query(id);
	};
	
	this.getIdentity = function(object){
		return groupof(object);
	};
	
	if (store.remove){
		this.remove = function(id){
			//remove entire group from underlying store, if supported
			var transacton = (store.transaction && store.transaction()),
				data = store.query(id);
				for (var i=0, j=data.length; i<j; i++) store.remove(store.getIdentity(data[i]));
			if (transaction) transaction.commit();
		};
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
				var tempdata = {};
			
				array.forEach(data, function(storeitem){//or shift?
					//build up the groupby values and their index
					var group = groupof(storeitem);
					var ix = json.stringify(group);//technically an object is unordered these indexes may not ne equal for equal groups.
					group = tempdata[ix] || (tempdata[ix]=group);
			
					//now aggregate the items values
					for (name in value){
						var aggregate = value[name],
							field = group[name];
					
						if (typeof field == 'undefined'){//initialize
							group[name] = field = typeof aggregate.seed == 'object'?lang.clone(aggregate.seed):{value:aggregate.seed};//create attributes from seed or introduce value attribute
						}
			
						aggregate.aggregator.apply(field, aggregate.args(storeitem));
					};
				});
				
				//finish off the aggregation fields and return an array of results
				// var data = [];
				var i=0;
				for (ix in tempdata){
					var item = tempdata[ix];
					for (name in value){//replace accumulator with result of value(accumulator)
						var aggregate = value[name],
							field = item[name];
						
						item[name] = function(){//TODO move to constructor
							switch (typeof aggregate.value){
								case ('function'):
									return aggregate.value;
								case ('string'):
									return function(){return this[aggregate.value];}
								case ('undefined'):
									return function(){return this.value;};
							}
						}().apply(field);
					}
					// data.push(item);
					results[i++]=item;
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

	// getChildren: function(parent, options){} // ?
	// getMetadata: function(object){} 

};

//	all functions return an object with the following properties:
//		aggregator: aggregation function(args) that will be applied to the aggregator object during aggregation
//			mandatory
//		seed: initial value for the aggregator object, or a primitive (equivalent to {value: <original seed>})
//			optional, in which case the aggregaor and value functions need to handle an undefined aggregator
//		value: a function() that converts the aggregator object into a single value for the final result
//			optional, in which case the default aggregator object value will be returned
//		args: the item property names to use as arguments to the aggregation function
//			optional, but should define as many names as the aggregator function needs arguments
Reduce.count = function(arg){
	var count = {//count(*)
		seed: {value: 0}
	}
	
	if (arg && !(arg[0]=='*' && arg.length==1)) {//count(col): col not null
		count.aggregator = function(val){if (val) this.value++};
		count.args = arg;
	}else{
		count.aggregator = function(){this.value++};
	}
	
	return count;
};

Reduce.sum = function(arg){return {
	aggregator: function(val){if (val) this.value+=val;}, 
	seed: {value: 0}, 
	args: arg
}};

Reduce.min = function(arg){return {
	aggregator: function(val){if (val && (!this.value || val<this.value )) this.value=val;}, 
	args: arg
}};

Reduce.max = function(arg){return {
	aggregator: function(val){if (val && (!this.value || val>this.value )) this.value=val;}, 
	args: arg
}};

Reduce.first = function(arg){return {
	aggregator: function(val){if (val && !this.value) this.value=val;},
	args: arg
}};

Reduce.last = function(arg){return {
	aggregator: function(val){if (val) this.value=val;},
	args: arg
}};

Reduce.avg = function(arg){return {
	aggregator: function(val){if (typeof val == 'number') this.sum += val, this.count++;},
	seed: {sum: 0, count: 0}, 
	value: function(){return (this.sum/this.count);},
	args: arg
}};

Reduce.median = function(arg){return {
	aggregator: function(val){if (typeof val == 'number') this.ix.push(val);},
	seed: {ix:[]},
	value: function(){this.ix.sort(); var i = (this.ix.length-1)/2, l = this.ix[Math.floor(i)], h = this.ix[Math.ceil(i)]; return (l+h)/2;},
	args: arg
}},

Reduce.mode = function(arg){return {
	aggregator: function(val){if (val) var k=json.stringify(val), c = this.ix[k]; this.ix[k]={v:val, c:c?c+1:1};},
	seed: {ix:{}},
	value: function(){var mC=0, mV; for (n in this.ix) {var r = this.ix[n]; if (r.c>mC) (mC=r.c, mV=r.v);}return mV},
	args: arg
}};


lang.setObject("dojo.store.Reduce", Reduce);

return Reduce;

});