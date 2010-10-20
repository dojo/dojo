(function() {
  var def= function(dojo) {
    if (!dojo.getL10nName) {
      //use dojo.getL10nName as a once-only flag
      var
        nlsRe=
          // regexp for reconstructing the master bundle name from parts of the regexp match
          // nlsRe.exec("foo/bar/baz/nls/en-ca/foo") gives:
          // ["foo/bar/baz/nls/en-ca/foo", "foo/bar/baz/nls/", "/", "/", "en-ca", "foo"]
          // nlsRe.exec("foo/bar/baz/nls/foo") gives:
          // ["foo/bar/baz/nls/foo", "foo/bar/baz/nls/", "/", "/", "foo", ""]
          // so, if match[5] is blank, it means this is the top bundle definition.
          /(^.*(^|\/)nls(\/|$))([^\/]*)\/?([^\/]*)/,
    
        bundles=
          // map:root-bundle-name -> bundle contents
          {}, 
    
        waiting=
          // map:module-name -> 1 indicates waiting for the module which is a localized bundle
          {},
    
        getAvailableLocales= function(
          locale,
          bundle
        ) {
          var 
            result= [],
            localeParts= locale.split("-"), 
            target= localeParts[0], 
            i= 1;
          if (target!="root") {
            bundle[target] && result.push(target);
            while (i<localeParts.length) {
              target+= "-" + localeParts[i++];
              bundle[target] && result.push(target);
            }
          }
          return result;
        },
    
        getLocalizedBundleModuleName= function(
          locale,
          bundlePath,
          bundleName
        ) {
          return "i18n!" + bundlePath + (locale ? locale + "/" : "") + bundleName;
        },
        
        requestLocalizedBundles= function(
          locale,
          bundle,
          bundlePath,
          bundleName
        ) {
          dojo.forEach(getAvailableLocales(locale, bundle), function(locale) {
            if (!(typeof bundle[locale]=="object")) {
              var moduleName= getLocalizedBundleModuleName(locale, bundlePath, bundleName).substring(5);
              if (!waiting[moduleName]) {
                waiting[moduleName]= 1;
                require.req(moduleName);
              }
            } // else the bundle already contains this localized bundle
          });
        },
    
        requestImplicitLocales= function() {
          var locales= [dojo.locale || "root"];
          if (dojo.extraLocale) {
            locales= locales.concat(dojo.extraLocale);
          }
          for (var p in bundles) {
            var bundle= bundles[p];
            if (bundle.root) {
              dojo.forEach(locales, function(locale) {
                requestLocalizedBundles(locale, bundle, bundle.path, bundle.name);
              });
            }
          }
        },
          
        defineLocalizedBundle= function(
          locale,
          bundle,
          bundlePath,
          bundleName,
          defaultLocale
        ) {
          var 
            localizedBundle,
            moduleName,
            last= dojo.clone(bundle.root);
          dojo.forEach(getAvailableLocales(locale, bundle), function(locale) {
            localizedBundle= bundle[locale]= dojo.mix(last, bundle[locale]),
            moduleName= getLocalizedBundleModuleName(locale, bundlePath, bundleName);
            require.modules[moduleName]= {result:localizedBundle, executed:1};
            delete require.waiting[moduleName];
            last= dojo.clone(localizedBundle);
          });
          moduleName= getLocalizedBundleModuleName(locale, bundlePath, bundleName);
          require.modules[moduleName]= {result:last, executed:1};
          delete require.waiting[moduleName];
         
          // note: if the default locale changes, then the result of the default module will be wrong
          if (defaultLocale) {
            moduleName= getLocalizedBundleModuleName(0, bundlePath, bundleName);
            require.modules[moduleName]= {result:last, executed:1};
            delete require.waiting[moduleName];
          }
        },
    
        i18n= function (
          name, //(string) the bundle name: i18n!<path>/nls/[locale-string/]<bundle-name>
          def   //(i18n bundle)
        ) {
          //expected signatures:
          //  (name) => request the i18n bundle
          //  (name, def) => define the i18n bundle
          // 
          name= name.substring(5);
          var
            match= nlsRe.exec(name),
            bundlePath= match[1],
            bundleName= match[5] || match[4],
            bundleNameAndPath= bundlePath + bundleName,
            locale= match[5] && match[4],
            bundle= bundles[bundleNameAndPath];
    
          if (!bundle) {
            bundle= bundles[bundleNameAndPath]= {
              path:
                //the bundle path
                bundlePath,
  
              name:
                //the bundle name
                bundleName,
  
              requestedLocales:
                // map:locale -> {1, 2, 3}
                // holds requested localized bundles for this bundle
                // 1 => client requested; 2 => requested from server; 3 => delivered to client
                {} 
            };
            //if this isn't the root bundle definition, request it
            if (!def || locale) {
              require.req(bundleNameAndPath);
              waiting[bundleNameAndPath]= 1;
            }
          }
          var requestedLocales= bundle.requestedLocales;
  
          if (!def && locale) {
            //requesting a localized bundle
            requestedLocales[locale]= 1;
          } else if (def && locale) {
            //receiving a localized bundle
            bundle[locale]= def;
            delete waiting[name];
          } else if (def && !locale) {
            //receiving the root bundle
            dojo.mix(bundle, def);
            delete waiting[name];
          }
    
          if (!bundle.root) {
            // can't request more localized bundles until the root gets here since it
            // tells us what locales are avaiable...
            return;
          }
    
          // download all localized bundles required to fullfill localized bundles requested by client code
          for (var p in requestedLocales) {
            // p is a locale identifier
            if (requestedLocales[p]==1) {
              requestedLocales[p]= 2;
              requestLocalizedBundles(p, bundle, bundlePath, bundleName);
            }
          };
    
          requestImplicitLocales();
    
          if (dojo.isEmpty(waiting)) {
            //got everything we need to resolve anything we've been asked for; make the calculations...
            for (p in bundles) {
              bundle= bundles[p];
              //always leave the root module (e.g. "i18n!nls/colors") congruent with dojo.locale
              defineLocalizedBundle(dojo.locale||"root", bundle, bundle.path, bundle.name, 1);
              requestedLocales= bundle.requestedLocales;
              for (q in requestedLocales) {
                //q is a locale identifier
                if (requestedLocales[q]<3) {
                  requestedLocales[q]= 3;
                  defineLocalizedBundle(q, bundle, bundle.path, bundle.name);
                }
              };
            };
            // *iff* this was a define call, we may have defined a whole bunch of modules; force run to exec checkComplete...
            def && require.checkComplete();
          }
      };
    
      dojo.getL10nName=
        function(
          moduleName,
          bundleName,
          locale
        ) {
          return "i18n!" + moduleName + "/nls" + (locale ? "/" + locale.toLowerCase() : "") + "/" + bundleName;
        };
    
      dojo.getL10n=
        function(
          moduleName,
          bundleName,
          locale
        ) {
          return require.module(dojo.getL10nName(moduleName, bundleName, locale));
        };
    
      dojo.reqL10n=
        function(
          moduleName,
          bundleName,
          locale
        ) {
          require.req(dojo.getL10nName(moduleName, bundleName, locale));
        };
    
      dojo.getLocale= 
        function(
          locale
        ){
    	    return locale ? locale.toLowerCase() : dojo.locale;
        };
    
      dojo.setLocale=
        function(
          locale,
          extraLocales
        ) {
          dojo.locale= dojo.getLocale(locale);
          if (extraLocales) {
            dojo.extraLocale= extraLocales;
          }
          requestImplicitLocales();
        };
    
      dojo.bundles= bundles;
    
      var
        thePluginProxy= require.plugins.i18n || {defQ:[], injectQ:[]},
        defQ= thePluginProxy.defQ,
        injectQ= thePluginProxy.injectQ;
      require.plugins.i18n= {def: i18n, inject:i18n};
      while (defQ.length) {
        i18n.apply(null, defQ.shift());
      }
      while (injectQ.length) {
        i18n.call(null, injectQ.shift());
      }
    }
    return require.plugins.i18n;
  },
    
  deps= ["dojo", "dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/array", "dojo/_base/environment"];
  
  //the "real module definition...
  define("plugin/i18n", deps, def);
  
  //backcompat for dojo/i18n
  define("dojo/i18n", deps, def);

})();
// Copyright (c) 2008-2010, Rawld Gill and ALTOVISO LLC (www.altoviso.com). Use, modification, and distribution subject to terms of license.
