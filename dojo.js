// summary:
//		This is the "source loader" for Dojo. This dojo.js ensures that all
//		Base APIs are available once its execution is complete and attempts to
//		automatically determine the correct host environment to use.
// description:
//		"dojo.js" is the basic entry point into the toolkit for all uses and
//		users. The "source loader" is replaced by environment-specific builds
//		and so you should not assume that built versions of the toolkit will
//		function in all supported platforms (Browsers, Rhino, Spidermonkey,
//		etc.). In most cases, users will receive pre-built dojo.js files which
//		contain all of the Base APIs in a single file and which specialize for
//		the Browser platform. After loading dojo.js, you will be able to do the
//		following with the toolkit:
//			All platforms:
//				- load other packages (dojo core, dijit, dojox, and custom
//				  modules) to better structure your code and take advantage of
//				  the inventive capabilities developed by the broad Dojo
//				  community
//				- perform basic network I/O
//				- use Dojo's powerful language supplementing APIs
//				- take advantage of the Dojo event system to better structure
//				  your application
//			Browser only:
//				- use Dojo's powerful and blisteringly-fast CSS query engine to
//				  upgrade and active your web pages without embedding
//				  JavaScript in your markup
//				- get and set accurate information about element style
//				- shorten the time it takes to build and manipulate DOM
//				  structures with Dojo's HTML handling APIs
//				- create more fluid UI transitions with Dojo's robust and
//				  battle-tested animation facilities

// NOTE:
//		If you are reading this file, you have received a "source" build of
//		Dojo. Unless you are a Dojo developer, it is very unlikely that this is
//		what you want. While functionally identical to builds, source versions
//		of Dojo load more slowly than pre-processed builds.
//
//		We strongly recommend that your applications always use a build of
//		Dojo. To download such a build or find out how you can create
//		customized, high-performance packages of Dojo suitable for use with
//		your application, please visit:
//
//			http://dojotoolkit.org
//
//		Regards,
//		The Dojo Team

if(typeof dojo == "undefined"){
	// only try to load Dojo if we don't already have one. Dojo always follows
	// a "first Dojo wins" policy.
	(function(){
		var getRootNode = function(){
			// attempt to figure out the path to dojo if it isn't set in the config
			if(this["document"] && this["document"]["getElementsByTagName"]){
				var scripts = document.getElementsByTagName("script");
				var rePkg = /dojo\.js(\W|$)/i;
				for(var i = 0; i < scripts.length; i++){
					var src = scripts[i].getAttribute("src");
					if(!src){ continue; }
					var m = src.match(rePkg);
					if(m){
						return {
							node: scripts[i],
							root: src.substring(0, m.index)
						};
						/*
						root = src.substring(0, m.index);
						if(!this["djConfig"]){ djConfig = {}; }
						djConfig["baseUrl"] = root;
						break;
						*/
					}
				}
			}
		}

		// we default to a browser environment if we can't figure it out
		var hostEnv = "browser", cfg = "dojoConfig";
		
		 // FIXME, 2.0: remove backwards compat djConfig global
		if(typeof this[cfg] === "undefined" && typeof djConfig !== "undefined"){
			this[cfg] = djConfig;
		}
		if(typeof dojoConfig !== "undefined" && dojoConfig.hostEnv){
			hostEnv = dojoConfig.hostEnv;
		}else if(
			typeof this["load"] == "function" &&
			(
				typeof this["Packages"] == "function" ||
				typeof this["Packages"] == "object"
			)
		){
			// Rhino environments make Java code available via the Packages
			// object. Obviously, this check could be "juiced" if someone
			// creates a "Packages" object and a "load" function, but we've
			// never seen this happen in the wild yet.
			hostEnv = "rhino";
		}else if(typeof this["load"] == "function"){
			// Spidermonkey has a very spartan environment. The only thing we
			// can count on from it is a "load" function.
			hostEnv = "spidermonkey";
		}
		var tmps = ["bootstrap.js", "loader.js", "hostenv_"+hostEnv+".js"];
		if (this.Jaxer && this.Jaxer.isOnServer) {
			this.load = Jaxer.load;
		}
	
		if(
			this[cfg]&&
			(
				dojoConfig["forceXDomain"] ||
				dojoConfig["useXDomain"]
			)
		){
			tmps.push("loader_xd.js");
		}
	
		if(this[cfg] && dojoConfig["baseUrl"]){
			// if the user explicitly tells us where Dojo has been loaded from
			// (or should be loaded from) via djConfig, skip the auto-detection
			// routines.
			var root = dojoConfig["baseUrl"];
		}else{
			var root = "./";
			if(hostEnv === "spidermonkey"){
				// auto-detect the base path via an exception. Hack!
				try{
					throw new Error("");
				}catch(e){
					root = String(e.fileName || e.sourceURL).split("dojo.js")[0];
				}
			}
			if(!this[cfg]){
				dojoConfig = { baseUrl: root };
			}
	
			// attempt to figure out the path to dojo if it isn't set in the config
			if(this["document"] && this["document"]["getElementsByTagName"]){
				var root = getRootNode().root;
				if(!this[cfg]){ dojoConfig = {}; }
				dojoConfig["baseUrl"] = root;
			}
		}
		// FIXME: should we be adding the lang stuff here so we can count on it
		// before the bootstrap stuff?
		for(var x=0; x < tmps.length; x++){
			tmps[x] = root+"_base/_loader/"+tmps[x];
		}
		// the "_base.js" file ensures that the rest of Dojo Base is available.
		// It counts on the package system functioning in order to work, so add
		// it last
		tmps.push(root+"_base.js");

		var lastRoot;
		var isOpera = 0;
		var isWebKit = 0;

		if(hostEnv == "browser"){
			try{
				lastRoot = getRootNode().node;
				var ua = navigator.userAgent;
				isOpera = (ua.indexOf("Opera") >= 0);
				isWebKit = (ua.indexOf("WebKit") >= 0);
			}catch(e){ /* squelch */ }
		}

		// Opera and Safari don't handle injected script tags in the right
		// order, so we resort to XHR to make things work there when we find
		// ourselves in a strict XHTML environment (e.g., document.write bombs
		// out)
		var injectXHRCode = function(src){
			var xhr = new XMLHttpRequest();
			xhr.open("GET", src, false);
			xhr.send();
			eval(xhr.responseText);
		}
	
		var injectScriptNode = function(src){
			if(isWebKit){ return injectXHRCode(src); }
			var head = document.getElementsByTagName("head")[0];
			var script = document.createElement("script");
			script.setAttribute("type", "text/javascript");
			if(head.lastChild === lastRoot){
				head.appendChild(script);
			}else{
				lastRoot.parentNode.insertBefore(script, lastRoot.nextSibling);
			}
			script.src = src;
			lastRoot = script;
		}
		for(var x=0; x < tmps.length; x++){
			if(hostEnv === "rhino" || hostEnv === "spidermonkey" || (this.Jaxer && this.Jaxer.isOnServer)){
				load(tmps[x]);
			}else if(hostEnv === "ff_ext"){
				var l = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
					.getService(Components.interfaces.mozIJSSubScriptLoader);
				l.loadSubScript(tmps[x], this)
			}else if(isOpera){ // opera fails silently!!
				injectXHRCode(tmps[x]);
			}else{
				try{
					document.write("<scr"+"ipt type='text/javascript' src='"+tmps[x]+"'></scr"+"ipt>");
				}catch(e){
					// strict XHTML mode, no document.write
					injectScriptNode(tmps[x]);
				}
			}
		}
	})();
};
