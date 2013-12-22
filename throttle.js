define(["dojo/on"], function(on) {
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
	
	throttle.delegate = function(selector, delay){
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
			return on(node, eventTypes.join(','), throttle(function(e) {
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
	return throttle;
});
