define(['dojo/has', 'dojo/on'], function(has, on) {
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
	
	debounce.delegate = function(selector, delay){
		return function(node, listener) {
			var events = selector.split(/\s*,\s*/),
				i = 0,
				eventName,
				eventType
				eventTypes = [];

			while(eventName = events[i++]){
				eventType = eventName.split(/\s*:\s*/);
				eventTypes.push(eventType[1]);
			}
			return on(node, eventTypes.join(','), debounce(function(e) {
				var i = 0;
				while(eventName = events[i++]){
					if(on.matches(e.target, eventName, node)) {
						listener.apply(this, arguments);
						break;
					}
				}
			}, delay));
		}
	}
	return debounce;
});
