function webworkerDojoConfig(config, has, cacheBust){
    var hasCache = {
        "host-browser": 0,
        "dom": 0,
        "dojo-dom-ready-api": 0,
        "dojo-sniff": 0,
        "dojo-inject-api": 1,
        "host-webworker": 1
    };

    for(var p in hasCache){
        config.hasCache[p] = hasCache[p];
    }

    var fixupUrl= function(url){
        if(has("config-cacheBust")){
            url += (/\?/.test(url) ? "&" : "?") + cacheBust;
        }
        return url;
    };

    // reset some configuration switches with webworker-appropriate values
    var webworkerConfig = {
        "loaderPatch": {
            injectUrl: function(url, callback){
                // TODO:
                //      Use of importScripts means that this is actually running synchronously.  There is
                //      good or obvious way around this but since workers are normally long-running this is
                //      unlikely to cause too many problems.  A good half-way fix on this would be to pass the
                //      entire define/require array array into importScripts as it can take an array as an
                //      argument.  This is still blocking but all of the scripts are loaded at once, which will
                //      achieve a loading benefit.  It would probably require a reworking of dojo.js to achieve
                //      this and is not urgent due normal use of workers being long-running scripts.

                try{
                    importScripts(url);
                    callback();
                }catch(e){
                    console.info("failed to load resource (" + url + ")");
                    console.error(e);
                }
            },
            getText: function(url, async, onLoad){
                var xhr = new XMLHttpRequest();
                xhr.open('GET', fixupUrl(url), false);
                xhr.send(null);
                if(xhr.status == 200 || (!location.host && !xhr.status)){
                    if(onLoad){
                        onLoad(xhr.responseText, async);
                    }
                }else{
                    console.error("xhrFailed", xhr.status);
                }
                return xhr.responseText;
            }
        }
    };

    for(p in webworkerConfig){
        config[p] = webworkerConfig[p];
    }
}