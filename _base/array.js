dojo.provide("dojo._base.array");

dojo.mixin(dojo, {
	indexOf: function(	/*Array*/		array, 
						/*Object*/		value,
						/*Boolean?*/	identity,
						/*Boolean?*/	findLast){
		// summary:
		//		locates the first index of the provided value in the passed
		//		array. If the value is not found, -1 is returned.
		// description:
		//		For details on this method, see:
		// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:indexOf

		// FIXME: use built in indexOf and lastIndexOf if available.
		if(findLast){
			var step = -1, i = array.length - 1, end = -1;
		}else{
			var step = 1, i = 0, end = array.length;
		}
		if(identity){
			for(; i!=end; i+=step){
				if(array[i] === value){ return i; }
			}
		}else{
			for(; i!=end; i+=step){
				if(array[i] == value){ return i; }
			}
		}
		return -1;	// number
	},

	lastIndexOf: function(/*Array*/array, /*Object*/value, /*boolean?*/identity){
		// summary:
		//		locates the lat index of the provided value in the passed
		//		array. If the value is not found, -1 is returned.
		// description:
		//		For details on this method, see:
		// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:lastIndexOf
		return dojo.indexOf(array, value, identity, true); // number
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
		//		dojo.map([1, 2, 3, 4], function(item){ return item+1 });
		//		// returns [2, 3, 4, 5]
		if(typeof arr == "string"){
			// arr: String
			arr = arr.split("");
		}
		if((typeof obj == "function")&&(!unary_func)){
			unary_func = obj;
			obj = dj_global;
		}else if(dojo.isFunction(obj) && unary_func){
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

	forEach: function(/*Array*/anArray, /*Function*/callback, /*Object?*/thisObject){
		// summary:
		//		for every item in anArray, call callback with that item as its
		//		only parameter.
		// description:
		//		Return values are ignored. This function
		//		corresponds (and wraps) the JavaScript 1.6 forEach method. For
		//		more details, see:
		//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:forEach
		if(typeof anArray == "string"){
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
		if(typeof arr == "string"){
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
		//		dojo.every([1, 2, 3, 4], function(item){ return item>1; });
		//		// returns false
		//		dojo.every([1, 2, 3, 4], function(item){ return item>0; });
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
		//		dojo.some([1, 2, 3, 4], function(item){ return item>1; });
		//		// returns true
		//		dojo.some([1, 2, 3, 4], function(item){ return item<1; });
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
		//		dojo.filter([1, 2, 3, 4], function(item){ return item>1; });
		//		// returns [2, 3, 4]
		var isString = dojo.isString(arr);
		if(isString){ /*arr: String*/arr = arr.split(""); }
		var outArr;
		if(Array.filter){
			outArr = Array.filter(arr, callback, thisObject);
		}else{
			if(!thisObject){
				if(arguments.length >= 3){ 
					throw new Error("thisObject doesn't exist!");
				}
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
	}
});
