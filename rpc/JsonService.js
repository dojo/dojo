dojo.provide("dojo.rpc.JsonService");
dojo.require("dojo.rpc.RpcService");

dojo.declare(
	"dojo.rpc.JsonService", 
	dojo.rpc.RpcService,	
	function(args){
		//	- just the serviceUrl (for use w/ remoteCall())
		//	- the text of the SMD to evaluate
		// 	- a raw SMD object
		//	- the SMD URL
		if(args){
			// otherwise we assume it's an arguments object with the following
			// (optional) properties:
			//	- serviceUrl
			//	- strictArgChecks
			//	- smdStr
			//	- smdObj

			if(args["smdStr"]){
				this.processSmd(dj_eval("("+args.smdStr+")"));
			}

			if(args["serviceUrl"]){
				this.serviceUrl = args.serviceUrl;
			}

			if(args["timeout"]){
				this.timeout = args.timeout;
			}else{
				this.timeout=3000;
			}

			if(typeof args["strictArgChecks"] != "undefined"){
				this.strictArgChecks = args.strictArgChecks;
			}

			this.processSmd(args);
		}
	},
	{
		bustCache: false,
	
		contentType: "application/json-rpc",

		lastSubmissionId: 0,

		callRemote: function(method, params){
			// summary:
			// 		call an arbitrary remote method without requiring it to be
			// 		predefined with SMD
			var deferred = new dojo.Deferred();
			this.bind(method, params, deferred);
			return deferred;
		},

		bind: function(method, parameters, deferredRequestHandler, url){
			//summary:
			//		JSON-RPC bind method. Takes remote method, parameters,
			//		deferred, and a url, calls createRequest to make a JSON-RPC
			//		envelope and passes that off with bind.
			var def = dojo.rawXhrPost({
				url: url||this.serviceUrl,
				postData: this.createRequest(method, parameters),
				contentType: this.contentType,
				timeout: this.timeout, 
				handleAs: "json",
			});
			def.addCallbacks(this.resultCallback(deferredRequestHandler), this.errorCallback(deferredRequestHandler));
		},

		createRequest: function(method, params){
			// summary:
			//		create a JSON-RPC envelope for the request

			var req = { "params": params, "method": method, "id": ++this.lastSubmissionId };
			// console.debug("createRequest: Method: " + method + " Parameters: ", params);	
			// console.debug("createRequest js object:",req);
			var data = dojo.toJson(req);
			console.debug("createRequest (json string):", data);
			return data;
		},

		parseResults: function(obj){
			//summary:
			//		parse the result envelope and pass the results back to to
			//		the callback function
			if(obj==null){ return; }
			if(obj["Result"]!=null){ 
				return obj["Result"]; 
			}else if(obj["result"]!=null){ 
				return obj["result"]; 
			}else if(obj["ResultSet"]){
				return obj["ResultSet"];
			}else{
				return obj;
			}
		}
	}
);
