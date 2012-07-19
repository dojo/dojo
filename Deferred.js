define([
	"./has",
	"./_base/lang",
	"./errors/CancelError",
	"./promise/Promise",
	"./has!config-deferredInstrumentation?./promise/instrumentation"
], function(has, lang, CancelError, Promise, instrumentation){
	"use strict";

	// module:
	//		dojo/Deferred

	var PROGRESS = 0,
			RESOLVED = 1,
			REJECTED = 2;
	var FULFILLED_ERROR_MESSAGE = "This deferred has already been fulfilled.";

	var freezeObject = Object.freeze || function(){};

	var signalWaiting = function(waiting, type, result, rejection, deferred){
		if(has("config-deferredInstrumentation")){
			if(type === REJECTED && Deferred.instrumentRejected && waiting.length === 0){
				Deferred.instrumentRejected(result, false, rejection, deferred);
			}
		}

		for(var i = 0; i < waiting.length; i++){
			signalListener(waiting[i], type, result, rejection);
		}
	};

	var signalListener = function(listener, type, result, rejection){
		var func = listener[type];
		var deferred = listener.deferred;
		if(func){
			try{
				var newResult = func(result);
				if(newResult && typeof newResult.then === "function"){
					listener.cancel = newResult.cancel;
					newResult.then(
							// Only make resolvers if they're actually going to be used
							makeDeferredSignaler(deferred, RESOLVED),
							makeDeferredSignaler(deferred, REJECTED),
							makeDeferredSignaler(deferred, PROGRESS));
					return;
				}
				signalDeferred(deferred, RESOLVED, newResult);
			}catch(error){
				signalDeferred(deferred, REJECTED, error);
			}
		}else{
			signalDeferred(deferred, type, result);
		}

		if(has("config-deferredInstrumentation")){
			if(type === REJECTED && Deferred.instrumentRejected){
				Deferred.instrumentRejected(result, !!func, rejection, deferred.promise);
			}
		}
	};

	var makeDeferredSignaler = function(deferred, type){
		return function(value){
			signalDeferred(deferred, type, value);
		};
	};

	var signalDeferred = function(deferred, type, result){
		if(!deferred.isCanceled()){
			switch(type){
				case PROGRESS:
					deferred.progress(result);
					break;
				case RESOLVED:
					deferred.resolve(result);
					break;
				case REJECTED:
					deferred.reject(result);
					break;
			}
		}
	};

	var Deferred = function(/*Function?*/ canceler){
		// summary:
		//		Constructor for a deferred.
		// description:
		//		Creates a new Deferred. This API is preferred over dojo/_base/Deferred.
		// canceler:
		//		Will be invoked if the deferred is canceled. The canceler receives the
		//		reason the deferred was canceled as its argument. The deferred is
		//		rejected with its return value, if any.

		// promise: dojo/promise/Promise
		//		The readonly promise that tells when this Deferred resolves
		var promise = this.promise = new Promise();

		var deferred = this;
		var fulfilled, result, rejection;
		var canceled = false;
		var waiting = [];

		if(has("config-deferredInstrumentation") && Error.captureStackTrace){
			Error.captureStackTrace(deferred, Deferred);
			Error.captureStackTrace(promise, Deferred);
		}

		this.isResolved = promise.isResolved = function(){
			// summary:
			//		Checks whether the deferred has been resolved.
			// returns: Boolean
			return fulfilled === RESOLVED;
		};

		this.isRejected = promise.isRejected = function(){
			// summary:
			//		Checks whether the deferred has been rejected.
			// returns: Boolean
			return fulfilled === REJECTED;
		};

		this.isFulfilled = promise.isFulfilled = function(){
			// summary:
			//		Checks whether the deferred has been resolved or rejected.
			// returns: Boolean
			return !!fulfilled;
		};

		this.isCanceled = promise.isCanceled = function(){
			// summary:
			//		Checks whether the deferred has been canceled.
			// returns: Boolean
			return canceled;
		};

		this.progress = function(update, /*Boolean?*/ strict){
			// summary:
			//		Emit a progress update on the deferred.
			// returns: dojo/promise/Promise
			//		Returns the original promise for the deferred.
			//
			// update:
			//		The progress update
			// strict:
			//		If strict, will throw an error if the deferred is already fulfilled.
			if(!fulfilled){
				signalWaiting(waiting, PROGRESS, update, null, deferred);
				return promise;
			}else if(strict === true){
				throw new Error(FULFILLED_ERROR_MESSAGE);
			}else{
				return promise;
			}
		};

		this.resolve = function(value, /*Boolean?*/ strict){
			// summary:
			//		Resolve the deferred.
			// returns: dojo/promise/Promise
			//		Returns the original promise for the deferred.
			//
			// value:
			//		The promise result value.
			// strict:
			//		If strict, will throw an error if the deferred is already fulfilled.
			if(!fulfilled){
				// Set fulfilled, store value. After signaling waiting listeners unset
				// waiting.
				signalWaiting(waiting, fulfilled = RESOLVED, result = value, null, deferred);
				waiting = null;
				return promise;
			}else if(strict === true){
				throw new Error(FULFILLED_ERROR_MESSAGE);
			}else{
				return promise;
			}
		};

		var reject = this.reject = function(error, /*Boolean?*/ strict){
			// summary:
			//		Reject the deferred.
			// returns: dojo/promise/Promise
			//		Returns the original promise for the deferred.
			//
			// error:
			//		The promise error value.
			// strict:
			//		If strict, will throw an error if the deferred is already fulfilled.
			if(!fulfilled){
				if(has("config-deferredInstrumentation") && Error.captureStackTrace){
					Error.captureStackTrace(rejection = {}, reject);
				}
				signalWaiting(waiting, fulfilled = REJECTED, result = error, rejection, deferred);
				waiting = null;
				return promise;
			}else if(strict === true){
				throw new Error(FULFILLED_ERROR_MESSAGE);
			}else{
				return promise;
			}
		};

		this.then = promise.then = function(/*Function?*/ callback, /*Function?*/ errback, /*Function?*/ progback){
			// summary:
			//		Add new callbacks to the deferred.
			// returns: dojo/promise/Promise
			//		Returns a new promise for the result of the callback(s).
			// callback:
			//		Callback to be invoked when the promise is resolved.
			// errback:
			//		Callback to be invoked when the promise is rejected.
			// progback:
			//		Callback to be invoked when the promise emits a progress update.
			var listener = [progback, callback, errback];
			// Ensure we cancel the promise we're waiting for, or if callback/errback
			// have returned a promise, cancel that one.
			listener.cancel = promise.cancel;
			listener.deferred = new Deferred(function(reason){
				// Check whether cancel is really available, returned promises are not
				// required to expose `cancel`
				return listener.cancel && listener.cancel(reason);
			});
			if(fulfilled && !waiting){
				signalListener(listener, fulfilled, result, rejection);
			}else{
				waiting.push(listener);
			}
			return listener.deferred.promise;
		};

		this.cancel = promise.cancel = function(reason, /*Boolean?*/ strict){
			// summary:
			//		Signal the deferred that we're no longer interested in the result.
			// description:
			//		Signal the deferred that we're no longer interested in the result.
			//		The deferred may subsequently cancel its operation and reject the
			//		promise. Can affect other promises that originate with the same
			//		deferred. Returns the rejection reason if the deferred was canceled
			//		normally.
			// reason:
			//		A message that may be sent to the deferred's canceler, explaining why
			//		it's being canceled.
			// strict:
			//		If strict, will throw an error if the deferred is already fulfilled.
			if(!fulfilled){
				// Cancel can be called even after the deferred is fulfilled
				if(canceler){
					var returnedReason = canceler(reason);
					reason = typeof returnedReason === "undefined" ? reason : returnedReason;
				}
				canceled = true;
				if(!fulfilled){
					// Allow canceler to provide its own reason, but fall back to a CancelError
					if(typeof reason === "undefined"){
						reason = new CancelError();
					}
					reject(reason);
					return reason;
				}else if(fulfilled === REJECTED && result === reason){
					return reason;
				}
			}else if(strict === true){
				throw new Error(FULFILLED_ERROR_MESSAGE);
			}
		};

		freezeObject(promise);
	};

	Deferred.prototype.toString = function(){
		return "[object Deferred]";
	};

	if(instrumentation){
		instrumentation(Deferred);
	}

	return Deferred;
});
