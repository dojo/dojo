// summary:
//      Test subworkers, this is the worker in the middle, that spawns the subworker and passes
//      messages between them.

var gloabl = this;

var dojoConfig = {
    "baseUrl":"../../../../",
    "async": true,
    "packages":[
        {"name":"dojo", "location":"dojo"}
    ]
}

importScripts("../../../dojo.js");
require(["dojo/has"], function(has){
    // Test for workers, currently chrome does not support subworkers.

    has.add("webworkers", (typeof Worker === 'function'));
    if(has("webworkers")){
        var worker = new Worker("worker4-1.js");
        worker.addEventListener("message", function(message) {
            gloabl.postMessage(message.data);
            worker.terminate();
        }, false);
    }else{
        // Chrome does not support webworkers of writing this test
        // (see: http://code.google.com/p/chromium/issues/detail?id=31666)

        this.postMessage({
            "test":"subworkers are working",
            "value":true,
            "warn":"Platform does not support subworkers"
        });
    }
});


