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
			dojo: {name: "dojo", value: "."},
			doh: {name: "doh", value: "../util/doh"},
			tests: {name: "tests", value: "tests"}
		},

		_moduleHasPrefix: function(/*String*/module){
			// summary: checks to see if module has been established
			var mp = this._modulePrefixes;
			return Boolean(mp[module] && mp[module].value); // Boolean
		},

		_getModulePrefix: function(/*String*/module){
			// summary: gets the prefix associated with module
			var mp = this._modulePrefixes;
			if(this._moduleHasPrefix(module)){
				return mp[module].value; // String
			}
			return module; // String
		},

		_loadedUrls: [],
	
		//WARNING: 
		//		This variable is referenced by packages outside of bootstrap:
		//		FloatingPane.js and undo/browser.js
		_postLoad: false,
		
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

	var uri = (((relpath.charAt(0) == '/' || relpath.match(/^\w+:/))) ? "" : this.baseUrl) + relpath;
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
	var contents = this._getText(uri, true);
	if(!contents){ return false; } // Boolean
	this._loadedUrls[uri] = true;
	if(cb){ contents = '('+contents+')'; }
	// var value = dojo["eval"](contents);
	var value = dojo["eval"]("//@ sourceURL="+uri+"\r\n"+contents);
	if(cb){ cb(value); }
	return true; // Boolean
}

// FIXME: probably need to add logging to this method
dojo._loadUriAndCheck = function(/*String (URL)*/uri, /*String*/moduleName, /*Function?*/cb){
	// summary: calls loadUri then findModule and returns true if both succeed
	var ok = false;
	try{
		ok = this._loadUri(uri, cb);
	}catch(e){
		console.debug("failed loading ", uri, " with error: ", e);
	}
	return Boolean(ok && this._loadedModules[moduleName]); // Boolean
}

dojo.loaded = function(){
	this._loadNotifying = true;
	this._postLoad = true;
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

dojo.addOnLoad = function(/*Object?*/obj, /*String|Function*/functionName){
	// summary:
	//		Registers a function to be triggered after the DOM has finished
	//		loading and widgets declared in markup have been instantiated.
	//		Images and CSS files may or may not have finished downloading when
	//		the specified function is called.  (Note that widgets' CSS and HTML
	//		code is guaranteed to be downloaded before said widgets are
	//		instantiated.)
	//
	// usage:
	//		dojo.addOnLoad(functionPointer);
	//		dojo.addOnLoad(object, "functionName");
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
	if(d._postLoad && d._inFlightCount == 0 && !d._loadNotifying){
		d._callLoaded();
	}
}

dojo.addOnUnload = function(/*Object?*/obj, /*String|Function?*/functionName){
	// summary: registers a function to be triggered when the page unloads
	// usage:
	//		dojo.addOnUnload(functionPointer)
	//		dojo.addOnUnload(object, "functionName")
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
	if(this._postLoad){ return; }
	if(this._inFlightCount > 0){ 
		console.debug("files still in flight!");
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

dojo._getModuleSymbols = function(/*String*/modulename){
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
	// console.debug(syms);
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
	var module = this._loadedModules[moduleName];
	if(module){
		return module;
	}

	// convert periods to slashes
	var nsyms = moduleName.split(".");
	var syms = this._getModuleSymbols(moduleName);
	var startedRelative = ((syms[0].charAt(0) != '/') && !syms[0].match(/^\w+:/));
	var last = syms[syms.length - 1];
	var relpath;
	// figure out if we're looking for a full package, if so, we want to do
	// things slightly diffrently
	if(last=="*"){
		moduleName = nsyms.slice(0, -1).join('.');
		syms.pop();
		relpath = syms.join("/") + "/" + this._pkgFileName + '.js';
		if(startedRelative && relpath.charAt(0)=="/"){
			relpath = relpath.slice(1);
		}
	}else{
		relpath = syms.join("/") + '.js';
		moduleName = nsyms.join('.');
	}
	var modArg = (!omitModuleCheck) ? moduleName : null;
	var ok = this._loadPath(relpath, modArg);

	if((!ok)&&(!omitModuleCheck)){
		throw new Error("Could not load '" + moduleName + "'; last tried '" + relpath + "'");
	}

	// check that the symbol was defined
	// Don't bother if we're doing xdomain (asynchronous) loading.
	if((!omitModuleCheck)&&(!this["isXDomain"])){
		// pass in false so we can give better error
		module = this._loadedModules[moduleName];
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

dojo.requireLocalization = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale, /*String?*/availableFlatLocales){
	// summary:
	//		Declares translated resources and loads them if necessary, in the
	//		same style as dojo.require.  Contents of the resource bundle are
	//		typically strings, but may be any name/value pair, represented in
	//		JSON format.  See also dojo.i18n.getLocalization.
	// moduleName: 
	//		name of the package containing the "nls" directory in which the
	//		bundle is found
	// bundleName: 
	//		bundle name, i.e. the filename without the '.js' suffix
	// locale: 
	//		the locale to load (optional)  By default, the browser's user
	//		locale as defined by dojo.locale
	// availableFlatLocales: 
	//		A comma-separated list of the available, flattened locales for this
	//		bundle. This argument should only be set by the build process.
	// description:
	//		Load translated resource bundles provided underneath the "nls"
	//		directory within a package.  Translated resources may be located in
	//		different packages throughout the source tree.  For example, a
	//		particular widget may define one or more resource bundles,
	//		structured in a program as follows, where moduleName is
	//		mycode.mywidget and bundleNames available include bundleone and
	//		bundletwo:
	//
	//			...
	//			mycode/
	//			 mywidget/
	//			  nls/
	//			   bundleone.js (the fallback translation, English in this example)
	//			   bundletwo.js (also a fallback translation)
	//			   de/
	//			    bundleone.js
	//			    bundletwo.js
	//			   de-at/
	//			    bundleone.js
	//			   en/
	//			    (empty; use the fallback translation)
	//			   en-us/
	//			    bundleone.js
	//			   en-gb/
	//			    bundleone.js
	//			   es/
	//			    bundleone.js
	//			    bundletwo.js
	//			  ...etc
	//			...
	//
	//		Each directory is named for a locale as specified by RFC 3066,
	//		(http://www.ietf.org/rfc/rfc3066.txt), normalized in lowercase.
	//		Note that the two bundles in the example do not define all the same
	//		variants.  For a given locale, bundles will be loaded for that
	//		locale and all more general locales above it, including a fallback
	//		at the root directory.  For example, a declaration for the "de-at"
	//		locale will first load nls/de-at/bundleone.js, then
	//		nls/de/bundleone.js and finally nls/bundleone.js.  The data will be
	//		flattened into a single Object so that lookups will follow this
	//		cascading pattern.  An optional build step can preload the bundles
	//		to avoid data redundancy and the multiple network hits normally
	//		required to load these resources.

	dojo.require("dojo.i18n");
	dojo.i18n._requireLocalization.apply(dojo.hostenv, arguments);
};

(function(){

	var ore = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$");
	var ire = new RegExp("^((([^:]+:)?([^@]+))@)?([^:]*)(:([0-9]+))?$");

	dojo._Url = function(/*dojo._Url||String...*/){
		// summary: 
		//		Constructor to create an object representing a URL.
		//		It is marked as private, since we might consider removing
		//		or simplifying it.
		// description: 
		//		Each argument is evaluated in order relative to the next until
		//		a canonical uri is produced. To get an absolute Uri relative to
		//		the current document use:
		//      	new dojo._Url(document.baseURI, url)

		// TODO: support for IPv6, see RFC 2732

		// resolve uri components relative to each other
		var n = null;
		var _a = arguments;
		var uri = _a[0];
		for(var i = 1; i<_a.length; i++){
			if(!_a[i]){ continue; }

			// Safari doesn't support this.constructor so we have to be explicit
			var relobj = new dojo._Url(_a[i]+"");
			var uriobj = new dojo._Url(uri+"");

			if(
				(relobj.path=="")	&&
				(!relobj.scheme)	&&
				(!relobj.authority)	&&
				(!relobj.query)
			){
				if(relobj.fragment != null){
					uriobj.fragment = relobj.fragment;
				}
				relobj = uriobj;
			}else if(relobj.scheme == null){
				relobj.scheme = uriobj.scheme;

				if(relobj.authority == null){
					relobj.authority = uriobj.authority;

					if(relobj.path.charAt(0) != "/"){
						var path = uriobj.path.substring(0,
							uriobj.path.lastIndexOf("/") + 1) + relobj.path;

						var segs = path.split("/");
						for(var j = 0; j < segs.length; j++){
							if(segs[j] == "."){
								if (j == segs.length - 1) { segs[j] = ""; }
								else { segs.splice(j, 1); j--; }
							}else if(j > 0 && !(j == 1 && segs[0] == "") &&
								segs[j] == ".." && segs[j-1] != ".."){

								if(j == (segs.length - 1)){
									segs.splice(j, 1); segs[j - 1] = "";
								}else{
									segs.splice(j - 1, 2); j -= 2;
								}
							}
						}
						relobj.path = segs.join("/");
					}
				}
			}

			uri = "";
			if(relobj.scheme != null){ 
				uri += relobj.scheme + ":";
			}
			if(relobj.authority != null){
				uri += "//" + relobj.authority;
			}
			uri += relobj.path;
			if(relobj.query != null){
				uri += "?" + relobj.query;
			}
			if(relobj.fragment != null){
				uri += "#" + relobj.fragment;
			}
		}

		this.uri = uri.toString();

		// break the uri into its main components
		var r = this.uri.match(ore);

		this.scheme = r[2] || (r[1] ? "" : null);
		this.authority = r[4] || (r[3] ? "" : null);
		this.path = r[5]; // can never be undefined
		this.query = r[7] || (r[6] ? "" : null);
		this.fragment  = r[9] || (r[8] ? "" : null);

		if(this.authority != null){
			// server based naming authority
			r = this.authority.match(ire);

			this.user = r[3] || null;
			this.password = r[4] || null;
			this.host = r[5];
			this.port = r[7] || null;
		}
	}

	dojo._Url.prototype.toString = function(){ return this.uri; };
})();

dojo.moduleUrl = function(/*String*/module, /*dojo._Url||String*/url){
	// summary: 
	//		returns a Url object relative to a module
	// description: 
	//		Examples: 
	//			dojo.moduleUrl("dojo.widget","templates/template.html");
	//			dojo.moduleUrl("acme","images/small.png")

	var loc = dojo._getModuleSymbols(module).join('/');
	if(!loc){ return null; }
	if(loc.lastIndexOf("/") != loc.length-1){
		loc += "/";
	}
	
	//If the path is an absolute path (starts with a / or is on another
	//domain/xdomain) then don't add the baseUrl.
	var colonIndex = loc.indexOf(":");
	if(loc.charAt(0) != "/" && (colonIndex == -1 || colonIndex > loc.indexOf("/"))){
		loc = dojo.baseUrl + loc;
	}

	return new dojo._Url(loc, url);
}
