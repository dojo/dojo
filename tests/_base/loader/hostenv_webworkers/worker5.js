// summary:
//      Test loading json via dojo/request in a worker.

var dojoConfig = {
    baseUrl:"../../../../../",
    async: true,
    packages:[
        {name:"dojo", location:"dojo"}
    ]
}

importScripts("../../../../dojo.js");

try{
    require(["dojo/request"], function(request){
        request("../../../../tests/_base/loader/hostenv_webworkers/worker5.json",{
            handleAs:"json"
        }).then(function(data){
            if(data.foo && !data.bar){
                this.postMessage({
                    test:data,
                    value:true
                });
            }else{
                this.postMessage({
                    test:"require is working",
                    value:false
                });
            }
        }, function(){
            this.postMessage({
                test:"request in a worker is working",
                value:false
            });
        });
    });
}catch(e){
    this.postMessage({
        test:"request in a worker is working",
        value:false
    });
}
