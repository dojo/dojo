define("dojo/_base/kernel", ["dojo"], function(dojo) {

  dojo.config= dojo.config || require.config.dojo || {};

  dojo.doc= document;

  dojo.isEmpty= function(it) {
    for (var p in it) return false;
    return true;
  };

  if (require.config.consoleGuarantee) {
    // dojo guarantees the following debugging functions are always available, although they may be no-ops.
    var 
      global= dojo.global,
      console= global.console || {},
      consoleLog= console.log || function(){},
      consoleFunctions= "log.assert.count.debug.dir.dirxml.error.group.groupEnd.info.profile.profileEnd.time.timeEnd.trace.warn".split("."),
      i= consoleFunctions.length,
      consoleMethodName;
    while (i--) {
      consoleMethodName= consoleFunctions[i];
      if (!console[consoleMethodName]) {
        console[consoleMethodName]= function(a){consoleLog(a);};
      }
    }
    if (!global.console) {
      global.console= console;
    }
  }

  if (require.config.openAjaxHubRegister) {
    if(typeof OpenAjax != "undefined"){
	    OpenAjax.hub.registerLibrary(dojo.name, "http://dojotoolkit.org", d.version.toString());
	  }
  }

  var
    empty= {},
    extraNames= 0,
    extraLen= 0;
  if (require.config.targetIe) {
    extraNames= 
      // Object prototype functions
      "hasOwnProperty.valueOf.isPrototypeOf.propertyIsEnumerable.toLocaleString.toString.constructor".split(".");
    extraLen= 7;
    for(var i in {toString: 1}) {
      //if the JavaScript interpreter properly finds toString, then mixin won't have to inspect the extra names...
      extraNames= extraLen= 0; 
      break;
    }
  }
  dojo._extraNames= extraNames;

  //-1
  // The design, but not semantics, of dojo.mixin is changed.
  //
  // 1. The preferred name is dojo.mix since a "mixin" is a concept of OO programming, whereas
  //    "mixing" properties is a different concept. "mix" is also shorter. dojo.mixin and dojo._mixin 
  //    remain available as aliases to dojo.mix.
  // 
  // 2. The availability of the separate function dojo._mixin that mixes just one object into another compared to a function
  //    that mixes any number of objects into another is eliminated--it's not worth the function point.
  // 
  // 3. An alternative mix implementation is available that does not check to see if Object prototype methods are being 
  //    copied. This version is faster and works perfectly for cases when client code is not concerned with this protective
  //    aspect dojo.mixin.
  //
  if (require.config.fastMix) {
    dojo.mix= function() {
      ///
      // RCGTODOC
      var 
        args= arguments,
        length= arguments.length - 1,
        overwrite= (args[length] instanceof Object) ? true : args[length--],
        result= args[0] || {},
        source, name, value,
        i= 1;
      while (i<=length) {
        source= args[i++];
        for (prop in source) {
          if (overwrite || !(prop in result)) {
            result[prop] = source[prop];
          }
        }      
        if (require.config.targetIe) {
          if(extraLen && source){
            for(j = 0; j < extraLen;){
              name = extraNames[j++];
              value = source[name];
              if(!(name in result) || (result[name] !== value && (!(name in empty) || empty[name] !== value))){
                result[name] = value;
              }
            }          
          }
        }
      }
      return result;
    };
  }

  if (require.config.safeMix) {
  	dojo.mix= function() {
      var 
        args= arguments,
        length= arguments.length - 1,
        result= args[0] || {},
        source, name, value,
        i= 1;
      while (i<=length) {
        source= args[i++];
        for (name in source) {
          value = source[name];
          if(!(name in result) || (result[name] !== value && (!(name in empty) || empty[name] !== value))){
            result[name] = value;
          }
        }
        if (require.config.targetIe) {
          if(extraLen && source){
            for(j = 0; j < extraLen;){
              name = extraNames[j++];
              value = source[name];
              if(!(name in result) || (result[name] !== value && (!(name in empty) || empty[name] !== value))){
                result[name] = value;
              }
            }          
          }
        }
      }
      return result;
  	};
  }

  dojo.mixin= dojo._mixin= dojo.mix;
 
  dojo.deprecated= dojo.experimental= function(){};

  //-2
  // Slight changes introduced to set/getObject:
  // 
  // 1. set/getObject names changed to set/get; old names aliased to the new names. 
  //    "setObject" and "getObject" is needlessly longer than "set"/"get". This design should not interfere
  //    with JavaScript setters and getters.
  // 
  // 2. The concept of dojo._scopeMap goes way with the script inject loader; this required very minor mods to the 
  //    algorithm to find the root object.
  //
  var 
    set= dojo.set=
    function(
      name,   //(string) the name in context to set
      value,  //(any) the value to place at name in context
      context //(object [dojo.global]) the object that contains name
    ) {
      var
        parts= name.split("."), 
        i= 0, end=parts.length-1;
      if (!context) {
        if ((context= require.module(parts[0]))) {
          i++;
        } else {
          context= dojo.global;
        }
      }
      while (i<end) {
        name= parts[i++];
        context= context[name]= context[name] || {};
      }
      return (context[parts[i]]= value);
    },

    get= dojo.get=
    function(
      name,        //(jsName)
      context,     //(falsy) root object for name is given by dojo.global
                   //(string) root object for name is given by require.module(context);
                   //(otherwise) root object for name
      defaultValue //(any, optional)
    ) { 
      var
        create= arguments.length==3,
        parts= name.split("."), 
        p, i= 0, end=parts.length - 1;
      if (!context) {
        if ((context= require.module(parts[0]))) {
          i++;
        } else {
          context= dojo.global;
        }
      }
      while (i<end) {
        p= parts[i++];
        if ((context===undefined || !(p in context)) && create) {
           context[p]= {};
        }
        context= context[p];
      }
      p= parts[i];
      return (context && context[p]!==undefined) ? context[p] : (create ? (context[p]= defaultValue) : undefined);
    };
   
  //backcompat
  dojo.setObject= set;

  //-3
  // A fourth parameter was added, defaultValue, which gives a default value to initialize the target property if
  // it does not exist.
  dojo.getObject=
    function(
      name,        //(string) the name in context to set
      create,      //(boolean) truthy will cause a value to be created if one doesn't exist;
                   // if create is an object, then it is interpreted as the context and
                   // create defaults to false
      context,     //(object [dojo.global]) the object that contains name
      defaultValue //(any, [{}]) the value to create if one doesn't exist
    ) {
      // summary:
      //    Get a property from a dot-separated string, such as "A.B.C"
      //  description:
      //    Useful for longer api chains where you have to test each object in
      //    the chain, or when you have an object reference in string format.
      //  name:
      //    Path to an property, in the form "A.B.C".
      //  create:
      //    Optional. Defaults to `false`. If `true`, Objects will be
      //    created at any point along the 'path' that is undefined.
      //  context:
      //    Optional. Object to use as root of path. Defaults to
      //    'dojo.global'. Null may be passed.
      return (create instanceof Object || !create) ? get(name, context) : get(name, context, defaultValue||{});
    };

  dojo.exists=
    function(/*String*/name, /*Object?*/obj){
      //  summary:
      //    determine if an object supports a given method
  		//	description:
  		//		useful for longer api chains where you have to test each object in
  		//		the chain. Useful only for object and method detection.
  		//		Not useful for testing generic properties on an object.
  		//		In particular, dojo.exists("foo.bar") when foo.bar = ""
  		//		will return false. Use ("bar" in foo) to test for those cases.
  		//	name:
  		//		Path to an object, in the form "A.B.C".
  		//	obj:
  		//		Object to use as root of path. Defaults to
  		//		'dojo.global'. Null may be passed.
  		//	example:
  		//	|	// define an object
  		//	|	var foo = {
  		//	|		bar: { }
  		//	|	};
  		//	|
  		//	|	// search the global scope
  		//	|	dojo.exists("foo.bar"); // true
  		//	|	dojo.exists("foo.bar.baz"); // false
  		//	|
  		//	|	// search from a particular scope
  		//	|	dojo.exists("bar", foo); // true
  		//	|	dojo.exists("bar.baz", foo); // false
  		return !!get(name, obj);
  	};

});
// Copyright (c) 2008-2010, Rawld Gill and ALTOVISO LLC (www.altoviso.com). Use, modification, and distribution subject to terms of license.
