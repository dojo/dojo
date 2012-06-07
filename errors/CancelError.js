define(["./create"], function(create){
	// module:
	//		dojo/errors/CancelError
	// summary:
	//		Default error if a promise is canceled without a reason.

	return create("CancelError", null, null, { dojoType: "cancel" });
});
