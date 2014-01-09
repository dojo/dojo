define(['dojo/debounce', 'dojo/has', 'dojo/on'], function(debounce, has, on) {
	// summary:
	//		This module provide an event debouncer to use with dojo/on
	// module:
	//		dojo/on/debounce

	var SELECTOR = /(.*):(.*)/,
		event;
	
	function clone(arg) {
		// summary:
		//		ie loose the real event (comming from a node) in a timeout so we need to copy it
		var argCopy = {},
			i;
		for(i in arg){
			argCopy[i] = arg[i];
		}
		return [argCopy];
	}
	function customEvent(fnc, cloneArguments) {
		// summary:
		//		return the custom event function
		return function(selector, delay){
			// summary:
			//		event parser for custom events
			var events = selector.split(/\s*,\s*/);
			return function(node, listener) {
				var cloneHandler = null,
					handler = function(e) {
						var i = 0,
							match,
							eventName;
						while(eventName = events[i++]){
							match = eventName.match(SELECTOR);
							if(!match || (match && on.matchesSelector(e.target, match[1], node))) {
								listener.apply(this, arguments);
								break;
							}
						}
					},
					eventFnc = fnc(handler, delay);
				if(cloneArguments) {
					cloneHandler = function(e) {
						//lang.clone fail to clone events, so we use a custom clone
						eventFnc.apply(this, clone(e));
					};
				}

				return on(node, selector, cloneHandler || eventFnc);
			};
		};
	}

	event = customEvent(debounce, has("ie") < 10);
	//add the customEvent function so we can use it in throttle, instead of duplicating code
	event._customEvent = customEvent;
	return event;
});
