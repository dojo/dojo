// summary:
//      Test whether subworkers work.

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
            test:"subworkers are working",
            value:true,
            warn:""
        });
    });
}catch(e){
    this.postMessage({
        test:"subworkers are working",
        value:false,
        warn:""
    });
}
