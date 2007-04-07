dojo.provide("dojo.data.core.Result");
dojo.require("dojo.lang.declare");
dojo.require("dojo.experimental");

dojo.experimental("dojo.data.core.Result");

dojo.declare("dojo.data.core.Result", null,
	function(/* object */ keywordArgs, /* dojo.data.core.Read */ store) {
		// summary: initializer
		this.fromKwArgs(keywordArgs || {});
		this.items = null;
		this.resultMetadata = null;
		this.length = -1; // -1 until completion 
		this.store = store;
		
		this._aborted = false;
		this._abortFunc = null;
	}, {
	/* summary:
	 *	 Instances of dojo.data.core.Result are returned by the find() method
	 *	 of datastores that implement the dojo.data.core.Read API.  For more
	 *   documentation, see the find() method on dojo.data.core.Read.
	 */
	
	/* Whether the request should be made synchronously. 
	 * We default to true if there's no {sync:false} property in the keywordArgs 
	 * in the initializer for a given instance of dojo.data.core.Result.
	 */
	sync: true,
		
	//timeout: function(type){ }, todo: support this
	//timeoutSeconds: 0, todo: support this
		
	// the abort method needs to be filled in by the transport that accepts the
	// bind() request
	abort: function() {
		this._aborted = true;
		if (this._abortFunc) {
			this._abortFunc();
		}
	},
	
	fromKwArgs: function(/* object */ kwArgs) {
		if (typeof kwArgs.saveResult == "undefined") {
			this.saveResult = kwArgs.onnext ? false : true;
		}
		dojo.lang.mixin(this, kwArgs);
	}
});
