dojo.provide("dojo.rpc.RpcService");

dojo.declare(
	"dojo.rpc.RpcService",
	null, 
        function(args){
		//summary:
		//Take a string as a url to retrieve an smd or an object that is an smd or partial smd to use
		//as a definition for the service
                //      - the text of the SMD to evaluate
                //      - a raw SMD object
                //      - the SMD URL
                if(args){
			//if the arg is a string, we assume it is a url to retrieve an smd definition from
			if(dojo.isString(args)){
				var def = dojo.xhrGet({
					url: args,
					handleAs: "json",
					sync: true
				});

				def.addCallback(this, "processSmd");
				def.addErrback(function() {
					throw new Error("Unable to load SMD from " . args);					
				});

			}else if(args["smdStr"]){
				this.processSmd(dj_eval("("+args.smdStr+")"));
			}else{
	                        // otherwise we assume it's an arguments object with the following
				// (optional) properties:
				//      - serviceUrl
				//      - strictArgChecks
				//      - smdStr
				//      - smdObj

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
		}
	},
	{

		strictArgChecks: true,
		serviceUrl: "",

		parseResults: function(obj){
			// summary
			// 		parse the results coming back from an rpc request.  this
			// 		base implementation, just returns the full object
			// 		subclasses should parse and only return the actual results
			return obj;
		},

		errorCallback: function(/* dojo.Deferred */ deferredRequestHandler){
			// summary:
			//		create callback that calls the Deferres errback method
			return function(data){
				deferredRequestHandler.errback(new Error(data.message));
			}
		},

		resultCallback: function(/* dojo.Deferred */ deferredRequestHandler){
			// summary:
			// 		create callback that calls the Deferred's callback method
			var tf = dojo.hitch(this, 
				function(obj){
					if(obj["error"]!=null){
						var err = new Error(obj.error);
						err.id = obj.id;
						err.errorObject = obj;
						deferredRequestHandler.errback(err);
					}else{
						var results = this.parseResults(obj);
						deferredRequestHandler.callback(results); 
					}
				}
			);
			return tf;
		},

		generateMethod: function(/*string*/ method, /*array*/ parameters, /*string*/ url){
			// summary:
			// 		generate the local bind methods for the remote object
			return dojo.hitch(this, function(){
				var deferredRequestHandler = new dojo.Deferred();
	
				// if params weren't specified, then we can assume it's varargs
				if( (this.strictArgChecks) &&
					(parameters != null) &&
					(arguments.length != parameters.length)
				){
					// put error stuff here, no enough params
					throw new Error("Invalid number of parameters for remote method.");
				}else{
					this.bind(method, dojo._toArray(arguments), deferredRequestHandler, url);
				}
	
				return deferredRequestHandler;
			});
		},

		processSmd: function(/*json*/ object){
			// summary:
			// 		callback method for reciept of a smd object.  Parse the smd
			// 		and generate functions based on the description
			if(object.methods){
				dojo.forEach(object.methods, function(m){
					if(m && m["name"]){
						this[m.name] = this.generateMethod(	m.name,
											m.parameters, 
											m["url"]||m["serviceUrl"]||m["serviceURL"]);
						if(!dojo.isFunction(this[m.name])){
							throw new Error("RpcService: Failed to create" + m.name + "()");
							/*console.debug("RpcService: Failed to create", m.name, "()");*/
						}
					}
				}, this);
			}

			this.serviceUrl = object.serviceUrl||object.serviceURL;
			this.required = object.required;
		}
	}
);
