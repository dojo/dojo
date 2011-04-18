define(["./kernel", "../has", "require", "./lang"], function(dojo, has, require) {
	// module:
	//		dojo/_base/load
	// summary:
	//		This module defines the DOM content loaded && code loaded detection API.

	// define dojo.addOnLoad/ready in terms of the DOMContentLoaded detection available from the AMD loaders.
	// Note that the AMD specification says nothing about this functionality. However, the dojo loader, bdLoad,
	// and RequireJS are known to provide and intend to maintain support for this feature.

	has.add("loader-priority-readyApi",
		// if true, define the ready queue to include priority attributes
		0
	);
	var ready;
	if(has("loader-priority-readyApi")){
		ready= require.ready;
	}else{
	 // Currently, RequireJS does not support priority onLoad queues which are required for dojo, so if that's
	 // the loader we're under, then we have to implement this feature ourselves.
		var
			loadQ= [],
			set= 0,
			onReady= function() {
				while (loadQ.length) {
					(loadQ.shift())();
				}
				set= 0;
			};
		ready= function(priority, context, callback){
			if(typeof priority!="number"){
				callback= context, context= priority, priority= 1000;
			}
			callback= dojo.hitch(context, callback);
			callback.priority= priority;
			for(var i= 0; i<loadQ.length && priority<=loadQ[i].priority; i++){}
			loadQ.splice(i, 0, callback);
			if(!set){
				require.ready(onReady);
				set= 1;
			}
		};
	}
	dojo.ready= dojo.addOnLoad= ready;

	ready(function() {
		dojo._postLoad = dojo.config.afterOnLoad = true;
	});

	var dca = dojo.config.addOnLoad;
	if(dca){
		ready[(dojo.isArray(dca) ? "apply" : "call")](dojo, dca);
	}
});
