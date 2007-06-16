dojo.provide("dojo.rpc.JsonpService");
dojo.require("dojo.rpc.RpcService");
dojo.require("dojo.io.script");

dojo.declare(
	"dojo.rpc.JsonpService",
	dojo.rpc.RpcService,
	function(args, requiredArgs){
		if(this.required) {
 			if (requiredArgs){
				dojo.mixin(this.required, requiredArgs);
			}

			dojo.forEach(this.required, function(req){
				if(req=="" || req==undefined){
					throw new Error("Required Service Argument not found: "+req); 
				}
			});
		}		
	},
	{
		strictArgChecks: false,
		bind: function(method, parameters, deferredRequestHandler, url){
			//summary

			var def = dojo.io.script.get({
				url: url||this.serviceUrl,
				callbackParamName: this.callbackParamName||"callback",
				content: this.createRequest(parameters),
				handleAs: "json",	
				preventCache: true
			});
			def.addCallbacks(this.resultCallback(deferredRequestHandler), this.errorCallback(deferredRequestHandler));
		},
		createRequest: function(parameters){
			if(dojo.isArrayLike(parameters)&&(parameters.length==1)){
				var params = parameters[0];
			}else{
				params = {};
			}
			dojo.mixin(params,this.required);
			return params;
		}
	}
);
