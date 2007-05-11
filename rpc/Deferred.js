dojo.provide("dojo.rpc.Deferred");
dojo.require("dojo.Deferred");

dojo.deprecated("dojo.rpc.Deferred", "replaced by dojo.Deferred", "0.6");
dojo.rpc.Deferred = dojo.Deferred;
dojo.rpc.Deferred.prototype = dojo.Deferred.prototype;
