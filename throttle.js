define(["dojo/on", "dojo/debounce"], function(on, debounce) {
	// module:
	//		dojo/throttle
	// summary:
	//		This module provide a generic throttle method, and an event throttler to use with dojo/on
	
	var module = function(cb, wait, thisObj){
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
	module.event = debounce.event;
	return module;
});
