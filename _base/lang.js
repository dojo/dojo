define("dojo/_base/lang", ["dojo/lib/kernel"], function(dojo){

(function(){
	var d = dojo, opts = Object.prototype.toString;

	// Crockford (ish) functions

	dojo.isString = function(/*anything*/ it){
		//	summary:
		//		Return true if it is a String
		return (typeof it == "string" || it instanceof String); // Boolean
	};

	dojo.isArray = function(/*anything*/ it){
		//	summary:
		//		Return true if it is an Array.
		//		Does not work on Arrays created in other windows.
		return it && (it instanceof Array || typeof it == "array"); // Boolean
	};

	dojo.isFunction = function(/*anything*/ it){
		// summary:
		//		Return true if it is a Function
		return opts.call(it) === "[object Function]";
	};

	dojo.isObject = function(/*anything*/ it){
		// summary:
		//		Returns true if it is a JavaScript object (or an Array, a Function
		//		or null)
		return it !== undefined &&
			(it === null || typeof it == "object" || d.isArray(it) || d.isFunction(it)); // Boolean
	};

	dojo.isArrayLike = function(/*anything*/ it){
		//	summary:
		//		similar to dojo.isArray() but more permissive
		//	description:
		//		Doesn't strongly test for "arrayness".  Instead, settles for "isn't
		//		a string or number and has a length property". Arguments objects
		//		and DOM collections will return true when passed to
		//		dojo.isArrayLike(), but will return false when passed to
		//		dojo.isArray().
		//	returns:
		//		If it walks like a duck and quacks like a duck, return `true`
		return it && it !== undefined && // Boolean
			// keep out built-in constructors (Number, String, ...) which have length
			// properties
			!d.isString(it) && !d.isFunction(it) &&
			!(it.tagName && it.tagName.toLowerCase() == 'form') &&
			(d.isArray(it) || isFinite(it.length));
	};

	dojo.isAlien = function(/*anything*/ it){
		// summary:
		//		Returns true if it is a built-in function or some other kind of
		//		oddball that *should* report as a function but doesn't
		return it && !d.isFunction(it) && /\{\s*\[native code\]\s*\}/.test(String(it)); // Boolean
	};

	dojo.extend = function(/*Object*/ constructor, /*Object...*/ props){
		// summary:
		//		Adds all properties and methods of props to constructor's
		//		prototype, making them available to all instances created with
		//		constructor.
		for(var i=1, l=arguments.length; i<l; i++){
			d._mixin(constructor.prototype, arguments[i]);
		}
		return constructor; // Object
	};

	dojo._hitchArgs = function(scope, method /*,...*/){
		var pre = d._toArray(arguments, 2);
		var named = d.isString(method);
		return function(){
			// arrayify arguments
			var args = d._toArray(arguments);
			// locate our method
			var f = named ? (scope||d.global)[method] : method;
			// invoke with collected args
			return f && f.apply(scope || this, pre.concat(args)); // mixed
		}; // Function
	};

	dojo.hitch = function(/*Object*/scope, /*Function|String*/method /*,...*/){
		//	summary:
		//		Returns a function that will only ever execute in the a given scope.
		//		This allows for easy use of object member functions
		//		in callbacks and other places in which the "this" keyword may
		//		otherwise not reference the expected scope.
		//		Any number of default positional arguments may be passed as parameters
		//		beyond "method".
		//		Each of these values will be used to "placehold" (similar to curry)
		//		for the hitched function.
		//	scope:
		//		The scope to use when method executes. If method is a string,
		//		scope is also the object containing method.
		//	method:
		//		A function to be hitched to scope, or the name of the method in
		//		scope to be hitched.
		//	example:
		//	|	dojo.hitch(foo, "bar")();
		//		runs foo.bar() in the scope of foo
		//	example:
		//	|	dojo.hitch(foo, myFunction);
		//		returns a function that runs myFunction in the scope of foo
		//	example:
		//		Expansion on the default positional arguments passed along from
		//		hitch. Passed args are mixed first, additional args after.
		//	|	var foo = { bar: function(a, b, c){ console.log(a, b, c); } };
		//	|	var fn = dojo.hitch(foo, "bar", 1, 2);
		//	|	fn(3); // logs "1, 2, 3"
		//	example:
		//	|	var foo = { bar: 2 };
		//	|	dojo.hitch(foo, function(){ this.bar = 10; })();
		//		execute an anonymous function in scope of foo
		
		if(arguments.length > 2){
			return d._hitchArgs.apply(d, arguments); // Function
		}
		if(!method){
			method = scope;
			scope = null;
		}
		if(d.isString(method)){
			scope = scope || d.global;
			if(!scope[method]){ throw(['dojo.hitch: scope["', method, '"] is null (scope="', scope, '")'].join('')); }
			return function(){ return scope[method].apply(scope, arguments || []); }; // Function
		}
		return !scope ? method : function(){ return method.apply(scope, arguments || []); }; // Function
	};

	/*=====
	dojo.delegate = function(obj, props){
		//	summary:
		//		Returns a new object which "looks" to obj for properties which it
		//		does not have a value for. Optionally takes a bag of properties to
		//		seed the returned object with initially.
		//	description:
		//		This is a small implementaton of the Boodman/Crockford delegation
		//		pattern in JavaScript. An intermediate object constructor mediates
		//		the prototype chain for the returned object, using it to delegate
		//		down to obj for property lookup when object-local lookup fails.
		//		This can be thought of similarly to ES4's "wrap", save that it does
		//		not act on types but rather on pure objects.
		//	obj:
		//		The object to delegate to for properties not found directly on the
		//		return object or in props.
		//	props:
		//		an object containing properties to assign to the returned object
		//	returns:
		//		an Object of anonymous type
		//	example:
		//	|	var foo = { bar: "baz" };
		//	|	var thinger = dojo.delegate(foo, { thud: "xyzzy"});
		//	|	thinger.bar == "baz"; // delegated to foo
		//	|	foo.thud == undefined; // by definition
		//	|	thinger.thud == "xyzzy"; // mixed in from props
		//	|	foo.bar = "thonk";
		//	|	thinger.bar == "thonk"; // still delegated to foo's bar
	}
	=====*/

	dojo.delegate = dojo._delegate = (function(){
		// boodman/crockford delegation w/ cornford optimization
		function TMP(){}
		return function(obj, props){
			TMP.prototype = obj;
			var tmp = new TMP();
			TMP.prototype = null;
			if(props){
				d._mixin(tmp, props);
			}
			return tmp; // Object
		};
	})();

	/*=====
	dojo._toArray = function(obj, offset, startWith){
		//	summary:
		//		Converts an array-like object (i.e. arguments, DOMCollection) to an
		//		array. Returns a new Array with the elements of obj.
		//	obj: Object
		//		the object to "arrayify". We expect the object to have, at a
		//		minimum, a length property which corresponds to integer-indexed
		//		properties.
		//	offset: Number?
		//		the location in obj to start iterating from. Defaults to 0.
		//		Optional.
		//	startWith: Array?
		//		An array to pack with the properties of obj. If provided,
		//		properties in obj are appended at the end of startWith and
		//		startWith is the returned array.
	}
	=====*/

	var efficient = function(obj, offset, startWith){
		return (startWith||[]).concat(Array.prototype.slice.call(obj, offset||0));
	};

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	var slow = function(obj, offset, startWith){
		var arr = startWith||[];
		for(var x = offset || 0; x < obj.length; x++){
			arr.push(obj[x]);
		}
		return arr;
	};
	//>>excludeEnd("webkitMobile");

	dojo._toArray =
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		d.isIE ?  function(obj){
			return ((obj.item) ? slow : efficient).apply(this, arguments);
		} :
		//>>excludeEnd("webkitMobile");
		efficient;

	dojo.partial = function(/*Function|String*/method /*, ...*/){
		//	summary:
		//		similar to hitch() except that the scope object is left to be
		//		whatever the execution context eventually becomes.
		//	description:
		//		Calling dojo.partial is the functional equivalent of calling:
		//		|	dojo.hitch(null, funcName, ...);
		var arr = [ null ];
		return d.hitch.apply(d, arr.concat(d._toArray(arguments))); // Function
	};

	var extraNames = d._extraNames, extraLen = extraNames.length, empty = {};

	dojo.clone = function(/*anything*/ o){
		// summary:
		//		Clones objects (including DOM nodes) and all children.
		//		Warning: do not clone cyclic structures.
		if(!o || typeof o != "object" || d.isFunction(o)){
			// null, undefined, any non-object, or function
			return o;	// anything
		}
		if(o.nodeType && "cloneNode" in o){
			// DOM Node
			return o.cloneNode(true); // Node
		}
		if(o instanceof Date){
			// Date
			return new Date(o.getTime());	// Date
		}
		if(o instanceof RegExp){
			// RegExp
			return new RegExp(o);   // RegExp
		}
		var r, i, l, s, name;
		if(d.isArray(o)){
			// array
			r = [];
			for(i = 0, l = o.length; i < l; ++i){
				if(i in o){
					r.push(d.clone(o[i]));
				}
			}
// we don't clone functions for performance reasons
//		}else if(d.isFunction(o)){
//			// function
//			r = function(){ return o.apply(this, arguments); };
		}else{
			// generic objects
			r = o.constructor ? new o.constructor() : {};
		}
		for(name in o){
			// the "tobj" condition avoid copying properties in "source"
			// inherited from Object.prototype.  For example, if target has a custom
			// toString() method, don't overwrite it with the toString() method
			// that source inherited from Object.prototype
			s = o[name];
			if(!(name in r) || (r[name] !== s && (!(name in empty) || empty[name] !== s))){
				r[name] = d.clone(s);
			}
		}
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		// IE doesn't recognize some custom functions in for..in
		if(extraLen){
			for(i = 0; i < extraLen; ++i){
				name = extraNames[i];
				s = o[name];
				if(!(name in r) || (r[name] !== s && (!(name in empty) || empty[name] !== s))){
					r[name] = s; // functions only, we don't clone them
				}
			}
		}
		//>>excludeEnd("webkitMobile");
		return r; // Object
	};

	/*=====
	dojo.trim = function(str){
		//	summary:
		//		Trims whitespace from both sides of the string
		//	str: String
		//		String to be trimmed
		//	returns: String
		//		Returns the trimmed string
		//	description:
		//		This version of trim() was selected for inclusion into the base due
		//		to its compact size and relatively good performance
		//		(see [Steven Levithan's blog](http://blog.stevenlevithan.com/archives/faster-trim-javascript)
		//		Uses String.prototype.trim instead, if available.
		//		The fastest but longest version of this function is located at
		//		dojo.string.trim()
		return "";	// String
	}
	=====*/

	dojo.trim = String.prototype.trim ?
		function(str){ return str.trim(); } :
		function(str){ return str.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };

	/*=====
	dojo.replace = function(tmpl, map, pattern){
		//	summary:
		//		Performs parameterized substitutions on a string. Throws an
		//		exception if any parameter is unmatched.
		//	tmpl: String
		//		String to be used as a template.
		//	map: Object|Function
		//		If an object, it is used as a dictionary to look up substitutions.
		//		If a function, it is called for every substitution with following
		//		parameters: a whole match, a name, an offset, and the whole template
		//		string (see https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/String/replace
		//		for more details).
		//	pattern: RegEx?
		//		Optional regular expression objects that overrides the default pattern.
		//		Must be global and match one item. The default is: /\{([^\}]+)\}/g,
		//		which matches patterns like that: "{xxx}", where "xxx" is any sequence
		//		of characters, which doesn't include "}".
		//	returns: String
		//		Returns the substituted string.
		//	example:
		//	|	// uses a dictionary for substitutions:
		//	|	dojo.replace("Hello, {name.first} {name.last} AKA {nick}!",
		//	|	  {
		//	|	    nick: "Bob",
		//	|	    name: {
		//	|	      first:  "Robert",
		//	|	      middle: "X",
		//	|	      last:   "Cringely"
		//	|	    }
		//	|	  });
		//	|	// returns: Hello, Robert Cringely AKA Bob!
		//	example:
		//	|	// uses an array for substitutions:
		//	|	dojo.replace("Hello, {0} {2}!",
		//	|	  ["Robert", "X", "Cringely"]);
		//	|	// returns: Hello, Robert Cringely!
		//	example:
		//	|	// uses a function for substitutions:
		//	|	function sum(a){
		//	|	  var t = 0;
		//	|	  dojo.forEach(a, function(x){ t += x; });
		//	|	  return t;
		//	|	}
		//	|	dojo.replace(
		//	|	  "{count} payments averaging {avg} USD per payment.",
		//	|	  dojo.hitch(
		//	|	    { payments: [11, 16, 12] },
		//	|	    function(_, key){
		//	|	      switch(key){
		//	|	        case "count": return this.payments.length;
		//	|	        case "min":   return Math.min.apply(Math, this.payments);
		//	|	        case "max":   return Math.max.apply(Math, this.payments);
		//	|	        case "sum":   return sum(this.payments);
		//	|	        case "avg":   return sum(this.payments) / this.payments.length;
		//	|	      }
		//	|	    }
		//	|	  )
		//	|	);
		//	|	// prints: 3 payments averaging 13 USD per payment.
		//	example:
		//	|	// uses an alternative PHP-like pattern for substitutions:
		//	|	dojo.replace("Hello, ${0} ${2}!",
		//	|	  ["Robert", "X", "Cringely"], /\$\{([^\}]+)\}/g);
		//	|	// returns: Hello, Robert Cringely!
		return "";	// String
	}
	=====*/

	var _pattern = /\{([^\}]+)\}/g;
	dojo.replace = function(tmpl, map, pattern){
		return tmpl.replace(pattern || _pattern, d.isFunction(map) ?
			map : function(_, k){ return d.getObject(k, false, map); });
	};
})();

return dojo;
});
