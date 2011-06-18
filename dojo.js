(function(
	userConfig,
	defaultConfig
){
	// summary:
	//		This is the "source loader" and is the entry point for Dojo during development. You may also load Dojo with
	//		any AMD-compliant loader via the package main module dojo/main.
	// description:
	//		This is the "source loader" for Dojo. It provides an AMD-compliant loader that can be configured
	//		to operate in either synchronous or asynchronous modes. After the loader is defined, dojo is loaded
	//		IAW the package main module dojo/main. In the event you wish to use a foreign loader, you may load dojo as a package
	//		via the package main module dojo/main and this loader is not required; see dojo/package.json for details.
	//
	//		In order to keep compatibility with the v1.x line, this loader includes additional machinery that enables
	//		the dojo.provide, dojo.require et al API. This machinery is loaded by default, but may be dynamically removed
	//		via the has.js API and statically removed via the build system.
	//
	//		This loader includes sniffing machinery to determine the environment; the following environments are supported:
	//
	//			* browser
	//			* node.js
	//			* rhino
	//
	//		This is the so-called "source loader". As such, it includes many optional features that may be discadred by
	//		building a customized verion with the build system.

	// Design and Implementation Notes
	//
	// This is a dojo-specific adaption of bdLoad, donated to the dojo foundation by Altoviso LLC.
	//
	// This function defines an AMD-compliant (http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition)
	// loader that can be configured to operate in either synchronous or asynchronous modes.
	//
	// Since this machinery implements a loader, it does not have the luxury of using a load system and/or
	// leveraging a utility library. This results in an unpleasantly long file; here is a road map of the contents:
	//
	//	 1. Small library for use implementing the loader.
	//	 2. Define the has.js API; this is used throughout the loader to bracket features.
	//	 3. Define the node.js and rhino sniffs and sniff.
	//	 4. Define the loader's data.
	//	 5. Define the configuration machinery.
	//	 6. Define the script element sniffing machinery and sniff for configuration data.
	//	 7. Configure the loader IAW the provided user, default, and sniffing data.
	//	 8. Define the global require function.
	//	 9. Define the module resolution machinery.
	//	10. Define the module and plugin module definition machinery
	//	11. Define the script injection machinery.
	//	12. Define the window load detection.
	//	13. Define the logging API.
	//	14. Define the tracing API.
	//	16. Define the AMD define function.
	//	17. Define the dojo v1.x provide/require machinery--so called "legacy" modes.
	//	18. Publish global variables.
	//
	// Language and Acronyms and Idioms
	//
	// moduleId: a CJS module identifier, (used for public APIs)
	// mid: moduleId (used internally)
	// packageId: a package identifier (used for public APIs)
	// pid: packageId (used internally); the implied system or default package has pid===""
	// package-qualified name: a mid qualified by the pid of which the module is a member; result is the string pid + "*" + mid
	// pqn: package-qualified name
	// pack: package is used internally to reference a package object (since javascript has reserved words including "package")
	// The integer constant 1 is used in place of true and 0 in place of false.
	//
	// TODO: The concept of a pqn is left over from a previous design. For all intents and purposes pqn==path==pid + / + mid.
	// Need to remove this cruft.

	// define a minimal library to help build the loader
	var	noop = function(){
		},

		isEmpty = function(it){
			for(var p in it){
				return 0;
			}
			return 1;
		},

		toString = {}.toString,

		isFunction = function(it){
			return toString.call(it) == "[object Function]";
		},

		isString = function(it){
			return toString.call(it) == "[object String]";
		},

		isArray = function(it){
			return toString.call(it) == "[object Array]";
		},

		forEach = function(vector, callback){
			if(vector){
				for(var i = 0; i < vector.length;){
					callback(vector[i++]);
				}
			}
		},

		mix = function(dest, src){
			for(var p in src){
				dest[p] = src[p];
			}
			return dest;
		},

		makeErrorToken = function(id){
			return {src:"dojoLoader", id:id};
		},

		uidSeed = 1,

		uid = function(){
			// Returns a unique indentifier (within the lifetime of the document) of the form /_d+/.
			return "_" + uidSeed++;
		},

		// FIXME: how to doc window.require() api

		// this will be the global require function; define it immediately so we can start hanging things off of it
		req = function(
			config,       //(object, optional) hash of configuration properties
			dependencies, //(array of commonjs.moduleId, optional) list of modules to be loaded before applying callback
			callback      //(function, optional) lamda expression to apply to module values implied by dependencies
		){
			return contextRequire(config, dependencies, callback, 0, req);
		},

		// the loader uses the has.js API to control feature inclusion/exclusion; define then use throughout
		global = this,

		doc = global.document,

		element = doc && doc.createElement("DiV"),

		has = req.has = function(name){
			return hasCache[name] = isFunction(hasCache[name]) ? hasCache[name](global, doc, element) : hasCache[name];
		},

		hasCache = has.cache = defaultConfig.hasCache;

	has.add = function(name, test, now, force){
		(hasCache[name]===undefined || force) && (hasCache[name] = test);
		return now && has(name);
	};

	has.add("host-node", typeof process == "object" && /\/node/.test(process.execPath));
	if(has("host-node")){
		// fixup the default config for node.js environment
		require("./_base/configNode.js").config(defaultConfig);
		// remember node's require (with respect to baseUrl==dojo's root)
		defaultConfig.nodeRequire = require;
		// recompute userConfig because passed userConfig argument was wrong in node
		userConfig = global.dojoConfig || global.djConfig || global.require || {};
	}

	has.add("host-rhino", typeof load == "function" && (typeof Packages == "function" || typeof Packages == "object"));
	if(has("host-rhino")){
		// owing to rhino's lame feature that hides the source of the script, give the user a way to specify the baseUrl...
		for(var baseUrl = userConfig.baseUrl || ".", arg, rhinoArgs = this.arguments, i = 0; i < rhinoArgs.length;){
			arg = (rhinoArgs[i++] + "").split("=");
			if(arg[0] == "baseUrl"){
				baseUrl = arg[1];
				break;
			}
		}
		load(baseUrl + "/_base/configRhino.js");
		rhinoDojoConfig(defaultConfig, baseUrl, rhinoArgs);
	}

	// userConfig has tests override defaultConfig has tests; do this after the environment detection because
	// the environment detection usually sets some has feature values in the hasCache.
	for(var p in userConfig.has){
		has.add(p, userConfig.has[p], 0, 1);
	}

	//
	// define the loader data
	//

	// the loader will use these like symbols if the loader has the traceApi; otherwise
	// define magic numbers so that modules can be provided as part of defaultConfig
	var	requested = 1,
		arrived = 2,
		nonmodule = 3,
		executing = 4,
		executed = 5,
		special = 7;

	if(has("dojo-trace-api")){
		// these make debugging nice; but using strings for symbols is a gross rookie error; don't do it for production code
		requested = "requested";
		arrived = "arrived";
		nonmodule = "not-a-module";
		executing = "executing";
		executed = "executed";
		special = "special";
	}

	if(has("dojo-combo-api")){
		req.combo = {add:noop};
		var	comboPending = 0,
			combosPending = [];
	}

	// lexical variables that hold key loader data structures; may be completely initialized by
	// defaultConfig for optimized/built versions of the loader.
	mix(req, defaultConfig);
	delete req.packages;
	var reqEval, paths, pathsMapProg, packs, packageMap, packageMapProg, modules, cache, cacheBust, legacyMode;
	if(has("dojo-auto-init")){
		paths = req.paths;
		pathsMapProg = req.pathsMapProg;
		packs = req.packs;
		packageMap = req.packageMap;
		packageMapProg = req.packageMapProg;
		modules = req.modules;
		cache = req.cache;
		cacheBust = req.cacheBust;
		has("dojo-sync-loader") && (legacyMode = req.legacyMode);
	}else{
		// CommonJS paths
		paths = {};

		pathsMapProg = [];
			// list of (from-path, to-path, regex, length) derived from paths;
			// a "program" to apply paths; see computeMapProg

		packs = {};
			// a map from packageId to package configuration object; see fixupPackageInfo

		packageMap = {};
			// map from package name to local-installed package name

		packageMapProg = [];
			// list of (from-package, to-package, regex, length) derived from packageMap;
			// a "program" to apply paths; see computeMapProg

		// A hash:(pqn) --> (module-object). module objects are simple JavaScript objects with the
		// following properties:
		//
		// pid: the package identifier to which the module belongs (e.g., "dojo"); "" indicates the system or default package
		// id: the module identifier without the package identifier (e.g., "io/script")
		// pqn: the full package-qualified name (e.g., "dojo*io/script")
		// url: the URL from which the module was retrieved
		// pack: the package object of the package to which the module belongs
		// path: the full module name (package + path) resolved with respect to the loader (i.e., mappings have been applied) (e.g., dojo/io/script)
		// executed: 0 => not executed; executing => in the process of tranversing deps and running factory; executed => factory has been executed
		// deps: the dependency vector for this module (vector of modules objects)
		// def: the factory for this module
		// result: the result of the running the factory for this module
		// injected: (requested | arrived | nonmodule) the status of the module; nonmodule means the resource did not call define
		// load: plugin load function; applicable only for plugins
		//
		// Modules go through several phases in creation:
		//
		// 1. Requested: some other module's definition or a require application contained the requested module in
		//    its dependency vector or executing code explicitly demands a module via req.require.
		//
		// 2. Injected: a script element has been appended to the insert-point element demanding the resource implied by the URL
		//
		// 3. Loaded: the resource injected in [2] has been evalated.
		//
		// 4. Defined: the resource contained a define statement that advised the loader about the module. Notice that some
		//    resources may just contain a bundle of code and never formally define a module via define
		//
		// 5. Evaluated: the module was defined via define and the loader has evaluated the factory and computed a result.
		modules = {};

		///
		// hash:(pqn)-->(function)
		///
		// Gives the contents of a cached resource; function should cause the same actions as if the given pqn was downloaded
		// and evaluated by the host environment
		cache = {};

		cacheBust = "";
	}

	reqEval = req.eval ||
		// use the function constructor so our eval is scoped close to (but not in) in the global space with minimal pollution
		new Function("__text", "__hint", 'return eval(__text + "\\r\\n////@ sourceURL=" + __hint);');

	var listenerConnection= function(listener, queue){
		queue.push(listener);
		this.l = listener;
		this.q = queue;
	};

	listenerConnection.prototype.remove= function(){
		for(var queue = this.q, listener = this.l, i = 0; i<queue.length; i++){
			if(queue[i]===listener){
				queue.splice(i, 1);
				return;
			}
		}
	};

	var listenerQueues = {},
		idleListeners = listenerQueues.idle= [],
		errorListeners = listenerQueues.error= [],
		signal = function(queue, args){
			// notice we run a copy of the queue; this allows listeners to add/remove
			// other listeners without affecting this particular signal
			forEach(queue.slice(0), function(listener){
				listener.apply(null, args);
			});
		};

	req.on = function(type, listener){
		// notice that connecting to a nonexisting type just results in a connection that will never
		// get signaled yet still has a valid remove method. This allows client code to make connections
		// to queues that may or may not exist (say, depending on config or build options) and later call
		// remove safely.
		return new listenerConnection(listener, listenerQueues[type] || []);
	};

	//
	// configuration machinery (with an optimized/built defaultConfig, this can be discarded)
	//
	if(has("dojo-config-api")){
		var	configListeners = listenerQueues.config = [],
				// vector of registered listener functions for config changes

			computeMapProg = function(map, dest){
				// This routine takes a map target-prefix(string)-->replacement(string) into a vector
				// of quads (target-prefix, replacement, regex-for-target-prefix, length-of-target-prefix)
				//
				// The loader contains processes that map one string prefix to another. These
				// are encountered when applying the requirejs paths configuration and when mapping
				// package names. We can make the mapping and any replacement easier and faster by
				// replacing the map with a vector of quads and then using this structure in the simple machine runMapProg.
				dest.splice(0, dest.length);
				var p, i, item;
				for(p in map){
					dest.push([p, map[p]]);
				}
				dest.sort(function(lhs, rhs){
					return rhs[0].length - lhs[0].length;
				});
				for(i = 0; i < dest.length;){
					item = dest[i++];
					item[2] = new RegExp("^" + item[0].replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(c){ return "\\" + c; }) + "(\/|$)");
					item[3] = item[0].length + 1;
				}
			},

			fixupPackageInfo = function(packageInfo, baseUrl){
				// calculate the precise (name, baseUrl, main, mappings) for a package
				var name = packageInfo.name;
				if(!name){
					// packageInfo must be a string that gives the name
					name = packageInfo;
					packageInfo = {name:name};
				}
				packageInfo = mix({main:"main", mapProg:[]}, packageInfo);
				packageInfo.location = (baseUrl || "") + (packageInfo.location ? packageInfo.location : name);
				computeMapProg(packageInfo.packageMap, packageInfo.mapProg);

				if(!packageInfo.main.indexOf("./")){
					packageInfo.main = packageInfo.main.substring(2);
				}

				// allow paths to be specified in the package info
				mix(paths, packageInfo.paths);

				// now that we've got a fully-resolved package object, push it into the configuration
				packs[name] = packageInfo;
				packageMap[name] = name;
			},

			configVariableNames = {waitSeconds:1, cacheBust:1, baseUrl:1, locale:1, combo:1},

			config = function(config, booting){
				// mix config into require
				var p;

				// make sure baseUrl ends with a slash
				if(config.baseUrl && !/\/$/.test(config.baseUrl)){
					config.baseUrl += "/";
				}

				for(p in config){
					if(configVariableNames[p]){
						req[p] = config[p];
					}
					if(config[p]!==hasCache){
						// accumulate raw config info for client apps which can use this to pass their own config
						req.rawConfig[p] = config[p];
						has.add("config-"+p, config[p], 0, booting);
					}
				}
				req.waitms = (req.waitSeconds || 0) * 1000;

				// TODO: this is from v1.6-; why do we need the toString and replace...can't the config be assumed correct?
				cacheBust = ((req.cacheBust || "")+"").replace(/\W+/g,"");

				// make sure baseUrl exists
				if(!req.baseUrl){
					req.baseUrl = "./";
				}

				if(has("dojo-sync-loader")){
					// falsy or "sync" => legacy sync loader
					// "xd" => sync but loading xdomain tree and therefore loading asynchronously (not configurable, set automatically by the loader)
					// "async" => permanently in "xd" by choice
					// "debugAtAllCosts" => trying to load everything via script injection (not implemented)
					// otherwise, must be truthy => AMD
					var mode = config.async;
					if(mode!==undefined){
						req.legacyMode = legacyMode = (isString(mode) && /sync|async/.test(mode) ? mode : (!mode ? "sync" : false));
						req.async = !legacyMode;
					}
				}

				// now do the special work for has, packagePaths, packages, paths, deps, callback, and ready

				for(p in config.has){
					has.add(p, config.has[p], 0, booting);
				}

				// for each package found in any packages config item, augment the packs map owned by the loader
				forEach(config.packages, fixupPackageInfo);

				// for each packagePath found in any packagePaths config item, augment the packs map owned by the loader
				for(baseUrl in config.packagePaths){
					forEach(config.packagePaths[baseUrl], function(packageInfo){
						fixupPackageInfo(packageInfo, baseUrl + "/");
					});
				}

				// backcompat
				config.modulePaths && !config.paths && (config.paths= config.modulePaths);

				// push in any paths and recompute the internal pathmap
				// warning: this cann't be done until the package config is processed since packages may include path info
				computeMapProg(mix(paths, config.paths), pathsMapProg);

				// mix any packageMap config item and recompute the internal packageMapProg
				computeMapProg(mix(packageMap, config.packageMap), packageMapProg);

				// push in any new cache values
				mix(cache, config.cache);

				(function(deps, callback){
					var args = ((deps && deps.length) || callback) && [deps || [], callback || noop];
					if(booting){
						args && (req.bootRequire= args);
					}else{
						args && req(args[0], args[1]);
					}
				})(config.deps, config.callback);

				signal(configListeners, [config, req.rawConfig]);
			};

		//
		// execute the various sniffs
		//

		var dojoSniffConfig = {};
		if(has("dojo-sniff")){
			for(var src, match, scripts = doc.getElementsByTagName("script"), i = 0; i < scripts.length && !match; i++){
				if((src = scripts[i].getAttribute("src")) && (match = src.match(/(.*)\/?dojo\.js(\W|$)/i))){
					// if baseUrl wasn't explicitly set, set it here to the dojo directory; this is the 1.6- behavior
					userConfig.baseUrl = userConfig.baseUrl || defaultConfig.baseUrl || match[1];

					// see if there's a dojo configuration stuffed into the node
					src = (scripts[i].getAttribute("data-dojo-config") || scripts[i].getAttribute("djConfig"));
					if(src){
						dojoSniffConfig = reqEval("({ " + src + " })", "data-dojo-config");
					}
					if(has("dojo-requirejs-api")){
						var dataMain = scripts[i].getAttribute("data-main");
						if(dataMain){
							dojoSniffConfig.deps = dojoSniffConfig.deps || [dataMain];
						}
					}
				}
			}
		}

		if(has("dojo-test-sniff")){
			// pass down doh.testConfig from parent as if it were a data-dojo-config
			try{
				if(window.parent != window && window.parent.require){
					var doh = window.parent.require("doh");
					doh && mix(dojoSniffConfig, doh.testConfig);
				}
			}catch(e){}
		}

		// configure the loader; let the user override defaults
		req.rawConfig = {};
		config(defaultConfig, 1);
		config(userConfig, 1);
		config(dojoSniffConfig, 1);
	}

	// build the loader machinery iaw configuration, including has feature tests
	var	injectDependencies = function(module){
			forEach(module.deps, injectModule);
			if(has("dojo-combo-api") && comboPending){
				comboPending = 0;
				req.combo.done(function(mids, url) {
					var onLoadCallback= function(){
						// defQ is a vector of module definitions 1-to-1, onto mids
						runDefQ(0, mids);
						checkComplete();
					};
					combosPending.push(mids);
					injectingModule = mids;
					req.injectUrl(url, onLoadCallback, mids);
					injectingModule = 0;
				}, req);
			}
		},

		contextRequire = function(a1, a2, a3, referenceModule, contextRequire){
			var module, syntheticMid;
			if(isString(a1)){
				// signature is (moduleId)
				module = getModule(a1, referenceModule, 1);
				if(module.plugin){
					injectPlugin(module, true);
				}
				if(module.executed){
					return module.result;
				}
				throw new Error("module (" + a1 + ") has not been requested");
			}
			if(!isArray(a1)){
				// a1 is a configuration
				config(a1);

				// juggle args; (a2, a3) may be (dependencies, callback)
				a1 = a2;
				a2 = a3;
			}
			if(isArray(a1)){
				// signature is (requestList [,callback])

				// resolve the request list with respect to the reference module
				for(var deps = [], i = 0; i < a1.length;){
					deps.push(getModule(a1[i++], referenceModule, 1));
				}

				// construct a synthetic module to control execution of the requestList, and, optionally, callback
				syntheticMid = uid();
				module = mix(makeModuleInfo("", syntheticMid, "*" + syntheticMid, 0, "", ""), {
					injected: arrived,
					deps: deps,
					def: a2 || noop
				});
				modules[module.pqn] = module;
				injectDependencies(module);
				// try to immediately execute
				try{
					checkCompleteGuard++;
					if(execModule(module, 1) === abortExec){
						// some deps weren't on board; therefore, push into the execQ
						execQ.push(module);
					}
				}finally{
					checkCompleteGuard--;
				}
			}
			return contextRequire;
		},

		createRequire = function(module){
			var result = module.require;
			if(!result){
				result = function(a1, a2, a3){
					return contextRequire(a1, a2, a3, module, result);
				};
				module.require = mix(result, req);
				result.toUrl = function(name){
					return toUrl(name, module);
				};
				result.toAbsMid = function(mid){
					return toAbsMid(mid, module);
				};
				if(has("dojo-undef-api")){
					result.undef = function(mid){
						req.undef(mid, module);
					};
				}
			}
			return result;
		},

		execQ =
			// The list of modules that need to be evaluated.
			[],

		defQ =
			// The queue of define arguments sent to loader.
			[],

		waiting =
			// The set of modules upon which the loader is waiting for definition to arrive
			{},

		setRequested = function(module){
			module.injected = requested;
			waiting[module.pqn] = 1;
		},

		setArrived = function(module){
			module.injected = arrived;
			delete waiting[module.pqn];
		},

		execComplete = req.idle =
			// says the loader has completed (or not) its work
			function(){
				return !defQ.length && isEmpty(waiting) && !execQ.length;
			},

		runMapProg = function(targetMid, map){
			// search for targetMid in map; return the map item if found; falsy otherwise
			for(var i = 0; i < map.length; i++){
				if(map[i][2].test(targetMid)){
					return map[i];
				}
			}
			return 0;
		},

		compactPath = function(path){
			var result = [],
				segment, lastSegment;
			path = path.split("/");
			while(path.length){
				segment = path.shift();
				if(segment==".." && result.length && lastSegment!=".."){
					result.pop();
				}else if(segment!="."){
					result.push(lastSegment= segment);
				} // else ignore "."
			}
			return result.join("/");
		},

		makeModuleInfo = function(pid, mid, pqn, pack, path, url){
			if(has("dojo-sync-loader")){
				var xd= isXdUrl(url);
				return {pid:pid, mid:mid, pqn:pqn, pack:pack, path:path, url:url, executed:0, def:0, isXd:xd, isAmd:!!(xd || (packs[pid] && packs[pid].isAmd))};
			}else{
				return {pid:pid, mid:mid, pqn:pqn, pack:pack, path:path, url:url, executed:0, def:0};
			}
		},

		getModuleInfo_ = function(mid, referenceModule, packs, modules, baseUrl, packageMapProg, pathsMapProg, alwaysCreate){
			// arguments are passed instead of using lexical variables so that this function my be used independent of the loader (e.g., the builder)
			// alwaysCreate is useful in this case so that getModuleInfo never returns references to real modules owned by the loader
			var pid, pack, pqn, mapProg, mapItem, path, url, result, isRelative, requestedMid;
			requestedMid = mid;
			isRelative = /^\./.test(mid);
			if(/(^\/)|(\:)|(\.js$)/.test(mid) || (isRelative && !referenceModule)){
				// absolute path or protocol, or relative path but no reference module and therefore relative to page
				// whatever it is, it's not a module but just a URL of some sort
				return makeModuleInfo(0, mid, "*" + mid, 0, mid, mid);
			}else{
				// relative module ids are relative to the referenceModule; get rid of any dots
				path = compactPath(isRelative ? (referenceModule.path + "/../" + mid) : mid);
				if(/^\./.test(path)){
					throw new Error("The path " + path + " is irrational");
				}
				// find the package indicated by the path, if any
				mapProg = referenceModule && referenceModule.pack && referenceModule.pack.mapProg;
				mapItem = (mapProg && runMapProg(path, mapProg)) || runMapProg(path, packageMapProg);
				if(mapItem){
					// mid specified a module that's a member of a package; figure out the package id and module id
					// notice we expect pack.main to be valid with no pre or post slash
					pid = mapItem[1];
					mid = path.substring(mapItem[3]);
					pack = packs[pid];
					if(!mid){
						mid= pack.main;
					}
					path = pid + "/" + mid;
				}else{
					pid = "";
					mid = path;
				}
				pqn = pid + "*" + mid;
				result = modules[pqn];
				if(result){
					return alwaysCreate ? makeModuleInfo(result.pid, result.mid, result.pqn, result.pack, result.path, result.url) : modules[pqn];
				}
			}
			// get here iff the sought-after module does not yet exist; therefore, we need to compute the URL given the
			// fully resolved (i.e., all relative indicators and package mapping resolved) module id

			if(!url){
				mapItem = runMapProg(path, pathsMapProg);
				if(mapItem){
					url = mapItem[1] + path.substring(mapItem[3] - 1);
				}else if(pid){
					url = pack.location + "/" + mid;
				}else if(has("config-tlmSiblingOfDojo")){
					url = "../" + path;
				}else{
					url = path;
				}
				// if result is not absolute, add baseUrl
				if(!(/(^\/)|(\:)/.test(url))){
					url = baseUrl + url;
				}
				url += ".js";
			}
			return makeModuleInfo(pid, mid, pqn, pack, path, compactPath(url));
		},

		getModuleInfo = function(mid, referenceModule){
			return getModuleInfo_(mid, referenceModule, packs, modules, req.baseUrl, packageMapProg, pathsMapProg);
		},

		getModule = function(mid, referenceModule, fromRequire){
			// compute and optionally construct (if necessary) the module implied by the mid with respect to referenceModule
			var match, plugin, pluginResource, result, pqn;
			match = mid.match(/^(.+?)\!(.*)$/);
			if(match){
				// name was <plugin-module>!<plugin-resource>
				plugin = getModule(match[1], referenceModule);
				plugin.isPlugin = 1;
				pluginResource = match[2];
				pqn = plugin.pqn + "!" + (referenceModule ? referenceModule.pqn + "!" : "") + pluginResource;
				return modules[pqn] || (modules[pqn] = {plugin:plugin, mid:pluginResource, req:(referenceModule ? createRequire(referenceModule) : req), pqn:pqn});
			}else{
				if(fromRequire && /^.*[^\/\.]+\.[^\/\.]+$/.test(mid)){
					// anything* anything-other-than-a-dot+ dot anything-other-than-a-dot-or-slash+ => a url that ends with a filetype
					pqn = "*" + mid;
					return modules[pqn]= modules[pqn] || makeModuleInfo(0, mid, pqn, 0, mid, mid);
				}
				result = getModuleInfo(mid, referenceModule);
				return modules[result.pqn] || (modules[result.pqn] = result);
			}
		},

		toAbsMid =	req.toAbsMid = function(mid, referenceModule){
			// FIXME: the .path is wrong for a package main module
			return getModuleInfo(mid, referenceModule).path;
		},

		toUrl = req.toUrl = function(name, referenceModule){
			// name must include a filetype; fault tolerate to allow no filetype (but things like "path/to/version2.13" will assume filetype of ".13")
			var	match = name.match(/(.+)(\.[^\/\.]+?)$/),
				root = (match && match[1]) || name,
				ext = (match && match[2]) || "",
				moduleInfo = getModuleInfo(root, referenceModule),
				url= moduleInfo.url;
			// recall, getModuleInfo always returns a url with a ".js" suffix iff pid; therefore, we've got to trim it
			url= typeof moduleInfo.pid == "string" ? url.substring(0, url.length - 3) : url;
			return url + ext;
		},

		nonModuleProps = {
			injected: arrived,
			executed: executed,
			def: nonmodule,
			result: nonmodule
		},

		makeSpecial = function(id){
			var pqn = "*" + id;
			return modules[pqn] = mix({pqn:pqn}, nonModuleProps);
		},

		cjsRequireModule = makeSpecial("require"),
		cjsExportsModule = makeSpecial("exports"),
		cjsModuleModule = makeSpecial("module"),

		// this is a flag to say at least one factory was run during a deps tree traversal
		runFactory = function(pqn, factory, args, cjs){
			req.trace("loader-run-factory", [pqn]);
			var result= isFunction(factory) ? factory.apply(null, args) : factory;
			return result===undefined && cjs ? cjs.exports : result;
		},

		abortExec = {},

		defOrder = 0,

		finishExec = function(module){
			req.trace("loader-finish-exec", [module.pqn]);
			module.executed = executed;
			module.defOrder = defOrder++;
			if(module.loadQ){
				// this was a plugin module
				var	q = module.loadQ,
					load = module.load = module.result.load;
				while(q.length){
					load.apply(null, q.shift());
				}
				module.loadQ = 0;
			}
			// remove all occurences of this module from the execQ
			for(i = 0; i < execQ.length;){
				if(execQ[i] === module){
					execQ.splice(i, 1);
				}else{
					i++;
				}
			}
		},

		factoryThrew = makeErrorToken("factoryThrew"),

		execModule = function(module, strict){
			// run the dependency vector, then run the factory for module
			if(!module.executed){
				if(!module.def || (strict && module.executed===executing)){
					return abortExec;
				}else if(module.executed===executing){
					// FIXME: maybe try (module.cjs && module.cjs.exports)
					return module.result;
				}
				var pqn = module.pqn,
					deps = module.deps || [],
					arg, argResult,
					args = [],
					i = 0;

				req.trace("loader-exec-module", ["exec", pqn]);

				// for circular dependencies, assume the first module encountered was executed OK
				// modules that circularly depend on a module that has not run its factory will get
				// the premade cjs.exports===module.result. They can take a reference to this object and/or
				// add properties to it. When the module finally runs its factory, the factory can
				// read/write/replace this object. Notice that so long as the object isn't replaced, any
				// reference taken earlier while walking the deps list is still valid.
				module.executed = executing;
				while(i < deps.length){
					arg = deps[i++];
					argResult = ((arg === cjsRequireModule) ? createRequire(module) :
									((arg === cjsExportsModule) ? module.cjs.exports :
										((arg === cjsModuleModule) ? module.cjs :
											execModule(arg, strict))));
					if(argResult === abortExec || (strict && arg.executed===executing)){
						module.executed = 0;
						req.trace("loader-exec-module", ["abort", pqn]);
						return abortExec;
					}
					args.push(argResult);
				}
				var ok = 0;
				try{
					module.result = runFactory(pqn, module.def, args, module.cjs);
					ok = 1;
				}finally{
					if(!ok){
						module.result = factoryThrew;
						signal(errorListeners, [factoryThrew, module]);
					}
					finishExec(module);
				}
			}
			return module.result;
		},

		checkCompleteGuard =  0,

		checkComplete = function(){
			// keep going through the execQ as long as at least one factory is executed
			// plugins, recursion, cached modules all make for many execution path possibilities

			isEmpty(waiting) && clearTimer();
			if(checkCompleteGuard){
				return;
			}
			checkCompleteGuard++;
			try{
				has("dojo-sync-loader") && checkDojoRequire();
				for(var currentDefOrder, module, i = 0; i < execQ.length;){
					currentDefOrder = defOrder;
					module = execQ[i];
					execModule(module);
					if(currentDefOrder!=defOrder || (has("dojo-sync-loader") && checkDojoRequire())){
						// defOrder was bumped one or more times indicating something was executed (note, this indicates
						// the execQ was modified, maybe a lot (for example a later module causes an earlier module to execute)
						i = 0;
					}else{
						// nothing happened; check the next module in the exec queue
						i++;
					}
					has("dojo-sync-loader") && isEmpty(waiting) && legacyMode==xd && (legacyMode = sync);
				}
			}finally{
				checkCompleteGuard--;
			}
			if(execComplete()){
				signal(idleListeners, []);
			}
		},

		getXhr = 0;

	// the dojo loader needs/optionally provides an XHR factory
	if(has("dojo-sync-loader") || has("dojo-xhr-factory")){
		has.add("dojo-force-activex-xhr", has("host-browser") && !doc.addEventListener && window.location.protocol == "file:");
		has.add("native-xhr", typeof XMLHttpRequest != "undefined");
		if(has("native-xhr") && !has("dojo-force-activex-xhr")){
			getXhr = function(){
				return new XMLHttpRequest();
			};
		}else{
			// if in the browser an old IE; find an xhr
			for(var XMLHTTP_PROGIDS = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'], progid, i = 0; i < 3;){
				try{
					progid = XMLHTTP_PROGIDS[i++];
					if(new ActiveXObject(progid)){
						// this progid works; therefore, use it from now on
						break;
					}
				}catch(e){
					// squelch; we're just trying to find a good ActiveX progid
					// if they all fail, then progid ends up as the last attempt and that will signal the error
					// the first time the client actually tries to exec an xhr
				}
			}
			getXhr = function(){
				return new ActiveXObject(progid);
			};
		}
		req.getXhr = getXhr;
	}

	// the dojo loader needs/optionally provides a getText API
	if(has("dojo-sync-loader") || has("dojo-gettext-api")){
		var getText = req.getText = req.getText || function(url, async, onLoad){
			url = fixupUrl(url);
			var xhr = getXhr();
			if(async){
				xhr.open('GET', url, true);
				xhr.onreadystatechange = function(){
					xhr.readyState == 4 && onLoad(xhr.responseText, async);
				};
				xhr.send(null);
				return xhr;
			}else{
				xhr.open('GET', url, false);
				xhr.send(null);
				if(xhr.status == 200 || (!location.host && !xhr.status)){
					if(onLoad){
						onLoad(xhr.responseText, async);
					}
				}else{
					throw new Error("XHR failed:" + xhr.status);
				}
				return xhr.responseText;
			}
		};
	}

	if(has("dojo-undef-api")){
		req.undef = function(moduleId, referenceModule){
			// In order to reload a module, it must be undefined (this routine) and then re-requested.
			// This is useful for testing frameworks (at least).
			var module = getModule(moduleId, referenceModule);
			setArrived(module);
			delete modules[module.pqn];
		};
	}

	if(has("dojo-inject-api")){
		var fixupUrl= function(url){
				url += "";
				return url + (cacheBust ? ((/\?/.test(url) ? "&" : "?") + cacheBust) : "");
			},

			injectPlugin = function(
				module,
				immediate // this is consequent to a require call like require("text!some/text")
			){
				// injects the plugin module given by module; may have to inject the plugin itself
				var plugin = module.plugin;

				if(has("dojo-sync-loader") && legacyMode==sync && !plugin.executed){
					injectModule(plugin);
					execQ.unshift(plugin);
					execModule(plugin);
				}

				if(plugin.executed === executed && !plugin.load){
					// executed the module not knowing it was a plugin
					plugin.load = plugin.result.load;
				}

				if(module.executed){
					// let the plugin decide if it wants to use the existing value or provide a new value
					module.executed = 0;
				}

				var pqn = module.pqn,
					onload = function(def){
						module.result = def;
						setArrived(module);
						finishExec(module);
						checkComplete();
					};
				if(cache[pqn]){
					onload(cache[pqn]);
				}else{
					if(!immediate){
						// don't go loading the plugin if were just looking for an immediate
						// make the client properly demand the module
						if(!plugin.load){
							plugin.loadQ = [];
							plugin.load = function(id, require, callback){
								plugin.loadQ.push([id, require, callback]);
							};
							// the unshift instead of push is important: we don't want plugins to execute as
							// dependencies of some other module because this may cause circles when the plugin
							// loadQ is run; also, generally, we want plugins to run early since they may load
							// several other modules and therefore can potentially unblock many modules
							execQ.unshift(plugin);
							injectModule(plugin);
						}
						setRequested(module);
					}
					plugin.load && plugin.load(module.mid, module.req, onload);
				}
			},

			// for IE, injecting a module may result in a recursive execution if the module is in the cache
			injectingModule = 0,

			injectingCachedModule = 0,

			evalModuleText = function(text, module){
				// see def() for the injectingCachedModule bracket; it simply causes a short, safe curcuit
				try{
					injectingCachedModule = 1;
					if(text){
						reqEval(text, module.path);
					}else{
						cache[module.pqn].call(null);
					}
				}finally{
					injectingCachedModule = 0;
				}
			},

			injectModule = function(module){
				// Inject the module. In the browser environment, this means appending a script element into
				// the document; in other environments, it means loading a file.
				//
				// If in synchronous mode, then get the module synchronously if it's not xdomainLoading.

				if(module.plugin){
					injectPlugin(module);
					return;
				} // else a normal module (not a plugin)

				var pqn = module.pqn,
					url = module.url;
				if(module.executed || module.injected || waiting[pqn]){
					return;
				}

				setRequested(module);

				if(has("dojo-combo-api") && req.combo.add(0, module.path, module.url, req)){
					comboPending= 1;
					return;
				}

				var onLoadCallback = function(){
					runDefQ(module);
					if(module.injected !== arrived){
						// the script that contained the module arrived and has been executed yet
						// nothing was added to the defQ (so it wasn't an AMD module) and the module
						// wasn't marked as arrived by dojo.provide (so it wasn't a v1.6- module);
						// therefore, it must not have been a module; adjust state accordingly
						setArrived(module);
						mix(module, nonModuleProps);
					}

					if(has("dojo-sync-loader") && legacyMode){
						// must call checkComplete even in for sync loader because we may be in xdomainLoading mode
						// and if xd loading don't call checkComplete until out of the current sync traversal in order
						// to preserve order of execution of the dojo.required modules
						!syncExecStack.length && checkComplete();
					}else{
						checkComplete();
					}
				};
				if(cache[pqn]){
					evalModuleText(0, module);
					onLoadCallback();
				}else if(has("dojo-sync-loader") && legacyMode){
					if(module.isXd){
						// switch to async mode temporarily?
						legacyMode==sync && (legacyMode = xd);
						// fall through and load via script injection
					}else if(module.isAmd && legacyMode!=sync){
						// fall through and load via script injection
					}else{
						// mode may be sync, xd, or async; module may be AMD or legacy; but module is always located on the same domain
						var xhrCallback = function(text){
							if(legacyMode==sync){
								// the top of syncExecStack gives the current synchronously executing module; the loader needs
								// to know this if it has to switch to async loading in the middle of evaluating a legacy module
								// this happens when a modules dojo.require's a module that must be loaded async because it's xdomain
								// (using unshift/shift because there is no back() methods for Javascript arrays)
								syncExecStack.unshift(module);
								evalModuleText(hookProvides(module, text), module);
								syncExecStack.shift();

								// legacy modules never get to defineModule() => cjs and injected never set; also evaluation implies executing
								runDefQ(module);
								if(!module.cjs){
									setArrived(module);
									finishExec(module);
								}

								if(module.finish){
									// while synchronously evaluating this module, dojo.require was applied referencing a module
									// that had to be loaded async; therefore, the loader stopped answering all dojo.require
									// requests so they could be answered completely in the correct sequence; module.finish gives
									// the list of dojo.requires that must be re-applied once all target modules are available
									// make a synthetic module to execute the dojo.require's in the correct order
									var finishSuffix = "*finish",
										finishPqn = pqn + finishSuffix,
										finishModule = modules[finishPqn] = mix(mix({}, module), {pqn:finishPqn, mid: module.mid + finishSuffix, path:module.path + finishSuffix, url:0, executed:0, def:0});
									setRequested(finishModule);
									text = transformToAmd(finishModule, module.finish);
									module = finishModule;
									evalModuleText(text, finishModule);
									// unshift, not push, which causes the current traversal to be reattempted from the top
									execQ.unshift(module);
								}
								onLoadCallback();
							}else{
								text = transformToAmd(module, text);
								if(text){
									evalModuleText(text, module);
									onLoadCallback();
								}else{
									injectingModule = module;
									req.injectUrl(fixupUrl(url), onLoadCallback, module);
									injectingModule = 0;
								}
							}
						};

						req.trace("loader-inject", ["xhr", legacyMode!=sync, module.pqn, url]);
						var ok = 0;
						try{
							getText(url, legacyMode!=sync, xhrCallback);
							ok = 1;
						}finally{
							!ok && signal(errorListeners, [makeErrorToken("xhrFailed"), module]);
						}
						return;
					}
				} // else async mode or fell through in xdomain loading mode; either way, load by script injection
				req.trace("loader-inject", ["script", module.pqn, url]);
				injectingModule = module;
				req.injectUrl(fixupUrl(url), onLoadCallback, module);
				injectingModule = 0;
			},

			defineModule = function(module, deps, def){
				req.trace("loader-define-module", [module.pqn, deps]);

				var pqn = module.pqn;
				if(module.injected === arrived){
					signal(errorListeners, [makeErrorToken("multipleDefine"), module]);
					return module;
				}
				mix(module, {
					deps: deps,
					def: def,
					cjs: {
						id: module.path,
						uri: module.url,
						exports: (module.result = {}),
						setExports: function(exports){
							module.cjs.exports = exports;
						}
					}
				});

				// resolve deps with respect to this module
				for(var i = 0; i < deps.length; i++){
					deps[i] = getModule(deps[i], module);
				}

				if(has("dojo-sync-loader") && legacyMode && !waiting[pqn]){
					// the module showed up without being asked for; it was probably in a <script> element
					injectDependencies(module);
					execQ.push(module);
					checkComplete();
				}
				setArrived(module);

				if(!isFunction(def) && !deps.length){
					module.result = def;
					finishExec(module);
				}

				return module;
			},

			runDefQ = function(referenceModule, mids){
				// defQ is an array of [id, dependencies, factory]
				// mids (if any) is a vector of mids given by a combo service
				var definedModules = [],
					module, args;
				while(defQ.length){
					args = defQ.shift();
					mids && (args[0]= mids.shift());
					// explicit define indicates possible multiple modules in a single file; delay injecting dependencies until defQ fully
					// processed since modules earlier in the queue depend on already-arrived modules that are later in the queue
					// TODO: what if no args[0] and no referenceModule
					module = args[0] && getModule(args[0]) || referenceModule;
					definedModules.push(defineModule(module, args[1], args[2]));
				}
				forEach(definedModules, injectDependencies);
			};
	}

	var timerId = 0,
		clearTimer = noop,
		startTimer = noop;
	if(has("dojo-timeout-api")){
		// Timer machinery that monitors how long the loader is waiting and signals an error when the timer runs out.
		clearTimer = function(){
			timerId && clearTimeout(timerId);
			timerId = 0;
		},

		startTimer = function(){
			clearTimer();
			req.waitms && (timerId = setTimeout(function(){
				clearTimer();
				signal(errorListeners, [makeErrorToken("timeout"), waiting]);
			}, req.waitms));
		};
	}

	if(has("dom")){
		has.add("ie-event-behavior", doc.attachEvent && (typeof opera === "undefined" || opera.toString() != "[object Opera]"));
	}

	if(has("dom") && (has("dojo-inject-api") || has("dojo-dom-ready-api"))){
		var on = function(node, eventName, ieEventName, handler){
				// Add an event listener to a DOM node using the API appropriate for the current browser;
				// return a function that will disconnect the listener.
				if(!has("ie-event-behavior")){
					node.addEventListener(eventName, handler, false);
					return function(){
						node.removeEventListener(eventName, handler, false);
					};
				}else{
					node.attachEvent(ieEventName, handler);
					return function(){
						node.detachEvent(ieEventName, handler);
					};
				}
			},
			windowOnLoadListener = on(window, "load", "onload", function(){
				req.pageLoaded = 1;
				windowOnLoadListener();
			});
	}

	if(has("dom") && has("dojo-inject-api")){
		// if the loader is on the page, there must be at least one script element
		// getting its parent and then doing insertBefore solves the "Operation Aborted"
		// error in IE from appending to a node that isn't properly closed; see
		// dojo/tests/_base/loader/requirejs/simple-badbase.html for an example
		var sibling = doc.getElementsByTagName("script")[0],
			insertPoint= sibling.parentNode;
		req.injectUrl = req.injectUrl || function(url, callback, owner){
			// insert a script element to the insert-point element with src=url;
			// apply callback upon detecting the script has loaded.

			startTimer();
			var node = owner.node = doc.createElement("script"),
				onLoad = function(e){
					e = e || window.event;
					var node = e.target || e.srcElement;
					if(e.type === "load" || /complete|loaded/.test(node.readyState)){
						disconnector();
						callback && callback();
					}
				},
				disconnector = on(node, "load", "onreadystatechange", onLoad);
			node.type = "text/javascript";
			node.charset = "utf-8";
			node.src = url;
			insertPoint.insertBefore(node, sibling);
			return node;
		};
	}

	if(has("dojo-log-api")){
		// if you want to replace the req.log API, pass in a default config and make has("dojo-log-api") falsy
		req.log = function(){
			// we're not going to mess around in defective environments
			if(typeof console == "undefined" || !console.log){
				return;
			}
			for(var i = 0; i < arguments.length; i++){
				console.log(arguments[i]);
			}
		};
	}
	req.log && req.on("error", req.log);

	if(has("dojo-trace-api")){
		listenerQueues.trace= [];
		var trace = function(
			group,	// the trace group to which this application belongs
			args	// the contents of the trace
		){
			///
			// Tracing interface by group.
			//
			// Sends the contents of args to the console iff (req.trace.on && req.trace[group])

			if(trace.on && trace.group[group]){
				signal(listenerQueues.trace, [group, args]);
				for(var text= group + ":" + args[0], i= 1; i<args.length && isString(args[i]);){
					text += ", " + args[i++];
				}
				req.log(text);
				while(i<args.length){
					req.log(args[i++]);
				}
			}
		};
		mix(trace, {
			on:1,
			group:{},
			set:function(group, value){
				if(isString(group)){
					trace.group[group]= value;
				}else{
					mix(trace.group, group);
				}
			}
		});
		trace.set(defaultConfig.trace);
		trace.set(userConfig.trace);
		trace.set(dojoSniffConfig.trace);
		req.trace = trace;
	}else{
		req.trace = noop;
	}

	var def = function(
		mid,		  //(commonjs.moduleId, optional) list of modules to be loaded before running factory
		dependencies, //(array of commonjs.moduleId, optional)
		factory		  //(any)
	){
		///
		// Advises the loader of a module factory. //Implements http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition.
		///
		//note
		// CommonJS factory scan courtesy of http://requirejs.org

		var arity = arguments.length,
			args = 0,
			defaultDeps = ["require", "exports", "module"];

		if(has("dojo-amd-factory-scan")){
			if(arity == 1 && isFunction(mid)){
				dependencies = [];
				mid.toString()
					.replace(/(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg, "")
					.replace(/require\(["']([\w\!\-_\.\/]+)["']\)/g, function (match, dep){
					dependencies.push(dep);
				});
				args = [0, defaultDeps.concat(dependencies), mid];
			}
		}
		if(!args){
			args = arity == 1 ? [0, defaultDeps, mid] :
				(arity == 2 ? (isArray(mid) ? [0, mid, dependencies] : (isFunction(dependencies) ? [mid, defaultDeps, dependencies] : [mid, [], dependencies])) :
					[mid, dependencies, factory]);
		}
		req.trace("loader-define", args.slice(0, 2));
		var targetModule = args[0] && getModule(args[0]),
			pqn, module;
		if(targetModule && !waiting[targetModule.pqn]){
			// given a mid that hasn't been requested; therefore, defined through means other than injecting
			// consequent to a require() or define() application; examples in include defining modules on-the-fly
			// due to some control path or including a module in a script element. In any case,
			// there is no callback waiting to finish processing and nothing to trigger the defQ and the
			// dependencies are never requested; therefore, do it here.
			injectDependencies(defineModule(targetModule, args[1], args[2]));
		}else if(!has("ie-event-behavior") || !has("host-browser") || injectingCachedModule){
			// not IE path: anonymous module and therefore must have been injected; therefore, onLoad will fire immediately
			// after script finishes being evaluated and the defQ can be run from that callback to detect the module id
			defQ.push(args);
		}else{
			// IE path: anonymous module and therefore must have been injected; therefore, cannot depend on 1-to-1,
			// in-order exec of onLoad with script eval (since its IE) and must manually detect here
			targetModule = injectingModule;
			if(!targetModule){
				for(pqn in waiting){
					module = modules[pqn];
					if(module && module.node && module.node.readyState === 'interactive'){
						targetModule = module;
						break;
					}
				}
				if(has("dojo-combo-api") && !targetModule){
					for(var i = 0; i<combosPending.length; i++){
						targetModule = combosPending[i];
						if(targetModule.node && targetModule.node.readyState === 'interactive'){
							break;
						}
						targetModule= 0;
					}
				}
			}
			if(has("dojo-combo-api") && isArray(targetModule)){
				injectDependencies(defineModule(targetModule.shift(), args[1], args[2]));
				if(!targetModule.length){
					combosPending.splice(i, 1);
				}
			}else if(targetModule){
				injectDependencies(defineModule(targetModule, args[1], args[2]));
			}else{
				signal(errorListeners, [makeErrorToken("defineIe"), args]);
			}
			// FIXME remove commented code after testing
			/*!legacyMode && */checkComplete();
		}
	};
	def.amd = {
		vendor:"dojotoolkit.org"
	};

	if(has("dojo-requirejs-api")){
		req.def = def;
	}

	if(has("dojo-sync-loader")){
		var sync = "sync",

			xd = "xd",

			syncExecStack = [],

			isXdUrl = req.isXdUrl = noop,

			slashName = function(name){
				return name.replace(/\./g, "/");
			},

			getDojoKernelModule = function(module){
				// return false during while bootstrapping; bootstrap modules are all AMD anyway
				var result = getModule("dojo/_base/loader", module);
				return result.executed===executed && result;
			},

			hookProvides = function(module, text, dojo){
				// module may or may not be a sync module (we can't tell); however, if its a sync module,
				// we need to make sure the the dojo.provides are processed properly when the module is
				// finally evaluated. Alse, old modules may have multiple dojo.provide applications.
				if(dojo || getDojoKernelModule(module)){
					var match, pattern = /(\W|^)dojo\.provide\s*\(([\w\W]+?)\)/g;
					while((match = pattern.exec(text))){
						text+= "require.provideFinish(" + match[2] + ",'" + module.pqn + "');\n";
					}
				}
				return text;
			},

			dojoRequireSet = {},

			dojoRequirePlugin = function(mid, require, loaded){
				var pqn = mid.replace(/\//, "*");
				(dojoRequireSet[pqn] ||  (dojoRequireSet[pqn] = [])).push(loaded);
				injectModule(getModule(mid, require));
			},

			checkDojoRequire = function(){
				var checked = [],
					visited = [],
					traverse = function(pqn){
						if(checked[pqn]!==undefined){
							return checked[pqn];
						}
						var module= modules[pqn];
						if(module.executed){
							return checked[pqn] = 1;
						}
						if(module.injected!==arrived){
							return checked[pqn] = 0;
						}
						if(visited[pqn]){
							// a circular path and haven't found a reason to reject this path
							return 1;
						}
						visited[pqn] = 1;
						// the module is here, now look to see if all its deps are here...
						for(var i= 0, deps= module.deps || [], end= deps.length; i<end;){
							if(!traverse(deps[i++].pqn)){
								return checked[module.pqn] = 0;
							}
						}
						return checked[pqn] = 1;
					},
					p,
					foundAtLeastOne = 0;
				for(p in dojoRequireSet) {
					traverse(p);
				}

				for(p in checked){
					if(checked[p] && dojoRequireSet[p]){
						forEach(dojoRequireSet[p], function(loaded){ loaded(1); });
						delete dojoRequireSet[p];
						foundAtLeastOne = 1;
					}
				}
				return foundAtLeastOne;
			};

		req.provideFinish = function(mid, referenceModulePqn){
			var module = getModule(slashName(mid), modules[referenceModulePqn]);
			module.result = getModule("dojo/_base/kernel", module).result.getObject(mid);
			finishExec(module);
		};

		req.getDojoLoader = function(dojo, require){
			// find the dojo/_base/loader module to use as a reference module for resolving module ids
			// originating from dojo.provide/dojo.require. These ids are always absolute, by it's possible
			// some of the top-level module ids were mapped to different names via the scope map; we
			// need a reference module so that getModuleInfo will use the correct map.
			var p, referenceModule;
			for(p in modules){
				if(modules[p].require===require){
					referenceModule= modules[p];
					break;
				}
			}

			mix(mix(getModule("dojo/require", referenceModule), nonModuleProps), {
				load:dojoRequirePlugin
			});

			mix(mix(getModule("dojo/scope", referenceModule), nonModuleProps), {
				load:function(mid, require, loaded){
					loaded(dojo.scopeMap[mid][1]);
				}
			});

			dojo.provide = function(mid){
				var module = mix(getModule(slashName(mid), referenceModule), {
					executed:executing,
					result:dojo.getObject(mid, true)
				});
				setArrived(module);
				return module.result;
			};

			return function(mid, omitModuleCheck){
				// dojo.require
				var module = getModule(slashName(mid), referenceModule);
				if(syncExecStack.length && syncExecStack[0].finish){
					// switched to async loading in the middle of evaluating a legacy module; stop
					// applying dojo.require so the remaining dojo.requires are not applied out of order
					syncExecStack[0].finish+= "dojo.require('" + mid + "');\n";
					return undefined;
				}

				if(module.executed){
					return module.result;
				}
				omitModuleCheck && (module.result = nonmodule);

				var currentMode = legacyMode;

				// recall, in sync mode to inject is to execute
				injectModule(module);

				if(module.executed!==executed && module.injected===arrived){
					// the module was already here before injectModule was called probably finishing up a xdomain
					// load, but maybe a module given to the loader directly rather than having the loader retrieve it
					execModule(module);
				}
				if(module.executed){
					return module.result;
				}

				if(currentMode==sync){
					// the only way to get here is in sync mode and dojo.required a module that was
					// loaded async in the injectModule application a few lines up
					syncExecStack.length && (syncExecStack[0].finish= "dojo.require('" + mid + "');\n");
				}else{
					// the loader wasn't in sync mode on entry; probably async mode; therefore, no expectation of getting
					// the module value synchronously; make sure it gets executed though
					execQ.push(module);
				}
				return undefined;
			};
		};

		if(has("dom")){
			var locationProtocol = location.protocol,
				locationHost = location.host,
				fileProtocol = !locationHost;
			isXdUrl = req.isXdUrl = function(url){
				if(fileProtocol || /^\./.test(url)){
					// begins with a dot is always relative to page URL; therefore not xdomain
					return false;
				}
				if(/^\/\//.test(url)){
					// for v1.6- backcompat, url starting with // indicates xdomain
					return true;
				}
				// get protocol and host
				var match = url.match(/^([^\/\:]+\:)\/\/([^\/]+)/);
				return match && (match[1] != locationProtocol || match[2] != locationHost);
			};
			if(has("dojo-xdomain-test-api")){
				req.isXdUrl = function(url){
					return isXdUrl(url);
				};
				req.xdomainTest = function(isXdUrlReplacement){
					isXdUrl= isXdUrlReplacement;
				};
			}

			var extractApplication = function(
					text,             // the text to search
					startSearch,      // the position in text to start looking for the closing paren
					startApplication  // the position in text where the function application expression starts
				){
					// find end of the call by finding the matching end paren
					var parenRe = /\(|\)/g,
						matchCount = 1,
						match;
					parenRe.lastIndex = startSearch;
					while((match = parenRe.exec(text))){
						if(match[0] == ")"){
							matchCount -= 1;
						}else{
							matchCount += 1;
						}
						if(matchCount == 0){
							break;
						}
					}

					if(matchCount != 0){
						throw "unmatched paren around character " + parenRe.lastIndex + " in: " + text;
					}

					//Put the master matching string in the results.
					return [text.substring(startApplication, parenRe.lastIndex), parenRe.lastIndex];
				},

				transformToAmd = function(module, text){
					// This is roughly the equivalent of dojo._xdCreateResource in 1.6-; however, it expresses a v1.6- dojo
					// module in terms of AMD define instead of creating the dojo proprietary xdomain module expression.
					// The module could have originated from several sources:
					//
					//   * amd require() a module, e.g., require(["my/module"])
					//   * amd require() a nonmodule, e.g., require(["my/resource.js"')
					//   * amd define() deps vector (always a module)
					//   * dojo.require() a module, e.g. dojo.require("my.module")
					//   * dojo.require() a nonmodule, e.g., dojo.require("my.module", true)
					//   * dojo.requireIf/requireAfterIf/platformRequire a module
					//
					// If a module is expected and no dojo.provide is found, then assume the module is expressed with AMD define.
					// If a nonmodule is expected, translate any dojo sync loader calls and wrap as if it was a legacy module; note
					// the edge case with this decision: if the module is actually contains one or more AMD define() applications,
					// then those won't be available until the module is executed. This is probably OK except for some very strange
					// design that expects one or more modules to be magically defined by a nonmodule

					var dojoModule = getDojoKernelModule(module),
						dojo = dojoModule && dojoModule.result,
						resultText = text,
						evalText = "",
						loadInitFound = 0,
						loadInitRe = /dojo.loadInit\s*\(/g,
						syncLoaderApiRe = /dojo\.(require|provide|requireLocalization|requireIf|requireAfterIf|platformRequire)\s*\(/mg,
						match, startSearch, startApplication, extractResult;

					if(!dojoModule){
						// trying to convert a module during the bootstrap; definitely not a legacy module
						return 0;
					}

					// Remove comments; this is the regex that comes with v1.6-, but notice that [e.g.], then string literal "/*" would cause failure
					text = text.replace(/(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg , "");

					// find and extract all dojo.loadInit applications
					while((match = loadInitRe.exec(text))){
						loadInitFound = 1;
						startSearch= loadInitRe.lastIndex;
						startApplication = startSearch  - match[0].length;
						extractResult = extractApplication(text, startSearch, startApplication);
						evalText+= extractResult[0] + ";\n";
						text = text.substring(0, startApplication) + text.substring(extractResult[1]);
						loadInitRe.lastIndex = startApplication;
					}

					// find but don't remove all dojo.require/provide/requireLocalization/requireIf/requireAfterIf/platformRequire applications
					while((match = syncLoaderApiRe.exec(text)) != null){
						startSearch = syncLoaderApiRe.lastIndex;
						startApplication = startSearch  - match[0].length;
						extractResult = extractApplication(text, startSearch, startApplication);
						evalText+= extractResult[0] + ";\n";
						syncLoaderApiRe.lastIndex = extractResult[1];
					}

					if(!evalText.length && /\s*define\s*\(/.test(text)){
						// module had no dojo sync API and started with a define application; assume it's AMD
						return 0;
					}

					var provides = "",
						moduleResult = "",
						syncDeps = ["require"],
						scopeParams= ["require"];
					for(p in dojo.scopeMap){
						syncDeps.push("dojo/scope!" + p);
						scopeParams.push(p);
					}
					if(evalText.length){
						// hijack the dojo sync loader API; evaluate the extracted code; restore the API; use synthesized results to create an AMD module
						// requireIf/requireAfterIf/platform require ultimately call require; dojo.provide is replaced via fixupProvides()
						var hold = {},
							i18nFound = 0,
							provideFound = 0,
							syncLoaderApi = {
								require:function(moduleName, omitModuleCheck){
									var module= getModule(slashName(moduleName), module);
									omitModuleCheck && (module.result = nonmodule);
									syncDeps.push("dojo/require!" + module.path);
								},
								requireLocalization:function(moduleName, bundleName, locale){
									if(!i18nFound){
										i18nFound = 1;
										syncDeps.push(dojoModule.pid + "/i18n");
									}
									locale = locale ? locale.toLowerCase() : dojo.locale;
									moduleName = slashName(moduleName) + "/nls/" + (/root/i.test(locale) ? "" : locale + "/") + slashName(bundleName);
									if(getModuleInfo(moduleName, module).isXd){
										syncDeps.push(dojoModule.pid + "/i18n!" + moduleName);
									}// else the bundle will be loaded synchronously when the module is evaluated
								},
								provide:function(moduleName){
									// mark modules that arrive consequent to multiple provides in this module as arrived since they can't be injected
									provideFound = 1;
									var providedModule = getModule(slashName(moduleName), module);
									if(providedModule!==module){
										setArrived(providedModule);
										provides+= "require.provideFinish('" + moduleName + "','" + dojoModule.pqn + "');\n";
									}else{
										moduleResult = "return dojo.getObject('" + moduleName + "');\n";
									}
								}
							};
						try{
							for(var p in syncLoaderApi){
								hold[p] = dojo[p];
								dojo[p] = syncLoaderApi[p];
							}
							reqEval(evalText, module.path + "*deps");
							resultText = (loadInitFound ? text : resultText) + provides + moduleResult;
						}catch(e){
							signal(errorListeners, [makeErrorToken("failedEvalSyncApi"), e, evalText]);
						}finally{
							for(p in syncLoaderApi){
								dojo[p] = hold[p];
							}
						}
					}
					return "define(" + dojo.toJson(syncDeps) + ", function(" + scopeParams.join(",") + "){\n" + resultText + "\n});";
				};
		}
	}

	if(has("dojo-publish-privates")){
		mix(req, {
			// these may be interesting for other modules to use
			uid:uid,

			// these may be interesting to look at when debugging
			paths:paths,
			packs:packs,
			packageMap:packageMap,
			modules:modules,
			legacyMode:legacyMode,
			execQ:execQ,
			defQ:defQ,
			waiting:waiting,
			cache:cache,

			// these are used for testing
			// TODO: move testing infrastructure to a different has feature
			pathsMapProg:pathsMapProg,
			packageMapProg:packageMapProg,
			configListeners:configListeners,
			errorListeners:listenerQueues.error,

			// these are used by the builder (at least)
			computeMapProg:computeMapProg,
			runMapProg:runMapProg,
			compactPath:compactPath,
			getModuleInfo:getModuleInfo_
		});
	}

	// the loader can be defined exactly once; look for global define which is the symbol AMD loaders are
	// *required* to define (as opposed to require, which is optional)
	if(global.define){
		if(has("dojo-log-api")){
			req.log("global define already defined; did you try to load multiple AMD loaders?");
		}
	}else{
		global.define = def;
		global.require = req;
	}
})
//>>excludeStart("replaceLoaderConfig", kwArgs.replaceLoaderConfig);
(
	// userConfig
	this.dojoConfig || this.djConfig || this.require || {},

	// default config
	{
		// the default configuration for a browser; this will be modified by other environments
		hasCache:{
			"host-browser":1,
			"dom":1,
			"dojo-amd-factory-scan":1,
			"dojo-loader":1,
			"dojo-has-api":1,
			"dojo-xhr-factory":1,
			"dojo-inject-api":1,
			"dojo-timeout-api":1,
			"dojo-trace-api":1,
			"dojo-log-api":1,
			"dojo-dom-ready-api":1,
			"dojo-dom-ready-plugin":1,
			"dojo-ready-api":1,
			"dojo-error-api":1,
			"dojo-publish-privates":1,
			"dojo-gettext-api":1,
			"dojo-config-api":1,
			"dojo-sniff":1,
			"config-tlmSiblingOfDojo":1,
			"dojo-sync-loader":1,
			"dojo-test-sniff":1,
			"dojo-eval":1,
			"dojo-xdomain-test-api":1
		},
		packages:[{
			// note: like v1.6-, this bootstrap computes baseUrl to be the dojo directory
			name:'dojo',
			location:'.'
		},{
			name:'tests',
			location:'./tests'
		},{
			name:'dijit',
			location:'../dijit'
		},{
			name:'build',
			location:'../util/build'
		},{
			name:'doh',
			location:'../util/doh'
		},{
			name:'dojox',
			location:'../dojox'
		},{
			name:'demos',
			location:'../demos'
		}],
		trace:{
			// these are listed so it's simple to turn them on/off while debugging loading
			"loader-inject":0,
			"loader-define":0,
			"loader-exec-module":0,
			"loader-run-factory":0,
			"loader-finish-exec":0,
			"loader-define-module":0
		},
		async:0
	}
);
(function(){
	// must use this.require to make this work in node.js
	var require = this.require;
	!require.async && require(["dojo"]);
	require.bootRequire && require.apply(null, require.bootRequire);
})();
//>>excludeEnd("replaceLoaderConfig")

