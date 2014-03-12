define(['dojo/throttle', 'dojo/on/_delayedEventFactory'], function(throttle, _delayedEventFactory) {
	// summary:
	//		This module provide an event throttler for dojo/on
	// module:
	//		dojo/on/throttle

	return _delayedEventFactory(throttle, false);
});
