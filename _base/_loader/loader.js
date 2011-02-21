/*
 * loader.js - A bootstrap module.  Runs before the hostenv_*.js file. Contains
 * all of the package loading methods.
 */
//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
(function(){
	var d = dojo, currentModule;
//>>excludeEnd("webkitMobile");

	d.mixin(d, {
		_loadedModules: {},
		_inFlightCount: 0,
		_hasResource: {},

		_modulePrefixes: {
			dojo: 	{	name: "dojo", value: "." },
			// dojox: 	{	name: "dojox", value: "../dojox" },
			// dijit: 	{	name: "dijit", value: "../dijit" },
			doh: 	{	name: "doh", value: "../util/doh" },
			tests: 	{	name: "tests", value: "tests" }
		},

		_moduleHasPrefix: function(/*String*/module){
			// summary: checks to see if module has been established
			var mp = d._modulePrefixes;
			return !!(mp[module] && mp[module].value); // Boolean
		},

		_getModulePrefix: function(/*String*/module){
			// summary: gets the prefix associated with module
			var mp = d._modulePrefixes;
			if(d._moduleHasPrefix(module)){
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
	});


	//>>excludeStart("xdomainExclude", fileName.indexOf("dojo.xd.js") != -1 && kwArgs.loader == "xdomain");
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

		var uri = ((relpath.charAt(0) == '/' || relpath.match(/^\w+:/)) ? "" : d.baseUrl) + relpath;
		try{
			currentModule = module;
			return !module ? d._loadUri(uri, cb) : d._loadUriAndCheck(uri, module, cb); // Boolean
		}catch(e){
			console.error(e);
			return false; // Boolean
		}finally{
			currentModule = null;
		}
	}

	dojo._loadUri = function(/*String*/uri, /*Function?*/cb){
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

		if(d._loadedUrls[uri]){
			return true; // Boolean
		}
		d._inFlightCount++; // block addOnLoad calls that arrive while we're busy downloading
		var contents = d._getText(uri, true);
		if(contents){ // not 404, et al
			d._loadedUrls[uri] = true;
			d._loadedUrls.push(uri);
			if(cb){
				//conditional to support script-inject i18n bundle format
				contents = /^define\(/.test(contents) ? contents : '('+contents+')';
			}else{
				//Only do the scoping if no callback. If a callback is specified,
				//it is most likely the i18n bundle stuff.
				contents = d._scopePrefix + contents + d._scopeSuffix;
			}
			if(!d.isIE){ contents += "\r\n//@ sourceURL=" + uri; } // debugging assist for Firebug
			var value = d["eval"](contents);
			if(cb){ cb(value); }
		}
		// Check to see if we need to call _callLoaded() due to an addOnLoad() that arrived while we were busy downloading
		if(--d._inFlightCount == 0 && d._postLoad && d._loaders.length){
			// We shouldn't be allowed to get here but Firefox allows an event
			// (mouse, keybd, async xhrGet) to interrupt a synchronous xhrGet.
			// If the current script block contains multiple require() statements, then after each
			// require() returns, inFlightCount == 0, but we want to hold the _callLoaded() until
			// all require()s are done since the out-of-sequence addOnLoad() presumably needs them all.
			// setTimeout allows the next require() to start (if needed), and then we check this again.
			setTimeout(function(){
				// If inFlightCount > 0, then multiple require()s are running sequentially and
				// the next require() started after setTimeout() was executed but before we got here.
				if(d._inFlightCount == 0){
					d._callLoaded();
				}
			}, 0);
		}
		return !!contents; // Boolean: contents? true : false
	}
	//>>excludeEnd("xdomainExclude");

	// FIXME: probably need to add logging to this method
	dojo._loadUriAndCheck = function(/*String*/uri, /*String*/moduleName, /*Function?*/cb){
		// summary: calls loadUri then findModule and returns true if both succeed
		var ok = false;
		try{
			ok = d._loadUri(uri, cb);
		}catch(e){
			console.error("failed loading " + uri + " with error: " + e);
		}
		return !!(ok && d._loadedModules[moduleName]); // Boolean
	}

	dojo.loaded = function(){
		// summary:
		//		signal fired when initial environment and package loading is
		//		complete. You should use dojo.addOnLoad() instead of doing a
		//		direct dojo.connect() to this method in order to handle
		//		initialization tasks that require the environment to be
		//		initialized. In a browser host,	declarative widgets will
		//		be constructed when this function finishes runing.
		d._loadNotifying = true;
		d._postLoad = true;
		var mll = d._loaders;

		//Clear listeners so new ones can be added
		//For other xdomain package loads after the initial load.
		d._loaders = [];

		for(var x = 0; x < mll.length; x++){
			mll[x]();
		}

		d._loadNotifying = false;
		
		//Make sure nothing else got added to the onload queue
		//after this first run. If something did, and we are not waiting for any
		//more inflight resources, run again.
		if(d._postLoad && d._inFlightCount == 0 && mll.length){
			d._callLoaded();
		}
	}

	dojo.unloaded = function(){
		// summary:
		//		signal fired by impending environment destruction. You should use
		//		dojo.addOnUnload() instead of doing a direct dojo.connect() to this
		//		method to perform page/application cleanup methods. See
		//		dojo.addOnUnload for more info.
		var mll = d._unloaders;
		while(mll.length){
			(mll.pop())();
		}
	}

	d._onto = function(arr, obj, fn){
		if(!fn){
			arr.push(obj);
		}else if(fn){
			var func = (typeof fn == "string") ? obj[fn] : fn;
			arr.push(function(){ func.call(obj); });
		}
	}

	dojo.ready = dojo.addOnLoad = function(/*Object*/obj, /*String|Function?*/functionName){
		// summary:
		//		Registers a function to be triggered after the DOM and dojo.require() calls
		//		have finished loading.
		//
		// description:
		//		Registers a function to be triggered after the DOM has finished
		//		loading and `dojo.require` modules have loaded. Widgets declared in markup
		//		have been instantiated if `djConfig.parseOnLoad` is true when this fires.
		//
		//		Images and CSS files may or may not have finished downloading when
		//		the specified function is called.  (Note that widgets' CSS and HTML
		//		code is guaranteed to be downloaded before said widgets are
		//		instantiated, though including css resouces BEFORE any script elements
		//		is highly recommended).
		//
		// example:
		//	Register an anonymous function to run when everything is ready
		//	|	dojo.addOnLoad(function(){ doStuff(); });
		//
		// example:
		//	Register a function to run when everything is ready by pointer:
		//	|	var init = function(){ doStuff(); }
		//	|	dojo.addOnLoad(init);
		//
		// example:
		//	Register a function to run scoped to `object`, either by name or anonymously:
		//	|	dojo.addOnLoad(object, "functionName");
		//	|	dojo.addOnLoad(object, function(){ doStuff(); });

		d._onto(d._loaders, obj, functionName);

		//Added for xdomain loading. dojo.addOnLoad is used to
		//indicate callbacks after doing some dojo.require() statements.
		//In the xdomain case, if all the requires are loaded (after initial
		//page load), then immediately call any listeners.
		if(d._postLoad && d._inFlightCount == 0 && !d._loadNotifying){
			d._callLoaded();
		}
	}

	//Support calling dojo.addOnLoad via djConfig.addOnLoad. Support all the
	//call permutations of dojo.addOnLoad. Mainly useful when dojo is added
	//to the page after the page has loaded.
	var dca = d.config.addOnLoad;
	if(dca){
		d.addOnLoad[(dca instanceof Array ? "apply" : "call")](d, dca);
	}

	dojo._modulesLoaded = function(){
		if(d._postLoad){ return; }
		if(d._inFlightCount > 0){
			console.warn("files still in flight!");
			return;
		}
		d._callLoaded();
	}

	dojo._callLoaded = function(){

		// The "object" check is for IE, and the other opera check fixes an
		// issue in Opera where it could not find the body element in some
		// widget test cases.  For 0.9, maybe route all browsers through the
		// setTimeout (need protection still for non-browser environments
		// though). This might also help the issue with FF 2.0 and freezing
		// issues where we try to do sync xhr while background css images are
		// being loaded (trac #2572)? Consider for 0.9.
		if(typeof setTimeout == "object" || (d.config.useXDomain && d.isOpera)){
			setTimeout(
				d.isAIR ? function(){ d.loaded(); } : d._scopeName + ".loaded();",
				0);
		}else{
			d.loaded();
		}
	}

	dojo._getModuleSymbols = function(/*String*/modulename){
		// summary:
		//		Converts a module name in dotted JS notation to an array
		//		representing the path in the source tree
		var syms = modulename.split(".");
		for(var i = syms.length; i>0; i--){
			var parentModule = syms.slice(0, i).join(".");
			if(i == 1 && !d._moduleHasPrefix(parentModule)){
				// Support default module directory (sibling of dojo) for top-level modules
				syms[0] = "../" + syms[0];
			}else{
				var parentModulePath = d._getModulePrefix(parentModule);
				if(parentModulePath != parentModule){
					syms.splice(0, i, parentModulePath);
					break;
				}
			}
		}
		return syms; // Array
	}

	dojo._global_omit_module_check = false;

	dojo.loadInit = function(/*Function*/init){
		//	summary:
		//		Executes a function that needs to be executed for the loader's dojo.requireIf
		//		resolutions to work. This is needed mostly for the xdomain loader case where
		//		a function needs to be executed to set up the possible values for a dojo.requireIf
		//		call.
		//	init:
		//		a function reference. Executed immediately.
		//	description: This function is mainly a marker for the xdomain loader to know parts of
		//		code that needs be executed outside the function wrappper that is placed around modules.
		//		The init function could be executed more than once, and it should make no assumptions
		//		on what is loaded, or what modules are available. Only the functionality in Dojo Base
		//		is allowed to be used. Avoid using this method. For a valid use case,
		//		see the source for dojox.gfx.
		init();
	}

	dojo._loadModule = dojo.require = function(/*String*/moduleName, /*Boolean?*/omitModuleCheck){
		//	summary:
		//		loads a Javascript module from the appropriate URI
		//
		//	moduleName: String
		//		module name to load, using periods for separators,
		//		 e.g. "dojo.date.locale".  Module paths are de-referenced by dojo's
		//		internal mapping of locations to names and are disambiguated by
		//		longest prefix. See `dojo.registerModulePath()` for details on
		//		registering new modules.
		//
		//	omitModuleCheck: Boolean?
		//		if `true`, omitModuleCheck skips the step of ensuring that the
		//		loaded file actually defines the symbol it is referenced by.
		//		For example if it called as `dojo.require("a.b.c")` and the
		//		file located at `a/b/c.js` does not define an object `a.b.c`,
		//		and exception will be throws whereas no exception is raised
		//		when called as `dojo.require("a.b.c", true)`
		//
		//	description:
		// 		Modules are loaded via dojo.require by using one of two loaders: the normal loader
		// 		and the xdomain loader. The xdomain loader is used when dojo was built with a
		// 		custom build that specified loader=xdomain and the module lives on a modulePath
		// 		that is a whole URL, with protocol and a domain. The versions of Dojo that are on
		// 		the Google and AOL CDNs use the xdomain loader.
		//
		// 		If the module is loaded via the xdomain loader, it is an asynchronous load, since
		// 		the module is added via a dynamically created script tag. This
		// 		means that dojo.require() can return before the module has loaded. However, this
		// 		should only happen in the case where you do dojo.require calls in the top-level
		// 		HTML page, or if you purposely avoid the loader checking for dojo.require
		// 		dependencies in your module by using a syntax like dojo["require"] to load the module.
		//
		// 		Sometimes it is useful to not have the loader detect the dojo.require calls in the
		// 		module so that you can dynamically load the modules as a result of an action on the
		// 		page, instead of right at module load time.
		//
		// 		Also, for script blocks in an HTML page, the loader does not pre-process them, so
		// 		it does not know to download the modules before the dojo.require calls occur.
		//
		// 		So, in those two cases, when you want on-the-fly module loading or for script blocks
		// 		in the HTML page, special care must be taken if the dojo.required code is loaded
		// 		asynchronously. To make sure you can execute code that depends on the dojo.required
		// 		modules, be sure to add the code that depends on the modules in a dojo.addOnLoad()
		// 		callback. dojo.addOnLoad waits for all outstanding modules to finish loading before
		// 		executing.
		//
		// 		This type of syntax works with both xdomain and normal loaders, so it is good
		// 		practice to always use this idiom for on-the-fly code loading and in HTML script
		// 		blocks. If at some point you change loaders and where the code is loaded from,
		// 		it will all still work.
		//
		// 		More on how dojo.require
		//		`dojo.require("A.B")` first checks to see if symbol A.B is
		//		defined. If it is, it is simply returned (nothing to do).
		//
		//		If it is not defined, it will look for `A/B.js` in the script root
		//		directory.
		//
		//		`dojo.require` throws an exception if it cannot find a file
		//		to load, or if the symbol `A.B` is not defined after loading.
		//
		//		It returns the object `A.B`, but note the caveats above about on-the-fly loading and
		// 		HTML script blocks when the xdomain loader is loading a module.
		//
		//		`dojo.require()` does nothing about importing symbols into
		//		the current namespace.  It is presumed that the caller will
		//		take care of that.
		//
		// 	example:
		// 		To use dojo.require in conjunction with dojo.ready:
		//
		//		|	dojo.require("foo");
		//		|	dojo.require("bar");
		//	   	|	dojo.addOnLoad(function(){
		//	   	|		//you can now safely do something with foo and bar
		//	   	|	});
		//
		//	example:
		//		For example, to import all symbols into a local block, you might write:
		//
		//		|	with (dojo.require("A.B")) {
		//		|		...
		//		|	}
		//
		//		And to import just the leaf symbol to a local variable:
		//
		//		|	var B = dojo.require("A.B");
		//	   	|	...
		//
		//	returns:
		//		the required namespace object
		omitModuleCheck = d._global_omit_module_check || omitModuleCheck;

		//Check if it is already loaded.
		var module = d._loadedModules[moduleName];
		if(module){
			return module;
		}

		// convert periods to slashes
		var relpath = d._getModuleSymbols(moduleName).join("/") + '.js';
		var modArg = !omitModuleCheck ? moduleName : null;
		var ok = d._loadPath(relpath, modArg);
		if(!ok && !omitModuleCheck){
			throw new Error("Could not load '" + moduleName + "'; last tried '" + relpath + "'");
		}

		// check that the symbol was defined
		// Don't bother if we're doing xdomain (asynchronous) loading.
		if(!omitModuleCheck && !d._isXDomain){
			// pass in false so we can give better error
			module = d._loadedModules[moduleName];
			if(!module){
				throw new Error("symbol '" + moduleName + "' is not defined after loading '" + relpath + "'");
			}
		}

		return module;
	}

	dojo.provide = function(/*String*/ resourceName){
		//	summary:
		//		Register a resource with the package system. Works in conjunction with `dojo.require`
		//
		//	description:
		//		Each javascript source file is called a resource.  When a
		//		resource is loaded by the browser, `dojo.provide()` registers
		//		that it has been loaded.
		//
		//		Each javascript source file must have at least one
		//		`dojo.provide()` call at the top of the file, corresponding to
		//		the file name.  For example, `js/dojo/foo.js` must have
		//		`dojo.provide("dojo.foo");` before any calls to
		//		`dojo.require()` are made.
		//
		//		For backwards compatibility reasons, in addition to registering
		//		the resource, `dojo.provide()` also ensures that the javascript
		//		object for the module exists.  For example,
		//		`dojo.provide("dojox.data.FlickrStore")`, in addition to
		//		registering that `FlickrStore.js` is a resource for the
		//		`dojox.data` module, will ensure that the `dojox.data`
		//		javascript object exists, so that calls like
		//		`dojo.data.foo = function(){ ... }` don't fail.
		//
		//		In the case of a build where multiple javascript source files
		//		are combined into one bigger file (similar to a .lib or .jar
		//		file), that file may contain multiple dojo.provide() calls, to
		//		note that it includes multiple resources.
		//
		// resourceName: String
		//		A dot-sperated string identifying a resource.
		//
		// example:
		//	Safely create a `my` object, and make dojo.require("my.CustomModule") work
		//	|	dojo.provide("my.CustomModule");

		//Make sure we have a string.
		resourceName = resourceName + "";
		return (d._loadedModules[resourceName] = d.getObject(resourceName, true)); // Object
	}

	//Start of old bootstrap2:

	dojo.platformRequire = function(/*Object*/modMap){
		//	summary:
		//		require one or more modules based on which host environment
		//		Dojo is currently operating in
		//	description:
		//		This method takes a "map" of arrays which one can use to
		//		optionally load dojo modules. The map is indexed by the
		//		possible dojo.name_ values, with two additional values:
		//		"default" and "common". The items in the "default" array will
		//		be loaded if none of the other items have been choosen based on
		//		dojo.name_, set by your host environment. The items in the
		//		"common" array will *always* be loaded, regardless of which
		//		list is chosen.
		//	example:
		//		|	dojo.platformRequire({
		//		|		browser: [
		//		|			"foo.sample", // simple module
		//		|			"foo.test",
		//		|			["foo.bar.baz", true] // skip object check in _loadModule (dojo.require)
		//		|		],
		//		|		default: [ "foo.sample._base" ],
		//		|		common: [ "important.module.common" ]
		//		|	});

		var common = modMap.common || [];
		var result = common.concat(modMap[d._name] || modMap["default"] || []);

		for(var x=0; x<result.length; x++){
			var curr = result[x];
			if(curr.constructor == Array){
				d._loadModule.apply(d, curr);
			}else{
				d._loadModule(curr);
			}
		}
	}

	dojo.requireIf = function(/*Boolean*/ condition, /*String*/ resourceName){
		// summary:
		//		If the condition is true then call `dojo.require()` for the specified
		//		resource
		//
		// example:
		//	|	dojo.requireIf(dojo.isBrowser, "my.special.Module");
		
		if(condition === true){
			// FIXME: why do we support chained require()'s here? does the build system?
			var args = [];
			for(var i = 1; i < arguments.length; i++){
				args.push(arguments[i]);
			}
			d.require.apply(d, args);
		}
	}

	dojo.requireAfterIf = d.requireIf;

	dojo.registerModulePath = function(/*String*/module, /*String*/prefix){
		//	summary:
		//		Maps a module name to a path
		//	description:
		//		An unregistered module is given the default path of ../[module],
		//		relative to Dojo root. For example, module acme is mapped to
		//		../acme.  If you want to use a different module name, use
		//		dojo.registerModulePath.
		//	example:
		//		If your dojo.js is located at this location in the web root:
		//	|	/myapp/js/dojo/dojo/dojo.js
		//		and your modules are located at:
		//	|	/myapp/js/foo/bar.js
		//	|	/myapp/js/foo/baz.js
		//	|	/myapp/js/foo/thud/xyzzy.js
		//		Your application can tell Dojo to locate the "foo" namespace by calling:
		//	|	dojo.registerModulePath("foo", "../../foo");
		//		At which point you can then use dojo.require() to load the
		//		modules (assuming they provide() the same things which are
		//		required). The full code might be:
		//	|	<script type="text/javascript"
		//	|		src="/myapp/js/dojo/dojo/dojo.js"></script>
		//	|	<script type="text/javascript">
		//	|		dojo.registerModulePath("foo", "../../foo");
		//	|		dojo.require("foo.bar");
		//	|		dojo.require("foo.baz");
		//	|		dojo.require("foo.thud.xyzzy");
		//	|	</script>
		d._modulePrefixes[module] = { name: module, value: prefix };
	};
	
	dojo.requireLocalization = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale, /*String?*/availableFlatLocales){
		// summary:
		//		Declares translated resources and loads them if necessary, in the
		//		same style as dojo.require.  Contents of the resource bundle are
		//		typically strings, but may be any name/value pair, represented in
		//		JSON format.  See also `dojo.i18n.getLocalization`.
		//
		// description:
		//		Load translated resource bundles provided underneath the "nls"
		//		directory within a package.  Translated resources may be located in
		//		different packages throughout the source tree.
		//
		//		Each directory is named for a locale as specified by RFC 3066,
		//		(http://www.ietf.org/rfc/rfc3066.txt), normalized in lowercase.
		//		Note that the two bundles in the example do not define all the
		//		same variants.  For a given locale, bundles will be loaded for
		//		that locale and all more general locales above it, including a
		//		fallback at the root directory.  For example, a declaration for
		//		the "de-at" locale will first load `nls/de-at/bundleone.js`,
		//		then `nls/de/bundleone.js` and finally `nls/bundleone.js`.  The
		//		data will be flattened into a single Object so that lookups
		//		will follow this cascading pattern.  An optional build step can
		//		preload the bundles to avoid data redundancy and the multiple
		//		network hits normally required to load these resources.
		//
		// moduleName:
		//		name of the package containing the "nls" directory in which the
		//		bundle is found
		//
		// bundleName:
		//		bundle name, i.e. the filename without the '.js' suffix. Using "nls" as a
		//		a bundle name is not supported, since "nls" is the name of the folder
		//		that holds bundles. Using "nls" as the bundle name will cause problems
		//		with the custom build.
		//
		// locale:
		//		the locale to load (optional)  By default, the browser's user
		//		locale as defined by dojo.locale
		//
		// availableFlatLocales:
		//		A comma-separated list of the available, flattened locales for this
		//		bundle. This argument should only be set by the build process.
		//
		//	example:
		//		A particular widget may define one or more resource bundles,
		//		structured in a program as follows, where moduleName is
		//		mycode.mywidget and bundleNames available include bundleone and
		//		bundletwo:
		//	|		...
		//	|	mycode/
		//	|		mywidget/
		//	|			nls/
		//	|				bundleone.js (the fallback translation, English in this example)
		//	|				bundletwo.js (also a fallback translation)
		//	|				de/
		//	|					bundleone.js
		//	|					bundletwo.js
		//	|				de-at/
		//	|					bundleone.js
		//	|				en/
		//	|					(empty; use the fallback translation)
		//	|				en-us/
		//	|					bundleone.js
		//	|				en-gb/
		//	|					bundleone.js
		//	|				es/
		//	|					bundleone.js
		//	|					bundletwo.js
		//	|				  ...etc
		//	|				...
		//

		d.require("dojo.i18n");
		d.i18n._requireLocalization.apply(d.hostenv, arguments);
	};


	var ore = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$"),
		ire = new RegExp("^((([^\\[:]+):)?([^@]+)@)?(\\[([^\\]]+)\\]|([^\\[:]*))(:([0-9]+))?$");

	dojo._Url = function(/*dojo._Url|String...*/){
		// summary:
		//		Constructor to create an object representing a URL.
		//		It is marked as private, since we might consider removing
		//		or simplifying it.
		// description:
		//		Each argument is evaluated in order relative to the next until
		//		a canonical uri is produced. To get an absolute Uri relative to
		//		the current document use:
		//      	new dojo._Url(document.baseURI, url)

		var n = null,
			_a = arguments,
			uri = [_a[0]];
		// resolve uri components relative to each other
		for(var i = 1; i<_a.length; i++){
			if(!_a[i]){ continue; }

			// Safari doesn't support this.constructor so we have to be explicit
			// FIXME: Tracked (and fixed) in Webkit bug 3537.
			//		http://bugs.webkit.org/show_bug.cgi?id=3537
			var relobj = new d._Url(_a[i]+""),
				uriobj = new d._Url(uri[0]+"");

			if(
				relobj.path == "" &&
				!relobj.scheme &&
				!relobj.authority &&
				!relobj.query
			){
				if(relobj.fragment != n){
					uriobj.fragment = relobj.fragment;
				}
				relobj = uriobj;
			}else if(!relobj.scheme){
				relobj.scheme = uriobj.scheme;

				if(!relobj.authority){
					relobj.authority = uriobj.authority;

					if(relobj.path.charAt(0) != "/"){
						var path = uriobj.path.substring(0,
							uriobj.path.lastIndexOf("/") + 1) + relobj.path;

						var segs = path.split("/");
						for(var j = 0; j < segs.length; j++){
							if(segs[j] == "."){
								// flatten "./" references
								if(j == segs.length - 1){
									segs[j] = "";
								}else{
									segs.splice(j, 1);
									j--;
								}
							}else if(j > 0 && !(j == 1 && segs[0] == "") &&
								segs[j] == ".." && segs[j-1] != ".."){
								// flatten "../" references
								if(j == (segs.length - 1)){
									segs.splice(j, 1);
									segs[j - 1] = "";
								}else{
									segs.splice(j - 1, 2);
									j -= 2;
								}
							}
						}
						relobj.path = segs.join("/");
					}
				}
			}

			uri = [];
			if(relobj.scheme){
				uri.push(relobj.scheme, ":");
			}
			if(relobj.authority){
				uri.push("//", relobj.authority);
			}
			uri.push(relobj.path);
			if(relobj.query){
				uri.push("?", relobj.query);
			}
			if(relobj.fragment){
				uri.push("#", relobj.fragment);
			}
		}

		this.uri = uri.join("");

		// break the uri into its main components
		var r = this.uri.match(ore);

		this.scheme = r[2] || (r[1] ? "" : n);
		this.authority = r[4] || (r[3] ? "" : n);
		this.path = r[5]; // can never be undefined
		this.query = r[7] || (r[6] ? "" : n);
		this.fragment  = r[9] || (r[8] ? "" : n);

		if(this.authority != n){
			// server based naming authority
			r = this.authority.match(ire);

			this.user = r[3] || n;
			this.password = r[4] || n;
			this.host = r[6] || r[7]; // ipv6 || ipv4
			this.port = r[9] || n;
		}
	}

	dojo._Url.prototype.toString = function(){ return this.uri; };

	dojo.moduleUrl = function(/*String*/module, /*dojo._Url||String*/url){
		//	summary:
		//		Returns a `dojo._Url` object relative to a module.
		//	example:
		//	|	var pngPath = dojo.moduleUrl("acme","images/small.png");
		//	|	console.dir(pngPath); // list the object properties
		//	|	// create an image and set it's source to pngPath's value:
		//	|	var img = document.createElement("img");
		// 	|	// NOTE: we assign the string representation of the url object
		//	|	img.src = pngPath.toString();
		//	|	// add our image to the document
		//	|	dojo.body().appendChild(img);
		//	example:
		//		you may de-reference as far as you like down the package
		//		hierarchy.  This is sometimes handy to avoid lenghty relative
		//		urls or for building portable sub-packages. In this example,
		//		the `acme.widget` and `acme.util` directories may be located
		//		under different roots (see `dojo.registerModulePath`) but the
		//		the modules which reference them can be unaware of their
		//		relative locations on the filesystem:
		//	|	// somewhere in a configuration block
		//	|	dojo.registerModulePath("acme.widget", "../../acme/widget");
		//	|	dojo.registerModulePath("acme.util", "../../util");
		//	|
		//	|	// ...
		//	|
		//	|	// code in a module using acme resources
		//	|	var tmpltPath = dojo.moduleUrl("acme.widget","templates/template.html");
		//	|	var dataPath = dojo.moduleUrl("acme.util","resources/data.json");

		var loc = d._getModuleSymbols(module).join('/');
		if(!loc){ return null; }
		if(loc.lastIndexOf("/") != loc.length-1){
			loc += "/";
		}
		
		//If the path is an absolute path (starts with a / or is on another
		//domain/xdomain) then don't add the baseUrl.
		var colonIndex = loc.indexOf(":");
		if(loc.charAt(0) != "/" && (colonIndex == -1 || colonIndex > loc.indexOf("/"))){
			loc = d.baseUrl + loc;
		}

		return new d._Url(loc, url); // dojo._Url
	};

//>>includeStart("amdLoader", kwArgs.asynchLoader);
	// addition to support AMD module format
	// replace the bootstrap define function (defined in _base/boostrap.js) with the dojo v1.x simulated AMD loader...
	define= function(name, deps, def){
		if(!def){
			// less than 3 args
			if(deps){
				// 2 args
				def = deps;
				deps = name;
			}else{
				// one arg
				def = name;
				deps = typeof def == "function" ? ["require", "exports", "module"].slice(0, def.length) : [];
			}
			name = currentModule ? currentModule.replace(/\./g,'/') : "anon";
		}
		var dottedName = name.replace(/\//g, ".");
		var exports = dojo.provide(dottedName);

		function resolvePath(relativeId){
			// do relative path resolution
			if(relativeId.charAt(0) === '.'){
				relativeId = name.substring(0, name.lastIndexOf('/') + 1) + relativeId;
				while(lastId !== relativeId){
					var lastId = relativeId;
					relativeId = relativeId.replace(/\/[^\/]*\/\.\.\//,'/');
				}
				relativeId = relativeId.replace(/\/\.\//g,'/');
			}
			return relativeId.replace(/\//g, ".");
		}
		if(typeof def == "function"){
			for(var args= [], depName, i= 0; i<deps.length; i++){
				depName= resolvePath(deps[i]);
				// look for i18n! followed by anything followed by "/nls/" followed by anything without "/" followed by eos.
				var exclamationIndex = depName.indexOf("!");
				if(exclamationIndex > -1){
					//fool the build system
					if(depName.substring(0, exclamationIndex) == "i18n"){
						var match = depName.match(/^i18n\!(.+)\.nls\.([^\.]+)$/);
						dojo["requireLocalization"](match[1], match[2]);
					}
					arg = null;
				}else{
					var arg;
					switch(depName){
						case "require":
							arg = function(relativeId){
								return dojo.require(resolvePath(relativeId));
							};
							break;
						case "exports":
							arg = exports;
							break;
						case "module":
							var module = arg = {exports: exports};
							break;
						case "dojox":
							arg = dojo.getObject(depName);
							break;
						case "dojo/lib/kernel":
						case "dojo/lib/backCompat":
							arg = dojo;
							break;
						default:
							arg = dojo.require(depName);
					}
				}
				args.push(arg);
			}
			var returned = def.apply(null, args);
		}else{
			returned = def;
		}
		
		if(returned){
			dojo._loadedModules[dottedName] = returned;
			dojo.setObject(dottedName, returned);
		}
		if(module){
			dojo._loadedModules[dottedName] = module.exports;
		}
		return returned;
		
	};
	define.vendor = "dojotoolkit.org";
	define.version = dojo.version;
	define("dojo/lib/kernel", [], dojo);
	define("dojo/lib/backCompat", [], dojo);
	define("dojo", [], dojo);
	define("dijit", [], this.dijit || (this.dijit = {}));
//>>includeEnd("amdLoader");


//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
})();
//>>excludeEnd("webkitMobile");
