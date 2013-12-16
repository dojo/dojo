// summary:
//      Test whether Dojo will load inside the webworker.

var dojoConfig = {
    baseUrl:"../../../../../",
    packages:[
        {name:"dojo", location:"dojo"}
    ]
}

try{
    importScripts("../../../../dojo.js");
    this.postMessage({
        test:"dojo loaded",
        value:true
    });
}catch(e){
    this.postMessage({
        test:"dojo loaded",
        value:false
    });
}





