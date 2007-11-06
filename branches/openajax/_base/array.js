dojo.require("dojo._base.lang");
dojo.provide("dojo._base.array");

(function(){
	var _getParts = function(arr, obj, cb){
		return [ 
			(dojo.isString(arr) ? arr.split("") : arr), 
			(obj||dojo.global),
			// FIXME: cache the anonymous functions we create here?
			(dojo.isString(cb) ? (new Function("item", "index", "array", cb)) : cb)
		];
	}

	dojo.mixin(dojo, {
		indexOf: function(	/*Array*/		array, 
							/*Object*/		value,
							/*Integer?*/	fromIndex,
							/*Boolean?*/	findLast){
			// summary:
			//		locates the first index of the provided value in the passed
			//		array. If the value is not found, -1 is returned.
			// description:
			//		For details on this method, see:
			// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:indexOf

			var i = 0, step = 1, end = array.length;
			if(findLast){
				i = end - 1;
				step = end = -1;
			}
			for(i = fromIndex || i; i != end; i += step){
				if(array[i] == value){ return i; }
			}
			return -1;	// number
		},

		lastIndexOf: function(/*Array*/array, /*Object*/value, /*Integer?*/fromIndex){
			// summary:
			//		locates the last index of the provided value in the passed
			//		array. If the value is not found, -1 is returned.
			// description:
			//		For details on this method, see:
			// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:lastIndexOf
			return dojo.indexOf(array, value, fromIndex, true); // number
		},

		forEach: function(/*Array*/arr, /*Function*/callback, /*Object?*/obj){
			// summary:
			//		for every item in arr, call callback with that item as its
			//		only parameter.
			// description:
			//		Return values are ignored. This function
			//		corresponds (and wraps) the JavaScript 1.6 forEach method. For
			//		more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:forEach

			// match the behavior of the built-in forEach WRT empty arrs
			if(!arr || !arr.length){ return; }

			// FIXME: there are several ways of handilng thisObject. Is
			// dojo.global always the default context?
			var _p = _getParts(arr, obj, callback); arr = _p[0];
			for(var i=0,l=_p[0].length; i<l; i++){ 
				_p[2].call(_p[1], arr[i], i, arr);
			}
		},

		_everyOrSome: function(/*Boolean*/every, /*Array*/arr, /*Function*/callback, /*Object?*/obj){
			var _p = _getParts(arr, obj, callback); arr = _p[0];
			for(var i = 0, l = arr.length; i < l; i++){
				var result = !!_p[2].call(_p[1], arr[i], i, arr);
				if(every ^ result){
					return result; // Boolean
				}
			}
			return every; // Boolean
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

		map: function(/*Array*/arr, /*Function*/func, /*Function?*/obj){
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
			var _p = _getParts(arr, obj, func); arr = _p[0];
			var outArr = ((arguments[3]) ? (new arguments[3]()) : []);
			for(var i=0;i<arr.length;++i){
				outArr.push(_p[2].call(_p[1], arr[i], i, arr));
			}
			return outArr; // Array
		},

		filter: function(/*Array*/arr, /*Function*/callback, /*Object?*/obj){
			// summary:
			//		returns a new Array with those items from arr that match the
			//		condition implemented by callback. ob may be used to
			//		scope the call to callback. The function signature is derived
			//		from the JavaScript 1.6 Array.filter() function.
			//
			//		More information on the JS 1.6 API can be found here:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:filter
			// examples:
			//		dojo.filter([1, 2, 3, 4], function(item){ return item>1; });
			//		// returns [2, 3, 4]

			var _p = _getParts(arr, obj, callback); arr = _p[0];
			var outArr = [];
			for(var i = 0; i < arr.length; i++){
				if(_p[2].call(_p[1], arr[i], i, arr)){
					outArr.push(arr[i]);
				}
			}
			return outArr; // Array
		}
	});
})();
