define(["dojo", "require", "./has"], function(dojo, require, has){
	// module:
	//		dojo/text
	// summary:
	//		This module implements the !dojo/text plugin and the dojo.cache API.
	// description:
	//		We choose to include our own plugin to leverage functionality already contained in dojo
	//		and thereby reduce the size of the plugin compared to various loader implementations. Also, this
	//		allows foreign AMD loaders to be used without their plugins.
	//
	//		CAUTION: this module may return improper results if the AMD loader does not support toAbsMid and client
	//		code passes relative plugin resource module ids. In that case, you should consider using the text! plugin
	//		that comes with your loader.
	//
	//		CAUTION: this module is designed to optional function synchronously to support the dojo v1.x synchronous
	//		loader. This feature is outside the scope of the CommonJS plugins specification.

	var getText= function(url, sync, load){
		dojo.xhrGet({url:url, sync:sync, load:load});
	};
	if(!has("host-browser")){
		// TODOC: only works for dojo AMD loader
		if(require.getText){
			getText= require.getText;
		}else{
			console.error("dojo/text plugin failed to load because loader does not support getText");
		}
	}

	var
		theCache= {},

		getCacheId= function(resourceId) {
			if(require.toAbsMid){
				var match= resourceId.match(/(.+)(\.[^\/\.]+)$/);
				return match ? require.toAbsMid(match[1]) + match[2] : require.toAbsMid(resourceId);
			}
			return resourceId;
		},

		cache= function(cacheId, url, value){
			// if cacheId is not given, just use a trash location
			cacheId= cacheId || "*garbage*";
			theCache[cacheId]= theCache[url]= value;
		},

		strip= function(text){
			//note: this function courtesy of James Burke (https://github.com/jrburke/requirejs)
			//Strips <?xml ...?> declarations so that external SVG and XML
			//documents can be added to a document without worry. Also, if the string
			//is an HTML document, only the part inside the body tag is returned.
			if(text){
				text= text.replace(/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im, "");
				var matches= text.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
				if(matches){
					text= matches[1];
				}
			}else{
				text = "";
			}
			return text;
		},

		result= {
			load:function(id, require, load){
				// id is something like:
				//	 * "path/to/text.html
				//	 * "path/to/text.html!strip
				var
					parts= id.split("!"),
					resourceId= parts[0],
					cacheId= getCacheId(resourceId),
					strip= parts.length>1,
					url;
				if(cacheId in theCache){
					load(strip ? strip(theCache[cacheId]) : theCache[cacheId]);
					return;
				}
				url= require.toUrl(resourceId);
				if(url in theCache){
					load(strip ? strip(theCache[url]) : theCache[url]);
					return;
				}
				getText(url, !require.async, function(text){
					cache(cacheId, url, text);
					load(strip ? strip(theCache[url]) : theCache[url]);
				});
			},

			cache:function(cacheId, mid, type, value) {
				cache(cacheId, require.nameToUrl(mid) + type, value);
			}
		};

		dojo.cache= function(/*String||Object*/module, /*String*/url, /*String||Object?*/value){
			//	 * (string string [value]) => (module, url, value)
			//	 * (object [value])				 => (module, value), url defaults to ""
			//
			//	 * if module is an object, then it must be convertable to a string
			//	 * (module, url) must be legal arguments (once converted to strings iff required) to dojo.moduleUrl
			//	 * value may be a string or an object; if an object then may have the properties "value" and/or "sanitize"
			var key;
			if(typeof module == "string"){
				module = (module.replace(/\./g, "/") + (url ? ("/" + url) : "")).replace(/^dojo\//, "./");
				key = require.nameToUrl(module);
			}else{
				key = module+"";
				value = url;
			}
			var
				val = (value != undefined && !dojo.isString(value)) ? value.value : value,
				sanitize = value && value.sanitize;

			if(typeof val == "string"){
				//We have a string, set cache value
				theCache[key] = val;
				return strip ? strip(val) : val;
			}else if(val === null){
				//Remove cached value
				delete theCache[key];
				return null;
			}else{
				//Allow cache values to be empty strings. If key property does
				//not exist, fetch it.
				if(!(key in theCache)){
					getText(key, true, function(text){
						cache(0, key, text);
					});
				}
				return strip ? strip(theCache[key]) : theCache[key];
			}
		};

		return result;
});

/*=====
dojo.cache = function(className, superclass, props){
	// summary:
	//		A getter and setter for storing the string content associated with the
	//		module and url arguments.
	// description:
	//		module and url are used to call `dojo.moduleUrl()` to generate a module URL.
	//		If value is specified, the cache value for the moduleUrl will be set to
	//		that value. Otherwise, dojo.cache will fetch the moduleUrl and store it
	//		in its internal cache and return that cached value for the URL. To clear
	//		a cache value pass null for value. Since XMLHttpRequest (XHR) is used to fetch the
	//		the URL contents, only modules on the same domain of the page can use this capability.
	//		The build system can inline the cache values though, to allow for xdomain hosting.
	// module: String||Object
	//		If a String, the module name to use for the base part of the URL, similar to module argument
	//		to `dojo.moduleUrl`. If an Object, something that has a .toString() method that
	//		generates a valid path for the cache item. For example, a dojo._Url object.
	// url: String
	//		The rest of the path to append to the path derived from the module argument. If
	//		module is an object, then this second argument should be the "value" argument instead.
	// value: String||Object?
	//		If a String, the value to use in the cache for the module/url combination.
	//		If an Object, it can have two properties: value and sanitize. The value property
	//		should be the value to use in the cache, and sanitize can be set to true or false,
	//		to indicate if XML declarations should be removed from the value and if the HTML
	//		inside a body tag in the value should be extracted as the real value. The value argument
	//		or the value property on the value argument are usually only used by the build system
	//		as it inlines cache content.
	//	example:
	//		To ask dojo.cache to fetch content and store it in the cache (the dojo["cache"] style
	//		of call is used to avoid an issue with the build system erroneously trying to intern
	//		this example. To get the build system to intern your dojo.cache calls, use the
	//		"dojo.cache" style of call):
	//		| //If template.html contains "<h1>Hello</h1>" that will be
	//		| //the value for the text variable.
	//		| var text = dojo["cache"]("my.module", "template.html");
	//	example:
	//		To ask dojo.cache to fetch content and store it in the cache, and sanitize the input
	//		 (the dojo["cache"] style of call is used to avoid an issue with the build system
	//		erroneously trying to intern this example. To get the build system to intern your
	//		dojo.cache calls, use the "dojo.cache" style of call):
	//		| //If template.html contains "<html><body><h1>Hello</h1></body></html>", the
	//		| //text variable will contain just "<h1>Hello</h1>".
	//		| var text = dojo["cache"]("my.module", "template.html", {sanitize: true});
	//	example:
	//		Same example as previous, but demostrates how an object can be passed in as
	//		the first argument, then the value argument can then be the second argument.
	//		| //If template.html contains "<html><body><h1>Hello</h1></body></html>", the
	//		| //text variable will contain just "<h1>Hello</h1>".
	//		| var text = dojo["cache"](new dojo._Url("my/module/template.html"), {sanitize: true});
	return val; //String
};
=====*/
