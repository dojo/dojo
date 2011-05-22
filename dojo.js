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
	//		the dojo.provide/dojo.require etc. API. This machinery is loaded by default, but may be dynamically removed
	//		via the has.js API and statically removed via the build system.
	//
	//		This loader includes sniffing machinery to determine the environment; the following environments are supported:
	//
	//			* browser
	//			* node.js
	//			* rhino
	//
	//		This is the so-called "source loader". As such, it includes many optional features that may be discarded by
	//		building a customized verion with the build system.

	// Design and Implementation Notes
	//
	// This is a dojo-specific adaption of bdLoad, donated to the dojo foundation by Altoviso LLC.
	//
	// This function defines an AMD-compliant (http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition)
	// loader that can be configured to operate in either synchronous or asynchronous modes.
	//
	// Since this machinery implements a loader, it does not have the luxury of using a load system and/or
	// leveraging a utility library. This results in an unpleasantly long file; here is a roadmap of the contents:
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
	//	12. Define the DOMContentLoad detection and ready API.
	//	13. Define the logging API.
	//	14. Define the tracing API.
	//	15. Define the error API.
	//	16. Define the AMD define function.
	//	17. Define the dojo v1.x provide/require machinery.
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

	var
		// define a minimal library to help build the loader
		noop = function(){
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

		setIns = function(set, name){
			set[name] = 1;
		},

		setDel = function(set, name){
			delete set[name];
		},

		mix = function(dest, src){
			for(var p in src){
				dest[p] = src[p];
			}
			return dest;
		},

		escapeRegEx = function(s){
			return s.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(c){
				return "\\" + c;
			});
		},

		uidSeed =
			1,

		uid =
			function(){
				///
				// Returns a unique indentifier (within the lifetime of the document) of the form /_d+/.
				return "_" + uidSeed++;
			},

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
	var
		requested = 1,
		arrived = 2,
		nonmodule = 3,
		executing = 4,
		executed = 5,
		execThrew = 6;

	if(has("dojo-trace-api")){
		// TODO: consider moving the symbol table to a public API offered by the loader
		var
			symbols =
				{},

			symbol = function(name){
				return symbols[name] || (symbols[name] = {value:name});
			};

		// these make debugging nice
		requested = symbol("requested");
		arrived = symbol("arrived");
		nonmodule = symbol("not-a-module");
		executing = symbol("executing");
		executed = symbol("executed");
		execThrew = symbol("exec-threw");
	}

	if(has("dojo-combo-api")){
		req.combo= {add:noop};
		var
			comboPending= 0,
			combosPending= [];
	}


	// lexical variables that hold key loader data structures; may be completely initialized by
	// defaultConfig for optimized/built versions of the loader. The packages property is deleted
	// because it is not used by the loader (package config info is cleaned up and stuffed into
	// the packs property) and keeping can lead to confusion when inspecting loader props while debuggin
	var reqEval, paths, pathsMapProg, packs, packageMap, packageMapProg, modules, cache;
	mix(req, defaultConfig);
	delete req.packages;
	if(!has("dojo-auto-init")){
		reqEval= req.eval= req.eval ||
			// use the function constructor so our eval is scoped close to (but not in) in the global space with minimal pollution
			new Function("__text", "__hint", 'return eval(__text + "\\r\\n////@ sourceURL=" + __hint);'),

		paths = req.paths = req.paths ||
			// CommonJS paths
			{};

		pathsMapProg = req.pathsMapProg = req.pathsMapProg ||
			// list of (from-path, to-path, regex, length) derived from paths;
			// a "program" to apply paths; see computeMapProg
			[];

		packs = req.packs = req.packs ||
			// a map from packageId to package configuration object; see fixupPackageInfo
			{};

		packageMap = req.packageMap = req.packageMap ||
			// map from package name to local-installed package name
			{};

		packageMapProg = req.packageMapProg = req.packageMapProg ||
			// list of (from-package, to-package, regex, length) derived from packageMap;
			// a "program" to apply paths; see computeMapProg
			[];

		modules = req.modules = req.modules ||
			// A hash:(pqn) --> (module-object). module objects are simple JavaScript objects with the
			// following properties:
			//
			//  pid: the package identifier to which the module belongs (e.g., "dojo"); "" indicates the system or default package
			//  id: the module identifier without the package identifier (e.g., "io/script")
			//  pqn: the full package-qualified name (e.g., "dojo*io/script")
			//  url: the URL from which the module was retrieved
			//  pack: the package object of the package to which the module belongs
			//  path: the full module name (package + path) resolved with respect to the loader (i.e., mappings have been applied) (e.g., dojo/io/script)
			//  executed: 0 => not executed; executing => in the process of tranversing deps and running factory; executed => factory has been executed
			//  deps: the dependency vector for this module (vector of modules objects)
			//  def: the factory for this module
			//  result: the result of the running the factory for this module
			//  injected: (requested | arrived | nonmodule) the status of the module; nonmodule means the resource did not call define
			//  load: plugin load function; applicable only for plugins
			//
			// Modules go through several phases in creation:
			//
			// 1. Requested: some other module's definition or a require application contained the requested module in
			//    its dependency vector or executing code explicitly demands a module via req.require.
			//
			// 2. Injected: a script element has been appended to the head element demanding the resource implied by the URL
			//
			// 3. Loaded: the resource injected in [2] has been evalated.
			//
			// 4. Defined: the resource contained a define statement that advised the loader about the module. Notice that some
			//    resources may just contain a bundle of code and never formally define a module via define
			//
			// 5. Evaluated: the module was defined via define and the loader has evaluated the factory and computed a result.
			{};

		cache = req.cache = req.cache ||
			///
			// hash:(pqn)-->(function)
			///
			// Gives the contents of a cached resource; function should cause the same actions as if the given pqn was downloaded
			// and evaluated by the host environment
			{};
	}

	//
	// configuration machinery (with an optimized/built defaultConfig, this can be discarded)
	//
	if(has("dojo-config-api")){
		var
			computeMapProg = function(map){
				// This routine takes a map target-prefix(string)-->replacement(string) into a vector
				// of quads (target-prefix, replacement, regex-for-target-prefix, length-of-target-prefix)
				//
				// The loader contains processes that map one string prefix to another. These
				// are encountered when applying the requirejs paths configuration and when mapping
				// package names. We can make the mapping and any replacement easier and faster by
				// replacing the map with a vector of quads and then using this structure in the simple machine runMapProg.
				var p, i, item, mapProg = [];
				for(p in map){
					mapProg.push([p, map[p]]);
				}
				mapProg.sort(function(lhs, rhs){
					return rhs[0].length - lhs[0].length;
				});
				for(i = 0; i < mapProg.length;){
					item = mapProg[i++];
					item[2] = new RegExp("^" + escapeRegEx(item[0]) + "(\/|$)");
					item[3] = item[0].length + 1;
				}
				return mapProg;
			},

			fixupPackageInfo = function(packageInfo, baseUrl){
				// calculate the precise (name, baseUrl, main, mappings) for a package
				baseUrl = baseUrl || "";
				packageInfo = mix({main:"main"}, (isString(packageInfo) ? {name:packageInfo} : packageInfo));
				packageInfo.location = baseUrl + (packageInfo.location ? packageInfo.location : packageInfo.name);
				packageInfo.mapProg = computeMapProg(packageInfo.packageMap);

				packageInfo.main= (function(path){
					return path=="." ? "" : (path.indexOf("./") ? path : path.substring(2));
				})(packageInfo.main);

				// allow paths to be specified in the package info
				mix(paths, packageInfo.paths);

				// now that we've got a fully-resolved package object, push it into the configuration
				var name = packageInfo.name;
				packs[name] = packageInfo;
				packageMap[name] = name;
			},

			configListeners=
				// vector of registered listener functions for config changes
				[],

			configVariableNames ={async:1, xd:1, waitSeconds:1, urlArgs:1, baseUrl:1, locale:1, combo:1},

			config = function(config, booting){
				// mix config into require
				var p, i;

				// async, urlArgs, and baseUrl just replace whatever is already there
				// async is only meaningful if it's set before booting the loader
				for(p in config){
					if(configVariableNames[p]){
						req[p] = config[p];
					}
					if(config[p]!==hasCache){
						// accumulate raw config info for client apps which can use this to pass their own config
						req.rawConfig[p]= config[p];
						has.add("config-"+p, config[p], 0, booting);
					}
				}
				req.waitms= (req.waitSeconds || 0) * 1000;

				// now do the special work for has, packagePaths, packages, paths, deps, callback, and ready

				for(p in config.has){
					has.add(p, config.has[p], 0, booting);
				}

				// make sure baseUrl ends with a slash
				if(!req.baseUrl){
					req.baseUrl = "./";
				}else if(!/\/$/.test(req.baseUrl)){
					req.baseUrl += "/";
				}

				// for each package found in any packages config item, augment the packs map owned by the loader
				forEach(config.packages, fixupPackageInfo);

				// for each packagePath found in any packagePaths config item, augment the packs map owned by the loader
				for(baseUrl in config.packagePaths){
					forEach(config.packagePaths[baseUrl], function(packageInfo){
						fixupPackageInfo(packageInfo, baseUrl + "/");
					});
				}

				// push in any paths and recompute the internal pathmap
				// warning: this cann't be done until the package config is processed since packages may include path info
				pathsMapProg = req.pathsMapProg = computeMapProg(mix(paths, config.paths));

				// mix any packageMap config item and recompute the internal packageMapProg
				packageMapProg = req.packageMapProg = computeMapProg(mix(packageMap, config.packageMap));

				// push in any new cache values
				mix(cache, config.cache);

				(function(deps, callback, readyCallback){
					var args= ((deps && deps.length) || callback) && [deps || [], callback || noop];
					if(booting){
						args && (req.bootRequire= args);
						readyCallback && (req.bootReady= readyCallback);
					}else{
						args && req(args[0], args[1]);
						readyCallback && req.ready(readyCallback);
					}
				})(config.deps, config.callback, config.ready);

				forEach(configListeners, function(listener){
					listener(config, req.rawConfig);
				});
			};


		req.onConfig= function(listener){
			return registerCallback(listener, configListeners);
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
		req.rawConfig= {};
		config(defaultConfig, 1);
		config(userConfig, 1);
		config(dojoSniffConfig, 1);
	}

	//
	// build the loader machinery iaw configuration, including has feature tests
	//

	var
		registerCallback= has("dojo-config-api") || has("dojo-error-api") ?
			// this cruft feels uncomfortable; consider doing something else
			function(callback, queue){
				queue.push(callback);
				return function(){
					for(var i= 0; i<queue.length; i++){
						if(queue[i]===callback){
							queue.splice(i, 1);
							return;
						}
					}
				};
			} : noop,

		injectDependencies = function(module){
			forEach(module.deps, injectModule);
			if(has("dojo-combo-api") && comboPending){
				comboPending= 0;
				req.combo.done(function(mids, url) {
					var onLoadCallback= function(){
						// defQ is a vector of module definitions 1-to-1, onto mids
						runDefQ(0, mids);
						checkComplete();
					};
					combosPending.push(mids);
					injectingModule = mids;
					mids.node = req.injectUrl(url, onLoadCallback);
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
				return module.result;
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
					injected:arrived,
					deps:deps,
					def:a2 || noop
				});
				modules[module.pqn] = module;
				injectDependencies(module);
				// try to immediately execute
				if(execModule(module, 1) === abortExec){
					// some deps weren't on board; therefore, push into the execQ
					execQ.push(module);
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
				result.nameToUrl = result.toUrl = function(name, ext){
					return nameToUrl(name, ext, module);
				};
				result.toAbsMid = function(mid){
					// FIXME: the .path is wrong for a package main module
					return getModuleInfo(mid, module, packs, modules, req.baseUrl, packageMapProg, pathsMapProg).path;
				};
				if(has("dojo-undef-api")){
					result.undef = function(moduleId){
						// In order to reload a module, it must be undefined (this routine) and then re-requested.
						// This is useful for testing frameworks (at least).
						var pqn = getModule(moduleId, module).pqn;
						setDel(modules, pqn);
						setDel(waiting, pqn);
					};
				}
			}
			return result;
		},

		xdomain =
			req.async=="xd",

		syncDepth =
			///
			// syncDepth==0 iff async AMD mode; otherwise either synchronous or xdomain mode; if > 1, then syncDepth-1 gives
			// the recursive depth while loading a resource
			req.async && !xdomain ? 0 : 1,

		syncLoadComplete =
			syncDepth,

		execQ =
			///
			// The list of modules that need to be evaluated.
			[],

		defQ =
			// The queue of define arguments sent to loader.
			[],

		waiting =
			// The set of modules upon which the loader is waiting for definition to arrive
			{},

		execComplete =
			// says the loader has completed (or not) its work
			function(){
				return syncDepth == syncLoadComplete && !defQ.length && isEmpty(waiting) && !execQ.length;
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
			var
				result= [],
				segment, lastSegment;
		    path= path.split("/");
			while(path.length){
				segment= path.shift();
				if(segment==".." && result.length && lastSegment!=".."){
					result.pop();
				}else if(segment!="."){
					result.push(lastSegment= segment);
				} // else ignore "."
			}
			return result.join("/");
		},

		makeModuleInfo = function(pid, mid, pqn, pack, path, url){
			return {pid:pid, mid:mid, pqn:pqn, pack:pack, path:path, url:url, executed:0, def:0};
		},

		getModuleInfo = function(mid, referenceModule, packs, modules, baseUrl, packageMapProg, pathsMapProg, alwaysCreate){
			// arguments are passed instead of using lexical variables so that this function my be used independent of the loader (e.g., the builder)
			// alwaysCreate is useful in this case so that getModuleInfo never returns references to real modules owned by the loader
			var pid, pack, pqn, mapProg, mapItem, path, url, result, isRelative, requestedMid;
			requestedMid= mid;
			isRelative= /^\./.test(mid);
			if(/(^\/)|(\:)|(\.js$)/.test(mid) || (isRelative && !referenceModule)){
				// absolute path or protocol, or relative path but no reference module and therefore relative to page
				// whatever it is, it's not a module but just a URL of some sort
				return makeModuleInfo(0, mid, "*" + mid, 0, mid, mid);
			}else{
				// relative module ids are relative to the referenceModule; get rid of any dots
				path = compactPath(isRelative ? (referenceModule.path + "/../" + mid) : mid);
				if(/^\./.test(path)){
					// the path is irrational
					pid= "badMid" + uid();
					return mix(makeModuleInfo(pid, mid, pid + "*" + mid, 0, referenceModule && referenceModule.path, ""), nonModuleProps);
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

			if(has("dojo-requirejs-api") && isRelative){
				url= compactPath(referenceModule.url.match(/^(.*?)[^\/]+$/)[1] + requestedMid) + ".js";
			}
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

		getModule = function(mid, referenceModule, fromRequire){
			// compute and optionally construct (if necessary) the module implied by the mid with respect to referenceModule
			var match, plugin, pluginResource, result, existing, pqn;
			match = mid.match(/^(.+?)\!(.*)$/);
			//TODO: change the regex above to this and test...match= mid.match(/^([^\!]+)\!(.+)$/);
			if(match){
				// name was <plugin-module>!<plugin-resource>
				plugin = getModule(match[1], referenceModule);
				pluginResource = match[2];
				pqn = plugin.pqn + "!" + (referenceModule ? referenceModule.pqn + "!" : "") + pluginResource;
				return modules[pqn] || (modules[pqn] = {plugin:plugin, mid:pluginResource, req:(referenceModule ? createRequire(referenceModule) : req), pqn:pqn});
			}else{
				if(fromRequire && /^.*[^\/\.]+\.[^\/\.]+$/.test(mid)){
					// anything* anything-other-than-a-dot+ dot anything-other-than-a-dot-or-slash+ => a url that ends with a filetype
					pqn = "*" + mid;
					return modules[pqn]= modules[pqn] || makeModuleInfo(0, mid, pqn, 0, mid, mid);
				}
				result = getModuleInfo(mid, referenceModule, packs, modules, req.baseUrl, packageMapProg, pathsMapProg);
				return modules[result.pqn] || (modules[result.pqn] = result);
			}
		},

		nameToUrl = req.nameToUrl = req.toUrl = function(name, ext, referenceModule){
			// slightly different algorithm depending upon whether or not name contains
			// a filetype. This is a requirejs artifact which we don't like.
			var
				match = !ext && name.match(/(.+)(\.[^\/]+?)$/),
				moduleInfo = getModuleInfo((match && match[1]) || name, referenceModule, packs, modules, req.baseUrl, packageMapProg, pathsMapProg),
				url= moduleInfo.url;
			// recall, getModuleInfo always returns a url with a ".js" suffix iff pid; therefore, we've got to trim it
			url= typeof moduleInfo.pid == "string" ? url.substring(0, url.length - 3) : url;
			return url + (ext ? ext : (match ? match[2] : ""));
		},

		nonModuleProps = {
			injected: arrived,
			deps: [],
			def: nonmodule,
			result: nonmodule,
			executed: executed
		},

		cjsRequireModule = mix(getModule("require"), nonModuleProps),
		cjsExportsModule = mix(getModule("exports"), nonModuleProps),
		cjsModuleModule = mix(getModule("module"), nonModuleProps),

		// this is a flag to say at least one factory was run during a deps tree traversal
		runFactory = function(pqn, factory, args, cjs){
			req.trace("loader-run-factory", [pqn]);
			var result= isFunction(factory) ? factory.apply(null, args) : factory;
			return result===undefined && cjs ? cjs.exports : result;
		},

		abortExec = {},

		defOrder = 0,

		execModule = function(module, strict){
			// run the dependency vector, then run the factory for module
			if(!module.executed){
				if(!module.def || (strict && module.executing)){
					return abortExec;
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
											execModule(arg))));
					if(argResult === abortExec){
						module.executed = 0;
						req.trace("loader-exec-module", ["abort", pqn]);
						return abortExec;
					}
					args.push(argResult);
				}
				module.defOrder = defOrder++;
				if(has("dojo-loader-catches")){
					try{
						module.result = runFactory(pqn, module.def, args, module.cjs);
					}catch(e){
						module.executed = execThrew;
						if(!req.error("loader/exec", [module, e, pqn].concat(args))){
							throw e;
						}
					}
				}else{
					module.result = runFactory(pqn, module.def, args, module.cjs);
					module.executed = executed;
				}
				module.executed = executed;
				req.trace("loader-exec-module", ["complete", pqn]);
			}
			return module.result;
		},

		checkCompleteGuard = 0,

		checkComplete = function(){
			// keep going through the execQ as long as at least one factory is executed
			// plugins, recursion, cached modules all make for many execution path possibilities

			if(checkCompleteGuard){
				checkCompleteGuard++;
				return;
			}
			isEmpty(waiting) && clearTimer();
			for(var result, module, i = 0; i < execQ.length;){
				checkCompleteGuard = 1;
				module = execQ[i];
				execModule(module);
				if(module.executed === executed){
					// adjust the execQ and recheck; executing a module may result in pushing a plugin
					// to the front, so we've got to find the module in the execQ the hard way...
					for(i = 0; i < execQ.length; i++){
						if(execQ[i] === module){
							execQ.splice(i, 1);
							i = 0;
							break;
						}
					}
					if(module.loadQ){
						// this was a plugin module
						var
							q = module.loadQ,
							load = module.load = module.result.load;
						while(q.length){
							load.apply(null, q.shift());
						}
					}
				}else if(checkCompleteGuard>1){
					// executing the module caused a recursive call to checkComplete; restart the check
					i = 0;
				}else{
					// nothing happended; check the next module in the exec queue
					i++;
				}
			}
			checkCompleteGuard = 0;
			if(has("dojo-ready-api")){
				onLoad();
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
			// if in the browser and old IE; find an xhr
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

	req.toAbsMid = function(id){
		return id;
	};

	if(has("dojo-undef-api")){
		req.undef = function(moduleId){
			// In order to reload a module, it must be undefined (this routine) and then re-requested.
			// This is useful for testing frameworks (at least).
			var pqn = getModule(moduleId, 0).pqn;
			setDel(modules, pqn);
			setDel(waiting, pqn);
		};
	}

	if(has("dojo-inject-api")){
		var
			injectPlugin = function(
				module,
				immediate // this is consequent to a require call like require("text!some/text")
			){
				// injects the plugin module given by module; may have to inject the plugin itself
				var plugin = module.plugin;
				plugin.isPlugin = 1;

				if(has("dojo-sync-loader")){
					// in synchronous mode; instantiate the plugin before trying to load a plugin resource
					syncDepth && !plugin.executed && injectModule(plugin);
				}

				if(plugin.executed === executed && !plugin.load){
					plugin.load = plugin.result.load;
				}

				if(module.executed){
					// let the plugin decide if it wants to use the existing value or provide a new value
					module.executed = 0;
				}

				var
					pqn = module.pqn,
					onload = function(def){
						mix(module, {executed:executed, result:def});
						setDel(waiting, pqn);
						checkComplete();
					};
				if(cache[pqn]){
					onload(cache[pqn]);
				}else{
					if(!plugin.load && !immediate){
						// don't go loading the plugin if were just looking for an immediate
						// make the client properly demand the module
						plugin.loadQ = [];
						plugin.load = function(id, require, callback){
							plugin.loadQ.push([id, require, callback]);
						};
						// try to get plugins executed ASAP since they are presumably needed
						// to load dependencies for other modules
						execQ.unshift(plugin);
						injectModule(plugin);
					}
					!immediate && setIns(waiting, pqn);
					plugin.load && plugin.load(module.mid, module.req, onload);
				}
			},

			// for IE, injecting a module may result in a recursive execution if the module is in the cache
			// the injecting stack informs define what is currently being injected in such cases
			injectingModule = 0,

			injectModule = function(module){
				// Inject the module. In the browser environment, this means appending a script element into
				// the head; in other environments, it means loading a file.
				//
				// If in synchronous mode (syncDepth>0), then get the module synchronously if it's not xdomain.

				if(module.plugin){
					injectPlugin(module);
					return;
				} // else a normal module (not a plugin)

				if(module.executed){
					return;
				}

				var
					pqn = module.pqn,
					url = module.url;
				if(module.injected || waiting[pqn] && !syncDepth){
					return;
				}

				if(req.urlArgs){
					url+= (/\?/.test(url) ? "&" : "?") + req.urlArgs;
				}

				module.injected = requested;
				setIns(waiting, pqn);

				if(has("dojo-combo-api") && req.combo.add(0, module.path, module.url, req)){
					comboPending= 1;
					return;
				}

				var onLoadCallback = function(){
					setDel(waiting, pqn);
					runDefQ(module);
					if(module.injected !== arrived){
						// the script that contained the module arrived and has been executed yet
						// nothing was added to the defQ (so it wasn't an AMD module) and the module
						// wasn't marked as executed by dojo.provide (so it wasn't a v1.6- module);
						// therefore, it must not have been a module (it was just some code); adjust state accordingly
						mix(module, nonModuleProps);
						var result = window, part, namespace = module.path.split("/");
						while(part = namespace.shift()){
							result = result && result[part];
						}
						module.result = result || module.result;
					}
					checkComplete();
				};
				if(cache[pqn]){
					cache[pqn].call(null);
					onLoadCallback();
				}else{
					if(has("dojo-sync-loader")){
						if(syncDepth && !isXdPath(url)){
							// always synchronous...
							var xhrCallback= function(text){
								if(xdomain){
									text= transformToDefine(text, module.path);
								}
								reqEval(text, module.path);
							};
							injectingModule= module;
							++syncDepth;
							req.trace("loader-inject", ["sync", module.pqn, url]);
							if(has("dojo-loader-catches")){
								try{
									getText(url, 0, xhrCallback);
								}catch(e){
									if(!req.error("loader/sync-inject", [pqn, url, e])){
										throw e;
									}
								}finally{
									--syncDepth;
									injectingModule= 0;
									setDel(waiting, pqn);
								}
							}else{
								getText(url, 0, xhrCallback);
								--syncDepth;
								injectingModule= 0;
								setDel(waiting, pqn);
							}
							var wasAsync = require.async;
							require.async = 0;
							try{
								onLoadCallback();
							}finally{
								require.async = wasAsync;
							}
							return;
						}
					}
					req.trace("dojo-inject", [module.pqn, url]);
					injectingModule= module;
					module.node = req.injectUrl(url, onLoadCallback);
					injectingModule= 0;

				}
			},

			defineModule = function(module, deps, def){
				req.trace("loader-define-module", [module.pqn, deps]);

				var pqn = module.pqn;
				if(module.injected === arrived){
					req.error("loader/multiple-define", [pqn]);
					return module;
				}
				mix(module, {
					injected: arrived,
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
				if(!isFunction(def) && !deps.length){
					mix(module, {result:def, executed:executed});
				}

				// resolve deps with respect to pid
				for(var i = 0; i < deps.length; i++){
					deps[i] = getModule(deps[i], module);
				}

				setDel(waiting, pqn);
				return module;
			},

			runDefQ = function(referenceModule, mids){
				// defQ is an array of [id, dependencies, factory]
				// mids (if any) is a vector of mids given by a combo service
				var
					definedModules = [],
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

	var
		timerId = 0,
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
				req.error("loader/timeout", [waiting]);
			}, req.waitms));
		};
	}

	if(has("dom")){
		has.add("dom-addeventlistener", !!doc.addEventListener);
	}

	if(has("dom") && (has("dojo-dom-ready-api") || has("dojo-inject-api"))){
		var on = function(node, eventName, handler, useCapture, ieEventName){
			// Add an event listener to a DOM node using the API appropriate for the current browser;
			// return a function that will disconnect the listener.
			if(has("dom-addeventlistener")){
				node.addEventListener(eventName, handler, !!useCapture);
				return function(){
					node.removeEventListener(eventName, handler, !!useCapture);
				};
			}else{
				if(ieEventName !== false){
					eventName = ieEventName || "on" + eventName;
					node.attachEvent(eventName, handler);
					return function(){
						node.detachEvent(eventName, handler);
					};
				}else{
					return noop;
				}
			}
		};
	}

	if(has("dom") && has("dojo-inject-api")){
		var head = doc.getElementsByTagName("head")[0] || doc.getElementsByTagName("html")[0];
		req.injectUrl = req.injectUrl || function(url, callback){
			// Append a script element to the head element with src=url; apply callback upon
			// detecting the script has loaded.

			startTimer();
			var
				node = doc.createElement("script"),
				onLoad = function(e){
					e = e || window.event;
					var node = e.target || e.srcElement;
					if(e.type === "load" || /complete|loaded/.test(node.readyState)){
						disconnector();
						callback && callback();
					}
				},
				disconnector = on(node, "load", onLoad, false, "onreadystatechange");
			node.src = url;
			node.type = "text/javascript";
			node.charset = "utf-8";
			head.appendChild(node);
			return node;
		};
	}

	var domReadyQ = [];
	if(has("dojo-dom-ready-plugin")){
		var	domReadyPluginLoad = function(id, require, cb){
			if(req.pageLoaded){
				cb(1);
			}else{
				domReadyQ.push(cb);
			}
		};
		mix(getModule("domReady"), {
			injected: arrived,
			executed: executed,
			load:domReadyPluginLoad
		});
	}

	if(has("dojo-dom-ready-api")){
		// WARNING: document.readyState does not work with Firefox before 3.6. To support
		// those browsers, manually init require.pageLoaded in configuration.

		// require.pageLoaded can be set truthy to indicate the app "knows" the page is loaded and/or just wants it to behave as such
		req.pageLoaded = req.pageLoaded || doc.readyState == "complete";

		// no need to detect if we already know...
		if(!req.pageLoaded){
			var
				loadDisconnector = 0,
				DOMContentLoadedDisconnector = 0,
				scrollIntervalId = 0,
				detectPageLoadedFired = 0,
				detectPageLoaded = function(){
					if(detectPageLoadedFired){
						return;
					}
					detectPageLoadedFired = 1;

					if(scrollIntervalId){
						clearInterval(scrollIntervalId);
						scrollIntervalId = 0;
					}
					loadDisconnector && loadDisconnector();
					DOMContentLoadedDisconnector && DOMContentLoadedDisconnector();
					req.pageLoaded = true;
					if(has("dojo-dom-ready-plugin")){
						while(domReadyQ.length){
							(domReadyQ.shift())();
						}
					}
					onLoad();
				};

			if(!req.pageLoaded){
				loadDisconnector = on(window, "load", detectPageLoaded, false);
				DOMContentLoadedDisconnector = on(doc, "DOMContentLoaded", detectPageLoaded, false, false);
			}

			if(!has("dom-addeventlistener")){
				// note: this code courtesy of James Burke (https://github.com/jrburke/requirejs)
				// DOMContentLoaded approximation, as found by Diego Perini: http://javascript.nwbox.com/IEContentLoaded/
				if(self === self.top){
					scrollIntervalId = setInterval(function (){
						try{
							// From this ticket: http://bugs.dojotoolkit.org/ticket/11106. In IE HTML Application (HTA),
							// such as in a selenium test, javascript in the iframe can't see anything outside of it,
							// so self===self.top is true, but the iframe is not the top window and doScroll will be
							// available before document.body is set. Test document.body before trying the doScroll trick.
							if(doc.body){
								doc.documentElement.doScroll("left");
								detectPageLoaded();
							}
						}catch(e){}
					}, 30);
				}
			}
		}
	}else{
		req.pageLoaded = 1;
	}

	if(has("dojo-ready-api")){
		var
			loadQ =
				// The queue of functions waiting to execute as soon as all conditions given
				// in require.onLoad are satisfied; see require.onLoad
				[],

			onLoadRecursiveGuard = 0,
			onLoad = function(){
				while(execComplete() && !onLoadRecursiveGuard && req.pageLoaded && loadQ.length){
					//guard against recursions into this function
					onLoadRecursiveGuard = 1;
					var f = loadQ.shift();
					if(has("dojo-loader-catches")){
						try{
							f();
						}catch(e){
							onLoadRecursiveGuard = 0;
							if(!req.error("loader/onLoad", [e])){
								throw e;
							}
						}
					}else{
						f();
					}
					onLoadRecursiveGuard = 0;
				}
			};

		req.ready = function(
			priority,//(integer, optional) The order in which to exec this callback relative to other callbacks, defaults to 1000
			context, //(object) The context in which to run execute callback
			         //(function) callback, if context missing
			callback //(function) The function to execute.
		){
			///
			// Add a function to execute on DOM content loaded and all requests have arrived and been evaluated.

			if(isArray(priority)){
				// signature is (deps, callback); require deps, but hold callback until ready condition
				req(priority, function(){
					for(var aargs = [], i = 0; i < arguments.length; aargs.push(arguments[i++])){
					}
					req.ready(function(){
						context.apply(null, aargs);
					});
				});
				return;
			}
			if(typeof priority != "number"){
				callback = context, context = priority, priority = 1000;
			}
			var cb = function(){
				if(isString(callback)){
					context[callback]();
				}else if(isFunction(callback)){
					callback.call(context);
				}else{
					context();
				}
			};
			cb.priority = priority;
			for(var i = 0; i < loadQ.length && priority >= loadQ[i].priority; i++){}
			loadQ.splice(i, 0, cb);
			onLoad();
		};
	}

	if(has("dojo-log-api")){
		req.log = req.log || function(){
			// we're not going to mess around in defective environments
			if(typeof console == "undefined" || !console.log){
				return;
			}
			for(var i = 0; i < arguments.length; i++){
				console.log(arguments[i]);
			}
		};
	}else{
		req.log = noop;
	}

	if(has("dojo-trace-api")){
		var trace= function(
			group,	// the trace group to which this application belongs
			args	// the contents of the trace
		){
			///
			// Tracing interface by group.
			//
			// Sends the contents of args to the console iff (req.trace.on && req.trace[group])

			if(trace.on && trace.group[group]){
				for(var text= group + ":" + args[0], i= 1; i<args.length && isString(args[i]);){
					text+= ", " + args[i++];
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
			},
			showUnexecuted:function(){
				trace.result= {};
				for(var p in modules){
					if(modules[p].executed!==executed){
						trace.result[p]= modules[p];
					}
				}
			}
		});
		trace.set(defaultConfig.trace);
		trace.set(userConfig.trace);
		trace.set(dojoSniffConfig.trace);
		req.trace= trace;
	}else{
		req.trace = noop;
	}

	if(has("dojo-error-api")){
		//
		// Error Detection and Recovery
		//
		// Several things can go wrong during loader operation:
		//
		// * A resource may not be accessible, giving a 404 error in the browser or a file error in other environments
		//	 (this is usally caught by a loader timeout (see require.timeout) in the browser environment).
		// * The loader may timeout (after the period set by require.timeout) waiting for a resource to be delivered.
		// * Executing a module may cause an exception to be thrown.
		// * Executing the onLoad queue may cause an exception to be thrown.
		//
		// In all these cases, the loader publishes the problem to interested subscribers via the function require.error.
		// If the error was an uncaught exception, then if some subscriber signals that it has taken actions to recover
		// and it is OK to continue by returning truthy, the exception is quashed; otherwise, the exception is rethrown.
		// Other error conditions are handled as applicable for the particular error.
		var errorListeners= [];
		req.error = function(
			messageId, //(string) The topic to publish
			args       //(array of anything, optional, undefined) The arguments to be applied to each subscriber.
		){
			///
			// Publishes messageId to all subscribers, passing args; returns result as affected by subscribers.
			///
			// A listener subscribes by calling require.onError(listener), where the listener signature
			// must be `function(messageId, args`) where messageId indentifies
			// where the exception was caught and args is an array of information gathered by the catch
			// clause. If the listener has taken corrective actions and wants to stop the exception and
			// let the loader continue, it must return truthy. If no listener returns truthy, then
			// the exception is rethrown.
			for(var result = false, i = 0; i < errorListeners.length; i++){
				result = result || errorListeners[i](messageId, args);
			}
			req.log.apply(req, [messageId].concat(args));
			return result;
		};
		req.onError= function(listener){
 			return registerCallback(listener, errorListeners);
		};
	}else{
		req.error = req.error || noop;
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

		var
			arity = arguments.length,
			args = 0,
			defaultDeps = ["require", "exports", "module"];

		if(has("dojo-amd-factory-scan")){
			if(arity == 1){
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
				(arity == 2 ? (isArray(mid) ? [0, mid, dependencies] : [mid, defaultDeps, dependencies]) :
					[mid, dependencies, factory]);
		}
		req.trace("loader-define", args.slice(0, 2));
		var
			targetModule = args[0] && getModule(args[0]),
			pqn, module;
		if(targetModule && !waiting[targetModule.pqn]){
			// given a mid that hasn't been requested; therefore, defined through means other than injecting (for
			// example, code may define modules on-the-fly due to some user stimulus) and no callback waiting to
			// finish processing. In such cases, there is nothing to trigger the defQ and the dependencies are
			// never requested; therefore, do it here.
			injectDependencies(defineModule(targetModule, args[1], args[2]));
		}else if(has("dom-addeventlistener") || !has("host-browser")){
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
					for(var i= 0; i<combosPending.length; i++){
						targetModule= combosPending[i];
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
				req.error("loader/define-ie");
			}
			checkComplete();
		}
	};
	def.amd = {
		vendor:"dojotoolkit.org"
	};

	if(has("dojo-requirejs-api")){
		req.def = def;
	}

	if(has("dojo-sync-loader")){
		var
			slashName = function(name){
				return name.replace(/\./g, "/");
			},

			isXdPath = noop;

		req.debugAtAllCosts= function(){
			syncDepth= syncLoadComplete = 0;
		};

		req.getDojoLoader = function(dojo, dijit, dojox){
			var
				referenceModule = getModule(slashName(dojo._scopeName)),

				require = createRequire(referenceModule);

			dojo.provide = function(mid){
				var module= getModule(slashName(mid), referenceModule);
				module.executed!==executed && mix(module, {
					deps: [],
					result: dojo.getObject(mid.replace(/\//g, "."), true)
				});
				return module.result;
			};

			return function(mid){
				// basic dojo.require
				mid = slashName(mid);
				syncDepth++;
				require.async = false;
				try{
					var
						module = getModule(mid, referenceModule),
						url = module.url;
					if(module.executed){
						return module.result;
					}

					execQ.push(module);
					injectModule(module);

					checkComplete();
					return module.result;
				}finally{
					syncDepth--;
				}
			};
		};

		if(has("dom")){
			var
				locationProtocol = location.protocol,
				locationHost = location.host,
				fileProtocol = !locationHost;
			isXdPath = function(path){
				if(fileProtocol || /^\./.test(path)){
					// begins with a dot is always relative to page URL; therefore not xdomain
					return false;
				}
				if(/^\/\//.test(path)){
					// for v1.6- backcompat, path starting with // indicates xdomain
					return true;
				}
				// get protocol and host
				var match = path.match(/^([^\/\:]+\:)\/\/([^\/]+)/);
				return match && (match[1] != locationProtocol || match[2] != locationHost);
			};

			var
				extractApplication = function(
					text,             // the text to search
					startSearch,      // the position in text to start looking for the closing paren
					startApplication  // the position in text where the function application expression starts
				){
					// find end of the call by finding the matching end paren
					var
						parenRe = /\(|\)/g,
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

				transformToDefine= function(text, mid){
					// This is roughly the equivalent of dojo._xdCreateResource in 1.6-; however, it expresses a v1.6- dojo
					// module in terms of AMD define instead of creating the dojo proprietary xdomain module expression.

					var
						resultText = text,
						evalText =  [],
						loadInitFound = 0,
						loadInitRe = /dojo.loadInit\s*\(/g,
						syncLoaderApiRe = /dojo\.(require|requireIf|provide|requireAfterIf|platformRequire|requireLocalization)\s*\(/mg,
						match, startSearch, startApplication, extractResult;

					// Remove comments; this is the regex that comes with v1.5-, but notice that [e.g.], then string literal "/*" would cause failure
					text = text.replace(/(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg , "");

					// extract all dojo.loadInit applications; remove them from text
					while((match = loadInitRe.exec(text))){
						loadInitFound = 1;
						startSearch= loadInitRe.lastIndex;
						startApplication = startSearch  - match[0].length;
						extractResult= extractApplication(text, startSearch, startApplication);
						evalText.push(extractResult[0]);
						text= text.substring(0, startApplication) + text.substring(extractResult[1]);
						loadInitRe.lastIndex = startApplication;
					}

					// extract all sync loader function applications, but don't remove them from the text
					while((match = syncLoaderApiRe.exec(text)) != null){
						startSearch= syncLoaderApiRe.lastIndex;
						startApplication = startSearch  - match[0].length;
						extractResult= extractApplication(text, startSearch, startApplication);
						evalText.push(extractResult[0]);
						syncLoaderApiRe.lastIndex = extractResult[1];
					}

					if(evalText.length){
						evalText= evalText.join(";\n") + "\n";
						// hijack the dojo sync loader API; evaluate the extracted code; restore the API; use synthesized results to create an AMD module
						var
							requires = [],
							requireIfs = [],
							provides = [],
							hold = {},
							syncLoaderApi = {
								provide:function(moduleName){
									provides.push(slashName(moduleName));
								},
								require:function(moduleName){
									requires.push(slashName(moduleName));
								},
								requireIf:function(condition, moduleName){
									condition && requireIfs.push(slashName(moduleName));
								},
								requireAfterIf:function(condition, moduleName){
									condition && requireIfs.push(slashName(moduleName));
								},
								requireLocalization:function(moduleName, bundleName, locale){
									var i18nMid= dojo.getL10nName(moduleName, bundleName, locale);
									if(isXdPath(nameToUrl(i18nMid))){
										dojo.require(i18nMid);
									}// else the bundle will be loaded synchronously when needed via dojo.getLocalization(moduleName, bundleName, locale)
								}
							};

						try{
							for(var p in syncLoaderApi){
								hold[p] = dojo[p];
								dojo[p] = syncLoaderApi[p];
							}
							reqEval(evalText, "__deps-trace/" + mid);
						}catch(e){
							req.log("failed to evaluate extracted dojo sync API statements(" + mid + ")\n" + evalText);
							req.log(e);
						}finally{
							for(p in syncLoaderApi){
								dojo[p] = hold[p];
							}

						}

						resultText= "define(" + dojo.toJson(requires) + ", function(){\n" + (loadInitFound ? text : resultText) + "\n});\n";;
						if(requireIfs.length){
							// make a fake module that demands all of the requireIfs; it's never defined
							injectDependencies(defineModule(getModule(mid + "/requireIfs"), requireIfs, noop));
						}
					}
					return resultText;
				};
		}

		if(has("dojo-xdomain-test-api")){
			req.xdomainTest= function(isXdPathReplacement){
				xdomain = true;
				req.async = "xd";
				if(isXdPathReplacement){
					isXdPath= isXdPathReplacement;
				}
			};
		}
	}

	if(has("dojo-publish-privates")){
		mix(req, {
			// these may be interesting for other modules to use
			isEmpty:isEmpty,
			isFunction:isFunction,
			isString:isString,
			isArray:isArray,
			forEach:forEach,
			setIns:setIns,
			setDel:setDel,
			mix:mix,
			uid:uid,
			on:on,

			// these may be interesting to look at when debugging
			configListeners:configListeners,
			errorListeners:errorListeners,
			syncDepth:syncDepth,
			execQ:execQ,
			defQ:defQ,
			waiting:waiting,
			loadQ:loadQ,
			runDefQ:runDefQ,
			checkComplete:checkComplete,

			// these are used by the builder (at least)
			computeMapProg:computeMapProg,
			runMapProg:runMapProg,
			compactPath:compactPath,
			getModuleInfo:getModuleInfo
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
			"dojo-loader-catches":0,
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
			"loader-run-factory":0,
			"loader-exec-module":0,
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
	require.bootReady && require.ready(require.bootReady);
})();
//>>excludeEnd("replaceLoaderConfig")

