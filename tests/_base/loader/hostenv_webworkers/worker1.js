// summary:
//      Test whether Dojo will load inside the webworker.

var dojoConfig = {
    baseUrl:"../../../../../",
    packages:[
        {name:"dojo", location:"dojo"}
    ]
}

try{
    importScripts("../../../../dojo.js", "console.js");

    this.postMessage({
        type:"testResult",
        test:"dojo loaded",
        value:true
    });
}catch(e){
    this.postMessage({
        type:"testResult",
        test:"dojo loaded",
        value:false
    });
}





