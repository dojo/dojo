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
	//		yeilds this object structure as the result of a call to
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
	var iq = "input[type!=file][type!=submit][type!=image][type!=reset][type!=button], select";
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
		return xhr.responseXML;
	}
};

(function(){
	var _setupForXhr = function(args){
		// FIXME: need to ensure that we're not performing destructive ops on
		// args or pulling things out of it w/o resetting. We want users to be
		// able to reuse an args obj.

		// set up the query params
		var qi = args.url.indexOf("?");
		var miArgs = [{}];
		if(qi != -1){ // url-provided params are the baseline
			miArgs.push(dojo.queryToObject(args.url.substr(qi+1)));
			// FIXME: destructive!!
			args.url = args.url.substr(0, qi);
		}
		if(args.form){ // we assume that _setupFromForm has been run before us
			// potentially over-ride url-provided params w/ form values
			miArgs.push(dojo.queryToObject(args._formQuery));
		}
		if(args.content){
			// stuff in content over-rides what's set by form
			miArgs.push(args.content);
		}
		args._query = dojo.objectToQuery(dojo.mixin.apply(null, miArgs));

		// .. and the real work of getting the deferred in order, etc.
		var ha = args.handleAs || "text";
		var _xhro = dojo._xhrObj();
		var d = new dojo.Deferred(function(td){
			td.canceled = true;
			_xhro.abort();
		});
		d.addCallback(function(value){
			return dojo._contentHandlers[ha](_xhro);
		});
		d.xhr = _xhro;
		d.args = args;
		d.d = d;
		// FIXME: need to wire up the xhr object's abort method to something
		// analagous in the Deferred
		return d;
	}

	var _setupFromForm = function(args){
		var form = dojo.byId(args.form);
		args.url = args.url || form.getAttribute("action");
		args._formQuery = dojo.formToQuery(form);
		return args;
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
				try{
					if(!tif || tif.d.canceled || !tif.xhr.readyState){
						_inFlight.splice(arrIdx, 1); return;
					}
					if(4 == tif.xhr.readyState){
						_inFlight.splice(arrIdx, 1); // clean refs
						if(dojo._isDocumentOk(tif.xhr)){
							tif.d.callback(tif.xhr);
						}else{
							console.debug("xhr error in:", tif.xhr);
							console.debug("http response code:", tif.xhr.status);
							tif.d.errback(tif.xhr);
						}
					}else if(tif.startTime){
						//did we timeout?
						if(tif.startTime + (tif.timeout) < now){
							//Stop the request.
							tif.d.cancel();
							_inFlight.splice(arrIdx, 1); // clean refs
							console.debug("xhr error in:", tif.xhr);
							console.debug("timeout exceeded!");
							tif.d.errback(new Error("timeout exceeded"));
						}
					}
				}catch(e){
					// FIXME: make sure we errback!
					console.debug(e);
					tif.d.errback(new Error("_watchInFlightError!"));
				}
			});
		}

		if(!_inFlight.length){
			clearInterval(_inFlightIntvl);
			_inFlightIntvl = null;
			return;
		}
	}

	var _launch = function(obj){
		obj.startTime = (new Date()).getTime();
		_inFlight.push(obj);
		if(!_inFlightIntvl){
			_inFlightIntvl = setInterval(_watchInFlight, 50);
		}
		_watchInFlight(); // handle sync requests
	}

	var _defaultContentType = "application/x-www-form-urlencoded";

	var _doIt = function(type, args, ao){
		// IE 6 is a steaming pile. It won't let you call apply() on the native function.
		// var ga = [type, args.url, (args.sync !== true)];
		// if(args.user){ ga.push(args.user, args.password); }
		// ao.xhr.open.apply(ao.xhr, ga);
		// workaround for IE6's apply() "issues"
		ao.xhr.open(type, args.url, (args.sync !== true), (args.user ? args.user : undefined), (args.password ? args.password: undefined));
		// FIXME: is this appropriate for all content types?
		ao.xhr.setRequestHeader("Content-Type", (args.contentType||_defaultContentType));
		// FIXME: set other headers here!
		try{
			ao.xhr.send(args._query);
		}catch(e){
			ao.d.cancel();
		}
		_launch(ao);
		return ao.d;
	}

	// TODOC: FIXME!!!

	dojo.xhrGet = function(/*Object*/ args){
		if(args.form){ 
			args = _setupFromForm(args);
		}
		var ao = _setupForXhr(args);
		if(args._query.length){ args.url += "?"+args._query; args._query = null; }
		return _doIt("GET", args, ao); // dojo.Deferred
	}

	dojo.xhrPost = function(/*Object*/ args){
		if(args.form){ 
			args = _setupFromForm(args);
		}
		var ao = _setupForXhr(args);
		return _doIt("POST", args, ao); // dojo.Deferred
	}

	dojo.rawXhrPost = function(/*Object*/ args){
		if(args.form){ 
			args = _setupFromForm(args);
		}
		var ao = _setupForXhr(args);
		args._query = args.postData;
		return _doIt("POST", args, ao); // dojo.Deferred
	}

	dojo.wrapForm = function(formNode){
		// was FormBind
		// FIXME: waiting on connect
		// FIXME: need to think harder about what extensions to this we might
		// want. What should we allow folks to do w/ this? What events to
		// set/send?
		throw new Error("dojo.wrapForm not yet implemented");
	}
})();
