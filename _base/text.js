(function() {

var def= function(dojo) {
  if (dojo.cache) {
    return dojo.cache;
  }
  var
    setRawText= function(url, value) {
      require.modules["text!" + url]= {result:value, executed:1};
    },

    getRawText= function(url) {
      return require.modules["text!" + url];
    },

    xmlRe=
       /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,

    bodyRe=
      /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,

    getText= function (
      name //(string) the resource name: (text | shtml | sxml)!<module-name>
    ) {
      if (require.modules[name] || require.waiting[name]) {
        return;
      }

      var 
        parts= name.split("!"),
        url= require.url(parts[1]),
        raw= getRawText(url);
        load= function(text) {
          setRawText(url, text);
          if (parts[0]=="shtml") {
            var match = text.match(bodyRe);
            match && (text= match[1]);
          } else if (parts[0]=="sxml") {
            text= text.replace(xmlRe, "");
          }
          delete require.waiting[name];
          require.modules[name]= {result:text, executed:1};
          require.checkComplete();
        };
      if (raw) {
        load(raw.result);
      } else {
        require.waiting[name]= 1;
        dojo.xhrGet({url:url, load:load});
      }
    },

    sanitize= function(
      text
    ){
      if (text) {
        text= text.replace(xmlRe, "");
        var match= text.match(bodyRe);
        if(match){
          text= match[1];
        }
      } else {
        text= "";
      }
      return text; //String
    },

    cache=
      {};

  dojo.cache= function(
    module,
    url,
    value
  ) {
    if (!dojo.isString(url)) {
      value= url;
      url= module;
      module= null;
    }
    if (dojo.isString(module)) {
      //TODO: version 2.0, remove the dot transform 
      url= require.url(module.replace(/\./g, "/")  + "/" + url);
    }
    var doSanitize= 0;
    if (value && (value.value || value.sanitize)) {
      doSanitize= !!value.sanitize;
      value= value.value;
    }
    if (value===null) {
      //clear the cache
      delete cache[url];
      return null;
		} else if(typeof value == "string"){
			//We have a string, set cache value
      cache[url]= doSanitize ? sanitize(value) : value;
    } else if (cache[url]===undefined) {
      //get the cached value or retrieve it for the first time
      var rawText= getRawText(url);
      if (rawText) {
        cache[url]= doSanitize ? sanitize(rawText.result) : rawText.result;
      } else {
        dojo.xhrGet({
          url: url,
          load: function(text) {
            setRawText(url, text);
            cache[url]= doSanitize ? sanitize(text) : text;
          },
          sync: true
        });
     }
    }
    return cache[url];
  };

  //defining any of text/shtml/sxml implies defining all of them
  //note: def is never called with text modules (they are always dependencies)
  var
    plugins= require.plugins,
    textPlugin= plugins.text= (plugins.text || {injectQ:[]}),
    shtmlPlugin= plugins.shtml= (plugins.shtml || {injectQ:[]}),
    sxmlPlugin= plugins.sxml= (plugins.sxml || {injectQ:[]}),
    q= textPlugin.injectQ.concat(shtmlPlugin.injectQ, sxmlPlugin.injectQ);
  textPlugin.inject= shtmlPlugin.inject= sxmlPlugin.inject= getText;
  while (q.length) {
    getText.call(null, q.shift());
  }
  require.checkComplete();

  return dojo.cache;
};

var deps= ["dojo", "dojo/_base/lang", "dojo/_base/xhr"];

//this resource defines several modules...

//the standard dojo-sie text plugin
define("plugin/text", deps, def);

//currently the shtml and sxml plugins just alias the text plugin; this may change if they decide to do more
define("plugin/shtml", deps, def);
define("plugin/sxml", deps, def);

//backcompat for dojo/cache
define("dojo/cache", deps, def);

})();
// This code derived from Dojo, Copyright (c) 2005-2010, The Dojo Foundation. Use, modification, and distribution subject to terms of license.
// Copyright (c) 2008-2010, Rawld Gill and ALTOVISO LLC (www.altoviso.com). Use, modification, and distribution subject to terms of license.
