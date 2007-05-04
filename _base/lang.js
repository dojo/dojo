dojo.provide("dojo._base.lang");

// Crockford functions (ish)

dojo.isString = function(/*anything*/ it){
	// summary:	Return true if it is a String.
	return (typeof it == "string" || it instanceof String); // Boolean
}

dojo.isArray = function(/*anything*/ it){
	// summary: Return true of it is an Array
	return (it && it instanceof Array || typeof it == "array" || ((typeof dojo["NodeList"] != "undefined") && (it instanceof dojo.NodeList))); // Boolean
}

if(dojo.isBrowser && dojo.isSafari){
	// only slow this down w/ gratuitious casting in Safari since it's what's b0rken
	dojo.isFunction = function(/*anything*/ it){
		if((typeof(it) == "function") && (it == "[object NodeList]")){ return false; }
		return (typeof it == "function" || it instanceof Function); // Boolean
	}
}else{
	dojo.isFunction = function(/*anything*/ it){
		return (typeof it == "function" || it instanceof Function); // Boolean
	}
}

dojo.isObject = function(/*anything*/ it){
	if(typeof it == "undefined"){ return false; }
	// FIXME: why true for null?
	return (it === null || typeof it == "object" || dojo.isArray(it) || dojo.isFunction(it)); // Boolean
}

dojo.isArrayLike = function(/*anything*/ it){
	// return:
	//		If it walks like a duck and quicks like a duck, return true
	var d = dojo;
	if((!it)||(typeof it == "undefined")){ return false; }
	if(d.isString(it)){ return false; }
	// keep out built-in constructors (Number, String, ...) which have length
	// properties
	if(d.isFunction(it)){ return false; } 
	if(d.isArray(it)){ return true; }
	if((it.tagName)&&(it.tagName.toLowerCase()=='form')){ return false; }
	if(isFinite(it.length)){ return true; }
	return false; // Boolean
}

dojo.isAlien = function(/*anything*/ it){
	// summary: 
	//		Returns true if it is a built-in function or some other kind of
	//		oddball that *should* report as a function but doesn't
	if(!it){ return false; }
	return !dojo.isFunction(it) && /\{\s*\[native code\]\s*\}/.test(String(it)); // Boolean
}

dojo._mixin = function(/*Object*/ obj, /*Object*/ props){
	// summary:
	//		Adds all properties and methods of props to obj. This addition is
	//		"prototype extension safe", so that instances of objects will not
	//		pass along prototype defaults.
	var tobj = {};
	for(var x in props){
		// the "tobj" condition avoid copying properties in "props"
		// inherited from Object.prototype.  For example, if obj has a custom
		// toString() method, don't overwrite it with the toString() method
		// that props inherited from Object.protoype
		if((typeof tobj[x] == "undefined") || (tobj[x] != props[x])){
			obj[x] = props[x];
		}
	}
	// IE doesn't recognize custom toStrings in for..in
	if(dojo.isIE && 
		(typeof(props["toString"]) == "function") && 
		(props["toString"] != obj["toString"]) && 
		(props["toString"] != tobj["toString"])
	){
		obj.toString = props.toString;
	}
	return obj; // Object
}

dojo.mixin = function(/*Object*/obj, /*Object...*/props){
	// summary:	Adds all properties and methods of props to obj. 
	for(var i=1, l=arguments.length; i<l; i++){
		dojo._mixin(obj, arguments[i]);
	}
	return obj; // Object
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
		var f = (named ? (scope||dojo.global)[method] : method);
		// invoke with collected args
		return (f)&&(f.apply(scope||this, pre.concat(args))); // Any
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
	// usage:
	//		dojo.hitch(foo, "bar")(); // runs foo.bar() in the scope of foo
	//		dojo.hitch(foo, myFunction); // returns a function that runs myFunction in the scope of foo
	if(arguments.length > 2){
		return dojo._hitchArgs.apply(dojo, arguments);
	}
	if(!method){
		method = scope;
		scope = null;
	}
	if(dojo.isString(method)){
		scope = scope || dojo.global;
		return function(){ return scope[method].apply(scope, arguments||[]); }
	}else{
		return (!scope ? method : function(){ return method.apply(scope, arguments||[]); });
	}
}

dojo._delegate = function(obj, props){
	// boodman/crockford delegation
	function TMP(){};
	TMP.prototype = obj;
	var tmp = new TMP();
	if(props){
		dojo.mixin(tmp, props);
	}
	return tmp;
}

dojo.partial = function(/*Function|String*/method /*, ...*/){
	// summary:
	//		similar to hitch() except that the scope object is left to be
	//		whatever the execution context eventually becomes. This is the
	//		functional equivalent of calling:
	//		dojo.hitch(null, funcName, ...);
	var arr = [ null ];
	return dojo.hitch.apply(dojo, arr.concat(dojo._toArray(arguments)));
}

dojo._toArray = function(/*Object*/obj, /*Number?*/offset){
	// summary:
	//		Converts an array-like object (i.e. arguments, DOMCollection)
	//		to an array. Returns a new Array object.
	var arr = [];
	for(var x= offset||0; x<obj.length; x++){
		arr.push(obj[x]);
	}
	return arr;
}

