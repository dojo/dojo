dojo.require("dojo._base.lang");
dojo.provide("dojo._base.array");

(function(){
	if(Array.forEach){
		// fast, if we can
		var names = ["indexOf", "lastIndexOf", "every", "some", "forEach", "filter", "map"];
		for(var name; name = names.pop(); ){
			dojo[name] = Array[name];
		}
	}else{
		var _getParts = function(arr, thisObject){
			return [ (dojo.isString(arr) ? arr.split("") : arr), (thisObject||dojo.global) ];
		}

		dojo.mixin(dojo, {
			indexOf: function(	/*Array*/		array, 
								/*Object*/		value,
								/*Integer*/		fromIndex,
								/*Boolean?*/	_findLast){
				// summary:
				//		locates the first index of the provided value in the passed
				//		array. If the value is not found, -1 is returned.
				// description:
				//		For details on this method, see:
				// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:indexOf

				/* // negative indexes
				if(fromIndex < 0){
					fromIndex = array.length+fromIndex;
				}
				*/

				// FIXME: use built in indexOf and lastIndexOf if available.
				if(findLast){
					var step = -1, i = (fromIndex||array.length - 1), end = -1;
				}else{
					var step = 1, i = (fromIndex||0), end = array.length;
				}
				for(; i!=end; i+=step){
					if(array[i] == value){ return i; }
				}
				return -1;	// number
			},

			lastIndexOf: function(/*Array*/array, /*Object*/value, /*Boolean?*/fromIndex){
				// summary:
				//		locates the lat index of the provided value in the passed
				//		array. If the value is not found, -1 is returned.
				// description:
				//		For details on this method, see:
				// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:lastIndexOf
				return dojo.indexOf(array, value, fromIndex, true); // number
			},

			map: function(/*Array*/array, /*Function*/callback, /*Object?*/thisObject){
				// summary:
				//		applies a function to each element of an Array and creates
				//		an Array with the results
				// description:
				//		returns a new array constituted from the return values of
				//		passing each element of array into unary_func. The thisObject parameter
				//		may be passed to enable the passed function to be called in
				//		that scope.  In environments that support JavaScript 1.6, this
				//		function is a passthrough to the built-in map() function
				//		provided by Array instances. For details on this, see:
				// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:map
				// usage:
				//		dojo.map([1, 2, 3, 4], function(item){ return item+1 });
				//		// returns [2, 3, 4, 5]
				var _p = _getParts(array, thisObject); array = _p[0]; thisObject = _p[1];
				var outArr = [];
				for(var i=0;i<array.length;++i){
					outArr.push(callback.call(thisObject, array[i]));
				}
				return outArr; // Array
			},

			forEach: function(/*Array*/array, /*Function*/callback, /*Object?*/thisObject){
				// summary:
				//		for every item in array, call callback with that item as its
				//		only parameter.
				// description:
				//		Return values are ignored. This function
				//		corresponds (and wraps) the JavaScript 1.6 forEach method. For
				//		more details, see:
				//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:forEach

				// match the behavior of the built-in forEach WRT empty arrs
				if((!arr)||(!arr.length)){ return; }

				// FIXME: there are several ways of handilng thisObject. Is
				// dojo.global always the default context?
				var _p = _getParts(array, thisObject); array = _p[0]; thisObject = _p[1];
				for(var i=0,l=array.length; i<l; i++){ 
					callback.call(thisObject, array[i], i, array);
				}
			},

			_everyOrSome: function(/*Boolean*/every, /*Array*/array, /*Function*/callback, /*Object?*/thisObject){
				var _p = _getParts(array, thisObject); array = _p[0]; thisObject = _p[1];
				for(var i=0,l=array.length; i<l; i++){
					var result = callback.call(thisObject, array[i], i, array);
					if(every && !result){
						return false; // Boolean
					}else if((!every)&&(result)){
						return true; // Boolean
					}
				}
				return (!!every); // Boolean
			},

			every: function(/*Array*/array, /*Function*/callback, /*Object?*/thisObject){
				// summary:
				//		determines whether or not every item in the array satisfies the
				//		condition implemented by callback. thisObject may be used to
				//		scope the call to callback. The function signature is derived
				//		from the JavaScript 1.6 Array.every() function. More
				//		information on this can be found here:
				//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:every
				// usage:
				//		dojo.every([1, 2, 3, 4], function(item){ return item > 1; });
				//		// returns false
				//		dojo.every([1, 2, 3, 4], function(item){ return item > 0; });
				//		// returns true 
				return this._everyOrSome(true, array, callback, thisObject); // Boolean
			},

			some: function(/*Array*/array, /*Function*/callback, /*Object?*/thisObject){
				// summary:
				//		determines whether or not any item in the array satisfies the
				//		condition implemented by callback. thisObject may be used to
				//		scope the call to callback. The function signature is derived
				//		from the JavaScript 1.6 Array.some() function. More
				//		information on this can be found here:
				//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:some
				// examples:
				//		dojo.some([1, 2, 3, 4], function(item){ return item > 1; });
				//		// returns true
				//		dojo.some([1, 2, 3, 4], function(item){ return item < 1; });
				//		// returns false
				return this._everyOrSome(false, array, callback, thisObject); // Boolean
			},

			filter: function(/*Array*/array, /*Function*/callback, /*Object?*/thisObject){
				// summary:
				//		returns a new Array with those items from array that match the
				//		condition implemented by callback. ob may be used to
				//		scope the call to callback. The function signature is derived
				//		from the JavaScript 1.6 Array.filter() function.
				//
				//		More information on the JS 1.6 API can be found here:
				//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:filter
				// examples:
				//		dojo.filter([1, 2, 3, 4], function(item){ return item > 1; });
				//		// returns [2, 3, 4]

				var _p = _getParts(array, thisObject); array = _p[0]; thisObject = _p[1];
				var outArr = [];
				for(var i = 0; i < array.length; i++){
					if(callback.call(thisObject, array[i], i, array)){
						outArr.push(array[i]);
					}
				}
				return outArr; // Array
			}
		});
	}
})();
