define(['dojo/has', 'dojo/on'], function(has, on) {
	// module:
	//		dojo/debounce
	// summary:
	//		This module provide a generic debounce method, and an event debouncer to use with dojo/on

	var debounce = function(cb, wait, thisObj) {
		// summary:
		//		Create a function that will only execute after `wait` milliseconds
		// description:
		//		Create a function that will only execute after `wait` milliseconds
		//		of repeated execution. Useful for delaying some event action slightly to allow
		//		for rapidly-firing events such as window.resize, node.mousemove and so on.
		// cb: Function
		//		A callback to fire. Like hitch() and partial(), arguments passed to the
		//		returned function curry along to the original callback.
		// wait: Integer
		//		Time to spend caching executions before actually executing.
		// thisObj: Object?
		//		Optional execution context.
		var timer;
		return function() {
			if(timer) {clearTimeout(timer); }
			var ieCopy = function(arg) {
				//ie loose the real event (comming from a node) in a timeout so we need to copy it
				var argCopy = {};
				for(var i in arg){
					argCopy[i] = arg[i];
				}
				return [argCopy];
			},
			a = has("ie") < 10 ? ieCopy(arguments[0]) : arguments,
			then = function() {
				cb.apply(thisObj || cb, a);
			};
			timer = setTimeout(then, wait);
		};
	};
	
	debounce.event = function(selector, delay){
		// summary:
		//		a debounced event to use with dojo/on
		return function(node, listener) {
			var events = ~selector.indexOf(",") ? selector.split(/\s*,\s*/): [selector],
				i = 0,
				eventName,
				eventType
				eventTypes = [],
				sel = new RegExp(/(.*):(.*)/);

			while(eventName = events[i++]){
				eventType = eventName.match(sel);
				eventTypes.push(eventType ? eventType[2] : eventName)
			}
			return on(node, eventTypes.join(','), debounce(function(e) {
				var i = 0,
					match;
				while(eventName = events[i++]){
					match = eventName.match(sel);
					if(!match || (match && on.matches(e.target, eventName, node))) {
						listener.apply(this, arguments);
						break;
					}
				}
			}, delay));
		}
	}
	return debounce;
});
