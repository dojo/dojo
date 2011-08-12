define([], function(){

	// all relevant documentation is in dojo/_base/array.js

	// our old simple function builder stuff
	var cache = {}, u, array; // the export object

	function clearCache(){
		cache = {};
	}

	function buildFn(fn){
		return cache[fn] = new Function("item", "index", "array", fn); // Function
	}
	// magic snippet: if(typeof fn == "string") fn = cache[fn] || buildFn(fn);

	// every & some

	function everyOrSome(some){
		var every = !some;
		return function(a, fn, o){
			var i = 0, l = a && a.length || 0, result;
			if(l && typeof a == "string") a = a.split("");
			if(typeof fn == "string") fn = cache[fn] || buildFn(fn);
			if(o){
				for(; i < l; ++i){
					result = !fn.call(o, a[i], i, a);
					if(some ^ result){
						return !result;
					}
				}
			}else{
				for(; i < l; ++i){
					result = !fn(a[i], i, a);
					if(some ^ result){
						return !result;
					}
				}
			}
			return every; // Boolean
		}
	}
	// var every = everyOrSome(false), some = everyOrSome(true);

	// indexOf, lastIndexOf

	function index(up){
		var delta = 1, lOver = 0, uOver = 0;
		if(!up){
			delta = lOver = uOver = -1;
		}
		return function(a, x, from, last){
			if(last && delta > 0){
				// TODO: why do we use a non-standard signature? why do we need "last"?
				return array.lastIndexOf(a, x, from);
			}
			var l = a && a.length || 0, end = up ? l + uOver : lOver, i;
			if(from === u){
				i = up ? lOver : l + uOver;
			}else{
				if(from < 0){
					i = l + from;
					if(i < 0){
						i = lOver;
					}
				}else{
					i = from >= l ? l + uOver : from;
				}
			}
			if(l && typeof a == "string") a = a.split("");
			for(; i != end; i += delta){
				if(a[i] == x){
					return i; // Number
				}
			}
			return -1; // Number
		}
	}
	// var indexOf = index(true), lastIndexOf = index(false);

	function forEach(a, fn, o){
		var i = 0, l = a && a.length || 0;
		if(l && typeof a == "string") a = a.split("");
		if(typeof fn == "string") fn = cache[fn] || buildFn(fn);
		if(o){
			for(; i < l; ++i){
				fn.call(o, a[i], i, a);
			}
		}else{
			for(; i < l; ++i){
				fn(a[i], i, a);
			}
		}
	}

	function map(a, fn, o, Ctr){
		// TODO: why do we have a non-standard signature here? do we need "Ctr"?
		var i = 0, l = a && a.length || 0, out = new (Ctr || Array)(l);
		if(l && typeof a == "string") a = a.split("");
		if(typeof fn == "string") fn = cache[fn] || buildFn(fn);
		if(o){
			for(; i < l; ++i){
				out[i] = fn.call(o, a[i], i, a);
			}
		}else{
			for(; i < l; ++i){
				out[i] = fn(a[i], i, a);
			}
		}
		return out; // Array
	}

	function filter(a, fn, o){
		// TODO: do we need "Ctr" here like in map()?
		var i = 0, l = a && a.length || 0, out = [], value;
		if(l && typeof a == "string") a = a.split("");
		if(typeof fn == "string") fn = cache[fn] || buildFn(fn);
		if(o){
			for(; i < l; ++i){
				value = a[i];
				if(fn.call(o, value, i, a)){
					out.push(value);
				}
			}
		}else{
			for(; i < l; ++i){
				value = a[i];
				if(fn(value, i, a)){
					out.push(value);
				}
			}
		}
		return out; // Array
	}

	array = {
		every:       everyOrSome(false),
		some:        everyOrSome(true),
		indexOf:     index(true),
		lastIndexOf: index(false),
		forEach:     forEach,
		map:         map,
		filter:      filter,
		clearCache:  clearCache
	};

	/*===== return dojo.array; =====*/
	return array;
});
