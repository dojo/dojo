dojo.provide("dojo.io.script");

dojo.io.script = {
	get: function(/*Object*/args){
		//summary: sends a get request using a dynamically created script tag.
		//See dojo._ioArgs() in _base/xhr.js for a list of commonly accepted 
		//properties on the args argument. Additional properties
		//that apply to all of the dojo.xhr* methods:
		//callbackParamName:
		//		String. The URL parameter name that indicates the JSONP callback string.
		//		For instance, when using Yahoo JSONP calls it is normally, 
		//		callbackParamName: "callback". For AOL JSONP calls it is normally 
		//		callbackParamName: "c".
		//checkString: 
		//		String. A string of JavaScript that when evaluated like so: 
		//		"typeof(" + checkString + ") != 'undefined'"
		//		being true means that the script fetched has been loaded. 
		//		Do not use this if doing a JSONP type of call (use callbackParamName instead).
		//"handleAs" is NOT applicable to dojo.io.script.get() calls, since it is
		//implied by the usage of "callbackParamName" (response will be a JSONP call
		//returning JSON) or "checkString" (response is pure JavaScript defined in
		//the body of the script that was attached).

		var dfd = this._makeScriptDeferred(args);
		var ioArgs = dfd.ioArgs;
		dojo._ioAddQueryToUrl(ioArgs);

		this.attach(ioArgs.id, ioArgs.url);
		dojo._ioWatch(dfd, this._validCheck, this._ioCheck, this._resHandle);
		return dfd;
	},

	attach: function(/*String*/id, /*String*/url){
		//Attaches the script element to the DOM.
		//Use this method if you just want to attach a script to the
		//DOM and do not care when or if it loads.
		var element = dojo.doc.createElement("script");
		element.type = "text/javascript";
		element.src = url;
		element.id = id;
		dojo.doc.getElementsByTagName("head")[0].appendChild(element);
	},

	remove: function(/*String*/id){
		//summary: removes the script element with the given id.
		dojo._destroyElement(dojo.byId(id));
		
		//Remove the jsonp callback on dojo.io.script, if it exists.
		if(this["jsonp_" + id]){
			delete this["jsonp_" + id];
		}
	},

	_makeScriptDeferred: function(/*Object*/args){
		//summary: sets up the Deferred object for script request.
		var dfd = dojo._ioSetArgs(args, this._deferredCancel, this._deferredOk, this._deferredError);

		var ioArgs = dfd.ioArgs;
		ioArgs.id = "dojoIoScript" + (this._counter++);
		ioArgs.canDelete = false;

		//Special setup for jsonp case
		if(args.callbackParamName){
			//Add the jsonp parameter.
			ioArgs.query = ioArgs.query || "";
			if(ioArgs.query.length > 0){
				ioArgs.query += "&";
			}
			ioArgs.query += args.callbackParamName + "=dojo.io.script.jsonp_" + ioArgs.id + "._jsonpCallback";

			//Setup the Deferred to have the jsonp callback.
			ioArgs.canDelete = true;
			dfd._jsonpCallback = this._jsonpCallback;
			this["jsonp_" + ioArgs.id] = dfd;
		}
		return dfd;
	},
	
	_deferredCancel: function(/*Deferred*/dfd){
		//summary: canceller function for dojo._ioSetArgs call.

		//DO NOT use "this" and expect it to be dojo.io.script.
		dfd.canceled = true;
		if(dfd.ioArgs.canDelete){
			dojo.io.script._deadScripts.push(dfd.ioArgs.id);
		}
	},

	_deferredOk: function(/*Deferred*/dfd){
		//summary: okHandler function for dojo._ioSetArgs call.

		//DO NOT use "this" and expect it to be dojo.io.script.
		if(dfd.ioArgs.json){
			//Make sure to *not* remove the json property from the
			//Deferred, so that the Deferred can still function correctly
			//after the response is received.
			return dfd.ioArgs.json;
		}else{
			//FIXME: cannot return the dfd here, otherwise that stops
			//the callback chain in Deferred. So return the ioArgs instead.
			//This doesn't feel right.
			return dfd.ioArgs;
		}
	},
	
	_deferredError: function(/*Error*/error, /*Deferred*/dfd){
		//summary: errHandler function for dojo._ioSetArgs call.

		if(dfd.ioArgs.canDelete){
			//DO NOT use "this" and expect it to be dojo.io.script.
			if(error.dojoType == "timeout"){
				//For timeouts, remove the script element immediately to
				//avoid a response from it coming back later and causing trouble.
				dojo.io.script.remove(dfd.ioArgs.id);
			}else{
				dojo.io.script._deadScripts.push(dfd.ioArgs.id);
			}
		}
		console.debug("dojo.io.script error", error);
		return error;
	},

	_deadScripts: [],
	_counter: 1,

	_validCheck: function(/*Deferred*/dfd){
		//summary: inflight check function to see if dfd is still valid.

		//Do script cleanup here. We wait for one inflight pass
		//to make sure we don't get any weird things by trying to remove a script
		//tag that is part of the call chain (IE 6 has been known to
		//crash in that case).
		var _self = dojo.io.script;
		var deadScripts = _self._deadScripts;
		if(deadScripts && deadScripts.length > 0){
			for(var i = 0; i < deadScripts.length; i++){
				//Remove the script tag
				_self.remove(deadScripts[i]);
			}
			dojo.io.script._deadScripts = [];
		}

		return true;
	},

	_ioCheck: function(/*Deferred*/dfd){
		//summary: inflight check function to see if IO finished.

		//Check for finished jsonp
		if(dfd.ioArgs.json){
			return true;
		}

		//Check for finished "checkString" case.
		var checkString = dfd.ioArgs.args.checkString;
		if(checkString && eval("typeof(" + checkString + ") != 'undefined'")){
			return true;
		}

		return false;
	},

	_resHandle: function(/*Deferred*/dfd){
		//summary: inflight function to handle a completed response.
		if(dojo.io.script._ioCheck(dfd)){
			dfd.callback(dfd);
		}else{
			//This path should never happen since the only way we can get
			//to _resHandle is if _ioCheck is true.
			dfd.errback(new Error("inconceivable dojo.io.script._resHandle error"));
		}
	},

	_jsonpCallback: function(/*JSON Object*/json){
		//summary: generic handler for jsonp callback. A pointer
		//to this function is used for all jsonp callbacks.
		//NOTE: the "this" in this function will be the Deferred
		//object that represents the script request.
		this.ioArgs.json = json;
	}
}
