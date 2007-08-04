dojo.provide("dojo._base.xhr");
dojo.require("dojo._base.Deferred");
dojo.require("dojo._base.json");
dojo.require("dojo._base.lang");
dojo.require("dojo._base.query");

dojo.formToObject = function(/*DOMNode||String*/ formNode){
	// summary:
	//		dojo.formToObject returns the values encoded in an HTML form as
	//		string properties in an object which it then returns. Disabled form
	//		elements, buttons, and other non-value form elements are skipped.
	//		Multi-select elements are returned as an array of string values.
	// description:
	//		This form:
	//
	//			<form id="test_form">
	//				<input type="text" name="blah" value="blah">
	//				<input type="text" name="no_value" value="blah" disabled>
	//				<input type="button" name="no_value2" value="blah">
	//				<select type="select" multiple name="multi" size="5">
	//					<option value="blah">blah</option>
	//					<option value="thud" selected>thud</option>
	//					<option value="thonk" selected>thonk</option>
	//				</select>
	//			</form>
	//
	//		yields this object structure as the result of a call to
	//		formToObject():
	//
	//			{ 
	//				blah: "blah",
	//				multi: [
	//					"thud",
	//					"thonk"
	//				]
	//			};

	// FIXME: seems that dojo.query needs negation operators!!
	var ret = {};
	var iq = "input[type!=file][type!=submit][type!=image][type!=reset][type!=button], select, textarea";
	dojo.query(iq, formNode).filter(function(node){
		return (!node.disabled);
	}).forEach(function(item){
		var _in = item.name;
		var type = (item.type||"").toLowerCase();
		if((type == "radio")||(type == "checkbox")){
			if(item.checked){ ret[_in] = item.value; }
		}else if(item.multiple){
			var ria = ret[_in] = [];
			dojo.query("option[selected]", item).forEach(function(opt){
				ria.push(opt.value);
			});
		}else{ 
			ret[_in] = item.value;
			if(type == "image"){
				ret[_in+".x"] = ret[_in+".y"] = ret[_in].x = ret[_in].y = 0;
			}
		}
	});
	return ret;
}

dojo.objectToQuery = function(/*Object*/ map){
	//	summary:
	//		takes a key/value mapping object and returns a string representing
	//		a URL-encoded version of that object.
	//	examples:
	//		this object:
	//
	//			{ 
	//				blah: "blah",
	//				multi: [
	//					"thud",
	//					"thonk"
	//				]
	//			};
	//
	//		yeilds the following query string:
	//	
	//			"blah=blah&multi=thud&multi=thonk"


	// FIXME: need to implement encodeAscii!!
	var ec = encodeURIComponent;
	var ret = "";
	var backstop = {};
	for(var x in map){
		if(map[x] != backstop[x]){
			if(dojo.isArray(map[x])){
				for(var y=0; y<map[x].length; y++){
					ret += ec(x) + "=" + ec(map[x][y]) + "&";
				}
			}else{
				ret += ec(x) + "=" + ec(map[x]) + "&";
			}
		}
	}
	if((ret.length)&&(ret.charAt(ret.length-1)== "&")){
		ret = ret.substr(0, ret.length-1);
	}
	return ret; // string
}

dojo.formToQuery = function(/*DOMNode||String*/ formNode){
	// summary:
	//		return URL-encoded string representing the form passed as either a
	//		node or string ID identifying the form to serialize
	return dojo.objectToQuery(dojo.formToObject(formNode)); // string
}

dojo.formToJson = function(/*DOMNode||String*/ formNode){
	// summary:
	//		return a serialized JSON string from a form node or string
	//		ID identifying the form to serialize
	return dojo.toJson(dojo.formToObject(formNode)); // string
}

dojo.queryToObject = function(/*String*/ str){
	// summary:
	//		returns an object representing a de-serialized query section of a
	//		URL. Query keys with multiple values are returned in an array.
	// description:
	//		This string:
	//
	//			"foo=bar&foo=baz&thinger=%20spaces%20=blah&zonk=blarg&"
	//		
	//		returns this object structure:
	//
	//			{
	//				foo: [ "bar", "baz" ],
	//				thinger: " spaces =blah",
	//				zonk: "blarg"
	//			}
	//	
	//		Note that spaces and other urlencoded entities are correctly
	//		handled.

	// FIXME: should we grab the URL string if we're not passed one?
	var ret = {};
	var qp = str.split("&");
	var dc = decodeURIComponent;
	dojo.forEach(qp, function(item){
		if(item.length){
			var parts = item.split("=");
			var name = parts.shift();
			var val = dc(parts.join("="));
			if(dojo.isString(ret[name])){
				ret[name] = [ret[name]];
			}
			if(dojo.isArray(ret[name])){
				ret[name].push(val);
			}else{
				ret[name] = val;
			}
		}
	});
	return ret;
}

/*
	from refactor.txt:

	all bind() replacement APIs take the following argument structure:

		{
			url: "blah.html",

			// all below are optional, but must be supported in some form by
			// every IO API
			timeout: 1000, // milliseconds
			handleAs: "text", // replaces the always-wrong "mimetype"
			content: { 
				key: "value"
			},

			// browser-specific, MAY be unsupported
			sync: true, // defaults to false
			form: dojo.byId("someForm") 
		}
*/

// need to block async callbacks from snatching this thread as the result
// of an async callback might call another sync XHR, this hangs khtml forever
// must checked by watchInFlight()

dojo._blockAsync = false;

dojo._contentHandlers = {
	"text": function(xhr){ return xhr.responseText; },
	"json": function(xhr){ 
		console.debug("please consider using a mimetype of text/json-comment-filtered to avoid potential security issues with JSON endpoints");
		return dojo.fromJson(xhr.responseText);
	},
	"json-comment-optional": function(xhr){ 
		// NOTE: we provide the json-comment-filtered option as one solution to
		// the "JavaScript Hijacking" issue noted by Fortify and others. It is
		// not appropriate for all circumstances.
		var value = xhr.responseText;
		var cStartIdx = value.indexOf("\/*");
		var cEndIdx = value.lastIndexOf("*\/");
		if((cStartIdx == -1)||(cEndIdx == -1)){
			return dojo.fromJson(xhr.responseText);
		}
		return dojo.fromJson(value.substring(cStartIdx+2, cEndIdx));
	},
	"json-comment-filtered": function(xhr){ 
		// NOTE: we provide the json-comment-filtered option as one solution to
		// the "JavaScript Hijacking" issue noted by Fortify and others. It is
		// not appropriate for all circumstances.
		var value = xhr.responseText;
		var cStartIdx = value.indexOf("\/*");
		var cEndIdx = value.lastIndexOf("*\/");
		if((cStartIdx == -1)||(cEndIdx == -1)){
			// FIXME: throw exception instead?
			console.debug("your JSON wasn't comment filtered!"); 
			return "";
		}
		return dojo.fromJson(value.substring(cStartIdx+2, cEndIdx));
	},
	"javascript": function(xhr){ 
		// FIXME: try Moz and IE specific eval variants?
		return dojo.eval(xhr.responseText);
	},
	"xml": function(xhr){ 
		if(dojo.isIE && !xhr.responseXML){
			dojo.forEach(["MSXML2", "Microsoft", "MSXML", "MSXML3"], function(i){
				try{
					var doc = new ActiveXObject(prefixes[i]+".XMLDOM");
					doc.async = false;
					doc.loadXML(xhr.responseText);
					return doc;	//	DOMDocument
				}catch(e){ /* squelch */ };
			});
		}else{
			return xhr.responseXML;
		}
	}
};

(function(){

	dojo._ioSetArgs = function(/*Object*/args,
			/*Function*/canceller,
			/*Function*/okHandler,
			/*Function*/errHandler){
		//	summary: 
		//		sets up the Deferred and ioArgs property on the Deferred so it
		//		can be used in an io call.
		//	args:
		//		The args object passed into the public io call. Recognized properties on
		//		the args object are:
		//		url:
		//				String URL to server endpoint.
		//		content:
		//				Object containing properties with string values. These
		//				properties will be serialized as name1=value2 and
		//				passed in the request.
		//		timeout:
		//				Milliseconds to wait for the response. If this time
		//				passes, the then error callbacks are called.
		//		form:
		//				DOM node for a form. Used to extract the form values
		//				and send to the server.
		//		preventCache:
		//				Boolean. Default is false. If true, then a
		//				"dojo.preventCache" parameter is sent in the request
		//				with a value that changes with each request
		//				(timestamp). Useful only with GET-type requests.
		//		handleAs:
		//				String. Acceptable values depend on the type of IO
		//				transport (see below).
		//		load:
		//				function(response, ioArgs){}. The load function will be
		//				called on a successful response.
		//		error:
		//				function(response, ioArgs){}. The error function will
		//				be called in an error case. 
		//		handle
		//				function(response, ioArgs){}. The handle function will
		//				be called in either the successful or error case.  For
		//				the load, error and handle functions, the ioArgs object
		//				will contain the following properties: 
		//
		//				args:
		//						the original object argument to the IO call.
		//				xhr:
		//						For XMLHttpRequest calls only, the
		//						XMLHttpRequest object that was used for the
		//						request.
		//				url:
		//						The final URL used for the call. Many times it
		//						will be different than the original args.url
		//						value.
		//				query:
		//						For non-GET requests, the
		//						name1=value1&name2=value2 parameters sent up in
		//						the request.
		//				handleAs:
		//						The final indicator on how the response will be
		//						handled.
		//				id:
		//						For dojo.io.script calls only, the internal
		//						script ID used for the request.
		//				canDelete:
		//						For dojo.io.script calls only, indicates
		//						whether the script tag that represents the
		//						request can be deleted after callbacks have
		//						been called. Used internally to know when
		//						cleanup can happen on JSONP-type requests.
		//				json:
		//						For dojo.io.script calls only: holds the JSON
		//						response for JSONP-type requests. Used
		//						internally to hold on to the JSON responses.
		//						You should not need to access it directly --
		//						the same object should be passed to the success
		//						callbacks directly.
		//	canceller:
		//		The canceller function used for the Deferred object. The function
		//		will receive one argument, the Deferred object that is related to the
		//		canceller.
		//	okHandler:
		//		The first OK callback to be registered with Deferred. It has the opportunity
		//		to transform the OK response. It will receive one argument -- the Deferred
		//		object returned from this function.
		//	errHandler:
		//		The first error callback to be registered with Deferred. It has the opportunity
		//		to do cleanup on an error. It will receive two arguments: error (the 
		//		Error object) and dfd, the Deferred object returned from this function.

		var ioArgs = {};
		ioArgs.args = args;

		//Get values from form if requestd.
		var formQuery = null;
		if(args.form){ 
			var form = dojo.byId(args.form);
			//IE requires going through getAttributeNode instead of just getAttribute in some form cases, 
			//so use it for all.  See #2844
			var actnNode = form.getAttributeNode("action");
			ioArgs.url = args.url || (actnNode ? actnNode.value : null); 
			formQuery = dojo.formToQuery(form);
		}else{
			ioArgs.url = args.url;
		}

		// set up the query params
		var miArgs = [{}];
	
		if(formQuery){
			// potentially over-ride url-provided params w/ form values
			miArgs.push(dojo.queryToObject(formQuery));
		}
		if(args.content){
			// stuff in content over-rides what's set by form
			miArgs.push(args.content);
		}
		if(args.preventCache){
			miArgs.push({"dojo.preventCache": new Date().valueOf()});
		}
		ioArgs.query = dojo.objectToQuery(dojo.mixin.apply(null, miArgs));
	
		// .. and the real work of getting the deferred in order, etc.
		ioArgs.handleAs = args.handleAs || "text";
		var d = new dojo.Deferred(canceller);
		d.addCallbacks(okHandler, function(error){
				return errHandler(error, d);
		});

		//Support specifying load, error and handle callback functions from the args.
		//For those callbacks, the "this" object will be the args object.
		//The callbacks will get the deferred result value as the
		//first argument and the ioArgs object as the second argument.
		var ld = args.load;
		if(ld && dojo.isFunction(ld)){
			d.addCallback(function(value){
				return ld.call(args, value, ioArgs);
			});
		}
		var err = args.error;
		if(err && dojo.isFunction(err)){
			d.addErrback(function(value){
				return err.call(args, value, ioArgs);
			});
		}
		var handle = args.handle;
		if(handle && dojo.isFunction(handle)){
			d.addBoth(function(value){
				return handle.call(args, value, ioArgs);
			});
		}
		
		d.ioArgs = ioArgs;
	
		// FIXME: need to wire up the xhr object's abort method to something
		// analagous in the Deferred
		return d;
	
	}

	var _deferredCancel = function(/*Deferred*/dfd){
		//summary: canceller function for dojo._ioSetArgs call.
		
		dfd.canceled = true;
		var xhr = dfd.ioArgs.xhr;
		if(typeof xhr.abort == "function"){
			xhr.abort();
		}
	}
	var _deferredOk = function(/*Deferred*/dfd){
		//summary: okHandler function for dojo._ioSetArgs call.
		
		return dojo._contentHandlers[dfd.ioArgs.handleAs](dfd.ioArgs.xhr);
	}
	var _deferError = function(/*Error*/error, /*Deferred*/dfd){
		//summary: errHandler function for dojo._ioSetArgs call.
		
		// console.debug("xhr error in:", dfd.ioArgs.xhr);
		console.debug(error);
		return error;
	}

	var _makeXhrDeferred = function(/*Object*/args){
		//summary: makes the Deferred object for this xhr request.
		var dfd = dojo._ioSetArgs(args, _deferredCancel, _deferredOk, _deferError);
		dfd.ioArgs.xhr = dojo._xhrObj();
		return dfd;
	}

	// avoid setting a timer per request. It degrades performance on IE
	// something fierece if we don't use unified loops.
	var _inFlightIntvl = null;
	var _inFlight = [];
	var _watchInFlight = function(){
		//summary: 
		//		internal method that checks each inflight XMLHttpRequest to see
		//		if it has completed or if the timeout situation applies.
		
		var now = (new Date()).getTime();
		// make sure sync calls stay thread safe, if this callback is called
		// during a sync call and this results in another sync call before the
		// first sync call ends the browser hangs
		if(!dojo._blockAsync){
			dojo.forEach(_inFlight, function(tif, arrIdx){
				if(!tif){ return; }
				var dfd = tif.dfd;
				try{
					if(!dfd || dfd.canceled || !tif.validCheck(dfd)){
						_inFlight.splice(arrIdx, 1); return;
					}
					if(tif.ioCheck(dfd)){
						_inFlight.splice(arrIdx, 1); // clean refs
						tif.resHandle(dfd);
					}else if(dfd.startTime){
						//did we timeout?
						if(dfd.startTime + (dfd.ioArgs.args.timeout||0) < now){
							_inFlight.splice(arrIdx, 1); // clean refs
							var err = new Error("timeout exceeded");
							err.dojoType = "timeout";
							dfd.errback(err);
							//Cancel the request so the io module can do appropriate cleanup.
							dfd.cancel();
						}
					}
				}catch(e){
					// FIXME: make sure we errback!
					console.debug(e);
					dfd.errback(new Error("_watchInFlightError!"));
				}
			});
		}

		if(!_inFlight.length){
			clearInterval(_inFlightIntvl);
			_inFlightIntvl = null;
			return;
		}

		// FIXME: need to kill things on unload for #2357
	}

	if(dojo.isIE){
		dojo.addOnUnload(function(){
			try{
				dojo.forEach(_inFlight, function(i){
					i.dfd.cancel();
				});
			}catch(e){/*squelch*/}
		});
	}

	dojo._ioWatch = function(/*Deferred*/dfd,
		/*Function*/validCheck,
		/*Function*/ioCheck,
		/*Function*/resHandle){
		//summary: watches the io request represented by dfd to see if it completes.
		//dfd:
		//		The Deferred object to watch.
		//validCheck:
		//		Function used to check if the IO request is still valid. Gets the dfd
		//		object as its only argument.
		//ioCheck:
		//		Function used to check if basic IO call worked. Gets the dfd
		//		object as its only argument.
		//resHandle:
		//		Function used to process response. Gets the dfd
		//		object as its only argument.
		if(dfd.ioArgs.args.timeout){
			dfd.startTime = (new Date()).getTime();
		}
		_inFlight.push({dfd: dfd, validCheck: validCheck, ioCheck: ioCheck, resHandle: resHandle});
		if(!_inFlightIntvl){
			_inFlightIntvl = setInterval(_watchInFlight, 50);
		}
		_watchInFlight(); // handle sync requests
	}

	var _defaultContentType = "application/x-www-form-urlencoded";

	var _validCheck = function(/*Deferred*/dfd){
		return dfd.ioArgs.xhr.readyState; //boolean
	}
	var _ioCheck = function(/*Deferred*/dfd){
		return 4 == dfd.ioArgs.xhr.readyState; //boolean
	}
	var _resHandle = function(/*Deferred*/dfd){
		if(dojo._isDocumentOk(dfd.ioArgs.xhr)){
			dfd.callback(dfd);
		}else{
			dfd.errback(new Error("bad http response code:" + dfd.ioArgs.xhr.status));
		}
	}

	var _doIt = function(/*String*/type, /*Deferred*/dfd){
		// IE 6 is a steaming pile. It won't let you call apply() on the native function (xhr.open).
		// workaround for IE6's apply() "issues"
		var ioArgs = dfd.ioArgs;
		var args = ioArgs.args;
		ioArgs.xhr.open(type, ioArgs.url, (args.sync !== true), (args.user ? args.user : undefined), (args.password ? args.password: undefined));
		if(args.headers){
			for(var hdr in args.headers){
				if(hdr.toLowerCase() === "content-type" && !args.contentType){
					args.contentType = args.headers[hdr];
				}else{
					ioArgs.xhr.setRequestHeader(hdr, args.headers[hdr]);
				}
			}
		}
		// FIXME: is this appropriate for all content types?
		ioArgs.xhr.setRequestHeader("Content-Type", (args.contentType||_defaultContentType));
		// FIXME: set other headers here!
		try{
			ioArgs.xhr.send(ioArgs.query);
		}catch(e){
			dfd.cancel();
		}
		dojo._ioWatch(dfd, _validCheck, _ioCheck, _resHandle);
		return dfd; //Deferred
	}

	dojo._ioAddQueryToUrl = function(/*Object*/ioArgs){
		//summary: Adds query params discovered by the io deferred construction to the URL.
		//Only use this for operations which are fundamentally GET-type operations.
		if(ioArgs.query.length){
			ioArgs.url += (ioArgs.url.indexOf("?") == -1 ? "?" : "&") + ioArgs.query;
			ioArgs.query = null;
		}		
	}

	// TODOC: FIXME!!!

	dojo.xhrGet = function(/*Object*/ args){
		//	summary: 
		//		Sends an HTTP GET request to the server. See dojo._ioSetArgs in
		//		this file for a list of commonly accepted properties on the
		//		args argument. Additional properties that apply to all of the
		//		dojo.xhr* methods:
		//	handleAs: 
		//		String. Acceptable values are:
		//			"text" (default)
		//			"json"
		//			"json-comment-optional"
		//			"json-comment-filtered"
		//			"javascript"
		//			"xml"
		//	sync:
		//		Boolean. false is default. Indicates whether the request should
		//		be a synchronous (blocking) request.
		//	headers:
		//		Object. Additional HTTP headers to send in the request.
		var dfd = _makeXhrDeferred(args);
		dojo._ioAddQueryToUrl(dfd.ioArgs);
		return _doIt("GET", dfd); // dojo.Deferred
	}

	dojo.xhrPost = function(/*Object*/ args){
		//summary: 
		//		Sends an HTTP POST request to the server. See dojo.xhrGet() for
		//		a list of commonly accepted properties on args.
		return _doIt("POST", _makeXhrDeferred(args)); // dojo.Deferred
	}

	dojo.rawXhrPost = function(/*Object*/ args){
		//	summary:
		//		Sends an HTTP POST request to the server. See dojo.xhrGet in
		//		this file for a list of commonly accepted properties on the
		//		args argument. Additional properties that apply only to this
		//		function:
		//	postData:
		//		String. The raw data to send in the body of the POST request.
		var dfd = _makeXhrDeferred(args);
		dfd.ioArgs.query = args.postData;
		return _doIt("POST", dfd); // dojo.Deferred
	}

	dojo.xhrPut = function(/*Object*/ args){
		//	summary:
		//		Sends an HTTP PUT request to the server. See dojo.xhrGet() for
		//		a list of commonly accepted properties on args.
		return _doIt("PUT", _makeXhrDeferred(args)); // dojo.Deferred
	}

	dojo.rawXhrPut = function(/*Object*/ args){
		//	summary:
		//		Sends an HTTP PUT request to the server. See dojo.xhrGet() for
		//		a list of commonly accepted properties on args. Additional
		//		properties that apply only to this function:
		//	putData:
		//		String. The raw data to send in the body of the PUT request.
		var dfd = _makeXhrDeferred(args);
		var ioArgs = dfd.ioArgs;
		if(args["putData"]){
			ioArgs.query = args.putData;
			args.putData = null;
		}
		return _doIt("PUT", dfd); // dojo.Deferred
	}

	dojo.xhrDelete = function(/*Object*/ args){
		//	summary:
		//		Sends an HTTP DELETE request to the server. See dojo.xhrGet()
		//		for a list of commonly accepted properties on args.
		var dfd = _makeXhrDeferred(args);
		dojo._ioAddQueryToUrl(dfd.ioArgs);
		return _doIt("DELETE", dfd); // dojo.Deferred
	}

	dojo.wrapForm = function(formNode){
		//summary:
		//		A replacement for FormBind, but not implemented yet.

		// FIXME: need to think harder about what extensions to this we might
		// want. What should we allow folks to do w/ this? What events to
		// set/send?
		throw new Error("dojo.wrapForm not yet implemented");
	}
})();
