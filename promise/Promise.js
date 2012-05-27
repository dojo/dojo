define([
	"../_base/lang"
], function(lang){
	"use strict";

	// module:
	//		dojo/promise/Promise
  // summary:
	//		Promise base class. All promises will be instances of this class.

	function throwAbstract(){
		throw new TypeError("abstract");
	}

	return lang.extend(function Promise(){}, {
		then: function(/*Function?*/ callback, /*Function?*/ errback, /*Function?*/ progback){
			// summary:
			//		Add new callbacks to the promise.
			// returns: dojo/promise/Promise
			//		Returns a new promise for the result of the callback(s).
			//
			// callback:
			//		Callback to be invoked when the promise is resolved.
			// errback:
			//		Callback to be invoked when the promise is rejected.
			// progback:
			//		Callback to be invoked when the promise emits a progress update.
			throwAbstract();
		},

		cancel: function(reason){
			// summary:
			//		Signal the promise that we're no longer interested in the result.
			// description:
			//		Signal the promise that we're no longer interested in the result.
			//		The deferred may subsequently cancel its operation and reject the
			//		promise. Can affect other promises that originate with the same
			//		deferred. Returns the rejection reason if the deferred was canceled
			//		normally.
			//
			// reason:
			//		A message that may be sent to the deferred's canceler, explaining why
			//		it's being canceled.
			throwAbstract();
		},

		isResolved: function(){
			// summary:
			//		Checks whether the promise has been resolved.
			// returns: Boolean
			throwAbstract();
		},

		isRejected: function(){
			// summary:
			//		Checks whether the promise has been rejected.
			// returns: Boolean
			throwAbstract();
		},

		isFulfilled: function(){
			// summary:
			//		Checks whether the promise has been resolved or rejected.
			// returns: Boolean
			throwAbstract();
		},

		isCanceled: function(){
			// summary:
			//		Checks whether the promise has been canceled.
			// returns: Boolean
			throwAbstract();
		},

		always: function(/*Function?*/ callbackOrErrback){
			// summary:
			//		Add a callback to be invoked when the promise is resolved or rejected.
			// returns: dojo/promise/Promise
			//		Returns a new promise for the result of the callback/errback.
			//
			// callbackOrErrback:
			//		A function that is used both as a callback and errback.
			return this.then(callbackOrErrback, callbackOrErrback);
		},

		otherwise: function(/*Function?*/ errback){
			// summary:
			//		Add new errbacks to the promise.
			// returns: dojo/promise/Promise
			//		Returns a new promise for the result of the errback.
			//
			// errback:
			//		Callback to be invoked when the promise is rejected.
			return this.then(null, errback);
		},

		trace: function(/* ... */){
			// summary:
			//		Trace the promise. All arguments are emitted in trace events.
			// returns:
			//		The original promise
			return this;
		},

		traceRejected: function(/* ... */){
			// summary:
			//		Trace rejection of the promise. All arguments are emitted in trace
			//		events.
			// returns:
			//		The original promise
			return this;
		}
	});
});
