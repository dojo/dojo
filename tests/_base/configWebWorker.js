define([
    "doh/main"
], function(doh){
    // summary:
    //      Test the loading of Dojo in the WebWorker environment.

    function isFunction(value){
        var getType = {};
        return value && getType.toString.call(value) === '[object Function]';
    }

    var fixtures = {
        deferred: function(){
            this.deferred = new doh.Deferred();
        }
    };

    doh.register("tests._base.configWebWorker", [{
        name: "Platform has WebWorkers",
        runTest: function(){
            // summary:
            //      This test will fail on older browsers, without workers.

            doh.assertTrue(isFunction(Worker));
        }
    }, {
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
            }, false);

            return this.deferred;
        }
    }, {
        name: "Load a dojo script via require",
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
            }, false);

            return this.deferred;
        }
    }]);
});
