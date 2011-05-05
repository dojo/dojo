define([".", "require", "./has"], function(dojo, require, has) {
	// module:
	//		dojo/i18n
	// summary:
	//		This module implements the !dojo/i18n plugin and the v1.6- i18n API
	// description:
	//		We choose to include our own plugin to leverage functionality already contained in dojo
	//		and thereby reduce the size of the plugin compared to various loader implementations. Also, this
	//		allows foreign AMD loaders to be used without their plugins.
	//
	//		CAUTION: this module may return improper results if the AMD loader does not support toAbsMid and client
	//		code passes relative plugin resource module ids. In that case, you should consider using the i18n! plugin
	//		that comes with your loader.

	var
		thisModule= dojo.i18n=
			// the dojo.i18n module
			{},

		nlsRe=
			// regexp for reconstructing the master bundle name from parts of the regexp match
			// nlsRe.exec("foo/bar/baz/nls/en-ca/foo") gives:
			// ["foo/bar/baz/nls/en-ca/foo", "foo/bar/baz/nls/", "/", "/", "en-ca", "foo"]
			// nlsRe.exec("foo/bar/baz/nls/foo") gives:
			// ["foo/bar/baz/nls/foo", "foo/bar/baz/nls/", "/", "/", "foo", ""]
			// so, if match[5] is blank, it means this is the top bundle definition.
			// courtesy of http://requirejs.org
			/(^.*(^|\/)nls(\/|$))([^\/]*)\/?([^\/]*)/,

		getAvailableLocales= function(
			root,
			locale,
			bundlePath,
			bundleName
		){
			// return a vector of module ids containing all available locales with respect to the target locale
			// For example, assuming:
			//	 * the root bundle indicates specific bundles for "fr" and "fr-ca",
			//	 * bundlePath is "myPackage/nls"
			//	 * bundleName is "myBundle"
			// Then a locale argument of "fr-ca" would return
			//	 ["myPackage/nls/myBundle", "myPackage/nls/fr/myBundle", "myPackage/nls/fr-ca/myBundle"]
			// Notice that bundles are returned least-specific to most-specific, starting with the root.
			//
			// If root===false indicates we're working with a pre-AMD i18n bundle that doesn't tell about the available locales;
			// therefore, assume everything is available and get 404 errors that indicate a particular localization is not available
			//

			for(var result= [bundlePath + bundleName], localeParts= locale.split("-"), current= "", i= 0; i<localeParts.length; i++){
				current+= (current ? "-" : "") + localeParts[i];
				if(!root || root[current]){
					result.push(bundlePath + current + "/" + bundleName);
				}
			}
			return result;
		},

		cache= {},

		getL10nName= dojo.getL10nName = function(moduleName, bundleName, locale){
			locale = locale ? locale.toLowerCase() : dojo.locale;
			moduleName = "dojo/i18n!" + moduleName.replace(/\./g, "/");
			bundleName = bundleName.replace(/\./g, "/");
			return (/root/i.test(locale)) ?
				(moduleName + "/nls/" + bundleName) :
				(moduleName + "/nls/"	 + locale + "/" + bundleName);
		},

		load= function(id, require, load){
			// note: id may be relative
			var
				match= nlsRe.exec(id),
				bundlePath= (require.toAbsMid && require.toAbsMid(match[1])) || match[1],
				bundleName= match[5] || match[4],
				bundlePathAndName= bundlePath + bundleName,
				locale= (match[5] && match[4]) || dojo.locale,
				target= bundlePathAndName + "/" + locale;

			// if we've already resolved this request, just return it
			if (cache[target]) {
				load(cache[target]);
				return;
			}

			// get the root bundle which instructs which other bundles are required to contruct the localized bundle
			require([bundlePathAndName], function(root){
				var
					current= cache[bundlePathAndName + "/"]= dojo.clone(root.root),
					availableLocales= getAvailableLocales(!root._v1x && root, locale, bundlePath, bundleName);
				require(availableLocales, function(){
					for (var i= 1; i<availableLocales.length; i++){
						cache[availableLocales[i]]= current= dojo.mixin(dojo.clone(current), arguments[i]);
					}
					// target may not have been resolve (e.g., maybe only "fr" exists when "fr-ca" was requested)
					cache[target]= current;
					load(dojo.delegate(current));
				});
			});
		};


	has.add("dojo-v1x-i18n-Api",
		// if true, define the v1.x i18n functions
		1
	);

	if(has("dojo-v1x-i18n-Api")){
		var syncRequire= function(deps, callback){
			var results= [];
			dojo.forEach(deps, function(mid){
				var url= require.nameToUrl(mid) + ".js";
				if(cache[url]){
					results.push(cache[url]);
				}else{
					try {
						var bundle= require(mid);
						if(bundle){
							results.push(bundle);
							return;
						}
					}catch(e){}
					dojo.xhrGet({
						url:url,
						sync:true,
						load:function(text){
							var
								__result,
								__fixup= function(bundle){
									// nls/<locale>/<bundle-name> indicates not the root.
									return bundle ? (/nls\/[^\/]+\/[^\/]+$/.test(url) ? bundle : {root:bundle, _v1x:1}) : __result;
								};

							// TODO: make sure closure compiler does not stomp on this function name
							function define(bundle){
							  __result= bundle;
							};
							results.push(cache[url]= (__fixup(eval(text))));
						},
						error:function(){
							results.push(cache[url]= {});
						}
					});
				}
			});
			callback.apply(callback, results);
		};
		syncRequire.toAbsMid= function(mid){
			return require.toAbsMid(mid);
		};

		thisModule.getLocalization= function(moduleName, bundleName, locale){
			var
				result,
				l10nName= getL10nName(moduleName, bundleName, locale);
			load(l10nName.substring(10), syncRequire, function(result_){ result= result_; });
			return result;
		};

		thisModule.normalizeLocale= function(locale){
			var result = locale ? locale.toLowerCase() : dojo.locale;
			if(result == "root"){
				result = "ROOT";
			}
			return result;
		};
	}

	thisModule.load= load;

	thisModule.cache= function(mid, value){
		cache[mid]= value;
	};

	return thisModule;
});
