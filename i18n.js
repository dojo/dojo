define(["./_base/kernel", "require", "./has", "./_base/array", "./_base/config", "./_base/lang", "./_base/xhr"],
	function(dojo, require, has, array, config, lang, xhr) {
	// module:
	//		dojo/i18n
	// summary:
	//		This module implements the !dojo/i18n plugin and the v1.6- i18n API
	// description:
	//		We choose to include our own plugin to leverage functionality already contained in dojo
	//		and thereby reduce the size of the plugin compared to various loader implementations. Also, this
	//		allows foreign AMD loaders to be used without their plugins.
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
			/(^.*(^|\/)nls)(\/|$)([^\/]*)\/?([^\/]*)/,

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
				(moduleName + "/nls/" + locale + "/" + bundleName);
		},

		doLoad = function(require, bundlePathAndName, bundlePath, bundleName, locale, load){
			// get the root bundle which instructs which other bundles are required to construct the localized bundle
			require([bundlePathAndName], function(root){
				var
					current= cache[bundlePathAndName + "/"]= lang.clone(root.root),
					availableLocales= getAvailableLocales(!root._v1x && root, locale, bundlePath, bundleName);
				require(availableLocales, function(){
					for (var i= 1; i<availableLocales.length; i++){
						cache[availableLocales[i]]= current= lang.mixin(lang.clone(current), arguments[i]);
					}
					// target may not have been resolve (e.g., maybe only "fr" exists when "fr-ca" was requested)
					var target= bundlePathAndName + "/" + locale;
					cache[target]= current;
					load && load(lang.delegate(current));
				});
			});
		},

		normalize = function(id, toAbsMid){
			// note: id may be relative
			var match= nlsRe.exec(id),
				bundlePath= match[1];
			return /^\./.test(bundlePath) ? toAbsMid(bundlePath) + "/" +  id.substring(bundlePath.length) : id;
		},

		noop = function(){},

		checkForLegacyModules = noop,

		waitForPreloads = noop,

		load = function(id, require, load){
			// note: id is always absolute

			if(waitForPreloads(id, require, load)){
				return;
			}
			var
				match= nlsRe.exec(id),
				bundlePath= match[1] + "/",
				bundleName= match[5] || match[4],
				bundlePathAndName= bundlePath + bundleName,
				localeSpecified = (match[5] && match[4]),
				targetLocale=  localeSpecified || dojo.locale,
				target= bundlePathAndName + "/" + targetLocale;

			if(localeSpecified){
				checkForLegacyModules(target);
				if(cache[target]){
					// a request for a specific local that has already been loaded; just return it
					load(cache[target]);
				}else{
					// a request for a specific local that has not been loaded; load and return just that locale
					doLoad(require, bundlePathAndName, bundlePath, bundleName, targetLocale, load);
				}
				return;
			}// else a non-locale-specific request; therefore always load dojo.locale + config.extraLocale

			// notice the subtle algorithm that loads targetLocal last, which is the only doLoad application that passes a value for the load callback
			// this makes the sync loader follow a clean code path that loads extras first and then proceeds with tracing the current deps graph
			var extra = config.extraLocale || [];
			extra = lang.isArray(extra) ? extra : [extra];
			extra.push(targetLocale);
			var remaining = extra.length,
				targetBundle;
			array.forEach(extra, function(locale){
				doLoad(require, bundlePathAndName, bundlePath, bundleName, locale, function(bundle){
					if(locale == targetLocale){
						targetBundle = bundle;
					}
					if(!--remaining){
						load(targetBundle);
					}
				});
			});
		};

	if(has("dojo-unit-tests")){
		var unitTests = thisModule.unitTests = [];
	}

	has.add("dojo-v1x-i18n-Api",
		// if true, define the v1.x i18n functions
		1
	);

	if(has("dojo-v1x-i18n-Api")){
		// this code path assumes the dojo loader and won't work with a standard AMD loader
		var
			evalBundle=
				// use the function ctor to keep the minifiers away (also come close to global scope, but this is secondary)
				new Function(
					"__bundle",                // the bundle to evalutate
					"__checkForLegacyModules", // a function that checks if __bundle defined __mid in the global space
					"__mid",                   // the mid that __bundle is intended to define

					// returns one of:
					//		1 => the bundle was an AMD bundle
					//		a legacy bundle object that is the value of __mid
					//		instance of Error => could not figure out how to evaluate bundle

					  // used to detect when __bundle calls define
					  "var define = function(){define.called = 1;},"
					+ "    require = function(){define.called = 1;};"

					+ "try{"
					+		"define.called = 0;"
					+		"eval(__bundle);"
					+		"if(define.called==1)"
								// bundle called define; therefore signal it's an AMD bundle
					+			"return 1;"

					+		"if((__checkForLegacyModules = __checkForLegacyModules(__mid)))"
								// bundle was probably a v1.6- built NLS flattened NLS bundle that defined __mid in the global space
					+			"return __checkForLegacyModules;"

					+ "}catch(e){}"
					// evaulating the bundle was *neither* an AMD *nor* a legacy flattened bundle
					// either way, re-eval *after* surrounding with parentheses

					+ "try{"
					+ 		"return eval('('+__bundle+')');"
					+ "}catch(e){"
					+ 		"return e;"
					+ "}"
				),

			syncRequire= function(deps, callback){
				var results= [];
				array.forEach(deps, function(mid){
					var url= require.toUrl(mid + ".js");
					if(cache[url]){
						results.push(cache[url]);
					}else{
						var bundle= require.syncLoadNls(mid);
						// don't need to check for legacy since syncLoadNls returns a module if the module
						// (1) was already loaded, or (2) was in the cache. In case 1, if syncRequire is called
						// from getLocalization --> load, then load will have called checkForLegacyModules() before
						// calling syncRequire; if syncRequire is called from preloadLocalizations, then we
						// don't care about checkForLegacyModules() because that will be done when a particular
						// bundle is actually demanded. In case 2, checkForLegacyModules() is never relevant
						// because cached modules are always v1.7+ built modules.
						if(bundle){
							results.push(bundle);
						}else{
							xhr.get({
								url:url,
								sync:true,
								load:function(text){
									var result = evalBundle(text, checkForLegacyModules, mid);
									if(result===1){
										// the bundle was an AMD module; re-inject it through the normal AMD path
										// we gotta do this since it could be an anonymous module and simply evaluating
										// the text here won't provide the loader with the context to know what
										// module is being defined()'d. With browser caching, this should be free; further
										// this entire code path can be circumvented by using the AMD format to begin with
										require([mid], function(bundle){
											results.push(cache[url]= bundle);
										});
									}else{
										if(result instanceof Error){
											console.error("failed to evaluate i18n bundle; url=" + url, result);
											result = {};
										}
										// nls/<locale>/<bundle-name> indicates not the root.
										results.push(cache[url] = (/nls\/[^\/]+\/[^\/]+$/.test(url) ? result : {root:result, _v1x:1}));
									}
								},
								error:function(){
									results.push(cache[url]= {});
								}
							});
						}
					}
				});
				callback && callback.apply(null, results);
			},

			normalizeLocale = thisModule.normalizeLocale= function(locale){
				var result = locale ? locale.toLowerCase() : dojo.locale;
				return result == "root" ? "ROOT" : result;
			},

			isXd = function(mid){
				return has("dojo-sync-loader") ? require.isXdUrl(require.toUrl(mid + ".js")) : true;
			},

			preloading = 0,

			preloadWaitQueue = [];

		checkForLegacyModules = function(target){
			// legacy code may have already loaded [e.g] the raw bundle x/y/z at x.y.z; when true, push into the cache
			for(var result, names = target.split("/"), object = dojo.global[names[0]], i = 1; object && i<names.length-1; object = object[names[i++]]){}
			if(object){
				result = object[names[i]];
				if(!result){
					// fallback for incorrect bundle build of 1.6
					result = object[names[i].replace(/-/g,"_")];
				}
				if(result){
					cache[target] = result;
				}
			}
			return result;
		};

		waitForPreloads = function(id, require, load){
			if(preloading){
				preloadWaitQueue.push([id, require, load]);
			}
			return preloading;
		};

		thisModule.getLocalization= function(moduleName, bundleName, locale){
			var result,
				l10nName= getL10nName(moduleName, bundleName, locale).substring(10);
			load(l10nName, (!isXd(l10nName) ? syncRequire : require), function(result_){ result= result_; });
			return result;
		};

		thisModule._preloadLocalizations = function(/*String*/bundlePrefix, /*Array*/localesGenerated, /*boolean*/ guaranteedAmdFormat){
			//	summary:
			//		Load built, possibly-flattened resource bundles, if available for all
			//		locales used in the page.
			//
			//  descirption:
			//		Only called by built layer files. The entire locale hierarchy is loaded. For example,
			//		if locale=="ab-cd", then ROOT, "ab", and "ab-cd" are loaded. This is different than v1.6-
			//		in that the v1.6- would lonly load ab-cd...which was *always* flattened.
			//
			//		If guaranteedAmdFormat is true, then the module can be loaded with require thereby circumventing the detection algorithm
			//		and the extra possible extra transaction.
			//


			function forEachLocale(locale, func){
				// this function is equivalent to v1.6 dojo.i18n._searchLocalePath with down===true
				var parts = locale.split("-");
				while(parts.length){
					if(func(parts.join("-"))){
						return true;
					}
					parts.pop();
				}
				return func("ROOT");
			}

			function preload(locale){
				locale = normalizeLocale(locale);
				forEachLocale(locale, function(loc){
					if(array.indexOf(localesGenerated, loc)>0){
						var mid = bundlePrefix.replace(/\./g, "/")+"_"+loc;
						preloading++;
						(isXd(mid) || guaranteedAmdFormat ? require : syncRequire)([mid], function(){
							--preloading;
							while(!preloading && preloadWaitQueue.length){
								load.apply(null, preloadWaitQueue.shift());
							}
						});
						return true; // Boolean
					}
					return false; // Boolean
				});
			}

			preload();
			array.forEach(dojo.config.extraLocale, preload);
		};

		if(has("dojo-unit-tests")){
			unitTests.push(function(doh){
				doh.register("tests.i18n.unit", function(t){
					var check;

					check = evalBundle("{prop:1}");
					t.is({prop:1}, check); t.is(undefined, check[1]);

					check = evalBundle("({prop:1})");
					t.is({prop:1}, check); t.is(undefined, check[1]);

					check = evalBundle("{'prop-x':1}");
					t.is({'prop-x':1}, check); t.is(undefined, check[1]);

					check = evalBundle("({'prop-x':1})");
					t.is({'prop-x':1}, check); t.is(undefined, check[1]);

					check = evalBundle("define({'prop-x':1})");
					t.is(1, check);

					check = evalBundle("this is total nonsense and should throw an error");
					t.is(check instanceof Error, true);
				});
			});
		}
	}

	return lang.mixin(thisModule, {
		dynamic:true,
		normalize:normalize,
		load:load,
		cache:function(mid, value){
			cache[mid] = value;
		}
	});
});
