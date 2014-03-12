define(['dojo/on'], function(on) {
	// summary:
	//		This sub module provide an event factory for delayed events (like debounce or throttle)
	// module:
	//		dojo/on/debounce

	var SELECTOR = /(.*):(.*)/;

	function clone(arg) {
		// summary:
		//		clone the event
		// description:
		//		ie loose the event (comming from a node) when it is passed to a timeouted function
		//		Therefore, we need to clone it
		var argCopy = {},
			i;
		for(i in arg){
			argCopy[i] = arg[i];
		}
		return argCopy;
	}
	return function(fnc, cloneArguments) {
		// summary:
		//		return the custom event function
		// fnc: Function
		//		The function fired when the event is resolved
		// cloneArguments: Boolean
		//		Default False. If True, the event handler receive a clonned version of the event object (see clone function in this file)
		return function(selector, delay){
			// summary:
			//		event parser for custom events
			// selector: String
			//		The selector to check against
			// delay: Interger
			//		The amount of ms before testing the selector
			var events = selector.split(/\s*,\s*/);

			return function(node, listener) {
				var eventName,
					eventType,
					eventTypes = [],
					i = 0;

				//to avoid executing matcheSelector (from dojo/on) for every event we
				//re-arange the seletors and remove the event delegation
				//Then we execute manually matchesSelector (but only when the event handler is fired)
				while(eventName = events[i++]){
					eventType = eventName.match(SELECTOR);
					eventTypes.push(eventType ? eventType[2] : eventName); //retrive the event type (click, mouseover, etc...)
				}
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
						//lang.clone fail to clone events, so we use a custom function
						eventFnc.call(this, clone(e));
					};
				}

				return on(node, eventTypes.join(','), cloneHandler || eventFnc);
			};
		};
	};
});
