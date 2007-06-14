dojo.provide("dojo.io.IframeIO");
dojo.require("dojo.io.BrowserIO");
dojo.require("dojo.uri.*");

// FIXME: is it possible to use the Google htmlfile hack to prevent the
// background click with this transport?

dojo.io.createIFrame = function(/*String*/fname, /*String*/onloadstr, /*String?*/uri){
	//summary: Creates a hidden iframe in the page. Used mostly for data transports.
	//fname: String
	//		The name of the iframe. Used for the name attribute on the iframe.
	//onloadstr: String
	//		A string of Javascript that will be executed when the content in the iframe loads.
	//uri: String
	//		The value of the src attribute on the iframe element. If a value is not
	//		given, then iframe_history.html will be used.
	if(window[fname]){ return window[fname]; }
	if(window.frames[fname]){ return window.frames[fname]; }
	var r = dojo.render.html;
	var cframe = null;
	var turi = uri;
	if(!turi){
		if(djConfig["useXDomain"] && !djConfig["dojoIframeHistoryUrl"]){
			dojo.debug("dojo.io.createIFrame: When using cross-domain Dojo builds,"
				+ " please save iframe_history.html to your domain and set djConfig.dojoIframeHistoryUrl"
				+ " to the path on your domain to iframe_history.html");
		}
		turi = (djConfig["dojoIframeHistoryUrl"]||dojo.uri.moduleUri("dojo", "../iframe_history.html")) + "#noInit=true";
	}
	var ifrstr = ((r.ie)&&(dojo.render.os.win)) ? '<iframe name="'+fname+'" src="'+turi+'" onload="'+onloadstr+'">' : 'iframe';
	cframe = document.createElement(ifrstr);
	with(cframe){
		name = fname;
		setAttribute("name", fname);
		id = fname;
	}
	dojo.body().appendChild(cframe);
	window[fname] = cframe;

	with(cframe.style){
		if(!r.safari){
			//We can't change the src in Safari 2.0.3 if absolute position. Bizarro.
			position = "absolute";
		}
		left = top = "0px";
		height = width = "1px";
		visibility = "hidden";
		/*
		if(djConfig.isDebug){
			position = "relative";
			height = "300px";
			width = "600px";
			visibility = "visible";
		}
		*/
	}

	if(!r.ie){
		dojo.io.setIFrameSrc(cframe, turi, true);
		cframe.onload = new Function(onloadstr);
	}
	
	return cframe;
}

dojo.io.IframeTransport = new function(){
	//summary: The object that implements the dojo.io.bind transport that
	//uses an iframe to communicate to the server.
	var _this = this;
	this.currentRequest = null;
	this.requestQueue = [];
	this.iframeName = "dojoIoIframe";

	this.fireNextRequest = function(){
		//summary: Internal method used to fire the next request in the bind queue.
		try{
			if((this.currentRequest)||(this.requestQueue.length == 0)){ return; }
			// dojo.debug("fireNextRequest");
			var cr = this.currentRequest = this.requestQueue.shift();
			cr._contentToClean = [];
			var fn = cr["formNode"];
			var content = cr["content"] || {};
			if(cr.sendTransport) {
				content["dojo.transport"] = "iframe";
			}
			if(fn){
				if(content){
					// if we have things in content, we need to add them to the form
					// before submission
					for(var x in content){
						if(!fn[x]){
							var tn;
							if(dojo.render.html.ie){
								tn = document.createElement("<input type='hidden' name='"+x+"' value='"+content[x]+"'>");
								fn.appendChild(tn);
							}else{
								tn = document.createElement("input");
								fn.appendChild(tn);
								tn.type = "hidden";
								tn.name = x;
								tn.value = content[x];
							}
							cr._contentToClean.push(x);
						}else{
							fn[x].value = content[x];
						}
					}
				}
				if(cr["url"]){
					cr._originalAction = fn.getAttribute("action");
					fn.setAttribute("action", cr.url);
				}
				if(!fn.getAttribute("method")){
					fn.setAttribute("method", (cr["method"]) ? cr["method"] : "post");
				}
				cr._originalTarget = fn.getAttribute("target");
				fn.setAttribute("target", this.iframeName);
				fn.target = this.iframeName;
				fn.submit();
			}else{
				// otherwise we post a GET string by changing URL location for the
				// iframe
				var query = dojo.io.argsFromMap(this.currentRequest.content);
				var tmpUrl = cr.url + (cr.url.indexOf("?") > -1 ? "&" : "?") + query;
				dojo.io.setIFrameSrc(this.iframe, tmpUrl, true);
			}
		}catch(e){
			this.iframeOnload(e);
		}
	}

	this.canHandle = function(/*dojo.io.Request*/kwArgs){
		//summary: Tells dojo.io.bind() if this is a good transport to
		//use for the particular type of request.
		//description: This type of transport cannot
		//handle text/xml or application/xml return types, is limited to GET
		//or POST requests, and cannot do synchronous binds.
		return (
			(
				dojo.lang.inArray([	"text/plain", "text/html", "text/javascript", "text/json", "application/json"], kwArgs["mimetype"])
			)&&(
				dojo.lang.inArray(["post", "get"], kwArgs["method"].toLowerCase())
			)&&(
				// never handle a sync request
				!  ((kwArgs["sync"])&&(kwArgs["sync"] == true))
			)
		); //boolean
	}

	this.bind = function(/*dojo.io.Request*/kwArgs){
		//summary: function that sends the request to the server.

		//This transport can only process one bind request at a time, so if bind is called
		//multiple times, it will queue up the calls and only process one at a time.
		//The following are acceptable properties in kwArgs (in addition to the
		//normal dojo.io.Request object properties).
		//url: String: URL the server URL to use for the request.
		//transport: String: specify "IframeTransport" to force the use of this transport.
		//sendTransport: boolean: If true, then dojo.transport=iframe will be added to the request.
		//formNode: DOMNode: a form element node. The form elements' names and values will be used in
		//		the request. This makes it possible to upload files using this transport.
		//method: String: the HTTP method to use. Must be GET or POST. Default is POST.
		//mimetype: Specifies what format the result data should be given to the load/handle callback. Valid values are:
		//		text/plain, text/html, text/javascript, text/json, application/json. IMPORTANT: For all values EXCEPT text/html,
		//		The server response should be an HTML file with a textarea element. The response data should be inside the textarea
		//		element. Using an HTML document the only reliable, cross-browser way this transport can know
		//		when the response has loaded. For the text/html mimetype, just return a normal HTML document.
		//content: Object: If a formNode is one of the other kwArgs properties, then the content
		//		object properties become hidden form form elements. For instance, a content
		//		object of {name1 : "value1"} is converted to a hidden form element with a name
		//		of "name1" and a value of "value1". If there is not a formNode property, then
		//		the content object is converted into a name=value&name=value string, by
		//		using dojo.io.argsFromMap(). No encoding is passed to that method, so the
		//		names and values will be encoded using dojo.string.encodeAscii().
		if(!this["iframe"]){ this.setUpIframe(); }
		this.requestQueue.push(kwArgs);
		this.fireNextRequest();
		return;
	}

	this.setUpIframe = function(){

		// NOTE: IE 5.0 and earlier Mozilla's don't support an onload event for
		//       iframes. OTOH, we don't care.
		this.iframe = dojo.io.createIFrame(this.iframeName, "dojo.io.IframeTransport.iframeOnload();");
	}

	this.iframeOnload = function(errorObject /* Object */){
		if(!_this.currentRequest){
			_this.fireNextRequest();
			return;
		}

		var req = _this.currentRequest;

		if(req.formNode){
			// remove all the hidden content inputs
			var toClean = req._contentToClean;
			for(var i = 0; i < toClean.length; i++) {
				var key = toClean[i];
				if(dojo.render.html.safari){
					//In Safari (at least 2.0.3), can't use formNode[key] syntax to find the node,
					//for nodes that were dynamically added.
					var fNode = req.formNode;
					for(var j = 0; j < fNode.childNodes.length; j++){
						var chNode = fNode.childNodes[j];
						if(chNode.name == key){
							var pNode = chNode.parentNode;
							pNode.removeChild(chNode);
							break;
						}
					}
				}else{
					var input = req.formNode[key];
					req.formNode.removeChild(input);
					req.formNode[key] = null;
				}
			}
	
			// restore original action + target
			if(req["_originalAction"]){
				req.formNode.setAttribute("action", req._originalAction);
			}
			if(req["_originalTarget"]){
				req.formNode.setAttribute("target", req._originalTarget);
				req.formNode.target = req._originalTarget;
			}
		}

		var contentDoc = function(iframe_el){
			var doc = iframe_el.contentDocument || // W3
				(
					(iframe_el.contentWindow)&&(iframe_el.contentWindow.document)
				) ||  // IE
				(
					(iframe_el.name)&&(document.frames[iframe_el.name])&&
					(document.frames[iframe_el.name].document)
				) || null;
			return doc;
		};

		var value;
		var success = false;

		if (errorObject){
				this._callError(req, "IframeTransport Request Error: " + errorObject);
		}else{
			var ifd = contentDoc(_this.iframe);
			// handle successful returns
			// FIXME: how do we determine success for iframes? Is there an equiv of
			// the "status" property?
	
			try{
				var cmt = req.mimetype;
				if((cmt == "text/javascript")||(cmt == "text/json")||(cmt == "application/json")){
					// FIXME: not sure what to do here? try to pull some evalulable
					// text from a textarea or cdata section? 
					// how should we set up the contract for that?
					var js = ifd.getElementsByTagName("textarea")[0].value;
					if(cmt == "text/json" || cmt == "application/json") { js = "(" + js + ")"; }
					value = dj_eval(js);
				}else if(cmt == "text/html"){
					value = ifd;
				}else{ // text/plain
					value = ifd.getElementsByTagName("textarea")[0].value;
				}
				success = true;
			}catch(e){ 
				// looks like we didn't get what we wanted!
				this._callError(req, "IframeTransport Error: " + e);
			}
		}

		// don't want to mix load function errors with processing errors, thus
		// a separate try..catch
		try {
			if(success && dojo.lang.isFunction(req["load"])){
				req.load("load", value, req);
			}
		} catch(e) {
			throw e;
		} finally {
			_this.currentRequest = null;
			_this.fireNextRequest();
		}
	}
	
	this._callError = function(req /* Object */, message /* String */){
		var errObj = new dojo.io.Error(message);
		if(dojo.lang.isFunction(req["error"])){
			req.error("error", errObj, req);
		}
	}

	dojo.io.transports.addTransport("IframeTransport");
}
