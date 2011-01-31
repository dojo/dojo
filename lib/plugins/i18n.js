//
// dojo i18n! plugin
//
// We choose to include our own plugin in hopes of leveraging functionality already contained in dojo
// and thereby reducing the size of the plugin compared to various loader implementations. Naturally, this
// allows AMD loaders to be used without their plugins.

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
		load: function(require, id, loaded){
			var
				match= nlsRe.exec(id),
				bundlePath= require.nameToUrl(match[1]),
				bundleName= match[5] || match[4],
				bundlePathAndName= bundlePath + bundleName,
				locale= (match[5] && match[4]) || dojo.locale,
        target= bundlePathAndName + "/" + locale;

      // if we've already resolved this request, just return it
      if (cache[target]) {
        loaded(cache[target]);
        return;
      }

			// get the root bundle which instructs which other bundles are required to contruct the localized bundle
			require([bundlePathAndName], function(root){
        var 
          current= cache[bundlePathAndName + "/"]= dojo.clone(root.root),
          availableLocales= getAvailableLocales(root, locale, bundlePath, bundleName);
				require(availableLocales, function(){
          for (var i= 1; i<availableLocales.length; i++) {
            cache[bundlePathAndName + "/" + availableLocales[i]]= current= dojo.mixin(dojo.clone(current), arguments[i]);
          }
          cache[target]= current;
					loaded(current);
				});
			});
		},
		cache: function(mid, value) {
			define(mid, 0, value);
		}
	};
});
