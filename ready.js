define(["./_base/kernel", "./has", "require", "./domReady", "./_base/lang"], function(dojo, has, require, domReady, lang) {
	// module:
	//		dojo/ready
	// summary:
	//		This module defines the dojo.ready API.
	//
	// note:
	//		This module should be unnecessary in dojo 2.0
	var
		// truthy iff DOMContentLoaded or better (e.g., window.onload fired) has been achieved
		isDomReady = 0,

		// a function to call to cause onLoad to be called when all requested modules have been loaded
		requestCompleteSignal,

		// The queue of functions waiting to execute as soon as dojo.ready conditions satisfied
		loadQ = [],

		// prevent recursion in onLoad
		onLoadRecursiveGuard = 0,

		// run the next function queued with dojo.ready
		onLoad = function(){
			if(isDomReady && !onLoadRecursiveGuard && loadQ.length){
				//guard against recursions into this function
				onLoadRecursiveGuard = 1;
				var f = loadQ.shift();
				if(has("dojo-loader-catches")){
					try{
						f();
					}catch(e){
						if(!require.error("loader/onLoad", [e])){
							throw e;
						}
					}finally{
						onLoadRecursiveGuard = 0;
					}
				}else{
					f();
				}
				onLoadRecursiveGuard = 0;
				if(loadQ.length){
					requestCompleteSignal(onLoad);
				}
			}
		};

	// define requireCompleteSignal; impl depends on loader
	if(has("dojo-loader")){
		require.on("idle", onLoad);
		requestCompleteSignal= function(){
			if(require.idle()){
				onLoad();
			} // else do nothing, onLoad will be called with the next idle signal
		};
	}else{
		// RequireJS or similar
		requestCompleteSignal= function(){
			// the next function call will fail if you don't have a loader with require.ready
			// in that case, either fix your loader, use dojo's loader, or don't call dojo.ready;
			require.ready(onLoad);
		};
	}

	var ready= dojo.ready= dojo.addOnLoad= function(
		priority,//(integer, optional) The order in which to exec this callback relative to other callbacks, defaults to 1000
		context, //(object) The context in which to run execute callback
		         //(function) callback, if context missing
		callback //(function) The function to execute.
	){
		///
		// Add a function to execute on DOM content loaded and all requested modules have arrived and been evaluated.
		var hitchArgs= lang._toArray(arguments);
		if(typeof priority != "number"){
			callback = context, context = priority, priority = 1000;
		}else{
			hitchArgs.shift();
		}
		callback = callback ?
			lang.hitch.apply(dojo, hitchArgs) :
			function(){
				context();
			};
		callback.priority = priority;
		for(var i = 0; i < loadQ.length && priority >= loadQ[i].priority; i++){}
		loadQ.splice(i, 0, callback);
		requestCompleteSignal();
	};

	var dca = dojo.config.addOnLoad;
	if(dca){
		ready[(lang.isArray(dca) ? "apply" : "call")](dojo, dca);
	}

	domReady(function(){
		isDomReady= 1;
		dojo._postLoad = dojo.config.afterOnLoad = true;
		if(loadQ.length){
			requestCompleteSignal(onLoad);
		}
	});

	return ready;
});
