define([
    "doh/main"
], function(doh){

    var fixtures = {
        "blank": function(){},
        "deferred": function(){
            this.deferred = new doh.Deferred();
        }
    };

    var tearDowns = {
        "blank":function(){}
    };


    doh.register("tests._base.configWebWorker", [{
        "name": "TEST",
        "setUp": fixtures.blank,
        "tearDown": tearDowns.blank,
        "runTest": function(){

        }
    }]);
});
