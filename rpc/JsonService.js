dojo.provide("dojo.rpc.JsonService");
dojo.require("dojo.rpc.RpcService");
dojo.require("dojo.io.*");
dojo.require("dojo.json");
dojo.require("dojo.lang.common");

dojo.rpc.JsonService = function(args){
	// passing just the URL isn't terribly useful. It's expected that at
	// various times folks will want to specify:
	//	- just the serviceUrl (for use w/ remoteCall())
	//	- the text of the SMD to evaluate
	// 	- a raw SMD object
	//	- the SMD URL
	if(args){
		if(dojo.lang.isString(args)){
			// we assume it's an SMD file to be processed, since this was the
			// earlier function signature

			// FIXME: also accept dojo.uri.Uri objects?
			this.connect(args);
		}else{
			// otherwise we assume it's an arguments object with the following
			// (optional) properties:
			//	- serviceUrl
			//	- strictArgChecks
			//	- smdUrl
			//	- smdStr
			//	- smdObj
			if(args["smdUrl"]){
				this.connect(args.smdUrl);
			}
			if(args["smdStr"]){
				this.processSmd(dj_eval("("+args.smdStr+")"));
			}
			if(args["smdObj"]){
				this.processSmd(args.smdObj);
			}
			if(args["serviceUrl"]){
				this.serviceUrl = args.serviceUrl;
			}
			if(typeof args["strictArgChecks"] != "undefined"){
				this.strictArgChecks = args.strictArgChecks;
			}
		}
	}
}

dojo.inherits(dojo.rpc.JsonService, dojo.rpc.RpcService);

dojo.extend(dojo.rpc.JsonService, {

	bustCache: false,
	
	contentType: "application/json-rpc",

	lastSubmissionId: 0,

	callRemote: function(method, params){
		//summary
		// call an arbitrary remote method without requiring it
		// to be predefined with SMD
		var deferred = new dojo.Deferred();
		this.bind(method, params, deferred);
		return deferred;
	},

	bind: function(method, parameters, deferredRequestHandler, url){
		//summary
		//JSON-RPC bind method. Takes remote method, parameters, deferred,
		//and a url, calls createRequest to make a JSON-RPC envelope and
		//passes that off with bind.

		dojo.io.bind({
			url: url||this.serviceUrl,
			postContent: this.createRequest(method, parameters),
			method: "POST",
			contentType: this.contentType,
			mimetype: "text/json",
			load: this.resultCallback(deferredRequestHandler),
			error: this.errorCallback(deferredRequestHandler),
			preventCache:this.bustCache 
		});
	},

	createRequest: function(method, params){
		//summary
		//create a JSON-RPC envelope for the request
		var req = { "params": params, "method": method, "id": ++this.lastSubmissionId };
		var data = dojo.json.serialize(req);
		dojo.debug("JsonService: JSON-RPC Request: " + data);
		return data;
	},

	parseResults: function(obj){
		//summary
		//parse the result envelope and pass the results back to 
		// to the callback function
		if(!obj){ return; }
		if (obj["Result"]!=null){ 
			return obj["Result"]; 
		}else if(obj["result"]!=null){ 
			return obj["result"]; 
		}else if(obj["ResultSet"]){
			return obj["ResultSet"];
		}else{
			return obj;
		}
	}
});
