dojo.provide("dojo._base.lang");

// Crockford (ish) functions

dojo.isString = function(/*anything*/ it){
	// summary:	Return true if it is a String
	return typeof it == "string" || it instanceof String; // Boolean
}

dojo.isArray = function(/*anything*/ it){
	// summary: Return true if it is an Array
	return it && it instanceof Array || typeof it == "array"; // Boolean
}

/*=====
dojo.isFunction = function(it){
	// summary: Return true if it is a Function
	// it: anything
}
=====*/

dojo.isFunction = (function(){
	var _isFunction = function(/*anything*/ it){
		return typeof it == "function" || it instanceof Function; // Boolean
	};

	return dojo.isSafari ?
		// only slow this down w/ gratuitious casting in Safari since it's what's b0rken
		function(/*anything*/ it){
			if(typeof it == "function" && it == "[object NodeList]"){ return false; }
			return _isFunction(it); // Boolean
		} : _isFunction;
})();

dojo.isObject = function(/*anything*/ it){
	// summary: 
	//		Returns true if it is a JavaScript object (or an Array, a Function or null)
	return it !== undefined &&
		(it === null || typeof it == "object" || dojo.isArray(it) || dojo.isFunction(it)); // Boolean
}

dojo.isArrayLike = function(/*anything*/ it){
	// return:
	//		If it walks like a duck and quicks like a duck, return true
	var d = dojo;
	return it && it !== undefined &&
		// keep out built-in constructors (Number, String, ...) which have length
		// properties
		!d.isString(it) && !d.isFunction(it) &&
		!(it.tagName && it.tagName.toLowerCase() == 'form') &&
		(d.isArray(it) || isFinite(it.length)); // Boolean
}

dojo.isAlien = function(/*anything*/ it){
	// summary: 
	//		Returns true if it is a built-in function or some other kind of
	//		oddball that *should* report as a function but doesn't
	return it && !dojo.isFunction(it) && /\{\s*\[native code\]\s*\}/.test(String(it)); // Boolean
}

dojo.extend = function(/*Object*/ constructor, /*Object...*/ props){
	// summary:
	//		Adds all properties and methods of props to constructor's
	//		prototype, making them available to all instances created with
	//		constructor.
	for(var i=1, l=arguments.length; i<l; i++){
		dojo._mixin(constructor.prototype, arguments[i]);
	}
	return constructor; // Object
}

dojo._hitchArgs = function(scope, method /*,...*/){
	var pre = dojo._toArray(arguments, 2);
	var named = dojo.isString(method);
	return function(){
		// arrayify arguments
		var args = dojo._toArray(arguments);
		// locate our method
		var f = named ? (scope||dojo.global)[method] : method;
		// invoke with collected args
		return f && f.apply(scope || this, pre.concat(args)); // Any
 	} // Function
}

dojo.hitch = function(/*Object*/scope, /*Function|String*/method /*,...*/){
	// summary: 
	//		Returns a function that will only ever execute in the a given scope. 
	//		This allows for easy use of object member functions
	//		in callbacks and other places in which the "this" keyword may
	//		otherwise not reference the expected scope. 
	//		Any number of default positional arguments may be passed as parameters 
	//		beyond "method".
	//		Each of these values will be used to "placehold" (similar to curry)
	//		for the hitched function. 
	// scope: 
	//		The scope to use when method executes. If method is a string, 
	//		scope is also the object containing method.
	// method:
	//		A function to be hitched to scope, or the name of the method in
	//		scope to be hitched.
	// example:
	//	|	dojo.hitch(foo, "bar")(); 
	//		runs foo.bar() in the scope of foo
	// example:
	//	|	dojo.hitch(foo, myFunction);
	//		returns a function that runs myFunction in the scope of foo
	if(arguments.length > 2){
		return dojo._hitchArgs.apply(dojo, arguments); // Function
	}
	if(!method){
		method = scope;
		scope = null;
	}
	if(dojo.isString(method)){
		scope = scope || dojo.global;
		if(!scope[method]){ throw(['dojo.hitch: scope["', method, '"] is null (scope="', scope, '")'].join('')); }
		return function(){ return scope[method].apply(scope, arguments || []); }; // Function
	}
	return !scope ? method : function(){ return method.apply(scope, arguments || []); }; // Function
}

dojo._delegate = function(obj, props){
	// boodman/crockford delegation
	function TMP(){};
	TMP.prototype = obj;
	var tmp = new TMP();
	if(props){
		dojo.mixin(tmp, props);
	}
	return tmp; // Object
}

dojo.partial = function(/*Function|String*/method /*, ...*/){
	// summary:
	//		similar to hitch() except that the scope object is left to be
	//		whatever the execution context eventually becomes.
	//	description:
	//		Calling dojo.partial is the functional equivalent of calling:
	//		|	dojo.hitch(null, funcName, ...);
	var arr = [ null ];
	return dojo.hitch.apply(dojo, arr.concat(dojo._toArray(arguments))); // Function
}

dojo._toArray = function(/*Object*/obj, /*Number?*/offset, /*Array?*/ startWith){
	// summary:
	//		Converts an array-like object (i.e. arguments, DOMCollection)
	//		to an array. Returns a new Array object.
	// obj:
	//		the object to "arrayify". We expect the object to have, at a
	//		minimum, a length property which corresponds to integer-indexed
	//		properties.
	// offset:
	//		the location in obj to start iterating from. Defaults to 0. Optional.
	// startWith:
	//		An array to pack with the properties of obj. If provided,
	//		properties in obj are appended at the end of startWith and
	//		startWith is the returned array.
	var arr = startWith||[];
	for(var x = offset || 0; x < obj.length; x++){
		arr.push(obj[x]);
	}
	return arr; // Array
}

dojo.clone = function(/*anything*/ o){
	// summary:
	//		Clones objects (including DOM nodes) and all children.
	//		Warning: do not clone cyclic structures.
	if(!o){ return o; }
	if(dojo.isArray(o)){
		var r = [];
		for(var i = 0; i < o.length; ++i){
			r.push(dojo.clone(o[i]));
		}
		return r; // Array
	}else if(dojo.isObject(o)){
		if(o.nodeType && o.cloneNode){ // isNode
			return o.cloneNode(true); // Node
		}else{
			var r = new o.constructor(); // specific to dojo.declare()'d classes!
			for(var i in o){
				if(!(i in r) || r[i] != o[i]){
					r[i] = dojo.clone(o[i]);
				}
			}
			return r; // Object
		}
	}
	return o; /*anything*/
}

dojo.trim = function(/*String*/ str){
	// summary: 
	//		trims whitespaces from both sides of the string
	// description:
	//		This version of trim() was selected for inclusion into the base due
	//		to its compact size and relatively good performance (see Steven
	//		Levithan's blog:
	//		http://blog.stevenlevithan.com/archives/faster-trim-javascript).
	//		The fastest but longest version of this function is going to be
	//		placed in dojo.string.
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');	// String
}
