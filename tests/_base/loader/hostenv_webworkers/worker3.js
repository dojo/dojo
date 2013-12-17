// summary:
//      Test whether the require function loads modules as it should in async mode.

var dojoConfig = {
    baseUrl:"../../../../../",
    async: true,
    packages:[
        {name:"dojo", location:"dojo"}
    ]
}

importScripts("../../../../dojo.js");

try{
    require(["dojo/tests/_base/loader/hostenv_webworkers/strings"], function(strings){
        this.postMessage({
            type:"testResult",
            test:"require is working",
            value:true
        });
    });
}catch(e){
    this.postMessage({
        type:"testResult",
        test:"require is working",
        value:false
    });
}
