define(['dojo/throttle', 'dojo/on/debounce'], function(throttle, debounce) {
	// summary:
	//		This module provide an event throttler to use with dojo/on
	// module:
	//		dojo/on/throttle

	return debounce._customEvent(throttle, false);
});
