define("dojo/_base/environment", ["dojo"], function(dojo) {
  dojo.isBrowser= true;
  dojo._name= "browser";
  //TODO: dojo.host has identical semantics to dojo._name; consider deprecating dojo._name.

  // fill in the rendering support information in dojo.render.*
  var 
    nav= navigator,
    userAgent= nav.userAgent,
    appVersion= nav.appVersion,
    appVersionNumber= parseFloat(appVersion);
    
  if (userAgent.indexOf("Opera")>=0) {
    dojo.isOpera= appVersionNumber;
  }
  if (userAgent.indexOf("AdobeAIR")>=0) {
    dojo.isAIR= 1;
  }
  dojo.isKhtml= (appVersion.indexOf("Konqueror")>=0) ? appVersionNumber : 0;
  dojo.isWebKit= parseFloat(userAgent.split("WebKit/")[1]) || undefined;
  dojo.isChrome= parseFloat(userAgent.split("Chrome/")[1]) || undefined;
  dojo.isMac= appVersion.indexOf("Macintosh")>=0;

  // safari detection derived from:
  //    http://developer.apple.com/internet/safari/faq.html#anchor2
  //    http://developer.apple.com/internet/safari/uamatrix.html
  var index= Math.max(appVersion.indexOf("WebKit"), appVersion.indexOf("Safari"), 0);
  if(index && !dojo.isChrome){
    // try to grab the explicit Safari version first. If we don't get
    // one, look for less than 419.3 as the indication that we're on something
    // "Safari 2-ish".
    dojo.isSafari = parseFloat(appVersion.split("Version/")[1]);
    if(!dojo.isSafari || parseFloat(appVersion.substr(index + 7)) <= 419.3){
      dojo.isSafari = 2;
    }
  }
    
  if (!require.config.webkitMobile) {
    if (userAgent.indexOf("Gecko") >= 0 && !dojo.isKhtml && !dojo.isWebKit) {
      dojo.isMozilla= dojo.isMoz= appVersionNumber;
    }
    if(dojo.isMoz) {
      //We really need to get away from this. Consider a sane isGecko approach for the future.
      dojo.isFF= parseFloat(userAgent.split("Firefox/")[1] || userAgent.split("Minefield/")[1]) || undefined;
    }
  }

  var getXhr= function() {
   return new XMLHttpRequest();
  };

  if (require.config.targetIe) {
    if(document.all && !dojo.isOpera){
      dojo.isIE = parseFloat(appVersion.split("MSIE ")[1]) || undefined;
      //In cases where the page has an HTTP header or META tag with
      //X-UA-Compatible, then it is in emulation mode.
      //Make sure isIE reflects the desired version.
      //document.documentMode of 5 means quirks mode.
      //Only switch the value if documentMode's major version
      //is different from isIE's major version.
      var mode = document.documentMode;
      if(mode && mode != 5 && Math.floor(dojo.isIE) != mode){
        dojo.isIE = mode;
      }
    }

    //Workaround to get local file loads of dojo to work on IE 7 by forcing to not use native xhr.
    if (dojo.isIE) {
      if (window.location.protocol === "file:") {
        dojo.config.ieForceActiveXXhr=true;
      }

      var foundMethod= 0;
      try {
        foundMethod= !dojo.config.ieForceActiveXXhr && !!getXhr();
      } catch (e) { 
        //squelch
      }
      if (!foundMethod) {
        for (var progId, progIds= dojo._XMLHTTP_PROGIDS || ['Msxml2.XMLHTTP.4.0', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP'], i= progIds.length; i--;) {
          //NOTE: dojo._XMLHTTP_PROGIDS are in order of INCREASING likelihood; this is a change from v1.5, but it shouldn't matter
          //TODO: dojo._XMLHTTP_PROGIDS needs to be public with a better name *or* it should just be a local variable
          try{
            progId= progIds[i];
            new ActiveXObject(progid);
            //got a good one...
            getXhr= function() {
              return new ActiveXObject(progid);
            };
            break;
          }catch(e){
            if (!i) {
              getXhr= function() {
                throw new Error("XMLHTTP not available: "+e);
              };
            }
          }
        }
      }

      try{
        (function(){
          document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
          var vmlElems = ["*", "group", "roundrect", "oval", "shape", "rect", "imagedata", "path", "textpath", "text"],
            i = 0, l = 1, s = document.createStyleSheet();
          if(dojo.isIE >= 8){
            i = 1;
            l = vmlElems.length;
          }
          for(; i < l; ++i){
            s.addRule("v\\:" + vmlElems[i], "behavior:url(#default#VML); display:inline-block");
          }
        })();
      }catch(e){}
    }
  }

  dojo._xhrObj= dojo.getXhr= getXhr;

  dojo.isQuirks= document.compatMode == "BackCompat";

  dojo.locale=
    // RCGTODO: is this OK? test for IE removed; just degrade if navigator.language is not there.
    // TODO: is the HTML LANG attribute relevant?
    ((dojo.config.locale || nav.language || nav.userLanguage) + "").toLowerCase();
   
  dojo._isDocumentOk = function(http){
      var stat = http.status || 0,
        lp = location.protocol;
      return (stat >= 200 && stat < 300) ||   // Boolean
        stat == 304 ||            // allow any 2XX response code
        stat == 1223 ||             // get it out of the cache
        // Internet Explorer mangled the status code OR we're Titanium/browser chrome/chrome extension requesting a local file
        (!stat && (lp == "file:" || lp == "chrome:" || lp == "chrome-extension:" || lp == "app:") );
  };
});
// This code derived from Dojo, Copyright (c) 2005-2010, The Dojo Foundation. Use, modification, and distribution subject to terms of license.
// Copyright (c) 2008-2010, Rawld Gill and ALTOVISO LLC (www.altoviso.com). Use, modification, and distribution subject to terms of license.
