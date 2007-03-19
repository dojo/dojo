/*
 * loader.js - A bootstrap module.  Runs before the hostenv_*.js file. Contains
 * all of the package loading methods.
 */

//A semi-colon is at the start of the line because after doing a build, this
//function definition get compressed onto the same line as the last line in
//bootstrap1.js. That list line is just a curly bracket, and the browser
//complains about that syntax. The semicolon fixes it. Putting it here instead
//of at the end of bootstrap1.js, since it is more of an issue for this file,
//(using the closure), and bootstrap1.js could change in the future.
;(function(){
	//Additional properties for dojo
	var _add = {
		_pkgFileName: "__package__",
	
		// for recursion protection
		_loadedModules: {},
		_inFlightCount: 0,
	
		// FIXME: it should be possible to pull module prefixes in from djConfig
		_modulePrefixes: {
			dojo: {name: "dojo", value: ""},
			tests: {name: "tests", value: "tests"}
		},

		_moduleHasPrefix: function(/*String*/module){
			// summary: checks to see if module has been established
			var mp = this._modulePrefixes;
			return Boolean(mp[module] && mp[module].value); // Boolean
		},

		_getModulePrefix: function(/*String*/module){
			// summary: gets the prefix associated with module
			if(this._moduleHasPrefix(module)){
				return this._modulePrefixes[module].value; // String
			}
			return module; // String
		},

		_loadedUrls: [],
	
		//WARNING: 
		//		This variable is referenced by packages outside of bootstrap:
		//		FloatingPane.js and undo/browser.js
		post_load_: false,
		
		//Egad! Lots of test files push on this directly instead of using dojo.addOnLoad.
		_loaders: [],
		_unloaders: [],
		_loadNotifying: false
	};
	
	//Add all of these properties to dojo
	for(var param in _add){
		dojo[param] = _add[param];
	}
})();

dojo._loadPath = function(/*String*/relpath, /*String?*/module, /*Function?*/cb){
	// 	summary:
	//		Load a Javascript module given a relative path
	//
	//	description:
	//		Loads and interprets the script located at relpath, which is
	//		relative to the script root directory.  If the script is found but
	//		its interpretation causes a runtime exception, that exception is
	//		not caught by us, so the caller will see it.  We return a true
	//		value if and only if the script is found.
	//
	// relpath: 
	//		A relative path to a script (no leading '/', and typically ending
	//		in '.js').
	// module: 
	//		A module whose existance to check for after loading a path.  Can be
	//		used to determine success or failure of the load.
	// cb: 
	//		a callback function to pass the result of evaluating the script

	var uri = (((relpath.charAt(0) == '/' || relpath.match(/^\w+:/))) ? "" : this._baseUrl) + relpath;
	if(djConfig.cacheBust && dojo.isBrowser){
		uri += "?" + String(djConfig.cacheBust).replace(/\W+/g,"");
	}
	try{
		return !module ? this._loadUri(uri, cb) : this._loadUriAndCheck(uri, module, cb); // Boolean
	}catch(e){
		console.debug(e);
		return false; // Boolean
	}
}

dojo._loadUri = function(/*String (URL)*/uri, /*Function?*/cb){
	//	summary:
	//		Loads JavaScript from a URI
	//	description:
	//		Reads the contents of the URI, and evaluates the contents.  This is
	//		used to load modules as well as resource bundles. Returns true if
	//		it succeeded. Returns false if the URI reading failed.  Throws if
	//		the evaluation throws.
	//	uri: a uri which points at the script to be loaded
	//	cb: 
	//		a callback function to process the result of evaluating the script
	//		as an expression, typically used by the resource bundle loader to
	//		load JSON-style resources

	if(this._loadedUrls[uri]){
		return true; // Boolean
	}
	var contents = this._getText(uri, null, true);
	if(!contents){ return false; } // Boolean
	this._loadedUrls[uri] = true;
	if(cb){ contents = '('+contents+')'; }
	var value = dojo["eval"](contents);
	if(cb){ cb(value); }
	return true; // Boolean
}

// FIXME: probably need to add logging to this method
dojo._loadUriAndCheck = function(/*String (URL)*/uri, /*String*/moduleName, /*Function?*/cb){
	// summary: calls loadUri then findModule and returns true if both succeed
	var ok = true;
	try{
		ok = this._loadUri(uri, cb);
	}catch(e){
		dojo.debug("failed loading ", uri, " with error: ", e);
	}
	return Boolean(ok && this.findModule(moduleName, false)); // Boolean
}

dojo.loaded = function(){
	this._loadNotifying = true;
	this.post_load_ = true;
	var mll = this._loaders;
	for(var x=0; x<mll.length; x++){
		mll[x]();
	}

	//Clear listeners so new ones can be added
	//For other xdomain package loads after the initial load.
	this._loaders = [];
	this._loadNotifying = false;
}

dojo.unloaded = function(){
	var mll = this._unloaders;
	while(mll.length){
		(mll.pop())();
	}
}

dojo.addOnLoad = function(/*Object?*/obj, /*String|Function*/functionName) {
// summary:
//	Registers a function to be triggered after the DOM has finished loading 
//	and widgets declared in markup have been instantiated.  Images and CSS files
//	may or may not have finished downloading when the specified function is called.
//	(Note that widgets' CSS and HTML code is guaranteed to be downloaded before said
//	widgets are instantiated.)
//
// usage:
//	dojo.addOnLoad(functionPointer)
//	dojo.addOnLoad(object, "functionName")

	var d = dojo;
	if(arguments.length == 1){
		d._loaders.push(obj);
	}else if(arguments.length > 1){
		d._loaders.push(function(){
			obj[functionName]();
		});
	}

	//Added for xdomain loading. dojo.addOnLoad is used to
	//indicate callbacks after doing some dojo.require() statements.
	//In the xdomain case, if all the requires are loaded (after initial
	//page load), then immediately call any listeners.
	if(d.post_load_ && d._inFlightCount == 0 && !d._loadNotifying){
		d._callLoaded();
	}
}

dojo.addOnUnload = function(/*Object?*/obj, /*String|Function?*/functionName){
	// summary: registers a function to be triggered when the page unloads
	// usage:
	//		dojo.addOnLoad(functionPointer)
	//		dojo.addOnLoad(object, "functionName")
	var d = dojo;
	if(arguments.length == 1){
		d._unloaders.push(obj);
	}else if(arguments.length > 1){
		d._unloaders.push(function(){
			obj[functionName]();
		});
	}
}

dojo._modulesLoaded = function(){
	if(this.post_load_){ return; }
	if(this._inFlightCount > 0){ 
		dojo.debug("files still in flight!");
		return;
	}
	dojo._callLoaded();
}

dojo._callLoaded = function(){
	//The "object" check is for IE, and the other opera check fixes an issue
	//in Opera where it could not find the body element in some widget test cases.
	//For 0.9, maybe route all browsers through the setTimeout (need protection
	//still for non-browser environments though). This might also help the issue with
	//FF 2.0 and freezing issues where we try to do sync xhr while background css images
	//are being loaded (trac #2572)? Consider for 0.9.
	if(typeof setTimeout == "object" || (djConfig["useXDomain"] && dojo.isOpera)){
		setTimeout("dojo.loaded();", 0);
	}else{
		dojo.loaded();
	}
}

dojo.getModuleSymbols = function(/*String*/modulename){
	// summary:
	//		Converts a module name in dotted JS notation to an array
	//		representing the path in the source tree
	var syms = modulename.split(".");
	for(var i = syms.length; i>0; i--){
		var parentModule = syms.slice(0, i).join(".");
		if((i==1) && !this._moduleHasPrefix(parentModule)){		
			// Support default module directory (sibling of dojo) for top-level modules 
			syms[0] = "../" + syms[0];
		}else{
			var parentModulePath = this._getModulePrefix(parentModule);
			if(parentModulePath != parentModule){
				syms.splice(0, i, parentModulePath);
				break;
			}
		}
	}
	return syms; // Array
}

dojo._global_omit_module_check = false;

dojo._loadModule = function(	/*String*/moduleName, 
									/*Boolean?*/exactOnly, 
									/*Boolean?*/omitModuleCheck){
	//	summary:
	//		loads a Javascript module from the appropriate URI
	//	description:
	//		_loadModule("A.B") first checks to see if symbol A.B is defined. If
	//		it is, it is simply returned (nothing to do).
	//	
	//		If it is not defined, it will look for "A/B.js" in the script root
	//		directory, followed by "A.js".
	//	
	//		It throws if it cannot find a file to load, or if the symbol A.B is
	//		not defined after loading.
	//	
	//		It returns the object A.B.
	//	
	//		This does nothing about importing symbols into the current package.
	//		It is presumed that the caller will take care of that. For example,
	//		to import all symbols:
	//	
	//			with (dojo._loadModule("A.B")) {
	//				...
	//			}
	//	
	//		And to import just the leaf symbol:
	//	
	//			var B = dojo._loadModule("A.B");
	//	   		...
	//	
	//		dj_load is an alias for dojo._loadModule

	omitModuleCheck = this._global_omit_module_check || omitModuleCheck;
	var module = this.findModule(moduleName, false);
	if(module){
		return module;
	}

	// convert periods to slashes
	var relpath = moduleName.replace(/\./g, '/') + '.js';

	var nsyms = moduleName.split(".");
	
	var syms = this.getModuleSymbols(moduleName);
	// console.debug(syms);
	var startedRelative = ((syms[0].charAt(0) != '/') && !syms[0].match(/^\w+:/));
	var last = syms[syms.length - 1];
	var ok;
	// figure out if we're looking for a full package, if so, we want to do
	// things slightly diffrently
	if(last=="*"){
		moduleName = nsyms.slice(0, -1).join('.');
		while(syms.length){
			syms.pop();
			syms.push(this._pkgFileName);
			relpath = syms.join("/") + '.js';
			if(startedRelative && relpath.charAt(0)=="/"){
				relpath = relpath.slice(1);
			}
			ok = this._loadPath(relpath, !omitModuleCheck ? moduleName : null);
			if(ok){ break; }
			syms.pop();
		}
	}else{
		relpath = syms.join("/") + '.js';
		moduleName = nsyms.join('.');
		var modArg = !omitModuleCheck ? moduleName : null;
		ok = this._loadPath(relpath, modArg);

		if(!ok && !omitModuleCheck){
			throw new Error("Could not load '" + moduleName + "'; last tried '" + relpath + "'");
		}
	}

	// check that the symbol was defined
	// Don't bother if we're doing xdomain (asynchronous) loading.
	if(!omitModuleCheck && !this["isXDomain"]){
		// pass in false so we can give better error
		module = this.findModule(moduleName, false);
		if(!module){
			throw new Error("symbol '" + moduleName + "' is not defined after loading '" + relpath + "'"); 
		}
	}

	return module;
}

dojo.require = dojo._loadModule;

dojo.provide = function(/*String*/ packageName){
	//	summary:
	//		Each javascript source file must have (exactly) one dojo.provide()
	//		call at the top of the file, corresponding to the file name.  For
	//		example, dojo/src/foo.js must have dojo.provide("dojo.foo"); at the
	//		top of the file.
	//	description:
	//		Each javascript source file is called a resource.  When a resource
	//		is loaded by the browser, dojo.provide() registers that it has been
	//		loaded.
	//	
	//		For backwards compatibility reasons, in addition to registering the
	//		resource, dojo.provide() also ensures that the javascript object
	//		for the module exists.  For example,
	//		dojo.provide("dojo.io.cometd"), in addition to registering that
	//		cometd.js is a resource for the dojo.iomodule, will ensure that
	//		the dojo.io javascript object exists, so that calls like
	//		dojo.io.foo = function(){ ... } don't fail.
	//
	//		In the case of a build (or in the future, a rollup), where multiple
	//		javascript source files are combined into one bigger file (similar
	//		to a .lib or .jar file), that file will contain multiple
	//		dojo.provide() calls, to note that it includes multiple resources.

	//Make sure we have a string.
	var fullPkgName = String(packageName);
	var strippedPkgName = fullPkgName;

	var syms = packageName.split(/\./);
	if(syms[syms.length-1]=="*"){
		syms.pop();
		strippedPkgName = syms.join(".");
	}
	var evaledPkg = dojo.getObject(strippedPkgName, true);
	this._loadedModules[fullPkgName] = evaledPkg;
	this._loadedModules[strippedPkgName] = evaledPkg;
	
	return evaledPkg; // Object
}

dojo.findModule = function(/*String*/moduleName, /*Boolean?*/mustExist){
	//	summary:
	//		Returns the Object representing the module, if it exists, otherwise
	//		null.
	//	moduleName: 
	//		A fully qualified module including package name, like 'A.B'.
	//	mustExist: 
	//		Optional, default false. throw instead of returning null if the
	//		module does not currently exist.

	var lmn = String(moduleName);

	if(this._loadedModules[lmn]){
		return this._loadedModules[lmn]; // Object
	}

	if(mustExist){
		dojo.raise("no loaded module named '" + moduleName + "'");
	}
	return null; // null
}

//Start of old bootstrap2:

dojo.platformRequire = function(/*Object containing Arrays*/modMap){
	//	description:
	//		This method taks a "map" of arrays which one can use to optionally
	//		load dojo modules. The map is indexed by the possible
	//		dojo.name_ values, with two additional values: "default"
	//		and "common". The items in the "default" array will be loaded if
	//		none of the other items have been choosen based on the
	//		hostenv.name_ item. The items in the "common" array will _always_
	//		be loaded, regardless of which list is chosen.  Here's how it's
	//		normally called:
	//	
	//			dojo.platformRequire({
	//				// an example that passes multiple args to _loadModule()
	//				browser: [
	//					["foo.bar.baz", true, true], 
	//					"foo.sample.*",
	//					"foo.test,
	//				],
	//				default: [ "foo.sample.*" ],
	//				common: [ "really.important.module.*" ]
	//			});

	// FIXME: dojo.name_ no longer works!!

	var common = modMap["common"]||[];
	var result = common.concat(modMap[dojo._name]||modMap["default"]||[]);

	for(var x=0; x<result.length; x++){
		var curr = result[x];
		if(curr.constructor == Array){
			dojo._loadModule.apply(dojo, curr);
		}else{
			dojo._loadModule(curr);
		}
	}
}


dojo.requireIf = function(/*Boolean*/ condition, /*String*/ resourceName){
	// summary:
	//		If the condition is true then call dojo.require() for the specified
	//		resource
	if(condition === true){
		// FIXME: why do we support chained require()'s here? does the build system?
		var args = [];
		for(var i = 1; i < arguments.length; i++){ 
			args.push(arguments[i]);
		}
		dojo.require.apply(dojo, args);
	}
}

dojo.requireAfterIf = dojo.requireIf;

dojo.registerModulePath = function(/*String*/module, /*String*/prefix){
	//	summary: 
	//		maps a module name to a path
	//	description: 
	//		An unregistered module is given the default path of ../<module>,
	//		relative to Dojo root. For example, module acme is mapped to
	//		../acme.  If you want to use a different module name, use
	//		dojo.registerModulePath. 
	this._modulePrefixes[module] = { name: module, value: prefix };
}

if(djConfig["modulePaths"]){
	for(var param in djConfig["modulePaths"]){
		dojo.registerModulePath(param, djConfig["modulePaths"][param]);
	}
}
