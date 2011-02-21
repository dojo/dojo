//
// dojo i18n! plugin
//
// We choose to include our own plugin in hopes of leveraging functionality already contained in dojo
// and thereby reducing the size of the plugin compared to various loader implementations. Naturally, this
// allows AMD loaders to be used without their plugins.

// CAUTION, this module may return improper results if the AMD loader does not support toAbsMid and client
// code passes relative plugin resource module ids. In that case, you should consider using the i18n! plugin
// that comes with your loader.

define(["dojo"], function(dojo) {
	var
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

			for(var result= [bundlePath + bundleName], localeParts= locale.split("-"), current= "", i= 0; i<localeParts.length; i++){
				current+= localeParts[i];
				if(root[current]){
					result.push(bundlePath + current + "/" + bundleName);
				}
			}
			return result;
		},

		cache= {};

	return {
		load: function(id, require, load){
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
					availableLocales= getAvailableLocales(root, locale, bundlePath, bundleName);
				require(availableLocales, function(){
					for (var i= 1; i<availableLocales.length; i++){
						cache[bundlePathAndName + "/" + availableLocales[i]]= current= dojo.mixin(dojo.clone(current), arguments[i]);
					}
					// target may not have been resolve (e.g., maybe only "fr" exists when "fr-ca" was requested)
					cache[target]= current;
					load(current);
				});
			});
		},

		cache: function(mid, value){
			cache[mid]= value;
		}
	};
});
