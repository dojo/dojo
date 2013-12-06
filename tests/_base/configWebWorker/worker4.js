// summary:
//      Test subworkers, this is the worker in the middle, that spawns the subworker and passes
//      messages between them.

var gloabl = this;
var worker = new Worker("worker4-1.js");
worker.addEventListener("message", function(message) {
    gloabl.postMessage(message.data);
    worker.terminate();
}, false);