define(['dojo/on'], function(on){
	// summary:
	//		This sub module provide an event factory for delayed events (like debounce or throttle)
	// module:
	//		dojo/on/debounce
	function clone(arg){
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
	return function(fnc, cloneArguments){
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

			return function(node, listener){
				var cloneHandler = null,
					eventFnc = fnc(listener, delay);
				if(cloneArguments){
					cloneHandler = function(e){
						//lang.clone fail to clone events, so we use a custom function
						eventFnc.call(this, clone(e));
					};
				}

				return on(node, selector, cloneHandler || eventFnc);
			};
		};
	};
});
