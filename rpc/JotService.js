dojo.provide("dojo.rpc.JotService");
dojo.require("dojo.rpc.RpcService"); dojo.require("dojo.rpc.JsonService"); dojo.require("dojo.json"); dojo.rpc.JotService = function(){
	this.serviceUrl = "/_/jsonrpc";
}

dojo.inherits(dojo.rpc.JotService, dojo.rpc.JsonService);

dojo.lang.extend(dojo.rpc.JotService, {
	bind: function(method, parameters, deferredRequestHandler, url){
		//summary
		//Jot bind method. Takes remote method, parameters, deferred,
		//and a url, calls createRequest to make a Jot RPC envelope and
		//passes that off with bind.  
		dojo.io.bind({
			url: url||this.serviceUrl,
			content: {
				json: this.createRequest(method, parameters)
			},
			method: "POST",
			mimetype: "text/json",
			load: this.resultCallback(deferredRequestHandler),
			error: this.errorCallback(deferredRequestHandler),
			preventCache: true
		});
	},

	createRequest: function(method, params){
		//summary
		//create the json portion of the Jot request
		var req = { "params": params, "method": method, "id": this.lastSubmissionId++ };
		return dojo.json.serialize(req);
	}
});
