// TODOC: HOW TO DOC THE BELOW?
// @global: djConfig
// summary:
//		Application code can set the global 'djConfig' prior to loading
//		the library to override certain global settings for how dojo works.
// description:  The variables that can be set are as follows:
//			- isDebug: false
//			- libraryScriptUri: ""
//			- locale: undefined
//			- extraLocale: undefined
//			- preventBackButtonFix: true
// note:
//		'djConfig' does not exist under 'dojo.*' so that it can be set before the
//		'dojo' variable exists.
// note:
//		Setting any of these variables *after* the library has loaded does
//		nothing at all.

(function(){
	// make sure djConfig is defined
	if(typeof this["djConfig"] == "undefined"){
		this.djConfig = {};
	}

	// firebug stubs
	if((!this["console"])||(!console["firebug"])){
		this.console = {};
	}

	var cn = [
		"assert", "count", "debug", "dir", "dirxml", "error", "group",
		"groupEnd", "info", "log", "profile", "profileEnd", "time",
		"timeEnd", "trace", "warn"
	];
	var i=0, tn;
	while((tn=cn[i++])){
		if(!console[tn]){
			console[tn] = function(){};
		}
	}

	//TODOC:  HOW TO DOC THIS?
	// dojo is the root variable of (almost all) our public symbols -- make sure it is defined.
	if(typeof this["dojo"] == "undefined"){
		this.dojo = {};
	}

	var d = dojo;

	// summary:
	//		return the current global context object
	//		(e.g., the window object in a browser).
	// description:
	//		Refer to 'dojo.global' rather than referring to window to ensure your
	//		code runs correctly in contexts other than web browsers (eg: Rhino on a server).
	dojo.global = this;

	var _config =/*===== djConfig = =====*/{
		isDebug: false,
		libraryScriptUri: "",
		preventBackButtonFix: true,
		delayMozLoadingFix: false
	};

	for(var option in _config){
		if(typeof djConfig[option] == "undefined"){
			djConfig[option] = _config[option];
		}
	}

	var _platforms = ["Browser", "Rhino", "Spidermonkey", "Mobile"];
	var t;
	while(t=_platforms.shift()){
		d["is"+t] = false;
	}

	// Override locale setting, if specified
	dojo.locale = djConfig.locale;

	//TODOC:  HOW TO DOC THIS?
	dojo.version = {
		// summary: version number of this instance of dojo.
		major: 1, minor: 0, patch: 2, flag: "",
		revision: Number("$Rev$".match(/[0-9]+/)[0]),
		toString: function(){
			with(d.version){
				return major + "." + minor + "." + patch + flag + " (" + revision + ")";	// String
			}
		}
	}

	// Register with the OpenAjax hub
	if(typeof OpenAjax != "undefined"){
		OpenAjax.hub.registerLibrary("dojo", "http://dojotoolkit.org", d.version.toString());
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
			// that props inherited from Object.prototype
			if(tobj[x] === undefined || tobj[x] != props[x]){
				obj[x] = props[x];
			}
		}
		// IE doesn't recognize custom toStrings in for..in
		if(d["isIE"] && props){
			var p = props.toString;
			if(typeof p == "function" && p != obj.toString && p != tobj.toString &&
				p != "\nfunction toString() {\n    [native code]\n}\n"){
					obj.toString = props.toString;
			}
		}
		return obj; // Object
	}

	dojo.mixin = function(/*Object*/obj, /*Object...*/props){
		// summary:	Adds all properties and methods of props to obj. 
		for(var i=1, l=arguments.length; i<l; i++){
			d._mixin(obj, arguments[i]);
		}
		return obj; // Object
	}

	dojo._getProp = function(/*Array*/parts, /*Boolean*/create, /*Object*/context){
		var obj=context||d.global;
		for(var i=0, p; obj&&(p=parts[i]); i++){
			obj = (p in obj ? obj[p] : (create ? obj[p]={} : undefined));
		}
		return obj; // mixed
	}

	dojo.setObject = function(/*String*/name, /*mixed*/value, /*Object*/context){
		// summary: 
		//		Set a property from a dot-separated string, such as "A.B.C"
		//	description: 
		//		Useful for longer api chains where you have to test each object in
		//		the chain, or when you have an object reference in string format.
		//		Objects are created as needed along 'path'.
		//	name: 	
		//		Path to a property, in the form "A.B.C".
		//	context:
		//		Optional. Object to use as root of path. Defaults to
		//		'dojo.global'. Null may be passed.
		var parts=name.split("."), p=parts.pop(), obj=d._getProp(parts, true, context);
		return (obj && p ? (obj[p]=value) : undefined); // mixed
	}

	dojo.getObject = function(/*String*/name, /*Boolean*/create, /*Object*/context){
		// summary: 
		//		Get a property from a dot-separated string, such as "A.B.C"
		//	description: 
		//		Useful for longer api chains where you have to test each object in
		//		the chain, or when you have an object reference in string format.
		//	name: 	
		//		Path to an property, in the form "A.B.C".
		//	context:
		//		Optional. Object to use as root of path. Defaults to
		//		'dojo.global'. Null may be passed.
		//	create: 
		//		Optional. If true, Objects will be created at any point along the
		//		'path' that is undefined.
		return d._getProp(name.split("."), create, context); // mixed
	}

	dojo.exists = function(/*String*/name, /*Object?*/obj){
		// summary: 
		//		determine if an object supports a given method
		// description: 
		//		useful for longer api chains where you have to test each object in
		//		the chain
		// name: 	
		//		Path to an object, in the form "A.B.C".
		// obj:
		//		Object to use as root of path. Defaults to
		//		'dojo.global'. Null may be passed.
		return !!d.getObject(name, false, obj); // Boolean
	}


	dojo["eval"] = function(/*String*/ scriptFragment){
		// summary: 
		//		Perform an evaluation in the global scope.  Use this rather than
		//		calling 'eval()' directly.
		// description: 
		//		Placed in a separate function to minimize size of trapped
		//		evaluation context.
		// note:
		//	 - JSC eval() takes an optional second argument which can be 'unsafe'.
		//	 - Mozilla/SpiderMonkey eval() takes an optional second argument which is the
		//  	 scope object for new symbols.

		// FIXME: investigate Joseph Smarr's technique for IE:
		//		http://josephsmarr.com/2007/01/31/fixing-eval-to-use-global-scope-in-ie/
		//	see also:
		// 		http://trac.dojotoolkit.org/ticket/744
		return d.global.eval ? d.global.eval(scriptFragment) : eval(scriptFragment); 	// mixed
	}

	/*=====
		dojo.deprecated = function(behaviour, extra, removal){
			//	summary: 
			//		Log a debug message to indicate that a behavior has been
			//		deprecated.
			//	behaviour: String
			//		The API or behavior being deprecated. Usually in the form
			//		of "myApp.someFunction()".
			//	extra: String?
			//		Text to append to the message. Often provides advice on a
			//		new function or facility to achieve the same goal during
			//		the deprecation period.
			//	removal: String?
			//		Text to indicate when in the future the behavior will be
			//		removed. Usually a version number.
			//	example:
			//	|	dojo.deprecated("myApp.getTemp()", "use myApp.getLocaleTemp() instead", "1.0");
		}

		dojo.experimental = function(moduleName, extra){
			//	summary: Marks code as experimental.
			//	description: 
			//	 	This can be used to mark a function, file, or module as
			//	 	experimental.  Experimental code is not ready to be used, and the
			//	 	APIs are subject to change without notice.  Experimental code may be
			//	 	completed deleted without going through the normal deprecation
			//	 	process.
			//	moduleName: String
			//	 	The name of a module, or the name of a module file or a specific
			//	 	function
			//	extra: String?
			//	 	some additional message for the user
			//	example:
			//	|	dojo.experimental("dojo.data.Result");
			//	example:
			//	|	dojo.experimental("dojo.weather.toKelvin()", "PENDING approval from NOAA");
		}
	=====*/

	//Real functions declared in dojo._firebug.firebug.
	d.deprecated = d.experimental = function(){};

})();
// vim:ai:ts=4:noet
