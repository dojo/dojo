// summary:
//      Test the use of dojo/on without access to dom in a webworker.

var dojoConfig = {
    baseUrl:"../../../../../",
    async: true,
    packages:[
        {name:"dojo", location:"dojo"}
    ]
}

importScripts("../../../../dojo.js", "console.js");

var self = this;
try{
    require(["dojo/on"], function(on){
        on(self, "message", function(message){
            if(message.data.type === "gotMessage"){
                this.postMessage({
                    type:"testResult",
                    test:"dojo/on in a worker is working",
                    value:true
                });
            }else{
                this.postMessage({
                    type:"testResult",
                    test:"dojo/on in a worker is working",
                    value:false
                });
            }
        });

        this.postMessage({
            type:"requestMessage"
        });
    });
}catch(e){
    this.postMessage({
        type:"testResult",
        test:"dojo/on in a worker is working",
        value:false
    });
}
