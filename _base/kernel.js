define(["../has", "./config", "require", "module"], function(has, config, require, module){
	// module:
	//		dojo/_base/kernel
	// summary:
	//		This module is the foundational module of the dojo boot sequence; it defines the dojo object.
	var
		// loop variables for this module
		i, p,

		// create dojo, dijit, and dojox
		// FIXME: in 2.0 remove dijit, dojox being created by dojo
		dijit = {},
		dojox = {},
		dojo = {
			// notice dojo takes ownership of the value of the config module
			config:config,
			global:this,
			dijit:dijit,
			dojox:dojox
		},

		getFirstSegment = function(id){
			return id.match(/[^\/]+/)[0];
		},

		scopeMap =
			// a map from a name used in a legacy module to the the global variable name and object addressed by that name
			{dojo:[getFirstSegment(module.id), dojo]};

	has.add("dojo-scopeMap",
		// allow explicit setting of dojo.scopeMap
		1
	);
	if(has("dojo-scopeMap")){
		// Configure the scope map. For a 100% AMD application, the scope map is not needed other than to provide
		// a _scopeName property for the dojo, dijit, and dojox root object so those packages can create
		// unique names in the global space.
		//
		// Built, legacy modules use the scope map to allow those modules to be expressed as if dojo, dijit, and dojox,
		// where global when in fact they are either global under different names or not global at all.  See
		// http://livedocs.dojotoolkit.org/developer/design/loader#legacy-cross-domain-mode for details.
		//
		// A scopMap is composed of (name, global-name, target-object) triples which gives a name (name) used
		// internally by legacy modules for a top-level object, the global name (global-name) at which the top-level
		// object resides and the value (target-object) of the top-level object. If no value if given for the target-object object,
		// it is initialized to {}. Any value provided for dojo, dijit, and/or dojox is ignored (these packages take responsibility
		// for initializing their own objects).  If no global name is provided for a particular top-level name, then a
		// reasonably-random unique name is manufactured.
		//
		// By default, we have
		//
		// dojo.scopeMap.dojo[0]==="dojo" and dojo.scopeMap.dojo[1]===dojo
		// dojo.scopeMap.dijit[0]==="dijit" and dojo.scopeMap.dijit[1]===dojo.dijit
		// dojo.scopeMap.dojox[0]==="dojox" and dojo.scopeMap.dojox[1]===dojo.dojox
		//
		// The config scope map of  [["dojo", "myDojo"], ["dijit"], , ["dojox"]] would generate something like this:
		//
		// dojo.scopeMap.dojo[0]==="myDojo" and dojo.scopeMap.dojo[1]===dojo
		// dojo.scopeMap.dijit[0]==="dijit_1308291332419" and dojo.scopeMap.dijit[1]===dojo.dijit
		// dojo.scopeMap.dojox[0]==="dojox_1308291332420" and dojo.scopeMap.dojox[1]===dojo.dojox
		//
		var
			configScopeMap =
				// configuration to edit or expand scopeMap; given as tripples [name, globalName, object]
				config.scopeMap || [["dijit", getFirstSegment(require.toAbsMid("dijit"))], ["dojox", getFirstSegment(require.toAbsMid("dojox"))]],

			seed =
				// seed used to create unique scope names
				(new Date).getTime(),

			item, name, globalName, theObject;

		for(i = 0; i < configScopeMap.length; i++){
			item = configScopeMap[i],
			name = item[0],
			globalName = item[1] || (name + "_" + i + seed),
			theObject = {dojo:dojo, dijit:dijit, dojox:dojox}[name] || item[2] || {};
			scopeMap[name] = [globalName, theObject];
		}
		for(p in scopeMap){
			item = scopeMap[p];
			item[1]._scopeName = item[0];
			if(!config.noGlobals){
				this[item[0]] = item[1];
			}
		}
	}
	dojo.scopeMap = scopeMap;

	// FIXME: dojo.baseUrl and dojo.config.baseUrl should be deprecated
	dojo.baseUrl = dojo.config.baseUrl = require.baseUrl;
	dojo.isAsync = !has("dojo-loader") || require.async;
	dojo.locale = config.locale;

	/*=====
		dojo.version = function(){
			// summary:
			//		Version number of the Dojo Toolkit
			// major: Integer
			//		Major version. If total version is "1.2.0beta1", will be 1
			// minor: Integer
			//		Minor version. If total version is "1.2.0beta1", will be 2
			// patch: Integer
			//		Patch version. If total version is "1.2.0beta1", will be 0
			// flag: String
			//		Descriptor flag. If total version is "1.2.0beta1", will be "beta1"
			// revision: Number
			//		The SVN rev from which dojo was pulled
			this.major = 0;
			this.minor = 0;
			this.patch = 0;
			this.flag = "";
			this.revision = 0;
		}
	=====*/
	var rev = "$Rev: 23930 $".match(/\d+/);
	dojo.version = {
		major: 1, minor: 7, patch: 0, flag: "dev",
		revision: rev ? +rev[0] : NaN,
		toString: function(){
			var v = dojo.version;
			return v.major + "." + v.minor + "." + v.patch + v.flag + " (" + v.revision + ")";	// String
		}
	};

	if(has("host-loader")){
		dojo.eval = require.eval;
	}else{
		var eval_ =
			// use the function constructor so our eval is scoped close to (but not in) in the global space with minimal pollution
			new Function("__text", "return eval(__text);");

		dojo.eval = function(text, hint){
			// note: the four forward-slashes make the firebug hint work in ie9
			return eval_(text + "\r\n////@ sourceURL=" + hint);
		};
	}

	if(has("host-rhino")){
		dojo.exit = function(exitcode){
			quit(exitcode);
		};
	} else{
		dojo.exit = function(){
		};
	}

	has.add("dojo-guarantee-console",
		// ensure that console.log, console.warn, etc. are defined
		1
	);
	if(has("dojo-guarantee-console")){
		// intentional global console
		typeof console != "undefined" || (console = {});
		//	Be careful to leave 'log' always at the end
		var cn = [
			"assert", "count", "debug", "dir", "dirxml", "error", "group",
			"groupEnd", "info", "profile", "profileEnd", "time", "timeEnd",
			"trace", "warn", "log"
		];
		var tn;
		i = 0;
		while((tn = cn[i++])){
			if(!console[tn]){
				(function(){
					var tcn = tn + "";
					console[tcn] = ('log' in console) ? function(){
						var a = Array.apply({}, arguments);
						a.unshift(tcn + ":");
						console["log"](a.join(" "));
					} : function(){};
					console[tcn]._fake = true;
				})();
			}
		}
	}

	has.add("dojo-debug-messages",
		// include dojo.deprecated/dojo.experimental implementations
		1
	);
	if(has("dojo-debug-messages")){
		dojo.deprecated = function(/*String*/ behaviour, /*String?*/ extra, /*String?*/ removal){
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
			//	| dojo.deprecated("myApp.getTemp()", "use myApp.getLocaleTemp() instead", "1.0");

			var message = "DEPRECATED: " + behaviour;
			if(extra){ message += " " + extra; }
			if(removal){ message += " -- will be removed in version: " + removal; }
			console.warn(message);
		};

		dojo.experimental = function(/* String */ moduleName, /* String? */ extra){
			//	summary: Marks code as experimental.
			//	description:
			//		This can be used to mark a function, file, or module as
			//		experimental.	 Experimental code is not ready to be used, and the
			//		APIs are subject to change without notice.	Experimental code may be
			//		completed deleted without going through the normal deprecation
			//		process.
			//	moduleName: String
			//		The name of a module, or the name of a module file or a specific
			//		function
			//	extra: String?
			//		some additional message for the user
			//	example:
			//	| dojo.experimental("dojo.data.Result");
			//	example:
			//	| dojo.experimental("dojo.weather.toKelvin()", "PENDING approval from NOAA");
			var message = "EXPERIMENTAL: " + moduleName + " -- APIs subject to change without notice.";
			if(extra){ message += " " + extra; }
			console.warn(message);
		};
	}else{
		dojo.deprecated = dojo.experimental = function(){};
	}


	has.add("dojo-modulePaths",
		// consume dojo.modulePaths processing
		1
	);
	if(has("dojo-modulePaths")){
		// notice that modulePaths won't be applied to any require's before the dojo/_base/kernel factory is run;
		// this is the v1.6- behavior.
		if(config.modulePaths){
			dojo.deprecated("dojo.modulePaths", "use paths configuration");
			var paths = {};
			for(p in config.modulePaths){
				paths[p.replace(/\./g, "/")] = config.modulePaths[p];
			}
			require({paths:paths});
		}
	}

	has.add("dojo-moduleUrl",
		// include dojo.moduleUrl
		1
	);
	if(has("dojo-moduleUrl")){
		dojo.moduleUrl = function(/*String*/module, /*String?*/url){
			//	summary:
			//		Returns a URL relative to a module.
			//	example:
			//	|	var pngPath = dojo.moduleUrl("acme","images/small.png");
			//	|	console.dir(pngPath); // list the object properties
			//	|	// create an image and set it's source to pngPath's value:
			//	|	var img = document.createElement("img");
			//	|	img.src = pngPath;
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

			dojo.deprecated("dojo.moduleUrl()", "use require.toUrl", "2.0");

			// require.toUrl requires a filetype; therefore, just append the suffix "/*.*" to guarantee a filetype, then
			// remove the suffix from the result. This way clients can request a url w/out a filetype. This should be
			// rare, but it maintains backcompat for the v1.x line (note: dojo.moduleUrl will be removed in v2.0).
			// Notice * is an illegal filename so it won't conflict with any real path map that may exist the paths config.
			var result = null;
			if(module){
				result = require.toUrl(module.replace(/\./g, "/") + (url ? ("/" + url) : "") + "/*.*").match(/(.+)\/\*\.\*$/)[1] + (url ? "" : "/");
			}
			return result;
		};
	}

	return dojo;
});
