//Cross-domain resource loader.

dojo._xdReset = function(){
	//summary: Internal xd loader function. Resets the xd state.

	//This flag indicates where or not we have crossed into xdomain territory. Once any resource says
	//it is cross domain, then the rest of the resources have to be treated as xdomain because we need
	//to evaluate resources in order. If there is a xdomain resource followed by a xhr resource, we can't load
	//the xhr resource until the one before it finishes loading. The text of the xhr resource will be converted
	//to match the format for a xd resource and put in the xd load queue.
	this._isXDomain = djConfig.useXDomain || false;

	this._xdTimer = 0;
	this._xdInFlight = {};
	this._xdOrderedReqs = [];
	this._xdDepMap = {};
	this._xdContents = [];
	this._xdDefList = [];
}

//Call reset immediately to set the state.
dojo._xdReset();

dojo._xdCreateResource = function(/*String*/contents, /*String*/resourceName, /*String*/resourcePath){
	//summary: Internal xd loader function. Creates an xd module source given an
	//non-xd module contents.

	//Find dependencies.
	var deps = [];
    var depRegExp = /dojo.(require|requireIf|provide|requireAfterIf|platformRequire|requireLocalization)\(([\w\W]*?)\)/mg;
    var match;
	while((match = depRegExp.exec(contents)) != null){
		//In xd case, need to load dojo.i18n up front in order for requireLocalization
		//calls to work.
		//FIXME: There is a whole in this scheme: if a local module tries to do
		//a dojo.requireLocalization on an xd i18n bundle.
		if(match[1] == "requireLocalization"){
			deps.push('"require", "dojo.i18n"');
		}else{
			deps.push('"' + match[1] + '", ' + match[2]);
		}
	}

	//Create resource object and the call to _xdResourceLoaded.
	var output = [];
	output.push("dojo._xdResourceLoaded({\n");

	//Add dependencies
	if(deps.length > 0){
		output.push("depends: [");
		for(var i = 0; i < deps.length; i++){
			if(i > 0){
				output.push(",\n");
			}
			output.push("[" + deps[i] + "]");
		}
		output.push("],");
	}

	//Add the contents of the file inside a function.
	//Pass in dojo as an argument to the function to help with
	//allowing multiple versions of dojo in a page.
	output.push("\ndefineResource: function(dojo){");
	output.push(contents);
	//Add isLocal property so we know if we have to do something different
	//in debugAtAllCosts situations.
	output.push("\n}, resourceName: '" + resourceName + "', resourcePath: '" + resourcePath + "'});");
	
	return output.join(""); //String
}

dojo._loadPath = function(/*String*/relpath, /*String?*/module, /*Function?*/cb){
	//summary: Internal xd loader function. Overrides loadPath() from loader.js.
	//xd loading requires slightly different behavior from loadPath().


	//Only do getBaseScriptUri if path does not start with a URL with a protocol.
	//If there is a colon before the first / then, we have a URL with a protocol.
	var colonIndex = relpath.indexOf(":");
	var slashIndex = relpath.indexOf("/");
	var uri;
	var currentIsXDomain = false;
	if(colonIndex > 0 && colonIndex < slashIndex){
		uri = relpath;
		this._isXDomain = currentIsXDomain = true;
	}else{
		uri = this.baseUrl + relpath;

		//Is ithe base script URI-based URL a cross domain URL?
		colonIndex = uri.indexOf(":");
		slashIndex = uri.indexOf("/");
		if(colonIndex > 0 && colonIndex < slashIndex && (!location.host || uri.indexOf("http://" + location.host) != 0)){
			this._isXDomain = currentIsXDomain = true;
		}
	}

	if(djConfig.cacheBust && dojo.isBrowser) { uri += "?" + String(djConfig.cacheBust).replace(/\W+/g,""); }
	try{
		return ((!module || this._isXDomain) ? this._loadUri(uri, cb, currentIsXDomain, module) : this._loadUriAndCheck(uri, module, cb)); //Boolean
	}catch(e){
		console.debug(e);
		return false; //Boolean
	}
}

dojo._loadUri = function(/*String*/uri, /*Function?*/cb, /*boolean*/currentIsXDomain, /*String?*/module){
	//summary: Internal xd loader function. Overrides loadUri() from loader.js.
	//		xd loading requires slightly different behavior from loadPath().
	//description: Wanted to override getText(), but it is used by
	//		the widget code in too many, synchronous ways right now.
	if(this._loadedUrls[uri]){
		return 1; //Boolean
	}

	//Add the module (resource) to the list of modules.
	if(this._isXDomain){
		//If this is a __package__.js file, then this must be
		//a package.* request (since xdomain can only work with the first
		//path in a package search list. However, .* module names are not
		//passed to this function, so do an adjustment here.
		if(uri.indexOf("__package__") != -1){
			module += ".*";
		}

		this._xdOrderedReqs.push(module);

		//Add to waiting resources if it is an xdomain resource.
		//Don't add non-xdomain i18n bundles, those get evaled immediately.
		if(currentIsXDomain || uri.indexOf("/nls/") == -1){
			this._xdInFlight[module] = true;

			//Increment inFlightCount
			//This will stop the modulesLoaded from firing all the way.
			this._inFlightCount++;
		}

		//Start timer
		if(!this._xdTimer){
			this._xdTimer = setInterval("dojo._xdWatchInFlight();", 100);
		}
		this._xdStartTime = (new Date()).getTime();
	}

	if (currentIsXDomain){
		//Fix name to be a .xd.fileextension name.
		var lastIndex = uri.lastIndexOf('.');
		if(lastIndex <= 0){
			lastIndex = uri.length - 1;
		}

		var xdUri = uri.substring(0, lastIndex) + ".xd";
		if(lastIndex != uri.length - 1){
			xdUri += uri.substring(lastIndex, uri.length);
		}

		//Add to script src
		var element = document.createElement("script");
		element.type = "text/javascript";
		element.src = xdUri;
		if(!this.headElement){
			this._headElement = document.getElementsByTagName("head")[0];

			//Head element may not exist, particularly in html
			//html 4 or tag soup cases where the page does not
			//have a head tag in it. Use html element, since that will exist.
			//Seems to be an issue mostly with Opera 9 and to lesser extent Safari 2
			if(!this._headElement){
				this._headElement = document.getElementsByTagName("html")[0];
			}
		}
		this._headElement.appendChild(element);
	}else{
		var contents = this._getText(uri, null, true);
		if(contents == null){ return 0; /*boolean*/}
		
		//If this is not xdomain, or if loading a i18n resource bundle, then send it down
		//the normal eval/callback path.
		if(this._isXDomain && uri.indexOf("/nls/") == -1){
			var res = this._xdCreateResource(contents, module, uri);
			dojo.eval(res);
		}else{
			if(cb){ contents = '('+contents+')'; }
			var value = dojo.eval(contents);
			if(cb){
				cb(value);
			}
		}
	}

	//These steps are done in the non-xd loader version of this function.
	//Maintain these steps to fit in with the existing system.
	this._loadedUrls[uri] = true;
	this._loadedUrls.push(uri);
	return true; //Boolean
}

dojo._xdResourceLoaded = function(/*Object*/res){
	//summary: Internal xd loader function. Called by an xd module resource when
	//it has been loaded via a script tag.
	var deps = res.depends;
	var requireList = null;
	var requireAfterList = null;
	var provideList = [];
	if(deps && deps.length > 0){
		var dep = null;
		var insertHint = 0;
		var attachedResource = false;
		for(var i = 0; i < deps.length; i++){
			dep = deps[i];

			//Look for specific dependency indicators.
			if (dep[0] == "provide"){
				provideList.push(dep[1]);
			}else{
				if(!requireList){
					requireList = [];
				}
				if(!requireAfterList){
					requireAfterList = [];
				}

				var unpackedDeps = this._xdUnpackDependency(dep);
				if(unpackedDeps.requires){
					requireList = requireList.concat(unpackedDeps.requires);
				}
				if(unpackedDeps.requiresAfter){
					requireAfterList = requireAfterList.concat(unpackedDeps.requiresAfter);
				}
			}

			//Call the dependency indicator to allow for the normal dojo setup.
			//Only allow for one dot reference, for the hostenv.* type calls.
			var depType = dep[0];
			var objPath = depType.split(".");
			if(objPath.length == 2){
				dojo[objPath[0]][objPath[1]].apply(dojo[objPath[0]], dep.slice(1));
			}else{
				dojo[depType].apply(dojo, dep.slice(1));
			}
		}

		//Save off the resource contents for definition later.
		var contentIndex = this._xdContents.push({
				content: res.defineResource,
				resourceName: res["resourceName"],
				resourcePath: res["resourcePath"],
				isDefined: false
			}) - 1;

		//Add provide/requires to dependency map.
		for(var i = 0; i < provideList.length; i++){
			this._xdDepMap[provideList[i]] = { requires: requireList, requiresAfter: requireAfterList, contentIndex: contentIndex };
		}

		//Now update the inflight status for any provided resources in this loaded resource.
		//Do this at the very end (in a *separate* for loop) to avoid shutting down the 
		//inflight timer check too soon.
		for(var i = 0; i < provideList.length; i++){
			this._xdInFlight[provideList[i]] = false;
		}
	}
}

dojo._xdLoadFlattenedBundle = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale, /*Object*/bundleData){
	//summary: Internal xd loader function. Used when loading
	//a flattened localized bundle via a script tag.
	locale = locale || "root";
	var jsLoc = dojo.i18n.normalizeLocale(locale).replace('-', '_');
 	var bundleResource = [moduleName, "nls", bundleName].join(".");
	var bundle = dojo["provide"](bundleResource);
	bundle[jsLoc] = bundleData;
	
	//Assign the bundle for the original locale(s) we wanted.
	var mapName = [moduleName, jsLoc, bundleName].join(".");
	var bundleMap = dojo._xdBundleMap[mapName];
	if(bundleMap){
		for(var param in bundleMap){
			bundle[param] = bundleData;
		}
	}
};


dojo._xdBundleMap = {};

//FIXME: since the i18n functions are not part of base, we need to store up
//the xdRequireLocalization calls until it is loaded. Put the dojo.i18n loading
//on a fast path load (eval it as soon as we get the _xdResourceLoaded call).
//This will be OK since dojo.i18n does not depend on any other modules.
//What about local modules that are loaded via eval? they want dojo.i18n to be
//available right away? No, we still do dependency resolution on them before
//evaling them.
dojo.xdRequireLocalization = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale, /*String*/availableFlatLocales){
	//summary: Internal xd loader function. The xd version of dojo.requireLocalization.
	var locales = availableFlatLocales.split(",");
	
	//Find the best-match locale to load.
	//FIXME: this call will likely fail since dojo.i18n is not loaded by default.
	//hold on to the calls until dojo.i18n is loaded.
	var jsLoc = dojo.i18n.normalizeLocale(locale);

	var bestLocale = "";
	for(var i = 0; i < locales.length; i++){
		//Locale must match from start of string.
		if(jsLoc.indexOf(locales[i]) == 0){
			if(locales[i].length > bestLocale.length){
				bestLocale = locales[i];
			}
		}
	}

	var fixedBestLocale = bestLocale.replace('-', '_');
	//See if the bundle we are going to use is already loaded.
 	var bundleResource = dojo.getObject([moduleName, "nls", bundleName].join("."));
	if(bundleResource && bundleResource[fixedBestLocale]){
		bundle[jsLoc.replace('-', '_')] = bundleResource[fixedBestLocale];
	}else{
		//Need to remember what locale we wanted and which one we actually use.
		//Then when we load the one we are actually using, use that bundle for the one
		//we originally wanted.
		var mapName = [moduleName, (fixedBestLocale||"root"), bundleName].join(".");
		var bundleMap = dojo._xdBundleMap[mapName];
		if(!bundleMap){
			bundleMap = dojo._xdBundleMap[mapName] = {};
		}
		bundleMap[jsLoc.replace('-', '_')] = true;
		
		//Do just a normal dojo.require so the resource tracking stuff works as usual.
		dojo.require(moduleName + ".nls" + (bestLocale ? "." + bestLocale : "") + "." + bundleName);
	}
}

;(function(){
	// Simulate the extra locale work that dojo.requireLocalization does.

	var extra = djConfig.extraLocale;
	if(extra){
		if(!extra instanceof Array){
			extra = [extra];
		}

		dojo._xdReqLoc = dojo.xdRequireLocalization;
		dojo.xdRequireLocalization = function(m, b, locale, fLocales){
			dojo._xdReqLoc(m,b,locale, fLocales);
			if(locale){return;}
			for(var i=0; i<extra.length; i++){
				dojo._xdReqLoc(m,b,extra[i], fLocales);
			}
		};
	}
})();


//This is a bit brittle: it has to know about the dojo methods that deal with dependencies
//It would be ideal to intercept the actual methods and do something fancy at that point,
//but I have concern about knowing which provide to match to the dependency in that case,
//since scripts can load whenever they want, and trigger new calls to dojo._xdResourceLoaded().
dojo._xdUnpackDependency = function(dep){
	//summary: Internal xd loader function. Determines what to do with a dependency
	//that was listed in an xd version of a module contents.

	//Extract the dependency(ies).
	var newDeps = null;
	var newAfterDeps = null;
	switch(dep[0]){
		case "requireIf":
		case "requireAfterIf":
			//First arg (dep[1]) is the test. Depedency is dep[2].
			if((dep[1] === true)||(dep[1]=="common")||(dep[1] && dojo.render[dep[1]].capable)){
				newDeps = [{name: dep[2], content: null}];
			}
			break;
		case "platformRequire":
			var modMap = dep[1];
			var common = modMap["common"]||[];
			var newDeps = (modMap[dojo.hostenv.name_]) ? common.concat(modMap[dojo.hostenv.name_]||[]) : common.concat(modMap["default"]||[]);	
			//Flatten the array of arrays into a one-level deep array.
			//Each result could be an array of 3 elements  (the 3 arguments to dojo.require).
			//We only need the first one.
			if(newDeps){
				for(var i = 0; i < newDeps.length; i++){
					if(newDeps[i] instanceof Array){
						newDeps[i] = {name: newDeps[i][0], content: null};
					}else{
						newDeps[i] = {name: newDeps[i], content: null};
					}
				}
			}
			break;
		case "require":
			//Just worry about dep[1]
			newDeps = [{name: dep[1], content: null}];
			break;
	}

	//The requireIf and requireAfterIf needs to be evaluated after the current resource is evaluated.
	if(dep[0] == "requireAfterIf" || dep[0] == "requireIf"){
		newAfterDeps = newDeps;
		newDeps = null;
	}
	return {requires: newDeps, requiresAfter: newAfterDeps}; //Object
}

dojo._xdWalkReqs = function(){
	//summary: Internal xd loader function. 
	//Walks the requires and evaluates module resource contents in
	//the right order.
	var reqChain = null;
	var req;
	for(var i = 0; i < this._xdOrderedReqs.length; i++){
		req = this._xdOrderedReqs[i];
		if(this._xdDepMap[req]){
			reqChain = [req];
			reqChain[req] = true; //Allow for fast lookup of the req in the array
			this._xdEvalReqs(reqChain);
		}
	}
}

dojo._xdEvalReqs = function(/*Array*/reqChain){
	//summary: Internal xd loader function. 
	//Does a depth first, breadth second search and eval of required modules.
	while(reqChain.length > 0){
		var req = reqChain[reqChain.length - 1];
		var res = this._xdDepMap[req];
		if(res){
			//Trace down any requires for this resource.
			//START dojo._xdTraceReqs() inlining for small Safari 2.0 call stack
			var reqs = res.requires;
			if(reqs && reqs.length > 0){
				var nextReq;
				for(var i = 0; i < reqs.length; i++){
					nextReq = reqs[i].name;
					if(nextReq && !reqChain[nextReq]){
						//New req depedency. Follow it down.
						reqChain.push(nextReq);
						reqChain[nextReq] = true;
						this._xdEvalReqs(reqChain);
					}
				}
			}
			//END dojo._xdTraceReqs() inlining for small Safari 2.0 call stack

			//Evaluate the resource.
			var contents = this._xdContents[res.contentIndex];
			if(!contents.isDefined){
				var content = contents.content;
				content["resourceName"] = contents["resourceName"];
				content["resourcePath"] = contents["resourcePath"];
				this._xdDefList.push(content);
				contents.isDefined = true;
			}
			this._xdDepMap[req] = null;

			//Trace down any requireAfters for this resource.
			//START dojo._xdTraceReqs() inlining for small Safari 2.0 call stack
			var reqs = res.requiresAfter;
			if(reqs && reqs.length > 0){
				var nextReq;
				for(var i = 0; i < reqs.length; i++){
					nextReq = reqs[i].name;
					if(nextReq && !reqChain[nextReq]){
						//New req depedency. Follow it down.
						reqChain.push(nextReq);
						reqChain[nextReq] = true;
						this._xdEvalReqs(reqChain);
					}
				}
			}
			//END dojo._xdTraceReqs() inlining for small Safari 2.0 call stack
		}

		//Done with that require. Remove it and go to the next one.
		reqChain.pop();
	}
}

dojo._xdClearInterval = function(){
	//summary: Internal xd loader function.
	//Clears the interval timer used to check on the
	//status of in-flight xd module resource requests.
	clearInterval(this._xdTimer);
	this._xdTimer = 0;
}

dojo._xdWatchInFlight = function(){
	//summary: Internal xd loader function.
	//Monitors in-flight requests for xd module resources.

	//Make sure we haven't waited timed out.
	var waitInterval = (djConfig.xdWaitSeconds || 15) * 1000;

	if(this._xdStartTime + waitInterval < (new Date()).getTime()){
		this._xdClearInterval();
		var noLoads = "";
		for(var param in this._xdInFlight){
			if(this._xdInFlight[param]){
				noLoads += param + " ";
			}
		}
		throw "Could not load cross-domain resources: " + noLoads;
	}

	//If any are true, then still waiting.
	//Come back later.	
	for(var param in this._xdInFlight){
		if(this._xdInFlight[param]){
			return;
		}
	}

	//All done loading. Clean up and notify that we are loaded.
	this._xdClearInterval();

	this._xdWalkReqs();
	
	var defLength = this._xdDefList.length;
	for(var i= 0; i < defLength; i++){
		var content = dojo._xdDefList[i];
		if(djConfig["debugAtAllCosts"] && content["resourceName"]){
			if(!this["_xdDebugQueue"]){
				this._xdDebugQueue = [];
			}
			this._xdDebugQueue.push({resourceName: content.resourceName, resourcePath: content.resourcePath});
		}else{
			//Evaluate the resource to bring it into being.
			//Pass dojo in so that later, to support multiple versions of dojo
			//in a page, we can pass which version of dojo to use.			
			content(dojo);
		}
	}

	//Evaluate any resources that were not evaled before.
	//This normally shouldn't happen with proper dojo.provide and dojo.require
	//usage, but providing it just in case. Note that these may not be executed
	//in the original order that the developer intended.
	//Pass dojo in so that later, to support multiple versions of dojo
	//in a page, we can pass which version of dojo to use.
	for(var i = 0; i < this._xdContents.length; i++){
		var current = this._xdContents[i];
		if(current.content && !current.isDefined){
			current.content(dojo);
		}
	}

	//Clean up for the next round of xd loading.
	this._xdReset();

	if(this["_xdDebugQueue"] && this._xdDebugQueue.length > 0){
		this.xdDebugFileLoaded();
	}else{
		this._xdNotifyLoaded();
	}
}

dojo._xdNotifyLoaded = function(){
	//Clear inflight count so we will finally do finish work.
	this._inFlightCount = 0; 
	this._callLoaded();
}

dojo._xdHasCalledPreload = false;
dojo._xdRealCallLoaded = dojo._callLoaded;
dojo._callLoaded = function(){
	//summary: Internal xd loader function. Overrides _callLoaded() from loader.js
	//description: The method is overridden because xd loading needs to preload 
	//any flattened i18n bundles before dojo starts executing code, 
	//since xd loading cannot do it synchronously, as the i18n code normally expects.

	//If _getModulePrefix for dojo returns something with a colon in it, that means
	//there is an xdomain path registered for dojo.
	if(this._xdHasCalledPreload
		|| dojo._getModulePrefix("dojo").indexOf(":") != -1
		|| !dojo["i18n"]
		|| !dojo.i18n._localesGenerated){
		this._xdRealCallLoaded();
		this._xdHasCalledPreload = true;
	}else{
		if(dojo.i18n._localesGenerated){
			dojo.i18n.registerNlsPath = function(){
				//Need to set the nls prefix to be the xd location.
				//FIXME: can we just get away with using the line below in dojo.i18n
				//and forget the registerNlsPath overriding? Need to test with non-xd cases first.
				dojo.registerModulePath("nls", dojo._getModulePrefix("dojo") + "/nls");	
			};
			dojo.i18n.preloadLocalizations();
		}
		this._xdHasCalledPreload = true;
	}
}
