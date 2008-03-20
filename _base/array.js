dojo.require("dojo._base.lang");
dojo.provide("dojo._base.array");

(function(){
	var _getParts = function(arr, obj, cb){
		return [ 
			dojo.isString(arr) ? arr.split("") : arr, 
			obj || dojo.global,
			// FIXME: cache the anonymous functions we create here?
			dojo.isString(cb) ? new Function("item", "index", "array", cb) : cb
		];
	};

	dojo.mixin(dojo, {
		indexOf: function(	/*Array*/		array, 
							/*Object*/		value,
							/*Integer?*/	fromIndex,
							/*Boolean?*/	findLast){
			// summary:
			//		locates the first index of the provided value in the
			//		passed array. If the value is not found, -1 is returned.
			// description:
			//		For details on this method, see:
			// 			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:indexOf>

			var step = 1, end = array.length || 0, i = 0;
			if(findLast){
				i = end - 1;
				step = end = -1;
			}
			if(fromIndex != undefined){ i = fromIndex; }
			if((findLast && i > end) || i < end){
				for(; i != end; i += step){
					if(array[i] == value){ return i; }
				}
			}
			return -1;	// Number
		},

		lastIndexOf: function(/*Array*/array, /*Object*/value, /*Integer?*/fromIndex){
			// summary:
			//		locates the last index of the provided value in the passed array. 
			//		If the value is not found, -1 is returned.
			// description:
			//		For details on this method, see:
			// 			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:lastIndexOf>
			return dojo.indexOf(array, value, fromIndex, true); // Number
		},

		forEach: function(/*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			// summary:
			//		for every item in arr, callback is invoked.  Return values are ignored.
			// arr: the array to iterate on.  If a string, operates on individual characters.
			// callback: a function is invoked with three arguments: item, index, and array
			// thisObject: may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.forEach() method.
			//		In environments that support JavaScript 1.6, this function is a passthrough to the built-in method.
			//		For more details, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:forEach>

			// match the behavior of the built-in forEach WRT empty arrs
			if(!arr || !arr.length){ return; }

			// FIXME: there are several ways of handilng thisObject. Is
			// dojo.global always the default context?
			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			for(var i=0,l=_p[0].length; i<l; i++){ 
				_p[2].call(_p[1], arr[i], i, arr);
			}
		},

		_everyOrSome: function(/*Boolean*/every, /*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			for(var i = 0, l = arr.length; i < l; i++){
				var result = !!_p[2].call(_p[1], arr[i], i, arr);
				if(every ^ result){
					return result; // Boolean
				}
			}
			return every; // Boolean
		},

		every: function(/*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			// summary:
			//		Determines whether or not every item in arr satisfies the
			//		condition implemented by callback.
			// arr: the array to iterate on.  If a string, operates on individual characters.
			// callback: a function is invoked with three arguments: item, index, and array and returns true
			//		if the condition is met.
			// thisObject: may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.every() method.
			//		In environments that support JavaScript 1.6, this function is a passthrough to the built-in method.
			//		For more details, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:every>
			// example:
			//	|	dojo.every([1, 2, 3, 4], function(item){ return item>1; });
			//		returns false
			// example:
			//	|	dojo.every([1, 2, 3, 4], function(item){ return item>0; });
			//		returns true 
			return this._everyOrSome(true, arr, callback, thisObject); // Boolean
		},

		some: function(/*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			// summary:
			//		Determines whether or not any item in arr satisfies the
			//		condition implemented by callback.
			// arr: the array to iterate on.  If a string, operates on individual characters.
			// callback: a function is invoked with three arguments: item, index, and array and returns true
			//		if the condition is met.
			// thisObject: may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.some() method.
			//		In environments that support JavaScript 1.6, this function is a passthrough to the built-in method.
			//		For more details, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:some>
			// example:
			//	|	dojo.some([1, 2, 3, 4], function(item){ return item>1; });
			//		returns true
			// example:
			//	|	dojo.some([1, 2, 3, 4], function(item){ return item<1; });
			//		returns false
			return this._everyOrSome(false, arr, callback, thisObject); // Boolean
		},

		map: function(/*Array|String*/arr, /*Function|String*/callback, /*Function?*/thisObject){
			// summary:
			//		applies callback to each element of arr and returns
			//		an Array with the results
			// arr: the array to iterate on.  If a string, operates on individual characters.
			// callback: a function is invoked with three arguments: item, index, and array and returns a value
			// thisObject: may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.map() method.
			//		In environments that support JavaScript 1.6, this function is a passthrough to the built-in method.
			//		For more details, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:map>
			// example:
			//	|	dojo.map([1, 2, 3, 4], function(item){ return item+1 });
			//		returns [2, 3, 4, 5]
			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			var outArr = (arguments[3] ? (new arguments[3]()) : []);
			for(var i=0;i<arr.length;++i){
				outArr.push(_p[2].call(_p[1], arr[i], i, arr));
			}
			return outArr; // Array
		},

		filter: function(/*Array*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			// summary:
			//		Returns a new Array with those items from arr that match the
			//		condition implemented by callback.
			// arr: the array to iterate on.  If a string, operates on individual characters.
			// callback: a function is invoked with three arguments: item, index, and array and returns true
			//		if the condition is met.
			// thisObject: may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.filter() method.
			//		In environments that support JavaScript 1.6, this function is a passthrough to the built-in method.
			//		For more details, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:filter>
			// example:
			//	|	dojo.filter([1, 2, 3, 4], function(item){ return item>1; });
			//		returns [2, 3, 4]

			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
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
