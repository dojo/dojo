// AMD module id = dojo/lib/backCompat
// 
// This module defines those dojo properties/methods that are defined by 
// dojo/_base/_loader/loader and are still needed when loading with and
// AMD loader (when loading with an AMD loader, dojo/_base/_loader/loader
// is never loaded).
// 
// note: this module is relevant only when loading dojo with an AMD loader; 
// it is never evaluated otherwise.

define(["require", "dojo/_base/_loader/bootstrap"], function(require, dojo){

	// the following dojo properties do not exist in the AMD-loaded version of dojo 1.x:
	var names= [
		"_loadedModules",
		"_inFlightCount",
		"_hasResource",
		"_modulePrefixes",
		"_moduleHasPrefix",
		"_loadedUrls",
		"_loadNotifying",
		"_loadPath",
		"_loadUri",
		"_loadUriAndCheck",
		"loaded",
		"_callLoaded",
		"_getModuleSymbols",
		"_loadModule",
		"require",
		"provide",
		"platformRequire",
		"requireIf",
		"requireAfterIf",
		"registerModulePath"
	], i, name;
	for(i = 0; i<names.length;){
		name = names[i++];
		dojo[name] = function(){console.warn("dojo." + name + " not available when using an AMD loader.");};
	}

	// define dojo.addOnLoad in terms of the DOMContentLoaded detection available from
  // the AMD loaders (requirejs and bdBuild).
  // TODO: consider taking ownership of this API back from the loader
	var simpleHitch = function(context, callback){
		if(callback){
			return (typeof callback=="string") ?
				function(){context[callback]();} :
				function(){callback.call(context);};
		}else{
			return context;
		}
	};

	dojo.ready = dojo.addOnLoad = function(context, callback){
		require.ready(callback ? simpleHitch(context, callback) : context);
	};

	dojo.addOnLoad(function() {
		dojo.postLoad = dojo.config.afterOnLoad= true;
	});

	var dca = dojo.config.addOnLoad;
	if(dca){
		dojo.addOnLoad[(dca instanceof Array ? "apply" : "call")](dojo, dca);
	}


	// dojo._loaders are manipulated directly by dojo/uacss, dojo/parser, dijit/_base/wia (and others in dojox)
	// TODO: these gross kludges should be fixed in favor of using only dojo.addOnLoad
	var 
		argsToArray = function(args) {
			var result = [], i;
			for (i = 0; i<args.length; result.push(args[i++]));
			return result;
		},

		loaders = dojo._loaders = [],
		runLoaders = function(){
			if (loaders.length) {
				loaders.shift().call();
				require.ready(runLoaders);
			};
		};
	require.ready(runLoaders);
	loaders.unshift = function() {
		Array.prototype.unshift.apply(loaders, argsToArray(arguments));
		require.ready(runLoaders);
	};
	loaders.splice = function() {
		Array.prototype.splice.apply(loaders, argsToArray(arguments));
		require.ready(runLoaders);
	};

	//TODO: put unload handling in a separate module
	var unloaders = dojo._unloaders = [];
	dojo.unloaded = function(){
		while(unloaders.length){
			(unloaders.pop())();
		}
	};

	//TODO: kill this low-value function when it is exorcised from dojo
	dojo._onto = function(arr, obj, fn){
		arr.push(fn ? simpleHitch(obj, fn) : obj);
	};

	//TODO: kill this when the bootstrap is rewritten to not include DOMContentLoaded detection
	// (it should probably be just a module) for now, just sink the detection; leverage the
  // AMD loaders to handle DOMContentLoaded detection
	dojo._modulesLoaded = function(){};

	//TODO: kill this when we understand its purpose relative to AMD
	dojo.loadInit = function(init){
		init();
	};

	var amdModuleName= function(moduleName){
		return moduleName.replace(/\./g, "/");
	};

	dojo.getL10nName = function(moduleName, bundleName, locale){
		locale = locale ? locale.toLowerCase() : dojo.locale;
		moduleName = "i18n!" + amdModuleName(moduleName);
		return (/root/i.test(locale)) ?
			(moduleName + "/" + bundleName) :
			(moduleName + "/nls"	 + locale + "/" + bundleName);
	};

	dojo.requireLocalization = function(moduleName, bundleName, locale){
		return require(dojo.getL10nName(moduleName, bundleName, locale));
	};

  //TODO: dojo._Url seems rarely used and long to be part of the boostrap; consider moving
  //note: this routine cut and paste from dojo/_base/_loader/loader
	var 
		ore = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$"),
		ire = new RegExp("^((([^\\[:]+):)?([^@]+)@)?(\\[([^\\]]+)\\]|([^\\[:]*))(:([0-9]+))?$");
	dojo._Url = function(){
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
		this.fragment	 = r[9] || (r[8] ? "" : n);

		if(this.authority != n){
			// server based naming authority
			r = this.authority.match(ire);

			this.user = r[3] || n;
			this.password = r[4] || n;
			this.host = r[6] || r[7]; // ipv6 || ipv4
			this.port = r[9] || n;
		}
	};

	dojo._Url.prototype.toString = function(){ return this.uri; };

	dojo.moduleUrl= function(module, url){
		if(!module){
		 //TODO: don't understand why this would ever be so, but that's the logic in loader
		 return null; 
		}
		module = amdModuleName(module);
		if(module.lastIndexOf("/") != module.length-1){
			module+= "/";
		}
		return new dojo._Url(require.nameToUrl(module + (url || ""))); // dojo._Url
	};

	return dojo;
});
