dojo.require("dojo._base.lang");
dojo.provide("dojo._base.array");

//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
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
			// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:indexOf

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
			//		locates the last index of the provided value in the passed
			//		array. If the value is not found, -1 is returned.
			// description:
			//		For details on this method, see:
			// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:lastIndexOf
			return dojo.indexOf(array, value, fromIndex, true); // Number
		},

		forEach: function(/*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			//	summary:
			//		for every item in arr, callback is invoked. Return values are ignored.
			//	arr:
			//		the array to iterate over. If a string, operates on individual characters.
			//	callback:
			//		a function is invoked with three arguments: item, index, and array
			//	thisObject:
			//		may be used to scope the call to callback
			//	description:
			//		This function corresponds to the JavaScript 1.6
			//		Array.forEach() method. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:forEach
			//	example:
			//	|	// log out all members of the array:
			//	|	dojo.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		function(item){
			//	|			console.log(item);
			//	|		}
			//	|	);
			//	example:
			//	|	// log out the members and their indexes
			//	|	dojo.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		function(item, idx, arr){
			//	|			console.log(item, "at index:", idx);
			//	|		}
			//	|	);
			//	example:
			//	|	// use a scoped object member as the callback
			//	|	
			//	|	var obj = {
			//	|		prefix: "logged via obj.callback:", 
			//	|		callback: function(item){
			//	|			console.log(this.prefix, item);
			//	|		}
			//	|	};
			//	|	
			//	|	// specifying the scope function executes the callback in that scope
			//	|	dojo.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		obj.callback,
			//	|		obj
			//	|	);
			//	|	
			//	|	// alternately, we can accomplish the same thing with dojo.hitch()
			//	|	dojo.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		dojo.hitch(obj, "callback")
			//	|	);

			// match the behavior of the built-in forEach WRT empty arrs
			if(!arr || !arr.length){ return; }

			// FIXME: there are several ways of handilng thisObject. Is
			// dojo.global always the default context?
			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			for(var i=0,l=arr.length; i<l; ++i){ 
				_p[2].call(_p[1], arr[i], i, arr);
			}
		},

		_everyOrSome: function(/*Boolean*/every, /*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			for(var i=0,l=arr.length; i<l; ++i){
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
			// arr:
			//		the array to iterate on. If a string, operates on individual characters.
			// callback:
			//		a function is invoked with three arguments: item, index,
			//		and array and returns true if the condition is met.
			// thisObject:
			//		may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6
			//		Array.every() method. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:every
			// example:
			//	|	// returns false
			//	|	dojo.every([1, 2, 3, 4], function(item){ return item>1; });
			// example:
			//	|	// returns true 
			//	|	dojo.every([1, 2, 3, 4], function(item){ return item>0; });
			return dojo._everyOrSome(true, arr, callback, thisObject); // Boolean
		},

		some: function(/*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			// summary:
			//		Determines whether or not any item in arr satisfies the
			//		condition implemented by callback.
			// arr:
			//		the array to iterate over. If a string, operates on individual characters.
			// callback:
			//		a function is invoked with three arguments: item, index,
			//		and array and returns true if the condition is met.
			// thisObject:
			//		may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6
			//		Array.some() method. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:some
			// example:
			//	|	// is true
			//	|	dojo.some([1, 2, 3, 4], function(item){ return item>1; });
			// example:
			//	|	// is false
			//	|	dojo.some([1, 2, 3, 4], function(item){ return item<1; });
			return dojo._everyOrSome(false, arr, callback, thisObject); // Boolean
		},

		map: function(/*Array|String*/arr, /*Function|String*/callback, /*Function?*/thisObject){
			// summary:
			//		applies callback to each element of arr and returns
			//		an Array with the results
			// arr:
			//		the array to iterate on. If a string, operates on
			//		individual characters.
			// callback:
			//		a function is invoked with three arguments, (item, index,
			//		array),  and returns a value
			// thisObject:
			//		may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.map()
			//		method. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:map
			// example:
			//	|	// returns [2, 3, 4, 5]
			//	|	dojo.map([1, 2, 3, 4], function(item){ return item+1 });

			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			var outArr = (arguments[3] ? (new arguments[3]()) : []);
			for(var i=0,l=arr.length; i<l; ++i){
				outArr.push(_p[2].call(_p[1], arr[i], i, arr));
			}
			return outArr; // Array
		},

		filter: function(/*Array*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			// summary:
			//		Returns a new Array with those items from arr that match the
			//		condition implemented by callback.
			// arr:
			//		the array to iterate over.
			// callback:
			//		a function that is invoked with three arguments (item,
			//		index, array). The return of this function is expected to
			//		be a boolean which determines whether the passed-in item
			//		will be included in the returned array.
			// thisObject:
			//		may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6
			//		Array.filter() method. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:filter
			// example:
			//	|	// returns [2, 3, 4]
			//	|	dojo.filter([1, 2, 3, 4], function(item){ return item>1; });

			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			var outArr = [];
			for(var i=0,l=arr.length; i<l; ++i){
				if(_p[2].call(_p[1], arr[i], i, arr)){
					outArr.push(arr[i]);
				}
			}
			return outArr; // Array
		}
	});
})();
//>>excludeEnd("webkitMobile");
//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
/*
//>>excludeEnd("webkitMobile");
//>>includeStart("webkitMobile", kwArgs.webkitMobile);
["indexOf", "lastIndexOf", "forEach", "map", "some", "every", "filter"].forEach(
	function(name, idx){
		dojo[name] = function(arr, callback, thisObj){
			if((idx > 1)&& dojo.isString(callback)){
				callback = new Function("item", "index", "array", callback);
			}
			return Array.prototype[name].call(arr, callback, thisObj);
		}
	}
);
//>>includeEnd("webkitMobile");
//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
*/
//>>excludeEnd("webkitMobile");
