define(['dojo/debounce', 'dojo/has', 'dojo/on/_delayedEventFactory'], function(debounce, has, _delayedEventFactory){
	// summary:
	//		This module provides an event debouncer for dojo/on
	// module:
	//		dojo/on/debounce

	return _delayedEventFactory(debounce, has("ie") < 10);
});
