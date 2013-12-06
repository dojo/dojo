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
            name: "Test for loading in a blob worker",
            setUp: fixtures.deferred,
            timeout: 5000,
            runTest: function(){
                // summary:
                //      Test for loading dojo and using require in a blob worker

                function getBaseAbsoluteUrl(){
                    // TODO:
                    //      Is there a better way of calculating the absolute url base path?

                    var baseUrl = require.rawConfig.baseUrl.split("/");
                    var absoluteUrl = location.pathname.split("/");
                    absoluteUrl.pop();
                    baseUrl.pop();

                    console.log(location.protocol+"//"+location.host+absoluteUrl.join("/")+"/"+baseUrl.join("/")+"/");

                    return location.protocol+"//"+location.host+absoluteUrl.join("/")+"/"+baseUrl.join("/")+"/";
                }

                var blob = new Blob([
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
                ]);

                var self = this;
                var blobURL = window.URL.createObjectURL(blob);
                var worker = new Worker(blobURL);

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
        }]);
    }else{
        console.warno("Platform does not support webworkers")
    }
});
