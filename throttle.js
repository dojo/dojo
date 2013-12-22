define(["dojo/on"], function(on) {
	// module:
	//		dojo/throttle
	// summary:
	//		This module provide a generic throttle method, and an event throttler to use with dojo/on
	
	var throttle = function(cb, wait, thisObj){
		// summary:
		//		Create a function that will only execute once per `wait` periods.
		// description:
		//		Create a function that will only execute once per `wait` periods
		//		from last execution when called repeatedly. Useful for preventing excessive
		//		calculations in rapidly firing events, such as window.resize, node.mousemove
		//		and so on.
		// cb: Function
		//		The callback to fire.
		// wait: Integer
		//		time to delay before allowing cb to call again.
		// thisObj: Object?
		//		Optional execution context
		var canrun = true;
		return function() {
			if(!canrun) {return; }
			canrun = false;
			cb.apply(thisObj || cb, arguments);
			setTimeout(function() {
				canrun = true;
			}, wait);
		};
	};
	
	throttle.event = function(selector, delay){
		// summary:
		//		a throttled event to use with dojo/on
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
			return on(node, eventTypes.join(','), throttle(function(e) {
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
	return throttle;
});
