// summary:
//      Test whether the require function loads modules as it should in async mode.

var dojoConfig = {
    "baseUrl":"../../../../",
    "async": true,
    "packages":[
        {"name":"dojo", "location":"dojo"}
    ]
}

importScripts("../../../dojo.js");

try{
    require(["dojo/_base/configWebWorker"], function(config){
        this.postMessage({
            "test":"require is working",
            "value":true
        });
    });
}catch(e){
    this.postMessage({
        "test":"require is working",
        "value":false
    });
}
