(function(
  name //the name of the global variable in which to define an instance of the loader.
) {
  //
  // This function defines the dojo-sie loader.
  //
  // The function definition assumes the browser environment, but this can be overridden by 
  // causing certain required definitions prior to evaluating this function. 
  // See dojo/_base/environment/rhino for an example.
  // 
  // The function definition also contains code that causes the loader, once defined, to bootstrap
  // dojo. As such, this code also serves as the non-build dojo-sie bootstrap. If you are deploying 
  // a production application, you almost-certainly want a built version of dojo:
  // 
  // 1. For an optimal system, create a custom build that includes only the
  //    code that your application actually uses. Several dojo resources (including this resource)
  //    include machinery that allows the build system to selectively discard code not required
  //    for your particular application.
  // 
  // 2. For a dramatically more effecient system without going to the trouble of a custom
  //    build, consider the following options:
  // 
  //    * dojo-sie-all.js: built-version equivalent to this resource
  //    * dojo-sie-w3c.js: built-version equivalent to the features of this resource, but
  //      without IE support. This version is significantly smaller that dojo-sie.js
  //    * dojo-go.js: built-version of dojo without loader or dojo.declare
  //    * dojo-sie-ffe.js: built-version equivalent, customized with support to build
  //      Firefox extensions
  //    * dojo-sie-rhino.js: built-version equivalent for use in Rhino.
  //    * dojo.sie-spider.js: built-version equivalent for use in SpiderMonkey.
  // 
  // By default, loader definitions are targeted to the global variable "require"; however, this
  // can be overridden by rewriting the application of this function (i.e., the second-to-last
  // line of this file). This design is useful for creating builds where dojo-sie.js and 
  // other resources are all bundled within a single file that defines a completely 
  // independent space of objects (e.g., a library or entire application).
  // 
  // Many definitions given below may be overridden by defining them prior to evaluating this
  // resource (in particular, every definition set with the function "init"). For example, the 
  // following code overrides the default baseUrl discovery machinery, sets up a url resolver, 
  // and gives a set of modules to start downloading immediately and load after completion of
  // the bootstrap.
  // 
  // <script type="text/javascript">
  //   require= {
  //     baseUrl:"/path/to/my/base/",
  //     urlMap:[[/^acme\//, "/public/js"]],
  //     load:["acme/main", "acme/util", "acme/widgets"]
  //   };
  // </script>
  // <script src="/path/to/this/resource/dojo-sie.js">
  // </script>
  //

  // usually, but not necessarily, name is "require"; this code uses the variable name require
  // to make things easy to read.
  var
    global= this,
    require= global[name] || (global[name]=  function(
      deps, //(array of loader.moduleName, optional) list of modules that must be loaded prior to executing def
      f     //(funciton, optional) lamda expression to apply to deps
    ) {
      ///
      // Require some dependents, than apply those dependents to a lambda expression
      require.onModule("*" + require.uid(), deps, f);
      require.checkComplete(name);
    });

  // this routine cannot be called more than once for a particular name;
  // it can be called any number of times with different names
  if (require.defined) {
    return;
  } 
  require.defined= true;

  // remember the global space this loader variable is defined within
  // remember the name of the loader variable in that global space
  // require.global[require.name]==require is always true
  require.global= global;
  require.name= name;

  // initialize require.config
  // In addition to normal run-time configuration settings, require.config can be used to cause a build
  // system to delete code from a build by understanding that some config value are constants and to
  // delete code accordingly. For example, assume that require.config.trace==0, then...
  // 
  // if (require.config.trace) {
  //   //path-a
  // } else {
  //   //path-b
  // }
  // 
  // would cause a build system with static analysis (e.g. Google's closure compiler) to include only 
  // path-b, stripping the if statement and path-a. Continuing this example, if path-b defined the
  // function require.trace as
  // 
  // require.trace= function(){}
  // 
  // Then a build system would remove all applications of require.trace, and, even the definition of
  // require.trace.
  // 
  // This design allows testing build paths without doing a build by simply setting
  // configuration switches. It also improve source code readability and removes the extra layer
  // of complexity associated with build pragmas. Sadly, there are still some cases where build
  // pragmas are required.
  var config= require.config= require.config || {};

  if (!config.build) {
    var defaultConfig= {
      build:0,                 //true iff doing a build
      webkitMobile:0,          //true iff building for webkitMobile target
      targetBrowser:1,         //true iff code should target the browser
      targetIe:1,              //true iff code should support IE
      fastMix:0,               //true iff the fast version of mix is selected
      safeMix:1,               //true iff the safe version of mix is selected
      v1xConfig:1,             //true iff include backcompat hack for djConfig
      v1xRegisterModulePath:1, //true iff include backcompat hack for dojo.registerModulePath
      v1xModuleUrl:1,          //true iff include backcompat hack for dojo.moduleUrl
      v1xI18n:1,               //true iff include backcompat hack for v1.x i18n API
      v1xCache:1,              //true iff include backcompat hack for v1.x cache API
      v1xRequire:1,            //true iff include backcompat hack for v1.x dojo.require/requireIf/platformRequire/provide
      v1xAliases:1,            //true iff include backcompat hack for v1.x variable names
      v1xScopeNames:1,         //true iff include backcompat hack for dojo._scopeNames
      v1xGlobals:1,            //true iff include backcompat hack to put dojo, dijit, and dojox into global space
      consoleGuarantee:1,      //true iff guarantee console functions
      sniffBaseUrl:1,          //true iff include baseUrl sniffing
      onError:1,               //true iff include default onError handler
      trace:{},                //true iff trace key loader events
      pageLoadDetect:1,        //true iff include DOMContentLoaded detection
      openAjaxHubRegister:1,   //true iff include open Ajax hub registrar
      bootDojo:1,              //true iff include dojo bootstrap
      loaderOnly:0,            //true iff include dojo bootstrap
      loaderCatchExceptions:0  //true iff loader protects module execs and onLoad execs with try/catch/onError handing
    }, p;
    for (p in defaultConfig) {
      if (config[p]===undefined) {
        config[p]= defaultConfig[p];
      }
    }
  }

  var 
    init= require.init=
      // we allow advanced users to provide an alternate definition for many things
      // by allowing require to be defined prior to entry
      function(name, defaultValue) {
        return (require[name]= require[name]!==undefined ? require[name] : defaultValue);
      },

    isEmpty= function(it) {
      for (var p in it) return false;
      return true;
    },
    
    isFunction= function(it) {
      return (typeof it=="function");
    },
    
    isString= function(it) {
      return (typeof it=="string");
    };

  if (require.config.trace) {
    // tracing interface by group
    // 
    // the "loader" group is the only group used by dojo-sie; in order to turn tracing on
    // execute "require.config.trace.loader= true;"
    require.trace= function(group, args) {
      if (config.trace[group]) {
        if (console.log.apply) {
          console.log.apply(console, args);
        } else {
          //IE...
          for (var i= 0; i<args.length; i++) {
            console.log(args[i]);
          }
        }
      }
    };
  } else {
    require.trace= function(){};
  }

  //
  // Error Detection and Recovery
  //
  // Several things can go wrong during loader operation:
  //
  // * A resource may not be accessible, giving a 404 error in the browser or a file error in other environments
  //   (this is usally caught by a loader timeout (see require.loadTimeout) in the browser environment).
  // * The loader may timeout (after the period set by require.loadTimeout) waiting for a resource to be delivered.
  // * Executing a module may cause an exception to be thrown.
  // * Executing the onLoad queue may cause an exception to be thrown.
  // 
  // In all these cases, the loader publishes the problem to interested subscribers via the function require.onError
  // and halts all operations unless some subscriber signals that it has taken actions to recover and it is OK
  // to continue. Such a signal is caused by a listener returning true; if no listener does so, then the
  // exception is rethrown.
  // 
  // Notice that all loader data and machinery is public, thus allowing knowledgable client code to recover
  // from loader errors and leave the loader in a non-error state.

  var onError= require.onError= function(
    messageId, //(string) The topic to publish
    args       //(array of anything, optional, []) The arguments to be applied to each subscriber.
  ) {
    ///
    // Publishes messageId to all subscribers, passing args; returns result as affected by subscribers.
    ///
    // A listener subscribes by writing
    // 
    //code
    // require.onError.listeners.push(myListener);
    ///
    // The listener signature must be `function(messageId, args`) where messageId indentifies 
    // where the exception was caught and args is an array of information gathered by the catch
    // clause. If the listener has taken corrective actions and want to stop the exception and
    // let the loader continue, it must return truthy. If no listener returns truthy, then
    // the exception is rethrown.

    for (var errorbacks= onError.listeners, result= false, i= 0; i<errorbacks.length; i++) {
      result= result || errorbacks[i](messageId, args);
    }
    console.error(messageId);
    onError.log.push(args);
    return result;
  };
  onError.listeners= [];
  onError.log= [];

  //
  // Generic browser environment definition
  //
  if (require.config.targetBrowser) {
    require.host= "browser";
    var
      doc= document,
  
      head= doc.getElementsByTagName("head")[0] || doc.getElementsByTagName("html")[0],
     
      w3cEvents= doc.addEventListener,

      addNodeEvent= require.addNodeEvent= function(node, eventName, handler, useCapture, ieEventName) {
        // Add an event listener to a DOM node using the API appropriate for the current browser; return a function
        // that will disconnect the listener.
        if (w3cEvents) {
          node.addEventListener(eventName, handler, !!useCapture);
          return function() {
            node.removeEventListener(eventName, handler, !!useCapture);
          };
        } else if (ieEventName!==false) {
          eventName= ieEventName || "on"+eventName;
          node.attachEvent(eventName, handler);
          return function() {
            node.detachEvent(eventName, handler);
          };
        } else {
          return function(){};
        }
      };

    init("injectScript", function(url, callback) {
      // Append a script element to the head element with src=url; apply callback upon detecting the script has loaded.
      var 
        node= doc.createElement("script"),
        onLoad= function(e) {
          e= e || window.event;
          var node= e.target || e.srcElement;
          if (e.type==="load" || /complete|loaded/.test(node.readyState)) {
            disconnector();
            callback && callback.call();
          }
        },
        disconnector= addNodeEvent(node, "load", onLoad, false, "onreadystatechange");
      node.src= url;
      node.type= "text/javascript";
      node.charset= "utf-8";
      head.appendChild(node);
    });

    if (require.config.pageLoadDetect) {
      // page load detect code derived from Dojo, Copyright (c) 2005-2010, The Dojo Foundation. Use, modification, and distribution subject to terms of license.

      //warn
      // document.readyState does not work with Firefox before 3.6. To support
      // those browsers, manually init require.pageLoaded in configuration.
    
      // require.pageLoaded can be set truthy to indicate the app "knows" the page is loaded and/or just wants it to behave as such
      init("pageLoaded", doc.readyState=="complete");

      // no need to detect if we already know...
      if (!require.pageLoaded) {
        var
          loadDisconnector= 0,
          DOMContentLoadedDisconnector= 0,
          scrollIntervalId= 0,
          detectPageLoadedFired= 0,
          detectPageLoaded= function() {
            if (detectPageLoadedFired) {
              return;
            }
            detectPageLoadedFired= 1;
      
            if (scrollIntervalId) {
              clearInterval(scrollIntervalId);
              scrollIntervalId = 0;
            }
            loadDisconnector && loadDisconnector();
            DOMContentLoadedDisconnector && DOMContentLoadedDisconnector();
            require.pageLoaded= true;
            require.onLoad();
          };
      
        if (!require.pageLoaded) {
          loadDisconnector= require.addNodeEvent(window, "load", detectPageLoaded, false);
          DOMContentLoadedDisconnector= require.addNodeEvent(doc, "DOMContentLoaded", detectPageLoaded, false, false);
        }
      
        //DOMContentLoaded approximation. Diego Perini found this MSDN article
        //that indicates doScroll is available after DOM ready, so do a setTimeout
        //to check when it is available.
        //http://msdn.microsoft.com/en-us/library/ms531426.aspx
        //!w3cEvents implies IE
        if(!w3cEvents && !require.config.skipIeDomLoaded && self === self.top){
          scrollIntervalId = setInterval(function (){
            try{
              //When require is loaded into an iframe in an IE HTML Application 
              //(HTA), such as in a selenium test, javascript in the iframe
              //can't see anything outside of it, so self===self.top is true,
              //but the iframe is not the top window and doScroll will be 
              //available before document.body is set. Test document.body
              //before trying the doScroll trick
              if(doc.body){
                doc.documentElement.doScroll("left");
                detectPageLoaded();
              }
            }catch(e){}
          }, 30);
        }
      }
    } else {
      init("pageLoaded", true); 
    }
  }

  //addOnLoad API is guaranteed even for loaderless builds and/or builds that don't detect DOMContentLoaded...
  var
    waiting=
      // The set of modules upon which the loader is waiting.
      require.waiting= {},
  
    loadQ= 
      // The queue of functions waiting to execute as soon as all conditions given
      // in require.onLoad are satisfied; see require.onLoad
      init("loadQ", []),

    postBootList=
      // The list of modules to inject after the bool completes
      [],

    bootComplete=
      // Flag that says if the boot sequence has completed so we can request/execute plugins and/or non-boot modules, if any.
      1;

  require.modulesExecuted= 
    // flag that indicates truthy iff all requested modules have been loaded and executed
    !0;

  require.addOnLoad= function(
    context, //(object) The context in which to run execute callback
             //(function) callback, if context missing
    callback //(function) The function to execute.
  ) {
    ///
    // Add a function to execute when the page is loaded and all requests have arrived and been evaluated.

    if (callback) {
      isString(callback) && (callback= context[callback]);
      loadQ.push(function() {
        callback.call(context);
      });
    } else {
      loadQ.push(context);
    }
    require.onLoad();
  };

  require.onLoad= function() {
    ///
    // Inject the postBootList if non-empty, then check and possibly run the the load queue.

    while (bootComplete && postBootList.length) {
      require.injectModule(postBootList.shift());
    }
    while (require.pageLoaded && require.modulesExecuted===true && isEmpty(waiting) && loadQ.length) {
      //guard against recursions into this function
      waiting["*"]= true;
      var f= loadQ.shift();
      if (require.config.loaderCatchExceptions) {
        try {
          f.call(null);
        } catch (e) {
          if (!require.onError("loader/onLoad", [e])) {
            throw e;
          }
        }
      } else {
        f.call(null);
      }
      delete waiting["*"];
    }
  };

  //
  // Generic script-inject loader definition.
  //
  // At this point the following conditions must be meant:
  //
  // * the lexical variable "require" references an object that is the destination for the loader
  // * require.global[require.name]===require
  // * require.defined===true
  // * require.host is one of "browser", "ffe" (firefox extension), "rhino", "spider" (SpiderMonkey)
  // * require.injectScript is defined with semantics given above
  // * require.init is defined with semantics given above
  // 
  // The require object may contain several other definitions that override standard loader behavior
  // and/or define other machinery.
  //
  var
    // a session-wide uid generator is extremely useful; we'll use it in the loader.
    uidSeed= 
      1,
    uid= 
      init("uid", function() { return "_" + uidSeed++; }),
    
    modules= 
      // A hash: (name) --> (deps, def, result):
      // 
      //   deps: an array of module names that must be evaluated prior
      //   to this module being evaluated (i.e., dependencies).
      // 
      //   def: anything: If a function, then the result of applyling this function 
      //   to the results of the dependent modules gives this module's result; otherwise,
      //   defines the result of the module directly.
      // 
      //   result: the "value" of this module. This is computed after all dependent
      //   module (if any) values are evaluated; see previous.
      // 
      // Notice that modules could be defined and optionally evaluated before entry to
      // this bootstrap, thus allowing some modules to be available without any network IO.
      // This is useful for build systems.
      // 
      // Modules go through several phases in creation:
      // 
      // 1. Requested: some other module's definition contains the requested module in
      //    its dependency vector or executing code explicitly demands a module via require.req.
      // 
      // 2. Injected: require.injectScript has been applied to the URL implied by the module name.
      // 
      // 3. Loaded: the resource injected in [2] has been evaluated.
      // 
      // 4. Defined: the resource contained a require.def statement that advised the loader
      //    about the module. Notice that some resources may just contain a bundle of code
      //    and never formally define a module via require.def.
      // 
      // 5. Evaluated: the module was defined via require.def and the loader has evaluated the module and computed a result.
      init("modules", {}),

    moduleExecQ= 
      // The list of modules that need to be evaluated. An attempt is made to evaluate modules
      // in the order they are requested in the code. However, the dependency vectors may 
      // override this order.
      init("moduleExecQ", []),

    pluginExecQ= 
      // The list of plugin modules that need to be evaluated. This are always evaluated as soon as
      // possible, but after the boot sequence has completed. Plugins need to be defined first normal
      // modules in the queue may specifiy a plugin module as a dependency. Since the loader can't 
      // evaluate these modules (that's the whole purpose of a plugin), we need to make sure the 
      // plugin is defined. Of course the plugin itself can have dependencies to ensure it has a
      // sufficient environment for it to execute.
      init("pluginExecQ", []),

    injectedUrls=
      // The set of URLs that have been injected.
      init("injectedUrls", {}),

    plugins=
      // A hash from plugin name to plugin; a plugin is an object that defines two functions:
      // 
      //   1. inject(name, ...)
      // 
      //   When require.req (directly or during dependency list processing) is called to load a
      //   module, require.getPlugin determines if the named module references a plugin. If so,
      //   processing of the load request is delegated to the plugin module through this 
      //   function. For example...
      // 
      //     define("myModule", [i18n!my/nls/messages], function() { /*...
      // 
      //   Sees that i18n! designates a plugin, and therefore delegates the inject by causing
      // 
      //     require.plugins["i18n"].inject("i18n!my/nls/messages");
      //   
      //   2. def(name, deps, def)
      // 
      //   When a plugin module arrives and attempts to define itself, the require.def function
      //   delegates to this function. For example,
      // 
      //     define("i18n!my/nls/messages", ...
      // 
      //   results in
      // 
      //     require.plugins["i18n"].def("i18n!my/nls/messages", ...
      init("plugins", {}),

    pluginRe=
      // What is a plugin module? Any module that matches the regex.
      init("pluginRe", /^(\w+)!/),

    getPlugin= function(name) {
      // Returns the plugin if name designates a plugin module; falsy otherwise.
      var match= pluginRe.exec(name);
      return match && (plugins[match[1]] || require.loadPlugin(match[1]));
    },

    // Timer machinery that monitors how long the loader is waiting and signals
    // an error when the timer runs out.
    timerId=
      0,
    clearTimer= function() {
      timerId && clearTimeout(timerId);
      timerId= 0;
    },
    startTimer= function() {
      clearTimer();
      require.loadTimeout && (timerId= setTimeout(function() { 
        clearTimer(); 
        require.onError("loader/timeout"); 
      }, require.loadTimeout));
    },

    urlMap= 
      init("urlMap", []),
    url=
      init("url", function (name, ext) {
        // Translates name (a module name) into a URL. Here's the algorithm in English:
        // 
        // 1. If ext is truthy, then append ext to name; otherwise, if ext is falsy but 
        //    not undefined, don't append anything to name; otherwise (ext is undefined),
        //    if name has a dot after the last slash, then assume that's a file type and don't
        //    append anything; otherwise, append ".js".
        // 
        // 2. Search require.urlMap for a translation of the name calculated in Step 1. From
        //    the front to the back of the urlMap array, if the item is a function, apply
        //    the function to name; if it returns something, then that's the translation. If
        //    the item is not a function, then is must be a pair of [regex, replacement-text].
        //    If the name matches the regex, then replace the match with the replacement-text
        //    and that's the translation. Finally, if nothing in the urlMap results in a 
        //    translation, just return the name.
        var 
          dotIndex= name.lastIndexOf("."),
          slashIndex= name.lastIndexOf("/"),
          hasType= dotIndex>slashIndex || (dotIndex!=-1 && slashIndex==-1);
        name+= ((ext===undefined && !hasType) ? ".js" : (ext ? ("." + ext) : ""));
        var result, item, i= 0; 
        while (!result && i<urlMap.length) {
          item= urlMap[i++];
          if (isFunction(item)) {
            result= item(name);
          } else {
            result= item[0].test(name) && name.replace(item[0], item[1]);
          }
        }
        return result || name;
      }),

    pause=
      // See require.pause.
      init("pause", false);

  // The loader timeout length
  //TODO: consider appropriate value.
  init("loadTimeout", 3000);

  require.onModule= function(
    name, //(loader.moduleName) the module name
    deps, //(loader.dependencyVector) the module dependency vector
          //(falsy) no dependencies
    def   //(any) the module definition; a function implies that the def must be executed in order to define the module
  ) {
    ///
    // Define the module; if the module has dependecies, request them; schedule the module for evaluation.

    require.trace("loader", ["require.onModule:"+name]);
    if (!modules[name]) {
      modules[name]= {
        deps:deps,
        def:def
      };
      moduleExecQ.push(name);
      delete waiting[name];
      require.req(deps);
    }
  };

  require.injectModule= function(
    name, //(loader.moduleName) The module to inject.
    force //(boolean) Inject the module even if it's already here
  ) {
    ///
    // Inject the resource implied by name into the system. //In the browser environment,
    // this means appending a script element into the head; in other environments, it means loading a file.
    if (!bootComplete) {
      postBootList.push(name);
      return;
    }

    // attempt to execute in the order requested; dependency vectors may change this.
    moduleExecQ.push(name);
    var plugin= getPlugin(name);
    if (plugin) {
      plugin.inject(name);
      return;
    }
    if (force) {
      delete modules[name];
      delete waiting[name];
    }
    if (pause) {
      pause.push(name);
    } else if (!modules[name] && !waiting[name]) {
      var url= require.url(name);
      waiting[name]= true;
      require.modulesExecuted= 0;
      if (!force && injectedUrls[url]) {
        return;
      }
      injectedUrls[url]= true;
      waiting["*"+url]= true;
      require.injectScript(url, function() { 
        delete waiting["*"+url];
        delete waiting[name]; 
        require.checkComplete();
      });
      startTimer();
    }
  };

  require.checkComplete= function() {
    ///
    // If not waiting, define all modules in the moduleExecQ and run the on-load queue.
    // 
    // Notice that if a module throws when it is executed, require.waiting["*"] will be true for
    // forever and the loader will refuse to execute more modules until it is reset by client
    // code. The alternative is to catch here and continue, pretending that everything is OK. 
    // But, a prerequisite module failing to fully define is at least as bad as a module 
    // failing to download; therefore we choose to behave at least as conservatively and stop
    // the loader until client code--which after all knows about its own design--can make the
    // proper decisions about how to get going again (or not).
    while (!pause && isEmpty(waiting) && (pluginExecQ.length || moduleExecQ.length)) {
      clearTimer();
      //all injected modules have been received; define them
      //guard against recursions into this function (possibly caused by executing a module)
      waiting["*"]= true;
      require.execModule((bootComplete && pluginExecQ.shift()) || moduleExecQ.shift());
      delete waiting["*"];
    }
    if (!pause && isEmpty(waiting)) {
      clearTimer();
      require.modulesExecuted= true;
      require.onLoad();
    }
  };

  require.execModule= function(
    name //(loader.moduleName) The module to execute.
  ) {
    ///
    // Evaluate the module.

    var deps, module= modules[name];
    if (!module) {
      // a chunck of code was downloaded and already executed as a dependency that didn't define a module
      return undefined;
    } else if (!module.executed) {
      // depth-first evaluation of all dependencies
      module.executed= true;
      deps= module.deps;
      if (deps) {
        for (var args= [], i= 0; i<deps.length; i++) {
          args.push(require.execModule(deps[i]));
        }
      }
      require.trace("loader", ["require.execModule:"+name]);
      if (require.config.loaderCatchExceptions) {
        try {
          module.result= (isFunction(module.def) ? module.def.apply(null, args) : module.def);
        } catch (e) {
          if (!require.onError("loader/exec", [e, name].concat(args))) {
            throw e;
          }
        }
      } else {
        module.result= (isFunction(module.def) ? module.def.apply(null, args) : module.def);
      }
    }
    return module.result;
  };

  require.loadPlugin= function(
    name //(loader.moduleName) The plugin to load.
  ) {
    ///
    // Load a plugin.

    pluginExecQ.push("plugin/"+name);
    require.injectModule("plugin/"+name);
    return (plugins[name]= {
      // while we're waiting for the plugin, there may be one or more reqs/defs for/of plugin
      // modules. A simple proxy plugin is defined while we wait for the real thing. The proxy
      // just queues up the service requests; when the real plugin arrives it can process 
      // these queues and redefine inject and def. See dojo/_base/text and dojo/_base/i18n 
      // for canonical examples.
      injectQ: [],
      defQ: [],
      inject: function(name) { 
        this.injectQ.push(name); 
      },
      def: function(name, deps, def) { 
        this.defQ.push([name, deps, def]); 
      }
    });
  };

  define = require.def= function(
    name, //(string, optional) optional module name, with optional plugin or context prefix
    deps, //(array of loader.moduleName, optional) list of modules that must be loaded prior to executing def
    def   //(any, optional) lamda expression or any data that defines a module
  ) {
    ///
    // Define a module; this is the function a module calls to define itself.

    if (!isString(name)) {
      def= deps;
      deps= name;
      name= "*" +  require.uid();
    } else {
      var plugin= getPlugin(name);
      if (plugin) {
        plugin.def(name, deps, def);
        return;
      }
      if (arguments.length==2) {
        def= deps;
        deps= [];
      }
    }
    require.onModule(name, deps, def);
    require.checkComplete(name);
  };

  require.undef= function(
    name //(loader.moduleName) The module to undefine.
  ) {
    ///
    // In order to reload a module, it must be undefined (this routine) and then re-requested.
    // This is useful for testing frameworks (at least).

    delete modules[name];
  },

  require.req= function(
    vargs //(string or array of string) Zero of more strings or arrays of string that are module names to request to load.
  ) {
    ///
    // Request a module

    for (var arg, j, i= 0; i<arguments.length; i++) {
      arg= arguments[i];
      if (arg instanceof Array) {
        for (j= 0; j<arg.length; j++) {
          require.injectModule(arg[j]);
        }
      } else {
        require.injectModule(arg);
      }
    }
  };
  
  require.module= function(
    name //(loader.moduleName) the name of the module to retrieve
  ) {
    ///
    // Return the result for the module given by name

    return modules[name] && modules[name].result;
  };
  
  require.pause= function() {
    ///
    // Remember any modules that need to be requested, but wait to request until require.resume is called.

    pause= [];
  };
  
  require.resume= function() {
    ///
    // Request all modules that were remembered since the last require.pause that have not been defined by some other means.

    var temp= pause;
    pause= 0;
    require.req(temp);
    require.checkComplete();
  };


  if (require.config.sniffBaseUrl) {
    //TODO: rethink the baseUrl logic; seems too smart by half

    var 
      defaultBaseUrlRe,
      djConfigBaseUrl= 0,
      baseUrlMatcher= function(s) {
        //convert a string to a regular expression matching a string that begins with exactly that string
        return RegExp("^"+s.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(ch) { return "\\" + ch; }));
      };

    if (require.config.loaderOnly) {
      defaultBaseUrlRe= /require\.js$/; // finds anything that ends in "require.js"
    } else {
      defaultBaseUrlRe= /dojo[^\/\.]*\.js$/; // finds anything that ends in "dojo<any suffix>.js"
    }

    if (require.config.v1xConfig) {
      djConfigBaseUrl= (global.djConfig && djConfig.baseUrl && baseUrlMatcher(djConfig.baseUrl));
    }

    var
      baseUrlRe=
        // Describes how to find a script element that telegraphs baseUrl
        // Notice that this method does not require that this bootstrap was
        // the particular script indicated.
        init("baseUrlRe", (
          (require.baseUrl && baseUrlMatcher(require.baseUrl)) || // if baseUrl is given, then match it exactly
          djConfigBaseUrl || // backcompat for djConfig
          defaultBaseUrlRe) // default; this finds "dojo<any suffix>.js"
        ),
  
      baseUrl=
        // Figure out baseUrl; notice that, given the way init works, the function will be evaluated even if
        // baseUrl is provided. This must be done for the backcompat hack that decodes djConfig from the
        // base node "djConfig" attribute (see dojo/_base/backCompat.js)
        init("baseUrl" , (function() {
          for (var match, src, scripts = doc.getElementsByTagName("script"), i= scripts.length; i--;) {
            src= scripts[i].getAttribute("src") || "";
            if ((match= src.match(baseUrlRe))) {
              // remember the base node for the backcompat hack that finds djConfig as an attribute of this node.
              // see in _base/backCompat.js for details
              // TODO: remove this when the hack goes away
              require.baseNode= scripts[i];
              return src.substring(0, match.index) || "./";
            }
          }
          return "./";
        })());
  }     

  //
  // Generic dojo bootstrap
  // 
  if (require.config.bootDojo) {

    // The following url resolvers assume the standard dojo project directory layout. Since these are
    // pushed on to the end of the map, if any of these particular module name patterns were already
    // configured by the user, then dojo.url will find the user-configured resolver first.
    urlMap.push(
      //a great example of disk layout decoupled from module name...
      [/^dojo\/_base\/environment/, baseUrl+"_base/environment/"+require.host],

      [/^dojo\//, baseUrl],
      [/^dijit\//, baseUrl+"../dijit/"],
      [/^dojox\//, baseUrl+"../dojox/"],
      [/^doh\//, baseUrl+"../util/doh/"],

      // the dojo-supplied plugins
      [/^plugin\/i18n/, baseUrl+"_base/i18n"],
      [/^plugin\/shtml/, baseUrl+"_base/text"],
      [/^plugin\/sxml/, baseUrl+"_base/text"],
      [/^plugin\/text/, baseUrl+"_base/text"],

      //default
      [/.*/, function(name){ 
        return /(^\/)|(\:)/.test(name) ? name : baseUrl + name;
      }]
    );

    // initialize the three dojo modules
    var 
      dojo= global.dojo || require.dojo || {},
      dijit= {},
      dojox= {};
    dojo.global= global;
    define("dojo", dojo);
    define("dijit", dijit);
    define("dojox", dojox);

    if (require.config.v1xScopeNames) {
      dojo._scopeName= "dojo";
      dijit._scopeName= "dijit";
      dojox._scopeName= "dojox";
      dojo._scopeMap= dojo._scopeMap || {};
      dojo._scopeMap.dojo= "dojo";
      dojo._scopeMap.dijit= "dijit";
      dojo._scopeMap.dojox= "dojox";
    }

    if (require.config.v1xGlobals) {
      // currently (SEP 2010) lots of tests and other code depends on this
      global.dojo= dojo;
      global.dijit= dijit;
      global.dojox= dojox;
    }

    if (require.config.v1xAliases) {
      var sieModuleName= function(moduleName) {
        return moduleName.replace(/\./g, "/");
      };

      dojo.require= function(moduleName) {
        require.req(sieModuleName(moduleName));
      };
  
      dojo.requireIf= function(predicate, moduleName) {
        predicate && require.req(sieModuleName(moduleName));
      };
  
      dojo.provide= function(moduleName) {
        dojo.getObject(moduleName, true);
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
        for(var i= 1; condition && i<arguments.length; dojo.require(sieModuleName(arguments[i++])));
      };

      dojo.loadInit = function(init) {
        init();
      };

      dojo._loaders= require.loadQ;
      dojo.ready= dojo.addOnLoad= require.addOnLoad;
      dojo._postLoad= require.pageLoaded;
      require.addOnLoad(function() {
        dojo._postLoad= true;
      });
    }

    if (require.config.v1xI18n) {
      require.urlMap.unshift(function(name){ return /^dojo\/i18n\.js$/.test(name) ? require.url("plugin/i18n") : 0; });
    }
    if (require.config.v1xCache) {
      require.urlMap.unshift(function(name){ return /^dojo\/cache\.js$/.test(name) ? require.url("plugin/text") : 0; });
    }

    // The list of modules that are loaded by the bootstrap; this, like everything, is configurable.
    init("bootList", "~version.~kernel.~backCompat.~environment.~eval.~url.~lang.~array.~unloadDetect.~xhr.~Color.~declare.~Deferred.~json.~window.~connect.~event.~html.~NodeList.~query.~fx".replace(/~/g, "dojo/_base/").split("."));

    // start the loader loading...
    // *boot-gate cause the modules listed in bootContents to be executed in order provided. Individual module 
    // dependency vectors still take precidence; therefore, if module "x" has dependency "y", then y will be
    // executed before x, even if it occurs after x in bootContents/load.
    define("*boot-gate", require.bootList, function(){ bootComplete= 1; } );
    bootComplete= 0;
  }

  //
  // bootstrap to initialize the loader only (no general dojo library)
  // certain parts of dojo are required for the plugins
  // 
  //TODO: this is a sketch that has not been tested
  if (require.config.loaderOnly) { 
    urlMap.push(
      [/^dojo\/_base\/environment/, baseUrl+"_base/environment/"+require.host],
      [/^dojo\//, baseUrl],
      [/^plugin\/i18n/, baseUrl+"_base/i18n"],
      [/^plugin\/shtml/, baseUrl+"_base/text"],
      [/^plugin\/sxml/, baseUrl+"_base/text"],
      [/^plugin\/text/, baseUrl+"_base/text"],
      //default
      [/.*/, function(name){ 
        return /(^\/)|(\:)/.test(name) ? name : baseUrl + name;
      }]
    );

    init("bootList", "~version.~kernel.~environment.~lang.~array.~xhr".replace(/~/g, "dojo/_base/").split("."));
    define("*boot-gate", require.bootList, function(){ bootComplete= 1; } );
    bootComplete= 0;
  }

  //maybe the configuration stuffed some non-executed module defs in the modules collection...
  require.modulesExecuted= 0;
  //request all modules in require.load, if any; see *boot-gate, above, for a description of the purpose of *load-gate
  require.load && define("*load-gate", require.load, 1);
  //maybe everything was already provided by the configuration and the loader just needs to be set free...
  require.checkComplete();
})("require");
// Copyright (c) 2008-2010, Rawld Gill and ALTOVISO LLC (www.altoviso.com). Use, modification, and distribution subject to terms of license.
