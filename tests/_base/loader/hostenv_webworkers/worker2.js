// summary:
//      Test whether the require function loads modules as it should.

var dojoConfig = {
    baseUrl:"../../../../../",
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
