define(['dojo/on', 'dojo/has'], function(on, has){
	// summary:
	//		This sub module provide an event factory for delayed events (like debounce or throttle)
	// module:
	//		dojo/on/asyncEventListener

	has.add("DOMLevel2", document.implementation.hasFeature("HTML", "2.0"));

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
	
	return function(listener) {
		if(!has("DOMLevel2")){
			return function(e){
				//lang.clone fail to clone events, so we use a custom function
				listener.call(this, clone(e));
			};
		}
		return listener;
	}
});
