dojo.provide("dojo.io.iframe");

dojo.io.iframe = {
	create: function(/*String*/fname, /*String*/onloadstr, /*String?*/uri){
		//summary: Creates a hidden iframe in the page. Used mostly for IO transports.
		//		You do not need to call this to start a dojo.io.iframe request. Just call send().
		//fname: String
		//		The name of the iframe. Used for the name attribute on the iframe.
		//onloadstr: String
		//		A string of JavaScript that will be executed when the content in the iframe loads.
		//uri: String
		//		The value of the src attribute on the iframe element. If a value is not
		//		given, then dojo/resources/blank.html will be used.
		if(window[fname]){ return window[fname]; }
		if(window.frames[fname]){ return window.frames[fname]; }
		var cframe = null;
		var turi = uri;
		if(!turi){
			if(djConfig["useXDomain"] && !djConfig["dojoBlankHtmlUrl"]){
				console.debug("dojo.io.iframe.create: When using cross-domain Dojo builds,"
					+ " please save dojo/resources/blank.html to your domain and set djConfig.dojoBlankHtmlUrl"
					+ " to the path on your domain to blank.html");
			}
			turi = (djConfig["dojoBlankHtmlUrl"]||dojo.moduleUrl("dojo", "resources/blank.html"));
		}
		var ifrstr = dojo.isIE ? '<iframe name="'+fname+'" src="'+turi+'" onload="'+onloadstr+'">' : 'iframe';
		cframe = dojo.doc.createElement(ifrstr);
		with(cframe){
			name = fname;
			setAttribute("name", fname);
			id = fname;
		}
		dojo.body().appendChild(cframe);
		window[fname] = cframe;
	
		with(cframe.style){
			if(!dojo.isSafari){
				//We can't change the src in Safari 2.0.3 if absolute position. Bizarro.
				position = "absolute";
			}
			left = top = "0px";
			height = width = "1px";
			visibility = "hidden";
		}

		if(!dojo.isIE){
			this.setSrc(cframe, turi, true);
			cframe.onload = new Function(onloadstr);
		}

		return cframe;
	},

	setSrc: function(/*DOMNode*/iframe, /*String*/src, /*Boolean*/replace){
		//summary:
		//		Sets the URL that is loaded in an IFrame. The replace parameter indicates whether
		//		location.replace() should be used when changing the location of the iframe.
		try{
			if(!replace){
				if(dojo.isSafari){
					iframe.location = src;
				}else{
					frames[iframe.name].location = src;
				}
			}else{
				// Fun with DOM 0 incompatibilities!
				var idoc;
				if(dojo.isIE){
					idoc = iframe.contentWindow.document;
				}else if(dojo.isSafari){
					idoc = iframe.document;
				}else{ //  if(d.isMozilla){
					idoc = iframe.contentWindow;
				}
	
				//For Safari (at least 2.0.3) and Opera, if the iframe
				//has just been created but it doesn't have content
				//yet, then iframe.document may be null. In that case,
				//use iframe.location and return.
				if(!idoc){
					iframe.location = src;
					return;
				}else{
					idoc.location.replace(src);
				}
			}
		}catch(e){ 
			console.debug("dojo.io.iframe.setSrc: ", e); 
		}
	},

	doc: function(/*DOMNode*/iframeNode){
		//summary: Returns the document object associated with the iframe DOM Node argument.
		var doc = iframeNode.contentDocument || // W3
			(
				(iframeNode.contentWindow)&&(iframeNode.contentWindow.document)
			) ||  // IE
			(
				(iframeNode.name)&&(document.frames[iframeNode.name])&&
				(document.frames[iframeNode.name].document)
			) || null;
		return doc;
	},

	send: function(/*Object*/args){
		//summary: function that sends the request to the server.
		//This transport can only process one send() request at a time, so if send() is called
		//multiple times, it will queue up the calls and only process one at a time.
		//See dojo._ioArgs() in _base/xhr.js for a list of commonly accepted 
		//properties on the args argument. Additional properties accepted by send():
		//method:
		//		The HTTP method to use. "GET" or "POST" are the only supported values.
		//		It will try to read the value from the form node's method, then try this
		//		argument. If neither one exists, then it defaults to POST.
		//handleAs:
		//		Specifies what format the result data should be given to the load/handle callback. Valid values are:
		//		text/plain, text/html, text/javascript, text/json, application/json. IMPORTANT: For all values EXCEPT text/html,
		//		The server response should be an HTML file with a textarea element. The response data should be inside the textarea
		//		element. Using an HTML document the only reliable, cross-browser way this transport can know
		//		when the response has loaded. For the text/html mimetype, just return a normal HTML document.
		//		NOTE: text/xml or any other XML type is NOT supported by this transport.
		//content:
		//		Object: If "form" is one of the other args properties, then the content
		//		object properties become hidden form form elements. For instance, a content
		//		object of {name1 : "value1"} is converted to a hidden form element with a name
		//		of "name1" and a value of "value1". If there is not a "form" property, then
		//		the content object is converted into a name=value&name=value string, by
		//		using dojo.objectToQuery().

		if(!this["_frame"]){
			this._frame = this.create(this._iframeName, "dojo.io.iframe._iframeOnload();");
		}

		//Set up the deferred.
		var dfd = dojo._ioSetArgs(
			args,
			function(/*Deferred*/dfd){
				//summary: canceller function for dojo._ioSetArgs call.
				dfd.canceled = true;
				dfd.ioArgs._callNext();
			},
			function(/*Deferred*/dfd){
				//summary: okHandler function for dojo._ioSetArgs call.
				var value = null;
				try{
					var ioArgs = dfd.ioArgs;
					var dii = dojo.io.iframe;
					var ifd = dii.doc(dii._frame);
					var cmt = ioArgs.handleAs;
					if((cmt == "text/javascript")||(cmt == "text/json")||(cmt == "application/json")){
						//Pull some evalulable text from a textarea.
						var js = ifd.getElementsByTagName("textarea")[0].value;
						if(cmt == "text/json" || cmt == "application/json") { js = "(" + js + ")"; }
						value = dojo.eval(js);
					}else if(cmt == "text/html"){
						value = ifd;
					}else{ // text/plain
						value = ifd.getElementsByTagName("textarea")[0].value;
					}
				}catch(e){
					value = e;
				}finally{
					ioArgs._callNext();				
				}
				return value;
			},
			function(/*Error*/error, /*Deferred*/dfd){
				//summary: errHandler function for dojo._ioSetArgs call.
				dfd.ioArgs._hasError = true;
				dfd.ioArgs._callNext();
				return error;
			}
		);

		//Set up a function that will fire the next iframe request. Make sure it only
		//happens once per deferred.
		dfd.ioArgs._callNext = function(){
			if(!this["_calledNext"]){
				this._calledNext = true;
				dojo.io.iframe._currentDfd = null;
				dojo.io.iframe._fireNextRequest();
			}
		}

		this._dfdQueue.push(dfd);
		this._fireNextRequest();
		
		//Add it the IO watch queue, to get things like timeout support.
		dojo._ioWatch(
			dfd,
			function(/*Deferred*/dfd){
				//validCheck
				return !dfd.ioArgs["_hasError"];
			},
			function(dfd){
				//ioCheck
				return (!!dfd.ioArgs["_finished"]);
			},
			function(dfd){
				//resHandle
				if(dfd.ioArgs._finished){
					dfd.callback(dfd);
				}else{
					dfd.errback(new Error("Invalid dojo.io.iframe request state"));
				}
			}
		);

		return dfd;
	},

	_currentDfd: null,
	_dfdQueue: [],
	_iframeName: "dojoIoIframe",

	_fireNextRequest: function(){
		//summary: Internal method used to fire the next request in the bind queue.
		try{
			if((this._currentDfd)||(this._dfdQueue.length == 0)){ return; }
			var dfd = this._currentDfd = this._dfdQueue.shift();
			var ioArgs = dfd.ioArgs;
			var args = ioArgs.args;

			ioArgs._contentToClean = [];
			var fn = args["form"];
			var content = args["content"] || {};
			if(fn){
				if(content){
					// if we have things in content, we need to add them to the form
					// before submission
					for(var x in content){
						if(!fn[x]){
							var tn;
							if(dojo.isIE){
								tn = dojo.doc.createElement("<input type='hidden' name='"+x+"' value='"+content[x]+"'>");
								fn.appendChild(tn);
							}else{
								tn = dojo.doc.createElement("input");
								fn.appendChild(tn);
								tn.type = "hidden";
								tn.name = x;
								tn.value = content[x];
							}
							ioArgs._contentToClean.push(x);
						}else{
							fn[x].value = content[x];
						}
					}
				}
				if(args["url"]){
					ioArgs._originalAction = fn.getAttribute("action");
					fn.setAttribute("action", args.url);
				}
				if(!fn.getAttribute("method")){
					fn.setAttribute("method", (args["method"]) ? args["method"] : "post");
				}
				ioArgs._originalTarget = fn.getAttribute("target");
				fn.setAttribute("target", this._iframeName);
				fn.target = this._iframeName;
				fn.submit();
			}else{
				// otherwise we post a GET string by changing URL location for the
				// iframe
				var tmpUrl = args.url + (args.url.indexOf("?") > -1 ? "&" : "?") + ioArgs.query;
				this.setSrc(this._frame, tmpUrl, true);
			}
		}catch(e){
			dfd.errback(e);
		}
	},

	_iframeOnload: function(){
		var dfd = this._currentDfd;
		if(!dfd){
			this._fireNextRequest();
			return;
		}

		var ioArgs = dfd.ioArgs;
		var args = ioArgs.args;
		var fNode = args.form;
	
		if(fNode){
			// remove all the hidden content inputs
			var toClean = ioArgs._contentToClean;
			for(var i = 0; i < toClean.length; i++) {
				var key = toClean[i];
				if(dojo.isSafari){
					//In Safari (at least 2.0.3), can't use form[key] syntax to find the node,
					//for nodes that were dynamically added.
					for(var j = 0; j < fNode.childNodes.length; j++){
						var chNode = fNode.childNodes[j];
						if(chNode.name == key){
							var pNode = chNode.parentNode;
							pNode.removeChild(chNode);
							break;
						}
					}
				}else{
					var input = fNode[key];
					fNode.removeChild(input);
					fNode[key] = null;
				}
			}
	
			// restore original action + target
			if(ioArgs["_originalAction"]){
				fNode.setAttribute("action", ioArgs._originalAction);
			}
			if(ioArgs["_originalTarget"]){
				fNode.setAttribute("target", ioArgs._originalTarget);
				fNode.target = ioArgs._originalTarget;
			}
		}

		ioArgs._finished = true;
	}
}
