define("dojo/_base/backCompat", ["dojo"], function(dojo) {

  var sieModuleName= function(moduleName) {
    return moduleName.replace(/\./g, "/");
  };

  if (require.config.v1xConfig) {
    // simulation of v1.5 configuration machinery
    // 
    // djConfig is depricated in favor of defining a dojo object and setting 
    // options in that object before evaluating the bootstrap. See [RCGTODO].
    // The following hacks maintain complete back compatibility with the
    // old djConfig design.
  
    // first, mix any global djConfig into dojo.config; this was done in 
    // _base/bootstrap.js
    for (var p in dojo.global.djConfig) {
      dojo.config[p]= djConfig[p];
    }
  
    // second, mix any djConfig attribute found in the script element that loaded
    // the bootstrap into dojo.config. This particular script element is termed the
    // "baseNode", and standard dojo-sie bootstrap includes a backcompat hack that
    // remembers baseNode at dojo.baseNode.
    // 
    // NOTE: Previously, this process was accomplished in _base/_loader/hostenv_browser.js, and
    // the algorithm found there appears to have a flaw. If baseUrl is specificed
    // in the configuration, thereby implying it is something other than /dojo(\.xd)?\.js(\W|$)/i,
    // then the algorithm will not find the correct node. This flaw has been repaired in this
    // hack by causing the node search algorithm so be configurable to look for
    // baseUrlRe and ensuring that baseUrlRe is set to match baseUrl if given.
    var config= require.baseNode && require.baseNode.getAttribute("djConfig");
    if (config) {
      config= eval("({ "+config+" })");
      for (p in config) {
        dojo.config[p]= config[p];
      }
    }

    dojo.config.afterOnLoad && (dojo.pageLoaded= true) && (dojo._postLoad= true);
  }

  if (require.config.v1xRegisterModulePath) {
    // simulation of dojo.registerModulePath
    // 
    // Each module registered is converted into a regular expression to match the module
    // name (the sie module naming convention of slashes instead of dots is used).
    // The list of regular expressions, together with their associated prefixes is
    // remembered in the vector "modulePathSearchVector" and the vector is kept ordered
    // from longest to shortest module name. dojo.registerModulePath simply inserts
    // information in the modulePathSearchVector.
    // 
    // To get the effect of module paths, recall that modules are translated to urls
    // by the function dojo.url (in dojo-sie.js). By inserting a function into require.urlMap
    // that attempts to translate a module using the modulePathSearchVector we get the desired
    // effect. This exercise also serves as a nice example of the flexibility of dojo.url.

    var modulePathSearchVector =[];
    
    dojo.registerModulePath= function(module, prefix) {
      module=  sieModuleName(module);
      var
        moduleLength= module.length,
        i= 0;
      while (i<modulePathSearchVector.length && modulePathSearchVector[i][0].length>moduleLength) i++;
      modulePathSearchVector.splice(i, [module, RegExp("^"+module), prefix]);
    };

    var modulePaths= dojo.config.modulePaths;
    for (p in modulePaths) {
      dojo.registerModulePath(p, modulePaths[p]);
    }

    require.urlMap.unshift(function(module) {
      for (var re, i= 0, end= modulePathSearchVector.length; i<end; i++) {
        re= modulePathSearchVector[i][1];
        if (re.test(module)) {
          return module.replace(re, modulePathSearchVector[i][2]);
        }
      }
      return 0;
    });
  }

  if (require.config.v1xModuleUrl) {
    // simulation of dojo.moduleUrl

    dojo.moduleUrl= function(module, url) {
      if (!module) {
       //RCGTODO: don't understand why this would ever be so
       return null; 
      }
      module = sieModuleName(module);
      if(module.lastIndexOf("/") != module.length-1){
        module+= "/";
      }
      return new dojo._Url(require.url(module + (url || ""), false)); // dojo._Url
    };
  }

  if (require.config.v1xI18n) {
    // simulation of v1.5 i18n machinery

    // note: you must load dojo/i18 before using these routines.
    require.urlMap.push(function(name){ return /^dojo\/i18n\.js$/.test(name) ? dojo.url("plugin/i18n") : 0; });

    dojo.requireLocalization= function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale) {
      dojo.getL10n(sieModuleName(moduleName), bundleName, locale);
    };

    dojo.i18n= {
      getLocalization: function(/*String*/packageName, /*String*/bundleName, /*String?*/locale) {
        return dojo.getL10n(sieModuleName(packageName), bundleName, locale);
      },

      normalizeLocale: function(locale) {
        return dojo.getLocale(locale);
      }
    };
  }
});
// Copyright (c) 2008-2010, Rawld Gill and ALTOVISO LLC (www.altoviso.com). Use, modification, and distribution subject to terms of license.
