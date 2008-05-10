dojo.provide("dojo._base.xhr");
dojo.require("dojo._base.Deferred");
dojo.require("dojo._base.json");
dojo.require("dojo._base.lang");
dojo.require("dojo._base.query");

(function(){
	var _d = dojo;
	function setValue(/*Object*/obj, /*String*/name, /*String*/value){
		//summary:
		//		For the nameed property in object, set the value. If a value
		//		already exists and it is a string, convert the value to be an
		//		array of values.
		var val = obj[name];
		if(_d.isString(val)){
			obj[name] = [val, value];
		}else if(_d.isArray(val)){
			val.push(value);
		}else{
			obj[name] = value;
		}
	}

	dojo.formToObject = function(/*DOMNode||String*/ formNode){
		// summary:
		//		dojo.formToObject returns the values encoded in an HTML form as
		//		string properties in an object which it then returns. Disabled form
		//		elements, buttons, and other non-value form elements are skipped.
		//		Multi-select elements are returned as an array of string values.
		// description:
		//		This form:
		//
		//		|	<form id="test_form">
		//		|		<input type="text" name="blah" value="blah">
		//		|		<input type="text" name="no_value" value="blah" disabled>
		//		|		<input type="button" name="no_value2" value="blah">
		//		|		<select type="select" multiple name="multi" size="5">
		//		|			<option value="blah">blah</option>
		//		|			<option value="thud" selected>thud</option>
		//		|			<option value="thonk" selected>thonk</option>
		//		|		</select>
		//		|	</form>
		//
		//		yields this object structure as the result of a call to
		//		formToObject():
		//
		//		|	{ 
		//		|		blah: "blah",
		//		|		multi: [
		//		|			"thud",
		//		|			"thonk"
		//		|		]
		//		|	};
	
		var ret = {};
		var iq = "input:not([type=file]):not([type=submit]):not([type=image]):not([type=reset]):not([type=button]), select, textarea";
		_d.query(iq, formNode).filter(function(node){
			return !node.disabled && node.name;
		}).forEach(function(item){
			var _in = item.name;
			var type = (item.type||"").toLowerCase();
			if(type == "radio" || type == "checkbox"){
				if(item.checked){ setValue(ret, _in, item.value); }
			}else if(item.multiple){
				ret[_in] = [];
				_d.query("option", item).forEach(function(opt){
					if(opt.selected){
						setValue(ret, _in, opt.value);
					}
				});
			}else{ 
				setValue(ret, _in, item.value);
				if(type == "image"){
					ret[_in+".x"] = ret[_in+".y"] = ret[_in].x = ret[_in].y = 0;
				}
			}
		});
		return ret; // Object
	}

	dojo.objectToQuery = function(/*Object*/ map){
		//	summary:
		//		takes a name/value mapping object and returns a string representing
		//		a URL-encoded version of that object.
		//	example:
		//		this object:
		//
		//		|	{ 
		//		|		blah: "blah",
		//		|		multi: [
		//		|			"thud",
		//		|			"thonk"
		//		|		]
		//		|	};
		//
		//	yields the following query string:
		//	
		//	|	"blah=blah&multi=thud&multi=thonk"

		// FIXME: need to implement encodeAscii!!
		var enc = encodeURIComponent;
		var pairs = [];
		var backstop = {};
		for(var name in map){
			var value = map[name];
			if(value != backstop[name]){
				var assign = enc(name) + "=";
				if(_d.isArray(value)){
					for(var i=0; i < value.length; i++){
						pairs.push(assign + enc(value[i]));
					}
				}else{
					pairs.push(assign + enc(value));
				}
			}
		}
		return pairs.join("&"); // String
	}

	dojo.formToQuery = function(/*DOMNode||String*/ formNode){
		// summary:
		//		Returns a URL-encoded string representing the form passed as either a
		//		node or string ID identifying the form to serialize
		return _d.objectToQuery(_d.formToObject(formNode)); // String
	}

	dojo.formToJson = function(/*DOMNode||String*/ formNode, /*Boolean?*/prettyPrint){
		// summary:
		//		return a serialized JSON string from a form node or string
		//		ID identifying the form to serialize
		return _d.toJson(_d.formToObject(formNode), prettyPrint); // String
	}

	dojo.queryToObject = function(/*String*/ str){
		// summary:
		//		returns an object representing a de-serialized query section of a
		//		URL. Query keys with multiple values are returned in an array.
		// description:
		//		This string:
		//
		//	|		"foo=bar&foo=baz&thinger=%20spaces%20=blah&zonk=blarg&"
		//		
		//		results in this object structure:
		//
		//	|		{
		//	|			foo: [ "bar", "baz" ],
		//	|			thinger: " spaces =blah",
		//	|			zonk: "blarg"
		//	|		}
		//	
		//		Note that spaces and other urlencoded entities are correctly
		//		handled.

		// FIXME: should we grab the URL string if we're not passed one?
		var ret = {};
		var qp = str.split("&");
		var dec = decodeURIComponent;
		_d.forEach(qp, function(item){
			if(item.length){
				var parts = item.split("=");
				var name = dec(parts.shift());
				var val = dec(parts.join("="));
				if(_d.isString(ret[name])){
					ret[name] = [ret[name]];
				}
				if(_d.isArray(ret[name])){
					ret[name].push(val);
				}else{
					ret[name] = val;
				}
			}
		});
		return ret; // Object
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
			if(!dojo.config.usePlainJson){
				console.warn("Consider using mimetype:text/json-comment-filtered"
					+ " to avoid potential security issues with JSON endpoints"
					+ " (use djConfig.usePlainJson=true to turn off this message)");
			}
			return (xhr.status == 204) ? undefined : _d.fromJson(xhr.responseText);
		},
		"json-comment-filtered": function(xhr){ 
			// NOTE: we provide the json-comment-filtered option as one solution to
			// the "JavaScript Hijacking" issue noted by Fortify and others. It is
			// not appropriate for all circumstances.

			var value = xhr.responseText;
			var cStartIdx = value.indexOf("\/*");
			var cEndIdx = value.lastIndexOf("*\/");
			if(cStartIdx == -1 || cEndIdx == -1){
				throw new Error("JSON was not comment filtered");
			}
			return (xhr.status == 204) ? undefined :
				_d.fromJson(value.substring(cStartIdx+2, cEndIdx));
		},
		"javascript": function(xhr){ 
			// FIXME: try Moz and IE specific eval variants?
			return _d.eval(xhr.responseText);
		},
		"xml": function(xhr){ 
			var result = xhr.responseXML;
			if(_d.isIE && (!result || window.location.protocol == "file:")){
				_d.forEach(["MSXML2", "Microsoft", "MSXML", "MSXML3"], function(prefix){
					try{
						var dom = new ActiveXObject(prefix + ".XMLDOM");
						dom.async = false;
						dom.loadXML(xhr.responseText);
						result = dom;
					}catch(e){ /* Not available. Squelch and try next one. */ }
				});
			}
			return result; // DOMDocument
		}
	};

	dojo._contentHandlers["json-comment-optional"] = function(xhr){
		var handlers = _d._contentHandlers;
		try{
			return handlers["json-comment-filtered"](xhr);
		}catch(e){
			return handlers["json"](xhr);
		}
	};

	/*=====
	dojo.__IoArgs = function(){
		//	url: String
		//		URL to server endpoint.
		//	content: Object?
		//		Contains properties with string values. These
		//		properties will be serialized as name1=value2 and
		//		passed in the request.
		//	timeout: Integer?
		//		Milliseconds to wait for the response. If this time
		//		passes, the then error callbacks are called.
		//	form: DOMNode?
		//		DOM node for a form. Used to extract the form values
		//		and send to the server.
		//	preventCache: Boolean?
		//		Default is false. If true, then a
		//		"dojo.preventCache" parameter is sent in the request
		//		with a value that changes with each request
		//		(timestamp). Useful only with GET-type requests.
		//	handleAs: String?
		//		Acceptable values depend on the type of IO
		//		transport (see specific IO calls for more information).
		//	load: Function?
		//		function(response, ioArgs){}. response is an Object, ioArgs
		//		is of type dojo.__IoCallbackArgs. The load function will be
		//		called on a successful response.
		//	error: Function?
		//		function(response, ioArgs){}. response is an Object, ioArgs
		//		is of type dojo.__IoCallbackArgs. The error function will
		//		be called in an error case. 
		//	handle: Function?
		//		function(response, ioArgs){}. response is an Object, ioArgs
		//		is of type dojo.__IoCallbackArgs. The handle function will
		//		be called in either the successful or error case.  For
		//		the load, error and handle functions, the ioArgs object
		//		will contain the following properties: 
		this.url = url;
		this.content = content;
		this.timeout = timeout;
		this.form = form;
		this.preventCache = preventCache;
		this.handleAs = handleAs;
		this.load = load;
		this.error = error;
		this.handle = handle;
	}
	=====*/

	/*=====
	dojo.__IoCallbackArgs = function(args, xhr, url, query, handleAs, id, canDelete, json){
		//	args: Object
		//		the original object argument to the IO call.
		//	xhr: XMLHttpRequest
		//		For XMLHttpRequest calls only, the
		//		XMLHttpRequest object that was used for the
		//		request.
		//	url: String
		//		The final URL used for the call. Many times it
		//		will be different than the original args.url
		//		value.
		//	query: String
		//		For non-GET requests, the
		//		name1=value1&name2=value2 parameters sent up in
		//		the request.
		//	handleAs: String
		//		The final indicator on how the response will be
		//		handled.
		//	id: String
		//		For dojo.io.script calls only, the internal
		//		script ID used for the request.
		//	canDelete: Boolean
		//		For dojo.io.script calls only, indicates
		//		whether the script tag that represents the
		//		request can be deleted after callbacks have
		//		been called. Used internally to know when
		//		cleanup can happen on JSONP-type requests.
		//	json: Object
		//		For dojo.io.script calls only: holds the JSON
		//		response for JSONP-type requests. Used
		//		internally to hold on to the JSON responses.
		//		You should not need to access it directly --
		//		the same object should be passed to the success
		//		callbacks directly.
		this.args = args;
		this.xhr = xhr;
		this.url = url;
		this.query = query;
		this.handleAs = handleAs;
		this.id = id;
		this.canDelete = canDelete;
		this.json = json;
	}
	=====*/



	dojo._ioSetArgs = function(/*dojo.__IoArgs*/args,
			/*Function*/canceller,
			/*Function*/okHandler,
			/*Function*/errHandler){
		//	summary: 
		//		sets up the Deferred and ioArgs property on the Deferred so it
		//		can be used in an io call.
		//	args:
		//		The args object passed into the public io call. Recognized properties on
		//		the args object are:
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

		var ioArgs = {args: args, url: args.url};

		//Get values from form if requestd.
		var formObject = null;
		if(args.form){ 
			var form = _d.byId(args.form);
			//IE requires going through getAttributeNode instead of just getAttribute in some form cases, 
			//so use it for all.  See #2844
			var actnNode = form.getAttributeNode("action");
			ioArgs.url = ioArgs.url || (actnNode ? actnNode.value : null); 
			formObject = _d.formToObject(form);
		}

		// set up the query params
		var miArgs = [{}];
	
		if(formObject){
			// potentially over-ride url-provided params w/ form values
			miArgs.push(formObject);
		}
		if(args.content){
			// stuff in content over-rides what's set by form
			miArgs.push(args.content);
		}
		if(args.preventCache){
			miArgs.push({"dojo.preventCache": new Date().valueOf()});
		}
		ioArgs.query = _d.objectToQuery(_d.mixin.apply(null, miArgs));
	
		// .. and the real work of getting the deferred in order, etc.
		ioArgs.handleAs = args.handleAs || "text";
		var d = new _d.Deferred(canceller);
		d.addCallbacks(okHandler, function(error){
			return errHandler(error, d);
		});

		//Support specifying load, error and handle callback functions from the args.
		//For those callbacks, the "this" object will be the args object.
		//The callbacks will get the deferred result value as the
		//first argument and the ioArgs object as the second argument.
		var ld = args.load;
		if(ld && _d.isFunction(ld)){
			d.addCallback(function(value){
				return ld.call(args, value, ioArgs);
			});
		}
		var err = args.error;
		if(err && _d.isFunction(err)){
			d.addErrback(function(value){
				return err.call(args, value, ioArgs);
			});
		}
		var handle = args.handle;
		if(handle && _d.isFunction(handle)){
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
		var _at = typeof xhr.abort;
		if(_at == "function" || _at == "unknown"){
			xhr.abort();
		}
		var err = new Error("xhr cancelled");
		err.dojoType = "cancel";
		return err;
	}
	var _deferredOk = function(/*Deferred*/dfd){
		//summary: okHandler function for dojo._ioSetArgs call.

		return _d._contentHandlers[dfd.ioArgs.handleAs](dfd.ioArgs.xhr);
	}
	var _deferError = function(/*Error*/error, /*Deferred*/dfd){
		//summary: errHandler function for dojo._ioSetArgs call.
		
		// console.debug("xhr error in:", dfd.ioArgs.xhr);
		console.debug(error);
		return error;
	}

	var _makeXhrDeferred = function(/*dojo.__XhrArgs*/args){
		//summary: makes the Deferred object for this xhr request.
		var dfd = _d._ioSetArgs(args, _deferredCancel, _deferredOk, _deferError);
		//Pass the args to _xhrObj, to allow xhr iframe proxy interceptions.
		dfd.ioArgs.xhr = _d._xhrObj(dfd.ioArgs.args);
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
		if(!_d._blockAsync){
			// we need manual loop because we often modify _inFlight (and therefore 'i') while iterating
			// note: the second clause is an assigment on purpose, lint may complain
			for(var i = 0, tif; i < _inFlight.length && (tif = _inFlight[i]); i++){
				var dfd = tif.dfd;
				try{
					if(!dfd || dfd.canceled || !tif.validCheck(dfd)){
						_inFlight.splice(i--, 1); 
					}else if(tif.ioCheck(dfd)){
						_inFlight.splice(i--, 1);
						tif.resHandle(dfd);
					}else if(dfd.startTime){
						//did we timeout?
						if(dfd.startTime + (dfd.ioArgs.args.timeout || 0) < now){
							_inFlight.splice(i--, 1);
							var err = new Error("timeout exceeded");
							err.dojoType = "timeout";
							dfd.errback(err);
							//Cancel the request so the io module can do appropriate cleanup.
							dfd.cancel();
						}
					}
				}catch(e){
					// FIXME: make sure we errback! (fixed?  remove console.debug?)
					console.debug(e);
					dfd.errback(new Error("_watchInFlightError!"));
				}
			}
		}

		if(!_inFlight.length){
			clearInterval(_inFlightIntvl);
			_inFlightIntvl = null;
			return;
		}

	}

	dojo._ioCancelAll = function(){
		//summary: Cancels all pending IO requests, regardless of IO type
		//(xhr, script, iframe).
		try{
			_d.forEach(_inFlight, function(i){
				i.dfd.cancel();
			});
		}catch(e){/*squelch*/}
	}

	//Automatically call cancel all io calls on unload
	//in IE for trac issue #2357.
	if(_d.isIE){
		_d.addOnUnload(_d._ioCancelAll);
	}

	_d._ioWatch = function(/*Deferred*/dfd,
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
		var xhr = dfd.ioArgs.xhr;
		if(_d._isDocumentOk(xhr)){
			dfd.callback(dfd);
		}else{
			var err = new Error("Unable to load " + dfd.ioArgs.url + " status:" + xhr.status);
			err.status = xhr.status;
			err.responseText = xhr.responseText;
			dfd.errback(err);
		}
	}

	var _doIt = function(/*String*/type, /*Deferred*/dfd){
		// IE 6 is a steaming pile. It won't let you call apply() on the native function (xhr.open).
		// workaround for IE6's apply() "issues"
		var ioArgs = dfd.ioArgs;
		var args = ioArgs.args;
		var xhr = ioArgs.xhr;
		xhr.open(type, ioArgs.url, args.sync !== true, args.user || undefined, args.password || undefined);
		if(args.headers){
			for(var hdr in args.headers){
				if(hdr.toLowerCase() === "content-type" && !args.contentType){
					args.contentType = args.headers[hdr];
				}else{
					xhr.setRequestHeader(hdr, args.headers[hdr]);
				}
			}
		}
		// FIXME: is this appropriate for all content types?
		xhr.setRequestHeader("Content-Type", args.contentType || _defaultContentType);
		if(!args.headers || !args.headers["X-Requested-With"]){
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		}
		// FIXME: set other headers here!
		try{
			xhr.send(ioArgs.query);
		}catch(e){
			dfd.cancel();
		}
		_d._ioWatch(dfd, _validCheck, _ioCheck, _resHandle);
		xhr = null;
		return dfd; //Deferred
	}

	dojo._ioAddQueryToUrl = function(/*dojo.__IoCallbackArgs*/ioArgs){
		//summary: Adds query params discovered by the io deferred construction to the URL.
		//Only use this for operations which are fundamentally GET-type operations.
		if(ioArgs.query.length){
			ioArgs.url += (ioArgs.url.indexOf("?") == -1 ? "?" : "&") + ioArgs.query;
			ioArgs.query = null;
		}		
	}

	/*=====
	dojo.declare("dojo.__XhrArgs", dojo.__IoArgs, {
		constructor: function(){
			//	summary:
			//		In addition to the properties listed for the dojo._IoArgs type,
			//		the following properties are allowed for dojo.xhr* methods.
			//	handleAs: String?
			//		Acceptable values are: text (default), json, json-comment-optional,
			//		json-comment-filtered, javascript, xml
			//	sync: Boolean?
			//		false is default. Indicates whether the request should
			//		be a synchronous (blocking) request.
			//	headers: Object?
			//		Additional HTTP headers to send in the request.
			this.handleAs = handleAs;
			this.sync = sync;
			this.headers = headers;
		}
	});
	=====*/

	dojo.xhr = function(/*String*/ method, /*dojo.__XhrArgs*/ args, /*Boolean?*/ hasBody){
		//	summary: 
		//		Sends an HTTP request with the given method. If the request has an 
		//		HTTP body, then pass true for hasBody. The method argument should be uppercase.
		//		Also look at dojo.xhrGet(), xhrPost(), xhrPut() and dojo.xhrDelete() for shortcuts
		//		for those HTTP methods. There are also methods for "raw" PUT and POST methods
		//		via dojo.rawXhrPut() and dojo.rawXhrPost() respectively.
		var dfd = _makeXhrDeferred(args);
		if(!hasBody){
			_d._ioAddQueryToUrl(dfd.ioArgs);
		}
		return _doIt(method, dfd); // dojo.Deferred
	}

	dojo.xhrGet = function(/*dojo.__XhrArgs*/ args){
		//	summary: 
		//		Sends an HTTP GET request to the server.
		return _d.xhr("GET", args); //dojo.Deferred
	}

	dojo.xhrPost = function(/*dojo.__XhrArgs*/ args){
		//summary: 
		//		Sends an HTTP POST request to the server.
		return _d.xhr("POST", args, true); // dojo.Deferred
	}

	dojo.rawXhrPost = function(/*dojo.__XhrArgs*/ args){
		//	summary:
		//		Sends an HTTP POST request to the server. In addtion to the properties
		//		listed for the dojo.__XhrArgs type, the following property is allowed:
		//	postData:
		//		String. The raw data to send in the body of the POST request.
		var dfd = _makeXhrDeferred(args);
		dfd.ioArgs.query = args.postData;
		return _doIt("POST", dfd); // dojo.Deferred
	}

	dojo.xhrPut = function(/*dojo.__XhrArgs*/ args){
		//	summary:
		//		Sends an HTTP PUT request to the server.
		return _d.xhr("PUT", args, true); // dojo.Deferred
	}

	dojo.rawXhrPut = function(/*dojo.__XhrArgs*/ args){
		//	summary:
		//		Sends an HTTP PUT request to the server. In addtion to the properties
		//		listed for the dojo.__XhrArgs type, the following property is allowed:
		//	putData:
		//		String. The raw data to send in the body of the PUT request.
		var dfd = _makeXhrDeferred(args);
		var ioArgs = dfd.ioArgs;
		if(args.putData){
			ioArgs.query = args.putData;
			args.putData = null;
		}
		return _doIt("PUT", dfd); // dojo.Deferred
	}

	dojo.xhrDelete = function(/*dojo.__XhrArgs*/ args){
		//	summary:
		//		Sends an HTTP DELETE request to the server.
		return _d.xhr("DELETE", args); //dojo.Deferred
	}

	/*
	dojo.wrapForm = function(formNode){
		//summary:
		//		A replacement for FormBind, but not implemented yet.

		// FIXME: need to think harder about what extensions to this we might
		// want. What should we allow folks to do w/ this? What events to
		// set/send?
		throw new Error("dojo.wrapForm not yet implemented");
	}
	*/
})();
