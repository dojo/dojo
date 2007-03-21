dojo.provide("dojo._base.lang");

// Crockford functions (ish)

dojo.isString = function(/*anything*/ it){
	// summary:	Return true if it is a String.
	return (typeof it == "string" || it instanceof String);
}

dojo.isArray = function(/*anything*/ it){
	// summary: Return true of it is an Array

	return (it && it instanceof Array || typeof it == "array" || it instanceof dojo.NodeList); // Boolean
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
	if(	dojo.isIE && 
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

dojo.hitch = function(/*Object*/thisObject, /*Function|String*/method /*, ...*/){
	// summary: 
	//		Returns a function that will only ever execute in the a given scope
	//		(thisObject). This allows for easy use of object member functions
	//		in callbacks and other places in which the "this" keyword may
	//		otherwise not reference the expected scope. Any number of default
	//		positional arguments may be passed as parameters beyond "method".
	//		Each of these values will be used to "placehold" (similar to curry)
	//		for the hitched function. Note that the order of arguments may be
	//		reversed in a future version.
	// thisObject: the scope to run the method in
	// method:
	//		a function to be "bound" to thisObject or the name of the method in
	//		thisObject to be used as the basis for the binding
	// usage:
	//		dojo.hitch(foo, "bar")(); // runs foo.bar() in the scope of foo
	//		dojo.hitch(foo, myFunction); // returns a function that runs myFunction in the scope of foo

	// FIXME:
	//		should this be extended to "fixate" arguments in a manner similar
	//		to dojo.curry, but without the default execution of curry()?
	var args = [];
	for(var x=2; x<arguments.length; x++){
		args.push(arguments[x]);
	}
	var fcn = ((dojo.isString(method)) ? (thisObject||dojo.global())[method] : method) || function(){};
	return function(){
		var ta = args.concat([]); // make a copy
		for(var x=0; x<arguments.length; x++){
			ta.push(arguments[x]);
		}
		return fcn.apply((thisObject||this), ta); // Function
	};
}

dojo.partial = function(/*Function|String*/method /*, ...*/){
	// summary:
	//		similar to hitch() except that the scope object is left to be
	//		whatever the execution context eventually becomes. This is the
	//		functional equivalent of calling:
	//			dojo.hitch(null, funcName, ...);
	var args = [ null ];
	for(var x=0; x<arguments.length; x++){
		args.push(arguments[x]);
	}
	return dojo.hitch.apply(dojo, args);
}
