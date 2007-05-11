dojo.provide("tests.rpc");

dojo.require("dojo.rpc.RpcService");
dojo.require("dojo.rpc.JsonService");

tests.register("tests.rpc", 
	[ 

		{
			name: "JsonRPC-EchoTest",
			timeout: 2000,
			setUp: function() {
				var testSmd = {
					serviceURL:"../../dojo/tests/resources/test_JsonRPCMediator.php",
					methods:[
						{
							name:"myecho",
							parameters:[
								{
									name:"somestring",
									type:"STRING"
								}
							]
						}
					]	
				}
			
				this.svc = new dojo.rpc.JsonService(testSmd);
			},
			runTest: function() {
				var d = new doh.Deferred();
				var td = this.svc.myecho("RPC TEST");

				td.addCallbacks(function(result) {
					if(result=="<P>RPC TESTB</P>") {
						return true;
					} else {
						return new Error("JsonRpc-EchoTest test failed, resultant content didn't match");
					}
				}, function(result) {
					return new Error(result);
				});

				td.addBoth(d, "callback");

				return d;
			}

		},

		{
			name: "JsonRPC-EmptyParamTest",
			timeout: 2000,
			setUp: function() {
				var testSmd = {
					serviceURL:"../../dojo/tests/resources/test_JsonRPCMediator.php",
					methods:[
						{
							name:"contentB",
						}
					]	
				}
			
				this.svc = new dojo.rpc.JsonService(testSmd);
			},
			runTest: function() {
				var d = new doh.Deferred();
				var td = this.svc.contentB();

				td.addCallbacks(function(result) {
					if(result=="<P>Content B</P>") {
						return true;
					} else {
						return new Error("JsonRpc-EmpytParamTest test failed, resultant content didn't match");
					}
				}, function(result) {
					return new Error(result);
				});

				td.addBoth(d, "callback");

				return d;
			}
		}

	]
);


