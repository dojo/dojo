define([
    "doh/main",
    "dojo/has"
], function(doh, has){
    // summary:
    //      Test the loading of Dojo in the WebWorker environment.

    has.add("webworkers", (typeof Worker === 'function'));
    if(has("webworkers")){
        var fixtures = {
            deferred: function(){
                this.deferred = new doh.Deferred();
            }
        };

        doh.register("tests._base.configWebWorker", [{
            name: "Loading Dojo core inside worker",
            setUp: fixtures.deferred,
            timeout: 5000,
            runTest: function(){
                // summary:
                //      Test whether dojo can be loaded in the worker

                var self = this;
                var worker = new Worker("../../dojo/tests/_base/configWebWorker/worker1.js");

                worker.addEventListener("message", function(e) {
                    if(e.data.value){
                        self.deferred.resolve();
                    }else{
                        self.deferred.reject();
                    }
                    worker.terminate();
                }, false);

                return this.deferred;
            }
        }, {
            name: "Load a dojo script via require",
            setUp: fixtures.deferred,
            timeout: 5000,
            runTest: function(){
                // summary:
                //      Test whether require works in the worker.

                var self = this;
                var worker = new Worker("../../dojo/tests/_base/configWebWorker/worker2.js");

                worker.addEventListener("message", function(e) {
                    if(e.data.value){
                        self.deferred.resolve();
                    }else{
                        self.deferred.reject();
                    }
                    worker.terminate();
                }, false);

                return this.deferred;
            }
        }, {
            name: "Load a dojo script via require in async mode",
            setUp: fixtures.deferred,
            timeout: 5000,
            runTest: function(){
                // summary:
                //      Test whether require works in the worker when in async mode.

                var self = this;
                var worker = new Worker("../../dojo/tests/_base/configWebWorker/worker3.js");

                worker.addEventListener("message", function(e) {
                    if(e.data.value){
                        self.deferred.resolve();
                    }else{
                        self.deferred.reject();
                    }
                    worker.terminate();
                }, false);

                return this.deferred;
            }
        }, {
            name: "Test for loading in a subworker",
            setUp: fixtures.deferred,
            timeout: 5000,
            runTest: function(){
                // summary:
                //      Test whether require works in the worker when in async mode.

                var self = this;
                var worker = new Worker("../../dojo/tests/_base/configWebWorker/worker4.js");
                worker.addEventListener("message", function(e) {
                    if(e.data.value){
                        if(e.data.info){
                            console.info(e.data.test)
                        }
                        self.deferred.resolve();
                    }else{
                        self.deferred.reject();
                    }
                    worker.terminate();
                }, false);

                return this.deferred;
            }
        }]);
    }else{
        console.info("Platform does not support webworkers")
    }
});
