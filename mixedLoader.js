define("dojo/mixedLoader", ["plugin/text"], function(dojo) {

  // This module allows using synchronous dojo.require et al with dojo-sie. Ideally, you should convert your
  // project to work with the asynchronous loader en masse. However, you can use these backcompat hacks to get
  // the benefits dojo-sei and degrade to synchronous operation for project resources that have not been converted.

  var sieModuleName= function(moduleName) {
    return moduleName.replace(/\./g, "/");
  };

    dojo.require= function(moduleName) {
console.log("require:"+moduleName);
      var
        url= dojo.url(sieModuleName(moduleName)),
        src= dojo.cache(url) + (!dojo.isIE ? "\r\n//@ sourceURL=" + url : "");
      dojo.eval(src);
      return dojo.provide(moduleName);
    };

    dojo.provide= function(moduleName) {
console.log("provide:"+moduleName);
      var match= /^(\w+)\.(.+)/.exec(moduleName);
      return match ? dojo.get(match[2], dojo.global[match[1]] || (dojo.global[match[1]]= {}), {}) : dojo.get(moduleName, dojo.global, {});
    };

    dojo.platformRequire= function(modMap){
		  var req= function(vector)  {
        if (vector) {
          (typeof vector == "string") && (vector= [vector]);
          for (var i= 0; i<vector.length; dojo.require(sieModuleName(vector[i++])));
        }
      };
      req(modMap.common);
      req(modMap[dojo.host] || modMap["default"]);
    };

    dojo.requireIf= dojo.requireAfterIf= function(condition) {
      // NOTE: removed the requirement that condition===true; now condition just needs to be truthy;
      // This works for all usages in dojo/dijit/dojox.

			for(var i= 1; condition && i<arguments.length; dojo.require(sieModuleName(arguments[i++])));
		};

});
// Copyright (c) 2008-2010, Rawld Gill and ALTOVISO LLC (www.altoviso.com). Use, modification, and distribution subject to terms of license.
