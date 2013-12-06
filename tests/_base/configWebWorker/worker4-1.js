// summary:
//      Test whether subworkers work.

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
            "value":true,
            "info":false
        });
    });
}catch(e){
    this.postMessage({
        "test":"require is working",
        "value":false,
        "info":false
    });
}
