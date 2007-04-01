//Cross-domain package loader.

//FIXME: How will xd loading work with debugAtAllCosts? Any bad interactions?

dojo.hostenv.resetXd = function(){
	//summary: Internal xd loader function. Resets the xd state.

	//This flag indicates where or not we have crossed into xdomain territory. Once any package says
	//it is cross domain, then the rest of the packages have to be treated as xdomain because we need
	//to evaluate packages in order. If there is a xdomain package followed by a xhr package, we can't load
	//the xhr package until the one before it finishes loading. The text of the xhr package will be converted
	//to match the format for a xd package and put in the xd load queue.
	this.isXDomain = djConfig.useXDomain || false;

	this.xdTimer = 0;
	this.xdInFlight = {};
	this.xdOrderedReqs = [];
	this.xdDepMap = {};
	this.xdContents = [];
	this.xdDefList = [];
}

//Call reset immediately to set the state.
dojo.hostenv.resetXd();

dojo.hostenv.createXdPackage = function(/*String*/contents, /*String*/resourceName, /*String=*/resourcePath){
	//summary: Internal xd loader function. Creates an xd module source given an
	//non-xd module contents.

	//Find dependencies.
	var deps = [];
    var depRegExp = /dojo.(require|requireIf|requireAll|provide|requireAfterIf|requireAfter|kwCompoundRequire|conditionalRequire|hostenv\.conditionalLoadModule|.hostenv\.loadModule|hostenv\.moduleLoaded)\(([\w\W]*?)\)/mg;
    var match;
	while((match = depRegExp.exec(contents)) != null){
		deps.push("\"" + match[1] + "\", " + match[2]);
	}

	//Create package object and the call to packageLoaded.
	var output = [];
	output.push("dojo.hostenv.packageLoaded({\n");

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
	output.push("\ndefinePackage: function(dojo){");
	output.push(contents);
	//Add isLocal property so we know if we have to do something different
	//in debugAtAllCosts situations.
	output.push("\n}, resourceName: '" + resourceName + "', resourcePath: '" + resourcePath + "'});");
	
	return output.join(""); //String
}

dojo.hostenv.loadPath = function(/*String*/relpath, /*String?*/module, /*Function?*/cb){
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
		this.isXDomain = currentIsXDomain = true;
	}else{
		uri = this.getBaseScriptUri() + relpath;

		//Is ithe base script URI-based URL a cross domain URL?
		colonIndex = uri.indexOf(":");
		slashIndex = uri.indexOf("/");
		if(colonIndex > 0 && colonIndex < slashIndex && (!location.host || uri.indexOf("http://" + location.host) != 0)){
			this.isXDomain = currentIsXDomain = true;
		}
	}

	if(djConfig.cacheBust && dojo.render.html.capable) { uri += "?" + String(djConfig.cacheBust).replace(/\W+/g,""); }
	try{
		return ((!module || this.isXDomain) ? this.loadUri(uri, cb, currentIsXDomain, module) : this.loadUriAndCheck(uri, module, cb)); //boolean
	}catch(e){
		dojo.debug(e);
		return false; //boolean
	}
}

dojo.hostenv.loadUri = function(/*String*/uri, /*Function?*/cb, /*boolean*/currentIsXDomain, /*String?*/module){
	//summary: Internal xd loader function. Overrides loadUri() from loader.js.
	//		xd loading requires slightly different behavior from loadPath().
	//description: Wanted to override getText(), but it is used by
	//		the widget code in too many, synchronous ways right now.
	if(this._loadedUrls[uri]){
		return 1; //boolean
	}

	//Add the module (package) to the list of modules.
	if(this.isXDomain){
		//If this is a __package__.js file, then this must be
		//a package.* request (since xdomain can only work with the first
		//path in a package search list. However, .* module names are not
		//passed to this function, so do an adjustment here.
		if(uri.indexOf("__package__") != -1){
			module += ".*";
		}

		this.xdOrderedReqs.push(module);

		//Add to waiting packages if it is an xdomain resource.
		if(currentIsXDomain){
			this.xdInFlight[module] = true;

			//Increment inFlightCount
			//This will stop the modulesLoaded from firing all the way.
			this.inFlightCount++;
		}

		//Start timer
		if(!this.xdTimer){
			this.xdTimer = setInterval("dojo.hostenv.watchInFlightXDomain();", 100);
		}
		this.xdStartTime = (new Date()).getTime();
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
			this.headElement = document.getElementsByTagName("head")[0];

			//Head element may not exist, particularly in html
			//html 4 or tag soup cases where the page does not
			//have a head tag in it. Use html element, since that will exist.
			//Seems to be an issue mostly with Opera 9 and to lesser extent Safari 2
			if(!this.headElement){
				this.headElement = document.getElementsByTagName("html")[0];
			}
		}
		this.headElement.appendChild(element);
	}else{
		var contents = this.getText(uri, null, true);
		if(contents == null){ return 0; /*boolean*/}
		
		//If this is not xdomain, or if loading a i18n resource bundle, then send it down
		//the normal eval/callback path.
		if(this.isXDomain && uri.indexOf("/nls/") == -1){
			var pkg = this.createXdPackage(contents, module, uri);
			dj_eval(pkg);
			//When loading local modules only, there will be no
			//modules in flight. In that case, trigger the xd
			//resolution right away. Otherwise, there are issues
			//with dojo.addOnLoad() calls added after loading only
			//local modules after the page load.
			if(this.inFlightCount == 0){
				this.watchInFlightXDomain();
			}
		}else{
			if(cb){ contents = '('+contents+')'; }
			var value = dj_eval(contents);
			if(cb){
				cb(value);
			}
		}
	}

	//These steps are done in the non-xd loader version of this function.
	//Maintain these steps to fit in with the existing system.
	this._loadedUrls[uri] = true;
	return 1; //boolean
}

dojo.hostenv.packageLoaded = function(/*Object*/pkg){
	//summary: Internal xd loader function. Called by an xd module when
	//it has been loaded via a script tag.
	var deps = pkg.depends;
	var requireList = null;
	var requireAfterList = null;
	var provideList = [];
	if(deps && deps.length > 0){
		var dep = null;
		var insertHint = 0;
		var attachedPackage = false;
		for(var i = 0; i < deps.length; i++){
			dep = deps[i];

			//Look for specific dependency indicators.
			if (dep[0] == "provide" || dep[0] == "hostenv.moduleLoaded"){
				provideList.push(dep[1]);
			}else{
				if(!requireList){
					requireList = [];
				}
				if(!requireAfterList){
					requireAfterList = [];
				}

				var unpackedDeps = this.unpackXdDependency(dep);
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

		//Save off the package contents for definition later.
		var contentIndex = this.xdContents.push({
				content: pkg.definePackage,
				resourceName: pkg["resourceName"],
				resourcePath: pkg["resourcePath"],
				isDefined: false
			}) - 1;

		//Add provide/requires to dependency map.
		for(var i = 0; i < provideList.length; i++){
			this.xdDepMap[provideList[i]] = { requires: requireList, requiresAfter: requireAfterList, contentIndex: contentIndex };
		}

		//Now update the inflight status for any provided packages in this loaded package.
		//Do this at the very end (in a *separate* for loop) to avoid shutting down the 
		//inflight timer check too soon.
		for(var i = 0; i < provideList.length; i++){
			this.xdInFlight[provideList[i]] = false;
		}
	}
}

dojo.hostenv.xdLoadFlattenedBundle = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale, /*Object*/bundleData){
	//summary: Internal xd loader function. Used when loading
	//a flattened localized bundle via a script tag.
	locale = locale || "root";
	var jsLoc = dojo.hostenv.normalizeLocale(locale).replace('-', '_');
 	var bundlePackage = [moduleName, "nls", bundleName].join(".");
	var bundle = dojo.hostenv.startPackage(bundlePackage);
	bundle[jsLoc] = bundleData;
	
	//Assign the bundle for the original locale(s) we wanted.
	var mapName = [moduleName, jsLoc, bundleName].join(".");
	var bundleMap = dojo.hostenv.xdBundleMap[mapName];
	if(bundleMap){
		for(var param in bundleMap){
			bundle[param] = bundleData;
		}
	}
};


dojo.hostenv.xdBundleMap = {};

dojo.xdRequireLocalization = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale, /*String*/availableFlatLocales){
	//summary: Internal xd loader function. The xd version of dojo.requireLocalization.
	var locales = availableFlatLocales.split(",");
	
	//Find the best-match locale to load.
	var jsLoc = dojo.hostenv.normalizeLocale(locale);

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
 	var bundlePackage = dojo.getObject([moduleName, "nls", bundleName].join("."));
	if(bundlePackage && bundlePackage[fixedBestLocale]){
		bundle[jsLoc.replace('-', '_')] = bundlePackage[fixedBestLocale];
	}else{
		//Need to remember what locale we wanted and which one we actually use.
		//Then when we load the one we are actually using, use that bundle for the one
		//we originally wanted.
		var mapName = [moduleName, (fixedBestLocale||"root"), bundleName].join(".");
		var bundleMap = dojo.hostenv.xdBundleMap[mapName];
		if(!bundleMap){
			bundleMap = dojo.hostenv.xdBundleMap[mapName] = {};
		}
		bundleMap[jsLoc.replace('-', '_')] = true;
		
		//Do just a normal dojo.require so the package tracking stuff works as usual.
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
//since scripts can load whenever they want, and trigger new calls to dojo.hostenv.packageLoaded().
dojo.hostenv.unpackXdDependency = function(dep){
	//summary: Internal xd loader function. Determines what to do with a dependency
	//that was listed in an xd version of a module contents.

	//Extract the dependency(ies).
	var newDeps = null;
	var newAfterDeps = null;
	switch(dep[0]){
		case "requireIf":
		case "requireAfterIf":
		case "conditionalRequire":
			//First arg (dep[1]) is the test. Depedency is dep[2].
			if((dep[1] === true)||(dep[1]=="common")||(dep[1] && dojo.render[dep[1]].capable)){
				newDeps = [{name: dep[2], content: null}];
			}
			break;
		case "requireAll":
			//the arguments are an array, each element a call to require.
			//Get rid of first item, which is "requireAll".
			dep.shift();
			newDeps = dep;
			dojo.hostenv.flattenRequireArray(newDeps);
			break;
		case "kwCompoundRequire":
		case "hostenv.conditionalLoadModule":
			var modMap = dep[1];
			var common = modMap["common"]||[];
			var newDeps = (modMap[dojo.hostenv.name_]) ? common.concat(modMap[dojo.hostenv.name_]||[]) : common.concat(modMap["default"]||[]);	
			dojo.hostenv.flattenRequireArray(newDeps);
			break;
		case "require":
		case "requireAfter":
		case "hostenv.loadModule":
			//Just worry about dep[1]
			newDeps = [{name: dep[1], content: null}];
			break;
	}

	//The requireAfterIf or requireAfter needs to be evaluated after the current package is evaluated.
	if(dep[0] == "requireAfterIf" || dep[0] == "requireIf"){
		newAfterDeps = newDeps;
		newDeps = null;
	}
	return {requires: newDeps, requiresAfter: newAfterDeps}; //Object
}

dojo.hostenv.xdWalkReqs = function(){
	//summary: Internal xd loader function. 
	//Walks the requires and evaluates package contents in
	//the right order.
	var reqChain = null;
	var req;
	for(var i = 0; i < this.xdOrderedReqs.length; i++){
		req = this.xdOrderedReqs[i];
		if(this.xdDepMap[req]){
			reqChain = [req];
			reqChain[req] = true; //Allow for fast lookup of the req in the array
			this.xdEvalReqs(reqChain);
		}
	}
}

dojo.hostenv.xdEvalReqs = function(/*Array*/reqChain){
	//summary: Internal xd loader function. 
	//Does a depth first, breadth second search and eval of required modules.
	while(reqChain.length > 0){
		var req = reqChain[reqChain.length - 1];
		var pkg = this.xdDepMap[req];
		if(pkg){
			//Trace down any requires for this package.
			//START dojo.hostenv.xdTraceReqs() inlining for small Safari 2.0 call stack
			var reqs = pkg.requires;
			if(reqs && reqs.length > 0){
				var nextReq;
				for(var i = 0; i < reqs.length; i++){
					nextReq = reqs[i].name;
					if(nextReq && !reqChain[nextReq]){
						//New req depedency. Follow it down.
						reqChain.push(nextReq);
						reqChain[nextReq] = true;
						this.xdEvalReqs(reqChain);
					}
				}
			}
			//END dojo.hostenv.xdTraceReqs() inlining for small Safari 2.0 call stack

			//Evaluate the package.
			var contents = this.xdContents[pkg.contentIndex];
			if(!contents.isDefined){
				var content = contents.content;
				content["resourceName"] = contents["resourceName"];
				content["resourcePath"] = contents["resourcePath"];
				this.xdDefList.push(content);
				contents.isDefined = true;
			}
			this.xdDepMap[req] = null;

			//Trace down any requireAfters for this package.
			//START dojo.hostenv.xdTraceReqs() inlining for small Safari 2.0 call stack
			var reqs = pkg.requiresAfter;
			if(reqs && reqs.length > 0){
				var nextReq;
				for(var i = 0; i < reqs.length; i++){
					nextReq = reqs[i].name;
					if(nextReq && !reqChain[nextReq]){
						//New req depedency. Follow it down.
						reqChain.push(nextReq);
						reqChain[nextReq] = true;
						this.xdEvalReqs(reqChain);
					}
				}
			}
			//END dojo.hostenv.xdTraceReqs() inlining for small Safari 2.0 call stack
		}

		//Done with that require. Remove it and go to the next one.
		reqChain.pop();
	}
}

dojo.hostenv.clearXdInterval = function(){
	//summary: Internal xd loader function.
	//Clears the interval timer used to check on the
	//status of in-flight xd module resource requests.
	clearInterval(this.xdTimer);
	this.xdTimer = 0;
}

dojo.hostenv.watchInFlightXDomain = function(){
	//summary: Internal xd loader function.
	//Monitors in-flight requests for xd module resources.

	//Make sure we haven't waited timed out.
	var waitInterval = (djConfig.xdWaitSeconds || 15) * 1000;

	if(this.xdStartTime + waitInterval < (new Date()).getTime()){
		this.clearXdInterval();
		var noLoads = "";
		for(var param in this.xdInFlight){
			if(this.xdInFlight[param]){
				noLoads += param + " ";
			}
		}
		dojo.raise("Could not load cross-domain packages: " + noLoads);
	}

	//If any are true, then still waiting.
	//Come back later.	
	for(var param in this.xdInFlight){
		if(this.xdInFlight[param]){
			return;
		}
	}

	//All done loading. Clean up and notify that we are loaded.
	this.clearXdInterval();

	this.xdWalkReqs();
	
	var defLength = this.xdDefList.length;
	for(var i= 0; i < defLength; i++){
		var content = dojo.hostenv.xdDefList[i];
		if(djConfig["debugAtAllCosts"] && content["resourceName"]){
			if(!this["xdDebugQueue"]){
				this.xdDebugQueue = [];
			}
			this.xdDebugQueue.push({resourceName: content.resourceName, resourcePath: content.resourcePath});
		}else{
			//Evaluate the package to bring it into being.
			//Pass dojo in so that later, to support multiple versions of dojo
			//in a page, we can pass which version of dojo to use.			
			content(dojo);
		}
	}

	//Evaluate any packages that were not evaled before.
	//This normally shouldn't happen with proper dojo.provide and dojo.require
	//usage, but providing it just in case. Note that these may not be executed
	//in the original order that the developer intended.
	//Pass dojo in so that later, to support multiple versions of dojo
	//in a page, we can pass which version of dojo to use.
	for(var i = 0; i < this.xdContents.length; i++){
		var current = this.xdContents[i];
		if(current.content && !current.isDefined){
			current.content(dojo);
		}
	}

	//Clean up for the next round of xd loading.
	this.resetXd();

	if(this["xdDebugQueue"] && this.xdDebugQueue.length > 0){
		this.xdDebugFileLoaded();
	}else{
		this.xdNotifyLoaded();
	}
}

dojo.hostenv.xdNotifyLoaded = function(){
	//Clear inflight count so we will finally do finish work.
	this.inFlightCount = 0; 
	this.callLoaded();
}

dojo.hostenv.flattenRequireArray = function(/*Array*/target){
	//summary: Internal xd loader function.
	//Flattens an array of arrays into a one-level deep array.

	//Each result could be an array of 3 elements  (the 3 arguments to dojo.require).
	//We only need the first one.
	if(target){
		for(var i = 0; i < target.length; i++){
			if(target[i] instanceof Array){
				target[i] = {name: target[i][0], content: null};
			}else{
				target[i] = {name: target[i], content: null};
			}
		}
	}
}


dojo.hostenv.xdHasCalledPreload = false;
dojo.hostenv.xdRealCallLoaded = dojo.hostenv.callLoaded;
dojo.hostenv.callLoaded = function(){
	//summary: Internal xd loader function. Overrides callLoaded() from loader.js
	//description: The method is overridden because xd loading needs to preload 
	//any flattened i18n bundles before dojo starts executing code, 
	//since xd loading cannot do it synchronously, as the i18n code normally expects.

	//If getModulePrefix for dojo returns anything other than "src", that means
	//there is a path registered for dojo, with implies that dojo was xdomain loaded.
	if(this.xdHasCalledPreload || dojo.hostenv.getModulePrefix("dojo") == "src" || !this.localesGenerated){
		this.xdRealCallLoaded();
		this.xdHasCalledPreload = true;
	}else{
		if(this.localesGenerated){
			this.registerNlsPrefix = function(){
				//Need to set the nls prefix to be the xd location.
				dojo.registerModulePath("nls", dojo.hostenv.getModulePrefix("dojo") + "/../nls");	
			};
			this.preloadLocalizations();
		}
		this.xdHasCalledPreload = true;
	}
}
