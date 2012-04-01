define([], function(){
	// module:
	//		dojo/promise/CancelError
	// summary:
	//		Default error if a promise is canceled without a reason.

	function CancelError(message){
		Error.captureStackTrace && Error.captureStackTrace(this, CancelError);
		this.message = message || "The deferred was cancelled.";
		this.name = "CancelError";
	};
	CancelError.prototype = new Error;
	CancelError.prototype.constructor = CancelError;
	return CancelError
});
