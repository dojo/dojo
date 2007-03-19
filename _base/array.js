dojo.provide("dojo.lang.array");

dojo.require("dojo.lang.common");


dojo.lang.mixin(dojo.lang, {

	// FIXME: Is this worthless since you can do: if(name in obj)
	// is this the right place for this?
	has: function(/*Object*/obj, /*String*/name){
		// summary: is there a property with the passed name in obj?
		try{
			return typeof obj[name] != "undefined"; // Boolean
		}catch(e){ return false; } // Boolean
	},

	isEmpty: function(/*Object*/obj){
		// summary:
		//		determines if the passed object is "empty".
		// description:
		//		In the case of array-like objects, the length property is
		//		examined, but for other types of objects iteration is used to
		//		examine the iterable "surface area" to determine if any
		//		non-prototypal properties have been assigned. This iteration is
		//		prototype-extension safe.
		if(dojo.lang.isArrayLike(obj) || dojo.lang.isString(obj)){
			return obj.length === 0; // Boolean
		}else if(dojo.lang.isObject(obj)){
			var tmp = {};
			for(var x in obj){
				if(obj[x] && (!tmp[x])){
					return false;
				} 
			}
			return true; // Boolean
		}
	},

	map: function(/*Array*/arr, /*Object|Function*/obj, /*Function?*/unary_func){
		// summary:
		//		applies a function to each element of an Array and creates
		//		an Array with the results
		// description:
		//		returns a new array constituted from the return values of
		//		passing each element of arr into unary_func. The obj parameter
		//		may be passed to enable the passed function to be called in
		//		that scope.  In environments that support JavaScript 1.6, this
		//		function is a passthrough to the built-in map() function
		//		provided by Array instances. For details on this, see:
		// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:map
		// usage:
		//		dojo.lang.map([1, 2, 3, 4], function(item){ return item+1 });
		//		// returns [2, 3, 4, 5]
		var isString = dojo.lang.isString(arr);
		if(isString){
			// arr: String
			arr = arr.split("");
		}
		if(dojo.lang.isFunction(obj)&&(!unary_func)){
			unary_func = obj;
			obj = dj_global;
		}else if(dojo.lang.isFunction(obj) && unary_func){
			// ff 1.5 compat
			var tmpObj = obj;
			obj = unary_func;
			unary_func = tmpObj;
		}
		if(Array.map){
			var outArr = Array.map(arr, unary_func, obj);
		}else{
			var outArr = [];
			for(var i=0;i<arr.length;++i){
				outArr.push(unary_func.call(obj, arr[i]));
			}
		}
		if(isString){
			return outArr.join(""); // String
		}else{
			return outArr; // Array
		}
	},

	reduce: function(/*Array*/arr, /*Function*/binary_func, /*mixed?*/initialValue, /*Object?*/thisObject){
		// summary:
		// 		similar to Python's builtin reduce() function. The result of
		// 		the previous computation is passed as the first argument to
		// 		binary_func along with the next value from arr. The result of
		// 		this call is used along with the subsequent value from arr, and
		// 		this continues until arr is exhausted. The return value is the
		// 		last result.
		// usage:
		//		dojo.lang.reduce([1, 2, 3, 4], function(last, next){ return last+next});
		//		returns 10

		// FIXME: changes from 0.4.x calling syntax need to be documented in the 0.9 porting guide!!!
		var reducedValue = initialValue;
		if(arguments.length == 2){
			reducedValue = arr[0];
			arr = arr.slice(1);
		}

		var ob = thisObject || dj_global;
		dojo.lang.map(arr, 
			function(val){
				reducedValue = binary_func.call(ob, reducedValue, val);
			}
		);
		return reducedValue;
	},

	forEach: function(/*Array*/anArray, /*Function*/callback, /*Object?*/thisObject){
		// summary:
		//		for every item in anArray, call callback with that item as its
		//		only parameter.
		// description:
		//		Return values are ignored. This function
		//		corresponds (and wraps) the JavaScript 1.6 forEach method. For
		//		more details, see:
		//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:forEach
		if(dojo.lang.isString(anArray)){
			// anArray: String
			anArray = anArray.split(""); 
		}
		if(Array.forEach){
			Array.forEach(anArray, callback, thisObject);
		}else{
			// FIXME: there are several ways of handilng thisObject. Is dj_global always the default context?
			if(!thisObject){
				thisObject=dj_global;
			}
			for(var i=0,l=anArray.length; i<l; i++){ 
				callback.call(thisObject, anArray[i], i, anArray);
			}
		}
	},

	_everyOrSome: function(/*Boolean*/every, /*Array*/arr, /*Function*/callback, /*Object?*/thisObject){
		if(dojo.lang.isString(arr)){ 
			//arr: String
			arr = arr.split(""); 
		}
		if(Array.every){
			return Array[ every ? "every" : "some" ](arr, callback, thisObject);
		}else{
			if(!thisObject){
				thisObject = dj_global;
			}
			for(var i=0,l=arr.length; i<l; i++){
				var result = callback.call(thisObject, arr[i], i, arr);
				if(every && !result){
					return false; // Boolean
				}else if((!every)&&(result)){
					return true; // Boolean
				}
			}
			return Boolean(every); // Boolean
		}
	},

	every: function(/*Array*/arr, /*Function*/callback, /*Object?*/thisObject){
		// summary:
		//		determines whether or not every item in the array satisfies the
		//		condition implemented by callback. thisObject may be used to
		//		scope the call to callback. The function signature is derived
		//		from the JavaScript 1.6 Array.every() function. More
		//		information on this can be found here:
		//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:every
		// usage:
		//		dojo.lang.every([1, 2, 3, 4], function(item){ return item>1; });
		//		// returns false
		//		dojo.lang.every([1, 2, 3, 4], function(item){ return item>0; });
		//		// returns true 
		return this._everyOrSome(true, arr, callback, thisObject); // Boolean
	},

	some: function(/*Array*/arr, /*Function*/callback, /*Object?*/thisObject){
		// summary:
		//		determines whether or not any item in the array satisfies the
		//		condition implemented by callback. thisObject may be used to
		//		scope the call to callback. The function signature is derived
		//		from the JavaScript 1.6 Array.some() function. More
		//		information on this can be found here:
		//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:some
		// examples:
		//		dojo.lang.some([1, 2, 3, 4], function(item){ return item>1; });
		//		// returns true
		//		dojo.lang.some([1, 2, 3, 4], function(item){ return item<1; });
		//		// returns false
		return this._everyOrSome(false, arr, callback, thisObject); // Boolean
	},

	filter: function(/*Array*/arr, /*Function*/callback, /*Object?*/thisObject){
		// summary:
		//		returns a new Array with those items from arr that match the
		//		condition implemented by callback.thisObject may be used to
		//		scope the call to callback. The function signature is derived
		//		from the JavaScript 1.6 Array.filter() function, although
		//		special accomidation is made in our implementation for strings.
		//		More information on the JS 1.6 API can be found here:
		//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:filter
		// examples:
		//		dojo.lang.some([1, 2, 3, 4], function(item){ return item>1; });
		//		// returns [2, 3, 4]
		var isString = dojo.lang.isString(arr);
		if(isString){ /*arr: String*/arr = arr.split(""); }
		var outArr;
		if(Array.filter){
			outArr = Array.filter(arr, callback, thisObject);
		}else{
			if(!thisObject){
				if(arguments.length >= 3){ dojo.raise("thisObject doesn't exist!"); }
				thisObject = dj_global;
			}

			outArr = [];
			for(var i = 0; i < arr.length; i++){
				if(callback.call(thisObject, arr[i], i, arr)){
					outArr.push(arr[i]);
				}
			}
		}
		if(isString){
			return outArr.join(""); // String
		} else {
			return outArr; // Array
		}
	},

	unnest: function(/* ... */){
		// summary:
		//		Creates a 1-D array out of all the arguments passed,
		//		unravelling any array-like objects in the process
		// usage:
		//		unnest(1, 2, 3) ==> [1, 2, 3]
		//		unnest(1, [2, [3], [[[4]]]]) ==> [1, 2, 3, 4]

		var out = [];
		for(var i = 0; i < arguments.length; i++){
			if(dojo.lang.isArrayLike(arguments[i])){
				var add = dojo.lang.unnest.apply(this, arguments[i]);
				out = out.concat(add);
			}else{
				out.push(arguments[i]);
			}
		}
		return out; // Array
	},

	toArray: function(/*Object*/arrayLike, /*Number*/startOffset){
		// summary:
		//		Converts an array-like object (i.e. arguments, DOMCollection)
		//		to an array. Returns a new Array object.
		var array = [];
		for(var i = startOffset||0; i < arrayLike.length; i++){
			array.push(arrayLike[i]);
		}
		return array; // Array
	}
});
