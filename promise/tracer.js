define([
	"../_base/lang",
	"./Promise",
	"../Evented"
], function(lang, Promise, Evented){
	"use strict";

	// module:
	//		dojo/promise/tracer
	// summary:
	//		Trace promise fulfillment.
	// description:
	//		Trace promise fulfillment. Calling `.trace()` or `.traceError()` on a
	//		promise enables tracing. Will emit `resolved`, `rejected` or `progress`
	//		events.

	var evented = new Evented;
	var emit = evented.emit;
	evented.emit = null;
	// Emit events asynchronously since they should not change the promise state.
	function emitAsync(args){
		setTimeout(function(){
			emit.apply(evented, args);
		}, 0);
	}

	Promise.prototype.trace = function(){
		var args = lang._toArray(arguments);
		this.then(
			function(value){ emitAsync(["resolved", value].concat(args)); },
			function(error){ emitAsync(["rejected", error].concat(args)); },
			function(update){ emitAsync(["progress", update].concat(args)); }
		);
		return this;
	};

	Promise.prototype.traceRejected = function(){
		var args = lang._toArray(arguments);
		this.fail(function(error){
			emitAsync(["rejected", error].concat(args));
		});
		return this;
	};

	return evented;
});
