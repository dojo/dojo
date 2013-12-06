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

        var tearDowns = {
            killWorker: function(){
                var self = this;
                this.deferred.then(function(){
                    self.worker.terminate();
                });

            },
            killBlobWorker: function(){
                var self = this;
                this.deferred.then(function(){
                    self.worker.terminate();
                    window.URL.revokeObjectURL(self.workerBlobURL);
                });

            }
        };

        doh.register("tests._base.configWebWorker", [{
            name: "Loading Dojo core inside worker",
            setUp: fixtures.deferred,
            tearDown: tearDowns.killWorker,
            timeout: 5000,
            runTest: function(){
                // summary:
                //      Test whether dojo can be loaded in the worker

                var self = this;
                var worker = new Worker("../../dojo/tests/_base/configWebWorker/worker1.js");

                worker.addEventListener("message", function(message) {
                    if(message.data.value){
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
            tearDown: tearDowns.killWorker,
            timeout: 5000,
            runTest: function(){
                // summary:
                //      Test whether require works in the worker.

                var self = this;
                var worker = new Worker("../../dojo/tests/_base/configWebWorker/worker2.js");

                worker.addEventListener("message", function(message) {
                    if(message.data.value){
                        self.deferred.resolve();
                    }else{
                        self.deferred.reject();
                    }
                }, false);

                return this.deferred;
            }
        }, {
            name: "Load a dojo script via require in async mode",
            setUp: fixtures.deferred,
            tearDown: tearDowns.killWorker,
            timeout: 5000,
            runTest: function(){
                // summary:
                //      Test whether require works in the worker when in async mode.

                var self = this;
                var worker = new Worker("../../dojo/tests/_base/configWebWorker/worker3.js");

                worker.addEventListener("message", function(message) {
                    if(message.data.value){
                        self.deferred.resolve();
                    }else{
                        self.deferred.reject();
                    }
                }, false);

                return this.deferred;
            }
        }, {
            name: "Load a dojo script via require in a subworker",
            setUp: fixtures.deferred,
            tearDown: tearDowns.killWorker,
            timeout: 5000,
            runTest: function(){
                // summary:
                //      Test whether require works in the worker when in async mode.

                var self = this;
                var worker = new Worker("../../dojo/tests/_base/configWebWorker/worker4.js");

                worker.addEventListener("message", function(message) {
                    if(message.data.value){
                        if(message.data.warn !== ""){
                            console.warn(message.data.warn);
                        }
                        self.deferred.resolve();
                    }else{
                        self.deferred.reject();
                    }
                }, false);

                return this.deferred;
            }
        }, {
            name: "Test for loading in a blob worker",
            setUp: fixtures.deferred,
            tearDown: tearDowns.killBlobWorker,
            timeout: 5000,
            runTest: function(){
                // summary:
                //      Test for loading dojo and using require in a blob worker

                has.add("blobs", (typeof Blob === 'function'));
                if(has("blobs")){
                    function getBaseAbsoluteUrl(){
                        // TODO:
                        //      Is there a better way of calculating the absolute url base path?

                        var baseUrl = require.rawConfig.baseUrl.split("/");
                        var absoluteUrl = location.pathname.split("/");
                        absoluteUrl.pop();
                        baseUrl.pop();

                        return location.protocol+"//"+location.host+absoluteUrl.join("/")+"/"+baseUrl.join("/")+"/";
                    }

                    var workerBlob = new Blob([
                        'var dojoConfig = {' +
                            '"baseUrl":"' + getBaseAbsoluteUrl() + '",' +
                            '"packages":[{"name":"dojo", "location":"dojo"}]' +
                        '};' +

                        'importScripts(dojoConfig.baseUrl+"dojo/dojo.js");' +

                        'try{'+
                            'require(["dojo/_base/configWebWorker"], function(config){' +
                                'this.postMessage({"test":"require is working", "value":true});' +
                            '});' +
                        '}catch(e){' +
                            'this.postMessage({' +
                                '"test":"require is working", "value":false' +
                            '});' +
                        '}'
                    ], {type:"text/javascript"});

                    var self = this;
                    var workerBlobURL = window.URL.createObjectURL(workerBlob);
                    var worker = new Worker(workerBlobURL);

                    worker.addEventListener("message", function(message) {
                        if(message.data.value){
                            self.deferred.resolve();
                        }else{
                            self.deferred.reject();
                        }
                    }, false);

                    return this.deferred;
                }else{
                    console.warn("Platform does not support Blobs");
                }
            }
        }]);
    }else{
        console.warno("Platform does not support webworkers")
    }
});